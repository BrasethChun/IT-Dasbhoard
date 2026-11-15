import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp, X, AlertTriangle, AlertCircle, SlidersHorizontal,
  Sparkles, Check, Layers, Calendar
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  COA_SUMMARY_2027,
  MONTH_KEYS,
  MONTH_LABELS,
  OPEX_BU_OPTIONS,
  extractGlCodeNumber,
  findCoaByCode,
  findCoaByName,
  formatBuDisplayLabel,
  formatBuForOpex
} from '../../src/data/itBudget2027MasterData';

export interface OpexAccountCodeItem {
  id?: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  is_active?: boolean | number;
  sort_order?: number;
}

interface OpexModalProps {
  fiscalYear: number;
  item: any | null;
  accountCodes: OpexAccountCodeItem[];
  onManageAccountCodes: () => void;
  onClose: () => void;
  onSaved: () => void;
}

export const OpexEditModal: React.FC<OpexModalProps> = ({
  fiscalYear,
  item,
  accountCodes,
  onManageAccountCodes,
  onClose,
  onSaved
}) => {
  // Build unified Account list starting with official 17 COA Summary + any custom codes
  const combinedAccounts = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    COA_SUMMARY_2027.forEach(c => map.set(c.account_code, { code: c.account_code, name: c.account_name }));
    accountCodes.forEach(ac => {
      const six = extractGlCodeNumber(ac.code);
      if (!map.has(six)) {
        map.set(six || ac.code, { code: six || ac.code, name: ac.name });
      }
    });
    return Array.from(map.values());
  }, [accountCodes]);

  const initialCode = extractGlCodeNumber(item?.account_code) || '630104';
  const initialCoa = findCoaByCode(initialCode) || combinedAccounts.find(a => a.code === initialCode);

  const [description, setDescription] = useState(item?.description || '');
  const [remark, setRemark] = useState(item?.remark || item?.justification || '');
  const [accountCode, setAccountCode] = useState(initialCoa?.code || initialCode);
  const [accountName, setAccountName] = useState(initialCoa?.name || item?.account_name || 'Other Outside Services');
  const [site, setSite] = useState(formatBuForOpex(item?.site || 'K1'));
  const [costCenter, setCostCenter] = useState(item?.cost_center || 'IT');
  const [pic, setPic] = useState(item?.pic || 'Braseth');
  const [billingCycle, setBillingCycle] = useState<string>(item?.billing_cycle || 'Monthly');
  const [renewalDate, setRenewalDate] = useState(item?.renewal_date ? String(item.renewal_date).slice(0, 10) : '');
  const [qty, setQty] = useState<number>(item?.qty || 1);
  const [unitPrice, setUnitPrice] = useState<number>(item?.unit_price || 0);
  const [budgetClassification, setBudgetClassification] = useState<'Planned' | 'Unplanned'>(
    item?.budget_classification === 'Unplanned' ? 'Unplanned' : 'Planned'
  );
  const [unplannedReason, setUnplannedReason] = useState(item?.unplanned_reason || '');
  const [approvalRef, setApprovalRef] = useState(item?.approval_ref || '');
  const [autoSmartSpread, setAutoSmartSpread] = useState<boolean>(!item);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(() => new Set(MONTH_KEYS));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const computeSmartSpread = (cycle: string, renDate: string, price: number, q: number) => {
    const total = Number(price || 0) * Number(q || 1);
    const spending: Record<string, { planned: number; actual: number }> = {};
    MONTH_KEYS.forEach(m => { spending[m] = { planned: 0, actual: 0 }; });

    if (cycle === 'Monthly') {
      MONTH_KEYS.forEach(m => { spending[m] = { planned: total, actual: 0 }; });
    } else if (cycle === 'Quarterly') {
      const qAmt = Math.round((total / 4) * 100) / 100;
      spending.mar = { planned: qAmt, actual: 0 };
      spending.jun = { planned: qAmt, actual: 0 };
      spending.sep = { planned: qAmt, actual: 0 };
      spending.dec = { planned: qAmt, actual: 0 };
    } else {
      let targetIdx = 0;
      if (renDate) {
        const parts = renDate.slice(0, 10).split('-');
        if (parts.length >= 2) {
          const m = parseInt(parts[1], 10);
          if (!isNaN(m) && m >= 1 && m <= 12) targetIdx = m - 1;
        }
      }
      spending[MONTH_KEYS[targetIdx] || 'jan'] = { planned: total, actual: 0 };
    }
    return spending;
  };

  const [monthlySpending, setMonthlySpending] = useState<Record<string, { planned: number; actual: number }>>(() => {
    if (item?.monthly_spending && typeof item.monthly_spending === 'object' && Object.keys(item.monthly_spending).length > 0) {
      const cloned: Record<string, { planned: number; actual: number }> = {};
      MONTH_KEYS.forEach(m => {
        cloned[m] = {
          planned: Number(item.monthly_spending?.[m]?.planned) || 0,
          actual: Number(item.monthly_spending?.[m]?.actual) || 0
        };
      });
      return cloned;
    }
    return computeSmartSpread(billingCycle, renewalDate, unitPrice, qty);
  });

  useEffect(() => {
    if (autoSmartSpread) {
      setMonthlySpending(prev => {
        const spread = computeSmartSpread(billingCycle, renewalDate, unitPrice, qty);
        const next: Record<string, { planned: number; actual: number }> = {};
        MONTH_KEYS.forEach(m => {
          next[m] = { planned: spread[m].planned, actual: prev[m]?.actual || 0 };
        });
        return next;
      });
    }
  }, [billingCycle, renewalDate, unitPrice, qty, autoSmartSpread]);

  const handleAccountCodeChange = (newCode: string) => {
    if (newCode === '__MANAGE__') {
      onManageAccountCodes();
      return;
    }
    setAccountCode(newCode);
    const match = findCoaByCode(newCode) || combinedAccounts.find(a => a.code === newCode);
    if (match) setAccountName('account_name' in match ? match.account_name : match.name);
  };

  const handleAccountNameChange = (newName: string) => {
    setAccountName(newName);
    const match = findCoaByName(newName) || combinedAccounts.find(a => a.name.toLowerCase() === newName.toLowerCase());
    if (match) setAccountCode('account_code' in match ? match.account_code : match.code);
  };

  const applyQuickFillSelectedMonths = () => {
    setAutoSmartSpread(false);
    const monthlyValue = Math.round((Number(qty) || 1) * (Number(unitPrice) || 0) * 100) / 100;
    setMonthlySpending(prev => {
      const next: Record<string, { planned: number; actual: number }> = {};
      MONTH_KEYS.forEach(m => {
        next[m] = {
          planned: selectedMonths.has(m) ? monthlyValue : (prev[m]?.planned || 0),
          actual: prev[m]?.actual || 0
        };
      });
      return next;
    });
  };

  const annualPlannedTotal = useMemo(
    () => Math.round(MONTH_KEYS.reduce((acc, m) => acc + (Number(monthlySpending[m]?.planned) || 0), 0) * 100) / 100,
    [monthlySpending]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!description.trim()) {
      setErrorMsg('Description is required.');
      return;
    }

    setSaving(true);
    try {
      const url = item ? `/api/it-budget/opex/${item.id}` : '/api/it-budget/opex';
      const method = item ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fiscal_year: fiscalYear,
          description: description.trim(),
          remark: remark.trim(),
          justification: remark.trim(),
          account_code: accountCode,
          account_name: accountName,
          site,
          cost_center: costCenter.trim() || 'IT',
          pic: pic.trim() || 'Braseth',
          billing_cycle: billingCycle,
          renewal_date: renewalDate || null,
          qty: Number(qty) || 1,
          unit_price: Number(unitPrice) || 0,
          budget_classification: budgetClassification,
          unplanned_reason: budgetClassification === 'Unplanned' ? unplannedReason.trim() : '',
          approval_ref: budgetClassification === 'Unplanned' ? approvalRef.trim() : '',
          autoSmartSpread,
          monthly_spending: monthlySpending
        })
      });

      if (res.ok) {
        onSaved();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || 'Failed to save OpEx line');
      }
    } catch (err: any) {
      setErrorMsg('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl max-w-3xl w-full max-h-[92vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-600" />
            <span>{item ? 'Edit 2027 OPEX Plan Line' : 'New 2027 OPEX Plan Line'} (FY {fiscalYear})</span>
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
          {/* Governance Classification Card */}
          <div className={`p-3.5 rounded-2xl border space-y-3 ${
            budgetClassification === 'Unplanned' ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-50/70 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <span>Budget Governance:</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  budgetClassification === 'Unplanned'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {budgetClassification === 'Unplanned' ? 'Out-of-Budget / Unplanned' : 'Planned Baseline'}
                </span>
              </div>
              <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 gap-1">
                <button
                  type="button"
                  onClick={() => setBudgetClassification('Planned')}
                  className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
                    budgetClassification === 'Planned' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Planned Budget
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetClassification('Unplanned')}
                  className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
                    budgetClassification === 'Unplanned' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-800'
                  }`}
                >
                  Out-of-Budget
                </button>
              </div>
            </div>

            {budgetClassification === 'Unplanned' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-amber-200/70">
                <div>
                  <label className="font-bold text-[11px] text-amber-950 block mb-1">Unplanned Root Cause</label>
                  <select
                    value={unplannedReason}
                    onChange={(e) => setUnplannedReason(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-medium"
                  >
                    <option value="">Select Root Cause...</option>
                    <option value="Critical Outage / Emergency Recovery">Critical Outage / Emergency Recovery</option>
                    <option value="Unforeseen Vendor SLA / Renewal Hike">Unforeseen Vendor SLA / Renewal Hike</option>
                    <option value="Regulatory / Clinical Compliance Mandate">Regulatory / Clinical Compliance Mandate</option>
                    <option value="Hardware Failure Replacement">Hardware Failure Replacement</option>
                    <option value="New Urgent Clinical Service Request">New Urgent Clinical Service Request</option>
                    <option value="Other Unbudgeted Operational Need">Other Unbudgeted Operational Need</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[11px] text-amber-950 block mb-1">Approval Ref / Exception Code</label>
                  <input
                    type="text"
                    placeholder="e.g. EXC-2027-014"
                    value={approvalRef}
                    onChange={(e) => setApprovalRef(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-mono"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dedicated Fiber Internet Primary Link (TK)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Remark (Vendor, Contract Period, VAT/WHT)</label>
                <input
                  type="text"
                  placeholder="e.g. Vendor: Ezecom · 12-mo SLA · Excl. 10% VAT"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Two-Way COA Lookup + BU + Cost Center + PIC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Account Code (Two-Way Lookup)</label>
                <button
                  type="button"
                  onClick={onManageAccountCodes}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  <SlidersHorizontal size={11} />
                  <span>Manage Codes</span>
                </button>
              </div>
              <select
                value={accountCode}
                onChange={(e) => handleAccountCodeChange(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
              >
                {combinedAccounts.map(a => (
                  <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
                ))}
                <option value="__MANAGE__">+ Manage / Configure Account Codes...</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Account Name (Auto-Synced)</label>
              <select
                value={accountName}
                onChange={(e) => handleAccountNameChange(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
              >
                {combinedAccounts.map(a => (
                  <option key={a.code} value={a.name}>{a.name} ({a.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700">BU / Site</label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                <option value="All Sites">All Sites</option>
                {OPEX_BU_OPTIONS.map(b => (
                  <option key={b} value={b}>{b === 'Sakal' ? 'Sakal (K3 / Sakal 2004)' : formatBuDisplayLabel(b)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700">Cost Center</label>
              <input
                type="text"
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">PIC</label>
              <input
                type="text"
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Qty</label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right font-mono"
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
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="font-semibold text-slate-700">Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="Monthly">Monthly</option>
                <option value="Annual">Annual</option>
                <option value="Quarterly">Quarterly</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700">Renewal Date (Optional)</label>
              <input
                type="date"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50/70 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSmartSpread}
                onChange={(e) => setAutoSmartSpread(e.target.checked)}
                className="rounded border-emerald-300 text-emerald-600"
              />
              <span className="font-semibold text-emerald-900 flex items-center gap-1">
                <Sparkles size={13} className="text-emerald-600" />
                Auto Smart Spread
              </span>
            </label>
          </div>

          {/* Quick-Fill Helper + Editable 12-Month Plan Grid */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <Calendar size={14} className="text-emerald-600" />
                  <span>2027 Monthly OPEX Plan (Annual Total: ${annualPlannedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Toggle months below and apply <span className="font-mono font-semibold text-slate-800">${(qty * unitPrice).toLocaleString()}</span> (Qty &times; Unit Price).
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedMonths(new Set(MONTH_KEYS))}
                  className="px-2 py-1 rounded-md text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  All 12 Mo
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMonths(new Set())}
                  className="px-2 py-1 rounded-md text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Clear Sel
                </button>
                <button
                  type="button"
                  onClick={applyQuickFillSelectedMonths}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Check size={12} />
                  <span>Apply Qty &times; Unit Price ({selectedMonths.size} mo)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {MONTH_KEYS.map((m, idx) => {
                const isSelected = selectedMonths.has(m);
                return (
                  <div
                    key={m}
                    className={`rounded-lg border p-1.5 transition-colors ${
                      isSelected ? 'bg-white border-emerald-300' : 'bg-slate-100/70 border-slate-200'
                    }`}
                  >
                    <label className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase cursor-pointer">
                      <span>{MONTH_LABELS[idx]}</span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const next = new Set(selectedMonths);
                          if (e.target.checked) next.add(m);
                          else next.delete(m);
                          setSelectedMonths(next);
                        }}
                        className="rounded border-slate-300 text-emerald-600"
                      />
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={monthlySpending[m]?.planned ?? 0}
                      onChange={(e) => {
                        setAutoSmartSpread(false);
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setMonthlySpending(prev => ({
                          ...prev,
                          [m]: { ...(prev[m] || { planned: 0, actual: 0 }), planned: val }
                        }));
                      }}
                      className="w-full mt-0.5 text-right font-mono text-xs font-semibold text-slate-900 focus:outline-none bg-transparent"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              {saving ? 'Saving...' : item ? 'Update OpEx Line' : 'Create OpEx Line'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
