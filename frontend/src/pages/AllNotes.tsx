import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { FileText, Search, Calendar, ArrowLeft, ExternalLink, Plus, Trash2, ChevronLeft, ChevronRight, Youtube, Instagram } from 'lucide-react';
import { API_ENDPOINTS, getVideoEndpoint } from '../config/api';

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

export const AllNotes = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    fetchAllVideos();
  }, []);

  useEffect(() => {
    filterVideos();
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchQuery, videos]);

  const fetchAllVideos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.VIDEOS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      toast({
        title: "Error",
        description: "Failed to fetch video transcripts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterVideos = () => {
    if (!searchQuery.trim()) {
      setFilteredVideos(videos);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = videos.filter(video => 
      video.title.toLowerCase().includes(query) ||
      video.summary.toLowerCase().includes(query) ||
      video.transcript.toLowerCase().includes(query) ||
      (video.tags && video.tags.toLowerCase().includes(query))
    );
    setFilteredVideos(filtered);
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
        fetchAllVideos(); // Refresh the list
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

  // Pagination logic
  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVideos = filteredVideos.slice(startIndex, endIndex);

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
            All Content Transcripts
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Search and explore all your processed video and social media transcripts
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary" />
            <Input
              placeholder="Search transcripts, titles, summaries, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 pr-4 text-lg bg-surface/50 border-white/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
          {currentVideos.length === 0 ? (
            <div className="text-center py-16 bg-card/30 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full mb-6">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-h3 mb-3">
                {searchQuery ? 'No matching transcripts found' : 'No video transcripts yet'}
              </h3>
              <p className="text-text-secondary max-w-md mx-auto mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms or browse all content' 
                  : 'Start by processing some YouTube videos or Instagram content to see them here!'
                }
              </p>
              {!searchQuery && (
                <Button 
                  asChild
                  className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
                >
                  <Link to="/">
                    <Plus className="h-4 w-4 mr-2" />
                    Process Your First Content
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            currentVideos.map((video, index) => (
              <div 
                key={video.id} 
                className="bg-card/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 cursor-pointer transition-all duration-200 animate-card-hover hover:bg-card/70"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Link to={`/notes/${video.id}`} className="block">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {video.platform === 'instagram' ? (
                          <Instagram className="h-4 w-4 text-secondary" />
                        ) : (
                          <Youtube className="h-4 w-4 text-primary" />
                        )}
                        <span className="text-xs text-text-secondary capitalize">
                          {video.platform || 'youtube'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg text-text-primary mb-2 line-clamp-2">
                        {video.title || `${video.platform === 'instagram' ? 'Instagram Content' : 'Video'} ${video.id}`}
                      </h3>
                      <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                        {video.summary || 'No summary available'}
                      </p>
                      {video.tags && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {video.tags.split(',').map((tag, tagIndex) => (
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
                        {video.transcript.substring(0, 150)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-text-secondary">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(video.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 bg-surface/50 border-white/20 hover:bg-secondary/20 hover:border-secondary/50"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(video.youtube_url, '_blank');
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
                          handleDeleteVideo(video.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Link>
              </div>
            ))
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
      {filteredVideos.length > 0 && (
        <div className="text-center text-sm text-text-secondary mt-4">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredVideos.length)} of {filteredVideos.length} videos
        </div>
      )}
    </div>
  );
};