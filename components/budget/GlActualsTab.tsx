import React, { useState, useMemo } from 'react';
import {
  Search, Plus, Trash2, Upload, RefreshCw, Building2, BookOpen, Calendar,
  CheckCircle2, AlertTriangle, BarChart3, Receipt, X
} from 'lucide-react';
import {
  ALL_BU_FILTER_OPTIONS,
  CAPEX_BU_OPTIONS,
  COA_SUMMARY_2027,
  MONTH_KEYS,
  MONTH_LABELS,
  extractGlCodeNumber,
  findCoaByCode,
  findCoaByName,
  formatBuDisplayLabel,
  normalizeBuCanonical
} from '../../src/data/itBudget2027MasterData';
import { parseBudgetWorkbook } from '../../src/utils/budgetExcel2027';

export interface GlActualItem {
  id: string;
  fiscal_year: number;
  posting_date: string;
  external_document_no: string;
  document_no: string;
  gl_account_no: string;
  gl_account_name: string;
  item_value_desc: string;
  description: string;
  amount: number;
  bu_code: string;
  bu_canonical?: string;
  source?: string;
}

interface GlActualsTabProps {
  fiscalYear: number;
  selectedSite: string;
  onSiteChange: (site: string) => void;
  glActuals: GlActualItem[];
  opexItems: any[];
  onRefresh: () => Promise<void> | void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const GlActualsTab: React.FC<GlActualsTabProps> = ({
  fiscalYear,
  selectedSite,
  onSiteChange,
  glActuals,
  opexItems,
  onRefresh,
  showToast
}) => {
  const [subView, setSubView] = useState<'ledger' | 'variance'>('ledger');
  const [varianceGroupBy, setVarianceGroupBy] = useState<'bu' | 'account' | 'month'>('bu');
  const [accountFilter, setAccountFilter] = useState('All Accounts');
  const [monthFilter, setMonthFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [formState, setFormState] = useState({
    posting_date: `${fiscalYear}-01-15`,
    external_document_no: '',
    document_no: '',
    gl_account_no: '630104',
    gl_account_name: 'Other Outside Services',
    item_value_desc: '',
    description: '',
    amount: 0,
    bu_code: 'K1'
  });

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const filteredLedger = useMemo(() => {
    const q = search.trim().toLowerCase();
    return glActuals.filter(g => {
      if (selectedSite !== 'All Sites') {
        if (normalizeBuCanonical(g.bu_code) !== normalizeBuCanonical(selectedSite)) return false;
      }
      if (accountFilter !== 'All Accounts') {
        if (extractGlCodeNumber(g.gl_account_no) !== extractGlCodeNumber(accountFilter)) return false;
      }
      if (monthFilter !== 'All') {
        const mIdx = MONTH_LABELS.indexOf(monthFilter as any);
        if (mIdx >= 0 && g.posting_date) {
          const dt = new Date(g.posting_date);
          if (isNaN(dt.getTime()) || dt.getMonth() !== mIdx) return false;
        }
      }
      if (!q) return true;
      return (
        (g.description || '').toLowerCase().includes(q) ||
        (g.item_value_desc || '').toLowerCase().includes(q) ||
        (g.external_document_no || '').toLowerCase().includes(q) ||
        (g.document_no || '').toLowerCase().includes(q) ||
        (g.gl_account_name || '').toLowerCase().includes(q) ||
        (g.gl_account_no || '').toLowerCase().includes(q)
      );
    });
  }, [glActuals, selectedSite, accountFilter, monthFilter, search]);

  const ledgerTotal = useMemo(
    () => filteredLedger.reduce((acc, g) => acc + (Number(g.amount) || 0), 0),
    [filteredLedger]
  );

  // Plan vs Actual Variance Aggregations
  const varianceByBU = useMemo(() => {
    const buKeys = ['K1', 'K2', 'KG', 'K3', 'Sakal Lab', 'All Sites'];
    const map: Record<string, { label: string; planned: number; actual: number; count: number }> = {};
    buKeys.forEach(k => {
      map[k] = { label: k === 'All Sites' ? 'All Sites / Shared' : formatBuDisplayLabel(k), planned: 0, actual: 0, count: 0 };
    });

    opexItems.forEach(o => {
      const norm = normalizeBuCanonical(o.site) || 'All Sites';
      if (!map[norm]) map[norm] = { label: formatBuDisplayLabel(norm), planned: 0, actual: 0, count: 0 };
      const plannedSum = MONTH_KEYS.reduce((s, m) => s + (Number(o.monthly_spending?.[m]?.planned) || 0), 0);
      map[norm].planned += plannedSum;
    });

    glActuals.forEach(g => {
      const norm = normalizeBuCanonical(g.bu_code) || 'All Sites';
      if (!map[norm]) map[norm] = { label: formatBuDisplayLabel(norm), planned: 0, actual: 0, count: 0 };
      map[norm].actual += Number(g.amount) || 0;
      map[norm].count += 1;
    });

    return Object.entries(map)
      .filter(([key, v]) => key !== 'All Sites' || v.planned > 0 || v.actual > 0)
      .map(([key, v]) => ({ key, ...v, variance: v.planned - v.actual }));
  }, [opexItems, glActuals]);

  const varianceByAccount = useMemo(() => {
    const map: Record<string, { code: string; name: string; planned: number; actual: number; count: number }> = {};
    COA_SUMMARY_2027.forEach(c => {
      map[c.account_code] = { code: c.account_code, name: c.account_name, planned: 0, actual: 0, count: 0 };
    });

    opexItems.forEach(o => {
      const code = extractGlCodeNumber(o.account_code) || '630104';
      const coa = findCoaByCode(code);
      if (!map[code]) map[code] = { code, name: coa?.account_name || o.account_name || code, planned: 0, actual: 0, count: 0 };
      const plannedSum = MONTH_KEYS.reduce((s, m) => s + (Number(o.monthly_spending?.[m]?.planned) || 0), 0);
      map[code].planned += plannedSum;
    });

    glActuals.forEach(g => {
      const code = extractGlCodeNumber(g.gl_account_no) || '630104';
      const coa = findCoaByCode(code);
      if (!map[code]) map[code] = { code, name: coa?.account_name || g.gl_account_name || code, planned: 0, actual: 0, count: 0 };
      map[code].actual += Number(g.amount) || 0;
      map[code].count += 1;
    });

    return Object.values(map)
      .filter(r => r.planned > 0 || r.actual > 0)
      .map(r => ({ ...r, variance: r.planned - r.actual }));
  }, [opexItems, glActuals]);

  const varianceByMonth = useMemo(() => {
    return MONTH_KEYS.map((mKey, idx) => {
      const planned = opexItems.reduce((acc, o) => acc + (Number(o.monthly_spending?.[mKey]?.planned) || 0), 0);
      const actual = glActuals
        .filter(g => {
          if (!g.posting_date) return false;
          const dt = new Date(g.posting_date);
          return !isNaN(dt.getTime()) && dt.getMonth() === idx;
        })
        .reduce((acc, g) => acc + (Number(g.amount) || 0), 0);
      return {
        month: MONTH_LABELS[idx],
        planned,
        actual,
        variance: planned - actual
      };
    });
  }, [opexItems, glActuals]);

  const handleAddGl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.description.trim() && !formState.item_value_desc.trim()) {
      showToast('Description is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/it-budget/gl-actuals', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...formState, fiscal_year: fiscalYear })
      });
      if (res.ok) {
        showToast('GL Actual posting recorded in COA Details', 'success');
        setShowAddForm(false);
        setFormState({
          posting_date: `${fiscalYear}-01-15`,
          external_document_no: '',
          document_no: '',
          gl_account_no: '630104',
          gl_account_name: 'Other Outside Services',
          item_value_desc: '',
          description: '',
          amount: 0,
          bu_code: 'K1'
        });
        await onRefresh();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to save GL actual entry', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGl = async (id: string) => {
    try {
      const res = await fetch(`/api/it-budget/gl-actuals/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('Deleted GL entry', 'info');
        await onRefresh();
      } else {
        showToast('Failed to delete GL entry', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleImportCoaDetailsExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseBudgetWorkbook(buf, fiscalYear);
      if (parsed.glActuals.length === 0) {
        showToast('No "COA Details" GL rows detected in the uploaded workbook.', 'error');
        return;
      }
      const res = await fetch('/api/it-budget/gl-actuals/bulk', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fiscal_year: fiscalYear,
          entries: parsed.glActuals,
          replaceExisting: false
        })
      });
      const data = await res.json();
      if (res.ok) {
        const warnText = parsed.warnings.length > 0 ? ` (${parsed.warnings.length} validation notices)` : '';
        showToast(`${data.message}${warnText}`, 'success');
        await onRefresh();
      } else {
        showToast(data.error || 'Failed to import COA Details', 'error');
      }
    } catch (err: any) {
      showToast('Error parsing Excel: ' + err.message, 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleSyncToOpex = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/it-budget/gl-actuals/sync-to-opex', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ fiscal_year: fiscalYear })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Synced GL actuals to OPEX plan & summary', 'success');
        await onRefresh();
      } else {
        showToast(data.error || 'Failed to sync GL actuals', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-view switcher */}
          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setSubView('ledger')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                subView === 'ledger' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Receipt size={13} />
              <span>GL Transaction Ledger ({filteredLedger.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubView('variance')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                subView === 'variance' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              <BarChart3 size={13} />
              <span>Plan vs. Actual Variance</span>
            </button>
          </div>

          {/* Site / BU Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Building2 size={13} className="text-slate-400 shrink-0" />
            <select
              value={selectedSite}
              onChange={(e) => onSiteChange(e.target.value)}
              className="text-xs bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              {ALL_BU_FILTER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSyncToOpex}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            title="Push COA Details totals into OPEX monthly actuals"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync GL Actuals to OPEX'}</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 whitespace-nowrap shrink-0 cursor-pointer">
            <Upload size={13} />
            <span>Import COA Details .xlsx</span>
            <input type="file" accept=".xlsx,.xls" onChange={handleImportCoaDetailsExcel} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            {showAddForm ? <X size={13} /> : <Plus size={13} />}
            <span>{showAddForm ? 'Close Form' : 'Add GL Entry'}</span>
          </button>
        </div>
      </div>

      {/* Add GL Entry Form */}
      {showAddForm && (
        <form onSubmit={handleAddGl} className="bg-white rounded-2xl border border-indigo-200 p-4 shadow-xs space-y-3 text-xs">
          <div className="font-bold text-slate-900">Record New GL Actual Line (COA Details — FY {fiscalYear})</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Posting Date *</label>
              <input
                type="date"
                required
                value={formState.posting_date}
                onChange={(e) => setFormState({ ...formState, posting_date: e.target.value })}
                className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Business Unit Code *</label>
              <select
                value={formState.bu_code}
                onChange={(e) => setFormState({ ...formState, bu_code: e.target.value })}
                className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
              >
                {CAPEX_BU_OPTIONS.map(b => (
                  <option key={b} value={b}>{formatBuDisplayLabel(b)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700">G/L Account No. *</label>
              <select
                value={formState.gl_account_no}
                onChange={(e) => {
                  const found = findCoaByCode(e.target.value);
                  setFormState({
                    ...formState,
                    gl_account_no: e.target.value,
                    gl_account_name: found ? found.account_name : formState.gl_account_name
                  });
                }}
                className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
              >
                {COA_SUMMARY_2027.map(c => (
                  <option key={c.account_code} value={c.account_code}>{c.account_code} — {c.account_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700">G/L Account Name</label>
              <select
                value={formState.gl_account_name}
                onChange={(e) => {
                  const found = findCoaByName(e.target.value);
                  setFormState({
                    ...formState,
                    gl_account_name: e.target.value,
                    gl_account_no: found ? found.account_code : formState.gl_account_no
                  });
                }}
                className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                {COA_SUMMARY_2027.map(c => (
                  <option key={c.account_code} value={c.account_name}>{c.account_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700">Document No.</label>
              <input
                type="text"
                placeholder="e.g. PINV-2027-0142"
                value={formState.document_no}
                onChange={(e) => setFormState({ ...formState, document_no: e.target.value })}
                className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">External Document No.</label>
              <input
                type="text"
                placeholder="Vendor Invoice #"
                value={formState.external_document_no}
                onChange={(e) => setFormState({ ...formState, external_document_no: e.target.value })}
                className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">ItemValue_Desc</label>
              <input
                type="text"
                placeholder="Short category / vendor item"
                value={formState.item_value_desc}
                onChange={(e) => setFormState({ ...formState, item_value_desc: e.target.value })}
                className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formState.amount}
                onChange={(e) => setFormState({ ...formState, amount: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-mono font-bold"
              />
            </div>
          </div>
          <div>
            <label className="font-semibold text-slate-700">Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly Dedicated Fiber Internet — K1 TK Campus"
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              {saving ? 'Saving...' : 'Save GL Line'}
            </button>
          </div>
        </form>
      )}

      {/* VIEW 1: GL TRANSACTION LEDGER */}
      {subView === 'ledger' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search doc #, item, description..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <BookOpen size={13} className="text-slate-400" />
                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className="text-xs bg-transparent font-medium text-slate-700 focus:outline-none"
                >
                  <option value="All Accounts">All 17 G/L Accounts</option>
                  {COA_SUMMARY_2027.map(c => (
                    <option key={c.account_code} value={c.account_code}>{c.account_code} — {c.account_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                <Calendar size={13} className="text-slate-400" />
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="text-xs bg-transparent font-medium text-slate-700 focus:outline-none"
                >
                  <option value="All">All Months</option>
                  {MONTH_LABELS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs font-medium text-slate-600">
              Filtered GL Total:{' '}
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                ${ledgerTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Posting Date</th>
                    <th className="py-2.5 px-3">External Doc No.</th>
                    <th className="py-2.5 px-3">Document No.</th>
                    <th className="py-2.5 px-3">G/L Account No.</th>
                    <th className="py-2.5 px-3">G/L Account Name</th>
                    <th className="py-2.5 px-3">ItemValue_Desc</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">BU Code</th>
                    <th className="py-2.5 px-3 text-right">Amount ($)</th>
                    <th className="py-2.5 px-2 text-center">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        No GL actual lines found for FY {fiscalYear}. Add a line or import your "COA Details" worksheet.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map(g => (
                      <tr key={g.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">{g.posting_date}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{g.external_document_no || '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold">{g.document_no || '—'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{g.gl_account_no}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{g.gl_account_name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{g.item_value_desc || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-800 max-w-xs">{g.description}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                          {formatBuDisplayLabel(g.bu_code)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          ${Number(g.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteGl(g.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 cursor-pointer"
                            title="Delete GL line"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredLedger.length > 0 && (
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                    <tr>
                      <td colSpan={8} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px] text-slate-500">
                        Subtotal ({filteredLedger.length} GL Postings)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        ${ledgerTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

      {/* VIEW 2: PLAN VS. ACTUAL VARIANCE */}
      {subView === 'variance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">OPEX Plan vs. GL Actual Variance View (FY {fiscalYear})</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregates Planned OPEX against COA Details GL Actuals with unified K3 / Sakal site normalization.
              </p>
            </div>
            <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setVarianceGroupBy('bu')}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${varianceGroupBy === 'bu' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
              >
                By BU
              </button>
              <button
                type="button"
                onClick={() => setVarianceGroupBy('account')}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${varianceGroupBy === 'account' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
              >
                By G/L Account
              </button>
              <button
                type="button"
                onClick={() => setVarianceGroupBy('month')}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${varianceGroupBy === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
              >
                By Month
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">
                    {varianceGroupBy === 'bu' ? 'Business Unit (Normalized)' : varianceGroupBy === 'account' ? 'G/L Account' : 'Month'}
                  </th>
                  <th className="py-2.5 px-4 text-right">Planned OPEX ($)</th>
                  <th className="py-2.5 px-4 text-right">GL Actual ($)</th>
                  <th className="py-2.5 px-4 text-right">Variance ($)</th>
                  <th className="py-2.5 px-4 text-right">% Realized</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(varianceGroupBy === 'bu' ? varianceByBU : varianceGroupBy === 'account' ? varianceByAccount : varianceByMonth).map((row: any, i: number) => {
                  const pct = row.planned > 0 ? Math.round((row.actual / row.planned) * 100) : (row.actual > 0 ? 100 : 0);
                  const isUnder = row.variance >= 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {varianceGroupBy === 'bu'
                          ? row.label
                          : varianceGroupBy === 'account'
                          ? <><span className="font-mono text-indigo-700 mr-2">{row.code}</span>{row.name}</>
                          : row.month}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                        ${row.planned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                        ${row.actual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`py-2.5 px-4 text-right font-mono font-bold tabular-nums ${isUnder ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {isUnder ? '+' : ''}${row.variance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">{pct}%</td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                          isUnder ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {isUnder ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                          {isUnder ? 'Under Plan' : 'Over Plan'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
