import { type Recording, type InsertRecording, type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc, and, gte, lte, like, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import { recordings, chatMessages, users } from "@shared/schema";

const sqlite = new Database("./database.sqlite");
const db = drizzle(sqlite);

export class SQLiteStorage {
  // Recordings
  async getRecording(id: string): Promise<Recording | undefined> {
    const result = await db.select().from(recordings).where(eq(recordings.id, id)).get();
    return result;
  }

  async getAllRecordings(): Promise<Recording[]> {
    const results = await db.select().from(recordings).orderBy(desc(recordings.createdAt)).all();
    return results;
  }

  async getRecordingsByDateRange(startDate: Date, endDate: Date): Promise<Recording[]> {
    const results = await db
      .select()
      .from(recordings)
      .where(
        and(
          gte(recordings.createdAt, startDate),
          lte(recordings.createdAt, endDate)
        )
      )
      .orderBy(desc(recordings.createdAt))
      .all();
    return results;
  }

      async createRecording(insertRecording: InsertRecording): Promise<Recording> {
        const id = randomUUID();
    const recording: Recording = {
      id,
      title: insertRecording.title,
      audioUrl: insertRecording.audioUrl || null,
      duration: insertRecording.duration || 0,
      transcript: insertRecording.transcript || null,
      summary: insertRecording.summary || null,
      tasks: (insertRecording.tasks || []) as Recording['tasks'],
      diaryEntry: insertRecording.diaryEntry || null,
      metadata: (insertRecording.metadata || { type: 'other' }) as Recording['metadata'],
      processed: insertRecording.processed || false,
      createdAt: new Date(),
    };

    await db.insert(recordings).values(recording);
    return recording;
  }

  async updateRecording(id: string, updates: Partial<Recording>): Promise<Recording | undefined> {
    const existing = await this.getRecording(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    await db.update(recordings).set(updated).where(eq(recordings.id, id));
    return updated;
  }

  async deleteRecording(id: string): Promise<boolean> {
    const result = await db.delete(recordings).where(eq(recordings.id, id));
    return result.changes > 0;
  }

  async searchRecordings(query: string): Promise<Recording[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    const results = await db
      .select()
      .from(recordings)
      .where(
        or(
          like(recordings.title, searchTerm),
          like(recordings.transcript, searchTerm),
          like(recordings.summary, searchTerm),
          like(recordings.diaryEntry, searchTerm)
        )
      )
      .orderBy(desc(recordings.createdAt))
      .all();
    return results;
  }

  // Chat Messages
  async getChatMessage(id: string): Promise<ChatMessage | undefined> {
    const result = await db.select().from(chatMessages).where(eq(chatMessages.id, id)).get();
    return result;
  }

  async getAllChatMessages(): Promise<ChatMessage[]> {
    const results = await db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt)).all();
    return results;
  }

      async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
        const id = randomUUID();
    const message: ChatMessage = {
      id,
      role: insertMessage.role as ChatMessage['role'],
      content: insertMessage.content,
      metadata: (insertMessage.metadata || {}) as ChatMessage['metadata'],
      createdAt: new Date(),
    };

    await db.insert(chatMessages).values(message);
    return message;
  }

  async deleteChatMessage(id: string): Promise<boolean> {
    const result = await db.delete(chatMessages).where(eq(chatMessages.id, id));
    return result.changes > 0;
  }

  // Database management
  async initializeDatabase(): Promise<void> {
    // Create tables if they don't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS recordings (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        audio_url TEXT,
        duration INTEGER NOT NULL DEFAULT 0,
        transcript TEXT,
        summary TEXT,
        tasks TEXT DEFAULT '[]',
        diary_entry TEXT,
        metadata TEXT DEFAULT '{"type":"other"}',
        processed INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );
    `);

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL
      );
    `);

    // Create indexes for better performance
    sqlite.exec(`
      CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON recordings(created_at);
      CREATE INDEX IF NOT EXISTS idx_recordings_processed ON recordings(processed);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
    `);
  }

  async close(): Promise<void> {
    sqlite.close();
  }
}

export const sqliteStorage = new SQLiteStorage();
