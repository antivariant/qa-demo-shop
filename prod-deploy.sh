#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="dev"
FRONTEND_ENV_FILE="${FRONTEND_ENV_FILE:-.env.production}"
FRONTEND_ENV_PATH="frontend-web/${FRONTEND_ENV_FILE}"

if [[ ! -f "${FRONTEND_ENV_PATH}" ]]; then
  echo "Missing frontend env file: ${FRONTEND_ENV_PATH}"
  echo "Set FRONTEND_ENV_FILE to an existing file or create ${FRONTEND_ENV_FILE} in frontend-web/"
  exit 1
fi

docker build -t "antivariant/backend-sandbox:${IMAGE_TAG}" backend-sandbox
docker build -t "antivariant/backend-sdet:${IMAGE_TAG}" backend-sdet
docker build --build-arg ENV_FILE="${FRONTEND_ENV_FILE}" -t "antivariant/frontend-web:${IMAGE_TAG}" frontend-web

docker push "antivariant/backend-sandbox:${IMAGE_TAG}"
docker push "antivariant/backend-sdet:${IMAGE_TAG}"
docker push "antivariant/frontend-web:${IMAGE_TAG}"

docker compose pull
docker compose up
