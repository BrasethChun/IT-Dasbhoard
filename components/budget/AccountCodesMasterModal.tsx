import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, Plus, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { SmartModal } from '../ui/SmartModal';
import { OpexAccountCodeItem } from './OpexEditModal';

interface AccountCodesMasterModalProps {
  accountCodes: OpexAccountCodeItem[];
  onClose: () => void;
  onRefresh: () => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const AccountCodesMasterModal: React.FC<AccountCodesMasterModalProps> = ({
  accountCodes,
  onClose,
  onRefresh,
  showToast
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('OpEx');
  const [editingItem, setEditingItem] = useState<OpexAccountCodeItem | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('OpEx');
  const [editIsActive, setEditIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredCodes = useMemo(() => {
    if (!search.trim()) return accountCodes;
    const q = search.toLowerCase();
    return accountCodes.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [accountCodes, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!code.trim() || !name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/it-budget/account-codes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          description: description.trim(),
          category,
          sort_order: accountCodes.length + 1,
          is_active: 1
        })
      });
      if (res.ok) {
        setCode('');
        setName('');
        setDescription('');
        showToast('Account code created successfully');
        onRefresh();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || 'Failed to create account code');
      }
    } catch (err: any) {
      setErrorMsg('Error creating account code: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: OpexAccountCodeItem) => {
    setEditingItem(item);
    setEditCode(item.code);
    setEditName(item.name);
    setEditDescription(item.description || '');
    setEditCategory(item.category || 'OpEx');
    setEditIsActive(item.is_active !== false && item.is_active !== 0);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!editingItem || !editCode.trim() || !editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/it-budget/account-codes/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: editCode.trim(),
          name: editName.trim(),
          description: editDescription.trim(),
          category: editCategory,
          is_active: editIsActive ? 1 : 0
        })
      });
      if (res.ok) {
        setEditingItem(null);
        showToast('Account code updated successfully');
        onRefresh();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || 'Failed to update account code');
      }
    } catch (err: any) {
      setErrorMsg('Error updating account code: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, codeName: string) => {
    setErrorMsg(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/it-budget/account-codes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        setConfirmDeleteId(null);
        showToast(`Account code "${codeName}" deleted`);
        onRefresh();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || 'Failed to delete account code');
      }
    } catch (err: any) {
      setErrorMsg('Error deleting: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <SmartModal
      onClose={onClose}
      size="xl"
      icon={<SlidersHorizontal size={18} />}
      title={`Configure Master Account Codes (${accountCodes.length} Codes)`}
      subtitle="Manage Chart of Accounts for OPEX plan & GL Actuals (includes 17 official 2027 COA Summary codes)"
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 font-medium flex items-center gap-2">
          <AlertTriangle size={14} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80">
            <div className="text-xs font-bold text-emerald-950 mb-3 flex items-center gap-1.5">
              <Plus size={14} className="text-emerald-600" />
              <span>Add Custom Account Code</span>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Account Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 692109"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Account Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cybersecurity Operations"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700">Description / Scope</label>
                  <input
                    type="text"
                    placeholder="Scope details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="OpEx">Outside Services</option>
                    <option value="IT Supplies">IT Supplies</option>
                    <option value="Telecom & Data">Telecom &amp; Data</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Equipment Lease">Equipment Lease</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={saving || !code.trim() || !name.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-1.5 rounded-xl">
                  {saving ? 'Adding...' : 'Save Account Code'}
                </Button>
              </div>
            </form>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs font-bold text-slate-800">Existing Master Codes ({filteredCodes.length})</span>
              <div className="relative w-64">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter codes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {filteredCodes.map((item) => {
                const isEditing = editingItem?.id === item.id;
                const isConfirmingDel = confirmDeleteId === item.id;
                return (
                  <div key={item.id || item.code} className="p-3 bg-white hover:bg-slate-50/70">
                    {isEditing ? (
                      <form onSubmit={handleUpdate} className="space-y-2.5 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <input
                            type="text"
                            required
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value)}
                            className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                          />
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Description"
                            className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg"
                          />
                          <Button type="button" variant="outline" onClick={() => setEditingItem(null)} className="text-xs py-1 px-2.5">
                            Cancel
                          </Button>
                          <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 px-3">
                            Update
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {item.code}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{item.name}</span>
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                              {item.category || 'OpEx'}
                            </span>
                          </div>
                          {item.description && <p className="text-[11px] text-slate-500">{item.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isConfirmingDel && item.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id!, item.code)}
                                disabled={deletingId === item.id}
                                className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-0.5 text-[10px] font-semibold bg-slate-200 text-slate-700 rounded cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(item)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md cursor-pointer"
                              >
                                <Edit2 size={13} />
                              </button>
                              {item.id && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(item.id!)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
    </SmartModal>
  );
};
