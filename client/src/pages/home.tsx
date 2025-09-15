import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RecordingButton } from '@/components/recording-button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIndexedDB } from '@/hooks/use-indexed-db';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Upload, Settings, Users, User, Mic, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Recording } from '@shared/schema';
import { AudioRecording } from '@/types/audio';

export default function Home() {

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getAllData } = useIndexedDB();

  // Fetch recordings from server
  const { data: recordings = [], isLoading } = useQuery<Recording[]>({
    queryKey: ['/api/recordings'],
  });

  // Create recording mutation
  const createRecordingMutation = useMutation({
    mutationFn: async (data: { 
      title: string; 
      transcript: string; 
      duration: number; 
      audioBlob: Blob;
      metadata: any;
    }) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('transcript', data.transcript);
      formData.append('duration', data.duration.toString());
      formData.append('metadata', JSON.stringify(data.metadata));
      formData.append('audio', data.audioBlob, 'recording.webm');

      return apiRequest('POST', '/api/recordings', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
      toast({
        title: "Grabación guardada",
        description: "La grabación se ha guardado exitosamente",
      });
      setIsDialogOpen(false);
      setPendingRecording(null);
      setSelectedTitle('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo guardar la grabación",
        variant: "destructive",
      });
    },
  });

  // Analyze recording mutation
  const analyzeRecordingMutation = useMutation({
    mutationFn: async (recordingId: string) => {
      return apiRequest('POST', `/api/recordings/${recordingId}/analyze`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
      toast({
        title: "Análisis completado",
        description: "La grabación ha sido analizada con IA",
      });
    },
    onError: () => {
      toast({
        title: "Error en análisis",
        description: "No se pudo analizar la grabación",
        variant: "destructive",
      });
    },
  });

  const handleRecordingComplete = (recording: {
    audioBlob: Blob;
    transcript: string;
    duration: number;
  }) => {
    // Recording is now auto-saved, just refresh the data
    queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
  };


  const handleAnalyzeRecording = (recordingId: string) => {
    analyzeRecordingMutation.mutate(recordingId);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (recording: Recording) => {
    if (recording.processed) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (recording.transcript) {
      return <Clock className="w-4 h-4 text-blue-500" />;
    } else {
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    }
  };

  const getStatusText = (recording: Recording) => {
    if (recording.processed) return 'Procesado';
    if (recording.transcript) return 'Transcrito';
    return 'Pendiente';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Users className="w-4 h-4 text-primary" />;
      case 'call':
        return <User className="w-4 h-4 text-accent" />;
      default:
        return <Mic className="w-4 h-4 text-green-500" />;
    }
  };

  const recentRecordings = recordings.slice(0, 3);
  const todayRecordings = recordings.filter(r => {
    const today = new Date();
    const recordingDate = new Date(r.createdAt);
    return recordingDate.toDateString() === today.toDateString();
  });

  const totalTasks = recordings.reduce((acc, r) => acc + (r.tasks?.length || 0), 0);
  const totalDuration = recordings.reduce((acc, r) => acc + r.duration, 0);

  return (
    <div className="px-4 py-6 pb-24">
      {/* Status Card */}
      <Card className="mb-6 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="text-sm text-muted-foreground mb-2">Estado del Sistema</div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Listo para grabar</span>
            </div>
          </div>
          
          {/* Recording Button */}
          <div className="flex justify-center mb-6">
            <RecordingButton onRecordingComplete={handleRecordingComplete} />
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <Button 
              variant="secondary" 
              className="p-3 h-auto flex items-center justify-center space-x-2"
              data-testid="button-import"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">Importar</span>
            </Button>
            <Button 
              variant="secondary" 
              className="p-3 h-auto flex items-center justify-center space-x-2"
              data-testid="button-settings"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Ajustes</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Conversations */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recientes</h2>
          <Button variant="ghost" size="sm" className="text-primary">
            Ver todas
          </Button>
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recentRecordings.length > 0 ? (
          <div className="space-y-3">
            {recentRecordings.map((recording) => (
              <Card 
                key={recording.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                data-testid={`card-recording-${recording.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      {getTypeIcon(recording.metadata?.type || 'other')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium truncate" data-testid={`text-title-${recording.id}`}>
                          {recording.title}
                        </h3>
                        <span className="text-xs text-muted-foreground" data-testid={`text-time-${recording.id}`}>
                          {formatDate(recording.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2" data-testid={`text-summary-${recording.id}`}>
                        {recording.summary || recording.transcript?.substring(0, 100) + '...' || 'Sin transcripción disponible'}
                      </p>
                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(recording.duration)}
                        </span>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(recording)}
                          <span className="text-xs text-muted-foreground">
                            {getStatusText(recording)}
                          </span>
                        </div>
                        {recording.transcript && !recording.processed && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnalyzeRecording(recording.id);
                            }}
                            disabled={analyzeRecordingMutation.isPending}
                            data-testid={`button-analyze-${recording.id}`}
                          >
                            Analizar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Mic className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay grabaciones aún</p>
              <p className="text-sm text-muted-foreground">Toca el botón de grabación para empezar</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary" data-testid="text-today-count">
              {todayRecordings.length}
            </div>
            <div className="text-xs text-muted-foreground">Hoy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent" data-testid="text-total-duration">
              {formatTime(totalDuration)}
            </div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500" data-testid="text-total-tasks">
              {totalTasks}
            </div>
            <div className="text-xs text-muted-foreground">Tareas</div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
