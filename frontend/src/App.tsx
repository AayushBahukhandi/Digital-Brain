import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Notes } from './pages/Notes';
import { AllNotes } from './pages/AllNotes';
import { GlobalChat } from './pages/GlobalChat';

function App() {
  return (
    <div className="dark">
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/notes/:videoId" element={<Notes />} />
            <Route path="/all-notes" element={<AllNotes />} />
            <Route path="/chat" element={<GlobalChat />} />
          </Routes>
          <Toaster />
        </Layout>
      </Router>
    </div>
  );
}

export default App;
