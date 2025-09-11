import { Router } from 'express';
import { db } from '../database/sqlite.js';
import { OpenRouterService } from '../services/openrouter.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

export const chatRoutes = Router();

// Get global chat messages
chatRoutes.get('/global', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  db.all('SELECT * FROM global_chat_messages WHERE user_id = ? ORDER BY created_at ASC', [userId], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch chat messages' });
    }
    
    // Parse matched_videos JSON for each message
    const messages = rows.map((row: any) => ({
      ...row,
      matched_videos: row.matched_videos ? JSON.parse(row.matched_videos) : []
    }));
    
    res.json(messages);
  });
});

// Clear global chat messages
chatRoutes.delete('/global', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user?.userId;
  db.run('DELETE FROM global_chat_messages WHERE user_id = ?', [userId], (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to clear chat messages' });
    }
    
    res.json({ message: 'Chat history cleared successfully' });
  });
});

// Send global chat message
chatRoutes.post('/global', authenticateToken, async (req: AuthRequest, res) => {
  const { message } = req.body;
  const userId = req.user?.userId;
  
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    // Search across user's videos for relevant content
    const searchResults = await searchAcrossUserVideos(message, userId!);
    const response = await generateGlobalChatResponse(message, searchResults);
    
    const stmt = db.prepare('INSERT INTO global_chat_messages (user_id, message, response, matched_videos) VALUES (?, ?, ?, ?)');
    
    stmt.run([
      userId,
      message.trim(), 
      response, 
      JSON.stringify(searchResults.map(r => ({ id: r.id, title: r.title, relevance_score: r.relevance_score, type: r.type })))
    ], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to save chat message' });
      }
      
      res.json({
        id: this.lastID,
        message: message.trim(),
        response,
        matched_videos: searchResults.map(r => ({ id: r.id, title: r.title, relevance_score: r.relevance_score, type: r.type })),
        created_at: new Date().toISOString()
      });
    });
    
  } catch (error) {
    console.error('Global chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

function extractSearchTerms(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  
  // Remove common stop words and extract meaningful terms
  const stopWords = ['what', 'how', 'why', 'when', 'where', 'tell', 'me', 'about', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];
  
  const words = lowerQuery.split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !stopWords.includes(word))
    .filter(word => /^[a-zA-Z]+$/.test(word)); // Only alphabetic words
  
  // Add the original query as a phrase for exact matching
  const terms = [...words];
  if (lowerQuery.length > 5) {
    terms.push(lowerQuery);
  }
  
  return terms;
}

async function searchAcrossUserVideos(query: string, userId: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    // Search both videos and notes
    db.all(`
      SELECT 'video' as type, id, title, summary, transcript, tags, platform, created_at, youtube_url
      FROM videos WHERE user_id = ?
      UNION ALL
      SELECT 'note' as type, id, title, content as summary, '' as transcript, tags, 'note' as platform, created_at, '' as youtube_url
      FROM notes WHERE user_id = ?
    `, [userId, userId], (err, items) => {
      if (err) {
        reject(err);
        return;
      }
      
      const searchTerms = extractSearchTerms(query);
      const results: any[] = [];
      
      items.forEach((item: any) => {
        let relevanceScore = 0;
        const title = (item.title || '').toLowerCase();
        const summary = (item.summary || '').toLowerCase();
        const transcript = (item.transcript || '').toLowerCase();
        const tags = (item.tags || '').toLowerCase();
        const content = `${title} ${summary} ${transcript} ${tags}`;
        
        // Calculate relevance score with normalized approach
        searchTerms.forEach(term => {
          const titleMatches = (title.match(new RegExp(term, 'g')) || []).length;
          const summaryMatches = (summary.match(new RegExp(term, 'g')) || []).length;
          const transcriptMatches = (transcript.match(new RegExp(term, 'g')) || []).length;
          const tagsMatches = (tags.match(new RegExp(term, 'g')) || []).length;
          
          // Normalize scores to prevent extremely high values
          relevanceScore += Math.min(titleMatches * 10, 30); // Title matches: max 30 points
          relevanceScore += Math.min(summaryMatches * 5, 20); // Summary matches: max 20 points  
          relevanceScore += Math.min(transcriptMatches * 1, 10); // Transcript matches: max 10 points
          relevanceScore += Math.min(tagsMatches * 8, 25); // Tags matches: max 25 points
        });
        
        if (relevanceScore > 0) {
          results.push({
            ...item,
            relevance_score: relevanceScore,
            matched_content: extractRelevantContent(content, searchTerms)
          });
        }
      });
      
      // Sort by relevance score and return top 5
      results.sort((a, b) => b.relevance_score - a.relevance_score);
      resolve(results.slice(0, 5));
    });
  });
}

function extractRelevantContent(content: string, searchTerms: string[]): string {
  for (const term of searchTerms) {
    // Create a regex that finds the term with word boundaries and captures more context
    const regex = new RegExp(`(?:^|\\s)(.{0,200}\\b${term}\\b.{0,200})(?:\\s|$)`, 'gi');
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
      // Return the longest match for better context
      const bestMatch = matches.reduce((longest, current) => 
        current.length > longest.length ? current : longest
      );
      return bestMatch.trim();
    }
  }
  
  // Fallback: if no word boundary matches found, try without word boundaries
  for (const term of searchTerms) {
    const regex = new RegExp(`.{0,300}${term}.{0,300}`, 'gi');
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
      const bestMatch = matches.reduce((longest, current) => 
        current.length > longest.length ? current : longest
      );
      return bestMatch.trim();
    }
  }
  
  return '';
}

async function generateGlobalChatResponse(message: string, searchResults: any[]): Promise<string> {
  const lowerMessage = message.toLowerCase();
  
  if (searchResults.length === 0) {
    return "I couldn't find any relevant content in your videos for that query. Try asking about specific topics or using different keywords.";
  }
  
  // Initialize OpenRouter service
  const openRouter = new OpenRouterService();
  
  // Check if OpenRouter is available
  const isOpenRouterAvailable = await openRouter.isAvailable();
  
  if (!isOpenRouterAvailable) {
    console.warn('OpenRouter not available, falling back to simple response');
    return generateSimpleResponse(message, searchResults);
  }
  
  try {
    // Prepare context for the LLM
    const context = prepareContextForLLM(message, searchResults);
    
    // Get response from OpenRouter
    const llmResponse = await openRouter.generateChatResponse(message, context);
    
    return llmResponse;
  } catch (error) {
    console.error('LLM generation failed, falling back to simple response:', error);
    return generateSimpleResponse(message, searchResults);
  }
}

function prepareContextForLLM(message: string, searchResults: any[]): string {
  const contextParts: string[] = [];
  
  // Add query context
  contextParts.push(`User Query: "${message}"`);
  contextParts.push(`Found ${searchResults.length} relevant item(s) from your content:`);
  contextParts.push('');
  
  searchResults.forEach((result, index) => {
    const contentType = result.type === 'note' ? 'Note' : 'Video';
    contextParts.push(`=== ${contentType} ${index + 1}: "${result.title}" ===`);
    contextParts.push(`Relevance Score: ${result.relevance_score}`);
    contextParts.push(`Type: ${result.type}`);
    
    if (result.summary) {
      contextParts.push(`Summary: ${result.summary}`);
    }
    
    if (result.matched_content) {
      contextParts.push(`Key Content: ${result.matched_content}`);
    }
    
    // Add more context from transcript if available (only for videos)
    if (result.type === 'video' && result.transcript && result.transcript.length > 0) {
      const transcriptPreview = extractBetterContext(result.transcript, message);
      if (transcriptPreview && transcriptPreview !== result.matched_content) {
        contextParts.push(`Additional Context: ${transcriptPreview}`);
      }
    }
    
    contextParts.push('');
  });
  
  return contextParts.join('\n');
}

function extractBetterContext(transcript: string, query: string): string {
  const queryTerms = query.toLowerCase().split(' ').filter(word => word.length > 2);
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Find sentences that contain query terms
  const relevantSentences = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase();
    return queryTerms.some(term => lowerSentence.includes(term));
  });
  
  if (relevantSentences.length > 0) {
    // Return up to 3 most relevant sentences
    return relevantSentences.slice(0, 3).join('. ').trim() + '.';
  }
  
  // Fallback: return first few sentences if no matches
  return sentences.slice(0, 2).join('. ').trim() + '.';
}


function generateSimpleResponse(message: string, searchResults: any[]): string {
  const lowerMessage = message.toLowerCase();
  
  // Generate response based on search results
  if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
    const summaries = searchResults
      .filter(r => r.summary)
      .map(r => `"${r.title}": ${r.summary}`)
      .slice(0, 3);
    
    if (summaries.length > 0) {
      return `Here are summaries from your most relevant videos:\n\n${summaries.join('\n\n')}`;
    }
  }
  
  if (lowerMessage.includes('videos about') || lowerMessage.includes('content about')) {
    const videoTitles = searchResults.slice(0, 5).map(r => `• ${r.title}`).join('\n');
    return `I found these videos related to your query:\n\n${videoTitles}`;
  }
  
  // Default response with matched content
  const topResult = searchResults[0];
  let response = `Based on your videos, I found relevant information in "${topResult.title}".`;
  
  if (topResult.matched_content) {
    response += `\n\nHere's what I found: "${topResult.matched_content}"`;
  }
  
  if (searchResults.length > 1) {
    response += `\n\nI also found related content in ${searchResults.length - 1} other video${searchResults.length > 2 ? 's' : ''}.`;
  }
  
  return response;
}