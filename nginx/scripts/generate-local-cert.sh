#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_DIR="${CERT_DIR:-${ROOT_DIR}/certs}"
CERT_PATH="${CERT_PATH:-${CERT_DIR}/fullchain.pem}"
KEY_PATH="${KEY_PATH:-${CERT_DIR}/privkey.pem}"
DAYS="${DAYS:-365}"
PRIMARY_HOST="${PRIMARY_HOST:-qacedu.localhost}"
ALT_HOSTS=(
  "DNS:${PRIMARY_HOST}"
  "DNS:api.${PRIMARY_HOST}"
  "DNS:api-internal.${PRIMARY_HOST}"
  "DNS:localhost"
  "IP:127.0.0.1"
)

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required to generate a self-signed certificate."
  exit 1
fi

mkdir -p "${CERT_DIR}"

SAN_LIST=""
for host in "${ALT_HOSTS[@]}"; do
  if [[ -n "${SAN_LIST}" ]]; then
    SAN_LIST+=","
  fi
  SAN_LIST+="${host}"
done

openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout "${KEY_PATH}" \
  -out "${CERT_PATH}" \
  -days "${DAYS}" \
  -subj "/CN=${PRIMARY_HOST}" \
  -addext "subjectAltName=${SAN_LIST}"

echo "Generated ${CERT_PATH} and ${KEY_PATH}"
