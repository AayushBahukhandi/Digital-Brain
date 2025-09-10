export interface VoiceNote {
    id: string;
    filename: string;
    transcript: string;
    summary: string;
    tags: string[];
    duration?: number;
    createdAt: Date;
}
export interface RecordingOptions {
    duration?: number;
    sampleRate?: number;
    channels?: number;
}
export declare class VoiceNotesService {
    private static readonly RECORDINGS_DIR;
    private static readonly DEFAULT_SAMPLE_RATE;
    private static readonly DEFAULT_CHANNELS;
    /**
     * Initialize voice notes service
     */
    static initialize(): Promise<void>;
    /**
     * Start recording audio (returns recording process info)
     */
    static startRecording(options?: RecordingOptions): Promise<{
        success: boolean;
        recordingId?: string;
        error?: string;
    }>;
    /**
     * Process uploaded audio file and convert to voice note
     */
    static processAudioFile(audioBuffer: Buffer, originalFilename: string): Promise<{
        success: boolean;
        voiceNote?: VoiceNote;
        error?: string;
    }>;
    /**
     * Convert audio to text (placeholder - you might want to integrate with a proper STT service)
     */
    private static convertAudioToText;
    /**
     * Check if recording capabilities are available
     */
    private static checkRecordingCapabilities;
    /**
     * Get audio file path
     */
    static getAudioPath(filename: string): string;
    /**
     * Delete voice note audio file
     */
    static deleteAudioFile(filename: string): Promise<boolean>;
    /**
     * Clean up old recordings
     */
    static cleanupOldRecordings(maxAgeHours?: number): Promise<void>;
}
//# sourceMappingURL=voice-notes.d.ts.map