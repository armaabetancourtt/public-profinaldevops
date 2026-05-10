#!/bin/bash

echo "[AEROMEXICO] Deteniendo servicios públicos..."

# Detener y eliminar Backend
if [ -n "$(docker ps -aqf "name=publico-vuelos-backend")" ]; then
    docker stop publico-vuelos-backend
    docker rm publico-vuelos-backend
    echo " Backend detenido y eliminado."
fi

# Detener y eliminar Frontend
if [ -n "$(docker ps -aqf "name=publico-vuelos-frontend")" ]; then
    docker stop publico-vuelos-frontend
    docker rm publico-vuelos-frontend
    echo " Frontend detenido y eliminado."
fi

echo "------------------------------------------------"
echo "Todos los servicios públicos han sido finalizados."