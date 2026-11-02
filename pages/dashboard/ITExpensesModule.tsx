import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Receipt, DollarSign, TrendingUp, Calendar, Filter, Search, Plus, 
  Edit2, Trash2, Download, Upload, RefreshCw, CheckCircle2, Clock, 
  AlertCircle, AlertTriangle, Building2, Layers, Tag, CreditCard, 
  ArrowUpRight, ArrowDownRight, ExternalLink, X, FileText, Check,
  SlidersHorizontal, ChevronDown, CheckSquare, Sparkles, BarChart3,
  PieChart as PieIcon, ArrowRight
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
}

export interface BudgetOption {
  id: string;
  name: string;
  raw_name: string;
  site: string;
  category: string;
  budget_amount: number;
}

const SITES = ['All Sites', 'K1', 'K2', 'KG', 'Sakal'];
const BUDGET_TYPES = ['All Types', 'CapEx', 'OpEx'];
const PAYMENT_STATUSES = ['All Statuses', 'Paid', 'Pending', 'Processing', 'Overdue'];
const PAYMENT_METHODS = ['Bank Transfer', 'Credit Card', 'Cheque', 'Cash', 'Direct Debit'];
const CATEGORIES = [
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
  // Primary Annual Fiscal Year
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(2026);
  const [availableYears, setAvailableYears] = useState<number[]>([2026, 2027, 2028, 2029, 2030]);

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

  // Filters
  const [selectedSite, setSelectedSite] = useState<string>('All Sites');
  const [selectedBudgetType, setSelectedBudgetType] = useState<string>('All Types');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('All Statuses');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data
  const [transactions, setTransactions] = useState<ITExpenseTransaction[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [budgetOptions, setBudgetOptions] = useState<{ capexOptions: BudgetOption[]; opexOptions: BudgetOption[] }>({
    capexOptions: [],
    opexOptions: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<ITExpenseTransaction | null>(null);

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
    toD: string = toDate
  ) => {
    try {
      const params = new URLSearchParams({ fiscal_year: String(fy) });
      if (site !== 'All Sites') params.append('site', site);
      if (bType !== 'All Types') params.append('budget_type', bType);
      if (status !== 'All Statuses') params.append('payment_status', status);
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
    toD: string = toDate
  ) => {
    try {
      const params = new URLSearchParams({ fiscal_year: String(fy) });
      if (site !== 'All Sites') params.append('site', site);
      if (fromD && fromD.trim()) params.append('from_date', fromD.trim());
      if (toD && toD.trim()) params.append('to_date', toD.trim());

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

  const loadAll = async () => {
    setLoading(true);
    const curFrom = activeSubView === 'analytics' ? execFromDate : fromDate;
    const curTo = activeSubView === 'analytics' ? execToDate : toDate;
    await Promise.all([
      fetchTransactions(selectedFiscalYear, selectedSite, selectedBudgetType, selectedPaymentStatus, searchQuery, curFrom, curTo),
      fetchAnalytics(selectedFiscalYear, selectedSite, curFrom, curTo),
      fetchBudgetOptions(selectedFiscalYear)
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
    loadAll();
  }, [selectedFiscalYear, selectedSite]);

  useEffect(() => {
    const curFrom = activeSubView === 'analytics' ? execFromDate : fromDate;
    const curTo = activeSubView === 'analytics' ? execToDate : toDate;
    fetchTransactions(selectedFiscalYear, selectedSite, selectedBudgetType, selectedPaymentStatus, searchQuery, curFrom, curTo);
    fetchAnalytics(selectedFiscalYear, selectedSite, curFrom, curTo);
  }, [activeSubView, selectedBudgetType, selectedPaymentStatus, searchQuery, fromDate, toDate, execFromDate, execToDate]);

  // Delete transaction
  const handleDelete = async (id: string, desc: string) => {
    if (!window.confirm(`Delete expense record "${desc}"? Linked CapEx/OpEx actuals will be automatically adjusted.`)) return;
    try {
      const res = await fetch(`/api/it-expenses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('Expense transaction removed and budget actuals synced', 'success');
        loadAll();
      } else {
        showToast('Failed to delete expense', 'error');
      }
    } catch (e: any) {
      showToast('Error deleting expense: ' + e.message, 'error');
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
        'Linked Budget Item': tx.linked_item_name || 'Unlinked',
        'Vendor Name': tx.vendor_name,
        'Campus': tx.site_name,
        'Category': tx.category,
        'Amount ($)': Number(tx.amount),
        'Payment Status': tx.payment_status,
        'Payment Method': tx.payment_method,
        'Payment Date': tx.payment_date ? tx.payment_date.slice(0, 10) : '',
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
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {SITES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
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

            <Button
              onClick={() => {
                setEditingTransaction(null);
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
          {/* Executive Monthly Range Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Calendar size={15} className="text-emerald-600" />
                  <span>Monthly Range Filter (FY {selectedFiscalYear})</span>
                </span>
                {execMonthPreset === 'all-year' ? (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
                    Full FY {selectedFiscalYear} (Default: All Months)
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1.5">
                    <Sparkles size={11} className="text-emerald-600" />
                    <span>
                      Filtered: {MONTHS[execFromMonth - 1]?.name} – {MONTHS[execToMonth - 1]?.name} {selectedFiscalYear}
                      {execMonthPreset !== 'custom' ? ` (${execMonthPreset.toUpperCase()})` : ''}
                    </span>
                  </span>
                )}
              </div>

              {execMonthPreset !== 'all-year' && (
                <button
                  type="button"
                  onClick={() => applyExecMonthPreset('all-year')}
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors border border-rose-200/50 self-start sm:self-auto"
                  title="Reset filter to full fiscal year"
                >
                  <X size={13} />
                  <span>Reset to Full Year</span>
                </button>
              )}
            </div>

            {/* Presets & Custom Month Pickers */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-0.5">
              {/* Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                  Presets:
                </span>
                <button
                  type="button"
                  onClick={() => applyExecMonthPreset('all-year')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    execMonthPreset === 'all-year'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  All FY {selectedFiscalYear} (Default)
                </button>
                <button
                  type="button"
                  onClick={() => applyExecMonthPreset('q1')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    execMonthPreset === 'q1'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  Q1 (Jan–Mar)
                </button>
                <button
                  type="button"
                  onClick={() => applyExecMonthPreset('q2')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    execMonthPreset === 'q2'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  Q2 (Apr–Jun)
                </button>
                <button
                  type="button"
                  onClick={() => applyExecMonthPreset('q3')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    execMonthPreset === 'q3'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  Q3 (Jul–Sep)
                </button>
                <button
                  type="button"
                  onClick={() => applyExecMonthPreset('q4')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    execMonthPreset === 'q4'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  Q4 (Oct–Dec)
                </button>
                <button
                  type="button"
                  onClick={() => applyExecMonthPreset('h1')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    execMonthPreset === 'h1'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  H1 (Jan–Jun)
                </button>
                <button
                  type="button"
                  onClick={() => applyExecMonthPreset('h2')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    execMonthPreset === 'h2'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  H2 (Jul–Dec)
                </button>
              </div>

              {/* Month Pickers */}
              <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-1.5 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider pl-1">
                  Custom Range:
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">From:</span>
                  <select
                    value={execFromMonth}
                    onChange={(e) => handleFromMonthSelect(parseInt(e.target.value, 10))}
                    className="bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                  >
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <span className="text-slate-400 text-xs">&rarr;</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">To:</span>
                  <select
                    value={execToMonth}
                    onChange={(e) => handleToMonthSelect(parseInt(e.target.value, 10))}
                    className="bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                  >
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Realized Expenses */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Realized Spend</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign size={16} />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                  ${(analytics?.totalExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>{transactions.length} settled {transactions.length === 1 ? 'transaction' : 'transactions'}</span>
                  <span className="text-emerald-700 font-semibold">
                    {execMonthPreset === 'all-year' 
                      ? `FY ${selectedFiscalYear} Full Year` 
                      : `${MONTHS[execFromMonth-1]?.short}–${MONTHS[execToMonth-1]?.short} ${selectedFiscalYear}`}
                  </span>
                </div>
              </div>
            </div>

            {/* CapEx Disbursed */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CapEx Disbursed</span>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Layers size={16} />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-indigo-900 tracking-tight font-mono">
                  ${(analytics?.totalCapexExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                  {analytics?.totalExpenses > 0 
                    ? `${Math.round((analytics.totalCapexExpenses / analytics.totalExpenses) * 100)}% of total IT spend` 
                    : 'Hardware & Infrastructure'}
                </div>
              </div>
            </div>

            {/* OpEx Disbursed */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">OpEx Disbursed</span>
                <span className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <TrendingUp size={16} />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-teal-900 tracking-tight font-mono">
                  ${(analytics?.totalOpexExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                  {analytics?.totalExpenses > 0 
                    ? `${Math.round((analytics.totalOpexExpenses / analytics.totalExpenses) * 100)}% of total IT spend` 
                    : 'Software & S-Operations'}
                </div>
              </div>
            </div>

            {/* Pending & Overdue Invoices */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Disbursements</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Clock size={16} />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                  ${(analytics?.totalPending || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span>Overdue: ${(analytics?.totalOverdue || 0).toLocaleString()}</span>
                  <span className="text-amber-600 font-semibold">Awaiting Settlement</span>
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
                    : 'Realized monthly cash flow settlements split between CapEx and OpEx budgets across all 12 fiscal months'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-indigo-500"></span>
                  <span>CapEx Spend</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                  <span>OpEx Spend</span>
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
                        `$${Number(value).toLocaleString()}`, 
                        name === 'capex' ? 'CapEx Spend' : name === 'opex' ? 'OpEx Spend' : 'Total Spend'
                      ]}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                    />
                    <Bar dataKey="capex" name="capex" fill="#6366f1" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="opex" name="opex" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  No monthly disbursement data recorded
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

            {/* Custom Date Pickers */}
            <div className="flex items-center gap-2 flex-wrap">
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
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{tx.category} {tx.notes ? `· ${tx.notes}` : ''}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                        tx.budget_type === 'CapEx' 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                      }`}>
                        {tx.budget_type}: {tx.linked_item_name || 'General IT'}
                      </span>
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
                        <button
                          onClick={() => {
                            setEditingTransaction(tx);
                            setShowModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50"
                          title="Edit Transaction"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id, tx.description)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
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
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                    No expense transactions found matching criteria for FY {selectedFiscalYear}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* --- ADD / EDIT EXPENSE TRANSACTION MODAL --- */}
      {showModal && (
        <ExpenseModal
          fiscalYear={selectedFiscalYear}
          transaction={editingTransaction}
          budgetOptions={budgetOptions}
          sites={SITES.filter(s => s !== 'All Sites')}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            loadAll();
            showToast('Expense transaction recorded and budget actuals synced!', 'success');
          }}
        />
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
  onClose: () => void;
  onSaved: () => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  fiscalYear,
  transaction,
  budgetOptions,
  sites,
  onClose,
  onSaved
}) => {
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
  const [category, setCategory] = useState(transaction?.category || 'Software Maintenance');
  const [amount, setAmount] = useState(transaction?.amount || 0);
  const [paymentStatus, setPaymentStatus] = useState<any>(transaction?.payment_status || 'Paid');
  const [paymentMethod, setPaymentMethod] = useState(transaction?.payment_method || 'Bank Transfer');
  const [paymentDate, setPaymentDate] = useState(transaction?.payment_date ? transaction.payment_date.slice(0, 10) : '');
  const [notes, setNotes] = useState(transaction?.notes || '');
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
          linked_budget_id: linkedBudgetId || null,
          linked_item_name: linkedItemName || null,
          site_name: siteName,
          category,
          amount: parseFloat(String(amount)) || 0,
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          payment_date: paymentDate || null,
          notes: notes.trim()
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
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Receipt size={18} className="text-emerald-600" />
            <span>{transaction ? 'Edit Expense Transaction' : 'Record New IT Expense'} (FY {fiscalYear})</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Budget Link Picker */}
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
              <label className="font-semibold text-slate-700">Khema Campus</label>
              <select
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="All Sites">All Sites</option>
                {sites.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
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
