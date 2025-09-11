import { Router } from 'express';
import { TTSService } from '../services/tts.js';
import { db } from '../database/sqlite.js';
import path from 'path';

export const ttsRoutes = Router();

// Initialize TTS service
TTSService.initialize().catch(console.error);

/**
 * Convert text to speech
 */
ttsRoutes.post('/convert', async (req, res) => {
  try {
    const { text, voice } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 2000) {
      return res.status(400).json({ error: 'Text too long. Maximum 2000 characters.' });
    }

    console.log(`TTS conversion requested: ${text.substring(0, 100)}...`);

    const result = await TTSService.textToSpeech(text, { voice });

    if (result.success && result.audioPath) {
      const filename = path.basename(result.audioPath);
      res.json({
        success: true,
        audioUrl: `/api/tts/audio/${filename}`,
        message: 'Text converted to speech successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'TTS conversion failed'
      });
    }

  } catch (error) {
    console.error('TTS convert error:', error);
    res.status(500).json({ 
      success: false,
      error: 'TTS conversion failed: ' + (error instanceof Error ? error.message : 'Unknown error') 
    });
  }
});

/**
 * Convert video summary to speech
 */
ttsRoutes.post('/convert-summary/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { voice } = req.body;

    // Get video from database
    const video = await new Promise<any>((resolve, reject) => {
      db.get('SELECT * FROM videos WHERE id = ?', [videoId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (!video.summary || video.summary.length < 10) {
      return res.status(400).json({ error: 'No summary available for this video' });
    }

    console.log(`Converting summary to speech for video ${videoId}`);

    const result = await TTSService.convertSummaryToSpeech(video.summary, { voice });

    if (result.success && result.audioPath) {
      const filename = path.basename(result.audioPath);
      res.json({
        success: true,
        audioUrl: `/api/tts/audio/${filename}`,
        videoTitle: video.title,
        summaryLength: video.summary.length,
        message: 'Summary converted to speech successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Summary TTS conversion failed'
      });
    }

  } catch (error) {
    console.error('Summary TTS error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Summary TTS failed: ' + (error instanceof Error ? error.message : 'Unknown error') 
    });
  }
});

/**
 * Serve audio files
 */
ttsRoutes.get('/audio/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (!filename.match(/^(tts_|edge_tts_)\d+\.wav$/)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const audioPath = path.join(process.cwd(), 'audio-output', filename);
    
    // Check if file exists
    try {
      await import('fs').then(fs => fs.promises.access(audioPath));
    } catch {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    // Set proper headers for audio streaming
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send file with proper error handling
    res.sendFile(audioPath, {
      headers: {
        'Content-Type': 'audio/wav',
        'Accept-Ranges': 'bytes'
      }
    }, (err) => {
      if (err && !res.headersSent) {
        console.error('Error serving audio file:', err);
        if ((err as any).code === 'ENOENT') {
          res.status(404).json({ error: 'Audio file not found' });
        } else {
          res.status(500).json({ error: 'Failed to serve audio file' });
        }
      }
    });

  } catch (error) {
    console.error('Audio serve error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to serve audio file' });
    }
  }
});

/**
 * Get available voices (Edge TTS voices)
 */
ttsRoutes.get('/voices', async (req, res) => {
  try {
    const voices = await TTSService.getAvailableVoices();
    
    res.json({
      voices: voices,
      default: 'en-US-JennyNeural',
      message: 'Edge TTS voices with character and personality'
    });
  } catch (error) {
    console.error('Get voices error:', error);
    // Fallback to popular voices
    const popularVoices = TTSService.getPopularVoices();
    res.json({
      voices: popularVoices,
      default: 'en-US-JennyNeural',
      message: 'Popular Edge TTS voices (cached)'
    });
  }
});

/**
 * Test TTS with sample text
 */
ttsRoutes.post('/test', async (req, res) => {
  try {
    const sampleText = "Hello! This is a test of the text-to-speech system. The voice synthesis is working correctly.";
    
    const result = await TTSService.textToSpeech(sampleText);

    if (result.success && result.audioPath) {
      const filename = path.basename(result.audioPath);
      res.json({
        success: true,
        audioUrl: `/api/tts/audio/${filename}`,
        sampleText,
        message: 'TTS test successful'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'TTS test failed'
      });
    }

  } catch (error) {
    console.error('TTS test error:', error);
    res.status(500).json({ 
      success: false,
      error: 'TTS test failed: ' + (error instanceof Error ? error.message : 'Unknown error') 
    });
  }
});

/**
 * Cleanup old audio files
 */
ttsRoutes.post('/cleanup', async (req, res) => {
  try {
    const { maxAgeHours = 24 } = req.body;
    
    await TTSService.cleanupOldFiles(maxAgeHours);
    
    res.json({
      success: true,
      message: `Cleaned up audio files older than ${maxAgeHours} hours`
    });

  } catch (error) {
    console.error('TTS cleanup error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Cleanup failed: ' + (error instanceof Error ? error.message : 'Unknown error') 
    });
  }
});