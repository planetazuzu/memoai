#!/bin/bash

# Script para configurar HTTPS con Nginx
# Uso: bash setup-https.sh

echo "🔒 Configurando HTTPS para MemoAI..."

# Crear directorio de configuración de Nginx
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# Crear configuración de Nginx para MemoAI
sudo tee /etc/nginx/sites-available/memoai << EOF
server {
    listen 80;
    server_name mivida.com.es;
    
    # Redirigir HTTP a HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mivida.com.es;
    
    # Configuración SSL (usar Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/mivida.com.es/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mivida.com.es/privkey.pem;
    
    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Proxy a MemoAI
    location / {
        proxy_pass http://localhost:9021;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Configuración para WebSocket
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Configuración para archivos estáticos
    location /uploads/ {
        proxy_pass http://localhost:9021;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Habilitar el sitio
sudo ln -sf /etc/nginx/sites-available/memoai /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuración de Nginx válida"
    
    # Recargar Nginx
    sudo systemctl reload nginx
    
    echo "✅ Nginx recargado"
    echo ""
    echo "🔐 Próximos pasos para HTTPS:"
    echo "1. Instalar Certbot: sudo apt install certbot python3-certbot-nginx"
    echo "2. Obtener certificado: sudo certbot --nginx -d mivida.com.es"
    echo "3. Verificar renovación: sudo certbot renew --dry-run"
    echo ""
    echo "🌐 MemoAI estará disponible en: https://mivida.com.es"
else
    echo "❌ Error en la configuración de Nginx"
    exit 1
fi
