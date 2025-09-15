import { useState, useEffect } from 'react';

export interface AppSettings {
  openaiApiKey: string;
  transcriptionLanguage: string;
  autoTranscribe: boolean;
  offlineMode: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  autoBackup: boolean;
}

const defaultSettings: AppSettings = {
  openaiApiKey: '',
  transcriptionLanguage: 'es',
  autoTranscribe: true,
  offlineMode: false,
  theme: 'system',
  notifications: true,
  autoBackup: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('memoai-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettings(defaultSettings);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('memoai-settings', JSON.stringify(updated));
  };

  // Reset to default settings
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem('memoai-settings', JSON.stringify(defaultSettings));
  };

  // Get a specific setting
  const getSetting = <K extends keyof AppSettings>(key: K): AppSettings[K] => {
    return settings[key];
  };

  // Update a specific setting
  const setSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    updateSettings({ [key]: value });
  };

  return {
    settings,
    isLoaded,
    updateSettings,
    resetSettings,
    getSetting,
    setSetting,
  };
}
