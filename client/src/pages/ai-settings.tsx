// Página de configuración de IA
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Bot, CheckCircle, AlertCircle, Settings } from 'lucide-react';

interface AIProvider {
  name: string;
  type: string;
  enabled: boolean;
  hasConfig: boolean;
}

export default function AISettingsPage() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [activeProvider, setActiveProvider] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('Hola, ¿cómo estás?');
  const [testResponse, setTestResponse] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const response = await apiRequest('GET', '/api/ai-config/providers');
      setProviders(response.providers);
      setActiveProvider(response.activeProvider);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los proveedores de IA",
        variant: "destructive",
      });
    }
  };

  const changeProvider = async (providerName: string) => {
    try {
      setLoading(true);
      await apiRequest('POST', `/api/ai-config/providers/${providerName}`);
      await loadProviders();
      toast({
        title: "Proveedor cambiado",
        description: `Ahora usando ${providerName}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar el proveedor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testProvider = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/ai-config/test', {
        message: testMessage
      });
      setTestResponse(response.response);
      toast({
        title: "Prueba exitosa",
        description: "El proveedor de IA está funcionando",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo probar el proveedor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6 pb-24">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <Bot className="w-5 h-5" />
          <span>Configuración de IA</span>
        </h2>

        {/* Proveedor activo */}
        {activeProvider && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Proveedor Activo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{activeProvider.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Tipo: {activeProvider.type}
                  </p>
                </div>
                <Badge variant="default">Activo</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de proveedores */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Proveedores Disponibles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {providers.map((provider) => (
              <div
                key={provider.type}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Bot className="w-5 h-5" />
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {provider.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {provider.hasConfig ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  <Button
                    size="sm"
                    onClick={() => changeProvider(provider.type)}
                    disabled={loading || provider.enabled}
                  >
                    {provider.enabled ? 'Activo' : 'Activar'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Prueba del proveedor */}
        <Card>
          <CardHeader>
            <CardTitle>Probar Proveedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Mensaje de prueba
              </label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full p-2 border rounded-lg"
                placeholder="Escribe un mensaje para probar..."
              />
            </div>
            <Button onClick={testProvider} disabled={loading}>
              {loading ? 'Probando...' : 'Probar'}
            </Button>
            {testResponse && (
              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-sm font-medium mb-1">Respuesta:</p>
                <p className="text-sm">{testResponse}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
