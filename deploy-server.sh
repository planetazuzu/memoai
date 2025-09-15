#!/bin/bash

# Script de despliegue para servidor propio - MemoAI
# Uso: ./deploy-server.sh [servidor] [usuario] [directorio]

SERVER=${1:-"tu-servidor.com"}
USER=${2:-"usuario"}
DIR=${3:-"/var/www/memoai"}
PORT=${4:-9021}

echo "🚀 Desplegando MemoAI en servidor propio..."
echo "📡 Servidor: $SERVER"
echo "👤 Usuario: $USER"
echo "📁 Directorio: $DIR"
echo "🔌 Puerto: $PORT"

# 1. Construir la aplicación localmente
echo "📦 Construyendo la aplicación..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error al construir la aplicación"
    exit 1
fi

# 2. Crear archivo de configuración para el servidor
echo "⚙️ Creando configuración del servidor..."
cat > server-config.json << EOF
{
  "server": {
    "port": $PORT,
    "host": "0.0.0.0"
  },
  "database": {
    "path": "./database.sqlite"
  },
  "uploads": {
    "path": "./uploads",
    "maxSize": "50MB"
  },
  "openai": {
    "apiKey": "\$OPENAI_API_KEY"
  }
}
EOF

# 3. Crear archivo de inicio del servidor
echo "🔧 Creando script de inicio..."
cat > start-server.js << 'EOF'
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Configuración del servidor
const config = require('./server-config.json');
const PORT = process.env.PORT || config.server.port;

console.log(`🚀 Iniciando MemoAI en puerto ${PORT}...`);

// Iniciar el servidor
const server = spawn('node', ['dist/server/index.js'], {
  env: {
    ...process.env,
    PORT: PORT,
    NODE_ENV: 'production'
  },
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('❌ Error al iniciar el servidor:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`🛑 Servidor terminado con código ${code}`);
  process.exit(code);
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo servidor...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Deteniendo servidor...');
  server.kill('SIGTERM');
});
EOF

chmod +x start-server.js

# 4. Crear systemd service
echo "🔧 Creando servicio systemd..."
cat > memoai.service << EOF
[Unit]
Description=MemoAI - Asistente Personal Inteligente
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$DIR
ExecStart=/usr/bin/node $DIR/start-server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=$PORT

[Install]
WantedBy=multi-user.target
EOF

# 5. Crear script de instalación en el servidor
echo "📝 Creando script de instalación..."
cat > install-on-server.sh << EOF
#!/bin/bash

# Script de instalación en el servidor
echo "🔧 Instalando MemoAI en el servidor..."

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 para gestión de procesos
sudo npm install -g pm2

# Crear directorio de la aplicación
sudo mkdir -p $DIR
sudo chown $USER:$USER $DIR

# Copiar archivos de la aplicación
echo "📁 Copiando archivos..."
# (Los archivos se copiarán manualmente o via rsync)

# Instalar dependencias
cd $DIR
npm install --production

# Configurar PM2
pm2 start start-server.js --name memoai
pm2 startup
pm2 save

# Configurar firewall
sudo ufw allow $PORT

echo "✅ MemoAI instalado correctamente"
echo "🌐 Accede a: http://$SERVER:$PORT"
EOF

chmod +x install-on-server.sh

# 6. Crear archivo de configuración de Nginx
echo "🌐 Creando configuración de Nginx..."
cat > nginx.conf << EOF
server {
    listen 80;
    server_name $SERVER;

    # Redirigir HTTP a HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $SERVER;

    # Configuración SSL (ajustar rutas según tu certificado)
    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;

    # Configuración de seguridad
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Proxy a la aplicación Node.js
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Configuración para archivos estáticos
    location /uploads {
        alias $DIR/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

echo "✅ Archivos de despliegue creados:"
echo "   📄 server-config.json - Configuración del servidor"
echo "   📄 start-server.js - Script de inicio"
echo "   📄 memoai.service - Servicio systemd"
echo "   📄 install-on-server.sh - Script de instalación"
echo "   📄 nginx.conf - Configuración de Nginx"
echo ""
echo "🚀 Para desplegar:"
echo "   1. Copia los archivos al servidor:"
echo "      scp -r dist/ server-config.json start-server.js $USER@$SERVER:$DIR/"
echo "   2. Ejecuta en el servidor:"
echo "      ssh $USER@$SERVER 'cd $DIR && chmod +x install-on-server.sh && ./install-on-server.sh'"
echo "   3. Configura Nginx con el archivo nginx.conf"
echo "   4. Configura SSL con Let's Encrypt:"
echo "      sudo certbot --nginx -d $SERVER"
