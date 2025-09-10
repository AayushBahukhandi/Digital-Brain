import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { ChevronDown, Volume2, Loader2 } from 'lucide-react';
import { API_ENDPOINTS, getAudioUrl } from '../config/api';

interface Voice {
  id: string;
  name: string;
  description: string;
  gender: string;
}

interface VoiceSelectorProps {
  selectedVoice?: string;
  onVoiceChange: (voiceId: string) => void;
  onTest?: (voiceId: string) => void;
  className?: string;
}

export const VoiceSelector = ({ 
  selectedVoice, 
  onVoiceChange, 
  onTest,
  className = '' 
}: VoiceSelectorProps) => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TTS_VOICES);
      if (response.ok) {
        const data = await response.json();
        setVoices(data.voices || []);
        
        // Set default voice if none selected
        if (!selectedVoice && data.default) {
          onVoiceChange(data.default);
        }
      }
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      toast({
        title: "Error",
        description: "Failed to load available voices",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceSelect = (voiceId: string) => {
    onVoiceChange(voiceId);
    setIsOpen(false);
  };

  const handleTestVoice = async (voiceId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (onTest) {
      onTest(voiceId);
      return;
    }

    // Default test implementation
    setTestingVoice(voiceId);
    
    try {
      const response = await fetch(API_ENDPOINTS.TTS_CONVERT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Hello! This is a test of the ${voices.find(v => v.id === voiceId)?.name || voiceId} voice.`,
          voice: voiceId
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.audioUrl) {
          const audio = new Audio(getAudioUrl(result.audioUrl));
          await audio.play();
        }
      }
    } catch (error) {
      console.error('Voice test error:', error);
      toast({
        title: "Error",
        description: "Failed to test voice",
        variant: "destructive"
      });
    } finally {
      setTestingVoice(null);
    }
  };

  const selectedVoiceInfo = voices.find(v => v.id === selectedVoice);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-text-secondary">Loading voices...</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between bg-surface/50 border-white/20 hover:bg-primary/20 hover:border-primary/50"
      >
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          <span>{selectedVoiceInfo?.name || 'Select Voice'}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {voices.map((voice) => (
            <div
              key={voice.id}
              className={`flex items-center justify-between p-3 hover:bg-primary/10 cursor-pointer border-b border-white/10 last:border-b-0 ${
                selectedVoice === voice.id ? 'bg-primary/20' : ''
              }`}
              onClick={() => handleVoiceSelect(voice.id)}
            >
              <div className="flex-1">
                <div className="font-medium text-text-primary">{voice.name}</div>
                <div className="text-sm text-text-secondary">{voice.description}</div>
                <div className="text-xs text-text-secondary capitalize">
                  {voice.gender} • {voice.id}
                </div>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => handleTestVoice(voice.id, e)}
                disabled={testingVoice === voice.id}
                className="ml-2 h-8 w-8 p-0 hover:bg-secondary/20"
              >
                {testingVoice === voice.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};