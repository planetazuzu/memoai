import { useState, useEffect } from 'react';
import { useDexie } from './use-dexie';
import { RecordingDB, ChatMessageDB } from '@/lib/database';

// Hook unificado que puede usar tanto IndexedDB como Dexie
export function useStorage() {
  const { isInitialized, recordingService, chatService } = useDexie();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(isInitialized);
  }, [isInitialized]);

  // Funciones para grabaciones
  const saveRecording = async (data: Omit<RecordingDB, 'id' | 'createdAt'>) => {
    if (!isReady) throw new Error('Database not ready');
    return await recordingService.create(data);
  };

  const getRecordings = async () => {
    if (!isReady) return [];
    return await recordingService.getAll();
  };

  const getRecording = async (id: string) => {
    if (!isReady) return undefined;
    return await recordingService.getById(id);
  };

  const updateRecording = async (id: string, updates: Partial<RecordingDB>) => {
    if (!isReady) throw new Error('Database not ready');
    return await recordingService.update(id, updates);
  };

  const deleteRecording = async (id: string) => {
    if (!isReady) throw new Error('Database not ready');
    return await recordingService.delete(id);
  };

  const searchRecordings = async (query: string) => {
    if (!isReady) return [];
    return await recordingService.search(query);
  };

  // Funciones para mensajes de chat
  const saveChatMessage = async (data: Omit<ChatMessageDB, 'id' | 'createdAt'>) => {
    if (!isReady) throw new Error('Database not ready');
    return await chatService.create(data);
  };

  const getChatMessages = async () => {
    if (!isReady) return [];
    return await chatService.getAll();
  };

  const deleteChatMessage = async (id: string) => {
    if (!isReady) throw new Error('Database not ready');
    return await chatService.delete(id);
  };

  const clearChatMessages = async () => {
    if (!isReady) throw new Error('Database not ready');
    return await chatService.clear();
  };

  // Funciones genéricas para compatibilidad
  const saveData = async (tableName: string, data: any) => {
    if (tableName === 'recordings') {
      return await saveRecording(data);
    } else if (tableName === 'chatMessages') {
      return await saveChatMessage(data);
    }
    throw new Error(`Unknown table: ${tableName}`);
  };

  const getData = async (tableName: string) => {
    if (tableName === 'recordings') {
      return await getRecordings();
    } else if (tableName === 'chatMessages') {
      return await getChatMessages();
    }
    throw new Error(`Unknown table: ${tableName}`);
  };

  const deleteData = async (tableName: string, id: string) => {
    if (tableName === 'recordings') {
      return await deleteRecording(id);
    } else if (tableName === 'chatMessages') {
      return await deleteChatMessage(id);
    }
    throw new Error(`Unknown table: ${tableName}`);
  };

  const updateData = async (tableName: string, id: string, data: any) => {
    if (tableName === 'recordings') {
      return await updateRecording(id, data);
    }
    throw new Error(`Update not supported for table: ${tableName}`);
  };

  return {
    isReady,
    isConnected: isReady,
    // Funciones específicas
    saveRecording,
    getRecordings,
    getRecording,
    updateRecording,
    deleteRecording,
    searchRecordings,
    saveChatMessage,
    getChatMessages,
    deleteChatMessage,
    clearChatMessages,
    // Funciones genéricas para compatibilidad
    saveData,
    getData,
    deleteData,
    updateData,
  };
}
