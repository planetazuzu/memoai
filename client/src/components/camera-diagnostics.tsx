import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export function CameraDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // Test 1: Navigator support
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      results.push({
        test: 'Soporte de MediaDevices',
        status: 'pass',
        message: 'Tu navegador soporta acceso a la cámara',
        details: `getUserMedia disponible: ${!!navigator.mediaDevices.getUserMedia}`
      });
    } else {
      results.push({
        test: 'Soporte de MediaDevices',
        status: 'fail',
        message: 'Tu navegador NO soporta acceso a la cámara',
        details: 'Usa Chrome, Firefox o Safari para mejor compatibilidad'
      });
    }

    // Test 2: HTTPS check
    if (location.protocol === 'https:') {
      results.push({
        test: 'Conexión Segura (HTTPS)',
        status: 'pass',
        message: 'Estás usando HTTPS',
        details: 'La cámara funciona mejor con conexiones seguras'
      });
    } else if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      results.push({
        test: 'Conexión Segura (HTTPS)',
        status: 'warning',
        message: 'Estás en localhost (OK para desarrollo)',
        details: 'En producción, usa HTTPS para mejor compatibilidad'
      });
    } else {
      results.push({
        test: 'Conexión Segura (HTTPS)',
        status: 'fail',
        message: 'No estás usando HTTPS',
        details: 'La cámara requiere HTTPS en producción'
      });
    }

    // Test 3: Camera permissions
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      results.push({
        test: 'Permisos de Cámara',
        status: permissionStatus.state === 'granted' ? 'pass' : 
                permissionStatus.state === 'denied' ? 'fail' : 'warning',
        message: `Estado de permisos: ${permissionStatus.state}`,
        details: permissionStatus.state === 'granted' ? 
          'Tienes permisos para usar la cámara' :
          permissionStatus.state === 'denied' ?
          'Los permisos de cámara están denegados' :
          'Los permisos de cámara no han sido solicitados'
      });
    } catch (error) {
      results.push({
        test: 'Permisos de Cámara',
        status: 'warning',
        message: 'No se pudo verificar permisos',
        details: 'Algunos navegadores no soportan la API de permisos'
      });
    }

    // Test 4: Available devices
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length > 0) {
        results.push({
          test: 'Dispositivos de Cámara',
          status: 'pass',
          message: `${videoDevices.length} cámara(s) detectada(s)`,
          details: videoDevices.map(device => 
            `${device.label || 'Cámara sin nombre'} (${device.deviceId.slice(0, 8)}...)`
          ).join(', ')
        });
      } else {
        results.push({
          test: 'Dispositivos de Cámara',
          status: 'fail',
          message: 'No se detectaron cámaras',
          details: 'Verifica que tengas una cámara conectada y funcionando'
        });
      }
    } catch (error) {
      results.push({
        test: 'Dispositivos de Cámara',
        status: 'fail',
        message: 'Error al detectar cámaras',
        details: `Error: ${error.message}`
      });
    }

    // Test 5: Browser compatibility
    const userAgent = navigator.userAgent;
    let browserStatus: 'pass' | 'warning' | 'fail' = 'warning';
    let browserMessage = 'Navegador no identificado';
    
    if (userAgent.includes('Chrome')) {
      browserStatus = 'pass';
      browserMessage = 'Chrome detectado (Excelente compatibilidad)';
    } else if (userAgent.includes('Firefox')) {
      browserStatus = 'pass';
      browserMessage = 'Firefox detectado (Buena compatibilidad)';
    } else if (userAgent.includes('Safari')) {
      browserStatus = 'pass';
      browserMessage = 'Safari detectado (Buena compatibilidad)';
    } else if (userAgent.includes('Edge')) {
      browserStatus = 'warning';
      browserMessage = 'Edge detectado (Compatibilidad limitada)';
    } else {
      browserStatus = 'warning';
      browserMessage = 'Navegador no soportado oficialmente';
    }

    results.push({
      test: 'Compatibilidad del Navegador',
      status: browserStatus,
      message: browserMessage,
      details: `User Agent: ${userAgent}`
    });

    setDiagnostics(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge variant="default" className="bg-green-500">PASS</Badge>;
      case 'fail':
        return <Badge variant="destructive">FAIL</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500">WARN</Badge>;
      default:
        return <Badge variant="outline">UNKNOWN</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Camera className="w-5 h-5" />
          <span>Diagnóstico de Cámara</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Ejecutando diagnósticos...' : 'Ejecutar Diagnósticos'}
        </Button>

        {diagnostics.length > 0 && (
          <div className="space-y-3">
            {diagnostics.map((result, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                {getStatusIcon(result.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{result.test}</h4>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.message}
                  </p>
                  {result.details && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
