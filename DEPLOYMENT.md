# 🚀 Guía de Despliegue - MemoAI

## 📋 Requisitos Previos

- Cuenta de GitHub
- Cuenta de Vercel
- Clave API de OpenAI (opcional)

## 🔧 Configuración en Vercel

### 1. **Conectar Repositorio**
1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con tu cuenta de GitHub
3. Haz clic en "New Project"
4. Selecciona el repositorio `planetazuzu/memoai`
5. Haz clic en "Import"

### 2. **Configurar Variables de Entorno**
En la configuración del proyecto en Vercel, agrega estas variables:

```bash
# OpenAI (opcional - la app funciona sin esto)
OPENAI_API_KEY=tu_clave_api_de_openai_aqui

# Base de datos (opcional)
DATABASE_URL=./database.sqlite

# Configuración del servidor
NODE_ENV=production
PORT=3000
```

### 3. **Configuración de Build**
- **Framework Preset**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

## 🌐 Despliegue

### Opción 1: Despliegue Automático
1. Haz push a la rama `main` en GitHub
2. Vercel detectará automáticamente los cambios
3. Desplegará la nueva versión automáticamente

### Opción 2: Despliegue Manual
1. Ve al dashboard de Vercel
2. Selecciona tu proyecto
3. Haz clic en "Deploy"

## 🔍 Verificar Despliegue

Una vez desplegado, tu app estará disponible en:
- **URL de producción**: `https://tu-proyecto.vercel.app`
- **URL de desarrollo**: `https://tu-proyecto-git-main.vercel.app`

## 🛠️ Solución de Problemas

### Error: "Cannot find module 'crypto'"
- **Solución**: Asegúrate de que todas las referencias a `crypto.randomUUID()` estén importadas correctamente

### Error: "Database connection failed"
- **Solución**: La app usará almacenamiento en memoria si no puede conectar a la base de datos

### Error: "OpenAI API key not configured"
- **Solución**: Agrega tu clave API de OpenAI en las variables de entorno de Vercel

## 📱 Funcionalidades Disponibles

### ✅ Sin Configuración Adicional
- Grabación de audio
- Almacenamiento local
- Interfaz de usuario completa
- Búsqueda básica

### 🔧 Con OpenAI API Key
- Transcripción automática
- Análisis con IA
- Asistente de chat inteligente
- Generación de tareas y resúmenes

## 🔄 Actualizaciones

Para actualizar la aplicación:
1. Haz cambios en tu código local
2. Haz commit y push a GitHub
3. Vercel desplegará automáticamente la nueva versión

## 📞 Soporte

Si tienes problemas con el despliegue:
1. Revisa los logs en el dashboard de Vercel
2. Verifica que las variables de entorno estén configuradas
3. Asegúrate de que el build se complete sin errores
