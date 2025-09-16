#!/bin/bash

# Script para crear estructura de carpetas de MemoAI
echo "📁 Creando estructura de carpetas de MemoAI..."

# Crear directorio principal de datos
mkdir -p /apps/memoai/data

# Crear subcarpetas
mkdir -p /apps/memoai/data/recordings
mkdir -p /apps/memoai/data/photos
mkdir -p /apps/memoai/data/backups
mkdir -p /apps/memoai/data/exports
mkdir -p /apps/memoai/data/uploads
mkdir -p /apps/memoai/data/logs
mkdir -p /apps/memoai/data/config

# Dar permisos correctos
chmod 755 /apps/memoai/data
chmod 755 /apps/memoai/data/recordings
chmod 755 /apps/memoai/data/photos
chmod 755 /apps/memoai/data/backups
chmod 755 /apps/memoai/data/exports
chmod 755 /apps/memoai/data/uploads
chmod 755 /apps/memoai/data/logs
chmod 755 /apps/memoai/data/config

# Crear archivos de ejemplo
touch /apps/memoai/data/recordings/.gitkeep
touch /apps/memoai/data/photos/.gitkeep
touch /apps/memoai/data/backups/.gitkeep
touch /apps/memoai/data/exports/.gitkeep
touch /apps/memoai/data/uploads/.gitkeep
touch /apps/memoai/data/logs/.gitkeep
touch /apps/memoai/data/config/.gitkeep

echo "✅ Estructura de carpetas creada:"
echo "📁 /apps/memoai/data/"
echo "  ├── recordings/     # Grabaciones de audio"
echo "  ├── photos/         # Fotos capturadas"
echo "  ├── backups/        # Backups de la aplicación"
echo "  ├── exports/        # Exportaciones de datos"
echo "  ├── uploads/        # Archivos subidos"
echo "  ├── logs/           # Logs de la aplicación"
echo "  └── config/         # Archivos de configuración"

echo "🔧 Permisos configurados correctamente"
