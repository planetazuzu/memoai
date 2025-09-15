import { useState, useEffect } from 'react';
import { recordingService, chatService, initDatabase } from '@/lib/database';
import { RecordingDB, ChatMessageDB } from '@/lib/database';

export function useDexie() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await initDatabase();
      setIsInitialized(true);
    };
    initialize();
  }, []);

  return {
    isInitialized,
    recordingService,
    chatService,
  };
}

// Hook específico para grabaciones
export function useRecordings() {
  const [recordings, setRecordings] = useState<RecordingDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isInitialized } = useDexie();

  useEffect(() => {
    if (isInitialized) {
      loadRecordings();
    }
  }, [isInitialized]);

  const loadRecordings = async () => {
    try {
      setIsLoading(true);
      const data = await recordingService.getAll();
      setRecordings(data);
    } catch (error) {
      console.error('Error loading recordings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createRecording = async (recording: Omit<RecordingDB, 'id' | 'createdAt'>) => {
    try {
      const id = await recordingService.create(recording);
      await loadRecordings();
      return id;
    } catch (error) {
      console.error('Error creating recording:', error);
      throw error;
    }
  };

  const updateRecording = async (id: string, updates: Partial<RecordingDB>) => {
    try {
      await recordingService.update(id, updates);
      await loadRecordings();
    } catch (error) {
      console.error('Error updating recording:', error);
      throw error;
    }
  };

  const deleteRecording = async (id: string) => {
    try {
      await recordingService.delete(id);
      await loadRecordings();
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  };

  const searchRecordings = async (query: string) => {
    try {
      const results = await recordingService.search(query);
      return results;
    } catch (error) {
      console.error('Error searching recordings:', error);
      return [];
    }
  };

  return {
    recordings,
    isLoading,
    createRecording,
    updateRecording,
    deleteRecording,
    searchRecordings,
    refresh: loadRecordings,
  };
}

// Hook específico para mensajes de chat
export function useChatMessages() {
  const [messages, setMessages] = useState<ChatMessageDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isInitialized } = useDexie();

  useEffect(() => {
    if (isInitialized) {
      loadMessages();
    }
  }, [isInitialized]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const data = await chatService.getAll();
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createMessage = async (message: Omit<ChatMessageDB, 'id' | 'createdAt'>) => {
    try {
      const id = await chatService.create(message);
      await loadMessages();
      return id;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      await chatService.delete(id);
      await loadMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  };

  const clearMessages = async () => {
    try {
      await chatService.clear();
      await loadMessages();
    } catch (error) {
      console.error('Error clearing messages:', error);
      throw error;
    }
  };

  return {
    messages,
    isLoading,
    createMessage,
    deleteMessage,
    clearMessages,
    refresh: loadMessages,
  };
}
