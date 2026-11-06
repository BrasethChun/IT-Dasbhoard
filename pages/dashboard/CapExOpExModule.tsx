import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, Calendar, AlertCircle, CheckCircle2, Clock, 
  Filter, Search, Plus, Edit2, Trash2, Download, Upload, RefreshCw, 
  FileSpreadsheet, ArrowUpRight, ArrowDownRight, Layers, ShieldCheck, 
  ExternalLink, ChevronDown, ChevronRight, X, AlertTriangle, Building2,
  PieChart as PieChartIcon, BarChart3, CheckSquare, Sparkles, FileText,
  Printer, Monitor, Laptop, Video, Server, Network, Copy, ArrowRightLeft,
  SlidersHorizontal, Check, Info, RotateCcw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line 
} from 'recharts';
import * as XLSX from 'xlsx';
import { Button } from '../../components/ui/Button';

// --- INTERFACES ---
export interface CapExItem {
  id: string;
  fiscal_year: number;
  item_no: number;
  description: string;
  asset_type: string;
  site: string;
  pic: string;
  cost_center: string;
  project_owner: string;
  department: string;
  qty: number;
  capex_code: string;
  unit_price: number;
  requested_amount: number;
  start_date: string | null;
  complete_date: string | null;
  status: 'Planned' | 'Pending Approval' | 'Approved' | 'In Progress' | 'Completed' | 'Cancelled';
  justification: string;
  monthly_spending: Record<string, { planned: number; actual: number }>;
  quarterly_spending: {
    q1: number; q2: number; q3: number; q4: number; total: number;
    planned: { q1: number; q2: number; q3: number; q4: number; total: number };
    actual: { q1: number; q2: number; q3: number; q4: number; total: number };
    variance: { q1: number; q2: number; q3: number; q4: number; total: number };
  };
}

export interface OpExItem {
  id: string;
  fiscal_year: number;
  item_no: number;
  account_code: string;
  account_name: string;
  description: string;
  justification: string;
  site: string;
  cost_center: string;
  pic: string;
  billing_cycle: 'Monthly' | 'Annual' | 'Quarterly';
  renewal_date: string | null;
  qty: number;
  unit_price: number;
  annual_cost: number;
  monthly_spending: Record<string, { planned: number; actual: number }>;
  quarterly_spending?: {
    planned: { q1: number; q2: number; q3: number; q4: number; total: number };
    actual: { q1: number; q2: number; q3: number; q4: number; total: number };
    variance: { q1: number; q2: number; q3: number; q4: number; total: number };
  };
}

interface ExecutiveSummaryData {
  fiscalYear: number;
  availableYears: number[];
  totalFiscalBudget: number;
  totalFiscalActual: number;
  totalFiscalVariance: number;
  variancePercentage: string;
  totalCapexRequested: number;
  totalCapexApproved: number;
  totalCapexInProgress: number;
  totalCapexCompleted: number;
  totalCapexActual: number;
  totalCapexVariance: number;
  totalAnnualOpex: number;
  totalAnnualOpexActual: number;
  totalAnnualOpexVariance: number;
  capexCount: number;
  opexCount: number;
  upcomingRenewals: Array<{
    id: string;
    description: string;
    site: string;
    account_code: string;
    annual_cost: number;
    renewal_date: string;
    daysRemaining: number;
    isCritical: boolean;
  }>;
  capexByAssetType: Record<string, { planned: number; actual: number }>;
  opexByAccount: Record<string, { planned: number; actual: number }>;
  totalBySite: Record<string, {
    planned: number;
    actual: number;
    variance: number;
    capex_planned: number;
    capex_actual: number;
    opex_planned: number;
    opex_actual: number;
  }>;
  cashFlowChartData: Array<{
    month: string;
    planned_capex: number;
    actual_capex: number;
    planned_opex: number;
    actual_opex: number;
    planned_total: number;
    actual_total: number;
    variance: number;
  }>;
}

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DEFAULT_ASSET_TYPES = ['Printer', 'Computer', 'Laptop', 'CCTV', 'Network', 'Server', 'Storage', 'Software / System', 'Other'];
const SITES = ['All Sites', 'K1', 'K2', 'KG', 'Sakal'];
const CAPEX_STATUSES = ['Planned', 'Pending Approval', 'Approved', 'In Progress', 'Completed', 'Cancelled'];
const OPEX_ACCOUNT_CODES = [
  { code: '630104 - Other Outside Services', name: 'Other Outside Services' },
  { code: '630103 - Rent - Non-Medical equipment', name: 'Rent - Non-Medical equipment' },
  { code: '630102 - Communication & Internet', name: 'Communication & Internet' },
  { code: '630105 - Cloud & SaaS Licenses', name: 'Cloud & SaaS Licenses' },
  { code: 'Custom', name: 'Other Outside Service / Custom' }
];

export interface OpexAccountCode {
  id?: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  is_active?: boolean | number;
  sort_order?: number;
}

export const CapExOpExModule: React.FC<{ sites?: any[] }> = ({ sites = [] }) => {
  // Navigation & Sub-tabs (Persisted across refreshes)
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'capex' | 'opex' | 'sync'>(() => {
    return (localStorage.getItem('khema_capex_subtab') as any) || 'overview';
  });
  
  // Primary Annual Fiscal Year state (Starts from 2026, persisted across refreshes)
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(() => {
    const saved = localStorage.getItem('khema_capex_fiscal_year');
    return saved ? parseInt(saved, 10) || 2026 : 2026;
  });
  const [availableYears, setAvailableYears] = useState<number[]>([2026, 2027, 2028, 2029, 2030]);
  const [showCloneYearModal, setShowCloneYearModal] = useState(false);
  const [cloneTargetYear, setCloneTargetYear] = useState<number>(2027);
  const [cloneOverwrite, setCloneOverwrite] = useState(false);

  useEffect(() => {
    localStorage.setItem('khema_capex_subtab', activeSubTab);
  }, [activeSubTab]);

  useEffect(() => {
    localStorage.setItem('khema_capex_fiscal_year', String(selectedFiscalYear));
  }, [selectedFiscalYear]);

  // Dynamic asset categories synced from IT Asset Management
  const [assetCategories, setAssetCategories] = useState<string[]>([]);

  // Global Site Filter & Search
  const [selectedSite, setSelectedSite] = useState<string>('All Sites');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Data State
  const [summaryData, setSummaryData] = useState<ExecutiveSummaryData | null>(null);
  const [capexItems, setCapexItems] = useState<CapExItem[]>([]);
  const [opexItems, setOpexItems] = useState<OpExItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // CapEx specific filters & expanded state
  const [capexAssetFilter, setCapexAssetFilter] = useState<string>('All Types');
  const [capexStatusFilter, setCapexStatusFilter] = useState<string>('All Statuses');
  const [expandedCapexId, setExpandedCapexId] = useState<string | null>(null);

  // OpEx specific filters & settings
  const [opexAccountFilter, setOpexAccountFilter] = useState<string>('All Accounts');
  const [smartSpreadEnabled, setSmartSpreadEnabled] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'planned-only' | 'actual-only'>('side-by-side');

  // Modals
  const [showCapexModal, setShowCapexModal] = useState<boolean>(false);
  const [editingCapexItem, setEditingCapexItem] = useState<CapExItem | null>(null);
  const [showOpexModal, setShowOpexModal] = useState<boolean>(false);
  const [editingOpexItem, setEditingOpexItem] = useState<OpExItem | null>(null);
  const [accountCodes, setAccountCodes] = useState<OpexAccountCode[]>([]);
  const [showAccountCodesModal, setShowAccountCodesModal] = useState<boolean>(false);
  const [isSyncingExpenses, setIsSyncingExpenses] = useState<boolean>(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id: string; name: string; type: 'capex' | 'opex' | 'restore-defaults' } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const effectiveAccountCodes = useMemo(() => {
    return accountCodes.length > 0 ? accountCodes : OPEX_ACCOUNT_CODES;
  }, [accountCodes]);

  const fetchAccountCodes = async () => {
    try {
      const res = await fetch('/api/it-budget/account-codes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAccountCodes(data);
      }
    } catch (e: any) {
      console.error('Error fetching account codes:', e);
    }
  };

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  // Fetch summary data
  const fetchSummary = async (fy: number = selectedFiscalYear, site: string = selectedSite) => {
    try {
      const siteParam = site !== 'All Sites' ? `&site=${encodeURIComponent(site)}` : '';
      const res = await fetch(`/api/it-budget/summary?fiscal_year=${fy}${siteParam}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
        if (data.availableYears && Array.isArray(data.availableYears)) {
          setAvailableYears(data.availableYears);
        }
      }
    } catch (e: any) {
      console.error('Error fetching summary:', e);
    }
  };

  // Fetch CapEx data
  const fetchCapex = async (fy: number = selectedFiscalYear, site: string = selectedSite, asset: string = capexAssetFilter, status: string = capexStatusFilter, q: string = searchQuery) => {
    try {
      const params = new URLSearchParams({ fiscal_year: String(fy) });
      if (site !== 'All Sites') params.append('site', site);
      if (asset !== 'All Types') params.append('asset_type', asset);
      if (status !== 'All Statuses') params.append('status', status);
      if (q) params.append('search', q);

      const res = await fetch(`/api/it-budget/capex?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setCapexItems(data);
      }
    } catch (e: any) {
      console.error('Error fetching capex items:', e);
    }
  };

  // Fetch OpEx data
  const fetchOpex = async (fy: number = selectedFiscalYear, site: string = selectedSite, acct: string = opexAccountFilter, q: string = searchQuery) => {
    try {
      const params = new URLSearchParams({ fiscal_year: String(fy) });
      if (site !== 'All Sites') params.append('site', site);
      if (acct !== 'All Accounts') params.append('account_code', acct);
      if (q) params.append('search', q);

      const res = await fetch(`/api/it-budget/opex?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setOpexItems(data);
      }
    } catch (e: any) {
      console.error('Error fetching opex items:', e);
    }
  };

  // Fetch asset categories synced from IT Asset Management
  const fetchAssetCategories = async () => {
    try {
      const res = await fetch('/api/it-assets/config', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const cats = (data.categories || [])
          .map((c: any) => c.category_name || c.name)
          .filter(Boolean);
        if (cats.length > 0) {
          setAssetCategories(cats);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not fetch asset categories from /api/it-assets/config:', e);
    }

    try {
      const res = await fetch('/api/asset-categories', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const cats = (Array.isArray(data) ? data : [])
          .map((c: any) => c.category_name || c.name)
          .filter(Boolean);
        if (cats.length > 0) {
          setAssetCategories(cats);
        }
      }
    } catch (e) {
      console.warn('Could not fetch fallback asset categories:', e);
    }
  };

  // Initial & Filter Load
  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchSummary(selectedFiscalYear, selectedSite),
      fetchCapex(selectedFiscalYear, selectedSite, capexAssetFilter, capexStatusFilter, searchQuery),
      fetchOpex(selectedFiscalYear, selectedSite, opexAccountFilter, searchQuery),
      fetchAssetCategories(),
      fetchAccountCodes()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [selectedFiscalYear, selectedSite]);

  useEffect(() => {
    fetchCapex(selectedFiscalYear, selectedSite, capexAssetFilter, capexStatusFilter, searchQuery);
  }, [capexAssetFilter, capexStatusFilter, searchQuery]);

  useEffect(() => {
    fetchOpex(selectedFiscalYear, selectedSite, opexAccountFilter, searchQuery);
  }, [opexAccountFilter, searchQuery]);

  // Sync actuals from it_expenses table
  const handleSyncExpenses = async () => {
    try {
      setIsSyncingExpenses(true);
      const res = await fetch('/api/it-budget/sync-expenses', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ fiscal_year: selectedFiscalYear })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Actuals synchronized from it_expenses for FY ${selectedFiscalYear}!`, 'success');
        await loadAll();
      } else {
        showToast(data.error || 'Failed to synchronize expenses', 'error');
      }
    } catch (e: any) {
      showToast('Error connecting to expense sync: ' + e.message, 'error');
    } finally {
      setIsSyncingExpenses(false);
    }
  };

  // Clone/Roll over fiscal year
  const handleCloneYear = async () => {
    try {
      const res = await fetch('/api/it-budget/clone-year', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          from_year: selectedFiscalYear,
          to_year: cloneTargetYear,
          overwrite: cloneOverwrite
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setShowCloneYearModal(false);
        setSelectedFiscalYear(cloneTargetYear);
      } else {
        showToast(data.error || 'Failed to clone fiscal year', 'error');
      }
    } catch (e: any) {
      showToast('Error cloning fiscal year: ' + e.message, 'error');
    }
  };

  // Restore Template Defaults with in-app confirmation modal
  const handleRestoreDefaults = () => {
    setDeleteConfirmItem({
      id: 'restore-all',
      name: `All CapEx and S-Operation items for FY ${selectedFiscalYear}`,
      type: 'restore-defaults'
    });
  };

  // CapEx Inline Status Update
  const handleUpdateCapexStatus = async (item: CapExItem, newStatus: string) => {
    try {
      const res = await fetch(`/api/it-budget/capex/${item.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...item, status: newStatus })
      });
      if (res.ok) {
        setCapexItems(prev => prev.map(c => c.id === item.id ? { ...c, status: newStatus as any } : c));
        fetchSummary();
        showToast(`Updated "${item.description}" status to ${newStatus}`);
      }
    } catch (e) {
      showToast('Failed to update status', 'error');
    }
  };

  // CapEx Monthly Cell Update (Planned or Actual)
  const handleCapexMonthChange = async (itemId: string, monthKey: string, type: 'planned' | 'actual', value: number) => {
    const item = capexItems.find(c => c.id === itemId);
    if (!item) return;

    const updatedSpending = {
      ...item.monthly_spending,
      [monthKey]: {
        ...(item.monthly_spending?.[monthKey] || { planned: 0, actual: 0 }),
        [type]: Math.max(0, value)
      }
    };

    // Optimistic update
    setCapexItems(prev => prev.map(c => {
      if (c.id === itemId) {
        return { ...c, monthly_spending: updatedSpending };
      }
      return c;
    }));

    try {
      await fetch(`/api/it-budget/capex/${itemId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...item,
          monthly_spending: updatedSpending
        })
      });
      fetchSummary();
    } catch (e) {
      console.error('Failed to save monthly capex cell', e);
    }
  };

  // OpEx Monthly Cell Update (Planned or Actual)
  const handleOpexMonthChange = async (itemId: string, monthKey: string, type: 'planned' | 'actual', value: number) => {
    const item = opexItems.find(o => o.id === itemId);
    if (!item) return;

    const updatedSpending = {
      ...item.monthly_spending,
      [monthKey]: {
        ...(item.monthly_spending?.[monthKey] || { planned: 0, actual: 0 }),
        [type]: Math.max(0, value)
      }
    };

    const newAnnualPlanned = MONTH_KEYS.reduce((acc, m) => acc + (updatedSpending[m]?.planned || 0), 0);

    // Optimistic update
    setOpexItems(prev => prev.map(o => {
      if (o.id === itemId) {
        return { 
          ...o, 
          annual_cost: newAnnualPlanned,
          monthly_spending: updatedSpending 
        };
      }
      return o;
    }));

    try {
      await fetch(`/api/it-budget/opex/${itemId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...item,
          annual_cost: newAnnualPlanned,
          monthly_spending: updatedSpending
        })
      });
      fetchSummary();
    } catch (e) {
      console.error('Failed to save monthly opex cell', e);
    }
  };

  // Delete Handlers with safe in-app confirmation modal (eliminates blocked window.confirm in iframes)
  const handleDeleteCapex = (id: string, name: string) => {
    setDeleteConfirmItem({ id, name, type: 'capex' });
  };

  const handleDeleteOpex = (id: string, name: string) => {
    setDeleteConfirmItem({ id, name, type: 'opex' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsDeleting(true);
    try {
      if (deleteConfirmItem.type === 'restore-defaults') {
        const res = await fetch('/api/it-budget/restore-defaults', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ fiscal_year: selectedFiscalYear })
        });
        const data = await res.json();
        if (res.ok) {
          showToast(data.message || 'Template restored successfully', 'success');
          await loadAll();
          setDeleteConfirmItem(null);
        } else {
          showToast(data.error || 'Failed to restore template defaults', 'error');
        }
        return;
      }

      const endpoint = deleteConfirmItem.type === 'capex'
        ? `/api/it-budget/capex/${deleteConfirmItem.id}`
        : `/api/it-budget/opex/${deleteConfirmItem.id}`;

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (res.ok) {
        if (deleteConfirmItem.type === 'capex') {
          setCapexItems(prev => prev.filter(c => c.id !== deleteConfirmItem.id));
          showToast(`CapEx item "${deleteConfirmItem.name}" deleted successfully`);
        } else {
          setOpexItems(prev => prev.filter(o => o.id !== deleteConfirmItem.id));
          showToast(`OpEx item "${deleteConfirmItem.name}" deleted successfully`);
        }
        await loadAll();
        setDeleteConfirmItem(null);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || `Failed to delete ${deleteConfirmItem.type.toUpperCase()} item`, 'error');
      }
    } catch (e: any) {
      showToast('Error deleting item: ' + e.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Excel Export: Multi-Sheet Workbook with Planned vs Actual & Variance
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // --- Sheet 1: CapEx Plan ---
      const capexSheetData = capexItems.map((c, idx) => {
        const row: any = {
          'No': idx + 1,
          'Fiscal Year': c.fiscal_year || selectedFiscalYear,
          'Description': c.description,
          'Asset Type': c.asset_type,
          'Site': c.site,
          'PIC': c.pic,
          'Capex Code': c.capex_code,
          'Qty': c.qty,
          'Unit Price ($)': c.unit_price,
          'Requested Amount ($)': c.requested_amount,
          'Status': c.status,
          'Start Date': c.start_date || '',
          'Complete Date': c.complete_date || '',
          'Justification': c.justification || ''
        };

        // Monthly Planned
        MONTH_KEYS.forEach(m => {
          row[`${m.toUpperCase()} (Planned)`] = c.monthly_spending?.[m]?.planned || 0;
          row[`${m.toUpperCase()} (Actual)`] = c.monthly_spending?.[m]?.actual || 0;
        });

        const totalPlanned = MONTH_KEYS.reduce((acc, m) => acc + (c.monthly_spending?.[m]?.planned || 0), 0);
        const totalActual = MONTH_KEYS.reduce((acc, m) => acc + (c.monthly_spending?.[m]?.actual || 0), 0);
        row['Annual Planned ($)'] = totalPlanned;
        row['Annual Actual ($)'] = totalActual;
        row['Annual Variance ($)'] = totalPlanned - totalActual;

        return row;
      });

      const wsCapex = XLSX.utils.json_to_sheet(capexSheetData);
      XLSX.utils.book_append_sheet(wb, wsCapex, `CapEx Plan FY${selectedFiscalYear}`);

      // --- Sheet 2: OpEx & S-Operation Plan ---
      const opexSheetData = opexItems.map((o, idx) => {
        const row: any = {
          'No': idx + 1,
          'Fiscal Year': o.fiscal_year || selectedFiscalYear,
          'Account Code': o.account_code,
          'Account Name': o.account_name,
          'Description': o.description,
          'Site': o.site,
          'Billing Cycle': o.billing_cycle,
          'Renewal Date': o.renewal_date || '',
          'Qty': o.qty,
          'Unit Price ($)': o.unit_price,
          'Justification': o.justification || ''
        };

        let rowPlanned = 0;
        let rowActual = 0;
        MONTH_KEYS.forEach(m => {
          const p = o.monthly_spending?.[m]?.planned || 0;
          const a = o.monthly_spending?.[m]?.actual || 0;
          row[`${m.toUpperCase()} (Planned)`] = p;
          row[`${m.toUpperCase()} (Actual)`] = a;
          row[`${m.toUpperCase()} (Variance)`] = p - a;
          rowPlanned += p;
          rowActual += a;
        });

        row['Annual Planned ($)'] = rowPlanned;
        row['Annual Actual ($)'] = rowActual;
        row['Annual Variance ($)'] = rowPlanned - rowActual;

        return row;
      });

      const wsOpex = XLSX.utils.json_to_sheet(opexSheetData);
      XLSX.utils.book_append_sheet(wb, wsOpex, `OpEx & S-Operation FY${selectedFiscalYear}`);

      // Write File
      XLSX.writeFile(wb, `Khema_Global_IT_CapEx_and_S-Operation_FY${selectedFiscalYear}.xlsx`);
      showToast(`Exported IT CapEx & S-Operation FY${selectedFiscalYear} Excel workbook!`, 'success');
    } catch (e: any) {
      showToast('Failed to export Excel file: ' + e.message, 'error');
    }
  };

  // Excel Import Handler
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        const importedCapex: any[] = [];
        const importedOpex: any[] = [];

        // Parse sheets
        wb.SheetNames.forEach(sheetName => {
          const lower = sheetName.toLowerCase();
          const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);

          if (lower.includes('capex')) {
            rows.forEach((r, idx) => {
              if (!r.Description) return;
              const spending: any = {};
              MONTH_KEYS.forEach(m => {
                spending[m] = {
                  planned: parseFloat(r[`${m.toUpperCase()} (Planned)`] || r[m.toUpperCase()] || 0) || 0,
                  actual: parseFloat(r[`${m.toUpperCase()} (Actual)`] || 0) || 0
                };
              });

              importedCapex.push({
                fiscal_year: selectedFiscalYear,
                item_no: r.No || idx + 1,
                description: String(r.Description),
                asset_type: r['Asset Type'] || 'Hardware',
                site: r.Site || 'K1',
                pic: r.PIC || 'Braseth',
                capex_code: r['Capex Code'] || `Capex#${selectedFiscalYear}-${idx + 1}`,
                qty: parseInt(r.Qty, 10) || 1,
                unit_price: parseFloat(r['Unit Price ($)'] || r.UnitPrice || 0) || 0,
                requested_amount: parseFloat(r['Requested Amount ($)'] || 0) || 0,
                status: r.Status || 'Planned',
                justification: r.Justification || '',
                monthly_spending: spending
              });
            });
          } else if (lower.includes('opex') || lower.includes('operation')) {
            rows.forEach((r, idx) => {
              if (!r.Description) return;
              const spending: any = {};
              MONTH_KEYS.forEach(m => {
                spending[m] = {
                  planned: parseFloat(r[`${m.toUpperCase()} (Planned)`] || r[m.toUpperCase()] || 0) || 0,
                  actual: parseFloat(r[`${m.toUpperCase()} (Actual)`] || 0) || 0
                };
              });

              importedOpex.push({
                fiscal_year: selectedFiscalYear,
                item_no: r.No || idx + 1,
                account_code: r['Account Code'] || '630104 - Other Outside Services',
                account_name: r['Account Name'] || 'Other Outside Services',
                description: String(r.Description),
                site: r.Site || 'K1',
                billing_cycle: r['Billing Cycle'] || 'Annual',
                renewal_date: r['Renewal Date'] || null,
                qty: parseInt(r.Qty, 10) || 1,
                unit_price: parseFloat(r['Unit Price ($)'] || 0) || 0,
                justification: r.Justification || '',
                monthly_spending: spending
              });
            });
          }
        });

        if (importedCapex.length === 0 && importedOpex.length === 0) {
          showToast('No recognizable CapEx or OpEx sheets found in file.', 'error');
          return;
        }

        const res = await fetch('/api/it-budget/bulk-sync', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            fiscal_year: selectedFiscalYear,
            capexItems: importedCapex,
            opexItems: importedOpex,
            replaceExisting: false
          })
        });

        const resData = await res.json();
        if (res.ok) {
          showToast(resData.message, 'success');
          await loadAll();
        } else {
          showToast(resData.error || 'Failed to import Excel data', 'error');
        }
      } catch (err: any) {
        showToast('Error reading Excel file: ' + err.message, 'error');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // Rollups & Burn-rates calculation for OpEx Grid
  const opexGridRollups = useMemo(() => {
    const monthlyPlannedTotals: Record<string, number> = {};
    const monthlyActualTotals: Record<string, number> = {};
    const monthlyVarianceTotals: Record<string, number> = {};

    MONTH_KEYS.forEach(m => {
      monthlyPlannedTotals[m] = 0;
      monthlyActualTotals[m] = 0;
      monthlyVarianceTotals[m] = 0;
    });

    let grandPlanned = 0;
    let grandActual = 0;

    opexItems.forEach(item => {
      MONTH_KEYS.forEach(m => {
        const p = item.monthly_spending?.[m]?.planned || 0;
        const a = item.monthly_spending?.[m]?.actual || 0;
        monthlyPlannedTotals[m] += p;
        monthlyActualTotals[m] += a;
        grandPlanned += p;
        grandActual += a;
      });
    });

    MONTH_KEYS.forEach(m => {
      monthlyVarianceTotals[m] = monthlyPlannedTotals[m] - monthlyActualTotals[m];
    });

    return {
      monthlyPlannedTotals,
      monthlyActualTotals,
      monthlyVarianceTotals,
      grandPlanned,
      grandActual,
      grandVariance: grandPlanned - grandActual
    };
  }, [opexItems]);

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

      {/* Main Module Header & Sticky Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <DollarSign size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  IT CapEx & S-Operation Tracking & Planning
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    FY {selectedFiscalYear}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Annual Capital & S-Operational Financial Planning, Budget Phasing & Realized Expense Tracking
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Utilities */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncExpenses}
              disabled={isSyncingExpenses}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors shadow-sm disabled:opacity-50"
              title="Pull and map real actual expenses from it_expenses table"
            >
              <RefreshCw size={13} className={isSyncingExpenses ? 'animate-spin' : ''} />
              <span>{isSyncingExpenses ? 'Syncing...' : 'Sync IT Expenses Actuals'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-sm"
              title="Download formatted multi-sheet Excel workbook"
            >
              <Download size={13} className="text-slate-500" />
              <span>Export .xlsx</span>
            </button>

            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-sm cursor-pointer">
              <Upload size={13} className="text-slate-500" />
              <span>Import .xlsx</span>
              <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
            </label>

            <button
              onClick={() => setActiveSubTab('sync')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 transition-all shadow-2xs group"
              title="Configure Account Codes & Reset Template in Sync & Template"
            >
              <SlidersHorizontal size={13} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
              <span>Sync & Template Settings</span>
            </button>
          </div>
        </div>

        {/* Annual Fiscal Year Filter & Campus Filter Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Fiscal Year Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Calendar size={13} /> Fiscal Year:
              </span>
              <div className="inline-flex items-center bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/60">
                {availableYears.map(year => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedFiscalYear(year)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedFiscalYear === year
                        ? 'bg-white text-indigo-700 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    FY {year}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCloneYearModal(true)}
                  className="px-2 py-1.5 rounded-lg text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/50 flex items-center gap-1"
                  title="Plan or clone budget into a new fiscal year"
                >
                  <Plus size={12} />
                  <span>New Year</span>
                </button>
              </div>
            </div>

            {/* Site / Campus Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Building2 size={13} /> Campus:
              </span>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {SITES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sub-tab Switcher */}
          <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={13} />
              <span>Executive Overview</span>
            </button>
            <button
              onClick={() => setActiveSubTab('capex')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'capex'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={13} />
              <span>CapEx Planner ({capexItems.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('opex')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'opex'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp size={13} />
              <span>OpEx & S-Operation ({opexItems.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('sync')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'sync'
                  ? 'bg-white text-indigo-900 shadow-sm font-bold border-b-2 border-indigo-600 ring-1 ring-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet size={13} className={activeSubTab === 'sync' ? 'text-indigo-600' : 'text-slate-500'} />
              <span>Sync & Template</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold border transition-colors ${
                activeSubTab === 'sync'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                Config
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* --- SUB-TAB 1: EXECUTIVE OVERVIEW (PLANNED VS ACTUAL COMMAND CENTER) --- */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Planned vs Actual KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Budget Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total FY {selectedFiscalYear} Budget</span>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <DollarSign size={16} />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  ${(summaryData?.totalFiscalBudget || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                  <span>CapEx: ${(summaryData?.totalCapexRequested || 0).toLocaleString()}</span>
                  <span>OpEx: ${(summaryData?.totalAnnualOpex || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Realized Actuals Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">YTD Actual Realized</span>
                <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <TrendingUp size={16} />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  ${(summaryData?.totalFiscalActual || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                  <span>CapEx: ${(summaryData?.totalCapexActual || 0).toLocaleString()}</span>
                  <span>OpEx: ${(summaryData?.totalAnnualOpexActual || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Net Budget Variance Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Budget Variance</span>
                <span className={`p-2 rounded-xl ${
                  (summaryData?.totalFiscalVariance || 0) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {(summaryData?.totalFiscalVariance || 0) >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                </span>
              </div>
              <div className="mt-3">
                <div className={`text-2xl font-bold tracking-tight ${
                  (summaryData?.totalFiscalVariance || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                  {(summaryData?.totalFiscalVariance || 0) >= 0 ? '+' : ''}
                  ${(summaryData?.totalFiscalVariance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs mt-2 pt-2 border-t border-slate-100 font-medium flex items-center justify-between">
                  <span className={(summaryData?.totalFiscalVariance || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                    {(summaryData?.totalFiscalVariance || 0) >= 0 ? 'Under Budget' : 'Over Budget'}
                  </span>
                  <span className="text-slate-500">
                    {summaryData?.variancePercentage || '0.0'}% remaining
                  </span>
                </div>
              </div>
            </div>

            {/* Upcoming Renewals Alert Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">30/60-Day Renewals</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Clock size={16} />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  {summaryData?.upcomingRenewals?.length || 0} Contracts
                </div>
                <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>Critical (&lt;30d): {summaryData?.upcomingRenewals?.filter(r => r.isCritical).length || 0}</span>
                  <button 
                    onClick={() => setActiveSubTab('opex')}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    View matrix &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Flow Forecast Chart: Planned vs. Actual Spend */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Monthly Cash Flow: Planned Budget vs. Realized Actuals
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  FY {selectedFiscalYear} monthly comparison across all IT operations and capital investments
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-indigo-500"></span>
                  <span>Planned Budget</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                  <span>Actual Spend</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              {summaryData?.cashFlowChartData && summaryData.cashFlowChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summaryData.cashFlowChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} 
                    />
                    <RechartsTooltip 
                      formatter={(value: any, name: any) => [
                        `$${Number(value).toLocaleString()}`, 
                        name === 'planned_total' ? 'Planned Total' : name === 'actual_total' ? 'Actual Realized' : name
                      ]}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                    />
                    <Bar dataKey="planned_total" name="planned_total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual_total" name="actual_total" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  No monthly cash flow data available
                </div>
              )}
            </div>
          </div>

          {/* Campus Variance & Renewals Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campus Budget Performance Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
                <Building2 size={16} className="text-indigo-600" />
                Budget vs. Actual by Khema Campus
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                      <th className="pb-2.5">Campus</th>
                      <th className="pb-2.5 text-right">Planned ($)</th>
                      <th className="pb-2.5 text-right">Actual ($)</th>
                      <th className="pb-2.5 text-right">Variance ($)</th>
                      <th className="pb-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {summaryData?.totalBySite && Object.entries(summaryData.totalBySite).map(([siteKey, vals]) => {
                      const isUnder = vals.variance >= 0;
                      return (
                        <tr key={siteKey} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 font-bold text-slate-800">{siteKey}</td>
                          <td className="py-2.5 text-right text-slate-600 font-medium">
                            ${vals.planned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 text-right text-slate-900 font-semibold">
                            ${vals.actual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={`py-2.5 text-right font-bold ${isUnder ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {isUnder ? '+' : ''}${vals.variance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 text-right">
                            <span className={`text-[11px] font-semibold ${isUnder ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {isUnder ? 'Under budget' : 'Over budget'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Upcoming Renewals Panel */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-600" />
                  Upcoming License & Contract Renewals
                </span>
                <span className="text-xs text-slate-400 font-normal">Next 60 Days</span>
              </h3>

              <div className="space-y-2.5">
                {summaryData?.upcomingRenewals && summaryData.upcomingRenewals.length > 0 ? (
                  summaryData.upcomingRenewals.map((r) => (
                    <div 
                      key={r.id} 
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                        r.isCritical 
                          ? 'bg-rose-50/60 border-rose-200/80 text-rose-900' 
                          : 'bg-amber-50/40 border-amber-200/60 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold truncate text-slate-900">{r.description}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {r.site} · {r.account_code} · Due {r.renewal_date ? new Date(r.renewal_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-slate-900">${Number(r.annual_cost).toLocaleString()}</div>
                        <span className={`text-[11px] font-semibold ${r.isCritical ? 'text-rose-600 font-bold' : 'text-amber-700'}`}>
                          {r.daysRemaining} days left
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No critical contract renewals in the next 60 days
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 2: CAPEX PLANNER & PROJECT TRACKER --- */}
      {activeSubTab === 'capex' && (
        <div className="space-y-4">
          {/* CapEx Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search CapEx items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Campus / Site Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <Building2 size={13} className="text-slate-400 shrink-0" />
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="text-xs bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  title="Filter CapEx items by Campus (K1, K2, Sakal, KG)"
                >
                  <option value="All Sites">All Campuses</option>
                  <option value="K1">K1</option>
                  <option value="K2">K2</option>
                  <option value="Sakal">Sakal</option>
                  <option value="KG">KG</option>
                </select>
              </div>

              <select
                value={capexAssetFilter}
                onChange={(e) => setCapexAssetFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="All Types">All Asset Types</option>
                {(assetCategories.length > 0 ? assetCategories : DEFAULT_ASSET_TYPES).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <select
                value={capexStatusFilter}
                onChange={(e) => setCapexStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="All Statuses">All Statuses</option>
                {CAPEX_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => {
                setEditingCapexItem(null);
                setShowCapexModal(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
            >
              <Plus size={14} />
              <span>Add CapEx Item</span>
            </Button>
          </div>

          {/* CapEx Interactive Data Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-3 w-8">#</th>
                    <th className="py-3 px-3">Description & Code</th>
                    <th className="py-3 px-3">Asset Type</th>
                    <th className="py-3 px-3">Campus</th>
                    <th className="py-3 px-3 text-center">Qty</th>
                    <th className="py-3 px-3 text-right">Unit Price</th>
                    <th className="py-3 px-3 text-right">Planned Total</th>
                    <th className="py-3 px-3 text-right">Actual Spent</th>
                    <th className="py-3 px-3 text-right">Variance</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-center">Phasing</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {capexItems.map((item, idx) => {
                    const isExpanded = expandedCapexId === item.id;
                    const totalActual = MONTH_KEYS.reduce((acc, m) => acc + (item.monthly_spending?.[m]?.actual || 0), 0);
                    const totalPlanned = Number(item.requested_amount) || 0;
                    const variance = totalPlanned - totalActual;
                    const isUnder = variance >= 0;

                    return (
                      <React.Fragment key={item.id}>
                        <tr className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{item.description}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.capex_code} · {item.pic}</div>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-700">{item.asset_type}</td>
                          <td className="py-3 px-3 font-semibold text-slate-800">{item.site}</td>
                          <td className="py-3 px-3 text-center text-slate-700 font-medium">{item.qty}</td>
                          <td className="py-3 px-3 text-right text-slate-600 font-mono">
                            ${Number(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-right text-indigo-700 font-bold font-mono">
                            ${totalPlanned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-900 font-semibold font-mono">
                            ${totalActual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={`py-3 px-3 text-right font-bold font-mono ${isUnder ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {isUnder ? '+' : ''}${variance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3">
                            <select
                              value={item.status}
                              onChange={(e) => handleUpdateCapexStatus(item, e.target.value)}
                              className={`text-[11px] font-semibold rounded-lg px-2 py-1 border transition-colors ${
                                item.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                item.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                item.status === 'Completed' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                item.status === 'Pending Approval' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                item.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {CAPEX_STATUSES.map(st => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => setExpandedCapexId(isExpanded ? null : item.id)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 mx-auto"
                            >
                              <span>{isExpanded ? 'Hide' : '12-Mo'}</span>
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingCapexItem(item);
                                  setShowCapexModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                                title="Edit Item"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteCapex(item.id, item.description)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                title="Delete Item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable 12-Month Phasing Matrix for this CapEx Item */}
                        {isExpanded && (
                          <tr className="bg-slate-50/90 border-y border-indigo-100">
                            <td colSpan={12} className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                    <Layers size={14} className="text-indigo-600" />
                                    <span>Monthly Phasing & Quarterly Rollups for "{item.description}"</span>
                                    <span className="text-[11px] text-slate-400 font-normal">Edit cells directly to adjust budget or log actuals</span>
                                  </div>
                                  <div className="text-xs text-slate-500 font-medium">
                                    Justification: <span className="text-slate-700 italic">{item.justification || 'No justification provided'}</span>
                                  </div>
                                </div>

                                <div className="overflow-x-auto bg-white rounded-xl border border-slate-200/80 p-3 shadow-inner">
                                  <table className="w-full text-center text-xs">
                                    <thead>
                                      <tr className="text-slate-400 font-semibold border-b border-slate-100">
                                        <th className="py-1 px-2 text-left w-20">Row</th>
                                        {MONTH_LABELS.map(m => (
                                          <th key={m} className="py-1 px-1.5 font-bold text-slate-700">{m}</th>
                                        ))}
                                        <th className="py-1 px-2 bg-slate-50 font-bold text-indigo-700">Q1</th>
                                        <th className="py-1 px-2 bg-slate-50 font-bold text-indigo-700">Q2</th>
                                        <th className="py-1 px-2 bg-slate-50 font-bold text-indigo-700">Q3</th>
                                        <th className="py-1 px-2 bg-slate-50 font-bold text-indigo-700">Q4</th>
                                        <th className="py-1 px-2 bg-indigo-50 font-bold text-indigo-900">Annual Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {/* Planned Row */}
                                      <tr>
                                        <td className="py-1.5 px-2 text-left font-bold text-indigo-600">Planned ($)</td>
                                        {MONTH_KEYS.map(m => (
                                          <td key={m} className="py-1 px-1">
                                            <input
                                              type="number"
                                              value={item.monthly_spending?.[m]?.planned ?? 0}
                                              onChange={(e) => handleCapexMonthChange(item.id, m, 'planned', parseFloat(e.target.value) || 0)}
                                              className="w-16 px-1.5 py-1 text-right text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                            />
                                          </td>
                                        ))}
                                        <td className="py-1.5 px-2 bg-slate-50 font-mono font-bold text-indigo-700">
                                          ${(item.quarterly_spending?.planned?.q1 ?? item.quarterly_spending?.q1 ?? 0).toLocaleString()}
                                        </td>
                                        <td className="py-1.5 px-2 bg-slate-50 font-mono font-bold text-indigo-700">
                                          ${(item.quarterly_spending?.planned?.q2 ?? item.quarterly_spending?.q2 ?? 0).toLocaleString()}
                                        </td>
                                        <td className="py-1.5 px-2 bg-slate-50 font-mono font-bold text-indigo-700">
                                          ${(item.quarterly_spending?.planned?.q3 ?? item.quarterly_spending?.q3 ?? 0).toLocaleString()}
                                        </td>
                                        <td className="py-1.5 px-2 bg-slate-50 font-mono font-bold text-indigo-700">
                                          ${(item.quarterly_spending?.planned?.q4 ?? item.quarterly_spending?.q4 ?? 0).toLocaleString()}
                                        </td>
                                        <td className="py-1.5 px-2 bg-indigo-50 font-mono font-bold text-indigo-900">
                                          ${totalPlanned.toLocaleString()}
                                        </td>
                                      </tr>

                                      {/* Actual Row */}
                                      <tr>
                                        <td className="py-1.5 px-2 text-left font-bold text-emerald-600">Actual ($)</td>
                                        {MONTH_KEYS.map(m => (
                                          <td key={m} className="py-1 px-1">
                                            <input
                                              type="number"
                                              value={item.monthly_spending?.[m]?.actual ?? 0}
                                              onChange={(e) => handleCapexMonthChange(item.id, m, 'actual', parseFloat(e.target.value) || 0)}
                                              className="w-16 px-1.5 py-1 text-right text-xs bg-emerald-50/50 border border-emerald-200/70 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-900"
                                            />
                                          </td>
                                        ))}
                                        <td className="py-1.5 px-2 bg-slate-50 font-mono font-bold text-slate-800">
                                          ${(item.quarterly_spending?.actual?.q1 ?? 0).toLocaleString()}
                                        </td>
                                        <td className="py-1.5 px-2 bg-slate-50 font-mono font-bold text-slate-800">
                                          ${(item.quarterly_spending?.actual?.q2 ?? 0).toLocaleString()}
                                        </td>
                                        <td className="py-1.5 px-2 bg-slate-50 font-mono font-bold text-slate-800">
                                          ${(item.quarterly_spending?.actual?.q3 ?? 0).toLocaleString()}
                                        </td>
                                        <td className="py-1.5 px-2 bg-slate-50 font-mono font-bold text-slate-800">
                                          ${(item.quarterly_spending?.actual?.q4 ?? 0).toLocaleString()}
                                        </td>
                                        <td className="py-1.5 px-2 bg-indigo-50 font-mono font-bold text-slate-900">
                                          ${totalActual.toLocaleString()}
                                        </td>
                                      </tr>

                                      {/* Variance Row */}
                                      <tr className="bg-slate-50/50">
                                        <td className="py-1.5 px-2 text-left font-bold text-slate-700">Variance ($)</td>
                                        {MONTH_KEYS.map(m => {
                                          const p = item.monthly_spending?.[m]?.planned || 0;
                                          const a = item.monthly_spending?.[m]?.actual || 0;
                                          const diff = p - a;
                                          return (
                                            <td key={m} className={`py-1 px-1 font-mono text-xs font-semibold ${
                                              diff >= 0 ? 'text-emerald-700' : 'text-rose-600'
                                            }`}>
                                              {diff !== 0 ? (diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()) : '—'}
                                            </td>
                                          );
                                        })}
                                        <td className="py-1.5 px-2 font-mono font-bold text-slate-700">
                                          ${(item.quarterly_spending?.variance?.q1 ?? 0).toLocaleString()}
                                        </td>
                                        <td className="py-1.5 px-2 font-mono font-bold text-slate-700">
                                          ${(item.quarterly_spending?.variance?.q2 ?? 0).toLocaleString()}
                                        </td>
                                        <td className="py-1.5 px-2 font-mono font-bold text-slate-700">
                                          ${(item.quarterly_spending?.variance?.q3 ?? 0).toLocaleString()}
                                        </td>
                                        <td className="py-1.5 px-2 font-mono font-bold text-slate-700">
                                          ${(item.quarterly_spending?.variance?.q4 ?? 0).toLocaleString()}
                                        </td>
                                        <td className={`py-1.5 px-2 font-mono font-bold ${isUnder ? 'text-emerald-700' : 'text-rose-600'}`}>
                                          {isUnder ? '+' : ''}${variance.toLocaleString()}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 3: OPEX & S-OPERATION MATRIX (SIDE-BY-SIDE 12-MONTH FINANCIAL GRID) --- */}
      {activeSubTab === 'opex' && (
        <div className="space-y-4">
          {/* OpEx Controls & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search OpEx & services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Campus / Site Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <Building2 size={13} className="text-slate-400 shrink-0" />
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="text-xs bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  title="Filter OpEx & S-Operation by Campus (K1, K2, Sakal, KG)"
                >
                  <option value="All Sites">All Campuses</option>
                  <option value="K1">K1</option>
                  <option value="K2">K2</option>
                  <option value="Sakal">Sakal</option>
                  <option value="KG">KG</option>
                </select>
              </div>

              <select
                value={opexAccountFilter}
                onChange={(e) => setOpexAccountFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="All Accounts">All Accounts</option>
                {effectiveAccountCodes.map(a => (
                  <option key={a.id || a.code} value={a.code}>{a.code}</option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('side-by-side')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    viewMode === 'side-by-side' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Side-by-Side (Planned & Actual)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('planned-only')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    viewMode === 'planned-only' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Planned Only
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('actual-only')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    viewMode === 'actual-only' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Actuals Only
                </button>
              </div>
            </div>

            <Button
              onClick={() => {
                setEditingOpexItem(null);
                setShowOpexModal(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm hover:shadow transition-all"
            >
              <Plus size={14} className="stroke-[2.5]" />
              <span>Add OpEx Service</span>
            </Button>
          </div>

          {/* Interactive 12-Month OpEx Financial Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-3 w-8">#</th>
                    <th className="py-3 px-3 min-w-[200px]">Service & Account</th>
                    <th className="py-3 px-2">Site</th>
                    <th className="py-3 px-2">Cycle</th>
                    <th className="py-3 px-2 w-14 text-center">Row</th>
                    {MONTH_LABELS.map(m => (
                      <th key={m} className="py-3 px-1.5 text-center min-w-[70px]">{m}</th>
                    ))}
                    <th className="py-3 px-3 text-right bg-slate-100/70 min-w-[100px]">Annual Total</th>
                    <th className="py-3 px-2 text-center w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {opexItems.map((item, idx) => {
                    const annualPlanned = MONTH_KEYS.reduce((acc, m) => acc + (item.monthly_spending?.[m]?.planned || 0), 0);
                    const annualActual = MONTH_KEYS.reduce((acc, m) => acc + (item.monthly_spending?.[m]?.actual || 0), 0);
                    const annualVariance = annualPlanned - annualActual;
                    const isUnder = annualVariance >= 0;

                    return (
                      <React.Fragment key={item.id}>
                        {/* Sub-Row 1: Planned ($) */}
                        {(viewMode === 'side-by-side' || viewMode === 'planned-only') && (
                          <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-2 px-3 text-slate-400 font-medium" rowSpan={viewMode === 'side-by-side' ? 3 : 1}>
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3" rowSpan={viewMode === 'side-by-side' ? 3 : 1}>
                              <div className="font-bold text-slate-900">{item.description}</div>
                              <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.account_code}</div>
                              {item.renewal_date && (
                                <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                                  Renews: {new Date(item.renewal_date).toLocaleDateString()}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-2 font-semibold text-slate-700" rowSpan={viewMode === 'side-by-side' ? 3 : 1}>
                              {item.site}
                            </td>
                            <td className="py-2 px-2 text-slate-600 font-medium" rowSpan={viewMode === 'side-by-side' ? 3 : 1}>
                              {item.billing_cycle}
                            </td>

                            {/* Row label */}
                            <td className="py-2 px-2 text-center font-bold text-indigo-600 text-[11px] bg-indigo-50/40">
                              Plan
                            </td>

                            {/* Monthly planned inputs */}
                            {MONTH_KEYS.map(m => (
                              <td key={m} className="py-1 px-1 text-center">
                                <input
                                  type="number"
                                  value={item.monthly_spending?.[m]?.planned ?? 0}
                                  onChange={(e) => handleOpexMonthChange(item.id, m, 'planned', parseFloat(e.target.value) || 0)}
                                  className="w-16 px-1.5 py-1 text-right text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-medium text-slate-800"
                                />
                              </td>
                            ))}

                            <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700 bg-slate-50/70">
                              ${annualPlanned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            <td className="py-2 px-2 text-center" rowSpan={viewMode === 'side-by-side' ? 3 : 1}>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingOpexItem(item);
                                    setShowOpexModal(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50"
                                  title="Edit Item"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteOpex(item.id, item.description)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                                  title="Delete Item"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Sub-Row 2: Actual ($) */}
                        {(viewMode === 'side-by-side' || viewMode === 'actual-only') && (
                          <tr className="hover:bg-slate-50/50 transition-colors bg-emerald-50/20">
                            {viewMode === 'actual-only' && (
                              <>
                                <td className="py-2 px-3 text-slate-400 font-medium">{idx + 1}</td>
                                <td className="py-2 px-3">
                                  <div className="font-bold text-slate-900">{item.description}</div>
                                  <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.account_code}</div>
                                </td>
                                <td className="py-2 px-2 font-semibold text-slate-700">{item.site}</td>
                                <td className="py-2 px-2 text-slate-600 font-medium">{item.billing_cycle}</td>
                              </>
                            )}

                            {/* Row label */}
                            <td className="py-2 px-2 text-center font-bold text-emerald-700 text-[11px] bg-emerald-50/50">
                              Act
                            </td>

                            {/* Monthly actual inputs */}
                            {MONTH_KEYS.map(m => (
                              <td key={m} className="py-1 px-1 text-center">
                                <input
                                  type="number"
                                  value={item.monthly_spending?.[m]?.actual ?? 0}
                                  onChange={(e) => handleOpexMonthChange(item.id, m, 'actual', parseFloat(e.target.value) || 0)}
                                  className="w-16 px-1.5 py-1 text-right text-xs bg-emerald-50/50 border border-emerald-200/80 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-medium text-slate-900"
                                />
                              </td>
                            ))}

                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800 bg-slate-50/70">
                              ${annualActual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {viewMode === 'actual-only' && (
                              <td className="py-2 px-2 text-center">
                                <button
                                  onClick={() => {
                                    setEditingOpexItem(item);
                                    setShowOpexModal(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-600"
                                >
                                  <Edit2 size={13} />
                                </button>
                              </td>
                            )}
                          </tr>
                        )}

                        {/* Sub-Row 3: Variance ($) */}
                        {viewMode === 'side-by-side' && (
                          <tr className="border-b-2 border-slate-200/80 bg-slate-50/60">
                            <td className="py-1.5 px-2 text-center font-bold text-slate-600 text-[11px]">
                              Var
                            </td>

                            {MONTH_KEYS.map(m => {
                              const p = item.monthly_spending?.[m]?.planned || 0;
                              const a = item.monthly_spending?.[m]?.actual || 0;
                              const diff = p - a;
                              return (
                                <td key={m} className={`py-1 px-1 text-right font-mono font-semibold text-xs ${
                                  diff >= 0 ? 'text-emerald-700' : 'text-rose-600'
                                }`}>
                                  {diff !== 0 ? (diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()) : '—'}
                                </td>
                              );
                            })}

                            <td className={`py-1.5 px-3 text-right font-mono font-bold ${isUnder ? 'text-emerald-700' : 'text-rose-600'} bg-slate-100/70`}>
                              {isUnder ? '+' : ''}${annualVariance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Summary / Burn-rate Totals Footer */}
                  <tr className="bg-indigo-50/40 border-t-2 border-indigo-200 font-bold">
                    <td colSpan={4} className="py-3 px-3 text-indigo-900 text-xs uppercase tracking-wider">
                      Monthly Planned IT OpEx Burn Rate
                    </td>
                    <td className="py-3 px-2 text-center text-indigo-700">Plan</td>
                    {MONTH_KEYS.map(m => (
                      <td key={m} className="py-3 px-1 text-right font-mono text-indigo-900 text-xs">
                        ${(opexGridRollups.monthlyPlannedTotals[m] || 0).toLocaleString()}
                      </td>
                    ))}
                    <td className="py-3 px-3 text-right font-mono text-indigo-900 text-sm bg-indigo-100/50">
                      ${opexGridRollups.grandPlanned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>

                  <tr className="bg-emerald-50/40 font-bold">
                    <td colSpan={4} className="py-3 px-3 text-emerald-900 text-xs uppercase tracking-wider">
                      Monthly Actual IT Realized Burn Rate
                    </td>
                    <td className="py-3 px-2 text-center text-emerald-700">Act</td>
                    {MONTH_KEYS.map(m => (
                      <td key={m} className="py-3 px-1 text-right font-mono text-emerald-900 text-xs">
                        ${(opexGridRollups.monthlyActualTotals[m] || 0).toLocaleString()}
                      </td>
                    ))}
                    <td className="py-3 px-3 text-right font-mono text-emerald-900 text-sm bg-emerald-100/50">
                      ${opexGridRollups.grandActual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>

                  <tr className="bg-slate-100/90 font-bold border-t border-slate-300">
                    <td colSpan={4} className="py-3 px-3 text-slate-800 text-xs uppercase tracking-wider">
                      Net Monthly OpEx Variance
                    </td>
                    <td className="py-3 px-2 text-center text-slate-700">Var</td>
                    {MONTH_KEYS.map(m => {
                      const v = opexGridRollups.monthlyVarianceTotals[m] || 0;
                      return (
                        <td key={m} className={`py-3 px-1 text-right font-mono text-xs ${v >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {v >= 0 ? '+' : ''}${v.toLocaleString()}
                        </td>
                      );
                    })}
                    <td className={`py-3 px-3 text-right font-mono text-sm ${opexGridRollups.grandVariance >= 0 ? 'text-emerald-700' : 'text-rose-600'} bg-slate-200/70`}>
                      {opexGridRollups.grandVariance >= 0 ? '+' : ''}${opexGridRollups.grandVariance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 4: SYNC & TEMPLATE TOOLS (RESET TEMPLATE & MASTER ACCOUNT CODES CONFIGURATION) --- */}
      {activeSubTab === 'sync' && (
        <div className="space-y-6">
          {/* Top 2 Cards: Excel Spreadsheet Export & Sync */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Download size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Export Multi-Sheet Financial Workbook</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Download the complete FY {selectedFiscalYear} IT CapEx & S-Operation dataset formatted identically to our Finance template with side-by-side Planned, Actual, and Variance columns.
                </p>
              </div>
              <Button
                onClick={handleExportExcel}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold py-2.5"
              >
                <Download size={14} />
                <span>Download Khema_IT_CapEx_and_S-Operation_FY{selectedFiscalYear}.xlsx</span>
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Upload size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Import & Sync External Spreadsheet</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload updated `.xlsx` files with CapEx and OpEx worksheets to synchronize budget and actuals into MySQL.
                </p>
              </div>
              <label className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold py-2.5 cursor-pointer">
                <Upload size={14} />
                <span>Choose .xlsx File to Synchronize</span>
                <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
              </label>
            </div>
          </div>

          {/* Section 2: Master Account Code Configuration (OpEx Chart of Accounts) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/80">
                  <SlidersHorizontal size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Master Account Codes Configuration</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                      {effectiveAccountCodes.length} Codes Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standardized chart of accounts for OpEx recurring services, maintenance SLAs, software licenses, and IT leases.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowAccountCodesModal(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold py-2 px-4 shadow-sm inline-flex items-center gap-1.5 shrink-0"
              >
                <Plus size={14} />
                <span>Manage / Add Account Codes</span>
              </Button>
            </div>

            {/* Quick Preview Table of Configured Master Account Codes */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Account Code</th>
                    <th className="py-2.5 px-3">Account Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Scope / Description</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {effectiveAccountCodes.map((ac) => (
                    <tr key={ac.id || ac.code} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                        {ac.code}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {ac.name}
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                          {ac.category || 'OpEx'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                        {ac.description || 'Standard outside services and IT maintenance SLA'}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {ac.is_active === 0 || ac.is_active === false ? (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Inactive</span>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => setShowAccountCodesModal(true)}
                          className="p-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                          title="Edit in Master CRUD Modal"
                        >
                          <Edit2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Reset & Restore Standard Baseline Template */}
          <div className="bg-gradient-to-r from-rose-50/50 via-white to-amber-50/30 rounded-2xl border-2 border-rose-200/80 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Reset & Restore Standard Template</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      FY {selectedFiscalYear} Baseline
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Reset all CapEx and OpEx/S-Operation line items for <strong>FY {selectedFiscalYear}</strong> back to the official Khema Global baseline template. This will restore default core contracts (eHospital, Anzer, Vcloudia, Cyfuture, D365, RadiAnt View, Bluehost/GoDaddy, iDrive, printer rentals) and standard planned hardware acquisitions.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleRestoreDefaults}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold py-2.5 px-4 shadow-sm inline-flex items-center gap-2 shrink-0 transition-all hover:shadow"
              >
                <RotateCcw size={14} />
                <span>Reset FY {selectedFiscalYear} Template</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: CLONE / PLAN NEW FISCAL YEAR --- */}
      {showCloneYearModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl max-w-md w-full space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" />
                Plan / Roll Over Fiscal Year
              </h3>
              <button onClick={() => setShowCloneYearModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Clone your planned budget items from <strong>FY {selectedFiscalYear}</strong> into a new fiscal year. Actual expenses will be reset to 0 so you start with a clean execution slate.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Source Fiscal Year</label>
                <input
                  type="text"
                  disabled
                  value={`FY ${selectedFiscalYear}`}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">New Target Fiscal Year</label>
                <input
                  type="number"
                  min="2020"
                  max="2040"
                  value={cloneTargetYear}
                  onChange={(e) => setCloneTargetYear(parseInt(e.target.value, 10) || 2028)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={cloneOverwrite}
                  onChange={(e) => setCloneOverwrite(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span>Overwrite records if FY {cloneTargetYear} already exists</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setShowCloneYearModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button onClick={handleCloneYear} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold">
                Clone into FY {cloneTargetYear}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: CAPEX ITEM ADD / EDIT --- */}
      {showCapexModal && (
        <CapexEditModal
          fiscalYear={selectedFiscalYear}
          item={editingCapexItem}
          sites={SITES.filter(s => s !== 'All Sites')}
          assetCategories={assetCategories}
          onClose={() => setShowCapexModal(false)}
          onSaved={() => {
            setShowCapexModal(false);
            loadAll();
            showToast('CapEx item saved successfully');
          }}
        />
      )}

      {/* --- MODAL: OPEX ITEM ADD / EDIT --- */}
      {showOpexModal && (
        <OpexEditModal
          fiscalYear={selectedFiscalYear}
          item={editingOpexItem}
          sites={SITES.filter(s => s !== 'All Sites')}
          accountCodes={effectiveAccountCodes}
          onManageAccountCodes={() => setShowAccountCodesModal(true)}
          onClose={() => setShowOpexModal(false)}
          onSaved={() => {
            setShowOpexModal(false);
            loadAll();
            showToast('OpEx item saved successfully');
          }}
        />
      )}

      {/* --- MODAL: CONFIGURE MASTER ACCOUNT CODES --- */}
      {showAccountCodesModal && (
        <AccountCodesMasterModal
          accountCodes={effectiveAccountCodes}
          onClose={() => setShowAccountCodesModal(false)}
          onRefresh={() => {
            fetchAccountCodes();
            fetchOpex(selectedFiscalYear, selectedSite, opexAccountFilter, searchQuery);
          }}
          showToast={showToast}
        />
      )}

      {/* --- IN-APP DELETE / RESET CONFIRMATION MODAL --- */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {deleteConfirmItem.type === 'restore-defaults' ? 'Reset to Standard Template?' : `Delete ${deleteConfirmItem.type.toUpperCase()} Item?`}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {deleteConfirmItem.type === 'restore-defaults' 
                    ? `Are you sure you want to reset all CapEx and S-Operation items for FY ${selectedFiscalYear} to the standard Khema Global template? Existing customizations will be overwritten.`
                    : `Are you sure you want to delete this ${deleteConfirmItem.type === 'capex' ? 'CapEx' : 'OpEx & S-Operation'} line item? Budget summary actuals and planned totals will be automatically recalculated.`
                  }
                </p>
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                    {deleteConfirmItem.name}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Fiscal Year: FY {selectedFiscalYear}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>{deleteConfirmItem.type === 'restore-defaults' ? 'Reset Template' : 'Confirm Delete'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: CAPEX EDIT MODAL ---
interface CapexModalProps {
  fiscalYear: number;
  item: CapExItem | null;
  sites: string[];
  assetCategories?: string[];
  onClose: () => void;
  onSaved: () => void;
}

const CapexEditModal: React.FC<CapexModalProps> = ({ fiscalYear, item, sites, assetCategories = [], onClose, onSaved }) => {
  const availableAssetTypes = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();
    const addType = (t: string) => {
      const trimmed = (t || '').trim();
      if (trimmed && !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        list.push(trimmed);
      }
    };
    if (assetCategories && assetCategories.length > 0) {
      assetCategories.forEach(addType);
    }
    if (item?.asset_type) {
      addType(item.asset_type);
    }
    DEFAULT_ASSET_TYPES.forEach(addType);
    return list;
  }, [assetCategories, item]);

  const [description, setDescription] = useState(item?.description || '');
  const [assetType, setAssetType] = useState(
    item?.asset_type || (assetCategories.length > 0 ? assetCategories[0] : (DEFAULT_ASSET_TYPES[0] || 'Computer'))
  );
  const [site, setSite] = useState(item?.site || 'K1');
  const [pic, setPic] = useState(item?.pic || 'Braseth');
  const [costCenter, setCostCenter] = useState(item?.cost_center || 'IT');
  const [projectOwner, setProjectOwner] = useState(item?.project_owner || 'Braseth');
  const [department, setDepartment] = useState(item?.department || 'IT Department');
  const [qty, setQty] = useState(item?.qty || 1);
  const [unitPrice, setUnitPrice] = useState(item?.unit_price || 0);
  const [startDate, setStartDate] = useState(item?.start_date ? item.start_date.slice(0, 10) : '');
  const [completeDate, setCompleteDate] = useState(item?.complete_date ? item.complete_date.slice(0, 10) : '');
  const [status, setStatus] = useState<any>(item?.status || 'Planned');
  const [justification, setJustification] = useState(item?.justification || '');
  const [capexCode, setCapexCode] = useState(item?.capex_code || `Capex#${fiscalYear}-${Math.floor(Math.random() * 900) + 100}`);
  const [saving, setSaving] = useState(false);

  const requestedAmount = qty * unitPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSaving(true);
    try {
      const url = item ? `/api/it-budget/capex/${item.id}` : '/api/it-budget/capex';
      const method = item ? 'PUT' : 'POST';
      const token = localStorage.getItem('token');

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fiscal_year: fiscalYear,
          description: description.trim(),
          asset_type: assetType,
          site,
          pic,
          cost_center: costCenter,
          project_owner: projectOwner,
          department,
          qty: Number(qty),
          unit_price: Number(unitPrice),
          requested_amount: requestedAmount,
          start_date: startDate || null,
          complete_date: completeDate || null,
          status,
          justification: justification.trim(),
          capex_code: capexCode
        })
      });

      if (res.ok) {
        onSaved();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save CapEx item');
      }
    } catch (e: any) {
      alert('Error saving: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers size={18} className="text-indigo-600" />
            <span>{item ? 'Edit CapEx Item' : 'Add New CapEx Item'} (FY {fiscalYear})</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700">Item Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Dell AIO Computer, Patient Card Printer"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Asset Type</label>
                {assetCategories.length > 0 && (
                  <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    Synced ({assetCategories.length})
                  </span>
                )}
              </div>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium"
              >
                {availableAssetTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Khema Campus</label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                {sites.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Quantity</label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-right font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Unit Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-right font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Requested Amount ($)</label>
              <input
                type="text"
                disabled
                value={`$${requestedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className="w-full mt-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-right font-mono font-bold text-indigo-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                {CAPEX_STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Complete Date</label>
              <input
                type="date"
                value={completeDate}
                onChange={(e) => setCompleteDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Person In Charge (PIC)</label>
              <input
                type="text"
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Cost Center</label>
              <input
                type="text"
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700">Business Justification</label>
            <textarea
              rows={2}
              placeholder="e.g. High-durability patient identification and smart hospital card printing..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              {saving ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: MASTER CRUD CONFIGURE ACCOUNT CODES MODAL ---
interface AccountCodesMasterModalProps {
  accountCodes: OpexAccountCode[];
  onClose: () => void;
  onRefresh: () => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const AccountCodesMasterModal: React.FC<AccountCodesMasterModalProps> = ({
  accountCodes,
  onClose,
  onRefresh,
  showToast
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('OpEx');
  const [editingItem, setEditingItem] = useState<OpexAccountCode | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('OpEx');
  const [editIsActive, setEditIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        const err = await res.json();
        alert(err.error || 'Failed to create account code');
      }
    } catch (err: any) {
      alert('Error creating account code: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: OpexAccountCode) => {
    setEditingItem(item);
    setEditCode(item.code);
    setEditName(item.name);
    setEditDescription(item.description || '');
    setEditCategory(item.category || 'OpEx');
    setEditIsActive(item.is_active !== false && item.is_active !== 0);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
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
        const err = await res.json();
        alert(err.error || 'Failed to update account code');
      }
    } catch (err: any) {
      alert('Error updating account code: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, codeName: string) => {
    if (!id) {
      alert('Default static code cannot be deleted directly');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete master account code "${codeName}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/it-budget/account-codes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        showToast(`Account code "${codeName}" deleted`);
        onRefresh();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete account code');
      }
    } catch (err: any) {
      alert('Error deleting: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-800 border border-emerald-200">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Configure Master Account Codes</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {accountCodes.length} Codes
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manage chart of accounts for IT operational expenses, SLA contracts, and recurring services
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Quick Create Form */}
          <div className="bg-gradient-to-br from-emerald-50/60 to-slate-50 p-4 rounded-2xl border border-emerald-200/80 shadow-xs">
            <div className="text-xs font-bold text-emerald-950 mb-3 flex items-center gap-1.5">
              <Plus size={14} className="text-emerald-600 stroke-[3]" />
              <span>Add New Account Code</span>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Account Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 630108 - Cybersecurity SLA"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Account Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cybersecurity SLA"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700">Description / Scope</label>
                  <input
                    type="text"
                    placeholder="e.g. Penetration testing, SOC services, endpoint defense licenses"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="OpEx">OpEx Outside Services</option>
                    <option value="Cloud/SaaS">Cloud & Software</option>
                    <option value="Infrastructure">Infrastructure Maintenance</option>
                    <option value="Telecom">Telecom & Data</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={saving || !code.trim() || !name.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-xs">
                  {saving ? 'Adding...' : 'Save Account Code'}
                </Button>
              </div>
            </form>
          </div>

          {/* List & Search */}
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

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-2xs">
              {filteredCodes.map((item) => {
                const isEditing = editingItem?.id === item.id;
                return (
                  <div key={item.id || item.code} className="p-3 bg-white hover:bg-slate-50/70 transition-colors">
                    {isEditing ? (
                      <form onSubmit={handleUpdate} className="space-y-2.5 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                        <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <Edit2 size={13} />
                          <span>Edit Account Code: {item.code}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] font-bold text-slate-700">Code *</label>
                            <input
                              type="text"
                              required
                              value={editCode}
                              onChange={(e) => setEditCode(e.target.value)}
                              className="w-full mt-0.5 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-700">Name *</label>
                            <input
                              type="text"
                              required
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full mt-0.5 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-slate-700">Description</label>
                            <input
                              type="text"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="w-full mt-0.5 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-700">Category</label>
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="w-full mt-0.5 px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline"
                            >
                              <option value="OpEx">OpEx Outside Services</option>
                              <option value="Cloud/SaaS">Cloud & Software</option>
                              <option value="Infrastructure">Infrastructure Maintenance</option>
                              <option value="Telecom">Telecom & Data</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editIsActive}
                              onChange={(e) => setEditIsActive(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-[11px] font-medium">Active Code</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <Button type="button" variant="outline" onClick={() => setEditingItem(null)} className="text-xs py-1 px-2.5">
                              Cancel
                            </Button>
                            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 px-3">
                              {saving ? 'Saving...' : 'Update'}
                            </Button>
                          </div>
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
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded-full">
                              {item.category || 'OpEx'}
                            </span>
                            {item.is_active === 0 || item.is_active === false ? (
                              <span className="text-[9px] font-semibold text-rose-600 bg-rose-50 px-1.5 rounded">Inactive</span>
                            ) : (
                              <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 rounded">Active</span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 leading-normal pl-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Edit Account Code"
                          >
                            <Edit2 size={13} />
                          </button>
                          {item.id && (
                            <button
                              onClick={() => handleDelete(item.id!, item.code)}
                              disabled={deletingId === item.id}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Delete Account Code"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/50 flex justify-end">
          <Button variant="outline" onClick={onClose} className="text-xs font-semibold px-4 py-1.5">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: OPEX EDIT MODAL ---
interface OpexModalProps {
  fiscalYear: number;
  item: OpExItem | null;
  sites: string[];
  accountCodes?: OpexAccountCode[];
  onManageAccountCodes?: () => void;
  onClose: () => void;
  onSaved: () => void;
}

const OpexEditModal: React.FC<OpexModalProps> = ({ 
  fiscalYear, 
  item, 
  sites, 
  accountCodes = [], 
  onManageAccountCodes = () => {}, 
  onClose, 
  onSaved 
}) => {
  const [description, setDescription] = useState(item?.description || '');
  const [accountCode, setAccountCode] = useState(item?.account_code || '630104 - Other Outside Services');
  const [site, setSite] = useState(item?.site || 'K1');
  const [pic, setPic] = useState(item?.pic || 'Braseth');
  const [costCenter, setCostCenter] = useState(item?.cost_center || 'IT');
  const [billingCycle, setBillingCycle] = useState<any>(item?.billing_cycle || 'Annual');
  const [renewalDate, setRenewalDate] = useState(item?.renewal_date ? item.renewal_date.slice(0, 10) : '');
  const [qty, setQty] = useState(item?.qty || 1);
  const [unitPrice, setUnitPrice] = useState(item?.unit_price || 0);
  const [justification, setJustification] = useState(item?.justification || '');
  const [autoSmartSpread, setAutoSmartSpread] = useState(true);
  const [saving, setSaving] = useState(false);

  // Pure helper to compute 12-month Smart Spread in real time
  const computeSmartSpread = (cycle: string, renDate: string, price: number, q: number) => {
    const total = Number(price || 0) * Number(q || 1);
    const spending: Record<string, { planned: number; actual: number }> = {};
    MONTH_KEYS.forEach(m => {
      spending[m] = { planned: 0, actual: 0 };
    });

    if (cycle === 'Monthly') {
      const monthlyAmt = Number(price || 0) * Number(q || 1);
      MONTH_KEYS.forEach(m => {
        spending[m] = { planned: monthlyAmt, actual: 0 };
      });
    } else if (cycle === 'Quarterly') {
      const qAmt = total / 4;
      spending.mar = { planned: qAmt, actual: 0 };
      spending.jun = { planned: qAmt, actual: 0 };
      spending.sep = { planned: qAmt, actual: 0 };
      spending.dec = { planned: qAmt, actual: 0 };
    } else {
      // Annual - Allocate full amount to renewal month (safely parsed from YYYY-MM-DD)
      let targetIdx = 0; // Default Jan
      if (renDate) {
        const parts = renDate.slice(0, 10).split('-');
        if (parts.length >= 2) {
          const m = parseInt(parts[1], 10);
          if (!isNaN(m) && m >= 1 && m <= 12) targetIdx = m - 1;
        }
      }
      const mKey = MONTH_KEYS[targetIdx] || 'jan';
      spending[mKey] = { planned: total, actual: 0 };
    }
    return spending;
  };

  const [monthlySpending, setMonthlySpending] = useState<Record<string, { planned: number; actual: number }>>(() => {
    if (item?.monthly_spending && typeof item.monthly_spending === 'object' && Object.keys(item.monthly_spending).length > 0) {
      return item.monthly_spending;
    }
    return computeSmartSpread(
      item?.billing_cycle || 'Annual',
      item?.renewal_date ? item.renewal_date.slice(0, 10) : '',
      item?.unit_price || 0,
      item?.qty || 1
    );
  });

  // Automatically recalculate spread when core parameters change and autoSmartSpread is enabled
  useEffect(() => {
    if (autoSmartSpread) {
      const newSpread = computeSmartSpread(billingCycle, renewalDate, unitPrice, qty);
      setMonthlySpending(newSpread);
    }
  }, [billingCycle, renewalDate, unitPrice, qty, autoSmartSpread]);

  const handleToggleSmartSpread = (checked: boolean) => {
    setAutoSmartSpread(checked);
    if (checked) {
      const freshSpread = computeSmartSpread(billingCycle, renewalDate, unitPrice, qty);
      setMonthlySpending(freshSpread);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSaving(true);
    try {
      const url = item ? `/api/it-budget/opex/${item.id}` : '/api/it-budget/opex';
      const method = item ? 'PUT' : 'POST';
      const token = localStorage.getItem('token');

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fiscal_year: fiscalYear,
          description: description.trim(),
          account_code: accountCode,
          account_name: accountCode.includes('-') ? accountCode.split('-')[1].trim() : 'Outside Services',
          site,
          pic,
          cost_center: costCenter,
          billing_cycle: billingCycle,
          renewal_date: renewalDate || null,
          qty: Number(qty),
          unit_price: Number(unitPrice),
          justification: justification.trim(),
          autoSmartSpread,
          monthly_spending: monthlySpending
        })
      });

      if (res.ok) {
        onSaved();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save OpEx item');
      }
    } catch (e: any) {
      alert('Error saving: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-600" />
            <span>{item ? 'Edit OpEx Service' : 'Add New OpEx Service'} (FY {fiscalYear})</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700">Service Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. eHospital Annual Maintenance Fee, MOS/BOS Printer Rental"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Account Code</label>
                <button
                  type="button"
                  onClick={onManageAccountCodes}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 hover:underline transition-colors"
                  title="Configure Master Account Codes"
                >
                  <SlidersHorizontal size={11} />
                  <span>Configure Codes</span>
                </button>
              </div>
              <select
                value={accountCode}
                onChange={(e) => {
                  if (e.target.value === '__MANAGE__') {
                    onManageAccountCodes();
                  } else {
                    setAccountCode(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200/90 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 font-semibold text-xs text-slate-900 shadow-xs hover:border-emerald-400 transition-all cursor-pointer"
              >
                {accountCodes.map(a => (
                  <option key={a.id || a.code} value={a.code} className="text-slate-900 font-medium py-1">
                    {a.code}
                  </option>
                ))}
                <option value="__MANAGE__" className="text-emerald-700 font-bold bg-emerald-50 py-1">
                  ⚙️ + Manage / Configure Account Codes...
                </option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Campus / Site</label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="All Sites">All Sites</option>
                {sites.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="Monthly">Monthly</option>
                <option value="Annual">Annual</option>
                <option value="Quarterly">Quarterly</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Unit Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-right font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Renewal Date</label>
              <input
                type="date"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white shadow-xs cursor-pointer hover:border-emerald-500 hover:shadow-sm transition-all group">
            <input
              type="checkbox"
              checked={autoSmartSpread}
              onChange={(e) => handleToggleSmartSpread(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-colors"
            />
            <span className="flex-1 flex flex-col gap-1 text-slate-800 text-xs">
              <span className="flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-1.5 font-bold text-emerald-950 text-xs">
                  <Sparkles size={14} className="text-emerald-600 shrink-0" />
                  <span>Apply Smart Spread in OpEx Services</span>
                </span>
                {autoSmartSpread ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                    <Check size={11} className="text-emerald-700 stroke-[2.5]" />
                    <span>Active ({billingCycle})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                    Manual Phasing
                  </span>
                )}
              </span>

              <span className="text-[11px] text-slate-600 font-normal leading-relaxed">
                {billingCycle === 'Monthly' && (
                  <>
                    Automatically distributes <strong className="text-emerald-700 font-semibold font-mono">${(unitPrice * qty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>/month evenly across all 12 months (Annual Total: <strong className="text-slate-900 font-semibold font-mono">${(unitPrice * qty * 12).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>).
                  </>
                )}
                {billingCycle === 'Annual' && (
                  <>
                    Allocates annual lump sum of <strong className="text-emerald-700 font-semibold font-mono">${(unitPrice * qty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> directly into renewal month: <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-1 py-0.5 rounded">{renewalDate ? (MONTH_LABELS[parseInt(renewalDate.split('-')[1] || '1', 10) - 1] || 'January') : 'January'}</span>.
                  </>
                )}
                {billingCycle === 'Quarterly' && (
                  <>
                    Splits <strong className="text-emerald-700 font-semibold font-mono">${((unitPrice * qty) / 4).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> per quarter into Mar, Jun, Sep, and Dec (Annual Total: <strong className="text-slate-900 font-semibold font-mono">${(unitPrice * qty).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>).
                  </>
                )}
              </span>
            </span>
          </label>

          {/* Live 12-Month Spread Visualization */}
          <div className="bg-slate-50/90 rounded-xl border border-slate-200/90 p-2.5 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Layers size={13} className="text-indigo-600" />
                <span>12-Month Phasing Preview (FY {fiscalYear})</span>
              </span>
              <span className="font-mono font-bold text-emerald-700 text-xs">
                Annual Planned: ${MONTH_KEYS.reduce((acc, m) => acc + (monthlySpending[m]?.planned || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 text-center">
              {MONTH_KEYS.map((m, mIdx) => {
                const amt = monthlySpending[m]?.planned || 0;
                const isNonZero = amt > 0;
                return (
                  <div 
                    key={m} 
                    className={`p-1 rounded-lg border text-[10px] transition-all ${
                      isNonZero 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-2xs' 
                        : 'bg-white border-slate-200/80 text-slate-400'
                    }`}
                  >
                    <div className="text-[9px] uppercase font-semibold text-slate-500">{MONTH_LABELS[mIdx]}</div>
                    <div className="font-mono mt-0.5 truncate text-[10px]">
                      ${amt >= 1000 ? `${(amt / 1000).toFixed(1)}k` : amt.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700">Business Justification</label>
            <textarea
              rows={2}
              placeholder="e.g. Core Hospital Information System 24/7 SLA maintenance..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              {saving ? 'Saving...' : item ? 'Update Service' : 'Create Service'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
