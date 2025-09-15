// Rutas para procesar grabaciones pendientes
import { Router } from 'express';
import { getStorage } from '../storage';
import { aiService } from '../services/ai-service';

const router = Router();

// Procesar todas las grabaciones pendientes
router.post('/pending', async (req, res) => {
  try {
    const storage = await getStorage();
    const recordings = await storage.getAllRecordings();
    
    const pendingRecordings = recordings.filter(r => !r.processed);
    
    for (const recording of pendingRecordings) {
      try {
        // Procesar con IA
        const analysis = await aiService.analyzeTranscript(
          recording.transcript || 'Transcripción no disponible',
          recording.title
        );
        
        // Actualizar grabación
        await storage.updateRecording(recording.id, {
          summary: analysis.summary,
          tasks: analysis.tasks,
          diaryEntry: analysis.diaryEntry,
          processed: true
        });
        
        console.log(`Procesada grabación: ${recording.id}`);
      } catch (error) {
        console.error(`Error procesando grabación ${recording.id}:`, error);
      }
    }
    
    res.json({ 
      message: `Procesadas ${pendingRecordings.length} grabaciones`,
      processed: pendingRecordings.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process recordings' });
  }
});

// Procesar una grabación específica
router.post('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const storage = await getStorage();
    const recording = await storage.getRecording(id);
    
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    
    // Procesar con IA
    const analysis = await aiService.analyzeTranscript(
      recording.transcript || 'Transcripción no disponible',
      recording.title
    );
    
    // Actualizar grabación
    await storage.updateRecording(id, {
      summary: analysis.summary,
      tasks: analysis.tasks,
      diaryEntry: analysis.diaryEntry,
      processed: true
    });
    
    res.json({ 
      message: 'Recording processed successfully',
      recording: await storage.getRecording(id)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process recording' });
  }
});

export default router;
