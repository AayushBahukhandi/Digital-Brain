import { Router } from 'express';
import multer from 'multer';
import { VoiceNotesService } from '../services/voice-notes';
import { db } from '../database/sqlite';
export const voiceNotesRoutes = Router();
// Initialize voice notes service
VoiceNotesService.initialize().catch(console.error);
// Configure multer for audio file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept audio files
        if (file.mimetype.startsWith('audio/') || file.originalname.match(/\.(wav|mp3|m4a|ogg|webm)$/i)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only audio files are allowed'));
        }
    }
});
/**
 * Upload and process audio file as voice note
 */
voiceNotesRoutes.post('/upload', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }
        console.log(`Processing uploaded audio: ${req.file.originalname} (${req.file.size} bytes)`);
        const result = await VoiceNotesService.processAudioFile(req.file.buffer, req.file.originalname);
        if (result.success && result.voiceNote) {
            // Save voice note to database
            const stmt = db.prepare(`
        INSERT INTO voice_notes (id, filename, transcript, summary, tags, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
            const tagsString = result.voiceNote.tags.join(',');
            stmt.run([
                result.voiceNote.id,
                result.voiceNote.filename,
                result.voiceNote.transcript,
                result.voiceNote.summary,
                tagsString,
                result.voiceNote.createdAt.toISOString()
            ], function (err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to save voice note' });
                }
                console.log(`Voice note saved with ID: ${result.voiceNote.id}`);
                res.json({
                    success: true,
                    voiceNote: {
                        ...result.voiceNote,
                        audioUrl: `/api/voice-notes/audio/${result.voiceNote.filename}`
                    },
                    message: 'Voice note processed successfully'
                });
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: result.error || 'Voice note processing failed'
            });
        }
    }
    catch (error) {
        console.error('Voice note upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error')
        });
    }
});
/**
 * Get all voice notes
 */
voiceNotesRoutes.get('/', (req, res) => {
    db.all('SELECT * FROM voice_notes ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch voice notes' });
        }
        const voiceNotes = rows.map((row) => ({
            ...row,
            tags: row.tags ? row.tags.split(',') : [],
            audioUrl: `/api/voice-notes/audio/${row.filename}`,
            createdAt: new Date(row.created_at)
        }));
        res.json(voiceNotes);
    });
});
/**
 * Get specific voice note
 */
voiceNotesRoutes.get('/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM voice_notes WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch voice note' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Voice note not found' });
        }
        const voiceNote = {
            ...row,
            tags: row.tags ? row.tags.split(',') : [],
            audioUrl: `/api/voice-notes/audio/${row.filename}`,
            createdAt: new Date(row.created_at)
        };
        res.json(voiceNote);
    });
});
/**
 * Serve audio files
 */
voiceNotesRoutes.get('/audio/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        // Validate filename to prevent directory traversal
        if (!filename.match(/^(recording_|upload_)\d+\.wav$/)) {
            return res.status(400).json({ error: 'Invalid filename' });
        }
        const audioPath = VoiceNotesService.getAudioPath(filename);
        // Check if file exists
        try {
            await import('fs').then(fs => fs.promises.access(audioPath));
        }
        catch {
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
                if (err.code === 'ENOENT') {
                    res.status(404).json({ error: 'Audio file not found' });
                }
                else {
                    res.status(500).json({ error: 'Failed to serve audio file' });
                }
            }
        });
    }
    catch (error) {
        console.error('Audio serve error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to serve audio file' });
        }
    }
});
/**
 * Delete voice note
 */
voiceNotesRoutes.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Get voice note to find filename
        const voiceNote = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM voice_notes WHERE id = ?', [id], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
        if (!voiceNote) {
            return res.status(404).json({ error: 'Voice note not found' });
        }
        // Delete from database
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM voice_notes WHERE id = ?', [id], function (err) {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        // Delete audio file
        await VoiceNotesService.deleteAudioFile(voiceNote.filename);
        res.json({ message: 'Voice note deleted successfully' });
    }
    catch (error) {
        console.error('Delete voice note error:', error);
        res.status(500).json({ error: 'Failed to delete voice note' });
    }
});
/**
 * Update voice note tags
 */
voiceNotesRoutes.put('/:id/tags', (req, res) => {
    const { id } = req.params;
    const { tags } = req.body;
    const tagsString = Array.isArray(tags) ? tags.join(',') : tags || '';
    db.run('UPDATE voice_notes SET tags = ? WHERE id = ?', [tagsString, id], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update voice note tags' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Voice note not found' });
        }
        res.json({ message: 'Voice note tags updated successfully' });
    });
});
/**
 * Start recording (placeholder for client-side recording)
 */
voiceNotesRoutes.post('/start-recording', async (req, res) => {
    try {
        const { duration } = req.body;
        const result = await VoiceNotesService.startRecording({ duration });
        if (result.success) {
            res.json({
                success: true,
                recordingId: result.recordingId,
                message: 'Recording session initiated. Use client-side recording and upload the result.'
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: result.error || 'Failed to start recording'
            });
        }
    }
    catch (error) {
        console.error('Start recording error:', error);
        res.status(500).json({
            success: false,
            error: 'Recording start failed: ' + (error instanceof Error ? error.message : 'Unknown error')
        });
    }
});
/**
 * Cleanup old recordings
 */
voiceNotesRoutes.post('/cleanup', async (req, res) => {
    try {
        const { maxAgeHours = 48 } = req.body;
        await VoiceNotesService.cleanupOldRecordings(maxAgeHours);
        res.json({
            success: true,
            message: `Cleaned up recordings older than ${maxAgeHours} hours`
        });
    }
    catch (error) {
        console.error('Voice notes cleanup error:', error);
        res.status(500).json({
            success: false,
            error: 'Cleanup failed: ' + (error instanceof Error ? error.message : 'Unknown error')
        });
    }
});
/**
 * Get voice notes statistics
 */
voiceNotesRoutes.get('/stats/overview', (req, res) => {
    db.serialize(() => {
        let stats = {
            totalNotes: 0,
            totalDuration: 0,
            averageLength: 0,
            topTags: []
        };
        // Get total count
        db.get('SELECT COUNT(*) as count FROM voice_notes', (err, row) => {
            if (!err && row) {
                stats.totalNotes = row.count;
            }
        });
        // Get all notes for analysis
        db.all('SELECT transcript, tags FROM voice_notes', (err, rows) => {
            if (!err && rows) {
                // Calculate average transcript length
                const totalLength = rows.reduce((sum, row) => sum + (row.transcript?.length || 0), 0);
                stats.averageLength = rows.length > 0 ? Math.round(totalLength / rows.length) : 0;
                // Analyze tags
                const tagCounts = {};
                rows.forEach(row => {
                    if (row.tags) {
                        const tags = row.tags.split(',');
                        tags.forEach((tag) => {
                            const cleanTag = tag.trim();
                            if (cleanTag) {
                                tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
                            }
                        });
                    }
                });
                stats.topTags = Object.entries(tagCounts)
                    .map(([tag, count]) => ({ tag, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);
            }
            res.json(stats);
        });
    });
});
//# sourceMappingURL=voice-notes.js.map