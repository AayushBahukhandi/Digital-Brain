import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export interface EdgeTTSOptions {
  voice?: string;
  rate?: string;
  pitch?: string;
  outputPath?: string;
}

export interface EdgeTTSVoice {
  name: string;
  displayName: string;
  gender: string;
  locale: string;
  description?: string;
}

export class EdgeTTSService {
  private static readonly OUTPUT_DIR = path.join(process.cwd(), 'audio-output');
  private static readonly DEFAULT_VOICE = 'en-US-AriaNeural';
  private static readonly VOICES_CACHE_FILE = path.join(process.cwd(), 'voices-cache.json');

  // Popular voices with character
  private static readonly POPULAR_VOICES: EdgeTTSVoice[] = [
    { name: 'en-US-AriaNeural', displayName: 'Aria (Female, US)', gender: 'Female', locale: 'en-US', description: 'Friendly and warm' },
    { name: 'en-US-DavisNeural', displayName: 'Davis (Male, US)', gender: 'Male', locale: 'en-US', description: 'Confident and clear' },
    { name: 'en-US-JennyNeural', displayName: 'Jenny (Female, US)', gender: 'Female', locale: 'en-US', description: 'Professional and articulate' },
    { name: 'en-US-GuyNeural', displayName: 'Guy (Male, US)', gender: 'Male', locale: 'en-US', description: 'Casual and approachable' },
    { name: 'en-US-AmberNeural', displayName: 'Amber (Female, US)', gender: 'Female', locale: 'en-US', description: 'Energetic and enthusiastic' },
    { name: 'en-US-BrandonNeural', displayName: 'Brandon (Male, US)', gender: 'Male', locale: 'en-US', description: 'Calm and reassuring' },
    { name: 'en-US-EmmaNeural', displayName: 'Emma (Female, US)', gender: 'Female', locale: 'en-US', description: 'Young and vibrant' },
    { name: 'en-US-RyanNeural', displayName: 'Ryan (Male, US)', gender: 'Male', locale: 'en-US', description: 'Smooth and engaging' },
    { name: 'en-GB-SoniaNeural', displayName: 'Sonia (Female, UK)', gender: 'Female', locale: 'en-GB', description: 'Elegant British accent' },
    { name: 'en-GB-RyanNeural', displayName: 'Ryan (Male, UK)', gender: 'Male', locale: 'en-GB', description: 'Professional British accent' },
    { name: 'en-AU-NatashaNeural', displayName: 'Natasha (Female, AU)', gender: 'Female', locale: 'en-AU', description: 'Friendly Australian accent' },
    { name: 'en-AU-KenNeural', displayName: 'Ken (Male, AU)', gender: 'Male', locale: 'en-AU', description: 'Relaxed Australian accent' },
  ];

  /**
   * Initialize Edge TTS service
   */
  static async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.OUTPUT_DIR, { recursive: true });
      console.log('Edge TTS service initialized');
    } catch (error) {
      console.error('Failed to initialize Edge TTS service:', error);
      throw error;
    }
  }

  /**
   * Convert text to speech using Edge TTS
   */
  static async textToSpeech(
    text: string,
    options: EdgeTTSOptions = {}
  ): Promise<{ success: boolean; audioPath?: string; error?: string }> {
    try {
      const voice = options.voice || this.DEFAULT_VOICE;
      const rate = options.rate || '+0%';
      const pitch = options.pitch || '+0Hz';

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `edge_tts_${timestamp}.wav`;
      const outputPath = options.outputPath || path.join(this.OUTPUT_DIR, filename);

      // Clean text for TTS
      const cleanText = this.cleanTextForTTS(text);

      if (cleanText.length === 0) {
        return {
          success: false,
          error: 'No valid text content to convert to speech'
        };
      }

      console.log(`Converting text to speech with Edge TTS: ${cleanText.substring(0, 100)}...`);

      // Run Edge TTS
      const success = await this.runEdgeTTS(cleanText, voice, rate, pitch, outputPath);

      if (success) {
        console.log(`Edge TTS conversion successful: ${outputPath}`);
        return {
          success: true,
          audioPath: outputPath
        };
      } else {
        return {
          success: false,
          error: 'Edge TTS conversion failed'
        };
      }

    } catch (error) {
      console.error('Edge TTS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Edge TTS error'
      };
    }
  }

  /**
   * Run Edge TTS command
   */
  private static async runEdgeTTS(
    text: string,
    voice: string,
    rate: string,
    pitch: string,
    outputPath: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      // Try different edge-tts command locations
      const edgeTTSCommands = [
        'edge-tts',
        'python3 -m edge_tts',
        '/opt/venv/bin/edge-tts',
        '/usr/local/bin/edge-tts'
      ];

      let edgeTTSCommand = edgeTTSCommands[0];
      let edgeTTSArgs: string[] = [];

      // Check which edge-tts command is available
      for (const cmd of edgeTTSCommands) {
        if (cmd.includes('python3')) {
          edgeTTSCommand = 'python3';
          edgeTTSArgs = ['-m', 'edge_tts', '--voice', voice, '--rate', rate, '--pitch', pitch, '--file', outputPath, '--text', text];
        } else {
          edgeTTSCommand = cmd;
          edgeTTSArgs = ['--voice', voice, '--rate', rate, '--pitch', pitch, '--file', outputPath, '--text', text];
        }
        break; // Use first available command
      }

      console.log(`Running Edge TTS with: ${edgeTTSCommand} ${edgeTTSArgs.join(' ')}`);

      const edgeTTS = spawn(edgeTTSCommand, edgeTTSArgs, {
        env: { 
          ...process.env, 
          PATH: '/opt/venv/bin:/usr/local/bin:' + process.env.PATH,
          PYTHONPATH: '/opt/venv/lib/python3.11/site-packages'
        }
      });

      let errorOutput = '';

      edgeTTS.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      edgeTTS.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          console.error('Edge TTS error:', errorOutput);
          resolve(false);
        }
      });

      edgeTTS.on('error', (error) => {
        console.error('Edge TTS spawn error:', error);
        resolve(false);
      });
    });
  }

  /**
   * Clean text for better TTS output
   */
  private static cleanTextForTTS(text: string): string {
    return text
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      // Remove email addresses
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might cause issues
      .replace(/[^\w\s.,!?;:()\-'"]/g, '')
      // Remove brackets and their content (like [Music], [Applause])
      .replace(/\[.*?\]/g, '')
      // Remove parentheses with technical terms
      .replace(/\([^)]*\)/g, '')
      // Clean up punctuation
      .replace(/\.{2,}/g, '.')
      .replace(/,{2,}/g, ',')
      // Trim and ensure it ends with proper punctuation
      .trim()
      .replace(/([^.!?])$/, '$1.');
  }

  /**
   * Get available voices
   */
  static async getAvailableVoices(): Promise<EdgeTTSVoice[]> {
    try {
      // Try to get voices from cache first
      try {
        const cachedVoices = await fs.readFile(this.VOICES_CACHE_FILE, 'utf-8');
        const voices = JSON.parse(cachedVoices);
        if (Array.isArray(voices) && voices.length > 0) {
          return voices;
        }
      } catch {
        // Cache doesn't exist or is invalid, will fetch fresh
      }

      // Fetch voices from Edge TTS
      const voices = await this.fetchVoicesFromEdgeTTS();
      
      // Cache the voices for future use
      try {
        await fs.writeFile(this.VOICES_CACHE_FILE, JSON.stringify(voices, null, 2));
      } catch {
        // Ignore cache write errors
      }

      return voices;
    } catch (error) {
      console.error('Error getting available voices:', error);
      return this.POPULAR_VOICES; // Return popular voices as fallback
    }
  }

  /**
   * Fetch voices from Edge TTS
   */
  private static async fetchVoicesFromEdgeTTS(): Promise<EdgeTTSVoice[]> {
    return new Promise((resolve) => {
      const edgeTTS = spawn('edge-tts', ['--list-voices'], {
        env: { 
          ...process.env, 
          PATH: '/opt/venv/bin:/usr/local/bin:' + process.env.PATH
        }
      });

      let output = '';
      let errorOutput = '';

      edgeTTS.stdout.on('data', (data) => {
        output += data.toString();
      });

      edgeTTS.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      edgeTTS.on('close', (code) => {
        if (code === 0 && output) {
          try {
            const voices = JSON.parse(output);
            const processedVoices = voices.map((voice: any) => ({
              name: voice.ShortName,
              displayName: `${voice.FriendlyName} (${voice.Gender}, ${voice.Locale})`,
              gender: voice.Gender,
              locale: voice.Locale,
              description: voice.Description || ''
            }));
            resolve(processedVoices);
          } catch {
            resolve(this.POPULAR_VOICES);
          }
        } else {
          console.error('Edge TTS voices error:', errorOutput);
          resolve(this.POPULAR_VOICES);
        }
      });

      edgeTTS.on('error', () => {
        resolve(this.POPULAR_VOICES);
      });
    });
  }

  /**
   * Get popular voices for dropdown
   */
  static getPopularVoices(): EdgeTTSVoice[] {
    return this.POPULAR_VOICES;
  }

  /**
   * Convert transcript summary to speech with smart chunking
   */
  static async convertSummaryToSpeech(
    summary: string,
    options: EdgeTTSOptions = {}
  ): Promise<{ success: boolean; audioPath?: string; error?: string }> {
    // Limit summary length for TTS
    const maxLength = 2000;
    let processedSummary = summary;

    if (summary.length > maxLength) {
      // Find a good breaking point near the limit
      const breakPoint = summary.lastIndexOf('.', maxLength);
      if (breakPoint > maxLength * 0.7) {
        processedSummary = summary.substring(0, breakPoint + 1);
      } else {
        processedSummary = summary.substring(0, maxLength) + '.';
      }
    }

    return this.textToSpeech(processedSummary, options);
  }

  /**
   * Clean up old audio files
   */
  static async cleanupOldFiles(maxAgeHours: number = 24): Promise<void> {
    try {
      const files = await fs.readdir(this.OUTPUT_DIR);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        if (file.startsWith('edge_tts_') && file.endsWith('.wav')) {
          const filePath = path.join(this.OUTPUT_DIR, file);
          const stats = await fs.stat(filePath);

          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            console.log(`Cleaned up old Edge TTS file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old Edge TTS files:', error);
    }
  }
}
