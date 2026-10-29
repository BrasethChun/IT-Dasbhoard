import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cloud, Plus, Edit2, Trash2, Search, Download, ExternalLink, 
  RefreshCw, CheckCircle2, AlertTriangle, AlertCircle, Clock, 
  DollarSign, Users, Shield, Server, Filter, X, ChevronDown, 
  FileSpreadsheet, ArrowUpDown, Calendar, CreditCard, Building2, Check, RotateCcw,
  Settings, Sliders, Globe, Tag, Sparkles, Layers,
  Upload, FileUp, ClipboardList, FileText
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import * as xlsx from 'xlsx';

export interface CloudProviderSetting {
  id: string;
  name: string;
  default_category?: string;
  website?: string;
  description?: string;
  is_default?: boolean | number;
}

export interface CloudCategorySetting {
  id: string;
  name: string;
  description?: string;
  color?: string;
  is_default?: boolean | number;
}

export interface CloudSubscription {
  id: string;
  name: string;
  provider: string;
  category: string;
  plan_tier?: string;
  billing_cycle: 'Monthly' | 'Annually' | 'Quarterly' | 'Usage-Based';
  cost: number | string;
  currency: string;
  seats_total: number;
  seats_used: number;
  status: 'Active' | 'Expiring Soon' | 'In Trial' | 'Cancelled' | 'Expired' | 'Under Review';
  renewal_date?: string;
  auto_renew: boolean | number;
  site_name: string;
  owner_team: string;
  account_id?: string;
  payment_method?: string;
  portal_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface SummaryData {
  totalCount: number;
  activeCount: number;
  totalMonthlySpend: number;
  annualRunRate: number;
  expiring30Days: number;
  totalSeats: number;
  usedSeats: number;
  seatUtilization: number;
}

const PROVIDER_OPTIONS = [
  'RadiAnt Dicom Viewer',
  'VCLOUDIA',
  'Idrive',
  'Cyfuture',
  'Godaddy',
  'BlueHost',
  'Amazon Web Services',
  'Microsoft',
  'Google Cloud',
  'GitHub',
  'Cloudflare',
  'Datadog',
  'Zoom',
  'Atlassian',
  'Salesforce',
  'Slack',
  'Docker',
  'Figma',
  'MongoDB Atlas',
  'OpenAI',
  'Twilio',
  'Stripe',
  'Other'
];

const CATEGORY_OPTIONS = [
  'Cloud Infrastructure',
  'Database & Storage',
  'RadiAnt Dicom Viewer',
  'SaaS & Productivity',
  'DevOps & CI/CD',
  'Security & Compliance',
  'Monitoring & Observability',
  'Communication',
  'AI & Machine Learning',
  'Marketing & CRM',
  'Other'
];

const BILLING_CYCLES = ['Monthly', 'Annually', 'Quarterly', 'Usage-Based'];
const STATUS_OPTIONS = ['Active', 'Expiring Soon', 'In Trial', 'Cancelled', 'Expired', 'Under Review'];
const PAYMENT_METHODS = ['Credit Card', 'Corporate Invoice', 'Wire Transfer', 'Direct Debit', 'Prepaid Balance'];

export const CloudSubscriptionsModule: React.FC<{ sites: any[] }> = ({ sites }) => {
  const [subscriptions, setSubscriptions] = useState<CloudSubscription[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('All Sites');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [providerFilter, setProviderFilter] = useState('All Providers');
  const [billingFilter, setBillingFilter] = useState('All Cycles');
  const [quickFilter, setQuickFilter] = useState<'all' | 'active' | 'expiring' | 'seats'>('all');

  // Sorting & Pagination
  const [sortKey, setSortKey] = useState<keyof CloudSubscription>('renewal_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Selection & Modals
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmData, setDeleteConfirmData] = useState<{ type: 'single'; item: CloudSubscription } | { type: 'bulk'; count: number } | { type: 'all'; count: number } | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Field Settings for Cloud Providers & Categories
  const [providers, setProviders] = useState<CloudProviderSetting[]>([]);
  const [categories, setCategories] = useState<CloudCategorySetting[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'providers' | 'categories'>('providers');
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Settings editing state
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [providerForm, setProviderForm] = useState({ name: '', default_category: '', website: '', description: '' });

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', color: 'indigo' });

  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsSearch, setSettingsSearch] = useState('');
  const [settingsSubmitting, setSettingsSubmitting] = useState(false);
  const [confirmDeleteProviderId, setConfirmDeleteProviderId] = useState<string | null>(null);
  const [confirmDeleteCategoryId, setConfirmDeleteCategoryId] = useState<string | null>(null);
  const [confirmResetSettings, setConfirmResetSettings] = useState(false);

  // Import & Restore Subscriptions State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');
  const [importFileName, setImportFileName] = useState('');
  const [importPasteText, setImportPasteText] = useState('');
  const [importReplaceExisting, setImportReplaceExisting] = useState(false);
  const [importParsedData, setImportParsedData] = useState<any[]>([]);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [importSubmitting, setImportSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    name: '',
    provider: 'Amazon Web Services',
    category: 'Cloud Infrastructure',
    plan_tier: '',
    billing_cycle: 'Monthly' as const,
    cost: '',
    currency: 'USD',
    seats_total: 0,
    seats_used: 0,
    status: 'Active' as const,
    renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    auto_renew: true,
    site_name: 'All Sites',
    owner_team: 'IT Operations',
    account_id: '',
    payment_method: 'Credit Card',
    portal_url: '',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Fetch Subscriptions
  const fetchSubscriptions = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/cloud-subscriptions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch Summary Metrics
  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const siteParam = siteFilter !== 'All Sites' ? `?site=${encodeURIComponent(siteFilter)}` : '';
      const res = await fetch(`/api/cloud-subscriptions/summary${siteParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  // Fetch Field Settings (Providers & Categories)
  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/cloud-subscriptions/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.providers) && data.providers.length > 0) {
          setProviders(data.providers);
        } else {
          setProviders(PROVIDER_OPTIONS.map((p, i) => ({ id: `p-${i}`, name: p, default_category: '', website: '', description: '', is_default: 1 })));
        }
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        } else {
          setCategories(CATEGORY_OPTIONS.map((c, i) => ({ id: `c-${i}`, name: c, description: '', color: 'indigo', is_default: 1 })));
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchSummary();
    fetchSettings();
  }, [siteFilter]);

  // Dynamic Options for Selects & Filters
  const availableProviders = useMemo(() => {
    const list = providers.map(p => p.name).filter(Boolean);
    if (list.length === 0) return PROVIDER_OPTIONS;
    subscriptions.forEach(s => {
      if (s.provider && !list.includes(s.provider)) {
        list.push(s.provider);
      }
    });
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [providers, subscriptions]);

  const availableCategories = useMemo(() => {
    const list = categories.map(c => c.name).filter(Boolean);
    if (list.length === 0) return CATEGORY_OPTIONS;
    subscriptions.forEach(s => {
      if (s.category && !list.includes(s.category)) {
        list.push(s.category);
      }
    });
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [categories, subscriptions]);

  const handleProviderChange = (val: string) => {
    if (val === '__ADD_NEW__') {
      setShowSettingsModal(true);
      setSettingsTab('providers');
      setEditingProviderId(null);
      setProviderForm({ name: '', default_category: '', website: '', description: '' });
      return;
    }
    const matched = providers.find(p => p.name.toLowerCase() === val.toLowerCase());
    setFormData(prev => ({
      ...prev,
      provider: val,
      category: (matched && matched.default_category) ? matched.default_category : prev.category
    }));
  };

  const handleCategoryChange = (val: string) => {
    if (val === '__ADD_NEW__') {
      setShowSettingsModal(true);
      setSettingsTab('categories');
      setEditingCategoryId(null);
      setCategoryForm({ name: '', description: '', color: 'indigo' });
      return;
    }
    setFormData(prev => ({ ...prev, category: val }));
  };

  // Open Create Modal
  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      ...initialFormState,
      site_name: siteFilter !== 'All Sites' ? siteFilter : 'All Sites'
    });
    setFormError('');
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: CloudSubscription) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || '',
      provider: item.provider || 'Amazon Web Services',
      category: item.category || 'Cloud Infrastructure',
      plan_tier: item.plan_tier || '',
      billing_cycle: item.billing_cycle || 'Monthly',
      cost: item.cost !== undefined ? String(item.cost) : '',
      currency: item.currency || 'USD',
      seats_total: item.seats_total || 0,
      seats_used: item.seats_used || 0,
      status: item.status || 'Active',
      renewal_date: item.renewal_date ? item.renewal_date.slice(0, 10) : '',
      auto_renew: item.auto_renew !== 0 && item.auto_renew !== false,
      site_name: item.site_name || 'All Sites',
      owner_team: item.owner_team || 'IT Operations',
      account_id: item.account_id || '',
      payment_method: item.payment_method || 'Credit Card',
      portal_url: item.portal_url || '',
      notes: item.notes || ''
    });
    setFormError('');
    setShowModal(true);
  };

  // Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Subscription name is required');
      return;
    }
    if (!formData.provider.trim()) {
      setFormError('Provider name is required');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token');
      const url = editingId ? `/api/cloud-subscriptions/${editingId}` : '/api/cloud-subscriptions';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          cost: parseFloat(formData.cost) || 0,
          seats_total: parseInt(String(formData.seats_total), 10) || 0,
          seats_used: parseInt(String(formData.seats_used), 10) || 0,
          auto_renew: formData.auto_renew ? 1 : 0
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save subscription');
      }

      setShowModal(false);
      fetchSubscriptions();
      fetchSummary();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Handlers
  const handleDeleteSingle = (item: CloudSubscription) => {
    setDeleteConfirmData({ type: 'single', item });
  };

  const handleDeleteBulk = () => {
    if (selectedIds.length === 0) return;
    setDeleteConfirmData({ type: 'bulk', count: selectedIds.length });
  };

  const handleDeleteAll = () => {
    if (subscriptions.length === 0) return;
    setDeleteConfirmData({ type: 'all', count: subscriptions.length });
  };

  const handleRestoreSampleData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/cloud-subscriptions/restore', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedIds([]);
        await fetchSubscriptions();
        await fetchSummary();
      }
    } catch (err) {
      console.error('Failed to restore subscriptions:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Helper to normalize imported subscription item
  const normalizeImportedItem = (raw: any): any => {
    if (!raw || typeof raw !== 'object') return null;
    const getVal = (...keys: string[]) => {
      for (const k of keys) {
        for (const prop of Object.keys(raw)) {
          if (prop.trim().toLowerCase() === k.toLowerCase()) {
            return raw[prop];
          }
        }
      }
      return '';
    };

    const name = getVal('name', 'service', 'subscription', 'subscription name', 'title', 'app', 'application');
    if (!name || String(name).trim() === '') return null;

    const costRaw = getVal('cost', 'price', 'amount', 'monthly cost', 'annual cost', 'spend');
    const cost = typeof costRaw === 'number' ? costRaw : parseFloat(String(costRaw).replace(/[^0-9.-]/g, '')) || 0;

    const seatsTotalRaw = getVal('seats_total', 'seats total', 'total seats', 'seats', 'licenses', 'total licenses');
    const seatsUsedRaw = getVal('seats_used', 'seats used', 'used seats', 'assigned', 'active licenses');

    const renewalDateRaw = getVal('renewal_date', 'renewal date', 'renewal', 'expiry', 'next renewal', 'expires', 'date');
    let renewal_date = '';
    if (renewalDateRaw) {
      if (renewalDateRaw instanceof Date) {
        renewal_date = renewalDateRaw.toISOString().split('T')[0];
      } else if (typeof renewalDateRaw === 'number') {
        const date = new Date(Math.round((renewalDateRaw - 25569) * 86400 * 1000));
        if (!isNaN(date.getTime())) renewal_date = date.toISOString().split('T')[0];
      } else {
        const s = String(renewalDateRaw).trim();
        const d = new Date(s);
        if (!isNaN(d.getTime())) renewal_date = d.toISOString().split('T')[0];
        else renewal_date = s;
      }
    }

    const autoRenewRaw = getVal('auto_renew', 'auto renew', 'auto-renew', 'auto renewal');
    let auto_renew = 1;
    if (autoRenewRaw !== '') {
      const s = String(autoRenewRaw).toLowerCase().trim();
      if (s === 'false' || s === '0' || s === 'no' || autoRenewRaw === false || autoRenewRaw === 0) {
        auto_renew = 0;
      }
    }

    return {
      id: raw.id || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: String(name).trim(),
      provider: String(getVal('provider', 'vendor') || 'Other').trim(),
      category: String(getVal('category') || 'Cloud Infrastructure').trim(),
      plan_tier: String(getVal('plan_tier', 'plan', 'plan tier', 'tier') || '').trim(),
      billing_cycle: String(getVal('billing_cycle', 'billing cycle', 'billing', 'cycle') || 'Monthly').trim(),
      cost,
      currency: String(getVal('currency') || 'USD').trim(),
      seats_total: parseInt(String(seatsTotalRaw)) || 0,
      seats_used: parseInt(String(seatsUsedRaw)) || 0,
      status: String(getVal('status') || 'Active').trim(),
      renewal_date,
      auto_renew,
      site_name: String(getVal('site_name', 'site', 'location', 'hospital') || 'All Sites').trim(),
      owner_team: String(getVal('owner_team', 'team', 'owner', 'department') || 'IT Operations').trim(),
      account_id: String(getVal('account_id', 'account', 'account id') || '').trim(),
      payment_method: String(getVal('payment_method', 'payment', 'payment method') || 'Credit Card').trim(),
      portal_url: String(getVal('portal_url', 'portal', 'url', 'website') || '').trim(),
      notes: String(getVal('notes', 'description', 'remarks') || '').trim()
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportSuccess('');
    setImportFileName(file.name);

    const reader = new FileReader();
    const isJson = file.name.endsWith('.json');

    if (isJson) {
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          const list = Array.isArray(parsed) ? parsed : (parsed.subscriptions || [parsed]);
          const normalized = list.map(normalizeImportedItem).filter(Boolean);
          if (normalized.length === 0) {
            setImportError('No valid subscriptions found in JSON file.');
          } else {
            setImportParsedData(normalized);
          }
        } catch (err: any) {
          setImportError('Failed to parse JSON file: ' + err.message);
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = xlsx.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = xlsx.utils.sheet_to_json(worksheet);
          const normalized = rawRows.map(normalizeImportedItem).filter(Boolean);
          if (normalized.length === 0) {
            setImportError('No valid subscriptions rows found in file. Ensure headers include Name, Provider, Category, etc.');
          } else {
            setImportParsedData(normalized);
          }
        } catch (err: any) {
          setImportError('Failed to parse spreadsheet: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleParsePastedText = () => {
    if (!importPasteText.trim()) {
      setImportError('Please paste some subscription data first.');
      return;
    }
    setImportError('');
    setImportSuccess('');

    try {
      const trimmed = importPasteText.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        const list = Array.isArray(parsed) ? parsed : (parsed.subscriptions || [parsed]);
        const normalized = list.map(normalizeImportedItem).filter(Boolean);
        if (normalized.length === 0) {
          setImportError('No valid subscriptions found in pasted JSON.');
          return;
        }
        setImportParsedData(normalized);
        return;
      }

      // Delimited text (TSV or CSV)
      const lines = trimmed.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length === 0) {
        setImportError('No text lines found.');
        return;
      }

      const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(',') ? ',' : '\t';
      const headerTokens = lines[0].split(delimiter).map(t => t.trim().replace(/^["']|["']$/g, ''));
      
      const isHeader = headerTokens.some(t => /name|service|provider|vendor|category|cost|tier|billing/i.test(t));
      const startIndex = isHeader ? 1 : 0;
      const headers = isHeader ? headerTokens : ['name', 'provider', 'category', 'plan_tier', 'billing_cycle', 'cost', 'renewal_date', 'site_name', 'owner_team'];

      const parsedRows: any[] = [];
      for (let i = startIndex; i < lines.length; i++) {
        const tokens = lines[i].split(delimiter).map(t => t.trim().replace(/^["']|["']$/g, ''));
        if (tokens.length === 0 || !tokens[0]) continue;
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          if (tokens[idx] !== undefined) rowObj[h] = tokens[idx];
        });
        const normalized = normalizeImportedItem(rowObj);
        if (normalized) parsedRows.push(normalized);
      }

      if (parsedRows.length === 0) {
        setImportError('Could not parse any subscriptions from pasted text. Format as Name, Provider, Category, Cost, Renewal Date...');
      } else {
        setImportParsedData(parsedRows);
      }
    } catch (err: any) {
      setImportError('Parsing error: ' + err.message);
    }
  };

  const handleExecuteImport = async () => {
    if (importParsedData.length === 0) {
      setImportError('No parsed subscriptions to import. Upload a file or paste data first.');
      return;
    }

    try {
      setImportSubmitting(true);
      setImportError('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/cloud-subscriptions/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscriptions: importParsedData,
          replaceExisting: importReplaceExisting
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import subscriptions');
      }

      setImportSuccess(`Successfully restored & saved ${data.count || importParsedData.length} subscriptions!`);
      await fetchSubscriptions();
      await fetchSummary();
      setTimeout(() => {
        setShowImportModal(false);
        setImportParsedData([]);
        setImportPasteText('');
        setImportFileName('');
        setImportSuccess('');
      }, 1500);
    } catch (err: any) {
      setImportError(err.message || 'Import failed');
    } finally {
      setImportSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmData) return;
    const token = localStorage.getItem('token');

    try {
      if (deleteConfirmData.type === 'single') {
        if (!deleteConfirmData.item?.id) return;
        const res = await fetch(`/api/cloud-subscriptions/${encodeURIComponent(deleteConfirmData.item.id)}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setSelectedIds(prev => prev.filter(id => id !== deleteConfirmData.item.id));
        }
      } else if (deleteConfirmData.type === 'bulk') {
        if (!selectedIds.length) return;
        const res = await fetch('/api/cloud-subscriptions/bulk-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ ids: selectedIds })
        });
        if (res.ok) {
          setSelectedIds([]);
        }
      } else if (deleteConfirmData.type === 'all') {
        const res = await fetch('/api/cloud-subscriptions', {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ confirmAll: 'CONFIRM_DELETE_ALL' })
        });
        if (res.ok) {
          setSelectedIds([]);
        }
      }
      setDeleteConfirmData(null);
      await fetchSubscriptions();
      await fetchSummary();
    } catch (err) {
      console.error('Failed to delete subscription(s)', err);
    }
  };

  // Select / Deselect All
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredSubscriptions.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Provider Settings Handlers
  const handleStartEditProvider = (p: CloudProviderSetting) => {
    setEditingProviderId(p.id);
    setConfirmDeleteProviderId(null);
    setProviderForm({
      name: p.name || '',
      default_category: p.default_category || '',
      website: p.website || '',
      description: p.description || ''
    });
    setSettingsError('');
    setSettingsSuccess('');
  };

  const handleCancelEditProvider = () => {
    setEditingProviderId(null);
    setProviderForm({ name: '', default_category: '', website: '', description: '' });
    setSettingsError('');
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerForm.name.trim()) {
      setSettingsError('Provider name cannot be empty');
      return;
    }
    setSettingsSubmitting(true);
    setSettingsError('');
    setSettingsSuccess('');
    const token = localStorage.getItem('token');

    try {
      const url = editingProviderId
        ? `/api/cloud-subscriptions/settings/providers/${editingProviderId}`
        : '/api/cloud-subscriptions/settings/providers';
      const method = editingProviderId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(providerForm)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save provider');
      }

      setSettingsSuccess(editingProviderId ? 'Provider updated successfully' : 'Provider added successfully');
      handleCancelEditProvider();
      await fetchSettings();
      await fetchSubscriptions();
    } catch (err: any) {
      setSettingsError(err.message || 'Error saving provider');
    } finally {
      setSettingsSubmitting(false);
    }
  };

  const handleDeleteProvider = async (id: string, name: string) => {
    setSettingsSubmitting(true);
    setSettingsError('');
    setSettingsSuccess('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/cloud-subscriptions/settings/providers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete provider');
      }
      setConfirmDeleteProviderId(null);
      setSettingsSuccess(`Provider "${name}" deleted successfully`);
      await fetchSettings();
      await fetchSubscriptions();
    } catch (err: any) {
      setSettingsError(err.message || 'Error deleting provider');
    } finally {
      setSettingsSubmitting(false);
    }
  };

  // Category Settings Handlers
  const handleStartEditCategory = (c: CloudCategorySetting) => {
    setEditingCategoryId(c.id);
    setConfirmDeleteCategoryId(null);
    setCategoryForm({
      name: c.name || '',
      description: c.description || '',
      color: c.color || 'indigo'
    });
    setSettingsError('');
    setSettingsSuccess('');
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setCategoryForm({ name: '', description: '', color: 'indigo' });
    setSettingsError('');
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      setSettingsError('Category name cannot be empty');
      return;
    }
    setSettingsSubmitting(true);
    setSettingsError('');
    setSettingsSuccess('');
    const token = localStorage.getItem('token');

    try {
      const url = editingCategoryId
        ? `/api/cloud-subscriptions/settings/categories/${editingCategoryId}`
        : '/api/cloud-subscriptions/settings/categories';
      const method = editingCategoryId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryForm)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save category');
      }

      setSettingsSuccess(editingCategoryId ? 'Category updated successfully' : 'Category added successfully');
      handleCancelEditCategory();
      await fetchSettings();
      await fetchSubscriptions();
    } catch (err: any) {
      setSettingsError(err.message || 'Error saving category');
    } finally {
      setSettingsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    setSettingsSubmitting(true);
    setSettingsError('');
    setSettingsSuccess('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/cloud-subscriptions/settings/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete category');
      }
      setConfirmDeleteCategoryId(null);
      setSettingsSuccess(`Category "${name}" deleted successfully`);
      await fetchSettings();
      await fetchSubscriptions();
    } catch (err: any) {
      setSettingsError(err.message || 'Error deleting category');
    } finally {
      setSettingsSubmitting(false);
    }
  };

  const handleResetSettings = async () => {
    setSettingsSubmitting(true);
    setSettingsError('');
    setSettingsSuccess('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/cloud-subscriptions/settings/reset', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to reset settings');
      setConfirmResetSettings(false);
      setSettingsSuccess('Settings reset to standard defaults');
      await fetchSettings();
      await fetchSubscriptions();
    } catch (err: any) {
      setSettingsError(err.message || 'Error resetting settings');
    } finally {
      setSettingsSubmitting(false);
    }
  };

  const getCategoryColorClasses = (color?: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'emerald': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rose': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'amber': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'purple': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'cyan': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'teal': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'orange': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'slate': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const exportData = filteredSubscriptions.map(s => ({
      'Subscription Name': s.name,
      'Provider': s.provider,
      'Category': s.category,
      'Plan / Tier': s.plan_tier || '-',
      'Billing Cycle': s.billing_cycle,
      'Cost': `${s.currency} ${Number(s.cost).toFixed(2)}`,
      'Total Seats': s.seats_total || 0,
      'Used Seats': s.seats_used || 0,
      'Status': s.status,
      'Renewal Date': s.renewal_date ? s.renewal_date.slice(0, 10) : 'N/A',
      'Auto Renew': (s.auto_renew !== 0 && s.auto_renew !== false) ? 'Yes' : 'No',
      'Site': s.site_name,
      'Owner Team': s.owner_team,
      'Account / Tenant ID': s.account_id || '-',
      'Payment Method': s.payment_method || '-',
      'Portal URL': s.portal_url || '-',
      'Notes': s.notes || ''
    }));

    const ws = xlsx.utils.json_to_sheet(exportData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Cloud Subscriptions');
    const today = new Date().toISOString().slice(0, 10);
    xlsx.writeFile(wb, `Cloud_Subscriptions_${today}.xlsx`);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const exportData = filteredSubscriptions.map(s => ({
      'Subscription Name': s.name,
      'Provider': s.provider,
      'Category': s.category,
      'Plan Tier': s.plan_tier || '',
      'Billing Cycle': s.billing_cycle,
      'Cost': Number(s.cost).toFixed(2),
      'Currency': s.currency,
      'Total Seats': s.seats_total,
      'Used Seats': s.seats_used,
      'Status': s.status,
      'Renewal Date': s.renewal_date ? s.renewal_date.slice(0, 10) : '',
      'Auto Renew': (s.auto_renew !== 0 && s.auto_renew !== false) ? 'Yes' : 'No',
      'Site': s.site_name,
      'Owner Team': s.owner_team,
      'Account ID': s.account_id || '',
      'Payment Method': s.payment_method || ''
    }));

    const ws = xlsx.utils.json_to_sheet(exportData);
    const csv = xlsx.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Cloud_Subscriptions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate Renewal Days Remaining
  const getRenewalInfo = (renewalDateStr?: string) => {
    if (!renewalDateStr) return { text: 'No date', status: 'normal', days: null };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rDate = new Date(renewalDateStr);
    rDate.setHours(0, 0, 0, 0);
    const diffTime = rDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Expired ${Math.abs(diffDays)}d ago`, status: 'expired', days: diffDays };
    }
    if (diffDays === 0) {
      return { text: 'Renews Today!', status: 'urgent', days: 0 };
    }
    if (diffDays <= 14) {
      return { text: `Renews in ${diffDays}d`, status: 'urgent', days: diffDays };
    }
    if (diffDays <= 30) {
      return { text: `Renews in ${diffDays}d`, status: 'warning', days: diffDays };
    }
    return { text: `Renews in ${diffDays}d`, status: 'normal', days: diffDays };
  };

  // Provider Styling Helper
  const getProviderBadge = (provider: string) => {
    const p = provider.toLowerCase();
    if (p.includes('amazon') || p.includes('aws')) {
      return { bg: 'bg-amber-500/10 text-amber-700 border-amber-200/60', icon: '☁️', label: 'AWS' };
    }
    if (p.includes('microsoft') || p.includes('azure')) {
      return { bg: 'bg-blue-500/10 text-blue-700 border-blue-200/60', icon: '🏢', label: 'Microsoft' };
    }
    if (p.includes('google') || p.includes('gcp')) {
      return { bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200/60', icon: '🌐', label: 'Google Cloud' };
    }
    if (p.includes('github')) {
      return { bg: 'bg-purple-500/10 text-purple-700 border-purple-200/60', icon: '🐙', label: 'GitHub' };
    }
    if (p.includes('cloudflare')) {
      return { bg: 'bg-orange-500/10 text-orange-700 border-orange-200/60', icon: '🛡️', label: 'Cloudflare' };
    }
    if (p.includes('datadog')) {
      return { bg: 'bg-violet-500/10 text-violet-700 border-violet-200/60', icon: '🐶', label: 'Datadog' };
    }
    if (p.includes('zoom')) {
      return { bg: 'bg-sky-500/10 text-sky-700 border-sky-200/60', icon: '📹', label: 'Zoom' };
    }
    if (p.includes('atlassian') || p.includes('jira')) {
      return { bg: 'bg-indigo-500/10 text-indigo-700 border-indigo-200/60', icon: '🔷', label: 'Atlassian' };
    }
    return { bg: 'bg-slate-500/10 text-slate-700 border-slate-200', icon: '☁️', label: provider };
  };

  // Filter Subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(item => {
      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(term);
        const matchesProvider = item.provider.toLowerCase().includes(term);
        const matchesCategory = item.category.toLowerCase().includes(term);
        const matchesAccount = (item.account_id || '').toLowerCase().includes(term);
        const matchesTeam = (item.owner_team || '').toLowerCase().includes(term);
        if (!matchesName && !matchesProvider && !matchesCategory && !matchesAccount && !matchesTeam) {
          return false;
        }
      }

      // Site
      if (siteFilter !== 'All Sites') {
        if (item.site_name !== siteFilter && item.site_name !== 'All Sites') {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'All Statuses' && item.status !== statusFilter) {
        return false;
      }

      // Category
      if (categoryFilter !== 'All Categories' && item.category !== categoryFilter) {
        return false;
      }

      // Provider
      if (providerFilter !== 'All Providers' && item.provider !== providerFilter) {
        return false;
      }

      // Billing Cycle
      if (billingFilter !== 'All Cycles' && item.billing_cycle !== billingFilter) {
        return false;
      }

      // Quick Filter
      if (quickFilter === 'active' && item.status !== 'Active') return false;
      if (quickFilter === 'expiring') {
        const info = getRenewalInfo(item.renewal_date);
        if (info.days === null || info.days > 30) return false;
      }
      if (quickFilter === 'seats' && (item.seats_total || 0) <= 0) return false;

      return true;
    }).sort((a, b) => {
      let valA: any = a[sortKey];
      let valB: any = b[sortKey];

      if (sortKey === 'cost') {
        valA = parseFloat(String(valA)) || 0;
        valB = parseFloat(String(valB)) || 0;
      } else if (sortKey === 'seats_total' || sortKey === 'seats_used') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [subscriptions, searchTerm, siteFilter, statusFilter, categoryFilter, providerFilter, billingFilter, quickFilter, sortKey, sortDirection]);

  // Paginated Data
  const totalPages = Math.max(1, Math.ceil(filteredSubscriptions.length / itemsPerPage));
  const paginatedSubscriptions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSubscriptions.slice(start, start + itemsPerPage);
  }, [filteredSubscriptions, currentPage, itemsPerPage]);

  const handleSort = (key: keyof CloudSubscription) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shadow-sm">
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Khema Global Cloud & HIS Subscription</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Centralized database management for cloud infrastructure, Hospital Information System (HIS) licenses, SaaS subscriptions, billing cycles, and automated renewal monitoring.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchSubscriptions}
            disabled={refreshing}
            className="gap-2 bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </Button>

          <div className="relative group">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm"
            >
              <Download size={14} /> Export <ChevronDown size={12} />
            </Button>
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 hidden group-hover:block animate-in fade-in slide-in-from-top-1">
              <button
                type="button"
                onClick={handleExportExcel}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
              >
                <FileSpreadsheet size={14} className="text-emerald-600" /> Export to Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
              >
                <Download size={14} className="text-blue-600" /> Export to CSV
              </button>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setShowSettingsModal(true); setSettingsTab('providers'); }}
            className="gap-2 bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-indigo-600 shadow-sm font-medium"
            title="Configure Cloud Provider / Vendor and Category field options"
          >
            <Settings size={14} className="text-indigo-600" />
            Field Settings
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setShowImportModal(true);
              setImportError('');
              setImportSuccess('');
              setImportParsedData([]);
              setImportFileName('');
            }}
            className="gap-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-sm font-medium"
            title="Import or restore subscriptions from Excel (.xlsx), CSV, JSON, or paste"
          >
            <Upload size={14} className="text-emerald-600" />
            Import / Restore Data
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRestoreSampleData}
            disabled={refreshing}
            className="gap-2 bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm font-medium"
            title="Load sample catalog if needed"
          >
            <RotateCcw size={14} className={`text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            Sample Data
          </Button>

          <Button
            onClick={handleOpenAddModal}
            size="sm"
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 font-medium"
          >
            <Plus size={16} /> Add Subscription
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Subscriptions */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Services</p>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Cloud size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{summary?.activeCount ?? subscriptions.filter(s => s.status === 'Active').length}</span>
            <span className="text-xs text-slate-400 font-medium">of {subscriptions.length} total</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle2 size={13} /> Cloud Assets In Service
          </div>
        </div>

        {/* Monthly Cloud Spend */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Spend</p>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">
              ${(summary?.totalMonthlySpend ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-slate-400 font-medium"> / mo</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            Normalized across billing cycles
          </p>
        </div>

        {/* Annual Run Rate */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Annual Run Rate</p>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Calendar size={16} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">
              ${(summary?.annualRunRate ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-slate-400 font-medium"> / yr</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            Projected 12-month cloud budget
          </p>
        </div>

        {/* Renewal Alerts */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiring in 30d</p>
            <div className={`p-2 rounded-lg ${(summary?.expiring30Days || 0) > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${(summary?.expiring30Days || 0) > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {summary?.expiring30Days ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">services</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
            {(summary?.expiring30Days || 0) > 0 ? (
              <>
                <AlertTriangle size={13} /> Requires Review & PO
              </>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={13} /> Renewals up to date
              </span>
            )}
          </div>
        </div>

        {/* Seat / License Utilization */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">User Licenses</p>
            <div className="p-2 rounded-lg bg-violet-50 text-violet-600">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">
              {summary?.seatUtilization ?? 0}%
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({summary?.usedSeats ?? 0}/{summary?.totalSeats ?? 0})
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div 
              className="bg-violet-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, summary?.seatUtilization ?? 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Filter Tabs & Search Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
        {/* Quick Filter Pill Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setQuickFilter('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                quickFilter === 'all'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Subscriptions ({subscriptions.length})
            </button>
            <button
              type="button"
              onClick={() => { setQuickFilter('active'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                quickFilter === 'active'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({subscriptions.filter(s => s.status === 'Active').length})
            </button>
            <button
              type="button"
              onClick={() => { setQuickFilter('expiring'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                quickFilter === 'expiring'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expiring Soon ({subscriptions.filter(s => {
                const info = getRenewalInfo(s.renewal_date);
                return info.days !== null && info.days <= 30;
              }).length})
            </button>
            <button
              type="button"
              onClick={() => { setQuickFilter('seats'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                quickFilter === 'seats'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Seat Licenses ({subscriptions.filter(s => (s.seats_total || 0) > 0).length})
            </button>
          </div>

          {/* Active selection banner */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-800 px-3 py-1.5 rounded-xl text-xs font-medium animate-in fade-in">
              <span>{selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected</span>
              <button
                type="button"
                onClick={handleDeleteBulk}
                className="text-rose-600 hover:text-rose-800 font-semibold ml-2 flex items-center gap-1 hover:underline"
              >
                <Trash2 size={13} /> Delete Selected
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-slate-400 hover:text-slate-600 ml-1"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search subscription, provider, ID, team..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Provider Filter */}
          <div>
            <select
              value={providerFilter}
              onChange={e => { setProviderFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-700"
            >
              <option>All Providers</option>
              {availableProviders.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-700"
            >
              <option>All Categories</option>
              {availableCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Site Filter */}
          <div>
            <select
              value={siteFilter}
              onChange={e => { setSiteFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-700"
            >
              <option>All Sites</option>
              {sites.map(s => (
                <option key={s.id} value={s.site_name}>{s.site_name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-700"
            >
              <option>All Statuses</option>
              {STATUS_OPTIONS.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Billing Cycle Filter */}
          <div>
            <select
              value={billingFilter}
              onChange={e => { setBillingFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-700"
            >
              <option>All Cycles</option>
              {BILLING_CYCLES.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Notice if any records are hidden */}
      {filteredSubscriptions.length < subscriptions.length && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50/90 border border-amber-200/90 px-4 py-2.5 text-xs text-amber-900 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>
              Active Filter: Showing <strong>{filteredSubscriptions.length}</strong> of <strong>{subscriptions.length}</strong> cloud subscriptions (Some records are hidden by active search/filters).
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setProviderFilter('All Providers');
              setCategoryFilter('All Categories');
              setSiteFilter('All Sites');
              setStatusFilter('All Statuses');
              setBillingFilter('All Cycles');
              setQuickFilter('all');
              setCurrentPage(1);
            }}
            className="font-semibold text-indigo-700 hover:text-indigo-900 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
          >
            Clear all filters (Show all {subscriptions.length} records)
          </button>
        </div>
      )}

      {/* Subscriptions Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredSubscriptions.length > 0 && selectedIds.length === filteredSubscriptions.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th 
                  onClick={() => handleSort('name')} 
                  className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Subscription / Service</span>
                    <ArrowUpDown size={12} className={sortKey === 'name' ? 'text-indigo-600' : 'text-slate-400'} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('category')} 
                  className="py-3 px-3 cursor-pointer hover:text-indigo-600 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Category</span>
                    <ArrowUpDown size={12} className={sortKey === 'category' ? 'text-indigo-600' : 'text-slate-400'} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('cost')} 
                  className="py-3 px-3 cursor-pointer hover:text-indigo-600 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Billing & Cost</span>
                    <ArrowUpDown size={12} className={sortKey === 'cost' ? 'text-indigo-600' : 'text-slate-400'} />
                  </div>
                </th>
                <th className="py-3 px-3">Seats / Licenses</th>
                <th 
                  onClick={() => handleSort('renewal_date')} 
                  className="py-3 px-3 cursor-pointer hover:text-indigo-600 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Renewal Date</span>
                    <ArrowUpDown size={12} className={sortKey === 'renewal_date' ? 'text-indigo-600' : 'text-slate-400'} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('status')} 
                  className="py-3 px-3 cursor-pointer hover:text-indigo-600 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown size={12} className={sortKey === 'status' ? 'text-indigo-600' : 'text-slate-400'} />
                  </div>
                </th>
                <th className="py-3 px-3">Scope / Owner</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-indigo-500" />
                      <span className="text-xs font-medium">Loading cloud subscriptions...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                        <Cloud size={24} />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {subscriptions.length === 0 ? 'No cloud subscriptions in database' : 'No matching subscriptions found'}
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {subscriptions.length === 0
                          ? 'No cloud subscriptions currently found. You can restore your data by uploading an Excel / CSV / JSON backup file, pasting rows, or adding entries manually.'
                          : searchTerm || siteFilter !== 'All Sites' || statusFilter !== 'All Statuses' || categoryFilter !== 'All Categories' || providerFilter !== 'All Providers'
                            ? 'Try clearing your filters or search keywords to view records.'
                            : 'Get started by creating your first cloud subscription entry.'}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                        <Button
                          size="sm"
                          onClick={() => {
                            setShowImportModal(true);
                            setImportError('');
                            setImportSuccess('');
                            setImportParsedData([]);
                            setImportFileName('');
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-medium shadow-sm"
                        >
                          <Upload size={14} /> Import / Restore Subscriptions
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleOpenAddModal}
                          className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 gap-1.5 text-xs font-medium"
                        >
                          <Plus size={14} /> Add Single Subscription
                        </Button>
                        {subscriptions.length === 0 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleRestoreSampleData}
                            className="bg-white hover:bg-slate-50 text-slate-600 border-slate-200 gap-1.5 text-xs font-medium"
                            title="Load sample catalog"
                          >
                            <RotateCcw size={13} className="text-slate-500" /> Sample Data
                          </Button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSubscriptions.map(item => {
                  const renewalInfo = getRenewalInfo(item.renewal_date);
                  const providerStyle = getProviderBadge(item.provider);
                  const isSelected = selectedIds.includes(item.id);
                  const seatUtil = item.seats_total > 0 ? Math.round((item.seats_used / item.seats_total) * 100) : 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-indigo-50/30 transition-colors ${isSelected ? 'bg-indigo-50/50' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Service / Subscription Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${providerStyle.bg} shrink-0`}>
                            {providerStyle.label}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800 truncate">{item.name}</span>
                              {item.portal_url && (
                                <a
                                  href={item.portal_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-400 hover:text-indigo-600 transition-colors inline-flex items-center"
                                  title="Open provider admin console"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              {item.plan_tier && <span>{item.plan_tier}</span>}
                              {item.account_id && (
                                <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[10px] text-slate-600">
                                  ID: {item.account_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                      </td>

                      {/* Billing & Cost */}
                      <td className="py-3 px-3">
                        <div>
                          <div className="font-bold text-slate-900">
                            ${Number(item.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            per {item.billing_cycle.toLowerCase()}
                          </div>
                        </div>
                      </td>

                      {/* Seats / Licenses */}
                      <td className="py-3 px-3">
                        {item.seats_total > 0 ? (
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-semibold text-slate-700">{item.seats_used}/{item.seats_total}</span>
                              <span className="text-slate-400 font-medium">{seatUtil}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  seatUtil > 90 ? 'bg-amber-500' : 'bg-indigo-600'
                                }`}
                                style={{ width: `${Math.min(100, seatUtil)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Flat / Usage</span>
                        )}
                      </td>

                      {/* Renewal Date */}
                      <td className="py-3 px-3">
                        {item.renewal_date ? (
                          <div>
                            <div className="font-medium text-slate-800">
                              {new Date(item.renewal_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                renewalInfo.status === 'urgent'
                                  ? 'bg-rose-100 text-rose-700 animate-pulse'
                                  : renewalInfo.status === 'warning'
                                  ? 'bg-amber-100 text-amber-700'
                                  : renewalInfo.status === 'expired'
                                  ? 'bg-red-100 text-red-700 font-bold'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {renewalInfo.text}
                              </span>
                              {(item.auto_renew !== 0 && item.auto_renew !== false) && (
                                <span className="text-[10px] text-emerald-600 font-semibold" title="Auto-renewal active">
                                  [Auto]
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No expiry</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : item.status === 'Expiring Soon'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : item.status === 'In Trial'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200/60'
                            : item.status === 'Expired'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'Active' ? 'bg-emerald-500' : item.status === 'Expiring Soon' ? 'bg-amber-500' : 'bg-slate-400'
                          }`} />
                          {item.status}
                        </span>
                      </td>

                      {/* Scope / Owner */}
                      <td className="py-3 px-3">
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <Building2 size={11} className="text-slate-400" />
                            {item.site_name}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {item.owner_team}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit subscription"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSingle(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete subscription"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Row Count Footer */}
        <div className="py-3 px-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing {filteredSubscriptions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredSubscriptions.length)} of {filteredSubscriptions.length} entries</span>
            <select
              value={itemsPerPage}
              onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-slate-200 rounded-lg px-2 py-1 bg-white text-xs text-slate-700 outline-none"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value={500}>All (No pagination)</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              if (totalPages > 5 && Math.abs(p - currentPage) > 2) return null;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                    currentPage === p
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Cloud size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {editingId ? 'Edit Cloud Subscription' : 'Add New Cloud Subscription'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingId ? 'Update subscription attributes, cost, or renewal details' : 'Register a new cloud provider, SaaS tool, or infrastructure service'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subscription Name */}
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Subscription / Service Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Production Cloud, Microsoft 365 E5"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Provider */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">
                      Cloud Provider / Vendor <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setShowSettingsModal(true); setSettingsTab('providers'); }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline"
                      title="Manage cloud vendors and default categories"
                    >
                      <Settings size={12} /> Manage Options
                    </button>
                  </div>
                  <select
                    value={formData.provider}
                    onChange={e => handleProviderChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    {availableProviders.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="__ADD_NEW__" className="text-indigo-600 font-semibold">
                      + Add Custom Provider / Vendor...
                    </option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setShowSettingsModal(true); setSettingsTab('categories'); }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline"
                      title="Manage subscription categories and colors"
                    >
                      <Settings size={12} /> Manage Options
                    </button>
                  </div>
                  <select
                    value={formData.category}
                    onChange={e => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    {availableCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__ADD_NEW__" className="text-indigo-600 font-semibold">
                      + Add Custom Category...
                    </option>
                  </select>
                </div>

                {/* Plan / Tier */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Plan / Service Tier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Enterprise E5, Business Plus"
                    value={formData.plan_tier}
                    onChange={e => setFormData({ ...formData, plan_tier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Billing Cycle */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={formData.billing_cycle}
                    onChange={e => setFormData({ ...formData, billing_cycle: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {BILLING_CYCLES.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Cost */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cost per Cycle ($ USD) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formData.cost}
                      onChange={e => setFormData({ ...formData, cost: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Subscription Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Seats Total */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Total Seats / Licenses (0 if Flat)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.seats_total}
                    onChange={e => setFormData({ ...formData, seats_total: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Seats Used */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned / Active Seats
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.seats_used}
                    onChange={e => setFormData({ ...formData, seats_used: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Renewal Date */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Next Renewal / Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.renewal_date}
                    onChange={e => setFormData({ ...formData, renewal_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Auto Renew Toggle */}
                <div className="flex items-center gap-3 pt-4">
                  <input
                    type="checkbox"
                    id="auto_renew_check"
                    checked={formData.auto_renew}
                    onChange={e => setFormData({ ...formData, auto_renew: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="auto_renew_check" className="font-semibold text-slate-700 cursor-pointer select-none">
                    Automatic Renewal Enabled
                  </label>
                </div>

                {/* Site Location */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Associated Site
                  </label>
                  <select
                    value={formData.site_name}
                    onChange={e => setFormData({ ...formData, site_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="All Sites">All Sites</option>
                    {sites.map(s => (
                      <option key={s.id} value={s.site_name}>{s.site_name}</option>
                    ))}
                  </select>
                </div>

                {/* Responsible Team */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Responsible Team / Owner
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IT Operations, DevOps, Engineering"
                    value={formData.owner_team}
                    onChange={e => setFormData({ ...formData, owner_team: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Account / Tenant ID */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Account / Tenant / Sub ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AWS-1234-5678, MS-TENANT-01"
                    value={formData.account_id}
                    onChange={e => setFormData({ ...formData, account_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Admin Portal URL */}
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Admin Portal Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://console.aws.amazon.com or https://admin.microsoft.com"
                    value={formData.portal_url}
                    onChange={e => setFormData({ ...formData, portal_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contract Notes & Specifications
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about licensing rules, contract terms, billing contacts, or SLA commitments..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={formSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  {formSubmitting ? (
                    <RefreshCw size={14} className="animate-spin mr-1" />
                  ) : null}
                  {editingId ? 'Save Changes' : 'Create Subscription'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6 text-center">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {deleteConfirmData.type === 'single'
                ? 'Delete Subscription?'
                : deleteConfirmData.type === 'all'
                  ? `Delete All ${deleteConfirmData.count} Subscriptions?`
                  : `Delete ${deleteConfirmData.count} Subscriptions?`}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {deleteConfirmData.type === 'single'
                ? `Are you sure you want to delete "${deleteConfirmData.item.name}"? This action permanently removes it from the IT database.`
                : deleteConfirmData.type === 'all'
                  ? `Are you sure you want to permanently delete ALL ${deleteConfirmData.count} cloud subscriptions from the database? This action will completely empty the table and will NOT revert.`
                  : `Are you sure you want to permanently delete the selected ${deleteConfirmData.count} subscriptions from the IT database?`}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteConfirmData(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FIELD SETTINGS MODAL (PROVIDERS & CATEGORIES) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Field Settings: Providers & Categories
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure and customize dropdown options for Cloud Provider / Vendor and Category * fields
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  handleCancelEditProvider();
                  handleCancelEditCategory();
                  setSettingsError('');
                  setSettingsSuccess('');
                  setConfirmDeleteProviderId(null);
                  setConfirmDeleteCategoryId(null);
                  setConfirmResetSettings(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-6 pt-2 gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { 
                  setSettingsTab('providers'); 
                  setSettingsError(''); 
                  setSettingsSuccess(''); 
                  setConfirmDeleteProviderId(null);
                  setConfirmDeleteCategoryId(null);
                  setConfirmResetSettings(false);
                }}
                className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
                  settingsTab === 'providers'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Globe size={15} />
                Cloud Providers / Vendors
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
                  {providers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { 
                  setSettingsTab('categories'); 
                  setSettingsError(''); 
                  setSettingsSuccess(''); 
                  setConfirmDeleteProviderId(null);
                  setConfirmDeleteCategoryId(null);
                  setConfirmResetSettings(false);
                }}
                className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
                  settingsTab === 'categories'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Tag size={15} />
                Category *
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
                  {categories.length}
                </span>
              </button>
            </div>

            {/* Banners for feedback */}
            {settingsError && (
              <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-500" />
                  <span>{settingsError}</span>
                </div>
                <button type="button" onClick={() => setSettingsError('')} className="text-rose-400 hover:text-rose-600">
                  <X size={13} />
                </button>
              </div>
            )}

            {settingsSuccess && (
              <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                  <span>{settingsSuccess}</span>
                </div>
                <button type="button" onClick={() => setSettingsSuccess('')} className="text-emerald-400 hover:text-emerald-600">
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* TAB 1: PROVIDERS / VENDORS */}
              {settingsTab === 'providers' && (
                <div className="space-y-5">
                  {/* Create / Edit Form Box */}
                  <form onSubmit={handleSaveProvider} className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Plus size={14} className="text-indigo-600" />
                        {editingProviderId ? 'Edit Cloud Provider / Vendor' : 'Add New Cloud Provider / Vendor'}
                      </h4>
                      {editingProviderId && (
                        <button
                          type="button"
                          onClick={handleCancelEditProvider}
                          className="text-xs text-slate-500 hover:text-slate-800 underline"
                        >
                          Cancel Editing
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Provider / Vendor Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Oracle Cloud, Vercel, Supabase"
                          value={providerForm.name}
                          onChange={e => setProviderForm({ ...providerForm, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Default Category
                        </label>
                        <select
                          value={providerForm.default_category}
                          onChange={e => setProviderForm({ ...providerForm, default_category: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="">-- None / Select Category --</option>
                          {availableCategories.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Website / Portal URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://console.provider.com"
                          value={providerForm.website}
                          onChange={e => setProviderForm({ ...providerForm, website: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Description / Scope
                        </label>
                        <input
                          type="text"
                          placeholder="Brief description of service"
                          value={providerForm.description}
                          onChange={e => setProviderForm({ ...providerForm, description: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2">
                      {editingProviderId && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleCancelEditProvider}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="submit"
                        size="sm"
                        disabled={settingsSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                      >
                        {editingProviderId ? 'Update Provider' : 'Save Provider'}
                      </Button>
                    </div>
                  </form>

                  {/* Configured Providers List */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Configured Providers ({providers.length})
                      </h4>
                      <div className="relative w-56">
                        <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Filter providers..."
                          value={settingsSearch}
                          onChange={e => setSettingsSearch(e.target.value)}
                          className="w-full pl-7 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                            <th className="py-2.5 px-3">Provider Name</th>
                            <th className="py-2.5 px-3">Default Category</th>
                            <th className="py-2.5 px-3">Portal URL</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {providers
                            .filter(p => !settingsSearch || p.name.toLowerCase().includes(settingsSearch.toLowerCase()) || (p.default_category || '').toLowerCase().includes(settingsSearch.toLowerCase()))
                            .map(p => (
                              <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                  {p.name}
                                </td>
                                <td className="py-2.5 px-3">
                                  {p.default_category ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                                      {p.default_category}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic">None</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                                  {p.website ? (
                                    <a
                                      href={p.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                                    >
                                      {p.website.replace(/^https?:\/\//, '')}
                                      <ExternalLink size={11} />
                                    </a>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${p.is_default ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                                    {p.is_default ? 'Default' : 'Custom'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  {confirmDeleteProviderId === p.id ? (
                                    <div className="flex items-center justify-end gap-1.5 animate-in fade-in duration-150">
                                      <span className="text-[11px] text-rose-600 font-medium whitespace-nowrap">Delete?</span>
                                      <button
                                        type="button"
                                        disabled={settingsSubmitting}
                                        onClick={() => handleDeleteProvider(p.id, p.name)}
                                        className="px-2 py-0.5 text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                                        title="Confirm deletion"
                                      >
                                        {settingsSubmitting ? <RefreshCw size={10} className="animate-spin" /> : null}
                                        Yes
                                      </button>
                                      <button
                                        type="button"
                                        disabled={settingsSubmitting}
                                        onClick={() => setConfirmDeleteProviderId(null)}
                                        className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleStartEditProvider(p);
                                          setConfirmDeleteProviderId(null);
                                        }}
                                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                        title="Edit provider"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setConfirmDeleteProviderId(p.id);
                                          setConfirmDeleteCategoryId(null);
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                        title="Delete provider"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CATEGORIES */}
              {settingsTab === 'categories' && (
                <div className="space-y-5">
                  {/* Create / Edit Category Box */}
                  <form onSubmit={handleSaveCategory} className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Plus size={14} className="text-indigo-600" />
                        {editingCategoryId ? 'Edit Category' : 'Add New Category'}
                      </h4>
                      {editingCategoryId && (
                        <button
                          type="button"
                          onClick={handleCancelEditCategory}
                          className="text-xs text-slate-500 hover:text-slate-800 underline"
                        >
                          Cancel Editing
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Category Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. AI & Machine Learning, Data Analytics"
                          value={categoryForm.name}
                          onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Color Theme
                        </label>
                        <select
                          value={categoryForm.color}
                          onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="indigo">Indigo (Standard)</option>
                          <option value="blue">Blue (Infrastructure)</option>
                          <option value="emerald">Emerald (DevOps / Green)</option>
                          <option value="rose">Rose (Security / Red)</option>
                          <option value="amber">Amber (Monitoring / Warning)</option>
                          <option value="purple">Purple (AI & ML)</option>
                          <option value="teal">Teal (Database)</option>
                          <option value="cyan">Cyan (Communication)</option>
                          <option value="orange">Orange (Marketing & CRM)</option>
                          <option value="slate">Slate (General / Neutral)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          placeholder="Purpose of this category"
                          value={categoryForm.description}
                          onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2">
                      {editingCategoryId && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleCancelEditCategory}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="submit"
                        size="sm"
                        disabled={settingsSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                      >
                        {editingCategoryId ? 'Update Category' : 'Save Category'}
                      </Button>
                    </div>
                  </form>

                  {/* Configured Categories List */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Configured Categories ({categories.length})
                      </h4>
                      <div className="relative w-56">
                        <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Filter categories..."
                          value={settingsSearch}
                          onChange={e => setSettingsSearch(e.target.value)}
                          className="w-full pl-7 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                            <th className="py-2.5 px-3">Category Badge & Name</th>
                            <th className="py-2.5 px-3">Description</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {categories
                            .filter(c => !settingsSearch || c.name.toLowerCase().includes(settingsSearch.toLowerCase()) || (c.description || '').toLowerCase().includes(settingsSearch.toLowerCase()))
                            .map(c => {
                              const colorClass = getCategoryColorClasses(c.color);
                              return (
                                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="py-2.5 px-3">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorClass}`}>
                                      {c.name}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500">
                                    {c.description || <span className="text-slate-300">-</span>}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${c.is_default ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                                      {c.is_default ? 'Default' : 'Custom'}
                                    </span>
                                  </td>
                                <td className="py-2.5 px-3 text-right">
                                  {confirmDeleteCategoryId === c.id ? (
                                    <div className="flex items-center justify-end gap-1.5 animate-in fade-in duration-150">
                                      <span className="text-[11px] text-rose-600 font-medium whitespace-nowrap">Delete?</span>
                                      <button
                                        type="button"
                                        disabled={settingsSubmitting}
                                        onClick={() => handleDeleteCategory(c.id, c.name)}
                                        className="px-2 py-0.5 text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                                        title="Confirm deletion"
                                      >
                                        {settingsSubmitting ? <RefreshCw size={10} className="animate-spin" /> : null}
                                        Yes
                                      </button>
                                      <button
                                        type="button"
                                        disabled={settingsSubmitting}
                                        onClick={() => setConfirmDeleteCategoryId(null)}
                                        className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleStartEditCategory(c);
                                          setConfirmDeleteCategoryId(null);
                                        }}
                                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                        title="Edit category"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setConfirmDeleteCategoryId(c.id);
                                          setConfirmDeleteProviderId(null);
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                        title="Delete category"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  )}
                                </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              {confirmResetSettings ? (
                <div className="flex items-center gap-2 animate-in fade-in duration-150">
                  <span className="text-xs text-rose-600 font-medium">Reset all to defaults?</span>
                  <Button
                    size="sm"
                    onClick={handleResetSettings}
                    disabled={settingsSubmitting}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs py-1 px-2.5 h-auto font-medium"
                  >
                    {settingsSubmitting ? <RefreshCw size={11} className="animate-spin mr-1" /> : null}
                    Yes, Reset
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmResetSettings(false)}
                    disabled={settingsSubmitting}
                    className="text-xs py-1 px-2.5 h-auto text-slate-600"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmResetSettings(true)}
                  disabled={settingsSubmitting}
                  className="gap-1.5 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 border-slate-200 font-medium"
                  title="Restore initial default providers and categories"
                >
                  <RotateCcw size={13} />
                  Restore Standard Defaults
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => {
                  setShowSettingsModal(false);
                  handleCancelEditProvider();
                  handleCancelEditCategory();
                  setSettingsError('');
                  setSettingsSuccess('');
                  setConfirmDeleteProviderId(null);
                  setConfirmDeleteCategoryId(null);
                  setConfirmResetSettings(false);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import & Restore Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Import & Restore Subscriptions</h3>
                  <p className="text-xs text-slate-500">Restore your cloud subscriptions from Excel (.xlsx/.xls), CSV, or JSON</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportError('');
                  setImportSuccess('');
                  setImportParsedData([]);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{importSuccess}</span>
                </div>
              )}

              {/* Mode Tabs */}
              <div className="flex border-b border-slate-200 gap-4">
                <button
                  type="button"
                  onClick={() => setImportMode('file')}
                  className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                    importMode === 'file'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileUp size={15} /> Upload File (.xlsx, .csv, .json)
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('paste')}
                  className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                    importMode === 'paste'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ClipboardList size={15} /> Paste Table / CSV / JSON
                </button>
              </div>

              {/* Tab 1: File Upload */}
              {importMode === 'file' && (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl p-6 text-center bg-slate-50/50 transition-colors">
                    <input
                      type="file"
                      id="cloud-sub-file-input"
                      accept=".xlsx,.xls,.csv,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="cloud-sub-file-input"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <FileSpreadsheet size={24} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">
                        {importFileName ? importFileName : 'Click to select file or drag & drop'}
                      </span>
                      <span className="text-xs text-slate-400">
                        Supports Microsoft Excel (.xlsx, .xls), CSV, or JSON
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 2: Paste Data */}
              {importMode === 'paste' && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-slate-700">
                    Paste raw text (Tab-separated from Excel/Sheets, CSV, or JSON):
                  </label>
                  <textarea
                    rows={6}
                    value={importPasteText}
                    onChange={(e) => setImportPasteText(e.target.value)}
                    placeholder="Name&#9;Provider&#9;Category&#9;Cost&#9;Renewal Date&#10;Google Workspace&#9;Google Cloud&#9;SaaS & Productivity&#9;720&#9;2026-12-01&#10;AWS EC2 Hosting&#9;Amazon Web Services&#9;Cloud Infrastructure&#9;1500&#9;2026-11-15"
                    className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      type="button"
                      onClick={handleParsePastedText}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium gap-1.5"
                    >
                      <Check size={14} /> Parse Subscriptions
                    </Button>
                  </div>
                </div>
              )}

              {/* Detected Rows Preview */}
              {importParsedData.length > 0 && (
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Detected {importParsedData.length} Subscription{importParsedData.length > 1 ? 's' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => setImportParsedData([])}
                      className="text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-600 sticky top-0">
                        <tr>
                          <th className="py-1.5 px-2">#</th>
                          <th className="py-1.5 px-2">Service Name</th>
                          <th className="py-1.5 px-2">Provider</th>
                          <th className="py-1.5 px-2">Cost</th>
                          <th className="py-1.5 px-2">Cycle</th>
                          <th className="py-1.5 px-2">Site</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importParsedData.slice(0, 50).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1 px-2 text-slate-400">{idx + 1}</td>
                            <td className="py-1 px-2 font-medium text-slate-800">{row.name}</td>
                            <td className="py-1 px-2 text-slate-600">{row.provider}</td>
                            <td className="py-1 px-2 font-semibold text-slate-700">${row.cost}</td>
                            <td className="py-1 px-2 text-slate-500">{row.billing_cycle}</td>
                            <td className="py-1 px-2 text-slate-500">{row.site_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Options */}
              <div className={`p-3 rounded-xl border transition-colors space-y-2 ${
                importReplaceExisting 
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900' 
                  : 'bg-emerald-50/60 border-emerald-100 text-emerald-900'
              }`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importReplaceExisting}
                    onChange={(e) => setImportReplaceExisting(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <span className="text-xs font-semibold">
                    {importReplaceExisting
                      ? '⚠️ Danger: Replace & erase existing cloud subscriptions in database'
                      : 'Safe Append Mode: Add imported subscriptions without deleting existing ones'}
                  </span>
                </label>
                <p className="text-[11px] ml-6 opacity-85">
                  {importReplaceExisting
                    ? 'Caution: All current subscriptions in the database will be permanently wiped and replaced by this import file.'
                    : 'Recommended: Existing subscriptions will be safely preserved, and imported records will be added to your catalog.'}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportError('');
                  setImportSuccess('');
                  setImportParsedData([]);
                }}
                disabled={importSubmitting}
                className="text-slate-600"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                type="button"
                onClick={handleExecuteImport}
                disabled={importSubmitting || importParsedData.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5"
              >
                {importSubmitting ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={14} />}
                Confirm & Restore {importParsedData.length > 0 ? `(${importParsedData.length})` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
