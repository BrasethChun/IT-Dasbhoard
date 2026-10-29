import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';

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

  const handleDelete = (id: string) => {
    fetch(`/api/sites/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(() => {
      setConfirmDeleteId(null);
      fetchSites();
    });
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Sites</h2>
        <Button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-sm shadow-sm">
          <Plus size={16} /> Add Site
        </Button>
      </div>
      
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm transition-all duration-300">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Site Name</th>
              <th className="px-5 py-3.5 font-semibold">Location</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {(!sites || sites.length === 0) ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">No sites found.</td></tr>
            ) : sites.map((row: any) => (
              <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5 text-slate-900 font-medium">{row.site_name}</td>
                <td className="px-5 py-3.5 text-slate-700">{row.location || '--'}</td>
                <td className="px-5 py-3.5 text-slate-700">
                  {row.status === 'Active' ? (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Active</span>
                  ) : <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-semibold">{row.status}</span>}
                </td>
                <td className="px-5 py-3.5 text-right flex justify-end gap-2">
                  <button onClick={() => openEditModal(row)} className="text-indigo-600 hover:text-indigo-800 p-1 bg-indigo-50 rounded" title="Edit"><Edit size={14}/></button>
                  {confirmDeleteId === row.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(row.id)} className="text-xs bg-rose-600 text-white px-2 py-1 rounded hover:bg-rose-700 transition-colors">Confirm</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300 transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(row.id)} className="text-rose-600 hover:text-rose-800 p-1 bg-rose-50 rounded" title="Delete"><Trash2 size={14}/></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">{editingId ? 'Edit Site' : 'Add Site'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 outline-none"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Site Name</label>
                <input required type="text" value={formData.site_name} onChange={e => setFormData({...formData, site_name: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="e.g. West Wing Clinic" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Location Details</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="e.g. 123 Main St, New York" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow bg-white">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="secondary" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Asset Categories</h2>
        <Button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-sm shadow-sm">
          <Plus size={16} /> Add Category
        </Button>
      </div>
      
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm transition-all duration-300">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5 font-semibold w-1/3">Category Name</th>
              <th className="px-5 py-3.5 font-semibold">Description</th>
              <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {(!categories || categories.length === 0) ? (
              <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-400">No categories found.</td></tr>
            ) : categories.map((row: any) => (
              <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5 text-slate-900 font-medium">{row.category_name}</td>
                <td className="px-5 py-3.5 text-slate-700">{row.description || '--'}</td>
                <td className="px-5 py-3.5 text-right flex justify-end gap-2">
                  <button onClick={() => openEditModal(row)} className="text-indigo-600 hover:text-indigo-800 p-1 bg-indigo-50 rounded transition-colors" title="Edit"><Edit size={14}/></button>
                  {confirmDeleteId === row.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(row.id)} className="text-xs bg-rose-600 text-white px-2 py-1 rounded hover:bg-rose-700 transition-colors">Confirm</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300 transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(row.id)} className="text-rose-600 hover:text-rose-800 p-1 bg-rose-50 rounded transition-colors" title="Delete"><Trash2 size={14}/></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">{editingId ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 outline-none"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Category Name</label>
                <input required type="text" value={formData.category_name} onChange={e => setFormData({...formData, category_name: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" placeholder="e.g. Computer" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow resize-none" placeholder="e.g. Desktops, Laptops..." />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="secondary" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
