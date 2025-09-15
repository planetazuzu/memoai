#!/bin/bash

# Script de diagnóstico para el build
echo "🔍 Diagnosticando el proceso de build..."

# Verificar que el directorio client existe
echo "📁 Verificando directorio client..."
ls -la client/

# Verificar que el package.json del cliente existe
echo "📦 Verificando package.json del cliente..."
ls -la client/package.json

# Verificar que vite.config.ts existe
echo "⚙️ Verificando configuración de Vite..."
ls -la client/vite.config.ts

# Verificar que el directorio src existe
echo "📂 Verificando directorio src del cliente..."
ls -la client/src/

# Intentar construir el cliente manualmente
echo "🔨 Intentando construir el cliente..."
cd client
npm install
npm run build
cd ..

# Verificar que se creó el directorio dist
echo "✅ Verificando directorio dist del cliente..."
ls -la client/dist/
