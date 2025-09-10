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
export declare class TranscriptService {
    /**
     * Extract transcript from a video URL using external API
     */
    static extractTranscript(url: string): Promise<TranscriptResult>;
    /**
     * Call external transcript API
     */
    private static callExternalTranscriptAPI;
    /**
     * Call YouTube transcript API
     */
    private static callYouTubeAPI;
    /**
     * Call Instagram transcript API using Dictationer
     */
    private static callInstagramAPI;
    /**
     * Convert captions array to plain text transcript
     */
    private static convertCaptionsToText;
    /**
     * Get YouTube video title directly from YouTube
     */
    static getYouTubeTitle(videoId: string): Promise<string>;
    /**
     * Detect platform from URL
     */
    static detectPlatform(url: string): string;
    /**
     * Extract video ID from various YouTube URL formats
     */
    static extractVideoId(url: string): string | null;
    /**
     * Extract Instagram reel/post ID from URL
     */
    static extractInstagramId(url: string): string | null;
    /**
     * Generate a summary from transcript text with improved intelligence
     */
    static generateSummary(transcript: string): string;
    /**
     * Generate intelligent tags based on transcript and summary content
     */
    static generateTags(transcript: string, summary: string): string[];
    /**
     * Add contextual tags based on content patterns
     */
    private static addContextualTags;
}
//# sourceMappingURL=transcript.d.ts.map