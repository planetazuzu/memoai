import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { randomUUID } from "crypto";

export const recordings = sqliteTable("recordings", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  title: text("title").notNull(),
  audioUrl: text("audio_url"),
  duration: integer("duration").notNull().default(0), // duration in seconds
  transcript: text("transcript"),
  summary: text("summary"),
  tasks: text("tasks", { mode: 'json' }).$type<Array<{
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
    dueDate?: string;
  }>>().default([]),
  diaryEntry: text("diary_entry"),
  metadata: text("metadata", { mode: 'json' }).$type<{
    type: 'meeting' | 'call' | 'note' | 'other';
    participants?: string[];
    tags?: string[];
  }>().$default(() => ({ type: 'other' as const })),
  processed: integer("processed", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  lastLogin: integer("last_login", { mode: 'timestamp' }),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role").notNull().$type<'user' | 'assistant'>(),
  content: text("content").notNull(),
  metadata: text("metadata", { mode: 'json' }).$type<{
    recordingIds?: string[];
    searchQuery?: string;
  }>().default({}),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const insertRecordingSchema = createInsertSchema(recordings).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export type InsertRecording = z.infer<typeof insertRecordingSchema>;
export type Recording = typeof recordings.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
