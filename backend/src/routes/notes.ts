import { Router } from 'express';
import { db } from '../database/sqlite.js';
import { OpenRouterService } from '../services/openrouter.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

export const notesRoutes = Router();

// Get all notes for a user
notesRoutes.get('/', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  
  db.all(`
    SELECT n.*
    FROM notes n 
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
  `, [userId], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch notes' });
    }
    res.json(rows);
  });
});

// Create a new note
notesRoutes.post('/', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  const { title, content, tags, is_ai_generated = false } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  
  const stmt = db.prepare('INSERT INTO notes (user_id, title, content, tags, is_ai_generated) VALUES (?, ?, ?, ?, ?)');
  
  stmt.run([userId, title.trim(), content.trim(), tags || '', is_ai_generated ? 1 : 0], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to create note' });
    }
    
    res.json({
      id: this.lastID,
      title: title.trim(),
      content: content.trim(),
      tags: tags || '',
      is_ai_generated: is_ai_generated,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });
});

// Ask AI to generate a note
notesRoutes.post('/ask-ai', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  const { question } = req.body;
  
  if (!question || question.trim().length === 0) {
    return res.status(400).json({ error: 'Question is required' });
  }
  
  try {
    // Initialize OpenRouter service
    const openRouter = new OpenRouterService();
    
    // Check if OpenRouter is available
    const isOpenRouterAvailable = await openRouter.isAvailable();
    
    if (!isOpenRouterAvailable) {
      return res.status(503).json({ 
        error: 'AI service is currently unavailable. Please try again later.' 
      });
    }
    
    // Generate AI response
    const aiResponse = await openRouter.generateChatResponse(question, '');
    
    // Generate title and tags using AI with improved prompts
    const titlePrompt = `Based on this content, generate a clear, descriptive title that captures the main topic or question. The title should be 3-8 words and directly relate to the content. Do not include quotes, colons, or special characters. Just return the title text.

Content: "${aiResponse}"`;

    const tagsPrompt = `Based on this content, generate 3-5 relevant tags that describe the main topics, concepts, or themes. Return only the tags separated by commas, no numbers, colons, or special formatting. Each tag should be 1-3 words.

Content: "${aiResponse}"`;
    
    const [titleResponse, tagsResponse] = await Promise.all([
      openRouter.generateChatResponse(titlePrompt, ''),
      openRouter.generateChatResponse(tagsPrompt, '')
    ]);
    
    // Clean up the responses with better processing
    const title = titleResponse
      .replace(/['"]/g, '')
      .replace(/[:\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 60);
    
    const tags = tagsResponse
      .replace(/['"]/g, '')
      .replace(/[:\-]/g, ' ')
      .replace(/\n/g, ', ')
      .replace(/\d+\.\s*/g, '') // Remove numbered lists
      .replace(/\s*,\s*/g, ', ') // Normalize comma spacing
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);
    
    res.json({
      success: true,
      title,
      content: aiResponse,
      tags,
      is_ai_generated: true
    });
    
  } catch (error) {
    console.error('AI note generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI response. Please try again.' 
    });
  }
});

// Update a specific note
notesRoutes.put('/:noteId', authenticateToken, (req: AuthRequest, res) => {
  const { noteId } = req.params;
  const { title, content, tags } = req.body;
  const userId = req.user?.userId;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  
  db.run(
    'UPDATE notes SET title = ?, content = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', 
    [title.trim(), content.trim(), tags || '', noteId, userId], 
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to update note' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Note not found' });
      }
      
      res.json({ 
        message: 'Note updated successfully',
        id: noteId,
        title: title.trim(),
        content: content.trim(),
        tags: tags || '',
        updated_at: new Date().toISOString()
      });
    }
  );
});

// Delete a specific note
notesRoutes.delete('/:noteId', authenticateToken, (req: AuthRequest, res) => {
  const { noteId } = req.params;
  const userId = req.user?.userId;
  
  db.run('DELETE FROM notes WHERE id = ? AND user_id = ?', [noteId, userId], function(err) {
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

// Get a specific note
notesRoutes.get('/:noteId', authenticateToken, (req: AuthRequest, res) => {
  const { noteId } = req.params;
  const userId = req.user?.userId;
  
  db.get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [noteId, userId], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch note' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json(row);
  });
});