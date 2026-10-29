import React, { useEffect, useState } from 'react';
import { 
  User, Shield, AlertCircle, CheckCircle2, Save, MapPin, Layers, 
  Settings as SettingsIcon, Edit, Trash2, Power, PowerOff, Plus, X, 
  Search, Lock, Mail, Key, Eye, EyeOff, Copy, Check, RefreshCw, Database 
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SettingsModule } from './SettingsModule';
import { DatabaseMigrationModule } from './DatabaseMigrationModule';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  display_name: string;
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
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          onClick={() => { setActiveTab('sites'); setSearchParams({ tab: 'sites' }); }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'sites'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Sites & Facilities
        </button>
        <button
          onClick={() => { setActiveTab('categories'); setSearchParams({ tab: 'categories' }); }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'categories'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Asset Categories
        </button>
        <button
          onClick={() => { setActiveTab('users'); setSearchParams({ tab: 'users' }); }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          User Roles & Access
        </button>
        <button
          onClick={() => { setActiveTab('database'); setSearchParams({ tab: 'database' }); }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'database'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" />
          GoDaddy MySQL Migration
        </button>
      </div>

      {/* Sites Tab */}
      {activeTab === 'sites' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <SettingsModule defaultTab="sites" hideTabs={true} />
        </div>
      )}

      {/* Asset Categories Tab */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
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
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
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
            <div className="flex items-center gap-3 w-full md:w-auto">
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
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No users match your criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left bg-white text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
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
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                                isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {u.full_name?.charAt(0) || u.display_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                              </div>
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
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/70">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Edit className="w-4 h-4 text-indigo-600" />
                Edit User Account
              </h3>
              <button 
                onClick={() => setEditingUser(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 flex flex-col gap-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.full_name}
                    onChange={e => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">System Role</label>
                  <select
                    value={editFormData.role}
                    onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="user">User (Basic)</option>
                    <option value="admin">Administrator</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Account Status</label>
                  <select
                    value={editFormData.status}
                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Active">Active (Enabled)</option>
                    <option value="Inactive">In-Active (Disabled)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Reset Password <span className="text-slate-400 font-normal">(leave blank to keep current)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    value={editFormData.password}
                    onChange={e => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="Min 6 characters..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-xs font-semibold text-slate-700 mb-2">Module Access Permissions</span>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.can_access_welcome}
                      onChange={e => setEditFormData({ ...editFormData, can_access_welcome: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Dashboard</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.can_access_it}
                      onChange={e => setEditFormData({ ...editFormData, can_access_it: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>IT Suite</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
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

              <div className="flex justify-end gap-3 mt-2 pt-3 border-t border-slate-100">
                <Button 
                  variant="secondary" 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={modalSaving} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  {modalSaving ? 'Saving...' : 'Save User Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/70">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                Add New User Account
              </h3>
              <button 
                onClick={() => setIsAddUserOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={addFormData.full_name}
                    onChange={e => setAddFormData({ ...addFormData, full_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. David Miller"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={addFormData.email}
                    onChange={e => setAddFormData({ ...addFormData, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="user@khemahospital.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={addFormData.password}
                    onChange={e => setAddFormData({ ...addFormData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">System Role</label>
                  <select
                    value={addFormData.role}
                    onChange={e => setAddFormData({ ...addFormData, role: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="user">User (Basic)</option>
                    <option value="admin">Administrator</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Status</label>
                <select
                  value={addFormData.status}
                  onChange={e => setAddFormData({ ...addFormData, status: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Active">Active (Enabled)</option>
                  <option value="Inactive">In-Active (Disabled)</option>
                </select>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="block text-xs font-semibold text-slate-700 mb-2">Module Permissions</span>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addFormData.can_access_welcome}
                      onChange={e => setAddFormData({ ...addFormData, can_access_welcome: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Dashboard</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addFormData.can_access_it}
                      onChange={e => setAddFormData({ ...addFormData, can_access_it: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>IT Suite</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
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

              <div className="flex justify-end gap-3 mt-2 pt-3 border-t border-slate-100">
                <Button 
                  variant="secondary" 
                  type="button" 
                  onClick={() => setIsAddUserOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={modalSaving} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  {modalSaving ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Delete User Account</h3>
            <p className="text-sm text-slate-500 mb-4">
              Are you sure you want to permanently delete account <strong className="text-slate-800">{deleteConfirmUser.email}</strong>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <Button 
                variant="secondary" 
                type="button" 
                onClick={() => setDeleteConfirmUser(null)}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={handleConfirmDelete}
                disabled={modalSaving}
                className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                {modalSaving ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/70">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                Reset User Password
              </h3>
              <button 
                onClick={() => setResetPasswordUser(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="p-6 flex flex-col gap-4">
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs shrink-0 mt-0.5">
                  {resetPasswordUser.full_name?.charAt(0) || resetPasswordUser.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{resetPasswordUser.full_name || resetPasswordUser.display_name}</div>
                  <div className="text-xs text-slate-500">{resetPasswordUser.email}</div>
                  <div className="text-[11px] text-amber-700 mt-1 font-medium">Role: {resetPasswordUser.role}</div>
                </div>
              </div>

              {resetError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700">New Password</label>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline"
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
                    className="w-full pl-3 pr-20 py-2.5 border border-slate-200 rounded-lg text-sm font-mono tracking-wide focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    {newPassword && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        title="Copy to clipboard"
                        className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                      >
                        {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {copied && (
                  <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Copied to clipboard!</span>
                )}
                <span className="text-[11px] text-slate-400 mt-1 block">Must be at least 6 characters.</span>
              </div>

              <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100">
                <Button 
                  variant="secondary" 
                  type="button" 
                  onClick={() => setResetPasswordUser(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={resetSaving || !newPassword} 
                  className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5"
                >
                  {resetSaving ? 'Saving...' : <><Save size={14} /> Save New Password</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
