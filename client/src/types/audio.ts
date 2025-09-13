export interface AudioRecording {
  id?: string;
  title: string;
  audioBlob?: Blob;
  audioUrl?: string;
  duration: number;
  transcript?: string;
  summary?: string;
  tasks?: Task[];
  diaryEntry?: string;
  metadata?: {
    type: 'meeting' | 'call' | 'note' | 'other';
    participants?: string[];
    tags?: string[];
  };
  processed?: boolean;
  createdAt?: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  dueDate?: string;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  mediaRecorder?: MediaRecorder;
  audioChunks: Blob[];
}

export interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error?: string;
}
