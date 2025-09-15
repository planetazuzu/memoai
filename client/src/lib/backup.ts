// Backup and restore functionality
import { notificationService } from './notifications';

export interface BackupData {
  version: string;
  timestamp: string;
  recordings: any[];
  settings: any;
  metadata: {
    totalRecordings: number;
    totalDuration: number;
    lastBackup: string;
  };
}

export class BackupService {
  private static instance: BackupService;
  private lastBackup: Date | null = null;
  private autoBackupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.loadLastBackupTime();
  }

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  private loadLastBackupTime() {
    const lastBackup = localStorage.getItem('memoai-last-backup');
    if (lastBackup) {
      this.lastBackup = new Date(lastBackup);
    }
  }

  private saveLastBackupTime() {
    this.lastBackup = new Date();
    localStorage.setItem('memoai-last-backup', this.lastBackup.toISOString());
  }

  async createBackup(recordings: any[], settings: any): Promise<BackupData> {
    const totalDuration = recordings.reduce((acc, r) => acc + (r.duration || 0), 0);
    
    const backupData: BackupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      recordings,
      settings,
      metadata: {
        totalRecordings: recordings.length,
        totalDuration,
        lastBackup: this.lastBackup?.toISOString() || 'Nunca'
      }
    };

    return backupData;
  }

  async exportBackup(backupData: BackupData): Promise<void> {
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `memoai-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    this.saveLastBackupTime();

    // Show notification
    try {
      await notificationService.showBackupComplete();
    } catch (error) {
      console.warn('Could not show backup notification:', error);
    }
  }

  async importBackup(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target?.result as string) as BackupData;
          
          // Validate backup data
          if (!backupData.version || !backupData.recordings || !backupData.timestamp) {
            throw new Error('Invalid backup file format');
          }
          
          resolve(backupData);
        } catch (error) {
          reject(new Error('Failed to parse backup file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read backup file'));
      };
      
      reader.readAsText(file);
    });
  }

  async restoreBackup(backupData: BackupData): Promise<void> {
    // Restore settings
    if (backupData.settings) {
      localStorage.setItem('memoai-settings', JSON.stringify(backupData.settings));
    }

    // Restore recordings to IndexedDB
    const db = await this.openIndexedDB();
    const transaction = db.transaction(['recordings'], 'readwrite');
    const store = transaction.objectStore('recordings');
    
    // Clear existing recordings
    await store.clear();
    
    // Add restored recordings
    for (const recording of backupData.recordings) {
      await store.add(recording);
    }

    this.saveLastBackupTime();
  }

  private async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MemoAI', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('recordings')) {
          db.createObjectStore('recordings', { keyPath: 'id' });
        }
      };
    });
  }

  async startAutoBackup(recordings: any[], settings: any, intervalHours: number = 24) {
    this.stopAutoBackup();
    
    this.autoBackupInterval = setInterval(async () => {
      try {
        const backupData = await this.createBackup(recordings, settings);
        await this.exportBackup(backupData);
        console.log('Auto backup completed');
      } catch (error) {
        console.error('Auto backup failed:', error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }

  stopAutoBackup() {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
      this.autoBackupInterval = null;
    }
  }

  getLastBackupTime(): Date | null {
    return this.lastBackup;
  }

  getBackupInfo(): { lastBackup: Date | null; isAutoBackupEnabled: boolean } {
    return {
      lastBackup: this.lastBackup,
      isAutoBackupEnabled: this.autoBackupInterval !== null
    };
  }
}

export const backupService = BackupService.getInstance();
