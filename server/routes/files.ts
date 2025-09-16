import { Router } from 'express';
import { fileManager } from '../services/file-manager';

const router = Router();

// Obtener estadísticas de almacenamiento
router.get('/stats', async (req, res) => {
  try {
    const stats = await fileManager.getStorageStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting storage stats:', error);
    res.status(500).json({ error: 'Failed to get storage stats' });
  }
});

// Listar archivos en un directorio
router.get('/list/:directory', async (req, res) => {
  try {
    const { directory } = req.params;
    const files = await fileManager.listFiles(directory);
    res.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Crear backup
router.post('/backup', async (req, res) => {
  try {
    const { data, filename } = req.body;
    const backupUrl = await fileManager.createBackup(data, filename);
    res.json({ url: backupUrl });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Exportar datos
router.post('/export', async (req, res) => {
  try {
    const { data, format, filename } = req.body;
    const exportUrl = await fileManager.exportData(data, format, filename);
    res.json({ url: exportUrl });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Eliminar archivo
router.delete('/:directory/:filename', async (req, res) => {
  try {
    const { directory, filename } = req.params;
    const success = await fileManager.deleteFile(directory, filename);
    
    if (success) {
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
