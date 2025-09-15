# MemoAI - Asistente Personal Inteligente

MemoAI es un asistente personal inteligente para grabación y transcripción de conversaciones. Permite grabar audio, transcribirlo automáticamente y analizarlo con IA para extraer tareas, resúmenes y entradas de diario.

## 🚀 Características

- **Grabación de audio** con transcripción en tiempo real
- **Análisis con IA** para extraer tareas y resúmenes
- **Base de datos local** SQLite para almacenamiento persistente
- **PWA completo** instalable en móviles
- **Búsqueda global** en todas las transcripciones
- **Exportación** en múltiples formatos (JSON, CSV, TXT)
- **Sistema de backup** y restauración
- **Notificaciones push** para recordatorios
- **Tema claro/oscuro** con interfaz moderna
- **Animaciones suaves** con Framer Motion
- **Experiencia móvil optimizada** con gestos táctiles

## 🛠️ Tecnologías

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Base de datos**: SQLite con Drizzle ORM
- **IA**: OpenAI API para transcripción y análisis
- **UI**: Tailwind CSS + shadcn/ui
- **PWA**: Service Worker + IndexedDB

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd memoai
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env
OPENAI_API_KEY=tu_clave_api_de_openai
PORT=9021
NODE_ENV=development
```

4. **Inicializar base de datos**
```bash
npm run db:push
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 🔧 Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Ejecutar en modo producción
- `npm run check` - Verificar tipos TypeScript
- `npm run db:push` - Aplicar migraciones de base de datos

## 📱 Uso

1. **Abrir la aplicación** en `http://localhost:9021`
2. **Grabar audio** tocando el botón de micrófono
3. **Ver transcripción** en tiempo real
4. **Analizar con IA** para extraer tareas y resúmenes
5. **Navegar** entre las diferentes secciones:
   - **Inicio**: Dashboard principal
   - **Agenda**: Gestión de tareas
   - **Diario**: Entradas personales
   - **Historial**: Timeline de grabaciones
   - **Asistente**: Chat con IA

## 🚀 Despliegue en Servidor Propio

### Opción 1: Docker (Recomendado)

```bash
# Construir y ejecutar con Docker
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

### Opción 2: Instalación Manual

```bash
# Construir la aplicación
npm run build

# Instalar PM2 globalmente
npm install -g pm2

# Ejecutar con PM2
pm2 start dist/server/index.js --name memoai
pm2 startup
pm2 save

# Ver estado
pm2 status
pm2 logs memoai
```

### Opción 3: Script de Despliegue Automático

```bash
# Hacer ejecutable el script
chmod +x deploy-server.sh

# Ejecutar despliegue
./deploy-server.sh tu-servidor.com usuario /var/www/memoai
```

### Configuración de Nginx

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    location / {
        proxy_pass http://localhost:9021;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔐 Seguridad

- **Almacenamiento local** - Todos los datos se guardan localmente
- **Cifrado opcional** - Para datos sensibles
- **Sin tracking** - No se envían datos a terceros
- **Privacidad** - Solo se envía texto a OpenAI (nunca audio)
- **Variables de entorno** - Claves API seguras
- **Firewall configurado** - Puerto 9021 protegido

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Para soporte o preguntas, abre un issue en el repositorio.
