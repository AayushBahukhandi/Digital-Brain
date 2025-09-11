import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';
import { formatDate } from '../lib/utils';
import { 
  ArrowLeft, 
  Plus, 
  Bot, 
  Save, 
  X, 
  Edit3, 
  Trash2, 
  Loader2,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS, getNoteEndpoint } from '../config/api';

interface Note {
  id: number;
  title: string;
  content: string;
  tags: string;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

interface AIResponse {
  success: boolean;
  title: string;
  content: string;
  tags: string;
  is_ai_generated: boolean;
}

export const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });
  const [aiQuestion, setAiQuestion] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.NOTES, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.NOTES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes([newNote, ...notes]);
        resetForm();
        setShowCreateForm(false);
        toast({
          title: "Success",
          description: "Note created successfully"
        });
      } else {
        throw new Error('Failed to create note');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.NOTES_ASK_AI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: aiQuestion })
      });

      if (response.ok) {
        const data = await response.json();
        setAiResponse(data);
        setShowAIChat(false);
        toast({
          title: "Success",
          description: "AI generated a response for you"
        });
      } else {
        throw new Error('Failed to generate AI response');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI response",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSaveAIResponse = async () => {
    if (!aiResponse) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.NOTES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: aiResponse.title,
          content: aiResponse.content,
          tags: aiResponse.tags,
          is_ai_generated: true
        })
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes([newNote, ...notes]);
        setAiResponse(null);
        toast({
          title: "Success",
          description: "AI response saved as note"
        });
      } else {
        throw new Error('Failed to save AI response');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save AI response",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getNoteEndpoint(noteId.toString()), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotes(notes.filter(note => note.id !== noteId));
        toast({
          title: "Success",
          description: "Note deleted successfully"
        });
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

  const resetForm = () => {
    setFormData({ title: '', content: '', tags: '' });
    setEditingNote(null);
  };

  const startEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags
    });
    setShowCreateForm(true);
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !formData.title.trim() || !formData.content.trim()) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getNoteEndpoint(editingNote.id.toString()), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setNotes(notes.map(note => 
          note.id === editingNote.id 
            ? { ...note, ...formData, updated_at: updatedNote.updated_at }
            : note
        ));
        resetForm();
        setShowCreateForm(false);
        toast({
          title: "Success",
          description: "Note updated successfully"
        });
      } else {
        throw new Error('Failed to update note');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
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
          <h1 className="text-h1 mb-4 bg-gradient-to-r from-text-primary via-primary to-secondary bg-clip-text text-transparent">
            My Notes
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Create custom notes or ask AI to generate content for you
          </p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Note
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAIChat(true)}
            className="bg-secondary/20 border-secondary/50 hover:bg-secondary/30"
          >
            <Bot className="h-4 w-4 mr-2" />
            Ask AI
          </Button>
        </div>
      </div>

      {/* AI Response Display */}
      {aiResponse && (
        <div className="mb-8 bg-gradient-to-r from-secondary/20 to-primary/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <div className="flex items-center mb-4">
            <Sparkles className="h-5 w-5 text-secondary mr-2" />
            <h3 className="text-lg font-semibold text-text-primary">AI Generated Response</h3>
          </div>
          
          <div className="mb-4">
            <h4 className="font-semibold text-text-primary mb-2">{aiResponse.title}</h4>
            <p className="text-text-primary leading-relaxed mb-4">{aiResponse.content}</p>
            {aiResponse.tags && (
              <div className="flex flex-wrap gap-1 mb-4">
                {aiResponse.tags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleSaveAIResponse}
              disabled={isSaving}
              className="bg-primary hover:bg-primary-dark"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save as Note
            </Button>
            <Button
              variant="outline"
              onClick={() => setAiResponse(null)}
              className="bg-surface/50 border-white/20 hover:bg-destructive/20 hover:border-destructive/50"
            >
              <X className="h-4 w-4 mr-2" />
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="mb-8 bg-card/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {editingNote ? 'Edit Note' : 'Create New Note'}
          </h3>
          
          <div className="space-y-4">
            <Input
              placeholder="Note title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-surface/50 border-white/20 focus:border-primary"
            />
            
            <Textarea
              placeholder="Note content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className="bg-surface/50 border-white/20 focus:border-primary"
            />
            
            <Input
              placeholder="Tags (comma-separated)"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="bg-surface/50 border-white/20 focus:border-primary"
            />
            
            <div className="flex gap-3">
              <Button
                onClick={editingNote ? handleUpdateNote : handleCreateNote}
                disabled={isSaving}
                className="bg-primary hover:bg-primary-dark"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingNote ? 'Update Note' : 'Create Note'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setShowCreateForm(false);
                }}
                className="bg-surface/50 border-white/20"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Modal */}
      {showAIChat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card/95 backdrop-blur-sm rounded-2xl border border-white/20 p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary flex items-center">
                <Bot className="h-5 w-5 mr-2 text-secondary" />
                Ask AI
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIChat(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Ask AI anything... (e.g., 'Explain quantum computing', 'Write a summary about climate change', 'Create a study guide for machine learning')"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                rows={4}
                className="bg-surface/50 border-white/20 focus:border-primary"
              />
              
              <div className="flex gap-3">
                <Button
                  onClick={handleAskAI}
                  disabled={isGeneratingAI || !aiQuestion.trim()}
                  className="bg-secondary hover:bg-secondary-dark flex-1"
                >
                  {isGeneratingAI ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  Ask AI
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAIChat(false)}
                  className="bg-surface/50 border-white/20"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="text-center py-16 bg-card/30 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full mb-6">
              <Edit3 className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-h3 mb-3">No notes yet</h3>
            <p className="text-text-secondary max-w-md mx-auto mb-6">
              Create your first note or ask AI to generate content for you!
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Note
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAIChat(true)}
                className="bg-secondary/20 border-secondary/50 hover:bg-secondary/30"
              >
                <Bot className="h-4 w-4 mr-2" />
                Ask AI
              </Button>
            </div>
          </div>
        ) : (
          notes.map((note, index) => (
            <div 
              key={note.id}
              className="bg-card/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 transition-all duration-200 animate-card-hover hover:bg-card/70"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {note.is_ai_generated && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-secondary/20 text-secondary text-xs rounded-full">
                        <Bot className="h-3 w-3" />
                        AI Generated
                      </div>
                    )}
                    <span className="text-xs text-text-secondary">
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-lg text-text-primary mb-2">
                    {note.title}
                  </h3>
                  
                  <p className="text-text-primary leading-relaxed mb-3">
                    {note.content}
                  </p>
                  
                  {note.tags && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.tags.split(',').map((tag, tagIndex) => (
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
                <div className="text-xs text-text-secondary">
                  {note.updated_at !== note.created_at && (
                    <span>Updated {formatDate(note.updated_at)}</span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(note)}
                    className="h-8 px-3 bg-surface/50 border-white/20 hover:bg-primary/20 hover:border-primary/50"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteNote(note.id)}
                    className="h-8 px-3 bg-surface/50 border-white/20 hover:bg-destructive/20 hover:border-destructive/50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
