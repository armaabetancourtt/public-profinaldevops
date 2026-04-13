#!/bin/bash
# =============================================================================
# stop.sh – Detiene la aplicación Aeroméxico
# =============================================================================

YELLOW='\033[1;33m'
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${YELLOW}Deteniendo contenedores de Aeroméxico...${NC}"

docker compose down

echo -e "${GREEN} Todos los contenedores han sido detenidos.${NC}"
echo -e "\nPara eliminar volúmenes también: ${RED}docker compose down -v${NC}"
