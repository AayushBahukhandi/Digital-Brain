import { useState, useRef } from 'react';
import { useToast } from './use-toast';

export interface TTSOptions {
  voice?: string;
}

export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const playAudio = async (audioUrl: string) => {
    return new Promise<void>((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.oncanplaythrough = async () => {
        try {
          setIsLoading(false);
          await audio.play();
          setIsPlaying(true);
          resolve();
        } catch (playError) {
          console.error('Play error:', playError);
          reject(playError);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };

      audio.onerror = (e) => {
        console.error('Audio error:', e);
        setIsPlaying(false);
        setIsLoading(false);
        audioRef.current = null;
        reject(new Error('Audio playback failed'));
      };

      audio.load();
    });
  };

  const playText = async (text: string, options: TTSOptions = {}) => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!text || text.trim().length === 0) {
      toast({
        title: "Error",
        description: "No text to convert to speech",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/tts/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.substring(0, 2000), // Limit text length
          voice: options.voice
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'TTS conversion failed');
      }

      const result = await response.json();
      
      if (result.success && result.audioUrl) {
        await playAudio(`http://localhost:3001${result.audioUrl}`);
      } else {
        throw new Error('Invalid TTS response');
      }

    } catch (error) {
      console.error('TTS error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'TTS conversion failed',
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const playSummary = async (videoId: string, options: TTSOptions = {}) => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:3001/api/tts/convert-summary/${videoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice: options.voice
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Summary TTS conversion failed');
      }

      const result = await response.json();
      
      if (result.success && result.audioUrl) {
        await playAudio(`http://localhost:3001${result.audioUrl}`);
        
        toast({
          title: "Playing Summary",
          description: `Now playing summary for: ${result.videoTitle}`,
        });
      } else {
        throw new Error('Invalid TTS response');
      }

    } catch (error) {
      console.error('Summary TTS error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Summary TTS failed',
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  };

  const testTTS = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/tts/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'TTS test failed');
      }

      const result = await response.json();
      
      if (result.success && result.audioUrl) {
        await playAudio(`http://localhost:3001${result.audioUrl}`);
        
        toast({
          title: "TTS Test",
          description: "Text-to-speech is working correctly!",
        });
      }

    } catch (error) {
      console.error('TTS test error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'TTS test failed',
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return {
    isPlaying,
    isLoading,
    playText,
    playSummary,
    stopAudio,
    testTTS
  };
};