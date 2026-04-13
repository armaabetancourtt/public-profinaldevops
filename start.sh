#!/bin/bash
# =============================================================================
# start.sh – Levanta la aplicación AeroMex
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}   Aeroméxico – Sistema de Reservas de Vuelos ${NC}"
echo -e "${CYAN}============================================${NC}"

# 1. Verificar dependencias
echo -e "\n${YELLOW}[1/4] Verificando dependencias...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Docker no está instalado. Instálalo desde https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "Docker Compose no está disponible."
    exit 1
fi

echo "Docker y Docker Compose disponibles"

# 2. Clonar repositorio
if [ -n "$1" ]; then
    echo -e "\n${YELLOW}[2/4] Clonando repositorio...${NC}"
    git clone "$1" proyecto-vuelos
    cd proyecto-vuelos
    echo "Repositorio clonado"
else
    echo -e "\n${YELLOW}[2/4] Usando directorio actual...${NC}"
    echo "Directorio listo"
fi

# 3. Construir imágenes
echo -e "\n${YELLOW}[3/4] Construyendo imágenes Docker...${NC}"
docker compose build --no-cache
echo "Imágenes construidas"

# 4. Levantar contenedores
echo -e "\n${YELLOW}[4/4] Levantando contenedores...${NC}"
docker compose up -d
echo "Contenedores iniciados"

# Mostrar estado
echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}     Aplicación desplegada exitosamente! ${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "\n Accede en: ${CYAN}http://localhost:8080${NC}"
echo -e "API:       ${CYAN}http://localhost:8080/api/flights${NC}"
echo -e "\n${YELLOW}Para ver logs:${NC} docker compose logs -f"
echo -e "${YELLOW}Para detener:${NC} ./stop.sh\n"
