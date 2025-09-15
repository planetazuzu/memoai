// Ollama service for local AI inference
export class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.2:latest';
  }

  async generateResponse(prompt: string): Promise<string> {
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
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Ollama service error:', error);
      throw new Error('Failed to generate response with Ollama');
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
}

export const ollamaService = new OllamaService();