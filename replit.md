# MemoAI - Personal Recording Assistant

## Overview

MemoAI is a progressive web application (PWA) that serves as an intelligent personal recording assistant. The application allows users to record audio conversations, meetings, and notes, then automatically transcribes and analyzes them using AI. It provides features like task extraction, diary entry generation, and intelligent chat functionality based on recorded content. The system is designed as a full-stack application with a React frontend and Express backend, utilizing AI services for content analysis and offline capabilities for mobile usage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built as a React Single Page Application (SPA) using Vite as the build tool. It follows a modern React pattern with:
- **Component Library**: Utilizes shadcn/ui components built on Radix UI primitives for consistent, accessible UI elements
- **Styling**: Tailwind CSS with CSS variables for theming, supporting both light and dark modes
- **State Management**: React Query (@tanstack/react-query) for server state management with custom query client configuration
- **Routing**: wouter for lightweight client-side routing
- **PWA Features**: Service worker implementation for offline functionality, IndexedDB for local data storage, and manifest configuration for app installation

### Backend Architecture
The server is implemented as an Express.js application with:
- **API Structure**: RESTful endpoints for recordings and chat messages management
- **File Handling**: Multer middleware for audio file uploads with local filesystem storage
- **Development Setup**: Vite middleware integration for hot module replacement in development
- **Storage Abstraction**: Interface-based storage system with in-memory implementation (IStorage interface) designed for easy database integration

### Data Storage Solutions
The application uses a hybrid storage approach:
- **Development Storage**: In-memory storage using Maps for rapid prototyping and development
- **Client-side Storage**: IndexedDB for offline data persistence, storing recordings, audio blobs, and chat messages
- **Database Ready**: Drizzle ORM configuration with PostgreSQL schema definitions for production deployment
- **File Storage**: Local filesystem for audio files with structured upload directory organization

### Authentication and Authorization
Currently implements a basic setup without authentication, designed for single-user scenarios. The architecture supports future authentication integration through the storage interface pattern.

### AI Integration Architecture
The system integrates with OpenAI's API for intelligent content processing:
- **Transcript Analysis**: Automated extraction of summaries, tasks, and diary entries from audio transcripts
- **Chat Functionality**: AI-powered chat responses based on recorded content and user queries
- **Model Configuration**: Uses GPT-5 for content analysis with structured JSON response formatting
- **Content Processing**: Automatic categorization of recordings (meeting, call, note, other) with metadata extraction

## External Dependencies

### Core Runtime Dependencies
- **Frontend Framework**: React 18 with TypeScript support
- **Backend Framework**: Express.js with TypeScript execution via tsx
- **Database ORM**: Drizzle ORM with PostgreSQL dialect for production database operations
- **Database Service**: Neon Database serverless PostgreSQL for cloud database hosting

### UI and Styling
- **Component Library**: Radix UI primitives for accessible, unstyled components
- **Styling Framework**: Tailwind CSS with PostCSS for utility-first styling
- **Icons**: Lucide React for consistent iconography
- **Form Handling**: React Hook Form with Zod resolvers for type-safe form validation

### Audio Processing
- **File Upload**: Multer for handling multipart form data and audio file processing
- **Web APIs**: Browser MediaRecorder API for audio capture and Web Speech API for real-time transcription

### AI and External Services
- **AI Service**: OpenAI API for content analysis and chat functionality
- **Data Validation**: Zod for runtime type checking and schema validation

### Development and Build Tools
- **Build Tool**: Vite for fast development and optimized production builds
- **Database Migrations**: Drizzle Kit for database schema management
- **PWA Tools**: Custom service worker with caching strategies for offline functionality
- **Development Utilities**: Replit-specific plugins for enhanced development experience

### Session and Storage
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Client Storage**: IndexedDB API for offline data persistence
- **File System**: Node.js fs promises for server-side file operations