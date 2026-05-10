#!/bin/bash
# deploy.sh - Configuración inicial del entorno Aeroméxico

set -e

echo "[AEROMEXICO] Iniciando despliegue de infraestructura..."

# 1. Actualizar sistema e instalar dependencias
sudo yum update -y

# 2. Instalar Docker
if ! command -v docker &> /dev/null; then
    echo "[AEROMEXICO] Instalando Docker..."
    sudo yum install -y docker
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker ec2-user
    echo "Docker instalado correctamente."
else
    echo "Docker ya está instalado."
fi

# 3. Instalar CloudWatch Agent (Vital para el monitoreo que armamos)
if ! command -v amazon-cloudwatch-agent-ctl &> /dev/null; then
    echo "[AEROMEXICO] Instalando Amazon CloudWatch Agent..."
    sudo yum install -y amazon-cloudwatch-agent
else
    echo "CloudWatch Agent ya está instalado."
fi

# 4. Configurar Red y Volúmenes
echo "[AEROMEXICO] Configurando red y volúmenes..."

# Crear red si no existe
docker network inspect aeromexico-network >/dev/null 2>&1 || \
docker network create aeromexico-network

# Crear volumen para logs públicos (el que configuramos en el agente)
docker volume create public-profinaldevops_public_logs >/dev/null 2>&1 || true

# 5. Ajuste de permisos para Logs (Para evitar el Permission Denied)
echo "[AEROMEXICO] Ajustando permisos de rutas de Docker para el agente..."
sudo chmod +x /var/lib/docker /var/lib/docker/volumes 2>/dev/null || true

echo "------------------------------------------------"
echo "[AEROMEXICO] Infraestructura preparada correctamente."
echo "IMPORTANTE: Si es la primera vez que instalas Docker, cierra sesión y vuelve a entrar."
echo "Luego ejecuta ./start_app.sh"