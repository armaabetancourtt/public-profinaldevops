# Proyecto Final DevOps: AeroMéxico – Sistema de Reservas de Vuelos

Sistema full stack de reservas de vuelos desarrollado con prácticas DevOps: Docker, AWS CloudFormation, Bash y GitHub.

---

## Descripción

Aeroméxico es una web application que permite:
- Buscar vuelos por origen, destino y fecha
- Ver precios dinámicos en tiempo real
- Realizar reservas de vuelos
- Consultar historial de reservas

---

## Arquitectura

```
Usuario → Navegador (Puerto 8080)
               ↓
          Frontend (nginx)
               ↓  /api/*
          Backend (Express :3000)
               ↓
          MongoDB (:27017)
```

**Docker Compose levanta 3 contenedores:**
| Contenedor       | Tecnología     | Puerto interno |
|------------------|----------------|---------------|
| vuelos-frontend  | nginx + HTML/Vue CDN | 80 → host:8080 |
| vuelos-backend   | Node.js + Express | 3000 (interno) |
| vuelos-mongodb   | MongoDB 6      | 27017 (interno) |

---

## Tecnologías

- **Frontend:** HTML5, CSS3, JavaScript, Vue.js 3 (CDN), nginx
- **Backend:** Node.js, Express, Winston (logs)
- **Base de datos:** MongoDB 6
- **Contenerización:** Docker, Docker Compose
- **Infraestructura:** AWS CloudFormation (EC2 + S3)
- **Automatización:** Bash scripts

---

## Ejecución Local (Docker)

### Prerrequisitos
- Docker instalado
- Docker Compose disponible

### Pasos

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPO>
cd project

# 2. Dar permisos a los scripts
chmod +x start.sh stop.sh backup.sh

# 3. Levantar la aplicación
./start.sh

# 4. Acceder en el navegador
open http://localhost:8080
```

### O manualmente con Docker Compose:

```bash
# Construir y levantar
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

---

## Despliegue en EC2 (AWS)

### 1. Crear infraestructura con CloudFormation

```bash
aws cloudformation create-stack \
  --stack-name aeromex-stack \
  --template-body file://cloudformation/aeromexico-stack.yaml \
  --parameters \
    ParameterKey=KeyPairName,ParameterValue=mi-key-pair \
    ParameterKey=BucketName,ParameterValue=mi-bucket-aeromex-unico
```

### 2. Conectarse a la instancia EC2

```bash
ssh -i vockey.pem ec2-user@<IP_PUBLICA_EC2>
```

### 3. Instalar dependencias en EC2

```bash
# Git (si no está instalado por UserData)
sudo yum install -y git

# Docker
sudo amazon-linux-extras install docker -y
sudo service docker start
sudo usermod -aG docker ec2-user
# Reconectar SSH para aplicar cambios de grupo

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 4. Desplegar la aplicación

```bash
# Clonar repo
git clone <URL_DEL_REPO>
cd project

# Dar permisos y ejecutar
chmod +x start.sh
./start.sh

# La app estará disponible en:
# http://<IP_PUBLICA_EC2>:8080
```

---

## Estructura del Proyecto

```
project/
├── backend/
│   ├── server.js          # API REST (Express)
│   ├── logger.js          # Configuración de logs (Winston)
│   ├── package.json
│   ├── .env
│   └── Dockerfile
├── frontend/
│   ├── index.html         # SPA con Vue.js CDN
│   ├── nginx.conf         # Proxy al backend
│   └── Dockerfile
├── cloudformation/
│   └── template.yaml      # EC2 + S3
├── docker-compose.yml
├── start.sh               # Levanta todo
├── stop.sh                # Detiene todo
├── backup.sh              # Backup DB + logs
└── README.md
```

---

## Puertos

| Servicio  | Puerto | Descripción              |
|-----------|--------|--------------------------|
| Frontend  | 8080   | Acceso desde el navegador |
| Backend   | 3000   | API REST (interno Docker) |
| MongoDB   | 27017  | Base de datos (interno)   |

---

## Endpoints de la API

| Método | Endpoint     | Descripción                        |
|--------|-------------|-------------------------------------|
| GET    | /flights    | Buscar vuelos (query: origin, destination, date) |
| POST   | /book       | Crear una reserva                   |
| GET    | /bookings   | Listar todas las reservas           |
| GET    | /health     | Estado del servidor                 |

---

## Scripts Bash

```bash
./start.sh [URL_REPO]   # Construye y levanta contenedores
./stop.sh               # Detiene y elimina contenedores
./backup.sh             # Backup local de DB y logs
./backup.sh --s3 <bucket>  # Backup + upload a S3
```

### Automatizar backup con cron

```bash
# Abrir crontab
crontab -e

# Backup todos los días a las 2:00 AM
0 2 * * * /home/ec2-user/project/backup.sh >> /var/log/aeromex-backup.log 2>&1

# Backup cada 6 horas con subida a S3
0 */6 * * * /home/ec2-user/project/backup.sh --s3 mi-bucket >> /var/log/aeromex-backup.log 2>&1
```

---

## Logs

Los logs se generan en `/app/logs/app.log` dentro del contenedor backend.

Formato:
```
[2026-04-09 10:00:00] INFO: Servidor iniciado en puerto 3000
[2026-04-09 10:01:15] INFO: GET /flights - IP: 172.18.0.1
[2026-04-09 10:02:00] INFO: Búsqueda de vuelos: Ciudad de México → Cancún
[2026-04-09 10:02:00] INFO: Se encontraron 9 vuelos
[2026-04-09 10:05:30] INFO: Reserva creada: 663a1f... | Vuelo: FL001 | Pasajero: Juan García
```

Ver logs en tiempo real:
```bash
docker-compose logs -f backend
```

---

## Uso de S3

El bucket S3 creado por CloudFormation se usa para:
- `backups/mongodb/` → backups de la base de datos
- `backups/logs/` → archivos de logs comprimidos

```bash
# Subir backup a S3
./backup.sh --s3 mi-bucket-aeromex-unico

# Listar backups en S3
aws s3 ls s3://mi-bucket-aeromex-unico/backups/
```
