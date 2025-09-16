# 🚀 Guía de Deployment - MemoMind

Esta guía te ayudará a desplegar MemoMind en diferentes entornos de producción.

## 📋 Prerrequisitos

- Node.js 18+ instalado
- npm o yarn
- Git configurado
- Servidor con acceso SSH (para deployment remoto)
- Dominio configurado (opcional)

## 🔧 Preparación del Proyecto

### 1. Configurar Variables de Entorno

```bash
# Crear archivo .env en la raíz del proyecto
cp config.example.env .env

# Editar .env con tus configuraciones
OPENAI_API_KEY=tu_clave_api_de_openai
PORT=9021
NODE_ENV=production
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Construir la Aplicación

```bash
npm run build
```

## 🐳 Deployment con Docker (Recomendado)

### Opción 1: Docker Compose

```bash
# Construir y ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

### Opción 2: Docker Manual

```bash
# Construir imagen
docker build -t memomind .

# Ejecutar contenedor
docker run -d \
  --name memomind \
  -p 9021:9021 \
  -e OPENAI_API_KEY=tu_clave \
  -v $(pwd)/uploads:/app/uploads \
  memomind
```

## 🖥️ Deployment Manual en Servidor

### 1. Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2
```

### 2. Subir Código al Servidor

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/memomind.git
cd memomind

# Instalar dependencias
npm install

# Configurar variables de entorno
cp config.example.env .env
nano .env  # Editar con tus configuraciones

# Construir aplicación
npm run build
```

### 3. Ejecutar con PM2

```bash
# Iniciar aplicación
pm2 start dist/server/index.js --name memomind

# Configurar para iniciar automáticamente
pm2 startup
pm2 save

# Ver estado
pm2 status
pm2 logs memomind
```

## 🌐 Configuración de Nginx

### 1. Instalar Nginx

```bash
sudo apt install nginx -y
```

### 2. Configurar Virtual Host

```bash
sudo nano /etc/nginx/sites-available/memomind
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # Redirigir HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # Certificados SSL (usar Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
    
    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Proxy a la aplicación
    location / {
        proxy_pass http://localhost:9021;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Archivos estáticos
    location /static/ {
        alias /var/www/memomind/dist/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Activar Configuración

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/memomind /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 🔒 Configuración SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

## 🔄 Scripts de Deployment Automático

### Script de Deploy Local

```bash
#!/bin/bash
# deploy-local.sh

echo "🚀 Iniciando deployment local..."

# Construir aplicación
echo "📦 Construyendo aplicación..."
npm run build

# Reiniciar PM2
echo "🔄 Reiniciando aplicación..."
pm2 restart memomind

echo "✅ Deployment completado!"
```

### Script de Deploy Remoto

```bash
#!/bin/bash
# deploy-remote.sh

SERVER=$1
USER=$2
APP_PATH=$3

if [ -z "$SERVER" ] || [ -z "$USER" ] || [ -z "$APP_PATH" ]; then
    echo "Uso: ./deploy-remote.sh servidor.com usuario /ruta/aplicacion"
    exit 1
fi

echo "🚀 Iniciando deployment remoto a $SERVER..."

# Construir localmente
npm run build

# Subir archivos
echo "📤 Subiendo archivos..."
rsync -avz --delete \
    --exclude node_modules \
    --exclude .git \
    --exclude .env \
    --exclude uploads \
    ./ $USER@$SERVER:$APP_PATH/

# Ejecutar comandos en servidor
echo "🔧 Configurando servidor..."
ssh $USER@$SERVER "cd $APP_PATH && npm install --production && pm2 restart memomind"

echo "✅ Deployment remoto completado!"
```

## 📊 Monitoreo y Mantenimiento

### 1. Verificar Estado de la Aplicación

```bash
# Estado de PM2
pm2 status

# Logs en tiempo real
pm2 logs memomind --lines 100

# Monitoreo de recursos
pm2 monit
```

### 2. Backup de Base de Datos

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/memomind"
DB_FILE="database.sqlite"

# Crear directorio de backup
mkdir -p $BACKUP_DIR

# Hacer backup
cp $DB_FILE $BACKUP_DIR/database_$DATE.sqlite

# Comprimir
gzip $BACKUP_DIR/database_$DATE.sqlite

# Limpiar backups antiguos (mantener últimos 7 días)
find $BACKUP_DIR -name "database_*.sqlite.gz" -mtime +7 -delete

echo "✅ Backup completado: database_$DATE.sqlite.gz"
```

### 3. Actualización de la Aplicación

```bash
#!/bin/bash
# update-app.sh

echo "🔄 Actualizando MemoMind..."

# Hacer backup
./backup-db.sh

# Obtener últimos cambios
git pull origin main

# Instalar nuevas dependencias
npm install

# Construir aplicación
npm run build

# Reiniciar aplicación
pm2 restart memomind

echo "✅ Actualización completada!"
```

## 🚨 Solución de Problemas

### Problemas Comunes

1. **Puerto 9021 en uso**
   ```bash
   sudo lsof -i :9021
   sudo kill -9 PID_DEL_PROCESO
   ```

2. **Error de permisos en uploads**
   ```bash
   sudo chown -R www-data:www-data uploads/
   sudo chmod -R 755 uploads/
   ```

3. **Error de memoria en Node.js**
   ```bash
   # Aumentar límite de memoria
   pm2 start dist/server/index.js --name memomind --node-args="--max-old-space-size=2048"
   ```

4. **Problemas con SSL**
   ```bash
   # Verificar certificados
   sudo certbot certificates
   
   # Renovar certificados
   sudo certbot renew
   ```

### Logs Importantes

- **Aplicación**: `pm2 logs memomind`
- **Nginx**: `sudo tail -f /var/log/nginx/error.log`
- **Sistema**: `sudo journalctl -u nginx -f`

## 📈 Optimizaciones de Rendimiento

### 1. Configuración de Nginx

```nginx
# En el archivo de configuración de Nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Cache de archivos estáticos
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. Configuración de PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'memomind',
    script: 'dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 9021
    },
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=2048'
  }]
}
```

## 🔐 Consideraciones de Seguridad

1. **Firewall**: Configurar UFW para permitir solo puertos necesarios
2. **Actualizaciones**: Mantener el sistema y dependencias actualizadas
3. **Backups**: Programar backups automáticos de la base de datos
4. **Monitoreo**: Configurar alertas para caídas del servicio
5. **Logs**: Rotar logs regularmente para evitar llenar el disco

---

## 📞 Soporte

Si encuentras problemas durante el deployment, revisa los logs y consulta la sección de solución de problemas. Para soporte adicional, abre un issue en el repositorio de GitHub.