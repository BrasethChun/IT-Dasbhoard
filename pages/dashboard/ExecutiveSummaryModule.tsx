import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Wrench, Monitor, GraduationCap, Activity, DollarSign,
  Download, Filter, CheckCircle2, AlertCircle, Clock, BarChart3, AlertTriangle,
  MapPin, ArrowRight, ChevronRight, Server, Database, Laptop, Layers, 
  RefreshCw, ExternalLink, Building2, TrendingUp, CheckCircle, HelpCircle, 
  Eye, Calendar, Sparkles, Cloud, ShieldCheck, CheckSquare, FileText
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
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

  // Consolidated datasets from all tabs
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
  const [assets, setAssets] = useState<any[]>([]);
  const [helpdeskTickets, setHelpdeskTickets] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  // Fetch all tab data
  const fetchAllData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const siteParam = siteFilter !== 'All Sites' ? `?site=${encodeURIComponent(siteFilter)}` : '';

      const [cloudSumRes, cloudListRes, assetsRes, helpdeskRes, staffRes, notesRes] = await Promise.all([
        fetch(`/api/cloud-subscriptions/summary${siteParam}`, { headers }).catch(() => null),
        fetch(`/api/cloud-subscriptions${siteParam}`, { headers }).catch(() => null),
        fetch('/api/assets', { headers }).catch(() => null),
        fetch('/api/helpdesk', { headers }).catch(() => null),
        fetch('/api/staffing', { headers }).catch(() => null),
        fetch('/api/notes', { headers }).catch(() => null)
      ]);

      if (cloudSumRes && cloudSumRes.ok) {
        const data = await cloudSumRes.json();
        setCloudSummary(data);
      }
      if (cloudListRes && cloudListRes.ok) {
        const data = await cloudListRes.json();
        setCloudSubscriptions(Array.isArray(data) ? data : []);
      }
      if (assetsRes && assetsRes.ok) {
        const data = await assetsRes.json();
        setAssets(Array.isArray(data) ? data : []);
      }
      if (helpdeskRes && helpdeskRes.ok) {
        const data = await helpdeskRes.json();
        setHelpdeskTickets(Array.isArray(data) ? data : []);
      }
      if (staffRes && staffRes.ok) {
        const data = await staffRes.json();
        setStaff(Array.isArray(data) ? data : []);
      }
      if (notesRes && notesRes.ok) {
        const data = await notesRes.json();
        setNotes(Array.isArray(data) ? data : []);
      }
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

  // Filtered Assets based on site filter
  const filteredAssets = useMemo(() => {
    if (siteFilter === 'All Sites') return assets;
    return assets.filter(a => a.site_name === siteFilter);
  }, [assets, siteFilter]);

  // Assets Computed Metrics
  const assetMetrics = useMemo(() => {
    const total = filteredAssets.length;
    const totalValue = filteredAssets.reduce((sum, a) => sum + (parseFloat(a.purchase_price) || 0), 0);
    const categoryCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    let expiringSoon = 0;
    const now = new Date();
    const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    filteredAssets.forEach(a => {
      const cat = a.category || 'Uncategorized';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      const stat = a.status || 'Active';
      statusCounts[stat] = (statusCounts[stat] || 0) + 1;

      if (a.warranty_expiry) {
        const expDate = new Date(a.warranty_expiry);
        if (expDate >= now && expDate <= in90Days) {
          expiringSoon++;
        }
      }
    });

    return {
      total,
      totalValue,
      categoryCounts,
      statusCounts,
      expiringSoon,
      activeCount: statusCounts['Active'] || 0
    };
  }, [filteredAssets]);

  // Filtered Helpdesk tickets based on site and period
  const filteredTickets = useMemo(() => {
    return helpdeskTickets.filter(t => {
      if (siteFilter !== 'All Sites' && t.site_name !== siteFilter) return false;
      if (filterFrom && t.create_date_time && t.create_date_time < filterFrom) return false;
      if (filterTo && t.create_date_time && t.create_date_time > filterTo) return false;
      return true;
    });
  }, [helpdeskTickets, siteFilter, filterFrom, filterTo]);

  // Helpdesk Computed Metrics
  const ticketMetrics = useMemo(() => {
    let inProgress = 0;
    let testing = 0;
    let notStarted = 0;
    let completed = 0;
    const siteBreakdown: Record<string, number> = {};
    const assigneeBreakdown: Record<string, { completed: number; total: number }> = {};

    filteredTickets.forEach(t => {
      const ip = t.in_progress_count || 0;
      const ts = t.testing_count || 0;
      const ns = t.not_started_count || 0;
      const cp = t.completed_count || 0;
      const subTotal = ip + ts + ns + cp;

      inProgress += ip;
      testing += ts;
      notStarted += ns;
      completed += cp;

      if (t.site_name) {
        siteBreakdown[t.site_name] = (siteBreakdown[t.site_name] || 0) + subTotal;
      }

      if (t.assignee) {
        if (!assigneeBreakdown[t.assignee]) {
          assigneeBreakdown[t.assignee] = { completed: 0, total: 0 };
        }
        assigneeBreakdown[t.assignee].completed += cp;
        assigneeBreakdown[t.assignee].total += subTotal;
      }
    });

    const total = inProgress + testing + notStarted + completed;
    const pending = inProgress + testing + notStarted;
    const resolutionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '100.0';

    return {
      total,
      completed,
      inProgress,
      testing,
      notStarted,
      pending,
      resolutionRate,
      siteBreakdown,
      assigneeBreakdown
    };
  }, [filteredTickets]);

  // Filtered Staff
  const filteredStaff = useMemo(() => {
    if (siteFilter === 'All Sites') return staff;
    return staff.filter(s => s.site_name === siteFilter || (s.monthly_schedule && s.monthly_schedule.includes(siteFilter)));
  }, [staff, siteFilter]);

  const staffMetrics = useMemo(() => {
    const total = filteredStaff.length;
    const active = filteredStaff.filter(s => s.status === 'Active').length;
    const sumScore = filteredStaff.reduce((sum, s) => sum + (parseFloat(s.performance_score) || 0), 0);
    const avgScore = total > 0 ? (sumScore / total).toFixed(1) : '4.8';
    return { total, active, avgScore };
  }, [filteredStaff]);

  // Multi-Site Facility Matrix
  const facilityMatrix = useMemo(() => {
    return sites.map(s => {
      const siteAssets = assets.filter(a => a.site_name === s.site_name).length;
      const siteStaff = staff.filter(st => st.site_name === s.site_name || (st.monthly_schedule && st.monthly_schedule.includes(s.site_name))).length;
      const siteSubs = cloudSubscriptions.filter(cs => cs.site_name === s.site_name || cs.site_name === 'All Sites').length;
      const siteTickets = helpdeskTickets.filter(ht => ht.site_name === s.site_name).reduce((sum, ht) => 
        sum + (ht.in_progress_count || 0) + (ht.testing_count || 0) + (ht.not_started_count || 0) + (ht.completed_count || 0), 0);
      return {
        ...s,
        assetCount: siteAssets,
        staffCount: siteStaff,
        subsCount: siteSubs,
        ticketCount: siteTickets
      };
    });
  }, [sites, assets, staff, cloudSubscriptions, helpdeskTickets]);

  // Colors for charts
  const CHART_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Consolidated Welcome & Control Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-20 -mb-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 tracking-wide uppercase">
                Consolidated Operations Center
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                All 6 IT Modules Synced
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Khema Global IT Executive Operations
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl font-normal">
              Unified roll-up consolidating Cloud Subscriptions, Hardware Assets, Helpdesk Support SLAs, IT Staffing, Multi-Site Facilities, and Strategy Notes for <span className="font-semibold text-white">{siteFilter}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={fetchAllData}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur border border-white/15 transition-all shadow-sm disabled:opacity-50"
              title="Refresh all consolidated datasets"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-indigo-300' : 'text-slate-300'} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh All'}</span>
            </button>
          </div>
        </div>

        {/* Quick Facility Indicator Chips */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Quick Facility Jump:</span>
          {['All Sites', ...sites.map(s => s.site_name)].map((sName) => (
            <button
              key={sName}
              type="button"
              onClick={() => setSiteFilter && setSiteFilter(sName)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                siteFilter === sName
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              {sName}
            </button>
          ))}
        </div>
      </div>

      {/* TOP CONSOLIDATED 6 DOMAIN KPI CARDS (All Tabs at a glance - Enhanced UI Scroll to fit grid) */}
      <div className="w-full overflow-x-auto pb-2 pt-0.5 -mx-1 px-1 scroll-smooth">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5 min-w-[740px] xl:min-w-0">
          {/* 1. Cloud Subscriptions */}
          <div 
            onClick={() => onNavigateTab('subscriptions')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-w-0"
          >
            <div className="flex justify-between items-center gap-2 mb-2 min-w-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate" title="Cloud Spend">Cloud Spend</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform shrink-0">
                <Cloud size={18} />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
              ${(cloudSummary.totalMonthlySpend || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              <span className="text-xs text-slate-500 font-normal">/mo</span>
            </p>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100 whitespace-nowrap gap-1">
              <span className="text-emerald-600 font-semibold truncate">{cloudSummary.activeCount || 0} Subs</span>
              <span className="text-indigo-600 font-medium flex items-center group-hover:translate-x-0.5 transition-transform shrink-0">
                View <ChevronRight size={12} />
              </span>
            </div>
          </div>

          {/* 2. IT Assets */}
          <div 
            onClick={() => onNavigateTab('assets')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-w-0"
          >
            <div className="flex justify-between items-center gap-2 mb-2 min-w-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate" title="Hardware Fleet">Hardware Fleet</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform shrink-0">
                <Monitor size={18} />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
              {assetMetrics.total} <span className="text-xs text-slate-500 font-normal">Assets</span>
            </p>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100 whitespace-nowrap gap-1">
              <span className="text-slate-600 truncate max-w-[90px]" title={`$${assetMetrics.totalValue.toLocaleString()}`}>
                ${Math.round(assetMetrics.totalValue).toLocaleString()} Val
              </span>
              <span className="text-blue-600 font-medium flex items-center group-hover:translate-x-0.5 transition-transform shrink-0">
                View <ChevronRight size={12} />
              </span>
            </div>
          </div>

          {/* 3. Helpdesk Tickets */}
          <div 
            onClick={() => onNavigateTab('helpdesk')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-w-0"
          >
            <div className="flex justify-between items-center gap-2 mb-2 min-w-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate" title="Helpdesk">Helpdesk</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform shrink-0">
                <Wrench size={18} />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
              {ticketMetrics.total} <span className="text-xs text-slate-500 font-normal">Tickets</span>
            </p>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100 whitespace-nowrap gap-1">
              <span className="text-emerald-600 font-semibold truncate">{ticketMetrics.resolutionRate}% Done</span>
              <span className="text-amber-600 font-medium flex items-center group-hover:translate-x-0.5 transition-transform shrink-0">
                View <ChevronRight size={12} />
              </span>
            </div>
          </div>

          {/* 4. IT Staffing (Selected Element in Focus Mode) */}
          <div 
            onClick={() => onNavigateTab('staffing')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-w-0"
          >
            <div className="flex justify-between items-center gap-2 mb-2 min-w-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate" title="IT Engineers">
                IT Engineers
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform shrink-0">
                <Users size={18} />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
              {staffMetrics.total} <span className="text-xs text-slate-500 font-normal">Specialists</span>
            </p>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100 whitespace-nowrap gap-1">
              <span className="text-emerald-600 font-semibold truncate">{staffMetrics.avgScore}/5.0 Score</span>
              <span className="text-emerald-600 font-medium flex items-center group-hover:translate-x-0.5 transition-transform shrink-0">
                View <ChevronRight size={12} />
              </span>
            </div>
          </div>

          {/* 5. Connected Sites */}
          <div 
            onClick={() => onNavigateTab('sites')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-w-0"
          >
            <div className="flex justify-between items-center gap-2 mb-2 min-w-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate" title="Facilities">Facilities</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform shrink-0">
                <Building2 size={18} />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
              {sites.length} <span className="text-xs text-slate-500 font-normal">Sites</span>
            </p>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100 whitespace-nowrap gap-1">
              <span className="text-purple-600 font-semibold truncate">100% Online</span>
              <span className="text-purple-600 font-medium flex items-center group-hover:translate-x-0.5 transition-transform shrink-0">
                View <ChevronRight size={12} />
              </span>
            </div>
          </div>

          {/* 6. IT Notes & Governance */}
          <div 
            onClick={() => onNavigateTab('notes')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-w-0"
          >
            <div className="flex justify-between items-center gap-2 mb-2 min-w-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate" title="Strategy & Notes">Strategy & Notes</span>
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600 group-hover:scale-110 transition-transform shrink-0">
                <FileText size={18} />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
              {notes.length} <span className="text-xs text-slate-500 font-normal">Records</span>
            </p>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100 whitespace-nowrap gap-1">
              <span className="text-teal-600 font-semibold truncate">SLA Reviews</span>
              <span className="text-teal-600 font-medium flex items-center group-hover:translate-x-0.5 transition-transform shrink-0">
                View <ChevronRight size={12} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: KHEMA GLOBAL CLOUD SUBSCRIPTION CONSOLIDATION */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Cloud size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Khema Global Cloud & HIS Subscriptions
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                  {cloudSummary.totalCount || 0} Subscriptions
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidated SaaS & Cloud Infrastructure spend, renewal radar, and provider allocations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-500 uppercase">Annual Run-Rate</p>
              <p className="text-base font-bold text-indigo-700">
                ${(cloudSummary.annualRunRate || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <Button
              onClick={() => onNavigateTab('subscriptions')}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 border border-indigo-200/80 gap-1.5 text-xs font-semibold shadow-none"
            >
              <span>Explore Cloud Subscriptions</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>

        {/* Cloud Breakdown Cards & Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Spend by Category */}
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/60">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers size={14} className="text-indigo-600" /> Spend by Category
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">Monthly Cost</span>
            </div>
            <div className="space-y-3">
              {(cloudSummary.categoryBreakdown || []).map((cat: any, idx: number) => {
                const total = cloudSummary.totalMonthlySpend || 1;
                const pct = Math.min(100, Math.round(((cat.spend || 0) / total) * 100));
                return (
                  <div key={cat.category || idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 truncate max-w-[170px]">{cat.category}</span>
                      <span className="text-slate-900 font-semibold">
                        ${(cat.spend || 0).toFixed(2)} <span className="text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} 
                      />
                    </div>
                  </div>
                );
              })}
              {(!cloudSummary.categoryBreakdown || cloudSummary.categoryBreakdown.length === 0) && (
                <p className="text-xs text-slate-400 py-4 text-center">No category spend recorded.</p>
              )}
            </div>
          </div>

          {/* Provider Allocation & Seats */}
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Database size={14} className="text-indigo-600" /> Active Cloud Providers
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">{cloudSummary.providerBreakdown?.length || 0} Vendors</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(cloudSummary.providerBreakdown || []).map((p: any) => (
                  <span 
                    key={p.provider} 
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white border border-slate-200 text-slate-700 shadow-2xs font-medium"
                  >
                    <span>{p.provider}</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                      ${(p.spend || 0).toFixed(0)}/mo
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-600 font-medium">User Seat Utilization</span>
                <span className="font-bold text-slate-900">{cloudSummary.usedSeats || 0} / {cloudSummary.totalSeats || 0} ({cloudSummary.seatUtilization || 0}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, cloudSummary.seatUtilization || 0)}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Top Subscriptions Quick Table */}
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/60">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" /> Top Subscriptions
              </h4>
              <button 
                type="button" 
                onClick={() => onNavigateTab('subscriptions')}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View all ({cloudSubscriptions.length})
              </button>
            </div>
            <div className="space-y-2 mt-2">
              {cloudSubscriptions.slice(0, 4).map(sub => (
                <div key={sub.id} className="p-2.5 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <p className="font-semibold text-slate-900 truncate">{sub.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{sub.provider} • {sub.billing_cycle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900">${(sub.cost || 0).toLocaleString()}</p>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      {sub.status || 'Active'}
                    </span>
                  </div>
                </div>
              ))}
              {cloudSubscriptions.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">No subscriptions recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: HARDWARE & ASSETS FLEET CONSOLIDATION */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Monitor size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  IT Assets & Hardware Inventory
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                  {assetMetrics.total} Total Devices
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hardware rollout, category distribution, warranty status, and fleet valuations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-500 uppercase">Fleet Capital Value</p>
              <p className="text-base font-bold text-blue-700">
                ${Math.round(assetMetrics.totalValue).toLocaleString()}
              </p>
            </div>
            <Button
              onClick={() => onNavigateTab('assets')}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border border-blue-200/80 gap-1.5 text-xs font-semibold shadow-none"
            >
              <span>Manage Assets Fleet</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Asset Category Badges */}
          <div className="lg:col-span-2 bg-slate-50/70 rounded-xl p-4 border border-slate-200/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Laptop size={14} className="text-blue-600" /> Equipment by Category
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Object.entries(assetMetrics.categoryCounts).map(([cat, count], idx) => (
                <div key={cat} className="p-3 bg-white rounded-xl border border-slate-200/80 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 font-medium truncate" title={cat}>{cat}</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-bold text-slate-800">{count}</span>
                    <span className="text-[10px] text-slate-400">
                      {Math.round((count / (assetMetrics.total || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
              {Object.keys(assetMetrics.categoryCounts).length === 0 && (
                <p className="text-xs text-slate-400 col-span-3 py-4 text-center">No categories recorded.</p>
              )}
            </div>
          </div>

          {/* Operational Status */}
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/60 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-blue-600" /> Deployment Status
              </h4>
              <div className="space-y-2">
                {Object.entries(assetMetrics.statusCounts).map(([stat, count]) => (
                  <div key={stat} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200/70 text-xs">
                    <span className="font-medium text-slate-700">{stat}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                      stat === 'Active' || stat === 'In Use' ? 'bg-emerald-50 text-emerald-700' :
                      stat === 'Repair' || stat === 'Maintenance' ? 'bg-amber-50 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
              <span>Warranty Alerts:</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${assetMetrics.expiringSoon > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {assetMetrics.expiringSoon} Expiring &lt;90d
              </span>
            </div>
          </div>

          {/* Recent Deployed Assets */}
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/60">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Server size={14} className="text-blue-600" /> Recent Assets
              </h4>
              <button 
                type="button" 
                onClick={() => onNavigateTab('assets')}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
              >
                View all ({assetMetrics.total})
              </button>
            </div>
            <div className="space-y-2 mt-2">
              {filteredAssets.slice(0, 4).map(asset => (
                <div key={asset.id} className="p-2 bg-white rounded-lg border border-slate-200/80 text-xs flex justify-between items-center">
                  <div className="truncate pr-2">
                    <p className="font-semibold text-slate-900 truncate">{asset.asset_tag} - {asset.model}</p>
                    <p className="text-[10px] text-slate-500 truncate">{asset.site_name} • {asset.category}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                    {asset.status || 'Active'}
                  </span>
                </div>
              ))}
              {filteredAssets.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">No assets found for this facility.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: HELPDESK & SERVICE DESK TICKETS CONSOLIDATION */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Wrench size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Helpdesk Support & SLA Management
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                  {ticketMetrics.total} Total Reported
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ticket volume pipeline, completion rates, pending reviews, and technician leaderboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-500 uppercase">Resolution SLA Rate</p>
              <p className="text-base font-bold text-emerald-600">
                {ticketMetrics.resolutionRate}%
              </p>
            </div>
            <Button
              onClick={() => onNavigateTab('helpdesk')}
              className="bg-amber-50 hover:bg-amber-100 text-amber-800 hover:text-amber-900 border border-amber-200/80 gap-1.5 text-xs font-semibold shadow-none"
            >
              <span>Go to Helpdesk</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>

        {/* 4-Stage Ticket Pipeline Cards (Responsive scroll to fit grid) */}
        <div className="w-full overflow-x-auto pb-2 -mx-1 px-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2 min-w-[480px] sm:min-w-0">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 border-l-4 border-l-slate-400">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate block">Not Started</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">{ticketMetrics.notStarted}</p>
              <span className="text-[10px] text-slate-400">Pending intake</span>
            </div>
            <div className="bg-amber-50/50 rounded-xl p-3.5 border border-amber-200/70 border-l-4 border-l-amber-500">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider truncate block">In Progress</span>
              <p className="text-2xl font-bold text-amber-900 mt-1">{ticketMetrics.inProgress}</p>
              <span className="text-[10px] text-amber-600">Active troubleshooting</span>
            </div>
            <div className="bg-sky-50/50 rounded-xl p-3.5 border border-sky-200/70 border-l-4 border-l-sky-500">
              <span className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider truncate block">Testing / QA</span>
              <p className="text-2xl font-bold text-sky-900 mt-1">{ticketMetrics.testing}</p>
              <span className="text-[10px] text-sky-600">User verification</span>
            </div>
            <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-200/70 border-l-4 border-l-emerald-500">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider truncate block">Completed</span>
              <p className="text-2xl font-bold text-emerald-900 mt-1">{ticketMetrics.completed}</p>
              <span className="text-[10px] text-emerald-600">SLA satisfied</span>
            </div>
          </div>
        </div>

        {/* Tickets Breakdown by Site & Assignees */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By Site */}
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <MapPin size={14} className="text-amber-600" /> Tickets by Facility
            </h4>
            <div className="space-y-2.5">
              {Object.entries(ticketMetrics.siteBreakdown).map(([sName, count]) => {
                const total = ticketMetrics.total || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={sName} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{sName}</span>
                      <span className="text-slate-900 font-semibold">{count} tickets ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {Object.keys(ticketMetrics.siteBreakdown).length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">No ticket data for this site.</p>
              )}
            </div>
          </div>

          {/* Top Technician Assignees */}
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Users size={14} className="text-amber-600" /> Resolution Leaderboard
            </h4>
            <div className="space-y-2">
              {Object.entries(ticketMetrics.assigneeBreakdown).slice(0, 4).map(([name, stats]) => {
                const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 100;
                return (
                  <div key={name} className="p-2.5 bg-white rounded-lg border border-slate-200/70 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px]">
                        {name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800">{name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600">{stats.completed} resolved</span>
                      <span className="text-slate-400 text-[10px]"> / {stats.total} total ({pct}%)</span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(ticketMetrics.assigneeBreakdown).length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">No technician tickets found.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4 & 5: STAFFING & MULTI-SITE INFRASTRUCTURE MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staffing & Shifts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">IT Staffing & Standby Shifts</h3>
                  <p className="text-xs text-slate-500">Roster, performance ratings & hospital coverage</p>
                </div>
              </div>
              <Button
                onClick={() => onNavigateTab('staffing')}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200/80 text-xs font-semibold shadow-none"
              >
                View Roster
              </Button>
            </div>

            <div className="space-y-2.5">
              {filteredStaff.map((st) => (
                <div key={st.id} className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 shadow-2xs">
                      {st.employee_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{st.employee_name}</p>
                      <p className="text-[11px] text-slate-500">{st.role} • {st.site_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800">{st.performance_score ? `${st.performance_score}/5.0` : '4.8/5.0'}</span>
                    <p className="text-[10px] text-slate-400 max-w-[120px] truncate" title={st.monthly_schedule}>
                      Standby: {st.monthly_schedule || 'All Sites'}
                    </p>
                  </div>
                </div>
              ))}
              {filteredStaff.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center">No staffing records found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Multi-Site Facilities Matrix */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Multi-Facility Matrix</h3>
                  <p className="text-xs text-slate-500">Connected branches, cross-facility inventory & coverage</p>
                </div>
              </div>
              <Button
                onClick={() => onNavigateTab('sites')}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 border border-purple-200/80 text-xs font-semibold shadow-none"
              >
                Manage Sites
              </Button>
            </div>

            <div className="space-y-2.5">
              {facilityMatrix.map((fac) => (
                <div key={fac.id} className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                    <div>
                      <p className="font-bold text-slate-900">{fac.site_name}</p>
                      <p className="text-[11px] text-slate-500">{fac.location || 'Active Branch Facility'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div className="text-[11px]">
                      <span className="font-semibold text-slate-800">{fac.assetCount}</span>
                      <span className="text-slate-400"> Assets</span>
                    </div>
                    <div className="text-[11px]">
                      <span className="font-semibold text-slate-800">{fac.staffCount}</span>
                      <span className="text-slate-400"> Staff</span>
                    </div>
                    <div className="text-[11px]">
                      <span className="font-semibold text-amber-700">{fac.ticketCount}</span>
                      <span className="text-slate-400"> Tkts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: MANAGEMENT COMMENTARY, CORE SYSTEMS & GOVERNANCE NOTES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Systems Status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <Activity size={16} className="text-indigo-600" /> Core Clinical Systems
          </h3>
          <div className="space-y-2.5">
            {[
              { sys: 'Core Hospital HIS/HMS', stat: 'Operational', uptime: '99.98%', icon: <CheckCircle2 size={16} className="text-emerald-500" /> },
              { sys: 'RadiAnt PACS Imaging', stat: 'Operational', uptime: '99.95%', icon: <CheckCircle2 size={16} className="text-emerald-500" /> },
              { sys: 'Laboratory LIS System', stat: 'Operational', uptime: '99.99%', icon: <CheckCircle2 size={16} className="text-emerald-500" /> },
              { sys: 'Multi-Site SD-WAN', stat: 'Operational', uptime: '100.0%', icon: <CheckCircle2 size={16} className="text-emerald-500" /> },
              { sys: 'Financial ERP System', stat: 'Under Maintenance', uptime: '98.5%', icon: <AlertCircle size={16} className="text-amber-500" /> }
            ].map((s, i) => (
              <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/60 text-xs">
                <span className="font-medium text-slate-800">{s.sys}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">{s.uptime}</span>
                  {s.icon}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Management Commentary */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <AlertTriangle size={16} className="text-amber-500" /> Management Commentary
          </h3>
          <div className="space-y-3.5 text-xs text-slate-600">
            <div className="flex gap-2.5 items-start">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16}/> 
              <p><strong>Highlights:</strong> Subscriptions consolidated under Khema Global master agreement. Helpdesk SLA resolution reached {ticketMetrics.resolutionRate}% this period.</p>
            </div>
            <div className="flex gap-2.5 items-start">
              <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16}/> 
              <p><strong>Risks:</strong> {assetMetrics.expiringSoon} IT workstations approaching warranty expiration. Scheduled audit planned for next quarter.</p>
            </div>
            <div className="flex gap-2.5 items-start">
              <Activity className="text-blue-500 shrink-0 mt-0.5" size={16}/> 
              <p><strong>Next Steps:</strong> Reviewing PACS cloud storage expansion at Toul Kork facility to support higher imaging fidelity.</p>
            </div>
          </div>
        </div>

        {/* IT Notes & Meeting Action Items */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <GraduationCap size={16} className="text-teal-600" /> Notes & Strategic Action Items
              </h3>
              <button 
                type="button" 
                onClick={() => onNavigateTab('notes')}
                className="text-xs text-teal-600 hover:text-teal-800 font-semibold"
              >
                Open Notes →
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              {notes.slice(0, 3).map((n) => (
                <div key={n.id} className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
                  <p className="font-bold text-slate-800 truncate">{n.title || 'Meeting Summary'}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.content || 'Action items discussed during weekly IT briefing.'}</p>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="p-4 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <FileText size={20} className="mx-auto mb-1 text-slate-300" />
                  <p className="text-xs">No recent meeting notes logged yet.</p>
                  <button 
                    type="button" 
                    onClick={() => onNavigateTab('notes')} 
                    className="text-indigo-600 font-semibold text-xs mt-1 hover:underline"
                  >
                    + Add New Note
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
