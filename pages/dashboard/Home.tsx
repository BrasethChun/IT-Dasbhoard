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
      
      {/* Background Ambient Light (Global) - Refined for Ultra Premium look */}
      <div className="fixed top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-200/20 blur-[130px] rounded-full pointer-events-none z-0 mix-blend-multiply" />
      <div className="fixed top-[10%] right-[-15%] w-[600px] h-[600px] bg-fuchsia-100/30 blur-[120px] rounded-full pointer-events-none z-0 mix-blend-multiply" />

      {/* Hero Section - iOS 26 Liquid Glass */}
      <div className="relative z-10 w-full rounded-[2.5rem] border border-white/80 bg-gradient-to-b from-white/40 to-white/20 backdrop-blur-[60px] p-10 sm:p-14 shadow-[0_30px_90px_-20px_rgba(50,60,100,0.1)] overflow-hidden group transition-all duration-500 hover:shadow-[0_45px_110px_-15px_rgba(50,60,100,0.15)] ring-1 ring-white/60">
        
        {/* Liquid Glass Internal Layers - Specular Highlights */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/5 to-transparent pointer-events-none opacity-60" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />
        
        {/* Background Abstract Icon - Pen/Feather */}
        <div className="absolute -bottom-8 -right-8 text-indigo-900/5 transform rotate-[-15deg] pointer-events-none transition-transform duration-700 group-hover:rotate-[-10deg] group-hover:scale-105">
             <PenTool strokeWidth={0.5} size={320} />
        </div>

        <div className="relative z-10 flex flex-col items-start gap-8 max-w-2xl">
          {/* Top Tag Bar - Dual Badges */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-white/50 px-3 py-1 text-[11px] font-bold tracking-wide text-indigo-600 uppercase shadow-[0_2px_10px_rgba(99,102,241,0.1)] backdrop-blur-md ring-1 ring-white/40">
                <Sparkles size={11} className="fill-indigo-500/20 text-indigo-600" />
                <span>AI Workspace</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/40 border border-white/30 px-3 py-1 text-[11px] font-bold tracking-wide text-slate-500 uppercase backdrop-blur-md">
                <ShieldCheck size={11} className="text-slate-400" />
                <span>Secure & Synced</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.1] drop-shadow-sm">
              {isAuthenticated ? `Welcome back, ${user?.name || 'User'}` : 'Welcome, Guest'}
            </h1>
            <p className="text-slate-600 text-lg sm:text-xl font-medium leading-relaxed tracking-normal max-w-lg">
              {isAuthenticated 
                ? 'Your AI-Powered workspace — clean, fast, and beautifully organized.' 
                : 'Your AI-powered workspace — clean, fast, and beautifully organized. Sign in to start creating notes.'
              }
            </p>
          </div>

          <div className="pt-2">
            <button 
              onClick={handleCreateClick}
              className="group relative overflow-hidden rounded-full bg-gradient-to-b from-indigo-500 to-indigo-600 px-9 py-4 text-sm font-semibold text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_35px_-10px_rgba(79,70,229,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:brightness-105 active:scale-[0.98] active:shadow-sm ring-1 ring-indigo-500/50"
            >
              <div className="flex items-center gap-2.5 relative z-10">
                <PlusCircle size={18} strokeWidth={2.5} className="text-indigo-50 group-hover:text-white transition-colors" />
                <span className="tracking-wide">Create New Note</span>
              </div>
              
              {/* Glossy Overlay Animation */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none translate-x-[-100%] group-hover:translate-x-[100%] transform transition-transform" style={{ transitionDuration: '1s' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Section - Cards Below */}
      <div className="grid gap-6 md:grid-cols-3 relative z-10">
        
        {/* Stats Card - Liquid Glass */}
        <div className="rounded-[2rem] border border-white/60 bg-white/40 p-8 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-600 border border-white/50 shadow-[0_4px_12px_rgba(0,0,0,0.05)] group-hover:scale-105 transition-transform duration-300 group-hover:shadow-md">
                <FolderOpen size={26} strokeWidth={2} />
                </div>
                {isAuthenticated && (
                  <div className="rounded-full bg-emerald-100/50 px-3 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200/50 backdrop-blur-md shadow-sm">
                  Active
                  </div>
                )}
            </div>
            <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-0.5">Total Notes</p>
                <div className="flex items-baseline gap-2">
                <p className="text-4xl font-extrabold text-slate-900 tracking-tight drop-shadow-sm">
                  {!isAuthenticated ? '—' : isCountLoading ? <Loader2 className="animate-spin h-8 w-8 text-indigo-500" /> : noteCount ?? '—'}
                </p>
                {isAuthenticated && !isCountLoading && noteCount !== null && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50/80 px-2 py-1 rounded-lg border border-emerald-100/50">Synced with cloud</span>
                )}
                </div>
            </div>
          </div>
        </div>
        
        {/* CTA Card 2 (Bottom) - Contextual Content Management - Liquid Glass */}
        <div className="col-span-1 md:col-span-2 rounded-[2rem] border border-white/60 bg-white/40 p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden backdrop-blur-2xl">
            {/* Subtle Gradient Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/10 to-transparent opacity-50 pointer-events-none" />
            
            <div className="flex flex-col items-center md:items-start text-center md:text-left relative z-10 pl-2">
                <div className="flex items-center gap-4 mb-3">
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-white/50 group-hover:scale-105 transition-transform duration-300">
                        <FileText size={24} className="text-slate-700" strokeWidth={2} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Content</h3>
                </div>
                <p className="text-slate-600 max-w-md text-base leading-relaxed font-medium opacity-90">
                   {isAuthenticated 
                     ? 'Access your full library, organize with tags, and review drafts efficiently.' 
                     : 'Sign in to access your full library, organize with tags, and review drafts.'
                   }
                </p>
            </div>

            <Button variant="secondary" size="lg" className="shrink-0 h-14 px-8 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.05)] relative z-10 text-sm border-white/80 bg-white/70 hover:bg-white text-slate-800 font-semibold backdrop-blur-xl transition-all hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] hover:scale-[1.02]" onClick={handleViewAllClick}>
              View All Notes <ArrowRight className="ml-2 h-4 w-4 opacity-60 group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>
      </div>
    </div>
  );
};