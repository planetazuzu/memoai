// Rutas para configuración de IA
import { Router } from 'express';
import { aiService } from '../services/ai-service';
import { setActiveProvider } from '../config/ai-providers';

const router = Router();

// Obtener proveedores disponibles
router.get('/providers', (req, res) => {
  try {
    const providers = aiService.getAllProviders();
    const activeProvider = aiService.getActiveProviderInfo();
    
    res.json({
      providers,
      activeProvider
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get providers' });
  }
});

// Cambiar proveedor activo
router.post('/providers/:providerName', (req, res) => {
  try {
    const { providerName } = req.params;
    const success = setActiveProvider(providerName);
    
    if (success) {
      res.json({ 
        message: `Provider changed to ${providerName}`,
        activeProvider: aiService.getActiveProviderInfo()
      });
    } else {
      res.status(400).json({ error: 'Invalid provider name' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to change provider' });
  }
});

// Probar proveedor actual
router.post('/test', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await aiService.generateChatResponse(message);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to test AI provider' });
  }
});

export default router;
