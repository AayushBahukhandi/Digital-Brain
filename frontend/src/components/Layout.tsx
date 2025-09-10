import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Brain, Home, FileText, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Glass morphism navigation bar - Exact 64px height */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 glass border-b border-border" style={{ height: '64px' }}>
        <div className="container mx-auto px-6 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Brain className="h-8 w-8 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse-slow"></div>
              </div>
              <span className="text-xl font-bold text-white">Digital Brain</span>
            </div>
            
            {/* Navigation */}
            <nav className="flex items-center space-x-1">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                asChild
                className={`transition-all duration-200 rounded-lg ${
                  isActive('/') 
                    ? 'bg-primary text-white shadow-lg hover:bg-primary-hover' 
                    : '!text-white hover:!text-white hover:bg-white/10'
                }`}
              >
                <Link to="/" className="flex items-center space-x-2 px-3 py-2">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
              </Button>
              
              <Button
                variant={isActive('/all-notes') ? 'default' : 'ghost'}
                size="sm"
                asChild
                className={`transition-all duration-200 rounded-lg ${
                  isActive('/all-notes') 
                    ? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary-hover' 
                    : '!text-white hover:!text-white hover:bg-white/10'
                }`}
              >
                <Link to="/all-notes" className="flex items-center space-x-2 px-3 py-2">
                  <FileText className="h-4 w-4" />
                  <span>Notes</span>
                </Link>
              </Button>
              
              <Button
                variant={isActive('/chat') ? 'default' : 'ghost'}
                size="sm"
                asChild
                className={`transition-all duration-200 rounded-lg ${
                  isActive('/chat') 
                    ? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary-hover' 
                    : '!text-white hover:!text-white hover:bg-white/10'
                }`}
              >
                <Link to="/chat" className="flex items-center space-x-2 px-3 py-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat</span>
                </Link>
              </Button>
            </nav>
            
          </div>
        </div>
      </header>
      
      {/* Main content with top padding for fixed header - Exact 64px */}
      <main className="min-h-screen bg-background" style={{ paddingTop: '64px' }}>
        <div className="container mx-auto px-6 py-8">
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};