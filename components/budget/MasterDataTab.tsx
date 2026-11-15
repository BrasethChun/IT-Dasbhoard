import React, { useState, useMemo } from 'react';
import {
  Building2, Briefcase, Layers, GitBranch, BookOpen, Tag, Search, Plus,
  Trash2, CheckCircle2, XCircle, ArrowUpRight, ArrowRightLeft, SlidersHorizontal,
  X, Check, Info
} from 'lucide-react';
import {
  BU_MASTER_LIST,
  DEPT_DEFINITIONS,
  ASSET_TYPES_MASTER,
  BUSINESS_LINES_MASTER,
  COA_SUMMARY_2027,
  UnitPriceCatalogItem
} from '../../src/data/itBudget2027MasterData';

interface MasterDataTabProps {
  unitPriceCatalog: UnitPriceCatalogItem[];
  onRefreshMasterData: () => Promise<void> | void;
  onUseUnitPriceInCapex: (benchmark: UnitPriceCatalogItem) => void;
  onOpenAccountCodesModal: () => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

type MasterSubSection = 'bu' | 'dept' | 'assets' | 'business_lines' | 'coa' | 'unit_price';

export const MasterDataTab: React.FC<MasterDataTabProps> = ({
  unitPriceCatalog,
  onRefreshMasterData,
  onUseUnitPriceInCapex,
  onOpenAccountCodesModal,
  showToast
}) => {
  const [section, setSection] = useState<MasterSubSection>('bu');
  const [assetFilterScope, setAssetFilterScope] = useState<'all' | 'it' | 'non-it'>('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('All');
  const [showAddCatalogForm, setShowAddCatalogForm] = useState(false);

  // Two-way COA Lookup Tester
  const [lookupCode, setLookupCode] = useState('630104');
  const [lookupName, setLookupName] = useState('Other Outside Services');

  // Add Benchmark Item Form State
  const [newItem, setNewItem] = useState({
    asset_category: 'Computer',
    capex_code: '',
    item_name: '',
    vendor: '',
    brand_model: '',
    posting_date: new Date().toISOString().slice(0, 10),
    qty: 1,
    unit_price: 0,
    remark: ''
  });
  const [savingCatalog, setSavingCatalog] = useState(false);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const filteredAssets = useMemo(() => {
    if (assetFilterScope === 'it') return ASSET_TYPES_MASTER.filter(a => a.is_it);
    if (assetFilterScope === 'non-it') return ASSET_TYPES_MASTER.filter(a => !a.is_it);
    return ASSET_TYPES_MASTER;
  }, [assetFilterScope]);

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return unitPriceCatalog.filter(u => {
      if (catalogCategoryFilter !== 'All' && u.asset_category !== catalogCategoryFilter) return false;
      if (!q) return true;
      return (
        u.item_name.toLowerCase().includes(q) ||
        u.vendor.toLowerCase().includes(q) ||
        u.brand_model.toLowerCase().includes(q) ||
        u.capex_code.toLowerCase().includes(q) ||
        u.asset_category.toLowerCase().includes(q)
      );
    });
  }, [unitPriceCatalog, catalogSearch, catalogCategoryFilter]);

  const catalogCategories = useMemo(() => {
    const set = new Set<string>(unitPriceCatalog.map(u => u.asset_category).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [unitPriceCatalog]);

  const handleAddCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.item_name.trim()) {
      showToast('Item Name is required', 'error');
      return;
    }
    setSavingCatalog(true);
    try {
      const res = await fetch('/api/it-budget/unit-price-catalog', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
        showToast('Benchmark unit price item added to catalog', 'success');
        setShowAddCatalogForm(false);
        setNewItem({
          asset_category: 'Computer',
          capex_code: '',
          item_name: '',
          vendor: '',
          brand_model: '',
          posting_date: new Date().toISOString().slice(0, 10),
          qty: 1,
          unit_price: 0,
          remark: ''
        });
        await onRefreshMasterData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to add unit price benchmark', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingCatalog(false);
    }
  };

  const handleDeleteCatalog = async (id: string) => {
    try {
      const res = await fetch(`/api/it-budget/unit-price-catalog/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast('Removed benchmark item', 'info');
        await onRefreshMasterData();
      } else {
        showToast('Failed to delete benchmark item', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const navItems: Array<{ id: MasterSubSection; label: string; count: number; icon: any }> = [
    { id: 'bu', label: 'Business Units (BU)', count: BU_MASTER_LIST.length, icon: Building2 },
    { id: 'dept', label: 'Dept. Definition', count: DEPT_DEFINITIONS.length, icon: Briefcase },
    { id: 'assets', label: 'Asset Types', count: ASSET_TYPES_MASTER.length, icon: Layers },
    { id: 'business_lines', label: 'Business Line', count: BUSINESS_LINES_MASTER.length, icon: GitBranch },
    { id: 'coa', label: 'COA Summary (OPEX)', count: COA_SUMMARY_2027.length, icon: BookOpen },
    { id: 'unit_price', label: 'Est. Unit Price Catalog', count: unitPriceCatalog.length, icon: Tag }
  ];

  return (
    <div className="space-y-4">
      {/* Header & Section Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              2027 Master Data &amp; Reference Tables
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official lookup tables governing Business Units, Departments, Asset Taxonomy, Clinical Service Lines, G/L COA, and Historical Unit Cost Benchmarks.
            </p>
          </div>
          <span className="text-[11px] font-medium text-slate-500 font-mono shrink-0">
            6 Reference Datasets Active
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer border ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Icon size={13} />
                <span>{item.label}</span>
                <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${active ? 'bg-white/15 text-white' : 'bg-slate-200/70 text-slate-700'}`}>
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. BUSINESS UNITS */}
      {section === 'bu' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Business Units (BU / Site Codes)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Seamless normalization automatically groups <span className="font-mono font-semibold text-slate-800">K3</span> and <span className="font-mono font-semibold text-slate-800">Sakal</span> (Sakal 2004) during GL/actual imports while isolating <span className="font-mono font-semibold text-slate-800">Sakal Lab</span>.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg shrink-0">
              <ArrowRightLeft size={13} />
              <span>K3 &harr; Sakal Normalized</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">CapEx BU Code</th>
                  <th className="py-2.5 px-4">OpEx BU Code</th>
                  <th className="py-2.5 px-4">Site Name</th>
                  <th className="py-2.5 px-4">Accepted Import Aliases</th>
                  <th className="py-2.5 px-4">Scope Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {BU_MASTER_LIST.map(bu => (
                  <tr key={bu.canonical_key} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{bu.code}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700">{bu.opex_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{bu.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{bu.aliases.join(' · ')}</td>
                    <td className="py-3 px-4 text-slate-500">{bu.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. DEPARTMENTS */}
      {section === 'dept' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Departments (Dept. Definition)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Standardized department codes across Khema Global. <span className="font-mono font-semibold text-slate-800">IT</span> is selected by default for IT CapEx items.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-28">Dept. Code</th>
                  <th className="py-2.5 px-4 w-56">Department Name</th>
                  <th className="py-2.5 px-4">Scope &amp; Asset Responsibility</th>
                  <th className="py-2.5 px-4 w-32 text-center">Default</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DEPT_DEFINITIONS.map(dept => (
                  <tr key={dept.code} className={dept.is_default ? 'bg-indigo-50/30 hover:bg-indigo-50/50' : 'hover:bg-slate-50/60'}>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{dept.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{dept.name}</td>
                    <td className="py-3 px-4 text-slate-600">{dept.description}</td>
                    <td className="py-3 px-4 text-center">
                      {dept.is_default ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Check size={11} /> IT Default
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ASSET TYPES MASTER */}
      {section === 'assets' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Asset Types Master Taxonomy</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecting an Asset Type in CapEx automatically populates Asset Owner &amp; Asset Supervisor metadata.
              </p>
            </div>
            <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setAssetFilterScope('all')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${assetFilterScope === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
              >
                All ({ASSET_TYPES_MASTER.length})
              </button>
              <button
                type="button"
                onClick={() => setAssetFilterScope('it')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${assetFilterScope === 'it' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'}`}
              >
                Primary IT ({ASSET_TYPES_MASTER.filter(a => a.is_it).length})
              </button>
              <button
                type="button"
                onClick={() => setAssetFilterScope('non-it')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${assetFilterScope === 'non-it' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
              >
                Cross-Dept ({ASSET_TYPES_MASTER.filter(a => !a.is_it).length})
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-20">Code</th>
                  <th className="py-2.5 px-4 w-48">Asset Type</th>
                  <th className="py-2.5 px-4">Explanation</th>
                  <th className="py-2.5 px-4 w-28">Asset Owner</th>
                  <th className="py-2.5 px-4 w-36">Asset Supervisor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map(a => (
                  <tr key={`${a.code}-${a.asset_type}`} className={a.is_it ? 'bg-indigo-50/20 hover:bg-indigo-50/40' : 'hover:bg-slate-50/60'}>
                    <td className="py-2.5 px-4">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded border text-[11px] ${
                        a.is_it ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {a.code}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{a.asset_type}</span>
                        {a.is_it && (
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                            IT Primary
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{a.explanation}</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-800">{a.asset_owner}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">{a.asset_supervisor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. BUSINESS / SERVICE LINES (13 GROUPS) */}
      {section === 'business_lines' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Business / Service Lines (13 Service Groups)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Clinical and operational service lines mapped by campus availability and CapEx/OpEx plan inclusion.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Service Group</th>
                  <th className="py-2.5 px-3">Sub-Lines / Scope</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Head / Team</th>
                  <th className="py-2.5 px-3 font-mono">Acct #</th>
                  <th className="py-2.5 px-2 text-center">KHEMA TK</th>
                  <th className="py-2.5 px-2 text-center">KHEMA BKK</th>
                  <th className="py-2.5 px-2 text-center">SAKAL 2004</th>
                  <th className="py-2.5 px-3 text-center">In Plans</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {BUSINESS_LINES_MASTER.map(bl => (
                  <tr key={bl.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">{bl.service_group}</td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs">{bl.sub_line}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                        bl.status === 'Primary' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        bl.status === 'New/Piloted' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        bl.status === 'Supplementary' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {bl.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{bl.head_of_service}</div>
                      <div className="text-[11px] text-slate-400">{bl.responsible_team}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{bl.account_number}</td>
                    <td className="py-2.5 px-2 text-center">
                      {bl.khema_tk ? <CheckCircle2 size={14} className="mx-auto text-emerald-600" /> : <XCircle size={14} className="mx-auto text-slate-300" />}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {bl.khema_bkk ? <CheckCircle2 size={14} className="mx-auto text-emerald-600" /> : <XCircle size={14} className="mx-auto text-slate-300" />}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      {bl.sakal_2004 ? <CheckCircle2 size={14} className="mx-auto text-emerald-600" /> : <XCircle size={14} className="mx-auto text-slate-300" />}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {bl.included_in_plans ? (
                        <span className="font-mono font-bold text-emerald-700">YES</span>
                      ) : (
                        <span className="font-mono text-slate-400">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. COA SUMMARY (17 G/L ACCOUNTS) */}
      {section === 'coa' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Chart of Accounts (COA Summary — 17 OPEX G/L Accounts)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Two-way auto-lookup binds Account Code and Account Name across OPEX Plan and GL Actuals (COA Details).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <span className="text-slate-400 font-medium">Lookup Test:</span>
                <select
                  value={lookupCode}
                  onChange={(e) => {
                    const c = COA_SUMMARY_2027.find(x => x.account_code === e.target.value);
                    setLookupCode(e.target.value);
                    if (c) setLookupName(c.account_name);
                  }}
                  className="bg-transparent font-mono font-bold text-slate-800 focus:outline-none"
                >
                  {COA_SUMMARY_2027.map(c => (
                    <option key={c.account_code} value={c.account_code}>{c.account_code}</option>
                  ))}
                </select>
                <span className="text-slate-300">&harr;</span>
                <select
                  value={lookupName}
                  onChange={(e) => {
                    const c = COA_SUMMARY_2027.find(x => x.account_name === e.target.value);
                    setLookupName(e.target.value);
                    if (c) setLookupCode(c.account_code);
                  }}
                  className="bg-transparent font-semibold text-indigo-700 focus:outline-none"
                >
                  {COA_SUMMARY_2027.map(c => (
                    <option key={c.account_code} value={c.account_name}>{c.account_name}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={onOpenAccountCodesModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                <SlidersHorizontal size={13} />
                <span>Manage Account Codes</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 w-12">#</th>
                    <th className="py-2.5 px-4 w-36">Account Code</th>
                    <th className="py-2.5 px-4">Account Name</th>
                    <th className="py-2.5 px-4 w-44">Category Group</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COA_SUMMARY_2027.map((c, idx) => (
                    <tr key={c.account_code} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{c.account_code}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{c.account_name}</td>
                      <td className="py-2.5 px-4 text-slate-600">{c.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. HISTORICAL UNIT PRICE CATALOG */}
      {section === 'unit_price' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search item, vendor, brand/model, CapEx code..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <select
                value={catalogCategoryFilter}
                onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                {catalogCategories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Asset Categories' : cat}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowAddCatalogForm(!showAddCatalogForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              {showAddCatalogForm ? <X size={13} /> : <Plus size={13} />}
              <span>{showAddCatalogForm ? 'Close Form' : 'Add Benchmark Item'}</span>
            </button>
          </div>

          {showAddCatalogForm && (
            <form onSubmit={handleAddCatalog} className="bg-white rounded-2xl border border-indigo-200 p-4 shadow-xs space-y-3 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Tag size={14} className="text-indigo-600" />
                <span>Add FY2025–FY2026 Historical Unit Price Benchmark</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Asset Category *</label>
                  <select
                    value={newItem.asset_category}
                    onChange={(e) => setNewItem({ ...newItem, asset_category: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {ASSET_TYPES_MASTER.filter(a => a.is_it).map(a => (
                      <option key={a.asset_type} value={a.asset_type}>{a.asset_type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">CapEx Code</label>
                  <input
                    type="text"
                    placeholder="e.g. K1000105"
                    value={newItem.capex_code}
                    onChange={(e) => setNewItem({ ...newItem, capex_code: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise PoE Switch 48-Port"
                    value={newItem.item_name}
                    onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Vendor</label>
                  <input
                    type="text"
                    value={newItem.vendor}
                    onChange={(e) => setNewItem({ ...newItem, vendor: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Brand / Model</label>
                  <input
                    type="text"
                    value={newItem.brand_model}
                    onChange={(e) => setNewItem({ ...newItem, brand_model: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Posting Date</label>
                  <input
                    type="date"
                    value={newItem.posting_date}
                    onChange={(e) => setNewItem({ ...newItem, posting_date: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Unit (Qty)</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.qty}
                    onChange={(e) => setNewItem({ ...newItem, qty: parseInt(e.target.value, 10) || 1 })}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Remark</label>
                  <input
                    type="text"
                    value={newItem.remark}
                    onChange={(e) => setNewItem({ ...newItem, remark: e.target.value })}
                    className="w-full mt-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddCatalogForm(false)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={savingCatalog} className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                  {savingCatalog ? 'Saving...' : 'Save Benchmark'}
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Info size={13} className="text-indigo-600" />
                Reference FY2025–FY2026 historical unit prices when estimating 2027 CapEx items.
              </span>
              <span className="font-mono font-semibold">{filteredCatalog.length} items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">CapEx Code</th>
                    <th className="py-2.5 px-3">Item Name &amp; Brand/Model</th>
                    <th className="py-2.5 px-3">Vendor</th>
                    <th className="py-2.5 px-3">Posting Date</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCatalog.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-semibold text-indigo-700 whitespace-nowrap">{u.asset_category}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">{u.capex_code || '—'}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{u.item_name}</div>
                        <div className="text-[11px] text-slate-500">{u.brand_model || u.remark}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{u.vendor || '—'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {u.posting_date ? String(u.posting_date).slice(0, 10) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">{u.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ${Number(u.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        ${Number(u.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onUseUnitPriceInCapex(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer"
                            title="Pre-fill a new 2027 CapEx item using this benchmark price"
                          >
                            <span>Use in CapEx</span>
                            <ArrowUpRight size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCatalog(u.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 cursor-pointer"
                            title="Delete benchmark"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
