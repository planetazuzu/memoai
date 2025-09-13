import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Pause, Play } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useIndexedDB } from '@/hooks/use-indexed-db';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RecordingButtonProps {
  onRecordingComplete?: (recording: {
    audioBlob: Blob;
    transcript: string;
    duration: number;
  }) => void;
}

export function RecordingButton({ onRecordingComplete }: RecordingButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { saveData } = useIndexedDB();
  
  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useAudioRecorder();

  const {
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: speechSupported,
  } = useSpeechRecognition();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
      if (speechSupported) {
        startListening();
      }
      toast({
        title: "Grabación iniciada",
        description: speechSupported 
          ? "Audio y transcripción en tiempo real activados"
          : "Solo audio (transcripción no disponible)",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo iniciar la grabación",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsProcessing(true);
      const audioBlob = await stopRecording();
      stopListening();

      // Save to local storage
      const recordingData = {
        id: crypto.randomUUID(),
        audioBlob,
        transcript: transcript.trim(),
        duration,
        createdAt: new Date(),
      };

      await saveData('recordings', recordingData);
      
      onRecordingComplete?.({
        audioBlob,
        transcript: transcript.trim(),
        duration,
      });

      resetTranscript();
      
      toast({
        title: "Grabación completada",
        description: `Duración: ${formatTime(duration)}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo completar la grabación",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resumeRecording();
      if (speechSupported) {
        startListening();
      }
    } else {
      pauseRecording();
      stopListening();
    }
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-sm text-muted-foreground">Procesando grabación...</p>
      </div>
    );
  }

  if (!isRecording) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <Button
          onClick={handleStartRecording}
          size="lg"
          className="w-20 h-20 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground"
          data-testid="button-start-recording"
        >
          <Mic className="w-6 h-6" />
        </Button>
        <p className="text-sm text-muted-foreground">Toca para iniciar grabación</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-4">
        <Button
          onClick={handlePauseResume}
          size="lg"
          variant="outline"
          className="w-12 h-12 rounded-full"
          data-testid="button-pause-resume"
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </Button>
        
        <Button
          onClick={handleStopRecording}
          size="lg"
          className={cn(
            "w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white",
            !isPaused && "animate-pulse"
          )}
          data-testid="button-stop-recording"
        >
          <Square className="w-6 h-6" />
        </Button>
      </div>
      
      <div className="text-center">
        <div className="text-lg font-mono font-medium" data-testid="text-recording-time">
          {formatTime(duration)}
        </div>
        <div className="text-sm text-muted-foreground">
          {isPaused ? 'Pausado' : 'Grabando...'}
        </div>
      </div>

      {/* Live transcript */}
      {speechSupported && (transcript || interimTranscript) && (
        <div className="w-full max-w-sm bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-2">Transcripción en vivo:</div>
          <div className="text-sm">
            <span className="text-foreground">{transcript}</span>
            <span className="text-muted-foreground italic">{interimTranscript}</span>
          </div>
        </div>
      )}

      {/* Recording visualization */}
      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-accent to-primary animate-pulse"></div>
      </div>
    </div>
  );
}
