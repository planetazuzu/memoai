import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, Clock, Calendar, Mic, Users, User, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Recording } from '@shared/schema';

interface SearchResult {
  id: string;
  type: 'recording' | 'task' | 'diary';
  title: string;
  content: string;
  date: string;
  recordingId?: string;
  priority?: 'low' | 'medium' | 'high';
  completed?: boolean;
  score?: number;
}

export function GlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all recordings for search
  const { data: recordings = [] } = useQuery<Recording[]>({
    queryKey: ['/api/recordings'],
  });

  // Perform search with debouncing
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results: SearchResult[] = [];
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

    // Search in recordings with multiple terms
    recordings.forEach(recording => {
      const searchText = `${recording.title} ${recording.transcript || ''} ${recording.summary || ''}`.toLowerCase();
      const matchesAllTerms = searchTerms.every(term => searchText.includes(term));
      
      if (matchesAllTerms) {
        // Calculate relevance score
        let score = 0;
        if (recording.title.toLowerCase().includes(query.toLowerCase())) score += 10;
        if (recording.summary?.toLowerCase().includes(query.toLowerCase())) score += 5;
        if (recording.transcript?.toLowerCase().includes(query.toLowerCase())) score += 3;
        
        results.push({
          id: recording.id,
          type: 'recording',
          title: recording.title,
          content: recording.summary || recording.transcript?.substring(0, 200) + '...' || 'Sin contenido',
          date: recording.createdAt.toString(),
          recordingId: recording.id,
          score, // Add score for sorting
        });
      }

      // Search in tasks
      if (recording.tasks) {
        recording.tasks.forEach(task => {
          const taskText = `${task.title} ${task.description}`.toLowerCase();
          if (taskText.includes(query.toLowerCase())) {
            results.push({
              id: task.id,
              type: 'task',
              title: task.title,
              content: task.description,
              date: recording.createdAt.toString(),
              recordingId: recording.id,
              priority: task.priority,
              completed: task.completed,
            });
          }
        });
      }

      // Search in diary entries
      if (recording.diaryEntry) {
        const diaryText = recording.diaryEntry.toLowerCase();
        if (diaryText.includes(query.toLowerCase())) {
          results.push({
            id: `${recording.id}-diary`,
            type: 'diary',
            title: `Diario - ${recording.title}`,
            content: recording.diaryEntry.substring(0, 200) + '...',
            date: recording.createdAt.toString(),
            recordingId: recording.id,
          });
        }
      }
    });

    // Sort by relevance score first, then by date
    results.sort((a, b) => {
      if (a.score !== undefined && b.score !== undefined) {
        if (a.score !== b.score) return b.score - a.score;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    setSearchResults(results);
    setIsSearching(false);
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, recordings]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recording': return <Mic className="w-4 h-4" />;
      case 'task': return <CheckCircle className="w-4 h-4" />;
      case 'diary': return <FileText className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'recording': return 'default';
      case 'task': return 'secondary';
      case 'diary': return 'outline';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
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

  const handleResultClick = (result: SearchResult) => {
    // Navigate to the appropriate page based on result type
    console.log('Navigate to:', result);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Búsqueda Global</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en grabaciones, tareas y diario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Search Results */}
          <ScrollArea className="max-h-96">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-muted-foreground">Buscando...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        {getTypeIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium truncate">{result.title}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant={getTypeColor(result.type)} className="text-xs">
                              {result.type === 'recording' ? 'Grabación' : 
                               result.type === 'task' ? 'Tarea' : 'Diario'}
                            </Badge>
                            {result.priority && (
                              <Badge variant={getPriorityColor(result.priority)} className="text-xs">
                                {result.priority}
                              </Badge>
                            )}
                            {result.completed !== undefined && (
                              <div className="flex items-center space-x-1">
                                {result.completed ? (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : (
                                  <AlertCircle className="w-3 h-3 text-orange-500" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {result.content}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(result.date)}</span>
                          </div>
                          {result.type === 'recording' && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Grabación</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron resultados</p>
                <p className="text-sm text-muted-foreground">
                  Intenta con otros términos de búsqueda
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Escribe para buscar</p>
                <p className="text-sm text-muted-foreground">
                  Busca en grabaciones, tareas y entradas de diario
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Search Stats */}
          {searchResults.length > 0 && (
            <div className="text-xs text-muted-foreground text-center">
              {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
