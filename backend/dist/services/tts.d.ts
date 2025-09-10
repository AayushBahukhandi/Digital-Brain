export interface TTSOptions {
    voice?: string;
    speed?: number;
    outputPath?: string;
}
export declare class TTSService {
    private static readonly DEFAULT_VOICE;
    private static readonly MODELS_DIR;
    private static readonly OUTPUT_DIR;
    /**
     * Initialize TTS service - create output directory
     */
    static initialize(): Promise<void>;
    /**
     * Convert text to speech using Piper TTS
     */
    static textToSpeech(text: string, options?: TTSOptions): Promise<{
        success: boolean;
        audioPath?: string;
        error?: string;
    }>;
    /**
     * Run Piper TTS command
     */
    private static runPiperTTS;
    /**
     * Clean text for better TTS output
     */
    private static cleanTextForTTS;
    /**
     * Get available voices
     */
    static getAvailableVoices(): Promise<string[]>;
    /**
     * Clean up old audio files
     */
    static cleanupOldFiles(maxAgeHours?: number): Promise<void>;
    /**
     * Convert transcript summary to speech with smart chunking
     */
    static convertSummaryToSpeech(summary: string, options?: TTSOptions): Promise<{
        success: boolean;
        audioPath?: string;
        error?: string;
    }>;
    /**
     * Create fallback audio when TTS models are not available
     */
    private static createFallbackAudio;
    /**
     * Create a silent audio file as last resort
     */
    private static createSilentAudio;
}
//# sourceMappingURL=tts.d.ts.map