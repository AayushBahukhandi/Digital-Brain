import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { VoiceSelector } from '../components/VoiceSelector';
import { useToast } from '../hooks/use-toast';
import { useTTS } from '../hooks/use-tts';
import { Mic, MicOff, Upload, Play, Pause, Trash2, Volume2, VolumeX, Loader2, FileAudio } from 'lucide-react';
import { API_ENDPOINTS, getVoiceNoteEndpoint, getAudioUrl } from '../config/api';

interface VoiceNote {
  id: string;
  filename: string;
  transcript: string;
  summary: string;
  tags: string[];
  audioUrl: string;
  createdAt: string;
}

export const VoiceNotes = () => {
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>('en_US-lessac-medium');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const { isPlaying: ttsPlaying, isLoading: ttsLoading, playText } = useTTS();

  useEffect(() => {
    fetchVoiceNotes();
  }, []);

  const fetchVoiceNotes = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.VOICE_NOTES);
      if (response.ok) {
        const data = await response.json();
        setVoiceNotes(data);
      }
    } catch (error) {
      console.error('Failed to fetch voice notes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch voice notes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await uploadAudioBlob(audioBlob, 'recording.wav');
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone",
      });

    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Error",
        description: "Failed to start recording. Please check microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording Stopped",
        description: "Processing your voice note...",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAudioBlob(file, file.name);
    }
  };

  const uploadAudioBlob = async (audioBlob: Blob, filename: string) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, filename);

      const response = await fetch(API_ENDPOINTS.VOICE_NOTES_UPLOAD, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: "Success",
            description: "Voice note processed successfully",
          });
          fetchVoiceNotes(); // Refresh the list
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteVoiceNote = async (noteId: string) => {
    try {
      const response = await fetch(getVoiceNoteEndpoint(noteId), {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Voice note deleted successfully",
        });
        fetchVoiceNotes(); // Refresh the list
      } else {
        throw new Error('Delete failed');
      }

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete voice note",
        variant: "destructive"
      });
    }
  };

  const playAudio = (noteId: string) => {
    if (playingNoteId === noteId) {
      // Stop current audio
      const audio = document.getElementById(`audio-${noteId}`) as HTMLAudioElement;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingNoteId(null);
    } else {
      // Stop any currently playing audio
      if (playingNoteId) {
        const currentAudio = document.getElementById(`audio-${playingNoteId}`) as HTMLAudioElement;
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }
      
      // Play new audio
      const audio = document.getElementById(`audio-${noteId}`) as HTMLAudioElement;
      if (audio) {
        audio.play();
        setPlayingNoteId(noteId);
      }
    }
  };

  const handleAudioEnded = () => {
    setPlayingNoteId(null);
  };

  const filteredNotes = voiceNotes.filter(note =>
    note.transcript.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-h1 mb-4 bg-gradient-to-r from-text-primary via-primary to-secondary bg-clip-text text-transparent">
          Voice Notes
        </h1>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
          Record voice notes, upload audio files, and get AI-powered transcripts and summaries
        </p>
      </div>

      {/* Recording Controls */}
      <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
            className={`h-16 px-8 text-lg font-semibold transition-all duration-200 ${
              isRecording 
                ? 'bg-destructive/20 border-destructive/50 hover:bg-destructive/30 text-destructive' 
                : 'bg-primary/20 border-primary/50 hover:bg-primary/30'
            }`}
          >
            {isRecording ? (
              <>
                <MicOff className="h-6 w-6 mr-3" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-6 w-6 mr-3" />
                Start Recording
              </>
            )}
          </Button>

          <div className="text-text-secondary">or</div>

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isRecording || isUploading}
            variant="outline"
            className="h-16 px-8 text-lg bg-secondary/20 border-secondary/50 hover:bg-secondary/30"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 mr-3" />
                Upload Audio
              </>
            )}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {isRecording && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/20 rounded-full">
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
              <span className="text-destructive font-medium">Recording in progress...</span>
            </div>
          </div>
        )}
      </div>

      {/* Voice Selection & Search */}
      <div className="mb-8 space-y-4">
        <div className="max-w-md mx-auto">
          <label className="block text-sm font-medium text-text-secondary mb-2 text-center">
            TTS Voice for Playback
          </label>
          <VoiceSelector
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            className="w-full"
          />
        </div>
        
        {voiceNotes.length > 0 && (
          <div>
            <Input
              placeholder="Search voice notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md mx-auto"
            />
          </div>
        )}
      </div>

      {/* Voice Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <FileAudio className="h-16 w-16 text-text-secondary mx-auto mb-4" />
          <h3 className="text-h3 mb-3">
            {searchQuery ? 'No matching voice notes found' : 'No voice notes yet'}
          </h3>
          <p className="text-text-secondary max-w-md mx-auto mb-6">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Start by recording a voice note or uploading an audio file'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredNotes.map((note) => (
            <div key={note.id} className="bg-card/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <FileAudio className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      Voice Note
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => playAudio(note.id)}
                    className="bg-primary/20 border-primary/50 hover:bg-primary/30"
                  >
                    {playingNoteId === note.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => playText(note.summary || note.transcript, { voice: selectedVoice })}
                    disabled={ttsLoading}
                    className="bg-secondary/20 border-secondary/50 hover:bg-secondary/30"
                    title="Listen with TTS"
                  >
                    {ttsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : ttsPlaying ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteVoiceNote(note.id)}
                    className="text-destructive hover:bg-destructive/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Hidden audio element */}
              <audio
                id={`audio-${note.id}`}
                src={getAudioUrl(note.audioUrl)}
                onEnded={handleAudioEnded}
                preload="none"
              />

              {/* Summary */}
              {note.summary && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-text-secondary mb-2">Summary</h4>
                  <p className="text-text-primary bg-surface/50 p-4 rounded-lg">
                    {note.summary}
                  </p>
                </div>
              )}

              {/* Transcript */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-text-secondary mb-2">Transcript</h4>
                <p className="text-text-primary bg-surface/50 p-4 rounded-lg font-mono text-sm max-h-32 overflow-y-auto">
                  {note.transcript}
                </p>
              </div>

              {/* Tags */}
              {note.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-text-secondary mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {note.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};