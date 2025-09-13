import { useState, useEffect, useCallback } from 'react';

interface IndexedDBHook {
  isReady: boolean;
  error: string | null;
  saveData: (storeName: string, data: any) => Promise<void>;
  getData: (storeName: string, id: string) => Promise<any>;
  getAllData: (storeName: string) => Promise<any[]>;
  deleteData: (storeName: string, id: string) => Promise<void>;
  clearStore: (storeName: string) => Promise<void>;
}

export function useIndexedDB(dbName: string = 'MemoAI', version: number = 1): IndexedDBHook {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        const request = indexedDB.open(dbName, version);
        
        request.onerror = () => {
          setError('Failed to open IndexedDB');
        };
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Create recordings store
          if (!db.objectStoreNames.contains('recordings')) {
            const recordingsStore = db.createObjectStore('recordings', { keyPath: 'id' });
            recordingsStore.createIndex('createdAt', 'createdAt');
            recordingsStore.createIndex('processed', 'processed');
          }
          
          // Create audio blobs store
          if (!db.objectStoreNames.contains('audioBlobs')) {
            db.createObjectStore('audioBlobs', { keyPath: 'id' });
          }
          
          // Create chat messages store
          if (!db.objectStoreNames.contains('chatMessages')) {
            const chatStore = db.createObjectStore('chatMessages', { keyPath: 'id' });
            chatStore.createIndex('createdAt', 'createdAt');
          }
        };
        
        request.onsuccess = (event) => {
          const database = (event.target as IDBOpenDBRequest).result;
          setDb(database);
          setIsReady(true);
        };
      } catch (err) {
        setError('IndexedDB not supported');
      }
    };

    initDB();
  }, [dbName, version]);

  const saveData = useCallback(async (storeName: string, data: any): Promise<void> => {
    if (!db) throw new Error('Database not ready');
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save data'));
    });
  }, [db]);

  const getData = useCallback(async (storeName: string, id: string): Promise<any> => {
    if (!db) throw new Error('Database not ready');
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get data'));
    });
  }, [db]);

  const getAllData = useCallback(async (storeName: string): Promise<any[]> => {
    if (!db) throw new Error('Database not ready');
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get all data'));
    });
  }, [db]);

  const deleteData = useCallback(async (storeName: string, id: string): Promise<void> => {
    if (!db) throw new Error('Database not ready');
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete data'));
    });
  }, [db]);

  const clearStore = useCallback(async (storeName: string): Promise<void> => {
    if (!db) throw new Error('Database not ready');
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear store'));
    });
  }, [db]);

  return {
    isReady,
    error,
    saveData,
    getData,
    getAllData,
    deleteData,
    clearStore,
  };
}
