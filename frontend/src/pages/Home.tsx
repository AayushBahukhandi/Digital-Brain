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
    } else {
      toast({
        title: "Processing Content",
        description: "Extracting transcript and generating summary...",
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
      
      if (result.message && result.message.includes('updated successfully')) {
        toast({
          title: "Updated!",
          description: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} updated! Redirecting to notes...`
        });
      } else if (result.message && (result.message.includes('already processed') || result.message.includes('Found existing'))) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-background to-slate-800 relative overflow-hidden">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl animate-float"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Premium Hero Section */}
        <div className="text-center mb-20 animate-slide-up">
          {/* Platform Icons with enhanced design */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="group relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500/30 to-red-600/30 rounded-3xl backdrop-blur-sm border border-red-400/20 shadow-xl group-hover:scale-110 transition-transform duration-300">
                <Youtube className="h-8 w-8 text-red-400" />
              </div>
            </div>
            <div className="group relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-3xl backdrop-blur-sm border border-pink-400/20 shadow-xl group-hover:scale-110 transition-transform duration-300">
                <Instagram className="h-8 w-8 text-pink-400" />
              </div>
            </div>
            <div className="group relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-3xl backdrop-blur-sm border border-blue-400/20 shadow-xl group-hover:scale-110 transition-transform duration-300">
                <Twitter className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <div className="group relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 to-blue-700/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600/30 to-blue-700/30 rounded-3xl backdrop-blur-sm border border-blue-500/20 shadow-xl group-hover:scale-110 transition-transform duration-300">
                <Facebook className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>
          
          {/* Enhanced main heading */}
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent">
              Video & Social
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient">
              Summarizer
            </span>
          </h1>
          
          {/* Enhanced subtitle */}
          <p className="text-2xl sm:text-3xl text-slate-300 max-w-4xl mx-auto leading-relaxed mb-12 font-light">
            Transform YouTube videos, Instagram content, X/Twitter posts, and Facebook videos into 
            <span className="text-primary font-semibold"> concise, searchable summaries</span> using AI. 
            Get instant insights and chat with your content.
          </p>

          {/* Premium feature highlights */}
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            <div className="group flex items-center gap-3 px-6 py-3 bg-slate-800/50 rounded-full backdrop-blur-sm border border-slate-700/50 hover:border-primary/50 transition-all duration-300 hover:scale-105">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-slate-300 font-medium">AI-Powered Intelligence</span>
            </div>
            <div className="group flex items-center gap-3 px-6 py-3 bg-slate-800/50 rounded-full backdrop-blur-sm border border-slate-700/50 hover:border-secondary/50 transition-all duration-300 hover:scale-105">
              <div className="w-8 h-8 bg-gradient-to-br from-secondary to-secondary-dark rounded-full flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-slate-300 font-medium">Lightning Fast</span>
            </div>
            <div className="group flex items-center gap-3 px-6 py-3 bg-slate-800/50 rounded-full backdrop-blur-sm border border-slate-700/50 hover:border-accent/50 transition-all duration-300 hover:scale-105">
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent-hover rounded-full flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="text-slate-300 font-medium">Smart Conversations</span>
            </div>
          </div>
        </div>

        {/* Premium Video Input Card */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="relative group">
            {/* Enhanced glow effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500 animate-pulse-slow"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-3xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
            
            <div className="relative bg-slate-800/40 backdrop-blur-2xl rounded-3xl border border-slate-700/50 p-10 sm:p-16 shadow-2xl group-hover:border-primary/40 transition-all duration-500 group-hover:shadow-primary/10">
              <div className="text-center mb-10">
                {/* Enhanced platform icons */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="group/icon relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-red-500/30 to-red-600/30 rounded-2xl blur-lg opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500/40 to-red-600/40 rounded-2xl backdrop-blur-sm border border-red-400/30 shadow-xl group-hover/icon:scale-110 transition-transform duration-300">
                      <Youtube className="h-8 w-8 text-red-400" />
                    </div>
                  </div>
                  <div className="group/icon relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-2xl blur-lg opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500/40 to-purple-500/40 rounded-2xl backdrop-blur-sm border border-pink-400/30 shadow-xl group-hover/icon:scale-110 transition-transform duration-300">
                      <Instagram className="h-8 w-8 text-pink-400" />
                    </div>
                  </div>
                  <div className="group/icon relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-2xl blur-lg opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/40 to-cyan-500/40 rounded-2xl backdrop-blur-sm border border-blue-400/30 shadow-xl group-hover/icon:scale-110 transition-transform duration-300">
                      <Twitter className="h-8 w-8 text-blue-400" />
                    </div>
                  </div>
                  <div className="group/icon relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/30 to-blue-700/30 rounded-2xl blur-lg opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600/40 to-blue-700/40 rounded-2xl backdrop-blur-sm border border-blue-500/30 shadow-xl group-hover/icon:scale-110 transition-transform duration-300">
                      <Facebook className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                </div>
                
                <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-slate-100 to-primary bg-clip-text text-transparent">
                  Add Content to Summarize
                </h2>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  Paste your YouTube, Instagram, X (Twitter), or Facebook URL below to get started with 
                  <span className="text-primary font-semibold"> AI-powered summarization</span>
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition duration-500"></div>
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
                      className="h-20 text-xl pl-8 pr-40 bg-slate-700/50 border-slate-600/50 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 rounded-3xl backdrop-blur-sm truncate shadow-xl"
                      disabled={isProcessing}
                    />
                    <div className="absolute right-8 top-1/2 transform -translate-y-1/2 flex items-center gap-3">
                      {currentPlatform && !isProcessing && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full border border-primary/30 backdrop-blur-sm">
                          {currentPlatform === 'instagram' ? (
                            <Instagram className="h-4 w-4 text-pink-400" />
                          ) : currentPlatform === 'x' ? (
                            <Twitter className="h-4 w-4 text-blue-400" />
                          ) : currentPlatform === 'facebook' ? (
                            <Facebook className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Youtube className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-sm text-white font-medium capitalize">
                            {currentPlatform === 'x' ? 'X' : currentPlatform}
                          </span>
                        </div>
                      )}
                      {isProcessing && (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                          <span className="text-sm text-slate-300">Processing...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isProcessing || !url.trim()}
                  className="group relative w-full h-20 text-2xl font-bold bg-gradient-to-r from-primary via-primary-dark to-secondary hover:from-secondary hover:via-primary hover:to-accent transition-all duration-500 rounded-3xl shadow-2xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative flex items-center justify-center">
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mr-4"></div>
                        <span>
                          {currentPlatform === 'instagram' ? 'Processing Instagram Content (1-3 min)...' : 
                           currentPlatform === 'x' ? 'Processing X/Twitter Content (1-3 min)...' :
                           currentPlatform === 'facebook' ? 'Processing Facebook Content (1-3 min)...' : 
                           'Processing Content...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Play className="h-8 w-8 mr-4 group-hover:scale-110 transition-transform duration-300" />
                        <span>Summarize Content</span>
                        <ArrowRight className="h-6 w-6 ml-4 group-hover:translate-x-2 transition-transform duration-300" />
                      </>
                    )}
                  </div>
                </Button>
              </form>
              
              <div className="mt-12 text-center">
                {!url.trim() ? (
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-accent/10 to-accent/20 rounded-full backdrop-blur-sm border border-accent/30 shadow-lg">
                    <Sparkles className="h-5 w-5 text-accent" />
                    <p className="text-slate-300 font-medium">
                      💡 Tip: Copy the URL directly from your browser's address bar
                    </p>
                  </div>
                ) : currentPlatform && (
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/10 to-secondary/20 rounded-full backdrop-blur-sm border border-primary/30 shadow-lg">
                    {currentPlatform === 'instagram' ? (
                      <>
                        <Instagram className="h-5 w-5 text-pink-400" />
                        <p className="text-slate-300 font-medium">
                          Instagram content detected • Processing takes 1-3 min
                        </p>
                      </>
                    ) : currentPlatform === 'x' ? (
                      <>
                        <Twitter className="h-5 w-5 text-blue-400" />
                        <p className="text-slate-300 font-medium">
                          X/Twitter content detected • Processing takes 1-3 min
                        </p>
                      </>
                    ) : currentPlatform === 'facebook' ? (
                      <>
                        <Facebook className="h-5 w-5 text-blue-500" />
                        <p className="text-slate-300 font-medium">
                          Facebook content detected • Processing takes 1-3 min
                        </p>
                      </>
                    ) : (
                      <>
                        <Youtube className="h-5 w-5 text-red-400" />
                        <p className="text-slate-300 font-medium">
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

        {/* Premium status indicators */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-8 px-8 py-4 bg-slate-800/30 rounded-2xl backdrop-blur-sm border border-slate-700/50 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse"></div>
              <span className="text-slate-300 font-medium">Powered by AI</span>
            </div>
            <div className="w-px h-6 bg-slate-600"></div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gradient-to-r from-secondary to-accent rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <span className="text-slate-300 font-medium">Secure & Fast</span>
            </div>
            <div className="w-px h-6 bg-slate-600"></div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gradient-to-r from-accent to-primary rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              <span className="text-slate-300 font-medium">Free to Use</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};