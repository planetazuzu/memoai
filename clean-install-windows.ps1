# Script para instalación limpia de MemoAI en Windows
Write-Host "🧹 Iniciando instalación limpia de MemoAI..." -ForegroundColor Green

# 1. Limpiar directorios de datos existentes
Write-Host "🗑️ Eliminando datos existentes..." -ForegroundColor Yellow
if (Test-Path "data") {
    Remove-Item -Recurse -Force "data"
    Write-Host "✅ Directorio 'data' eliminado" -ForegroundColor Green
}
if (Test-Path "uploads") {
    Remove-Item -Recurse -Force "uploads"
    Write-Host "✅ Directorio 'uploads' eliminado" -ForegroundColor Green
}
if (Test-Path "database.sqlite") {
    Remove-Item -Force "database.sqlite"
    Write-Host "✅ Base de datos eliminada" -ForegroundColor Green
}

# 2. Limpiar node_modules y reinstalar dependencias
Write-Host "📦 Limpiando e instalando dependencias..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✅ node_modules eliminado" -ForegroundColor Green
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "✅ package-lock.json eliminado" -ForegroundColor Green
}

# 3. Instalar dependencias
Write-Host "📥 Instalando dependencias..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencias instaladas correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al instalar dependencias" -ForegroundColor Red
    exit 1
}

# 4. Crear estructura de directorios
Write-Host "📁 Creando estructura de directorios..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "data" | Out-Null
New-Item -ItemType Directory -Force -Path "uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "uploads/audio" | Out-Null
Write-Host "✅ Estructura de directorios creada" -ForegroundColor Green

# 5. Construir la aplicación
Write-Host "🔨 Construyendo la aplicación..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Aplicación construida correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al construir la aplicación" -ForegroundColor Red
    exit 1
}

# 6. Crear archivo de configuración
Write-Host "⚙️ Creando configuración..." -ForegroundColor Yellow
$config = @{
    server = @{
        port = 9021
        host = "0.0.0.0"
    }
    database = @{
        path = "./database.sqlite"
    }
    uploads = @{
        path = "./uploads"
        maxSize = "50MB"
    }
    openai = @{
        apiKey = $env:OPENAI_API_KEY
    }
} | ConvertTo-Json -Depth 3

$config | Out-File -FilePath "server-config.json" -Encoding UTF8
Write-Host "✅ Configuración creada" -ForegroundColor Green

# 7. Crear script de inicio
Write-Host "🔧 Creando script de inicio..." -ForegroundColor Yellow
$startScript = @"
#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Configuración del servidor
const config = require('./server-config.json');
const PORT = process.env.PORT || config.server.port;

console.log(`🚀 Iniciando MemoAI en puerto ${PORT}...`);

// Iniciar el servidor
const server = spawn('node', ['dist/server/index.js'], {
  env: {
    ...process.env,
    PORT: PORT,
    NODE_ENV: 'production'
  },
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('❌ Error al iniciar el servidor:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`🛑 Servidor terminado con código ${code}`);
  process.exit(code);
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo servidor...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Deteniendo servidor...');
  server.kill('SIGTERM');
});
"@

$startScript | Out-File -FilePath "start-server.js" -Encoding UTF8
Write-Host "✅ Script de inicio creado" -ForegroundColor Green

# 8. Verificar que todo esté listo
Write-Host "🔍 Verificando instalación..." -ForegroundColor Yellow
if (Test-Path "dist/server/index.js") {
    Write-Host "✅ Servidor construido correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Servidor no encontrado" -ForegroundColor Red
}

if (Test-Path "dist/public/index.html") {
    Write-Host "✅ Cliente construido correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Cliente no encontrado" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Instalación limpia completada!" -ForegroundColor Green
Write-Host "🚀 Para iniciar la aplicación ejecuta:" -ForegroundColor Cyan
Write-Host "   node start-server.js" -ForegroundColor White
Write-Host ""
Write-Host "🌐 La aplicación estará disponible en: http://localhost:9021" -ForegroundColor Cyan
