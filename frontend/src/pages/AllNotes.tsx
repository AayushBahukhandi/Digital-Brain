import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { formatDate } from '../lib/utils';
import { FileText, Search, Calendar, ArrowLeft, ExternalLink, Plus, Trash2, ChevronLeft, ChevronRight, Youtube, Instagram, Edit3, Bot } from 'lucide-react';
import { API_ENDPOINTS, getVideoEndpoint, getNoteEndpoint } from '../config/api';

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

interface Note {
  id: number;
  title: string;
  content: string;
  tags?: string;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

type ContentItem = Video | (Note & { type: 'note' });

export const AllNotes = () => {
  const [_videos, setVideos] = useState<Video[]>([]);
  const [_notes, setNotes] = useState<Note[]>([]);
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    fetchAllContent();
  }, []);

  useEffect(() => {
    filterContent();
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchQuery, allContent]);

  const fetchAllContent = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch both videos and notes in parallel
      const [videosResponse, notesResponse] = await Promise.all([
        fetch(API_ENDPOINTS.VIDEOS, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(API_ENDPOINTS.NOTES, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const videosData = videosResponse.ok ? await videosResponse.json() : [];
      const notesData = notesResponse.ok ? await notesResponse.json() : [];

      setVideos(videosData);
      setNotes(notesData);

      // Combine and sort by creation date
      const combinedContent: ContentItem[] = [
        ...videosData,
        ...notesData.map((note: Note) => ({ ...note, type: 'note' as const }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setAllContent(combinedContent);
    } catch (error) {
      console.error('Failed to fetch content:', error);
      toast({
        title: "Error",
        description: "Failed to fetch content",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterContent = () => {
    if (!searchQuery.trim()) {
      setFilteredContent(allContent);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allContent.filter(item => {
      if ('type' in item && item.type === 'note') {
        // It's a note
        const note = item as Note & { type: 'note' };
        return note.title.toLowerCase().includes(query) ||
               note.content.toLowerCase().includes(query) ||
               (note.tags && note.tags.toLowerCase().includes(query));
      } else {
        // It's a video
        const video = item as Video;
        return video.title.toLowerCase().includes(query) ||
               video.summary.toLowerCase().includes(query) ||
               video.transcript.toLowerCase().includes(query) ||
               (video.tags && video.tags.toLowerCase().includes(query));
      }
    });
    setFilteredContent(filtered);
  };

  const handleDeleteVideo = async (videoId: number) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getVideoEndpoint(videoId.toString()), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Video deleted successfully"
        });
        fetchAllContent(); // Refresh the list
      } else {
        throw new Error('Failed to delete video');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive"
      });
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getNoteEndpoint(noteId.toString()), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Note deleted successfully"
        });
        fetchAllContent(); // Refresh the list
      } else {
        throw new Error('Failed to delete note');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredContent.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContent = filteredContent.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
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
          <h1 className="text-h1 mb-4 bg-gradient-to-r from-text-primary via-primary to-secondary bg-clip-text text-transparent">
            All Content
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Search and explore all your videos, notes, and social media content
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary" />
            <Input
              placeholder="Search videos, notes, titles, summaries, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 pr-4 text-lg bg-surface/50 border-white/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
          {currentContent.length === 0 ? (
            <div className="text-center py-16 bg-card/30 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full mb-6">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-h3 mb-3">
                {searchQuery ? 'No matching content found' : 'No content yet'}
              </h3>
              <p className="text-text-secondary max-w-md mx-auto mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms or browse all content' 
                  : 'Start by processing videos, creating notes, or asking AI to generate content!'
                }
              </p>
              {!searchQuery && (
                <div className="flex gap-3 justify-center">
                  <Button 
                    asChild
                    className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
                  >
                    <Link to="/">
                      <Plus className="h-4 w-4 mr-2" />
                      Process Content
                    </Link>
                  </Button>
                  <Button 
                    asChild
                    variant="outline"
                    className="bg-secondary/20 border-secondary/50 hover:bg-secondary/30"
                  >
                    <Link to="/my-notes">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Create Notes
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            currentContent.map((item, index) => {
              const isNote = 'type' in item && item.type === 'note';
              const video = isNote ? null : item as Video;
              const note = isNote ? item as Note & { type: 'note' } : null;
              
              return (
                <div 
                  key={isNote ? `note-${note!.id}` : `video-${video!.id}`}
                  className="bg-card/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 transition-all duration-200 animate-card-hover hover:bg-card/70"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {isNote ? (
                    // Note rendering
                    <Link to={`/note/${note!.id}`} className="block">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Edit3 className="h-4 w-4 text-primary" />
                            <span className="text-xs text-text-secondary">
                              {note!.is_ai_generated ? 'AI Generated Note' : 'Custom Note'}
                            </span>
                            {note!.is_ai_generated && (
                              <Bot className="h-3 w-3 text-secondary" />
                            )}
                          </div>
                          <h3 className="font-semibold text-lg text-text-primary mb-2 line-clamp-2">
                            {note!.title}
                          </h3>
                          <p className="text-sm text-text-primary line-clamp-3 mb-3">
                            {note!.content}
                          </p>
                          {note!.tags && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {note!.tags.split(',').map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
                                >
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-text-secondary">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(note!.created_at)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-3 bg-surface/50 border-white/20 hover:bg-destructive/20 hover:border-destructive/50"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteNote(note!.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    // Video rendering
                    <Link to={`/notes/${video!.id}`} className="block">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {video!.platform === 'instagram' ? (
                              <Instagram className="h-4 w-4 text-secondary" />
                            ) : (
                              <Youtube className="h-4 w-4 text-primary" />
                            )}
                            <span className="text-xs text-text-secondary capitalize">
                              {video!.platform || 'youtube'}
                            </span>
                          </div>
                          <h3 className="font-semibold text-lg text-text-primary mb-2 line-clamp-2">
                            {video!.title || `${video!.platform === 'instagram' ? 'Instagram Content' : 'Video'} ${video!.id}`}
                          </h3>
                          <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                            {video!.summary || 'No summary available'}
                          </p>
                          {video!.tags && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {video!.tags.split(',').map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
                                >
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-text-secondary line-clamp-2 bg-surface/50 p-3 rounded-lg">
                            {video!.transcript.substring(0, 150)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-text-secondary">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(video!.created_at)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-3 bg-surface/50 border-white/20 hover:bg-secondary/20 hover:border-secondary/50"
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(video!.youtube_url, '_blank');
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-3 bg-surface/50 border-white/20 hover:bg-destructive/20 hover:border-destructive/50"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteVideo(video!.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              );
            })
          )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-surface/50 border-white/20 hover:bg-primary/20 hover:border-primary/50"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(page)}
                className={
                  currentPage === page
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface/50 border-white/20 hover:bg-primary/20 hover:border-primary/50"
                }
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="bg-surface/50 border-white/20 hover:bg-primary/20 hover:border-primary/50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Results info */}
      {filteredContent.length > 0 && (
        <div className="text-center text-sm text-text-secondary mt-4">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredContent.length)} of {filteredContent.length} items
        </div>
      )}
    </div>
  );
};