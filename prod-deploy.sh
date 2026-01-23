#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="dev"

docker build -t "antivariant/backend-sandbox:${IMAGE_TAG}" backend-sandbox
docker build -t "antivariant/backend-sdet:${IMAGE_TAG}" backend-sdet
docker build -t "antivariant/frontend-web:${IMAGE_TAG}" frontend-web

docker push "antivariant/backend-sandbox:${IMAGE_TAG}"
docker push "antivariant/backend-sdet:${IMAGE_TAG}"
docker push "antivariant/frontend-web:${IMAGE_TAG}"

docker compose pull
docker compose up
