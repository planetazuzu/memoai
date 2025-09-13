import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const recordings = pgTable("recordings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  audioUrl: text("audio_url"),
  duration: integer("duration").notNull().default(0), // duration in seconds
  transcript: text("transcript"),
  summary: text("summary"),
  tasks: jsonb("tasks").$type<Array<{
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
    dueDate?: string;
  }>>().default([]),
  diaryEntry: text("diary_entry"),
  metadata: jsonb("metadata").$type<{
    type: 'meeting' | 'call' | 'note' | 'other';
    participants?: string[];
    tags?: string[];
  }>().$default(() => ({ type: 'other' as const })),
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: text("role").notNull().$type<'user' | 'assistant'>(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<{
    recordingIds?: string[];
    searchQuery?: string;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRecordingSchema = createInsertSchema(recordings).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertRecording = z.infer<typeof insertRecordingSchema>;
export type Recording = typeof recordings.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
