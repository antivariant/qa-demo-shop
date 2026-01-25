#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_START_MODE="${DEV_START_MODE:-foreground}"
DEV_START_LOG_DIR="${DEV_START_LOG_DIR:-/tmp/qa-demo-shop}"
FIREBASE_SANDBOX_LOG="${DEV_START_LOG_DIR}/firebase-sandbox.log"
FIREBASE_SDET_LOG="${DEV_START_LOG_DIR}/firebase-sdet.log"

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
    lsof -ti tcp:"${port}" >/dev/null 2>&1
    return $?
  fi
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "${port}" >/dev/null 2>&1
    return $?
  fi
  (echo >/dev/tcp/127.0.0.1/"${port}") >/dev/null 2>&1
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
run_bg "firebase-sandbox" "cd \"${ROOT_DIR}/backend-sandbox\" && firebase emulators:start"
run_bg "firebase-sdet" "cd \"${ROOT_DIR}/backend-sdet\" && firebase emulators:start"

if ! wait_for_port 8080 40 0.5; then
  echo "Firestore emulator (sandbox) failed to start on 8080."
  if [[ "${DEV_START_MODE}" == "ci" ]]; then
    echo "---- ${FIREBASE_SANDBOX_LOG} (last 50 lines) ----"
    tail -n 50 "${FIREBASE_SANDBOX_LOG}" || true
  fi
  exit 1
fi
if ! wait_for_port 9099 40 0.5; then
  echo "Auth emulator (sandbox) failed to start on 9099."
  if [[ "${DEV_START_MODE}" == "ci" ]]; then
    echo "---- ${FIREBASE_SANDBOX_LOG} (last 50 lines) ----"
    tail -n 50 "${FIREBASE_SANDBOX_LOG}" || true
  fi
  exit 1
fi
if ! wait_for_port 8180 40 0.5; then
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
if ! wait_for_port 9199 40 0.5; then
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
run_bg "frontend-web" "cd \"${ROOT_DIR}/frontend-web\" && set -a && source .env.dev && set +a && npm run dev -- -H 127.0.0.1"

if ! wait_for_port 3030 40 0.5; then
  echo "frontend-web failed to start on 3030."
  exit 1
fi

echo "Dev stack is running. Press Ctrl+C to stop."
if [[ "${DEV_START_MODE}" == "ci" ]]; then
  echo "CI mode active. Logs: ${DEV_START_LOG_DIR}"
  exit 0
fi

wait
