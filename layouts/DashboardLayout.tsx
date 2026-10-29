import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Menu, Search, Sparkles, User, Settings, LogOut, Loader2, FileText, X, LogIn } from 'lucide-react';
import { RoutePath, Note } from '../types';
import { noteService } from '../services/noteService';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { StorageImage } from '../components/ui/StorageImage';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    if (isProfileMenuOpen || showResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen, showResults]);

  // Search Debounce Effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        setShowResults(true);
        try {
          const results = await noteService.search(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Search failed', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    logout();
    navigate(RoutePath.HOME); // Stay on home in guest mode
  };

  const handleLogin = () => {
    navigate(RoutePath.LOGIN);
  };

  const handleNavigation = (path: string) => {
    setIsProfileMenuOpen(false);
    navigate(path);
  };

  const handleSearchResultClick = (noteId: string) => {
    setSearchQuery('');
    setShowResults(false);
    
    if (isAuthenticated) {
        navigate(RoutePath.NOTE_DETAIL.replace(':id', noteId));
    } else {
        navigate(RoutePath.LOGIN);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowResults(false);
  };

  const getPreviewText = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || "";
    return text.length > 60 ? text.substring(0, 60) + "..." : text;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-indigo-50 text-slate-900 flex flex-col md:flex-row selection:bg-indigo-500/30 selection:text-indigo-800 overflow-x-hidden relative">
      
      {/* Decorative Background Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-sky-200/30 rounded-full blur-3xl pointer-events-none z-0 mix-blend-multiply" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-3xl pointer-events-none z-0 mix-blend-multiply" />
      
      <Sidebar isPinned={isSidebarPinned} onTogglePin={() => setIsSidebarPinned(!isSidebarPinned)} />
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between border-b border-white/60 bg-white/60 backdrop-blur-2xl px-4 py-3 sticky top-0 z-50">
         <span className="font-bold text-slate-900 tracking-tight">AI Notes</span>
         <button className="text-slate-500 hover:text-slate-900 hover:bg-white/50 p-1 rounded-md transition-colors">
           <Menu size={20} />
         </button>
      </div>

      <main className={`flex-1 flex flex-col min-h-screen ${isSidebarPinned ? 'md:pl-64' : 'md:pl-20'} transition-all duration-300 relative z-10`}>
        
        {/* Top Header - Floating Glass Bar */}
        <div className="sticky top-4 z-30 px-4 lg:px-8 mb-4">
          <header className="flex h-16 items-center justify-between rounded-2xl border border-white/60 bg-white/50 px-6 backdrop-blur-2xl shadow-sm transition-all">
            
            {/* Search Bar Container */}
            <div ref={searchRef} className="relative w-full max-w-md">
                <div className="flex items-center gap-3 text-slate-500 group rounded-full bg-white/70 px-4 py-2 ring-1 ring-white/60 transition-all focus-within:ring-indigo-500/30 focus-within:shadow-md w-full relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500/0 group-focus-within:bg-indigo-500 transition-all"></div>
                    <div className="relative flex items-center justify-center">
                        {isSearching ? (
                             <Loader2 size={16} className="text-indigo-500 animate-spin" />
                        ) : (
                             <Search size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        )}
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search notes..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none w-full ml-2"
                        onFocus={() => searchQuery.trim() && setShowResults(true)}
                    />
                    {searchQuery ? (
                        <button onClick={clearSearch} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={14} />
                        </button>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/80 border border-white">
                            <Sparkles size={10} className="text-indigo-500" />
                            <span className="text-[10px] font-semibold text-indigo-600/80">AI</span>
                        </div>
                    )}
                </div>

                {/* Search Results Dropdown (Spotlight Style) */}
                {showResults && (
                    <div className="absolute top-full left-0 right-0 mt-3 w-full origin-top animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/80 backdrop-blur-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] ring-1 ring-slate-900/5">
                            
                            {/* Search Header */}
                            <div className="px-4 py-2 bg-white/50 border-b border-white/50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Results for "{searchQuery}"
                            </div>

                            <div className="max-h-[300px] overflow-y-auto py-1">
                                {searchResults.length > 0 ? (
                                    searchResults.map((note) => (
                                        <button
                                            key={note.id}
                                            onClick={() => handleSearchResultClick(note.id)}
                                            className="w-full text-left px-4 py-3 hover:bg-white/80 transition-colors group flex items-start gap-3 border-b border-slate-100/50 last:border-0"
                                        >
                                            <div className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-105 transition-transform">
                                                <FileText size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                                    {note.title || 'My notes'}
                                                </h4>
                                                <p className="text-xs text-slate-500 truncate mt-0.5 opacity-80">
                                                    {getPreviewText(note.content) || 'No content'}
                                                </p>
                                                <div className="mt-1.5 flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                                        {new Date(note.updatedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 text-center text-slate-500">
                                        <p className="text-sm">No matching notes found.</p>
                                        <p className="text-xs mt-1 text-slate-400">Try a different keyword.</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Dropdown Footer */}
                            <div className="bg-slate-50/50 px-3 py-2 text-[10px] text-slate-400 text-center border-t border-slate-100">
                                Press <kbd className="font-sans px-1 py-0.5 bg-white rounded border border-slate-200 text-slate-500">Esc</kbd> to close
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {isAuthenticated ? (
                /* Authenticated User Menu */
                <div className="flex items-center gap-4" ref={menuRef}>
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="relative flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md p-0.5 border border-white/70 shadow-[0_10px_30px_rgba(15,23,42,0.25)] cursor-pointer transition-all duration-200 ease-out hover:scale-[1.04] hover:shadow-[0_14px_40px_rgba(15,23,42,0.3)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-transparent overflow-hidden"
                    >
                      <StorageImage 
                        path={user?.avatarUrl} 
                        fallbackSrc="https://picsum.photos/100/100" 
                        alt="User Avatar" 
                        className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover"
                        showLoading={false}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    <div 
                      role="menu"
                      className={`absolute right-0 mt-3 w-56 z-50 bg-white/60 backdrop-blur-2xl border border-white/80 rounded-2xl shadow-[0_22px_70px_rgba(15,23,42,0.35)] py-2 transition-all duration-180 ease-out origin-top-right ${
                        isProfileMenuOpen 
                          ? 'opacity-100 translate-y-0' 
                          : 'opacity-0 -translate-y-2 pointer-events-none'
                      }`}
                    >
                      <div className="px-2 space-y-1">
                        <button 
                          onClick={() => handleNavigation(RoutePath.ACCOUNT)}
                          role="menuitem"
                          className="w-full flex items-center gap-3 px-3.5 py-2.5 cursor-pointer rounded-xl transition-colors duration-150 hover:bg-white/90 hover:backdrop-blur-3xl text-left group"
                        >
                          <User className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">Profile</span>
                            <span className="text-xs text-slate-500">View public profile</span>
                          </div>
                        </button>

                        <button 
                          onClick={() => handleNavigation(RoutePath.ACCOUNT)}
                          role="menuitem"
                          className="w-full flex items-center gap-3 px-3.5 py-2.5 cursor-pointer rounded-xl transition-colors duration-150 hover:bg-white/90 hover:backdrop-blur-3xl text-left group"
                        >
                          <Settings className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">Account Settings</span>
                            <span className="text-xs text-slate-500">Manage workspace</span>
                          </div>
                        </button>

                        <div className="h-px bg-gradient-to-r from-transparent via-slate-200/50 to-transparent my-1" />

                        <button 
                          onClick={handleLogout}
                          role="menuitem"
                          className="w-full flex items-center gap-3 px-3.5 py-2.5 cursor-pointer rounded-xl transition-colors duration-150 hover:bg-rose-50/90 text-left group"
                        >
                          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-rose-600">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
            ) : (
                /* Guest Sign In Button */
                <Button 
                    variant="primary" 
                    size="sm" 
                    className="rounded-full shadow-lg shadow-indigo-500/20 px-6"
                    onClick={handleLogin}
                >
                    Sign In
                </Button>
            )}
          </header>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};