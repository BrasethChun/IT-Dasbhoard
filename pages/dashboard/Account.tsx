import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, AlertTriangle, Save, Camera, Lock, ChevronRight, Globe, Key, Trash2, Smartphone } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { RoutePath } from '../../types';
import { storageService } from '../../services/storageService';
import { apiClient } from '../../src/apiClient';
import { useAuth } from '../../context/AuthContext';
import { StorageImage } from '../../components/ui/StorageImage';

export const Account: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // User specific state
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    timezone: 'UTC-8 (Pacific Time)'
  });
  const [avatarPath, setAvatarPath] = useState<string | null>(null);

  const [saveStatus, setSaveStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Set local state based on auth context
  useEffect(() => {
    if (user) {
        setUserId(user.id);
        setEmail(user.email || '');
        setAvatarPath(user.avatarUrl || user.avatar_url || null);
        
        setFormData({
          fullName: user.full_name || user.name || '',
          displayName: user.display_name || user.name || '',
          timezone: user.timezone || 'UTC-8 (Pacific Time)'
        });
        setFetching(false);
    } else {
        const fetchUser = async () => {
          try {
             const data = await apiClient.fetch('/auth/me');
             if (data?.user) {
               setUser(data.user);
             } else {
               navigate(RoutePath.LOGIN);
             }
          } catch {
             navigate(RoutePath.LOGIN);
          } finally {
             setFetching(false);
          }
        };
        fetchUser();
    }
  }, [user, navigate, setUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith('image/')) {
      setSaveStatus({ type: 'error', message: 'Please select a valid image file (PNG, JPG, GIF, or WebP).' });
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveStatus({ type: 'error', message: 'Profile photo must be smaller than 5 MB.' });
      e.target.value = '';
      return;
    }

    try {
      setLoading(true);
      setSaveStatus(null);
      const path = await storageService.uploadFile(file, userId, 'avatar');
      const data = await apiClient.fetch('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ avatar_url: path })
      });
      const updatedAvatar = data?.user?.avatarUrl || data?.user?.avatar_url || path;
      setAvatarPath(updatedAvatar);
      if (data?.user) {
        setUser(data.user);
      } else if (user) {
        setUser({ ...user, avatarUrl: updatedAvatar, avatar_url: updatedAvatar });
      }
      setSaveStatus({ type: 'success', message: 'Profile photo updated!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      setSaveStatus({ type: 'error', message: error?.message || 'Failed to upload profile photo.' });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!userId || !avatarPath) return;
    try {
      setLoading(true);
      setSaveStatus(null);
      const data = await apiClient.fetch('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ avatar_url: null })
      });
      setAvatarPath(null);
      if (data?.user) {
        setUser(data.user);
      } else if (user) {
        setUser({ ...user, avatarUrl: null, avatar_url: null });
      }
      setSaveStatus({ type: 'success', message: 'Profile photo removed.' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error: any) {
      console.error("Error removing avatar:", error);
      setSaveStatus({ type: 'error', message: error?.message || 'Failed to remove profile photo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveStatus(null);

    try {
      const data = await apiClient.fetch('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: formData.fullName,
          displayName: formData.displayName,
          timezone: formData.timezone,
          avatarUrl: avatarPath
        })
      });
      if (data?.user) {
        setUser(data.user);
      }
      setSaveStatus({ type: 'success', message: 'Changes saved successfully!' });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setSaveStatus({ type: 'error', message: error?.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setSaveStatus({ type: 'error', message: 'Password reset can be managed by your administrator in Settings > Users, or via Forgot Password on sign-in.' });
    setTimeout(() => setSaveStatus(null), 5000);
  };

  const handleSignOut = async () => {
    logout();
    navigate(RoutePath.LOGIN);
  };

  if (fetching) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-slate-500">
         <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
            <span className="text-sm font-medium">Loading account...</span>
         </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto pb-8 sm:pb-16 animate-in fade-in duration-700">
        
        {/* Background Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-300/10 dark:bg-indigo-500/10 rounded-full blur-[120px] -z-10 mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-0 right-[-10%] w-[800px] h-[800px] bg-fuchsia-100/20 dark:bg-sky-500/10 rounded-full blur-[100px] -z-10 mix-blend-multiply dark:mix-blend-screen pointer-events-none" />

        {/* Main Glass Panel */}
        <div className="relative rounded-3xl sm:rounded-[40px] border border-white/60 dark:border-slate-800 bg-white/75 dark:bg-slate-900/85 backdrop-blur-[80px] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.05),0_10px_30px_-5px_rgba(0,0,0,0.02)] dark:shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_50px_120px_-20px_rgba(0,0,0,0.08)] ring-1 ring-white/50 dark:ring-slate-800">
            
            {/* Top Gloss Highlight */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white dark:via-slate-700 to-transparent opacity-60" />

            <form onSubmit={handleSubmit} className="divide-y divide-slate-200/60 dark:divide-slate-800">
                
                {/* Header Section */}
                <div className="px-5 sm:px-10 py-8 sm:py-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/40 dark:from-white/5 to-transparent opacity-50 pointer-events-none" />
                    
                    {/* Avatar Group */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="group relative cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                            <div className="h-32 w-32 rounded-full p-1 bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl border border-white dark:border-slate-700 shadow-xl transition-transform duration-500 group-hover:scale-105 relative overflow-hidden">
                                 <StorageImage 
                                    path={avatarPath} 
                                    alt="Profile" 
                                    className="h-full w-full rounded-full object-cover" 
                                    fallback={
                                      <div className="h-full w-full rounded-full bg-gradient-to-br from-indigo-100 to-white dark:from-slate-800 dark:to-slate-900 flex items-center justify-center theme-accent-text">
                                          <User size={48} />
                                      </div>
                                    }
                                 />
                            </div>
                            <button
                                type="button"
                                aria-label="Upload profile photo"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  document.getElementById('avatar-upload')?.click();
                                }}
                                className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 shadow-lg ring-1 ring-slate-200 dark:ring-slate-700 transition-all hover:scale-110 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                            >
                                <Camera size={18} />
                            </button>
                            <input 
                                id="avatar-upload"
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleAvatarChange}
                            />
                        </div>
                        {avatarPath && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            disabled={loading}
                            className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Remove photo
                          </button>
                        )}
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
                        {formData.fullName || formData.displayName || email.split('@')[0] || 'User'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-300 text-xs sm:text-sm font-medium inline-flex items-center gap-2 bg-white/60 dark:bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-200/70 dark:border-slate-700 max-w-full overflow-hidden">
                        <Mail size={14} className="shrink-0" />
                        <span className="truncate">{email}</span>
                    </p>
                </div>

                {/* Main Settings Grid */}
                <div className="px-5 sm:px-12 py-8 sm:py-12 space-y-10 sm:space-y-12 bg-white/30 dark:bg-slate-900/40">
                    
                    {/* Section: Profile Information */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                             <div className="h-8 w-8 rounded-full theme-accent-soft flex items-center justify-center shadow-sm">
                                 <User size={16} strokeWidth={2.5} />
                             </div>
                             <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Personal Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <Input 
                                label="Full Name" 
                                name="fullName" 
                                value={formData.fullName} 
                                onChange={handleChange} 
                                placeholder="e.g. Jane Doe"
                             />
                             <Input 
                                label="Display Name" 
                                name="displayName" 
                                value={formData.displayName} 
                                onChange={handleChange} 
                                placeholder="e.g. Jane"
                             />
                        </div>

                        <div>
                             <label className="ml-1 mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Timezone
                            </label>
                            <div className="relative group">
                                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 z-10 transition-colors" size={18} />
                                <select
                                    name="timezone"
                                    value={formData.timezone}
                                    onChange={handleChange}
                                    className="w-full appearance-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 pl-12 pr-5 py-4 text-[15px] font-medium text-slate-900 dark:text-slate-100 shadow-xs transition-all duration-300 hover:bg-white dark:hover:bg-slate-800 focus:border-indigo-500/40 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                                >
                                    <option>UTC-8 (Pacific Time)</option>
                                    <option>UTC-7 (Asia)</option>
                                    <option>UTC-5 (Eastern Time)</option>
                                    <option>UTC+0 (London)</option>
                                    <option>UTC+1 (Paris)</option>
                                    <option>UTC+7 (Asia)</option>
                                    <option>UTC+9 (Tokyo)</option>
                                </select>
                                <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Section: Security */}
                    <div className="space-y-6 pt-6 border-t border-slate-200/40 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="h-8 w-8 rounded-full theme-accent-soft flex items-center justify-center shadow-sm">
                                 <Shield size={16} strokeWidth={2.5} />
                             </div>
                             <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Security & Login</h3>
                        </div>

                        <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/60 dark:bg-slate-800/60 p-4 sm:p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                <div className="flex items-center gap-3.5 sm:gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                                        <Key size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Password</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Last changed 3 months ago</p>
                                    </div>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={handlePasswordReset} className="whitespace-nowrap self-start sm:self-auto">
                                    Change Password
                                </Button>
                            </div>
                            
                            <div className="my-4 h-px w-full bg-slate-200/50 dark:bg-slate-700" />
                            
                            <div className="flex items-center justify-between opacity-60 grayscale">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                                        <Smartphone size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">2-Factor Authentication</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Add an extra layer of security</p>
                                    </div>
                                </div>
                                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 dark:bg-slate-700">
                                    <span className="h-4 w-4 translate-x-1 transform rounded-full bg-white transition" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Danger Zone */}
                    <div className="space-y-6 pt-6 border-t border-slate-200/40 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400 ring-1 ring-red-100 dark:ring-red-900/50 shadow-sm">
                                 <AlertTriangle size={16} strokeWidth={2.5} />
                             </div>
                             <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Danger Zone</h3>
                        </div>

                        <div className="rounded-3xl border border-red-100 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/30 p-6">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Delete Account</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-sm">
                                        Permanently delete your account and all of your content. This action cannot be undone.
                                    </p>
                                </div>
                                <Button type="button" variant="danger" size="sm" className="whitespace-nowrap">
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    Delete Account
                                </Button>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action Bar */}
                <div className="md:sticky md:bottom-0 z-10 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-5 sm:px-8 py-4 sm:py-5 backdrop-blur-xl gap-4">
                    <button 
                        type="button" 
                        onClick={handleSignOut}
                        className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                        Sign Out
                    </button>
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                         {saveStatus && (
                             <span className={`text-sm font-medium ${saveStatus.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} animate-in fade-in slide-in-from-right-4 duration-300`}>
                                 {saveStatus.message}
                             </span>
                         )}
                         <Button type="button" variant="ghost" onClick={() => navigate(RoutePath.HOME)}>
                             Cancel
                         </Button>
                         <Button type="submit" isLoading={loading} className="theme-accent-bg shadow-md">
                             <Save className="mr-2 h-4 w-4" />
                             Save Changes
                         </Button>
                    </div>
                </div>

            </form>
        </div>
    </div>
  );
};