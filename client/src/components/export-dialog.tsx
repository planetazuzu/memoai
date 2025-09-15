import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, FileAudio, Calendar, CheckCircle } from 'lucide-react';
import { Recording } from '@shared/schema';

interface ExportOptions {
  includeRecordings: boolean;
  includeTasks: boolean;
  includeDiary: boolean;
  includeAudio: boolean;
  format: 'json' | 'csv' | 'txt';
  dateRange: 'all' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
}

export function ExportDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [options, setOptions] = useState<ExportOptions>({
    includeRecordings: true,
    includeTasks: true,
    includeDiary: true,
    includeAudio: false,
    format: 'json',
    dateRange: 'all',
  });
  const [isExporting, setIsExporting] = useState(false);

  const { toast } = useToast();

  // Fetch recordings
  const { data: recordings = [] } = useQuery<Recording[]>({
    queryKey: ['/api/recordings'],
  });

  const handleOptionChange = (key: keyof ExportOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const exportToJSON = (data: any) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memoai-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = (data: any) => {
    if (data.recordings && data.recordings.length > 0) {
      const headers = ['Título', 'Fecha', 'Duración', 'Transcripción', 'Resumen'];
      const csvContent = [
        headers.join(','),
        ...data.recordings.map((r: Recording) => [
          `"${r.title}"`,
          `"${new Date(r.createdAt).toLocaleDateString('es-ES')}"`,
          `"${Math.floor(r.duration / 60)}:${(r.duration % 60).toString().padStart(2, '0')}"`,
          `"${(r.transcript || '').replace(/"/g, '""')}"`,
          `"${(r.summary || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `memoai-export-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const exportToTXT = (data: any) => {
    let content = 'MemoAI - Exportación de Datos\n';
    content += '================================\n\n';

    if (data.recordings) {
      data.recordings.forEach((recording: Recording, index: number) => {
        content += `${index + 1}. ${recording.title}\n`;
        content += `   Fecha: ${new Date(recording.createdAt).toLocaleString('es-ES')}\n`;
        content += `   Duración: ${Math.floor(recording.duration / 60)}:${(recording.duration % 60).toString().padStart(2, '0')}\n`;
        
        if (recording.transcript) {
          content += `   Transcripción:\n   ${recording.transcript}\n`;
        }
        
        if (recording.summary) {
          content += `   Resumen:\n   ${recording.summary}\n`;
        }

        if (recording.tasks && recording.tasks.length > 0) {
          content += `   Tareas:\n`;
          recording.tasks.forEach(task => {
            content += `   - ${task.title} (${task.priority}) ${task.completed ? '✓' : '○'}\n`;
          });
        }

        if (recording.diaryEntry) {
          content += `   Diario:\n   ${recording.diaryEntry}\n`;
        }

        content += '\n' + '─'.repeat(50) + '\n\n';
      });
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memoai-export-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filterRecordingsByDate = (recordings: Recording[]) => {
    const now = new Date();
    let startDate: Date;

    switch (options.dateRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (options.startDate && options.endDate) {
          return recordings.filter(r => {
            const recordingDate = new Date(r.createdAt);
            return recordingDate >= new Date(options.startDate!) && 
                   recordingDate <= new Date(options.endDate!);
          });
        }
        return recordings;
      default:
        return recordings;
    }

    return recordings.filter(r => new Date(r.createdAt) >= startDate);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const filteredRecordings = filterRecordingsByDate(recordings);
      
      const exportData: any = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        totalRecordings: filteredRecordings.length,
      };

      if (options.includeRecordings) {
        exportData.recordings = filteredRecordings.map(r => ({
          id: r.id,
          title: r.title,
          createdAt: r.createdAt,
          duration: r.duration,
          transcript: r.transcript,
          summary: r.summary,
          metadata: r.metadata,
          processed: r.processed,
        }));
      }

      if (options.includeTasks) {
        exportData.tasks = filteredRecordings.flatMap(r => 
          (r.tasks || []).map(task => ({
            ...task,
            recordingId: r.id,
            recordingTitle: r.title,
            createdAt: r.createdAt,
          }))
        );
      }

      if (options.includeDiary) {
        exportData.diaryEntries = filteredRecordings
          .filter(r => r.diaryEntry)
          .map(r => ({
            id: r.id,
            title: r.title,
            content: r.diaryEntry,
            createdAt: r.createdAt,
          }));
      }

      // Export based on format
      switch (options.format) {
        case 'json':
          exportToJSON(exportData);
          break;
        case 'csv':
          exportToCSV(exportData);
          break;
        case 'txt':
          exportToTXT(exportData);
          break;
      }

      toast({
        title: "Exportación completada",
        description: `Se ha exportado ${filteredRecordings.length} grabaciones`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error en exportación",
        description: "No se pudo exportar los datos",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Exportar Datos</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Content Selection */}
          <div>
            <h3 className="font-medium mb-3">Contenido a exportar</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recordings"
                  checked={options.includeRecordings}
                  onCheckedChange={(checked) => handleOptionChange('includeRecordings', checked)}
                />
                <Label htmlFor="recordings" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Grabaciones y transcripciones</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tasks"
                  checked={options.includeTasks}
                  onCheckedChange={(checked) => handleOptionChange('includeTasks', checked)}
                />
                <Label htmlFor="tasks" className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Tareas y recordatorios</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="diary"
                  checked={options.includeDiary}
                  onCheckedChange={(checked) => handleOptionChange('includeDiary', checked)}
                />
                <Label htmlFor="diary" className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Entradas de diario</span>
                </Label>
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <h3 className="font-medium mb-3">Formato de exportación</h3>
            <Select 
              value={options.format} 
              onValueChange={(value: 'json' | 'csv' | 'txt') => handleOptionChange('format', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON (Completo)</SelectItem>
                <SelectItem value="csv">CSV (Tabla)</SelectItem>
                <SelectItem value="txt">TXT (Texto)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div>
            <h3 className="font-medium mb-3">Rango de fechas</h3>
            <Select 
              value={options.dateRange} 
              onValueChange={(value: 'all' | 'week' | 'month' | 'custom') => handleOptionChange('dateRange', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las grabaciones</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="custom">Rango personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || (!options.includeRecordings && !options.includeTasks && !options.includeDiary)}
              className="flex-1"
            >
              {isExporting ? 'Exportando...' : 'Exportar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
