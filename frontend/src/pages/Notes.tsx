import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { VoiceSelector } from '../components/VoiceSelector';
import { useToast } from '../hooks/use-toast';
import { useTTS } from '../hooks/use-tts';
import { ArrowLeft, ExternalLink, ChevronDown, ChevronUp, Tag, Plus, X, Youtube, Instagram, RefreshCw, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { getVideoEndpoint, getVideoTagsEndpoint, getVideoTitleEndpoint, getVideoRegenerateTagsEndpoint } from '../config/api';

interface Video {
  id: number;
  youtube_url: string;
  title: string;
  summary: string;
  transcript: string;
  tags?: string;
  platform?: string;
  created_at: string;
}

export const Notes = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('en_US-lessac-medium');
  const { toast } = useToast();
  const { isPlaying, isLoading: ttsLoading, playSummary } = useTTS();

  useEffect(() => {
    if (videoId) {
      fetchVideoData();
    }
  }, [videoId]);

  const fetchVideoData = async () => {
    if (!videoId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getVideoEndpoint(videoId), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setVideo(data);
        // Initialize tags from video data
        if (data.tags) {
          setTags(data.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag));
        } else {
          setTags([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch video:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTags = async () => {
    if (!video) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getVideoTagsEndpoint(video.id.toString()), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tags }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Tags updated successfully"
        });
        setIsEditingTags(false);
        // Update the video object
        setVideo({ ...video, tags: tags.join(',') });
      } else {
        throw new Error('Failed to update tags');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tags",
        variant: "destructive"
      });
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFixTitle = async () => {
    if (!video) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getVideoTitleEndpoint(video.id.toString()), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({}), // Empty body to trigger auto-fetch
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: "Content title updated successfully"
        });
        // Update the video object
        setVideo({ ...video, title: result.title });
      } else {
        throw new Error('Failed to update title');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update content title",
        variant: "destructive"
      });
    }
  };

  const handleRegenerateTags = async () => {
    if (!video) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getVideoRegenerateTagsEndpoint(video.id.toString()), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        const result = await response.json();
        const newTags = result.tags || [];
        setTags(newTags);
        setVideo({ ...video, tags: newTags.join(',') });
        toast({
          title: "Success",
          description: `Generated ${newTags.length} auto tags based on content`
        });
      } else {
        throw new Error('Failed to regenerate tags');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate tags",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Video not found</h2>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          asChild 
          className="mb-6 text-text-secondary hover:text-text-primary hover:bg-primary/10 transition-all duration-200"
        >
          <Link to="/" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
        
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {video.platform === 'instagram' ? (
              <Instagram className="h-8 w-8 text-secondary" />
            ) : (
              <Youtube className="h-8 w-8 text-primary" />
            )}
            <span className="text-sm text-text-secondary capitalize">
              {video.platform || 'youtube'} content
            </span>
          </div>
          <h1 className="text-h1 mb-4 bg-gradient-to-r from-text-primary via-primary to-secondary bg-clip-text text-transparent">
            {video.title || `${video.platform === 'instagram' ? 'Instagram Content' : 'Video'} ${video.id}`}
          </h1>
          <p className="text-xl text-text-secondary">
            {video.platform === 'instagram' ? 'Instagram content' : 'Video'} transcript and summary
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Card */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8 animate-slide-up">
            <div className="flex items-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full mr-4">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-h3 text-text-primary">Summary</h2>
            </div>
            
            <div className="bg-surface/50 p-6 rounded-xl mb-6">
              <p className="text-text-primary leading-relaxed">
                {video.summary || 'No summary available'}
              </p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => playSummary(video.id.toString(), { voice: selectedVoice })}
                  disabled={ttsLoading || !video.summary}
                  className="flex-1 h-12 bg-secondary/20 border-secondary/50 hover:bg-secondary/30 transition-all duration-200"
                >
                  {ttsLoading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : isPlaying ? (
                    <VolumeX className="h-5 w-5 mr-2" />
                  ) : (
                    <Volume2 className="h-5 w-5 mr-2" />
                  )}
                  {ttsLoading ? 'Converting...' : isPlaying ? 'Stop Audio' : 'Listen to Summary'}
                </Button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Voice Selection
                </label>
                <VoiceSelector
                  selectedVoice={selectedVoice}
                  onVoiceChange={setSelectedVoice}
                  className="w-full"
                />
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFullTranscript(!showFullTranscript)}
              className="w-full h-12 bg-surface/50 border-white/20 hover:bg-primary/20 hover:border-primary/50 transition-all duration-200"
            >
              {showFullTranscript ? 'Hide' : 'Show'} Full Transcript
              {showFullTranscript ? <ChevronUp className="h-5 w-5 ml-2" /> : <ChevronDown className="h-5 w-5 ml-2" />}
            </Button>
          </div>
          
          {/* Transcript Card */}
          {showFullTranscript && (
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8 animate-slide-up">
              <div className="flex items-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary/20 rounded-full mr-4">
                  <svg className="h-6 w-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </div>
                <h2 className="text-h3 text-text-primary">Full Transcript</h2>
              </div>
              
              <div className="bg-surface/50 p-6 rounded-xl max-h-96 overflow-y-auto">
                <p className="text-text-primary leading-relaxed whitespace-pre-wrap font-mono text-sm">
                  {video.transcript || 'No transcript available'}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Video Info Card */}
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 sticky top-24">
            <h3 className="text-h3 text-text-primary mb-4">Video Details</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-text-secondary mb-2">Processed</h4>
                <p className="text-text-primary">{new Date(video.created_at).toLocaleString()}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-text-secondary mb-2">Platform</h4>
                <div className="flex items-center gap-2">
                  {video.platform === 'instagram' ? (
                    <Instagram className="h-4 w-4 text-secondary" />
                  ) : (
                    <Youtube className="h-4 w-4 text-primary" />
                  )}
                  <span className="text-text-primary capitalize">{video.platform || 'youtube'}</span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-text-secondary">Content Title</h4>
                  {video.title && (video.title.startsWith('Video ') || video.title.startsWith('Instagram ')) && video.platform === 'youtube' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleFixTitle}
                      className="h-6 px-2 text-xs bg-secondary/20 border-secondary/50 hover:bg-secondary/30"
                    >
                      Fix Title
                    </Button>
                  )}
                </div>
                <p className="text-text-primary">{video.title || `Untitled ${video.platform === 'instagram' ? 'Content' : 'Video'}`}</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-text-secondary">Tags</h4>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRegenerateTags}
                      className="h-6 px-2 text-xs bg-accent/20 border-accent/50 hover:bg-accent/30"
                      title="Auto-generate tags based on content"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingTags(!isEditingTags)}
                      className="h-6 px-2 text-xs bg-primary/20 border-primary/50 hover:bg-primary/30"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {isEditingTags ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                </div>
                
                {isEditingTags ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        className="h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={addTag}
                        className="h-8 px-3 bg-primary/20 border-primary/50 hover:bg-primary/30"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveTags}
                        className="flex-1 h-8 text-xs bg-primary/20 border-primary/50 hover:bg-primary/30"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditingTags(false)}
                        className="flex-1 h-8 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {tags.length > 0 ? (
                      tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <p className="text-text-secondary text-xs">No tags added</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => window.open(video.youtube_url, '_blank')}
                className="w-full bg-secondary/20 border-secondary/50 hover:bg-secondary/30"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {video.platform === 'instagram' ? 'View Content' : 'Watch Video'}
              </Button>
              <Button
                variant="outline"
                asChild
                className="w-full bg-primary/20 border-primary/50 hover:bg-primary/30"
              >
                <Link to="/chat">
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Global Chat
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};