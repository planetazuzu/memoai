import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ExportDialog } from '@/components/export-dialog';
import { backupService } from '@/lib/backup';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Settings, Key, Globe, Shield, Download, Upload, Trash2, Save, Eye, EyeOff, Database, Clock } from 'lucide-react';

interface AppSettings {
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const { toast } = useToast();

  // Fetch recordings for backup
  const { data: recordings = [] } = useQuery({
    queryKey: ['/api/recordings'],
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('memoai-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: AppSettings) => {
    localStorage.setItem('memoai-settings', JSON.stringify(newSettings));
    setSettings(newSettings);
    setHasChanges(false);
  };

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = () => {
    saveSettings(settings);
    toast({
      title: "Configuración guardada",
      description: "Los cambios se han aplicado correctamente",
    });
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast({
      title: "Configuración restablecida",
      description: "Se han restablecido los valores por defecto",
    });
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'memoai-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Configuración exportada",
      description: "Se ha descargado el archivo de configuración",
    });
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setSettings({ ...defaultSettings, ...imported });
        setHasChanges(true);
        toast({
          title: "Configuración importada",
          description: "Se ha cargado la configuración del archivo",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo importar el archivo de configuración",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleCreateBackup = async () => {
    try {
      setIsBackupLoading(true);
      const backupData = await backupService.createBackup(recordings, settings);
      await backupService.exportBackup(backupData);
      
      toast({
        title: "Backup creado",
        description: "Se ha descargado el archivo de backup",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el backup",
        variant: "destructive",
      });
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsBackupLoading(true);
      const backupData = await backupService.importBackup(file);
      await backupService.restoreBackup(backupData);
      
      toast({
        title: "Backup restaurado",
        description: "Los datos han sido restaurados correctamente",
      });
      
      // Refresh the page to show restored data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo restaurar el backup",
        variant: "destructive",
      });
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleClearData = () => {
    if (confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
      // Clear IndexedDB
      const request = indexedDB.deleteDatabase('MemoAI');
      request.onsuccess = () => {
        toast({
          title: "Datos eliminados",
          description: "Todos los datos han sido eliminados",
        });
      };
    }
  };

  return (
    <div className="px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Configuración</h2>
        <p className="text-sm text-muted-foreground">
          Personaliza tu experiencia con MemoAI
        </p>
      </div>

      <div className="space-y-6">
        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="w-5 h-5" />
              <span>Configuración de API</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="openai-key">Clave API de OpenAI</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="openai-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.openaiApiKey}
                  onChange={(e) => handleSettingChange('openaiApiKey', e.target.value)}
                  placeholder="sk-..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Necesaria para transcripción y análisis con IA
              </p>
            </div>

            <div>
              <Label htmlFor="transcription-lang">Idioma de transcripción</Label>
              <Select 
                value={settings.transcriptionLanguage} 
                onValueChange={(value) => handleSettingChange('transcriptionLanguage', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="it">Italiano</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-transcribe">Transcripción automática</Label>
                <p className="text-xs text-muted-foreground">
                  Transcribir automáticamente después de grabar
                </p>
              </div>
              <Switch
                id="auto-transcribe"
                checked={settings.autoTranscribe}
                onCheckedChange={(checked) => handleSettingChange('autoTranscribe', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Privacidad y Seguridad</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="offline-mode">Modo offline</Label>
                <p className="text-xs text-muted-foreground">
                  Usar solo funciones locales (sin conexión a internet)
                </p>
              </div>
              <Switch
                id="offline-mode"
                checked={settings.offlineMode}
                onCheckedChange={(checked) => handleSettingChange('offlineMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Notificaciones</Label>
                <p className="text-xs text-muted-foreground">
                  Recibir notificaciones de la aplicación
                </p>
              </div>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-backup">Backup automático</Label>
                <p className="text-xs text-muted-foreground">
                  Crear copias de seguridad automáticamente
                </p>
              </div>
              <Switch
                id="auto-backup"
                checked={settings.autoBackup}
                onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>Apariencia</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="theme">Tema</Label>
              <Select 
                value={settings.theme} 
                onValueChange={(value: 'light' | 'dark' | 'system') => handleSettingChange('theme', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Oscuro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Backup & Restore */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Backup y Restauración</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleCreateBackup}
                disabled={isBackupLoading}
                className="flex items-center space-x-2"
              >
                <Database className="w-4 h-4" />
                <span>{isBackupLoading ? 'Creando...' : 'Crear Backup'}</span>
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackup}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button
                  variant="outline"
                  disabled={isBackupLoading}
                  className="w-full flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Restaurar</span>
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <div className="flex items-center space-x-1 mb-1">
                <Clock className="w-3 h-3" />
                <span>Último backup: {backupService.getLastBackupTime()?.toLocaleString('es-ES') || 'Nunca'}</span>
              </div>
              <p>El backup incluye todas las grabaciones, configuraciones y datos de la aplicación.</p>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Gestión de Datos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setIsExportOpen(true)}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Datos</span>
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportSettings}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button
                  variant="outline"
                  className="w-full flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Importar</span>
                </Button>
              </div>
            </div>

            <Separator />

            <Button
              variant="destructive"
              onClick={handleClearData}
              className="w-full flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar todos los datos</span>
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex space-x-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Guardar cambios
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Restablecer
            </Button>
          </div>
        )}
      </div>

      <ExportDialog 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
      />
    </div>
  );
}
