import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Sparkles, ArrowRight, FolderOpen, FileText, ShieldCheck, PenTool, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { noteService } from '../../services/noteService';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [isCountLoading, setIsCountLoading] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      if (isAuthenticated) {
        setIsCountLoading(true);
        try {
          const count = await noteService.getCount();
          setNoteCount(count);
        } catch (error) {
          console.error('Failed to fetch note count:', error);
          setNoteCount(0);
        } finally {
          setIsCountLoading(false);
        }
      }
    };

    fetchCount();
  }, [isAuthenticated]);

  const handleCreateClick = () => {
    if (isAuthenticated) {
      navigate(RoutePath.CREATE_NOTE);
    } else {
      navigate(RoutePath.LOGIN);
    }
  };

  const handleViewAllClick = () => {
    if (isAuthenticated) {
      navigate(RoutePath.NOTES);
    } else {
      navigate(RoutePath.LOGIN);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700 relative pb-10">
      
      {/* Background Ambient Light (Global) - Refined for Light & Dark */}
      <div className="fixed top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-200/20 dark:bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none z-0 mix-blend-multiply dark:mix-blend-screen" />
      <div className="fixed top-[10%] right-[-15%] w-[600px] h-[600px] bg-fuchsia-100/30 dark:bg-sky-500/10 blur-[120px] rounded-full pointer-events-none z-0 mix-blend-multiply dark:mix-blend-screen" />

      {/* Hero Section - Liquid Glass */}
      <div className="relative z-10 w-full rounded-3xl sm:rounded-[2.5rem] border border-white/80 dark:border-slate-700/80 bg-gradient-to-b from-white/70 to-white/40 dark:from-slate-900/90 dark:to-slate-900/70 backdrop-blur-[60px] p-6 sm:p-10 lg:p-14 shadow-[0_30px_90px_-20px_rgba(50,60,100,0.1)] dark:shadow-2xl overflow-hidden group transition-all duration-500 hover:shadow-[0_45px_110px_-15px_rgba(50,60,100,0.15)] ring-1 ring-white/60 dark:ring-slate-800">
        
        {/* Liquid Glass Internal Layers - Specular Highlights */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/5 to-transparent dark:from-white/5 dark:via-transparent dark:to-transparent pointer-events-none opacity-60" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white dark:via-slate-600 to-transparent opacity-90" />
        
        {/* Background Abstract Icon - Pen/Feather */}
        <div className="hidden sm:block absolute -bottom-8 -right-8 text-indigo-900/5 dark:text-white/5 transform rotate-[-15deg] pointer-events-none transition-transform duration-700 group-hover:rotate-[-10deg] group-hover:scale-105">
             <PenTool strokeWidth={0.5} size={320} />
        </div>

        <div className="relative z-10 flex flex-col items-start gap-6 sm:gap-8 max-w-2xl">
          {/* Top Tag Bar - Dual Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full theme-accent-soft border border-white/50 dark:border-slate-700 px-3 py-1 text-[11px] font-bold tracking-wide uppercase shadow-sm backdrop-blur-md">
                <Sparkles size={11} />
                <span>AI Workspace</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/60 dark:bg-slate-800/80 border border-white/40 dark:border-slate-700 px-3 py-1 text-[11px] font-bold tracking-wide text-slate-500 dark:text-slate-300 uppercase backdrop-blur-md">
                <ShieldCheck size={11} className="text-slate-400 dark:text-slate-400" />
                <span>Secure &amp; Synced</span>
            </div>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.12] drop-shadow-sm">
              {isAuthenticated ? `Welcome back, ${user?.name || 'User'}` : 'Welcome, Guest'}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-xl font-medium leading-relaxed tracking-normal max-w-lg">
              {isAuthenticated 
                ? 'Your AI-Powered workspace — clean, fast, and beautifully organized.' 
                : 'Your AI-powered workspace — clean, fast, and beautifully organized. Sign in to start creating notes.'
              }
            </p>
          </div>

          <div className="pt-1 sm:pt-2">
            <button 
              onClick={handleCreateClick}
              className="group relative overflow-hidden rounded-full theme-accent-bg px-7 sm:px-9 py-3.5 sm:py-4 text-sm font-semibold shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center gap-2.5 relative z-10">
                <PlusCircle size={18} strokeWidth={2.5} className="transition-colors" />
                <span className="tracking-wide">Create New Note</span>
              </div>
              
              {/* Glossy Overlay Animation */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none translate-x-[-100%] group-hover:translate-x-[100%] transform transition-transform" style={{ transitionDuration: '1s' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Section - Cards Below */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-3 relative z-10">
        
        {/* Stats Card - Liquid Glass */}
        <div className="smart-kpi-card rounded-3xl sm:rounded-[2rem] border border-white/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 dark:from-white/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6 sm:mb-8">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 theme-accent-text border border-white/50 dark:border-slate-700 shadow-[0_4px_12px_rgba(0,0,0,0.05)] group-hover:scale-105 transition-transform duration-300 group-hover:shadow-md">
                <FolderOpen size={24} strokeWidth={2} />
                </div>
                {isAuthenticated && (
                  <div className="rounded-full bg-emerald-100/70 dark:bg-emerald-950/60 px-3 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/60 backdrop-blur-md shadow-sm">
                  Active
                  </div>
                )}
            </div>
            <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-0.5">Total Notes</p>
                <div className="flex flex-wrap items-baseline gap-2">
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight drop-shadow-sm tabular-nums">
                  {!isAuthenticated ? '—' : isCountLoading ? <Loader2 className="animate-spin h-8 w-8 theme-accent-text" /> : noteCount ?? '—'}
                </p>
                {isAuthenticated && !isCountLoading && noteCount !== null && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-100/50 dark:border-emerald-800/50">Synced with cloud</span>
                )}
                </div>
            </div>
          </div>
        </div>
        
        {/* CTA Card 2 (Bottom) - Contextual Content Management - Liquid Glass */}
        <div className="col-span-1 md:col-span-2 rounded-3xl sm:rounded-[2rem] border border-white/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden backdrop-blur-2xl">
            {/* Subtle Gradient Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/10 to-transparent dark:from-white/5 dark:via-transparent opacity-50 pointer-events-none" />
            
            <div className="flex flex-col items-center md:items-start text-center md:text-left relative z-10 sm:pl-2">
                <div className="flex items-center gap-3.5 sm:gap-4 mb-3">
                    <div className="h-11 w-11 sm:h-12 sm:w-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-white/50 dark:border-slate-700 group-hover:scale-105 transition-transform duration-300 shrink-0">
                        <FileText size={22} className="text-slate-700 dark:text-slate-200" strokeWidth={2} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Manage Content</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-300 max-w-md text-sm sm:text-base leading-relaxed font-medium opacity-90">
                   {isAuthenticated 
                     ? 'Access your full library, organize with tags, and review drafts efficiently.' 
                     : 'Sign in to access your full library, organize with tags, and review drafts.'
                   }
                </p>
            </div>

            <Button variant="secondary" size="lg" className="shrink-0 w-full sm:w-auto h-12 sm:h-14 px-8 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.05)] relative z-10 text-sm border-white/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold backdrop-blur-xl transition-all hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] hover:scale-[1.02]" onClick={handleViewAllClick}>
              View All Notes <ArrowRight className="ml-2 h-4 w-4 opacity-60 group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>
      </div>
    </div>
  );
};