import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { SmartModal } from '../../components/ui/SmartModal';
import { DensityToggle } from '../../components/ui/SmartGrid';
import { Plus, Upload, Trash2, Search, Edit, Building2, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';

interface Vendor {
  id: string;
  name: string;
  vendor_type: string;
  category: string;
  contact_person: string;
  contact_email: string;
  vendor: string;
  status: string;
}

export const VendorList: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    id: undefined as string | undefined,
    name: '',
    vendor_type: '',
    category: '',
    contact_person: '',
    contact_email: '',
    vendor: '',
    status: 'Active'
  });

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/vendors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVendors(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const isEdit = !!formData.id;
      const url = isEdit ? `/api/vendors/${formData.id}` : '/api/vendors';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, vendor: formData.vendor || '' })
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ id: undefined, name: '', vendor_type: '', category: '', contact_person: '', contact_email: '', vendor: '', status: 'Active' });
        fetchVendors();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setFormData({
      id: vendor.id,
      name: vendor.name || '',
      vendor_type: vendor.vendor_type || '',
      category: vendor.category || '',
      contact_person: vendor.contact_person || '',
      contact_email: vendor.contact_email || '',
      vendor: vendor.vendor || '',
      status: vendor.status || 'Active'
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/vendors/${confirmDeleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setConfirmDeleteId(null);
      fetchVendors();
    } catch (e) {
      console.error(e);
      setConfirmDeleteId(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedVendors = results.data.map((row: any) => ({
          name: row['Vendor Name'] || row.name,
          vendor_type: row['Vendor Type'] || row.vendor_type,
          category: row['Category'] || row.category,
          contact_person: row['Contact Person'] || row.contact_person,
          contact_email: row['Email'] || row.contact_email,
          vendor: row['Vendor'] || row.vendor || '',
          status: row['Status'] || row.status || 'Active'
        })).filter(v => v.name);

        if (parsedVendors.length === 0) {
          setImportMessage({ type: 'error', text: 'No valid vendors found in the file. Please check the template format.' });
          setTimeout(() => setImportMessage(null), 5000);
          return;
        }

        try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/vendors/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ vendors: parsedVendors })
          });
          if (res.ok) {
            setImportMessage({ type: 'success', text: `Successfully imported ${parsedVendors.length} vendors` });
            setTimeout(() => setImportMessage(null), 5000);
            fetchVendors();
          } else {
             setImportMessage({ type: 'error', text: 'Failed to import vendors' });
             setTimeout(() => setImportMessage(null), 5000);
          }
        } catch (err) {
          console.error(err);
          setImportMessage({ type: 'error', text: 'An error occurred during import.' });
          setTimeout(() => setImportMessage(null), 5000);
        }
      },
      error: (error) => {
        console.error(error);
        setImportMessage({ type: 'error', text: 'Error parsing CSV file' });
        setTimeout(() => setImportMessage(null), 5000);
      }
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Vendor Name,Vendor Type,Category,Contact Person,Email,Vendor,Status\nExample Vendor,Software,IT Services,John Doe,john@example.com,Microsoft,Active";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vendor_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.vendor_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSubscriptionVendors = vendors.filter(v => v.vendor_type?.toLowerCase() === 'subscription').length;
  const totalDeviceVendors = vendors.filter(v => v.vendor_type?.toLowerCase() === 'device' || v.vendor_type?.toLowerCase() === 'devices').length;
  const totalRentalVendors = vendors.filter(v => v.vendor_type?.toLowerCase() === 'rental').length;

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 px-1 sm:px-6 lg:px-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Vendor Management</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Manage your IT vendors, contracts, and suppliers.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" onClick={downloadTemplate} className="whitespace-nowrap">
            Template
          </Button>
          <div>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <Button variant="outline" className="flex items-center gap-2 whitespace-nowrap" onClick={() => fileInputRef.current?.click()}>
              <Upload size={18} />
              Import CSV
            </Button>
          </div>
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 whitespace-nowrap">
            <Plus size={18} />
            Add Vendor
          </Button>
        </div>
      </div>

      {importMessage && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${importMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <div className="font-medium text-sm">{importMessage.text}</div>
        </div>
      )}

      <div className="smart-kpi-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="smart-kpi-card bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-sm font-medium text-slate-500 mb-1">Total Vendors</div>
          <div className="text-3xl font-bold text-slate-900 tabular-nums">{vendors.length}</div>
        </div>
        <div className="smart-kpi-card bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-sm font-medium text-slate-500 mb-1">Total Subscription vendors</div>
          <div className="text-3xl font-bold text-slate-900 tabular-nums">{totalSubscriptionVendors}</div>
        </div>
        <div className="smart-kpi-card bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-sm font-medium text-slate-500 mb-1">Total Purchase Device Vendors</div>
          <div className="text-3xl font-bold text-slate-900 tabular-nums">{totalDeviceVendors}</div>
        </div>
        <div className="smart-kpi-card bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-sm font-medium text-slate-500 mb-1">Total Rental vendors</div>
          <div className="text-3xl font-bold text-slate-900 tabular-nums">{totalRentalVendors}</div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DensityToggle />
        </div>

        <div className="overflow-x-auto max-h-[68vh]">
          <table className="smart-grid-table min-w-full divide-y divide-slate-200">
            <thead className="sticky top-0 z-20 bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Vendor Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Vendor Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Vendor At</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap sticky right-0 bg-slate-50 z-10 shadow-[-1px_0_0_0_#e2e8f0]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-4 text-center text-sm text-slate-500">Loading vendors...</td></tr>
              ) : filteredVendors.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-4 text-center text-sm text-slate-500">No vendors found.</td></tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{vendor.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">{vendor.vendor_type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">{vendor.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{vendor.contact_person}</div>
                      <div className="text-sm text-slate-500">{vendor.contact_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        vendor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-left font-medium">
                      {vendor.vendor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-[-1px_0_0_0_#e2e8f0]">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(vendor)} className="text-indigo-500 hover:text-indigo-700">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(vendor.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SmartModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={formData.id ? 'Edit Vendor' : 'Add New Vendor'}
        subtitle="Maintain IT supplier directory, contact details, and status"
        icon={<Building2 size={18} className="text-indigo-600" />}
        size="md"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" form="vendor-modal-form">Save Vendor</Button>
          </div>
        }
      >
        <form id="vendor-modal-form" onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Name *</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Type *</label>
              <select required value={formData.vendor_type} onChange={e => setFormData({...formData, vendor_type: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm">
                <option value="" disabled>Select vendor type</option>
                <option value="Devices">Devices</option>
                <option value="Rental">Rental</option>
                <option value="Subscription">Subscription</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
              <input type="text" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input type="email" value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Brand *</label>
              <input type="text" required value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </form>
      </SmartModal>

      <SmartModal
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete Vendor?"
        subtitle="This action cannot be undone"
        icon={<AlertTriangle size={18} className="text-rose-600" />}
        size="sm"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button type="button" variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button type="button" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">Are you sure you want to delete this vendor? This action cannot be undone.</p>
      </SmartModal>
    </div>
  );
};
