import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, Calendar, BookOpen, Clock, Filter, RefreshCw } from 'lucide-react';
import { Recording } from '@shared/schema';

interface DiaryEntry {
  id: string;
  content: string;
  date: string;
  recordingId: string;
  recordingTitle: string;
  type: 'meeting' | 'call' | 'note' | 'other';
}

export default function Diary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Fetch all recordings to extract diary entries
  const { data: recordings = [], isLoading, refetch } = useQuery<Recording[]>({
    queryKey: ['/api/recordings'],
  });

  // Extract diary entries from recordings
  const diaryEntries: DiaryEntry[] = recordings
    .filter(recording => recording.diaryEntry)
    .map(recording => ({
      id: recording.id,
      content: recording.diaryEntry!,
      date: recording.createdAt.toString(),
      recordingId: recording.id,
      recordingTitle: recording.title,
      type: recording.metadata?.type || 'other',
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter entries based on search and filters
  const filteredEntries = diaryEntries.filter(entry => {
    const matchesSearch = entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.recordingTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || entry.type === typeFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const entryDate = new Date(entry.date);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = entryDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = entryDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = entryDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'default';
      case 'call': return 'secondary';
      case 'note': return 'outline';
      default: return 'destructive';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const groupEntriesByDate = (entries: DiaryEntry[]) => {
    const groups: { [key: string]: DiaryEntry[] } = {};
    
    entries.forEach(entry => {
      const dateKey = new Date(entry.date).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });
    
    return groups;
  };

  const groupedEntries = groupEntriesByDate(filteredEntries);

  return (
    <div className="px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Diario Personal</h2>
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
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{diaryEntries.length}</div>
              <div className="text-xs text-muted-foreground">Entradas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">
                {new Set(diaryEntries.map(e => new Date(e.date).toDateString())).size}
              </div>
              <div className="text-xs text-muted-foreground">Días</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {diaryEntries.filter(e => e.type === 'meeting').length}
              </div>
              <div className="text-xs text-muted-foreground">Reuniones</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en el diario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="meeting">Reuniones</SelectItem>
              <SelectItem value="call">Llamadas</SelectItem>
              <SelectItem value="note">Notas</SelectItem>
              <SelectItem value="other">Otros</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Diary Entries */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : Object.keys(groupedEntries).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedEntries).map(([dateKey, entries]) => (
            <div key={dateKey}>
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium text-sm text-muted-foreground">
                  {formatDate(entries[0].date)}
                </h3>
              </div>
              <div className="space-y-3">
                {entries.map((entry) => (
                  <Card key={entry.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getTypeColor(entry.type)} className="text-xs">
                            {getTypeLabel(entry.type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(entry.date)}
                          </span>
                        </div>
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                      </div>
                      
                      <div className="mb-3">
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">
                          {entry.recordingTitle}
                        </h4>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {entry.content}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Generado automáticamente</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            // Navigate to recording details
                            console.log('Navigate to recording:', entry.recordingId);
                          }}
                        >
                          Ver grabación
                        </Button>
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
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay entradas de diario</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No se encontraron entradas con ese criterio' : 'Las entradas se generarán automáticamente después del análisis IA'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
