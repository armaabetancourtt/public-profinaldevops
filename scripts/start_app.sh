#!/bin/bash
# start_app.sh - Arrancar contenedores Docker

#!/bin/bash

echo "[AEROMEXICO] Levantando servicios públicos..."

docker stop publico-vuelos-frontend publico-vuelos-backend 2>/dev/null || true
docker rm publico-vuelos-frontend publico-vuelos-backend 2>/dev/null || true

docker network create aeromexico-network 2>/dev/null || true

docker run -d \
  --name publico-vuelos-backend \
  --network aeromexico-network \
  -p 3000:3000 \
  -v public-profinaldevops_public_logs:/app/logs \
  public-profinaldevops-backend

docker run -d \
  --name publico-vuelos-frontend \
  --network aeromexico-network \
  -p 8080:80 \
  public-profinaldevops-frontend

echo "------------------------------------------------"
docker ps
echo "------------------------------------------------"