#!/bin/bash

# Script para configurar Ollama con MemoAI
echo "🤖 Configurando Ollama para MemoAI..."

# 1. Verificar si Ollama está instalado
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama no está instalado. Instalando..."
    
    # Instalar Ollama
    curl -fsSL https://ollama.ai/install.sh | sh
    
    # Iniciar servicio Ollama
    sudo systemctl start ollama
    sudo systemctl enable ollama
else
    echo "✅ Ollama ya está instalado"
fi

# 2. Verificar que Ollama esté ejecutándose
echo "🔍 Verificando estado de Ollama..."
if ! pgrep -f ollama > /dev/null; then
    echo "▶️ Iniciando Ollama..."
    sudo systemctl start ollama
    sleep 5
fi

# 3. Descargar modelo recomendado
echo "📥 Descargando modelo llama3.2:latest..."
ollama pull llama3.2:latest

# 4. Verificar que el modelo esté disponible
echo "🔍 Verificando modelos disponibles..."
ollama list

# 5. Probar conexión
echo "🧪 Probando conexión con Ollama..."
curl -f http://localhost:11434/api/tags || echo "❌ No se pudo conectar a Ollama"

# 6. Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "📝 Creando archivo .env..."
    if [ -f config.example.env ]; then
        cp config.example.env .env
        echo "✅ Archivo .env creado desde config.example.env"
    else
        cat > .env << EOF
# MemoAI Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
NODE_ENV=production
PORT=9021
EOF
        echo "✅ Archivo .env creado"
    fi
else
    echo "✅ Archivo .env ya existe"
fi

echo "🎉 Configuración de Ollama completada!"
echo "🌐 Ollama está disponible en: http://localhost:11434"
echo "🤖 Modelo configurado: llama3.2:latest"
echo ""
echo "Para usar Ollama con MemoAI:"
echo "1. Asegúrate de que Ollama esté ejecutándose: sudo systemctl start ollama"
echo "2. Inicia MemoAI: docker compose up -d"
echo "3. La aplicación usará Ollama automáticamente si está disponible"
