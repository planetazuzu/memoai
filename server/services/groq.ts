// Groq service implementation
export class GroqService {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
  }

  async generateResponse(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
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
      console.error('Failed to parse Groq response:', error);
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
    // Groq no tiene transcripción de audio, usar OpenAI o Whisper
    throw new Error('Groq does not support audio transcription');
  }
}

export const groqService = new GroqService();
