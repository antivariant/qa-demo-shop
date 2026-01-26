#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

if ! wait_for_port 8080 10 0.5 || ! wait_for_port 9099 10 0.5; then
  echo "Sandbox emulators are not running (ports 8080/9099). Start with ./dev-start.sh"
  exit 1
fi
if ! wait_for_port 8180 10 0.5 || ! wait_for_port 9199 10 0.5; then
  echo "SDET emulators are not running (ports 8180/9199). Start with ./dev-start.sh"
  exit 1
fi

echo "Seeding sandbox data..."
(
  cd "${ROOT_DIR}/backend-sandbox"
  ENV_FILE=.env.dev npx ts-node scripts/db/base-seed.ts
)

echo "Ensuring sandbox test user..."
ensure_test_user "user.sandbox@example.com" "123456" "localhost:9099"

echo "Seeding sdet data..."
(
  cd "${ROOT_DIR}/backend-sdet"
  ENV_FILE=.env.dev npx ts-node scripts/db/base-seed.ts
)

echo "Ensuring sdet test user..."
ensure_test_user "user.sdet@example.com" "123456" "localhost:9199"
