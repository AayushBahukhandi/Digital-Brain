import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Brain, Home, FileText, MessageCircle, LogOut, User, Edit3, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-background to-slate-800">
      {/* Premium glass morphism navigation bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50 shadow-2xl">
        <div className="container mx-auto px-6 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Enhanced Logo */}
            <div className="flex items-center space-x-4 group">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-lg">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse shadow-lg"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                  Digital Brain
                </span>
                <span className="text-xs text-slate-400 font-medium">AI-Powered Content Intelligence</span>
              </div>
            </div>
            
            {/* Premium Navigation */}
            <nav className="flex items-center space-x-2">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                asChild
                className={`group relative transition-all duration-300 rounded-xl px-4 py-2.5 ${
                  isActive('/') 
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg hover:shadow-primary/25' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50 hover:shadow-lg'
                }`}
              >
                <Link to="/" className="flex items-center space-x-2">
                  <Home className="h-4 w-4" />
                  <span className="font-medium">Home</span>
                  {isActive('/') && <Sparkles className="h-3 w-3 ml-1 animate-pulse" />}
                </Link>
              </Button>
              
              <Button
                variant={isActive('/my-notes') ? 'default' : 'ghost'}
                size="sm"
                asChild
                className={`group relative transition-all duration-300 rounded-xl px-4 py-2.5 ${
                  isActive('/my-notes') 
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg hover:shadow-primary/25' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50 hover:shadow-lg'
                }`}
              >
                <Link to="/my-notes" className="flex items-center space-x-2">
                  <Edit3 className="h-4 w-4" />
                  <span className="font-medium">My Notes</span>
                  {isActive('/my-notes') && <Sparkles className="h-3 w-3 ml-1 animate-pulse" />}
                </Link>
              </Button>
              
              <Button
                variant={isActive('/all-notes') ? 'default' : 'ghost'}
                size="sm"
                asChild
                className={`group relative transition-all duration-300 rounded-xl px-4 py-2.5 ${
                  isActive('/all-notes') 
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg hover:shadow-primary/25' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50 hover:shadow-lg'
                }`}
              >
                <Link to="/all-notes" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">All Content</span>
                  {isActive('/all-notes') && <Sparkles className="h-3 w-3 ml-1 animate-pulse" />}
                </Link>
              </Button>
              
              <Button
                variant={isActive('/chat') ? 'default' : 'ghost'}
                size="sm"
                asChild
                className={`group relative transition-all duration-300 rounded-xl px-4 py-2.5 ${
                  isActive('/chat') 
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg hover:shadow-primary/25' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50 hover:shadow-lg'
                }`}
              >
                <Link to="/chat" className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span className="font-medium">Chat</span>
                  {isActive('/chat') && <Sparkles className="h-3 w-3 ml-1 animate-pulse" />}
                </Link>
              </Button>
            </nav>
            
            {/* Premium User menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">{user?.username}</span>
                  <span className="text-xs text-slate-400">Premium User</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 rounded-xl p-2"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Enhanced main content area */}
      <main className="min-h-screen pt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};