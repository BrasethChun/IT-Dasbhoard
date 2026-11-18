import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import {
  Menu, Search, Sparkles, User, Settings, LogOut, Loader2, FileText, X,
  Home, BarChart, Mail
} from 'lucide-react';
import { RoutePath, Note } from '../types';
import { noteService } from '../services/noteService';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { StorageImage } from '../components/ui/StorageImage';
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Close transient menus on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
    setIsMobileSearchOpen(false);
    setShowResults(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inDesktopMenu = desktopMenuRef.current?.contains(target);
      const inMobileMenu = mobileMenuRef.current?.contains(target);
      if (!inDesktopMenu && !inMobileMenu) {
        setIsProfileMenuOpen(false);
      }

      const inDesktopSearch = desktopSearchRef.current?.contains(target);
      const inMobileSearch = mobileSearchRef.current?.contains(target);
      if (!inDesktopSearch && !inMobileSearch) {
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
    navigate(RoutePath.HOME);
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
    setIsMobileSearchOpen(false);

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
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    return text.length > 60 ? text.substring(0, 60) + '...' : text;
  };

  const renderSearchDropdown = () => {
    if (!showResults) return null;
    return (
      <div className="absolute top-full left-0 right-0 mt-2.5 w-full origin-top z-50 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18)] ring-1 ring-slate-900/5">
          <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-700 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Results for &ldquo;{searchQuery}&rdquo;
          </div>
          <div className="max-h-[300px] overflow-y-auto py-1">
            {searchResults.length > 0 ? (
              searchResults.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => handleSearchResultClick(note.id)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group flex items-start gap-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <div className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-500 group-hover:scale-105 transition-transform">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 transition-colors">
                      {note.title || 'My notes'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 opacity-80">
                      {getPreviewText(note.content) || 'No content'}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
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
          <div className="bg-slate-50/70 dark:bg-slate-800/70 px-3 py-2 text-[10px] text-slate-400 text-center border-t border-slate-100 dark:border-slate-800">
            Press <kbd className="font-sans px-1 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-slate-500">Esc</kbd> to close
          </div>
        </div>
      </div>
    );
  };

  const renderUserMenu = (containerRef: React.RefObject<HTMLDivElement | null>) => {
    if (!isAuthenticated) {
      return (
        <Button
          variant="primary"
          size="sm"
          className="rounded-full shadow-md px-4 sm:px-6 whitespace-nowrap shrink-0"
          onClick={handleLogin}
        >
          Sign In
        </Button>
      );
    }

    const displayName = user?.display_name || user?.full_name || user?.name || user?.email || 'User';
    const initials = displayName
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase())
      .join('');
    const avatarFallback = (
      <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs md:text-sm font-bold tracking-tight">
        {initials || <User size={18} />}
      </div>
    );

    return (
      <div className="flex items-center gap-2 sm:gap-3" ref={containerRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            aria-label="Open account menu"
            className="relative flex items-center justify-center rounded-full bg-white/40 dark:bg-slate-800/60 backdrop-blur-md p-0.5 border border-white/70 dark:border-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.18)] cursor-pointer transition-all duration-200 ease-out hover:scale-[1.04] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 overflow-hidden"
          >
            <StorageImage
              path={user?.avatarUrl || user?.avatar_url}
              fallback={avatarFallback}
              alt={displayName}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover"
              showLoading={false}
            />
          </button>

          {/* Dropdown Menu */}
          <div
            role="menu"
            className={`absolute right-0 mt-3 w-64 max-w-[calc(100vw-2rem)] z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-700 rounded-2xl shadow-[0_22px_70px_rgba(15,23,42,0.3)] py-2 transition-all duration-180 ease-out origin-top-right ${
              isProfileMenuOpen
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 -translate-y-2 pointer-events-none'
            }`}
          >
            <div className="px-4 py-2.5 border-b border-slate-200/60 dark:border-slate-800 mb-1 flex items-center gap-3">
              <StorageImage
                path={user?.avatarUrl || user?.avatar_url}
                fallback={
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    <User size={16} />
                  </div>
                }
                alt={user?.name || 'User'}
                className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                showLoading={false}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user?.full_name || user?.display_name || user?.name || 'Account'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="px-2 space-y-1">
              <button
                type="button"
                onClick={() => handleNavigation(RoutePath.ACCOUNT)}
                role="menuitem"
                className="w-full flex items-center gap-3 px-3.5 py-2.5 cursor-pointer rounded-xl transition-colors duration-150 hover:bg-slate-100/80 dark:hover:bg-slate-800 text-left group"
              >
                <User className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Profile</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">View public profile</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavigation(RoutePath.ACCOUNT)}
                role="menuitem"
                className="w-full flex items-center gap-3 px-3.5 py-2.5 cursor-pointer rounded-xl transition-colors duration-150 hover:bg-slate-100/80 dark:hover:bg-slate-800 text-left group"
              >
                <Settings className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Account Settings</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Manage workspace</span>
                </div>
              </button>

              <div className="h-px bg-gradient-to-r from-transparent via-slate-200/60 dark:via-slate-700 to-transparent my-1" />

              <button
                type="button"
                onClick={handleLogout}
                role="menuitem"
                className="w-full flex items-center gap-3 px-3.5 py-2.5 cursor-pointer rounded-xl transition-colors duration-150 hover:bg-rose-50/90 dark:hover:bg-rose-950/50 text-left group"
              >
                <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-rose-600">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const isPathActive = (target: string) => {
    if (target === RoutePath.HOME) return location.pathname === RoutePath.HOME;
    return location.pathname.startsWith(target);
  };

  return (
    <div className="min-h-[100dvh] app-canvas flex flex-col lg:flex-row selection:bg-indigo-500/30 selection:text-indigo-800 dark:selection:text-indigo-200 overflow-x-clip relative">

      {/* Decorative Background Blobs (CSS Variable Driven) */}
      <div
        className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none z-0"
        style={{ backgroundColor: 'var(--app-blob-1)' }}
      />
      <div
        className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none z-0"
        style={{ backgroundColor: 'var(--app-blob-2)' }}
      />

      <Sidebar
        isPinned={isSidebarPinned}
        onTogglePin={() => setIsSidebarPinned(!isSidebarPinned)}
        mobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        drawerTopSlot={
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Appearance</span>
            <ThemeSwitcher />
          </div>
        }
      />

      {/* Unified Mobile & Tablet Sticky Header (< lg) */}
      <header className="lg:hidden sticky top-0 z-40 border-b border-slate-200/75 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <div className="h-14 px-3 sm:px-5 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="min-w-[44px] min-h-[44px] -ml-1.5 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <button
              type="button"
              onClick={() => navigate(RoutePath.HOME)}
              className="font-bold text-slate-900 dark:text-slate-100 tracking-tight text-sm sm:text-base whitespace-nowrap truncate cursor-pointer"
            >
              Master IT
            </button>
          </div>

          {/* Tablet Inline Search Bar (md to < lg) */}
          <div ref={mobileSearchRef} className="hidden md:block relative flex-1 max-w-sm min-w-0">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 rounded-full bg-slate-100/80 dark:bg-slate-800/85 px-3.5 py-1.5 ring-1 ring-slate-200/70 dark:ring-slate-700/80 focus-within:ring-indigo-500/40 focus-within:bg-white dark:focus-within:bg-slate-800">
              {isSearching ? (
                <Loader2 size={15} className="text-indigo-500 animate-spin shrink-0" />
              ) : (
                <Search size={15} className="text-slate-400 shrink-0" />
              )}
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowResults(true)}
                className="bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none w-full"
              />
              {searchQuery && (
                <button type="button" onClick={clearSearch} aria-label="Clear search" className="text-slate-400 hover:text-slate-600 p-0.5">
                  <X size={14} />
                </button>
              )}
            </div>
            {renderSearchDropdown()}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen((v) => !v)}
              aria-label="Toggle search"
              className={`md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                isMobileSearchOpen
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isMobileSearchOpen ? <X size={19} /> : <Search size={19} />}
            </button>
            <div className="hidden sm:block">
              <ThemeSwitcher />
            </div>
            {renderUserMenu(mobileMenuRef)}
          </div>
        </div>

        {/* Collapsible Phone Search Bar */}
        {isMobileSearchOpen && (
          <div ref={mobileSearchRef} className="md:hidden px-3 pb-3 pt-1 relative">
            <div className="flex items-center gap-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 px-3.5 py-2 ring-1 ring-slate-200/80 dark:ring-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/40">
              {isSearching ? (
                <Loader2 size={16} className="text-indigo-500 animate-spin shrink-0" />
              ) : (
                <Search size={16} className="text-slate-400 shrink-0" />
              )}
              <input
                type="text"
                autoFocus
                placeholder="Search notes, meeting docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowResults(true)}
                className="bg-transparent text-base text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none w-full"
              />
              {searchQuery && (
                <button type="button" onClick={clearSearch} aria-label="Clear search" className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={15} />
                </button>
              )}
            </div>
            {renderSearchDropdown()}
          </div>
        )}
      </header>

      <main className={`flex-1 flex flex-col min-h-[100dvh] min-w-0 ${isSidebarPinned ? 'lg:pl-64' : 'lg:pl-20'} transition-all duration-300 relative z-10`}>

        {/* Desktop Top Header - Floating Glass Bar (lg+) */}
        <div className="hidden lg:block sticky top-3 z-30 px-6 mb-3">
          <header className="flex h-16 items-center justify-between gap-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/75 dark:bg-slate-900/80 px-6 backdrop-blur-2xl shadow-sm transition-all">

            {/* Search Bar Container */}
            <div ref={desktopSearchRef} className="relative w-full max-w-md min-w-0">
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 group rounded-full bg-white/85 dark:bg-slate-800/85 px-4 py-1.5 ring-1 ring-slate-200/70 dark:ring-slate-700/80 transition-all focus-within:ring-indigo-500/40 focus-within:shadow-md w-full relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500/0 group-focus-within:bg-indigo-500 transition-all" />
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
                  className="bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none w-full ml-2"
                  onFocus={() => searchQuery.trim() && setShowResults(true)}
                />
                {searchQuery ? (
                  <button type="button" onClick={clearSearch} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={14} />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-700/80 border border-white dark:border-slate-600">
                    <Sparkles size={10} className="text-indigo-500" />
                    <span className="text-[10px] font-semibold text-indigo-600/80 dark:text-indigo-300">AI</span>
                  </div>
                )}
              </div>

              {renderSearchDropdown()}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <ThemeSwitcher />
              {renderUserMenu(desktopMenuRef)}
            </div>
          </header>
        </div>

        {/* Main Content Area — Responsive Smart Grid Padding + Safe Bottom Clearance */}
        <div className="flex-1 max-w-[1600px] mx-auto w-full px-3 sm:px-5 lg:px-6 py-3 pb-24 md:pb-6 min-w-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile Thumb-Zone Bottom Tab Bar (< md) */}
      <nav
        aria-label="Mobile quick navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200/85 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl pb-safe shadow-[0_-8px_24px_rgba(15,23,42,0.06)]"
      >
        <div className="grid grid-cols-5 h-14 px-1">
          <button
            type="button"
            onClick={() => navigate(RoutePath.HOME)}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              isPathActive(RoutePath.HOME)
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home size={19} strokeWidth={isPathActive(RoutePath.HOME) ? 2.4 : 1.9} />
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`${RoutePath.IT_DASHBOARD}?tab=executive`)}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              isPathActive(RoutePath.IT_DASHBOARD)
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <BarChart size={19} strokeWidth={isPathActive(RoutePath.IT_DASHBOARD) ? 2.4 : 1.9} />
            <span>IT Ops</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(RoutePath.NOTES)}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              isPathActive(RoutePath.NOTES)
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <FileText size={19} strokeWidth={isPathActive(RoutePath.NOTES) ? 2.4 : 1.9} />
            <span>Notes</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(RoutePath.MAIL_ASSISTANT)}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              isPathActive(RoutePath.MAIL_ASSISTANT)
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Mail size={19} strokeWidth={isPathActive(RoutePath.MAIL_ASSISTANT) ? 2.4 : 1.9} />
            <span>Mail</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              isMobileMenuOpen
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Menu size={19} strokeWidth={2} />
            <span>Menu</span>
          </button>
        </div>
      </nav>
    </div>
  );
};