#!/bin/bash
set -e

echo "Starting to build the docker images..."

echo "building watch2win-backend:dev..."
docker build -f watch2win-backend/Dockerfile -t watch2win-backend:dev watch2win-backend/
echo "watch2win-backend:dev DONE"

echo "building watch2win-auth-service:dev..."
docker build -f watch2win-auth-service/Dockerfile -t watch2win-auth-service:dev watch2win-auth-service/
echo "watch2win-auth-service:dev DONE"

echo "building watch2win-processor-service:dev..."
docker build -f watch2win-processor-service/Dockerfile -t watch2win-processor-service:dev watch2win-processor-service/
echo "watch2win-processor-service:dev DONE"

echo "building watch2win-user-panel:dev..."
docker build -f watch2win-user-panel/Dockerfile -t watch2win-user-panel:dev watch2win-user-panel/
echo "watch2win-user-panel:dev DONE"

echo "building watch2win-admin-panel:dev..."
docker build -f watch2win-admin-panel/Dockerfile -t watch2win-admin-panel:dev watch2win-admin-panel/
echo "watch2win-admin-panel:dev DONE"
