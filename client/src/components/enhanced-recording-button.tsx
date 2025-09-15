import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Pause, Play, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useIndexedDB } from '@/hooks/use-indexed-db';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/use-settings';
import { apiRequest } from '@/lib/queryClient';
import { notificationService } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { recordingPulse, buttonHover, fadeIn, slideUp, pulse } from '@/lib/animations';

interface EnhancedRecordingButtonProps {
  onRecordingComplete?: (recording: {
    audioBlob: Blob;
    duration: number;
    transcript?: string;
  }) => void;
  className?: string;
}

export function EnhancedRecordingButton({ 
  onRecordingComplete, 
  className 
}: EnhancedRecordingButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const { toast } = useToast();
  const { getSetting } = useSettings();
  const { addRecording } = useIndexedDB();
  
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    audioBlob,
    isRecording: recorderIsRecording,
    isPaused: recorderIsPaused,
    duration
  } = useAudioRecorder();

  const {
    startListening,
    stopListening,
    transcript,
    isListening,
    finalTranscript
  } = useSpeechRecognition();

  // Actualizar duración cada segundo
  useState(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  });

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Iniciar grabación de audio
      await startRecording();
      
      // Iniciar reconocimiento de voz si está habilitado
      const autoTranscribe = getSetting('autoTranscribe');
      if (autoTranscribe) {
        startListening();
      }
      
      toast({
        title: "Grabación iniciada",
        description: "Presiona el botón para pausar o detener",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar la grabación",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  };

  const handlePauseRecording = () => {
    if (isPaused) {
      resumeRecording();
      startListening();
    } else {
      pauseRecording();
      stopListening();
    }
    setIsPaused(!isPaused);
  };

  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      setIsPaused(false);
      
      // Detener grabación y reconocimiento
      const audioBlob = await stopRecording();
      stopListening();
      
      if (!audioBlob) {
        throw new Error('No audio recorded');
      }

      // Procesar la grabación
      await processRecording(audioBlob, duration);
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast({
        title: "Error",
        description: "No se pudo detener la grabación",
        variant: "destructive",
      });
    }
  };

  const processRecording = async (audioBlob: Blob, duration: number) => {
    setIsProcessing(true);
    
    try {
      // Paso 1: Guardar en IndexedDB
      setProcessingStep('Guardando grabación...');
      const recordingId = await addRecording({
        audioBlob,
        duration,
        transcript: finalTranscript || transcript,
        timestamp: new Date(),
      });

      // Paso 2: Transcribir con OpenAI si está configurado
      let finalTranscript = transcript;
      const openaiApiKey = getSetting('openaiApiKey');
      if (openaiApiKey && openaiApiKey !== 'dummy-key-for-development') {
        setProcessingStep('Transcribiendo audio...');
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          const response = await apiRequest('POST', '/api/transcribe', formData);
          const data = await response.json?.() ?? response;
          finalTranscript = data.transcription;

          toast({
            title: "Transcripción completada",
            description: "Audio transcrito exitosamente",
          });
        } catch (transcriptionError: any) {
          console.error('Transcription error:', transcriptionError);
          toast({
            title: "Transcripción fallida",
            description: "Usando transcripción local",
            variant: "destructive",
          });
        }
      }

      // Paso 3: Guardar en el servidor
      setProcessingStep('Sincronizando con servidor...');
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('duration', duration.toString());
      formData.append('transcript', finalTranscript || '');
      formData.append('title', `Grabación ${new Date().toLocaleString()}`);

      const response = await apiRequest('POST', '/api/recordings', formData);
      const recording = await response.json?.() ?? response;

      // Notificación de éxito
      await notificationService.showRecordingComplete(duration);
      
      toast({
        title: "Grabación guardada",
        description: `Duración: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
      });

      // Llamar callback si existe
      onRecordingComplete?.({
        audioBlob,
        duration,
        transcript: finalTranscript,
      });

    } catch (error) {
      console.error('Error processing recording:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la grabación",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getButtonContent = () => {
    if (isProcessing) {
      return (
        <motion.div 
          className="flex items-center gap-2"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">{processingStep}</span>
        </motion.div>
      );
    }

    if (isRecording) {
      return (
        <motion.div 
          className="flex items-center gap-2"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <Square className="h-4 w-4" />
          <span>Detener ({formatDuration(recordingDuration)})</span>
        </motion.div>
      );
    }

    return (
      <motion.div 
        className="flex items-center gap-2"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <Mic className="h-4 w-4" />
        <span>Grabar</span>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Botón principal de grabación */}
      <motion.div
        variants={slideUp}
        initial="initial"
        animate="animate"
        className="relative"
      >
        <Button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={isProcessing}
          className={cn(
            "h-16 w-16 rounded-full text-white shadow-lg transition-all duration-300",
            isRecording 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-blue-500 hover:bg-blue-600",
            isProcessing && "opacity-50 cursor-not-allowed",
            className
          )}
          {...buttonHover}
        >
          {isRecording && (
            <motion.div
              className="absolute inset-0 rounded-full"
              variants={recordingPulse}
              animate="animate"
            />
          )}
          {getButtonContent()}
        </Button>
      </motion.div>

      {/* Botón de pausa/reanudar */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            variants={slideUp}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Button
              onClick={handlePauseRecording}
              variant="outline"
              size="sm"
              className="rounded-full"
              {...buttonHover}
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Reanudar
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicador de estado */}
      <AnimatePresence>
        {(isRecording || isProcessing) && (
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-center"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isRecording && !isPaused && (
                <motion.div
                  className="w-2 h-2 bg-red-500 rounded-full"
                  variants={pulse}
                  animate="animate"
                />
              )}
              {isRecording && isPaused && (
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              )}
              {isProcessing && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span>
                {isRecording && !isPaused && "Grabando..."}
                {isRecording && isPaused && "Pausado"}
                {isProcessing && processingStep}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
