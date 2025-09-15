#!/bin/bash

# Script para verificar que Docker funciona correctamente
echo "🔍 Verificando configuración de Docker para MemoAI..."

# Verificar que package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json no encontrado en la raíz del proyecto"
    exit 1
fi

echo "✅ package.json encontrado"

# Verificar estructura del proyecto
echo "📁 Estructura del proyecto:"
ls -la | grep -E "(package\.json|client|server|shared|Dockerfile|docker-compose\.yml)"

# Verificar que el build funciona localmente
echo "🔨 Probando build local..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build local exitoso"
else
    echo "❌ Build local falló"
    exit 1
fi

# Verificar que dist/ se creó
if [ -d "dist" ]; then
    echo "✅ Directorio dist/ creado"
    echo "📦 Contenido de dist/:"
    ls -la dist/
else
    echo "❌ Directorio dist/ no encontrado"
    exit 1
fi

echo "🚀 Todo listo para Docker!"
echo "Para construir: docker build -t memoai:latest ."
echo "Para ejecutar: docker run -p 9021:9021 -e OPENAI_API_KEY=tu_clave memoai:latest"
