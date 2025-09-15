import Dexie, { Table } from 'dexie';
import { Recording, ChatMessage } from '@shared/schema';

export interface RecordingDB extends Recording {
  id: string;
  title: string;
  audioUrl?: string;
  duration: number;
  transcript?: string;
  summary?: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
    dueDate?: string;
  }>;
  diaryEntry?: string;
  photos: Array<{
    id: string;
    url: string;
    caption: string;
    timestamp: number;
    location?: string;
  }>;
  speakers: Array<{
    id: string;
    name: string;
    segments: Array<{
      start: number;
      end: number;
      text: string;
      confidence: number;
    }>;
    characteristics?: {
      gender?: 'male' | 'female' | 'unknown';
      ageRange?: 'young' | 'adult' | 'senior' | 'unknown';
      language?: string;
      accent?: string;
    };
  }>;
  metadata: {
    type: 'meeting' | 'call' | 'note' | 'photo' | 'other';
    participants?: string[];
    tags?: string[];
  };
  processed: boolean;
  createdAt: Date;
}

export interface ChatMessageDB extends ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: {
    recordingIds?: string[];
    searchQuery?: string;
  };
  createdAt: Date;
}

export class MemoAIDatabase extends Dexie {
  recordings!: Table<RecordingDB>;
  chatMessages!: Table<ChatMessageDB>;

  constructor() {
    super('MemoAIDatabase');
    
    this.version(1).stores({
      recordings: 'id, title, createdAt, processed, metadata.type',
      chatMessages: 'id, role, createdAt',
    });

    // Hooks para transformar datos
    this.recordings.hook('creating', (primKey, obj, trans) => {
      // Asegurar que los arrays estén inicializados
      if (!obj.tasks) obj.tasks = [];
      if (!obj.photos) obj.photos = [];
      if (!obj.speakers) obj.speakers = [];
      if (!obj.metadata) obj.metadata = { type: 'other' };
    });
  }
}

export const db = new MemoAIDatabase();

// Funciones de utilidad para trabajar con la base de datos
export const recordingService = {
  async getAll(): Promise<RecordingDB[]> {
    return await db.recordings.orderBy('createdAt').reverse().toArray();
  },

  async getById(id: string): Promise<RecordingDB | undefined> {
    return await db.recordings.get(id);
  },

  async create(recording: Omit<RecordingDB, 'id' | 'createdAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const newRecording: RecordingDB = {
      ...recording,
      id,
      createdAt: new Date(),
    };
    await db.recordings.add(newRecording);
    return id;
  },

  async update(id: string, updates: Partial<RecordingDB>): Promise<void> {
    await db.recordings.update(id, updates);
  },

  async delete(id: string): Promise<void> {
    await db.recordings.delete(id);
  },

  async search(query: string): Promise<RecordingDB[]> {
    const lowerQuery = query.toLowerCase();
    return await db.recordings
      .filter(recording => 
        recording.title.toLowerCase().includes(lowerQuery) ||
        recording.transcript?.toLowerCase().includes(lowerQuery) ||
        recording.summary?.toLowerCase().includes(lowerQuery) ||
        recording.diaryEntry?.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<RecordingDB[]> {
    return await db.recordings
      .where('createdAt')
      .between(startDate, endDate)
      .reverse()
      .toArray();
  },

  async getByType(type: string): Promise<RecordingDB[]> {
    return await db.recordings
      .where('metadata.type')
      .equals(type)
      .reverse()
      .toArray();
  },

  async getUnprocessed(): Promise<RecordingDB[]> {
    return await db.recordings
      .where('processed')
      .equals(false)
      .reverse()
      .toArray();
  }
};

export const chatService = {
  async getAll(): Promise<ChatMessageDB[]> {
    return await db.chatMessages.orderBy('createdAt').toArray();
  },

  async getById(id: string): Promise<ChatMessageDB | undefined> {
    return await db.chatMessages.get(id);
  },

  async create(message: Omit<ChatMessageDB, 'id' | 'createdAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const newMessage: ChatMessageDB = {
      ...message,
      id,
      createdAt: new Date(),
    };
    await db.chatMessages.add(newMessage);
    return id;
  },

  async delete(id: string): Promise<void> {
    await db.chatMessages.delete(id);
  },

  async clear(): Promise<void> {
    await db.chatMessages.clear();
  }
};

// Inicializar la base de datos
export const initDatabase = async () => {
  try {
    await db.open();
    console.log('Dexie database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Dexie database:', error);
  }
};
