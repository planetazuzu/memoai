#!/bin/bash

# Script para instalación limpia de MemoAI
echo "🧹 Iniciando instalación limpia de MemoAI..."

# 1. Parar y eliminar contenedores existentes
echo "⏹️ Parando contenedores existentes..."
docker compose down -v

# 2. Eliminar imágenes Docker
echo "🗑️ Eliminando imágenes Docker..."
docker rmi memoai-memoai:latest 2>/dev/null || echo "Imagen no encontrada"

# 3. Limpiar sistema Docker
echo "🧹 Limpiando sistema Docker..."
docker system prune -f

# 4. Eliminar directorio de datos existente
echo "🗑️ Eliminando datos existentes..."
rm -rf /apps/memoai/data
rm -rf /apps/memoai/uploads

# 5. Hacer pull de los últimos cambios
echo "📥 Descargando últimos cambios..."
cd /apps/memoai
git pull origin main

# 6. Crear directorios necesarios
echo "📁 Creando directorios..."
mkdir -p /apps/memoai/data
mkdir -p /apps/memoai/uploads
chmod 777 /apps/memoai/data
chmod 777 /apps/memoai/uploads

# 7. Configurar Ollama (opcional)
echo "🤖 Configurando Ollama..."
if command -v ollama &> /dev/null; then
    echo "✅ Ollama detectado, configurando..."
    ./setup-ollama.sh
else
    echo "⚠️ Ollama no detectado. Puedes instalarlo después con: ./setup-ollama.sh"
fi

# 8. Reconstruir imagen Docker
echo "🔨 Reconstruyendo imagen Docker..."
docker compose build --no-cache

# 9. Iniciar contenedor
echo "▶️ Iniciando contenedor..."
docker compose up -d

# 10. Esperar a que el contenedor esté listo
echo "⏳ Esperando a que el contenedor esté listo..."
sleep 30

# 11. Verificar estado
echo "🔍 Verificando estado..."
docker ps | grep memoai

# 12. Verificar logs
echo "📋 Verificando logs..."
docker logs memoai-memoai-1 --tail 20

# 13. Verificar aplicación
echo "🌐 Verificando aplicación..."
curl -f http://localhost:9021/health || echo "❌ La aplicación no responde"

echo "✅ Instalación limpia completada!"
echo "🌐 Accede a: http://tu-servidor:9021"
