#!/bin/bash

# Script para desplegar actualizaciones de MemoAI
echo "🚀 Desplegando actualizaciones de MemoAI..."

# 1. Hacer pull de los últimos cambios
echo "📥 Descargando últimos cambios..."
git pull origin main

# 2. Parar el contenedor actual
echo "⏹️ Parando contenedor actual..."
docker compose down

# 3. Reconstruir la imagen con las actualizaciones
echo "🔨 Reconstruyendo imagen Docker..."
docker compose build --no-cache

# 4. Iniciar el contenedor actualizado
echo "▶️ Iniciando contenedor actualizado..."
docker compose up -d

# 5. Esperar a que el contenedor esté listo
echo "⏳ Esperando a que el contenedor esté listo..."
sleep 10

# 6. Verificar el estado del contenedor
echo "🔍 Verificando estado del contenedor..."
docker ps | grep memoai

# 7. Verificar logs para errores
echo "📋 Verificando logs..."
docker logs memoai-memoai-1 --tail 20

# 8. Verificar que la aplicación esté funcionando
echo "🌐 Verificando aplicación..."
curl -f http://localhost:9021/health || echo "❌ La aplicación no responde"

echo "✅ Despliegue completado!"
echo "🌐 Accede a: http://tu-servidor:9021"
