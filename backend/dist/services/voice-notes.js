import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { TranscriptService } from './transcript.js';
export class VoiceNotesService {
    /**
     * Initialize voice notes service
     */
    static async initialize() {
        try {
            await fs.mkdir(this.RECORDINGS_DIR, { recursive: true });
            console.log('Voice notes service initialized');
        }
        catch (error) {
            console.error('Failed to initialize voice notes service:', error);
            throw error;
        }
    }
    /**
     * Start recording audio (returns recording process info)
     */
    static async startRecording(options = {}) {
        try {
            const recordingId = `recording_${Date.now()}`;
            const filename = `${recordingId}.wav`;
            const filePath = path.join(this.RECORDINGS_DIR, filename);
            const sampleRate = options.sampleRate || this.DEFAULT_SAMPLE_RATE;
            const channels = options.channels || this.DEFAULT_CHANNELS;
            // Check if we have recording capabilities
            const hasRecording = await this.checkRecordingCapabilities();
            if (!hasRecording) {
                return {
                    success: false,
                    error: 'Recording not available. Please install sox or ensure microphone access.'
                };
            }
            console.log(`Starting recording: ${recordingId}`);
            // For now, we'll return the recording ID and let the client handle the actual recording
            // In a real implementation, you might want to use a different approach
            return {
                success: true,
                recordingId
            };
        }
        catch (error) {
            console.error('Recording start error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown recording error'
            };
        }
    }
    /**
     * Process uploaded audio file and convert to voice note
     */
    static async processAudioFile(audioBuffer, originalFilename) {
        try {
            const recordingId = `upload_${Date.now()}`;
            const filename = `${recordingId}.wav`;
            const filePath = path.join(this.RECORDINGS_DIR, filename);
            // Save the audio file
            await fs.writeFile(filePath, audioBuffer);
            console.log(`Audio file saved: ${filename}`);
            // Convert to text using a simple approach (you might want to integrate with a proper STT service)
            const transcript = await this.convertAudioToText(filePath);
            if (!transcript || transcript.length < 10) {
                return {
                    success: false,
                    error: 'Could not extract meaningful text from audio. Please ensure clear speech and good audio quality.'
                };
            }
            // Generate summary and tags
            const summary = await TranscriptService.generateSummary(transcript);
            const tags = TranscriptService.generateTags(transcript, summary);
            const voiceNote = {
                id: recordingId,
                filename,
                transcript,
                summary,
                tags,
                createdAt: new Date()
            };
            console.log(`Voice note processed: ${transcript.length} chars`);
            return {
                success: true,
                voiceNote
            };
        }
        catch (error) {
            console.error('Audio processing error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown audio processing error'
            };
        }
    }
    /**
     * Convert audio to text (placeholder - you might want to integrate with a proper STT service)
     */
    static async convertAudioToText(audioPath) {
        // This is a placeholder implementation
        // In a real app, you'd integrate with services like:
        // - OpenAI Whisper
        // - Google Speech-to-Text
        // - Azure Speech Services
        // - AWS Transcribe
        try {
            // For now, return a placeholder message
            // You can replace this with actual STT integration
            const stats = await fs.stat(audioPath);
            const duration = Math.round(stats.size / (16000 * 2)); // Rough estimate
            return `[Voice note recorded - ${duration}s duration. Transcript would be generated here with a proper Speech-to-Text service like OpenAI Whisper, Google Speech-to-Text, or similar. The audio file has been saved and can be processed when STT integration is added.]`;
        }
        catch (error) {
            console.error('STT conversion error:', error);
            return '';
        }
    }
    /**
     * Check if recording capabilities are available
     */
    static async checkRecordingCapabilities() {
        return new Promise((resolve) => {
            // Check if sox is available (common audio tool)
            const sox = spawn('which', ['sox']);
            sox.on('close', (code) => {
                resolve(code === 0);
            });
            sox.on('error', () => {
                resolve(false);
            });
        });
    }
    /**
     * Get audio file path
     */
    static getAudioPath(filename) {
        return path.join(this.RECORDINGS_DIR, filename);
    }
    /**
     * Delete voice note audio file
     */
    static async deleteAudioFile(filename) {
        try {
            const filePath = path.join(this.RECORDINGS_DIR, filename);
            await fs.unlink(filePath);
            console.log(`Deleted audio file: ${filename}`);
            return true;
        }
        catch (error) {
            console.error('Error deleting audio file:', error);
            return false;
        }
    }
    /**
     * Clean up old recordings
     */
    static async cleanupOldRecordings(maxAgeHours = 48) {
        try {
            const files = await fs.readdir(this.RECORDINGS_DIR);
            const now = Date.now();
            const maxAge = maxAgeHours * 60 * 60 * 1000;
            for (const file of files) {
                if (file.endsWith('.wav')) {
                    const filePath = path.join(this.RECORDINGS_DIR, file);
                    const stats = await fs.stat(filePath);
                    if (now - stats.mtime.getTime() > maxAge) {
                        await fs.unlink(filePath);
                        console.log(`Cleaned up old recording: ${file}`);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error cleaning up old recordings:', error);
        }
    }
    /**
     * Add a followup recording to an existing voice note
     */
    static async addFollowupRecording(parentNoteId, audioBuffer, originalFilename) {
        try {
            const followupId = `followup_${Date.now()}`;
            const filename = `${followupId}.wav`;
            const filePath = path.join(this.RECORDINGS_DIR, filename);
            // Save the audio file
            await fs.writeFile(filePath, audioBuffer);
            console.log(`Followup audio file saved: ${filename}`);
            // Convert to text
            const transcript = await this.convertAudioToText(filePath);
            if (!transcript || transcript.length < 10) {
                return {
                    success: false,
                    error: 'Could not extract meaningful text from followup audio. Please ensure clear speech and good audio quality.'
                };
            }
            // Generate summary and tags for the followup
            const summary = await TranscriptService.generateSummary(transcript);
            const followupRecording = {
                id: followupId,
                filename,
                transcript,
                summary,
                createdAt: new Date(),
                parentNoteId
            };
            console.log(`Followup recording processed: ${transcript.length} chars`);
            return {
                success: true,
                followupRecording
            };
        }
        catch (error) {
            console.error('Followup recording processing error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown followup processing error'
            };
        }
    }
    /**
     * Get all followup recordings for a voice note
     */
    static async getFollowupRecordings(parentNoteId) {
        // This would typically query a database
        // For now, return empty array as we don't have persistent storage for followups yet
        return [];
    }
    /**
     * Create a meeting session with multiple recordings
     */
    static async createMeetingSession(meetingId) {
        try {
            const sessionId = meetingId || `meeting_${Date.now()}`;
            console.log(`Created meeting session: ${sessionId}`);
            return {
                success: true,
                meetingId: sessionId
            };
        }
        catch (error) {
            console.error('Error creating meeting session:', error);
            return {
                success: false,
                meetingId: '',
                error: error instanceof Error ? error.message : 'Unknown error creating meeting session'
            };
        }
    }
    /**
     * Add recording to a meeting session
     */
    static async addToMeeting(meetingId, audioBuffer, originalFilename, isFollowup = false) {
        try {
            if (isFollowup) {
                // Add as followup to the most recent note in the meeting
                const followupResult = await this.addFollowupRecording(meetingId, audioBuffer, originalFilename);
                return {
                    success: followupResult.success,
                    followupRecording: followupResult.followupRecording,
                    error: followupResult.error
                };
            }
            else {
                // Add as new voice note in the meeting
                const result = await this.processAudioFile(audioBuffer, originalFilename);
                if (result.success && result.voiceNote) {
                    result.voiceNote.meetingId = meetingId;
                }
                return result;
            }
        }
        catch (error) {
            console.error('Error adding to meeting:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error adding to meeting'
            };
        }
    }
    /**
     * Generate comprehensive meeting summary
     */
    static async generateMeetingSummary(meetingId, allRecordings) {
        try {
            if (allRecordings.length === 0) {
                return 'No recordings found for this meeting.';
            }
            // Combine all transcripts
            const allTranscripts = allRecordings
                .map(recording => recording.transcript)
                .join(' ');
            // Generate a comprehensive summary
            const meetingSummary = await TranscriptService.generateSummary(allTranscripts);
            // Add meeting context
            const context = `Meeting Summary (${allRecordings.length} recordings):\n\n${meetingSummary}`;
            return context;
        }
        catch (error) {
            console.error('Error generating meeting summary:', error);
            return 'Error generating meeting summary.';
        }
    }
}
VoiceNotesService.RECORDINGS_DIR = path.join(process.cwd(), 'voice-recordings');
VoiceNotesService.DEFAULT_SAMPLE_RATE = 16000;
VoiceNotesService.DEFAULT_CHANNELS = 1;
//# sourceMappingURL=voice-notes.js.map