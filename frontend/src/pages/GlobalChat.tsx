import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { MessageCircle, Send, ArrowLeft, Video, Trash2 } from 'lucide-react';

interface ChatMessage {
  id: number;
  message: string;
  response: string;
  created_at: string;
  matched_videos?: Array<{
    id: number;
    title: string;
    relevance_score: number;
  }>;
}

export const GlobalChat = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchChatMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/chat/global`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSendingMessage(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/chat/global`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage })
      });

      if (response.ok) {
        setNewMessage('');
        fetchChatMessages();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/chat/global`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setChatMessages([]);
        toast({
          title: "Success",
          description: "Chat history cleared successfully"
        });
      } else {
        throw new Error('Failed to clear chat');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear chat history",
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

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-10rem)] flex flex-col">
      {/* Compact Header */}
      <div className="flex-shrink-0 mb-2 flex justify-between items-center">
        <Button 
          variant="ghost" 
          asChild 
          className="mb-1 !text-white hover:!text-white hover:bg-white/10 transition-all duration-200"
        >
          <Link to="/" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
        
        {chatMessages.length > 0 && (
          <Button
            variant="ghost"
            onClick={handleClearChat}
            className="mb-1 !text-red-400 hover:!text-red-300 hover:bg-red-500/10 transition-all duration-200"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        )}
      </div>

      {/* Chat Container */}
      <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-white/10 flex flex-col flex-1 shadow-2xl min-h-0">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 sm:space-y-3">
          {chatMessages.length === 0 ? (
            <div className="text-center py-4 sm:py-6">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/20 rounded-full mb-2">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold mb-1">Start a conversation</h3>
              <p className="text-text-secondary max-w-md mx-auto mb-2 text-sm">
                Ask questions about any of your video content. I'll search across all your videos to find relevant information.
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewMessage("What are the main topics covered in my videos?")}
                  className="bg-surface/50 border-white/20 hover:bg-primary/20 hover:border-primary/50 text-sm h-6 px-2"
                >
                  Main topics
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewMessage("Summarize the key insights from my recent videos")}
                  className="bg-surface/50 border-white/20 hover:bg-primary/20 hover:border-primary/50 text-sm h-6 px-2"
                >
                  Key insights
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewMessage("What technical concepts are mentioned?")}
                  className="bg-surface/50 border-white/20 hover:bg-primary/20 hover:border-primary/50 text-sm h-6 px-2"
                >
                  Technical concepts
                </Button>
              </div>
            </div>
          ) : (
            chatMessages.map((chat, index) => (
              <div key={chat.id} className="space-y-1 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground p-2 rounded-2xl max-w-[80%] shadow-lg">
                    <p className="text-sm">{chat.message}</p>
                  </div>
                </div>
                
                {/* AI Response */}
                <div className="flex justify-start">
                  <div className="bg-surface/50 backdrop-blur-sm p-2 sm:p-3 rounded-2xl max-w-[80%] space-y-1 border border-white/10">
                    <p className="text-text-primary text-sm">{chat.response}</p>
                    
                    {/* Matched Videos */}
                    {chat.matched_videos && chat.matched_videos.length > 0 && (
                      <div className="border-t border-white/10 pt-2 mt-2">
                        <p className="text-xs font-semibold text-text-secondary mb-1 flex items-center">
                          <Video className="h-3 w-3 mr-1" />
                          Related videos:
                        </p>
                        <div className="space-y-1">
                          {chat.matched_videos.map((video) => (
                            <div key={video.id} className="flex items-center justify-between bg-card/30 p-2 rounded-lg">
                              <div className="flex items-center flex-1 min-w-0">
                                <div className="w-1.5 h-1.5 bg-accent rounded-full mr-2 flex-shrink-0"></div>
                                <span className="text-xs text-text-primary truncate">{video.title}</span>
                                <span className="text-xs text-text-secondary ml-1">
                                  (Score: {video.relevance_score})
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                asChild
                                className="h-6 px-2 ml-2 bg-primary/20 border-primary/50 hover:bg-primary/30 text-xs"
                              >
                                <Link to={`/notes/${video.id}`}>
                                  View
                                </Link>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Timestamp */}
                <div className="text-xs text-text-secondary text-center pb-1">
                  {new Date(chat.created_at).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'short'
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="border-t border-white/10 p-2 sm:p-3 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Ask about any of your videos..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="h-8 sm:h-9 pl-3 pr-9 bg-surface/50 border-white/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                disabled={isSendingMessage}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                {isSendingMessage ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent"></div>
                ) : (
                  <MessageCircle className="h-3 w-3 text-text-secondary" />
                )}
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={isSendingMessage || !newMessage.trim()}
              className="h-8 sm:h-9 px-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary transition-all duration-200 animate-scale-hover"
            >
              {isSendingMessage ? (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
              ) : (
                <Send className="h-3 w-3" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};