import { Router } from 'express';
import { db } from '../database/sqlite.js';
export const notesRoutes = Router();
// Get all notes across all videos
notesRoutes.get('/', (req, res) => {
    db.all(`
    SELECT n.*, v.title as video_title 
    FROM notes n 
    LEFT JOIN videos v ON n.video_id = v.id 
    ORDER BY n.created_at DESC
  `, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch notes' });
        }
        res.json(rows);
    });
});
// Update a specific note
notesRoutes.put('/:noteId', (req, res) => {
    const { noteId } = req.params;
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Note content is required' });
    }
    db.run('UPDATE notes SET content = ? WHERE id = ?', [content.trim(), noteId], function (err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to update note' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json({ message: 'Note updated successfully' });
    });
});
// Delete a specific note
notesRoutes.delete('/:noteId', (req, res) => {
    const { noteId } = req.params;
    db.run('DELETE FROM notes WHERE id = ?', [noteId], function (err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete note' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json({ message: 'Note deleted successfully' });
    });
});
//# sourceMappingURL=notes.js.map