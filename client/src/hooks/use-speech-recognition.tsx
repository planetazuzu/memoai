import { useState, useEffect, useCallback, useRef } from 'react';
import { SpeechRecognitionState } from '@/types/audio';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition(lang: string = 'es-ES') {
  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    isSupported: false,
  });

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setState(prev => ({ ...prev, isSupported: true }));
        
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          setState(prev => ({
            ...prev,
            transcript: prev.transcript + finalTranscript,
            interimTranscript,
          }));
        };

        recognition.onerror = (event: any) => {
          setState(prev => ({
            ...prev,
            error: `Speech recognition error: ${event.error}`,
            isListening: false,
          }));
        };

        recognition.onend = () => {
          setState(prev => ({
            ...prev,
            isListening: false,
          }));
        };

        recognitionRef.current = recognition;
      } else {
        setState(prev => ({
          ...prev,
          isSupported: false,
          error: 'Speech recognition not supported in this browser',
        }));
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [lang]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && state.isSupported) {
      setState(prev => ({
        ...prev,
        isListening: true,
        error: undefined,
      }));
      
      recognitionRef.current.start();
    }
  }, [state.isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      error: undefined,
    }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
  };
}
