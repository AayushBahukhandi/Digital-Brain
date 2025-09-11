import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Notes } from './pages/Notes';
import { AllNotes } from './pages/AllNotes';
import { NotesPage } from './pages/NotesPage';
import { NoteView } from './pages/NoteView';
import { GlobalChat } from './pages/GlobalChat';
import { VoiceNotes } from './pages/VoiceNotes';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <Login />} 
        />
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/notes/:videoId" element={<Notes />} />
                  <Route path="/note/:noteId" element={<NoteView />} />
                  <Route path="/my-notes" element={<NotesPage />} />
                  <Route path="/all-notes" element={<AllNotes />} />
                  <Route path="/voice-notes" element={<VoiceNotes />} />
                  <Route path="/chat" element={<GlobalChat />} />
                </Routes>
                <Toaster />
              </Layout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <div className="dark">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </div>
  );
}

export default App;
