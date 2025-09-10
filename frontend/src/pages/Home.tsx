import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { Play, Youtube, Instagram, Twitter, Facebook, Sparkles, Zap, Brain, ArrowRight } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';


export const Home = () => {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState<'youtube' | 'instagram' | 'x' | 'facebook' | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a YouTube, Instagram, X (Twitter), or Facebook URL",
        variant: "destructive"
      });
      return;
    }

    // Check if URL is supported
    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
    const isInstagram = url.includes('instagram.com');
    const isX = url.includes('x.com') || url.includes('twitter.com');
    const isFacebook = url.includes('facebook.com');
    
    if (!isYoutube && !isInstagram && !isX && !isFacebook) {
      toast({
        title: "Unsupported URL",
        description: "Please enter a valid YouTube, Instagram, X (Twitter), or Facebook URL",
        variant: "destructive"
      });
      return;
    }

    // Set current platform for UI updates
    let platform: 'youtube' | 'instagram' | 'x' | 'facebook' = 'youtube';
    if (isInstagram) platform = 'instagram';
    else if (isX) platform = 'x';
    else if (isFacebook) platform = 'facebook';
    
    setCurrentPlatform(platform);
    setIsProcessing(true);
    
    // Show different loading message for social media platforms
    if (isInstagram) {
      toast({
        title: "Processing Instagram Content",
        description: "This may take 1-3 minutes to complete. Please wait...",
      });
    } else if (isX) {
      toast({
        title: "Processing X/Twitter Content",
        description: "This may take 1-3 minutes to complete. Please wait...",
      });
    } else if (isFacebook) {
      toast({
        title: "Processing Facebook Content",
        description: "This may take 1-3 minutes to complete. Please wait...",
      });
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.PROCESS_VIDEO, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error('Failed to process video');
      }

      const result = await response.json();
      
      const platform = result.platform || 'video';
      const contentType = platform === 'instagram' ? 'Instagram content' : 
                         platform === 'x' ? 'X/Twitter content' :
                         platform === 'facebook' ? 'Facebook content' : 'video';
      
      if (result.message && result.message.includes('already processed')) {
        toast({
          title: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Found!`,
          description: "Redirecting to notes..."
        });
      } else {
        toast({
          title: "Success!",
          description: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} processed! Redirecting to notes...`
        });
      }
      
      setUrl('');
      setCurrentPlatform(null);
      // Redirect to notes page
      navigate(`/notes/${result.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setCurrentPlatform(null);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-slate-900/50">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-slide-up">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl backdrop-blur-sm border border-white/10">
              <Youtube className="h-7 w-7 text-primary" />
            </div>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-2xl backdrop-blur-sm border border-white/10">
              <Instagram className="h-7 w-7 text-secondary" />
            </div>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl backdrop-blur-sm border border-white/10">
              <Twitter className="h-7 w-7 text-blue-400" />
            </div>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-2xl backdrop-blur-sm border border-white/10">
              <Facebook className="h-7 w-7 text-blue-500" />
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-r from-text-primary via-primary to-secondary bg-clip-text text-transparent leading-tight">
            Video & Social
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Summarizer
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed mb-8">
            Transform YouTube videos, Instagram content, X/Twitter posts, and Facebook videos into concise, searchable summaries using AI. 
            Get instant insights and chat with your content.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 px-4 py-2 bg-surface/50 rounded-full backdrop-blur-sm border border-white/10">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-text-secondary">AI-Powered</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-surface/50 rounded-full backdrop-blur-sm border border-white/10">
              <Zap className="h-4 w-4 text-secondary" />
              <span className="text-sm text-text-secondary">Instant Results</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-surface/50 rounded-full backdrop-blur-sm border border-white/10">
              <Brain className="h-4 w-4 text-accent" />
              <span className="text-sm text-text-secondary">Smart Chat</span>
            </div>
          </div>
        </div>

        {/* Video Input Card */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-3xl blur opacity-75 animate-pulse-slow"></div>
            
            <div className="relative bg-card/60 backdrop-blur-xl rounded-3xl border border-white/20 p-8 sm:p-12 shadow-2xl animate-slide-up hover:border-primary/30 transition-all duration-300">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg">
                    <Youtube className="h-7 w-7 text-primary" />
                  </div>
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-secondary/30 to-accent/30 rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg">
                    <Instagram className="h-7 w-7 text-secondary" />
                  </div>
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500/30 to-blue-600/30 rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg">
                    <Twitter className="h-7 w-7 text-blue-400" />
                  </div>
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600/30 to-blue-700/30 rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg">
                    <Facebook className="h-7 w-7 text-blue-500" />
                  </div>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-text-primary to-primary bg-clip-text text-transparent">
                  Add Content to Summarize
                </h2>
                <p className="text-lg text-text-secondary max-w-lg mx-auto">
                  Paste your YouTube, Instagram, X (Twitter), or Facebook URL below to get started with AI-powered summarization
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative">
                    <Input
                      type="url"
                      placeholder="Paste YouTube, Instagram, X/Twitter, or Facebook URL here..."
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        // Update platform indicator as user types
                        const newUrl = e.target.value;
                        if (newUrl.includes('instagram.com')) {
                          setCurrentPlatform('instagram');
                        } else if (newUrl.includes('youtube.com') || newUrl.includes('youtu.be')) {
                          setCurrentPlatform('youtube');
                        } else if (newUrl.includes('x.com') || newUrl.includes('twitter.com')) {
                          setCurrentPlatform('x');
                        } else if (newUrl.includes('facebook.com')) {
                          setCurrentPlatform('facebook');
                        } else {
                          setCurrentPlatform(null);
                        }
                      }}
                      className="h-16 text-lg pl-8 pr-32 bg-surface/60 border-white/30 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 rounded-2xl backdrop-blur-sm truncate"
                      disabled={isProcessing}
                    />
                    <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      {currentPlatform && !isProcessing && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-primary/20 rounded-full">
                          {currentPlatform === 'instagram' ? (
                            <Instagram className="h-3 w-3 text-secondary" />
                          ) : currentPlatform === 'x' ? (
                            <Twitter className="h-3 w-3 text-blue-400" />
                          ) : currentPlatform === 'facebook' ? (
                            <Facebook className="h-3 w-3 text-blue-500" />
                          ) : (
                            <Youtube className="h-3 w-3 text-primary" />
                          )}
                          <span className="text-xs text-text-primary capitalize">
                            {currentPlatform === 'x' ? 'X' : currentPlatform}
                          </span>
                        </div>
                      )}
                      {isProcessing && (
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isProcessing || !url.trim()}
                  className="w-full h-16 text-xl font-bold bg-gradient-to-r from-primary via-primary to-primary-dark hover:from-primary-dark hover:via-primary hover:to-secondary transition-all duration-300 animate-scale-hover rounded-2xl shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-4"></div>
                      {currentPlatform === 'instagram' ? 'Processing Instagram Content (1-3 min)...' : 
                       currentPlatform === 'x' ? 'Processing X/Twitter Content (1-3 min)...' :
                       currentPlatform === 'facebook' ? 'Processing Facebook Content (1-3 min)...' : 
                       'Processing Content...'}
                    </>
                  ) : (
                    <>
                      <Play className="h-6 w-6 mr-4" />
                      Summarize Content
                      <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </Button>
              </form>
              
              <div className="mt-8 text-center">
                {!url.trim() ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full backdrop-blur-sm border border-accent/20">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <p className="text-sm text-text-secondary">
                      Tip: Copy the URL directly from your browser's address bar
                    </p>
                  </div>
                ) : currentPlatform && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full backdrop-blur-sm border border-primary/20">
                    {currentPlatform === 'instagram' ? (
                      <>
                        <Instagram className="h-4 w-4 text-secondary" />
                        <p className="text-sm text-text-secondary">
                          Instagram content detected • Processing takes 1-3 min
                        </p>
                      </>
                    ) : currentPlatform === 'x' ? (
                      <>
                        <Twitter className="h-4 w-4 text-blue-400" />
                        <p className="text-sm text-text-secondary">
                          X/Twitter content detected • Processing takes 1-3 min
                        </p>
                      </>
                    ) : currentPlatform === 'facebook' ? (
                      <>
                        <Facebook className="h-4 w-4 text-blue-500" />
                        <p className="text-sm text-text-secondary">
                          Facebook content detected • Processing takes 1-3 min
                        </p>
                      </>
                    ) : (
                      <>
                        <Youtube className="h-4 w-4 text-primary" />
                        <p className="text-sm text-text-secondary">
                          YouTube video detected • Processing takes 10-30 seconds
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional visual elements */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-text-muted">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm">Powered by AI</span>
            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <span className="text-sm">Secure & Fast</span>
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            <span className="text-sm">Free to Use</span>
          </div>
        </div>
      </div>
    </div>
  );
};