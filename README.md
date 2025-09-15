# MemoAI

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
PORT=3000
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

1. **Abrir la aplicación** en `http://localhost:3000`
2. **Grabar audio** tocando el botón de micrófono
3. **Ver transcripción** en tiempo real
4. **Analizar con IA** para extraer tareas y resúmenes
5. **Navegar** entre las diferentes secciones:
   - **Inicio**: Dashboard principal
   - **Agenda**: Gestión de tareas
   - **Diario**: Entradas personales
   - **Historial**: Timeline de grabaciones
   - **Asistente**: Chat con IA

## 🔐 Seguridad

- **Almacenamiento local** - Todos los datos se guardan localmente
- **Cifrado opcional** - Para datos sensibles
- **Sin tracking** - No se envían datos a terceros
- **Privacidad** - Solo se envía texto a OpenAI (nunca audio)

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
