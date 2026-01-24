#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
  pids="$(lsof -ti tcp:"${port}" 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    echo "Stopping processes on port ${port}: ${pids}"
    kill ${pids} || true
  fi
}

wait_for_port() {
  local port="$1"
  local retries="${2:-30}"
  local delay="${3:-0.5}"
  for _ in $(seq 1 "${retries}"); do
    if lsof -ti tcp:"${port}" >/dev/null 2>&1; then
      return 0
    fi
    sleep "${delay}"
  done
  return 1
}

ensure_test_user() {
  local email="$1"
  local password="$2"
  local host="${3:-localhost:9099}"
  local url="http://${host}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key"

  local response
  response="$(curl -sS -X POST "${url}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${password}\",\"returnSecureToken\":true}")"

  if echo "${response}" | grep -q '"error"'; then
    if echo "${response}" | grep -q '"EMAIL_EXISTS"'; then
      echo "Test user already exists: ${email}"
      return 0
    fi
    echo "Failed to create test user: ${response}"
    return 1
  fi

  echo "Created test user: ${email}"
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
(
  cd "${ROOT_DIR}/backend-sandbox"
  nohup firebase emulators:start > /tmp/firebase-sandbox.log 2>&1 &
)
(
  cd "${ROOT_DIR}/backend-sdet"
  nohup firebase emulators:start > /tmp/firebase-sdet.log 2>&1 &
)

if ! wait_for_port 8080 40 0.5; then
  echo "Firestore emulator (sandbox) failed to start on 8080."
  echo "---- /tmp/firebase-sandbox.log (last 50 lines) ----"
  tail -n 50 /tmp/firebase-sandbox.log || true
  exit 1
fi
if ! wait_for_port 9099 40 0.5; then
  echo "Auth emulator (sandbox) failed to start on 9099."
  echo "---- /tmp/firebase-sandbox.log (last 50 lines) ----"
  tail -n 50 /tmp/firebase-sandbox.log || true
  exit 1
fi
if ! wait_for_port 8180 40 0.5; then
  echo "Firestore emulator (sdet) failed to start on 8180."
  echo "---- /tmp/firebase-sdet.log (last 50 lines) ----"
  tail -n 50 /tmp/firebase-sdet.log || true
  exit 1
fi
if ! wait_for_port 9199 40 0.5; then
  echo "Auth emulator (sdet) failed to start on 9199."
  echo "---- /tmp/firebase-sdet.log (last 50 lines) ----"
  tail -n 50 /tmp/firebase-sdet.log || true
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
(
  cd "${ROOT_DIR}/backend-sandbox"
  nohup sh -c 'ENV_FILE=.env.dev npm run dev' > /tmp/backend-sandbox.log 2>&1 &
)
(
  cd "${ROOT_DIR}/backend-sdet"
  nohup sh -c 'ENV_FILE=.env.dev npm run dev' > /tmp/backend-sdet.log 2>&1 &
)

if ! wait_for_port 3000 40 0.5; then
  echo "backend-sandbox failed to start on 3000."
  exit 1
fi
if ! wait_for_port 3100 40 0.5; then
  echo "backend-sdet failed to start on 3100."
  exit 1
fi

echo "Starting frontend..."
(
  cd "${ROOT_DIR}/frontend-web"
  nohup sh -c 'set -a; source .env.dev; set +a; npm run dev -- -H 127.0.0.1' > /tmp/frontend-web.log 2>&1 &
)

if ! wait_for_port 3030 40 0.5; then
  echo "frontend-web failed to start on 3030."
  exit 1
fi

echo "Dev stack is running."
echo "Logs: /tmp/firebase-sandbox.log /tmp/firebase-sdet.log /tmp/backend-sandbox.log /tmp/backend-sdet.log /tmp/frontend-web.log"
