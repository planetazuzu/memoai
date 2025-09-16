import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Camera, Mic, Square, Play, Trash2, Save } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';

interface Photo {
  id: string;
  url: string;
  caption: string;
  timestamp: number;
}

interface PhotoCaptureProps {
  onPhotosCaptured: (photos: Photo[]) => void;
}

export function PhotoCapture({ onPhotosCaptured }: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentCaption, setCurrentCaption] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const {
    isRecording: isAudioRecording,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const {
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: speechSupported,
  } = useSpeechRecognition();

  // Effect to detect when video is ready
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setIsVideoReady(video.videoWidth > 0 && video.videoHeight > 0);
    };

    const handleCanPlay = () => {
      setIsVideoReady(video.videoWidth > 0 && video.videoHeight > 0);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [isCapturing]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Usar cámara trasera en móviles
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true // Añadir audio para las notas de voz
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
        
        toast({
          title: "Cámara iniciada",
          description: "La cámara está lista para capturar fotos",
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Error de cámara",
        description: `No se pudo acceder a la cámara: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    console.log('Capture photo clicked');
    console.log('Video ref:', videoRef.current);
    console.log('Canvas ref:', canvasRef.current);
    console.log('Video ready:', isVideoReady);
    console.log('Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
    
    if (!videoRef.current || !canvasRef.current) {
      console.error('Missing video or canvas ref');
      toast({
        title: "Error",
        description: "No se puede capturar la foto. Verifica que la cámara esté funcionando.",
        variant: "destructive",
      });
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      toast({
        title: "Error",
        description: "No se puede acceder al contexto del canvas.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Configurar canvas con las dimensiones del video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Dibujar el frame actual del video en el canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertir a blob
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const photo: Photo = {
            id: crypto.randomUUID(),
            url,
            caption: currentCaption || transcript || 'Sin descripción',
            timestamp: Date.now(),
          };
          
          setPhotos(prev => [...prev, photo]);
          setCurrentCaption('');
          resetTranscript();
          
          toast({
            title: "Foto capturada",
            description: "La foto se ha añadido a la colección",
          });
        } else {
          toast({
            title: "Error",
            description: "No se pudo procesar la foto capturada.",
            variant: "destructive",
          });
        }
      }, 'image/jpeg', 0.8);
    } catch (error) {
      console.error('Capture error:', error);
      toast({
        title: "Error de captura",
        description: `No se pudo capturar la foto: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const startVoiceNote = async () => {
    try {
      if (speechSupported) {
        startListening();
        setIsRecording(true);
        toast({
          title: "Escuchando",
          description: "Habla para añadir una descripción a la foto",
        });
      } else {
        toast({
          title: "No disponible",
          description: "El reconocimiento de voz no está disponible",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo iniciar el reconocimiento de voz",
        variant: "destructive",
      });
    }
  };

  const stopVoiceNote = () => {
    stopListening();
    setIsRecording(false);
    setCurrentCaption(transcript);
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === photoId);
      if (photo) {
        URL.revokeObjectURL(photo.url);
      }
      return prev.filter(p => p.id !== photoId);
    });
  };

  const savePhotos = () => {
    onPhotosCaptured(photos);
    setPhotos([]);
    stopCamera();
    toast({
      title: "Fotos guardadas",
      description: `${photos.length} fotos han sido guardadas`,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>Captura de Fotos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isCapturing ? (
            <Button onClick={startCamera} className="w-full">
              <Camera className="w-4 h-4 mr-2" />
              Iniciar Cámara
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover rounded-lg"
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={capturePhoto} 
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={!isVideoReady}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isVideoReady ? 'Capturar Foto' : 'Inicializando...'}
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  <Square className="w-4 h-4 mr-2" />
                  Detener
                </Button>
              </div>
              
              {!isVideoReady && (
                <p className="text-sm text-muted-foreground text-center">
                  {isCapturing ? 'Esperando a que la cámara se inicialice...' : 'Inicia la cámara para capturar fotos'}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="caption">Descripción de la foto</Label>
                <div className="flex space-x-2">
                  <Input
                    id="caption"
                    value={currentCaption || transcript}
                    onChange={(e) => setCurrentCaption(e.target.value)}
                    placeholder="Describe la foto o usa el micrófono..."
                  />
                  <Button
                    onClick={isRecording ? stopVoiceNote : startVoiceNote}
                    variant={isRecording ? "destructive" : "outline"}
                    size="icon"
                  >
                    {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                </div>
                {transcript && (
                  <p className="text-sm text-muted-foreground">
                    Transcripción: {transcript}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fotos Capturadas ({photos.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <Button
                      onClick={() => removePhoto(photo.id)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {photo.caption}
                  </p>
                </div>
              ))}
            </div>
            
            <Button onClick={savePhotos} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Guardar Fotos
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
