import React, { useState } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Users, Wrench, Monitor, Shield, Activity, DollarSign,
  Download, Filter, CheckCircle2, AlertCircle, Clock, BarChart3, AlertTriangle, X,
  Plus, Edit, Trash2, Save, MapPin
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AssetsModule } from './AssetsModule';
import { SettingsModule } from './SettingsModule';
import { CloudSubscriptionsModule } from './CloudSubscriptionsModule';
import { ExecutiveSummaryModule } from './ExecutiveSummaryModule';
import { Cloud } from 'lucide-react';

// --- MOCK DATA ---
const KPI_DATA = {
  totalTickets: 145, openTickets: 12, avgResolutionTime: '4.2 hrs',
  serverUptime: '99.99%', budgetVariance: '-$1,200', assetsDeployed: 432
};

const EXPENSE_DATA = [
  { month: 'Jan', budget: 15000, actual: 14200 },
  { month: 'Feb', budget: 15000, actual: 16100 },
  { month: 'Mar', budget: 15000, actual: 14800 },
  { month: 'Apr', budget: 15000, actual: 13900 },
];

const TICKET_STATUS_DATA = [
  { name: 'Resolved', value: 120, color: '#10b981' },
  { name: 'In Progress', value: 15, color: '#f59e0b' },
  { name: 'Open', value: 10, color: '#3b82f6' }
];

const ITStaffingData = [
  { site: 'Main Hospital', name: 'John Doe', role: 'System Admin', status: 'Active', score: '4.8/5.0' },
  { site: 'North Clinic', name: 'Jane Smith', role: 'Network Eng', status: 'Active', score: '4.9/5.0' },
  { site: 'South Clinic', name: 'Robert Johnson', role: 'Helpdesk L1', status: 'On Leave', score: '4.2/5.0' },
];

const HelpDeskData = [
  { id: 'INC-1042', site: 'Main Hospital', issue: 'Network Outage', priority: 'Critical', status: 'In Progress', time: '--', created: '2023-10-24 09:12' },
  { id: 'INC-1041', site: 'North Clinic', issue: 'Printer Issue', priority: 'Low', status: 'Resolved', time: '1.2 hrs', created: '2023-10-24 08:30' },
  { id: 'INC-1040', site: 'Main Hospital', issue: 'Password Reset', priority: 'Medium', status: 'Resolved', time: '0.5 hrs', created: '2023-10-23 16:45' },
];

const AssetsData = [
  { tag: 'AST-9921', category: 'Server', site: 'Main Hospital', model: 'Dell PowerEdge R740', status: 'Active', purchase: '2021-05-12', warranty: '2024-05-12' },
  { tag: 'AST-9922', category: 'Workstation', site: 'North Clinic', model: 'Lenovo ThinkCentre', status: 'Repair', purchase: '2022-01-10', warranty: '2025-01-10' },
];

const TrainingData = [
  { course: 'HMS V2.1 Update', site: 'All Sites', attendees: 145, rate: '92%', date: '2023-10-15' },
  { course: 'Cybersecurity 101', site: 'Main Hospital', attendees: 320, rate: '78%', date: '2023-10-01' },
];

export const ITDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'executive';
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [siteFilter, setSiteFilter] = useState('All Sites');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [dbKpis, setDbKpis] = useState(KPI_DATA);
  const [sites, setSites] = useState<any[]>([{ id: '1', site_name: 'Main Hospital' }, { id: '2', site_name: 'North Clinic' }, { id: '3', site_name: 'South Clinic' }]);

  const navigate = useNavigate();
  const itTabs = [
    { id: 'executive', label: 'Executive Summary', icon: BarChart3 },
    { id: 'subscriptions', label: 'Cloud & HIS Subscriptions', icon: Cloud },
    { id: 'assets', label: 'Assets Management', icon: Monitor },
    { id: 'helpdesk', label: 'Helpdesk Tickets', icon: Wrench },
    { id: 'staffing', label: 'Staffing & Shifts', icon: Users },
  ];

  const handleTabChange = (tabId: string) => {
    if (tabId === 'notes') {
      navigate(RoutePath.NOTES);
      return;
    }
    setSearchParams({ tab: tabId });
  };

  React.useEffect(() => {
    fetch(`/api/it-dashboard?site=${encodeURIComponent(siteFilter)}&from=${encodeURIComponent(filterFrom)}&to=${encodeURIComponent(filterTo)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(r => r.json())
    .then(data => {
      if (data?.data?.metrics) {
        setDbKpis(data.data.metrics);
      }
    })
    .catch(err => console.log('Failed to fetch dashboard', err));

    fetch('/api/sites', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) setSites(data);
    })
    .catch(err => console.log('Failed to fetch sites', err));
  }, [siteFilter, filterFrom, filterTo]);

  const exportPDF = async () => {
    try {
      const doc = new jsPDF();
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const siteParam = siteFilter !== 'All Sites' ? `?site=${encodeURIComponent(siteFilter)}` : '';

      // Fetch all module datasets for consolidated PDF
      const [cloudSumRes, assetsRes, helpdeskRes, staffRes] = await Promise.all([
        fetch(`/api/cloud-subscriptions/summary${siteParam}`, { headers }).catch(() => null),
        fetch('/api/assets', { headers }).catch(() => null),
        fetch('/api/helpdesk', { headers }).catch(() => null),
        fetch('/api/staffing', { headers }).catch(() => null)
      ]);

      const cloudSummary = cloudSumRes && cloudSumRes.ok ? await cloudSumRes.json() : null;
      const allAssets = assetsRes && assetsRes.ok ? await assetsRes.json() : [];
      const allTickets = helpdeskRes && helpdeskRes.ok ? await helpdeskRes.json() : [];
      const allStaff = staffRes && staffRes.ok ? await staffRes.json() : [];

      const filteredAssets = Array.isArray(allAssets) 
        ? (siteFilter === 'All Sites' ? allAssets : allAssets.filter(a => a.site_name === siteFilter))
        : [];
      const filteredTickets = Array.isArray(allTickets)
        ? (siteFilter === 'All Sites' ? allTickets : allTickets.filter(t => t.site_name === siteFilter))
        : [];
      const filteredStaff = Array.isArray(allStaff)
        ? (siteFilter === 'All Sites' ? allStaff : allStaff.filter(s => s.site_name === siteFilter || (s.monthly_schedule && s.monthly_schedule.includes(siteFilter))))
        : [];

      // Header Banner
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 210, 26, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('KHEMA GLOBAL - CONSOLIDATED IT OPERATIONS REPORT', 14, 12);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Scope: ${siteFilter} | Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} | 6 Modules Unified`, 14, 19);

      // Section 1: Executive Consolidated Domain KPIs
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Executive Multi-Domain Consolidated KPIs', 14, 34);

      const totalTicketCount = filteredTickets.reduce((sum: number, t: any) => 
        sum + (t.in_progress_count || 0) + (t.testing_count || 0) + (t.not_started_count || 0) + (t.completed_count || 0), 0);
      const completedTicketCount = filteredTickets.reduce((sum: number, t: any) => sum + (t.completed_count || 0), 0);
      const totalAssetValue = filteredAssets.reduce((sum: number, a: any) => sum + (parseFloat(a.purchase_price) || 0), 0);

      autoTable(doc, {
        startY: 38,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        head: [['IT Module', 'Consolidated Scope', 'Metrics / Totals', 'Operational Status']],
        body: [
          ['Khema Cloud Subscriptions', 'Monthly & Annual SaaS Run-Rate', `$${(cloudSummary?.totalMonthlySpend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo ($${(cloudSummary?.annualRunRate || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/yr)`, `${cloudSummary?.activeCount || 0} Subscriptions Active`],
          ['IT Assets & Hardware Fleet', 'Inventory & Equipment Rollout', `${filteredAssets.length} Units ($${Math.round(totalAssetValue).toLocaleString()} Total Value)`, 'Fleet In-Service'],
          ['Helpdesk & Support SLAs', 'Ticket Funnel & Resolution', `${totalTicketCount} Total Reported (${completedTicketCount} Resolved)`, `${totalTicketCount > 0 ? ((completedTicketCount / totalTicketCount) * 100).toFixed(1) : '100'}% Resolution Rate`],
          ['IT Staffing & Shift Coverage', 'Engineers & Standby Duty', `${filteredStaff.length} IT Personnel on Roster`, '100% Standby Coverage Active'],
          ['Multi-Site Facilities', 'Connected Branches & Clinics', `${sites.length} Active Connected Facilities`, 'SD-WAN & Network Online']
        ]
      });

      // Section 2: Multi-Site Matrix Table
      const nextY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : 95;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Multi-Facility Operations & Infrastructure Roll-Up', 14, nextY);

      const siteRows = sites.map((s: any) => {
        const sAssets = (Array.isArray(allAssets) ? allAssets : []).filter(a => a.site_name === s.site_name).length;
        const sStaff = (Array.isArray(allStaff) ? allStaff : []).filter(st => st.site_name === s.site_name || (st.monthly_schedule && st.monthly_schedule.includes(s.site_name))).length;
        const sTickets = (Array.isArray(allTickets) ? allTickets : []).filter(t => t.site_name === s.site_name).reduce((sum, t) => 
          sum + (t.in_progress_count || 0) + (t.testing_count || 0) + (t.not_started_count || 0) + (t.completed_count || 0), 0);
        return [s.site_name, s.location || 'Branch Facility', `${sAssets} Units`, `${sStaff} Engineers`, `${sTickets} Tickets`, 'Operational'];
      });

      autoTable(doc, {
        startY: nextY + 4,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
        head: [['Facility Name', 'Location', 'Assets Deployed', 'Assigned Staff', 'Tickets Reported', 'Status']],
        body: siteRows
      });

      doc.save(`Khema_Consolidated_IT_Report_${siteFilter.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Failed to export consolidated PDF', err);
      const doc = new jsPDF();
      doc.text(`IT Operations Monthly Report - ${siteFilter}`, 14, 15);
      doc.save('IT_Dashboard_Report.pdf');
    }
  };

  return (
    <div className="w-full pb-12 animate-in fade-in duration-500">
      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-slate-200/60 hide-scrollbar">
        {itTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (tab.id === 'subscriptions' && activeTab === 'cloud-subscriptions');
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-600/30'
                  : 'bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/60 shadow-sm'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Header for Executive Tab */}
      {activeTab === 'executive' && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 tracking-tight">
            IT Operations Dashboard
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Consolidated multi-module reporting framework across {siteFilter}</p>
        </div>
      )}

      {/* Content Area */}
      <div className="bg-white/80 backdrop-blur-2xl rounded-2xl border border-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] min-h-[600px] overflow-x-auto">
        {activeTab === 'executive' && (
          <ExecutiveSummaryModule 
            kpis={dbKpis} 
            sites={sites} 
            siteFilter={siteFilter}
            setSiteFilter={setSiteFilter}
            filterFrom={filterFrom}
            filterTo={filterTo}
            onNavigateTab={handleTabChange}
          />
        )}
        {(activeTab === 'subscriptions' || activeTab === 'cloud-subscriptions') && <CloudSubscriptionsModule sites={sites} />}
        {activeTab === 'staffing' && <StaffingReport sites={sites} />}
        {activeTab === 'helpdesk' && <HelpDeskReport sites={sites} />}
        {activeTab === 'assets' && <AssetsModule sites={sites} />}
        {activeTab === 'sites' && (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center gap-4 my-6">
            <h3 className="text-lg font-semibold text-slate-800">Settings Moved</h3>
            <p className="text-slate-500 text-sm max-w-md">Sites and system settings have been moved to the main sidebar Settings page for centralized administration.</p>
            <Button onClick={() => window.location.hash = '#/settings'}>Open Main Settings</Button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const DataTable = ({ title, cols, data }: any) => (
  <div className="animate-in slide-in-from-bottom-4 duration-500">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
      <Button variant="secondary" size="sm" className="bg-white"><Download size={14} className="mr-2"/> Export CSV</Button>
    </div>
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
          <tr>
            {cols.map((c: string, i: number) => <th key={i} className="px-5 py-3.5 font-semibold">{c}</th>)}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {data.map((row: any, i: number) => (
            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
              {Object.values(row).map((val: any, j: number) => (
                <td key={j} className="px-5 py-3.5 text-slate-700">
                  {/* Status styling logic */}
                  {['Active', 'Resolved', 'Operational', 'Exceeds', 'Low', 'Online'].includes(val) ? (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">{val}</span>
                  ) : ['In Progress', 'Repair', 'Warning', 'Medium', 'On Leave', 'Degraded Performance'].includes(val) ? (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">{val}</span>
                  ) : ['Critical', 'Open', 'Needs Improvement', 'High', 'Offline'].includes(val) ? (
                    <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-semibold">{val}</span>
                  ) : (
                    <span className={j === 0 ? "font-medium text-slate-900" : ""}>{val}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ExpenseReport = () => (
  <div className="animate-in slide-in-from-bottom-4 duration-500">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight">IT Expense & Inventory Report</h2>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
         <table className="w-full text-sm text-left">
           <thead className="bg-slate-50 border-b">
             <tr><th className="px-4 py-3">Category</th><th className="px-4 py-3">Budget</th><th className="px-4 py-3">Actual</th><th className="px-4 py-3">Variance</th></tr>
           </thead>
           <tbody className="bg-white divide-y divide-slate-100">
             <tr><td className="px-4 py-3">Hardware</td><td className="px-4 py-3">$8,000</td><td className="px-4 py-3">$7,500</td><td className="px-4 py-3 text-emerald-600">-$500</td></tr>
             <tr><td className="px-4 py-3">Software Lic</td><td className="px-4 py-3">$4,500</td><td className="px-4 py-3">$4,500</td><td className="px-4 py-3 text-slate-400">$0</td></tr>
             <tr><td className="px-4 py-3">Infra/Cloud</td><td className="px-4 py-3">$2,500</td><td className="px-4 py-3">$3,100</td><td className="px-4 py-3 text-rose-600">+$600</td></tr>
           </tbody>
         </table>
       </div>
       <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-200">
         <h4 className="font-semibold mb-2">Expense Notes</h4>
         <p className="text-sm text-slate-600">Total monthly budget remains largely on track. Cloud expenses exceeded budget due to a spike in backup storage requirements at North Clinic. We recommend an audit of unused snapshot data to bring Next Month's run-rate back to $2,500.</p>
       </div>
    </div>
  </div>
);

const StaffingReport = ({ sites }: any) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    staff_id: '',
    site_name: sites.length > 0 ? sites[0].site_name : 'Main Hospital',
    employee_name: '',
    role: '',
    status: 'Active',
    performance_score: '',
    monthly_schedule: ''
  });

  const [helpdeskTickets, setHelpdeskTickets] = useState<any[]>([]);

  const fetchStaff = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/staffing', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
      fetch('/api/helpdesk', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json())
    ]).then(([staffData, ticketsData]) => {
      setStaff(Array.isArray(staffData) ? staffData : []);
      setHelpdeskTickets(Array.isArray(ticketsData) ? ticketsData : []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  React.useEffect(() => {
    fetchStaff();
  }, []);

  const getPerformanceScore = (employeeName: string, staticScore: number) => {
    const staffTickets = helpdeskTickets.filter((t: any) => t.assignee === employeeName);
    if (staffTickets.length > 0) {
      let completed = 0;
      let total = 0;
      staffTickets.forEach((t: any) => {
        completed += (t.completed_count || 0);
        total += (t.completed_count || 0) + (t.in_progress_count || 0) + (t.testing_count || 0) + (t.not_started_count || 0);
      });
      if (total > 0) {
        return ((completed / total) * 5).toFixed(1);
      }
    }
    return staticScore ? Number(staticScore).toFixed(1) : '--';
  };

  const openAddModal = () => {
    setFormData({
      staff_id: '',
      site_name: sites.length > 0 ? sites[0].site_name : 'Main Hospital',
      employee_name: '',
      role: '',
      status: 'Active',
      performance_score: '',
      monthly_schedule: ''
    });
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (member: any) => {
    setFormData({
      staff_id: member.staff_id || '',
      site_name: member.site_name,
      employee_name: member.employee_name,
      role: member.role,
      status: member.status,
      performance_score: member.performance_score || '',
      monthly_schedule: member.monthly_schedule || ''
    });
    setEditingId(member.id);
    setShowModal(true);
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    fetch(`/api/staffing/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(() => {
      setConfirmDeleteId(null);
      fetchStaff();
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/staffing/${editingId}` : '/api/staffing';
    const method = editingId ? 'PUT' : 'POST';
    
    fetch(url, {
      method,
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    }).then(() => {
      setShowModal(false);
      fetchStaff();
    });
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">IT Staffing Report</h2>
        <div className="flex gap-2">
          <Button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-sm shadow-sm">
            <Plus size={16} /> Add Staff
          </Button>
          <Button variant="secondary" size="sm" className="bg-white gap-2"><Download size={14}/> Export CSV</Button>
        </div>
      </div>
      
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Staff ID</th>
              <th className="px-5 py-3.5 font-semibold">Site</th>
              <th className="px-5 py-3.5 font-semibold">Employee Name</th>
              <th className="px-5 py-3.5 font-semibold">Role/Position</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 font-semibold">Performance Score</th>
              <th className="px-5 py-3.5 font-semibold">Standby at</th>
              <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-400">Loading staffing data...</td></tr>
            ) : staff.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-400">No staff members found.</td></tr>
            ) : staff.map((row: any) => (
              <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5 text-slate-700">{row.staff_id || '--'}</td>
                <td className="px-5 py-3.5 text-slate-700">{row.site_name}</td>
                <td className="px-5 py-3.5 text-slate-900 font-medium">{row.employee_name}</td>
                <td className="px-5 py-3.5 text-slate-700">{row.role}</td>
                <td className="px-5 py-3.5 text-slate-700">
                  {row.status === 'Active' ? (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Active</span>
                  ) : <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">{row.status}</span>}
                </td>
                <td className="px-5 py-3.5 text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{getPerformanceScore(row.employee_name, row.performance_score)}{getPerformanceScore(row.employee_name, row.performance_score) !== '--' ? '/5.0' : ''}</span>
                    {helpdeskTickets.some(t => t.assignee === row.employee_name) && (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded" title="Auto-calculated from Helpdesk Tickets">Auto</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-700 max-w-[200px] truncate" title={row.monthly_schedule}>{row.monthly_schedule || '--'}</td>
                <td className="px-5 py-3.5 text-right flex justify-end gap-2">
                  <button onClick={() => openEditModal(row)} className="text-indigo-600 hover:text-indigo-800 p-1 bg-indigo-50 rounded" title="Edit"><Edit size={14}/></button>
                  {confirmDeleteId === row.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(row.id)} className="text-xs bg-rose-600 text-white px-2 py-1 rounded hover:bg-rose-700">Confirm</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(row.id)} className="text-rose-600 hover:text-rose-800 p-1 bg-rose-50 rounded" title="Delete"><Trash2 size={14}/></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">{editingId ? 'Edit Staff Member' : 'Add Staff Member'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Staff ID</label>
                  <input required type="text" value={formData.staff_id} onChange={e => setFormData({...formData, staff_id: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Employee Name</label>
                  <input required type="text" value={formData.employee_name} onChange={e => setFormData({...formData, employee_name: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Site Name</label>
                  <select value={formData.site_name} onChange={e => setFormData({...formData, site_name: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    {sites && sites.map((s: any) => <option key={s.id}>{s.site_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Role/Position</label>
                  <input required type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. System Admin" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>Active</option>
                    <option>On Leave</option>
                    <option>Terminated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Performance (Used if no tickets found)</label>
                  <input type="number" step="0.1" max="5" value={formData.performance_score} onChange={e => setFormData({...formData, performance_score: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 4.8" />
                </div>
              </div>
               <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Standby at (Hold Ctrl/Cmd to select multiple)</label>
                  <select multiple value={formData.monthly_schedule ? formData.monthly_schedule.split(', ') : []} onChange={e => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({...formData, monthly_schedule: selectedOptions.join(', ')});
                  }} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px]">
                    {sites && sites.map((s: any) => <option key={s.id} value={s.site_name}>{s.site_name}</option>)}
                  </select>
                </div>
              <div className="mt-4 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white"><Save size={16} className="mr-2"/> Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Component extracted to SettingsModule

const HelpDeskReport = ({ sites }: any) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    helpdesk_id: '',
    site_name: sites && sites.length > 0 ? sites[0].site_name : '',
    assignee: '',
    in_progress_count: 0,
    testing_count: 0,
    not_started_count: 0,
    completed_count: 0,
    create_date_time: '',
    period_from: '',
    period_to: ''
  });

  const fetchTickets = () => {
    setLoading(true);
    fetch('/api/helpdesk', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) setTickets(data);
      setLoading(false);
    })
    .catch(err => {
      console.log('Failed to fetch helpdesk tickets', err);
      setLoading(false);
    });
  };

  const exportToCSV = () => {
    const headers = ['Helpdesk ID', 'Site', 'Assignee', 'In-Progress', 'Testing', 'Not Started', 'Completed', 'Total', 'Period From', 'Period To', 'Created At'];
    const filteredTickets = tickets.filter(t => !filterMonth || (t.create_date_time && t.create_date_time.startsWith(filterMonth)));
    const csvRows = filteredTickets.map((t: any) => [
      t.helpdesk_id,
      t.site_name,
      t.assignee,
      t.in_progress_count || 0,
      t.testing_count || 0,
      t.not_started_count || 0,
      t.completed_count || 0,
      (t.in_progress_count || 0) + (t.testing_count || 0) + (t.not_started_count || 0) + (t.completed_count || 0),
      t.period_from ? new Date(t.period_from).toLocaleDateString() : '',
      t.period_to ? new Date(t.period_to).toLocaleDateString() : '',
      t.create_date_time ? new Date(t.create_date_time).toLocaleString() : ''
    ].map(v => typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v).join(','));
    
    const csvString = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Helpdesk_Management_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    fetchTickets();
    fetch('/api/staffing', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) setStaff(data);
    });
  }, []);

  const openAddModal = () => {
    const defaultAssignee = staff.length > 0 ? staff[0].employee_name : '';
    const defaultSite = staff.length > 0 ? staff[0].site_name : (sites && sites.length > 0 ? sites[0].site_name : '');
    setFormData({
      helpdesk_id: '',
      site_name: defaultSite,
      assignee: defaultAssignee,
      in_progress_count: 0,
      testing_count: 0,
      not_started_count: 0,
      completed_count: 0,
      create_date_time: new Date().toISOString().slice(0, 16),
      period_from: new Date().toISOString().slice(0, 10),
      period_to: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10)
    });
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (ticket: any) => {
    setFormData({
      helpdesk_id: ticket.helpdesk_id || '',
      site_name: ticket.site_name,
      assignee: ticket.assignee || '',
      in_progress_count: ticket.in_progress_count || 0,
      testing_count: ticket.testing_count || 0,
      not_started_count: ticket.not_started_count || 0,
      completed_count: ticket.completed_count || 0,
      create_date_time: ticket.create_date_time ? new Date(ticket.create_date_time).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      period_from: ticket.period_from ? new Date(ticket.period_from).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      period_to: ticket.period_to ? new Date(ticket.period_to).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
    });
    setEditingId(ticket.id);
    setShowModal(true);
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    fetch(`/api/helpdesk/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    }).then(() => {
      setConfirmDeleteId(null);
      fetchTickets();
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/helpdesk/${editingId}` : '/api/helpdesk';
    const method = editingId ? 'PUT' : 'POST';
    
    fetch(url, {
      method,
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({...formData, create_date_time: new Date(formData.create_date_time).toISOString()})
    }).then(() => {
      setShowModal(false);
      fetchTickets();
    });
  };

  const filteredTickets = tickets.filter(t => !filterMonth || (t.create_date_time && t.create_date_time.startsWith(filterMonth)));

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Helpdesk Management</h2>
          <p className="text-sm text-slate-500 mt-1">Track and export ticketing operation reports</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
            <span className="text-sm text-slate-500 px-2">Report Month:</span>
            <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="text-sm outline-none bg-transparent mr-1" />
            {filterMonth && (
              <button
                type="button"
                onClick={() => setFilterMonth('')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
              >
                All Months
              </button>
            )}
          </div>
          <Button variant="outline" onClick={exportToCSV} className="bg-white gap-2 text-sm shadow-sm border-slate-200 text-slate-700 hover:text-indigo-600 font-medium transition-colors">
            <Download size={16} /> Export Management CSV
          </Button>
          <Button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-sm shadow-sm transition-colors">
            <Plus size={16} /> Add Report
          </Button>
        </div>
      </div>
      
      {/* Management Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Reported</p>
          <p className="text-3xl font-bold text-slate-800">
            {filteredTickets.reduce((acc: any, t: any) => acc + (t.in_progress_count || 0) + (t.testing_count || 0) + (t.not_started_count || 0) + (t.completed_count || 0), 0)}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center border-l-4 border-l-slate-400">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Not Started</p>
          <p className="text-3xl font-bold text-slate-800">
            {filteredTickets.reduce((acc: any, t: any) => acc + (t.not_started_count || 0), 0)}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center border-l-4 border-l-amber-400">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">In Progress</p>
          <p className="text-3xl font-bold text-slate-800">
            {filteredTickets.reduce((acc: any, t: any) => acc + (t.in_progress_count || 0), 0)}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center border-l-4 border-l-sky-400">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Testing / Review</p>
          <p className="text-3xl font-bold text-slate-800">
            {filteredTickets.reduce((acc: any, t: any) => acc + (t.testing_count || 0), 0)}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center border-l-4 border-l-emerald-400">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Completed</p>
          <p className="text-3xl font-bold text-slate-800">
            {filteredTickets.reduce((acc: any, t: any) => acc + (t.completed_count || 0), 0)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm mt-2">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Site</th>
              <th className="px-5 py-3.5 font-semibold">Assignee</th>
              <th className="px-5 py-3.5 font-semibold">In-Progress</th>
              <th className="px-5 py-3.5 font-semibold">Testing</th>
              <th className="px-5 py-3.5 font-semibold">Not Started</th>
              <th className="px-5 py-3.5 font-semibold">Completed</th>
              <th className="px-5 py-3.5 font-semibold">Total Tickets</th>
              <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-400">Loading helpdesk data...</td></tr>
            ) : filteredTickets.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-400">No helpdesk records found.</td></tr>
            ) : filteredTickets.map((row: any) => (
              <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5 text-slate-700">{row.site_name}</td>
                <td className="px-5 py-3.5 text-slate-700">{row.assignee || '--'}</td>
                <td className="px-5 py-3.5 text-slate-700">{row.in_progress_count || 0}</td>
                <td className="px-5 py-3.5 text-slate-700">{row.testing_count || 0}</td>
                <td className="px-5 py-3.5 text-slate-700">{row.not_started_count || 0}</td>
                <td className="px-5 py-3.5 text-slate-700">{row.completed_count || 0}</td>
                <td className="px-5 py-3.5 text-slate-700 font-semibold">{(row.in_progress_count || 0) + (row.testing_count || 0) + (row.not_started_count || 0) + (row.completed_count || 0)}</td>
                <td className="px-5 py-3.5 text-right flex justify-end gap-2">
                  <button onClick={() => openEditModal(row)} className="text-indigo-600 hover:text-indigo-800 p-1 bg-indigo-50 rounded" title="Edit"><Edit size={14}/></button>
                  {confirmDeleteId === row.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(row.id)} className="text-xs bg-rose-600 text-white px-2 py-1 rounded hover:bg-rose-700">Confirm</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(row.id)} className="text-rose-600 hover:text-rose-800 p-1 bg-rose-50 rounded" title="Delete"><Trash2 size={14}/></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">{editingId ? 'Edit Report' : 'Add Report'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Helpdesk ID (Auto-gen)</label>
                  <input disabled={!editingId} type="text" value={formData.helpdesk_id} onChange={e => setFormData({...formData, helpdesk_id: e.target.value})} className="w-full border border-slate-300 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={editingId ? 'e.g. TKT-001' : 'Auto Generated'} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Site</label>
                  <select value={formData.site_name} onChange={e => setFormData({...formData, site_name: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    {sites && sites.map((s: any) => <option key={s.id}>{s.site_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Assignee</label>
                  <select value={formData.assignee} onChange={e => {
                    const emp = e.target.value;
                    const staffMember = staff.find((s: any) => s.employee_name === emp);
                    setFormData({
                      ...formData, 
                      assignee: emp,
                      site_name: staffMember ? staffMember.site_name : formData.site_name
                    });
                  }} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Unassigned</option>
                    {staff && staff.map((s: any) => <option key={s.id} value={s.employee_name}>{s.employee_name} ({s.site_name})</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">In-Progress Tickets</label>
                  <input required type="number" min="0" value={formData.in_progress_count} onChange={e => setFormData({...formData, in_progress_count: parseInt(e.target.value) || 0})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Testing Tickets</label>
                  <input required type="number" min="0" value={formData.testing_count} onChange={e => setFormData({...formData, testing_count: parseInt(e.target.value) || 0})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Not Started Tickets</label>
                  <input required type="number" min="0" value={formData.not_started_count} onChange={e => setFormData({...formData, not_started_count: parseInt(e.target.value) || 0})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Completed Tickets</label>
                  <input required type="number" min="0" value={formData.completed_count} onChange={e => setFormData({...formData, completed_count: parseInt(e.target.value) || 0})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Period From</label>
                  <input required type="date" value={formData.period_from} onChange={e => setFormData({...formData, period_from: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Period To</label>
                  <input required type="date" value={formData.period_to} onChange={e => setFormData({...formData, period_to: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Create Date Time</label>
                  <input required type="datetime-local" value={formData.create_date_time} onChange={e => setFormData({...formData, create_date_time: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowModal(false)} type="button">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white"><Save size={16} className="mr-2"/> Save Report</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
