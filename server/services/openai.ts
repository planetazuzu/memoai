import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.API_KEY || "default_key" 
});

export interface AnalysisResult {
  summary: string;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
    dueDate?: string;
  }>;
  diaryEntry: string;
}

export async function analyzeTranscript(transcript: string, title: string): Promise<AnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Eres un asistente personal inteligente que analiza transcripciones de conversaciones. 
          
          Tu trabajo es generar:
          1. Un resumen conciso en viñetas de los puntos principales
          2. Una lista de tareas y recordatorios extraídos de la conversación
          3. Una entrada de diario personal en tono natural y reflexivo
          
          Responde siempre en formato JSON con esta estructura:
          {
            "summary": "Resumen en viñetas de los puntos principales",
            "tasks": [
              {
                "id": "uuid",
                "title": "Título de la tarea",
                "description": "Descripción detallada",
                "priority": "low|medium|high",
                "completed": false,
                "dueDate": "YYYY-MM-DD" (opcional)
              }
            ],
            "diaryEntry": "Entrada de diario personal reflexiva en tono natural"
          }`
        },
        {
          role: "user",
          content: `Analiza esta transcripción de: "${title}"

Transcripción:
${transcript}

Genera el análisis completo en el formato JSON especificado.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Add UUIDs to tasks if not present
    if (result.tasks) {
      result.tasks = result.tasks.map((task: any) => ({
        ...task,
        id: task.id || crypto.randomUUID(),
        completed: task.completed || false,
      }));
    }

    return result;
  } catch (error) {
    console.error('Error analyzing transcript:', error);
    throw new Error('Failed to analyze transcript with AI');
  }
}

export async function generateChatResponse(
  userMessage: string, 
  recordings: Array<{ title: string; transcript?: string; summary?: string; createdAt: Date }>
): Promise<string> {
  try {
    const contextData = recordings.map(r => ({
      title: r.title,
      date: r.createdAt.toISOString().split('T')[0],
      content: r.summary || r.transcript?.substring(0, 500) || 'Sin contenido disponible'
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Eres un asistente personal inteligente que ayuda al usuario a consultar su historial de conversaciones y tareas.

Tienes acceso a las siguientes conversaciones:
${JSON.stringify(contextData, null, 2)}

Responde de manera útil, concisa y en español. Si el usuario pregunta sobre tareas, reuniones, o información específica, búscala en el contexto proporcionado.`
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || 'Lo siento, no pude procesar tu consulta.';
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw new Error('Failed to generate chat response');
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    // Note: In a real implementation, you would save the buffer to a temporary file
    // and pass it to OpenAI's transcription API. For now, we'll return a placeholder.
    throw new Error('Audio transcription with OpenAI requires file upload implementation');
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}
