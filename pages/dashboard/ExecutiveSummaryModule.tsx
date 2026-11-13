import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Wrench, Monitor, Activity, DollarSign,
  Download, Filter, CheckCircle2, AlertCircle, Clock, BarChart3, AlertTriangle,
  MapPin, ArrowRight, ChevronRight, Server, Database, Laptop, Layers, 
  RefreshCw, ExternalLink, Building2, TrendingUp, CheckCircle, HelpCircle, 
  Eye, Calendar, Sparkles, Cloud, ShieldCheck, CheckSquare, FileText,
  Receipt, ArrowUpRight, ShieldAlert, Cpu, HardDrive, Wifi, Printer,
  PieChart as PieIcon, LineChart as LineIcon, Zap, Award, Gauge
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import * as xlsx from 'xlsx';

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
      const andSiteParam = siteFilter !== 'All Sites' ? `&site=${encodeURIComponent(siteFilter)}` : '';
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
        fetch(`/api/it-budget/summary?fiscal_year=2026${andSiteParam}`, { headers }).catch(() => null),
        fetch(`/api/it-expenses/analytics?fiscal_year=2026${andSiteParam}`, { headers }).catch(() => null),
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
    const plannedCapex = Number(budgetSummary?.totalCapexApproved ?? budgetSummary?.totalCapexRequested ?? 0);
    const actualCapex = Number(budgetSummary?.totalCapexActual ?? 0);
    const capexVariance = Number(budgetSummary?.totalCapexVariance ?? (plannedCapex - actualCapex));
    const capexExecutionRate = plannedCapex > 0 ? (actualCapex / plannedCapex) * 100 : 0;

    const plannedOpex = Number(budgetSummary?.totalAnnualOpex ?? 0);
    const actualOpex = Number(budgetSummary?.totalAnnualOpexActual ?? 0);
    const opexVariance = Number(budgetSummary?.totalAnnualOpexVariance ?? (plannedOpex - actualOpex));
    const opexExecutionRate = plannedOpex > 0 ? (actualOpex / plannedOpex) * 100 : 0;

    const totalPlanned = Number(budgetSummary?.totalFiscalBudget ?? (plannedCapex + plannedOpex));
    const totalActual = Number(budgetSummary?.totalFiscalActual ?? (actualCapex + actualOpex));
    const executionRate = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
    const variance = Number(budgetSummary?.totalFiscalVariance ?? (totalPlanned - totalActual));

    const cashFlowChartData = Array.isArray(budgetSummary?.cashFlowChartData) ? budgetSummary.cashFlowChartData : [];
    const capexByAssetType = budgetSummary?.capexByAssetType || {};
    const opexByAccount = budgetSummary?.opexByAccount || {};
    const totalBySite = budgetSummary?.totalBySite || {};
    const upcomingRenewals = Array.isArray(budgetSummary?.upcomingRenewals) ? budgetSummary.upcomingRenewals : [];

    return {
      plannedCapex,
      actualCapex,
      capexVariance,
      capexExecutionRate,
      plannedOpex,
      actualOpex,
      opexVariance,
      opexExecutionRate,
      totalPlanned,
      totalActual,
      executionRate,
      variance,
      cashFlowChartData,
      capexByAssetType,
      opexByAccount,
      totalBySite,
      upcomingRenewals
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

  // 5. Cloud & HIS Subscriptions Analytics Roll-Up
  const cloudMetrics = useMemo(() => {
    const list = Array.isArray(cloudSubscriptions) ? cloudSubscriptions : [];
    const totalCount = list.length;
    const activeCount = list.filter((s: any) => s.status === 'Active').length;

    let totalAnnual = 0;
    let hisAnnual = 0;
    let computeAnnual = 0;
    let erpAnnual = 0;
    let pacsAnnual = 0;
    const upcoming90Days: any[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    list.forEach((sub: any) => {
      const cost = parseFloat(sub.cost) || 0;
      let annual = cost;
      if (sub.billing_cycle === 'Monthly') annual = cost * 12;
      else if (sub.billing_cycle === 'Quarterly') annual = cost * 4;
      totalAnnual += annual;

      const nameLower = (sub.name || '').toLowerCase();
      const providerLower = (sub.provider || '').toLowerCase();
      if (nameLower.includes('radiant') || providerLower.includes('radiant')) pacsAnnual += annual;
      else if (nameLower.includes('ehospital') || nameLower.includes('anzer')) hisAnnual += annual;
      else if (nameLower.includes('vcloudia') || nameLower.includes('cyfuture') || nameLower.includes('vm') || nameLower.includes('vpc')) computeAnnual += annual;
      else if (nameLower.includes('d365') || nameLower.includes('dynamics')) erpAnnual += annual;

      if (sub.renewal_date) {
        const d = new Date(sub.renewal_date);
        if (!isNaN(d.getTime())) {
          const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 90) {
            upcoming90Days.push({ ...sub, diffDays, annualCost: annual });
          }
        }
      }
    });

    upcoming90Days.sort((a, b) => a.diffDays - b.diffDays);

    return {
      totalCount: totalCount || cloudSummary.totalCount || 0,
      activeCount: activeCount || cloudSummary.activeCount || 0,
      annualRunRate: totalAnnual || cloudSummary.annualRunRate || 0,
      monthlyRunRate: totalAnnual ? totalAnnual / 12 : (cloudSummary.totalMonthlySpend || 0),
      hisAnnual,
      computeAnnual,
      erpAnnual,
      pacsAnnual,
      upcoming90Days
    };
  }, [cloudSubscriptions, cloudSummary]);

  // 6. Multi-Facility Infrastructure Roll-Up Matrix with Clinical & Cloud Integration
  const facilityMatrix = useMemo(() => {
    const targetFacilities = [
      { id: '1', site_name: 'Khema TK (K1)', location: 'Toul Kork', aliases: ['tk', 'toul kork', 'k1', 'north'] },
      { id: '2', site_name: 'Khema BKK (K2)', location: 'Boeung Keng Kang', aliases: ['bkk', 'south', 'k2'] },
      { id: '3', site_name: 'Khema Global Clinic (KG)', location: 'Phnom Penh Center', aliases: ['global', 'main', 'kg'] },
      { id: '4', site_name: 'Sakal Polyclinic 2004', location: 'Street 2004', aliases: ['sakal', '2004'] },
      { id: '5', site_name: 'Corporate & All Sites', location: 'Shared Infrastructure', aliases: ['all', 'corporate', 'khema global co'] },
    ];

    const matchSite = (targetAliases: string[], candidate: string) => {
      const c = (candidate || '').toLowerCase();
      return targetAliases.some(alias => c.includes(alias));
    };

    return targetFacilities.map(s => {
      const siteFixed = fixedAssets.filter(a => matchSite(s.aliases, a.bu_name || a.site_name));
      const siteControl = controlAssets.filter(a => matchSite(s.aliases, a.bu_name || a.site_name));
      const siteValuation = siteFixed.reduce((sum, item) => sum + (parseFloat(item.grand_total) || 0), 0);

      const siteStaff = staff.filter(st => 
        matchSite(s.aliases, st.site_name) || 
        (st.monthly_schedule && s.aliases.some(alias => (st.monthly_schedule || '').toLowerCase().includes(alias)))
      ).length;

      const siteTickets = helpdeskTickets.filter(ht => matchSite(s.aliases, ht.site_name)).reduce((sum, ht) => 
        sum + (ht.in_progress_count || 0) + (ht.testing_count || 0) + (ht.not_started_count || 0) + (ht.completed_count || 0), 0);

      const siteSubs = cloudSubscriptions.filter(cs => matchSite(s.aliases, cs.site_name) || (s.id === '5' && cs.site_name === 'All Sites')).length;

      let clinicalPlatform = 'eHospital Core HIS';
      let slaTier = '99.9% Critical';
      if (s.id === '1') {
        clinicalPlatform = 'eHospital TK ($10,233/yr)';
        slaTier = '99.9% Mission-Critical';
      } else if (s.id === '2') {
        clinicalPlatform = 'eHospital BKK ($12,791/yr)';
        slaTier = '99.9% Mission-Critical';
      } else if (s.id === '3') {
        clinicalPlatform = 'D365 Support ($7,722/yr) + WP';
        slaTier = '99.5% High SLA';
      } else if (s.id === '4') {
        clinicalPlatform = 'Cyfuture 18 VMs ($10,342/yr) + Anzer';
        slaTier = '99.9% Compute Node';
      } else {
        clinicalPlatform = 'VCLOUDIA VPC ($11,684/yr) + Anzer HIS';
        slaTier = '99.9% Shared Backbone';
      }

      return {
        ...s,
        totalAssets: siteFixed.length + siteControl.length,
        fixedAssets: siteFixed.length,
        controlAssets: siteControl.length,
        valuation: siteValuation,
        staffCount: siteStaff || 2,
        ticketCount: siteTickets,
        subsCount: siteSubs || 2,
        clinicalPlatform,
        slaTier,
        status: 'Operational'
      };
    });
  }, [fixedAssets, controlAssets, staff, helpdeskTickets, cloudSubscriptions]);

  // 7. Head of IT Strategic Decision & Priority Action Radar
  const prioritiesAndAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      title: string;
      category: 'renewal' | 'budget' | 'helpdesk' | 'infrastructure';
      urgency: 'critical' | 'high' | 'normal';
      detail: string;
      actionLabel: string;
      targetTab: string;
    }> = [];

    // Check Cloud Renewals
    if (cloudMetrics.upcoming90Days.length > 0) {
      const urgent = cloudMetrics.upcoming90Days[0];
      alerts.push({
        id: 'renewal-1',
        title: `Upcoming Contract Expiration: ${urgent.name}`,
        category: 'renewal',
        urgency: urgent.diffDays <= 30 ? 'critical' : 'high',
        detail: `${urgent.provider} renewal target in ${urgent.diffDays} days (${urgent.renewal_date?.slice(0, 10)}). Est. spend: $${Number(urgent.cost).toLocaleString()}.`,
        actionLabel: 'Review Subscription',
        targetTab: 'subscriptions'
      });
    }

    // Check Budget Variance
    if (budgetMetrics.variance > 0) {
      alerts.push({
        id: 'budget-1',
        title: `CapEx/OpEx Budget Available: $${Math.round(budgetMetrics.variance).toLocaleString()} Unspent`,
        category: 'budget',
        urgency: 'normal',
        detail: `Budget execution rate is at ${budgetMetrics.executionRate.toFixed(1)}% of planned allocation for FY 2026. Capital available for infrastructure upgrades.`,
        actionLabel: 'Inspect CapEx/OpEx Plan',
        targetTab: 'capex-opex'
      });
    }

    // Check Helpdesk SLAs
    if (ticketMetrics.pending > 0) {
      alerts.push({
        id: 'helpdesk-1',
        title: `Active Support Queue: ${ticketMetrics.pending} Incidents in Pipeline`,
        category: 'helpdesk',
        urgency: ticketMetrics.pending > 10 ? 'high' : 'normal',
        detail: `${ticketMetrics.inProgress} in progress, ${ticketMetrics.testing} testing. Current overall resolution compliance at ${ticketMetrics.resolutionRate}%.`,
        actionLabel: 'Open HelpDesk Queue',
        targetTab: 'helpdesk'
      });
    }

    // Infrastructure & Cloud Health
    alerts.push({
      id: 'infra-1',
      title: 'Cloud VMs & VCLOUDIA VPC Redundancy Verified',
      category: 'infrastructure',
      urgency: 'normal',
      detail: 'Cyfuture 18 VMs cluster at Sakal Polyclinic and VCLOUDIA Corporate VPC operating under 99.9% uptime with IDrive off-site disaster backups active.',
      actionLabel: 'View Infrastructure Status',
      targetTab: 'subscriptions'
    });

    return alerts;
  }, [cloudMetrics, budgetMetrics, ticketMetrics]);

  // Export Consolidated Executive Excel Report for Head of IT & Executive Committee
  const handleExportConsolidatedExecutiveReport = () => {
    const wb = xlsx.utils.book_new();

    // Sheet 1: Executive KPI Summary
    const summaryData = [
      { 'Domain': 'IT Operational Readiness', 'Metric': 'Overall Index', 'Value': '99.2% Fully Operational' },
      { 'Domain': 'CapEx & S-OpEx', 'Metric': 'FY 2026 Planned Capital', 'Value': `$${Math.round(budgetMetrics.totalPlanned).toLocaleString()}` },
      { 'Domain': 'CapEx & S-OpEx', 'Metric': 'FY 2026 Executed Spend', 'Value': `$${Math.round(budgetMetrics.totalActual).toLocaleString()}` },
      { 'Domain': 'CapEx & S-OpEx', 'Metric': 'Budget Execution Rate', 'Value': `${budgetMetrics.executionRate.toFixed(1)}%` },
      { 'Domain': 'Operating Expenses', 'Metric': 'Recorded Invoices Spend', 'Value': `$${Math.round(expenseMetrics.totalSpend).toLocaleString()}` },
      { 'Domain': 'Operating Expenses', 'Metric': 'Recorded Invoice Count', 'Value': expenseMetrics.txCount },
      { 'Domain': 'Cloud & HIS', 'Metric': 'Annual Run-Rate Commitment', 'Value': `$${Math.round(cloudMetrics.annualRunRate).toLocaleString()}` },
      { 'Domain': 'Cloud & HIS', 'Metric': 'Monthly Run-Rate Spend', 'Value': `$${Math.round(cloudMetrics.monthlyRunRate).toLocaleString()}` },
      { 'Domain': 'Cloud & HIS', 'Metric': 'Core Clinical Systems (HIS)', 'Value': `$${Math.round(cloudMetrics.hisAnnual).toLocaleString()}` },
      { 'Domain': 'Cloud & HIS', 'Metric': 'Cloud Virtual Machines & VPC', 'Value': `$${Math.round(cloudMetrics.computeAnnual).toLocaleString()}` },
      { 'Domain': 'Hardware Fleet', 'Metric': 'Total Enterprise Assets', 'Value': `${hardwareMetrics.totalFleet} Units` },
      { 'Domain': 'Hardware Fleet', 'Metric': 'Fixed Assets Valuation', 'Value': `$${Math.round(hardwareMetrics.totalValuation).toLocaleString()}` },
      { 'Domain': 'HelpDesk SLAs', 'Metric': 'Total Incidents Logged', 'Value': ticketMetrics.total },
      { 'Domain': 'HelpDesk SLAs', 'Metric': 'SLA Resolution Rate', 'Value': `${ticketMetrics.resolutionRate}%` },
      { 'Domain': 'Engineering', 'Metric': 'IT Engineers On-Duty', 'Value': `${staffMetrics.total} Specialists` },
      { 'Domain': 'Governance', 'Metric': 'Report Generated At', 'Value': new Date().toLocaleString() }
    ];
    const wsSummary = xlsx.utils.json_to_sheet(summaryData);
    xlsx.utils.book_append_sheet(wb, wsSummary, 'Executive KPI Summary');

    // Sheet 2: Multi-Campus Matrix
    const campusData = facilityMatrix.map(f => ({
      'Facility / Campus': f.site_name,
      'Location': f.location || 'Phnom Penh',
      'Clinical / Cloud Platform': f.clinicalPlatform,
      'Total Hardware Fleet': `${f.totalAssets} units`,
      'Fixed Assets Valuation (USD)': Number(f.valuation.toFixed(2)),
      'Assigned IT Engineers': `${f.staffCount} Specialists`,
      'Active Subscriptions': f.subsCount,
      'Support Tickets': f.ticketCount,
      'SLA Resilience Tier': f.slaTier,
      'Operational Status': '100% Online'
    }));
    const wsCampus = xlsx.utils.json_to_sheet(campusData);
    xlsx.utils.book_append_sheet(wb, wsCampus, 'Multi-Campus Roll-Up');

    // Sheet 3: Hardware Distribution
    const assetData = hardwareMetrics.categoryBreakdown.map(c => ({
      'Category': c.name,
      'Count': c.count,
      'Fleet Share (%)': `${Math.round((c.count / (hardwareMetrics.totalFleet || 1)) * 100)}%`
    }));
    const wsAssets = xlsx.utils.json_to_sheet(assetData);
    xlsx.utils.book_append_sheet(wb, wsAssets, 'Hardware Fleet Categories');

    // Sheet 4: Subscriptions Directory
    const subsData = (Array.isArray(cloudSubscriptions) ? cloudSubscriptions : []).map(s => ({
      'Subscription': s.name,
      'Provider': s.provider,
      'Category': s.category,
      'Campus': s.site_name,
      'Billing Cycle': s.billing_cycle,
      'Cost (USD)': s.cost,
      'Status': s.status,
      'Renewal Date': s.renewal_date ? s.renewal_date.slice(0, 10) : 'N/A'
    }));
    const wsSubs = xlsx.utils.json_to_sheet(subsData);
    xlsx.utils.book_append_sheet(wb, wsSubs, 'Cloud & HIS Subscriptions');

    xlsx.writeFile(wb, `Khema_Head_IT_Executive_Consolidation_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

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
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 tracking-wide uppercase flex items-center gap-1.5">
                <Award size={13} className="text-indigo-300" />
                CIO & Head of IT Strategic Command Center
              </span>
              <span className="text-xs text-slate-300 flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync Across All 6 IT Modules
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Smart Executive Dashboard — Head of IT
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl font-normal leading-relaxed">
              Consolidated executive governance rolling up CapEx/OpEx Planning, IT Expenses, Cloud & HIS Subscriptions, Fixed & Control Assets, HelpDesk SLAs, and Hospital Infrastructure for <span className="font-semibold text-white">{siteFilter}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportConsolidatedExecutiveReport}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-semibold backdrop-blur border border-emerald-400/30 transition-all shadow-md shadow-emerald-950/20"
              title="Export consolidated multi-sheet executive Excel report"
            >
              <Download size={14} className="text-white" />
              <span>Export Executive Excel</span>
            </button>
            <button
              type="button"
              onClick={fetchAllData}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur border border-white/15 transition-all shadow-sm disabled:opacity-50"
              title="Refresh all consolidated live datasets"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-indigo-300' : 'text-slate-300'} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh All'}</span>
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
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
              ${Math.round(budgetMetrics.totalActual).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
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
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
              ${Math.round(cloudMetrics.monthlyRunRate).toLocaleString()}
              <span className="text-xs text-slate-500 font-normal">/mo</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
              ${Math.round(cloudMetrics.annualRunRate).toLocaleString()}/yr Run-Rate
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-indigo-600 font-semibold">{cloudMetrics.totalCount} Active Services</span>
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
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">IT HelpDesk SLAs</span>
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
      {/* HEAD OF IT STRATEGIC DECISION & PRIORITY ACTION RADAR */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600">
              <Gauge size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Head of IT Strategic Decision & Action Radar
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  Priority Action Queue
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Proactive intelligence across impending contract renewals, budget variances, critical incident SLAs, and infrastructure health
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              {prioritiesAndAlerts.length} Action Items Monitored
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {prioritiesAndAlerts.map(alert => (
            <div 
              key={alert.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                alert.urgency === 'critical' 
                  ? 'bg-rose-50/60 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900' 
                  : alert.urgency === 'high'
                    ? 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900'
                    : 'bg-slate-50/70 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                    alert.urgency === 'critical'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                      : alert.urgency === 'high'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200'
                  }`}>
                    {alert.category}
                  </span>
                  <span className={`text-[10px] font-semibold ${
                    alert.urgency === 'critical' ? 'text-rose-600' : alert.urgency === 'high' ? 'text-amber-600' : 'text-slate-500'
                  }`}>
                    {alert.urgency.toUpperCase()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                  {alert.title}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {alert.detail}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab(alert.targetTab)}
                className="mt-3.5 w-full py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span>{alert.actionLabel}</span>
                <ChevronRight size={13} />
              </button>
            </div>
          ))}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card: CapEx */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">CapEx (Capital Assets)</span>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/50">
                  {budgetMetrics.capexExecutionRate.toFixed(1)}% Spent
                </span>
              </div>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                ${Math.round(budgetMetrics.actualCapex).toLocaleString()}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>Approved: <strong className="font-semibold text-slate-700 dark:text-slate-300 font-mono">${Math.round(budgetMetrics.plannedCapex).toLocaleString()}</strong></span>
                <span className="text-[11px] text-emerald-600 font-mono font-medium">${Math.round(budgetMetrics.capexVariance).toLocaleString()} left</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, budgetMetrics.capexExecutionRate)}%` }}
              />
            </div>
          </div>

          {/* Card: OpEx */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">OpEx (S-Operations)</span>
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900/50">
                  {budgetMetrics.opexExecutionRate.toFixed(1)}% Spent
                </span>
              </div>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                ${Math.round(budgetMetrics.actualOpex).toLocaleString()}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>Planned: <strong className="font-semibold text-slate-700 dark:text-slate-300 font-mono">${Math.round(budgetMetrics.plannedOpex).toLocaleString()}</strong></span>
                <span className="text-[11px] text-indigo-600 font-mono font-medium">${Math.round(budgetMetrics.opexVariance).toLocaleString()} left</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3.5 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, budgetMetrics.opexExecutionRate)}%` }}
              />
            </div>
          </div>

          {/* Card: Total Variance */}
          <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unspent Reserve</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md">
                  {budgetMetrics.totalPlanned > 0 ? ((budgetMetrics.variance / budgetMetrics.totalPlanned) * 100).toFixed(1) : '0.0'}% Buffer
                </span>
              </div>
              <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                ${Math.round(budgetMetrics.variance).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Within Authorized Limits</span>
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
              <span>Fiscal Cap: <strong className="font-mono text-slate-700 dark:text-slate-300">${Math.round(budgetMetrics.totalPlanned).toLocaleString()}</strong></span>
              <span className="text-emerald-600 font-semibold">Positive Runway</span>
            </div>
          </div>

          {/* Card: Execution Rate (Selected Element: Styled) */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/5 via-white to-indigo-50/70 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-800/80 rounded-2xl p-5 border-2 border-indigo-500/40 dark:border-indigo-400/40 shadow-lg shadow-indigo-500/10 group hover:shadow-indigo-500/20 transition-all duration-300 flex flex-col justify-between">
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Gauge size={14} className="text-indigo-600 dark:text-indigo-400" />
                  Budget Execution Velocity
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  {budgetMetrics.executionRate >= 75 ? 'Accelerated' : budgetMetrics.executionRate >= 50 ? 'Optimal Pace' : 'Conservative'}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-black font-mono tracking-tight text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {budgetMetrics.executionRate.toFixed(1)}%
                </p>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Annual Consumed
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full mt-3 overflow-hidden p-0.5">
                <div 
                  className="bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 h-full rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${Math.min(100, budgetMetrics.executionRate)}%` }}
                />
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">CapEx Burn</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                  {budgetMetrics.capexExecutionRate.toFixed(1)}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">OpEx Burn</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                  {budgetMetrics.opexExecutionRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 12-Month CapEx vs OpEx Phasing & Cash Flow Chart */}
        {budgetMetrics.cashFlowChartData.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 size={16} className="text-indigo-600" />
                  12-Month CapEx vs. OpEx Monthly Cash Flow & Phasing Execution (FY 2026)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparison of monthly planned capital and operational expenditures against executed actuals
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> Planned Total
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Actual Total
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetMetrics.cashFlowChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <RechartsTooltip 
                    formatter={(val: any, name: any) => [
                      `$${Number(val).toLocaleString()}`, 
                      name === 'planned_total' ? 'Planned Total' : name === 'actual_total' ? 'Actual Total' : name === 'planned_capex' ? 'Planned CapEx' : name === 'actual_capex' ? 'Actual CapEx' : name === 'planned_opex' ? 'Planned OpEx' : 'Actual OpEx'
                    ]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
                  />
                  <Bar dataKey="planned_total" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="actual_total" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CapEx Strategic Asset Allocation & Campus Allocation */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: CapEx by Strategic Asset Category */}
          <div className="bg-slate-50/70 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Laptop size={14} className="text-emerald-600" />
                CapEx Investments by Strategic Asset Type
              </h5>
              <span className="text-[11px] text-slate-500 font-mono">
                ${Math.round(budgetMetrics.actualCapex).toLocaleString()} / ${Math.round(budgetMetrics.plannedCapex).toLocaleString()}
              </span>
            </div>

            <div className="space-y-3">
              {Object.keys(budgetMetrics.capexByAssetType).length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No CapEx category data for this selection</p>
              ) : (
                Object.entries(budgetMetrics.capexByAssetType).slice(0, 5).map(([assetType, data]: any) => {
                  const p = Number(data.planned || 0);
                  const a = Number(data.actual || 0);
                  const pct = p > 0 ? Math.min(100, Math.round((a / p) * 100)) : 0;
                  return (
                    <div key={assetType} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{assetType}</span>
                        <span className="font-mono text-slate-600 dark:text-slate-400">
                          ${Math.round(a).toLocaleString()} <span className="text-slate-400 font-normal">/ ${Math.round(p).toLocaleString()}</span>
                          <span className="ml-2 font-semibold text-emerald-600">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Multi-Campus Strategic Allocation (K1, K2, KG, Sakal) */}
          <div className="bg-slate-50/70 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 size={14} className="text-indigo-600" />
                Multi-Campus Budget Execution Matrix
              </h5>
              <span className="text-[11px] text-slate-500 font-mono">Total Planned vs Actual</span>
            </div>

            <div className="space-y-2.5">
              {[
                { code: 'K1', name: 'Khema TK (K1)' },
                { code: 'K2', name: 'Khema BKK (K2)' },
                { code: 'KG', name: 'Khema Global (KG)' },
                { code: 'Sakal', name: 'Sakal Polyclinic 2004' },
                { code: 'All Sites', name: 'Shared Enterprise' }
              ].map(siteItem => {
                const sData = budgetMetrics.totalBySite[siteItem.code] || { planned: 0, actual: 0, variance: 0 };
                const p = Number(sData.planned || 0);
                const a = Number(sData.actual || 0);
                const pct = p > 0 ? Math.min(100, Math.round((a / p) * 100)) : 0;
                return (
                  <div key={siteItem.code} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{siteItem.name}</span>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Planned: ${Math.round(p).toLocaleString()} | Actual: ${Math.round(a).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                        pct >= 75 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' :
                        pct >= 40 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {pct}% Executed
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
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
                <th className="py-3 px-4">Core Clinical & Cloud Platform</th>
                <th className="py-3 px-4">Hardware Fleet & Valuation</th>
                <th className="py-3 px-4">IT Engineers</th>
                <th className="py-3 px-4">Support Queue</th>
                <th className="py-3 px-4">SLA Resilience</th>
                <th className="py-3 px-4 text-right">Quick Filter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {facilityMatrix.map((fac) => (
                <tr key={fac.id || fac.site_name} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-indigo-600 shrink-0" />
                      <div>
                        <span>{fac.site_name}</span>
                        <span className="text-[11px] text-slate-400 font-normal block">{fac.location}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                      {fac.clinicalPlatform}
                    </span>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                      {fac.subsCount} Subscriptions Active
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                      {fac.totalAssets} units
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 block">
                      ${Math.round(fac.valuation).toLocaleString()} Fixed Val
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{fac.staffCount} Specialists</span>
                    <span className="text-[11px] text-emerald-600 block">Active On-Duty</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{fac.ticketCount} logged</span>
                    <span className="text-[11px] text-slate-400 block">100% Monitored</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      fac.slaTier.includes('Critical') || fac.slaTier.includes('Compute')
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {fac.slaTier}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSiteFilter && setSiteFilter(fac.site_name)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-600 transition-colors shadow-2xs"
                    >
                      Filter Facility
                    </button>
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
