// Servicio de reconocimiento de múltiples voces
import { aiService } from './ai-service';

export interface Speaker {
  id: string;
  name: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
}

export interface VoiceAnalysis {
  speakers: Speaker[];
  transcript: string;
  speakerChanges: Array<{
    timestamp: number;
    speakerId: string;
    text: string;
  }>;
}

export class VoiceRecognitionService {
  async analyzeMultipleVoices(transcript: string, audioDuration: number): Promise<VoiceAnalysis> {
    try {
      // Usar IA para identificar cambios de hablante
      const prompt = `Analiza la siguiente transcripción y identifica los diferentes hablantes.
      
Transcripción: ${transcript}
Duración del audio: ${audioDuration} segundos

Identifica:
1. Cambios de hablante en el texto
2. Patrones de habla de cada persona
3. Estimaciones de tiempo basadas en la duración

Responde en formato JSON:
{
  "speakers": [
    {
      "id": "speaker_1",
      "name": "Persona 1",
      "segments": [
        {
          "start": 0,
          "end": 30,
          "text": "texto hablado",
          "confidence": 0.9
        }
      ]
    }
  ],
  "speakerChanges": [
    {
      "timestamp": 30,
      "speakerId": "speaker_2",
      "text": "cambio de hablante"
    }
  ]
}`;

      const response = await aiService.generateChatResponse(prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          return {
            speakers: analysis.speakers || [],
            transcript: transcript,
            speakerChanges: analysis.speakerChanges || []
          };
        }
      } catch (error) {
        console.error('Error parsing voice analysis:', error);
      }

      // Fallback: crear un solo hablante
      return this.createFallbackAnalysis(transcript, audioDuration);
      
    } catch (error) {
      console.error('Voice recognition error:', error);
      return this.createFallbackAnalysis(transcript, audioDuration);
    }
  }

  private createFallbackAnalysis(transcript: string, audioDuration: number): VoiceAnalysis {
    // Dividir el texto en segmentos basados en puntos y comas
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const segmentDuration = audioDuration / sentences.length;
    
    const speaker: Speaker = {
      id: 'speaker_1',
      name: 'Hablante Principal',
      segments: sentences.map((sentence, index) => ({
        start: index * segmentDuration,
        end: (index + 1) * segmentDuration,
        text: sentence.trim(),
        confidence: 0.8
      }))
    };

    return {
      speakers: [speaker],
      transcript: transcript,
      speakerChanges: []
    };
  }

  async identifySpeakerCharacteristics(transcript: string): Promise<{
    gender?: 'male' | 'female' | 'unknown';
    ageRange?: 'young' | 'adult' | 'senior' | 'unknown';
    language?: string;
    accent?: string;
  }> {
    try {
      const prompt = `Analiza las características de voz en esta transcripción:
      
"${transcript}"

Identifica:
1. Género (masculino/femenino/desconocido)
2. Rango de edad (joven/adulto/mayor/desconocido)
3. Idioma detectado
4. Acento o región

Responde en formato JSON:
{
  "gender": "male|female|unknown",
  "ageRange": "young|adult|senior|unknown",
  "language": "español",
  "accent": "español peninsular"
}`;

      const response = await aiService.generateChatResponse(prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.error('Error parsing speaker characteristics:', error);
      }
    } catch (error) {
      console.error('Speaker identification error:', error);
    }

    return {
      gender: 'unknown',
      ageRange: 'unknown',
      language: 'español',
      accent: 'desconocido'
    };
  }

  generateSpeakerNames(speakerCount: number): string[] {
    const names = [
      'Persona 1', 'Persona 2', 'Persona 3', 'Persona 4',
      'Hablante A', 'Hablante B', 'Hablante C', 'Hablante D',
      'Participante 1', 'Participante 2', 'Participante 3', 'Participante 4'
    ];
    
    return names.slice(0, speakerCount);
  }
}

export const voiceRecognitionService = new VoiceRecognitionService();
