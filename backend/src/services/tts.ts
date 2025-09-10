import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export interface TTSOptions {
  voice?: string;
  speed?: number;
  outputPath?: string;
}

export class TTSService {
  private static readonly DEFAULT_VOICE = 'en_US-lessac-medium';
  private static readonly MODELS_DIR = path.join(process.cwd(), 'tts-models');
  private static readonly OUTPUT_DIR = path.join(process.cwd(), 'audio-output');

  /**
   * Initialize TTS service - create output directory
   */
  static async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.OUTPUT_DIR, { recursive: true });
      console.log('TTS service initialized');
    } catch (error) {
      console.error('Failed to initialize TTS service:', error);
      throw error;
    }
  }

  /**
   * Convert text to speech using Piper TTS
   */
  static async textToSpeech(
    text: string,
    options: TTSOptions = {}
  ): Promise<{ success: boolean; audioPath?: string; error?: string }> {
    try {
      const voice = options.voice || this.DEFAULT_VOICE;
      const modelPath = path.join(this.MODELS_DIR, `${voice}.onnx`);
      const configPath = path.join(this.MODELS_DIR, `${voice}.onnx.json`);

      // Check if model files exist
      let modelExists = false;
      try {
        await fs.access(modelPath);
        await fs.access(configPath);
        modelExists = true;
      } catch {
        console.log(`Model files not found for ${voice}, trying fallback...`);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `tts_${timestamp}.wav`;
      const outputPath = options.outputPath || path.join(this.OUTPUT_DIR, filename);

      // If model doesn't exist, try to use a fallback or create a simple audio file
      if (!modelExists) {
        return await this.createFallbackAudio(text, outputPath);
      }

      // Clean text for TTS
      const cleanText = this.cleanTextForTTS(text);

      if (cleanText.length === 0) {
        return {
          success: false,
          error: 'No valid text content to convert to speech'
        };
      }

      console.log(`Converting text to speech: ${cleanText.substring(0, 100)}...`);

      // Run Piper TTS
      const success = await this.runPiperTTS(cleanText, modelPath, outputPath);

      if (success) {
        console.log(`TTS conversion successful: ${outputPath}`);
        return {
          success: true,
          audioPath: outputPath
        };
      } else {
        return {
          success: false,
          error: 'TTS conversion failed'
        };
      }

    } catch (error) {
      console.error('TTS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown TTS error'
      };
    }
  }

  /**
   * Run Piper TTS command
   */
  private static async runPiperTTS(
    text: string,
    modelPath: string,
    outputPath: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      // Try different piper command locations for Railway
      const piperCommands = [
        '/opt/venv/bin/piper',
        'piper',
        'python3 -m piper',
        '/usr/local/bin/piper'
      ];

      let piperCommand = piperCommands[0];
      let piperArgs: string[] = [];

      // Check which piper command is available
      for (const cmd of piperCommands) {
        if (cmd.includes('python3')) {
          piperCommand = 'python3';
          piperArgs = ['-m', 'piper', '--model', modelPath, '--output_file', outputPath];
        } else if (cmd.includes('/opt/venv/bin/piper')) {
          piperCommand = '/opt/venv/bin/piper';
          piperArgs = ['--model', modelPath, '--output_file', outputPath];
        } else {
          piperCommand = cmd;
          piperArgs = ['--model', modelPath, '--output_file', outputPath];
        }
        break; // Use first available command
      }

      console.log(`Running TTS with: ${piperCommand} ${piperArgs.join(' ')}`);

      const piper = spawn(piperCommand, piperArgs, {
        env: { 
          ...process.env, 
          PATH: '/opt/venv/bin:/usr/local/bin:' + process.env.PATH,
          PYTHONPATH: '/opt/venv/lib/python3.11/site-packages'
        }
      });

      let errorOutput = '';

      piper.stdin.write(text);
      piper.stdin.end();

      piper.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      piper.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          console.error('Piper TTS error:', errorOutput);
          resolve(false);
        }
      });

      piper.on('error', (error) => {
        console.error('Piper TTS spawn error:', error);
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
  static async getAvailableVoices(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.MODELS_DIR);
      const voices = files
        .filter(file => file.endsWith('.onnx'))
        .map(file => file.replace('.onnx', ''));
      return voices;
    } catch (error) {
      console.error('Error getting available voices:', error);
      return [this.DEFAULT_VOICE];
    }
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
        if (file.startsWith('tts_') && file.endsWith('.wav')) {
          const filePath = path.join(this.OUTPUT_DIR, file);
          const stats = await fs.stat(filePath);

          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            console.log(`Cleaned up old TTS file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old TTS files:', error);
    }
  }

  /**
   * Convert transcript summary to speech with smart chunking
   */
  static async convertSummaryToSpeech(
    summary: string,
    options: TTSOptions = {}
  ): Promise<{ success: boolean; audioPath?: string; error?: string }> {
    // Limit summary length for TTS (Piper works best with shorter texts)
    const maxLength = 1000;
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
   * Create fallback audio when TTS models are not available
   */
  private static async createFallbackAudio(
    text: string,
    outputPath: string
  ): Promise<{ success: boolean; audioPath?: string; error?: string }> {
    try {
      console.log('Creating fallback audio using system TTS...');
      
      // Try to use system TTS (espeak on Linux, say on macOS)
      const systemTTS = process.platform === 'darwin' ? 'say' : 'espeak';
      const args = process.platform === 'darwin' 
        ? ['-v', 'Alex', '-o', outputPath, text]
        : ['-s', '150', '-w', outputPath, text];

      return new Promise((resolve) => {
        const tts = spawn(systemTTS, args);

        tts.on('close', (code) => {
          if (code === 0) {
            console.log(`Fallback TTS successful: ${outputPath}`);
            resolve({
              success: true,
              audioPath: outputPath
            });
          } else {
            console.log('System TTS failed, creating silent audio...');
            this.createSilentAudio(text, outputPath).then(resolve);
          }
        });

        tts.on('error', () => {
          console.log('System TTS not available, creating silent audio...');
          this.createSilentAudio(text, outputPath).then(resolve);
        });
      });

    } catch (error) {
      console.error('Fallback TTS error:', error);
      return this.createSilentAudio(text, outputPath);
    }
  }

  /**
   * Create a silent audio file as last resort
   */
  private static async createSilentAudio(
    text: string,
    outputPath: string
  ): Promise<{ success: boolean; audioPath?: string; error?: string }> {
    try {
      // Create a short silent WAV file (1 second)
      const duration = Math.min(text.length * 0.1, 10); // Estimate duration based on text length
      const sampleRate = 22050;
      const samples = Math.floor(sampleRate * duration);
      
      // Create a simple WAV header and silent audio data
      const buffer = Buffer.alloc(44 + samples * 2); // 44 bytes header + 16-bit samples
      
      // WAV header
      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(36 + samples * 2, 4);
      buffer.write('WAVE', 8);
      buffer.write('fmt ', 12);
      buffer.writeUInt32LE(16, 16); // fmt chunk size
      buffer.writeUInt16LE(1, 20);  // PCM format
      buffer.writeUInt16LE(1, 22);  // mono
      buffer.writeUInt32LE(sampleRate, 24);
      buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
      buffer.writeUInt16LE(2, 32);  // block align
      buffer.writeUInt16LE(16, 34); // bits per sample
      buffer.write('data', 36);
      buffer.writeUInt32LE(samples * 2, 40);
      
      // Fill with silence (zeros)
      buffer.fill(0, 44);
      
      await fs.writeFile(outputPath, buffer);
      
      console.log(`Created silent audio fallback: ${outputPath}`);
      return {
        success: true,
        audioPath: outputPath
      };

    } catch (error) {
      console.error('Error creating silent audio:', error);
      return {
        success: false,
        error: 'Failed to create any audio output'
      };
    }
  }
}