import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Command, Mail, Lock, User, Smile } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';
import { apiClient } from '../../src/apiClient';
import { useAuth } from '../../context/AuthContext';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const fullName = formData.get('fullName') as string;
    const displayName = formData.get('displayName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    try {
      const data = await apiClient.fetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
           email, 
           password, 
           full_name: fullName, 
           display_name: displayName 
        })
      });

      if (data.token) {
        navigate(RoutePath.LOGIN, { 
          state: { 
            email,
            successMessage: 'Your account has been created successfully. Please login to continue.'
          } 
        });
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      const response = await fetch(`/api/auth/google/url?redirectUri=${encodeURIComponent(redirectUri)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get auth URL');
      }
      const { url } = await response.json();

      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
      }
    } catch (error: any) {
      console.error('OAuth error:', error);
      setError(error.message);
    }
  };

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        // the server sent token and user objects
        localStorage.setItem('token', event.data.token);
        setUser(event.data.user);
        navigate(RoutePath.HOME);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate, setUser]);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#F4F6F9] font-sans selection:bg-indigo-500/20">
      
      {/* Cinematic Background - VisionOS Style */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
         {/* Animated Gradients */}
         <div className="absolute top-[-20%] right-[-10%] w-[90vw] h-[90vw] rounded-full bg-indigo-100/40 blur-[140px] mix-blend-multiply animate-pulse" style={{ animationDuration: '9s' }} />
         <div className="absolute bottom-[-20%] left-[-10%] w-[90vw] h-[90vw] rounded-full bg-sky-100/40 blur-[140px] mix-blend-multiply animate-pulse" style={{ animationDuration: '11s', animationDelay: '2s' }} />
         <div className="absolute top-[30%] right-[40%] w-[60vw] h-[60vw] rounded-full bg-violet-100/30 blur-[120px] mix-blend-multiply" />
         
         {/* Noise Texture */}
         <div className="absolute inset-0 opacity-[0.015] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150"></div>
      </div>

      {/* Main Container - Floating Effect */}
      <div className="relative w-full max-w-[440px] px-6 transition-all duration-700 ease-out hover:-translate-y-2">
        
        {/* Liquid Glass Card */}
        <div className="group relative overflow-hidden rounded-[36px] border border-white/60 bg-white/40 p-8 sm:p-10 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.08),0_10px_20px_-5px_rgba(0,0,0,0.04)] backdrop-blur-[50px] transition-all duration-500 hover:shadow-[0_45px_80px_-12px_rgba(0,0,0,0.12),0_15px_30px_-5px_rgba(0,0,0,0.06)] hover:bg-white/50">
          
          {/* Specular Top Highlight */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-100 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            
            {/* Header Icon */}
            <div className="mb-8 flex h-[72px] w-[72px] items-center justify-center rounded-[24px] bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_12px_24px_-6px_rgba(99,102,241,0.4)] ring-4 ring-white/50 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
               <Command size={36} strokeWidth={1.5} />
            </div>

            {/* Typography */}
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 drop-shadow-sm text-center">
              Create Account
            </h1>
            <p className="mt-2.5 text-[15px] font-medium text-slate-500 text-center max-w-[280px] leading-relaxed">
              Join the future of note-taking.
            </p>
          
            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-10 w-full space-y-6">
              <div className="space-y-4">
                <Input 
                  id="fullName"
                  name="fullName"
                  type="text" 
                  required
                  placeholder="Full Name" 
                  icon={User}
                  className="bg-white/60 focus:bg-white"
                />
                <Input 
                  id="displayName"
                  name="displayName"
                  type="text" 
                  required
                  placeholder="Display Name (e.g. Jane)" 
                  icon={Smile}
                  className="bg-white/60 focus:bg-white"
                />
                <Input 
                  id="email"
                  name="email"
                  type="email" 
                  autoComplete="email" 
                  required
                  placeholder="name@example.com" 
                  icon={Mail}
                  className="bg-white/60 focus:bg-white"
                />
                <Input 
                  id="password" 
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="Create a password" 
                  icon={Lock}
                  className="bg-white/60 focus:bg-white"
                />
              </div>
              
              {error && (
                <div className="mt-2 p-3.5 rounded-2xl bg-red-50/90 border border-red-200/80 text-left animate-in fade-in slide-in-from-top-1 shadow-sm">
                  <p className="text-sm font-semibold text-red-700">
                    {error}
                  </p>
                  {error.toLowerCase().includes('already') && (
                    <div className="mt-2 pt-2 border-t border-red-100 flex items-center justify-between text-xs">
                      <span className="text-slate-600">Already registered?</span>
                      <div className="flex items-center gap-2">
                        <Link to={RoutePath.LOGIN} className="font-semibold text-indigo-600 hover:text-indigo-800 underline">
                          Sign In →
                        </Link>
                        <span className="text-slate-300">|</span>
                        <Link to="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-800 underline">
                          Reset Password
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full h-[52px] text-[15px] shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] mt-2" 
                isLoading={loading}
              >
                Create Account
              </Button>
            </form>

            {/* Divider */}
             <div className="my-8 flex w-full items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-white/30 px-2 py-1 rounded-md backdrop-blur-md border border-white/40">Or</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
             </div>

             {/* Social Button */}
             <Button 
                variant="secondary" 
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-[52px] gap-3 bg-white/80 border-white shadow-sm hover:bg-white"
             >
                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M12.0003 20.45c-4.6667 0-8.45-3.7833-8.45-8.45 0-4.6667 3.7833-8.45 8.45-8.45 2.1333 0 4.0833.7333 5.6333 1.95L15.4 8.0167c-1.0833-.8667-2.2833-1.3-3.4-1.3-3.05 0-5.5167 2.4667-5.5167 5.2833s2.4667 5.2833 5.5167 5.2833c2.6167 0 4.4333-1.5833 4.8833-4.0833h-4.8833v-2.8h7.95c.1.5167.15 1.05.15 1.6167 0 4.6333-3.1667 8.4333-8.1 8.4333z" fill="currentColor" />
                </svg>
                <span className="text-slate-700 font-semibold">Continue with Google</span>
             </Button>

             {/* Footer */}
             <p className="mt-8 text-[13px] text-slate-500 font-medium">
               Already have an account? <Link to={RoutePath.LOGIN} className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors hover:underline decoration-2 underline-offset-2">Sign in</Link>
             </p>

          </div>
        </div>

      </div>
    </div>
  );
};