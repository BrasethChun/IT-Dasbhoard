import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Receipt, DollarSign, TrendingUp, Calendar, Filter, Search, Plus, 
  Edit2, Trash2, Download, Upload, RefreshCw, CheckCircle2, Clock, 
  AlertCircle, AlertTriangle, Building2, Layers, Tag, CreditCard, 
  ArrowUpRight, ArrowDownRight, ExternalLink, X, FileText, Check,
  SlidersHorizontal, ChevronDown, CheckSquare, Sparkles, BarChart3,
  PieChart as PieIcon, ArrowRight, Settings2, MapPin, Calculator
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import * as XLSX from 'xlsx';
import { Button } from '../../components/ui/Button';

export interface ITExpenseTransaction {
  id: string;
  fiscal_year: number;
  expense_date: string;
  invoice_no: string;
  po_no: string;
  vendor_name: string;
  description: string;
  budget_type: 'CapEx' | 'OpEx';
  linked_budget_id: string | null;
  linked_item_name: string | null;
  site_name: string;
  category: string;
  amount: number;
  payment_status: 'Paid' | 'Pending' | 'Processing' | 'Overdue';
  payment_method: string;
  payment_date: string | null;
  receipt_url: string | null;
  notes: string;
  budget_classification?: 'Planned' | 'Unplanned' | 'Settled';
  unplanned_reason?: string;
  approval_ref?: string;
  settlement_status?: 'Unsettled' | 'Settled' | 'Absorbed';
}

export interface BudgetOption {
  id: string;
  name: string;
  raw_name: string;
  site: string;
  category: string;
  budget_amount: number;
}

export interface KhemaCampusItem {
  id: string;
  site_name: string;
  code?: string;
  location?: string;
  status: 'Active' | 'Inactive';
  expense_count?: number;
  total_expense_amount?: number | string;
}

export interface ITExpenseCategory {
  id: string;
  category_name: string;
  code: string;
  gl_account_code?: string;
  budget_type?: 'CapEx' | 'OpEx' | 'Both';
  description?: string;
  status: 'Active' | 'Inactive';
  expense_count?: number;
  total_expense_amount?: number | string;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_CAMPUSES = ['All Sites', 'K1', 'K2', 'KG', 'Sakal'];
export const SITES = DEFAULT_CAMPUSES;
const BUDGET_TYPES = ['All Types', 'CapEx', 'OpEx', 'Unbudgeted'];
export const BUDGET_CLASSIFICATIONS = [
  'All Classifications',
  'Planned (Budgeted)',
  'Unplanned (Emergency)',
  'Settled Unplanned'
] as const;
const PAYMENT_STATUSES = ['All Statuses', 'Paid', 'Pending', 'Processing', 'Overdue'];
const PAYMENT_METHODS = ['Bank Transfer', 'Credit Card', 'Cheque', 'Cash', 'Direct Debit'];
const DEFAULT_EXPENSE_CATEGORIES = [
  'Hardware & Printers',
  'Computers & Terminals',
  'Laptops & Mobile',
  'CCTV & Security',
  'Network & Infrastructure',
  'Software Maintenance',
  'Cloud Infrastructure',
  'Equipment Rental',
  'Telecommunications',
  'General IT Services'
];

export const ITExpensesModule: React.FC<{ sites?: any[] }> = ({ sites = [] }) => {
  // Primary Annual Fiscal Year (Persisted across refreshes)
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(() => {
    const saved = localStorage.getItem('khema_it_expenses_fiscal_year');
    return saved ? parseInt(saved, 10) || 2026 : 2026;
  });
  const [availableYears, setAvailableYears] = useState<number[]>([2026, 2027, 2028, 2029, 2030]);

  useEffect(() => {
    localStorage.setItem('khema_it_expenses_fiscal_year', String(selectedFiscalYear));
  }, [selectedFiscalYear]);

  // Dynamic asset categories synced from IT Asset Management
  const [assetCategories, setAssetCategories] = useState<string[]>([]);

  // Date Range Presets & Filter (Default: all expenses for that fiscal year)
  type DateRangePreset = 
    | 'all-year' 
    | 'this-month' 
    | 'last-30' 
    | 'last-60' 
    | 'last-90' 
    | 'q1' 
    | 'q2' 
    | 'q3' 
    | 'q4' 
    | 'h1' 
    | 'h2' 
    | 'custom';

  const [dateRangeMode, setDateRangeMode] = useState<DateRangePreset>('all-year');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Dedicated Monthly Range Filter for Executive Summary & Analytics
  type ExecMonthPreset = 'all-year' | 'q1' | 'q2' | 'q3' | 'q4' | 'h1' | 'h2' | 'custom';
  const [execMonthPreset, setExecMonthPreset] = useState<ExecMonthPreset>('all-year');
  const [execFromMonth, setExecFromMonth] = useState<number>(1); // 1 = January
  const [execToMonth, setExecToMonth] = useState<number>(12);   // 12 = December
  const [execFromDate, setExecFromDate] = useState<string>('');
  const [execToDate, setExecToDate] = useState<string>('');

  const MONTHS = [
    { value: 1, name: 'January', short: 'Jan' },
    { value: 2, name: 'February', short: 'Feb' },
    { value: 3, name: 'March', short: 'Mar' },
    { value: 4, name: 'April', short: 'Apr' },
    { value: 5, name: 'May', short: 'May' },
    { value: 6, name: 'June', short: 'Jun' },
    { value: 7, name: 'July', short: 'Jul' },
    { value: 8, name: 'August', short: 'Aug' },
    { value: 9, name: 'September', short: 'Sep' },
    { value: 10, name: 'October', short: 'Oct' },
    { value: 11, name: 'November', short: 'Nov' },
    { value: 12, name: 'December', short: 'Dec' },
  ];

  const getLastDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const padZero = (n: number) => String(n).padStart(2, '0');

  const applyExecMonthPreset = (preset: ExecMonthPreset, year: number = selectedFiscalYear) => {
    setExecMonthPreset(preset);
    if (preset === 'all-year') {
      setExecFromMonth(1);
      setExecToMonth(12);
      setExecFromDate('');
      setExecToDate('');
    } else if (preset === 'q1') {
      setExecFromMonth(1);
      setExecToMonth(3);
      setExecFromDate(`${year}-01-01`);
      setExecToDate(`${year}-03-31`);
    } else if (preset === 'q2') {
      setExecFromMonth(4);
      setExecToMonth(6);
      setExecFromDate(`${year}-04-01`);
      setExecToDate(`${year}-06-30`);
    } else if (preset === 'q3') {
      setExecFromMonth(7);
      setExecToMonth(9);
      setExecFromDate(`${year}-07-01`);
      setExecToDate(`${year}-09-30`);
    } else if (preset === 'q4') {
      setExecFromMonth(10);
      setExecToMonth(12);
      setExecFromDate(`${year}-10-01`);
      setExecToDate(`${year}-12-31`);
    } else if (preset === 'h1') {
      setExecFromMonth(1);
      setExecToMonth(6);
      setExecFromDate(`${year}-01-01`);
      setExecToDate(`${year}-06-30`);
    } else if (preset === 'h2') {
      setExecFromMonth(7);
      setExecToMonth(12);
      setExecFromDate(`${year}-07-01`);
      setExecToDate(`${year}-12-31`);
    }
  };

  const handleCustomMonthChange = (fromM: number, toM: number, year: number = selectedFiscalYear) => {
    const validFrom = Math.min(fromM, toM);
    const validTo = Math.max(fromM, toM);
    setExecFromMonth(validFrom);
    setExecToMonth(validTo);
    setExecMonthPreset('custom');
    const lastDay = getLastDayOfMonth(year, validTo);
    setExecFromDate(`${year}-${padZero(validFrom)}-01`);
    setExecToDate(`${year}-${padZero(validTo)}-${padZero(lastDay)}`);
  };

  const handleFromMonthSelect = (newFrom: number) => {
    const to = Math.max(newFrom, execToMonth);
    handleCustomMonthChange(newFrom, to);
  };

  const handleToMonthSelect = (newTo: number) => {
    const from = Math.min(execFromMonth, newTo);
    handleCustomMonthChange(from, newTo);
  };

  // Sub-view Separation: Executive Summary (Analytics Dashboard) vs Expense Records & Tracking Ledger
  type SubView = 'analytics' | 'ledger';
  const [searchParams, setSearchParams] = useSearchParams();
  const subviewParam = searchParams.get('subview');
  const [activeSubView, setActiveSubView] = useState<SubView>(
    subviewParam === 'ledger' ? 'ledger' : 'analytics'
  );

  const handleSubViewChange = (view: SubView) => {
    setActiveSubView(view);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('subview', view);
    setSearchParams(newParams, { replace: true });
  };

  // Filters & Dynamic Campus State
  const [campusList, setCampusList] = useState<string[]>(DEFAULT_CAMPUSES);
  const [campusesData, setCampusesData] = useState<KhemaCampusItem[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('All Sites');
  
  // Khema Campus & Expense Configuration Modal State
  const [showCampusManageModal, setShowCampusManageModal] = useState<boolean>(false);
  const [configActiveSection, setConfigActiveSection] = useState<'campuses' | 'categories'>('campuses');

  // Campus CRUD State
  const [campusManageTab, setCampusManageTab] = useState<'list' | 'form'>('list');
  const [campusFormMode, setCampusFormMode] = useState<'create' | 'edit'>('create');
  const [editingCampusItem, setEditingCampusItem] = useState<KhemaCampusItem | null>(null);
  const [campusFormSiteName, setCampusFormSiteName] = useState<string>('');
  const [campusFormCode, setCampusFormCode] = useState<string>('');
  const [campusFormLocation, setCampusFormLocation] = useState<string>('');
  const [campusFormStatus, setCampusFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [syncExpensesOnRename, setSyncExpensesOnRename] = useState<boolean>(true);
  const [campusDeletingItem, setCampusDeletingItem] = useState<KhemaCampusItem | null>(null);
  const [reassignTargetSite, setReassignTargetSite] = useState<string>('All Sites');
  const [isSavingCampusCrud, setIsSavingCampusCrud] = useState<boolean>(false);
  const [isDeletingCampusCrud, setIsDeletingCampusCrud] = useState<boolean>(false);

  // General IT & Expense Categories CRUD State
  const [expenseCategoriesData, setExpenseCategoriesData] = useState<ITExpenseCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [categoryManageTab, setCategoryManageTab] = useState<'list' | 'form'>('list');
  const [categoryFormMode, setCategoryFormMode] = useState<'create' | 'edit'>('create');
  const [editingCategoryItem, setEditingCategoryItem] = useState<ITExpenseCategory | null>(null);
  const [categoryFormName, setCategoryFormName] = useState<string>('');
  const [categoryFormCode, setCategoryFormCode] = useState<string>('');
  const [categoryFormGlCode, setCategoryFormGlCode] = useState<string>('');
  const [categoryFormBudgetType, setCategoryFormBudgetType] = useState<'CapEx' | 'OpEx' | 'Both'>('OpEx');
  const [categoryFormDescription, setCategoryFormDescription] = useState<string>('');
  const [categoryFormStatus, setCategoryFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [syncExpensesOnCategoryRename, setSyncExpensesOnCategoryRename] = useState<boolean>(true);
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [categoryBudgetTypeFilter, setCategoryBudgetTypeFilter] = useState<string>('All');
  const [isSavingCategoryCrud, setIsSavingCategoryCrud] = useState<boolean>(false);
  const [categoryDeletingItem, setCategoryDeletingItem] = useState<ITExpenseCategory | null>(null);
  const [categoryReassignTarget, setCategoryReassignTarget] = useState<string>('General IT Services');
  const [isDeletingCategoryCrud, setIsDeletingCategoryCrud] = useState<boolean>(false);

  // Backward compatibility aliases
  const showAddCampusModal = showCampusManageModal;
  const setShowAddCampusModal = (open: boolean) => {
    if (open) {
      setConfigActiveSection('campuses');
      setCampusManageTab('form');
      setCampusFormMode('create');
      setCampusFormSiteName('');
      setCampusFormCode('');
      setCampusFormLocation('');
      setCampusFormStatus('Active');
    }
    setShowCampusManageModal(open);
  };
  const isSavingCampus = isSavingCampusCrud;

  const [selectedBudgetType, setSelectedBudgetType] = useState<string>('All Types');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('All Statuses');
  const [selectedClassification, setSelectedClassification] = useState<string>('All');
  const [selectedLinkedBudgetId, setSelectedLinkedBudgetId] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data
  const [transactions, setTransactions] = useState<ITExpenseTransaction[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [budgetOptions, setBudgetOptions] = useState<{ capexOptions: BudgetOption[]; opexOptions: BudgetOption[] }>({
    capexOptions: [],
    opexOptions: []
  });

  // Consolidated list of all planned budget initiatives for filtering
  const allPlannedBudgetOptions = useMemo(() => {
    const list: Array<{ id: string; name: string; raw_name: string; budget_type: 'CapEx' | 'OpEx'; site: string; category: string; budget_amount: number }> = [];
    (budgetOptions.capexOptions || []).forEach(c => {
      list.push({ ...c, budget_type: 'CapEx' });
    });
    (budgetOptions.opexOptions || []).forEach(o => {
      list.push({ ...o, budget_type: 'OpEx' });
    });
    return list;
  }, [budgetOptions]);

  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'budgeted' | 'unbudgeted'>('budgeted');
  const [editingTransaction, setEditingTransaction] = useState<ITExpenseTransaction | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<{ id: string; description: string; amount: number; vendor: string } | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Settle Unplanned Expense State
  const [settlingTransaction, setSettlingTransaction] = useState<ITExpenseTransaction | null>(null);
  const [settleBudgetType, setSettleBudgetType] = useState<'CapEx' | 'OpEx'>('OpEx');
  const [settleBudgetId, setSettleBudgetId] = useState<string>('');
  const [settleItemName, setSettleItemName] = useState<string>('');
  const [isSubmittingSettle, setIsSubmittingSettle] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const formatYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Preset date range helper with comprehensive range support
  const handleSetPresetRange = (preset: DateRangePreset) => {
    setDateRangeMode(preset);
    if (preset === 'all-year') {
      setFromDate('');
      setToDate('');
    } else if (preset === 'this-month') {
      const now = new Date();
      const monthIdx = now.getFullYear() === selectedFiscalYear ? now.getMonth() : 0;
      const start = new Date(selectedFiscalYear, monthIdx, 1);
      const end = new Date(selectedFiscalYear, monthIdx + 1, 0);
      setFromDate(formatYMD(start));
      setToDate(formatYMD(end));
    } else if (preset === 'last-30' || preset === 'last-60' || preset === 'last-90') {
      const today = new Date();
      let baseDate = today;
      if (today.getFullYear() < selectedFiscalYear) {
        baseDate = new Date(selectedFiscalYear, 0, 31);
      } else if (today.getFullYear() > selectedFiscalYear) {
        baseDate = new Date(selectedFiscalYear, 11, 31);
      }
      const days = preset === 'last-30' ? 30 : preset === 'last-60' ? 60 : 90;
      const past = new Date(baseDate);
      past.setDate(past.getDate() - days);
      setFromDate(formatYMD(past));
      setToDate(formatYMD(baseDate));
    } else if (preset === 'q1') {
      setFromDate(`${selectedFiscalYear}-01-01`);
      setToDate(`${selectedFiscalYear}-03-31`);
    } else if (preset === 'q2') {
      setFromDate(`${selectedFiscalYear}-04-01`);
      setToDate(`${selectedFiscalYear}-06-30`);
    } else if (preset === 'q3') {
      setFromDate(`${selectedFiscalYear}-07-01`);
      setToDate(`${selectedFiscalYear}-09-30`);
    } else if (preset === 'q4') {
      setFromDate(`${selectedFiscalYear}-10-01`);
      setToDate(`${selectedFiscalYear}-12-31`);
    } else if (preset === 'h1') {
      setFromDate(`${selectedFiscalYear}-01-01`);
      setToDate(`${selectedFiscalYear}-06-30`);
    } else if (preset === 'h2') {
      setFromDate(`${selectedFiscalYear}-07-01`);
      setToDate(`${selectedFiscalYear}-12-31`);
    }
  };

  // Fetch transactions
  const fetchTransactions = async (
    fy: number = selectedFiscalYear, 
    site: string = selectedSite, 
    bType: string = selectedBudgetType, 
    status: string = selectedPaymentStatus, 
    q: string = searchQuery,
    fromD: string = fromDate,
    toD: string = toDate,
    cat: string = selectedCategory,
    classification: string = selectedClassification,
    linkedId: string = selectedLinkedBudgetId
  ) => {
    try {
      const params = new URLSearchParams({ fiscal_year: String(fy) });
      if (site !== 'All Sites') params.append('site', site);
      if (bType !== 'All Types' && bType !== 'All') params.append('budget_type', bType);
      if (status !== 'All Statuses') params.append('payment_status', status);
      if (cat && cat !== 'All Categories' && cat !== 'All') params.append('category', cat);
      if (linkedId && linkedId !== 'All' && linkedId !== 'All Items') params.append('linked_budget_id', linkedId);
      if (classification && classification !== 'All' && classification !== 'All Classifications') {
        const cVal = classification.includes('Unplanned') 
          ? 'Unplanned' 
          : classification.includes('Planned') 
          ? 'Planned' 
          : classification.includes('Settled') 
          ? 'Settled' 
          : classification;
        params.append('budget_classification', cVal);
      }
      if (q.trim()) params.append('search', q.trim());
      if (fromD && fromD.trim()) params.append('from_date', fromD.trim());
      if (toD && toD.trim()) params.append('to_date', toD.trim());

      const res = await fetch(`/api/it-expenses?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (e: any) {
      console.error('Error fetching transactions:', e);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async (
    fy: number = selectedFiscalYear, 
    site: string = selectedSite,
    fromD: string = fromDate,
    toD: string = toDate,
    classification: string = selectedClassification,
    bType: string = selectedBudgetType,
    cat: string = selectedCategory,
    linkedId: string = selectedLinkedBudgetId
  ) => {
    try {
      const params = new URLSearchParams({ fiscal_year: String(fy) });
      if (site !== 'All Sites') params.append('site', site);
      if (bType !== 'All Types' && bType !== 'All') params.append('budget_type', bType);
      if (cat && cat !== 'All Categories' && cat !== 'All') params.append('category', cat);
      if (linkedId && linkedId !== 'All' && linkedId !== 'All Items') params.append('linked_budget_id', linkedId);
      if (fromD && fromD.trim()) params.append('from_date', fromD.trim());
      if (toD && toD.trim()) params.append('to_date', toD.trim());
      if (classification && classification !== 'All' && classification !== 'All Classifications') {
        const cVal = classification.includes('Unplanned') 
          ? 'Unplanned' 
          : classification.includes('Planned') 
          ? 'Planned' 
          : classification.includes('Settled') 
          ? 'Settled' 
          : classification;
        params.append('budget_classification', cVal);
      }

      const res = await fetch(`/api/it-expenses/analytics?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e: any) {
      console.error('Error fetching analytics:', e);
    }
  };

  // Fetch budget options for linking dropdowns
  const fetchBudgetOptions = async (fy: number = selectedFiscalYear) => {
    try {
      const res = await fetch(`/api/it-expenses/budget-options?fiscal_year=${fy}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setBudgetOptions({
          capexOptions: data.capexOptions || [],
          opexOptions: data.opexOptions || []
        });
      }
    } catch (e: any) {
      console.error('Error fetching budget options:', e);
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

  // Fetch dynamic campuses from /api/sites with expense statistics
  const fetchSites = async () => {
    try {
      const res = await fetch('/api/sites', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCampusesData(data);
          const names = data.map((s: any) => s.site_name).filter(Boolean);
          // Strictly use active campuses returned from database without re-injecting deleted ones
          const combined = Array.from(new Set(['All Sites', ...names]));
          setCampusList(combined);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not fetch sites from /api/sites:', e);
    }
  };

  // Fetch General IT & Expense Categories from /api/expense-categories with live statistics
  const fetchExpenseCategories = async () => {
    try {
      const res = await fetch('/api/expense-categories', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setExpenseCategoriesData(data);
          return data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch /api/expense-categories:', e);
    }
    return [];
  };

  const handleOpenManageCampuses = (section: 'campuses' | 'categories' = 'campuses') => {
    setConfigActiveSection(section);
    if (section === 'campuses') {
      setCampusManageTab('list');
    } else {
      setCategoryManageTab('list');
    }
    setShowCampusManageModal(true);
  };

  const handleOpenManageCategories = () => {
    handleOpenManageCampuses('categories');
  };

  const handleOpenCreateCategory = () => {
    setConfigActiveSection('categories');
    setCategoryManageTab('form');
    setCategoryFormMode('create');
    setEditingCategoryItem(null);
    setCategoryFormName('');
    setCategoryFormCode('');
    setCategoryFormGlCode('');
    setCategoryFormBudgetType('OpEx');
    setCategoryFormDescription('');
    setCategoryFormStatus('Active');
    setSyncExpensesOnCategoryRename(true);
    setShowCampusManageModal(true);
  };

  const handleOpenEditCategory = (cat: ITExpenseCategory) => {
    setConfigActiveSection('categories');
    setCategoryManageTab('form');
    setCategoryFormMode('edit');
    setEditingCategoryItem(cat);
    setCategoryFormName(cat.category_name || '');
    setCategoryFormCode(cat.code || '');
    setCategoryFormGlCode(cat.gl_account_code || '');
    setCategoryFormBudgetType(cat.budget_type || 'OpEx');
    setCategoryFormDescription(cat.description || '');
    setCategoryFormStatus(cat.status || 'Active');
    setSyncExpensesOnCategoryRename(true);
    setShowCampusManageModal(true);
  };

  const handleSaveCategoryCrud = async (e: React.FormEvent) => {
    e.preventDefault();
    const catName = categoryFormName.trim();
    if (!catName) {
      alert('Please enter a category name.');
      return;
    }

    setIsSavingCategoryCrud(true);
    try {
      if (categoryFormMode === 'create') {
        const res = await fetch('/api/expense-categories', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            category_name: catName,
            code: categoryFormCode.trim() || catName.slice(0, 8).toUpperCase().replace(/\s+/g, '-'),
            gl_account_code: categoryFormGlCode.trim(),
            budget_type: categoryFormBudgetType,
            description: categoryFormDescription.trim(),
            status: categoryFormStatus
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create category');
        }

        showToast(`Category "${catName}" created successfully!`, 'success');
      } else if (categoryFormMode === 'edit' && editingCategoryItem) {
        const oldName = editingCategoryItem.category_name;
        const res = await fetch(`/api/expense-categories/${editingCategoryItem.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            category_name: catName,
            code: categoryFormCode.trim() || catName.slice(0, 8).toUpperCase().replace(/\s+/g, '-'),
            gl_account_code: categoryFormGlCode.trim(),
            budget_type: categoryFormBudgetType,
            description: categoryFormDescription.trim(),
            status: categoryFormStatus,
            sync_expenses: syncExpensesOnCategoryRename
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update category');
        }

        const data = await res.json();
        const updatedCount = data.updatedExpenses || 0;

        if (selectedCategory === oldName) {
          setSelectedCategory(catName);
        }

        showToast(
          syncExpensesOnCategoryRename && updatedCount > 0
            ? `Category updated! ${updatedCount} expense record${updatedCount > 1 ? 's' : ''} synchronized to "${catName}".`
            : `Category "${catName}" updated successfully!`,
          'success'
        );
      }

      setCategoryManageTab('list');
      await fetchExpenseCategories();
      await fetchTransactions(selectedFiscalYear, selectedSite, selectedBudgetType, selectedPaymentStatus, searchQuery, fromDate, toDate, selectedCategory);
    } catch (err: any) {
      alert('Error saving category: ' + err.message);
    } finally {
      setIsSavingCategoryCrud(false);
    }
  };

  const handlePromptDeleteCategory = (cat: ITExpenseCategory) => {
    setCategoryDeletingItem(cat);
    const fallback = expenseCategoriesData.find(c => c.category_name !== cat.category_name && c.status === 'Active')?.category_name 
      || 'General IT Services';
    setCategoryReassignTarget(fallback);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryDeletingItem) return;
    setIsDeletingCategoryCrud(true);
    try {
      const res = await fetch(`/api/expense-categories/${categoryDeletingItem.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reassign_to: categoryReassignTarget
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete category');
      }

      const data = await res.json();
      const reassignedCount = data.reassigned_count || 0;

      if (selectedCategory === categoryDeletingItem.category_name) {
        setSelectedCategory('All Categories');
      }

      showToast(
        reassignedCount > 0
          ? `Category deleted. ${reassignedCount} linked expense${reassignedCount > 1 ? 's' : ''} reassigned to "${categoryReassignTarget}".`
          : `Category "${categoryDeletingItem.category_name}" deleted.`,
        'info'
      );

      setCategoryDeletingItem(null);
      await fetchExpenseCategories();
      await fetchTransactions(selectedFiscalYear, selectedSite, selectedBudgetType, selectedPaymentStatus, searchQuery, fromDate, toDate, selectedCategory);
    } catch (err: any) {
      alert('Error deleting category: ' + err.message);
    } finally {
      setIsDeletingCategoryCrud(false);
    }
  };

  const handleOpenCreateCampus = () => {
    setCampusFormMode('create');
    setEditingCampusItem(null);
    setCampusFormSiteName('');
    setCampusFormCode('');
    setCampusFormLocation('');
    setCampusFormStatus('Active');
    setSyncExpensesOnRename(true);
    setCampusManageTab('form');
    setShowCampusManageModal(true);
  };

  const handleOpenEditCampus = (campus: KhemaCampusItem) => {
    setCampusFormMode('edit');
    setEditingCampusItem(campus);
    setCampusFormSiteName(campus.site_name || '');
    setCampusFormCode(campus.code || '');
    setCampusFormLocation(campus.location || '');
    setCampusFormStatus(campus.status || 'Active');
    setSyncExpensesOnRename(true);
    setCampusManageTab('form');
    setShowCampusManageModal(true);
  };

  const handleSaveCampusCrud = async (e: React.FormEvent) => {
    e.preventDefault();
    const siteName = campusFormSiteName.trim();
    if (!siteName) {
      alert('Please enter a campus name.');
      return;
    }

    setIsSavingCampusCrud(true);
    try {
      if (campusFormMode === 'create') {
        const res = await fetch('/api/sites', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            site_name: siteName,
            code: campusFormCode.trim() || siteName.slice(0, 4).toUpperCase(),
            location: campusFormLocation.trim(),
            status: campusFormStatus
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create campus');
        }

        // Also register in business units for assets if applicable
        await fetch('/api/it-assets/config/bus', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            bu_name: siteName,
            code_prefix_fixed: (campusFormCode.trim() || siteName).slice(0, 4).toUpperCase() + 'PH',
            code_prefix_control: (campusFormCode.trim() || siteName).slice(0, 4).toUpperCase() + '-AC',
            address: campusFormLocation.trim()
          })
        }).catch(err => console.warn('Could not POST to /api/it-assets/config/bus:', err));

        showToast(`Campus "${siteName}" created successfully!`, 'success');
        setSelectedSite(siteName);
      } else if (campusFormMode === 'edit' && editingCampusItem) {
        const oldName = editingCampusItem.site_name;
        const res = await fetch(`/api/sites/${editingCampusItem.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            site_name: siteName,
            code: campusFormCode.trim() || siteName.slice(0, 4).toUpperCase(),
            location: campusFormLocation.trim(),
            status: campusFormStatus,
            sync_expenses: syncExpensesOnRename
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update campus');
        }

        const data = await res.json();
        const updatedCount = data.updated_expenses_count || 0;
        
        // If the user had selected the old name in the filter, update it to the new name!
        if (selectedSite === oldName) {
          setSelectedSite(siteName);
        }

        showToast(
          syncExpensesOnRename && updatedCount > 0
            ? `Campus updated! ${updatedCount} expense record${updatedCount > 1 ? 's' : ''} synchronized to "${siteName}".`
            : `Campus "${siteName}" updated successfully!`,
          'success'
        );
      }

      setCampusManageTab('list');
      await loadAll();
    } catch (err: any) {
      alert('Error saving campus: ' + err.message);
    } finally {
      setIsSavingCampusCrud(false);
    }
  };

  const handlePromptDeleteCampus = (campus: KhemaCampusItem) => {
    setCampusDeletingItem(campus);
    // Find an alternative campus for default reassignment
    const fallback = campusList.find(c => c !== 'All Sites' && c !== campus.site_name) || 'All Sites';
    setReassignTargetSite(fallback);
  };

  const handleConfirmDeleteCampus = async () => {
    if (!campusDeletingItem) return;
    setIsDeletingCampusCrud(true);
    try {
      const res = await fetch(`/api/sites/${campusDeletingItem.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reassign_to: reassignTargetSite
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete campus');
      }

      const data = await res.json();
      const reassignedCount = data.reassigned_expenses_count || 0;

      // If deleted campus was currently selected, reset filter to the reassignment target
      if (selectedSite === campusDeletingItem.site_name) {
        setSelectedSite(reassignTargetSite);
      }

      showToast(
        reassignedCount > 0
          ? `Campus deleted. ${reassignedCount} linked expense${reassignedCount > 1 ? 's' : ''} reassigned to "${reassignTargetSite}".`
          : `Campus "${campusDeletingItem.site_name}" deleted.`,
        'info'
      );

      const deletedName = campusDeletingItem.site_name;
      const deletedId = campusDeletingItem.id;
      setCampusesData(prev => prev.filter(c => c.id !== deletedId && c.site_name !== deletedName));
      setCampusList(prev => prev.filter(s => s !== deletedName));
      setCampusDeletingItem(null);
      await loadAll();
    } catch (err: any) {
      alert('Error deleting campus: ' + err.message);
    } finally {
      setIsDeletingCampusCrud(false);
    }
  };

  // Backward compatibility wrapper for old single-field submit
  const handleSaveNewCampus = handleSaveCampusCrud;

  const loadAll = async () => {
    setLoading(true);
    const curFrom = activeSubView === 'analytics' ? execFromDate : fromDate;
    const curTo = activeSubView === 'analytics' ? execToDate : toDate;
    await Promise.all([
      fetchTransactions(selectedFiscalYear, selectedSite, selectedBudgetType, selectedPaymentStatus, searchQuery, curFrom, curTo, selectedCategory, selectedClassification, selectedLinkedBudgetId),
      fetchAnalytics(selectedFiscalYear, selectedSite, curFrom, curTo, selectedClassification, selectedBudgetType, selectedCategory, selectedLinkedBudgetId),
      fetchBudgetOptions(selectedFiscalYear),
      fetchAssetCategories(),
      fetchSites(),
      fetchExpenseCategories()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    // Whenever fiscal year changes, default to all expenses for that fiscal year
    setDateRangeMode('all-year');
    setFromDate('');
    setToDate('');
    // Also reset executive summary monthly filter to full year
    setExecMonthPreset('all-year');
    setExecFromMonth(1);
    setExecToMonth(12);
    setExecFromDate('');
    setExecToDate('');
    setSelectedLinkedBudgetId('All');
    loadAll();
  }, [selectedFiscalYear, selectedSite]);

  useEffect(() => {
    const curFrom = activeSubView === 'analytics' ? execFromDate : fromDate;
    const curTo = activeSubView === 'analytics' ? execToDate : toDate;
    fetchTransactions(selectedFiscalYear, selectedSite, selectedBudgetType, selectedPaymentStatus, searchQuery, curFrom, curTo, selectedCategory, selectedClassification, selectedLinkedBudgetId);
    fetchAnalytics(selectedFiscalYear, selectedSite, curFrom, curTo, selectedClassification, selectedBudgetType, selectedCategory, selectedLinkedBudgetId);
  }, [activeSubView, selectedSite, selectedCategory, selectedBudgetType, selectedPaymentStatus, selectedClassification, selectedLinkedBudgetId, searchQuery, fromDate, toDate, execFromDate, execToDate]);

  // Delete transaction with safe in-app confirmation modal (eliminates blocked window.confirm in iframes)
  const handleDelete = (id: string, desc: string, amount?: number, vendor?: string) => {
    setDeleteModalItem({
      id,
      description: desc,
      amount: amount || 0,
      vendor: vendor || ''
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/it-expenses/${deleteModalItem.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('Expense transaction removed and budget actuals synced', 'success');
        setDeleteModalItem(null);
        loadAll();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to delete expense transaction', 'error');
      }
    } catch (e: any) {
      showToast('Error deleting expense: ' + e.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const exportData = transactions.map((tx, idx) => ({
        'No': idx + 1,
        'Fiscal Year': tx.fiscal_year,
        'Date': tx.expense_date ? tx.expense_date.slice(0, 10) : '',
        'Invoice #': tx.invoice_no || '',
        'PO #': tx.po_no || '',
        'Description': tx.description,
        'Budget Type': tx.budget_type,
        'Classification': tx.budget_classification || (tx.linked_budget_id ? 'Planned' : 'Unplanned'),
        'Linked Budget Item': tx.linked_item_name || 'Unlinked',
        'Vendor Name': tx.vendor_name,
        'Campus': tx.site_name,
        'Category': tx.category,
        'Amount ($)': Number(tx.amount),
        'Payment Status': tx.payment_status,
        'Payment Method': tx.payment_method,
        'Payment Date': tx.payment_date ? tx.payment_date.slice(0, 10) : '',
        'Approval Ref': tx.approval_ref || '',
        'Unplanned Reason': tx.unplanned_reason || '',
        'Settlement Status': tx.settlement_status || 'Unsettled',
        'Notes': tx.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `IT_Expenses_FY${selectedFiscalYear}`);
      XLSX.writeFile(wb, `Khema_IT_Expenses_and_Tracking_FY${selectedFiscalYear}.xlsx`);
      showToast(`Exported ${transactions.length} IT expense records to Excel!`, 'success');
    } catch (e: any) {
      showToast('Export failed: ' + e.message, 'error');
    }
  };

  // Chart data sliced to active month range in Executive Summary
  const displayChartData = useMemo(() => {
    if (!analytics?.monthlyChartData) return [];
    if (activeSubView === 'analytics' && execMonthPreset !== 'all-year') {
      return analytics.monthlyChartData.slice(execFromMonth - 1, execToMonth);
    }
    return analytics.monthlyChartData;
  }, [analytics?.monthlyChartData, activeSubView, execMonthPreset, execFromMonth, execToMonth]);

  // Category breakdown for Executive Summary
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { total: number; count: number; capex: number; opex: number }> = {};
    transactions.forEach(t => {
      const cat = t.category || 'General IT Services';
      if (!map[cat]) map[cat] = { total: 0, count: 0, capex: 0, opex: 0 };
      map[cat].total += Number(t.amount || 0);
      map[cat].count += 1;
      if (t.budget_type === 'CapEx') map[cat].capex += Number(t.amount || 0);
      else map[cat].opex += Number(t.amount || 0);
    });
    return Object.entries(map).map(([category, val]) => ({
      category,
      total: val.total,
      count: val.count,
      capex: val.capex,
      opex: val.opex
    })).sort((a, b) => b.total - a.total);
  }, [transactions]);

  // Campus breakdown for Executive Summary
  const campusBreakdown = useMemo(() => {
    const map: Record<string, { total: number; count: number; pending: number }> = {};
    transactions.forEach(t => {
      const campus = t.site_name || 'All Sites';
      if (!map[campus]) map[campus] = { total: 0, count: 0, pending: 0 };
      map[campus].total += Number(t.amount || 0);
      map[campus].count += 1;
      if (t.payment_status === 'Pending' || t.payment_status === 'Overdue') {
        map[campus].pending += 1;
      }
    });
    return Object.entries(map).map(([campus, val]) => ({
      campus,
      total: val.total,
      count: val.count,
      pending: val.pending
    })).sort((a, b) => b.total - a.total);
  }, [transactions]);

  // Aggregated totals and statistics for Expense Records & Tracking Ledger
  const ledgerTotals = useMemo(() => {
    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let processingAmount = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let processingCount = 0;
    let capexCount = 0;
    let capexAmount = 0;
    let opexCount = 0;
    let opexAmount = 0;
    let unplannedCount = 0;
    let unplannedAmount = 0;

    const vendorsSet = new Set<string>();
    const campusesSet = new Set<string>();
    let invoiceCount = 0;

    transactions.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      totalAmount += amt;

      if (tx.payment_status === 'Paid') {
        paidAmount += amt;
        paidCount++;
      } else if (tx.payment_status === 'Pending' || tx.payment_status === 'Overdue') {
        pendingAmount += amt;
        pendingCount++;
      } else if (tx.payment_status === 'Processing') {
        processingAmount += amt;
        processingCount++;
      }

      const isUnplanned = tx.budget_classification === 'Unplanned' || (!tx.linked_budget_id && tx.budget_classification !== 'Settled');
      if (isUnplanned) {
        unplannedCount++;
        unplannedAmount += amt;
      } else if (tx.budget_type === 'CapEx') {
        capexCount++;
        capexAmount += amt;
      } else {
        opexCount++;
        opexAmount += amt;
      }

      if (tx.vendor_name) vendorsSet.add(tx.vendor_name);
      if (tx.site_name) campusesSet.add(tx.site_name);
      if (tx.invoice_no) invoiceCount++;
    });

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      processingAmount,
      paidCount,
      pendingCount,
      processingCount,
      capexCount,
      capexAmount,
      opexCount,
      opexAmount,
      unplannedCount,
      unplannedAmount,
      uniqueVendorsCount: vendorsSet.size,
      uniqueCampusesCount: campusesSet.size,
      invoiceCount
    };
  }, [transactions]);

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

      {/* Top Header & Sticky Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Receipt size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                IT Expenses & Tracking
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  FY {selectedFiscalYear}
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Live Transactional Invoices, Vendor Disbursements & Direct Bidirectional Budget Settlement
              </p>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-2.5 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600">
              <span className="text-slate-400">Total Records: </span>
              <span className="font-bold text-slate-800">{transactions.length}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 font-bold">
              <span className="text-emerald-600 font-medium">FY {selectedFiscalYear} Spend: </span>
              <span className="font-mono">${(analytics?.totalExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
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
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      selectedFiscalYear === year
                        ? 'bg-white text-emerald-700 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    FY {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Campus Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Building2 size={13} /> Campus:
              </span>
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedSite}
                  onChange={(e) => {
                    if (e.target.value === '__manage_campuses__') {
                      handleOpenManageCampuses();
                    } else if (e.target.value === '__add_new__') {
                      handleOpenCreateCampus();
                    } else {
                      setSelectedSite(e.target.value);
                    }
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {campusList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option disabled value="">──────────</option>
                  <option value="__manage_campuses__" className="text-emerald-700 font-bold">⚙ Configure Campuses (CRUD)...</option>
                  <option value="__add_new__" className="text-emerald-700 font-semibold">+ Add New Campus...</option>
                </select>
                <button
                  type="button"
                  onClick={handleOpenManageCampuses}
                  title="Configure Khema Campuses (CRUD, Rename & Auto-sync Expenses)"
                  className="p-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs hover:shadow-xs"
                >
                  <Settings2 size={12} className="text-emerald-600" />
                  <span className="text-[11px]">Configure</span>
                </button>
              </div>
            </div>

            {/* Budget Type Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layers size={13} /> Budget Type:
              </span>
              <select
                value={selectedBudgetType}
                onChange={(e) => setSelectedBudgetType(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1 focus:outline-none"
              >
                {BUDGET_TYPES.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Payment Status Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <CreditCard size={13} /> Status:
              </span>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1 focus:outline-none"
              >
                {PAYMENT_STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Budget Classification Selector & Unplanned Quick Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <AlertTriangle size={13} className={selectedClassification === 'Unplanned' ? 'text-amber-600' : 'text-slate-400'} /> Plan:
              </span>
              <select
                value={selectedClassification}
                onChange={(e) => setSelectedClassification(e.target.value)}
                className={`text-xs font-semibold rounded-xl px-2.5 py-1 focus:outline-none transition-all ${
                  selectedClassification === 'Unplanned'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold ring-2 ring-amber-300/60'
                    : 'bg-slate-50 border border-slate-200 text-slate-700'
                }`}
                title="Filter by Budget Planning Classification"
              >
                <option value="All">All Classifications</option>
                <option value="Planned">✓ Planned (Budgeted) ({analytics?.scopeCounts ? analytics.scopeCounts.plannedCapex.count + analytics.scopeCounts.plannedOpex.count : (analytics?.plannedCount || 0)})</option>
                <option value="Unplanned">⚡ Unplanned / Emergency ({analytics?.scopeCounts?.unplannedAll?.count ?? analytics?.unplannedCount ?? 0})</option>
                <option value="Settled">⟲ Settled Unplanned ({analytics?.scopeCounts?.settled?.count ?? analytics?.settledCount ?? 0})</option>
              </select>

              <button
                type="button"
                onClick={() => setSelectedClassification(selectedClassification === 'Unplanned' ? 'All' : 'Unplanned')}
                className={`px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  selectedClassification === 'Unplanned'
                    ? 'bg-amber-500 text-white shadow-xs font-extrabold ring-2 ring-amber-300'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90'
                }`}
                title="Quick Toggle: Filter Unplanned IT Expenses only"
              >
                <AlertTriangle size={12} className={selectedClassification === 'Unplanned' ? 'text-white' : 'text-amber-600'} />
                <span>Unplanned</span>
                <span className={`px-1 rounded-full text-[10px] font-mono ${
                  selectedClassification === 'Unplanned' ? 'bg-amber-700 text-white' : 'bg-amber-200/80 text-amber-950 font-bold'
                }`}>
                  {analytics?.scopeCounts?.unplannedAll?.count ?? analytics?.unplannedCount ?? 0}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Views Segmented Navigation & Quick Action Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shadow-xs">
            <button
              type="button"
              onClick={() => handleSubViewChange('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSubView === 'analytics'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={15} className={activeSubView === 'analytics' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Executive Summary & Analytics</span>
            </button>
            <button
              type="button"
              onClick={() => handleSubViewChange('ledger')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSubView === 'ledger'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt size={15} className={activeSubView === 'ledger' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Expense Records & Tracking Ledger</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeSubView === 'ledger' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {transactions.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-xs"
              title="Download expense transactions as .xlsx"
            >
              <Download size={13} className="text-slate-500" />
              <span>Export .xlsx</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingTransaction(null);
                setModalMode('unbudgeted');
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl shadow-xs transition-colors"
              title="Record an unplanned or emergency expense without linking to an approved budget item"
            >
              <AlertTriangle size={13} />
              <span>Record Unbudgeted Expense</span>
            </button>

            <Button
              onClick={() => {
                setEditingTransaction(null);
                setModalMode('budgeted');
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
            >
              <Plus size={14} />
              <span>Record New Expense</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW A: EXECUTIVE SUMMARY & ANALYTICS DASHBOARD                      */}
      {/* ========================================================================= */}
      {activeSubView === 'analytics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Executive Strategic Planning & Range Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            {/* Row 1: Header, Active Filter Chips & Clear Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-emerald-600" />
                  <span>Strategic Planning & Disbursement Filters (FY {selectedFiscalYear})</span>
                </span>
                
                {selectedClassification !== 'All' && (
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                    selectedClassification === 'Planned' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : selectedClassification === 'Unplanned' 
                      ? 'bg-amber-50 text-amber-900 border-amber-300' 
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}>
                    <span>Plan: {selectedClassification}</span>
                  </span>
                )}

                {selectedBudgetType !== 'All Types' && (
                  <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-200">
                    Budget: {selectedBudgetType}
                  </span>
                )}

                {selectedLinkedBudgetId !== 'All' && (
                  <span className="text-[11px] font-semibold bg-purple-50 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200 truncate max-w-xs" title={allPlannedBudgetOptions.find(o => o.id === selectedLinkedBudgetId)?.name}>
                    Line: {allPlannedBudgetOptions.find(o => o.id === selectedLinkedBudgetId)?.raw_name || 'Selected Initiative'}
                  </span>
                )}

                {selectedCategory !== 'All Categories' && (
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 truncate max-w-[160px]">
                    Category: {selectedCategory}
                  </span>
                )}

                {execMonthPreset !== 'all-year' && (
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <Calendar size={11} className="text-emerald-600" />
                    <span>
                      {MONTHS[execFromMonth - 1]?.short}–{MONTHS[execToMonth - 1]?.short} ({execMonthPreset.toUpperCase()})
                    </span>
                  </span>
                )}
              </div>

              {(selectedClassification !== 'All' || selectedBudgetType !== 'All Types' || selectedLinkedBudgetId !== 'All' || selectedCategory !== 'All Categories' || selectedSite !== 'All Sites' || execMonthPreset !== 'all-year') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClassification('All');
                    setSelectedBudgetType('All Types');
                    setSelectedLinkedBudgetId('All');
                    setSelectedCategory('All Categories');
                    setSelectedSite('All Sites');
                    applyExecMonthPreset('all-year');
                  }}
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors border border-rose-200/50 self-start sm:self-auto shadow-2xs"
                  title="Reset all planning and date filters to default full fiscal year"
                >
                  <X size={13} />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>

            {/* Row 2: Planning Classification Tabs (All, Planned, Unplanned, Settled) & Budget Type */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                  <CheckSquare size={13} className="text-emerald-600" />
                  <span>Planning Scope:</span>
                </span>
                
                {/* All Expenses */}
                <button
                  type="button"
                  onClick={() => setSelectedClassification('All')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedClassification === 'All'
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/70'
                  }`}
                >
                  <span>All Expenditures</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    selectedClassification === 'All' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {analytics?.transactionCount || transactions.length}
                  </span>
                </button>

                {/* Planned (Budgeted) */}
                <button
                  type="button"
                  onClick={() => setSelectedClassification('Planned')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedClassification === 'Planned'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold ring-2 ring-emerald-300'
                      : 'bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-900 border border-emerald-200'
                  }`}
                  title="Filter Executive Summary to Approved & Budget-Linked Planned Expenses"
                >
                  <Check size={13} className={selectedClassification === 'Planned' ? 'text-white' : 'text-emerald-600'} />
                  <span>✓ Planned (Budgeted)</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    selectedClassification === 'Planned' ? 'bg-emerald-800 text-white' : 'bg-emerald-200/80 text-emerald-950 font-bold'
                  }`}>
                    {analytics?.plannedCount ?? (analytics?.transactionCount ? analytics.transactionCount - (analytics?.unplannedCount || 0) : 0)}
                  </span>
                </button>

                {/* Unplanned (Emergency) */}
                <button
                  type="button"
                  onClick={() => setSelectedClassification('Unplanned')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedClassification === 'Unplanned'
                      ? 'bg-amber-500 text-white shadow-xs font-extrabold ring-2 ring-amber-300'
                      : 'bg-amber-50/70 hover:bg-amber-100 text-amber-900 border border-amber-200'
                  }`}
                  title="Filter Executive Summary to Out-of-Budget Emergency / Unplanned Purchases"
                >
                  <AlertTriangle size={13} className={selectedClassification === 'Unplanned' ? 'text-white' : 'text-amber-600'} />
                  <span>⚡ Unplanned (Emergency)</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    selectedClassification === 'Unplanned' ? 'bg-amber-700 text-white' : 'bg-amber-200/80 text-amber-950 font-bold'
                  }`}>
                    {analytics?.unplannedCount || 0}
                  </span>
                </button>

                {/* Settled Variance */}
                <button
                  type="button"
                  onClick={() => setSelectedClassification('Settled')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedClassification === 'Settled'
                      ? 'bg-blue-600 text-white shadow-xs font-bold ring-2 ring-blue-300'
                      : 'bg-blue-50/70 hover:bg-blue-100 text-blue-900 border border-blue-200'
                  }`}
                  title="Filter Executive Summary to Settled & Reallocated Unplanned Expenses"
                >
                  <RefreshCw size={12} className={selectedClassification === 'Settled' ? 'text-white' : 'text-blue-600'} />
                  <span>⟲ Settled Variance</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    selectedClassification === 'Settled' ? 'bg-blue-800 text-white' : 'bg-blue-200/80 text-blue-950 font-bold'
                  }`}>
                    {analytics?.settledCount ?? 0}
                  </span>
                </button>
              </div>

              {/* Planning Budget Type Toggle (CapEx vs OpEx vs All) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
                <span className="text-[11px] font-semibold text-slate-500 px-1.5">Type:</span>
                {(['All Types', 'CapEx', 'OpEx'] as const).map(bt => (
                  <button
                    key={bt}
                    type="button"
                    onClick={() => setSelectedBudgetType(bt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      selectedBudgetType === bt
                        ? bt === 'CapEx'
                          ? 'bg-indigo-600 text-white shadow-xs font-bold'
                          : bt === 'OpEx'
                          ? 'bg-emerald-600 text-white shadow-xs font-bold'
                          : 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {bt === 'All Types' ? 'All Budgets' : `${bt} Plan`}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Target Planned Budget Line & Operational Filters */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
                {/* Specific Planned Budget Line Selector */}
                <div className={`flex items-center gap-2 bg-white border px-3 py-1.5 rounded-xl shadow-xs transition-colors w-full sm:w-auto ${
                  selectedLinkedBudgetId !== 'All' ? 'border-purple-300 ring-2 ring-purple-100 bg-purple-50/30' : 'border-slate-200'
                }`}>
                  <Layers size={14} className={selectedLinkedBudgetId !== 'All' ? 'text-purple-600' : 'text-slate-400'} />
                  <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Planned Initiative:</span>
                  <select
                    value={selectedLinkedBudgetId}
                    onChange={(e) => setSelectedLinkedBudgetId(e.target.value)}
                    className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer max-w-[280px] sm:max-w-[340px] truncate"
                    title="Filter analytics & burn rate charts to a specific planned budget item"
                  >
                    <option value="All">All Strategic Budget Items (CapEx & OpEx)</option>
                    
                    {budgetOptions.capexOptions?.length > 0 && (
                      <optgroup label="── Planned CapEx Projects ──">
                        {budgetOptions.capexOptions.map(c => (
                          <option key={c.id} value={c.id}>
                            [CapEx] {c.raw_name || c.name} · ${Number(c.budget_amount).toLocaleString()}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {budgetOptions.opexOptions?.length > 0 && (
                      <optgroup label="── Planned OpEx Operational Accounts ──">
                        {budgetOptions.opexOptions.map(o => (
                          <option key={o.id} value={o.id}>
                            [OpEx] {o.raw_name || o.name} · ${Number(o.budget_amount).toLocaleString()}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>

                  {selectedLinkedBudgetId !== 'All' && (
                    <button
                      type="button"
                      onClick={() => setSelectedLinkedBudgetId('All')}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                      title="Clear planned line filter"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Campus Filter */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl shadow-xs">
                  <Building2 size={13} className="text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-500">Campus:</span>
                  <select
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                    className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    {campusList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Expense Category Filter */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl shadow-xs">
                  <Tag size={13} className="text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-500">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none cursor-pointer max-w-[210px] truncate"
                  >
                    <option value="All Categories">All Categories</option>
                    {expenseCategoriesData.some(c => c.budget_type === 'CapEx') && (
                      <optgroup label="── CapEx (Asset Type) ──">
                        {expenseCategoriesData
                          .filter(c => c.budget_type === 'CapEx')
                          .map(c => (
                            <option key={c.id || c.category_name} value={c.category_name}>
                              {c.category_name}
                            </option>
                          ))}
                      </optgroup>
                    )}
                    {expenseCategoriesData.some(c => c.budget_type === 'OpEx') && (
                      <optgroup label="── OpEx (Account Code) ──">
                        {expenseCategoriesData
                          .filter(c => c.budget_type === 'OpEx')
                          .map(c => (
                            <option key={c.id || c.category_name} value={c.category_name}>
                              {c.category_name}
                            </option>
                          ))}
                      </optgroup>
                    )}
                    {expenseCategoriesData.some(c => c.budget_type !== 'CapEx' && c.budget_type !== 'OpEx') && (
                      <optgroup label="── Shared / Other ──">
                        {expenseCategoriesData
                          .filter(c => c.budget_type !== 'CapEx' && c.budget_type !== 'OpEx')
                          .map(c => (
                            <option key={c.id || c.category_name} value={c.category_name}>
                              {c.category_name}
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              {/* Monthly Range Presets & Month Pickers */}
              <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Period:
                </span>
                <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 gap-0.5">
                  <button
                    type="button"
                    onClick={() => applyExecMonthPreset('all-year')}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                      execMonthPreset === 'all-year'
                        ? 'bg-white text-emerald-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    FY {selectedFiscalYear}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyExecMonthPreset('q1')}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                      execMonthPreset === 'q1'
                        ? 'bg-white text-emerald-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Q1
                  </button>
                  <button
                    type="button"
                    onClick={() => applyExecMonthPreset('q2')}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                      execMonthPreset === 'q2'
                        ? 'bg-white text-emerald-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Q2
                  </button>
                  <button
                    type="button"
                    onClick={() => applyExecMonthPreset('q3')}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                      execMonthPreset === 'q3'
                        ? 'bg-white text-emerald-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Q3
                  </button>
                  <button
                    type="button"
                    onClick={() => applyExecMonthPreset('q4')}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                      execMonthPreset === 'q4'
                        ? 'bg-white text-emerald-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Q4
                  </button>
                  <span className="text-slate-300 mx-0.5">|</span>
                  <button
                    type="button"
                    onClick={() => applyExecMonthPreset('h1')}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                      execMonthPreset === 'h1'
                        ? 'bg-white text-emerald-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onClick={() => applyExecMonthPreset('h2')}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                      execMonthPreset === 'h2'
                        ? 'bg-white text-emerald-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    H2
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                  <select
                    value={execFromMonth}
                    onChange={(e) => handleFromMonthSelect(parseInt(e.target.value, 10))}
                    className="bg-white border border-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg px-2 py-0.5 focus:outline-none shadow-2xs"
                  >
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.short}</option>
                    ))}
                  </select>
                  <span className="text-slate-400 text-xs">&rarr;</span>
                  <select
                    value={execToMonth}
                    onChange={(e) => handleToMonthSelect(parseInt(e.target.value, 10))}
                    className="bg-white border border-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg px-2 py-0.5 focus:outline-none shadow-2xs"
                  >
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.short}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Active Planning Filter Banner (Visible when any planning parameter is actively isolating spend) */}
          {(selectedClassification !== 'All' || selectedBudgetType !== 'All Types' || selectedLinkedBudgetId !== 'All' || selectedCategory !== 'All Categories') && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50/70 via-indigo-50/50 to-emerald-50/70 border border-emerald-200/90 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <span className="p-1 rounded-lg bg-emerald-600 text-white shrink-0 shadow-2xs">
                  <Filter size={14} />
                </span>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                    <span>Active Planning Filter Applied</span>
                    <span className="text-emerald-800 font-semibold">
                      · Showing {analytics?.transactionCount || transactions.length} items totaling ${(analytics?.totalExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    {selectedClassification !== 'All' && <span>Scope: <strong>{selectedClassification}</strong></span>}
                    {selectedBudgetType !== 'All Types' && <span>Budget: <strong>{selectedBudgetType}</strong></span>}
                    {selectedLinkedBudgetId !== 'All' && (
                      <span>Initiative: <strong>{allPlannedBudgetOptions.find(o => o.id === selectedLinkedBudgetId)?.raw_name || 'Selected'}</strong></span>
                    )}
                    {selectedCategory !== 'All Categories' && <span>Category: <strong>{selectedCategory}</strong></span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClassification('All');
                    setSelectedBudgetType('All Types');
                    setSelectedLinkedBudgetId('All');
                    setSelectedCategory('All Categories');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors shadow-2xs"
                >
                  Clear Planning Filters
                </button>
                <button
                  type="button"
                  onClick={() => handleSubViewChange('ledger')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1"
                >
                  <span>View in Ledger</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

          {/* KPI Summary Cards: 6-Card Executive Planning Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {/* 1. Total Realized Expenses */}
            <div 
              onClick={() => {
                setSelectedClassification('All');
                setSelectedBudgetType('All Types');
                setSelectedLinkedBudgetId('All');
              }}
              title="Click to reset planning filters and view all expenditures"
              className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                selectedClassification === 'All' && selectedBudgetType === 'All Types' && selectedLinkedBudgetId === 'All'
                  ? 'border-slate-900 ring-2 ring-slate-900/10'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Realized Spend</span>
                <span className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
                  <DollarSign size={15} />
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
                  ${(analytics?.totalExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                  <span className="truncate">{analytics?.transactionCount || transactions.length} items · Plan + Unplanned</span>
                  <span className="text-emerald-700 font-semibold shrink-0">
                    {execMonthPreset === 'all-year' ? `FY ${selectedFiscalYear}` : `${execMonthPreset.toUpperCase()}`}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Planned (Budgeted) Spend & Adherence */}
            <div 
              onClick={() => setSelectedClassification(selectedClassification === 'Planned' ? 'All' : 'Planned')}
              title="Sum of all budget-linked CapEx & OpEx actuals (Planned + Settled). Matches IT CapEx & OpEx Planning Actual."
              className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                selectedClassification === 'Planned'
                  ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-300'
                  : 'border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/30 hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Planned (Budgeted)</span>
                <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">
                  <Check size={15} />
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-xl font-bold text-emerald-950 tracking-tight font-mono tabular-nums">
                  ${(analytics?.totalPlannedExpenses ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-emerald-800/90 mt-1.5 pt-1.5 border-t border-emerald-200/60 flex items-center justify-between gap-1 font-medium">
                  <span className="truncate">
                    {analytics?.plannedCount ?? 0} linked · of ${(analytics?.totalPlannedBudget || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-950 shrink-0 tabular-nums">
                    {analytics?.budgetExecutionRate ?? 0}% Used
                  </span>
                </div>
              </div>
            </div>

            {/* 3. CapEx Disbursed (Planned CapEx aligned with IT CapEx Planning) */}
            <div 
              onClick={() => setSelectedBudgetType(selectedBudgetType === 'CapEx' ? 'All Types' : 'CapEx')}
              title="Planned CapEx disbursements linked to IT CapEx Planning (excludes unbudgeted CapEx variance)"
              className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                selectedBudgetType === 'CapEx'
                  ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-300'
                  : 'border-slate-200/80 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CapEx Disbursed</span>
                <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <Layers size={15} />
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-xl font-bold text-indigo-900 tracking-tight font-mono tabular-nums">
                  ${(analytics?.totalCapexExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                  <span className="truncate">
                    of ${(analytics?.capexPlannedBudget || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} Plan
                    {(analytics?.totalUnplannedCapex || 0) > 0 ? ` (+$${Math.round(analytics.totalUnplannedCapex).toLocaleString()} unp.)` : ''}
                  </span>
                  <span className="font-semibold text-indigo-700 shrink-0 tabular-nums">
                    {analytics?.capexExecutionRate ?? 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* 4. OpEx Disbursed (Planned OpEx aligned with IT OpEx Planning) */}
            <div 
              onClick={() => setSelectedBudgetType(selectedBudgetType === 'OpEx' ? 'All Types' : 'OpEx')}
              title="Planned OpEx disbursements linked to IT OpEx Planning (excludes unbudgeted OpEx variance)"
              className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                selectedBudgetType === 'OpEx'
                  ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-300'
                  : 'border-slate-200/80 hover:border-teal-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">OpEx Disbursed</span>
                <span className="p-1.5 rounded-xl bg-teal-50 text-teal-600">
                  <TrendingUp size={15} />
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-xl font-bold text-teal-900 tracking-tight font-mono tabular-nums">
                  ${(analytics?.totalOpexExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                  <span className="truncate">
                    of ${(analytics?.opexPlannedBudget || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} Plan
                    {(analytics?.totalUnplannedOpex || 0) > 0 ? ` (+$${Math.round(analytics.totalUnplannedOpex).toLocaleString()} unp.)` : ''}
                  </span>
                  <span className="font-semibold text-teal-700 shrink-0 tabular-nums">
                    {analytics?.opexExecutionRate ?? 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Unplanned / Variance Spend */}
            <div 
              onClick={() => setSelectedClassification(selectedClassification === 'Unplanned' ? 'All' : 'Unplanned')}
              title="Out-of-budget expenses not linked to IT CapEx/OpEx Planning items"
              className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                selectedClassification === 'Unplanned'
                  ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-300'
                  : 'border-amber-200/90 bg-gradient-to-br from-white to-amber-50/40 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Unplanned Spend</span>
                <span className="p-1.5 rounded-xl bg-amber-100 text-amber-700">
                  <AlertTriangle size={15} />
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-xl font-bold text-amber-900 tracking-tight font-mono tabular-nums">
                  ${(analytics?.totalUnplannedExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-amber-800/90 mt-1.5 pt-1.5 border-t border-amber-200/60 flex items-center justify-between gap-1 font-medium">
                  <span className="truncate">
                    {analytics?.unplannedCount || 0} items · ${Math.round(analytics?.totalUnplannedCapex || 0).toLocaleString()} Cap / ${Math.round(analytics?.totalUnplannedOpex || 0).toLocaleString()} Op
                  </span>
                </div>
              </div>
            </div>

            {/* 6. Pending Disbursements */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Invoices</span>
                <span className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                  <Clock size={15} />
                </span>
              </div>
              <div className="mt-2.5">
                <div className="text-xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
                  ${(analytics?.totalPending || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                  <span>Overdue: ${(analytics?.totalOverdue || 0).toLocaleString()}</span>
                  <span className="text-slate-600 font-semibold">Unsettled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Expense Burn Rate Visual Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Monthly IT Expense Disbursement Burn Rate (FY {selectedFiscalYear})</span>
                  {execMonthPreset !== 'all-year' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      {MONTHS[execFromMonth - 1]?.short} – {MONTHS[execToMonth - 1]?.short}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {execMonthPreset !== 'all-year' 
                    ? `Showing realized burn rate for ${MONTHS[execFromMonth - 1]?.name} through ${MONTHS[execToMonth - 1]?.name} ${selectedFiscalYear}` 
                    : 'Realized monthly cash flow split between Planned CapEx, Planned OpEx, and Unplanned variance'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-indigo-500"></span>
                  <span>Planned CapEx</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                  <span>Planned OpEx</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-500"></span>
                  <span>Unplanned</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              {displayChartData && displayChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} 
                    />
                    <RechartsTooltip 
                      formatter={(value: any, name: any) => [
                        `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                        name === 'capex' ? 'Planned CapEx' : name === 'opex' ? 'Planned OpEx' : name === 'unplanned' ? 'Unplanned Spend' : 'Total Spend'
                      ]}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                    />
                    <Bar dataKey="capex" name="capex" fill="#6366f1" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="opex" name="opex" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="unplanned" name="unplanned" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  No monthly disbursement data recorded
                </div>
              )}
            </div>
          </div>

          {/* Strategic Planned Budget Initiatives Execution & Deep-Dive */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers size={16} className="text-purple-600" />
                  <span>Strategic Planning Initiatives Execution & Budget Line Utilization</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Realized disbursements mapped directly to approved CapEx capital projects & OpEx operational accounts
                </p>
              </div>

              {selectedLinkedBudgetId !== 'All' ? (
                <button
                  type="button"
                  onClick={() => setSelectedLinkedBudgetId('All')}
                  className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg flex items-center gap-1 transition-colors self-start sm:self-auto shadow-2xs"
                >
                  <X size={12} />
                  <span>Clear Initiative Filter (Show All)</span>
                </button>
              ) : (
                <span className="text-xs font-semibold text-slate-500">
                  {(analytics?.plannedBudgetItemsBreakdown?.length || 0)} planned budget lines active
                </span>
              )}
            </div>

            {/* List / Table of Planned Initiatives */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {(analytics?.plannedBudgetItemsBreakdown && analytics.plannedBudgetItemsBreakdown.length > 0) ? (
                analytics.plannedBudgetItemsBreakdown.slice(0, 9).map((pItem: any) => {
                  const isSelected = selectedLinkedBudgetId === pItem.id;
                  const isCapex = pItem.budget_type === 'CapEx';

                  return (
                    <div
                      key={pItem.id || pItem.name}
                      onClick={() => setSelectedLinkedBudgetId(isSelected ? 'All' : pItem.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-300 shadow-sm'
                          : 'border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            isCapex 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                          }`}>
                            {pItem.budget_type} Plan
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {pItem.count} {pItem.count === 1 ? 'transaction' : 'transactions'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2" title={pItem.name}>
                          {pItem.name}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-end justify-between">
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-slate-400">
                            Realized {pItem.budget_amount > 0 ? `/ $${Number(pItem.budget_amount).toLocaleString('en-US', { maximumFractionDigits: 0 })} Plan` : 'Spend'}
                          </div>
                          <div className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                            ${Number(pItem.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {pItem.budget_amount > 0 && (
                              <span className="ml-1.5 text-[11px] font-semibold text-slate-500">
                                ({Math.round((pItem.total / pItem.budget_amount) * 100)}%)
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLinkedBudgetId(isSelected ? 'All' : pItem.id);
                          }}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-2xs font-bold'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                          }`}
                        >
                          <span>{isSelected ? 'Active Filter' : 'Filter Burn'}</span>
                          <ArrowRight size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                  No planned budget initiatives match the current planning and date range criteria.
                </div>
              )}
            </div>
          </div>

          {/* Analytical Deep-Dives: Spend by Category & Spend by Campus */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Layers size={16} className="text-emerald-600" />
                    <span>Spend by IT Expense Category</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Realized expenditure distribution across categories</p>
                </div>
                <span className="text-xs font-semibold text-slate-500">{categoryBreakdown.length} active categories</span>
              </div>
              <div className="space-y-3.5">
                {categoryBreakdown.length > 0 ? (
                  categoryBreakdown.map((item) => {
                    const totalSpend = analytics?.totalExpenses || 1;
                    const pct = Math.round((item.total / totalSpend) * 100);
                    const capexPct = item.total > 0 ? (item.capex / item.total) * 100 : 0;
                    const opexPct = item.total > 0 ? (item.opex / item.total) * 100 : 0;
                    return (
                      <div key={item.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">{item.category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-medium text-[11px]">({item.count} items)</span>
                            <span className="font-mono font-bold text-slate-900">${item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">{pct}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                          <div
                            className="bg-indigo-500 h-full transition-all"
                            style={{ width: `${(capexPct / 100) * pct}%` }}
                            title={`CapEx: $${item.capex.toLocaleString()}`}
                          />
                          <div
                            className="bg-emerald-500 h-full transition-all"
                            style={{ width: `${(opexPct / 100) * pct}%` }}
                            title={`OpEx: $${item.opex.toLocaleString()}`}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">No categorized expense data recorded</div>
                )}
              </div>
            </div>

            {/* Campus Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Building2 size={16} className="text-indigo-600" />
                    <span>Spend by Operating Campus</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Disbursements across hospital and clinic facilities</p>
                </div>
                <span className="text-xs font-semibold text-slate-500">{campusBreakdown.length} campuses</span>
              </div>
              <div className="space-y-3">
                {campusBreakdown.length > 0 ? (
                  campusBreakdown.map((item) => {
                    const totalSpend = analytics?.totalExpenses || 1;
                    const pct = Math.round((item.total / totalSpend) * 100);
                    return (
                      <div key={item.campus} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/60 transition-colors">
                        <div>
                          <div className="text-xs font-bold text-slate-800">{item.campus}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {item.count} total records {item.pending > 0 ? `· ${item.pending} pending invoices` : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900 text-xs">
                            ${item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[11px] font-semibold text-indigo-700 mt-0.5">{pct}% of FY total</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">No campus expense data recorded</div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Transition Banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white rounded-2xl border border-emerald-200/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Receipt size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Need to audit line-by-line invoices or log a new payment?</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Switch directly to the Expense Transaction Ledger to filter by dates, inspect POs, and record expenses.</p>
              </div>
            </div>
            <button
              onClick={() => handleSubViewChange('ledger')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs"
            >
              <span>Open Expense Ledger</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW B: EXPENSE RECORDS & TRACKING LEDGER                             */}
      {/* ========================================================================= */}
      {activeSubView === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-in fade-in duration-200">
          {/* Ledger Header & Filter Controls */}
          <div className="p-4 border-b border-slate-100 space-y-3 bg-gradient-to-b from-slate-50/50 to-white">
            {/* Top Row: Title, Ledger Count, Range Indicator, Search & Record Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Expense Transaction Ledger</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
                    {transactions.length} {transactions.length === 1 ? 'entry' : 'entries'}
                  </span>
                </h3>
                {fromDate || toDate ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    Range: {fromDate || 'Start'} &rarr; {toDate || 'Present'}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    Full FY {selectedFiscalYear} (Default: All Expenses)
                  </span>
                )}
              </div>

              {/* Ledger Actions: Search Bar & Record New Expense Button */}
              <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
                <div className="relative w-full md:w-72">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search invoices, PO, vendors, categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                      title="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <Button
                  onClick={() => {
                    setEditingTransaction(null);
                    setShowModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs whitespace-nowrap shrink-0"
                >
                  <Plus size={14} />
                  <span>Record New Expense</span>
                </Button>
              </div>
            </div>

          {/* Bottom Row: Enhanced Date Range Presets & Custom Pickers */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 text-[11px]">
                <Calendar size={13} className="text-emerald-600" /> Date Range:
              </span>
              
              <div className="inline-flex flex-wrap items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 gap-1">
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('all-year')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    dateRangeMode === 'all-year' && !fromDate && !toDate
                      ? 'bg-white text-emerald-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="View all expense transactions for the entire fiscal year"
                >
                  All FY {selectedFiscalYear} (Default)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('this-month')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    dateRangeMode === 'this-month'
                      ? 'bg-white text-emerald-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('last-30')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    dateRangeMode === 'last-30'
                      ? 'bg-white text-emerald-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Last 30d
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('last-60')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    dateRangeMode === 'last-60'
                      ? 'bg-white text-emerald-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Last 60d
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('last-90')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    dateRangeMode === 'last-90'
                      ? 'bg-white text-emerald-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Last 90d
                </button>
                <span className="text-slate-300 mx-0.5">|</span>
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('q1')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    dateRangeMode === 'q1'
                      ? 'bg-white text-emerald-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Q1
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('q2')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    dateRangeMode === 'q2'
                      ? 'bg-white text-emerald-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Q2
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('q3')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    dateRangeMode === 'q3'
                      ? 'bg-white text-emerald-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Q3
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('q4')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    dateRangeMode === 'q4'
                      ? 'bg-white text-emerald-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Q4
                </button>
                <span className="text-slate-300 mx-0.5">|</span>
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('h1')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    dateRangeMode === 'h1'
                      ? 'bg-white text-emerald-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('h2')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    dateRangeMode === 'h2'
                      ? 'bg-white text-emerald-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  H2
                </button>
              </div>
            </div>

            {/* Budget & Variance Scope Filter Bar (OpEx, CapEx, Unplanned CapEx & OpEx) */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 text-[11px] mr-1">
                  <Layers size={13} className="text-emerald-600" /> Scope:
                </span>

                {/* All Records */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBudgetType('All Types');
                    setSelectedClassification('All');
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedBudgetType === 'All Types' && selectedClassification === 'All'
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <span>All</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums ${
                    selectedBudgetType === 'All Types' && selectedClassification === 'All'
                      ? 'bg-slate-700 text-white'
                      : 'bg-white text-slate-700 border border-slate-200/70'
                  }`}>
                    {analytics?.scopeCounts?.all?.count ?? transactions.length}
                  </span>
                </button>

                {/* OpEx (Planned) */}
                <button
                  type="button"
                  onClick={() => {
                    const active = selectedBudgetType === 'OpEx' && selectedClassification === 'Planned';
                    setSelectedBudgetType(active ? 'All Types' : 'OpEx');
                    setSelectedClassification(active ? 'All' : 'Planned');
                  }}
                  title="Filter to Planned OpEx disbursements aligned with IT OpEx Planning"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedBudgetType === 'OpEx' && selectedClassification === 'Planned'
                      ? 'bg-teal-600 text-white shadow-xs font-bold ring-2 ring-teal-300'
                      : 'bg-teal-50/70 hover:bg-teal-100/80 text-teal-900 border border-teal-200'
                  }`}
                >
                  <TrendingUp size={12} className={selectedBudgetType === 'OpEx' && selectedClassification === 'Planned' ? 'text-white' : 'text-teal-600'} />
                  <span>OpEx (Planned)</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums ${
                    selectedBudgetType === 'OpEx' && selectedClassification === 'Planned'
                      ? 'bg-teal-800 text-white'
                      : 'bg-teal-100 text-teal-900 font-bold'
                  }`}>
                    {analytics?.scopeCounts?.plannedOpex?.count ?? 0}
                  </span>
                </button>

                {/* CapEx (Planned) */}
                <button
                  type="button"
                  onClick={() => {
                    const active = selectedBudgetType === 'CapEx' && selectedClassification === 'Planned';
                    setSelectedBudgetType(active ? 'All Types' : 'CapEx');
                    setSelectedClassification(active ? 'All' : 'Planned');
                  }}
                  title="Filter to Planned CapEx disbursements aligned with IT CapEx Planning"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedBudgetType === 'CapEx' && selectedClassification === 'Planned'
                      ? 'bg-indigo-600 text-white shadow-xs font-bold ring-2 ring-indigo-300'
                      : 'bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-900 border border-indigo-200'
                  }`}
                >
                  <Layers size={12} className={selectedBudgetType === 'CapEx' && selectedClassification === 'Planned' ? 'text-white' : 'text-indigo-600'} />
                  <span>CapEx (Planned)</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums ${
                    selectedBudgetType === 'CapEx' && selectedClassification === 'Planned'
                      ? 'bg-indigo-800 text-white'
                      : 'bg-indigo-100 text-indigo-900 font-bold'
                  }`}>
                    {analytics?.scopeCounts?.plannedCapex?.count ?? 0}
                  </span>
                </button>

                <span className="text-slate-300 mx-0.5">|</span>

                {/* Unplanned CapEx & OpEx (Combined) */}
                <button
                  type="button"
                  onClick={() => {
                    const active = selectedBudgetType === 'All Types' && selectedClassification === 'Unplanned';
                    setSelectedBudgetType('All Types');
                    setSelectedClassification(active ? 'All' : 'Unplanned');
                  }}
                  title="Filter to all Unplanned (CapEx & OpEx) emergency/unbudgeted expenses"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedBudgetType === 'All Types' && selectedClassification === 'Unplanned'
                      ? 'bg-amber-500 text-white shadow-xs font-extrabold ring-2 ring-amber-300'
                      : 'bg-amber-50/80 hover:bg-amber-100 text-amber-900 border border-amber-200'
                  }`}
                >
                  <AlertTriangle size={12} className={selectedBudgetType === 'All Types' && selectedClassification === 'Unplanned' ? 'text-white' : 'text-amber-600'} />
                  <span>Unplanned CapEx &amp; OpEx</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums ${
                    selectedBudgetType === 'All Types' && selectedClassification === 'Unplanned'
                      ? 'bg-amber-700 text-white'
                      : 'bg-amber-200/80 text-amber-950 font-bold'
                  }`}>
                    {analytics?.scopeCounts?.unplannedAll?.count ?? 0}
                  </span>
                </button>

                {/* Unplanned CapEx */}
                <button
                  type="button"
                  onClick={() => {
                    const active = selectedBudgetType === 'CapEx' && selectedClassification === 'Unplanned';
                    setSelectedBudgetType(active ? 'All Types' : 'CapEx');
                    setSelectedClassification(active ? 'All' : 'Unplanned');
                  }}
                  title="Filter to Unplanned CapEx expenses only"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedBudgetType === 'CapEx' && selectedClassification === 'Unplanned'
                      ? 'bg-amber-600 text-white shadow-xs font-bold ring-2 ring-amber-300'
                      : 'bg-orange-50/70 hover:bg-orange-100 text-orange-900 border border-orange-200'
                  }`}
                >
                  <span>Unplanned CapEx</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums ${
                    selectedBudgetType === 'CapEx' && selectedClassification === 'Unplanned'
                      ? 'bg-amber-800 text-white'
                      : 'bg-orange-200/70 text-orange-950 font-bold'
                  }`}>
                    {analytics?.scopeCounts?.unplannedCapex?.count ?? 0}
                  </span>
                </button>

                {/* Unplanned OpEx */}
                <button
                  type="button"
                  onClick={() => {
                    const active = selectedBudgetType === 'OpEx' && selectedClassification === 'Unplanned';
                    setSelectedBudgetType(active ? 'All Types' : 'OpEx');
                    setSelectedClassification(active ? 'All' : 'Unplanned');
                  }}
                  title="Filter to Unplanned OpEx expenses only"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedBudgetType === 'OpEx' && selectedClassification === 'Unplanned'
                      ? 'bg-amber-600 text-white shadow-xs font-bold ring-2 ring-amber-300'
                      : 'bg-orange-50/70 hover:bg-orange-100 text-orange-900 border border-orange-200'
                  }`}
                >
                  <span>Unplanned OpEx</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums ${
                    selectedBudgetType === 'OpEx' && selectedClassification === 'Unplanned'
                      ? 'bg-amber-800 text-white'
                      : 'bg-orange-200/70 text-orange-950 font-bold'
                  }`}>
                    {analytics?.scopeCounts?.unplannedOpex?.count ?? 0}
                  </span>
                </button>
              </div>
            </div>

            {/* Custom Date Pickers, Campus Filter, & Operational Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Budget Type Selector */}
              <div className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-xl shadow-xs transition-colors ${
                selectedBudgetType !== 'All Types'
                  ? 'bg-indigo-50 border-indigo-300'
                  : 'bg-white border-slate-200'
              }`}>
                <Layers size={13} className={selectedBudgetType !== 'All Types' ? 'text-indigo-600' : 'text-emerald-600'} />
                <span className="text-[11px] font-semibold text-slate-500">Type:</span>
                <select
                  value={selectedBudgetType}
                  onChange={(e) => setSelectedBudgetType(e.target.value)}
                  className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none cursor-pointer"
                  title="Filter expense records by Budget Type (CapEx / OpEx)"
                >
                  {BUDGET_TYPES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Classification Selector */}
              <div className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-xl shadow-xs transition-colors ${
                selectedClassification === 'Unplanned' 
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200' 
                  : selectedClassification !== 'All'
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-white border-slate-200'
              }`}>
                <AlertCircle size={13} className={selectedClassification === 'Unplanned' ? 'text-amber-600' : 'text-emerald-600'} />
                <span className="text-[11px] font-semibold text-slate-500">Plan:</span>
                <select
                  value={selectedClassification}
                  onChange={(e) => setSelectedClassification(e.target.value)}
                  className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none cursor-pointer"
                  title="Filter expense records by Budget Classification"
                >
                  <option value="All">All Classifications</option>
                  <option value="Unplanned">⚡ Unplanned / Emergency ({analytics?.scopeCounts?.unplannedAll?.count ?? analytics?.unplannedCount ?? 0})</option>
                  <option value="Planned">✓ Planned (Budgeted)</option>
                  <option value="Settled">⟲ Settled Unplanned ({analytics?.scopeCounts?.settled?.count ?? analytics?.settledCount ?? 0})</option>
                </select>
              </div>

              {/* Re-arranged Campus Filter right near Date Range Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-xs">
                <Building2 size={13} className="text-emerald-600 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-500">Campus:</span>
                <select
                  value={selectedSite}
                  onChange={(e) => {
                    if (e.target.value === '__manage_campuses__') {
                      handleOpenManageCampuses('campuses');
                    } else if (e.target.value === '__add_new__') {
                      handleOpenCreateCampus();
                    } else {
                      setSelectedSite(e.target.value);
                    }
                  }}
                  className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none cursor-pointer"
                  title="Filter expense records by Campus"
                >
                  {campusList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option disabled value="">──────────</option>
                  <option value="__manage_campuses__" className="text-emerald-700 font-bold">⚙ Configure Campuses (CRUD)...</option>
                  <option value="__add_new__" className="text-emerald-700 font-semibold">+ Add New Campus...</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleOpenManageCampuses('campuses')}
                  title="Configure Khema Campuses (CRUD, Rename & Auto-sync Expenses)"
                  className="p-1 px-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <Settings2 size={11} className="text-emerald-600" />
                  <span>Config</span>
                </button>
              </div>

              {/* General IT & Expense Category Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-xs">
                <Tag size={13} className="text-emerald-600 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-500">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    if (e.target.value === '__manage_categories__') {
                      handleOpenManageCategories();
                    } else if (e.target.value === '__add_new_category__') {
                      handleOpenCreateCategory();
                    } else {
                      setSelectedCategory(e.target.value);
                    }
                  }}
                  className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none cursor-pointer max-w-[210px] truncate"
                  title="Filter expense records by consolidated CapEx Asset Type or OpEx Account Code"
                >
                  <option value="All Categories">All Categories</option>
                  {expenseCategoriesData.some(c => c.budget_type === 'CapEx') && (
                    <optgroup label="── CapEx (Asset Type) ──">
                      {expenseCategoriesData
                        .filter(c => c.budget_type === 'CapEx')
                        .map(c => (
                          <option key={c.id || c.category_name} value={c.category_name}>
                            {c.category_name} ({c.expense_count ?? 0})
                          </option>
                        ))}
                    </optgroup>
                  )}
                  {expenseCategoriesData.some(c => c.budget_type === 'OpEx') && (
                    <optgroup label="── OpEx (Account Code) ──">
                      {expenseCategoriesData
                        .filter(c => c.budget_type === 'OpEx')
                        .map(c => (
                          <option key={c.id || c.category_name} value={c.category_name}>
                            {c.category_name} ({c.expense_count ?? 0})
                          </option>
                        ))}
                    </optgroup>
                  )}
                  {expenseCategoriesData.some(c => c.budget_type !== 'CapEx' && c.budget_type !== 'OpEx') && (
                    <optgroup label="── Shared / Other ──">
                      {expenseCategoriesData
                        .filter(c => c.budget_type !== 'CapEx' && c.budget_type !== 'OpEx')
                        .map(c => (
                          <option key={c.id || c.category_name} value={c.category_name}>
                            {c.category_name} ({c.expense_count ?? 0})
                          </option>
                        ))}
                    </optgroup>
                  )}
                  <option disabled value="">──────────</option>
                  <option value="__manage_categories__" className="text-emerald-700 font-bold">⚙ Configure Categories (CRUD)...</option>
                  <option value="__add_new_category__" className="text-emerald-700 font-semibold">+ Add New Category...</option>
                </select>
                <button
                  type="button"
                  onClick={handleOpenManageCategories}
                  title="Configure General IT & Expense Categories (CRUD, GL Codes & Sync)"
                  className="p-1 px-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <Settings2 size={11} className="text-emerald-600" />
                  <span>Config</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-xs">
                <span className="text-[11px] font-medium text-slate-500">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setDateRangeMode('custom');
                    setFromDate(e.target.value);
                  }}
                  className="bg-transparent text-slate-800 text-xs font-medium focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-xs">
                <span className="text-[11px] font-medium text-slate-500">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setDateRangeMode('custom');
                    setToDate(e.target.value);
                  }}
                  className="bg-transparent text-slate-800 text-xs font-medium focus:outline-none"
                />
              </div>
              {(fromDate || toDate || dateRangeMode !== 'all-year') && (
                <button
                  type="button"
                  onClick={() => handleSetPresetRange('all-year')}
                  className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 transition-colors border border-rose-200/60"
                  title="Reset to all expenses for this fiscal year"
                >
                  <X size={12} />
                  <span>Reset All Year</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Scope Filter Alert Banner */}
        {(selectedClassification !== 'All' || selectedBudgetType !== 'All Types') && (
          <div className={`mx-5 my-3 px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-xs shadow-xs ${
            selectedClassification === 'Unplanned'
              ? 'bg-gradient-to-r from-amber-50 via-amber-100/50 to-amber-50 border-amber-300 text-amber-950'
              : selectedBudgetType === 'CapEx'
              ? 'bg-gradient-to-r from-indigo-50 via-indigo-100/40 to-indigo-50 border-indigo-200 text-indigo-950'
              : 'bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className={`p-1 rounded-lg text-white shrink-0 shadow-xs ${
                selectedClassification === 'Unplanned'
                  ? 'bg-amber-500'
                  : selectedBudgetType === 'CapEx'
                  ? 'bg-indigo-600'
                  : 'bg-emerald-600'
              }`}>
                {selectedClassification === 'Unplanned' ? <AlertTriangle size={14} /> : <Filter size={14} />}
              </span>
              <div>
                <span className="font-bold">
                  Active Filter:{' '}
                  {selectedClassification === 'Unplanned'
                    ? selectedBudgetType === 'CapEx'
                      ? 'Unplanned CapEx Expenses'
                      : selectedBudgetType === 'OpEx'
                      ? 'Unplanned OpEx Expenses'
                      : 'Unplanned CapEx & OpEx Expenses'
                    : selectedClassification === 'Planned'
                    ? selectedBudgetType === 'CapEx'
                      ? 'Planned CapEx Expenses (Budgeted)'
                      : selectedBudgetType === 'OpEx'
                      ? 'Planned OpEx Expenses (Budgeted)'
                      : 'All Planned (Budgeted) Expenses'
                    : selectedClassification === 'Settled'
                    ? `Settled${selectedBudgetType !== 'All Types' ? ` ${selectedBudgetType}` : ''} Expenses`
                    : `${selectedBudgetType} Expenses (Planned + Unplanned)`}
                </span>
                <span className="ml-2 opacity-85 font-mono">
                  ({transactions.length} record{transactions.length === 1 ? '' : 's'} • Total ${(transactions.reduce((acc, t) => acc + Number(t.amount || 0), 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </span>
                {selectedClassification === 'Unplanned' && (
                  <p className="text-[11px] text-amber-800/90 mt-0.5">
                    Out-of-budget emergency expenditures requiring approval reference and budget reconciliation.
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedClassification('All');
                  setSelectedBudgetType('All Types');
                }}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold transition-colors shadow-2xs"
              >
                Clear Filter
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-3 w-8">#</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Invoice / PO</th>
                <th className="py-3 px-3">Description & Notes</th>
                <th className="py-3 px-3">Budget Link</th>
                <th className="py-3 px-3">Vendor</th>
                <th className="py-3 px-3">Campus</th>
                <th className="py-3 px-3 text-right">Amount ($)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length > 0 ? (
                transactions.map((tx, idx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                      {tx.expense_date ? new Date(tx.expense_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <div className="font-semibold text-slate-800">{tx.invoice_no || '—'}</div>
                      {tx.po_no && <div className="text-slate-400">{tx.po_no}</div>}
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{tx.description}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        <span className={tx.budget_type === 'CapEx' ? 'text-indigo-700 font-semibold' : 'text-teal-700 font-semibold'}>
                          {tx.category}
                        </span>
                        {tx.notes ? ` · ${tx.notes}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {tx.budget_classification === 'Unplanned' || (!tx.linked_budget_id && tx.budget_classification !== 'Settled') ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300">
                            <AlertTriangle size={11} className="text-amber-600 shrink-0" />
                            <span>Unplanned Expense</span>
                          </span>
                          {tx.approval_ref && (
                            <div className="text-[10px] font-mono text-slate-600 truncate max-w-[180px]">
                              Ref: <span className="font-semibold text-slate-800">{tx.approval_ref}</span>
                            </div>
                          )}
                          {tx.unplanned_reason && (
                            <div className="text-[10px] text-amber-900/80 italic max-w-[180px] truncate" title={tx.unplanned_reason}>
                              "{tx.unplanned_reason}"
                            </div>
                          )}
                        </div>
                      ) : tx.budget_classification === 'Settled' ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                            <Check size={11} className="text-blue-600 shrink-0" />
                            <span className="truncate max-w-[180px]">Settled: {tx.linked_item_name || `${tx.budget_type} Item`}</span>
                          </span>
                          {tx.approval_ref && (
                            <div className="text-[10px] font-mono text-slate-500 truncate max-w-[180px]">
                              Ref: {tx.approval_ref}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                          tx.budget_type === 'CapEx' 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                        }`}>
                          {tx.budget_type}: {tx.linked_item_name || 'General IT'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{tx.vendor_name}</td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{tx.site_name}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                      ${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                        tx.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        tx.payment_status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        tx.payment_status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {tx.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(tx.budget_classification === 'Unplanned' || (!tx.linked_budget_id && tx.budget_classification !== 'Settled')) && tx.settlement_status !== 'Settled' && (
                          <button
                            onClick={() => {
                              setSettlingTransaction(tx);
                              setSettleBudgetType('OpEx');
                              setSettleBudgetId('');
                              setSettleItemName('');
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg flex items-center gap-1 transition-colors mr-0.5"
                            title="Settle this unbudgeted expense against an approved CapEx or OpEx item"
                          >
                            <Sparkles size={11} className="text-amber-700" />
                            <span>Settle</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingTransaction(tx);
                            setModalMode(tx.budget_classification === 'Unplanned' ? 'unbudgeted' : 'budgeted');
                            setShowModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50"
                          title="Edit Transaction"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id, tx.description, Number(tx.amount), tx.vendor_name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    {selectedClassification === 'Unplanned' ? (
                      <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto text-amber-900">
                        <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                          <AlertTriangle size={24} />
                        </div>
                        <div className="font-bold text-sm text-slate-800">No Unplanned Expenses Found</div>
                        <p className="text-slate-500 text-xs leading-relaxed">
                          There are currently no unplanned or emergency IT expense transactions recorded for FY {selectedFiscalYear} matching your active campus/category filters.
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedClassification('All')}
                          className="mt-2 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          Show All Planned & Unplanned Expenses
                        </button>
                      </div>
                    ) : (
                      `No expense transactions found matching criteria for FY ${selectedFiscalYear}.`
                    )}
                  </td>
                </tr>
              )}
            </tbody>
            {transactions.length > 0 && (
              <tfoot className="border-t-2 border-emerald-200 bg-slate-50/95 sticky bottom-0 z-10 shadow-xs backdrop-blur-xs">
                <tr className="border-b border-emerald-100 text-slate-900 font-bold">
                  <td className="py-3.5 px-3 text-center text-emerald-700 bg-emerald-50/50">
                    <Calculator size={14} className="mx-auto text-emerald-600" />
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-700 font-mono text-[11px] whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200/80 text-slate-800">
                      {transactions.length} {transactions.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">
                    {ledgerTotals.invoiceCount} invoices
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-extrabold text-slate-900 text-xs tracking-tight flex items-center gap-1.5">
                      <span>Total Expense Ledger</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5 truncate">
                      FY {selectedFiscalYear} · {fromDate || toDate ? `${fromDate || 'Start'} to ${toDate || 'Present'}` : 'Full Year Range'}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200" title="Planned CapEx Expenses Total">
                        {ledgerTotals.capexCount} Planned CapEx (${ledgerTotals.capexAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </span>
                      <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title="Planned OpEx Expenses Total">
                        {ledgerTotals.opexCount} Planned OpEx (${ledgerTotals.opexAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </span>
                      {ledgerTotals.unplannedCount > 0 && (
                        <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200" title="Unbudgeted Expenses">
                          {ledgerTotals.unplannedCount} Unplanned (${ledgerTotals.unplannedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 font-medium text-[11px]">
                    {ledgerTotals.uniqueVendorsCount} {ledgerTotals.uniqueVendorsCount === 1 ? 'Vendor' : 'Vendors'}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-700 text-[11px]">
                    {selectedSite === 'All Sites' ? `${ledgerTotals.uniqueCampusesCount} Campuses` : selectedSite}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="font-extrabold text-emerald-800 font-mono text-sm">
                      ${ledgerTotals.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[9px] font-semibold text-slate-500 font-mono mt-0.5 flex items-center justify-end gap-1">
                      <span className="text-emerald-700 font-bold">${ledgerTotals.paidAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} Paid</span>
                      {ledgerTotals.pendingAmount > 0 && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-amber-700 font-bold">${ledgerTotals.pendingAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} Pending</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="inline-flex flex-col items-center gap-0.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {ledgerTotals.paidCount} Paid
                      </span>
                      {ledgerTotals.pendingCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {ledgerTotals.pendingCount} Pending
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      )}

      {/* --- ADD / EDIT EXPENSE TRANSACTION MODAL --- */}
      {showModal && (
        <ExpenseModal
          fiscalYear={selectedFiscalYear}
          transaction={editingTransaction}
          initialMode={modalMode}
          budgetOptions={budgetOptions}
          sites={campusList.filter(s => s !== 'All Sites')}
          assetCategories={assetCategories}
          configuredCategories={expenseCategoriesData}
          onConfigureCampuses={() => handleOpenManageCampuses('campuses')}
          onConfigureCategories={() => handleOpenManageCampuses('categories')}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            loadAll();
            showToast('Expense transaction recorded and budget actuals synced!', 'success');
          }}
        />
      )}

      {/* --- SETTLE UNPLANNED EXPENSE MODAL --- */}
      {settlingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-900 shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Settle Unplanned IT Expense
                  </h3>
                  <p className="text-xs text-slate-500">
                    Link and absorb this non-linked expense into an approved budget line
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettlingTransaction(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Expense details summary */}
            <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-amber-950 dark:text-amber-200 truncate pr-2">{settlingTransaction.description}</span>
                <span className="font-mono font-bold text-amber-950 dark:text-amber-200 text-sm shrink-0">
                  ${Number(settlingTransaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                <span>Vendor: <strong className="text-slate-800 dark:text-slate-100">{settlingTransaction.vendor_name}</strong></span>
                <span>Date: <strong className="text-slate-800 dark:text-slate-100">{settlingTransaction.expense_date ? new Date(settlingTransaction.expense_date).toLocaleDateString() : 'N/A'}</strong></span>
                <span>Campus: <strong className="text-slate-800 dark:text-slate-100">{settlingTransaction.site_name}</strong></span>
              </div>
              {settlingTransaction.approval_ref && (
                <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                  Approval Ref: <span className="font-semibold text-slate-800 dark:text-slate-100">{settlingTransaction.approval_ref}</span>
                </div>
              )}
              {settlingTransaction.unplanned_reason && (
                <div className="text-[11px] text-amber-900/90 dark:text-amber-300/90 italic">
                  Justification: "{settlingTransaction.unplanned_reason}"
                </div>
              )}
            </div>

            {/* Target Budget Form */}
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Target Budget Classification *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSettleBudgetType('OpEx');
                      setSettleBudgetId('');
                      setSettleItemName('');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      settleBudgetType === 'OpEx'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    OpEx & S-Operation
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettleBudgetType('CapEx');
                      setSettleBudgetId('');
                      setSettleItemName('');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      settleBudgetType === 'CapEx'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    CapEx Investment
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Select Approved Budget Item to Settle Against *
                </label>
                <select
                  value={settleBudgetId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSettleBudgetId(id);
                    const options = settleBudgetType === 'CapEx' ? budgetOptions.capexOptions : budgetOptions.opexOptions;
                    const found = options.find(o => o.id === id);
                    if (found) {
                      setSettleItemName(found.raw_name);
                    } else {
                      setSettleItemName('');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Choose {settleBudgetType} Item --</option>
                  {(settleBudgetType === 'CapEx' ? budgetOptions.capexOptions : budgetOptions.opexOptions).map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} (${opt.budget_amount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-xl text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                Settling will link this expenditure to the selected line item and update monthly actual disbursements in the IT budget ledger.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSettlingTransaction(null)}
                disabled={isSubmittingSettle}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!settleBudgetId || isSubmittingSettle}
                onClick={async () => {
                  if (!settleBudgetId) return;
                  setIsSubmittingSettle(true);
                  try {
                    const res = await fetch(`/api/it-expenses/${settlingTransaction.id}/settle`, {
                      method: 'POST',
                      headers: getAuthHeaders(),
                      body: JSON.stringify({
                        budget_type: settleBudgetType,
                        linked_budget_id: settleBudgetId,
                        linked_item_name: settleItemName || 'Settled Item'
                      })
                    });
                    if (res.ok) {
                      setSettlingTransaction(null);
                      await loadAll();
                      showToast(`Unplanned expense successfully settled against ${settleItemName || 'budget item'}!`, 'success');
                    } else {
                      const data = await res.json();
                      alert(data.error || 'Failed to settle expense');
                    }
                  } catch (e: any) {
                    alert('Error settling expense: ' + e.message);
                  } finally {
                    setIsSubmittingSettle(false);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingSettle ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Settling...</span>
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    <span>Confirm Settlement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- IN-APP DELETE CONFIRMATION MODAL --- */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Delete Expense Record?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to delete this expense transaction? Linked CapEx/OpEx actuals will be automatically recalculated.
                </p>
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {deleteModalItem.description}
                  </div>
                  {deleteModalItem.vendor && (
                    <div className="text-slate-500">
                      Vendor: <span className="font-medium text-slate-700 dark:text-slate-300">{deleteModalItem.vendor}</span>
                    </div>
                  )}
                  {deleteModalItem.amount > 0 && (
                    <div className="text-slate-500">
                      Amount: <span className="font-bold text-rose-600">${deleteModalItem.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- KHEMA CAMPUS & EXPENSE CONFIGURATION & MANAGEMENT MODAL --- */}
      {showCampusManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900 shrink-0">
                  {configActiveSection === 'campuses' ? <Building2 size={20} /> : <Tag size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Khema Campus Management & Configuration
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      Live Sync Enabled
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Maintain Khema branches, General IT expense categories, GL account codes, and live financial synchronizers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCampusManageModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Primary Section Switcher: Campuses & Sites vs General IT & Expense Categories */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl shrink-0 my-3">
              <button
                type="button"
                onClick={() => setConfigActiveSection('campuses')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  configActiveSection === 'campuses'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Building2 size={14} />
                <span>Campuses & Sites ({campusesData.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setConfigActiveSection('categories')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  configActiveSection === 'categories'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Tag size={14} />
                <span>General IT & Expense Categories ({expenseCategoriesData.length})</span>
              </button>
            </div>

            {/* SECTION 1: KHEMA CAMPUSES & SITES */}
            {configActiveSection === 'campuses' && (
              <>
                {/* Navigation Tabs */}
                <div className="flex items-center gap-2 pb-2 shrink-0 border-b border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCampusManageTab('list')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      campusManageTab === 'list'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Layers size={13} />
                    <span>All Campuses ({campusesData.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCreateCampus}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      campusManageTab === 'form' && campusFormMode === 'create'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Plus size={13} />
                    <span>Add New Campus</span>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto py-3">
                  {campusManageTab === 'list' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                        <span>Configured Khema hospital campuses & clinic sites:</span>
                        <button
                          type="button"
                          onClick={handleOpenCreateCampus}
                          className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 text-[11px]"
                        >
                          <Plus size={12} /> Add Campus
                        </button>
                      </div>

                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100 dark:divide-slate-800">
                        {campusesData.length > 0 ? (
                          campusesData.map((campus) => (
                            <div
                              key={campus.id || campus.site_name}
                              className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700">
                                  {campus.code || (campus.site_name.slice(0, 3).toUpperCase())}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                      {campus.site_name}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                        campus.status === 'Active'
                                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                                      }`}
                                    >
                                      {campus.status || 'Active'}
                                    </span>
                                  </div>
                                  {campus.location && (
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                                      <MapPin size={11} className="shrink-0" />
                                      <span>{campus.location}</span>
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 mt-1 text-[11px]">
                                    <span className="text-slate-500">
                                      Linked Expenses:{' '}
                                      <strong className="text-slate-800 dark:text-slate-200 font-mono">
                                        {campus.expense_count || 0}
                                      </strong>{' '}
                                      records
                                    </span>
                                    {(Number(campus.total_expense_amount) > 0) && (
                                      <span className="text-emerald-600 font-mono font-semibold">
                                        ${Number(campus.total_expense_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCampus(campus)}
                                  title="Edit campus details & sync expenses"
                                  className="p-1.5 px-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                                >
                                  <Edit2 size={12} />
                                  <span className="hidden sm:inline text-[11px]">Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePromptDeleteCampus(campus)}
                                  title="Delete campus and reassign expenses"
                                  className="p-1.5 px-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                                >
                                  <Trash2 size={12} />
                                  <span className="hidden sm:inline text-[11px]">Delete</span>
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            No campuses loaded. Click "+ Add New Campus" to configure one.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* CAMPUS CREATE / EDIT FORM */
                    <form onSubmit={handleSaveCampusCrud} className="space-y-3.5 text-xs">
                      <div className="flex items-center justify-between pb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {campusFormMode === 'create'
                            ? 'Create New Khema Campus'
                            : `Edit Campus: ${editingCampusItem?.site_name}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCampusManageTab('list')}
                          className="text-slate-400 hover:text-slate-600 text-[11px] font-semibold"
                        >
                          ← Back to Campus List
                        </button>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Campus Name / Branch *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sakal Polyclinic, Khema Sen Sok Clinic, Khema BKK"
                          value={campusFormSiteName}
                          onChange={(e) => {
                            setCampusFormSiteName(e.target.value);
                            if (campusFormMode === 'create' && !campusFormCode) {
                              const words = e.target.value.trim().split(/\s+/);
                              if (words.length >= 2) {
                                setCampusFormCode(words.map(w => w[0]).join('').toUpperCase());
                              }
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Short Code / Filter Tag
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. K1, K2, KG, KB, Sakal"
                            value={campusFormCode}
                            onChange={(e) => setCampusFormCode(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-slate-800 dark:text-slate-100 font-medium"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Status
                          </label>
                          <select
                            value={campusFormStatus}
                            onChange={(e) => setCampusFormStatus(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none font-medium text-slate-800 dark:text-slate-100"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Location / Physical Address (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Street 1984, Sen Sok, Phnom Penh"
                          value={campusFormLocation}
                          onChange={(e) => setCampusFormLocation(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 font-medium"
                        />
                      </div>

                      {/* AUTO-SYNC LINKED EXPENSES TOGGLE (when editing) */}
                      {campusFormMode === 'edit' && editingCampusItem && (
                        <div className="p-3.5 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl space-y-2">
                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={syncExpensesOnRename}
                              onChange={(e) => setSyncExpensesOnRename(e.target.checked)}
                              className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                            />
                            <div className="text-xs">
                              <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                                Synchronize relevant expense records ({editingCampusItem.expense_count || 0} existing records)
                              </span>
                              <span className="text-emerald-700 dark:text-emerald-400 text-[11px] leading-relaxed block mt-0.5">
                                When enabled, updating this campus will automatically rename all linked transaction records in the IT expenses database from <strong>"{editingCampusItem.site_name}"</strong> to <strong>"{campusFormSiteName || 'New Name'}"</strong> so historical and planned records remain completely consistent.
                              </span>
                            </div>
                          </label>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setCampusManageTab('list')}
                          disabled={isSavingCampusCrud}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingCampusCrud || !campusFormSiteName.trim()}
                          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {isSavingCampusCrud ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              <span>Saving & Syncing Expenses...</span>
                            </>
                          ) : (
                            <>
                              <Check size={13} />
                              <span>
                                {campusFormMode === 'create'
                                  ? 'Create Campus'
                                  : syncExpensesOnRename
                                  ? 'Update Campus & Sync Records'
                                  : 'Update Campus'}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            )}

            {/* SECTION 2: GENERAL IT & EXPENSE CATEGORIES CRUD */}
            {configActiveSection === 'categories' && (
              <>
                {/* Navigation Tabs */}
                <div className="flex items-center gap-2 pb-2 shrink-0 border-b border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCategoryManageTab('list')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      categoryManageTab === 'list'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Layers size={13} />
                    <span>All Categories ({expenseCategoriesData.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCreateCategory}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      categoryManageTab === 'form' && categoryFormMode === 'create'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Plus size={13} />
                    <span>Add New Category</span>
                  </button>
                </div>

                {/* Category Body */}
                <div className="flex-1 overflow-y-auto py-3">
                  {categoryManageTab === 'list' ? (
                    <div className="space-y-3">
                      {/* Search & Budget Type Filter Strip */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search category name, code, GL code..."
                            value={categorySearchQuery}
                            onChange={(e) => setCategorySearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>

                        {/* Budget Type Segmented Control */}
                        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                          {['All', 'CapEx', 'OpEx', 'Both'].map((bType) => (
                            <button
                              key={bType}
                              type="button"
                              onClick={() => setCategoryBudgetTypeFilter(bType)}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                                categoryBudgetTypeFilter === bType
                                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {bType}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={handleOpenCreateCategory}
                          className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 text-[11px] shrink-0"
                        >
                          <Plus size={12} /> Add Category
                        </button>
                      </div>

                      {/* Categories Data Grid */}
                      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100 dark:divide-slate-800">
                        {expenseCategoriesData.filter(cat => {
                          const q = categorySearchQuery.trim().toLowerCase();
                          const matchesQuery = !q || 
                            cat.category_name.toLowerCase().includes(q) ||
                            cat.code.toLowerCase().includes(q) ||
                            (cat.gl_account_code && cat.gl_account_code.toLowerCase().includes(q));
                          const matchesBudget = categoryBudgetTypeFilter === 'All' || 
                            cat.budget_type === categoryBudgetTypeFilter || 
                            cat.budget_type === 'Both';
                          return matchesQuery && matchesBudget;
                        }).length > 0 ? (
                          expenseCategoriesData
                            .filter(cat => {
                              const q = categorySearchQuery.trim().toLowerCase();
                              const matchesQuery = !q || 
                                cat.category_name.toLowerCase().includes(q) ||
                                cat.code.toLowerCase().includes(q) ||
                                (cat.gl_account_code && cat.gl_account_code.toLowerCase().includes(q));
                              const matchesBudget = categoryBudgetTypeFilter === 'All' || 
                                cat.budget_type === categoryBudgetTypeFilter || 
                                cat.budget_type === 'Both';
                              return matchesQuery && matchesBudget;
                            })
                            .map((cat) => (
                              <div
                                key={cat.id || cat.category_name}
                                className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                              >
                                <div className="flex items-start gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs flex flex-col items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700">
                                    <span>{cat.code || 'GEN'}</span>
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                                        {cat.category_name}
                                      </span>
                                      {cat.gl_account_code && (
                                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                          GL {cat.gl_account_code}
                                        </span>
                                      )}
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                          cat.budget_type === 'CapEx'
                                            ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                            : cat.budget_type === 'OpEx'
                                            ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                        }`}
                                      >
                                        {cat.budget_type || 'OpEx'}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                          cat.status === 'Active'
                                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                        }`}
                                      >
                                        {cat.status || 'Active'}
                                      </span>
                                    </div>

                                    {cat.description && (
                                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                                        {cat.description}
                                      </p>
                                    )}

                                    <div className="flex items-center gap-3 mt-1 text-[11px]">
                                      <span className="text-slate-500">
                                        Linked Expenses:{' '}
                                        <strong className="text-slate-800 dark:text-slate-200 font-mono">
                                          {cat.expense_count || 0}
                                        </strong>{' '}
                                        records
                                      </span>
                                      {(Number(cat.total_expense_amount) > 0) && (
                                        <span className="text-emerald-600 font-mono font-semibold">
                                          ${Number(cat.total_expense_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditCategory(cat)}
                                    title="Edit category, code & GL accounts"
                                    className="p-1.5 px-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                                  >
                                    <Edit2 size={12} />
                                    <span className="hidden sm:inline text-[11px]">Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePromptDeleteCategory(cat)}
                                    title="Delete category and safely reassign expenses"
                                    className="p-1.5 px-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                                  >
                                    <Trash2 size={12} />
                                    <span className="hidden sm:inline text-[11px]">Delete</span>
                                  </button>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            No matching expense categories found. Click "+ Add New Category" to create one.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* CATEGORY CREATE / EDIT FORM */
                    <form onSubmit={handleSaveCategoryCrud} className="space-y-3.5 text-xs">
                      <div className="flex items-center justify-between pb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {categoryFormMode === 'create'
                            ? 'Create New General IT Expense Category'
                            : `Edit Category: ${editingCategoryItem?.category_name}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCategoryManageTab('list')}
                          className="text-slate-400 hover:text-slate-600 text-[11px] font-semibold"
                        >
                          ← Back to Category List
                        </button>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Category Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Cloud Hosting & AI Infrastructure, Fiber Internet, HIS Maintenance"
                          value={categoryFormName}
                          onChange={(e) => {
                            setCategoryFormName(e.target.value);
                            if (categoryFormMode === 'create' && !categoryFormCode) {
                              const words = e.target.value.trim().split(/\s+/);
                              if (words.length >= 2) {
                                setCategoryFormCode(words.map(w => w[0]).join('').slice(0, 6).toUpperCase());
                              } else if (words.length === 1 && words[0].length >= 3) {
                                setCategoryFormCode(words[0].slice(0, 6).toUpperCase());
                              }
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Short Code / Tag *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. CLD-INF, HW-PRN, NET-INF"
                            value={categoryFormCode}
                            onChange={(e) => setCategoryFormCode(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-slate-800 dark:text-slate-100 font-medium"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            GL Account Code (General Ledger)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 6100-10, 6300-20, 6500-10"
                            value={categoryFormGlCode}
                            onChange={(e) => setCategoryFormGlCode(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-slate-800 dark:text-slate-100 font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Default Budget Classification
                          </label>
                          <select
                            value={categoryFormBudgetType}
                            onChange={(e) => setCategoryFormBudgetType(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none font-medium text-slate-800 dark:text-slate-100"
                          >
                            <option value="OpEx">OpEx (Operational Expenditure)</option>
                            <option value="CapEx">CapEx (Capital Expenditure)</option>
                            <option value="Both">Both (CapEx & OpEx)</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Status
                          </label>
                          <select
                            value={categoryFormStatus}
                            onChange={(e) => setCategoryFormStatus(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none font-medium text-slate-800 dark:text-slate-100"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Description & Accounting Policy (Optional)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Routine cloud services, subscription licenses, monthly ISP bandwidth..."
                          value={categoryFormDescription}
                          onChange={(e) => setCategoryFormDescription(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 font-medium"
                        />
                      </div>

                      {/* AUTO-SYNC LINKED EXPENSES TOGGLE (when editing) */}
                      {categoryFormMode === 'edit' && editingCategoryItem && (
                        <div className="p-3.5 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl space-y-2">
                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={syncExpensesOnCategoryRename}
                              onChange={(e) => setSyncExpensesOnCategoryRename(e.target.checked)}
                              className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                            />
                            <div className="text-xs">
                              <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                                Synchronize linked expense records ({editingCategoryItem.expense_count || 0} existing records)
                              </span>
                              <span className="text-emerald-700 dark:text-emerald-400 text-[11px] leading-relaxed block mt-0.5">
                                When enabled, updating this category will automatically update all matching transaction records in the IT expenses database from <strong>"{editingCategoryItem.category_name}"</strong> to <strong>"{categoryFormName || 'New Name'}"</strong> so historical and planned records remain completely consistent.
                              </span>
                            </div>
                          </label>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setCategoryManageTab('list')}
                          disabled={isSavingCategoryCrud}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingCategoryCrud || !categoryFormName.trim()}
                          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {isSavingCategoryCrud ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              <span>Saving & Syncing Expenses...</span>
                            </>
                          ) : (
                            <>
                              <Check size={13} />
                              <span>
                                {categoryFormMode === 'create'
                                  ? 'Create Category'
                                  : syncExpensesOnCategoryRename
                                  ? 'Update Category & Sync Records'
                                  : 'Update Category'}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- IN-APP CAMPUS DELETE & REASSIGNMENT MODAL --- */}
      {campusDeletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Campus "{campusDeletingItem.site_name}"?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  This campus is currently linked to{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {campusDeletingItem.expense_count || 0} IT expense records
                  </strong>
                  . To protect data integrity, please select where to reassign these records.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reassign Linked Expense Records To:
              </label>
              <select
                value={reassignTargetSite}
                onChange={(e) => setReassignTargetSite(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none font-medium text-xs text-slate-800 dark:text-slate-100"
              >
                {campusList
                  .filter(s => s !== campusDeletingItem.site_name)
                  .map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCampusDeletingItem(null)}
                disabled={isDeletingCampusCrud}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCampus}
                disabled={isDeletingCampusCrud}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeletingCampusCrud ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Reassigning & Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Delete & Reassign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- IN-APP CATEGORY DELETE & REASSIGNMENT MODAL --- */}
      {categoryDeletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Category "{categoryDeletingItem.category_name}"?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  This category is currently linked to{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {categoryDeletingItem.expense_count || 0} IT expense records
                  </strong>
                  . To protect financial ledger integrity, please select where to reassign these records.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reassign Linked Expense Records To:
              </label>
              <select
                value={categoryReassignTarget}
                onChange={(e) => setCategoryReassignTarget(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none font-medium text-xs text-slate-800 dark:text-slate-100"
              >
                {expenseCategoriesData
                  .filter(c => c.category_name !== categoryDeletingItem.category_name)
                  .map(c => (
                    <option key={c.id || c.category_name} value={c.category_name}>
                      {c.category_name} {c.code ? `(${c.code})` : ''}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCategoryDeletingItem(null)}
                disabled={isDeletingCategoryCrud}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                disabled={isDeletingCategoryCrud}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeletingCategoryCrud ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Reassigning & Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Delete & Reassign</span>
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

// --- SUB-COMPONENT: EXPENSE TRANSACTION MODAL ---
interface ExpenseModalProps {
  fiscalYear: number;
  transaction: ITExpenseTransaction | null;
  budgetOptions: { capexOptions: BudgetOption[]; opexOptions: BudgetOption[] };
  sites: string[];
  assetCategories?: string[];
  configuredCategories?: ITExpenseCategory[];
  initialMode?: 'budgeted' | 'unbudgeted';
  onConfigureCampuses?: () => void;
  onConfigureCategories?: () => void;
  onClose: () => void;
  onSaved: () => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  fiscalYear,
  transaction,
  budgetOptions,
  sites,
  assetCategories = [],
  configuredCategories = [],
  initialMode = 'budgeted',
  onConfigureCampuses,
  onConfigureCategories,
  onClose,
  onSaved
}) => {
  const isUnbudgeted = transaction
    ? (transaction.budget_classification === 'Unplanned' || (!transaction.linked_budget_id && transaction.budget_classification !== 'Settled'))
    : (initialMode === 'unbudgeted');

  // Build deduplicated categories combining configured database categories, IT Asset Management categories, and defaults
  const availableCategories = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    const addCat = (c: string) => {
      const trimmed = (c || '').trim();
      if (trimmed && !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        list.push(trimmed);
      }
    };

    // 1. Primary: Configured IT Expense Categories from database
    if (configuredCategories && configuredCategories.length > 0) {
      configuredCategories.filter(c => c.status === 'Active').forEach(c => addCat(c.category_name));
    }
    // 2. Synced categories from IT Asset Management
    if (assetCategories && assetCategories.length > 0) {
      assetCategories.forEach(addCat);
    }
    // 3. Existing transaction category if present
    if (transaction?.category) {
      addCat(transaction.category);
    }
    // 4. Fallback standard IT expense categories
    DEFAULT_EXPENSE_CATEGORIES.forEach(addCat);

    return list;
  }, [configuredCategories, assetCategories, transaction]);

  const [expenseDate, setExpenseDate] = useState(
    transaction?.expense_date ? transaction.expense_date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [invoiceNo, setInvoiceNo] = useState(transaction?.invoice_no || '');
  const [poNo, setPoNo] = useState(transaction?.po_no || '');
  const [vendorName, setVendorName] = useState(transaction?.vendor_name || '');
  const [description, setDescription] = useState(transaction?.description || '');
  const [budgetType, setBudgetType] = useState<'CapEx' | 'OpEx'>(transaction?.budget_type || 'OpEx');
  const [linkedBudgetId, setLinkedBudgetId] = useState<string>(transaction?.linked_budget_id || '');
  const [linkedItemName, setLinkedItemName] = useState<string>(transaction?.linked_item_name || '');
  const [siteName, setSiteName] = useState(transaction?.site_name || 'K1');
  const [category, setCategory] = useState(
    transaction?.category || (assetCategories.length > 0 ? assetCategories[0] : (DEFAULT_EXPENSE_CATEGORIES[0] || 'Software Maintenance'))
  );
  const [amount, setAmount] = useState(transaction?.amount || 0);
  const [paymentStatus, setPaymentStatus] = useState<any>(transaction?.payment_status || 'Paid');
  const [paymentMethod, setPaymentMethod] = useState(transaction?.payment_method || 'Bank Transfer');
  const [paymentDate, setPaymentDate] = useState(transaction?.payment_date ? transaction.payment_date.slice(0, 10) : '');
  const [notes, setNotes] = useState(transaction?.notes || '');
  const [unplannedReason, setUnplannedReason] = useState(transaction?.unplanned_reason || '');
  const [approvalRef, setApprovalRef] = useState(transaction?.approval_ref || '');
  const [saving, setSaving] = useState(false);

  // When selecting budget type, clear or select first option
  const activeOptions = budgetType === 'CapEx' ? budgetOptions.capexOptions : budgetOptions.opexOptions;

  const handleSelectBudgetItem = (id: string) => {
    setLinkedBudgetId(id);
    const selected = activeOptions.find(o => o.id === id);
    if (selected) {
      setLinkedItemName(selected.raw_name);
      if (selected.site && selected.site !== 'All Sites') {
        setSiteName(selected.site);
      }
      if (selected.category) {
        setCategory(selected.category);
      }
      if (!description.trim()) {
        setDescription(selected.raw_name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !vendorName.trim() || !expenseDate) {
      alert('Description, Vendor Name, and Date are required');
      return;
    }

    if (isUnbudgeted) {
      if (!unplannedReason.trim()) {
        alert('Unplanned Justification Reason is required for non-linked expenses.');
        return;
      }
      if (!approvalRef.trim()) {
        alert('Approval Reference / PO Code is required for non-linked expenses.');
        return;
      }
    } else {
      if (!linkedBudgetId) {
        alert('Please choose an IT budget item to link this expense with.');
        return;
      }
    }

    setSaving(true);
    try {
      const url = transaction ? `/api/it-expenses/${transaction.id}` : '/api/it-expenses';
      const method = transaction ? 'PUT' : 'POST';
      const token = localStorage.getItem('token');

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fiscal_year: fiscalYear,
          expense_date: expenseDate,
          invoice_no: invoiceNo.trim() || null,
          po_no: poNo.trim() || null,
          vendor_name: vendorName.trim(),
          description: description.trim(),
          budget_type: budgetType,
          linked_budget_id: isUnbudgeted ? null : (linkedBudgetId || null),
          linked_item_name: isUnbudgeted ? 'Unplanned Non-Linked Expense' : (linkedItemName || null),
          site_name: siteName,
          category,
          amount: parseFloat(String(amount)) || 0,
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          payment_date: paymentDate || null,
          notes: notes.trim(),
          budget_classification: isUnbudgeted ? 'Unplanned' : (transaction?.budget_classification || 'Planned'),
          unplanned_reason: isUnbudgeted ? unplannedReason.trim() : (unplannedReason.trim() || null),
          approval_ref: approvalRef.trim() || null,
          settlement_status: isUnbudgeted ? (transaction?.settlement_status || 'Unsettled') : 'Settled'
        })
      });

      if (res.ok) {
        onSaved();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save expense');
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
          <div className="flex items-center gap-2">
            {isUnbudgeted ? (
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <AlertTriangle size={16} />
              </span>
            ) : (
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Receipt size={16} />
              </span>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isUnbudgeted
                  ? (transaction ? 'Edit Unplanned Expense' : 'Record Non-Linked Unplanned Expense')
                  : (transaction ? 'Edit Expense Transaction' : 'Record New IT Expense')}
              </h3>
              <p className="text-[11px] text-slate-500">
                Fiscal Year {fiscalYear} · {isUnbudgeted ? 'Non-Linked Variance Control' : 'Budget-Linked Disbursement'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Budget Link Picker OR Unplanned Expense Control */}
          {isUnbudgeted ? (
            <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 text-xs">
                    Non-Linked Unbudgeted Disbursement
                  </h4>
                  <p className="text-[11px] text-amber-800/80 leading-relaxed mt-0.5">
                    This disbursement is not linked to an approved budget item. It will be flagged for governance review and can be settled later.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Approval Reference / PO Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CIO-EMERGENCY-2026 or APPR-049"
                    value={approvalRef}
                    onChange={(e) => setApprovalRef(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Expense Classification *
                  </label>
                  <select
                    value={budgetType}
                    onChange={(e) => setBudgetType(e.target.value as 'CapEx' | 'OpEx')}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="OpEx">OpEx (Operational / S-Operation)</option>
                    <option value="CapEx">CapEx (Capital Investment)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Unplanned Justification Reason *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain why this expense was unbudgeted (e.g. emergency hardware replacement, unplanned regulatory compliance SLA)..."
                  value={unplannedReason}
                  onChange={(e) => setUnplannedReason(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800"
                />
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Layers size={14} className="text-indigo-600" />
                <span>Link with IT Budget Plan (FY {fiscalYear}) *</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">Budget Classification</label>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setBudgetType('OpEx');
                        setLinkedBudgetId('');
                        setLinkedItemName('');
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-lg font-bold border transition-all ${
                        budgetType === 'OpEx' 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      OpEx & S-Operation
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBudgetType('CapEx');
                        setLinkedBudgetId('');
                        setLinkedItemName('');
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-lg font-bold border transition-all ${
                        budgetType === 'CapEx' 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      CapEx Investment
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500">Select Budget Item to Settle</label>
                  <select
                    value={linkedBudgetId}
                    onChange={(e) => handleSelectBudgetItem(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-800"
                  >
                    <option value="">-- Choose {budgetType} Item --</option>
                    {activeOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} (${opt.budget_amount.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {linkedItemName && (
                <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg font-medium flex items-center gap-1.5">
                  <Check size={13} />
                  <span>Linked to: <strong>{linkedItemName}</strong>. This disbursement will automatically record as actual spend for this month.</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Expense Date *</label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Disbursement Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-right font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700">Expense Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. eHospital monthly cloud SLA invoice"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Vendor / Supplier *</label>
              <input
                type="text"
                required
                placeholder="e.g. MedTech Asia"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Invoice Number</label>
              <input
                type="text"
                placeholder="e.g. INV-2027-042"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">PO Number</label>
              <input
                type="text"
                placeholder="e.g. PO-2027-015"
                value={poNo}
                onChange={(e) => setPoNo(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Khema Campus</label>
                {onConfigureCampuses && (
                  <button
                    type="button"
                    onClick={onConfigureCampuses}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 hover:underline"
                    title="Configure Khema campuses & branches"
                  >
                    <Settings2 size={11} />
                    <span>Configure</span>
                  </button>
                )}
              </div>
              <select
                value={siteName}
                onChange={(e) => {
                  if (e.target.value === '__configure__' && onConfigureCampuses) {
                    onConfigureCampuses();
                  } else {
                    setSiteName(e.target.value);
                  }
                }}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="All Sites">All Sites</option>
                {sites.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
                {onConfigureCampuses && (
                  <>
                    <option disabled value="">──────────</option>
                    <option value="__configure__" className="text-emerald-700 font-bold">⚙ Configure Campuses (CRUD)...</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Category</label>
                <div className="flex items-center gap-2">
                  {onConfigureCategories && (
                    <button
                      type="button"
                      onClick={onConfigureCategories}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 hover:underline"
                      title="Configure General IT & Expense Categories"
                    >
                      <Settings2 size={11} />
                      <span>Configure</span>
                    </button>
                  )}
                  {configuredCategories && configuredCategories.length > 0 ? (
                    <span className="text-[10px] text-slate-500 font-medium">
                      ({configuredCategories.filter(c => c.status === 'Active').length} active)
                    </span>
                  ) : assetCategories.length > 0 ? (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Synced from IT Assets ({assetCategories.length})
                    </span>
                  ) : null}
                </div>
              </div>
              <select
                value={category}
                onChange={(e) => {
                  if (e.target.value === '__configure_categories__' && onConfigureCategories) {
                    onConfigureCategories();
                  } else {
                    setCategory(e.target.value);
                  }
                }}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-medium"
              >
                {configuredCategories && configuredCategories.length > 0 ? (
                  <>
                    {configuredCategories.some(c => c.status === 'Active' && c.budget_type === 'CapEx') && (
                      <optgroup label="── CapEx (Asset Type) ──">
                        {configuredCategories
                          .filter(c => c.status === 'Active' && c.budget_type === 'CapEx')
                          .map(c => (
                            <option key={`conf-cap-${c.id || c.category_name}`} value={c.category_name}>
                              {c.category_name}
                            </option>
                          ))}
                      </optgroup>
                    )}
                    {configuredCategories.some(c => c.status === 'Active' && c.budget_type === 'OpEx') && (
                      <optgroup label="── OpEx (Account Code) ──">
                        {configuredCategories
                          .filter(c => c.status === 'Active' && c.budget_type === 'OpEx')
                          .map(c => (
                            <option key={`conf-opx-${c.id || c.category_name}`} value={c.category_name}>
                              {c.category_name}
                            </option>
                          ))}
                      </optgroup>
                    )}
                    {configuredCategories.some(c => c.status === 'Active' && c.budget_type !== 'CapEx' && c.budget_type !== 'OpEx') && (
                      <optgroup label="── Shared / General IT ──">
                        {configuredCategories
                          .filter(c => c.status === 'Active' && c.budget_type !== 'CapEx' && c.budget_type !== 'OpEx')
                          .map(c => (
                            <option key={`conf-oth-${c.id || c.category_name}`} value={c.category_name}>
                              {c.category_name}
                            </option>
                          ))}
                      </optgroup>
                    )}
                    {transaction?.category && !configuredCategories.some(c => c.category_name.toLowerCase() === transaction.category.toLowerCase()) && (
                      <option value={transaction.category}>{transaction.category}</option>
                    )}
                  </>
                ) : assetCategories.length > 0 ? (
                  <>
                    <optgroup label="IT Asset Management Categories">
                      {assetCategories.map(c => (
                        <option key={`asset-${c}`} value={c}>{c}</option>
                      ))}
                    </optgroup>
                    <optgroup label="General IT & Expense Categories">
                      {DEFAULT_EXPENSE_CATEGORIES.filter(c => !assetCategories.some(ac => ac.toLowerCase() === c.toLowerCase())).map(c => (
                        <option key={`gen-${c}`} value={c}>{c}</option>
                      ))}
                    </optgroup>
                  </>
                ) : (
                  availableCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))
                )}
                {onConfigureCategories && (
                  <>
                    <option disabled value="">──────────</option>
                    <option value="__configure_categories__" className="text-emerald-700 font-bold">⚙ Configure Categories (CRUD)...</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700">Notes & Settlement Remarks</label>
            <textarea
              rows={2}
              placeholder="e.g. Approved by Head of IT, wire transfer ref #TX-9912..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              {saving ? 'Saving & Settling...' : transaction ? 'Update Expense' : 'Record & Settle Expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
