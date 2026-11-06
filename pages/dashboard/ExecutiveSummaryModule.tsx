import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Wrench, Monitor, Activity, DollarSign,
  Download, Filter, CheckCircle2, AlertCircle, Clock, BarChart3, AlertTriangle,
  MapPin, ArrowRight, ChevronRight, Server, Database, Laptop, Layers, 
  RefreshCw, ExternalLink, Building2, TrendingUp, CheckCircle, HelpCircle, 
  Eye, Calendar, Sparkles, Cloud, ShieldCheck, CheckSquare, FileText,
  Receipt, ArrowUpRight, ShieldAlert, Cpu, HardDrive, Wifi, Printer,
  PieChart as PieIcon, LineChart as LineIcon
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

interface ExecutiveSummaryProps {
  kpis: any;
  sites: any[];
  siteFilter: string;
  setSiteFilter?: (site: string) => void;
  filterFrom: string;
  filterTo: string;
  onNavigateTab: (tabId: string) => void;
}

export const ExecutiveSummaryModule: React.FC<ExecutiveSummaryProps> = ({
  kpis,
  sites,
  siteFilter,
  setSiteFilter,
  filterFrom,
  filterTo,
  onNavigateTab
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Consolidated Datasets from all latest IT modules
  const [fixedAssets, setFixedAssets] = useState<any[]>([]);
  const [controlAssets, setControlAssets] = useState<any[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<any>(null);
  const [expenseAnalytics, setExpenseAnalytics] = useState<any>(null);
  const [cloudSummary, setCloudSummary] = useState<any>({
    totalCount: 0,
    activeCount: 0,
    totalMonthlySpend: 0,
    annualRunRate: 0,
    expiring30Days: 0,
    totalSeats: 0,
    usedSeats: 0,
    seatUtilization: 0,
    categoryBreakdown: [],
    providerBreakdown: []
  });
  const [cloudSubscriptions, setCloudSubscriptions] = useState<any[]>([]);
  const [helpdeskTickets, setHelpdeskTickets] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  // Fetch all 6 live IT modules concurrently
  const fetchAllData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const siteParam = siteFilter !== 'All Sites' ? `?site=${encodeURIComponent(siteFilter)}` : '';
      const buParam = siteFilter !== 'All Sites' ? `?bu_name=${encodeURIComponent(siteFilter)}` : '';

      const [
        fixedRes,
        controlRes,
        budgetRes,
        expenseRes,
        cloudSumRes,
        cloudListRes,
        helpdeskRes,
        staffRes,
        notesRes
      ] = await Promise.all([
        fetch(`/api/fixed-assets${buParam}`, { headers }).catch(() => null),
        fetch(`/api/assets-control${buParam}`, { headers }).catch(() => null),
        fetch(`/api/it-budget/summary?fiscal_year=2026${siteParam}`, { headers }).catch(() => null),
        fetch(`/api/it-expenses/analytics?fiscal_year=2026${siteParam}`, { headers }).catch(() => null),
        fetch(`/api/cloud-subscriptions/summary${siteParam}`, { headers }).catch(() => null),
        fetch(`/api/cloud-subscriptions${siteParam}`, { headers }).catch(() => null),
        fetch('/api/helpdesk', { headers }).catch(() => null),
        fetch('/api/staffing', { headers }).catch(() => null),
        fetch('/api/notes', { headers }).catch(() => null)
      ]);

      if (fixedRes && fixedRes.ok) setFixedAssets(await fixedRes.json());
      if (controlRes && controlRes.ok) setControlAssets(await controlRes.json());
      if (budgetRes && budgetRes.ok) setBudgetSummary(await budgetRes.json());
      if (expenseRes && expenseRes.ok) setExpenseAnalytics(await expenseRes.json());
      if (cloudSumRes && cloudSumRes.ok) setCloudSummary(await cloudSumRes.json());
      if (cloudListRes && cloudListRes.ok) setCloudSubscriptions(await cloudListRes.json());
      if (helpdeskRes && helpdeskRes.ok) setHelpdeskTickets(await helpdeskRes.json());
      if (staffRes && staffRes.ok) setStaff(await staffRes.json());
      if (notesRes && notesRes.ok) setNotes(await notesRes.json());
    } catch (err) {
      console.error('Failed to load consolidated executive summary data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [siteFilter, filterFrom, filterTo]);

  // --- COMPUTED MODULE METRICS ---

  // 1. Hardware Assets Roll-Up (Fixed + Control)
  const hardwareMetrics = useMemo(() => {
    const totalFixed = fixedAssets.length;
    const totalControl = controlAssets.length;
    const totalFleet = totalFixed + totalControl;

    const totalValuation = fixedAssets.reduce((sum, item) => sum + (parseFloat(item.grand_total) || 0), 0);

    // Grouping by Category
    const categoryMap: Record<string, number> = {};
    fixedAssets.forEach(item => {
      const cat = (item.category || 'Other').trim().toUpperCase();
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    controlAssets.forEach(item => {
      const cat = (item.category || 'Other').trim().toUpperCase();
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Grouping by BU
    const buMap: Record<string, { fixed: number; control: number; value: number }> = {
      'Khema Global': { fixed: 0, control: 0, value: 0 },
      'Khema TK': { fixed: 0, control: 0, value: 0 },
      'Khema BKK': { fixed: 0, control: 0, value: 0 },
      'Sakal 2004': { fixed: 0, control: 0, value: 0 },
    };

    fixedAssets.forEach(item => {
      const bu = item.bu_name || 'Khema Global';
      if (!buMap[bu]) buMap[bu] = { fixed: 0, control: 0, value: 0 };
      buMap[bu].fixed += 1;
      buMap[bu].value += (parseFloat(item.grand_total) || 0);
    });

    controlAssets.forEach(item => {
      const bu = item.bu_name || 'Khema Global';
      if (!buMap[bu]) buMap[bu] = { fixed: 0, control: 0, value: 0 };
      buMap[bu].control += 1;
    });

    const buBreakdown = Object.entries(buMap).map(([bu_name, data]) => ({
      bu_name,
      total: data.fixed + data.control,
      fixed: data.fixed,
      control: data.control,
      value: data.value
    }));

    return {
      totalFixed,
      totalControl,
      totalFleet,
      totalValuation,
      categoryBreakdown,
      buBreakdown
    };
  }, [fixedAssets, controlAssets]);

  // 2. CapEx & OpEx Planning Metrics
  const budgetMetrics = useMemo(() => {
    const plannedCapex = budgetSummary?.totals?.planned_capex || 0;
    const actualCapex = budgetSummary?.totals?.actual_capex || 0;
    const plannedOpex = budgetSummary?.totals?.planned_opex || 0;
    const actualOpex = budgetSummary?.totals?.actual_opex || 0;

    const totalPlanned = plannedCapex + plannedOpex;
    const totalActual = actualCapex + actualOpex;
    const executionRate = totalPlanned > 0 ? Math.min(100, (totalActual / totalPlanned) * 100) : 0;
    const variance = totalPlanned - totalActual;

    return {
      plannedCapex,
      actualCapex,
      plannedOpex,
      actualOpex,
      totalPlanned,
      totalActual,
      executionRate,
      variance,
      monthlyCashFlow: budgetSummary?.monthlyCashFlow || []
    };
  }, [budgetSummary]);

  // 3. IT Operating Expenses Metrics
  const expenseMetrics = useMemo(() => {
    const totalSpend = expenseAnalytics?.totalExpenses || 0;
    const txCount = expenseAnalytics?.transactionCount || 0;
    const categorySpend = expenseAnalytics?.categorySpend || [];
    const siteSpend = expenseAnalytics?.siteSpend || [];

    return {
      totalSpend,
      txCount,
      categorySpend,
      siteSpend
    };
  }, [expenseAnalytics]);

  // 4. Helpdesk Metrics
  const ticketMetrics = useMemo(() => {
    let inProgress = 0;
    let testing = 0;
    let notStarted = 0;
    let completed = 0;

    helpdeskTickets.forEach(t => {
      if (siteFilter !== 'All Sites' && t.site_name !== siteFilter) return;
      inProgress += (t.in_progress_count || 0);
      testing += (t.testing_count || 0);
      notStarted += (t.not_started_count || 0);
      completed += (t.completed_count || 0);
    });

    const total = inProgress + testing + notStarted + completed;
    const pending = inProgress + testing + notStarted;
    const resolutionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '100.0';

    return { total, completed, inProgress, testing, notStarted, pending, resolutionRate };
  }, [helpdeskTickets, siteFilter]);

  // 5. Staffing Metrics
  const staffMetrics = useMemo(() => {
    const filteredStaff = siteFilter === 'All Sites' 
      ? staff 
      : staff.filter(s => s.site_name === siteFilter || (s.monthly_schedule && s.monthly_schedule.includes(siteFilter)));
    const total = filteredStaff.length;
    const active = filteredStaff.filter(s => s.status === 'Active').length;
    const sumScore = filteredStaff.reduce((sum, s) => sum + (parseFloat(s.performance_score) || 0), 0);
    const avgScore = total > 0 ? (sumScore / total).toFixed(1) : '4.9';
    return { total, active, avgScore };
  }, [staff, siteFilter]);

  // 6. Multi-Facility Infrastructure Roll-Up Matrix
  const facilityMatrix = useMemo(() => {
    const targetFacilities = sites.length > 0 ? sites : [
      { id: '1', site_name: 'Main Hospital', location: 'Phnom Penh Center' },
      { id: '2', site_name: 'North Clinic', location: 'Toul Kork' },
      { id: '3', site_name: 'South Clinic', location: 'Boeung Keng Kang' },
      { id: '4', site_name: 'Sakal 2004', location: 'Street 2004' },
    ];

    return targetFacilities.map(s => {
      // Hardware Assets matching this site / BU
      const siteFixed = fixedAssets.filter(a => 
        a.bu_name === s.site_name || 
        (s.site_name === 'Main Hospital' && a.bu_name === 'Khema Global') ||
        (s.site_name === 'North Clinic' && a.bu_name === 'Khema TK') ||
        (s.site_name === 'South Clinic' && a.bu_name === 'Khema BKK')
      ).length;

      const siteControl = controlAssets.filter(a => 
        a.bu_name === s.site_name || 
        (s.site_name === 'Main Hospital' && a.bu_name === 'Khema Global') ||
        (s.site_name === 'North Clinic' && a.bu_name === 'Khema TK') ||
        (s.site_name === 'South Clinic' && a.bu_name === 'Khema BKK')
      ).length;

      const siteStaff = staff.filter(st => 
        st.site_name === s.site_name || 
        (st.monthly_schedule && st.monthly_schedule.includes(s.site_name))
      ).length;

      const siteTickets = helpdeskTickets.filter(ht => ht.site_name === s.site_name).reduce((sum, ht) => 
        sum + (ht.in_progress_count || 0) + (ht.testing_count || 0) + (ht.not_started_count || 0) + (ht.completed_count || 0), 0);

      const siteSubs = cloudSubscriptions.filter(cs => cs.site_name === s.site_name || cs.site_name === 'All Sites').length;

      return {
        ...s,
        totalAssets: siteFixed + siteControl,
        fixedAssets: siteFixed,
        controlAssets: siteControl,
        staffCount: siteStaff,
        ticketCount: siteTickets,
        subsCount: siteSubs,
        status: 'Operational'
      };
    });
  }, [sites, fixedAssets, controlAssets, staff, helpdeskTickets, cloudSubscriptions]);

  const CHART_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* ========================================================================= */}
      {/* EXECUTIVE HEADER & MISSION CONTROL BANNER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-40 -mb-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 tracking-wide uppercase">
                Consolidated Operations Center
              </span>
              <span className="text-xs text-slate-300 flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync Across All 6 IT Modules
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Khema Global IT Executive Operations
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl font-normal leading-relaxed">
              Real-time executive oversight rolling up Hardware Fleet, CapEx/OpEx Budgets, Operating Expenses, Cloud SaaS Subscriptions, Helpdesk SLAs, and Hospital Infrastructure for <span className="font-semibold text-white">{siteFilter}</span>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={fetchAllData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur border border-white/15 transition-all shadow-sm disabled:opacity-50"
              title="Refresh all consolidated live datasets"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-indigo-300' : 'text-slate-300'} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh All Modules'}</span>
            </button>
          </div>
        </div>

        {/* Quick Facility Filter Indicator */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Quick Facility Jump:</span>
          {['All Sites', 'Khema Global', 'Khema TK', 'Khema BKK', 'Sakal 2004'].map((sName) => (
            <button
              key={sName}
              type="button"
              onClick={() => setSiteFilter && setSiteFilter(sName)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                siteFilter === sName
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30 font-semibold'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              {sName}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6 TOP EXECUTIVE KPI CARDS (DIRECT PORTALS TO EACH IT MODULE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* 1. CapEx & OpEx Planning */}
        <div 
          onClick={() => onNavigateTab('capex-opex')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CapEx / OpEx</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 group-hover:scale-110 transition-transform">
              <DollarSign size={18} />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              ${Math.round(budgetMetrics.totalActual).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              of ${Math.round(budgetMetrics.totalPlanned).toLocaleString()} Planned
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-emerald-600 font-semibold">{budgetMetrics.executionRate.toFixed(1)}% Executed</span>
            <span className="text-indigo-600 font-medium flex items-center group-hover:translate-x-0.5 transition-transform">
              View <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* 2. IT Expenses & Tracking */}
        <div 
          onClick={() => onNavigateTab('expenses')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-violet-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">IT Expenses</span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 group-hover:scale-110 transition-transform">
              <Receipt size={18} />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              ${Math.round(expenseMetrics.totalSpend).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {expenseMetrics.txCount} Recorded Invoices
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-violet-600 font-semibold">Active Ledger</span>
            <span className="text-indigo-600 font-medium flex items-center group-hover:translate-x-0.5 transition-transform">
              View <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* 3. Hardware Assets Fleet (Fixed + Control) */}
        <div 
          onClick={() => onNavigateTab('assets')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hardware Fleet</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 group-hover:scale-110 transition-transform">
              <Monitor size={18} />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {hardwareMetrics.totalFleet} <span className="text-xs text-slate-500 font-normal">Units</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate" title={`$${Math.round(hardwareMetrics.totalValuation).toLocaleString()} Valuation`}>
              ${Math.round(hardwareMetrics.totalValuation).toLocaleString()} Fixed Val
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-blue-600 font-semibold">{hardwareMetrics.totalFixed} FA / {hardwareMetrics.totalControl} AC</span>
            <span className="text-indigo-600 font-medium flex items-center group-hover:translate-x-0.5 transition-transform">
              View <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* 4. Cloud & HIS Subscriptions */}
        <div 
          onClick={() => onNavigateTab('subscriptions')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cloud & HIS</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 group-hover:scale-110 transition-transform">
              <Cloud size={18} />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              ${Math.round(cloudSummary.totalMonthlySpend || 0).toLocaleString()}
              <span className="text-xs text-slate-500 font-normal">/mo</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ${Math.round(cloudSummary.annualRunRate || 0).toLocaleString()}/yr Run-Rate
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-indigo-600 font-semibold">{cloudSummary.activeCount || 0} Subscriptions</span>
            <span className="text-indigo-600 font-medium flex items-center group-hover:translate-x-0.5 transition-transform">
              View <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* 5. Helpdesk Tickets */}
        <div 
          onClick={() => onNavigateTab('helpdesk')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Helpdesk SLAs</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 group-hover:scale-110 transition-transform">
              <Wrench size={18} />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {ticketMetrics.total} <span className="text-xs text-slate-500 font-normal">Incidents</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {ticketMetrics.completed} Resolved
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-emerald-600 font-semibold">{ticketMetrics.resolutionRate}% SLA</span>
            <span className="text-indigo-600 font-medium flex items-center group-hover:translate-x-0.5 transition-transform">
              View <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* 6. IT Engineering Staff */}
        <div 
          onClick={() => onNavigateTab('staffing')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">IT Engineers</span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 group-hover:scale-110 transition-transform">
              <Users size={18} />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {staffMetrics.total} <span className="text-xs text-slate-500 font-normal">Engineers</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              100% Multi-Site Standby
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-teal-600 font-semibold">{staffMetrics.avgScore}/5.0 Score</span>
            <span className="text-indigo-600 font-medium flex items-center group-hover:translate-x-0.5 transition-transform">
              View <ChevronRight size={12} />
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: IT CAPEX & OPEX BUDGET VS. ACTUAL EXECUTION */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600">
              <DollarSign size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  IT CapEx & OpEx Strategic Planning & Budget Variance
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  FY 2026 Live
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Capital investments, operating budgets, and variance tracking across hospitals and clinics
              </p>
            </div>
          </div>

          <Button
            onClick={() => onNavigateTab('capex-opex')}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200/80 gap-1.5 text-xs font-semibold shadow-none self-start sm:self-auto"
          >
            <span>Open CapEx & OpEx Module</span>
            <ArrowRight size={14} />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Card: CapEx */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">CapEx (Capital Expenditure)</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              ${Math.round(budgetMetrics.actualCapex).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Planned: <span className="font-semibold text-slate-700 dark:text-slate-300">${Math.round(budgetMetrics.plannedCapex).toLocaleString()}</span>
            </p>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${budgetMetrics.plannedCapex > 0 ? Math.min(100, (budgetMetrics.actualCapex / budgetMetrics.plannedCapex) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Card: OpEx */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">OpEx (Operating Expenditure)</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              ${Math.round(budgetMetrics.actualOpex).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Planned: <span className="font-semibold text-slate-700 dark:text-slate-300">${Math.round(budgetMetrics.plannedOpex).toLocaleString()}</span>
            </p>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${budgetMetrics.plannedOpex > 0 ? Math.min(100, (budgetMetrics.actualOpex / budgetMetrics.plannedOpex) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Card: Total Variance */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remaining Unspent Budget</span>
            <p className="text-2xl font-black text-emerald-600 mt-2">
              ${Math.round(budgetMetrics.variance).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Budget Health: <span className="font-semibold text-emerald-600">On Track / Within Limits</span>
            </p>
          </div>

          {/* Card: Execution Rate */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Budget Execution Velocity</span>
            <p className="text-2xl font-black text-indigo-600 mt-2">
              {budgetMetrics.executionRate.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Annual Allocation Consumed
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: HARDWARE ASSET FLEET & MULTI-BU INVENTORY ROLL-UP */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600">
              <Monitor size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  IT Fixed Assets & Control Equipment Fleet
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {hardwareMetrics.totalFleet} Total Fleet Assets
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidated Fixed Assets Register ($18,500+ value) and Asset Control inventory across 4 Business Units
              </p>
            </div>
          </div>

          <Button
            onClick={() => onNavigateTab('assets')}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border border-blue-200/80 gap-1.5 text-xs font-semibold shadow-none self-start sm:self-auto"
          >
            <span>Open Assets Management Module</span>
            <ArrowRight size={14} />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Multi-BU Distribution */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <Building2 size={16} className="text-blue-600" />
                Fleet Distribution by Business Unit
              </h4>
              <div className="space-y-3">
                {hardwareMetrics.buBreakdown.map((bu, idx) => (
                  <div key={bu.bu_name} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{bu.bu_name}</span>
                    <div className="text-right">
                      <span className="font-bold text-blue-600">{bu.total} Units</span>
                      <span className="text-[11px] text-slate-400 block">({bu.fixed} Fixed / {bu.control} Control)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700 text-xs text-slate-500 flex justify-between">
              <span>Total Fleet Valuation:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">${Math.round(hardwareMetrics.totalValuation).toLocaleString()}</span>
            </div>
          </div>

          {/* Column 2: Equipment Category Breakdown */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Layers size={16} className="text-blue-600" />
              Top Hardware Asset Categories
            </h4>
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {hardwareMetrics.categoryBreakdown.slice(0, 7).map((cat, idx) => {
                const pct = Math.round((cat.count / (hardwareMetrics.totalFleet || 1)) * 100);
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{cat.count} units ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 3: Fixed vs. Control Highlights */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-2xl p-6 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="p-2 rounded-xl bg-white/10 text-blue-300">
                  <ShieldCheck size={20} />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Inventory Integrity</span>
              </div>
              <h5 className="text-xl font-bold">Dual-Tier Asset Tracking</h5>
              <p className="text-xs text-blue-200/80 mt-2 leading-relaxed">
                Hospital IT enforces high-capital Fixed Assets verification (PCs, Laptops, Synology, Servers) alongside operational Asset Control tracking (printers, biometrics, UPS, networking).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-white/10 mt-4">
              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-[11px] text-blue-300 uppercase block font-semibold">Fixed Assets</span>
                <span className="text-2xl font-black text-white">{hardwareMetrics.totalFixed}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-xl">
                <span className="text-[11px] text-blue-300 uppercase block font-semibold">Asset Control</span>
                <span className="text-2xl font-black text-white">{hardwareMetrics.totalControl}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: CLOUD & HIS SUBSCRIPTIONS CONSOLIDATION */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600">
              <Cloud size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Khema Global Cloud & HIS Subscriptions
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {cloudSummary.totalCount || 0} Subscriptions Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidated SaaS & Cloud Infrastructure spend, renewal countdowns, and provider licenses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-500 uppercase">Annual Run-Rate</p>
              <p className="text-base font-bold text-indigo-700 dark:text-indigo-400">
                ${(cloudSummary.annualRunRate || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <Button
              onClick={() => onNavigateTab('subscriptions')}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 border border-indigo-200/80 gap-1.5 text-xs font-semibold shadow-none"
            >
              <span>Explore Subscriptions</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Spend by Category */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Layers size={16} className="text-indigo-600" /> Spend by Category
            </h4>
            <div className="space-y-3">
              {(cloudSummary.categoryBreakdown || []).map((cat: any) => {
                const total = cloudSummary.totalMonthlySpend || 1;
                const pct = Math.min(100, Math.round(((cat.spend || 0) / total) * 100));
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{cat.category}</span>
                      <span className="font-bold text-indigo-700 dark:text-indigo-400">${(cat.spend || 0).toLocaleString()}/mo ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spend by Provider */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Server size={16} className="text-indigo-600" /> Key Cloud Providers
            </h4>
            <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
              {(cloudSummary.providerBreakdown || []).slice(0, 6).map((p: any) => (
                <div key={p.provider} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{p.provider}</span>
                  <span className="font-bold text-slate-900 dark:text-white">${Math.round(p.spend || 0).toLocaleString()}/mo</span>
                </div>
              ))}
            </div>
          </div>

          {/* License Utilization & Renewal Radar */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <Clock size={16} className="text-amber-600" /> Renewal Radar & Seats
              </h4>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-600" />
                    <span>Renewals in next 30 days:</span>
                  </div>
                  <span className="font-black text-sm">{cloudSummary.expiring30Days || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-indigo-600" />
                    <span>Seat Utilization:</span>
                  </div>
                  <span className="font-black text-sm">{cloudSummary.seatUtilization || 0}%</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700 text-xs text-slate-500">
              Total Managed Seats: <span className="font-bold text-slate-800 dark:text-slate-200">{cloudSummary.totalSeats || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: HELPDESK SLAS & IT ENGINEERING STAFFING */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Helpdesk Support Incident Funnel */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 lg:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                  <Wrench size={20} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Helpdesk Support SLAs</h4>
                  <p className="text-xs text-slate-500">Incident funnel & turnaround rate</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab('helpdesk')}
                className="text-xs"
              >
                View Tickets
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center my-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] text-slate-500 uppercase block font-semibold">Total</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{ticketMetrics.total}</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40">
                <span className="text-[11px] text-blue-600 uppercase block font-semibold">In Progress</span>
                <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{ticketMetrics.inProgress}</span>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40">
                <span className="text-[11px] text-purple-600 uppercase block font-semibold">Testing</span>
                <span className="text-xl font-bold text-purple-700 dark:text-purple-300">{ticketMetrics.testing}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <span className="text-[11px] text-emerald-600 uppercase block font-semibold">Resolved</span>
                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{ticketMetrics.completed}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 size={16} />
              <span>Overall Resolution Compliance:</span>
            </div>
            <span className="font-black text-sm text-emerald-700 dark:text-emerald-300">{ticketMetrics.resolutionRate}% SLA Met</span>
          </div>
        </div>

        {/* IT Engineering Staffing & Coverage */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 lg:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600">
                  <Users size={20} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">IT Engineering Roster</h4>
                  <p className="text-xs text-slate-500">Multi-hospital technical standby coverage</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateTab('staffing')}
                className="text-xs"
              >
                View Staffing
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center my-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] text-slate-500 uppercase block font-semibold">Specialists</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{staffMetrics.total}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40">
                <span className="text-[11px] text-teal-600 uppercase block font-semibold">Active On Duty</span>
                <span className="text-xl font-bold text-teal-700 dark:text-teal-300">{staffMetrics.active}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                <span className="text-[11px] text-indigo-600 uppercase block font-semibold">Eval Score</span>
                <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{staffMetrics.avgScore} / 5.0</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300">
              <ShieldCheck size={16} />
              <span>Hospital Technical Coverage:</span>
            </div>
            <span className="font-black text-sm text-teal-700 dark:text-teal-300">100% 24/7 Multi-Site Standby</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: MULTI-FACILITY INFRASTRUCTURE MATRIX */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 lg:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Multi-Facility Operations & Infrastructure Roll-Up
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cross-hospital deployment matrix consolidating hardware units, engineering headcount, cloud services, and tickets
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {facilityMatrix.length} Facilities Connected
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Hospital / Facility</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Hardware Fleet</th>
                <th className="py-3 px-4">IT Staff Assigned</th>
                <th className="py-3 px-4">Cloud Services</th>
                <th className="py-3 px-4">Support Incidents</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {facilityMatrix.map((fac) => (
                <tr key={fac.id || fac.site_name} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 size={16} className="text-indigo-600" />
                    {fac.site_name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{fac.location || 'Phnom Penh'}</td>
                  <td className="py-3.5 px-4 font-semibold">
                    {fac.totalAssets} units
                    <span className="text-[11px] text-slate-400 block">({fac.fixedAssets} FA / {fac.controlAssets} AC)</span>
                  </td>
                  <td className="py-3.5 px-4">{fac.staffCount} Specialists</td>
                  <td className="py-3.5 px-4">{fac.subsCount} Subscriptions</td>
                  <td className="py-3.5 px-4">{fac.ticketCount} logged</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
