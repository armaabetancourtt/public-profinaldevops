#!/bin/bash
# view_logs.sh - Consultar logs y simular errores para CloudWatch


LOG_FILE="/var/lib/docker/volumes/public-profinaldevops_public_logs/_data/app.log"

if ! sudo test -f "$LOG_FILE"; then
    echo " ERROR: No existe el archivo de log en la ruta pública:"
    echo "$LOG_FILE"
    exit 1
fi

if [ "$1" == "error" ]; then
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$TIMESTAMP] ERROR: Fallo crítico en servicio público de Aeroméxico" | sudo tee -a "$LOG_FILE" > /dev/null
    echo " Error simulado e inyectado en el log público."
else
    echo " [AEROMEXICO] Mostrando últimas 10 líneas del log público:"
    sudo tail -n 10 "$LOG_FILE"
fi

echo "------------------------------------------------"
echo "Nota: Usa './view_logs.sh error' para activar la alerta en CloudWatch."