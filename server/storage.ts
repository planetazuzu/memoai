import { type Recording, type InsertRecording, type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Recordings
  getRecording(id: string): Promise<Recording | undefined>;
  getAllRecordings(): Promise<Recording[]>;
  getRecordingsByDateRange(startDate: Date, endDate: Date): Promise<Recording[]>;
  createRecording(recording: InsertRecording): Promise<Recording>;
  updateRecording(id: string, updates: Partial<Recording>): Promise<Recording | undefined>;
  deleteRecording(id: string): Promise<boolean>;
  searchRecordings(query: string): Promise<Recording[]>;
  
  // Chat Messages
  getChatMessage(id: string): Promise<ChatMessage | undefined>;
  getAllChatMessages(): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteChatMessage(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private recordings: Map<string, Recording>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
    this.recordings = new Map();
    this.chatMessages = new Map();
  }

  // Recordings
  async getRecording(id: string): Promise<Recording | undefined> {
    return this.recordings.get(id);
  }

  async getAllRecordings(): Promise<Recording[]> {
    return Array.from(this.recordings.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getRecordingsByDateRange(startDate: Date, endDate: Date): Promise<Recording[]> {
    return Array.from(this.recordings.values()).filter(recording => {
      const recordingDate = new Date(recording.createdAt);
      return recordingDate >= startDate && recordingDate <= endDate;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createRecording(insertRecording: InsertRecording): Promise<Recording> {
    const id = randomUUID();
    const recording: Recording = {
      title: insertRecording.title,
      audioUrl: insertRecording.audioUrl || null,
      duration: insertRecording.duration || 0,
      transcript: insertRecording.transcript || null,
      summary: insertRecording.summary || null,
      tasks: (insertRecording.tasks || []) as Recording['tasks'],
      diaryEntry: insertRecording.diaryEntry || null,
      metadata: (insertRecording.metadata || { type: 'other' }) as Recording['metadata'],
      processed: insertRecording.processed || false,
      id,
      createdAt: new Date(),
    };
    this.recordings.set(id, recording);
    return recording;
  }

  async updateRecording(id: string, updates: Partial<Recording>): Promise<Recording | undefined> {
    const existing = this.recordings.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.recordings.set(id, updated);
    return updated;
  }

  async deleteRecording(id: string): Promise<boolean> {
    return this.recordings.delete(id);
  }

  async searchRecordings(query: string): Promise<Recording[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.recordings.values()).filter(recording =>
      recording.title.toLowerCase().includes(lowercaseQuery) ||
      recording.transcript?.toLowerCase().includes(lowercaseQuery) ||
      recording.summary?.toLowerCase().includes(lowercaseQuery) ||
      recording.diaryEntry?.toLowerCase().includes(lowercaseQuery)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Chat Messages
  async getChatMessage(id: string): Promise<ChatMessage | undefined> {
    return this.chatMessages.get(id);
  }

  async getAllChatMessages(): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      role: insertMessage.role as ChatMessage['role'],
      content: insertMessage.content,
      metadata: (insertMessage.metadata || {}) as ChatMessage['metadata'],
      id,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async deleteChatMessage(id: string): Promise<boolean> {
    return this.chatMessages.delete(id);
  }
}

// Use only memory storage for simplicity
const storage: IStorage = new MemStorage();

console.log('Using memory storage (Dexie for frontend)');

// Export a function to get storage
export const getStorage = async (): Promise<IStorage> => {
  return storage;
};

// For backward compatibility, export storage directly
export { storage };
