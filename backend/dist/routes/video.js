import { Router } from 'express';
import { db } from '../database/sqlite.js';
import { z } from 'zod';
import { TranscriptService } from '../services/transcript.js';
import { authenticateToken } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
export const videoRoutes = Router();
const videoSchema = z.object({
    url: z.string().url().refine((url) => {
        return url.includes('youtube.com') || url.includes('youtu.be') ||
            url.includes('instagram.com') || url.includes('x.com') ||
            url.includes('twitter.com') || url.includes('facebook.com');
    }, {
        message: "URL must be from YouTube, Instagram, X (Twitter), or Facebook"
    }),
});
videoRoutes.post('/process', authenticateToken, async (req, res) => {
    try {
        const { url } = videoSchema.parse(req.body);
        const userId = req.user?.userId;
        // Detect platform and extract appropriate ID
        const platform = TranscriptService.detectPlatform(url);
        let contentId = null;
        if (platform === 'youtube') {
            contentId = TranscriptService.extractVideoId(url);
            if (!contentId) {
                return res.status(400).json({ error: 'Invalid YouTube URL' });
            }
        }
        else if (platform === 'instagram') {
            contentId = TranscriptService.extractInstagramId(url);
            if (!contentId) {
                return res.status(400).json({ error: 'Invalid Instagram URL' });
            }
        }
        else if (platform === 'x' || platform === 'twitter') {
            contentId = TranscriptService.extractTwitterId(url);
            if (!contentId) {
                return res.status(400).json({ error: 'Invalid X/Twitter URL' });
            }
        }
        else if (platform === 'facebook') {
            contentId = TranscriptService.extractFacebookId(url);
            if (!contentId) {
                return res.status(400).json({ error: 'Invalid Facebook URL' });
            }
        }
        else {
            return res.status(400).json({ error: 'Unsupported platform - only YouTube, Instagram, X (Twitter), and Facebook are supported' });
        }
        // Check if video already exists for this user (check by exact URL and user_id)
        const existingVideo = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM videos WHERE youtube_url = ? AND platform = ? AND user_id = ?', [url, platform, userId], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row);
                }
            });
        });
        if (existingVideo) {
            console.log(`🔄 Found existing ${platform} content with ID: ${existingVideo.id}`);
            console.log(`🔄 Existing title: ${existingVideo.title}`);
            console.log(`🔄 Existing URL: ${existingVideo.youtube_url}`);
            console.log(`🔄 Updating existing content for user ${userId}...`);
        }
        else {
            console.log(`Processing new ${platform} content ID: ${contentId}`);
            console.log(`Content URL: ${url}`);
        }
        // Get transcript using the external API
        console.log(`Processing content for ${platform} ID: ${contentId}`);
        const transcriptResult = await TranscriptService.extractTranscript(url);
        let fullTranscript = '';
        let summary = '';
        let contentTitle = `Untitled ${platform === 'youtube' ? 'YouTube Video' :
            platform === 'instagram' ? 'Instagram Content' :
                platform === 'x' || platform === 'twitter' ? 'X Post' :
                    platform === 'facebook' ? 'Facebook Video' : 'Content'}`;
        let autoTags = [];
        // Essential logging only
        console.log(`Transcript success: ${transcriptResult.success}, method: ${transcriptResult.method}`);
        if (transcriptResult.success) {
            fullTranscript = transcriptResult.transcript;
            summary = await TranscriptService.generateSummary(fullTranscript);
            // Generate auto tags based on content
            autoTags = TranscriptService.generateTags(fullTranscript, summary);
            // Use title from external API if available
            if (transcriptResult.title && transcriptResult.title !== 'No title found' && transcriptResult.title.trim().length > 0) {
                contentTitle = transcriptResult.title;
            }
            else if (platform === 'youtube') {
                // Try to get title from YouTube directly
                try {
                    const youtubeTitle = await TranscriptService.getYouTubeTitle(contentId);
                    if (youtubeTitle && youtubeTitle.trim().length > 0) {
                        contentTitle = youtubeTitle;
                    }
                }
                catch (error) {
                    // Silent fail for title extraction
                }
            }
            console.log(`✓ Content processed: ${contentTitle} (${fullTranscript.length} chars)`);
        }
        else {
            fullTranscript = `No transcript available for this ${platform} content (${contentId}). ${transcriptResult.error || 'Unknown error'}`;
            summary = `Unable to generate summary - no content available. This ${platform} content may not have captions enabled or may be restricted.`;
            console.log(`✗ External API failed for ${contentId}: ${transcriptResult.error}`);
        }
        // Save to database (update existing or insert new)
        const tagsString = autoTags.join(',');
        if (existingVideo) {
            // Update existing video
            console.log(`🔄 Updating existing video ID: ${existingVideo.id}`);
            const updateStmt = db.prepare(`
        UPDATE videos 
        SET youtube_url = ?, title = ?, transcript = ?, summary = ?, tags = ?, platform = ?
        WHERE id = ?
      `);
            updateStmt.run([url, contentTitle, fullTranscript, summary, tagsString, platform, existingVideo.id], function (err) {
                if (err) {
                    console.error('Database update error:', err);
                    return res.status(500).json({ error: 'Failed to update content' });
                }
                console.log(`✅ ${platform} content updated with ID: ${existingVideo.id}`);
                res.json({
                    id: existingVideo.id,
                    url,
                    title: contentTitle,
                    transcript: fullTranscript,
                    summary,
                    tags: autoTags,
                    platform,
                    contentId,
                    message: `${platform} content updated successfully`,
                    note: platform === 'instagram' ? 'Instagram content updated successfully' :
                        platform === 'x' || platform === 'twitter' ? 'X/Twitter content updated successfully' :
                            platform === 'facebook' ? 'Facebook content updated successfully' : undefined
                });
            });
        }
        else {
            // Insert new video
            console.log(`➕ Creating new ${platform} content`);
            const videoUuid = uuidv4();
            const insertStmt = db.prepare(`
        INSERT INTO videos (uuid, user_id, youtube_url, title, transcript, summary, tags, platform)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
            insertStmt.run([videoUuid, userId, url, contentTitle, fullTranscript, summary, tagsString, platform], function (err) {
                if (err) {
                    console.error('Database insert error:', err);
                    return res.status(500).json({ error: 'Failed to save content' });
                }
                console.log(`✅ ${platform} content saved with ID: ${this.lastID}`);
                res.json({
                    id: this.lastID,
                    url,
                    title: contentTitle,
                    transcript: fullTranscript,
                    summary,
                    tags: autoTags,
                    platform,
                    contentId,
                    message: `${platform} content processed successfully`,
                    note: platform === 'instagram' ? 'Instagram content processed successfully' :
                        platform === 'x' || platform === 'twitter' ? 'X/Twitter content processed successfully' :
                            platform === 'facebook' ? 'Facebook content processed successfully' : undefined
                });
            });
        }
    }
    catch (error) {
        console.error('Process content error:', error);
        res.status(500).json({ error: 'Failed to process content: ' + (error instanceof Error ? error.message : 'Unknown error') });
    }
});
videoRoutes.get('/', authenticateToken, (req, res) => {
    const userId = req.user?.userId;
    db.all('SELECT * FROM videos WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch videos' });
        }
        res.json(rows);
    });
});
videoRoutes.get('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    console.log(`Fetching video ID: ${id} for user: ${userId}`);
    db.get('SELECT * FROM videos WHERE id = ? AND user_id = ?', [id, userId], (err, row) => {
        if (err) {
            console.log(`Database error for video ${id}:`, err);
            return res.status(500).json({ error: 'Failed to fetch video' });
        }
        if (!row) {
            console.log(`Video ${id} not found for user ${userId}`);
            return res.status(404).json({ error: 'Video not found' });
        }
        console.log(`Video ${id} found:`, { id: row.id, title: row.title, user_id: row.user_id });
        res.json(row);
    });
});
// Public endpoint for testing (no authentication required)
videoRoutes.get('/public/:id', (req, res) => {
    const { id } = req.params;
    console.log(`Public fetch for video ID: ${id}`);
    db.get('SELECT * FROM videos WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.log(`Database error for video ${id}:`, err);
            return res.status(500).json({ error: 'Failed to fetch video' });
        }
        if (!row) {
            console.log(`Video ${id} not found in database`);
            return res.status(404).json({ error: 'Video not found' });
        }
        console.log(`Video ${id} found:`, { id: row.id, title: row.title, user_id: row.user_id });
        res.json(row);
    });
});
// Debug endpoint to list all videos (no authentication required)
videoRoutes.get('/debug/all', (req, res) => {
    console.log('Debug: Fetching all videos');
    db.all('SELECT id, title, user_id, platform, created_at FROM videos ORDER BY id DESC LIMIT 10', [], (err, rows) => {
        if (err) {
            console.log('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch videos' });
        }
        console.log(`Found ${rows.length} videos:`, rows);
        res.json({ count: rows.length, videos: rows });
    });
});
// Quick clear endpoint (no authentication required)
videoRoutes.post('/debug/clear', (req, res) => {
    console.log('🗑️ Quick clear - removing all videos...');
    db.run('DELETE FROM videos', (err) => {
        if (err) {
            console.error('Error clearing videos:', err);
            return res.status(500).json({ error: 'Failed to clear videos' });
        }
        console.log('✅ All videos cleared');
        res.json({ message: 'All videos cleared successfully' });
    });
});
videoRoutes.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM videos WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete video' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }
        res.json({ message: 'Video deleted successfully' });
    });
});
// Update video tags
videoRoutes.put('/:id/tags', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { tags } = req.body;
    const userId = req.user?.userId;
    // Convert tags array to comma-separated string
    const tagsString = Array.isArray(tags) ? tags.join(',') : tags || '';
    db.run('UPDATE videos SET tags = ? WHERE id = ? AND user_id = ?', [tagsString, id, userId], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update video tags' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Video not found or you do not have permission to update it' });
        }
        res.json({ message: 'Video tags updated successfully' });
    });
});
// Update video title
videoRoutes.put('/:id/title', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user?.userId;
    try {
        // If no title provided, try to fetch from YouTube
        let videoTitle = title;
        if (!videoTitle) {
            // Get the video first to extract video ID
            const video = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM videos WHERE id = ? AND user_id = ?', [id, userId], (err, row) => {
                    if (err)
                        reject(err);
                    else
                        resolve(row);
                });
            });
            if (video && video.youtube_url) {
                const videoId = TranscriptService.extractVideoId(video.youtube_url);
                if (videoId) {
                    try {
                        videoTitle = await TranscriptService.getYouTubeTitle(videoId);
                    }
                    catch (error) {
                        console.log(`Failed to fetch title for video ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
            }
        }
        if (!videoTitle) {
            return res.status(400).json({ error: 'No title provided and could not fetch from YouTube' });
        }
        db.run('UPDATE videos SET title = ? WHERE id = ? AND user_id = ?', [videoTitle, id, userId], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update video title' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Video not found or you do not have permission to update it' });
            }
            res.json({ message: 'Video title updated successfully', title: videoTitle });
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update video title' });
    }
});
// Bulk fix titles for all videos with incorrect titles
videoRoutes.post('/fix-titles', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        // Get all videos with titles that start with "Video " for current user
        const videos = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM videos WHERE title LIKE "Video %" AND user_id = ?', [userId], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
        const results = [];
        for (const video of videos) {
            try {
                const videoId = TranscriptService.extractVideoId(video.youtube_url);
                if (videoId) {
                    const newTitle = await TranscriptService.getYouTubeTitle(videoId);
                    if (newTitle && newTitle.trim().length > 0) {
                        await new Promise((resolve, reject) => {
                            db.run('UPDATE videos SET title = ? WHERE id = ? AND user_id = ?', [newTitle, video.id, userId], (err) => {
                                if (err)
                                    reject(err);
                                else
                                    resolve();
                            });
                        });
                        results.push({ id: video.id, oldTitle: video.title, newTitle });
                    }
                }
            }
            catch (error) {
                console.log(`Failed to fix title for video ${video.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                results.push({ id: video.id, oldTitle: video.title, error: error instanceof Error ? error.message : 'Unknown error' });
            }
        }
        res.json({
            message: `Processed ${videos.length} videos`,
            results,
            fixed: results.filter(r => r.newTitle).length,
            failed: results.filter(r => r.error).length
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fix titles' });
    }
});
// Debug endpoint to test transcript fetching
videoRoutes.post('/debug-transcript', async (req, res) => {
    try {
        const { url } = req.body;
        const platform = TranscriptService.detectPlatform(url);
        let contentId = null;
        if (platform === 'youtube') {
            contentId = TranscriptService.extractVideoId(url);
        }
        else if (platform === 'instagram') {
            contentId = TranscriptService.extractInstagramId(url);
        }
        else if (platform === 'x' || platform === 'twitter') {
            contentId = TranscriptService.extractTwitterId(url);
        }
        else if (platform === 'facebook') {
            contentId = TranscriptService.extractFacebookId(url);
        }
        if (!contentId) {
            return res.status(400).json({ error: `Invalid ${platform} URL` });
        }
        console.log(`Debug: Testing external API for ${platform} ${contentId}`);
        const result = await TranscriptService.extractTranscript(url);
        if (result.success) {
            const summary = await TranscriptService.generateSummary(result.transcript);
            const autoTags = TranscriptService.generateTags(result.transcript, summary);
            res.json({
                contentId,
                platform,
                transcriptLength: result.transcript.length,
                preview: result.transcript.substring(0, 500),
                title: result.title,
                method: result.method,
                summary: summary.length > 200 ? summary.substring(0, 200) + '...' : summary,
                autoTags,
                note: platform === 'instagram' ? 'Instagram transcription may take 1-3 minutes to complete' :
                    platform === 'x' || platform === 'twitter' ? 'X/Twitter transcription may take 1-3 minutes to complete' :
                        platform === 'facebook' ? 'Facebook transcription may take 1-3 minutes to complete' : undefined
            });
        }
        else {
            res.status(400).json({
                contentId,
                platform,
                error: result.error,
                method: result.method
            });
        }
    }
    catch (error) {
        res.status(500).json({
            error: 'External API failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Manual transcript input endpoint
videoRoutes.post('/add-transcript', async (req, res) => {
    try {
        const { videoId, transcript } = req.body;
        if (!videoId || !transcript) {
            return res.status(400).json({ error: 'Video ID and transcript are required' });
        }
        // Update the known transcripts (in a real app, this would be stored in database)
        console.log(`Adding manual transcript for video ${videoId} (${transcript.length} chars)`);
        res.json({
            message: 'Transcript added successfully',
            videoId,
            transcriptLength: transcript.length
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to add transcript',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Extract transcript only (without saving to database)
videoRoutes.post('/extract-transcript', async (req, res) => {
    try {
        const { url } = videoSchema.parse(req.body);
        console.log(`Extracting transcript for URL: ${url}`);
        const platform = TranscriptService.detectPlatform(url);
        const result = await TranscriptService.extractTranscript(url);
        if (result.success) {
            const summary = await TranscriptService.generateSummary(result.transcript);
            const autoTags = TranscriptService.generateTags(result.transcript, summary);
            let contentId = null;
            if (platform === 'youtube') {
                contentId = TranscriptService.extractVideoId(url);
            }
            else if (platform === 'instagram') {
                contentId = TranscriptService.extractInstagramId(url);
            }
            else if (platform === 'x' || platform === 'twitter') {
                contentId = TranscriptService.extractTwitterId(url);
            }
            else if (platform === 'facebook') {
                contentId = TranscriptService.extractFacebookId(url);
            }
            res.json({
                success: true,
                contentId,
                platform,
                transcript: result.transcript,
                summary,
                tags: autoTags,
                method: result.method,
                transcriptLength: result.transcript.length
            });
        }
        else {
            res.status(400).json({
                success: false,
                platform,
                error: result.error,
                method: result.method
            });
        }
    }
    catch (error) {
        console.error('Extract transcript error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to extract transcript: ' + (error instanceof Error ? error.message : 'Unknown error')
        });
    }
});
// Regenerate tags for a specific video
videoRoutes.post('/:id/regenerate-tags', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        // Get the video
        const video = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM videos WHERE id = ? AND user_id = ?', [id, userId], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
        if (!video) {
            return res.status(404).json({ error: 'Video not found or you do not have permission to access it' });
        }
        // Generate new tags
        const autoTags = TranscriptService.generateTags(video.transcript || '', video.summary || '');
        const tagsString = autoTags.join(',');
        // Update the video with new tags
        await new Promise((resolve, reject) => {
            db.run('UPDATE videos SET tags = ? WHERE id = ? AND user_id = ?', [tagsString, id, userId], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        res.json({
            message: 'Tags regenerated successfully',
            tags: autoTags,
            videoId: id
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to regenerate tags' });
    }
});
// Bulk regenerate tags for all videos
videoRoutes.post('/regenerate-all-tags', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        // Get all videos for current user
        const videos = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM videos WHERE user_id = ?', [userId], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
        const results = [];
        for (const video of videos) {
            try {
                const autoTags = TranscriptService.generateTags(video.transcript || '', video.summary || '');
                const tagsString = autoTags.join(',');
                await new Promise((resolve, reject) => {
                    db.run('UPDATE videos SET tags = ? WHERE id = ? AND user_id = ?', [tagsString, video.id, userId], (err) => {
                        if (err)
                            reject(err);
                        else
                            resolve();
                    });
                });
                results.push({ id: video.id, title: video.title, tags: autoTags });
            }
            catch (error) {
                console.log(`Failed to regenerate tags for video ${video.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                results.push({ id: video.id, title: video.title, error: error instanceof Error ? error.message : 'Unknown error' });
            }
        }
        res.json({
            message: `Processed ${videos.length} videos`,
            results,
            updated: results.filter(r => r.tags).length,
            failed: results.filter(r => r.error).length
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to regenerate tags' });
    }
});
// Test Instagram API endpoint
videoRoutes.post('/test-instagram', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !url.includes('instagram.com')) {
            return res.status(400).json({ error: 'Please provide a valid Instagram URL' });
        }
        console.log(`Testing Instagram API with URL: ${url}`);
        const result = await TranscriptService.extractTranscript(url);
        if (result.success) {
            res.json({
                success: true,
                platform: result.platform,
                transcriptLength: result.transcript.length,
                preview: result.transcript.substring(0, 300) + '...',
                title: result.title,
                method: result.method,
                message: 'Instagram transcription test successful'
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: result.error,
                method: result.method,
                platform: result.platform
            });
        }
    }
    catch (error) {
        console.error('Instagram API test error:', error);
        res.status(500).json({
            success: false,
            error: 'Instagram API test failed: ' + (error instanceof Error ? error.message : 'Unknown error')
        });
    }
});
// Test X/Twitter API endpoint
videoRoutes.post('/test-twitter', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || (!url.includes('x.com') && !url.includes('twitter.com'))) {
            return res.status(400).json({ error: 'Please provide a valid X/Twitter URL' });
        }
        console.log(`Testing X/Twitter API with URL: ${url}`);
        const result = await TranscriptService.extractTranscript(url);
        if (result.success) {
            res.json({
                success: true,
                platform: result.platform,
                transcriptLength: result.transcript.length,
                preview: result.transcript.substring(0, 300) + '...',
                title: result.title,
                method: result.method,
                message: 'X/Twitter transcription test successful'
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: result.error,
                method: result.method,
                platform: result.platform
            });
        }
    }
    catch (error) {
        console.error('X/Twitter API test error:', error);
        res.status(500).json({
            success: false,
            error: 'X/Twitter API test failed: ' + (error instanceof Error ? error.message : 'Unknown error')
        });
    }
});
// Test Facebook API endpoint
videoRoutes.post('/test-facebook', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !url.includes('facebook.com')) {
            return res.status(400).json({ error: 'Please provide a valid Facebook URL' });
        }
        console.log(`Testing Facebook API with URL: ${url}`);
        const result = await TranscriptService.extractTranscript(url);
        if (result.success) {
            res.json({
                success: true,
                platform: result.platform,
                transcriptLength: result.transcript.length,
                preview: result.transcript.substring(0, 300) + '...',
                title: result.title,
                method: result.method,
                message: 'Facebook transcription test successful'
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: result.error,
                method: result.method,
                platform: result.platform
            });
        }
    }
    catch (error) {
        console.error('Facebook API test error:', error);
        res.status(500).json({
            success: false,
            error: 'Facebook API test failed: ' + (error instanceof Error ? error.message : 'Unknown error')
        });
    }
});
// Clear all data endpoint for testing
videoRoutes.post('/clear-all', (req, res) => {
    console.log('🗑️ Clearing all database data...');
    db.serialize(() => {
        db.run('DELETE FROM videos', (err) => {
            if (err)
                console.error('Error clearing videos:', err);
            else
                console.log('✅ Videos cleared');
        });
        db.run('DELETE FROM global_chat_messages', (err) => {
            if (err)
                console.error('Error clearing chat messages:', err);
            else
                console.log('✅ Chat messages cleared');
        });
        db.run('DELETE FROM voice_notes', (err) => {
            if (err)
                console.error('Error clearing voice notes:', err);
            else
                console.log('✅ Voice notes cleared');
        });
        db.run('DELETE FROM users WHERE id > 1', (err) => {
            if (err)
                console.error('Error clearing users:', err);
            else
                console.log('✅ Users cleared (keeping admin user)');
        });
        console.log('🎉 All data cleared successfully');
        res.json({
            message: 'All data cleared successfully',
            cleared: ['videos', 'global_chat_messages', 'voice_notes', 'users']
        });
    });
});
// Clear specific video by URL (for testing duplicate detection)
videoRoutes.post('/clear-by-url', (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    db.run('DELETE FROM videos WHERE youtube_url = ?', [url], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to clear video' });
        }
        res.json({
            message: 'Video cleared successfully',
            deletedCount: this.changes,
            url: url
        });
    });
});
//# sourceMappingURL=video.js.map