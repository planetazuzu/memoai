import { useState, useEffect, useRef, useCallback } from 'react';
import { useAudioRecorder } from './use-audio-recorder';
import { useSpeechRecognition } from './use-speech-recognition';

export type RecordingMode = 'manual' | 'meeting' | 'casual' | 'private';
export type RecordingProfile = {
  mode: RecordingMode;
  autoStart: boolean;
  voiceDetection: boolean;
  continuousRecording: boolean;
  silenceThreshold: number;
  voiceTimeout: number;
};

const defaultProfiles: Record<RecordingMode, RecordingProfile> = {
  manual: {
    mode: 'manual',
    autoStart: false,
    voiceDetection: false,
    continuousRecording: false,
    silenceThreshold: 0.3,
    voiceTimeout: 5000,
  },
  meeting: {
    mode: 'meeting',
    autoStart: false,
    voiceDetection: false,
    continuousRecording: true,
    silenceThreshold: 0.2,
    voiceTimeout: 10000,
  },
  casual: {
    mode: 'casual',
    autoStart: true,
    voiceDetection: true,
    continuousRecording: false,
    silenceThreshold: 0.3,
    voiceTimeout: 3000,
  },
  private: {
    mode: 'private',
    autoStart: false,
    voiceDetection: false,
    continuousRecording: false,
    silenceThreshold: 0.5,
    voiceTimeout: 2000,
  },
};

export function useSmartRecording() {
  const [currentProfile, setCurrentProfile] = useState<RecordingProfile>(defaultProfiles.manual);
  const [isVoiceDetected, setIsVoiceDetected] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [isAutoRecording, setIsAutoRecording] = useState(false);
  
  const voiceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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

  // Voice detection using Web Audio API
  const setupVoiceDetection = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      microphoneRef.current.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const detectVoice = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalizedLevel = average / 255;
        
        setVoiceLevel(normalizedLevel);
        
        const isVoice = normalizedLevel > currentProfile.silenceThreshold;
        setIsVoiceDetected(isVoice);
        
        // Auto-start recording in casual mode
        if (currentProfile.mode === 'casual' && isVoice && !isRecording && !isAutoRecording) {
          setIsAutoRecording(true);
          startRecording();
          if (speechSupported) {
            startListening();
          }
        }
        
        // Auto-stop recording in casual mode
        if (currentProfile.mode === 'casual' && isRecording && isAutoRecording) {
          if (isVoice) {
            // Reset timeout when voice is detected
            if (voiceTimeoutRef.current) {
              clearTimeout(voiceTimeoutRef.current);
            }
            voiceTimeoutRef.current = setTimeout(() => {
              if (isRecording) {
                stopRecording();
                stopListening();
                setIsAutoRecording(false);
              }
            }, currentProfile.voiceTimeout);
          }
        }
        
        animationFrameRef.current = requestAnimationFrame(detectVoice);
      };
      
      detectVoice();
    } catch (error) {
      console.error('Error setting up voice detection:', error);
    }
  }, [currentProfile, isRecording, speechSupported, startRecording, stopRecording, startListening, stopListening]);

  const cleanupVoiceDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
    }
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  }, []);

  // Update profile and restart detection if needed
  useEffect(() => {
    if (currentProfile.voiceDetection && !isRecording) {
      setupVoiceDetection();
    } else {
      cleanupVoiceDetection();
    }
    
    return cleanupVoiceDetection;
  }, [currentProfile, setupVoiceDetection, cleanupVoiceDetection, isRecording]);

  const setProfile = useCallback((mode: RecordingMode) => {
    setCurrentProfile(defaultProfiles[mode]);
  }, []);

  const startSmartRecording = useCallback(async () => {
    if (currentProfile.autoStart && currentProfile.voiceDetection) {
      // Wait for voice detection to start
      return;
    }
    
    await startRecording();
    if (speechSupported) {
      startListening();
    }
  }, [currentProfile, startRecording, speechSupported, startListening]);

  const stopSmartRecording = useCallback(async () => {
    await stopRecording();
    stopListening();
    setIsAutoRecording(false);
  }, [stopRecording, stopListening]);

  return {
    // Recording state
    isRecording,
    isPaused,
    duration,
    isAutoRecording,
    
    // Voice detection
    isVoiceDetected,
    voiceLevel,
    
    // Profile management
    currentProfile,
    setProfile,
    profiles: defaultProfiles,
    
    // Recording controls
    startRecording: startSmartRecording,
    stopRecording: stopSmartRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    
    // Speech recognition
    transcript,
    interimTranscript,
    speechSupported,
    resetTranscript,
  };
}
