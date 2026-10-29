import React, { useState, useEffect } from 'react';
import { Download, Upload, Plus, Edit2, Trash2, Search, History, Save, X, FileSpreadsheet } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import * as xlsx from 'xlsx';

export const AssetsModule: React.FC<{ sites: any[] }> = ({ sites }) => {
  const [activeTab, setActiveTab] = useState('register'); // register or control
  const [assets, setAssets] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterSite, setFilterSite] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    asset_tag: '',
    category: '',
    site_name: sites[0]?.site_name || '',
    asset_location: '',
    brand: '',
    model: '',
    specification: '',
    status: 'Active',
    purchase_price: '',
    purchase_date: '',
    warranty_expiry: '',
    assign_to: '',
    serial_number: '',
    notes: '',
    transfer_notes: ''
  });

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [deleteConfirmData, setDeleteConfirmData] = useState<{ type: 'single', id: string } | { type: 'multiple' } | null>(null);

  const fetchAssets = () => {
    fetch('/api/assets', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAssets(data);
      });
  };

  const fetchCategories = () => {
    fetch('/api/asset-categories', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
           setCategories(data);
           if (data.length > 0 && !formData.category) {
             setFormData(prev => ({...prev, category: data[0].category_name}));
           }
        }
      });
  };

  const fetchHistory = (assetId: string) => {
    fetch(`/api/assets/${assetId}/history`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHistory(data);
      });
  };

  useEffect(() => {
    fetchAssets();
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setFormData({
      asset_tag: `AST-${Math.floor(Math.random() * 10000)}`,
      category: categories[0]?.category_name || '',
      site_name: sites[0]?.site_name || '',
      asset_location: '',
      brand: '',
      model: '',
      specification: '',
      status: 'Active',
      purchase_price: '',
      purchase_date: new Date().toISOString().slice(0, 10),
      warranty_expiry: new Date(Date.now() + 86400000 * 365).toISOString().slice(0, 10),
      assign_to: '',
      serial_number: '',
      notes: '',
      transfer_notes: ''
    });
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (asset: any) => {
    setFormData({
      asset_tag: asset.asset_tag || '',
      category: asset.category || '',
      site_name: asset.site_name || '',
      asset_location: asset.asset_location || '',
      brand: asset.brand || '',
      model: asset.model || '',
      specification: asset.specification || '',
      status: asset.status || 'Active',
      purchase_price: asset.purchase_price || '',
      purchase_date: asset.purchase_date ? new Date(asset.purchase_date).toISOString().slice(0, 10) : '',
      warranty_expiry: asset.warranty_expiry ? new Date(asset.warranty_expiry).toISOString().slice(0, 10) : '',
      assign_to: asset.assign_to || '',
      serial_number: asset.serial_number || '',
      notes: asset.notes || '',
      transfer_notes: ''
    });
    setEditingId(asset.id);
    setShowModal(true);
  };

  const openTransferModal = (asset: any) => {
    setFormData({
      asset_tag: asset.asset_tag || '',
      category: asset.category || '',
      site_name: asset.site_name || '',
      asset_location: asset.asset_location || '',
      brand: asset.brand || '',
      model: asset.model || '',
      specification: asset.specification || '',
      status: asset.status || 'Active',
      purchase_price: asset.purchase_price || '',
      purchase_date: asset.purchase_date ? new Date(asset.purchase_date).toISOString().slice(0, 10) : '',
      warranty_expiry: asset.warranty_expiry ? new Date(asset.warranty_expiry).toISOString().slice(0, 10) : '',
      assign_to: asset.assign_to || '',
      serial_number: asset.serial_number || '',
      notes: asset.notes || '',
      transfer_notes: ''
    });
    setEditingId(asset.id);
    setShowTransferModal(true);
  };

  const saveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/assets/${editingId}` : '/api/assets';
    
    fetch(url, {
      method,
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    }).then(res => res.json()).then((data) => {
      if (data.error) {
        alert(data.error);
        return;
      }
      setShowModal(false);
      setShowTransferModal(false);
      fetchAssets();
    });
  };

  const deleteAsset = (id: string) => {
    setDeleteConfirmData({ type: 'single', id });
  };

  const deleteSelectedAssets = () => {
    setDeleteConfirmData({ type: 'multiple' });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmData) return;
    
    if (deleteConfirmData.type === 'single') {
      await fetch(`/api/assets/${deleteConfirmData.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
    } else if (deleteConfirmData.type === 'multiple') {
      for (const id of selectedAssetIds) {
        await fetch(`/api/assets/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
      }
      setSelectedAssetIds([]);
    }
    
    setDeleteConfirmData(null);
    fetchAssets();
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAssets = assets.filter(a => {
    const matchSite = filterSite ? a.site_name === filterSite : true;
    const matchSearch = Object.values(a).some(v => v?.toString()?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchSite && matchSearch;
  });

  const sortedAssets = React.useMemo(() => {
    let sortableItems = [...filteredAssets];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredAssets, sortConfig]);

  const exportExcel = () => {
    const ws = xlsx.utils.json_to_sheet(sortedAssets);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Assets");
    xlsx.writeFile(wb, "Fixed_Asset_Register.xlsx");
  };

  const downloadTemplate = () => {
    const templateData = [{
      asset_tag: 'AST-1001',
      category: 'Computer',
      brand: 'Dell',
      model: 'Latitude 5420',
      specification: 'i7, 16GB RAM, 512GB SSD',
      site_name: 'Main Hospital',
      asset_location: 'Room 101',
      status: 'Active',
      purchase_price: 1200,
      purchase_date: '2023-01-15',
      warranty_expiry: '2026-01-15',
      assign_to: 'John Doe',
      serial_number: 'DL12345',
      notes: 'Standard staff laptop'
    }];
    const ws = xlsx.utils.json_to_sheet(templateData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Template");
    xlsx.writeFile(wb, "Asset_Import_Template.xlsx");
  };

  const importExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = xlsx.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data: any[] = xlsx.utils.sheet_to_json(ws);
      
      let imported = 0;
      let updated = 0;
      let failed = 0;
      for (const row of data) {
        // minimal validation
        if (row.asset_tag) {
           const existingAsset = assets.find(a => a.asset_tag === row.asset_tag);
           const method = existingAsset ? 'PUT' : 'POST';
           const url = existingAsset ? `/api/assets/${existingAsset.id}` : '/api/assets';
           
           const res = await fetch(url, {
             method,
             headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
             body: JSON.stringify(row)
           });
           if (res.ok) {
             if (existingAsset) updated++;
             else imported++;
           } else {
             failed++;
           }
        }
      }
      alert(`Import completed: ${imported} added, ${updated} updated${failed > 0 ? `, ${failed} failed` : ''}.`);
      fetchAssets();
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const assetCount = filteredAssets.length;
  const categoryCount = new Set(filteredAssets.map(a => a.category).filter(Boolean)).size;
  const brandCount = new Set(filteredAssets.map(a => a.brand).filter(Boolean)).size;
  const siteCount = new Set(filteredAssets.map(a => a.site_name).filter(Boolean)).size;

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex border-b border-slate-200">
        <button 
          className={`pb-3 px-6 text-sm font-medium transition-colors ${activeTab === 'register' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('register')}
        >
          Fixed Asset Register
        </button>
        <button 
          className={`pb-3 px-6 text-sm font-medium transition-colors ${activeTab === 'control' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('control')}
        >
          Asset Control & Audit
        </button>
      </div>

      {activeTab === 'register' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col pt-5 pb-5">
            <span className="text-sm font-medium text-slate-500 mb-1">Total Assets</span>
            <span className="text-3xl font-bold text-slate-800">{assetCount}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col pt-5 pb-5">
            <span className="text-sm font-medium text-slate-500 mb-1">Categories</span>
            <span className="text-3xl font-bold text-slate-800">{categoryCount}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col pt-5 pb-5">
            <span className="text-sm font-medium text-slate-500 mb-1">Brands</span>
            <span className="text-3xl font-bold text-slate-800">{brandCount}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col pt-5 pb-5">
            <span className="text-sm font-medium text-slate-500 mb-1">Site Locations</span>
            <span className="text-3xl font-bold text-slate-800">{siteCount}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
             <Search size={16} className="absolute left-3 top-3 text-slate-400" />
             <input type="text" placeholder="Search assets..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 text-sm w-full border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <select value={filterSite} onChange={e => setFilterSite(e.target.value)} className="w-full md:w-48 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
            <option value="">All Locations</option>
            {Array.from(new Set(sites.map(s => s.site_name))).map(site_name => (
              <option key={site_name} value={site_name}>{site_name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          {activeTab === 'register' && selectedAssetIds.length > 0 && (
            <Button variant="danger" className="text-white" onClick={deleteSelectedAssets}>
              <Trash2 size={16} className="mr-2"/> Delete Selected ({selectedAssetIds.length})
            </Button>
          )}
          <Button variant="secondary" onClick={downloadTemplate} className="bg-white"><Download size={16} className="mr-2"/> Template</Button>
          <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <Upload size={16} /> Import
            <input type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} className="hidden" />
          </label>
          <Button variant="secondary" onClick={exportExcel} className="bg-white"><FileSpreadsheet size={16} className="mr-2"/> Export Excel</Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={openAddModal}>
            <Plus size={16} className="mr-2"/> Add Asset
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  onChange={(e) => {
                     const pageAssets = itemsPerPage === -1 ? sortedAssets : sortedAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                     if (e.target.checked) {
                       const newIds = new Set(selectedAssetIds);
                       pageAssets.forEach(a => newIds.add(a.id));
                       setSelectedAssetIds(Array.from(newIds));
                     } else {
                       const pageIds = pageAssets.map(a => a.id);
                       setSelectedAssetIds(selectedAssetIds.filter(id => !pageIds.includes(id)));
                     }
                  }}
                  checked={
                    (itemsPerPage === -1 ? sortedAssets : sortedAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)).length > 0 && 
                    (itemsPerPage === -1 ? sortedAssets : sortedAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)).every(a => selectedAssetIds.includes(a.id))
                  }
                />
              </th>
              <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => requestSort('asset_tag')}>Asset Code</th>
              <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => requestSort('category')}>Category</th>
              <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => requestSort('brand')}>Brand</th>
              <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => requestSort('model')}>Model</th>
              <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => requestSort('site_name')}>Site Location</th>
              <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => requestSort('status')}>Status</th>
              <th className="px-4 py-3 font-medium cursor-pointer" onClick={() => requestSort('assign_to')}>Current User</th>
              {activeTab === 'register' && <th className="px-4 py-3 font-medium text-right">Actions</th>}
              {activeTab === 'control' && <th className="px-4 py-3 font-medium text-right">Audit</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(itemsPerPage === -1 ? sortedAssets : sortedAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)).map((a, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={selectedAssetIds.includes(a.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAssetIds(prev => [...prev, a.id]);
                      } else {
                        setSelectedAssetIds(prev => prev.filter(id => id !== a.id));
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{a.asset_tag}</td>
                <td className="px-4 py-3 text-slate-600">{a.category}</td>
                <td className="px-4 py-3 text-slate-600">{a.brand}</td>
                <td className="px-4 py-3 text-slate-600"><span className="text-xs truncate block max-w-[150px]" title={a.specification}>{a.model}</span></td>
                <td className="px-4 py-3 text-slate-600">
                  <div className="flex flex-col">
                    <span>{a.site_name}</span>
                    {a.asset_location && <span className="text-xs text-slate-400">{a.asset_location}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium border ${a.status?.toLowerCase() === 'active' || a.status?.toLowerCase() === 'assigned' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                    a.status?.toLowerCase() === 'repair' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {a.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{a.assign_to || '-'}</td>
                {activeTab === 'register' && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openTransferModal(a)} className="p-1 px-2 text-xs font-medium text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100 transition-colors border border-emerald-200" title="Transfer Asset">Transfer</button>
                      <button onClick={() => openEditModal(a)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => deleteAsset(a.id)} className="p-1 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                )}
                {activeTab === 'control' && (
                  <td className="px-4 py-3 text-right">
                    <Button variant="secondary" size="sm" onClick={() => {
                        setSelectedAssetId(a.id);
                        fetchHistory(a.id);
                        setShowHistoryModal(true);
                      }} className="h-8 py-1 px-3 text-xs bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100">
                      <History size={14} className="mr-1"/> History
                    </Button>
                  </td>
                )}
              </tr>
            ))}
            {sortedAssets.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">No assets found</td></tr>
            )}
          </tbody>
        </table>
        
        {/* Pagination and View Options */}
        {sortedAssets.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">Showing {itemsPerPage === -1 ? 1 : (currentPage - 1) * itemsPerPage + 1} to {itemsPerPage === -1 ? sortedAssets.length : Math.min(currentPage * itemsPerPage, sortedAssets.length)} of {sortedAssets.length}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Show:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-600"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={-1}>All</option>
                </select>
              </div>
            </div>
            {itemsPerPage !== -1 && (
              <div className="flex gap-1">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 rounded text-sm text-slate-600 hover:bg-slate-200 disabled:opacity-50 border border-slate-200">Prev</button>
                <button disabled={currentPage * itemsPerPage >= sortedAssets.length} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 rounded text-sm text-slate-600 hover:bg-slate-200 disabled:opacity-50 border border-slate-200">Next</button>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-semibold text-lg">{editingId ? 'Edit Asset' : 'Add New Asset'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={saveAsset} className="flex flex-col overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1" id={editingId ? 'assetCodeLabel' : ''}>Asset Code *</label>
                  <input required type="text" value={formData.asset_tag} onChange={e => setFormData({...formData, asset_tag: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">-- Select Category --</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.category_name}>{c.category_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Brand</label>
                  <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Model / Description</label>
                  <input type="text" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Specification</label>
                  <textarea rows={2} value={formData.specification} onChange={e => setFormData({...formData, specification: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Site</label>
                  <select value={formData.site_name} onChange={e => setFormData({...formData, site_name: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">-- Select Site --</option>
                    {sites.map(s => <option key={s.id} value={s.site_name}>{s.site_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Asset Location</label>
                  <input type="text" placeholder="e.g. Room 102" value={formData.asset_location} onChange={e => setFormData({...formData, asset_location: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>Active</option>
                    <option>Assigned</option>
                    <option>In Storage</option>
                    <option>Repair</option>
                    <option>Disposed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Purchase Date</label>
                  <input type="date" value={formData.purchase_date} onChange={e => setFormData({...formData, purchase_date: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Warranty Expiry</label>
                  <input type="date" value={formData.warranty_expiry} onChange={e => setFormData({...formData, warranty_expiry: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Current User</label>
                  <input type="text" placeholder="Employee Name / ID" value={formData.assign_to} onChange={e => setFormData({...formData, assign_to: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Serial Number</label>
                  <input type="text" value={formData.serial_number} onChange={e => setFormData({...formData, serial_number: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Remark</label>
                  <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                </div>
              </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white"><Save size={16} className="mr-2"/> Save Asset</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 mb-2 shrink-0">
              <h3 className="font-semibold text-lg text-emerald-800">Transfer Asset Location</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={saveAsset} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5">
                <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Asset Code</div>
                <div className="font-bold text-slate-800 text-base">{formData.asset_tag} <span className="font-normal text-slate-500 ml-2">— {formData.brand} {formData.model}</span></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Site</label>
                  <select required value={formData.site_name} onChange={e => setFormData({...formData, site_name: e.target.value})} className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-emerald-50">
                    <option value="">-- Select New Site --</option>
                    {sites.map(s => <option key={s.id} value={s.site_name}>{s.site_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Location (Room/Floor)</label>
                  <input required type="text" placeholder="e.g. IT Dept Room 2" value={formData.asset_location} onChange={e => setFormData({...formData, asset_location: e.target.value})} className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-emerald-50" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 border-t border-slate-100 pt-5">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Update User (Optional)</label>
                  <input type="text" placeholder="New Employee Name" value={formData.assign_to} onChange={e => setFormData({...formData, assign_to: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Update Status (Optional)</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>Active</option>
                    <option>Assigned</option>
                    <option>In Storage</option>
                    <option>Repair</option>
                    <option>Disposed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Transfer Notes / Reason</label>
                <textarea rows={2} required placeholder="Reason for transfer..." value={formData.transfer_notes} onChange={e => setFormData({...formData, transfer_notes: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
              </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <Button variant="secondary" onClick={() => setShowTransferModal(false)} type="button">Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-emerald-700 border">Complete Transfer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-semibold text-lg flex items-center gap-2"><History size={18} className="text-indigo-600"/> Movement & Audit Trail</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
               {history.length > 0 ? (
                 <div className="space-y-4">
                   {history.map((h, i) => (
                     <div key={i} className="flex gap-4 items-start relative pb-4">
                        {i !== history.length - 1 && <div className="absolute top-8 left-4 bottom-0 w-px bg-slate-200"></div>}
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 z-10 text-xs font-bold">
                          {i + 1}
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex-1">
                          <div className="flex justify-between items-center mb-1">
                             <span className="font-medium text-sm text-slate-800">{h.action}</span>
                             <span className="text-xs text-slate-500">{new Date(h.created_at).toLocaleString()}</span>
                          </div>
                          <div className="text-sm text-slate-600 mb-1">By: {h.performed_by}</div>
                          <div className="grid grid-cols-2 gap-2 text-xs mt-2 border-t border-slate-200 pt-2">
                             {h.old_assignee !== h.new_assignee && (
                               <div className="col-span-2 text-slate-500">
                                  Assignee: <span className="line-through">{h.old_assignee || 'None'}</span> <span className="mx-1 text-slate-400">→</span> <span className="text-indigo-600 font-medium">{h.new_assignee || 'None'}</span>
                               </div>
                             )}
                             {h.old_status !== h.new_status && (
                               <div className="col-span-2 text-slate-500 mt-1">
                                  Status: <span className="line-through">{h.old_status || 'Active'}</span> <span className="mx-1 text-slate-400">→</span> <span className="font-medium">{h.new_status}</span>
                               </div>
                             )}
                             {(h.old_site !== h.new_site || h.old_location !== h.new_location) && (
                               <div className="col-span-2 text-slate-500 mt-1">
                                  Location: <span className="line-through">{h.old_site || 'None'} {h.old_location ? `(${h.old_location})` : ''}</span> <span className="mx-1 text-slate-400">→</span> <span className="text-emerald-600 font-medium">{h.new_site || 'None'} {h.new_location ? `(${h.new_location})` : ''}</span>
                               </div>
                             )}
                             {h.notes && <div className="col-span-2 mt-1 text-slate-500 italic">" {h.notes} "</div>}
                          </div>
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8 text-slate-500">No history found for this asset.</div>
               )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
               <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
      {deleteConfirmData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-2 text-slate-800">Confirm Deletion</h3>
              <p className="text-slate-600 text-center text-sm">
                {deleteConfirmData.type === 'single' ? 'Are you sure you want to delete this asset?' : `Are you sure you want to delete ${selectedAssetIds.length} selected assets?`}
                <br/>This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-center gap-3">
              <Button variant="secondary" onClick={() => setDeleteConfirmData(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete}>Yes, Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
