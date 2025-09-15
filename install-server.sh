#!/bin/bash

# Script de instalación limpia para MemoAI en el servidor
# Uso: bash install-server.sh

set -e

echo "🚀 Instalando MemoAI en el servidor..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    print_error "No se encontró docker-compose.yml. Ejecuta este script desde el directorio raíz del proyecto."
    exit 1
fi

# Detener contenedores existentes si existen
print_status "Deteniendo contenedores existentes..."
docker compose down 2>/dev/null || true

# Eliminar imagen anterior si existe
print_status "Eliminando imagen anterior..."
docker rmi memoai-memoai 2>/dev/null || true

# Limpiar volúmenes huérfanos
print_status "Limpiando volúmenes huérfanos..."
docker volume prune -f 2>/dev/null || true

# Hacer pull del código más reciente
print_status "Actualizando código desde GitHub..."
git pull origin main

# Construir y ejecutar
print_status "Construyendo y ejecutando MemoAI..."
docker compose up --build -d

# Esperar un momento para que el contenedor se inicie
print_status "Esperando que el contenedor se inicie..."
sleep 10

# Verificar estado del contenedor
print_status "Verificando estado del contenedor..."
if docker ps | grep -q memoai-memoai-1; then
    print_status "✅ Contenedor ejecutándose correctamente"
    
    # Mostrar logs
    print_status "Mostrando logs del contenedor:"
    docker logs memoai-memoai-1 --tail 20
    
    # Verificar que el directorio del cliente existe
    print_status "Verificando directorio del cliente..."
    if docker exec memoai-memoai-1 ls -la /app/client/dist/ >/dev/null 2>&1; then
        print_status "✅ Directorio del cliente encontrado"
    else
        print_warning "⚠️ Directorio del cliente no encontrado"
    fi
    
    # Verificar que la base de datos se creó
    print_status "Verificando base de datos..."
    if docker exec memoai-memoai-1 ls -la /app/data/ >/dev/null 2>&1; then
        print_status "✅ Directorio de base de datos encontrado"
    else
        print_warning "⚠️ Directorio de base de datos no encontrado"
    fi
    
    print_status "🎉 MemoAI instalado correctamente!"
    print_status "La aplicación está disponible en: http://localhost:9021"
    
else
    print_error "❌ El contenedor no se está ejecutando"
    print_status "Mostrando logs de error:"
    docker logs memoai-memoai-1 --tail 50
    exit 1
fi
