export interface VoiceNote {
    id: string;
    filename: string;
    transcript: string;
    summary: string;
    tags: string[];
    duration?: number;
    createdAt: Date;
    followupRecordings?: FollowupRecording[];
    meetingId?: string;
}
export interface FollowupRecording {
    id: string;
    filename: string;
    transcript: string;
    summary: string;
    createdAt: Date;
    parentNoteId: string;
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
    /**
     * Add a followup recording to an existing voice note
     */
    static addFollowupRecording(parentNoteId: string, audioBuffer: Buffer, originalFilename: string): Promise<{
        success: boolean;
        followupRecording?: FollowupRecording;
        error?: string;
    }>;
    /**
     * Get all followup recordings for a voice note
     */
    static getFollowupRecordings(parentNoteId: string): Promise<FollowupRecording[]>;
    /**
     * Create a meeting session with multiple recordings
     */
    static createMeetingSession(meetingId?: string): Promise<{
        success: boolean;
        meetingId: string;
        error?: string;
    }>;
    /**
     * Add recording to a meeting session
     */
    static addToMeeting(meetingId: string, audioBuffer: Buffer, originalFilename: string, isFollowup?: boolean): Promise<{
        success: boolean;
        voiceNote?: VoiceNote;
        followupRecording?: FollowupRecording;
        error?: string;
    }>;
    /**
     * Generate comprehensive meeting summary
     */
    static generateMeetingSummary(meetingId: string, allRecordings: (VoiceNote | FollowupRecording)[]): Promise<string>;
}
//# sourceMappingURL=voice-notes.d.ts.map