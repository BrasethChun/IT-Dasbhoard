import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, TrendingUp, Calendar, AlertCircle, CheckCircle2, Clock,
  Search, Plus, Edit2, Trash2, Download, Upload, RefreshCw,
  FileSpreadsheet, Layers, ShieldCheck, ChevronDown, ChevronRight, X,
  AlertTriangle, Building2, PieChart as PieChartIcon, BarChart3,
  Copy, SlidersHorizontal, RotateCcw, Tag, Calculator, BookOpen, Database,
  Sparkles, Receipt
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Button } from '../../components/ui/Button';
import { SmartModal } from '../../components/ui/SmartModal';
import { DensityToggle } from '../../components/ui/SmartGrid';
import {
  ALL_BU_FILTER_OPTIONS,
  ASSET_TYPES_MASTER,
  CAPEX_STAGE_TAGS,
  CAPEX_STATUSES_2027,
  COA_SUMMARY_2027,
  DEPT_DEFINITIONS,
  HISTORICAL_UNIT_PRICE_CATALOG,
  MONTH_KEYS,
  MONTH_LABELS,
  UnitPriceCatalogItem,
  distributeAmountAcrossMonths,
  extractGlCodeNumber,
  findCoaByCode,
  formatBuDisplayLabel,
  normalizeBuCanonical,
  normalizeCapexStage,
  normalizeCapexStatus,
  normalizeDepartmentCode
} from '../../src/data/itBudget2027MasterData';
import {
  BudgetExportMode,
  exportCapexTemplateWorkbook,
  exportOpexTemplateWorkbook,
  parseBudgetWorkbook
} from '../../src/utils/budgetExcel2027';
import { MasterDataTab } from '../../components/budget/MasterDataTab';
import { GlActualsTab, GlActualItem } from '../../components/budget/GlActualsTab';
import { CapexEditModal } from '../../components/budget/CapexEditModal';
import { OpexEditModal, OpexAccountCodeItem } from '../../components/budget/OpexEditModal';
import { AccountCodesMasterModal } from '../../components/budget/AccountCodesMasterModal';

// --- INTERFACES ---
export interface CapExItem {
  id: string;
  fiscal_year: number;
  item_no: number;
  description: string;
  specifications?: string;
  asset_type: string;
  asset_owner?: string;
  asset_supervisor?: string;
  site: string;
  bu?: string;
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
  expected_start_month?: string;
  expected_complete_month?: string;
  status: 'In Progress' | 'Complete' | 'Cancelled' | string;
  stage_tag?: 'Estimate' | 'Agreement' | 'Bill' | 'Planning' | string;
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
  remark?: string;
  justification: string;
  site: string;
  bu_canonical?: string;
  cost_center: string;
  pic: string;
  billing_cycle: 'Monthly' | 'Annual' | 'Quarterly' | string;
  renewal_date: string | null;
  qty: number;
  unit_price: number;
  annual_cost: number;
  budget_classification?: 'Planned' | 'Unplanned';
  unplanned_reason?: string;
  approval_ref?: string;
  monthly_spending: Record<string, { planned: number; actual: number }>;
  quarterly_spending?: {
    planned: { q1: number; q2: number; q3: number; q4: number; total: number };
    actual: { q1: number; q2: number; q3: number; q4: number; total: number };
    variance: { q1: number; q2: number; q3: number; q4: number; total: number };
  };
}

export type OpexAccountCode = OpexAccountCodeItem;

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
  totalGlActual?: number;
  effectiveOpexActual?: number;
  totalAnnualOpexVariance: number;
  totalUnplannedOpexPlanned?: number;
  totalUnplannedOpexActual?: number;
  unplannedOpexCount?: number;
  capexCount: number;
  opexCount: number;
  glEntryCount?: number;
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
  capexByAssetType: Record<string, { planned: number; actual: number; count?: number }>;
  capexByStatus?: Record<string, { planned: number; actual: number; count: number }>;
  capexByStage?: Record<string, { planned: number; actual: number; count: number }>;
  capexQuarterly?: { q1: number; q2: number; q3: number; q4: number; total: number };
  opexByAccount: Record<string, { code?: string; name?: string; planned: number; actual: number; glActual?: number; count?: number }>;
  totalBySite: Record<string, {
    bu_code?: string;
    planned: number;
    actual: number;
    variance: number;
    capex_planned: number;
    capex_actual: number;
    opex_planned: number;
    opex_actual: number;
    gl_actual?: number;
  }>;
  cashFlowChartData: Array<{
    month: string;
    planned_capex: number;
    actual_capex: number;
    planned_opex: number;
    actual_opex: number;
    gl_actual_opex?: number;
    planned_total: number;
    actual_total: number;
    variance: number;
  }>;
}

const CHART_PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];
const fmtUsd = (val: number | undefined | null) =>
  (Math.round((Number(val) || 0) * 100) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

export const CapExOpExModule: React.FC<{ sites?: any[] }> = () => {
  // Navigation & Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'capex' | 'opex' | 'gl-actuals' | 'master-data' | 'sync'>(() => {
    const saved = localStorage.getItem('khema_capex_subtab');
    const valid = ['overview', 'capex', 'opex', 'gl-actuals', 'master-data', 'sync'];
    return (saved && valid.includes(saved) ? saved : 'overview') as any;
  });

  // Primary Fiscal Year (Defaults to FY 2027; preserves existing years)
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(() => {
    const saved = localStorage.getItem('khema_capex_fiscal_year');
    return saved ? parseInt(saved, 10) || 2027 : 2027;
  });
  const [availableYears, setAvailableYears] = useState<number[]>([2026, 2027, 2028, 2029, 2030]);
  const [showCloneYearModal, setShowCloneYearModal] = useState(false);
  const [cloneTargetYear, setCloneTargetYear] = useState<number>(2028);
  const [cloneOverwrite, setCloneOverwrite] = useState(false);

  // Fiscal Year Rollover State (Sync & Template tab)
  const [rolloverSourceYear, setRolloverSourceYear] = useState<number>(selectedFiscalYear);
  const [rolloverTargetYear, setRolloverTargetYear] = useState<number>(selectedFiscalYear + 1);
  const [rolloverCopyCapex, setRolloverCopyCapex] = useState<boolean>(true);
  const [rolloverCopyOpex, setRolloverCopyOpex] = useState<boolean>(true);
  const [rolloverCampus, setRolloverCampus] = useState<string>('All Sites');
  const [rolloverAdjustmentPercent, setRolloverAdjustmentPercent] = useState<number>(0);
  const [rolloverOverwrite, setRolloverOverwrite] = useState<boolean>(false);
  const [isRollingOver, setIsRollingOver] = useState<boolean>(false);
  const [showResetZeroModal, setShowResetZeroModal] = useState<boolean>(false);
  const [resetZeroYear, setResetZeroYear] = useState<number>(selectedFiscalYear);
  const [resetZeroMode, setResetZeroMode] = useState<'zero_amounts' | 'clear_items'>('zero_amounts');
  const [resetZeroConfirmed, setResetZeroConfirmed] = useState<boolean>(false);
  const [isResettingZero, setIsResettingZero] = useState<boolean>(false);
  const [resetSnapshot, setResetSnapshot] = useState<{
    available: boolean;
    fiscal_year?: number;
    campus_filter?: string;
    capex_count?: number;
    opex_count?: number;
    created_at?: string;
  } | null>(null);
  const [isUndoingReset, setIsUndoingReset] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('khema_capex_subtab', activeSubTab);
  }, [activeSubTab]);

  useEffect(() => {
    localStorage.setItem('khema_capex_fiscal_year', String(selectedFiscalYear));
    setRolloverSourceYear(selectedFiscalYear);
    setRolloverTargetYear(selectedFiscalYear + 1);
  }, [selectedFiscalYear]);

  // Global Site Filter & Search
  const [selectedSite, setSelectedSite] = useState<string>('All Sites');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Core Data State
  const [summaryData, setSummaryData] = useState<ExecutiveSummaryData | null>(null);
  const [capexItems, setCapexItems] = useState<CapExItem[]>([]);
  const [opexItems, setOpexItems] = useState<OpExItem[]>([]);
  const [glActuals, setGlActuals] = useState<GlActualItem[]>([]);
  const [unitPriceCatalog, setUnitPriceCatalog] = useState<UnitPriceCatalogItem[]>(HISTORICAL_UNIT_PRICE_CATALOG);
  const [accountCodes, setAccountCodes] = useState<OpexAccountCodeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  // Overview analytics toggle
  const [overviewBreakdownMode, setOverviewBreakdownMode] = useState<'capex_asset' | 'capex_status' | 'opex_coa'>('capex_asset');

  // CapEx specific filters & expanded state
  const [capexAssetFilter, setCapexAssetFilter] = useState<string>('All Types');
  const [capexDeptFilter, setCapexDeptFilter] = useState<string>('All Departments');
  const [capexStatusFilter, setCapexStatusFilter] = useState<string>('All Statuses');
  const [capexStageFilter, setCapexStageFilter] = useState<string>('All Stages');
  const [expandedCapexId, setExpandedCapexId] = useState<string | null>(null);
  const [showPortfolioPhasingTotal, setShowPortfolioPhasingTotal] = useState<boolean>(false);

  // OpEx specific filters & settings
  const [opexAccountFilter, setOpexAccountFilter] = useState<string>('All Accounts');
  const [opexCostCenterFilter, setOpexCostCenterFilter] = useState<string>('All Cost Centers');
  const [opexPicFilter, setOpexPicFilter] = useState<string>('All PICs');
  const [opexClassificationFilter, setOpexClassificationFilter] = useState<'All' | 'Planned' | 'Unplanned'>('All');
  const [viewMode, setViewMode] = useState<'side-by-side' | 'planned-only' | 'actual-only'>('side-by-side');

  // Modals
  const [showCapexModal, setShowCapexModal] = useState<boolean>(false);
  const [editingCapexItem, setEditingCapexItem] = useState<CapExItem | null>(null);
  const [preselectedBenchmark, setPreselectedBenchmark] = useState<UnitPriceCatalogItem | null>(null);
  const [showOpexModal, setShowOpexModal] = useState<boolean>(false);
  const [editingOpexItem, setEditingOpexItem] = useState<OpExItem | null>(null);
  const [showAccountCodesModal, setShowAccountCodesModal] = useState<boolean>(false);
  const [isSyncingExpenses, setIsSyncingExpenses] = useState<boolean>(false);
  const [exportMode, setExportMode] = useState<BudgetExportMode>('both');
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id: string; name: string; type: 'capex' | 'opex' | 'restore-defaults' } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const effectiveAccountCodes = useMemo(() => {
    if (accountCodes.length > 0) return accountCodes;
    return COA_SUMMARY_2027.map(c => ({
      code: c.account_code,
      name: c.account_name,
      category: c.category,
      sort_order: c.sort_order,
      is_active: 1
    }));
  }, [accountCodes]);

  const fetchAccountCodes = async () => {
    try {
      const res = await fetch('/api/it-budget/account-codes', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAccountCodes(data);
      }
    } catch (e) {
      console.error('Error fetching account codes:', e);
    }
  };

  const fetchMasterData = async () => {
    try {
      const res = await fetch('/api/it-budget/master-data', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.unitPriceCatalog) && data.unitPriceCatalog.length > 0) {
          setUnitPriceCatalog(data.unitPriceCatalog);
        }
        if (Array.isArray(data.accountCodes) && data.accountCodes.length > 0) {
          setAccountCodes(data.accountCodes);
        }
      }
    } catch (e) {
      console.error('Error fetching master data:', e);
    }
  };

  const fetchSummary = async (fy: number = selectedFiscalYear, site: string = selectedSite) => {
    try {
      const siteParam = site !== 'All Sites' ? `&site=${encodeURIComponent(site)}` : '';
      const res = await fetch(`/api/it-budget/summary?fiscal_year=${fy}${siteParam}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
        if (data.availableYears && Array.isArray(data.availableYears)) {
          setAvailableYears(data.availableYears);
        }
      }
    } catch (e) {
      console.error('Error fetching summary:', e);
    }
  };

  const fetchCapex = async (
    fy: number = selectedFiscalYear,
    site: string = selectedSite,
    asset: string = capexAssetFilter,
    dept: string = capexDeptFilter,
    status: string = capexStatusFilter,
    stage: string = capexStageFilter,
    q: string = searchQuery
  ) => {
    try {
      const params = new URLSearchParams({ fiscal_year: String(fy) });
      if (site !== 'All Sites') params.append('site', site);
      if (asset !== 'All Types') params.append('asset_type', asset);
      if (dept !== 'All Departments') params.append('department', dept);
      if (status !== 'All Statuses') params.append('status', status);
      if (stage !== 'All Stages') params.append('stage_tag', stage);
      if (q) params.append('search', q);

      const res = await fetch(`/api/it-budget/capex?${params.toString()}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCapexItems(data);
      }
    } catch (e) {
      console.error('Error fetching capex items:', e);
    }
  };

  const fetchOpex = async (
    fy: number = selectedFiscalYear,
    site: string = selectedSite,
    acct: string = opexAccountFilter,
    cc: string = opexCostCenterFilter,
    pic: string = opexPicFilter,
    q: string = searchQuery,
    classification: string = opexClassificationFilter
  ) => {
    try {
      const params = new URLSearchParams({ fiscal_year: String(fy) });
      if (site !== 'All Sites') params.append('site', site);
      if (acct !== 'All Accounts') params.append('account_code', acct);
      if (cc !== 'All Cost Centers') params.append('cost_center', cc);
      if (pic !== 'All PICs') params.append('pic', pic);
      if (classification && classification !== 'All') params.append('budget_classification', classification);
      if (q) params.append('search', q);

      const res = await fetch(`/api/it-budget/opex?${params.toString()}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOpexItems(data);
      }
    } catch (e) {
      console.error('Error fetching opex items:', e);
    }
  };

  const fetchGlActuals = async (fy: number = selectedFiscalYear, site: string = selectedSite) => {
    try {
      const params = new URLSearchParams({ fiscal_year: String(fy) });
      if (site !== 'All Sites') params.append('site', site);
      const res = await fetch(`/api/it-budget/gl-actuals?${params.toString()}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setGlActuals(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error fetching GL actuals:', e);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchSummary(selectedFiscalYear, selectedSite),
      fetchCapex(selectedFiscalYear, selectedSite, capexAssetFilter, capexDeptFilter, capexStatusFilter, capexStageFilter, searchQuery),
      fetchOpex(selectedFiscalYear, selectedSite, opexAccountFilter, opexCostCenterFilter, opexPicFilter, searchQuery, opexClassificationFilter),
      fetchGlActuals(selectedFiscalYear, selectedSite),
      fetchMasterData()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [selectedFiscalYear, selectedSite]);

  useEffect(() => {
    fetchCapex(selectedFiscalYear, selectedSite, capexAssetFilter, capexDeptFilter, capexStatusFilter, capexStageFilter, searchQuery);
  }, [capexAssetFilter, capexDeptFilter, capexStatusFilter, capexStageFilter, searchQuery]);

  useEffect(() => {
    fetchOpex(selectedFiscalYear, selectedSite, opexAccountFilter, opexCostCenterFilter, opexPicFilter, searchQuery, opexClassificationFilter);
  }, [opexAccountFilter, opexCostCenterFilter, opexPicFilter, searchQuery, opexClassificationFilter]);

  // Unique Cost Centers & PICs from current OpEx items for dynamic filter dropdowns
  const opexCostCenterOptions = useMemo(() => {
    const set = new Set<string>(['IT']);
    opexItems.forEach(o => o.cost_center && set.add(o.cost_center));
    return ['All Cost Centers', ...Array.from(set).sort()];
  }, [opexItems]);

  const opexPicOptions = useMemo(() => {
    const set = new Set<string>(['Braseth']);
    opexItems.forEach(o => o.pic && set.add(o.pic));
    return ['All PICs', ...Array.from(set).sort()];
  }, [opexItems]);

  // CapEx Status Counts (2027 Taxonomy)
  const capexStatusCounts = useMemo(() => {
    let inProgress = 0;
    let complete = 0;
    let cancelled = 0;
    let mismatchCount = 0;

    capexItems.forEach(item => {
      const s = normalizeCapexStatus(item.status);
      if (s === 'Complete') complete++;
      else if (s === 'Cancelled') cancelled++;
      else inProgress++;

      const mPlanned = MONTH_KEYS.reduce((acc, m) => acc + (Number(item.monthly_spending?.[m]?.planned) || 0), 0);
      if (Math.abs(mPlanned - (Number(item.requested_amount) || 0)) > 0.01) {
        mismatchCount++;
      }
    });
    return { inProgress, complete, cancelled, mismatchCount, total: capexItems.length };
  }, [capexItems]);

  // Breakdown Donut / List Data
  const overviewBreakdownData = useMemo(() => {
    if (overviewBreakdownMode === 'capex_status') {
      const map = summaryData?.capexByStatus || {};
      return CAPEX_STATUSES_2027.map((st, idx) => ({
        name: st,
        value: Math.round((map[st]?.planned || 0) * 100) / 100,
        count: map[st]?.count || 0,
        color: st === 'Complete' ? '#10b981' : st === 'Cancelled' ? '#f43f5e' : CHART_PALETTE[idx]
      })).filter(d => d.value > 0 || d.count > 0);
    }
    if (overviewBreakdownMode === 'opex_coa') {
      const map: ExecutiveSummaryData['opexByAccount'] = summaryData?.opexByAccount ?? {};
      return Object.entries(map)
        .map(([name, val], idx) => ({
          name,
          value: Math.round((val.planned || 0) * 100) / 100,
          actual: Math.round(((val.glActual || 0) > 0 ? (val.glActual || 0) : (val.actual || 0)) * 100) / 100,
          color: CHART_PALETTE[idx % CHART_PALETTE.length]
        }))
        .filter(d => d.value > 0 || d.actual > 0)
        .sort((a, b) => b.value - a.value);
    }
    const map: ExecutiveSummaryData['capexByAssetType'] = summaryData?.capexByAssetType ?? {};
    return Object.entries(map)
      .map(([name, val], idx) => ({
        name,
        value: Math.round((val.planned || 0) * 100) / 100,
        color: CHART_PALETTE[idx % CHART_PALETTE.length]
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [summaryData, overviewBreakdownMode]);

  // Sync actuals from it_expenses + GL actuals
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
        showToast(data.message || `Synchronized actuals for FY ${selectedFiscalYear}`, 'success');
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

  // Clone/Roll over fiscal year (Modal)
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
        setAvailableYears(prev => Array.from(new Set([...prev, cloneTargetYear])).sort((a, b) => a - b));
        setSelectedFiscalYear(cloneTargetYear);
      } else {
        showToast(data.error || 'Failed to clone fiscal year', 'error');
      }
    } catch (e: any) {
      showToast('Error cloning fiscal year: ' + e.message, 'error');
    }
  };

  // CapEx Dynamic Totals (Filtered Items) + Stage/Status Rollups
  const capexTotals = useMemo(() => {
    let totalQty = 0;
    let totalEstCost = 0;
    let totalMonthlyPlanned = 0;
    let totalActual = 0;
    const statusTotals: Record<string, { count: number; amount: number }> = {
      'In Progress': { count: 0, amount: 0 },
      'Complete': { count: 0, amount: 0 },
      'Cancelled': { count: 0, amount: 0 }
    };
    const stageTotals: Record<string, { count: number; amount: number }> = {
      'Estimate': { count: 0, amount: 0 },
      'Agreement': { count: 0, amount: 0 },
      'Bill': { count: 0, amount: 0 },
      'Planning': { count: 0, amount: 0 }
    };

    const monthlyPlanned: Record<string, number> = {};
    const monthlyActual: Record<string, number> = {};
    MONTH_KEYS.forEach(m => { monthlyPlanned[m] = 0; monthlyActual[m] = 0; });

    capexItems.forEach(item => {
      const req = Number(item.requested_amount) || 0;
      totalQty += Number(item.qty) || 0;
      totalEstCost += req;

      const st = normalizeCapexStatus(item.status);
      const tg = normalizeCapexStage(item.stage_tag, item.status);
      statusTotals[st].count += 1;
      statusTotals[st].amount += req;
      stageTotals[tg].count += 1;
      stageTotals[tg].amount += req;

      MONTH_KEYS.forEach(m => {
        const p = Number(item.monthly_spending?.[m]?.planned) || 0;
        const a = Number(item.monthly_spending?.[m]?.actual) || 0;
        monthlyPlanned[m] += p;
        monthlyActual[m] += a;
        totalMonthlyPlanned += p;
        totalActual += a;
      });
    });

    const q1Planned = monthlyPlanned.jan + monthlyPlanned.feb + monthlyPlanned.mar;
    const q2Planned = monthlyPlanned.apr + monthlyPlanned.may + monthlyPlanned.jun;
    const q3Planned = monthlyPlanned.jul + monthlyPlanned.aug + monthlyPlanned.sep;
    const q4Planned = monthlyPlanned.oct + monthlyPlanned.nov + monthlyPlanned.dec;

    const q1Actual = monthlyActual.jan + monthlyActual.feb + monthlyActual.mar;
    const q2Actual = monthlyActual.apr + monthlyActual.may + monthlyActual.jun;
    const q3Actual = monthlyActual.jul + monthlyActual.aug + monthlyActual.sep;
    const q4Actual = monthlyActual.oct + monthlyActual.nov + monthlyActual.dec;

    return {
      totalQty,
      totalPlanned: totalEstCost,
      totalMonthlyPlanned,
      totalActual,
      totalVariance: totalEstCost - totalActual,
      burnPercent: totalEstCost > 0 ? (totalActual / totalEstCost) * 100 : 0,
      statusTotals,
      stageTotals,
      monthlyPlanned,
      monthlyActual,
      quarterly: {
        planned: { q1: q1Planned, q2: q2Planned, q3: q3Planned, q4: q4Planned },
        actual: { q1: q1Actual, q2: q2Actual, q3: q3Actual, q4: q4Actual }
      }
    };
  }, [capexItems]);

  // OpEx Dynamic Filtered Subtotals (matching Excel SUBTOTAL(9, ...))
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
        const p = Number(item.monthly_spending?.[m]?.planned) || 0;
        const a = Number(item.monthly_spending?.[m]?.actual) || 0;
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

  // Rollover preview calculation
  const rolloverPreview = useMemo(() => {
    const matchesCampus = (s: string) =>
      rolloverCampus === 'All Sites' || normalizeBuCanonical(s) === normalizeBuCanonical(rolloverCampus);

    const filteredCapex = capexItems.filter(c => matchesCampus(c.site));
    const filteredOpex = opexItems.filter(o => matchesCampus(o.site));
    const multiplier = 1 + (rolloverAdjustmentPercent / 100);
    const targetCapexAmount = filteredCapex.reduce((sum, item) => sum + (Number(item.requested_amount) || 0), 0) * multiplier;
    const targetOpexAmount = filteredOpex.reduce((sum, item) => sum + (Number(item.annual_cost) || 0), 0) * multiplier;

    return {
      sourceCapexCount: filteredCapex.length,
      sourceOpexCount: filteredOpex.length,
      totalItems: (rolloverCopyCapex ? filteredCapex.length : 0) + (rolloverCopyOpex ? filteredOpex.length : 0),
      totalTargetBudget: (rolloverCopyCapex ? targetCapexAmount : 0) + (rolloverCopyOpex ? targetOpexAmount : 0)
    };
  }, [capexItems, opexItems, rolloverCampus, rolloverAdjustmentPercent, rolloverCopyCapex, rolloverCopyOpex]);

  const handleExecuteRollover = async () => {
    if (!rolloverCopyCapex && !rolloverCopyOpex) {
      showToast('Select at least CapEx or OpEx to roll over', 'error');
      return;
    }
    if (rolloverSourceYear === rolloverTargetYear) {
      showToast('Source and Target Fiscal Year cannot be the same', 'error');
      return;
    }
    setIsRollingOver(true);
    try {
      const res = await fetch('/api/it-budget/clone-year', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          from_year: rolloverSourceYear,
          to_year: rolloverTargetYear,
          copy_capex: rolloverCopyCapex,
          copy_opex: rolloverCopyOpex,
          campus_filter: rolloverCampus,
          adjustment_percent: rolloverAdjustmentPercent,
          overwrite: rolloverOverwrite
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Rolled over to FY ${rolloverTargetYear}`, 'success');
        setAvailableYears(prev => Array.from(new Set([...prev, rolloverTargetYear])).sort((a, b) => a - b));
        setSelectedFiscalYear(rolloverTargetYear);
      } else {
        showToast(data.error || 'Failed to roll over fiscal year', 'error');
      }
    } catch (e: any) {
      showToast('Error rolling over: ' + e.message, 'error');
    } finally {
      setIsRollingOver(false);
    }
  };

  const loadResetSnapshot = async () => {
    try {
      const res = await fetch('/api/it-budget/reset-snapshot', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setResetSnapshot(data?.available ? data : null);
      }
    } catch {
      // ignore snapshot check errors
    }
  };

  const handleUndoLastReset = async () => {
    setIsUndoingReset(true);
    try {
      const res = await fetch('/api/it-budget/undo-reset', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Recovered fiscal year from last pre-reset snapshot', 'success');
        setShowResetZeroModal(false);
        if (data.fiscal_year && data.fiscal_year !== selectedFiscalYear) {
          setAvailableYears(prev => Array.from(new Set([...prev, data.fiscal_year])).sort((a, b) => a - b));
          setSelectedFiscalYear(data.fiscal_year);
        } else {
          await loadAll();
        }
      } else {
        showToast(data.error || 'Failed to recover from snapshot', 'error');
      }
    } catch (e: any) {
      showToast('Error recovering snapshot: ' + e.message, 'error');
    } finally {
      setIsUndoingReset(false);
    }
  };

  const handleExecuteResetZero = async () => {
    if (!rolloverCopyCapex && !rolloverCopyOpex) {
      showToast('Select at least CapEx or OPEX to reset', 'error');
      return;
    }
    if (!resetZeroConfirmed) {
      showToast(`Please confirm resetting FY ${resetZeroYear} first`, 'error');
      return;
    }
    setIsResettingZero(true);
    try {
      const res = await fetch('/api/it-budget/reset-zero', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fiscal_year: resetZeroYear,
          reset_capex: rolloverCopyCapex,
          reset_opex: rolloverCopyOpex,
          campus_filter: rolloverCampus,
          reset_mode: resetZeroMode
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `FY ${resetZeroYear} reset to 0`, 'success');
        setShowResetZeroModal(false);
        setResetZeroConfirmed(false);
        await loadResetSnapshot();
        if (resetZeroYear !== selectedFiscalYear) {
          setAvailableYears(prev => Array.from(new Set([...prev, resetZeroYear])).sort((a, b) => a - b));
          setSelectedFiscalYear(resetZeroYear);
        } else {
          await loadAll();
        }
      } else {
        showToast(data.error || `Failed to reset FY ${resetZeroYear} to 0`, 'error');
      }
    } catch (e: any) {
      showToast('Error resetting FY to 0: ' + e.message, 'error');
    } finally {
      setIsResettingZero(false);
    }
  };

  const handleRestoreDefaults = () => {
    setDeleteConfirmItem({
      id: 'restore-all',
      name: `All CapEx and OPEX items for FY ${selectedFiscalYear}`,
      type: 'restore-defaults'
    });
  };

  // CapEx Inline Updates
  const handleUpdateCapexField = async (item: CapExItem, patch: Partial<CapExItem>) => {
    const updated = { ...item, ...patch };
    setCapexItems(prev => prev.map(c => c.id === item.id ? updated : c));
    try {
      const res = await fetch(`/api/it-budget/capex/${item.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        fetchSummary();
        showToast(`Updated "${item.description}"`);
      }
    } catch {
      showToast('Failed to update CapEx item', 'error');
    }
  };

  const handleCapexDistributeEvenlyInline = async (item: CapExItem) => {
    const total = Math.round((Number(item.qty) || 1) * (Number(item.unit_price) || 0) * 100) / 100;
    const distributed = distributeAmountAcrossMonths(
      total,
      item.expected_start_month || 'Jan',
      item.expected_complete_month || 'Dec'
    );
    const updatedSpending: Record<string, { planned: number; actual: number }> = {};
    MONTH_KEYS.forEach(m => {
      updatedSpending[m] = {
        planned: distributed[m].planned,
        actual: Number(item.monthly_spending?.[m]?.actual) || 0
      };
    });
    await handleUpdateCapexField(item, { monthly_spending: updatedSpending });
    await fetchCapex();
  };

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

    setCapexItems(prev => prev.map(c => c.id === itemId ? { ...c, monthly_spending: updatedSpending } : c));
    try {
      await fetch(`/api/it-budget/capex/${itemId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...item, monthly_spending: updatedSpending })
      });
      fetchSummary();
    } catch (e) {
      console.error('Failed to save CapEx monthly cell', e);
    }
  };

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

    setOpexItems(prev => prev.map(o => o.id === itemId ? { ...o, annual_cost: newAnnualPlanned, monthly_spending: updatedSpending } : o));
    try {
      await fetch(`/api/it-budget/opex/${itemId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...item, annual_cost: newAnnualPlanned, monthly_spending: updatedSpending })
      });
      fetchSummary();
    } catch (e) {
      console.error('Failed to save OpEx monthly cell', e);
    }
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
          showToast(data.message || 'Template restored', 'success');
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

      const res = await fetch(endpoint, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) {
        showToast(`${deleteConfirmItem.type.toUpperCase()} item "${deleteConfirmItem.name}" deleted`);
        await loadAll();
        setDeleteConfirmItem(null);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to delete item', 'error');
      }
    } catch (e: any) {
      showToast('Error deleting item: ' + e.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Separate 2027 Excel Template Exports (Plan, Actual, or Both)
  const handleExportCapexExcel = async (modeOverride?: BudgetExportMode) => {
    const mode = modeOverride || exportMode;
    try {
      const file = await exportCapexTemplateWorkbook(capexItems, selectedFiscalYear, { unitPriceCatalog, mode });
      const label = mode === 'both' ? 'Plan & Actual' : mode === 'actual' ? 'Actual' : 'Planning';
      showToast(`Exported FY ${selectedFiscalYear} CapEx (${label}) template (${file})`, 'success');
    } catch (e: any) {
      showToast('Failed to export CapEx Excel: ' + e.message, 'error');
    }
  };

  const handleExportOpexExcel = async (modeOverride?: BudgetExportMode) => {
    const mode = modeOverride || exportMode;
    try {
      const file = await exportOpexTemplateWorkbook(opexItems, glActuals, selectedFiscalYear, { mode });
      const label = mode === 'both' ? 'Plan & Actual' : mode === 'actual' ? 'Actual' : 'Planning';
      showToast(`Exported FY ${selectedFiscalYear} OPEX (${label}) template (${file})`, 'success');
    } catch (e: any) {
      showToast('Failed to export OpEx Excel: ' + e.message, 'error');
    }
  };

  // Multi-Sheet 2027 Excel Import
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseBudgetWorkbook(buf, selectedFiscalYear);
      setImportWarnings(parsed.warnings);

      if (parsed.capexItems.length === 0 && parsed.opexItems.length === 0 && parsed.glActuals.length === 0) {
        showToast('No recognizable CAPEX, OPEX, or COA Details sheets found.', 'error');
        return;
      }

      const res = await fetch('/api/it-budget/bulk-sync', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fiscal_year: selectedFiscalYear,
          capexItems: parsed.capexItems,
          opexItems: parsed.opexItems,
          glActuals: parsed.glActuals,
          replaceExisting: false
        })
      });
      const resData = await res.json();
      if (res.ok) {
        const warnNote = parsed.warnings.length > 0 ? ` (${parsed.warnings.length} validation notices shown)` : '';
        showToast(`${resData.message}${warnNote}`, 'success');
        await loadAll();
      } else {
        showToast(resData.error || 'Failed to import Excel data', 'error');
      }
    } catch (err: any) {
      showToast('Error reading Excel file: ' + err.message, 'error');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="w-full space-y-5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-medium border ${
          toastMessage.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : toastMessage.type === 'info'
            ? 'bg-sky-50 text-sky-800 border-sky-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle size={16} className="text-rose-600" /> : <CheckCircle2 size={16} className="text-emerald-600" />}
          <span>{toastMessage.text}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-70 cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {/* Import Validation Notices Banner */}
      {importWarnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-amber-600" />
              Excel Import Validation Notices ({importWarnings.length})
            </span>
            <button type="button" onClick={() => setImportWarnings([])} className="text-amber-700 hover:underline cursor-pointer">
              Dismiss
            </button>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-[11px] max-h-28 overflow-y-auto">
            {importWarnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Main Header & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
              <DollarSign size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                <span>IT CapEx &amp; Operation Tracking &amp; Planning</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                  FY {selectedFiscalYear}
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Aligned with 2027 IT CapEx &amp; Operational (OPEX / COA Details) Master Templates
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSyncExpenses}
              disabled={isSyncingExpenses}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isSyncingExpenses ? 'animate-spin' : ''} />
              <span>{isSyncingExpenses ? 'Syncing...' : 'Sync Expenses'}</span>
            </button>

            <select
              value={exportMode}
              onChange={(e) => setExportMode(e.target.value as BudgetExportMode)}
              title="Choose whether Excel exports contain Plan & Actual, Planning only, or Actual only"
              className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
            >
              <option value="both">Export: Plan &amp; Actual</option>
              <option value="planned">Export: Planning Only</option>
              <option value="actual">Export: Actual Only</option>
            </select>

            <button
              type="button"
              onClick={() => handleExportCapexExcel()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
              title="Export CapEx template workbook (Planning, Actual, or Both)"
            >
              <Download size={13} className="text-indigo-600" />
              <span>Export CapEx .xlsx</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportOpexExcel()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
              title="Export OPEX template workbook (Planning, Actual, or Both)"
            >
              <Download size={13} className="text-emerald-600" />
              <span>Export OpEx .xlsx</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 whitespace-nowrap shrink-0 cursor-pointer">
              <Upload size={13} className="text-slate-600" />
              <span>Import Template .xlsx</span>
              <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
            </label>
          </div>
        </div>

        {/* Fiscal Year, BU Filter & Sub-Tabs */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Fiscal Year Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Calendar size={12} /> FY:
              </span>
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                {availableYears.map(year => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => setSelectedFiscalYear(year)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      selectedFiscalYear === year ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {year}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCloneYearModal(true)}
                  className="px-2 py-1 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 flex items-center gap-0.5 cursor-pointer"
                  title="Clone or plan a new fiscal year"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* BU / Site Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Building2 size={13} className="text-slate-400 shrink-0" />
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="text-xs bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                {ALL_BU_FILTER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <DensityToggle />
          </div>

          {/* Sub-Tab Switcher */}
          <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-0.5">
            <button
              type="button"
              onClick={() => setActiveSubTab('overview')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                activeSubTab === 'overview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={13} />
              <span>Overview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('capex')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                activeSubTab === 'capex' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={13} />
              <span>CapEx ({capexItems.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('opex')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                activeSubTab === 'opex' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp size={13} />
              <span>OpEx ({opexItems.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('gl-actuals')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                activeSubTab === 'gl-actuals' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt size={13} />
              <span>GL Actuals ({glActuals.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('master-data')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                activeSubTab === 'master-data' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database size={13} />
              <span>Master Data</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('sync')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                activeSubTab === 'sync' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet size={13} />
              <span>Sync &amp; Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- SUB-TAB 1: EXECUTIVE OVERVIEW --- */}
      {activeSubTab === 'overview' && (
        <div className="space-y-5">
          {Number(summaryData?.unplannedOpexCount || 0) > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs">
              <div className="flex items-start sm:items-center gap-3">
                <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                <div>
                  <div className="font-bold text-amber-950">
                    Out-of-Budget Alert: {summaryData?.unplannedOpexCount} Unbudgeted OPEX Item{(summaryData?.unplannedOpexCount || 0) > 1 ? 's' : ''} (${Number(summaryData?.totalUnplannedOpexPlanned || 0).toLocaleString()} allocated)
                  </div>
                  <p className="text-amber-800 text-[11px]">Registered outside baseline plan for FY {selectedFiscalYear}.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpexClassificationFilter('Unplanned');
                  setActiveSubTab('opex');
                }}
                className="px-3 py-1.5 font-semibold text-amber-950 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl shrink-0 cursor-pointer"
              >
                Review Unplanned &rarr;
              </button>
            </div>
          )}

          {/* 4 KPI Ribbon Cards */}
          <div className="smart-kpi-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="smart-kpi-card bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">FY {selectedFiscalYear} IT Portfolio</span>
                  <DollarSign size={16} className="text-indigo-600" />
                </div>
                <div className="mt-2.5 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                  ${(summaryData?.totalFiscalBudget || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                  Realized: <strong className="text-indigo-700">${fmtUsd(summaryData?.totalFiscalActual)}</strong> ({Math.round(((summaryData?.totalFiscalActual || 0) / (summaryData?.totalFiscalBudget || 1)) * 100)}%)
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>CapEx: ${fmtUsd(summaryData?.totalCapexRequested)}</span>
                <span>OPEX: ${fmtUsd(summaryData?.totalAnnualOpex)}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CapEx Plan {selectedFiscalYear}</span>
                  <Layers size={16} className="text-emerald-600" />
                </div>
                <div className="mt-2.5 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                  ${fmtUsd(summaryData?.totalCapexRequested)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {capexItems.length} Projects · {capexStatusCounts.inProgress} In Progress · {capexStatusCounts.complete} Complete
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-mono">
                  Q1–Q4: ${fmtUsd(summaryData?.capexQuarterly?.total)}
                </span>
                <button type="button" onClick={() => setActiveSubTab('capex')} className="font-semibold text-indigo-600 hover:underline cursor-pointer">
                  CapEx Plan &rarr;
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">OPEX Plan &amp; GL Actual</span>
                  <TrendingUp size={16} className="text-sky-600" />
                </div>
                <div className="mt-2.5 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                  ${fmtUsd(summaryData?.totalAnnualOpex)}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                  COA Details GL: <strong className="text-emerald-700">${fmtUsd(summaryData?.totalGlActual)}</strong> ({summaryData?.glEntryCount || 0} entries)
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className={`font-semibold font-mono ${(summaryData?.totalAnnualOpexVariance || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {(summaryData?.totalAnnualOpexVariance || 0) >= 0 ? '+' : ''}${fmtUsd(summaryData?.totalAnnualOpexVariance)} Var
                </span>
                <button type="button" onClick={() => setActiveSubTab('gl-actuals')} className="font-semibold text-sky-600 hover:underline cursor-pointer">
                  GL Variance &rarr;
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Controls &amp; Guardrails</span>
                  <ShieldCheck size={16} className="text-amber-600" />
                </div>
                <div className="mt-2.5 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                  {capexStatusCounts.mismatchCount} <span className="text-sm font-semibold text-slate-500">Phasing Alerts</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {summaryData?.upcomingRenewals?.length || 0} Renewals Due (&lt;60d) · {summaryData?.unplannedOpexCount || 0} Unplanned
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className={capexStatusCounts.mismatchCount > 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                  {capexStatusCounts.mismatchCount > 0 ? 'Review CapEx Monthly Split' : '100% CapEx Phased'}
                </span>
                <button type="button" onClick={() => setActiveSubTab('master-data')} className="font-semibold text-slate-600 hover:underline cursor-pointer">
                  Master Data &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* CapEx Quarterly Cash Flow Strip (Q1 - Q4) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">2027 CapEx Schedule</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">Quarterly Cash Flow</div>
            </div>
            {(['q1', 'q2', 'q3', 'q4'] as const).map((q, idx) => (
              <div key={q} className="border-l border-slate-100 pl-3">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">
                  {q.toUpperCase()} ({idx === 0 ? 'Jan–Mar' : idx === 1 ? 'Apr–Jun' : idx === 2 ? 'Jul–Sep' : 'Oct–Dec'})
                </div>
                <div className="text-base font-bold text-indigo-700 font-mono tabular-nums mt-0.5">
                  ${fmtUsd(summaryData?.capexQuarterly?.[q])}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 size={15} className="text-indigo-600" />
                      <span>Monthly Cash Flow: Planned CapEx vs OPEX vs GL Actual</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">FY {selectedFiscalYear} monthly plan curve against COA Details postings</p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-indigo-600" /> CapEx Plan</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-sky-400" /> OPEX Plan</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> GL / Actual</span>
                  </div>
                </div>
                <div className="h-72 w-full">
                  {summaryData?.cashFlowChartData && summaryData.cashFlowChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summaryData.cashFlowChartData} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <RechartsTooltip
                          formatter={(value: any, name: any) => [
                            `$${Number(value).toLocaleString()}`,
                            name === 'planned_capex' ? 'CapEx Plan' : name === 'planned_opex' ? 'OPEX Plan' : name === 'gl_actual_opex' ? 'COA GL Actual' : 'Actual Spend'
                          ]}
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        />
                        <Bar dataKey="planned_capex" fill="#6366f1" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="planned_opex" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                        <Bar dataKey={(summaryData.totalGlActual || 0) > 0 ? 'gl_actual_opex' : 'actual_total'} fill="#10b981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No chart data available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Switchable Breakdown (Asset Type / Status / COA Account) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <PieChartIcon size={15} className="text-indigo-600" />
                    <span>Portfolio Breakdown</span>
                  </h3>
                  <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setOverviewBreakdownMode('capex_asset')}
                      className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${overviewBreakdownMode === 'capex_asset' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                    >
                      Asset Type
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverviewBreakdownMode('capex_status')}
                      className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${overviewBreakdownMode === 'capex_status' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                    >
                      Status
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverviewBreakdownMode('opex_coa')}
                      className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${overviewBreakdownMode === 'opex_coa' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                    >
                      OPEX COA
                    </button>
                  </div>
                </div>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overviewBreakdownData.length > 0 ? overviewBreakdownData : [{ name: 'No Data', value: 1, color: '#e2e8f0' }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {overviewBreakdownData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} stroke="#fff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(v: any, n: any) => [`$${Number(v).toLocaleString()}`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-36 overflow-y-auto pr-1">
                {overviewBreakdownData.slice(0, 6).map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-700 truncate">{d.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 shrink-0 tabular-nums">${d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Multi-Site Matrix (Normalized K3 / Sakal + Sakal Lab) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 size={15} className="text-indigo-600" />
                  <span>Business Unit Investment Matrix (K3 &amp; Sakal Normalized)</span>
                </h3>
                <p className="text-xs text-slate-500">CapEx, OPEX Plan, GL/Actual Spend, and Variance across Khema campuses</p>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[55vh]">
              <table className="smart-grid-table w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Business Unit</th>
                    <th className="py-2.5 px-3 text-right">CapEx Plan ($)</th>
                    <th className="py-2.5 px-3 text-right">OPEX Plan ($)</th>
                    <th className="py-2.5 px-3 text-right">Total Planned ($)</th>
                    <th className="py-2.5 px-3 text-right">Realized / GL Actual ($)</th>
                    <th className="py-2.5 px-3 text-right">Variance ($)</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaryData?.totalBySite && (Object.entries(summaryData.totalBySite) as Array<[string, ExecutiveSummaryData['totalBySite'][string]]>).map(([siteKey, vals]) => {
                    const isUnder = vals.variance >= 0;
                    const pct = vals.planned > 0 ? Math.round((vals.actual / vals.planned) * 100) : 0;
                    return (
                      <tr key={siteKey} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{siteKey}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">${(vals.capex_planned || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">${(vals.opex_planned || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900">${vals.planned.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-indigo-700">${vals.actual.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold tabular-nums ${isUnder ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {isUnder ? '+' : ''}${vals.variance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                            isUnder ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {isUnder ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                            {isUnder ? 'Under' : 'Over'} ({pct}%)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSite(vals.bu_code || siteKey);
                              setActiveSubTab('opex');
                            }}
                            className="font-semibold text-indigo-600 hover:underline cursor-pointer"
                          >
                            Inspect &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* CapEx Pipeline & Renewal Decision Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={15} className="text-emerald-600" />
                  <span>2027 CapEx Pipeline</span>
                </h3>
                <button type="button" onClick={() => setActiveSubTab('capex')} className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer">
                  View All {capexItems.length} &rarr;
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {capexItems.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">No CapEx items for FY {selectedFiscalYear}</div>
                ) : (
                  capexItems.slice(0, 5).map(p => (
                    <div key={p.id} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          <span className="font-mono text-indigo-700 mr-1.5">{p.capex_code}</span>
                          {p.description}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {formatBuDisplayLabel(p.site)} · {p.asset_type} · {p.department || 'IT'} · {p.expected_start_month || 'Jan'}–{p.expected_complete_month || 'Dec'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-slate-900">${Number(p.requested_amount || 0).toLocaleString()}</div>
                        <span className="text-[10px] font-semibold text-slate-600">{normalizeCapexStatus(p.status)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock size={15} className="text-amber-600" />
                  <span>60-Day Renewal Decision Radar</span>
                </h3>
                <span className="text-xs text-slate-400">Next 60 Days</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {summaryData?.upcomingRenewals && summaryData.upcomingRenewals.length > 0 ? (
                  summaryData.upcomingRenewals.map(r => (
                    <div key={r.id} className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      r.isCritical ? 'bg-rose-50/60 border-rose-200' : 'bg-amber-50/40 border-amber-200'
                    }`}>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{r.description}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {r.site} · {r.account_code} · Due {r.renewal_date ? new Date(r.renewal_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-slate-900">${Number(r.annual_cost).toLocaleString()}</div>
                        <span className={`text-[10px] font-bold ${r.isCritical ? 'text-rose-700' : 'text-amber-800'}`}>
                          {r.daysRemaining}d left
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">No upcoming renewals within 60 days</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 2: CAPEX PLANNER (CAPEX PLAN 2027) --- */}
      {activeSubTab === 'capex' && (
        <div className="space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Capex#, description, specs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700"
              >
                {ALL_BU_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              <select
                value={capexAssetFilter}
                onChange={(e) => setCapexAssetFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="All Types">All Asset Types</option>
                {ASSET_TYPES_MASTER.map(a => (
                  <option key={`${a.code}-${a.asset_type}`} value={a.asset_type}>{a.asset_type} ({a.code})</option>
                ))}
              </select>

              <select
                value={capexDeptFilter}
                onChange={(e) => setCapexDeptFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="All Departments">All Depts</option>
                {DEPT_DEFINITIONS.map(d => (
                  <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
                ))}
              </select>

              <select
                value={capexStatusFilter}
                onChange={(e) => setCapexStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="All Statuses">All Statuses</option>
                {CAPEX_STATUSES_2027.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select
                value={capexStageFilter}
                onChange={(e) => setCapexStageFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="All Stages">All Stages</option>
                {CAPEX_STAGE_TAGS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <Button
              onClick={() => {
                setEditingCapexItem(null);
                setPreselectedBenchmark(null);
                setShowCapexModal(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shrink-0 whitespace-nowrap"
            >
              <Plus size={14} />
              <span>Add CapEx Line</span>
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[68vh]">
              <table className="smart-grid-table w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-2.5 w-8">No.</th>
                    <th className="py-3 px-2.5">BU</th>
                    <th className="py-3 px-2.5">Capex# &amp; Description</th>
                    <th className="py-3 px-2.5">Asset Type (Owner / Supv)</th>
                    <th className="py-3 px-2.5">Dept / CC / PIC</th>
                    <th className="py-3 px-2.5 text-center">Qty</th>
                    <th className="py-3 px-2.5 text-right">Est. Unit Cost</th>
                    <th className="py-3 px-2.5 text-right">Total Est. Cost</th>
                    <th className="py-3 px-2.5">Timeline</th>
                    <th className="py-3 px-2.5">Status &amp; Stage</th>
                    <th className="py-3 px-2.5 text-center">Schedule</th>
                    <th className="py-3 px-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {capexItems.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400">
                        No CapEx items match the active filters for FY {selectedFiscalYear}.
                      </td>
                    </tr>
                  ) : (
                    capexItems.map((item, idx) => {
                      const isExpanded = expandedCapexId === item.id;
                      const totalEst = Math.round((Number(item.qty) || 1) * (Number(item.unit_price) || 0) * 100) / 100;
                      const monthlyPlanned = MONTH_KEYS.reduce((acc, m) => acc + (Number(item.monthly_spending?.[m]?.planned) || 0), 0);
                      const totalActual = MONTH_KEYS.reduce((acc, m) => acc + (Number(item.monthly_spending?.[m]?.actual) || 0), 0);
                      const diffAlloc = Math.round((totalEst - monthlyPlanned) * 100) / 100;
                      const hasMismatch = Math.abs(diffAlloc) > 0.01;
                      const normStatus = normalizeCapexStatus(item.status);
                      const normStage = normalizeCapexStage(item.stage_tag, item.status);

                      return (
                        <React.Fragment key={item.id}>
                          <tr className="hover:bg-slate-50/70">
                            <td className="py-3 px-2.5 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-3 px-2.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                              {normalizeBuCanonical(item.site) || item.site}
                            </td>
                            <td className="py-3 px-2.5 max-w-[260px]">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[11px] font-bold text-indigo-700">{item.capex_code}</span>
                              </div>
                              <div className="font-bold text-slate-900">{item.description}</div>
                              {item.specifications && (
                                <div className="text-[11px] text-slate-500 truncate" title={item.specifications}>
                                  {item.specifications}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-2.5">
                              <div className="font-semibold text-slate-800">{item.asset_type}</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {item.asset_owner || 'IT'} · Supv: {item.asset_supervisor || 'ITO'}
                              </div>
                            </td>
                            <td className="py-3 px-2.5 text-slate-700 whitespace-nowrap">
                              <div className="font-mono font-semibold">{normalizeDepartmentCode(item.department)} · {item.cost_center || 'IT'}</div>
                              <div className="text-[11px] text-slate-500">{item.pic}</div>
                            </td>
                            <td className="py-3 px-2.5 text-center font-mono font-semibold">{item.qty}</td>
                            <td className="py-3 px-2.5 text-right font-mono tabular-nums text-slate-600">
                              ${Number(item.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-2.5 text-right">
                              <div className="font-mono font-bold text-indigo-700 tabular-nums">
                                ${totalEst.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </div>
                              {hasMismatch ? (
                                <span
                                  className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                                  title="Monthly cash flow schedule does not equal Total Est. Cost"
                                >
                                  <AlertTriangle size={10} />
                                  {diffAlloc > 0 ? `Unalloc $${diffAlloc.toLocaleString()}` : `Over $${Math.abs(diffAlloc).toLocaleString()}`}
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-700 font-mono">
                                  Act: ${totalActual.toLocaleString()}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-2.5 font-mono text-slate-700 whitespace-nowrap">
                              {item.expected_start_month || 'Jan'} &ndash; {item.expected_complete_month || 'Dec'}
                            </td>
                            <td className="py-3 px-2.5 space-y-1">
                              <select
                                value={normStatus}
                                onChange={(e) => handleUpdateCapexField(item, { status: e.target.value })}
                                className={`block w-full text-[11px] font-semibold rounded-lg px-2 py-1 border ${
                                  normStatus === 'Complete'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : normStatus === 'Cancelled'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-sky-50 text-sky-700 border-sky-200'
                                }`}
                              >
                                {CAPEX_STATUSES_2027.map(st => <option key={st} value={st}>{st}</option>)}
                              </select>
                              <select
                                value={normStage}
                                onChange={(e) => handleUpdateCapexField(item, { stage_tag: e.target.value })}
                                className="block w-full text-[10px] font-medium rounded-md px-1.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-700"
                              >
                                {CAPEX_STAGE_TAGS.map(tg => <option key={tg} value={tg}>Stage: {tg}</option>)}
                              </select>
                            </td>
                            <td className="py-3 px-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => setExpandedCapexId(isExpanded ? null : item.id)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                              >
                                <span>{isExpanded ? 'Hide' : '12-Mo'}</span>
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            </td>
                            <td className="py-3 px-2.5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCapexItem(item);
                                    setPreselectedBenchmark(null);
                                    setShowCapexModal(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 cursor-pointer"
                                  title="Edit CapEx Line"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmItem({ id: item.id, name: item.description, type: 'capex' })}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                                  title="Delete CapEx Line"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expandable 12-Month & Quarterly Spending Schedule */}
                          {isExpanded && (
                            <tr className="bg-slate-50/90 border-y border-indigo-100">
                              <td colSpan={12} className="p-4">
                                <div className="space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                                      <Layers size={14} className="text-indigo-600" />
                                      <span>Monthly &amp; Quarterly Cash Flow Schedule — {item.capex_code}</span>
                                      {hasMismatch && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-amber-100 text-amber-900 border border-amber-300">
                                          <AlertTriangle size={11} />
                                          Monthly Planned (${monthlyPlanned.toLocaleString()}) &ne; Total Est. Cost (${totalEst.toLocaleString()})
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleCapexDistributeEvenlyInline(item)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shrink-0"
                                    >
                                      <Sparkles size={12} />
                                      <span>Distribute Evenly ({item.expected_start_month || 'Jan'}–{item.expected_complete_month || 'Dec'})</span>
                                    </button>
                                  </div>

                                  <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 p-3">
                                    <table className="smart-grid-table w-full text-center text-xs">
                                      <thead>
                                        <tr className="text-slate-500 font-semibold border-b border-slate-100">
                                          <th className="py-1 px-2 text-left w-24">Row</th>
                                          {MONTH_LABELS.map(m => <th key={m} className="py-1 px-1">{m}</th>)}
                                          <th className="py-1 px-2 bg-slate-50 text-indigo-700">Q1</th>
                                          <th className="py-1 px-2 bg-slate-50 text-indigo-700">Q2</th>
                                          <th className="py-1 px-2 bg-slate-50 text-indigo-700">Q3</th>
                                          <th className="py-1 px-2 bg-slate-50 text-indigo-700">Q4</th>
                                          <th className="py-1 px-2 bg-indigo-50 text-indigo-900">Annual Total</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        <tr>
                                          <td className="py-1.5 px-2 text-left font-bold text-indigo-600">Planned ($)</td>
                                          {MONTH_KEYS.map(m => (
                                            <td key={m} className="py-1 px-0.5">
                                              <input
                                                type="number"
                                                value={item.monthly_spending?.[m]?.planned ?? 0}
                                                onChange={(e) => handleCapexMonthChange(item.id, m, 'planned', parseFloat(e.target.value) || 0)}
                                                className="w-16 px-1 py-1 text-right text-xs bg-slate-50 border border-slate-200 rounded font-mono"
                                              />
                                            </td>
                                          ))}
                                          <td className="py-1.5 px-2 bg-slate-50 font-mono font-bold text-indigo-700">${(item.quarterly_spending?.planned?.q1 ?? 0).toLocaleString()}</td>
                                          <td className="py-1.5 px-2 bg-slate-50 font-mono font-bold text-indigo-700">${(item.quarterly_spending?.planned?.q2 ?? 0).toLocaleString()}</td>
                                          <td className="py-1.5 px-2 bg-slate-50 font-mono font-bold text-indigo-700">${(item.quarterly_spending?.planned?.q3 ?? 0).toLocaleString()}</td>
                                          <td className="py-1.5 px-2 bg-slate-50 font-mono font-bold text-indigo-700">${(item.quarterly_spending?.planned?.q4 ?? 0).toLocaleString()}</td>
                                          <td className="py-1.5 px-2 bg-indigo-50 font-mono font-bold text-indigo-900">${monthlyPlanned.toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                          <td className="py-1.5 px-2 text-left font-bold text-emerald-600">Actual ($)</td>
                                          {MONTH_KEYS.map(m => (
                                            <td key={m} className="py-1 px-0.5">
                                              <input
                                                type="number"
                                                value={item.monthly_spending?.[m]?.actual ?? 0}
                                                onChange={(e) => handleCapexMonthChange(item.id, m, 'actual', parseFloat(e.target.value) || 0)}
                                                className="w-16 px-1 py-1 text-right text-xs bg-emerald-50/60 border border-emerald-200 rounded font-mono"
                                              />
                                            </td>
                                          ))}
                                          <td className="py-1.5 px-2 bg-slate-50 font-mono font-bold">${(item.quarterly_spending?.actual?.q1 ?? 0).toLocaleString()}</td>
                                          <td className="py-1.5 px-2 bg-slate-50 font-mono font-bold">${(item.quarterly_spending?.actual?.q2 ?? 0).toLocaleString()}</td>
                                          <td className="py-1.5 px-2 bg-slate-50 font-mono font-bold">${(item.quarterly_spending?.actual?.q3 ?? 0).toLocaleString()}</td>
                                          <td className="py-1.5 px-2 bg-slate-50 font-mono font-bold">${(item.quarterly_spending?.actual?.q4 ?? 0).toLocaleString()}</td>
                                          <td className="py-1.5 px-2 bg-indigo-50 font-mono font-bold">${totalActual.toLocaleString()}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                  {item.justification && (
                                    <div className="text-[11px] text-slate-600">
                                      <strong>Justification:</strong> {item.justification}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>

                {/* Dynamic Summary Footer with Monthly, Quarterly, Stage & Status Rollups */}
                {capexItems.length > 0 && (
                  <tfoot className="border-t-2 border-indigo-200 bg-slate-50">
                    <tr className="font-bold text-slate-900">
                      <td className="py-3 px-2.5 text-center"><Calculator size={14} className="mx-auto text-indigo-600" /></td>
                      <td colSpan={4} className="py-3 px-2.5">
                        <div className="text-xs font-extrabold">
                          SUBTOTAL — {capexItems.length} CapEx Line{capexItems.length === 1 ? '' : 's'}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-medium text-slate-600">
                          {CAPEX_STAGE_TAGS.map(st => (
                            <span key={st} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono">
                              {st}: ${fmtUsd(capexTotals.stageTotals[st]?.amount)} ({capexTotals.stageTotals[st]?.count || 0})
                            </span>
                          ))}
                          <span className="text-slate-300">|</span>
                          {CAPEX_STATUSES_2027.map(st => (
                            <span key={st} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono">
                              {st}: ${fmtUsd(capexTotals.statusTotals[st]?.amount)} ({capexTotals.statusTotals[st]?.count || 0})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono">{capexTotals.totalQty}</td>
                      <td className="py-3 px-2.5 text-right text-slate-400 font-mono">—</td>
                      <td className="py-3 px-2.5 text-right font-mono font-extrabold text-indigo-700 tabular-nums">
                        ${fmtUsd(capexTotals.totalPlanned)}
                        <div className="text-[10px] font-normal text-slate-500">
                          Phased: ${fmtUsd(capexTotals.totalMonthlyPlanned)}
                        </div>
                      </td>
                      <td colSpan={2} className="py-3 px-2.5 text-xs font-mono text-slate-700">
                        <div>Q1: ${fmtUsd(capexTotals.quarterly.planned.q1)} · Q2: ${fmtUsd(capexTotals.quarterly.planned.q2)}</div>
                        <div>Q3: ${fmtUsd(capexTotals.quarterly.planned.q3)} · Q4: ${fmtUsd(capexTotals.quarterly.planned.q4)}</div>
                      </td>
                      <td className="py-3 px-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setShowPortfolioPhasingTotal(!showPortfolioPhasingTotal)}
                          className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 cursor-pointer"
                        >
                          {showPortfolioPhasingTotal ? 'Hide 12-Mo' : '12-Mo Total'}
                        </button>
                      </td>
                      <td></td>
                    </tr>

                    {showPortfolioPhasingTotal && (
                      <tr className="bg-indigo-50/60 border-t border-indigo-200">
                        <td colSpan={12} className="p-4">
                          <div className="overflow-x-auto bg-white rounded-xl border border-indigo-100 p-3">
                            <table className="smart-grid-table w-full text-center text-xs">
                              <thead>
                                <tr className="text-slate-500 font-semibold border-b border-slate-100">
                                  <th className="py-1 px-2 text-left">Aggregated Portfolio</th>
                                  {MONTH_LABELS.map(m => <th key={m} className="py-1 px-1">{m}</th>)}
                                  <th className="py-1 px-2 bg-slate-50 text-indigo-700">Q1</th>
                                  <th className="py-1 px-2 bg-slate-50 text-indigo-700">Q2</th>
                                  <th className="py-1 px-2 bg-slate-50 text-indigo-700">Q3</th>
                                  <th className="py-1 px-2 bg-slate-50 text-indigo-700">Q4</th>
                                  <th className="py-1 px-2 bg-indigo-50 text-indigo-900">Annual Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-mono">
                                <tr>
                                  <td className="py-1.5 px-2 text-left font-sans font-bold text-indigo-700">Total Est. Spending ($)</td>
                                  {MONTH_KEYS.map(m => <td key={m} className="py-1 px-1">${fmtUsd(capexTotals.monthlyPlanned[m])}</td>)}
                                  <td className="py-1.5 px-2 bg-slate-50 font-bold text-indigo-700">${fmtUsd(capexTotals.quarterly.planned.q1)}</td>
                                  <td className="py-1.5 px-2 bg-slate-50 font-bold text-indigo-700">${fmtUsd(capexTotals.quarterly.planned.q2)}</td>
                                  <td className="py-1.5 px-2 bg-slate-50 font-bold text-indigo-700">${fmtUsd(capexTotals.quarterly.planned.q3)}</td>
                                  <td className="py-1.5 px-2 bg-slate-50 font-bold text-indigo-700">${fmtUsd(capexTotals.quarterly.planned.q4)}</td>
                                  <td className="py-1.5 px-2 bg-indigo-50 font-extrabold text-indigo-900">${fmtUsd(capexTotals.totalMonthlyPlanned)}</td>
                                </tr>
                                <tr>
                                  <td className="py-1.5 px-2 text-left font-sans font-bold text-emerald-700">Total Actual ($)</td>
                                  {MONTH_KEYS.map(m => <td key={m} className="py-1 px-1">${fmtUsd(capexTotals.monthlyActual[m])}</td>)}
                                  <td className="py-1.5 px-2 bg-slate-50 font-bold">${fmtUsd(capexTotals.quarterly.actual.q1)}</td>
                                  <td className="py-1.5 px-2 bg-slate-50 font-bold">${fmtUsd(capexTotals.quarterly.actual.q2)}</td>
                                  <td className="py-1.5 px-2 bg-slate-50 font-bold">${fmtUsd(capexTotals.quarterly.actual.q3)}</td>
                                  <td className="py-1.5 px-2 bg-slate-50 font-bold">${fmtUsd(capexTotals.quarterly.actual.q4)}</td>
                                  <td className="py-1.5 px-2 bg-indigo-50 font-extrabold">${fmtUsd(capexTotals.totalActual)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 3: OPEX PLAN (OPEX PLAN 2027) --- */}
      {activeSubTab === 'opex' && (
        <div className="space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[190px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search description, remark, G/L..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700"
              >
                {ALL_BU_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              <select
                value={opexAccountFilter}
                onChange={(e) => setOpexAccountFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 max-w-[220px]"
              >
                <option value="All Accounts">All 17 COA Accounts</option>
                {COA_SUMMARY_2027.map(c => (
                  <option key={c.account_code} value={c.account_code}>{c.account_code} — {c.account_name}</option>
                ))}
              </select>

              <select
                value={opexCostCenterFilter}
                onChange={(e) => setOpexCostCenterFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700"
              >
                {opexCostCenterOptions.map(cc => <option key={cc} value={cc}>{cc}</option>)}
              </select>

              <select
                value={opexPicFilter}
                onChange={(e) => setOpexPicFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700"
              >
                {opexPicOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <select
                value={opexClassificationFilter}
                onChange={(e) => setOpexClassificationFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="All">All Classifications</option>
                <option value="Planned">Planned Only</option>
                <option value="Unplanned">Out-of-Budget Only</option>
              </select>

              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('side-by-side')}
                  className={`px-2 py-1 rounded font-semibold cursor-pointer ${viewMode === 'side-by-side' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                >
                  Plan &amp; Act
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('planned-only')}
                  className={`px-2 py-1 rounded font-semibold cursor-pointer ${viewMode === 'planned-only' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'}`}
                >
                  Plan Only
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('actual-only')}
                  className={`px-2 py-1 rounded font-semibold cursor-pointer ${viewMode === 'actual-only' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'}`}
                >
                  Act Only
                </button>
              </div>
            </div>

            <Button
              onClick={() => {
                setEditingOpexItem(null);
                setShowOpexModal(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shrink-0 whitespace-nowrap"
            >
              <Plus size={14} />
              <span>Add OPEX Line</span>
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[68vh]">
              <table className="smart-grid-table w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-2.5 w-8">No</th>
                    <th className="py-3 px-2.5">BU</th>
                    <th className="py-3 px-2.5 min-w-[210px]">Description &amp; Remark</th>
                    <th className="py-3 px-2.5">Account Code &amp; Name</th>
                    <th className="py-3 px-2.5">Qty &times; Price</th>
                    <th className="py-3 px-2.5">CC / PIC</th>
                    <th className="py-3 px-2 w-12 text-center">Row</th>
                    {MONTH_LABELS.map(m => <th key={m} className="py-3 px-1 text-center min-w-[66px]">{m}</th>)}
                    <th className="py-3 px-3 text-right bg-slate-100/70 min-w-[96px]">Total</th>
                    <th className="py-3 px-2 text-center w-16">Act</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {opexItems.length === 0 ? (
                    <tr>
                      <td colSpan={21} className="py-12 text-center text-slate-400">
                        No OPEX lines match the active filters for FY {selectedFiscalYear}.
                      </td>
                    </tr>
                  ) : (
                    opexItems.map((item, idx) => {
                      const annualPlanned = MONTH_KEYS.reduce((acc, m) => acc + (Number(item.monthly_spending?.[m]?.planned) || 0), 0);
                      const annualActual = MONTH_KEYS.reduce((acc, m) => acc + (Number(item.monthly_spending?.[m]?.actual) || 0), 0);
                      const annualVariance = annualPlanned - annualActual;
                      const isUnder = annualVariance >= 0;
                      const spanRows = viewMode === 'side-by-side' ? 3 : 1;
                      const coaCode = extractGlCodeNumber(item.account_code);
                      const coaName = findCoaByCode(coaCode)?.account_name || item.account_name;

                      return (
                        <React.Fragment key={item.id}>
                          {(viewMode === 'side-by-side' || viewMode === 'planned-only') && (
                            <tr className="hover:bg-slate-50/50">
                              <td className="py-2 px-2.5 text-slate-400 font-mono" rowSpan={spanRows}>{idx + 1}</td>
                              <td className="py-2 px-2.5 font-mono font-bold text-slate-800 whitespace-nowrap" rowSpan={spanRows}>
                                {item.site}
                              </td>
                              <td className="py-2 px-2.5" rowSpan={spanRows}>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900">{item.description}</span>
                                  {item.budget_classification === 'Unplanned' && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                      <AlertTriangle size={10} /> Out-of-Budget
                                    </span>
                                  )}
                                </div>
                                {(item.remark || item.justification) && (
                                  <div className="text-[11px] text-slate-500 mt-0.5 max-w-xs truncate" title={item.remark || item.justification}>
                                    {item.remark || item.justification}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-2.5" rowSpan={spanRows}>
                                <div className="font-mono font-bold text-indigo-700">{coaCode}</div>
                                <div className="text-[11px] text-slate-600">{coaName}</div>
                              </td>
                              <td className="py-2 px-2.5 font-mono text-slate-700 whitespace-nowrap" rowSpan={spanRows}>
                                {item.qty} &times; ${Number(item.unit_price || 0).toLocaleString()}
                              </td>
                              <td className="py-2 px-2.5 text-slate-600 whitespace-nowrap" rowSpan={spanRows}>
                                <div className="font-mono font-semibold">{item.cost_center || 'IT'}</div>
                                <div className="text-[11px] text-slate-400">{item.pic}</div>
                              </td>
                              <td className="py-2 px-2 text-center font-bold text-indigo-600 text-[11px] bg-indigo-50/40">Plan</td>
                              {MONTH_KEYS.map(m => (
                                <td key={m} className="py-1 px-0.5 text-center">
                                  <input
                                    type="number"
                                    value={item.monthly_spending?.[m]?.planned ?? 0}
                                    onChange={(e) => handleOpexMonthChange(item.id, m, 'planned', parseFloat(e.target.value) || 0)}
                                    className="w-16 px-1 py-1 text-right text-xs bg-slate-50 border border-slate-200 rounded font-mono"
                                  />
                                </td>
                              ))}
                              <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700 bg-slate-50/70 tabular-nums">
                                ${annualPlanned.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-2 text-center" rowSpan={spanRows}>
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => { setEditingOpexItem(item); setShowOpexModal(true); }}
                                    className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 cursor-pointer"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmItem({ id: item.id, name: item.description, type: 'opex' })}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}

                          {(viewMode === 'side-by-side' || viewMode === 'actual-only') && (
                            <tr className="bg-emerald-50/20">
                              {viewMode === 'actual-only' && (
                                <>
                                  <td className="py-2 px-2.5 text-slate-400 font-mono">{idx + 1}</td>
                                  <td className="py-2 px-2.5 font-mono font-bold">{item.site}</td>
                                  <td className="py-2 px-2.5 font-bold">{item.description}</td>
                                  <td className="py-2 px-2.5"><span className="font-mono font-bold text-indigo-700">{coaCode}</span> · {coaName}</td>
                                  <td className="py-2 px-2.5 font-mono">{item.qty} &times; ${Number(item.unit_price || 0).toLocaleString()}</td>
                                  <td className="py-2 px-2.5">{item.cost_center} / {item.pic}</td>
                                </>
                              )}
                              <td className="py-2 px-2 text-center font-bold text-emerald-700 text-[11px] bg-emerald-50/50">Act</td>
                              {MONTH_KEYS.map(m => (
                                <td key={m} className="py-1 px-0.5 text-center">
                                  <input
                                    type="number"
                                    value={item.monthly_spending?.[m]?.actual ?? 0}
                                    onChange={(e) => handleOpexMonthChange(item.id, m, 'actual', parseFloat(e.target.value) || 0)}
                                    className="w-16 px-1 py-1 text-right text-xs bg-emerald-50/50 border border-emerald-200 rounded font-mono"
                                  />
                                </td>
                              ))}
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800 bg-slate-50/70 tabular-nums">
                                ${annualActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                              {viewMode === 'actual-only' && (
                                <td className="py-2 px-2 text-center">
                                  <button type="button" onClick={() => { setEditingOpexItem(item); setShowOpexModal(true); }} className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer">
                                    <Edit2 size={13} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          )}

                          {viewMode === 'side-by-side' && (
                            <tr className="border-b-2 border-slate-200 bg-slate-50/60">
                              <td className="py-1 px-2 text-center font-bold text-slate-600 text-[11px]">Var</td>
                              {MONTH_KEYS.map(m => {
                                const diff = (item.monthly_spending?.[m]?.planned || 0) - (item.monthly_spending?.[m]?.actual || 0);
                                return (
                                  <td key={m} className={`py-1 px-1 text-right font-mono font-semibold text-xs ${diff >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                    {diff !== 0 ? (diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()) : '—'}
                                  </td>
                                );
                              })}
                              <td className={`py-1 px-3 text-right font-mono font-bold tabular-nums bg-slate-100/70 ${isUnder ? 'text-emerald-700' : 'text-rose-600'}`}>
                                {isUnder ? '+' : ''}${annualVariance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>

                {/* Dynamic Filtered SUBTOTAL(9, ...) Summary Footer */}
                {opexItems.length > 0 && (
                  <tfoot className="border-t-2 border-indigo-200 font-bold">
                    <tr className="bg-indigo-50/50 text-indigo-950">
                      <td colSpan={6} className="py-3 px-3 text-xs uppercase tracking-wider">
                        SUBTOTAL (Filtered {opexItems.length} OPEX Line{opexItems.length === 1 ? '' : 's'}) — Planned
                      </td>
                      <td className="py-3 px-2 text-center text-indigo-700">Plan</td>
                      {MONTH_KEYS.map(m => (
                        <td key={m} className="py-3 px-1 text-right font-mono text-xs tabular-nums">
                          ${fmtUsd(opexGridRollups.monthlyPlannedTotals[m])}
                        </td>
                      ))}
                      <td className="py-3 px-3 text-right font-mono text-sm bg-indigo-100/60 tabular-nums">
                        ${fmtUsd(opexGridRollups.grandPlanned)}
                      </td>
                      <td></td>
                    </tr>
                    <tr className="bg-emerald-50/50 text-emerald-950">
                      <td colSpan={6} className="py-2.5 px-3 text-xs uppercase tracking-wider">
                        SUBTOTAL — Actual Burn
                      </td>
                      <td className="py-2.5 px-2 text-center text-emerald-700">Act</td>
                      {MONTH_KEYS.map(m => (
                        <td key={m} className="py-2.5 px-1 text-right font-mono text-xs tabular-nums">
                          ${fmtUsd(opexGridRollups.monthlyActualTotals[m])}
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-right font-mono text-sm bg-emerald-100/60 tabular-nums">
                        ${fmtUsd(opexGridRollups.grandActual)}
                      </td>
                      <td></td>
                    </tr>
                    <tr className="bg-slate-100 text-slate-900">
                      <td colSpan={6} className="py-2.5 px-3 text-xs uppercase tracking-wider">
                        SUBTOTAL — Net Variance
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-700">Var</td>
                      {MONTH_KEYS.map(m => {
                        const v = opexGridRollups.monthlyVarianceTotals[m] || 0;
                        return (
                          <td key={m} className={`py-2.5 px-1 text-right font-mono text-xs tabular-nums ${v >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {v >= 0 ? '+' : ''}${fmtUsd(v)}
                          </td>
                        );
                      })}
                      <td className={`py-2.5 px-3 text-right font-mono text-sm bg-slate-200/70 tabular-nums ${opexGridRollups.grandVariance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {opexGridRollups.grandVariance >= 0 ? '+' : ''}${fmtUsd(opexGridRollups.grandVariance)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB 4: GL ACTUALS (COA DETAILS) & PLAN VS ACTUAL VARIANCE --- */}
      {activeSubTab === 'gl-actuals' && (
        <GlActualsTab
          fiscalYear={selectedFiscalYear}
          selectedSite={selectedSite}
          onSiteChange={setSelectedSite}
          glActuals={glActuals}
          opexItems={opexItems}
          onRefresh={loadAll}
          showToast={showToast}
        />
      )}

      {/* --- SUB-TAB 5: MASTER DATA & REFERENCE TABLES --- */}
      {activeSubTab === 'master-data' && (
        <MasterDataTab
          unitPriceCatalog={unitPriceCatalog}
          onRefreshMasterData={fetchMasterData}
          onUseUnitPriceInCapex={(benchmark) => {
            setEditingCapexItem(null);
            setPreselectedBenchmark(benchmark);
            setShowCapexModal(true);
          }}
          onOpenAccountCodesModal={() => setShowAccountCodesModal(true)}
          showToast={showToast}
        />
      )}

      {/* --- SUB-TAB 6: SYNC & TEMPLATE --- */}
      {activeSubTab === 'sync' && (
        <div className="space-y-6">
          {/* Annual Rollover Card */}
          <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shrink-0">
                  <Copy size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Copy &amp; Roll Over IT CapEx &amp; OPEX Planning</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Copy planned 2027 CapEx &amp; OPEX schedules into future fiscal years with optional CPI escalation while resetting actuals to $0.00.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-mono font-bold text-xs border border-slate-200 self-start">
                Active: FY {selectedFiscalYear}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Source Fiscal Year</label>
                <select
                  value={rolloverSourceYear}
                  onChange={(e) => setRolloverSourceYear(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                >
                  {availableYears.map(yr => <option key={yr} value={yr}>FY {yr}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Fiscal Year</label>
                <input
                  type="number"
                  min="2020"
                  max="2040"
                  value={rolloverTargetYear}
                  onChange={(e) => setRolloverTargetYear(parseInt(e.target.value, 10) || (rolloverSourceYear + 1))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-indigo-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Components</label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={rolloverCopyCapex} onChange={(e) => setRolloverCopyCapex(e.target.checked)} className="rounded text-indigo-600" />
                  <span>CapEx ({rolloverPreview.sourceCapexCount} items)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={rolloverCopyOpex} onChange={(e) => setRolloverCopyOpex(e.target.checked)} className="rounded text-emerald-600" />
                  <span>OPEX ({rolloverPreview.sourceOpexCount} items)</span>
                </label>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Campus / BU Scope</label>
                <select
                  value={rolloverCampus}
                  onChange={(e) => setRolloverCampus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {ALL_BU_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Escalation / Reset Mode</label>
                <select
                  value={rolloverAdjustmentPercent}
                  onChange={(e) => setRolloverAdjustmentPercent(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="0">+0% Identical Baseline</option>
                  <option value="3">+3% Annual Escalation</option>
                  <option value="5">+5% CPI / Inflation</option>
                  <option value="10">+10% Growth Buffer</option>
                  <option value="-100">Reset to $0.00 (Zero-Based FY)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-rose-700 cursor-pointer">
                  <input type="checkbox" checked={rolloverOverwrite} onChange={(e) => setRolloverOverwrite(e.target.checked)} className="rounded text-rose-600" />
                  <span>Overwrite if FY {rolloverTargetYear} already has lines</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  {rolloverAdjustmentPercent === -100
                    ? `Zero-Based Preview: ${rolloverPreview.totalItems} lines cloned to FY ${rolloverTargetYear} with $0.00 planned & actuals.`
                    : `Preview: ${rolloverPreview.totalItems} lines totaling $${fmtUsd(rolloverPreview.totalTargetBudget)} planned for FY ${rolloverTargetYear}.`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setResetZeroYear(selectedFiscalYear);
                    setResetZeroMode('zero_amounts');
                    setResetZeroConfirmed(false);
                    loadResetSnapshot();
                    setShowResetZeroModal(true);
                  }}
                  disabled={isRollingOver || isResettingZero || (!rolloverCopyCapex && !rolloverCopyOpex)}
                  className="border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold py-2.5 px-4 gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Reset 0 FY</span>
                </Button>
                <Button
                  onClick={handleExecuteRollover}
                  disabled={isRollingOver || isResettingZero || rolloverPreview.totalItems === 0 || rolloverSourceYear === rolloverTargetYear}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold py-2.5 px-5"
                >
                  {isRollingOver
                    ? 'Rolling Over...'
                    : rolloverAdjustmentPercent === -100
                      ? `Clone as $0.00 to FY ${rolloverTargetYear}`
                      : `Clone & Roll Over to FY ${rolloverTargetYear}`}
                </Button>
              </div>
            </div>
          </div>

          {/* Separate 2027 Template Export & Smart Import Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">2027 CapEx Template Workbook</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Exports styled CAPEX sheets (Planning, Actual, or both tabs in the exact template layout) plus Dept. Definition, Asset Types, Business Line &amp; Est. Unit Price.
                </p>
              </div>
              <div className="space-y-2">
                <Button onClick={() => handleExportCapexExcel('both')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-xl">
                  <Download size={14} className="mr-1.5 inline" /> Export CapEx (Plan &amp; Actual)
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportCapexExcel('planned')}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer"
                  >
                    Planning Only
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportCapexExcel('actual')}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 cursor-pointer"
                  >
                    Actual Only
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">2027 OPEX Template Workbook</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Exports styled OPEX sheets (Planning, Actual, or both tabs in the exact template layout) plus 17-account COA Summary and COA Details GL Actuals.
                </p>
              </div>
              <div className="space-y-2">
                <Button onClick={() => handleExportOpexExcel('both')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-xl">
                  <Download size={14} className="mr-1.5 inline" /> Export OpEx (Plan &amp; Actual)
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportOpexExcel('planned')}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer"
                  >
                    Planning Only
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportOpexExcel('actual')}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 cursor-pointer"
                  >
                    Actual Only
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Smart Multi-Sheet Import</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload 2027 CapEx, OPEX, or COA Details `.xlsx` files. Automatically skips title headers and normalizes K3/Sakal BUs &amp; COA codes.
                </p>
              </div>
              <label className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold py-2.5 cursor-pointer">
                <Upload size={14} />
                <span>Choose .xlsx Workbook</span>
                <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
              </label>
            </div>
          </div>

          {/* Account Codes Preview & Reset */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BookOpen size={20} className="text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Chart of Accounts ({effectiveAccountCodes.length} Active Codes)</h3>
                <p className="text-xs text-slate-500">All 17 official 2027 OPEX G/L accounts pre-seeded and ready for custom extensions.</p>
              </div>
            </div>
            <Button onClick={() => setShowAccountCodesModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shrink-0">
              Manage Account Codes
            </Button>
          </div>

          <div className="bg-rose-50/40 rounded-2xl border border-rose-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <RotateCcw size={20} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Reset FY {selectedFiscalYear} Baseline Template</h3>
                <p className="text-xs text-slate-600">Restore default CapEx &amp; OPEX baseline contracts for FY {selectedFiscalYear}.</p>
              </div>
            </div>
            <Button onClick={handleRestoreDefaults} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shrink-0">
              Reset FY {selectedFiscalYear} Template
            </Button>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      {showCloneYearModal && (
        <SmartModal
          onClose={() => setShowCloneYearModal(false)}
          size="sm"
          icon={<Calendar size={18} />}
          title="Plan / Roll Over Fiscal Year"
          subtitle="Duplicate budget baseline structure to a target year"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowCloneYearModal(false)}>Cancel</Button>
              <Button onClick={handleCloneYear}>Clone to FY {cloneTargetYear}</Button>
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Source Year</label>
              <input type="text" disabled value={`FY ${selectedFiscalYear}`} className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold" />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Target Fiscal Year</label>
              <input
                type="number"
                min="2020"
                max="2040"
                value={cloneTargetYear}
                onChange={(e) => setCloneTargetYear(parseInt(e.target.value, 10) || 2028)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={cloneOverwrite} onChange={(e) => setCloneOverwrite(e.target.checked)} className="rounded text-indigo-600" />
            <span>Overwrite if FY {cloneTargetYear} already exists</span>
          </label>
        </SmartModal>
      )}

      {showCapexModal && (
        <CapexEditModal
          fiscalYear={selectedFiscalYear}
          item={editingCapexItem}
          unitPriceCatalog={unitPriceCatalog}
          preselectedBenchmark={preselectedBenchmark}
          onClose={() => {
            setShowCapexModal(false);
            setPreselectedBenchmark(null);
          }}
          onSaved={() => {
            setShowCapexModal(false);
            setPreselectedBenchmark(null);
            loadAll();
            showToast('CapEx line saved successfully');
          }}
        />
      )}

      {showOpexModal && (
        <OpexEditModal
          fiscalYear={selectedFiscalYear}
          item={editingOpexItem}
          accountCodes={effectiveAccountCodes}
          onManageAccountCodes={() => setShowAccountCodesModal(true)}
          onClose={() => setShowOpexModal(false)}
          onSaved={() => {
            setShowOpexModal(false);
            loadAll();
            showToast('OPEX line saved successfully');
          }}
        />
      )}

      {showAccountCodesModal && (
        <AccountCodesMasterModal
          accountCodes={effectiveAccountCodes}
          onClose={() => setShowAccountCodesModal(false)}
          onRefresh={() => {
            fetchAccountCodes();
            fetchOpex();
          }}
          showToast={showToast}
        />
      )}

      {deleteConfirmItem && (
        <SmartModal
          onClose={() => setDeleteConfirmItem(null)}
          size="sm"
          icon={<AlertTriangle size={18} className="text-rose-600" />}
          title={deleteConfirmItem.type === 'restore-defaults' ? 'Reset to Baseline Template?' : `Delete ${deleteConfirmItem.type.toUpperCase()} Item?`}
          subtitle="This action cannot be undone"
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleteConfirmItem(null)} disabled={isDeleting}>Cancel</Button>
              <Button variant="danger" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Processing...' : deleteConfirmItem.type === 'restore-defaults' ? 'Reset Template' : 'Confirm Delete'}
              </Button>
            </>
          }
        >
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {deleteConfirmItem.type === 'restore-defaults'
              ? `Reset all CapEx and OPEX items for FY ${selectedFiscalYear} to the baseline template?`
              : `Confirm deletion of "${deleteConfirmItem.name}"?`}
          </p>
        </SmartModal>
      )}

      {showResetZeroModal && (
        <SmartModal
          onClose={() => !isResettingZero && !isUndoingReset && setShowResetZeroModal(false)}
          size="md"
          icon={<RotateCcw size={18} className="text-rose-600" />}
          title="Reset Fiscal Year to 0"
          subtitle="Zero out planned & actual values or clear all items for a Fiscal Year"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowResetZeroModal(false)} disabled={isResettingZero || isUndoingReset}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleExecuteResetZero}
                disabled={isResettingZero || isUndoingReset || !resetZeroConfirmed || (!rolloverCopyCapex && !rolloverCopyOpex)}
              >
                {isResettingZero
                  ? 'Resetting...'
                  : resetZeroMode === 'clear_items'
                    ? `Clear FY ${resetZeroYear} to 0 Items`
                    : `Reset FY ${resetZeroYear} to $0.00`}
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            {resetSnapshot?.available && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-800">
                <div>
                  <div className="font-bold text-emerald-800 dark:text-emerald-300">
                    Recoverable Snapshot Available (FY {resetSnapshot.fiscal_year})
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    {resetSnapshot.capex_count || 0} CapEx &amp; {resetSnapshot.opex_count || 0} OPEX items ({resetSnapshot.campus_filter || 'All Sites'}) saved before last reset.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUndoLastReset}
                  disabled={isUndoingReset || isResettingZero}
                  className="border-emerald-400 text-emerald-800 hover:bg-emerald-100 text-[11px] font-bold py-1.5 px-3 shrink-0"
                >
                  {isUndoingReset ? 'Recovering...' : `Recover FY ${resetSnapshot.fiscal_year}`}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Fiscal Year to Reset</label>
                <select
                  value={resetZeroYear}
                  onChange={(e) => {
                    setResetZeroYear(parseInt(e.target.value, 10));
                    setResetZeroConfirmed(false);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-slate-100"
                >
                  {Array.from(new Set([...availableYears, rolloverSourceYear, rolloverTargetYear]))
                    .sort((a, b) => a - b)
                    .map(yr => (
                      <option key={yr} value={yr}>FY {yr}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Selected Scope</label>
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {[
                    rolloverCopyCapex ? 'CapEx' : null,
                    rolloverCopyOpex ? 'OPEX' : null
                  ].filter(Boolean).join(' + ')} · {rolloverCampus}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">Reset Action Mode</label>
              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                  resetZeroMode === 'zero_amounts'
                    ? 'border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <input
                  type="radio"
                  name="resetZeroMode"
                  checked={resetZeroMode === 'zero_amounts'}
                  onChange={() => setResetZeroMode('zero_amounts')}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    Reset All Amounts to $0.00 (Keep Line Items)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Sets Unit Price, Requested/Annual Total, and all 12-month Planned &amp; Actual columns to $0.00 while preserving descriptions, BUs, and COA accounts.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                  resetZeroMode === 'clear_items'
                    ? 'border-rose-400 bg-rose-50/70 dark:bg-rose-950/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <input
                  type="radio"
                  name="resetZeroMode"
                  checked={resetZeroMode === 'clear_items'}
                  onChange={() => setResetZeroMode('clear_items')}
                  className="mt-0.5 text-rose-600"
                />
                <div>
                  <div className="font-bold text-rose-700 dark:text-rose-400">
                    Clear All Line Items (0 Items)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Removes all matching CapEx/OPEX line items for FY {resetZeroYear} ({rolloverCampus}) so the year starts blank (a backup snapshot is saved automatically).
                  </p>
                </div>
              </label>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-300 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-800 cursor-pointer">
              <input
                type="checkbox"
                checked={resetZeroConfirmed}
                onChange={(e) => setResetZeroConfirmed(e.target.checked)}
                className="mt-0.5 rounded text-rose-600"
              />
              <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                I confirm I want to {resetZeroMode === 'clear_items' ? 'remove all line items' : 'reset all amounts to $0.00'} for <strong>FY {resetZeroYear}</strong> ({rolloverCampus}).
              </span>
            </label>
          </div>
        </SmartModal>
      )}

      {loading && (
        <div className="text-center py-2 text-[11px] text-slate-400">Refreshing FY {selectedFiscalYear} budget data...</div>
      )}
    </div>
  );
};
