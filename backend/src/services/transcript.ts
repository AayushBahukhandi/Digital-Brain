import axios from 'axios';
import { OpenRouterService } from './openrouter.js';

export interface TranscriptResult {
    success: boolean;
    transcript: string;
    method: string;
    error?: string;
    title?: string;
    captions?: CaptionItem[];
    platform?: string;
}

export interface CaptionItem {
    start: string;
    dur: string;
    text: string;
}

export interface ExternalTranscriptResponse {
    title: string;
    captions: CaptionItem[];
}

export interface DictationerJobResponse {
    _id: string;
    userId: string;
    isPremiumUser: boolean;
    type: string;
    fileName: string;
    fileType: string;
    duration: number;
    cost: number;
    targetLanguage: string;
    originalLanguage: string;
    youtubeLink: string;
    timeout: number;
    countryCode: string;
    jobAddedToQueueTime: number;
    progress: {
        percentage: number;
        message: string;
        stateChangedAt: number;
    };
    isNeverViewed: boolean;
    deleted: boolean;
    allocatedToUser: boolean;
    keywords: any[];
    tracks: Array<{
        id: string;
        type: string;
        hidden: boolean;
        duration: number;
        language: string;
        isOriginal: boolean;
        keywords: any;
        globalDetail: any;
        summary: any;
        text: string;
        segments: any[];
    }>;
    createdAt: string;
    updatedAt: string;
    __v: number;
    jobInitiatedTime?: number;
    processingOptions: {
        includeTranslation: boolean;
        includeSummary: boolean;
        includeDiagram: boolean;
        includeVideoEditing: boolean;
        includeOriginalLanguage?: boolean;
    };
}

export class TranscriptService {

    /**
     * Extract transcript from a video URL using external API
     */
    static async extractTranscript(url: string): Promise<TranscriptResult> {
        const platform = this.detectPlatform(url);

        if (platform === 'youtube') {
            const videoId = this.extractVideoId(url);
            if (!videoId) {
                return {
                    success: false,
                    transcript: '',
                    method: 'none',
                    error: 'Invalid YouTube URL - could not extract video ID',
                    platform
                };
            }
            console.log(`Extracting transcript for YouTube video ID: ${videoId}`);
        } else if (platform === 'instagram') {
            console.log(`Extracting transcript for Instagram URL: ${url}`);
        } else if (platform === 'x') {
            console.log(`Extracting transcript for X/Twitter URL: ${url}`);
        } else if (platform === 'facebook') {
            console.log(`Extracting transcript for Facebook URL: ${url}`);
        } else {
            return {
                success: false,
                transcript: '',
                method: 'none',
                error: 'Unsupported platform - only YouTube, Instagram, X (Twitter), and Facebook are supported',
                platform: 'unknown'
            };
        }

        try {
            const result = await this.callExternalTranscriptAPI(url, platform);
            if (result.success && result.transcript.length > 50) {
                console.log(`✓ Success with external API: ${result.transcript.length} chars`);
                return { ...result, platform };
            }
        } catch (error) {
            console.log(`External API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return {
            success: false,
            transcript: '',
            method: 'none',
            error: 'External transcript API failed. Video may not have captions or may be restricted.',
            platform
        };
    }

    /**
     * Call external transcript API
     */
    private static async callExternalTranscriptAPI(url: string, platform: string): Promise<TranscriptResult> {
        try {
            console.log(`Calling external transcript API for ${platform}: ${url}`);

            if (platform === 'youtube') {
                return await this.callYouTubeAPI(url);
            } else if (platform === 'instagram') {
                return await this.callInstagramAPI(url);
            } else if (platform === 'x') {
                return await this.callTwitterAPI(url);
            } else if (platform === 'facebook') {
                return await this.callFacebookAPI(url);
            } else {
                throw new Error(`Unsupported platform: ${platform}`);
            }

        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error('Content not found or no captions available');
            } else if (error.response?.status >= 500) {
                throw new Error('External API server error');
            } else if (error.code === 'ECONNABORTED') {
                throw new Error('Request timeout - API took too long to respond');
            }
            throw new Error(`External API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Call YouTube transcript API
     */
    private static async callYouTubeAPI(url: string): Promise<TranscriptResult> {
        const response = await axios.post('https://tactiq-apps-prod.tactiq.io/transcript', {
            videoUrl: url,
            langCode: 'en'
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000
        });

        if (!response.data) {
            throw new Error('No data received from YouTube API');
        }

        const data = response.data as ExternalTranscriptResponse;
        const transcript = this.convertCaptionsToText(data.captions);

        if (transcript.length < 10) {
            throw new Error('Transcript too short - may be invalid');
        }

        return {
            success: true,
            transcript,
            method: 'external-api',
            title: data.title,
            captions: data.captions,
            platform: 'youtube'
        };
    }

    /**
     * Call Instagram transcript API using Dictationer
     */
    private static async callInstagramAPI(url: string): Promise<TranscriptResult> {
        const headers = {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGJlZjQ4ZGJmYjc4MDlhNTgzZjFjNTEiLCJ1c2VyQ29kZSI6ImVjYmE3NzNjLWJiMzctNGM0ZS1iZWRkLTE0MGRmOTY0ZTE1NiIsImVtYWlsIjoiaGFkb2JpODQzNkBuY2llbi5jb20iLCJpYXQiOjE3NTczNDUwNjYsImV4cCI6MTc1OTkzNzA2Nn0.wHVuiVVANligb9wofxmZNqT5dqU-avYtci-FBOaKvtk',
            'Content-Type': 'application/json',
            'x-api-key': '!apisuperSecreatApI13@'
        };

        // Step 1: Add transcription job
        console.log('Adding Instagram transcription job...');

        const addJobResponse = await axios.post('https://api.dictationer.com/queue/addTranscriptionJob', {
            userId: "68bef48dbfb7809a583f1c51",
            fileType: "youtubeLink",
            youtubeLink: url,
            duration: 60,
            cost: 1,
            targetLanguage: "en",
            originalLanguage: "en",
            countryCode: "IN",
            processingOptions: {
                includeVideoEditing: false,
                includeTranslation: false,
                includeSummary: false,
                includeDiagram: false,
                includeOriginalLanguage: false
            },
            isPremiumUser: true
        }, {
            headers,
            timeout: 30000
        });

        console.log(addJobResponse, "---------")
        const addJobData = addJobResponse.data as DictationerJobResponse;
        if (!addJobData || !addJobData._id) {
            throw new Error('Failed to create transcription job');
        }

        const jobId = addJobData._id;
        console.log(`Instagram transcription job created with ID: ${jobId}`);

        // Step 2: Poll for completion
        let attempts = 0;
        const maxAttempts = 60; // 3 minutes max (60 * 3 seconds)

        while (attempts < maxAttempts) {
            console.log(`Polling job status (attempt ${attempts + 1}/${maxAttempts})...`);

            try {
                const statusResponse = await axios.post('https://api.dictationer.com/job/getJobDataById', {
                    jobId: jobId
                }, {
                    headers,
                    timeout: 10000
                });

                const jobData = statusResponse.data as DictationerJobResponse;

                if (jobData && jobData.progress) {
                    console.log(`Job progress: ${jobData.progress.percentage}% - ${jobData.progress.message}`);

                    if (jobData.progress.percentage === 100) {
                        // Job completed, extract transcript
                        if (jobData.tracks && jobData.tracks.length > 0) {
                            const transcript = jobData.tracks[0].text || '';
                            const title = jobData.fileName || 'Instagram Reel';

                            if (transcript.length < 10) {
                                throw new Error('Transcript too short - may be invalid');
                            }

                            console.log(`✓ Instagram transcription completed: ${transcript.length} chars`);

                            return {
                                success: true,
                                transcript,
                                method: 'dictationer-api',
                                title,
                                captions: undefined,
                                platform: 'instagram'
                            };
                        } else {
                            throw new Error('No transcript tracks found in completed job');
                        }
                    }
                }

                // Wait 3 seconds before next poll
                await new Promise(resolve => setTimeout(resolve, 3000));
                attempts++;

            } catch (pollError) {
                console.log(`Polling error (attempt ${attempts + 1}): ${pollError instanceof Error ? pollError.message : 'Unknown error'}`);
                attempts++;

                if (attempts >= maxAttempts) {
                    throw new Error('Transcription job polling failed after maximum attempts');
                }

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        throw new Error('Transcription job timed out - took longer than expected to complete');
    }

    /**
     * Call Twitter/X transcript API using Dictationer (same as Instagram)
     */
    private static async callTwitterAPI(url: string): Promise<TranscriptResult> {
        const headers = {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGJlZjQ4ZGJmYjc4MDlhNTgzZjFjNTEiLCJ1c2VyQ29kZSI6ImVjYmE3NzNjLWJiMzctNGM0ZS1iZWRkLTE0MGRmOTY0ZTE1NiIsImVtYWlsIjoiaGFkb2JpODQzNkBuY2llbi5jb20iLCJpYXQiOjE3NTczNDUwNjYsImV4cCI6MTc1OTkzNzA2Nn0.wHVuiVVANligb9wofxmZNqT5dqU-avYtci-FBOaKvtk',
            'Content-Type': 'application/json',
            'x-api-key': '!apisuperSecreatApI13@'
        };

        // Step 1: Add transcription job
        console.log('Adding X/Twitter transcription job...');

        const addJobResponse = await axios.post('https://api.dictationer.com/queue/addTranscriptionJob', {
            userId: "68bef48dbfb7809a583f1c51",
            fileType: "youtubeLink",
            youtubeLink: url,
            duration: 60,
            cost: 1,
            targetLanguage: "en",
            originalLanguage: "en",
            countryCode: "IN",
            processingOptions: {
                includeVideoEditing: false,
                includeTranslation: false,
                includeSummary: false,
                includeDiagram: false,
                includeOriginalLanguage: false
            },
            isPremiumUser: true
        }, {
            headers,
            timeout: 30000
        });

        const addJobData = addJobResponse.data as DictationerJobResponse;
        if (!addJobData || !addJobData._id) {
            throw new Error('Failed to create X/Twitter transcription job');
        }

        const jobId = addJobData._id;
        console.log(`X/Twitter transcription job created with ID: ${jobId}`);

        // Step 2: Poll for completion
        let attempts = 0;
        const maxAttempts = 60; // 3 minutes max (60 * 3 seconds)

        while (attempts < maxAttempts) {
            console.log(`Polling X/Twitter job status (attempt ${attempts + 1}/${maxAttempts})...`);

            try {
                const statusResponse = await axios.post('https://api.dictationer.com/job/getJobDataById', {
                    jobId: jobId
                }, {
                    headers,
                    timeout: 10000
                });

                const jobData = statusResponse.data as DictationerJobResponse;

                if (jobData && jobData.progress) {
                    console.log(`X/Twitter job progress: ${jobData.progress.percentage}% - ${jobData.progress.message}`);

                    if (jobData.progress.percentage === 100) {
                        // Job completed, extract transcript
                        if (jobData.tracks && jobData.tracks.length > 0) {
                            const transcript = jobData.tracks[0].text || '';
                            const title = jobData.fileName || 'X/Twitter Post';

                            if (transcript.length < 10) {
                                throw new Error('Transcript too short - may be invalid');
                            }

                            console.log(`✓ X/Twitter transcription completed: ${transcript.length} chars`);

                            return {
                                success: true,
                                transcript,
                                method: 'dictationer-api',
                                title,
                                captions: undefined,
                                platform: 'x'
                            };
                        } else {
                            throw new Error('No transcript tracks found in completed X/Twitter job');
                        }
                    }
                }

                // Wait 3 seconds before next poll
                await new Promise(resolve => setTimeout(resolve, 3000));
                attempts++;

            } catch (pollError) {
                console.log(`X/Twitter polling error (attempt ${attempts + 1}): ${pollError instanceof Error ? pollError.message : 'Unknown error'}`);
                attempts++;

                if (attempts >= maxAttempts) {
                    throw new Error('X/Twitter transcription job polling failed after maximum attempts');
                }

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        throw new Error('X/Twitter transcription job timed out - took longer than expected to complete');
    }

    /**
     * Call Facebook transcript API using Dictationer (same as Instagram)
     */
    private static async callFacebookAPI(url: string): Promise<TranscriptResult> {
        const headers = {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGJlZjQ4ZGJmYjc4MDlhNTgzZjFjNTEiLCJ1c2VyQ29kZSI6ImVjYmE3NzNjLWJiMzctNGM0ZS1iZWRkLTE0MGRmOTY0ZTE1NiIsImVtYWlsIjoiaGFkb2JpODQzNkBuY2llbi5jb20iLCJpYXQiOjE3NTczNDUwNjYsImV4cCI6MTc1OTkzNzA2Nn0.wHVuiVVANligb9wofxmZNqT5dqU-avYtci-FBOaKvtk',
            'Content-Type': 'application/json',
            'x-api-key': '!apisuperSecreatApI13@'
        };

        // Step 1: Add transcription job
        console.log('Adding Facebook transcription job...');

        const addJobResponse = await axios.post('https://api.dictationer.com/queue/addTranscriptionJob', {
            userId: "68bef48dbfb7809a583f1c51",
            fileType: "youtubeLink",
            youtubeLink: url,
            duration: 60,
            cost: 1,
            targetLanguage: "en",
            originalLanguage: "en",
            countryCode: "IN",
            processingOptions: {
                includeVideoEditing: false,
                includeTranslation: false,
                includeSummary: false,
                includeDiagram: false,
                includeOriginalLanguage: false
            },
            isPremiumUser: true
        }, {
            headers,
            timeout: 30000
        });

        const addJobData = addJobResponse.data as DictationerJobResponse;
        if (!addJobData || !addJobData._id) {
            throw new Error('Failed to create Facebook transcription job');
        }

        const jobId = addJobData._id;
        console.log(`Facebook transcription job created with ID: ${jobId}`);

        // Step 2: Poll for completion
        let attempts = 0;
        const maxAttempts = 60; // 3 minutes max (60 * 3 seconds)

        while (attempts < maxAttempts) {
            console.log(`Polling Facebook job status (attempt ${attempts + 1}/${maxAttempts})...`);

            try {
                const statusResponse = await axios.post('https://api.dictationer.com/job/getJobDataById', {
                    jobId: jobId
                }, {
                    headers,
                    timeout: 10000
                });

                const jobData = statusResponse.data as DictationerJobResponse;

                if (jobData && jobData.progress) {
                    console.log(`Facebook job progress: ${jobData.progress.percentage}% - ${jobData.progress.message}`);

                    if (jobData.progress.percentage === 100) {
                        // Job completed, extract transcript
                        if (jobData.tracks && jobData.tracks.length > 0) {
                            const transcript = jobData.tracks[0].text || '';
                            const title = jobData.fileName || 'Facebook Video';

                            if (transcript.length < 10) {
                                throw new Error('Transcript too short - may be invalid');
                            }

                            console.log(`✓ Facebook transcription completed: ${transcript.length} chars`);

                            return {
                                success: true,
                                transcript,
                                method: 'dictationer-api',
                                title,
                                captions: undefined,
                                platform: 'facebook'
                            };
                        } else {
                            throw new Error('No transcript tracks found in completed Facebook job');
                        }
                    }
                }

                // Wait 3 seconds before next poll
                await new Promise(resolve => setTimeout(resolve, 3000));
                attempts++;

            } catch (pollError) {
                console.log(`Facebook polling error (attempt ${attempts + 1}): ${pollError instanceof Error ? pollError.message : 'Unknown error'}`);
                attempts++;

                if (attempts >= maxAttempts) {
                    throw new Error('Facebook transcription job polling failed after maximum attempts');
                }

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        throw new Error('Facebook transcription job timed out - took longer than expected to complete');
    }

    /**
     * Convert captions array to plain text transcript
     */
    private static convertCaptionsToText(captions: CaptionItem[]): string {
        if (!captions || captions.length === 0) {
            return '';
        }

        // Filter out "No text" entries and combine the rest
        const textParts = captions
            .filter(caption => caption.text && caption.text.trim() !== 'No text')
            .map(caption => caption.text.trim())
            .filter(text => text.length > 0);

        return textParts.join(' ').replace(/\s+/g, ' ').trim();
    }


    /**
     * Get YouTube video title directly from YouTube
     */
    static async getYouTubeTitle(videoId: string): Promise<string> {
        try {
            const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const response = await axios.get(youtubeUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000
            });

            // Extract title from HTML using regex
            const htmlContent = response.data as string;
            const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
            
            if (titleMatch && titleMatch[1]) {
                let title = titleMatch[1].trim();
                // Remove " - YouTube" suffix if present
                title = title.replace(/\s*-\s*YouTube\s*$/, '').trim();
                return title;
            }

            // Alternative method: look for JSON-LD structured data
            const jsonLdMatch = htmlContent.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
            
            if (jsonLdMatch) {
                try {
                    const jsonData = JSON.parse(jsonLdMatch[1]);
                    if (jsonData.name) {
                        return jsonData.name;
                    }
                } catch (e) {
                    // Ignore JSON parsing errors
                }
            }

            throw new Error('Could not extract title from YouTube page');
        } catch (error) {
            throw error;
        }
    }

    /**
     * Detect platform from URL
     */
    static detectPlatform(url: string): string {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            return 'youtube';
        } else if (url.includes('instagram.com')) {
            return 'instagram';
        } else if (url.includes('x.com') || url.includes('twitter.com')) {
            return 'x';
        } else if (url.includes('facebook.com')) {
            return 'facebook';
        }
        return 'unknown';
    }

    /**
     * Extract video ID from various YouTube URL formats
     */
    static extractVideoId(url: string): string | null {
        const patterns = [
            /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
            /(?:youtu\.be\/)([^&\n?#]+)/,
            /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
            /(?:youtube\.com\/v\/)([^&\n?#]+)/,
            /(?:youtube\.com\/shorts\/)([^&\n?#]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    }

    /**
     * Extract Instagram reel/post ID from URL
     */
    static extractInstagramId(url: string): string | null {
        const patterns = [
            /(?:instagram\.com\/reel\/)([^/?#]+)/,
            /(?:instagram\.com\/p\/)([^/?#]+)/,
            /(?:instagram\.com\/tv\/)([^/?#]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    }

    /**
     * Extract Twitter/X post ID from URL
     */
    static extractTwitterId(url: string): string | null {
        const patterns = [
            /(?:x\.com\/\w+\/status\/)(\d+)/,
            /(?:twitter\.com\/\w+\/status\/)(\d+)/,
            /(?:x\.com\/i\/status\/)(\d+)/,
            /(?:twitter\.com\/i\/status\/)(\d+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    }

    /**
     * Extract Facebook video ID from URL
     */
    static extractFacebookId(url: string): string | null {
        const patterns = [
            /(?:facebook\.com\/watch\/?\?v=)(\d+)/,
            /(?:facebook\.com\/.*\/videos\/)(\d+)/,
            /(?:facebook\.com\/video\.php\?v=)(\d+)/,
            /(?:facebook\.com\/share\/v\/)([^/?#]+)/,
            /(?:facebook\.com\/reel\/)(\d+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    }


    /**
     * Generate a summary from transcript text with improved intelligence
     */
    static async generateSummary(transcript: string): Promise<string> {
        if (!transcript || transcript.trim().length === 0) {
            return 'No content available for summary.';
        }

        // For short transcripts, use simple processing
        if (transcript.length <= 500) {
            return this.generateSimpleSummary(transcript);
        }

        // Try OpenRouter for better summarization
        try {
            const openRouter = new OpenRouterService();
            const isAvailable = await openRouter.isAvailable();
            
            if (isAvailable) {
                console.log('Using OpenRouter for advanced summarization');
                const summary = await openRouter.generateSummary(transcript, 'This is a transcript from a video or audio recording');
                if (summary && summary.trim().length > 0) {
                    return summary;
                } else {
                    console.warn('OpenRouter returned empty summary, falling back to local processing');
                }
            }
        } catch (error) {
            console.warn('OpenRouter summarization failed, falling back to local processing:', error);
        }

        // Fallback to local processing
        return this.generateLocalSummary(transcript);
    }

    /**
     * Generate a simple summary for short content
     */
    private static generateSimpleSummary(transcript: string): string {
        const cleanText = this.preprocessTranscript(transcript);
        
        if (cleanText.length <= 150) {
            return cleanText;
        }

        // Extract first few meaningful sentences
        const sentences = cleanText.split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 20)
            .slice(0, 3);

        return sentences.join('. ') + '.';
    }

    /**
     * Generate summary using local processing
     */
    private static generateLocalSummary(transcript: string): string {
        // Advanced text cleaning and preprocessing
        let cleanText = this.preprocessTranscript(transcript);

        if (cleanText.length <= 150) {
            return cleanText;
        }

        // Extract key information using multiple strategies
        const keyInfo = this.extractKeyInformation(cleanText);
        const importantSentences = this.extractImportantSentences(cleanText);
        const topics = this.extractTopics(cleanText);

        // Generate summary based on content type and length
        let summary = this.generateContextualSummary(cleanText, keyInfo, importantSentences, topics);

        // Post-process and validate summary
        summary = this.postProcessSummary(summary, cleanText);

        return summary || 'Unable to generate meaningful summary from the available content.';
    }

    /**
     * Preprocess transcript for better analysis
     */
    private static preprocessTranscript(transcript: string): string {
        return transcript
            .replace(/\s+/g, ' ')
            .replace(/\[.*?\]/g, '') // Remove [Music], [Applause], etc.
            .replace(/\(.*?\)/g, '') // Remove (inaudible), etc.
            .replace(/\b(um|uh|ah|er|like|you know|so|basically|actually|literally)\b/gi, '') // Remove filler words
            .replace(/\b(and|but|or|so|then|now|well|okay|alright)\s+/gi, '') // Remove weak connectors
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Extract key information from transcript
     */
    private static extractKeyInformation(text: string): {
        numbers: string[];
        dates: string[];
        names: string[];
        questions: string[];
        conclusions: string[];
    } {
        const numbers = text.match(/\b\d+(?:\.\d+)?%?\b/g) || [];
        const dates = text.match(/\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|\b\d{1,2}\/\d{1,2}\/\d{2,4}|\b\d{4}-\d{2}-\d{2}\b/gi) || [];
        const names = text.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g) || [];
        const questions = text.match(/[^.!?]*\?[^.!?]*/g) || [];
        const conclusions = text.match(/\b(?:in conclusion|to summarize|finally|overall|in summary|to wrap up|in the end)\b[^.!?]*[.!?]/gi) || [];

        return { numbers, dates, names, questions, conclusions };
    }

    /**
     * Extract important sentences using advanced scoring
     */
    private static extractImportantSentences(text: string): Array<{sentence: string, score: number, index: number}> {
        const sentences = text.split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 20);

        if (sentences.length <= 2) {
            return sentences.map((s, i) => ({ sentence: s, score: 1, index: i }));
        }

        return sentences.map((sentence, index) => {
            let score = 0;
            const lowerSentence = sentence.toLowerCase();
            
            // Content importance indicators
            const importanceIndicators = {
                high: ['main', 'key', 'important', 'crucial', 'essential', 'primary', 'major', 'critical', 'vital'],
                medium: ['first', 'second', 'third', 'finally', 'conclusion', 'summary', 'problem', 'solution', 'result', 'outcome'],
                low: ['tip', 'trick', 'method', 'technique', 'strategy', 'approach', 'because', 'therefore', 'however']
            };

            // Score based on importance indicators
            Object.entries(importanceIndicators).forEach(([level, words]) => {
                const multiplier = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
                words.forEach(word => {
                    if (lowerSentence.includes(word)) score += multiplier;
                });
            });

            // Position-based scoring
            if (index === 0) score += 3; // First sentence
            if (index === sentences.length - 1) score += 2; // Last sentence
            if (index < sentences.length * 0.1) score += 1; // Early sentences

            // Content-based scoring
            if (/\d+/.test(sentence)) score += 1; // Contains numbers
            if (sentence.includes('?')) score += 1; // Questions
            if (sentence.includes(':')) score += 1; // Lists or explanations
            if (sentence.match(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/)) score += 1; // Contains names

            // Length-based scoring (optimal length 30-150 chars)
            if (sentence.length >= 30 && sentence.length <= 150) score += 1;
            if (sentence.length < 20) score -= 2;
            if (sentence.length > 200) score -= 1;

            // Repetition penalty
            const words = sentence.toLowerCase().split(/\s+/);
            const uniqueWords = new Set(words);
            if (words.length > uniqueWords.size * 1.5) score -= 1;

            return { sentence, score: Math.max(0, score), index };
        });
    }

    /**
     * Extract main topics from transcript
     */
    private static extractTopics(text: string): string[] {
        const topicKeywords = {
            'technology': ['tech', 'software', 'app', 'digital', 'computer', 'internet', 'ai', 'machine learning'],
            'business': ['business', 'company', 'startup', 'market', 'revenue', 'profit', 'customer', 'product'],
            'education': ['learn', 'study', 'course', 'education', 'school', 'university', 'student', 'teacher'],
            'health': ['health', 'medical', 'fitness', 'wellness', 'doctor', 'treatment', 'medicine', 'exercise'],
            'science': ['science', 'research', 'study', 'experiment', 'data', 'analysis', 'theory', 'hypothesis'],
            'entertainment': ['movie', 'music', 'game', 'fun', 'entertainment', 'show', 'series', 'book']
        };

        const topics: string[] = [];
        const lowerText = text.toLowerCase();

        Object.entries(topicKeywords).forEach(([topic, keywords]) => {
            const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
            if (matches >= 2) {
                topics.push(topic);
            }
        });

        return topics;
    }

    /**
     * Generate contextual summary based on content analysis
     */
    private static generateContextualSummary(
        text: string, 
        keyInfo: any, 
        importantSentences: Array<{sentence: string, score: number, index: number}>, 
        topics: string[]
    ): string {
        // Select top sentences based on score
        const topSentences = importantSentences
            .sort((a, b) => b.score - a.score)
            .slice(0, Math.min(4, Math.max(2, Math.ceil(importantSentences.length * 0.3))))
            .sort((a, b) => a.index - b.index);

        let summary = topSentences.map(s => s.sentence).join('. ');

        // Add contextual information if relevant
        if (keyInfo.numbers.length > 0 && !summary.match(/\d+/)) {
            const importantNumber = keyInfo.numbers[0];
            summary = `The discussion mentions ${importantNumber}. ${summary}`;
        }

        if (topics.length > 0) {
            const topicContext = `This ${topics[0]}-focused discussion covers: ${summary}`;
            if (topicContext.length < 500) {
                summary = topicContext;
            }
        }

        // Ensure proper ending
        if (!summary.match(/[.!?]$/)) {
            summary += '.';
        }

        return summary;
    }

    /**
     * Post-process and validate summary
     */
    private static postProcessSummary(summary: string, originalText: string): string {
        // Clean up formatting
        summary = summary
            .replace(/\.\s*\./g, '.')
            .replace(/\s+/g, ' ')
            .trim();

        // Ensure summary is not too similar to original (avoid copying)
        const similarity = this.calculateSimilarity(summary, originalText);
        if (similarity > 0.8) {
            // If too similar, try to make it more concise
            const sentences = summary.split(/[.!?]+/).filter(s => s.trim());
            if (sentences.length > 2) {
                summary = sentences.slice(0, Math.ceil(sentences.length * 0.7)).join('. ') + '.';
            }
        }

        // Length validation and adjustment
        if (summary.length > 500) {
            const cutoff = summary.lastIndexOf('.', 500);
            summary = cutoff > 200 ? summary.substring(0, cutoff + 1) : summary.substring(0, 500) + '...';
        }

        // Ensure minimum meaningful content
        if (summary.length < 50) {
            const firstSentence = originalText.split(/[.!?]+/)[0];
            if (firstSentence && firstSentence.length > 20) {
                summary = firstSentence.substring(0, 200) + (firstSentence.length > 200 ? '...' : '');
            }
        }

        return summary;
    }

    /**
     * Calculate similarity between two texts (simple Jaccard similarity)
     */
    private static calculateSimilarity(text1: string, text2: string): number {
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size;
    }

    /**
     * Generate intelligent tags based on transcript and summary content
     */
    static generateTags(transcript: string, summary: string): string[] {
        const content = `${transcript} ${summary}`.toLowerCase();
        const words = content.split(/\s+/);
        const wordCount = words.length;
        
        if (wordCount === 0) return [];

        const tagScores: { [key: string]: number } = {};

        // Enhanced keyword categories with scoring weights
        const keywordCategories = {
            // Technology & Programming (high relevance)
            'artificial-intelligence': {
                keywords: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'neural network', 'deep learning', 'chatgpt', 'openai', 'llm', 'gpt'],
                weight: 3
            },
            'programming': {
                keywords: ['code', 'coding', 'programming', 'developer', 'software', 'algorithm', 'function', 'variable', 'debug', 'compile'],
                weight: 2.5
            },
            'web-development': {
                keywords: ['html', 'css', 'javascript', 'react', 'vue', 'angular', 'frontend', 'backend', 'api', 'website', 'web app'],
                weight: 2.5
            },
            'mobile-development': {
                keywords: ['mobile', 'ios', 'android', 'app development', 'flutter', 'react native', 'swift', 'kotlin', 'mobile app'],
                weight: 2.5
            },
            'data-science': {
                keywords: ['data', 'analytics', 'statistics', 'python', 'pandas', 'numpy', 'visualization', 'dataset', 'analysis'],
                weight: 2.5
            },
            'blockchain': {
                keywords: ['blockchain', 'crypto', 'bitcoin', 'ethereum', 'nft', 'defi', 'smart contract', 'cryptocurrency', 'web3'],
                weight: 2
            },
            'cloud-computing': {
                keywords: ['aws', 'azure', 'google cloud', 'cloud computing', 'docker', 'kubernetes', 'serverless', 'microservices'],
                weight: 2
            },
            'cybersecurity': {
                keywords: ['security', 'hacking', 'encryption', 'vulnerability', 'penetration testing', 'cybersecurity', 'firewall'],
                weight: 2
            },

            // Business & Industry
            'entrepreneurship': {
                keywords: ['startup', 'entrepreneur', 'business', 'funding', 'venture capital', 'investment', 'founder', 'pitch'],
                weight: 2
            },
            'marketing': {
                keywords: ['marketing', 'advertising', 'brand', 'social media', 'seo', 'content marketing', 'campaign', 'audience'],
                weight: 2
            },
            'finance': {
                keywords: ['finance', 'money', 'investment', 'trading', 'stock', 'market', 'economy', 'financial', 'budget'],
                weight: 2
            },
            'productivity': {
                keywords: ['productivity', 'time management', 'organization', 'efficiency', 'workflow', 'automation', 'optimization'],
                weight: 1.5
            },

            // Content Types
            'tutorial': {
                keywords: ['tutorial', 'how to', 'guide', 'step by step', 'learn', 'instruction', 'walkthrough', 'lesson'],
                weight: 2
            },
            'review': {
                keywords: ['review', 'opinion', 'analysis', 'comparison', 'pros and cons', 'rating', 'evaluation', 'assessment'],
                weight: 1.5
            },
            'news': {
                keywords: ['news', 'update', 'announcement', 'breaking', 'latest', 'current events', 'report', 'breaking news'],
                weight: 1.5
            },
            'interview': {
                keywords: ['interview', 'conversation', 'discussion', 'talk', 'podcast', 'q&a', 'chat', 'dialogue'],
                weight: 1.5
            },
            'entertainment': {
                keywords: ['entertainment', 'funny', 'comedy', 'humor', 'fun', 'amusing', 'hilarious', 'joke', 'meme'],
                weight: 1
            },

            // Specific Topics
            'gaming': {
                keywords: ['game', 'gaming', 'video game', 'gameplay', 'streamer', 'twitch', 'esports', 'gamer', 'console'],
                weight: 2
            },
            'health-fitness': {
                keywords: ['health', 'fitness', 'wellness', 'medical', 'nutrition', 'exercise', 'workout', 'diet', 'mental health'],
                weight: 2
            },
            'education': {
                keywords: ['education', 'learning', 'course', 'teaching', 'student', 'university', 'school', 'academic', 'study'],
                weight: 2
            },
            'science': {
                keywords: ['science', 'research', 'experiment', 'discovery', 'scientific', 'study', 'theory', 'hypothesis'],
                weight: 2
            },
            'travel': {
                keywords: ['travel', 'trip', 'vacation', 'destination', 'tourism', 'adventure', 'journey', 'explore'],
                weight: 1.5
            },
            'food': {
                keywords: ['food', 'cooking', 'recipe', 'restaurant', 'chef', 'cuisine', 'meal', 'dish', 'ingredient'],
                weight: 1.5
            }
        };

        // Calculate scores for each tag
        for (const [tag, config] of Object.entries(keywordCategories)) {
            let score = 0;
            let matchCount = 0;

            for (const keyword of config.keywords) {
                const keywordWords = keyword.split(' ');
                const keywordRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                const matches = content.match(keywordRegex);
                
                if (matches) {
                    const frequency = matches.length;
                    const normalizedFrequency = frequency / wordCount * 1000; // Normalize by content length
                    score += normalizedFrequency * config.weight;
                    matchCount++;
                }
            }

            // Bonus for multiple keyword matches in same category
            if (matchCount > 1) {
                score *= 1.2;
            }

            if (score > 0) {
                tagScores[tag] = score;
            }
        }

        // Add contextual tags based on patterns
        this.addContextualTags(content, tagScores);

        // Sort tags by score and return top ones
        const sortedTags = Object.entries(tagScores)
            .sort(([, a], [, b]) => b - a)
            .map(([tag]) => tag);

        // Return top 4-6 most relevant tags
        const topTags = sortedTags.slice(0, Math.min(6, Math.max(3, Math.floor(sortedTags.length * 0.6))));
        
        return topTags.length > 0 ? topTags : ['general'];
    }

    /**
     * Add contextual tags based on content patterns
     */
    private static addContextualTags(content: string, tagScores: { [key: string]: number }): void {
        // Question-heavy content
        const questionCount = (content.match(/\?/g) || []).length;
        if (questionCount > 3) {
            tagScores['q-and-a'] = (tagScores['q-and-a'] || 0) + 2;
        }

        // Time-based content
        if (content.match(/\b(minute|hour|day|week|month|year|time|schedule|deadline)\b/gi)) {
            tagScores['time-management'] = (tagScores['time-management'] || 0) + 1;
        }

        // Problem-solving content
        if (content.match(/\b(problem|solution|solve|fix|issue|troubleshoot|debug)\b/gi)) {
            tagScores['problem-solving'] = (tagScores['problem-solving'] || 0) + 2;
        }

        // Beginner-friendly content
        if (content.match(/\b(beginner|basic|introduction|getting started|first time|new to)\b/gi)) {
            tagScores['beginner-friendly'] = (tagScores['beginner-friendly'] || 0) + 1.5;
        }

        // Advanced content
        if (content.match(/\b(advanced|expert|professional|complex|sophisticated|in-depth)\b/gi)) {
            tagScores['advanced'] = (tagScores['advanced'] || 0) + 1.5;
        }

        // Tips and tricks
        if (content.match(/\b(tip|trick|hack|secret|technique|method|strategy)\b/gi)) {
            tagScores['tips-and-tricks'] = (tagScores['tips-and-tricks'] || 0) + 2;
        }
    }
}