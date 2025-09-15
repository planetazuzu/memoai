import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { insertRecordingSchema, insertChatMessageSchema } from "@shared/schema";
import { aiService } from "./services/ai-service";
import { audioService } from "./services/audio";
import multer from 'multer';
import express from 'express';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow audio files and webm (for recordings)
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm') {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded audio files
  app.use('/uploads', express.static('uploads'));

  // Get all recordings
  app.get("/api/recordings", async (req, res) => {
    try {
      const storage = await getStorage();
      const recordings = await storage.getAllRecordings();
      res.json(recordings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recordings" });
    }
  });

  // Get recording by ID
  app.get("/api/recordings/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const recording = await storage.getRecording(req.params.id);
      if (!recording) {
        return res.status(404).json({ error: "Recording not found" });
      }
      res.json(recording);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recording" });
    }
  });

  // Create new recording (transcript only, no audio files)
  app.post("/api/recordings", async (req, res) => {
    try {
      // Generate automatic title with timestamp if not provided
      const now = new Date();
      const timeString = now.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
      const dateString = now.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Transform fields for validation
      const body = {
        title: req.body.title || `Grabación ${dateString} ${timeString}`,
        duration: req.body.duration ? Number(req.body.duration) : 0,
        transcript: req.body.transcript || null,
        summary: req.body.summary || null,
        tasks: req.body.tasks ? JSON.parse(req.body.tasks) : [],
        diaryEntry: req.body.diaryEntry || null,
        metadata: req.body.metadata ? JSON.parse(req.body.metadata) : { type: 'other' },
        processed: req.body.processed === 'true',
        audioUrl: null, // No audio files stored
      };
      
      const data = insertRecordingSchema.parse(body);

      const storage = await getStorage();
      const recording = await storage.createRecording({
        ...data,
        audioUrl: null, // No audio files stored
      });

      res.status(201).json(recording);
    } catch (error) {
      console.error('Recording creation error:', error);
      res.status(400).json({ error: "Invalid recording data" });
    }
  });

  // Update recording
  app.patch("/api/recordings/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const updates = req.body;
      const recording = await storage.updateRecording(req.params.id, updates);
      
      if (!recording) {
        return res.status(404).json({ error: "Recording not found" });
      }
      
      res.json(recording);
    } catch (error) {
      res.status(500).json({ error: "Failed to update recording" });
    }
  });

  // Delete recording
  app.delete("/api/recordings/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const recording = await storage.getRecording(req.params.id);
      if (!recording) {
        return res.status(404).json({ error: "Recording not found" });
      }

      // Delete audio file if exists
      if (recording.audioUrl) {
        await audioService.deleteAudioFile(recording.audioUrl);
      }

      const deleted = await storage.deleteRecording(req.params.id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Recording not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recording" });
    }
  });

  // Search recordings
  app.get("/api/recordings/search/:query", async (req, res) => {
    try {
      const storage = await getStorage();
      const recordings = await storage.searchRecordings(req.params.query);
      res.json(recordings);
    } catch (error) {
      res.status(500).json({ error: "Failed to search recordings" });
    }
  });

  // Analyze recording with AI
  app.post("/api/recordings/:id/analyze", async (req, res) => {
    try {
      const storage = await getStorage();
      const recording = await storage.getRecording(req.params.id);
      if (!recording) {
        return res.status(404).json({ error: "Recording not found" });
      }

      if (!recording.transcript) {
        return res.status(400).json({ error: "Recording must have transcript to analyze" });
      }

      const analysis = await aiService.analyzeTranscript(recording.transcript, recording.title);
      
      const updatedRecording = await storage.updateRecording(req.params.id, {
        summary: analysis.summary,
        tasks: analysis.tasks,
        diaryEntry: analysis.diaryEntry,
        processed: true,
      });

      res.json(updatedRecording);
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: "Failed to analyze recording" });
    }
  });

  // Chat endpoints
  app.get("/api/chat/messages", async (req, res) => {
    try {
      const storage = await getStorage();
      const messages = await storage.getAllChatMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/messages", async (req, res) => {
    try {
      const storage = await getStorage();
      const data = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(data);
      
      // If this is a user message, generate AI response
      if (data.role === 'user') {
        try {
          const recordings = await storage.getAllRecordings();
          const recordingsForAI = recordings.map(r => ({
            title: r.title,
            transcript: r.transcript || undefined,
            summary: r.summary || undefined,
            createdAt: r.createdAt
          }));
          const aiResponse = await aiService.generateChatResponse(data.content, recordingsForAI);
          
          const assistantMessage = await storage.createChatMessage({
            role: 'assistant',
            content: aiResponse,
            metadata: {},
          });

          res.json([message, assistantMessage]);
        } catch (aiError) {
          console.error('AI response error:', aiError);
          // Still save the user message and return it, but with an error response
          const errorMessage = await storage.createChatMessage({
            role: 'assistant',
            content: 'Lo siento, no puedo responder en este momento debido a un problema técnico. Tu mensaje se ha guardado correctamente.',
            metadata: {},
          });

          res.json([message, errorMessage]);
        }
      } else {
        res.json([message]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      res.status(400).json({ error: "Failed to process chat message" });
    }
  });

  // Get recordings by date range
  app.get("/api/recordings/date/:startDate/:endDate", async (req, res) => {
    try {
      const storage = await getStorage();
      const startDate = new Date(req.params.startDate);
      const endDate = new Date(req.params.endDate);
      
      const recordings = await storage.getRecordingsByDateRange(startDate, endDate);
      res.json(recordings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recordings by date" });
    }
  });

  // Transcribe audio
  app.post("/api/transcribe", upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      const transcription = await transcribeAudio(req.file.buffer, req.file.originalname);
      
      res.json({ 
        transcription,
        filename: req.file.originalname,
        size: req.file.size 
      });
    } catch (error: any) {
      console.error('Transcription error:', error);
      res.status(500).json({ 
        error: error.message || "Failed to transcribe audio" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
