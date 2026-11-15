import React, { useState, useMemo } from 'react';
import { Layers, X, AlertTriangle, CheckCircle2, Sparkles, Tag, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  ASSET_TYPES_MASTER,
  CAPEX_BU_OPTIONS,
  CAPEX_STAGE_TAGS,
  CAPEX_STATUSES_2027,
  DEPT_DEFINITIONS,
  MONTH_KEYS,
  MONTH_LABELS,
  UnitPriceCatalogItem,
  distributeAmountAcrossMonths,
  findAssetTypeMeta,
  formatBuDisplayLabel,
  formatBuForCapex,
  normalizeCapexStage,
  normalizeCapexStatus,
  normalizeDepartmentCode
} from '../../src/data/itBudget2027MasterData';

export interface CapexModalProps {
  fiscalYear: number;
  item: any | null;
  unitPriceCatalog: UnitPriceCatalogItem[];
  preselectedBenchmark?: UnitPriceCatalogItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export const CapexEditModal: React.FC<CapexModalProps> = ({
  fiscalYear,
  item,
  unitPriceCatalog,
  preselectedBenchmark,
  onClose,
  onSaved
}) => {
  const initialAssetType = item?.asset_type || preselectedBenchmark?.asset_category || 'Computer';
  const initialMeta = findAssetTypeMeta(initialAssetType);

  const [bu, setBu] = useState(formatBuForCapex(item?.site || item?.bu || 'K1'));
  const [capexCode, setCapexCode] = useState(
    item?.capex_code || `K1000${Math.floor(Math.random() * 900) + 100}`
  );
  const [description, setDescription] = useState(item?.description || preselectedBenchmark?.item_name || '');
  const [specifications, setSpecifications] = useState(
    item?.specifications || preselectedBenchmark?.brand_model || ''
  );
  const [assetType, setAssetType] = useState(initialAssetType);
  const [assetOwner, setAssetOwner] = useState(item?.asset_owner || initialMeta?.asset_owner || 'IT');
  const [assetSupervisor, setAssetSupervisor] = useState(item?.asset_supervisor || initialMeta?.asset_supervisor || 'ITO');
  const [justification, setJustification] = useState(item?.justification || preselectedBenchmark?.remark || '');
  const [department, setDepartment] = useState(normalizeDepartmentCode(item?.department || 'IT'));
  const [costCenter, setCostCenter] = useState(item?.cost_center || 'IT');
  const [pic, setPic] = useState(item?.pic || 'Braseth');
  const [qty, setQty] = useState<number>(item?.qty || 1);
  const [unitPrice, setUnitPrice] = useState<number>(
    item?.unit_price !== undefined ? Number(item.unit_price) : (preselectedBenchmark?.unit_price || 0)
  );
  const [expectedStartMonth, setExpectedStartMonth] = useState(item?.expected_start_month || 'Jan');
  const [expectedCompleteMonth, setExpectedCompleteMonth] = useState(item?.expected_complete_month || 'Dec');
  const [status, setStatus] = useState<string>(normalizeCapexStatus(item?.status));
  const [stageTag, setStageTag] = useState<string>(normalizeCapexStage(item?.stage_tag, item?.status));

  const [monthlySpending, setMonthlySpending] = useState<Record<string, { planned: number; actual: number }>>(() => {
    if (item?.monthly_spending && typeof item.monthly_spending === 'object') {
      const cloned: Record<string, { planned: number; actual: number }> = {};
      MONTH_KEYS.forEach(m => {
        cloned[m] = {
          planned: Number(item.monthly_spending?.[m]?.planned) || 0,
          actual: Number(item.monthly_spending?.[m]?.actual) || 0
        };
      });
      return cloned;
    }
    const initTotal = Math.round(((item?.qty || 1) * (preselectedBenchmark?.unit_price || 0)) * 100) / 100;
    return distributeAmountAcrossMonths(initTotal, 'Jan', 'Dec');
  });

  const [showBenchmarkPicker, setShowBenchmarkPicker] = useState(false);
  const [benchmarkQuery, setBenchmarkQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totalEstCost = Math.round((Number(qty) || 0) * (Number(unitPrice) || 0) * 100) / 100;
  const monthlyPlannedSum = useMemo(
    () => Math.round(MONTH_KEYS.reduce((acc, m) => acc + (Number(monthlySpending[m]?.planned) || 0), 0) * 100) / 100,
    [monthlySpending]
  );
  const allocationDiff = Math.round((totalEstCost - monthlyPlannedSum) * 100) / 100;
  const hasAllocationMismatch = Math.abs(allocationDiff) > 0.01;

  const q1 = (monthlySpending.jan?.planned || 0) + (monthlySpending.feb?.planned || 0) + (monthlySpending.mar?.planned || 0);
  const q2 = (monthlySpending.apr?.planned || 0) + (monthlySpending.may?.planned || 0) + (monthlySpending.jun?.planned || 0);
  const q3 = (monthlySpending.jul?.planned || 0) + (monthlySpending.aug?.planned || 0) + (monthlySpending.sep?.planned || 0);
  const q4 = (monthlySpending.oct?.planned || 0) + (monthlySpending.nov?.planned || 0) + (monthlySpending.dec?.planned || 0);

  const filteredBenchmarks = useMemo(() => {
    const q = benchmarkQuery.trim().toLowerCase();
    return unitPriceCatalog.filter(u =>
      !q ||
      u.item_name.toLowerCase().includes(q) ||
      u.asset_category.toLowerCase().includes(q) ||
      u.brand_model.toLowerCase().includes(q) ||
      u.vendor.toLowerCase().includes(q)
    );
  }, [unitPriceCatalog, benchmarkQuery]);

  const handleAssetTypeChange = (nextType: string) => {
    setAssetType(nextType);
    const meta = findAssetTypeMeta(nextType);
    if (meta) {
      setAssetOwner(meta.asset_owner);
      setAssetSupervisor(meta.asset_supervisor);
    }
  };

  const handleBuChange = (nextBu: string) => {
    setBu(nextBu);
    if (!item) {
      const prefix = nextBu === 'Sakal Lab' ? 'SKPH' : nextBu;
      const suffix = capexCode.replace(/^[A-Za-z]+/, '') || `000${Math.floor(Math.random() * 900) + 100}`;
      setCapexCode(`${prefix}${suffix}`);
    }
  };

  const handleDistributeEvenly = () => {
    const distributed = distributeAmountAcrossMonths(totalEstCost, expectedStartMonth, expectedCompleteMonth);
    setMonthlySpending(prev => {
      const next: Record<string, { planned: number; actual: number }> = {};
      MONTH_KEYS.forEach(m => {
        next[m] = { planned: distributed[m].planned, actual: prev[m]?.actual || 0 };
      });
      return next;
    });
  };

  const applyBenchmark = (b: UnitPriceCatalogItem) => {
    if (!description.trim()) setDescription(b.item_name);
    if (!specifications.trim()) setSpecifications(b.brand_model);
    handleAssetTypeChange(b.asset_category);
    setUnitPrice(Number(b.unit_price) || 0);
    setShowBenchmarkPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!description.trim()) {
      setErrorMsg('Description is required.');
      return;
    }

    setSaving(true);
    try {
      const url = item ? `/api/it-budget/capex/${item.id}` : '/api/it-budget/capex';
      const method = item ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fiscal_year: fiscalYear,
          site: bu,
          capex_code: capexCode.trim(),
          description: description.trim(),
          specifications: specifications.trim(),
          asset_type: assetType,
          asset_owner: assetOwner,
          asset_supervisor: assetSupervisor,
          justification: justification.trim(),
          department,
          cost_center: costCenter.trim() || 'IT',
          pic: pic.trim() || 'Braseth',
          project_owner: pic.trim() || 'Braseth',
          qty: Number(qty) || 1,
          unit_price: Number(unitPrice) || 0,
          requested_amount: totalEstCost,
          expected_start_month: expectedStartMonth,
          expected_complete_month: expectedCompleteMonth,
          status,
          stage_tag: stageTag,
          monthly_spending: monthlySpending
        })
      });

      if (res.ok) {
        onSaved();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || 'Failed to save CapEx item.');
      }
    } catch (err: any) {
      setErrorMsg('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const primaryItAssets = ASSET_TYPES_MASTER.filter(a => a.is_it);
  const nonItAssets = ASSET_TYPES_MASTER.filter(a => !a.is_it);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl max-w-3xl w-full max-h-[92vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers size={18} className="text-indigo-600" />
            <span>{item ? 'Edit CapEx Plan Line' : 'New 2027 CapEx Plan Line'} (FY {fiscalYear})</span>
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-center gap-2">
            <AlertTriangle size={14} className="text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Row 1: BU, Capex#, Department, Cost Center */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-semibold text-slate-700">BU / Site Code *</label>
              <select
                value={bu}
                onChange={(e) => handleBuChange(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
              >
                {CAPEX_BU_OPTIONS.map(b => (
                  <option key={b} value={b}>{formatBuDisplayLabel(b)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700">Capex# *</label>
              <input
                type="text"
                required
                placeholder="K1000xxx"
                value={capexCode}
                onChange={(e) => setCapexCode(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
              >
                {DEPT_DEFINITIONS.map(d => (
                  <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700">Cost Center / PIC</label>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                <input
                  type="text"
                  placeholder="CC"
                  value={costCenter}
                  onChange={(e) => setCostCenter(e.target.value)}
                  className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
                <input
                  type="text"
                  placeholder="PIC"
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Description & Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Description *</label>
                <button
                  type="button"
                  onClick={() => setShowBenchmarkPicker(!showBenchmarkPicker)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <Tag size={11} />
                  <span>{showBenchmarkPicker ? 'Hide Price Catalog' : 'Est. Unit Price Lookup'}</span>
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. AIO Desktop Workstation Upgrade"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Specifications</label>
              <input
                type="text"
                placeholder="e.g. Dell OptiPlex 7420 AIO, Core i5, 16GB RAM, 512GB NVMe"
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Historical Benchmark Price Picker */}
          {showBenchmarkPicker && (
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-indigo-950 text-[11px]">
                  FY2025–FY2026 Historical Unit Price Catalog (Click to populate)
                </span>
                <div className="relative w-52">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={benchmarkQuery}
                    onChange={(e) => setBenchmarkQuery(e.target.value)}
                    placeholder="Filter catalog..."
                    className="w-full pl-7 pr-2 py-1 text-[11px] bg-white border border-indigo-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="max-h-36 overflow-y-auto divide-y divide-indigo-100 bg-white rounded-lg border border-indigo-100">
                {filteredBenchmarks.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => applyBenchmark(b)}
                    className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{b.item_name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{b.asset_category} · {b.brand_model} · {b.vendor}</div>
                    </div>
                    <span className="font-mono font-bold text-indigo-700 shrink-0">${Number(b.unit_price).toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Row 3: Asset Type (Auto-populates Owner & Supervisor) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <label className="font-semibold text-slate-700">Asset Type *</label>
              <select
                value={assetType}
                onChange={(e) => handleAssetTypeChange(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800"
              >
                <optgroup label="Primary IT Asset Types">
                  {primaryItAssets.map(a => (
                    <option key={a.asset_type} value={a.asset_type}>{a.asset_type} ({a.code})</option>
                  ))}
                </optgroup>
                <optgroup label="Cross-Departmental Asset Types">
                  {nonItAssets.map(a => (
                    <option key={a.asset_type} value={a.asset_type}>{a.asset_type} ({a.code})</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700">Asset Owner (Auto)</label>
              <input
                type="text"
                value={assetOwner}
                onChange={(e) => setAssetOwner(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-white border border-slate-200 rounded-xl font-mono font-semibold text-slate-700"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Asset Supervisor (Auto)</label>
              <input
                type="text"
                value={assetSupervisor}
                onChange={(e) => setAssetSupervisor(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-white border border-slate-200 rounded-xl font-mono font-semibold text-slate-700"
              />
            </div>
          </div>

          {/* Row 4: Qty, Est. Unit Cost, Total Est. Cost + Timeline & Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Qty *</label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Est. Unit Cost ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700">Total Est. Cost = ROUND(Qty * Unit Cost, 2)</label>
              <input
                type="text"
                disabled
                value={`$${totalEstCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className="w-full mt-1 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-right font-mono font-bold text-indigo-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Expected Start Month</label>
              <select
                value={expectedStartMonth}
                onChange={(e) => setExpectedStartMonth(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                {MONTH_LABELS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700">Expected Complete Month</label>
              <select
                value={expectedCompleteMonth}
                onChange={(e) => setExpectedCompleteMonth(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                {MONTH_LABELS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                {CAPEX_STATUSES_2027.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700">Stage / Category Tag</label>
              <select
                value={stageTag}
                onChange={(e) => setStageTag(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                {CAPEX_STAGE_TAGS.map(tg => (
                  <option key={tg} value={tg}>{tg}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly Cash Flow Schedule + Validation Alert + Distribute Evenly */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <span>Monthly Spending Schedule (Jan–Dec {fiscalYear})</span>
                  {hasAllocationMismatch ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <AlertTriangle size={11} />
                      {allocationDiff > 0 ? `Unallocated: $${allocationDiff.toLocaleString()}` : `Over-allocated: $${Math.abs(allocationDiff).toLocaleString()}`}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={11} />
                      100% Matched
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  Q1: ${q1.toLocaleString()} · Q2: ${q2.toLocaleString()} · Q3: ${q3.toLocaleString()} · Q4: ${q4.toLocaleString()} · Total: ${monthlyPlannedSum.toLocaleString()}
                </div>
              </div>

              <button
                type="button"
                onClick={handleDistributeEvenly}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles size={12} />
                <span>Distribute Evenly ({expectedStartMonth}–{expectedCompleteMonth})</span>
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {MONTH_KEYS.map((m, idx) => (
                <div key={m} className="bg-white rounded-lg border border-slate-200 p-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">{MONTH_LABELS[idx]}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={monthlySpending[m]?.planned ?? 0}
                    onChange={(e) => {
                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                      setMonthlySpending(prev => ({
                        ...prev,
                        [m]: { ...(prev[m] || { planned: 0, actual: 0 }), planned: val }
                      }));
                    }}
                    className="w-full mt-0.5 text-right font-mono text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700">Justification</label>
            <textarea
              rows={2}
              placeholder="Operational or clinical rationale..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              {saving ? 'Saving...' : item ? 'Update CapEx Line' : 'Create CapEx Line'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
