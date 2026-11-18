import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SmartModal, SMART_INPUT_CLASS, SMART_TEXTAREA_CLASS } from '../../components/ui/SmartModal';
import { DensityToggle } from '../../components/ui/SmartGrid';

export const SettingsModule = ({ sites: propSites, fetchSites: propFetchSites, defaultTab = 'sites', hideTabs = false }: any) => {
  const [internalSites, setInternalSites] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  const fetchSites = () => {
    if (propFetchSites) {
      propFetchSites();
    } else {
      const token = localStorage.getItem('token');
      fetch('/api/sites', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setInternalSites(data);
      })
      .catch(err => console.log('Failed to fetch sites', err));
    }
  };

  useEffect(() => {
    if (!propSites) {
      fetchSites();
    }
  }, [propSites]);

  const sites = propSites || internalSites;

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
      {!hideTabs && (
        <div className="flex border-b border-slate-200">
          <button 
            className={`pb-3 px-6 text-sm font-medium transition-colors ${activeTab === 'sites' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('sites')}
          >
            Sites Management
          </button>
          <button 
            className={`pb-3 px-6 text-sm font-medium transition-colors ${activeTab === 'asset_categories' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('asset_categories')}
          >
            Asset Categories
          </button>
        </div>
      )}

      {activeTab === 'sites' && <SitesReport sites={sites} fetchSites={fetchSites} />}
      {activeTab === 'asset_categories' && <AssetCategoriesReport />}
    </div>
  );
};

const SitesReport = ({ sites, fetchSites }: any) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    site_name: '',
    location: '',
    status: 'Active'
  });

  const openAddModal = () => {
    setFormData({ site_name: '', location: '', status: 'Active' });
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (site: any) => {
    setFormData({
      site_name: site.site_name,
      location: site.location || '',
      status: site.status || 'Active'
    });
    setEditingId(site.id);
    setShowModal(true);
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/sites/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error || 'Failed to delete site');
      }
    } catch (e: any) {
      setDeleteError('Error deleting site: ' + e.message);
    } finally {
      setIsDeleting(false);
      setConfirmDeleteId(null);
      fetchSites();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/sites/${editingId}` : '/api/sites';
    const method = editingId ? 'PUT' : 'POST';
    
    fetch(url, {
      method,
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    }).then(() => {
      setShowModal(false);
      fetchSites();
    });
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Sites</h2>
        <div className="flex items-center gap-2.5">
          <DensityToggle />
          <Button onClick={openAddModal} className="gap-2 text-sm shadow-sm whitespace-nowrap">
            <Plus size={16} /> Add Site
          </Button>
        </div>
      </div>

      {deleteError && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-200 flex items-center justify-between">
          <span>{deleteError}</span>
          <button type="button" onClick={() => setDeleteError(null)} className="text-rose-500 hover:text-rose-700 font-bold ml-3">
            &times;
          </button>
        </div>
      )}
      
      <div className="overflow-x-auto overflow-y-auto max-h-[65vh] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 transition-all duration-300">
        <table className="smart-grid-table w-full text-sm text-left whitespace-nowrap">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/95 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 backdrop-blur-xs">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Site Name</th>
              <th className="px-5 py-3.5 font-semibold">Location</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            {(!sites || sites.length === 0) ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">No sites found.</td></tr>
            ) : sites.map((row: any) => (
              <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-5 py-3.5 text-slate-900 dark:text-slate-100 font-medium">{row.site_name}</td>
                <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{row.location || '--'}</td>
                <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                  {row.status === 'Active' ? (
                    <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold">Active</span>
                  ) : <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-full text-xs font-semibold">{row.status}</span>}
                </td>
                <td className="px-5 py-3.5 text-right flex justify-end gap-2">
                  <button onClick={() => openEditModal(row)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 p-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg cursor-pointer" title="Edit"><Edit size={14}/></button>
                  {confirmDeleteId === row.id ? (
                    <div className="flex items-center gap-1">
                      <button 
                        type="button"
                        onClick={() => handleDelete(row.id)} 
                        disabled={isDeleting}
                        className="text-xs bg-rose-600 text-white px-2 py-1 rounded hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isDeleting ? 'Deleting...' : 'Confirm'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setConfirmDeleteId(null)} 
                        disabled={isDeleting}
                        className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded hover:bg-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setConfirmDeleteId(row.id)} 
                      className="text-rose-600 dark:text-rose-400 hover:text-rose-800 p-1.5 bg-rose-50 dark:bg-rose-950/50 rounded-lg cursor-pointer" 
                      title="Delete"
                    >
                      <Trash2 size={14}/>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SmartModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Site' : 'Add Site'}
        subtitle="Configure campus or hospital site metadata"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowModal(false)} type="button">Cancel</Button>
            <Button type="submit" form="settings-site-form" size="sm">Save</Button>
          </>
        }
      >
        <form id="settings-site-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Site Name *</label>
            <input required type="text" value={formData.site_name} onChange={e => setFormData({...formData, site_name: e.target.value})} className={SMART_INPUT_CLASS} placeholder="e.g. West Wing Clinic" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Location Details</label>
            <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className={SMART_INPUT_CLASS} placeholder="e.g. Phnom Penh" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Status</label>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={SMART_INPUT_CLASS}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </form>
      </SmartModal>
    </div>
  );
};

const AssetCategoriesReport = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ category_name: '', description: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchCategories = () => {
    fetch('/api/asset-categories', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) setCategories(data);
    });
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAddModal = () => {
    setFormData({ category_name: '', description: '' });
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (cat: any) => {
    setFormData({ category_name: cat.category_name, description: cat.description || '' });
    setEditingId(cat.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    fetch(`/api/asset-categories/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(() => {
      setConfirmDeleteId(null);
      fetchCategories();
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/asset-categories/${editingId}` : '/api/asset-categories';
    const method = editingId ? 'PUT' : 'POST';
    
    fetch(url, {
      method,
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    }).then(() => {
      setShowModal(false);
      fetchCategories();
    });
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Asset Categories</h2>
        <div className="flex items-center gap-2.5">
          <DensityToggle />
          <Button onClick={openAddModal} className="gap-2 text-sm shadow-sm whitespace-nowrap">
            <Plus size={16} /> Add Category
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto overflow-y-auto max-h-[65vh] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 transition-all duration-300">
        <table className="smart-grid-table w-full text-sm text-left whitespace-nowrap">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/95 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 backdrop-blur-xs">
            <tr>
              <th className="px-5 py-3.5 font-semibold w-1/3">Category Name</th>
              <th className="px-5 py-3.5 font-semibold">Description</th>
              <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            {(!categories || categories.length === 0) ? (
              <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-400">No categories found.</td></tr>
            ) : categories.map((row: any) => (
              <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-5 py-3.5 text-slate-900 dark:text-slate-100 font-medium">{row.category_name}</td>
                <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{row.description || '--'}</td>
                <td className="px-5 py-3.5 text-right flex justify-end gap-2">
                  <button onClick={() => openEditModal(row)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 p-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer" title="Edit"><Edit size={14}/></button>
                  {confirmDeleteId === row.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(row.id)} className="text-xs bg-rose-600 text-white px-2 py-1 rounded hover:bg-rose-700 transition-colors cursor-pointer">Confirm</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded hover:bg-slate-300 transition-colors cursor-pointer">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(row.id)} className="text-rose-600 dark:text-rose-400 hover:text-rose-800 p-1.5 bg-rose-50 dark:bg-rose-950/50 rounded-lg transition-colors cursor-pointer" title="Delete"><Trash2 size={14}/></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SmartModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Category' : 'Add Category'}
        subtitle="Manage hardware & software asset category definitions"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowModal(false)} type="button">Cancel</Button>
            <Button type="submit" form="settings-category-form" size="sm">Save</Button>
          </>
        }
      >
        <form id="settings-category-form" onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Category Name *</label>
            <input required type="text" value={formData.category_name} onChange={e => setFormData({...formData, category_name: e.target.value})} className={SMART_INPUT_CLASS} placeholder="e.g. Computer" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Description</label>
            <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={SMART_TEXTAREA_CLASS} placeholder="e.g. Desktops, Laptops..." />
          </div>
        </form>
      </SmartModal>
    </div>
  );
};
