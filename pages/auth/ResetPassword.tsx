import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Command, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';
import { apiClient } from '../../src/apiClient';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    if (password !== confirmPassword) {
       setError('Passwords do not match');
       setLoading(false);
       return;
    }
    
    try {
      const data = await apiClient.fetch('/auth/reset-password', {
         method: 'POST',
         body: JSON.stringify({ token, password })
      });

      setSuccess(data.message || 'Password reset successfully.');
      setTimeout(() => {
        navigate(RoutePath.LOGIN, { state: { successMessage: 'Password reset successfully. Please log in.' } });
      }, 3000);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#F4F6F9] font-sans selection:bg-indigo-500/20">
      
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
         <div className="absolute top-[-20%] left-[-10%] w-[90vw] h-[90vw] rounded-full bg-blue-100/40 blur-[140px] mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
         <div className="absolute bottom-[-20%] right-[-10%] w-[90vw] h-[90vw] rounded-full bg-purple-100/40 blur-[140px] mix-blend-multiply animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
         <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[60vw] h-[60vw] rounded-full bg-indigo-100/30 blur-[120px] mix-blend-multiply" />
         
         <div className="absolute inset-0 opacity-[0.015] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150"></div>
      </div>

      <div className="relative w-full max-w-[440px] px-6 transition-all duration-700 ease-out hover:-translate-y-2">
        <div className="group relative overflow-hidden rounded-[36px] border border-white/60 bg-white/40 p-8 sm:p-10 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.08),0_10px_20px_-5px_rgba(0,0,0,0.04)] backdrop-blur-[50px] transition-all duration-500 hover:shadow-[0_45px_80px_-12px_rgba(0,0,0,0.12),0_15px_30px_-5px_rgba(0,0,0,0.06)] hover:bg-white/50">
          
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-100 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            
            <div className="mb-8 flex h-[72px] w-[72px] items-center justify-center rounded-[24px] bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_12px_24px_-6px_rgba(99,102,241,0.4)] ring-4 ring-white/50 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
               <Command size={36} strokeWidth={1.5} />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 drop-shadow-sm text-center">
              New Password
            </h1>
            <p className="mt-2.5 text-[15px] font-medium text-slate-500 text-center max-w-[280px] leading-relaxed">
              Create a new password for your account.
            </p>

            {success && (
               <div className="mt-6 flex w-full items-start gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/80 p-4 text-sm text-emerald-800 backdrop-blur-md shadow-sm animate-in fade-in slide-in-from-top-2">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <span className="font-medium leading-relaxed">{success} Redirecting to sign in...</span>
               </div>
            )}
          
            {!success && (
              <form onSubmit={handleSubmit} className="mt-10 w-full space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Input 
                      id="password" 
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      placeholder="New password" 
                      icon={Lock}
                      className="bg-white/60 focus:bg-white"
                      disabled={!token}
                    />
                  </div>
                  <div className="relative">
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      placeholder="Confirm new password" 
                      icon={Lock}
                      className="bg-white/60 focus:bg-white"
                      disabled={!token}
                    />
                  </div>
                </div>
                
                {error && (
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
                      {error}
                    </p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-[52px] text-[15px] shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)]" 
                  isLoading={loading}
                  disabled={!token}
                >
                  Reset Password
                </Button>
              </form>
            )}

             <p className="mt-8 text-[13px] text-slate-500 font-medium flex items-center justify-center gap-2">
               <ArrowLeft size={14} className="text-indigo-600" />
               <Link to={RoutePath.LOGIN} className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors hover:underline decoration-2 underline-offset-2">Back to Sign In</Link>
             </p>

          </div>
        </div>
        
        <div className="absolute top-10 left-0 w-2 h-2 rounded-full bg-indigo-500/20 blur-[1px] animate-ping" />
        <div className="absolute bottom-10 right-0 w-3 h-3 rounded-full bg-purple-500/20 blur-[2px] animate-bounce" style={{ animationDuration: '3s' }} />

      </div>
    </div>
  );
};
