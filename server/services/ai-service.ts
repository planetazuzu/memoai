// Servicio unificado de IA que maneja todos los proveedores
import { ollamaService } from './ollama';
import { analyzeTranscript as openaiAnalyze, generateChatResponse as openaiChat, transcribeAudio as openaiTranscribe } from './openai';

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
}

export class AIService {
  private getProvider() {
    // Por defecto usar Ollama si está disponible
    return process.env.OLLAMA_BASE_URL ? 'ollama' : 'openai';
  }

  async analyzeTranscript(transcript: string, title: string): Promise<AnalysisResult> {
    const provider = this.getProvider();
    
    if (provider === 'ollama') {
      return await ollamaService.analyzeTranscript(transcript, title);
    } else {
      return await openaiAnalyze(transcript, title);
    }
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