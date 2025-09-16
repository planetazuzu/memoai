import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Camera, Search, Filter, Calendar, MapPin, Mic } from 'lucide-react';
import { PhotoCapture } from '@/components/photo-capture';
import { CameraDiagnostics } from '@/components/camera-diagnostics';
import { Recording } from '@shared/schema';

interface Photo {
  id: string;
  url: string;
  caption: string;
  timestamp: number;
  location?: string;
}

export default function PhotosPage() {
  const [showCapture, setShowCapture] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch recordings with photos
  const { data: recordings = [], isLoading } = useQuery<Recording[]>({
    queryKey: ['/api/recordings'],
  });

  // Extract all photos from recordings
  const allPhotos = recordings
    .filter(recording => recording.photos && recording.photos.length > 0)
    .flatMap(recording => 
      recording.photos.map(photo => ({
        ...photo,
        recordingTitle: recording.title,
        recordingDate: recording.createdAt,
      }))
    )
    .filter(photo => 
      searchQuery === '' || 
      photo.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.recordingTitle.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.timestamp - a.timestamp);

  const handlePhotosCaptured = async (photos: Photo[]) => {
    try {
      // Create a new recording with photos
      const recordingData = {
        title: `Fotos - ${new Date().toLocaleString('es-ES')}`,
        duration: 0,
        transcript: photos.map(p => p.caption).join(' '),
        metadata: JSON.stringify({ type: 'photo' }),
        photos: JSON.stringify(photos),
      };

      await apiRequest('POST', '/api/recordings', recordingData);
      
      setShowCapture(false);
    } catch (error) {
      console.error('Error saving photos:', error);
    }
  };

  if (showCapture) {
    return (
      <div className="px-4 py-6 pb-24">
        <div className="mb-6">
          <Button 
            onClick={() => setShowCapture(false)}
            variant="outline"
            className="mb-4"
          >
            ← Volver
          </Button>
          <h2 className="text-xl font-semibold">Capturar Fotos</h2>
        </div>
        <PhotoCapture onPhotosCaptured={handlePhotosCaptured} />
      </div>
    );
  }

  if (showDiagnostics) {
    return (
      <div className="px-4 py-6 pb-24">
        <div className="mb-6">
          <Button 
            onClick={() => setShowDiagnostics(false)}
            variant="outline"
            className="mb-4"
          >
            ← Volver
          </Button>
          <h2 className="text-xl font-semibold">Diagnóstico de Cámara</h2>
        </div>
        <CameraDiagnostics />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-24">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Fotos</h2>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setShowDiagnostics(true)}
              variant="outline"
            >
              <Camera className="w-4 h-4 mr-2" />
              Diagnóstico
            </Button>
            <Button onClick={() => setShowCapture(true)}>
              <Camera className="w-4 h-4 mr-2" />
              Capturar
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar fotos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{allPhotos.length}</div>
              <div className="text-sm text-muted-foreground">Total Fotos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {recordings.filter(r => r.photos && r.photos.length > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Sesiones</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(allPhotos.map(p => new Date(p.timestamp).toDateString())).size}
              </div>
              <div className="text-sm text-muted-foreground">Días</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Photos Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-muted-foreground mt-2">Cargando fotos...</p>
        </div>
      ) : allPhotos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay fotos</h3>
            <p className="text-muted-foreground mb-4">
              Captura tu primera foto con notas de voz
            </p>
            <Button onClick={() => setShowCapture(true)}>
              <Camera className="w-4 h-4 mr-2" />
              Capturar Fotos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {allPhotos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs">
                    {new Date(photo.timestamp).toLocaleDateString('es-ES')}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium mb-1">{photo.recordingTitle}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {photo.caption}
                </p>
                {photo.location && (
                  <div className="flex items-center mt-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 mr-1" />
                    {photo.location}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
