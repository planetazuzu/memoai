// Notification service for PWA
export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.checkPermission();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  async showNotification(title: string, options: NotificationOptions = {}) {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn('Notification permission denied');
        return;
      }
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  async showRecordingComplete(duration: number) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    await this.showNotification('Grabación completada', {
      body: `Duración: ${timeStr}. Se ha guardado automáticamente.`,
      tag: 'recording-complete',
      requireInteraction: false,
    });
  }

  async showTaskReminder(taskTitle: string, dueDate?: string) {
    const body = dueDate 
      ? `Tarea: ${taskTitle}\nVence: ${new Date(dueDate).toLocaleDateString('es-ES')}`
      : `Tarea: ${taskTitle}`;

    await this.showNotification('Recordatorio de tarea', {
      body,
      tag: 'task-reminder',
      requireInteraction: true,
    });
  }

  async showAnalysisComplete(recordingTitle: string) {
    await this.showNotification('Análisis completado', {
      body: `La grabación "${recordingTitle}" ha sido analizada con IA.`,
      tag: 'analysis-complete',
      requireInteraction: false,
    });
  }

  async showBackupComplete() {
    await this.showNotification('Backup completado', {
      body: 'Se ha creado una copia de seguridad de tus datos.',
      tag: 'backup-complete',
      requireInteraction: false,
    });
  }
}

export const notificationService = NotificationService.getInstance();
