import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Search, Calendar, Clock, Filter, Play, Download, Trash2, Users, User, Mic, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Recording } from '@shared/schema';

export default function History() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all recordings
  const { data: recordings = [], isLoading, refetch } = useQuery<Recording[]>({
    queryKey: ['/api/recordings'],
  });

  // Delete recording mutation
  const deleteRecordingMutation = useMutation({
    mutationFn: async (recordingId: string) => {
      return apiRequest('DELETE', `/api/recordings/${recordingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
      toast({
        title: "Grabación eliminada",
        description: "La grabación se ha eliminado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la grabación",
        variant: "destructive",
      });
    },
  });

  // Filter recordings based on search and filters
  const filteredRecordings = recordings.filter(recording => {
    const matchesSearch = recording.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recording.transcript?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recording.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || recording.metadata?.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'processed' && recording.processed) ||
                         (statusFilter === 'transcribed' && recording.transcript && !recording.processed) ||
                         (statusFilter === 'pending' && !recording.transcript);
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const recordingDate = new Date(recording.createdAt);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = recordingDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = recordingDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = recordingDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Users className="w-4 h-4 text-primary" />;
      case 'call': return <User className="w-4 h-4 text-accent" />;
      default: return <Mic className="w-4 h-4 text-green-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'meeting': return 'Reunión';
      case 'call': return 'Llamada';
      case 'note': return 'Nota';
      default: return 'Otro';
    }
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

  const getStatusLabel = (recording: Recording) => {
    if (recording.processed) return 'Procesado';
    if (recording.transcript) return 'Transcrito';
    return 'Pendiente';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    if (d.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return d.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('es-ES', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupRecordingsByDate = (recordings: Recording[]) => {
    const groups: { [key: string]: Recording[] } = {};
    
    recordings.forEach(recording => {
      const dateKey = new Date(recording.createdAt).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(recording);
    });
    
    return groups;
  };

  const groupedRecordings = groupRecordingsByDate(filteredRecordings);

  const handleDeleteRecording = (recordingId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta grabación?')) {
      deleteRecordingMutation.mutate(recordingId);
    }
  };

  const handlePlayRecording = (recording: Recording) => {
    if (recording.audioUrl) {
      // In a real implementation, you would play the audio
      console.log('Playing recording:', recording.audioUrl);
      toast({
        title: "Reproduciendo",
        description: "Reproduciendo grabación...",
      });
    } else {
      toast({
        title: "Audio no disponible",
        description: "No hay archivo de audio para esta grabación",
        variant: "destructive",
      });
    }
  };

  const handleDownloadRecording = (recording: Recording) => {
    if (recording.audioUrl) {
      // In a real implementation, you would download the audio
      console.log('Downloading recording:', recording.audioUrl);
      toast({
        title: "Descargando",
        description: "Descargando grabación...",
      });
    } else {
      toast({
        title: "Audio no disponible",
        description: "No hay archivo de audio para esta grabación",
        variant: "destructive",
      });
    }
  };

  const totalDuration = recordings.reduce((acc, r) => acc + r.duration, 0);
  const processedCount = recordings.filter(r => r.processed).length;
  const transcribedCount = recordings.filter(r => r.transcript && !r.processed).length;

  return (
    <div className="px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Historial</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            data-testid="button-refresh"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{recordings.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">{formatTime(totalDuration)}</div>
              <div className="text-xs text-muted-foreground">Duración</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{processedCount}</div>
              <div className="text-xs text-muted-foreground">Procesados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">{transcribedCount}</div>
              <div className="text-xs text-muted-foreground">Transcritos</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar grabaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex space-x-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-24">
                <Filter className="w-4 h-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tipo</SelectItem>
                <SelectItem value="meeting">Reunión</SelectItem>
                <SelectItem value="call">Llamada</SelectItem>
                <SelectItem value="note">Nota</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Estado</SelectItem>
                <SelectItem value="processed">Procesado</SelectItem>
                <SelectItem value="transcribed">Transcrito</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-24">
                <Calendar className="w-4 h-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Fecha</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Recordings Timeline */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : Object.keys(groupedRecordings).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedRecordings).map(([dateKey, recordings]) => (
            <div key={dateKey}>
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium text-sm text-muted-foreground">
                  {formatDate(recordings[0].createdAt)}
                </h3>
              </div>
              <div className="space-y-3">
                {recordings.map((recording) => (
                  <Card key={recording.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          {getTypeIcon(recording.metadata?.type || 'other')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium truncate">{recording.title}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(recording.metadata?.type || 'other')}
                              </Badge>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(recording)}
                                <span className="text-xs text-muted-foreground">
                                  {getStatusLabel(recording)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {recording.summary || recording.transcript?.substring(0, 100) + '...' || 'Sin contenido disponible'}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(recording.duration)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDateTime(recording.createdAt)}</span>
                              </div>
                              {recording.tasks && recording.tasks.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <span>{recording.tasks.length} tareas</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handlePlayRecording(recording)}
                                data-testid={`button-play-${recording.id}`}
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleDownloadRecording(recording)}
                                data-testid={`button-download-${recording.id}`}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteRecording(recording.id)}
                                data-testid={`button-delete-${recording.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay grabaciones</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No se encontraron grabaciones con ese criterio' : 'Las grabaciones aparecerán aquí'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
