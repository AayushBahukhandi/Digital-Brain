import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Eye, EyeOff } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isLogin ? API_ENDPOINTS.LOGIN : API_ENDPOINTS.REGISTER;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        toast({
          title: "Success",
          description: isLogin ? "Logged in successfully!" : "Account created successfully!",
        });
        navigate('/');
      } else {
        toast({
          title: "Error",
          description: data.error || 'Something went wrong',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-background to-slate-800 relative overflow-hidden">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="relative group">
          {/* Enhanced glow effect */}
          <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-3xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
          
          <div className="relative bg-slate-800/40 backdrop-blur-2xl rounded-3xl border border-slate-700/50 p-10 shadow-2xl group-hover:border-primary/40 transition-all duration-500">
            {/* Enhanced Header */}
            <div className="text-center mb-10">
              <div className="relative inline-block mb-6">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-3xl shadow-xl">
                  <Brain className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full animate-pulse shadow-lg"></div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-100 to-primary bg-clip-text text-transparent mb-3">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-slate-300 text-lg">
                {isLogin ? 'Sign in to your Digital Brain' : 'Start your Digital Brain journey'}
              </p>
            </div>

            {/* Enhanced Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-semibold text-slate-200 mb-3">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="relative bg-slate-700/50 border-slate-600/50 focus:border-primary focus:ring-4 focus:ring-primary/20 rounded-2xl h-14 text-lg backdrop-blur-sm shadow-xl"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-200 mb-3">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="bg-slate-700/50 border-slate-600/50 focus:border-primary focus:ring-4 focus:ring-primary/20 rounded-2xl h-14 text-lg pr-12 backdrop-blur-sm shadow-xl"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors eye-button p-2 rounded-lg hover:bg-slate-600/50"
                      style={{ background: 'transparent', border: 'none' }}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {!isLogin && (
                  <p className="text-sm text-slate-400 mt-2">
                    Password must be at least 6 characters long
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="group relative w-full h-16 text-xl font-bold bg-gradient-to-r from-primary via-primary-dark to-secondary hover:from-secondary hover:via-primary hover:to-accent transition-all duration-500 rounded-2xl shadow-2xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center justify-center">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                      <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                    </>
                  ) : (
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  )}
                </div>
              </Button>
            </form>

            {/* Enhanced Toggle */}
            <div className="mt-8 text-center">
              <p className="text-slate-300 text-lg">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <span
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-2 text-primary hover:text-primary-hover font-semibold transition-colors cursor-pointer hover:underline"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};