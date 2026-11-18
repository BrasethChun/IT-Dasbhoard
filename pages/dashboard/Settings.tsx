import React, { useEffect, useState } from 'react';
import { 
  User, Shield, AlertCircle, CheckCircle2, Save, MapPin, Layers, 
  Settings as SettingsIcon, Edit, Trash2, Power, PowerOff, Plus, X, 
  Search, Lock, Mail, Key, Eye, EyeOff, Copy, Check, RefreshCw, Database 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SmartModal, SMART_INPUT_CLASS } from '../../components/ui/SmartModal';
import { DensityToggle } from '../../components/ui/SmartGrid';
import { SettingsModule } from './SettingsModule';
import { DatabaseMigrationModule } from './DatabaseMigrationModule';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { StorageImage } from '../../components/ui/StorageImage';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  display_name: string;
  avatar_url?: string | null;
  role: string;
  status: string;
  can_access_welcome: boolean;
  can_access_it: boolean;
  can_access_pro: boolean;
}

export const Settings: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'sites' | 'categories' | 'users' | 'database') || 'sites';
  const [activeTab, setActiveTab] = useState<'sites' | 'categories' | 'users' | 'database'>(initialTab);
  const [users, setUsers] = useState<UserData[]>([]);
  const [originalUsers, setOriginalUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserData | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Reset Password Modal state
  const [resetPasswordUser, setResetPasswordUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState('');

  // Form data for Edit
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    role: 'user',
    status: 'Active',
    can_access_welcome: true,
    can_access_it: false,
    can_access_pro: false,
    password: ''
  });

  // Form data for Add
  const [addFormData, setAddFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'user',
    status: 'Active',
    can_access_welcome: true,
    can_access_it: false,
    can_access_pro: false
  });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
      setOriginalUsers(JSON.parse(JSON.stringify(data)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLocalChange = (userId: string, field: string, value: boolean | string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: value } : u));
    setSuccess('');
    setError('');
  };

  const handleToggleStatus = async (userToToggle: UserData) => {
    const newStatus = userToToggle.status === 'Inactive' ? 'Active' : 'Inactive';
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${userToToggle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update user status');
      }
      setUsers(prev => prev.map(u => u.id === userToToggle.id ? { ...u, status: newStatus } : u));
      setOriginalUsers(prev => prev.map(u => u.id === userToToggle.id ? { ...u, status: newStatus } : u));
      setSuccess(`User "${userToToggle.email}" is now ${newStatus}.`);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleOpenEdit = (u: UserData) => {
    setEditingUser(u);
    setEditFormData({
      full_name: u.full_name || u.display_name || '',
      email: u.email,
      role: u.role || 'user',
      status: u.status || 'Active',
      can_access_welcome: u.can_access_welcome !== false,
      can_access_it: !!u.can_access_it,
      can_access_pro: !!u.can_access_pro,
      password: ''
    });
    setModalError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setModalSaving(true);
    setModalError('');
    try {
      const token = localStorage.getItem('token');
      const payload: any = {
        full_name: editFormData.full_name,
        display_name: editFormData.full_name,
        email: editFormData.email,
        role: editFormData.role,
        status: editFormData.status,
        can_access_welcome: editFormData.can_access_welcome,
        can_access_it: editFormData.can_access_it,
        can_access_pro: editFormData.can_access_pro
      };
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update user');
      }
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updated } : u));
      setOriginalUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updated } : u));
      setEditingUser(null);
      setSuccess(`User "${updated.email}" updated successfully.`);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmUser) return;
    setModalSaving(true);
    setModalError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${deleteConfirmUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete user');
      }
      setUsers(prev => prev.filter(u => u.id !== deleteConfirmUser.id));
      setOriginalUsers(prev => prev.filter(u => u.id !== deleteConfirmUser.id));
      setSuccess(`User "${deleteConfirmUser.email}" was deleted.`);
      setDeleteConfirmUser(null);
    } catch (err: any) {
      setError(err.message);
      setDeleteConfirmUser(null);
    } finally {
      setModalSaving(false);
    }
  };

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    const array = new Uint32Array(12);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < 12; i++) {
      pass += chars[array[i] % chars.length];
    }
    setNewPassword(pass);
    setCopied(false);
    setResetError('');
  };

  const handleOpenResetPassword = (u: UserData) => {
    setResetPasswordUser(u);
    setNewPassword('');
    setShowPassword(true);
    setCopied(false);
    setResetError('');
  };

  const handleCopyPassword = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    if (!newPassword || newPassword.trim().length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }
    setResetSaving(true);
    setResetError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${resetPasswordUser.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword.trim() })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to reset password');
      }
      setSuccess(`Password for "${resetPasswordUser.email}" has been reset successfully.`);
      setResetPasswordUser(null);
    } catch (err: any) {
      setResetError(err.message);
    } finally {
      setResetSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSaving(true);
    setModalError('');
    try {
      const token = localStorage.getItem('token');
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: addFormData.full_name,
          email: addFormData.email,
          password: addFormData.password
        })
      });

      if (!regRes.ok) {
        const err = await regRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create user');
      }

      const regData = await regRes.json();
      const newUserId = regData?.user?.id;

      if (newUserId) {
        await fetch(`/api/users/${newUserId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            role: addFormData.role,
            status: addFormData.status,
            can_access_welcome: addFormData.can_access_welcome,
            can_access_it: addFormData.can_access_it,
            can_access_pro: addFormData.can_access_pro
          })
        });
      }

      await fetchUsers();
      setIsAddUserOpen(false);
      setAddFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'user',
        status: 'Active',
        can_access_welcome: true,
        can_access_it: false,
        can_access_pro: false
      });
      setSuccess(`New user "${addFormData.email}" created successfully.`);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalSaving(false);
    }
  };

  const handleSaveConfiguration = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      
      const modifiedUsers = users.filter((u) => {
        const originalUser = originalUsers.find(og => og.id === u.id);
        return JSON.stringify(u) !== JSON.stringify(originalUser);
      });
      
      if (modifiedUsers.length === 0) {
        setSuccess('No changes to save.');
        setSaving(false);
        return;
      }
      
      const promises = modifiedUsers.map(async u => {
        const res = await fetch(`/api/users/${u.id}/role`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            role: u.role,
            status: u.status,
            can_access_welcome: u.can_access_welcome,
            can_access_it: u.can_access_it,
            can_access_pro: u.can_access_pro
          })
        });
        if (!res.ok) throw new Error(`Failed to update ${u.email}`);
      });

      await Promise.all(promises);
      setSuccess('Configuration saved successfully.');
      setOriginalUsers(JSON.parse(JSON.stringify(users)));
    } catch (e: any) {
      setError('Failed to save configuration: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(users) !== JSON.stringify(originalUsers);

  // Filter users based on search, role, status
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.display_name && u.display_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || (u.status || 'Active') === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-indigo-500" />
            System Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage enterprise facilities, asset taxonomy, and user roles & permissions.</p>
        </div>
        {activeTab === 'users' && (
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => { setIsAddUserOpen(true); setModalError(''); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-sm shadow-sm"
            >
              <Plus size={16} /> Add User
            </Button>
            <Button 
              onClick={handleSaveConfiguration} 
              disabled={!hasChanges || saving}
              className="flex items-center text-sm"
            >
              {saving ? (
                <span className="flex items-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> Saving...</span>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Changes</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200 mb-6 gap-1 sm:gap-2">
        <button
          onClick={() => { setActiveTab('sites'); setSearchParams({ tab: 'sites' }); }}
          className={`flex items-center gap-2 py-3 px-4 sm:px-5 text-sm font-medium border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'sites'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4 shrink-0" />
          Sites & Facilities
        </button>
        <button
          onClick={() => { setActiveTab('categories'); setSearchParams({ tab: 'categories' }); }}
          className={`flex items-center gap-2 py-3 px-4 sm:px-5 text-sm font-medium border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'categories'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          Asset Categories
        </button>
        <button
          onClick={() => { setActiveTab('users'); setSearchParams({ tab: 'users' }); }}
          className={`flex items-center gap-2 py-3 px-4 sm:px-5 text-sm font-medium border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4 shrink-0" />
          User Roles & Access
        </button>
        <button
          onClick={() => { setActiveTab('database'); setSearchParams({ tab: 'database' }); }}
          className={`flex items-center gap-2 py-3 px-4 sm:px-5 text-sm font-medium border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'database'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600 shrink-0" />
          GoDaddy MySQL Migration
        </button>
      </div>

      {/* Sites Tab */}
      {activeTab === 'sites' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
          <SettingsModule defaultTab="sites" hideTabs={true} />
        </div>
      )}

      {/* Asset Categories Tab */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
          <SettingsModule defaultTab="asset_categories" hideTabs={true} />
        </div>
      )}

      {/* User Access & Roles Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-800">Error</h4>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-emerald-800">Success</h4>
                <p className="text-sm text-emerald-600 mt-1">{success}</p>
              </div>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 md:items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search user name or email..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Role:</span>
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Roles</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <DensityToggle />
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No users match your criteria.</div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto max-h-[68vh]">
                <table className="smart-grid-table w-full text-left bg-white dark:bg-slate-900 text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-800/95 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 backdrop-blur-xs">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">User</th>
                      <th className="px-5 py-3.5 font-semibold">Email</th>
                      <th className="px-5 py-3.5 font-semibold">Role</th>
                      <th className="px-5 py-3.5 font-semibold text-center">Status</th>
                      <th className="px-4 py-3.5 font-semibold text-center">Dashboard</th>
                      <th className="px-4 py-3.5 font-semibold text-center">IT Access</th>
                      <th className="px-4 py-3.5 font-semibold text-center">Pro</th>
                      <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const isActive = (u.status || 'Active') === 'Active';
                      const isSelf = currentUser?.id === u.id;

                      return (
                        <tr key={u.id} className={`hover:bg-slate-50/60 transition-colors ${!isActive ? 'bg-slate-50/40 opacity-75' : ''}`}>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <StorageImage
                                path={u.avatar_url}
                                alt={u.full_name || u.display_name || u.email}
                                className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                                showLoading={false}
                                fallback={
                                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
                                  }`}>
                                    {u.full_name?.charAt(0) || u.display_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                                  </div>
                                }
                              />
                              <div>
                                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  {u.full_name || u.display_name}
                                  {isSelf && (
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">You</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400">ID: {u.id.substring(0, 8)}...</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                            {u.email}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              u.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'owner'
                                ? 'bg-rose-100 text-rose-800'
                                : u.can_access_pro
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              {u.role === 'owner' ? 'Owner' : 
                               u.role === 'admin' ? 'Admin' : 
                               u.can_access_pro ? 'Pro User' : 'Basic User'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              {isActive ? 'Active' : 'In-Active'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-center">
                            <input 
                              type="checkbox" 
                              checked={u.can_access_welcome} 
                              onChange={(e) => handleLocalChange(u.id, 'can_access_welcome', e.target.checked)} 
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" 
                            />
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-center">
                            <input 
                              type="checkbox" 
                              checked={u.can_access_it} 
                              onChange={(e) => handleLocalChange(u.id, 'can_access_it', e.target.checked)} 
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" 
                            />
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-center">
                            <input 
                              type="checkbox" 
                              checked={u.can_access_pro} 
                              onChange={(e) => handleLocalChange(u.id, 'can_access_pro', e.target.checked)} 
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" 
                            />
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Toggle Inactive/Active button */}
                              <button
                                onClick={() => handleToggleStatus(u)}
                                title={isActive ? "Set to In-Active" : "Set to Active"}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isActive 
                                    ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50 border-amber-200' 
                                    : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200'
                                }`}
                              >
                                {isActive ? <PowerOff size={14} /> : <Power size={14} />}
                              </button>

                              {/* Direct Reset Password Button */}
                              <button
                                onClick={() => handleOpenResetPassword(u)}
                                title="Reset User Password"
                                className="p-1.5 rounded-lg border border-amber-200 text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                              >
                                <Key size={14} />
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenEdit(u)}
                                title="Edit User Details"
                                className="p-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors"
                              >
                                <Edit size={14} />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => setDeleteConfirmUser(u)}
                                disabled={isSelf}
                                title={isSelf ? "Cannot delete your own logged-in account" : "Delete User"}
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GoDaddy MySQL Database Migration Tab */}
      {activeTab === 'database' && (
        <DatabaseMigrationModule />
      )}

      {/* Edit User Modal */}
      <SmartModal
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title="Edit User Account"
        subtitle={editingUser ? `Account ID: ${editingUser.id.substring(0, 12)}...` : undefined}
        icon={<Edit className="w-4 h-4" />}
        size="md"
        footer={
          <>
            <Button variant="secondary" type="button" size="sm" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button type="submit" form="settings-edit-user-form" size="sm" disabled={modalSaving}>
              {modalSaving ? 'Saving...' : 'Save User Changes'}
            </Button>
          </>
        }
      >
        <form id="settings-edit-user-form" onSubmit={handleSaveEdit} className="flex flex-col gap-4">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-200 text-xs">
              {modalError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={editFormData.full_name}
                onChange={e => setEditFormData({ ...editFormData, full_name: e.target.value })}
                className={SMART_INPUT_CLASS}
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Email Address *</label>
              <input
                type="email"
                required
                value={editFormData.email}
                onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                className={SMART_INPUT_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">System Role</label>
              <select
                value={editFormData.role}
                onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                className={SMART_INPUT_CLASS}
              >
                <option value="user">User (Basic)</option>
                <option value="admin">Administrator</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Account Status</label>
              <select
                value={editFormData.status}
                onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                className={SMART_INPUT_CLASS}
              >
                <option value="Active">Active (Enabled)</option>
                <option value="Inactive">In-Active (Disabled)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Reset Password <span className="text-slate-400 font-normal">(leave blank to keep current)</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                value={editFormData.password}
                onChange={e => setEditFormData({ ...editFormData, password: e.target.value })}
                placeholder="Min 6 characters..."
                className={`${SMART_INPUT_CLASS} pl-9`}
              />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">Module Access Permissions</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFormData.can_access_welcome}
                  onChange={e => setEditFormData({ ...editFormData, can_access_welcome: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Dashboard</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFormData.can_access_it}
                  onChange={e => setEditFormData({ ...editFormData, can_access_it: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>IT Suite</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFormData.can_access_pro}
                  onChange={e => setEditFormData({ ...editFormData, can_access_pro: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Pro Access</span>
              </label>
            </div>
          </div>
        </form>
      </SmartModal>

      {/* Add User Modal */}
      <SmartModal
        open={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Add New User Account"
        subtitle="Provision system role and module access permissions"
        icon={<Plus className="w-4 h-4" />}
        size="md"
        footer={
          <>
            <Button variant="secondary" type="button" size="sm" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="settings-add-user-form" size="sm" disabled={modalSaving}>
              {modalSaving ? 'Creating...' : 'Create User'}
            </Button>
          </>
        }
      >
        <form id="settings-add-user-form" onSubmit={handleCreateUser} className="flex flex-col gap-4">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-200 text-xs">
              {modalError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={addFormData.full_name}
                onChange={e => setAddFormData({ ...addFormData, full_name: e.target.value })}
                className={SMART_INPUT_CLASS}
                placeholder="e.g. David Miller"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Email Address *</label>
              <input
                type="email"
                required
                value={addFormData.email}
                onChange={e => setAddFormData({ ...addFormData, email: e.target.value })}
                className={SMART_INPUT_CLASS}
                placeholder="user@khemahospital.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Initial Password *</label>
              <input
                type="password"
                required
                value={addFormData.password}
                onChange={e => setAddFormData({ ...addFormData, password: e.target.value })}
                placeholder="Min 6 characters"
                className={SMART_INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">System Role</label>
              <select
                value={addFormData.role}
                onChange={e => setAddFormData({ ...addFormData, role: e.target.value })}
                className={SMART_INPUT_CLASS}
              >
                <option value="user">User (Basic)</option>
                <option value="admin">Administrator</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Initial Status</label>
              <select
                value={addFormData.status}
                onChange={e => setAddFormData({ ...addFormData, status: e.target.value })}
                className={SMART_INPUT_CLASS}
              >
                <option value="Active">Active (Enabled)</option>
                <option value="Inactive">In-Active (Disabled)</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">Module Permissions</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addFormData.can_access_welcome}
                  onChange={e => setAddFormData({ ...addFormData, can_access_welcome: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Dashboard</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addFormData.can_access_it}
                  onChange={e => setAddFormData({ ...addFormData, can_access_it: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>IT Suite</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addFormData.can_access_pro}
                  onChange={e => setAddFormData({ ...addFormData, can_access_pro: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Pro Access</span>
              </label>
            </div>
          </div>
        </form>
      </SmartModal>

      {/* Delete User Confirmation Modal */}
      <SmartModal
        open={Boolean(deleteConfirmUser)}
        onClose={() => setDeleteConfirmUser(null)}
        title="Delete User Account"
        subtitle="Permanent account removal"
        icon={<Trash2 size={18} className="text-rose-600" />}
        size="sm"
        footer={
          <>
            <Button variant="secondary" type="button" size="sm" onClick={() => setDeleteConfirmUser(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={modalSaving}
            >
              {modalSaving ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </>
        }
      >
        {deleteConfirmUser && (
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Are you sure you want to permanently delete account <strong className="text-slate-900 dark:text-slate-100">{deleteConfirmUser.email}</strong>? This action cannot be undone.
          </p>
        )}
      </SmartModal>

      {/* Direct Reset Password Modal */}
      <SmartModal
        open={Boolean(resetPasswordUser)}
        onClose={() => setResetPasswordUser(null)}
        title="Reset User Password"
        subtitle={resetPasswordUser?.email}
        icon={<Key className="w-4 h-4 text-amber-500" />}
        size="sm"
        footer={
          <>
            <Button variant="secondary" type="button" size="sm" onClick={() => setResetPasswordUser(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="settings-reset-password-form"
              size="sm"
              disabled={resetSaving || !newPassword}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            >
              {resetSaving ? 'Saving...' : <><Save size={14} /> Save New Password</>}
            </Button>
          </>
        }
      >
        {resetPasswordUser && (
          <form id="settings-reset-password-form" onSubmit={handleSaveResetPassword} className="flex flex-col gap-4">
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-xs shrink-0 mt-0.5">
                {resetPasswordUser.full_name?.charAt(0) || resetPasswordUser.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{resetPasswordUser.full_name || resetPasswordUser.display_name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{resetPasswordUser.email}</div>
                <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-1 font-medium">Role: {resetPasswordUser.role}</div>
              </div>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">New Password *</label>
                <button
                  type="button"
                  onClick={generateStrongPassword}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RefreshCw size={12} /> Generate Strong
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setCopied(false); setResetError(''); }}
                  placeholder="Enter or generate password..."
                  className={`${SMART_INPUT_CLASS} pr-20 font-mono tracking-wide`}
                />
                <div className="absolute right-2 top-2.5 flex items-center gap-1">
                  {newPassword && (
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      title="Copy to clipboard"
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                    >
                      {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {copied && (
                <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Copied to clipboard!</span>
              )}
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">Must be at least 6 characters.</span>
            </div>
          </form>
        )}
      </SmartModal>
    </div>
  );
};
