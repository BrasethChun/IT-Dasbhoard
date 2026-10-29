import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, PlusCircle, Settings, LogOut, Command, LogIn, BarChart, ChevronDown, ChevronRight, User, ReceiptText, Wrench, Database, RefreshCw, Zap, ShieldCheck, AlertCircle, Crown, Lock } from 'lucide-react';
import { RoutePath } from '../types';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC<{ isPinned?: boolean; onTogglePin?: () => void }> = ({ isPinned = false, onTogglePin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname, search } = location;
  const { user, isAuthenticated, logout } = useAuth();
  
  const searchParams = new URLSearchParams(search);
  const currentTab = searchParams.get('tab') || 'executive';

  const [itDashboardOpen, setItDashboardOpen] = useState(pathname === RoutePath.IT_DASHBOARD || pathname === RoutePath.VENDORS);
  const [itToolsOpen, setItToolsOpen] = useState(
    pathname === RoutePath.NOTES || 
    pathname === RoutePath.MAIL_ASSISTANT ||
    pathname.startsWith('/mail') ||
    pathname.startsWith(RoutePath.INVOICES) || 
    (pathname.startsWith(RoutePath.NOTES) && pathname !== RoutePath.CREATE_NOTE)
  );

  const isOwner = user?.role === 'owner';

  const [dbStatus, setDbStatus] = useState<{
    host: string;
    activeHost: string;
    port: number;
    database: string;
    isRemote: boolean;
    primaryDb: string;
    isPrimaryLocked: boolean;
    isFailoverActive: boolean;
    status: string;
    latencyMs: number;
  } | null>(null);
  const [dbRefreshing, setDbRefreshing] = useState(false);

  const fetchDbStatus = async (showSpin = false) => {
    if (!isOwner) return;
    if (showSpin) setDbRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/db/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      } else if (res.status === 403) {
        setDbStatus(null);
      }
    } catch (e) {
      console.warn('Sidebar DB status fetch warning:', e);
    } finally {
      if (showSpin) setTimeout(() => setDbRefreshing(false), 500);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchDbStatus();
      const interval = setInterval(() => {
        fetchDbStatus();
      }, 20000);
      return () => clearInterval(interval);
    } else {
      setDbStatus(null);
    }
  }, [isOwner]);

  const handleLogout = () => {
    logout();
    navigate(RoutePath.HOME);
  };

  const handleLogin = () => {
    navigate(RoutePath.LOGIN);
  };

  const navItems = [
    ...(user?.can_access_welcome !== false && user?.can_access_welcome !== 0 ? [{ icon: Home, label: 'Home', path: RoutePath.HOME }] : []),
    ...(user?.role === 'admin' || user?.role === 'owner' || user?.can_access_it === true || user?.can_access_it === 1 ? [
      { 
        icon: BarChart, 
        label: 'IT Dashboard', 
        path: RoutePath.IT_DASHBOARD,
        isOpen: itDashboardOpen,
        toggleOpen: () => {
          if (!getIsActive(RoutePath.IT_DASHBOARD, 'IT Dashboard') || currentTab !== 'executive') {
            navigate(RoutePath.IT_DASHBOARD);
            setItDashboardOpen(true);
          } else {
            setItDashboardOpen(!itDashboardOpen);
          }
        },
        subItems: [
          { label: 'Executive Summary', id: 'executive', path: `${RoutePath.IT_DASHBOARD}?tab=executive` },
          { label: 'Staffing', id: 'staffing', path: `${RoutePath.IT_DASHBOARD}?tab=staffing` },
          { label: 'Helpdesk', id: 'helpdesk', path: `${RoutePath.IT_DASHBOARD}?tab=helpdesk` },
          { label: 'Assets Management', id: 'assets', path: `${RoutePath.IT_DASHBOARD}?tab=assets` },
          { label: 'Cloud & HIS Subscription', id: 'subscriptions', path: `${RoutePath.IT_DASHBOARD}?tab=subscriptions` },
          { label: 'Vendor Management', id: 'vendors', path: RoutePath.VENDORS }
        ]
      },
      {
        icon: Wrench,
        label: 'IT Tools',
        path: RoutePath.MAIL_ASSISTANT,
        isOpen: itToolsOpen,
        toggleOpen: () => {
          if (!getIsActive(RoutePath.MAIL_ASSISTANT, 'IT Tools')) {
            navigate(RoutePath.MAIL_ASSISTANT);
            setItToolsOpen(true);
          } else {
            setItToolsOpen(!itToolsOpen);
          }
        },
        subItems: [
          { label: 'Mail Assistant', id: 'mail', path: RoutePath.MAIL_ASSISTANT },
          { label: 'IT Notes & Meetings', id: 'notes', path: RoutePath.NOTES },
          { label: 'Invoices', id: 'invoices', path: RoutePath.INVOICES }
        ]
      }
    ] : []),
    { icon: User, label: 'Account', path: RoutePath.ACCOUNT },
    ...(user?.role === 'admin' || user?.role === 'owner' || user?.can_access_it === true || user?.can_access_it === 1 ? [{ icon: Settings, label: 'Settings', path: RoutePath.SETTINGS }] : []),
  ];

  const getIsActive = (path: string, itemLabel?: string) => {
    if (itemLabel === 'IT Tools') {
      return (pathname.startsWith(RoutePath.NOTES) && pathname !== RoutePath.CREATE_NOTE) || 
             pathname.startsWith(RoutePath.INVOICES) ||
             pathname.startsWith(RoutePath.MAIL_ASSISTANT);
    }
    if (path === RoutePath.HOME) {
      return pathname === RoutePath.HOME;
    }
    if (path === RoutePath.NOTES) {
      return pathname.startsWith(RoutePath.NOTES) && pathname !== RoutePath.CREATE_NOTE;
    }
    if (path === RoutePath.CREATE_NOTE) {
      return pathname === RoutePath.CREATE_NOTE;
    }
    if (path === RoutePath.IT_DASHBOARD) {
      return pathname === RoutePath.IT_DASHBOARD || pathname === RoutePath.VENDORS;
    }
    return pathname.startsWith(path);
  };

  return (
    <aside 
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button, a')) return;
        if (onTogglePin) onTogglePin();
      }}
      className={`fixed left-0 top-0 z-40 h-screen border-r border-white/60 bg-white/45 backdrop-blur-2xl hidden md:flex md:flex-col shadow-[0_4px_15px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-300 group ${isPinned ? 'w-64 cursor-default' : 'w-20 hover:w-64 cursor-pointer'}`}
    >
      <div className="flex h-24 items-center px-8 shrink-0">
        <div className="flex items-center gap-3 text-slate-900 font-bold tracking-tight group cursor-default">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105 group-hover:rotate-3">
            <Command size={20} />
          </div>
          <span className={`text-xl tracking-tight text-slate-800 transition-opacity whitespace-nowrap overflow-hidden ${isPinned ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}>IT Dashboard</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 overflow-y-auto hide-scrollbar">
        <nav className="space-y-2">
          {navItems.map((item: any) => {
            const isActive = getIsActive(item.path, item.label);
            
            if (item.subItems) {
              return (
                <div key={item.label} className="flex flex-col gap-1">
                  <button
                    onClick={item.toggleOpen}
                    className={`flex items-center justify-between rounded-full py-3.5 text-sm transition-all duration-300 ${isPinned ? 'px-5' : 'px-3 md:group-hover:px-5'} ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold shadow-[0_4px_15px_rgba(129,140,248,0.25)] translate-x-1'
                        : 'text-slate-600 font-medium hover:bg-white/50 hover:text-slate-900 hover:translate-x-1'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`transition-colors shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                      <span className={`transition-opacity whitespace-nowrap overflow-hidden flex-1 text-left ${isPinned ? 'opacity-100 w-auto' : 'opacity-0 md:group-hover:opacity-100 w-0 md:group-hover:w-auto'}`}>{item.label}</span>
                    </div>
                    <div className={`transition-opacity shrink-0 ${isPinned ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}>
                      {item.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </button>
                  
                  {isActive && item.isOpen && (
                    <div className="pl-6 pr-2 py-2 space-y-1 animate-in slide-in-from-top-2 fade-in duration-200">
                      {item.subItems.map((subItem: any) => {
                        const isSubActive = subItem.path 
                          ? (subItem.path.includes('?tab=') 
                              ? pathname === subItem.path.split('?')[0] && currentTab === subItem.id 
                              : (subItem.path === RoutePath.NOTES 
                                  ? pathname.startsWith(RoutePath.NOTES) && pathname !== RoutePath.CREATE_NOTE 
                                  : pathname.startsWith(subItem.path)))
                          : currentTab === subItem.id;
                        return (
                          <Link
                            key={subItem.id}
                            to={subItem.path || `${item.path}?tab=${subItem.id}`}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm transition-all duration-200 whitespace-nowrap overflow-hidden ${isPinned ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'} ${
                              isSubActive 
                                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm border border-indigo-100/50' 
                                : 'text-slate-500 font-medium hover:bg-white hover:text-slate-800'
                            }`}
                          >
                            <span className="truncate">{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-full py-3.5 text-sm transition-all duration-300 ${isPinned ? 'px-5' : 'px-3 md:group-hover:px-5'} ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold shadow-[0_4px_15px_rgba(129,140,248,0.25)] translate-x-1'
                    : 'text-slate-600 font-medium hover:bg-white/50 hover:text-slate-900 hover:translate-x-1'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`transition-colors shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span className={`transition-opacity whitespace-nowrap overflow-hidden ${isPinned ? 'opacity-100 w-auto' : 'opacity-0 md:group-hover:opacity-100 w-0 md:group-hover:w-auto'}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={`border-t border-slate-200/60 bg-gradient-to-b from-white/30 to-slate-50/70 backdrop-blur-md shrink-0 transition-all ${isPinned ? 'p-3.5 space-y-3' : 'p-2 md:group-hover:p-3.5 space-y-2 md:group-hover:space-y-3'}`}>
        {/* SQL Connection Status Card - Strictly restricted to Owner accounts for security */}
        {isOwner && (
          <div 
            onClick={() => navigate(`${RoutePath.SETTINGS}?tab=database`)}
            title={dbStatus ? `[Owner Secured] MySQL Host: ${dbStatus.host} (${dbStatus.latencyMs}ms)\nStatus: ${dbStatus.status}` : '[Owner Secured] GoDaddy MySQL: 118.139.180.163 (Connecting...)'}
            className={`cursor-pointer group/db transition-all duration-200 rounded-2xl border ${
              dbStatus?.isFailoverActive 
                ? 'bg-amber-50/90 border-amber-200/90 hover:bg-amber-100/90 shadow-sm' 
                : dbStatus?.isRemote !== false
                  ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white/95 border-emerald-300/80 hover:border-emerald-400 hover:shadow-md hover:shadow-emerald-500/10'
                  : 'bg-white/90 border-slate-200 hover:bg-slate-50 shadow-sm'
            } ${isPinned ? 'p-3' : 'p-1.5 md:group-hover:p-3'}`}
          >
            {/* Collapsed View: Compact Database Icon with Live Status Indicator Dot & Security Shield */}
            <div className={`items-center justify-center relative ${isPinned ? 'hidden' : 'flex md:group-hover:hidden'}`}>
              <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-white shadow-xs border border-slate-200/80 group-hover/db:scale-105 transition-transform">
                <Database size={19} className={dbStatus?.isFailoverActive ? 'text-amber-600' : 'text-emerald-600'} />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    dbStatus?.isFailoverActive ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                    dbStatus?.isFailoverActive ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></span>
                </span>
                <span className="absolute -bottom-1 -left-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-900 text-amber-300 text-[8px] border border-white">
                  <Crown size={8} />
                </span>
              </div>
            </div>

            {/* Expanded View: Full SQL Connection Status Panel with Owner Security Badge */}
            <div className={`${isPinned ? 'block' : 'hidden md:group-hover:block'} animate-in fade-in duration-200 space-y-2`}>
              {/* Header: Title + Latency & Refresh Button */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      dbStatus?.isFailoverActive ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      dbStatus?.isFailoverActive ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}></span>
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate tracking-tight flex items-center gap-1">
                    <Database size={13} className={dbStatus?.isFailoverActive ? 'text-amber-600' : 'text-emerald-600'} />
                    {dbStatus?.isRemote !== false ? 'GoDaddy MySQL' : 'Local MariaDB'}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {dbStatus?.latencyMs !== undefined && (
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      dbStatus.latencyMs < 50 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      <Zap size={9} className="text-amber-500 fill-amber-500" />
                      {dbStatus.latencyMs}ms
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchDbStatus(true);
                    }}
                    title="Click to refresh SQL connection test"
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-md transition-colors"
                  >
                    <RefreshCw size={11} className={dbRefreshing ? 'animate-spin text-indigo-600' : ''} />
                  </button>
                </div>
              </div>

              {/* Host Details with Owner Security Tag */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono bg-white/80 px-2 py-1 rounded-lg border border-slate-200/60 shadow-2xs">
                <span className="truncate font-semibold text-slate-800">{dbStatus?.host || '118.139.180.163'}</span>
                <span className="text-[10px] font-sans text-slate-400 font-medium">:{dbStatus?.port || 3306}</span>
              </div>

              {/* Badges & Manage Link */}
              <div className="flex items-center justify-between gap-1 pt-0.5">
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs ${
                    dbStatus?.isFailoverActive
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {dbStatus?.isFailoverActive ? (
                      <>
                        <AlertCircle size={10} className="text-amber-600 shrink-0" />
                        Failover
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={11} className="text-emerald-600 shrink-0" />
                        Locked & Live
                      </>
                    )}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 flex items-center gap-0.5 shadow-2xs">
                    <Crown size={9} />
                    Owner
                  </span>
                </div>
                <span className="text-[11px] text-indigo-600 group-hover/db:text-indigo-800 font-semibold transition-colors flex items-center gap-0.5">
                  Manage &rarr;
                </span>
              </div>
            </div>
          </div>
        )}

        {/* User Auth Action (Sign Out / Sign In) */}
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-full py-2.5 text-sm font-medium text-slate-600 hover:bg-white/80 hover:text-red-600 transition-all hover:shadow-sm ${isPinned ? 'px-4' : 'px-3 md:group-hover:px-4'}`}
          >
            <LogOut size={18} strokeWidth={2} className="opacity-70 shrink-0" />
            <span className={`transition-opacity whitespace-nowrap overflow-hidden ${isPinned ? 'opacity-100 w-auto' : 'opacity-0 md:group-hover:opacity-100 w-0 md:group-hover:w-auto'}`}>Sign Out</span>
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className={`flex w-full items-center gap-3 rounded-full py-2.5 text-sm font-medium text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 transition-all shadow-sm ${isPinned ? 'px-4' : 'px-3 md:group-hover:px-4'}`}
          >
            <LogIn size={18} strokeWidth={2} className="opacity-70 shrink-0" />
            <span className={`transition-opacity whitespace-nowrap overflow-hidden ${isPinned ? 'opacity-100 w-auto' : 'opacity-0 md:group-hover:opacity-100 w-0 md:group-hover:w-auto'}`}>Sign In</span>
          </button>
        )}
      </div>
    </aside>
  );
};