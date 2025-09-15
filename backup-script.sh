#!/bin/bash

# Script de backup automático para MemoAI
# Uso: ./backup-script.sh

APP_DIR="/var/www/memoai"
BACKUP_DIR="/var/backups/memoai"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="memoai_backup_$DATE.tar.gz"

echo "🔄 Iniciando backup de MemoAI..."

# Crear directorio de backup si no existe
mkdir -p $BACKUP_DIR

# Crear backup de la base de datos
echo "📊 Respaldando base de datos..."
cp $APP_DIR/database.sqlite $BACKUP_DIR/database_$DATE.sqlite

# Crear backup de uploads
echo "📁 Respaldando archivos de audio..."
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $APP_DIR uploads/

# Crear backup completo de la aplicación
echo "📦 Creando backup completo..."
tar -czf $BACKUP_DIR/$BACKUP_FILE \
    -C $APP_DIR \
    --exclude=node_modules \
    --exclude=uploads \
    --exclude=*.log \
    .

# Limpiar backups antiguos (mantener solo los últimos 7 días)
echo "🧹 Limpiando backups antiguos..."
find $BACKUP_DIR -name "memoai_backup_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "database_*.sqlite" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "✅ Backup completado: $BACKUP_FILE"
echo "📁 Ubicación: $BACKUP_DIR/$BACKUP_FILE"

# Mostrar tamaño del backup
ls -lh $BACKUP_DIR/$BACKUP_FILE
