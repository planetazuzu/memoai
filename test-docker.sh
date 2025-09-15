#!/bin/bash

# Script para probar el build de Docker
echo "🐳 Probando build de Docker para MemoAI..."

# Construir la imagen
echo "📦 Construyendo imagen Docker..."
docker build -t memoai:latest .

if [ $? -eq 0 ]; then
    echo "✅ Build exitoso!"
    echo "🚀 Para ejecutar el contenedor:"
    echo "   docker run -p 9021:9021 -e OPENAI_API_KEY=tu_clave memoai:latest"
    echo ""
    echo "🔧 O usar docker-compose:"
    echo "   docker-compose up -d"
else
    echo "❌ Build falló!"
    exit 1
fi
