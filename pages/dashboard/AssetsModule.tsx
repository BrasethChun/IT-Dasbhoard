import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Layers, Monitor, Wrench, ShieldAlert, CheckCircle2, 
  AlertCircle, AlertTriangle, Search, Filter, Plus, Edit2, Trash2, 
  Download, Upload, Eye, EyeOff, Copy, RefreshCw, BarChart3, 
  FileSpreadsheet, ArrowRight, ArrowLeftRight, Check, X, QrCode, 
  Scan, Clock, DollarSign, Calendar, Cpu, HardDrive, Wifi, Printer, 
  Camera, Smartphone, ShieldCheck, Tag, ExternalLink, Sparkles,
  ChevronDown, ChevronRight, Sliders, Settings, MapPin, ChevronsUpDown, FolderKanban
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import * as XLSX from 'xlsx';
import { Button } from '../../components/ui/Button';

export interface AssetCategoryConfig {
  id: string;
  name: string;
  type: 'fixed' | 'control' | 'both';
  description?: string;
  created_at?: string;
}

export interface AssetLocationConfig {
  id: string;
  bu_name: string;
  floor_level: string;
  location_name: string;
  room_details?: string;
  created_at?: string;
}

export interface BusinessUnitConfig {
  id: string;
  bu_name: string;
  code_prefix_fixed: string;
  code_prefix_control: string;
  address?: string;
  created_at?: string;
}

export interface FixedAsset {
  id: string;
  bu_name: 'Khema Global' | 'Khema TK' | 'Khema BKK' | 'Sakal 2004';
  asset_code: string;
  asset_date: string;
  category: string;
  item_name: string;
  brand: string;
  model: string;
  serial_num: string;
  key_specification: string;
  supplier: string;
  room_name: string;
  floor: string;
  current_user: string;
  admin_password?: string;
  user_email?: string;
  hostname: string;
  ip_lan: string;
  ip_address_lan_secondary?: string;
  ip_address_wan?: string;
  issue_date?: string;
  purchase_date?: string;
  invoice_ref?: string;
  quantity: number;
  unit_price: number;
  before_dis_vat_price: number;
  grand_total: number;
  win_license?: string;
  ms_license?: string;
  ms_account_email?: string;
  ms_account_password?: string;
  remark?: string;
  status: 'Active' | 'In Repair' | 'Plan dispose' | 'Disposed' | 'Spare';
}

export interface ControlAsset {
  id: string;
  bu_name: 'Khema Global' | 'Khema TK' | 'Khema BKK' | 'Sakal 2004';
  ac_code_cms: string;
  category: string;
  item_name: string;
  brand: string;
  model: string;
  serial_num: string;
  key_specification: string;
  supplier: string;
  room_name: string;
  floor: string;
  current_user: string;
  remark?: string;
  status: 'Active' | 'In Repair' | 'Plan dispose' | 'Disposed' | 'Missing';
}

export interface PhysicalAuditItem {
  id: string;
  audit_year: number;
  bu_name: 'Khema Global' | 'Khema TK' | 'Khema BKK' | 'Sakal 2004';
  asset_type: 'Fixed Asset' | 'Asset Control';
  asset_id: string;
  asset_code: string;
  item_name: string;
  expected_floor: string;
  expected_room: string;
  actual_floor: string;
  actual_room: string;
  status: 'Verified (Matched)' | 'Location Mismatch' | 'Condition Changed' | 'Missing';
  notes: string;
  audited_by: string;
  synced_to_register: number;
  created_at: string;
}

const BUSINESS_UNITS = ['All BUs', 'Khema Global', 'Khema TK', 'Khema BKK', 'Sakal 2004'] as const;
type BusinessUnit = typeof BUSINESS_UNITS[number];

const FLOORS = ['All Locations', 'Floor G', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5', 'Floor 6', 'Floor 7', 'Floor 8', 'Floor 9', 'Floor 10'];

const FIXED_CATEGORIES = [
  'COMPUTER',
  'LAPTOP',
  'Synology',
  'TV',
  'PRINTER',
  'UPS',
  'Swing Door',
  'Video Conference'
];

const CONTROL_CATEGORIES = [
  'PRINTER',
  'FINGERPRINT',
  'SERVER ROOM',
  'TV',
  'MOBILE PHONE',
  'BILL COUNTER',
  'PROJECTOR',
  'ICOM',
  'COMPUTER',
  'UPS',
  'CAMERA SECURITY',
  'WIFI'
];

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII'];

// Standardized Date Parser for Excel Imports (supports YYYY-MM-DD, Excel serial numbers, Date objects, DD/MM/YYYY)
export const parseExcelDate = (val: any): string | null => {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    if (y < 1970) return null;
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'number') {
    if (val <= 0 || isNaN(val)) return null;
    const msPerDay = 86400000;
    const utcDays = val - 25569;
    const date = new Date(Math.round(utcDays * msPerDay));
    if (isNaN(date.getTime()) || date.getFullYear() < 1970) return null;
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (!str || str === '--' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str.toLowerCase() === 'n/a') {
    return null;
  }
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = String(parseInt(ymdMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(ymdMatch[3], 10)).padStart(2, '0');
    if (y >= 1970 && y <= 2100) return `${y}-${m}-${d}`;
  }
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const d = String(parseInt(dmyMatch[1], 10)).padStart(2, '0');
    const m = String(parseInt(dmyMatch[2], 10)).padStart(2, '0');
    const y = parseInt(dmyMatch[3], 10);
    if (y >= 1970 && y <= 2100) return `${y}-${m}-${d}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 1970) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return null;
};

// Standardized Display Formatter: formats date cleanly as YYYY-MM-DD
export const formatDisplayDate = (d?: string | null): string => {
  if (!d) return '--';
  const str = String(d).trim();
  if (!str || str === '--' || str.toLowerCase() === 'null') return '--';
  if (str.startsWith('1899') || str.startsWith('1900') || str.startsWith('0000')) return '--';
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const dt = new Date(str);
  if (!isNaN(dt.getTime()) && dt.getFullYear() >= 1970) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return str.slice(0, 10);
};

export const AssetsModule: React.FC<{ sites?: any[] }> = ({ sites = [] }) => {
  // Business Unit Selector
  const [selectedBu, setSelectedBu] = useState<BusinessUnit>('All BUs');

  // Sub-tab Navigation
  type SubTab = 'overview' | 'fixed' | 'control' | 'audit' | 'config';
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFloor, setFilterFloor] = useState('All Locations');
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [filterStatus, setFilterStatus] = useState('All Statuses');

  // Data Store
  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>([]);
  const [controlAssets, setControlAssets] = useState<ControlAsset[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [auditList, setAuditList] = useState<PhysicalAuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuration State
  const [configCategories, setConfigCategories] = useState<AssetCategoryConfig[]>([]);
  const [configLocations, setConfigLocations] = useState<AssetLocationConfig[]>([]);
  const [configBUs, setConfigBUs] = useState<BusinessUnitConfig[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Collapsible Category Header States (Grid view on click)
  const [collapsedFixedCategories, setCollapsedFixedCategories] = useState<Record<string, boolean>>({});
  const [collapsedControlCategories, setCollapsedControlCategories] = useState<Record<string, boolean>>({});

  // Configuration Navigation View ('categories' | 'bus' | 'locations')
  const [configActiveView, setConfigActiveView] = useState<'categories' | 'bus' | 'locations'>('categories');

  // Configuration Table Filters & Search
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryTypeFilter, setCategoryTypeFilter] = useState('all');
  const [buSearch, setBuSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationBuFilter, setLocationBuFilter] = useState('All BUs');
  const [locationFloorFilter, setLocationFloorFilter] = useState('All Floors');

  // Configuration Modal States for Full CRUD
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AssetCategoryConfig | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', type: 'both' as 'both' | 'fixed' | 'control', description: '' });

  const [showBuModal, setShowBuModal] = useState(false);
  const [editingBu, setEditingBu] = useState<BusinessUnitConfig | null>(null);
  const [buFormData, setBuFormData] = useState({ bu_name: '', code_prefix_fixed: '', code_prefix_control: '', address: '' });

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<AssetLocationConfig | null>(null);
  const [locationFormData, setLocationFormData] = useState({ bu_name: 'Khema Global', floor_level: 'G', location_name: '', room_details: '' });

  // In-app Delete Confirmation Modal State (replaces blocked window.confirm)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'category' | 'bu' | 'location' | 'fixed' | 'control';
    id: string;
    name: string;
    subtitle?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Credential Visibility Tracking
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Import Validation & Asset Row Count Alert States
  interface ImportSummary {
    fileName: string;
    targetBu: string;
    totalAssets: number;
    fixedTotal: number;
    fixedNew: number;
    fixedUpdated: number;
    fixedUnchanged?: number;
    controlTotal: number;
    controlNew: number;
    controlUpdated: number;
    controlUnchanged?: number;
    totalScannedFixed: number;
    totalScannedControl: number;
    skippedFixed: number;
    skippedControl: number;
    dateVerifiedCount: number;
  }
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importValidationError, setImportValidationError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Modals
  const [showFixedModal, setShowFixedModal] = useState(false);
  const [editingFixed, setEditingFixed] = useState<FixedAsset | null>(null);

  const [showControlModal, setShowControlModal] = useState(false);
  const [editingControl, setEditingControl] = useState<ControlAsset | null>(null);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState<{ type: 'fixed' | 'control'; asset: any } | null>(null);
  const [transferData, setTransferData] = useState({ to_bu: 'Khema Global', to_floor: 'G', to_room: '', to_user: '', reason: '' });

  // Physical Audit State
  const [auditFloor, setAuditFloor] = useState('G');
  const [auditBu, setAuditBu] = useState<'Khema Global' | 'Khema TK' | 'Khema BKK' | 'Sakal 2004'>('Khema Global');
  const [scannedCode, setScannedCode] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [auditNotes, setAuditNotes] = useState('');
  const [auditActualRoom, setAuditActualRoom] = useState('');
  const [auditActualFloor, setAuditActualFloor] = useState('G');
  const [auditCustomStatus, setAuditCustomStatus] = useState<'Verified (Matched)' | 'Location Mismatch' | 'Condition Changed' | 'Missing'>('Verified (Matched)');
  const [syncingAudit, setSyncingAudit] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard`, 'info');
  };

  // --- API DATA FETCHERS ---
  const fetchConfigData = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch('/api/it-assets/config', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setConfigCategories(data.categories || []);
        setConfigLocations(data.locations || []);
        setConfigBUs(data.businessUnits || []);
      }
    } catch (err: any) {
      console.error('Error fetching config data:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const buParam = selectedBu !== 'All BUs' ? `?bu_name=${encodeURIComponent(selectedBu)}` : '';
      const [fixedRes, controlRes, analyticsRes, auditRes] = await Promise.all([
        fetch(`/api/fixed-assets${buParam}`, { headers: getAuthHeaders() }),
        fetch(`/api/assets-control${buParam}`, { headers: getAuthHeaders() }),
        fetch(`/api/it-assets/analytics${buParam}`, { headers: getAuthHeaders() }),
        fetch(`/api/physical-audits${buParam}`, { headers: getAuthHeaders() })
      ]);

      if (fixedRes.ok) setFixedAssets(await fixedRes.json());
      if (controlRes.ok) setControlAssets(await controlRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (auditRes.ok) setAuditList(await auditRes.json());
    } catch (err: any) {
      console.error('Error fetching asset data:', err);
      showToast('Error fetching asset data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    fetchConfigData();
  }, [selectedBu]);

  // Keep audit BU in sync with selected BU if not All
  useEffect(() => {
    if (selectedBu !== 'All BUs') {
      setAuditBu(selectedBu);
    }
  }, [selectedBu]);

  // Dynamic Categories Synced from Asset Configuration Database (Zero duplicates)
  const allFixedCategories = useMemo(() => {
    const map = new Map<string, string>(); // upper -> canonical display

    // 1. Primary: Asset Configuration Database categories for fixed/both
    configCategories
      .filter(c => c.type === 'fixed' || c.type === 'both')
      .forEach(c => {
        const name = (c.name || '').trim();
        if (name && !map.has(name.toUpperCase())) {
          map.set(name.toUpperCase(), name);
        }
      });

    // 2. Also register any category that existing fixed assets actually have
    fixedAssets.forEach(f => {
      const cat = (f.category || '').trim();
      if (cat && !map.has(cat.toUpperCase())) {
        map.set(cat.toUpperCase(), cat);
      }
    });

    // 3. Fallback defaults only if database is completely empty
    if (map.size === 0) {
      FIXED_CATEGORIES.forEach(c => {
        map.set(c.toUpperCase(), c);
      });
    }

    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [configCategories, fixedAssets]);

  const allControlCategories = useMemo(() => {
    const map = new Map<string, string>();

    // 1. Primary: Asset Configuration Database categories for control/both
    configCategories
      .filter(c => c.type === 'control' || c.type === 'both')
      .forEach(c => {
        const name = (c.name || '').trim();
        if (name && !map.has(name.toUpperCase())) {
          map.set(name.toUpperCase(), name);
        }
      });

    // 2. Also register any category that existing control assets actually have
    controlAssets.forEach(c => {
      const cat = (c.category || '').trim();
      if (cat && !map.has(cat.toUpperCase())) {
        map.set(cat.toUpperCase(), cat);
      }
    });

    // 3. Fallback defaults only if database is completely empty
    if (map.size === 0) {
      CONTROL_CATEGORIES.forEach(c => {
        map.set(c.toUpperCase(), c);
      });
    }

    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [configCategories, controlAssets]);

  // Available Locations for Filter & Dropdowns (Unique Floors + Configured Location Tags)
  const availableLocationOptions = useMemo(() => {
    const options: { key: string; label: string; value: string }[] = [
      { key: 'all-locations', label: 'All Locations', value: 'All Locations' }
    ];
    
    // Standard floor levels first (guaranteed unique key and value)
    ['G', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].forEach(fl => {
      options.push({
        key: `floor-${fl}`,
        label: `Floor ${fl}`,
        value: fl
      });
    });

    // Configured locations matching selected BU or all (guaranteed unique key and value)
    const relevantLocations = selectedBu === 'All BUs' 
      ? configLocations 
      : configLocations.filter(l => l.bu_name === selectedBu);

    const seenNames = new Set<string>();
    relevantLocations.forEach(loc => {
      const name = (loc.location_name || '').trim();
      if (name && !seenNames.has(name.toLowerCase())) {
        seenNames.add(name.toLowerCase());
        options.push({
          key: `loc-${loc.id || name}`,
          label: `${name} (Fl ${loc.floor_level})`,
          value: name
        });
      }
    });

    return options;
  }, [configLocations, selectedBu]);

  // Collapsible Category Handlers
  const toggleFixedCategory = (cat: string) => {
    setCollapsedFixedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleControlCategory = (cat: string) => {
    setCollapsedControlCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleExpandAllFixed = () => {
    setCollapsedFixedCategories({});
  };

  const handleCollapseAllFixed = () => {
    const allCollapsed: Record<string, boolean> = {};
    groupedFixedAssets.forEach(([cat]) => {
      allCollapsed[cat] = true;
    });
    setCollapsedFixedCategories(allCollapsed);
  };

  const handleExpandAllControl = () => {
    setCollapsedControlCategories({});
  };

  const handleCollapseAllControl = () => {
    const allCollapsed: Record<string, boolean> = {};
    groupedControlAssets.forEach(([cat]) => {
      allCollapsed[cat] = true;
    });
    setCollapsedControlCategories(allCollapsed);
  };

  // --- CONFIGURATION FILTERED DATASETS ---
  const filteredCategories = useMemo(() => {
    const seen = new Set<string>();
    const deduplicated = configCategories.filter(cat => {
      const key = (cat.name || '').trim().toUpperCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduplicated.filter(cat => {
      const matchSearch = !categorySearch.trim() || 
        cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(categorySearch.toLowerCase()));
      const matchType = categoryTypeFilter === 'all' || cat.type === categoryTypeFilter;
      return matchSearch && matchType;
    });
  }, [configCategories, categorySearch, categoryTypeFilter]);

  const filteredBUs = useMemo(() => {
    return configBUs.filter(bu => {
      return !buSearch.trim() ||
        bu.bu_name.toLowerCase().includes(buSearch.toLowerCase()) ||
        bu.code_prefix_fixed.toLowerCase().includes(buSearch.toLowerCase()) ||
        bu.code_prefix_control.toLowerCase().includes(buSearch.toLowerCase()) ||
        (bu.address && bu.address.toLowerCase().includes(buSearch.toLowerCase()));
    });
  }, [configBUs, buSearch]);

  const filteredLocations = useMemo(() => {
    return configLocations.filter(loc => {
      const matchSearch = !locationSearch.trim() ||
        loc.location_name.toLowerCase().includes(locationSearch.toLowerCase()) ||
        (loc.room_details && loc.room_details.toLowerCase().includes(locationSearch.toLowerCase()));
      const matchBu = locationBuFilter === 'All BUs' || loc.bu_name === locationBuFilter;
      const matchFloor = locationFloorFilter === 'All Floors' || loc.floor_level === locationFloorFilter;
      return matchSearch && matchBu && matchFloor;
    });
  }, [configLocations, locationSearch, locationBuFilter, locationFloorFilter]);

  // --- CONFIGURATION MODAL & CRUD HANDLERS ---
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: '', type: 'both', description: '' });
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat: AssetCategoryConfig) => {
    setEditingCategory(cat);
    setCategoryFormData({ name: cat.name, type: cat.type, description: cat.description || '' });
    setShowCategoryModal(true);
  };

  const handleSaveCategoryModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) return;
    try {
      const url = editingCategory 
        ? `/api/it-assets/config/categories/${editingCategory.id}` 
        : '/api/it-assets/config/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryFormData)
      });
      if (res.ok) {
        showToast(editingCategory ? `Category "${categoryFormData.name}" updated` : `Category "${categoryFormData.name}" created`, 'success');
        setShowCategoryModal(false);
        fetchConfigData();
        fetchAllData();
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to save category', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCategory = (cat: AssetCategoryConfig) => {
    setDeleteTarget({
      type: 'category',
      id: cat.id,
      name: cat.name,
      subtitle: `${cat.type === 'both' ? 'Both Registers' : `${cat.type} Only`} · ${cat.description || 'Standard IT Category'}`
    });
  };

  const handleOpenAddBu = () => {
    setEditingBu(null);
    setBuFormData({ bu_name: '', code_prefix_fixed: '', code_prefix_control: '', address: '' });
    setShowBuModal(true);
  };

  const handleOpenEditBu = (bu: BusinessUnitConfig) => {
    setEditingBu(bu);
    setBuFormData({ bu_name: bu.bu_name, code_prefix_fixed: bu.code_prefix_fixed, code_prefix_control: bu.code_prefix_control, address: bu.address || '' });
    setShowBuModal(true);
  };

  const handleSaveBuModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buFormData.bu_name.trim()) return;
    try {
      const url = editingBu 
        ? `/api/it-assets/config/bus/${editingBu.id}` 
        : '/api/it-assets/config/bus';
      const method = editingBu ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(buFormData)
      });
      if (res.ok) {
        showToast(editingBu ? `Business Unit "${buFormData.bu_name}" updated` : `Business Unit "${buFormData.bu_name}" created`, 'success');
        setShowBuModal(false);
        fetchConfigData();
        fetchAllData();
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to save BU', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteBu = (bu: BusinessUnitConfig) => {
    setDeleteTarget({
      type: 'bu',
      id: bu.id,
      name: bu.bu_name,
      subtitle: `Fixed Prefix: ${bu.code_prefix_fixed} · Control Prefix: ${bu.code_prefix_control}`
    });
  };

  const handleOpenAddLocation = () => {
    setEditingLocation(null);
    setLocationFormData({ bu_name: selectedBu !== 'All BUs' ? selectedBu : 'Khema Global', floor_level: 'G', location_name: '', room_details: '' });
    setShowLocationModal(true);
  };

  const handleOpenEditLocation = (loc: AssetLocationConfig) => {
    setEditingLocation(loc);
    setLocationFormData({ bu_name: loc.bu_name, floor_level: loc.floor_level, location_name: loc.location_name, room_details: loc.room_details || '' });
    setShowLocationModal(true);
  };

  const handleSaveLocationModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationFormData.location_name.trim()) return;
    try {
      const url = editingLocation 
        ? `/api/it-assets/config/locations/${editingLocation.id}` 
        : '/api/it-assets/config/locations';
      const method = editingLocation ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(locationFormData)
      });
      if (res.ok) {
        showToast(editingLocation ? `Location "${locationFormData.location_name}" updated` : `Location "${locationFormData.location_name}" created`, 'success');
        setShowLocationModal(false);
        fetchConfigData();
        fetchAllData();
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to save location', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteLocation = (loc: AssetLocationConfig) => {
    setDeleteTarget({
      type: 'location',
      id: loc.id,
      name: loc.location_name,
      subtitle: `${loc.bu_name} · Floor ${loc.floor_level}${loc.room_details ? ` (${loc.room_details})` : ''}`
    });
  };

  // Central in-app Delete Executor (Categories, BUs, Locations, Fixed Assets, Control Assets)
  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      let url = '';
      let successMsg = '';

      if (deleteTarget.type === 'category') {
        url = `/api/it-assets/config/categories/${deleteTarget.id}`;
        successMsg = `Category "${deleteTarget.name}" deleted`;
      } else if (deleteTarget.type === 'bu') {
        url = `/api/it-assets/config/bus/${deleteTarget.id}`;
        successMsg = `Business Unit "${deleteTarget.name}" deleted`;
      } else if (deleteTarget.type === 'location') {
        url = `/api/it-assets/config/locations/${deleteTarget.id}`;
        successMsg = `Location "${deleteTarget.name}" deleted`;
      } else if (deleteTarget.type === 'fixed') {
        url = `/api/fixed-assets/${deleteTarget.id}`;
        successMsg = `Fixed Asset "${deleteTarget.name}" deleted`;
      } else if (deleteTarget.type === 'control') {
        url = `/api/assets-control/${deleteTarget.id}`;
        successMsg = `Control Asset "${deleteTarget.name}" deleted`;
      }

      const res = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (res.ok) {
        showToast(successMsg, 'success');
        setDeleteTarget(null);
        if (['category', 'bu', 'location'].includes(deleteTarget.type)) {
          fetchConfigData();
        }
        fetchAllData();
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || 'Failed to delete record', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- FILTERED DATA SETS ---
  const filteredFixedAssets = useMemo(() => {
    return fixedAssets.filter(item => {
      const matchSearch = searchTerm === '' || 
        item.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.model && item.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.serial_num && item.serial_num.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.hostname && item.hostname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.ip_lan && item.ip_lan.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.current_user && item.current_user.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchLocation = filterFloor === 'All Locations' || 
        filterFloor === 'All Floors' || 
        item.floor === filterFloor ||
        filterFloor === `Floor ${item.floor}` ||
        (item.room_name && item.room_name.toLowerCase().includes(filterFloor.toLowerCase()));

      const matchCategory = filterCategory === 'All Categories' || 
        (item.category || '').trim().toUpperCase() === filterCategory.trim().toUpperCase();
      const matchStatus = filterStatus === 'All Statuses' || item.status === filterStatus;

      return matchSearch && matchLocation && matchCategory && matchStatus;
    });
  }, [fixedAssets, searchTerm, filterFloor, filterCategory, filterStatus]);

  const filteredControlAssets = useMemo(() => {
    return controlAssets.filter(item => {
      const matchSearch = searchTerm === '' || 
        item.ac_code_cms.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.model && item.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.serial_num && item.serial_num.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.current_user && item.current_user.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchLocation = filterFloor === 'All Locations' || 
        filterFloor === 'All Floors' || 
        item.floor === filterFloor ||
        filterFloor === `Floor ${item.floor}` ||
        (item.room_name && item.room_name.toLowerCase().includes(filterFloor.toLowerCase()));

      const matchCategory = filterCategory === 'All Categories' || 
        (item.category || '').trim().toUpperCase() === filterCategory.trim().toUpperCase();
      const matchStatus = filterStatus === 'All Statuses' || item.status === filterStatus;

      return matchSearch && matchLocation && matchCategory && matchStatus;
    });
  }, [controlAssets, searchTerm, filterFloor, filterCategory, filterStatus]);

  // Grouped Fixed Assets by Category (Synced from Database, deduplicated, only active categories)
  const groupedFixedAssets = useMemo(() => {
    const groups = new Map<string, FixedAsset[]>();

    filteredFixedAssets.forEach(item => {
      const catKey = (item.category || 'Computer').trim().toUpperCase();
      if (!groups.has(catKey)) {
        groups.set(catKey, []);
      }
      groups.get(catKey)!.push(item);
    });

    const result: [string, FixedAsset[]][] = [];
    groups.forEach((items, upperCat) => {
      // Find the canonical display name from allFixedCategories or item.category
      const canonicalName = allFixedCategories.find(c => c.toUpperCase() === upperCat) || items[0]?.category || upperCat;
      result.push([canonicalName, items]);
    });

    // Sort alphabetically by category name
    result.sort(([a], [b]) => a.localeCompare(b));
    return result;
  }, [filteredFixedAssets, allFixedCategories]);

  // Grouped Control Assets by Category (Synced from Database, deduplicated, only active categories)
  const groupedControlAssets = useMemo(() => {
    const groups = new Map<string, ControlAsset[]>();

    filteredControlAssets.forEach(item => {
      const catKey = (item.category || 'Printer').trim().toUpperCase();
      if (!groups.has(catKey)) {
        groups.set(catKey, []);
      }
      groups.get(catKey)!.push(item);
    });

    const result: [string, ControlAsset[]][] = [];
    groups.forEach((items, upperCat) => {
      const canonicalName = allControlCategories.find(c => c.toUpperCase() === upperCat) || items[0]?.category || upperCat;
      result.push([canonicalName, items]);
    });

    result.sort(([a], [b]) => a.localeCompare(b));
    return result;
  }, [filteredControlAssets, allControlCategories]);


  // --- ACTIONS: ADD / EDIT / DELETE ---
  const handleOpenAddFixed = async () => {
    const targetBu = selectedBu !== 'All BUs' ? selectedBu : 'Khema Global';
    let nextCode = targetBu === 'Khema Global' ? 'KGPH000001' : targetBu === 'Khema BKK' ? 'KBPH000001' : targetBu === 'Sakal 2004' ? 'SKPH000001' : 'K2PH000001';
    try {
      const res = await fetch(`/api/it-assets/next-code?bu_name=${encodeURIComponent(targetBu)}&type=fixed`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        nextCode = data.nextCode;
      }
    } catch {}

    setEditingFixed({
      id: '',
      bu_name: targetBu,
      asset_code: nextCode,
      asset_date: new Date().toISOString().slice(0, 10),
      category: 'COMPUTER',
      item_name: 'Desktop AIO',
      brand: 'DELL',
      model: '',
      serial_num: '',
      key_specification: '',
      supplier: '',
      room_name: 'Customer Service',
      floor: 'G',
      current_user: '',
      admin_password: '',
      user_email: '',
      hostname: '',
      ip_lan: '',
      ip_address_lan_secondary: '',
      ip_address_wan: '',
      quantity: 1,
      unit_price: 0,
      before_dis_vat_price: 0,
      grand_total: 0,
      win_license: 'Win 11 Pro',
      ms_license: '',
      ms_account_email: '',
      ms_account_password: '',
      remark: '',
      status: 'Active'
    });
    setShowFixedModal(true);
  };

  const handleOpenAddControl = async () => {
    const targetBu = selectedBu !== 'All BUs' ? selectedBu : 'Khema Global';
    let nextCode = targetBu === 'Khema Global' ? 'KG-AC0001' : targetBu === 'Khema BKK' ? 'KB-AC0001' : targetBu === 'Sakal 2004' ? 'SK-AC0001' : 'K2-AC0001';
    try {
      const res = await fetch(`/api/it-assets/next-code?bu_name=${encodeURIComponent(targetBu)}&type=control`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        nextCode = data.nextCode;
      }
    } catch {}

    setEditingControl({
      id: '',
      bu_name: targetBu,
      ac_code_cms: nextCode,
      category: 'PRINTER',
      item_name: 'Printer',
      brand: 'Epson',
      model: '',
      serial_num: '',
      key_specification: '',
      supplier: '',
      room_name: 'Reception',
      floor: 'G',
      current_user: '',
      remark: '',
      status: 'Active'
    });
    setShowControlModal(true);
  };

  const handleOpenEditFixed = (item: FixedAsset) => {
    setEditingFixed({
      ...item,
      bu_name: item.bu_name || 'Khema TK',
      asset_code: item.asset_code || '',
      asset_date: formatDisplayDate(item.asset_date) !== '--' ? formatDisplayDate(item.asset_date) : '',
      category: item.category || 'COMPUTER',
      item_name: item.item_name || '',
      brand: item.brand || '',
      model: item.model || '',
      serial_num: item.serial_num || '',
      key_specification: item.key_specification || '',
      supplier: item.supplier || '',
      room_name: item.room_name || '',
      floor: item.floor || 'G',
      current_user: item.current_user || '',
      admin_password: item.admin_password || '',
      user_email: item.user_email || '',
      hostname: item.hostname || '',
      ip_lan: item.ip_lan || '',
      ip_address_lan_secondary: item.ip_address_lan_secondary || '',
      ip_address_wan: item.ip_address_wan || '',
      invoice_ref: item.invoice_ref || '',
      quantity: item.quantity ?? 1,
      unit_price: item.unit_price ?? 0,
      before_dis_vat_price: item.before_dis_vat_price ?? 0,
      grand_total: item.grand_total ?? 0,
      win_license: item.win_license || '',
      ms_license: item.ms_license || '',
      ms_account_email: item.ms_account_email || '',
      ms_account_password: item.ms_account_password || '',
      remark: item.remark || '',
      status: item.status || 'Active'
    });
    setShowFixedModal(true);
  };

  const handleOpenEditControl = (item: ControlAsset) => {
    setEditingControl({
      ...item,
      bu_name: item.bu_name || 'Khema TK',
      ac_code_cms: item.ac_code_cms || '',
      category: item.category || 'PRINTER',
      item_name: item.item_name || '',
      brand: item.brand || '',
      model: item.model || '',
      serial_num: item.serial_num || '',
      key_specification: item.key_specification || '',
      supplier: item.supplier || '',
      room_name: item.room_name || '',
      floor: item.floor || 'G',
      current_user: item.current_user || '',
      remark: item.remark || '',
      status: item.status || 'Active'
    });
    setShowControlModal(true);
  };

  const handleSaveFixed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFixed) return;

    try {
      const isNew = !editingFixed.id;
      const url = isNew ? '/api/fixed-assets' : `/api/fixed-assets/${editingFixed.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(editingFixed)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save Fixed Asset');
      }

      showToast(isNew ? `Fixed Asset ${editingFixed.asset_code} registered` : `Fixed Asset ${editingFixed.asset_code} updated`, 'success');
      setShowFixedModal(false);
      fetchAllData();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleSaveControl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingControl) return;

    try {
      const isNew = !editingControl.id;
      const url = isNew ? '/api/assets-control' : `/api/assets-control/${editingControl.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(editingControl)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save Control Asset');
      }

      showToast(isNew ? `Control Asset ${editingControl.ac_code_cms} registered` : `Control Asset ${editingControl.ac_code_cms} updated`, 'success');
      setShowControlModal(false);
      fetchAllData();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleDeleteFixed = (item: FixedAsset) => {
    setDeleteTarget({
      type: 'fixed',
      id: item.id,
      name: item.asset_code,
      subtitle: `${item.item_name} · ${item.bu_name}`
    });
  };

  const handleDeleteControl = (item: ControlAsset) => {
    setDeleteTarget({
      type: 'control',
      id: item.id,
      name: item.ac_code_cms,
      subtitle: `${item.item_name} · ${item.bu_name}`
    });
  };

  // --- ASSET RELOCATION & TRANSFER MODAL ---
  const handleOpenTransfer = (type: 'fixed' | 'control', asset: any) => {
    setTransferTarget({ type, asset });
    setTransferData({
      to_bu: asset.bu_name || 'Khema TK',
      to_floor: asset.floor || 'G',
      to_room: asset.room_name || '',
      to_user: asset.current_user || '',
      reason: 'Department Relocation'
    });
    setShowTransferModal(true);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTarget) return;

    try {
      const res = await fetch('/api/it-assets/transfer', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: transferTarget.type,
          id: transferTarget.asset.id,
          to_bu: transferData.to_bu,
          to_floor: transferData.to_floor,
          to_room: transferData.to_room,
          to_user: transferData.to_user,
          reason: transferData.reason
        })
      });

      if (!res.ok) throw new Error('Transfer failed');

      showToast(`Asset relocated to ${transferData.to_bu} Floor ${transferData.to_floor} (${transferData.to_room})`, 'success');
      setShowTransferModal(false);
      fetchAllData();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // --- PHYSICAL AUDIT SCAN & RECONCILIATION ---
  const handleScanCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scannedCode.trim()) return;

    try {
      const res = await fetch(`/api/physical-audits/verify-code?code=${encodeURIComponent(scannedCode.trim())}&bu_name=${encodeURIComponent(auditBu)}&floor=${encodeURIComponent(auditFloor)}`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
        if (data.found) {
          setAuditCustomStatus(data.suggested_status);
          setAuditActualFloor(auditFloor);
          setAuditActualRoom(data.item.room_name || '');
          setAuditNotes(`Audited on Floor ${auditFloor}`);
        } else {
          showToast(`Unregistered asset: ${scannedCode}`, 'error');
        }
      }
    } catch (e: any) {
      showToast('Scan error: ' + e.message, 'error');
    }
  };

  const handleConfirmAuditFinding = async () => {
    if (!scanResult || !scanResult.found) return;

    try {
      const payload = {
        bu_name: auditBu,
        audit_year: 2026,
        asset_type: scanResult.asset_type,
        asset_id: scanResult.item.id,
        asset_code: scanResult.item.asset_code || scanResult.item.ac_code_cms,
        item_name: scanResult.item.item_name,
        expected_floor: scanResult.expected_floor,
        expected_room: scanResult.expected_room,
        actual_floor: auditActualFloor,
        actual_room: auditActualRoom,
        status: auditCustomStatus,
        notes: auditNotes
      };

      const res = await fetch('/api/physical-audits/record', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`Audit logged: ${payload.asset_code} marked as "${auditCustomStatus}"`, 'success');
        setScannedCode('');
        setScanResult(null);
        fetchAllData();
      }
    } catch (e: any) {
      showToast('Failed to log audit: ' + e.message, 'error');
    }
  };

  const handleSyncAuditToRegister = async () => {
    setSyncingAudit(true);
    try {
      const res = await fetch('/api/physical-audits/sync-register', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ bu_name: auditBu, floor: auditFloor, year: 2026 })
      });

      if (res.ok) {
        const result = await res.json();
        showToast(result.message || 'Audit records synced to master register!', 'success');
        fetchAllData();
      }
    } catch (e: any) {
      showToast('Sync error: ' + e.message, 'error');
    } finally {
      setSyncingAudit(false);
    }
  };

  // --- CLEAN FLAT EXCEL EXPORT (FixAssets & Assets Control) ---
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const orgTitle = selectedBu === 'All BUs' 
        ? 'KHEMA GLOBAL CO., LTD - CONSOLIDATED ASSETS REGISTER' 
        : `KHEMA GLOBAL CO., LTD - ${selectedBu.toUpperCase()}`;

      // --- SHEET 1: FixAssets (Clean Flat Table with Category in Col B & Sequential No in Col A) ---
      const fixedData: any[] = [];
      fixedData.push([orgTitle]);
      fixedData.push(['FIXED ASSETS REGISTER (FixAssets)']);
      fixedData.push([]); // blank line

      // Table Header Row: Col A is 'No', Col B is 'CATEGORY', Col C is 'ASSET CODE'
      const fixedHeader = [
        'No', 'CATEGORY', 'ASSET CODE', 'ASSET DATE', 'ITEM NAME', 'BRAND', 'MODEL', 'SERIAL NUM',
        'KEY SPECIFICATION', 'SUPPLIER', 'ROOM NO/NAME', 'FLOOR', 'CURRENT USER', 'ADMIN PASSWORD',
        'USER EMAIL', 'HOSTNAME', 'IP LAN', 'IP ADDRESS LAN (SECONDARY)', 'IP ADDRESS WAN', 'ISSUE DATE',
        'PURCHASE DATE', 'INVOICE REF', 'QUANTITY', 'UNIT PRICE ($)', 'BEFORE DIS VAT PRICE ($)',
        'GRAND TOTAL ($)', 'WIN LICENSE', 'MS LICENSE', 'MS ACCOUNT EMAIL', 'MS ACCOUNT PASSWORD', 'REMARK', 'STATUS'
      ];
      fixedData.push(fixedHeader);

      let seq = 1;
      // Sort assets cleanly by category then asset_code without category banner rows
      const sortedFixed = [...fixedAssets].sort((a, b) => {
        const catA = (a.category || '').toUpperCase();
        const catB = (b.category || '').toUpperCase();
        if (catA !== catB) return catA.localeCompare(catB);
        return (a.asset_code || '').localeCompare(b.asset_code || '');
      });

      sortedFixed.forEach(item => {
        fixedData.push([
          seq++,
          item.category || '',
          item.asset_code || '',
          item.asset_date ? String(item.asset_date).slice(0, 10) : '',
          item.item_name || '',
          item.brand || '',
          item.model || '',
          item.serial_num || '',
          item.key_specification || '',
          item.supplier || '',
          item.room_name || '',
          item.floor || '',
          item.current_user || '',
          item.admin_password || '',
          item.user_email || '',
          item.hostname || '',
          item.ip_lan || '',
          item.ip_address_lan_secondary || '',
          item.ip_address_wan || '',
          item.issue_date ? String(item.issue_date).slice(0, 10) : '',
          item.purchase_date ? String(item.purchase_date).slice(0, 10) : '',
          item.invoice_ref || '',
          item.quantity || 1,
          item.unit_price || 0,
          item.before_dis_vat_price || 0,
          item.grand_total || 0,
          item.win_license || '',
          item.ms_license || '',
          item.ms_account_email || '',
          item.ms_account_password || '',
          item.remark || '',
          item.status || 'Active'
        ]);
      });

      const wsFixed = XLSX.utils.aoa_to_sheet(fixedData);
      XLSX.utils.book_append_sheet(wb, wsFixed, 'FixAssets ');

      // --- SHEET 2: Assets Control (Clean Flat Table with Category in Col B & ASSET CODE in Col C) ---
      const controlData: any[] = [];
      controlData.push([orgTitle]);
      controlData.push(['ASSETS CONTROL REGISTER (Assets Control)']);
      controlData.push([]);

      // Table Header Row: Col A is 'No', Col B is 'CATEGORY', Col C is 'ASSET CODE' (renamed from 'AC code in CMS')
      const controlHeader = [
        'No', 'CATEGORY', 'ASSET CODE', 'ITEM NAME', 'BRAND', 'MODEL', 'SERIAL NUM',
        'KEY SPECIFICATION', 'SUPPLIER', 'ROOM NO/NAME', 'FLOOR', 'CURRENT USER', 'REMARK', 'STATUS'
      ];
      controlData.push(controlHeader);

      let cSeq = 1;
      const sortedControl = [...controlAssets].sort((a, b) => {
        const catA = (a.category || '').toUpperCase();
        const catB = (b.category || '').toUpperCase();
        if (catA !== catB) return catA.localeCompare(catB);
        return (a.ac_code_cms || '').localeCompare(b.ac_code_cms || '');
      });

      sortedControl.forEach(item => {
        controlData.push([
          cSeq++,
          item.category || '',
          item.ac_code_cms || '',
          item.item_name || '',
          item.brand || '',
          item.model || '',
          item.serial_num || '',
          item.key_specification || '',
          item.supplier || '',
          item.room_name || '',
          item.floor || '',
          item.current_user || '',
          item.remark || '',
          item.status || 'Active'
        ]);
      });

      const wsControl = XLSX.utils.aoa_to_sheet(controlData);
      XLSX.utils.book_append_sheet(wb, wsControl, 'Assets Control');

      const fileName = `Khema_Global_Asset_Register_${selectedBu.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast(`Exported clean register workbook to ${fileName}!`, 'success');
    } catch (e: any) {
      showToast('Export failed: ' + e.message, 'error');
    }
  };

  // --- EXCEL IMPORT (Validates data, checks headers, sanitizes dates, and tracks row counts) ---
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file extension
    const validExtensions = ['.xlsx', '.xls'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setImportValidationError(`Invalid file format "${file.name}". Please upload a valid Microsoft Excel workbook (.xlsx or .xls).`);
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });

        const importedFixed: any[] = [];
        const importedControl: any[] = [];
        let totalScannedFixed = 0;
        let totalScannedControl = 0;
        let skippedFixed = 0;
        let skippedControl = 0;
        let dateVerifiedCount = 0;

        // Helper to locate column index from header row
        const getColIdx = (headers: string[], names: string[]): number => {
          for (let i = 0; i < headers.length; i++) {
            const h = String(headers[i] || '').trim().toUpperCase();
            if (names.some(n => h === n.toUpperCase() || h.includes(n.toUpperCase()))) {
              return i;
            }
          }
          return -1;
        };

        const targetBu = selectedBu !== 'All BUs' ? selectedBu : 'Khema BKK';

        // 1. Parse FixAssets sheet
        const sheetFixName = Object.keys(wb.Sheets).find(s => 
          s.trim().toLowerCase() === 'fixassets' || 
          s.toLowerCase().includes('fixed') || 
          s.toLowerCase().includes('fixasset')
        ) || wb.SheetNames[0];

        const sheetFix = wb.Sheets[sheetFixName];
        if (sheetFix) {
          const rows: any[][] = XLSX.utils.sheet_to_json(sheetFix, { header: 1 });
          let headerIdx = -1;
          for (let i = 0; i < Math.min(rows.length, 12); i++) {
            if (rows[i] && rows[i].some((cell: any) => {
              const str = String(cell || '').toUpperCase();
              return str.includes('ASSET CODE') || str.includes('AC CODE') || str.includes('ASSET NO');
            })) {
              headerIdx = i;
              break;
            }
          }

          if (headerIdx !== -1) {
            const h = rows[headerIdx].map((c: any) => String(c || '').trim());
            const colCategory = getColIdx(h, ['CATEGORY', 'ASSETS CATEGORY']);
            const colAssetCode = getColIdx(h, ['ASSET CODE', 'ASSET_CODE', 'ASSETCODE', 'ASSETS CODE', 'ASSET NO', 'AC CODE', 'CODE']);
            const colBu = getColIdx(h, ['BU', 'BU NAME', 'BUSINESS UNIT', 'BRANCH', 'CAMPUS']);
            const colAssetDate = getColIdx(h, ['ASSET DATE', 'DATE', 'PURCHASE DATE', 'ISSUE DATE', 'DATE ACQUIRED']);
            const colPurchaseDate = getColIdx(h, ['PURCHASE DATE']);
            const colIssueDate = getColIdx(h, ['ISSUE DATE']);
            const colItemName = getColIdx(h, ['ITEM NAME']);
            const colBrand = getColIdx(h, ['BRAND']);
            const colModel = getColIdx(h, ['MODEL']);
            const colSerial = getColIdx(h, ['SERIAL NUM', 'SERIAL']);
            const colSpec = getColIdx(h, ['KEY SPECIFICATION', 'SPECIFICATION']);
            const colSupplier = getColIdx(h, ['SUPPLIER']);
            const colRoom = getColIdx(h, ['ROOM NO/NAME', 'ROOM NAME', 'ROOM']);
            const colFloor = getColIdx(h, ['FLOOR']);
            const colUser = getColIdx(h, ['CURRENT USER', 'USER']);
            const colAdminPwd = getColIdx(h, ['ADMIN PASSWORD']);
            const colUserEmail = getColIdx(h, ['USER EMAIL', 'EMAIL']);
            const colHostname = getColIdx(h, ['HOSTNAME']);
            const colIpLan = getColIdx(h, ['IP LAN']);
            const colIpSec = getColIdx(h, ['IP ADDRESS LAN (SECONDARY)']);
            const colIpWan = getColIdx(h, ['IP ADDRESS WAN']);
            const colQty = getColIdx(h, ['QUANTITY', 'QTY']);
            const colUnitPrice = getColIdx(h, ['UNIT PRICE']);
            const colBeforeDis = getColIdx(h, ['BEFORE DIS VAT PRICE']);
            const colGrandTotal = getColIdx(h, ['GRAND TOTAL']);
            const colWinLicense = getColIdx(h, ['WIN LICENSE']);
            const colMsLicense = getColIdx(h, ['MS LICENSE']);
            const colRemark = getColIdx(h, ['REMARK']);
            const colStatus = getColIdx(h, ['STATUS']);

            for (let i = headerIdx + 1; i < rows.length; i++) {
              const r = rows[i];
              if (!r || r.length === 0) continue;

              // Read asset code with multiple fallbacks
              let assetCodeVal = colAssetCode !== -1 ? r[colAssetCode] : undefined;
              if (!assetCodeVal || String(assetCodeVal).trim() === '') {
                // Check standard adjacent columns (Col C, Col B, Col D)
                if (r[2] && String(r[2]).trim() !== '' && !String(r[2]).toUpperCase().includes('CODE')) {
                  assetCodeVal = r[2];
                } else if (r[1] && String(r[1]).trim() !== '' && !String(r[1]).toUpperCase().includes('CATEGORY') && !String(r[1]).includes('*')) {
                  assetCodeVal = r[1];
                } else if (r[3] && String(r[3]).trim() !== '' && !String(r[3]).includes('-')) {
                  assetCodeVal = r[3];
                }
              }

              const codeStr = String(assetCodeVal || '').trim();

              // If row has no valid asset code, check if it is a category header banner or total row to skip safely
              if (!codeStr || codeStr.toUpperCase() === 'ASSET CODE' || codeStr.toUpperCase() === 'TOTAL' || codeStr.startsWith('TOTAL')) {
                // If it's a category banner or empty spacer, safely skip without counting as a valid asset row
                continue;
              }

              totalScannedFixed++;

              let rawCategory = colCategory !== -1 ? r[colCategory] : (r[1] || 'COMPUTER');
              // Clean any legacy asterisk or roman numeral prefixes (e.g. "*COMPUTER" -> "COMPUTER", "I. *COMPUTER" -> "COMPUTER")
              const cleanCategory = String(rawCategory || '')
                .replace(/^[IVXLCDMivxlcdm]+\.\s*\*?/g, '')
                .replace(/^[\s*]+|[\s*]+$/g, '')
                .trim() || 'COMPUTER';

              // Determine BU assignment: column value > targetBu > code prefix
              let rowBu = targetBu;
              if (colBu !== -1 && r[colBu] && String(r[colBu]).trim() !== '') {
                const bCandidate = String(r[colBu]).trim();
                const matchedBu = BUSINESS_UNITS.find(b => b.toLowerCase() === bCandidate.toLowerCase());
                if (matchedBu) rowBu = matchedBu;
              } else if (selectedBu === 'All BUs') {
                if (codeStr.startsWith('KBPH')) rowBu = 'Khema BKK';
                else if (codeStr.startsWith('K2PH') || codeStr.startsWith('K2FF') || codeStr.startsWith('K2OE')) rowBu = 'Khema BKK';
                else if (codeStr.startsWith('KGPH')) rowBu = 'Khema Global';
                else if (codeStr.startsWith('SKPH')) rowBu = 'Sakal 2004';
              }

              // Parse date: prioritize explicit column, or check standard adjacent positions
              let rawDateVal = colAssetDate !== -1 ? r[colAssetDate] : null;
              if (rawDateVal === null || rawDateVal === undefined || rawDateVal === '') {
                if (colPurchaseDate !== -1) rawDateVal = r[colPurchaseDate];
                else if (colIssueDate !== -1) rawDateVal = r[colIssueDate];
                else if (r[3] && (String(r[3]).includes('-') || String(r[3]).includes('/') || typeof r[3] === 'number')) rawDateVal = r[3];
                else if (r[2] && (String(r[2]).includes('-') || String(r[2]).includes('/') || typeof r[2] === 'number')) rawDateVal = r[2];
              }
              const parsedDate = parseExcelDate(rawDateVal);
              if (parsedDate) {
                dateVerifiedCount++;
              }

              importedFixed.push({
                bu_name: rowBu,
                asset_code: codeStr,
                asset_date: parsedDate,
                purchase_date: parsedDate,
                issue_date: parsedDate,
                category: cleanCategory,
                item_name: (colItemName !== -1 ? r[colItemName] : r[4]) || 'Device',
                brand: (colBrand !== -1 ? r[colBrand] : r[5]) || 'General',
                model: (colModel !== -1 ? r[colModel] : r[6]) || '',
                serial_num: (colSerial !== -1 ? r[colSerial] : r[7]) || '',
                key_specification: (colSpec !== -1 ? r[colSpec] : r[8]) || '',
                supplier: (colSupplier !== -1 ? r[colSupplier] : r[9]) || '',
                room_name: (colRoom !== -1 ? r[colRoom] : r[10]) || 'General',
                floor: (colFloor !== -1 ? r[colFloor] : r[11]) || 'G',
                current_user: (colUser !== -1 ? r[colUser] : r[12]) || '',
                admin_password: (colAdminPwd !== -1 ? r[colAdminPwd] : r[13]) || '',
                user_email: (colUserEmail !== -1 ? r[colUserEmail] : r[14]) || '',
                hostname: (colHostname !== -1 ? r[colHostname] : r[15]) || '',
                ip_lan: (colIpLan !== -1 ? r[colIpLan] : r[16]) || '',
                ip_address_lan_secondary: (colIpSec !== -1 ? r[colIpSec] : r[17]) || '',
                ip_address_wan: (colIpWan !== -1 ? r[colIpWan] : r[18]) || '',
                quantity: parseInt(colQty !== -1 ? r[colQty] : r[22], 10) || 1,
                unit_price: parseFloat(colUnitPrice !== -1 ? r[colUnitPrice] : r[23]) || 0,
                before_dis_vat_price: parseFloat(colBeforeDis !== -1 ? r[colBeforeDis] : r[24]) || 0,
                grand_total: parseFloat(colGrandTotal !== -1 ? r[colGrandTotal] : r[25]) || 0,
                win_license: (colWinLicense !== -1 ? r[colWinLicense] : r[26]) || '',
                ms_license: (colMsLicense !== -1 ? r[colMsLicense] : r[27]) || '',
                remark: (colRemark !== -1 ? r[colRemark] : r[30]) || '',
                status: (colStatus !== -1 ? r[colStatus] : r[31]) || 'Active'
              });
            }
          }
        }

        // 2. Parse Assets Control sheet
        const sheetControlName = Object.keys(wb.Sheets).find(s => 
          s.toLowerCase().includes('control') || 
          s.toLowerCase().includes('asset control')
        ) || (wb.SheetNames.length > 1 ? wb.SheetNames[1] : null);

        const sheetControl = sheetControlName ? wb.Sheets[sheetControlName] : null;
        if (sheetControl) {
          const rows: any[][] = XLSX.utils.sheet_to_json(sheetControl, { header: 1 });
          let headerIdx = -1;
          for (let i = 0; i < Math.min(rows.length, 12); i++) {
            if (rows[i] && rows[i].some((cell: any) => {
              const str = String(cell || '').toUpperCase();
              return str.includes('ASSET CODE') || str.includes('AC CODE') || str.includes('AC CODE IN CMS');
            })) {
              headerIdx = i;
              break;
            }
          }

          if (headerIdx !== -1) {
            const h = rows[headerIdx].map((c: any) => String(c || '').trim());
            const colCategory = getColIdx(h, ['CATEGORY', 'ASSETS CATEGORY']);
            const colCode = getColIdx(h, ['ASSET CODE', 'AC CODE', 'AC CODE IN CMS', 'CODE']);
            const colBu = getColIdx(h, ['BU', 'BU NAME', 'BUSINESS UNIT', 'BRANCH', 'CAMPUS']);
            const colItemName = getColIdx(h, ['ITEM NAME']);
            const colBrand = getColIdx(h, ['BRAND']);
            const colModel = getColIdx(h, ['MODEL']);
            const colSerial = getColIdx(h, ['SERIAL NUM', 'SERIAL']);
            const colSpec = getColIdx(h, ['KEY SPECIFICATION', 'SPECIFICATION']);
            const colSupplier = getColIdx(h, ['SUPPLIER']);
            const colRoom = getColIdx(h, ['ROOM NO/NAME', 'ROOM NAME', 'ROOM']);
            const colFloor = getColIdx(h, ['FLOOR']);
            const colUser = getColIdx(h, ['CURRENT USER', 'USER']);
            const colRemark = getColIdx(h, ['REMARK']);
            const colStatus = getColIdx(h, ['STATUS']);

            for (let i = headerIdx + 1; i < rows.length; i++) {
              const r = rows[i];
              if (!r || r.length === 0) continue;

              let codeVal = colCode !== -1 ? r[colCode] : undefined;
              if (!codeVal || String(codeVal).trim() === '') {
                if (r[2] && String(r[2]).trim() !== '' && !String(r[2]).toUpperCase().includes('CODE')) codeVal = r[2];
                else if (r[1] && String(r[1]).trim() !== '' && !String(r[1]).toUpperCase().includes('CATEGORY')) codeVal = r[1];
              }

              const codeStr = String(codeVal || '').trim();
              if (!codeStr || codeStr.toUpperCase() === 'ASSET CODE' || codeStr.toUpperCase() === 'AC CODE' || codeStr.toUpperCase() === 'TOTAL') {
                continue;
              }

              totalScannedControl++;

              let rawCategory = colCategory !== -1 ? r[colCategory] : (r[1] || 'PRINTER');
              const cleanCategory = String(rawCategory || '')
                .replace(/^[IVXLCDMivxlcdm]+\.\s*\*?/g, '')
                .replace(/^[\s*]+|[\s*]+$/g, '')
                .trim() || 'PRINTER';

              let rowBu = targetBu;
              if (colBu !== -1 && r[colBu] && String(r[colBu]).trim() !== '') {
                const bCandidate = String(r[colBu]).trim();
                const matchedBu = BUSINESS_UNITS.find(b => b.toLowerCase() === bCandidate.toLowerCase());
                if (matchedBu) rowBu = matchedBu;
              } else if (selectedBu === 'All BUs') {
                if (codeStr.startsWith('KB-') || codeStr.startsWith('KBPH')) rowBu = 'Khema BKK';
                else if (codeStr.startsWith('K2-') || codeStr.startsWith('K2PH')) rowBu = 'Khema BKK';
                else if (codeStr.startsWith('KG-') || codeStr.startsWith('KGPH')) rowBu = 'Khema Global';
                else if (codeStr.startsWith('SK-') || codeStr.startsWith('SKPH')) rowBu = 'Sakal 2004';
              }

              importedControl.push({
                bu_name: rowBu,
                ac_code_cms: codeStr,
                category: cleanCategory,
                item_name: (colItemName !== -1 ? r[colItemName] : r[3]) || 'Equipment',
                brand: (colBrand !== -1 ? r[colBrand] : r[4]) || 'General',
                model: (colModel !== -1 ? r[colModel] : r[5]) || '',
                serial_num: (colSerial !== -1 ? r[colSerial] : r[6]) || '',
                key_specification: (colSpec !== -1 ? r[colSpec] : r[7]) || '',
                supplier: (colSupplier !== -1 ? r[colSupplier] : r[8]) || '',
                room_name: (colRoom !== -1 ? r[colRoom] : r[9]) || 'General',
                floor: (colFloor !== -1 ? r[colFloor] : r[10]) || 'G',
                current_user: (colUser !== -1 ? r[colUser] : r[11]) || '',
                remark: (colRemark !== -1 ? r[colRemark] : r[12]) || '',
                status: (colStatus !== -1 ? r[colStatus] : r[13]) || 'Active'
              });
            }
          }
        }

        // Pre-validation: Must have at least 1 valid row
        if (importedFixed.length === 0 && importedControl.length === 0) {
          setImportValidationError(
            `No valid asset records could be parsed from "${file.name}". Please ensure the workbook has headers named "ASSET CODE" (for FixAssets) or "AC CODE" (for Assets Control), and contains non-empty asset rows.`
          );
          setIsImporting(false);
          e.target.value = '';
          return;
        }

        // Send to backend
        const res = await fetch('/api/it-assets/import-excel', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            bu_name: targetBu,
            fixedAssets: importedFixed,
            controlAssets: importedControl
          })
        });

        if (res.ok) {
          const resp = await res.json();
          // Alert user with full asset row count modal
          setImportSummary({
            fileName: file.name,
            targetBu,
            totalAssets: resp.totalAssets || (importedFixed.length + importedControl.length),
            fixedTotal: resp.fixedTotal !== undefined ? resp.fixedTotal : importedFixed.length,
            fixedNew: resp.fixedNew || 0,
            fixedUpdated: resp.fixedUpdated || 0,
            fixedUnchanged: resp.fixedUnchanged || 0,
            controlTotal: resp.controlTotal !== undefined ? resp.controlTotal : importedControl.length,
            controlNew: resp.controlNew || 0,
            controlUpdated: resp.controlUpdated || 0,
            controlUnchanged: resp.controlUnchanged || 0,
            totalScannedFixed,
            totalScannedControl,
            skippedFixed,
            skippedControl,
            dateVerifiedCount
          });

          showToast(
            `✓ Successfully imported ${resp.totalAssets || (importedFixed.length + importedControl.length)} assets (${importedFixed.length} Fixed, ${importedControl.length} Control)!`,
            'success'
          );
          fetchAllData();
        } else {
          const errData = await res.json().catch(() => ({}));
          setImportValidationError(errData.error || 'The server encountered an error processing the import. Please check data formatting.');
        }
      } catch (err: any) {
        setImportValidationError('Error parsing Excel file: ' + err.message);
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium border transition-all ${
          toastMessage.type === 'error' 
            ? 'bg-rose-50 text-rose-800 border-rose-200' 
            : toastMessage.type === 'info'
            ? 'bg-sky-50 text-sky-800 border-sky-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle size={18} className="text-rose-600" /> : <CheckCircle2 size={18} className="text-emerald-600" />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-70"><X size={14} /></button>
        </div>
      )}

      {/* Top Banner: Multi-BU Selector & Module Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Monitor size={22} strokeWidth={2.3} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  IT Assets Management
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {selectedBu === 'All BUs' ? 'KHEMA GLOBAL CO., LTD (CONSOLIDATED)' : `KHEMA GLOBAL - ${selectedBu.toUpperCase()}`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Fixed Assets Register (31-Col) · Assets Control (13-Col) · Multi-Campus Yearly Audit Scanner
              </p>
            </div>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700">
              <span className="text-slate-400 font-medium">Fixed Val: </span>
              <span className="font-bold text-slate-900 font-mono">
                ${(analytics?.totalFixedValuation || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-800 font-bold">
              <span className="text-indigo-600 font-medium">Fixed Assets: </span>
              <span>{fixedAssets.length}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 font-bold">
              <span className="text-emerald-600 font-medium">Control Assets: </span>
              <span>{controlAssets.length}</span>
            </div>
          </div>
        </div>

        {/* Business Unit Switcher Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Building2 size={13} /> Business Unit:
            </span>
            <div className="inline-flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/60">
              {BUSINESS_UNITS.map(bu => (
                <button
                  key={bu}
                  type="button"
                  onClick={() => setSelectedBu(bu)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedBu === bu
                      ? 'bg-white text-indigo-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {bu}
                </button>
              ))}
            </div>
          </div>

          {/* Excel Import & Export Tools */}
          <div className="flex items-center gap-2">
            <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-2xs ${isImporting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
              <Upload size={13} className={`text-slate-500 ${isImporting ? 'animate-spin' : ''}`} />
              <span>{isImporting ? 'Validating...' : 'Import .xlsx'}</span>
              <input type="file" accept=".xlsx,.xls" disabled={isImporting} onChange={handleImportExcel} className="hidden" />
            </label>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
              title="Export exact two-sheet workbook (FixAssets and Assets Control)"
            >
              <Download size={13} className="text-slate-500" />
              <span>Export .xlsx</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveSubTab('overview')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={14} className={activeSubTab === 'overview' ? 'text-indigo-600' : 'text-slate-400'} />
              <span>Executive Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('fixed')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'fixed'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor size={14} className={activeSubTab === 'fixed' ? 'text-indigo-600' : 'text-slate-400'} />
              <span>Fixed Assets Register (FixAssets)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold">
                {fixedAssets.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('control')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'control'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={14} className={activeSubTab === 'control' ? 'text-indigo-600' : 'text-slate-400'} />
              <span>Assets Control Register (Assets Control)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold">
                {controlAssets.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('audit')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'audit'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scan size={14} className={activeSubTab === 'audit' ? 'text-indigo-600' : 'text-slate-400'} />
              <span>Yearly Physical Audit Scanner</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                2026
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('config')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'config'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders size={14} className={activeSubTab === 'config' ? 'text-indigo-600' : 'text-slate-400'} />
              <span>Asset Configuration</span>
            </button>
          </div>

          {/* Quick Action Button */}
          {activeSubTab === 'fixed' && (
            <Button
              onClick={handleOpenAddFixed}
              className="inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-2xs"
            >
              <Plus size={14} />
              <span>Register Fixed Asset</span>
            </Button>
          )}
          {activeSubTab === 'control' && (
            <Button
              onClick={handleOpenAddControl}
              className="inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-2xs"
            >
              <Plus size={14} />
              <span>Register Control Asset</span>
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: EXECUTIVE ASSET DASHBOARD                                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Fixed Assets Valuation */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Fixed Capital</span>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <DollarSign size={16} />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                  ${(analytics?.totalFixedValuation || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>{analytics?.totalFixedCount || 0} Registered Units</span>
                  <span className="text-indigo-600 font-semibold">{selectedBu}</span>
                </div>
              </div>
            </div>

            {/* Total Controlled Equipment */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Controlled Peripherals</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Layers size={16} />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-emerald-900 tracking-tight font-mono">
                  {(analytics?.totalControlCount || 0)} Units
                </div>
                <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                  Printers, WiFi, Fingerprint, CCTV & Peripherals
                </div>
              </div>
            </div>

            {/* Plan Dispose & Refresh Alerts */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan Dispose / Aged</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle size={16} />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-amber-900 tracking-tight font-mono">
                  {(analytics?.planDisposeCount || 0)} Units
                </div>
                <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>{analytics?.refreshAlerts?.length || 0} need 5-yr refresh</span>
                  <span className="text-amber-700 font-semibold">Flagged</span>
                </div>
              </div>
            </div>

            {/* Active Networked Endpoints */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Network Endpoints</span>
                <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Wifi size={16} />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                  {(analytics?.networkedEndpointsCount || 0)} Online
                </div>
                <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                  Assigned IP LAN / Static Hostnames
                </div>
              </div>
            </div>
          </div>

          {/* Multi-BU Valuation Comparison Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-4">
              <Building2 size={16} className="text-indigo-600" />
              <span>Multi-Business Unit Valuation & Equipment Density</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {['Khema Global', 'Khema TK', 'Khema BKK', 'Sakal 2004'].map((bu) => {
                const data = analytics?.buValuationMap?.[bu] || { valuation: 0, fixedCount: 0, controlCount: 0 };
                return (
                  <div key={bu} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{bu}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                        {data.fixedCount + data.controlCount} Total Assets
                      </span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 font-mono">
                      ${data.valuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/50">
                      <span>Fixed: {data.fixedCount} units</span>
                      <span>Control: {data.controlCount} units</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Charts: Category Breakdown & Floor Density */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 pb-3 border-b border-slate-100">
                <Layers size={16} className="text-indigo-600" />
                <span>Equipment Distribution by Category</span>
              </h3>
              <div className="h-64 w-full">
                {analytics?.categoryData && analytics.categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-25} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                      <Bar dataKey="count" name="Total Units" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No asset data recorded</div>
                )}
              </div>
            </div>

            {/* Floor Density Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 pb-3 border-b border-slate-100">
                <Building2 size={16} className="text-emerald-600" />
                <span>Equipment Density by Floor (G to 10)</span>
              </h3>
              <div className="h-64 w-full">
                {analytics?.floorData && analytics.floorData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.floorData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="floor" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                      <Bar dataKey="count" name="Assets Count" fill="#059669" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No floor distribution data</div>
                )}
              </div>
            </div>
          </div>

          {/* Hardware Age & Refresh Alerts (5+ Years or Plan Dispose) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <ShieldAlert size={16} className="text-amber-600" />
                  <span>Hardware Refresh & Decommission Alerts</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Assets older than 5 years or tagged as "Plan dispose"</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {analytics?.refreshAlerts?.length || 0} Assets Require Action
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/70">
                  <tr>
                    <th className="py-2.5 px-3">Asset Code</th>
                    <th className="py-2.5 px-3">BU</th>
                    <th className="py-2.5 px-3">Equipment</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Age</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {analytics?.refreshAlerts && analytics.refreshAlerts.length > 0 ? (
                    analytics.refreshAlerts.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{item.asset_code}</td>
                        <td className="py-2.5 px-3 text-slate-700">{item.bu_name}</td>
                        <td className="py-2.5 px-3 text-slate-800">
                          {item.brand} {item.model || item.item_name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">Floor {item.floor} ({item.room_name})</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{item.age_years > 0 ? `${item.age_years} yrs` : 'Flagged'}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setActiveSubTab('fixed');
                              setSearchTerm(item.asset_code);
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            Inspect &rarr;
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">No hardware overdue for refresh or tagged for disposal</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: FIXED ASSETS REGISTER (FixAssets - 31 Columns)                */}
      {/* ========================================================================= */}
      {activeSubTab === 'fixed' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-4 animate-in fade-in duration-200">
          {/* Top Controls: Register Title, Search, BU & Location & Status Filters + Expand/Collapse */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Monitor size={16} className="text-indigo-600" />
                <span className="text-xs font-bold text-slate-900 tracking-tight">
                  Fixed Assets Register (31 Columns)
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {filteredFixedAssets.length} Assets
                </span>
              </div>

              {/* Expand / Collapse All Category Rows */}
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={handleExpandAllFixed}
                  className="px-2 py-1 rounded-lg text-slate-700 hover:text-slate-900 font-medium text-[11px] flex items-center gap-1 hover:bg-white transition-all"
                  title="Expand all category sections"
                >
                  <ChevronDown size={12} /> Expand All
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAllFixed}
                  className="px-2 py-1 rounded-lg text-slate-700 hover:text-slate-900 font-medium text-[11px] flex items-center gap-1 hover:bg-white transition-all"
                  title="Collapse all category sections"
                >
                  <ChevronRight size={12} /> Collapse All
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative w-56 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search code, brand, host, IP, user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* BU Filter */}
              <select
                value={selectedBu}
                onChange={(e) => setSelectedBu(e.target.value as BusinessUnit)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                title="Filter by Business Unit"
              >
                {BUSINESS_UNITS.map(bu => (
                  <option key={bu} value={bu}>{bu === 'All BUs' ? 'All Business Units' : bu}</option>
                ))}
              </select>

              {/* Location Filter (Changed from Floor to Location) */}
              <select
                value={filterFloor}
                onChange={(e) => setFilterFloor(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none max-w-[180px] truncate"
                title="Filter by Location or Floor"
              >
                {availableLocationOptions.map(opt => (
                  <option key={opt.key} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none max-w-[150px] truncate"
              >
                <option value="All Categories">All Categories</option>
                {allFixedCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Plan dispose">Plan dispose</option>
                <option value="In Repair">In Repair</option>
                <option value="Disposed">Disposed</option>
                <option value="Spare">Spare</option>
              </select>
            </div>
          </div>

          {/* Categorized Table with Roman Numeral Divider Headers (Collapsible on click) */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Asset Code</th>
                  <th className="py-2.5 px-3">BU</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">Brand & Model</th>
                  <th className="py-2.5 px-3">Serial Num</th>
                  <th className="py-2.5 px-3">Key Specs</th>
                  <th className="py-2.5 px-3">Location / Room</th>
                  <th className="py-2.5 px-3">Current User</th>
                  <th className="py-2.5 px-3">Hostname</th>
                  <th className="py-2.5 px-3">IP LAN</th>
                  <th className="py-2.5 px-3">IP LAN Secondary</th>
                  <th className="py-2.5 px-3">Admin Password</th>
                  <th className="py-2.5 px-3">User Email</th>
                  <th className="py-2.5 px-3">Win License</th>
                  <th className="py-2.5 px-3">MS License</th>
                  <th className="py-2.5 px-3">MS Account</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3">Purchase Date</th>
                  <th className="py-2.5 px-3">Invoice Ref</th>
                  <th className="py-2.5 px-3">Qty</th>
                  <th className="py-2.5 px-3">Unit Price</th>
                  <th className="py-2.5 px-3">Grand Total</th>
                  <th className="py-2.5 px-3">Remark</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupedFixedAssets.length > 0 ? (
                  groupedFixedAssets.map(([cat, items], catIdx) => {
                    const roman = ROMAN_NUMERALS[catIdx] || String(catIdx + 1);
                    const isCollapsed = !!collapsedFixedCategories[cat];
                    return (
                      <React.Fragment key={cat}>
                        {/* Roman Numeral Category Row (Clickable to Hide/Show) */}
                        <tr
                          onClick={() => toggleFixedCategory(cat)}
                          className="bg-slate-100/80 hover:bg-slate-200/80 cursor-pointer select-none border-y border-slate-200 transition-colors"
                          title="Click to hide/show category items"
                        >
                          <td colSpan={30} className="py-2 px-3 font-bold text-slate-800 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="p-0.5 rounded text-indigo-700 hover:bg-slate-300/60 transition-transform">
                                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                </span>
                                <span className="text-indigo-600 font-mono mr-0.5">{roman}.</span>
                                <span>*{cat.toUpperCase()}</span>
                                <span className="text-[11px] font-normal text-slate-500 ml-1">({items.length} units)</span>
                                {isCollapsed && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-normal">
                                    Collapsed · Click to view
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 font-normal">
                                {isCollapsed ? 'Show Category ▾' : 'Hide Category ▴'}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {!isCollapsed && items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 flex items-center gap-1.5">
                              <span>{item.asset_code}</span>
                              <button onClick={() => copyToClipboard(item.asset_code, 'Asset Code')} title="Copy Code" className="text-slate-400 hover:text-slate-600">
                                <Copy size={11} />
                              </button>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">{item.bu_name}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 text-xs">
                              {formatDisplayDate(item.asset_date || item.purchase_date || item.issue_date)}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{item.item_name}</td>
                            <td className="py-2.5 px-3 text-slate-700">
                              <span className="font-semibold">{item.brand}</span> {item.model}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">{item.serial_num || '--'}</td>
                            <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-600" title={item.key_specification}>
                              {item.key_specification || '--'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              <span className="font-semibold text-slate-900">Fl {item.floor}</span> · {item.room_name}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">{item.current_user || '--'}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-800">{item.hostname || '--'}</td>
                            <td className="py-2.5 px-3 font-mono text-indigo-600 font-semibold">{item.ip_lan || '--'}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">{item.ip_address_lan_secondary || '--'}</td>
                            <td className="py-2.5 px-3 font-mono">
                              {item.admin_password ? (
                                <div className="flex items-center gap-1.5">
                                  <span>{revealedPasswords[item.id] ? item.admin_password : '••••••••'}</span>
                                  <button onClick={() => togglePasswordVisibility(item.id)} className="text-slate-400 hover:text-slate-600">
                                    {revealedPasswords[item.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                  </button>
                                  <button onClick={() => copyToClipboard(item.admin_password!, 'Admin Password')} className="text-slate-400 hover:text-slate-600">
                                    <Copy size={11} />
                                  </button>
                                </div>
                              ) : '--'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{item.user_email || '--'}</td>
                            <td className="py-2.5 px-3 text-slate-600">{item.win_license || '--'}</td>
                            <td className="py-2.5 px-3 text-slate-600">{item.ms_license || '--'}</td>
                            <td className="py-2.5 px-3 text-slate-600">{item.ms_account_email || '--'}</td>
                            <td className="py-2.5 px-3 text-slate-600">{item.supplier || '--'}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 text-xs">
                              {formatDisplayDate(item.purchase_date || item.asset_date)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono">{item.invoice_ref || '--'}</td>
                            <td className="py-2.5 px-3 text-slate-800">{item.quantity || 1}</td>
                            <td className="py-2.5 px-3 font-mono">${Number(item.unit_price || 0).toLocaleString()}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">${Number(item.grand_total || 0).toLocaleString()}</td>

                            <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-500" title={item.remark}>
                              {item.remark || '--'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                item.status === 'Active' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : item.status === 'Plan dispose'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : item.status === 'In Repair'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenTransfer('fixed', item)}
                                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                                  title="Transfer Floor / Room"
                                >
                                  <ArrowLeftRight size={13} />
                                </button>
                                <button
                                  onClick={() => handleOpenEditFixed(item)}
                                  className="p-1 rounded-lg hover:bg-indigo-50 text-indigo-600"
                                  title="Edit Asset"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteFixed(item)}
                                  className="p-1 rounded-lg hover:bg-rose-50 text-rose-600"
                                  title="Delete Asset"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={30} className="py-10 text-center text-slate-400">No fixed assets match the current filter</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: ASSETS CONTROL REGISTER (Assets Control - 13 Columns)        */}
      {/* ========================================================================= */}
      {activeSubTab === 'control' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-4 animate-in fade-in duration-200">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Layers size={15} className="text-emerald-600" />
                <span>Operational Peripherals & Equipment Control ({controlAssets.length} total)</span>
              </span>

              {/* Expand / Collapse All Category Rows */}
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={handleExpandAllControl}
                  className="px-2 py-1 rounded-lg text-slate-700 hover:text-slate-900 font-medium text-[11px] flex items-center gap-1 hover:bg-white transition-all"
                  title="Expand all category sections"
                >
                  <ChevronDown size={12} /> Expand All
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAllControl}
                  className="px-2 py-1 rounded-lg text-slate-700 hover:text-slate-900 font-medium text-[11px] flex items-center gap-1 hover:bg-white transition-all"
                  title="Collapse all category sections"
                >
                  <ChevronRight size={12} /> Collapse All
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative w-56 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search AC code, brand, room, user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
              </div>

              {/* BU Filter */}
              <select
                value={selectedBu}
                onChange={(e) => setSelectedBu(e.target.value as BusinessUnit)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                title="Filter by Business Unit"
              >
                {BUSINESS_UNITS.map(bu => (
                  <option key={bu} value={bu}>{bu === 'All BUs' ? 'All Business Units' : bu}</option>
                ))}
              </select>

              {/* Location Filter */}
              <select
                value={filterFloor}
                onChange={(e) => setFilterFloor(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none max-w-[180px] truncate"
                title="Filter by Location or Floor"
              >
                {availableLocationOptions.map(opt => (
                  <option key={opt.key} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none max-w-[150px] truncate"
              >
                <option value="All Categories">All Categories</option>
                {allControlCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Active">Active</option>
                <option value="In Repair">In Repair</option>
                <option value="Plan dispose">Plan dispose</option>
                <option value="Missing">Missing</option>
              </select>
            </div>
          </div>

          {/* 13-Column Table with Roman Category Dividers (Collapsible on click) */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Assets Category</th>
                  <th className="py-2.5 px-3">BU</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">Brand & Model</th>
                  <th className="py-2.5 px-3">Serial Num</th>
                  <th className="py-2.5 px-3">Key Specification</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3">Location / Room</th>
                  <th className="py-2.5 px-3">Current User</th>
                  <th className="py-2.5 px-3">Remark</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupedControlAssets.length > 0 ? (
                  groupedControlAssets.map(([cat, items], catIdx) => {
                    const roman = ROMAN_NUMERALS[catIdx] || String(catIdx + 1);
                    const isCollapsed = !!collapsedControlCategories[cat];
                    return (
                      <React.Fragment key={cat}>
                        {/* Roman Numeral Category Row (Clickable to Hide/Show) */}
                        <tr
                          onClick={() => toggleControlCategory(cat)}
                          className="bg-slate-100/80 hover:bg-slate-200/80 cursor-pointer select-none border-y border-slate-200 transition-colors"
                          title="Click to hide/show category items"
                        >
                          <td colSpan={14} className="py-2 px-3 font-bold text-slate-800 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="p-0.5 rounded text-emerald-700 hover:bg-slate-300/60 transition-transform">
                                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                </span>
                                <span className="text-emerald-600 font-mono mr-0.5">{roman}.</span>
                                <span>*{cat.toUpperCase()}</span>
                                <span className="text-[11px] font-normal text-slate-500 ml-1">({items.length} units)</span>
                                {isCollapsed && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-normal">
                                    Collapsed · Click to view
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 font-normal">
                                {isCollapsed ? 'Show Category ▾' : 'Hide Category ▴'}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {!isCollapsed && items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[11px]">
                                  <Tag size={10} className="text-emerald-600" />
                                  {item.category || cat}
                                </span>
                                {item.ac_code_cms && (
                                  <span className="font-mono text-xs font-semibold text-slate-500" title="CMS Control Code">
                                    ({item.ac_code_cms})
                                  </span>
                                )}
                                {item.ac_code_cms && (
                                  <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(item.ac_code_cms, 'Control Code'); }} 
                                    className="text-slate-400 hover:text-slate-600 p-0.5" 
                                    title="Copy control code"
                                  >
                                    <Copy size={11} />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">{item.bu_name}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{item.item_name}</td>
                            <td className="py-2.5 px-3 text-slate-700">
                              <span className="font-semibold">{item.brand}</span> {item.model}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{item.serial_num || '--'}</td>
                            <td className="py-2.5 px-3 max-w-[220px] truncate text-slate-600" title={item.key_specification}>
                              {item.key_specification || '--'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{item.supplier || '--'}</td>
                            <td className="py-2.5 px-3 text-slate-700">
                              <span className="font-semibold text-slate-900">Fl {item.floor}</span> · {item.room_name}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">{item.current_user || '--'}</td>
                            <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-500" title={item.remark}>
                              {item.remark || '--'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                item.status === 'Active' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : item.status === 'Missing'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : item.status === 'In Repair'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenTransfer('control', item)}
                                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                                  title="Transfer Location"
                                >
                                  <ArrowLeftRight size={13} />
                                </button>
                                <button
                                  onClick={() => handleOpenEditControl(item)}
                                  className="p-1 rounded-lg hover:bg-emerald-50 text-emerald-600"
                                  title="Edit Asset"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteControl(item)}
                                  className="p-1 rounded-lg hover:bg-rose-50 text-rose-600"
                                  title="Delete Asset"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={14} className="py-10 text-center text-slate-400">No controlled assets match the current filter</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: YEARLY PHYSICAL ASSET AUDIT & RECONCILIATION                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Scanner Console Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Scan size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Floor-by-Floor Physical Audit Sweep (Year 2026)</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live Reconciliation
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Scan or enter asset barcodes/tags on-site to verify physical room placement and flag mismatches
                  </p>
                </div>
              </div>

              {/* Sync Audit to Register Button */}
              <Button
                onClick={handleSyncAuditToRegister}
                disabled={syncingAudit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-bold py-2 px-4 shadow-sm"
              >
                {syncingAudit ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>⚡ Sync Audit to Register</span>
              </Button>
            </div>

            {/* Sweep Target Controls: BU & Floor Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Target Business Unit
                </label>
                <select
                  value={auditBu}
                  onChange={(e) => setAuditBu(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 text-xs font-semibold rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                >
                  <option value="Khema Global">Khema Global (HQ)</option>
                  <option value="Khema TK">Khema TK (Toul Kork / K2)</option>
                  <option value="Khema BKK">Khema BKK (Boeung Keng Kang)</option>
                  <option value="Sakal 2004">Sakal 2004 Branch</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Active Audit Floor
                </label>
                <select
                  value={auditFloor}
                  onChange={(e) => setAuditFloor(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs font-semibold rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
                >
                  {['G', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(fl => (
                    <option key={`audit-fl-${fl}`} value={fl}>Floor {fl}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Expected Assets on Floor {auditFloor}
                </label>
                <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium">
                  {fixedAssets.filter(f => f.bu_name === auditBu && f.floor === auditFloor).length} Fixed + {controlAssets.filter(c => c.bu_name === auditBu && c.floor === auditFloor).length} Control
                </div>
              </div>
            </div>

            {/* Barcode Scanner Input Form */}
            <form onSubmit={handleScanCode} className="space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                Scan or Type Asset Tag / Serial Number:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Scan size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. K2PH000084, K2-AC0001, BWQNRH3, W7ZK141689..."
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 shadow-sm"
                  />
                </div>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 text-xs font-bold">
                  <Search size={14} className="mr-1.5" />
                  <span>Verify Code</span>
                </Button>
              </div>
            </form>

            {/* Scan Result Pop-up Card */}
            {scanResult && (
              <div className={`p-4 rounded-xl border transition-all animate-in fade-in duration-200 ${
                scanResult.found 
                  ? scanResult.suggested_status === 'Verified (Matched)' 
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {scanResult.found ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-black/5">
                      <div className="flex items-center gap-2">
                        {scanResult.suggested_status === 'Verified (Matched)' ? (
                          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                        )}
                        <span className="font-bold text-sm font-mono">
                          {scanResult.item.asset_code || scanResult.item.ac_code_cms} · {scanResult.item.brand} {scanResult.item.model || scanResult.item.item_name}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        scanResult.suggested_status === 'Verified (Matched)' 
                          ? 'bg-emerald-200/70 text-emerald-900' 
                          : 'bg-amber-200/70 text-amber-900'
                      }`}>
                        {scanResult.suggested_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Expected BU: </span>
                        <span className="font-semibold text-slate-800">{scanResult.expected_bu}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Expected Floor: </span>
                        <span className="font-semibold text-slate-800">Floor {scanResult.expected_floor}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Expected Room: </span>
                        <span className="font-semibold text-slate-800">{scanResult.expected_room}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Current User: </span>
                        <span className="font-semibold text-slate-800">{scanResult.item.current_user || '--'}</span>
                      </div>
                    </div>

                    {/* Audit Reconciliation Input Controls */}
                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Reconciliation Status</label>
                        <select
                          value={auditCustomStatus}
                          onChange={(e) => setAuditCustomStatus(e.target.value as any)}
                          className="w-full bg-white border border-slate-300 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none"
                        >
                          <option value="Verified (Matched)">Verified (Matched)</option>
                          <option value="Location Mismatch">Location Mismatch (Relocated)</option>
                          <option value="Condition Changed">Condition Changed (Needs Disposal)</option>
                          <option value="Missing">Missing</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Current Found Room</label>
                        <input
                          type="text"
                          value={auditActualRoom}
                          onChange={(e) => setAuditActualRoom(e.target.value)}
                          placeholder="e.g. ICU Bed 4, Nurse Station"
                          className="w-full bg-white border border-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Audit Notes</label>
                        <input
                          type="text"
                          value={auditNotes}
                          onChange={(e) => setAuditNotes(e.target.value)}
                          placeholder="Condition, barcode sticker intact..."
                          className="w-full bg-white border border-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button variant="secondary" size="sm" onClick={() => setScanResult(null)} className="text-xs">
                        Dismiss
                      </Button>
                      <Button onClick={handleConfirmAuditFinding} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-4">
                        <Check size={14} className="mr-1" />
                        <span>Log Audit Finding</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <AlertCircle size={16} className="text-rose-600" />
                    <span>{scanResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Audit Verification Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Clock size={16} className="text-slate-500" />
                <span>2026 Audit Sweep Records ({auditList.length} logged items)</span>
              </h4>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {auditList.filter(a => a.synced_to_register === 1).length} Synced to Master
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Asset Code</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">BU</th>
                    <th className="py-2.5 px-3">Expected</th>
                    <th className="py-2.5 px-3">Found Location</th>
                    <th className="py-2.5 px-3">Audit Status</th>
                    <th className="py-2.5 px-3">Auditor</th>
                    <th className="py-2.5 px-3">Synced</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {auditList.length > 0 ? (
                    auditList.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 text-slate-500">{log.created_at ? log.created_at.slice(0, 10) : '--'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{log.asset_code}</td>
                        <td className="py-2.5 px-3 text-slate-700">{log.asset_type}</td>
                        <td className="py-2.5 px-3 text-slate-700">{log.bu_name}</td>
                        <td className="py-2.5 px-3 text-slate-500">Fl {log.expected_floor} ({log.expected_room})</td>
                        <td className="py-2.5 px-3 text-slate-800 font-semibold">Fl {log.actual_floor} ({log.actual_room})</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            log.status === 'Verified (Matched)'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : log.status === 'Location Mismatch'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : log.status === 'Condition Changed'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{log.audited_by || '--'}</td>
                        <td className="py-2.5 px-3">
                          {log.synced_to_register ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 size={12} /> Yes
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold flex items-center gap-1">
                              <Clock size={12} /> Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No physical audit sweeps recorded yet for Year 2026. Use the scanner above to begin!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 5: ASSET CONFIGURATION (Categories, BU & Location Tagging)       */}
      {/* ========================================================================= */}
      {activeSubTab === 'config' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Section Header */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sliders size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Asset Management Configuration
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full CRUD grid management for Categories, Business Units, and Customizable Location & Floor Tags
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchConfigData}
                disabled={loadingConfig}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Refresh configuration data"
              >
                <RefreshCw size={13} className={loadingConfig ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>

              {configActiveView === 'categories' && (
                <Button
                  onClick={handleOpenAddCategory}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-2 font-bold shadow-sm inline-flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Category
                </Button>
              )}
              {configActiveView === 'bus' && (
                <Button
                  onClick={handleOpenAddBu}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-2 font-bold shadow-sm inline-flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Business Unit
                </Button>
              )}
              {configActiveView === 'locations' && (
                <Button
                  onClick={handleOpenAddLocation}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-2 font-bold shadow-sm inline-flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add Location Tag
                </Button>
              )}
            </div>
          </div>

          {/* Sub-segmented Navigation Bar */}
          <div className="bg-slate-100/80 p-1 rounded-2xl flex flex-wrap items-center gap-1 border border-slate-200/80">
            <button
              onClick={() => setConfigActiveView('categories')}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                configActiveView === 'categories'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Tag size={15} />
              <span>Asset Categories</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tabular-nums ${
                configActiveView === 'categories'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {configCategories.length}
              </span>
            </button>

            <button
              onClick={() => setConfigActiveView('bus')}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                configActiveView === 'bus'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Building2 size={15} />
              <span>Business Units (BUs)</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tabular-nums ${
                configActiveView === 'bus'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {configBUs.length}
              </span>
            </button>

            <button
              onClick={() => setConfigActiveView('locations')}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                configActiveView === 'locations'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <MapPin size={15} />
              <span>Asset Locations & Floor Tags</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tabular-nums ${
                configActiveView === 'locations'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {configLocations.length}
              </span>
            </button>
          </div>

          {/* VIEW 1: ASSET CATEGORIES FULL GRID LIST */}
          {configActiveView === 'categories' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
              {/* Filter & Search Toolbar */}
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[220px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search categories or descriptions..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                    {categorySearch && (
                      <button
                        onClick={() => setCategorySearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Filter size={13} className="text-slate-400" />
                    <select
                      value={categoryTypeFilter}
                      onChange={(e) => setCategoryTypeFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Modules</option>
                      <option value="both">Both Registers (Fixed & Control)</option>
                      <option value="fixed">Fixed Assets Only</option>
                      <option value="control">Control Assets Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    Showing <strong className="text-slate-800 tabular-nums">{filteredCategories.length}</strong> of <span className="tabular-nums">{configCategories.length}</span>
                  </span>
                  <Button
                    onClick={fetchConfigData}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs px-2.5 py-1.5 font-semibold inline-flex items-center gap-1 shadow-xs"
                    title="Sync and refresh categories from database"
                  >
                    <RefreshCw size={12} className={loadingConfig ? 'animate-spin' : ''} /> Sync
                  </Button>
                  <Button
                    onClick={handleOpenAddCategory}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 font-bold inline-flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Category
                  </Button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Category Name</th>
                      <th className="py-3 px-4">Target Module</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Assets Assigned</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Tag size={32} className="mx-auto mb-2 opacity-30 text-indigo-600" />
                          <p className="font-semibold text-slate-600">No categories found</p>
                          <p className="text-xs text-slate-400 mt-1">Try clearing your search query or add a new category.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((cat, idx) => {
                        const fixedUsage = fixedAssets.filter(f => (f.category || '').trim().toUpperCase() === (cat.name || '').trim().toUpperCase()).length;
                        const controlUsage = controlAssets.filter(c => (c.category || '').trim().toUpperCase() === (cat.name || '').trim().toUpperCase()).length;
                        const totalUsage = fixedUsage + controlUsage;

                        return (
                          <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors group">
                            <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                <span className="font-bold text-slate-900 tracking-tight uppercase">
                                  {cat.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                cat.type === 'fixed'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : cat.type === 'control'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}>
                                {cat.type === 'both' ? 'Both Registers' : `${cat.type} Only`}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                              {cat.description || <span className="text-slate-400 italic">Standard IT category</span>}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md ${
                                  totalUsage > 0 ? 'bg-slate-100 text-slate-800' : 'bg-slate-50 text-slate-400'
                                }`}>
                                  {totalUsage} Total
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  ({fixedUsage} Fixed · {controlUsage} Control)
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditCategory(cat)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-colors"
                                  title="Edit category"
                                >
                                  <Edit2 size={12} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                                  title="Delete category"
                                >
                                  <Trash2 size={13} />
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
            </div>
          )}

          {/* VIEW 2: BUSINESS UNITS FULL GRID LIST */}
          {configActiveView === 'bus' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
              {/* Filter & Search Toolbar */}
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[220px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search business units by name, prefix, or address..."
                      value={buSearch}
                      onChange={(e) => setBuSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                    {buSearch && (
                      <button
                        onClick={() => setBuSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    Showing <strong className="text-slate-800 tabular-nums">{filteredBUs.length}</strong> of <span className="tabular-nums">{configBUs.length}</span>
                  </span>
                  <Button
                    onClick={handleOpenAddBu}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 font-bold inline-flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Business Unit
                  </Button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Business Unit Name</th>
                      <th className="py-3 px-4">Fixed Prefix</th>
                      <th className="py-3 px-4">Control Prefix</th>
                      <th className="py-3 px-4">Campus Address / Details</th>
                      <th className="py-3 px-4">Assigned Assets</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBUs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          <Building2 size={32} className="mx-auto mb-2 opacity-30 text-indigo-600" />
                          <p className="font-semibold text-slate-600">No business units found</p>
                          <p className="text-xs text-slate-400 mt-1">Try clearing your search query or add a new BU.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredBUs.map((bu, idx) => {
                        const fixedCount = fixedAssets.filter(f => f.bu_name === bu.bu_name).length;
                        const controlCount = controlAssets.filter(c => c.bu_name === bu.bu_name).length;
                        const totalAssets = fixedCount + controlCount;

                        return (
                          <tr key={bu.id} className="hover:bg-slate-50/70 transition-colors group">
                            <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                  <Building2 size={14} />
                                </div>
                                <span className="font-bold text-slate-900 text-xs">
                                  {bu.bu_name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                                {bu.code_prefix_fixed || '—'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                {bu.code_prefix_control || '—'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                              {bu.address || <span className="text-slate-400 italic">Phnom Penh, Cambodia</span>}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md ${
                                  totalAssets > 0 ? 'bg-slate-100 text-slate-800' : 'bg-slate-50 text-slate-400'
                                }`}>
                                  {totalAssets} Total
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  ({fixedCount} Fixed · {controlCount} Control)
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Active Campus
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditBu(bu)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-colors"
                                  title="Edit Business Unit"
                                >
                                  <Edit2 size={12} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteBu(bu)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                                  title="Delete Business Unit"
                                >
                                  <Trash2 size={13} />
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
            </div>
          )}

          {/* VIEW 3: ASSET LOCATIONS & FLOOR TAGS FULL GRID LIST */}
          {configActiveView === 'locations' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
              {/* Filter & Search Toolbar */}
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search locations or rooms..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                    {locationSearch && (
                      <button
                        onClick={() => setLocationSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-slate-400" />
                    <select
                      value={locationBuFilter}
                      onChange={(e) => setLocationBuFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500"
                    >
                      <option value="All BUs">All Campuses</option>
                      <option value="Khema Global">Khema Global</option>
                      <option value="Khema TK">Khema TK</option>
                      <option value="Khema BKK">Khema BKK</option>
                      <option value="Sakal 2004">Sakal 2004</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Layers size={13} className="text-slate-400" />
                    <select
                      value={locationFloorFilter}
                      onChange={(e) => setLocationFloorFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500"
                    >
                      <option value="All Floors">All Floors</option>
                      {['G', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(fl => (
                        <option key={fl} value={fl}>Floor {fl}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    Showing <strong className="text-slate-800 tabular-nums">{filteredLocations.length}</strong> of <span className="tabular-nums">{configLocations.length}</span>
                  </span>
                  <Button
                    onClick={handleOpenAddLocation}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 font-bold inline-flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Location Tag
                  </Button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Campus / BU</th>
                      <th className="py-3 px-4">Floor Level</th>
                      <th className="py-3 px-4">Location Tag Name</th>
                      <th className="py-3 px-4">Room / Zone Details</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLocations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <MapPin size={32} className="mx-auto mb-2 opacity-30 text-indigo-600" />
                          <p className="font-semibold text-slate-600">No location tags found</p>
                          <p className="text-xs text-slate-400 mt-1">Try clearing your filters or add a new location tag.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLocations.map((loc, idx) => (
                        <tr key={loc.id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg text-xs">
                              <Building2 size={12} className="text-indigo-600" />
                              {loc.bu_name}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md text-[11px]">
                              Floor {loc.floor_level}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <MapPin size={13} className="text-indigo-500" />
                              <span>{loc.location_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {loc.room_details || <span className="text-slate-400 italic">Entire floor zone</span>}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditLocation(loc)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-colors"
                                title="Edit Location Tag"
                              >
                                <Edit2 size={12} />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteLocation(loc)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                                title="Delete Location Tag"
                              >
                                <Trash2 size={13} />
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
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT FIXED ASSET (FixAssets - 31 Columns)                  */}
      {/* ========================================================================= */}
      {showFixedModal && editingFixed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Monitor size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingFixed.id ? `Edit Fixed Asset: ${editingFixed.asset_code}` : 'Register New Fixed Asset (FixAssets)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">31-Column Hardware, Location, Network, Credentials & Financial Record</p>
                </div>
              </div>
              <button onClick={() => setShowFixedModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFixed} className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Section 1: Business Unit & Identification */}
              <div className="space-y-2">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-indigo-600">
                  1. Identification & Classification
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Business Unit *</label>
                    <select
                      value={editingFixed.bu_name}
                      onChange={(e) => setEditingFixed({ ...editingFixed, bu_name: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                    >
                      <option value="Khema Global">Khema Global</option>
                      <option value="Khema TK">Khema TK</option>
                      <option value="Khema BKK">Khema BKK</option>
                      <option value="Sakal 2004">Sakal 2004</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Asset Code *</label>
                    <input
                      type="text"
                      required
                      value={editingFixed.asset_code ?? ''}
                      onChange={(e) => setEditingFixed({ ...editingFixed, asset_code: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
                      placeholder="e.g. K2PH000085"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Asset Date</label>
                    <input
                      type="date"
                      value={editingFixed.asset_date || ''}
                      onChange={(e) => setEditingFixed({ ...editingFixed, asset_date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Category *</label>
                    <select
                      value={editingFixed.category || 'COMPUTER'}
                      onChange={(e) => setEditingFixed({ ...editingFixed, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                    >
                      {allFixedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Hardware Details */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-indigo-600">
                  2. Hardware Specifications
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Item Name *</label>
                    <input
                      type="text"
                      required
                      value={editingFixed.item_name ?? ''}
                      onChange={(e) => setEditingFixed({ ...editingFixed, item_name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                      placeholder="e.g. AIO, Desktop, Laptop, NAS"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Brand *</label>
                    <input
                      type="text"
                      required
                      value={editingFixed.brand ?? ''}
                      onChange={(e) => setEditingFixed({ ...editingFixed, brand: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                      placeholder="e.g. DELL, HP, Synology"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Model</label>
                    <input
                      type="text"
                      value={editingFixed.model ?? ''}
                      onChange={(e) => setEditingFixed({ ...editingFixed, model: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                      placeholder="e.g. Optiplex 5490 AIO"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Serial Number</label>
                    <input
                      type="text"
                      value={editingFixed.serial_num ?? ''}
                      onChange={(e) => setEditingFixed({ ...editingFixed, serial_num: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                      placeholder="e.g. BWQNRH3"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Key Specification</label>
                  <input
                    type="text"
                    value={editingFixed.key_specification ?? ''}
                    onChange={(e) => setEditingFixed({ ...editingFixed, key_specification: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    placeholder="e.g. Ram DDR4 8GB, CPU Intel Core i5-11500T, SSD 500GB"
                  />
                </div>
              </div>

              {/* Section 3: Location & User */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-indigo-600">
                  3. Location & End-User Placement
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Location (Floor) *</label>
                    <select
                      value={editingFixed.floor || 'G'}
                      onChange={(e) => setEditingFixed({ ...editingFixed, floor: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                    >
                      {['G', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(fl => (
                        <option key={`fixed-fl-${fl}`} value={fl}>Floor {fl}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Room No / Name *</label>
                    <input
                      type="text"
                      required
                      value={editingFixed.room_name ?? ''}
                      onChange={(e) => setEditingFixed({ ...editingFixed, room_name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                      placeholder="e.g. Customer Service, ICU, Pharmacy"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Current User</label>
                    <input
                      type="text"
                      value={editingFixed.current_user ?? ''}
                      onChange={(e) => setEditingFixed({ ...editingFixed, current_user: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                      placeholder="e.g. Doctor and Nurse, Billing Team"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Operational Status</label>
                    <select
                      value={editingFixed.status || 'Active'}
                      onChange={(e) => setEditingFixed({ ...editingFixed, status: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                    >
                      <option value="Active">Active</option>
                      <option value="Plan dispose">Plan dispose</option>
                      <option value="In Repair">In Repair</option>
                      <option value="Spare">Spare</option>
                      <option value="Disposed">Disposed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Network & Security Credentials */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-indigo-600">
                  4. Network Configuration & Admin Credentials
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Hostname</label>
                    <input
                      type="text"
                      value={editingFixed.hostname ?? ''}
                      onChange={(e) => setEditingFixed({ ...editingFixed, hostname: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                      placeholder="e.g. CSF3-PC"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">IP LAN (Primary)</label>
                    <input
                      type="text"
                      value={editingFixed.ip_lan ?? ''}
                      onChange={(e) => setEditingFixed({ ...editingFixed, ip_lan: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                      placeholder="e.g. 192.168.5.235"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">IP LAN (Secondary)</label>
                    <input
                      type="text"
                      value={editingFixed.ip_address_lan_secondary ?? ''}
                      onChange={(e) => setEditingFixed({ ...editingFixed, ip_address_lan_secondary: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                      placeholder="e.g. 192.168.0.219"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Admin Password (Masked)</label>
                    <input
                      type="text"
                      value={editingFixed.admin_password ?? ''}
                      onChange={(e) => setEditingFixed({ ...editingFixed, admin_password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                      placeholder="Local admin password"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Windows License</label>
                    <input
                      type="text"
                      value={editingFixed.win_license ?? ''}
                      onChange={(e) => setEditingFixed({ ...editingFixed, win_license: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                      placeholder="e.g. OEM Windows 11 Pro"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">MS Account Email</label>
                    <input
                      type="text"
                      value={editingFixed.ms_account_email ?? ''}
                      onChange={(e) => setEditingFixed({ ...editingFixed, ms_account_email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                      placeholder="e.g. khema.user@outlook.com"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">MS Account Password</label>
                    <input
                      type="text"
                      value={editingFixed.ms_account_password ?? ''}
                      onChange={(e) => setEditingFixed({ ...editingFixed, ms_account_password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                      placeholder="MS account secret"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Financials & Procurement */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-indigo-600">
                  5. Procurement & Capital Valuation
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Supplier</label>
                    <input
                      type="text"
                      value={editingFixed.supplier ?? ''}
                      onChange={(e) => setEditingFixed({ ...editingFixed, supplier: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                      placeholder="e.g. Anana Computer"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Invoice Ref / PO</label>
                    <input
                      type="text"
                      value={editingFixed.invoice_ref ?? ''}
                      onChange={(e) => setEditingFixed({ ...editingFixed, invoice_ref: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                      placeholder="INV-2022-098"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={editingFixed.quantity ?? 1}
                      onChange={(e) => {
                        const q = parseInt(e.target.value, 10) || 1;
                        setEditingFixed({ ...editingFixed, quantity: q, grand_total: q * (editingFixed.unit_price || 0) });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingFixed.unit_price ?? 0}
                      onChange={(e) => {
                        const p = parseFloat(e.target.value) || 0;
                        setEditingFixed({ ...editingFixed, unit_price: p, before_dis_vat_price: p, grand_total: (editingFixed.quantity || 1) * p });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Remark & Historical Movements</label>
                  <textarea
                    rows={2}
                    value={editingFixed.remark ?? ''}
                    onChange={(e) => setEditingFixed({ ...editingFixed, remark: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    placeholder="e.g. Move from 3f to CS GF"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowFixedModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                  Save Fixed Asset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT ASSETS CONTROL (Assets Control - 13 Columns)           */}
      {/* ========================================================================= */}
      {showControlModal && editingControl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingControl.id ? `Edit Control Asset: ${editingControl.ac_code_cms}` : 'Register New Control Asset (Assets Control)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">13-Column Peripheral, Network, Fingerprint, CCTV & Equipment Register</p>
                </div>
              </div>
              <button onClick={() => setShowControlModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveControl} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Business Unit *</label>
                  <select
                    value={editingControl.bu_name}
                    onChange={(e) => setEditingControl({ ...editingControl, bu_name: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                  >
                    <option value="Khema Global">Khema Global</option>
                    <option value="Khema TK">Khema TK</option>
                    <option value="Khema BKK">Khema BKK</option>
                    <option value="Sakal 2004">Sakal 2004</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">AC Code in CMS *</label>
                  <input
                    type="text"
                    required
                    value={editingControl.ac_code_cms ?? ''}
                    onChange={(e) => setEditingControl({ ...editingControl, ac_code_cms: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold text-emerald-700"
                    placeholder="e.g. K2-AC0178"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Category *</label>
                  <select
                    value={editingControl.category || 'PRINTER'}
                    onChange={(e) => setEditingControl({ ...editingControl, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                  >
                    {allControlCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={editingControl.item_name ?? ''}
                    onChange={(e) => setEditingControl({ ...editingControl, item_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    placeholder="e.g. Printer, Fingerprint, WiFi AP"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={editingControl.brand ?? ''}
                    onChange={(e) => setEditingControl({ ...editingControl, brand: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    placeholder="e.g. Epson, HP, ZKTeco"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Model</label>
                  <input
                    type="text"
                    value={editingControl.model ?? ''}
                    onChange={(e) => setEditingControl({ ...editingControl, model: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    placeholder="e.g. L805, K40 Pro"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={editingControl.serial_num ?? ''}
                    onChange={(e) => setEditingControl({ ...editingControl, serial_num: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                    placeholder="e.g. W7ZK141689"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Supplier</label>
                  <input
                    type="text"
                    value={editingControl.supplier ?? ''}
                    onChange={(e) => setEditingControl({ ...editingControl, supplier: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    placeholder="e.g. Thearun, B.O.S, ICE"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Key Specification</label>
                <input
                  type="text"
                  value={editingControl.key_specification ?? ''}
                  onChange={(e) => setEditingControl({ ...editingControl, key_specification: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  placeholder="e.g. L805 Wi-Fi Photo Ink Tank Printer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Location (Floor) *</label>
                  <select
                    value={editingControl.floor || 'G'}
                    onChange={(e) => setEditingControl({ ...editingControl, floor: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                  >
                    {['G', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(fl => (
                      <option key={`ctrl-fl-${fl}`} value={fl}>Floor {fl}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Room No / Name *</label>
                  <input
                    type="text"
                    required
                    value={editingControl.room_name ?? ''}
                    onChange={(e) => setEditingControl({ ...editingControl, room_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    placeholder="e.g. Admin Manager, ICU"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Current User</label>
                  <input
                    type="text"
                    value={editingControl.current_user ?? ''}
                    onChange={(e) => setEditingControl({ ...editingControl, current_user: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    placeholder="e.g. Admin, Marketing, Doctor"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Operational Status</label>
                  <select
                    value={editingControl.status || 'Active'}
                    onChange={(e) => setEditingControl({ ...editingControl, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="In Repair">In Repair</option>
                    <option value="Plan dispose">Plan dispose</option>
                    <option value="Missing">Missing</option>
                    <option value="Disposed">Disposed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Remark</label>
                  <input
                    type="text"
                    value={editingControl.remark ?? ''}
                    onChange={(e) => setEditingControl({ ...editingControl, remark: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                    placeholder="Notes or relocation history"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowControlModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  Save Control Asset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TRANSFER / RELOCATION LOG MODAL                                  */}
      {/* ========================================================================= */}
      {showTransferModal && transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ArrowLeftRight size={16} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Relocate Asset: {transferTarget.asset.asset_code || transferTarget.asset.ac_code_cms}
                </h3>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Current Placement</div>
                <div className="text-slate-800 font-bold">
                  {transferTarget.asset.bu_name} · Floor {transferTarget.asset.floor} ({transferTarget.asset.room_name})
                </div>
                <div className="text-[11px] text-slate-500">
                  User: {transferTarget.asset.current_user || 'Unassigned'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Destination BU</label>
                  <select
                    value={transferData.to_bu}
                    onChange={(e) => setTransferData({ ...transferData, to_bu: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                  >
                    <option value="Khema Global">Khema Global</option>
                    <option value="Khema TK">Khema TK</option>
                    <option value="Khema BKK">Khema BKK</option>
                    <option value="Sakal 2004">Sakal 2004</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Destination Location / Floor</label>
                  <select
                    value={transferData.to_floor}
                    onChange={(e) => setTransferData({ ...transferData, to_floor: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                  >
                    {['G', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(fl => (
                      <option key={`trans-fl-${fl}`} value={fl}>Floor {fl}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">New Room No / Name *</label>
                  <input
                    type="text"
                    required
                    value={transferData.to_room ?? ''}
                    onChange={(e) => setTransferData({ ...transferData, to_room: e.target.value })}
                    placeholder="e.g. ICU Bed 2, CS Counter"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">New Assignee / User</label>
                  <input
                    type="text"
                    value={transferData.to_user ?? ''}
                    onChange={(e) => setTransferData({ ...transferData, to_user: e.target.value })}
                    placeholder="e.g. Nurse Station"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Transfer Rationale</label>
                <input
                  type="text"
                  value={transferData.reason ?? ''}
                  onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                  placeholder="e.g. Emergency room upgrade, Temporary replacement"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setShowTransferModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                  Execute Relocation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ASSET CATEGORY CRUD MODAL                                        */}
      {/* ========================================================================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Asset Category'}
                </h3>
              </div>
              <button 
                onClick={() => setShowCategoryModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryModal} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BIOMEDICAL, NETWORK ROUTER, DESKTOP"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold uppercase tracking-wider focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Module *</label>
                <select
                  value={categoryFormData.type}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, type: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  <option value="both">Both Registers (Fixed Assets & Control Assets)</option>
                  <option value="fixed">Fixed Assets Only (Capital Equipment)</option>
                  <option value="control">Control Assets Only (Operations & IT Gear)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Optional brief description of items included in this category..."
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setShowCategoryModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: BUSINESS UNIT CRUD MODAL                                         */}
      {/* ========================================================================= */}
      {showBuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingBu ? `Edit Business Unit: ${editingBu.bu_name}` : 'Add New Business Unit'}
                </h3>
              </div>
              <button 
                onClick={() => setShowBuModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBuModal} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Business Unit Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Khema Global, Khema Sen Sok"
                  value={buFormData.bu_name}
                  onChange={(e) => setBuFormData({ ...buFormData, bu_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Fixed Asset Prefix *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KSPH"
                    value={buFormData.code_prefix_fixed}
                    onChange={(e) => setBuFormData({ ...buFormData, code_prefix_fixed: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold uppercase focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">For IT-FA codes</span>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Control Prefix *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KS-AC"
                    value={buFormData.code_prefix_control}
                    onChange={(e) => setBuFormData({ ...buFormData, code_prefix_control: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold uppercase focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">For IT-AC codes</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Campus Address / Details</label>
                <input
                  type="text"
                  placeholder="e.g. #28 Street 294, Boeung Keng Kang, Phnom Penh"
                  value={buFormData.address}
                  onChange={(e) => setBuFormData({ ...buFormData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setShowBuModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4"
                >
                  {editingBu ? 'Update BU' : 'Create BU'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ASSET LOCATION & FLOOR TAG CRUD MODAL                             */}
      {/* ========================================================================= */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingLocation ? `Edit Location Tag: ${editingLocation.location_name}` : 'Add New Location Tag'}
                </h3>
              </div>
              <button 
                onClick={() => setShowLocationModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLocationModal} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Campus / BU *</label>
                  <select
                    value={locationFormData.bu_name}
                    onChange={(e) => setLocationFormData({ ...locationFormData, bu_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    <option value="Khema Global">Khema Global</option>
                    <option value="Khema TK">Khema TK</option>
                    <option value="Khema BKK">Khema BKK</option>
                    <option value="Sakal 2004">Sakal 2004</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Floor Level *</label>
                  <select
                    value={locationFormData.floor_level}
                    onChange={(e) => setLocationFormData({ ...locationFormData, floor_level: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    {['G', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(fl => (
                      <option key={fl} value={fl}>Floor {fl}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Location Name / Tag *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ground Lobby & Reception, ICU Wing, Pharmacy"
                  value={locationFormData.location_name}
                  onChange={(e) => setLocationFormData({ ...locationFormData, location_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Room / Zone Details</label>
                <input
                  type="text"
                  placeholder="e.g. Front Desk Counter 1-3, Room 102"
                  value={locationFormData.room_details}
                  onChange={(e) => setLocationFormData({ ...locationFormData, room_details: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setShowLocationModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4"
                >
                  {editingLocation ? 'Update Location Tag' : 'Create Location Tag'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: IN-APP DELETE CONFIRMATION MODAL (Replaces blocked window.confirm)*/}
      {/* ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-start gap-3 bg-rose-50/50">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Deletion
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to delete this record? This action will permanently remove it from the database.
                </p>
              </div>
              <button
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {deleteTarget.type === 'category' ? 'Asset Category' :
                   deleteTarget.type === 'bu' ? 'Business Unit' :
                   deleteTarget.type === 'location' ? 'Asset Location Tag' :
                   deleteTarget.type === 'fixed' ? 'Fixed Asset' : 'Control Asset'}
                </div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>{deleteTarget.name}</span>
                </div>
                {deleteTarget.subtitle && (
                  <div className="text-xs text-slate-500 pt-0.5">
                    {deleteTarget.subtitle}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="text-xs font-semibold px-4"
              >
                Cancel
              </Button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <Trash2 size={13} className={isDeleting ? 'animate-spin' : ''} />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Record'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: IMPORT VALIDATION & ASSET ROW COUNT ALERT MODAL                  */}
      {/* ========================================================================= */}
      {importSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Import Validated & Completed
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {importSummary.fileName} • {importSummary.targetBu}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportSummary(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Total Processed Row Count Hero Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/80 via-slate-50 to-emerald-50/80 border border-indigo-100/80 text-center space-y-1 shadow-2xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  Total Asset Rows Successfully Processed
                </div>
                <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {importSummary.totalAssets.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {importSummary.fixedTotal} Fixed Assets + {importSummary.controlTotal} Control Assets
                </div>
              </div>

              {/* Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Fixed Assets Summary Card */}
                <div className="p-3.5 rounded-xl border border-indigo-200/80 bg-indigo-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Monitor size={14} className="text-indigo-600" /> Fixed Assets
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                      {importSummary.fixedTotal}
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600 border-t border-indigo-100/80 pt-2 font-medium">
                    <div className="flex justify-between">
                      <span>• New Assets Inserted:</span>
                      <strong className="text-emerald-700 font-mono">+{importSummary.fixedNew}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Existing Updated:</span>
                      <strong className="text-slate-800 font-mono">{importSummary.fixedUpdated}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>• Total Rows Scanned:</span>
                      <span className="font-mono">{importSummary.totalScannedFixed}</span>
                    </div>
                  </div>
                </div>

                {/* Control Assets Summary Card */}
                <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Tag size={14} className="text-emerald-600" /> Assets Control
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {importSummary.controlTotal}
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600 border-t border-emerald-100/80 pt-2 font-medium">
                    <div className="flex justify-between">
                      <span>• New Assets Inserted:</span>
                      <strong className="text-emerald-700 font-mono">+{importSummary.controlNew}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Existing Updated:</span>
                      <strong className="text-slate-800 font-mono">{importSummary.controlUpdated}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>• Total Rows Scanned:</span>
                      <span className="font-mono">{importSummary.totalScannedControl}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Validation Badges */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Data Quality & Validation Checks
                </div>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                    <span>Dates validated & stored in standard <strong>YYYY-MM-DD</strong> format ({importSummary.dateVerifiedCount} dates verified)</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                    <span>Asset Codes verified and synced to <strong>{importSummary.targetBu}</strong></span>
                  </div>
                  {importSummary.skippedFixed + importSummary.skippedControl > 0 && (
                    <div className="flex items-start gap-2 text-amber-700 font-medium pt-1">
                      <AlertTriangle size={14} className="shrink-0 text-amber-600 mt-0.5" />
                      <span>{importSummary.skippedFixed + importSummary.skippedControl} rows with empty codes or banner headers were skipped safely.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <Button
                type="button"
                onClick={() => setImportSummary(null)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 shadow-sm"
              >
                Done / View Imported Assets
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: IMPORT VALIDATION ERROR ALERT MODAL                              */}
      {/* ========================================================================= */}
      {importValidationError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <AlertCircle size={18} />
                </div>
                <h3 className="text-sm font-bold text-rose-900">
                  Import Validation Alert
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setImportValidationError(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-rose-100/50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {importValidationError}
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px] text-slate-600">
                <div className="font-bold text-slate-800">Please verify the following:</div>
                <div>• The file is a valid <strong>.xlsx</strong> or <strong>.xls</strong> workbook.</div>
                <div>• Header row contains <strong>ASSET CODE</strong> (FixAssets) or <strong>AC CODE</strong> (Assets Control).</div>
                <div>• Date values follow <strong>YYYY-MM-DD</strong> or standard Excel date formats.</div>
                <div>• Rows contain non-empty asset identification codes.</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button
                type="button"
                onClick={() => setImportValidationError(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2"
              >
                Understand & Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
