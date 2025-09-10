import { Router } from 'express';
import { db } from '../database/sqlite';
import { OllamaService } from '../services/ollama';
export const chatRoutes = Router();
// Get global chat messages
chatRoutes.get('/global', (req, res) => {
    db.all('SELECT * FROM global_chat_messages ORDER BY created_at ASC', (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch chat messages' });
        }
        // Parse matched_videos JSON for each message
        const messages = rows.map((row) => ({
            ...row,
            matched_videos: row.matched_videos ? JSON.parse(row.matched_videos) : []
        }));
        res.json(messages);
    });
});
// Send global chat message
chatRoutes.post('/global', async (req, res) => {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required' });
    }
    try {
        // Search across all videos for relevant content
        const searchResults = await searchAcrossAllVideos(message);
        const response = await generateGlobalChatResponse(message, searchResults);
        const stmt = db.prepare('INSERT INTO global_chat_messages (message, response, matched_videos) VALUES (?, ?, ?)');
        stmt.run([
            message.trim(),
            response,
            JSON.stringify(searchResults.map(r => ({ id: r.id, title: r.title, relevance_score: r.relevance_score })))
        ], function (err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to save chat message' });
            }
            res.json({
                id: this.lastID,
                message: message.trim(),
                response,
                matched_videos: searchResults.map(r => ({ id: r.id, title: r.title, relevance_score: r.relevance_score })),
                created_at: new Date().toISOString()
            });
        });
    }
    catch (error) {
        console.error('Global chat error:', error);
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});
function extractSearchTerms(query) {
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
async function searchAcrossAllVideos(query) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM videos', (err, videos) => {
            if (err) {
                reject(err);
                return;
            }
            const searchTerms = extractSearchTerms(query);
            const results = [];
            videos.forEach((video) => {
                let relevanceScore = 0;
                const title = (video.title || '').toLowerCase();
                const summary = (video.summary || '').toLowerCase();
                const transcript = (video.transcript || '').toLowerCase();
                const content = `${title} ${summary} ${transcript}`;
                // Calculate relevance score with normalized approach
                searchTerms.forEach(term => {
                    const titleMatches = (title.match(new RegExp(term, 'g')) || []).length;
                    const summaryMatches = (summary.match(new RegExp(term, 'g')) || []).length;
                    const transcriptMatches = (transcript.match(new RegExp(term, 'g')) || []).length;
                    // Normalize scores to prevent extremely high values
                    relevanceScore += Math.min(titleMatches * 10, 30); // Title matches: max 30 points
                    relevanceScore += Math.min(summaryMatches * 5, 20); // Summary matches: max 20 points  
                    relevanceScore += Math.min(transcriptMatches * 1, 10); // Transcript matches: max 10 points
                });
                if (relevanceScore > 0) {
                    results.push({
                        ...video,
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
function extractRelevantContent(content, searchTerms) {
    for (const term of searchTerms) {
        // Create a regex that finds the term with word boundaries and captures more context
        const regex = new RegExp(`(?:^|\\s)(.{0,200}\\b${term}\\b.{0,200})(?:\\s|$)`, 'gi');
        const matches = content.match(regex);
        if (matches && matches.length > 0) {
            // Return the longest match for better context
            const bestMatch = matches.reduce((longest, current) => current.length > longest.length ? current : longest);
            return bestMatch.trim();
        }
    }
    // Fallback: if no word boundary matches found, try without word boundaries
    for (const term of searchTerms) {
        const regex = new RegExp(`.{0,300}${term}.{0,300}`, 'gi');
        const matches = content.match(regex);
        if (matches && matches.length > 0) {
            const bestMatch = matches.reduce((longest, current) => current.length > longest.length ? current : longest);
            return bestMatch.trim();
        }
    }
    return '';
}
async function generateGlobalChatResponse(message, searchResults) {
    const lowerMessage = message.toLowerCase();
    if (searchResults.length === 0) {
        return "I couldn't find any relevant content in your videos for that query. Try asking about specific topics or using different keywords.";
    }
    // Initialize Ollama service
    const ollama = new OllamaService();
    // Check if Ollama is available
    const isOllamaAvailable = await ollama.isAvailable();
    if (!isOllamaAvailable) {
        console.warn('Ollama not available, falling back to simple response');
        return generateSimpleResponse(message, searchResults);
    }
    try {
        // Prepare context for the LLM
        const context = prepareContextForLLM(message, searchResults);
        // Generate prompt for the LLM
        const prompt = createLLMPrompt(message, context);
        // Get response from Ollama
        const llmResponse = await ollama.generateResponse(prompt);
        return llmResponse;
    }
    catch (error) {
        console.error('LLM generation failed, falling back to simple response:', error);
        return generateSimpleResponse(message, searchResults);
    }
}
function prepareContextForLLM(message, searchResults) {
    const contextParts = [];
    // Add query context
    contextParts.push(`User Query: "${message}"`);
    contextParts.push(`Found ${searchResults.length} relevant video(s):`);
    contextParts.push('');
    searchResults.forEach((result, index) => {
        contextParts.push(`=== Video ${index + 1}: "${result.title}" ===`);
        contextParts.push(`Relevance Score: ${result.relevance_score}`);
        if (result.summary) {
            contextParts.push(`Summary: ${result.summary}`);
        }
        if (result.matched_content) {
            contextParts.push(`Key Content: ${result.matched_content}`);
        }
        // Add more context from transcript if available
        if (result.transcript && result.transcript.length > 0) {
            const transcriptPreview = extractBetterContext(result.transcript, message);
            if (transcriptPreview && transcriptPreview !== result.matched_content) {
                contextParts.push(`Additional Context: ${transcriptPreview}`);
            }
        }
        contextParts.push('');
    });
    return contextParts.join('\n');
}
function extractBetterContext(transcript, query) {
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
function createLLMPrompt(userMessage, context) {
    return `You are an expert video content assistant. Analyze the provided video information and give a comprehensive, detailed answer to the user's question.

CONTEXT:
${context}

USER QUESTION: "${userMessage}"

INSTRUCTIONS:
1. **Be Comprehensive**: Provide a detailed explanation based on the video content
2. **Be Specific**: Reference actual content, concepts, and details from the videos
3. **Be Structured**: Organize your response logically with clear sections if needed
4. **Be Conversational**: Write in a helpful, engaging tone
5. **Be Complete**: Don't leave the user hanging - provide full explanations

SPECIAL GUIDELINES:
- If asked "what I actually did" or "what did I cover", explain the specific content, concepts, and topics covered in the video(s)
- If multiple videos are relevant, explain how they relate and what each covers
- Use the relevance scores to prioritize information from the most relevant videos
- Quote or paraphrase specific content from the videos to support your explanations
- If the user asks for details, provide thorough explanations with examples from the content

RESPONSE:`;
}
function generateSimpleResponse(message, searchResults) {
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
//# sourceMappingURL=chat.js.map