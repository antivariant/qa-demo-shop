#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_START_MODE="${DEV_START_MODE:-foreground}"
DEV_START_LOG_DIR="${DEV_START_LOG_DIR:-/tmp/qa-demo-shop}"
FIREBASE_SANDBOX_LOG="${DEV_START_LOG_DIR}/firebase-sandbox.log"
FIREBASE_SDET_LOG="${DEV_START_LOG_DIR}/firebase-sdet.log"
FIREBASE_CONFIG_ROOT="${FIREBASE_CONFIG_ROOT:-${ROOT_DIR}/.firebase-config}"
FIREBASE_EMULATORS_PATH="${FIREBASE_EMULATORS_PATH:-${ROOT_DIR}/.firebase-emulators}"
DEV_START_USE_SUDO="${DEV_START_USE_SUDO:-0}"
FIREBASE_CMD_PREFIX=""

ensure_java() {
  if command -v java >/dev/null 2>&1; then
    if java -version >/dev/null 2>&1; then
      return 0
    fi
  fi

  local java_home
  java_home="$(/usr/libexec/java_home 2>/dev/null || true)"
  if [[ -n "${java_home}" && -x "${java_home}/bin/java" ]]; then
    export JAVA_HOME="${java_home}"
    export PATH="${JAVA_HOME}/bin:${PATH}"
    if java -version >/dev/null 2>&1; then
      return 0
    fi
  fi

  echo "Java is required for Firebase emulators. Install JDK or fix your JAVA_HOME."
  exit 1
}

prepare_firebase_env() {
  mkdir -p "${FIREBASE_CONFIG_ROOT}" "${FIREBASE_EMULATORS_PATH}"
  export XDG_CONFIG_HOME="${FIREBASE_CONFIG_ROOT}"
  export FIREBASE_EMULATORS_PATH="${FIREBASE_EMULATORS_PATH}"
  export FIREBASE_TOOLS_DISABLE_PROMPTS=1
}

stop_port() {
  local port="$1"
  local pids
  if ! command -v lsof >/dev/null 2>&1; then
    return 0
  fi
  pids="$(lsof -ti tcp:"${port}" 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    echo "Stopping processes on port ${port}: ${pids}"
    kill ${pids} || true
  fi
}

port_open() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    if lsof -ti tcp:"${port}" >/dev/null 2>&1; then
      return 0
    fi
  fi
  if command -v nc >/dev/null 2>&1; then
    if nc -z 127.0.0.1 "${port}" >/dev/null 2>&1; then
      return 0
    fi
  fi
  (echo >/dev/tcp/127.0.0.1/"${port}") >/dev/null 2>&1
}

wait_for_http() {
  local url="$1"
  local retries="${2:-30}"
  local delay="${3:-0.5}"
  for _ in $(seq 1 "${retries}"); do
    if command -v curl >/dev/null 2>&1; then
      if [[ "${url}" == https://* ]]; then
        if curl -kfsS "${url}" >/dev/null 2>&1; then
          return 0
        fi
      elif curl -fsS "${url}" >/dev/null 2>&1; then
        return 0
      fi
    elif command -v wget >/dev/null 2>&1; then
      if wget -qO- "${url}" >/dev/null 2>&1; then
        return 0
      fi
    fi
    sleep "${delay}"
  done
  return 1
}

wait_for_port() {
  local port="$1"
  local retries="${2:-30}"
  local delay="${3:-0.5}"
  for _ in $(seq 1 "${retries}"); do
    if port_open "${port}"; then
      return 0
    fi
    sleep "${delay}"
  done
  return 1
}

run_bg() {
  local name="$1"
  shift
  local cmd="$*"
  if [[ "${DEV_START_MODE}" == "ci" ]]; then
    mkdir -p "${DEV_START_LOG_DIR}"
    nohup bash -c "${cmd}" > "${DEV_START_LOG_DIR}/${name}.log" 2>&1 &
  else
    bash -c "${cmd}" &
  fi
}

read_env_value() {
  local file="$1"
  local key="$2"
  if [[ ! -f "${file}" ]]; then
    return 0
  fi
  local line
  if command -v rg >/dev/null 2>&1; then
    line="$(rg -n "^${key}=" "${file}" | tail -n 1 || true)"
  else
    line="$(grep -E "^${key}=" "${file}" | tail -n 1 || true)"
  fi
  if [[ -z "${line}" ]]; then
    return 0
  fi
  echo "${line#*=}"
}

ensure_backend_https_certs() {
  local service_dir="$1"
  local env_file="${2:-.env.dev}"
  local env_path="${service_dir}/${env_file}"
  local ssl_enabled
  ssl_enabled="$(read_env_value "${env_path}" "SSL_ENABLED")"
  if [[ "${ssl_enabled}" != "true" ]]; then
    return 0
  fi
  local cert_path key_path
  cert_path="$(read_env_value "${env_path}" "SSL_CERT_PATH")"
  key_path="$(read_env_value "${env_path}" "SSL_KEY_PATH")"
  if [[ -z "${cert_path}" || -z "${key_path}" ]]; then
    echo "Backend HTTPS enabled but SSL_CERT_PATH or SSL_KEY_PATH is missing in ${env_path}"
    exit 1
  fi
  if [[ "${cert_path}" != /* ]]; then
    cert_path="${service_dir}/${cert_path}"
  fi
  if [[ "${key_path}" != /* ]]; then
    key_path="${service_dir}/${key_path}"
  fi
  if [[ -f "${cert_path}" && -f "${key_path}" ]]; then
    return 0
  fi
  if [[ "${DEV_START_BACKEND_HTTPS_AUTOGEN:-1}" != "1" ]]; then
    echo "Backend HTTPS certs missing and autogen disabled:"
    echo "  cert: ${cert_path}"
    echo "  key:  ${key_path}"
    exit 1
  fi
  if [[ -x "${ROOT_DIR}/nginx/scripts/generate-local-cert.sh" ]]; then
    echo "Generating local HTTPS certs for backend..."
    "${ROOT_DIR}/nginx/scripts/generate-local-cert.sh" || true
  fi
  if [[ ! -f "${cert_path}" || ! -f "${key_path}" ]]; then
    echo "Backend HTTPS certs still missing after autogen:"
    echo "  cert: ${cert_path}"
    echo "  key:  ${key_path}"
    exit 1
  fi
}

ensure_test_user() {
  local email="$1"
  local password="$2"
  local host="${3:-localhost:9099}"
  local url="http://${host}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key"
  local retries=10
  local delay=0.5

  for attempt in $(seq 1 "${retries}"); do
    local response
    response="$(curl -sS -X POST "${url}" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"${email}\",\"password\":\"${password}\",\"returnSecureToken\":true}" || true)"

    if echo "${response}" | grep -q '"error"'; then
      if echo "${response}" | grep -q '"EMAIL_EXISTS"'; then
        echo "Test user already exists: ${email}"
        return 0
      fi
      if [[ "${attempt}" -lt "${retries}" ]]; then
        sleep "${delay}"
        continue
      fi
      echo "Failed to create test user: ${response}"
      return 1
    fi

    if [[ -n "${response}" ]]; then
      echo "Created test user: ${email}"
      return 0
    fi

    sleep "${delay}"
  done

  echo "Failed to create test user: no response"
  return 1
}

echo "Stopping existing dev services (if any)..."
stop_port 3000
stop_port 3100
stop_port 3030
stop_port 8080
stop_port 9099
stop_port 8180
stop_port 9199
stop_port 4000
stop_port 4100

echo "Starting Firebase emulators..."
ensure_java
prepare_firebase_env
if [[ "${DEV_START_USE_SUDO}" == "1" ]]; then
  if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
    FIREBASE_CMD_PREFIX="sudo -n env XDG_CONFIG_HOME=\"${FIREBASE_CONFIG_ROOT}\" FIREBASE_EMULATORS_PATH=\"${FIREBASE_EMULATORS_PATH}\" FIREBASE_TOOLS_DISABLE_PROMPTS=1"
  else
    echo "DEV_START_USE_SUDO=1 requires sudo access. Run: sudo -v"
    exit 1
  fi
fi

if [[ -n "${FIREBASE_CMD_PREFIX}" ]]; then
  run_bg "firebase-sandbox" "cd \"${ROOT_DIR}/backend-sandbox\" && ${FIREBASE_CMD_PREFIX} firebase emulators:start"
else
  run_bg "firebase-sandbox" "cd \"${ROOT_DIR}/backend-sandbox\" && firebase emulators:start"
fi

emulator_retries=40
emulator_delay=0.5
if [[ "${DEV_START_MODE}" == "ci" ]]; then
  emulator_retries=180
  emulator_delay=0.5
fi

if ! wait_for_port 8080 "${emulator_retries}" "${emulator_delay}"; then
  echo "Firestore emulator (sandbox) failed to start on 8080."
  if [[ "${DEV_START_MODE}" == "ci" ]]; then
    echo "---- ${FIREBASE_SANDBOX_LOG} (last 50 lines) ----"
    tail -n 50 "${FIREBASE_SANDBOX_LOG}" || true
  fi
  exit 1
fi
if ! wait_for_port 9099 "${emulator_retries}" "${emulator_delay}"; then
  echo "Auth emulator (sandbox) failed to start on 9099."
  if [[ "${DEV_START_MODE}" == "ci" ]]; then
    echo "---- ${FIREBASE_SANDBOX_LOG} (last 50 lines) ----"
    tail -n 50 "${FIREBASE_SANDBOX_LOG}" || true
  fi
  exit 1
fi
if [[ -n "${FIREBASE_CMD_PREFIX}" ]]; then
  run_bg "firebase-sdet" "cd \"${ROOT_DIR}/backend-sdet\" && ${FIREBASE_CMD_PREFIX} firebase emulators:start"
else
  run_bg "firebase-sdet" "cd \"${ROOT_DIR}/backend-sdet\" && firebase emulators:start"
fi
if ! wait_for_port 8180 "${emulator_retries}" "${emulator_delay}"; then
  echo "Firestore emulator (sdet) failed to start on 8180."
  if [[ "${DEV_START_MODE}" == "ci" ]]; then
    echo "---- ${FIREBASE_SDET_LOG} (last 50 lines) ----"
    tail -n 50 "${FIREBASE_SDET_LOG}" || true
    if [[ -f "${ROOT_DIR}/backend-sdet/firestore-debug.log" ]]; then
      echo "---- backend-sdet/firestore-debug.log (last 50 lines) ----"
      tail -n 50 "${ROOT_DIR}/backend-sdet/firestore-debug.log" || true
    fi
  fi
  exit 1
fi
if ! wait_for_port 9199 "${emulator_retries}" "${emulator_delay}"; then
  echo "Auth emulator (sdet) failed to start on 9199."
  if [[ "${DEV_START_MODE}" == "ci" ]]; then
    echo "---- ${FIREBASE_SDET_LOG} (last 50 lines) ----"
    tail -n 50 "${FIREBASE_SDET_LOG}" || true
  fi
  exit 1
fi

echo "Seeding sandbox data..."
(
  cd "${ROOT_DIR}/backend-sandbox"
  ENV_FILE=.env.dev npx ts-node scripts/db/base-seed.ts
)

echo "Ensuring sandbox test user..."
ensure_test_user "user.sandbox@example.com" "123456" "localhost:9099"

echo "Ensuring sdet test user..."
ensure_test_user "user.sdet@example.com" "123456" "localhost:9199"

echo "Starting backends..."
ensure_backend_https_certs "${ROOT_DIR}/backend-sandbox"
ensure_backend_https_certs "${ROOT_DIR}/backend-sdet"
run_bg "backend-sandbox" "cd \"${ROOT_DIR}/backend-sandbox\" && ENV_FILE=.env.dev npm run dev"
run_bg "backend-sdet" "cd \"${ROOT_DIR}/backend-sdet\" && ENV_FILE=.env.dev npm run dev"

if ! wait_for_port 3000 40 0.5; then
  echo "backend-sandbox failed to start on 3000."
  exit 1
fi
if ! wait_for_port 3100 40 0.5; then
  echo "backend-sdet failed to start on 3100."
  exit 1
fi

echo "Starting frontend..."
FRONTEND_CERT_PATH="${FRONTEND_CERT_PATH:-${ROOT_DIR}/nginx/certs/fullchain.pem}"
FRONTEND_KEY_PATH="${FRONTEND_KEY_PATH:-${ROOT_DIR}/nginx/certs/privkey.pem}"
if [[ "${DEV_START_MODE}" == "ci" ]]; then
  FRONTEND_USE_HTTPS=0
else
  FRONTEND_USE_HTTPS="${DEV_START_FRONTEND_HTTPS:-1}"
fi
if [[ "${DEV_START_MODE}" == "ci" ]]; then
  run_bg "frontend-web" "cd \"${ROOT_DIR}/frontend-web\" && set -a && source .env.dev && set +a && ./node_modules/.bin/next dev -p 3030"
else
  if [[ "${FRONTEND_USE_HTTPS}" == "1" && (! -f "${FRONTEND_CERT_PATH}" || ! -f "${FRONTEND_KEY_PATH}") ]]; then
    if [[ "${DEV_START_FRONTEND_HTTPS_AUTOGEN:-1}" == "1" && -x "${ROOT_DIR}/nginx/scripts/generate-local-cert.sh" ]]; then
      echo "Generating local HTTPS certs for frontend..."
      "${ROOT_DIR}/nginx/scripts/generate-local-cert.sh" || true
    fi
  fi
  if [[ "${FRONTEND_USE_HTTPS}" == "1" && -f "${FRONTEND_CERT_PATH}" && -f "${FRONTEND_KEY_PATH}" ]]; then
    run_bg "frontend-web" "cd \"${ROOT_DIR}/frontend-web\" && set -a && source .env.dev && set +a && ./node_modules/.bin/next dev -p 3030 -H 127.0.0.1 --experimental-https --experimental-https-cert \"${FRONTEND_CERT_PATH}\" --experimental-https-key \"${FRONTEND_KEY_PATH}\""
  else
    if [[ "${FRONTEND_USE_HTTPS}" == "1" ]]; then
      echo "Frontend HTTPS requested but cert files not found:"
      echo "  cert: ${FRONTEND_CERT_PATH}"
      echo "  key:  ${FRONTEND_KEY_PATH}"
      echo "Run: ./nginx/scripts/generate-local-cert.sh"
      exit 1
    fi
    run_bg "frontend-web" "cd \"${ROOT_DIR}/frontend-web\" && set -a && source .env.dev && set +a && ./node_modules/.bin/next dev -p 3030 -H 127.0.0.1"
  fi
fi

if [[ "${DEV_START_MODE}" == "ci" || "${FRONTEND_USE_HTTPS}" != "1" ]]; then
  FRONTEND_HEALTH_URL="http://localhost:3030"
else
  FRONTEND_HEALTH_URL="https://localhost:3030"
fi

if ! wait_for_http "${FRONTEND_HEALTH_URL}" 60 0.5; then
  echo "frontend-web failed to start on 3030."
  if [[ "${DEV_START_MODE}" == "ci" ]]; then
    echo "---- ${DEV_START_LOG_DIR}/frontend-web.log (last 100 lines) ----"
    tail -n 100 "${DEV_START_LOG_DIR}/frontend-web.log" || true
  fi
  exit 1
fi

echo "Dev stack is running. Press Ctrl+C to stop."
if [[ "${DEV_START_MODE}" == "ci" ]]; then
  echo "CI mode active. Logs: ${DEV_START_LOG_DIR}"
  exit 0
fi

wait
