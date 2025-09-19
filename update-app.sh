#!/bin/bash

# MemoMind Update Script
# This script updates the MemoMind application

set -e

echo "🔄 MemoMind Update Script"
echo "========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the MemoMind root directory."
    exit 1
fi

# Create backup
print_status "Creating backup..."
if [ -f "database.sqlite" ]; then
    BACKUP_NAME="database_backup_$(date +%Y%m%d_%H%M%S).sqlite"
    cp database.sqlite "backups/$BACKUP_NAME" 2>/dev/null || mkdir -p backups && cp database.sqlite "backups/$BACKUP_NAME"
    print_success "Database backed up to backups/$BACKUP_NAME"
fi

# Stop the application if running
print_status "Stopping MemoMind..."
if command -v pm2 &> /dev/null; then
    pm2 stop memomind 2>/dev/null || print_warning "MemoMind not running in PM2"
else
    print_warning "PM2 not found, assuming application is not running"
fi

# Pull latest changes
print_status "Pulling latest changes from Git..."
git fetch origin
git pull origin main

# Install/update dependencies
print_status "Installing/updating dependencies..."
npm install

# Run database migrations if needed
print_status "Running database migrations..."
npm run db:push

# Build the application
print_status "Building application..."
npm run build

# Start the application
print_status "Starting MemoMind..."
if command -v pm2 &> /dev/null; then
    pm2 start ecosystem.config.js --env production
    pm2 save
    print_success "MemoMind started with PM2"
else
    print_warning "PM2 not found. Please start the application manually with: npm start"
fi

# Verify the application is running
print_status "Verifying application..."
sleep 5

if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "memomind.*online"; then
        print_success "MemoMind is running successfully!"
    else
        print_error "MemoMind failed to start. Check logs with: pm2 logs memomind"
        exit 1
    fi
else
    print_warning "Cannot verify application status without PM2"
fi

# Show status
print_status "Application Status:"
if command -v pm2 &> /dev/null; then
    pm2 status memomind
fi

print_success "Update completed successfully!"
print_status "MemoMind should be accessible at: http://localhost:9021"
