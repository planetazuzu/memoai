// Servicio unificado de IA que maneja todos los proveedores
import { ollamaService } from './ollama';
import { analyzeTranscript as openaiAnalyze, generateChatResponse as openaiChat, transcribeAudio as openaiTranscribe } from './openai';
import { voiceRecognitionService, VoiceAnalysis } from './voice-recognition';

export interface AnalysisResult {
  summary: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
  }>;
  diaryEntry: string;
  speakers?: Array<{
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
}

export class AIService {
  private getProvider() {
    // Por defecto usar Ollama si está disponible
    return process.env.OLLAMA_BASE_URL ? 'ollama' : 'openai';
  }

  async analyzeTranscript(transcript: string, title: string, duration?: number): Promise<AnalysisResult> {
    const provider = this.getProvider();
    
    let analysis: AnalysisResult;
    if (provider === 'ollama') {
      analysis = await ollamaService.analyzeTranscript(transcript, title);
    } else {
      analysis = await openaiAnalyze(transcript, title);
    }

    // Añadir análisis de múltiples voces si hay duración
    if (duration && duration > 0) {
      try {
        const voiceAnalysis = await voiceRecognitionService.analyzeMultipleVoices(transcript, duration);
        analysis.speakers = voiceAnalysis.speakers;
      } catch (error) {
        console.error('Voice analysis error:', error);
      }
    }

    return analysis;
  }

  async generateChatResponse(message: string, context?: string): Promise<string> {
    const provider = this.getProvider();
    
    if (provider === 'ollama') {
      return await ollamaService.generateChatResponse(message, context);
    } else {
      return await openaiChat(message, context);
    }
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    // Solo OpenAI tiene transcripción de audio
    return await openaiTranscribe(audioBuffer);
  }

  getActiveProviderInfo() {
    const provider = this.getProvider();
    return {
      name: provider === 'ollama' ? 'Ollama (Local)' : 'OpenAI',
      type: provider,
      enabled: true
    };
  }
}

export const aiService = new AIService();