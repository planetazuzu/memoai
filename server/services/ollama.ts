// Ollama service for local AI inference
export class OllamaService {
  private baseUrl: string;
  private model: string;
  private isAvailable: boolean = false;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.2:latest';
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        timeout: 5000
      });
      this.isAvailable = response.ok;
    } catch (error) {
      this.isAvailable = false;
      console.warn('Ollama not available:', error);
    }
  }

  async generateResponse(prompt: string): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('Ollama service is not available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 2000
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.response || 'No response generated';
    } catch (error) {
      console.error('Ollama service error:', error);
      this.isAvailable = false; // Mark as unavailable on error
      throw new Error(`Failed to generate response with Ollama: ${error.message}`);
    }
  }

  async analyzeTranscript(transcript: string, title: string) {
    const prompt = `Analiza la siguiente transcripción y proporciona:
1. Un resumen en viñetas
2. Lista de tareas identificadas con prioridad
3. Una entrada de diario personal en tono natural

Transcripción: ${transcript}

Responde en formato JSON:
{
  "summary": "resumen aquí",
  "tasks": [
    {
      "id": "uuid",
      "title": "título de tarea",
      "description": "descripción",
      "priority": "high|medium|low",
      "completed": false
    }
  ],
  "diaryEntry": "entrada de diario aquí"
}`;

    const response = await this.generateResponse(prompt);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Failed to parse Ollama response:', error);
      return {
        summary: `Resumen: ${transcript.substring(0, 200)}...`,
        tasks: [],
        diaryEntry: `Entrada de diario: ${transcript.substring(0, 300)}...`
      };
    }
  }

  async generateChatResponse(message: string, context?: string): Promise<string> {
    const prompt = `Eres un asistente personal inteligente. Responde de manera útil y amigable.

Contexto: ${context || 'No hay contexto específico disponible.'}

Pregunta del usuario: ${message}

Responde en español de manera natural y útil:`;

    return await this.generateResponse(prompt);
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    // Ollama no tiene transcripción de audio, usar OpenAI o Whisper
    throw new Error('Ollama does not support audio transcription');
  }

  async getStatus() {
    return {
      available: this.isAvailable,
      baseUrl: this.baseUrl,
      model: this.model,
      lastChecked: new Date().toISOString()
    };
  }

  async listModels() {
    if (!this.isAvailable) {
      throw new Error('Ollama service is not available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      throw new Error('Failed to fetch Ollama models');
    }
  }

  async pullModel(modelName: string) {
    if (!this.isAvailable) {
      throw new Error('Ollama service is not available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error pulling Ollama model:', error);
      throw new Error(`Failed to pull model ${modelName}`);
    }
  }
}

export const ollamaService = new OllamaService();