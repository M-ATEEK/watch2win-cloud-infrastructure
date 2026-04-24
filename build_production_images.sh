#!/bin/bash
set -e

echo "Starting to build the production docker images..."

echo "building watch2win-auth-service:prod..."
docker build --pull=false -f watch2win-auth-service/production.Dockerfile -t watch2win-auth-service:prod watch2win-auth-service/
echo "watch2win-auth-service:prod DONE"

echo "building watch2win-backend:prod..."
docker build --pull=false -f watch2win-backend/production.Dockerfile -t watch2win-backend:prod watch2win-backend/
echo "watch2win-backend:prod DONE"

echo "building watch2win-user-panel:prod..."
docker build \
  --pull=false \
  -f watch2win-user-panel/production.Dockerfile \
  --build-arg PUBLIC_API_URL=https://backend.localhost/api/v1 \
  --build-arg PUBLIC_AUTH_URL=https://auth.localhost \
  --build-arg PUBLIC_PROCESSOR_URL=https://processor.localhost \
  --build-arg PUBLIC_IMG_URL=https://backend.localhost \
  -t watch2win-user-panel:prod \
  watch2win-user-panel/
echo "watch2win-user-panel:prod DONE"

echo "building watch2win-admin-panel:prod..."
docker build \
  --pull=false \
  -f watch2win-admin-panel/production.Dockerfile \
  --build-arg PUBLIC_API_URL=https://backend.localhost/api/v1 \
  --build-arg PUBLIC_AUTH_URL=https://auth.localhost \
  --build-arg PUBLIC_IMG_URL=https://backend.localhost \
  --build-arg NGINX_BASE_IMAGE=watch2win-user-panel:prod \
  -t watch2win-admin-panel:prod \
  watch2win-admin-panel/
echo "watch2win-admin-panel:prod DONE"

echo "building watch2win-processor-service:prod..."
docker build --pull=false -f watch2win-processor-service/production.Dockerfile -t watch2win-processor-service:prod watch2win-processor-service/
echo "watch2win-processor-service:prod DONE"
