import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export class FileManager {
  private dataDir: string;

  constructor() {
    this.dataDir = process.env.NODE_ENV === 'production' ? '/app/data' : './data';
  }

  // Crear estructura de carpetas
  async initializeDirectories(): Promise<void> {
    const directories = [
      'recordings',
      'photos', 
      'backups',
      'exports',
      'uploads',
      'logs',
      'config'
    ];

    for (const dir of directories) {
      const dirPath = path.join(this.dataDir, dir);
      try {
        await fs.mkdir(dirPath, { recursive: true });
      } catch (error) {
        console.error(`Error creating directory ${dirPath}:`, error);
      }
    }
  }

  // Guardar archivo de grabación
  async saveRecording(audioBuffer: Buffer, filename?: string): Promise<string> {
    const id = randomUUID();
    const fileName = filename || `${id}.webm`;
    const filePath = path.join(this.dataDir, 'recordings', fileName);
    
    await fs.writeFile(filePath, audioBuffer);
    return `/data/recordings/${fileName}`;
  }

  // Guardar foto
  async savePhoto(imageBuffer: Buffer, filename?: string): Promise<string> {
    const id = randomUUID();
    const fileName = filename || `${id}.jpg`;
    const filePath = path.join(this.dataDir, 'photos', fileName);
    
    await fs.writeFile(filePath, imageBuffer);
    return `/data/photos/${fileName}`;
  }

  // Crear backup
  async createBackup(data: any, filename?: string): Promise<string> {
    const id = randomUUID();
    const fileName = filename || `backup-${new Date().toISOString().split('T')[0]}-${id}.json`;
    const filePath = path.join(this.dataDir, 'backups', fileName);
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return `/data/backups/${fileName}`;
  }

  // Exportar datos
  async exportData(data: any, format: 'json' | 'csv' | 'txt', filename?: string): Promise<string> {
    const id = randomUUID();
    const extension = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'txt';
    const fileName = filename || `export-${new Date().toISOString().split('T')[0]}-${id}.${extension}`;
    const filePath = path.join(this.dataDir, 'exports', fileName);
    
    let content: string;
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        break;
      case 'csv':
        content = this.convertToCSV(data);
        break;
      case 'txt':
        content = this.convertToTXT(data);
        break;
      default:
        content = JSON.stringify(data, null, 2);
    }
    
    await fs.writeFile(filePath, content);
    return `/data/exports/${fileName}`;
  }

  // Escribir log
  async writeLog(message: string, level: 'info' | 'warn' | 'error' = 'info'): Promise<void> {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    const logFile = path.join(this.dataDir, 'logs', `app-${new Date().toISOString().split('T')[0]}.log`);
    
    try {
      await fs.appendFile(logFile, logMessage);
    } catch (error) {
      console.error('Error writing log:', error);
    }
  }

  // Obtener lista de archivos
  async listFiles(directory: string): Promise<string[]> {
    const dirPath = path.join(this.dataDir, directory);
    try {
      const files = await fs.readdir(dirPath);
      return files.filter(file => !file.startsWith('.'));
    } catch (error) {
      console.error(`Error listing files in ${directory}:`, error);
      return [];
    }
  }

  // Eliminar archivo
  async deleteFile(directory: string, filename: string): Promise<boolean> {
    const filePath = path.join(this.dataDir, directory, filename);
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error(`Error deleting file ${filename}:`, error);
      return false;
    }
  }

  // Obtener estadísticas de uso
  async getStorageStats(): Promise<{ totalFiles: number; totalSize: number; byDirectory: Record<string, { files: number; size: number }> }> {
    const directories = ['recordings', 'photos', 'backups', 'exports', 'uploads', 'logs', 'config'];
    let totalFiles = 0;
    let totalSize = 0;
    const byDirectory: Record<string, { files: number; size: number }> = {};

    for (const dir of directories) {
      const dirPath = path.join(this.dataDir, dir);
      try {
        const files = await fs.readdir(dirPath);
        const validFiles = files.filter(file => !file.startsWith('.'));
        let dirSize = 0;

        for (const file of validFiles) {
          const filePath = path.join(dirPath, file);
          const stats = await fs.stat(filePath);
          dirSize += stats.size;
        }

        byDirectory[dir] = { files: validFiles.length, size: dirSize };
        totalFiles += validFiles.length;
        totalSize += dirSize;
      } catch (error) {
        byDirectory[dir] = { files: 0, size: 0 };
      }
    }

    return { totalFiles, totalSize, byDirectory };
  }

  // Convertir a CSV
  private convertToCSV(data: any[]): string {
    if (!Array.isArray(data) || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }

  // Convertir a TXT
  private convertToTXT(data: any): string {
    if (Array.isArray(data)) {
      return data.map((item, index) => `${index + 1}. ${JSON.stringify(item, null, 2)}`).join('\n\n');
    }
    return JSON.stringify(data, null, 2);
  }
}

export const fileManager = new FileManager();
