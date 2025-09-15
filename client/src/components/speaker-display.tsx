import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Mic, Clock, User } from 'lucide-react';

interface Speaker {
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
}

interface SpeakerDisplayProps {
  speakers: Speaker[];
  duration: number;
}

export function SpeakerDisplay({ speakers, duration }: SpeakerDisplayProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGenderIcon = (gender?: string) => {
    switch (gender) {
      case 'male': return '👨';
      case 'female': return '👩';
      default: return '👤';
    }
  };

  const getAgeRangeColor = (ageRange?: string) => {
    switch (ageRange) {
      case 'young': return 'bg-green-100 text-green-800';
      case 'adult': return 'bg-blue-100 text-blue-800';
      case 'senior': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!speakers || speakers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Hablantes Identificados ({speakers.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {speakers.map((speaker, index) => (
          <div key={speaker.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getGenderIcon(speaker.characteristics?.gender)}</span>
                <div>
                  <h3 className="font-semibold">{speaker.name}</h3>
                  {speaker.characteristics && (
                    <div className="flex space-x-2 mt-1">
                      {speaker.characteristics.ageRange && (
                        <Badge className={getAgeRangeColor(speaker.characteristics.ageRange)}>
                          {speaker.characteristics.ageRange === 'young' ? 'Joven' :
                           speaker.characteristics.ageRange === 'adult' ? 'Adulto' :
                           speaker.characteristics.ageRange === 'senior' ? 'Mayor' : 'Desconocido'}
                        </Badge>
                      )}
                      {speaker.characteristics.language && (
                        <Badge variant="outline">
                          {speaker.characteristics.language}
                        </Badge>
                      )}
                      {speaker.characteristics.accent && (
                        <Badge variant="outline">
                          {speaker.characteristics.accent}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {speaker.segments.length} segmentos
              </div>
            </div>

            <div className="space-y-2">
              {speaker.segments.map((segment, segIndex) => (
                <div key={segIndex} className="bg-gray-50 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(segment.start)} - {formatTime(segment.end)}</span>
                    </div>
                    <div className={`text-sm font-medium ${getConfidenceColor(segment.confidence)}`}>
                      {Math.round(segment.confidence * 100)}% confianza
                    </div>
                  </div>
                  <p className="text-sm">{segment.text}</p>
                </div>
              ))}
            </div>

            {/* Barra de tiempo visual */}
            <div className="mt-3">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-1">
                <Mic className="w-3 h-3" />
                <span>Timeline de participación</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                {speaker.segments.map((segment, segIndex) => {
                  const startPercent = (segment.start / duration) * 100;
                  const widthPercent = ((segment.end - segment.start) / duration) * 100;
                  
                  return (
                    <div
                      key={segIndex}
                      className="absolute h-full bg-blue-500 rounded"
                      style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`,
                        backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                      }}
                      title={`${formatTime(segment.start)} - ${formatTime(segment.end)}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
