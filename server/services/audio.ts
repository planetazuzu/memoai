import { createWriteStream, promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

export class AudioService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = join(process.cwd(), 'uploads', 'audio');
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  async saveAudioFile(audioBuffer: Buffer, originalName: string = 'recording.webm'): Promise<string> {
    const fileId = randomUUID();
    const extension = originalName.split('.').pop() || 'webm';
    const filename = `${fileId}.${extension}`;
    const filepath = join(this.uploadDir, filename);

    try {
      await fs.writeFile(filepath, audioBuffer);
      return `/uploads/audio/${filename}`;
    } catch (error) {
      console.error('Failed to save audio file:', error);
      throw new Error('Failed to save audio file');
    }
  }

  async deleteAudioFile(audioUrl: string): Promise<boolean> {
    try {
      const filename = audioUrl.split('/').pop();
      if (!filename) return false;
      
      const filepath = join(this.uploadDir, filename);
      await fs.unlink(filepath);
      return true;
    } catch (error) {
      console.error('Failed to delete audio file:', error);
      return false;
    }
  }

  async getAudioFile(audioUrl: string): Promise<Buffer | null> {
    try {
      const filename = audioUrl.split('/').pop();
      if (!filename) return null;
      
      const filepath = join(this.uploadDir, filename);
      return await fs.readFile(filepath);
    } catch (error) {
      console.error('Failed to read audio file:', error);
      return null;
    }
  }
}

export const audioService = new AudioService();
