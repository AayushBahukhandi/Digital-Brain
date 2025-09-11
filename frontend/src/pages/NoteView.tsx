import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { formatDate } from '../lib/utils';
import { 
  ArrowLeft, 
  Bot, 
  Edit3, 
  Trash2, 
  Loader2
} from 'lucide-react';
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

export const NoteView = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (noteId) {
      fetchNote();
    }
  }, [noteId]);

  const fetchNote = async () => {
    if (!noteId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getNoteEndpoint(noteId), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNote(data);
      } else if (response.status === 404) {
        toast({
          title: "Note not found",
          description: "The requested note could not be found",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to fetch note:', error);
      toast({
        title: "Error",
        description: "Failed to fetch note",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!note) return;
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getNoteEndpoint(note.id.toString()), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Note deleted",
          description: "The note has been successfully deleted",
        });
        // Redirect to notes page
        window.location.href = '/my-notes';
      } else {
        throw new Error('Failed to delete note');
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Note not found</h2>
        <Button asChild>
          <Link to="/my-notes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          asChild 
          className="mb-6 text-text-secondary hover:text-text-primary hover:bg-primary/10 transition-all duration-200"
        >
          <Link to="/my-notes" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notes
          </Link>
        </Button>
        
        <div className="text-center mb-8">
          <h1 className="text-h1 mb-4 bg-gradient-to-r from-text-primary via-primary to-secondary bg-clip-text text-transparent">
            {note.title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              <span>{note.is_ai_generated ? 'AI Generated Note' : 'Custom Note'}</span>
              {note.is_ai_generated && <Bot className="h-4 w-4 text-secondary" />}
            </div>
            <div className="flex items-center gap-2">
              <span>Created: {formatDate(note.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Note Content */}
      <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-8">
        <div className="prose prose-invert max-w-none">
          <div className="text-text-primary leading-relaxed whitespace-pre-wrap">
            {note.content}
          </div>
        </div>
        
        {note.tags && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-sm font-semibold text-text-secondary mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {note.tags.split(',').map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          asChild
          className="bg-primary/20 border-primary/50 hover:bg-primary/30"
        >
          <Link to="/my-notes">
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Note
          </Link>
        </Button>
        
        <Button
          variant="outline"
          onClick={handleDeleteNote}
          disabled={isDeleting}
          className="bg-destructive/20 border-destructive/50 hover:bg-destructive/30"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          {isDeleting ? 'Deleting...' : 'Delete Note'}
        </Button>
      </div>
    </div>
  );
};
