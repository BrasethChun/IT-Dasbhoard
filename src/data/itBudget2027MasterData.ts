// Official 2027 IT CapEx & Operational (OPEX) Master Reference Tables & Helpers

export const MONTH_KEYS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
] as const;

export type MonthKey = typeof MONTH_KEYS[number];

export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
] as const;

export const CAPEX_STATUSES_2027 = ['In Progress', 'Complete', 'Cancelled'] as const;
export type CapexStatus2027 = typeof CAPEX_STATUSES_2027[number];

export const CAPEX_STAGE_TAGS = ['Estimate', 'Agreement', 'Bill', 'Planning'] as const;
export type CapexStageTag = typeof CAPEX_STAGE_TAGS[number];

// 1. Business Units (BU / Site Codes)
export interface BusinessUnitMaster {
  code: string;
  opex_code: string;
  canonical_key: string;
  name: string;
  aliases: string[];
  description: string;
}

export const BU_MASTER_LIST: BusinessUnitMaster[] = [
  {
    code: 'K1',
    opex_code: 'K1',
    canonical_key: 'K1',
    name: 'Khema TK',
    aliases: ['K1', 'Khema TK', 'Toul Kork', 'TK'],
    description: 'Khema International Polyclinic — Toul Kork Campus'
  },
  {
    code: 'K2',
    opex_code: 'K2',
    canonical_key: 'K2',
    name: 'Khema BKK',
    aliases: ['K2', 'Khema BKK', 'Boeung Keng Kang', 'BKK'],
    description: 'Khema International Polyclinic — BKK Campus'
  },
  {
    code: 'KG',
    opex_code: 'KG',
    canonical_key: 'KG',
    name: 'Khema Global',
    aliases: ['KG', 'Khema Global', 'Global', 'HQ'],
    description: 'Khema Global Shared Services & Corporate HQ'
  },
  {
    code: 'K3',
    opex_code: 'Sakal',
    canonical_key: 'K3',
    name: 'Sakal 2004',
    aliases: ['K3', 'Sakal', 'Sakal 2004', 'K3 / Sakal'],
    description: 'Sakal 2004 Medical Center (Normalized across K3 & Sakal)'
  },
  {
    code: 'Sakal Lab',
    opex_code: 'Sakal Lab',
    canonical_key: 'Sakal Lab',
    name: 'Sakal Lab',
    aliases: ['Sakal Lab', 'Sakal Laboratory', 'SL'],
    description: 'Sakal Clinical Diagnostic Laboratory Unit'
  }
];

export const CAPEX_BU_OPTIONS = ['K1', 'K2', 'KG', 'K3', 'Sakal Lab'] as const;
export const OPEX_BU_OPTIONS = ['K1', 'K2', 'KG', 'Sakal', 'Sakal Lab'] as const;
export const ALL_BU_FILTER_OPTIONS = [
  { value: 'All Sites', label: 'All Sites (BU)' },
  { value: 'K1', label: 'K1 — Khema TK' },
  { value: 'K2', label: 'K2 — Khema BKK' },
  { value: 'KG', label: 'KG — Khema Global' },
  { value: 'K3', label: 'K3 / Sakal — Sakal 2004' },
  { value: 'Sakal Lab', label: 'Sakal Lab' }
];

/**
 * Normalizes any BU / Site string so K3 and Sakal (Sakal 2004) aggregate together seamlessly,
 * while preserving Sakal Lab as a distinct laboratory unit.
 */
export function normalizeBuCanonical(raw?: string | null): string {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  const lower = trimmed.toLowerCase();
  if (!lower || lower === 'all' || lower === 'all sites' || lower === 'all bus') return 'All Sites';
  if (lower === 'sakal lab' || lower.includes('sakal lab')) return 'Sakal Lab';
  if (lower === 'k1' || lower.includes('khema tk') || lower.includes('toul kork')) return 'K1';
  if (lower === 'k2' || lower.includes('khema bkk') || lower.includes('boeung')) return 'K2';
  if (lower === 'kg' || lower.includes('khema global')) return 'KG';
  if (lower === 'k3' || lower === 'sakal' || lower.includes('sakal 2004') || lower === 'k3 / sakal') return 'K3';
  return trimmed;
}

export function formatBuForCapex(raw?: string | null): string {
  const c = normalizeBuCanonical(raw);
  if (c === 'All Sites') return 'All Sites';
  return c || 'K1';
}

export function formatBuForOpex(raw?: string | null): string {
  const c = normalizeBuCanonical(raw);
  if (c === 'K3') return 'Sakal';
  if (c === 'All Sites') return 'All Sites';
  return c || 'K1';
}

export function formatBuDisplayLabel(raw?: string | null): string {
  const c = normalizeBuCanonical(raw);
  const found = BU_MASTER_LIST.find(b => b.canonical_key === c);
  if (found) {
    return found.canonical_key === 'K3' ? 'K3 / Sakal (Sakal 2004)' : `${found.code} (${found.name})`;
  }
  return raw || '—';
}

export function matchesBuFilter(rowSite?: string | null, selectedFilter?: string | null): boolean {
  if (!selectedFilter || selectedFilter === 'All Sites' || selectedFilter === 'All') return true;
  const normRow = normalizeBuCanonical(rowSite);
  const normFilter = normalizeBuCanonical(selectedFilter);
  return normRow === normFilter;
}

// 2. Departments (Dept. Definition)
export interface DeptDefinition {
  code: string;
  name: string;
  description: string;
  is_default?: boolean;
}

export const DEPT_DEFINITIONS: DeptDefinition[] = [
  { code: 'ADM', name: 'Administration', description: 'All furniture, including patient beds' },
  { code: 'FMD', name: 'Facility Management', description: 'MEP, HVAC, Vehicle, Building Construction or Renovation' },
  { code: 'HR', name: 'Human Resource', description: 'HR-related equipment or tools' },
  { code: 'IT', name: 'Information Technology', description: 'All IT equipment and software licensing', is_default: true },
  { code: 'MD', name: 'Medical', description: 'Medical equipment/tools/devices' },
  { code: 'PD', name: 'Procurement', description: 'Any relevant batch purchase deemed as assets' },
  { code: 'PRD', name: 'Public Relations', description: 'Relevant licensing, equipment, or tools such as Display Panels' }
];

export function normalizeDepartmentCode(raw?: string | null): string {
  const val = String(raw || '').trim();
  if (!val) return 'IT';
  const upper = val.toUpperCase();
  if (upper === 'IT DEPARTMENT' || upper === 'INFORMATION TECHNOLOGY' || upper === 'IT') return 'IT';
  const match = DEPT_DEFINITIONS.find(
    d => d.code.toUpperCase() === upper || d.name.toUpperCase() === upper
  );
  return match ? match.code : val;
}

// 3. Asset Types Master
export interface AssetTypeMaster {
  code: string;
  asset_type: string;
  explanation: string;
  asset_owner: string;
  asset_supervisor: string;
  is_it: boolean;
}

export const ASSET_TYPES_MASTER: AssetTypeMaster[] = [
  // Primary IT Asset Types
  {
    code: 'IT',
    asset_type: 'CCTV Camera',
    explanation: 'All security cameras and relevant equipment',
    asset_owner: 'IT',
    asset_supervisor: 'ITO',
    is_it: true
  },
  {
    code: 'IT',
    asset_type: 'Computer',
    explanation: 'AIO Desktop, Laptop, Mobile Work Station',
    asset_owner: 'IT',
    asset_supervisor: 'ITO',
    is_it: true
  },
  {
    code: 'IT',
    asset_type: 'Electronics',
    explanation: 'Smart TV, deskphone, mobile phone, etc.',
    asset_owner: 'IT',
    asset_supervisor: 'ITO',
    is_it: true
  },
  {
    code: 'IT',
    asset_type: 'IT Equipment',
    explanation: 'Other IT equipment incl. UPS, Server Rack, On-Premise Cloud Storage, etc.',
    asset_owner: 'IT',
    asset_supervisor: 'ITO',
    is_it: true
  },
  {
    code: 'IT',
    asset_type: 'Printer',
    explanation: 'All types of printers',
    asset_owner: 'IT',
    asset_supervisor: 'ITO',
    is_it: true
  },
  {
    code: 'IT',
    asset_type: 'Server',
    explanation: 'Server',
    asset_owner: 'IT',
    asset_supervisor: 'ITO',
    is_it: true
  },
  {
    code: 'IT',
    asset_type: 'Software License',
    explanation: 'License Fee (excluding annual maintenance or subscription fee)',
    asset_owner: 'IT',
    asset_supervisor: 'ITO',
    is_it: true
  },
  // Non-IT Cross-Departmental Asset Types
  {
    code: 'AD',
    asset_type: 'Consumer Electrics',
    explanation: 'General office/patient consumer electrical appliances',
    asset_owner: 'ADM',
    asset_supervisor: 'Admin Lead',
    is_it: false
  },
  {
    code: 'AD',
    asset_type: 'General Furniture',
    explanation: 'Desks, chairs, cabinets, waiting area seating, non-medical fixtures',
    asset_owner: 'ADM',
    asset_supervisor: 'Admin Lead',
    is_it: false
  },
  {
    code: 'FM',
    asset_type: 'Building',
    explanation: 'Building construction, structural extensions, and renovations',
    asset_owner: 'FMD',
    asset_supervisor: 'Facility Lead',
    is_it: false
  },
  {
    code: 'FM',
    asset_type: 'HVAC',
    explanation: 'Heating, ventilation, and air-conditioning systems',
    asset_owner: 'FMD',
    asset_supervisor: 'Facility Lead',
    is_it: false
  },
  {
    code: 'FM',
    asset_type: 'MEP',
    explanation: 'Mechanical, electrical, and plumbing infrastructure',
    asset_owner: 'FMD',
    asset_supervisor: 'Facility Lead',
    is_it: false
  },
  {
    code: 'FM',
    asset_type: 'Vehicle',
    explanation: 'Ambulances, fleet vehicles, and facility transport',
    asset_owner: 'FMD',
    asset_supervisor: 'Facility Lead',
    is_it: false
  },
  {
    code: 'HR',
    asset_type: 'HR Tools',
    explanation: 'HR-related training equipment, biometric/onboarding tools',
    asset_owner: 'HR',
    asset_supervisor: 'HR Lead',
    is_it: false
  },
  {
    code: 'MD',
    asset_type: 'Medical Equipment',
    explanation: 'Diagnostic, imaging, ICU, and surgical clinical capital equipment',
    asset_owner: 'MD',
    asset_supervisor: 'Biomedical / CMO',
    is_it: false
  },
  {
    code: 'MD',
    asset_type: 'Medical Furniture',
    explanation: 'Patient beds, examination tables, clinical carts',
    asset_owner: 'MD',
    asset_supervisor: 'Nursing / Admin',
    is_it: false
  },
  {
    code: 'MD',
    asset_type: 'Medical Software',
    explanation: 'Specialized clinical software platforms and diagnostic systems',
    asset_owner: 'MD',
    asset_supervisor: 'CMO / IT',
    is_it: false
  },
  {
    code: 'MD',
    asset_type: 'Medical Tool',
    explanation: 'Reusable clinical instruments and procedural tools',
    asset_owner: 'MD',
    asset_supervisor: 'Medical Lead',
    is_it: false
  },
  {
    code: 'PR',
    asset_type: 'Marketing Electrics',
    explanation: 'Illuminated signage, lightbox displays, event electrical gear',
    asset_owner: 'PRD',
    asset_supervisor: 'PR Lead',
    is_it: false
  },
  {
    code: 'PR',
    asset_type: 'Marketing Electronics',
    explanation: 'Digital signage panels, cameras, studio & display electronics',
    asset_owner: 'PRD',
    asset_supervisor: 'PR Lead',
    is_it: false
  }
];

export function findAssetTypeMeta(assetTypeName?: string | null): AssetTypeMaster | undefined {
  if (!assetTypeName) return undefined;
  const lower = assetTypeName.trim().toLowerCase();
  const exact = ASSET_TYPES_MASTER.find(a => a.asset_type.toLowerCase() === lower);
  if (exact) return exact;
  if (lower.includes('cctv') || lower.includes('camera')) return ASSET_TYPES_MASTER.find(a => a.asset_type === 'CCTV Camera');
  if (lower.includes('laptop') || lower.includes('computer') || lower.includes('desktop')) return ASSET_TYPES_MASTER.find(a => a.asset_type === 'Computer');
  if (lower.includes('printer')) return ASSET_TYPES_MASTER.find(a => a.asset_type === 'Printer');
  if (lower.includes('server')) return ASSET_TYPES_MASTER.find(a => a.asset_type === 'Server');
  if (lower.includes('software') || lower.includes('license')) return ASSET_TYPES_MASTER.find(a => a.asset_type === 'Software License');
  if (lower.includes('tv') || lower.includes('phone') || lower.includes('electronic')) return ASSET_TYPES_MASTER.find(a => a.asset_type === 'Electronics');
  if (lower.includes('network') || lower.includes('storage') || lower.includes('ups') || lower.includes('rack') || lower.includes('hardware') || lower.includes('it equipment')) {
    return ASSET_TYPES_MASTER.find(a => a.asset_type === 'IT Equipment');
  }
  return undefined;
}

// 4. Business / Service Lines (Business Line Master — 13 Groups)
export interface BusinessLineMaster {
  id: string;
  service_group: string;
  sub_line: string;
  status: 'Primary' | 'Supplementary' | 'New/Piloted' | 'Unavailable' | 'Closed';
  head_of_service: string;
  responsible_team: string;
  account_number: string;
  khema_tk: boolean;
  khema_bkk: boolean;
  sakal_2004: boolean;
  included_in_plans: boolean;
}

export const BUSINESS_LINES_MASTER: BusinessLineMaster[] = [
  {
    id: 'BL-01',
    service_group: '1. ER-OR-ICU',
    sub_line: 'Emergency Room, Operating Theatre & Intensive Care Unit',
    status: 'Primary',
    head_of_service: 'Head of Critical Care',
    responsible_team: 'ER / OR / ICU Clinical Team',
    account_number: 'BL-1010',
    khema_tk: true,
    khema_bkk: true,
    sakal_2004: false,
    included_in_plans: true
  },
  {
    id: 'BL-02',
    service_group: '2. OPD-IPD (Adult)',
    sub_line: 'Adult Outpatient Consultation & Inpatient Wards',
    status: 'Primary',
    head_of_service: 'Head of Internal Medicine',
    responsible_team: 'Adult OPD & IPD Nursing',
    account_number: 'BL-1020',
    khema_tk: true,
    khema_bkk: true,
    sakal_2004: true,
    included_in_plans: true
  },
  {
    id: 'BL-03',
    service_group: '3. Health Checkup',
    sub_line: 'Executive & Corporate Wellness Screening Packages',
    status: 'Primary',
    head_of_service: 'Health Checkup Lead',
    responsible_team: 'Wellness Screening Team',
    account_number: 'BL-1030',
    khema_tk: true,
    khema_bkk: true,
    sakal_2004: true,
    included_in_plans: true
  },
  {
    id: 'BL-04',
    service_group: '4. Pediatrics',
    sub_line: 'Pediatric OPD, Vaccination & Neonatal Support',
    status: 'Primary',
    head_of_service: 'Head of Pediatrics',
    responsible_team: 'Pediatric Care Team',
    account_number: 'BL-1040',
    khema_tk: true,
    khema_bkk: true,
    sakal_2004: true,
    included_in_plans: true
  },
  {
    id: 'BL-05',
    service_group: '5. Obstetrics & Gynecology',
    sub_line: 'Maternity, Antenatal Care & Gynecology',
    status: 'Primary',
    head_of_service: 'Head of OB-GYN',
    responsible_team: 'OB-GYN & Delivery Team',
    account_number: 'BL-1050',
    khema_tk: true,
    khema_bkk: true,
    sakal_2004: true,
    included_in_plans: true
  },
  {
    id: 'BL-06',
    service_group: '6. Cardiology',
    sub_line: 'Cardiac Diagnostics, ECG, Echo & Outpatient Care',
    status: 'Supplementary',
    head_of_service: 'Lead Cardiologist',
    responsible_team: 'Cardiology Clinic',
    account_number: 'BL-1060',
    khema_tk: true,
    khema_bkk: true,
    sakal_2004: false,
    included_in_plans: true
  },
  {
    id: 'BL-07',
    service_group: '7. GI',
    sub_line: 'Gastroenterology & Endoscopy Center',
    status: 'Supplementary',
    head_of_service: 'Lead Gastroenterologist',
    responsible_team: 'Endoscopy Unit',
    account_number: 'BL-1070',
    khema_tk: true,
    khema_bkk: false,
    sakal_2004: false,
    included_in_plans: true
  },
  {
    id: 'BL-08',
    service_group: '8. Hemodialysis',
    sub_line: 'Renal Dialysis Center',
    status: 'New/Piloted',
    head_of_service: 'Nephrology Lead',
    responsible_team: 'Dialysis Nursing Team',
    account_number: 'BL-1080',
    khema_tk: true,
    khema_bkk: false,
    sakal_2004: false,
    included_in_plans: true
  },
  {
    id: 'BL-09',
    service_group: '9. Urology',
    sub_line: 'Urology Consultation & Minor Procedures',
    status: 'Supplementary',
    head_of_service: 'Urology Specialist',
    responsible_team: 'Surgical OPD Team',
    account_number: 'BL-1090',
    khema_tk: true,
    khema_bkk: true,
    sakal_2004: false,
    included_in_plans: true
  },
  {
    id: 'BL-10',
    service_group: '10. Home Care',
    sub_line: 'Mobile Home Nursing & Post-Discharge Visits',
    status: 'New/Piloted',
    head_of_service: 'Home Care Coordinator',
    responsible_team: 'Mobile Care Team',
    account_number: 'BL-1100',
    khema_tk: true,
    khema_bkk: true,
    sakal_2004: true,
    included_in_plans: true
  },
  {
    id: 'BL-11',
    service_group: '11. Radiology',
    sub_line: 'CT, MRI, X-Ray, Ultrasound & PACS Imaging',
    status: 'Primary',
    head_of_service: 'Head of Radiology',
    responsible_team: 'Imaging & PACS Team',
    account_number: 'BL-1110',
    khema_tk: true,
    khema_bkk: true,
    sakal_2004: true,
    included_in_plans: true
  },
  {
    id: 'BL-12',
    service_group: '12. Laboratory',
    sub_line: 'Clinical Pathology, Microbiology & Sakal Lab',
    status: 'Primary',
    head_of_service: 'Head of Laboratory',
    responsible_team: 'LIS & Lab Operations',
    account_number: 'BL-1120',
    khema_tk: true,
    khema_bkk: true,
    sakal_2004: true,
    included_in_plans: true
  },
  {
    id: 'BL-13',
    service_group: '13. Pharmacy',
    sub_line: 'Inpatient & Outpatient Dispensing & Inventory',
    status: 'Primary',
    head_of_service: 'Chief Pharmacist',
    responsible_team: 'Hospital Pharmacy Team',
    account_number: 'BL-1130',
    khema_tk: true,
    khema_bkk: true,
    sakal_2004: true,
    included_in_plans: true
  }
];

// 5. Chart of Accounts (COA Summary — 17 Official G/L Accounts for OPEX)
export interface CoaAccountMaster {
  account_code: string;
  account_name: string;
  category: string;
  sort_order: number;
}

export const COA_SUMMARY_2027: CoaAccountMaster[] = [
  { account_code: '612701', account_name: 'Training & Education', category: 'Training & Staff', sort_order: 1 },
  { account_code: '620104', account_name: 'Data Processing Supplies', category: 'IT Supplies', sort_order: 2 },
  { account_code: '620106', account_name: 'Office Supplies', category: 'Supplies', sort_order: 3 },
  { account_code: '620109', account_name: 'Small Tools & Equipment', category: 'Tools & Hardware', sort_order: 4 },
  { account_code: '620113', account_name: 'General Supplies', category: 'Supplies', sort_order: 5 },
  { account_code: '620199', account_name: 'Purchase Account', category: 'Procurement', sort_order: 6 },
  { account_code: '620200', account_name: 'Purchase Discount', category: 'Procurement', sort_order: 7 },
  { account_code: '630104', account_name: 'Other Outside Services', category: 'Outside Services', sort_order: 8 },
  { account_code: '640102', account_name: 'Media', category: 'Media & Comms', sort_order: 9 },
  { account_code: '660106', account_name: 'Own Meals', category: 'Travel & Meals', sort_order: 10 },
  { account_code: '660107', account_name: 'Transportation / Parking', category: 'Travel & Meals', sort_order: 11 },
  { account_code: '690101', account_name: 'Data', category: 'Telecom & Data', sort_order: 12 },
  { account_code: '690102', account_name: 'Voice communications', category: 'Telecom & Data', sort_order: 13 },
  { account_code: '691103', account_name: 'Rent - Non-Medical equipment', category: 'Equipment Lease', sort_order: 14 },
  { account_code: '692101', account_name: 'Main - Building / facility', category: 'Maintenance', sort_order: 15 },
  { account_code: '692103', account_name: 'Main - Non-Medical equipment', category: 'Maintenance', sort_order: 16 },
  { account_code: '698104', account_name: 'Withholding Taxes', category: 'Taxes', sort_order: 17 }
];

export function extractGlCodeNumber(raw?: string | null): string {
  const s = String(raw || '').trim();
  const m = s.match(/\b(\d{6})\b/);
  return m ? m[1] : s;
}

export function findCoaByCode(rawCode?: string | null): CoaAccountMaster | undefined {
  if (!rawCode) return undefined;
  const num = extractGlCodeNumber(rawCode);
  return COA_SUMMARY_2027.find(c => c.account_code === num || c.account_code === rawCode.trim());
}

export function findCoaByName(rawName?: string | null): CoaAccountMaster | undefined {
  if (!rawName) return undefined;
  const lower = rawName.trim().toLowerCase();
  return COA_SUMMARY_2027.find(c => c.account_name.toLowerCase() === lower);
}

// 6. Historical Unit Price Catalog (Est. Unit Price Benchmark FY2025-FY2026)
export interface UnitPriceCatalogItem {
  id: string;
  asset_category: string;
  capex_code: string;
  item_name: string;
  vendor: string;
  brand_model: string;
  posting_date: string;
  qty: number;
  unit_price: number;
  total_amount: number;
  remark: string;
}

export const HISTORICAL_UNIT_PRICE_CATALOG: UnitPriceCatalogItem[] = [
  {
    id: 'UP-01',
    asset_category: 'Computer',
    capex_code: 'K1000101',
    item_name: 'AIO Desktop Workstation',
    vendor: 'Chantra Technology',
    brand_model: 'Dell OptiPlex 7420 AIO (Core i5 / 16GB / 512GB)',
    posting_date: '2026-02-18',
    qty: 10,
    unit_price: 850,
    total_amount: 8500,
    remark: 'Standard OPD & Nursing Station terminal'
  },
  {
    id: 'UP-02',
    asset_category: 'Computer',
    capex_code: 'K2000104',
    item_name: 'Administrative Business Laptop',
    vendor: 'ICE Electronics',
    brand_model: 'Dell Latitude 5440 (Core i5 / 16GB / 512GB)',
    posting_date: '2026-03-11',
    qty: 5,
    unit_price: 1100,
    total_amount: 5500,
    remark: 'Clinical supervisors & management mobile workstation'
  },
  {
    id: 'UP-03',
    asset_category: 'Printer',
    capex_code: 'K1000095',
    item_name: 'Patient Smart Card Printer',
    vendor: 'Anana Computer',
    brand_model: 'Evolis Primacy 2 Duplex',
    posting_date: '2026-01-22',
    qty: 2,
    unit_price: 1450,
    total_amount: 2900,
    remark: 'Registration & patient card printing'
  },
  {
    id: 'UP-04',
    asset_category: 'Printer',
    capex_code: 'K3000042',
    item_name: 'Thermal Barcode Label Printer',
    vendor: 'Pacific Systems',
    brand_model: 'Zebra ZD421d Direct Thermal',
    posting_date: '2025-11-14',
    qty: 4,
    unit_price: 380,
    total_amount: 1520,
    remark: 'Lab sample & pharmacy barcode labeling'
  },
  {
    id: 'UP-05',
    asset_category: 'CCTV Camera',
    capex_code: 'K3000088',
    item_name: 'IP Dome Security Camera + 32Ch NVR',
    vendor: 'SecurTech Cambodia',
    brand_model: 'Hikvision 4MP AcuSense PoE + DS-7732NI',
    posting_date: '2025-09-25',
    qty: 1,
    unit_price: 3200,
    total_amount: 3200,
    remark: 'Full floor surveillance kit incl. HDD storage'
  },
  {
    id: 'UP-06',
    asset_category: 'IT Equipment',
    capex_code: 'KG000112',
    item_name: 'Online Rackmount UPS 3kVA',
    vendor: 'PowerNet Solutions',
    brand_model: 'APC Smart-UPS SRT3000RMXLI',
    posting_date: '2026-04-05',
    qty: 2,
    unit_price: 1650,
    total_amount: 3300,
    remark: 'Server rack power protection'
  },
  {
    id: 'UP-07',
    asset_category: 'IT Equipment',
    capex_code: 'KG000118',
    item_name: 'Synology NAS Enterprise Backup Unit',
    vendor: 'Chantra Technology',
    brand_model: 'Synology RS1221+ + 4x16TB Enterprise HDD',
    posting_date: '2025-10-19',
    qty: 1,
    unit_price: 2950,
    total_amount: 2950,
    remark: 'On-premise PACS & VM backup storage'
  },
  {
    id: 'UP-08',
    asset_category: 'Server',
    capex_code: 'KG000125',
    item_name: 'Rack Server Node (2U)',
    vendor: 'Anana Computer',
    brand_model: 'Dell PowerEdge R750xs Xeon Silver / 128GB RAM',
    posting_date: '2025-08-29',
    qty: 1,
    unit_price: 6800,
    total_amount: 6800,
    remark: 'HIS / virtualization host expansion'
  },
  {
    id: 'UP-09',
    asset_category: 'Electronics',
    capex_code: 'K2000110',
    item_name: 'Queue & OPD Display Smart TV 55"',
    vendor: 'Sunsimexco',
    brand_model: 'LG 55UT8050 Commercial 4K UHD',
    posting_date: '2026-03-27',
    qty: 3,
    unit_price: 540,
    total_amount: 1620,
    remark: 'OPD waiting queue signage screen'
  },
  {
    id: 'UP-10',
    asset_category: 'Software License',
    capex_code: 'KG000131',
    item_name: 'Microsoft Windows Server / Office Perpetual CAL Pack',
    vendor: 'NetKhmer Solutions',
    brand_model: 'Microsoft Open Value Perpetual License',
    posting_date: '2026-01-12',
    qty: 10,
    unit_price: 240,
    total_amount: 2400,
    remark: 'One-time perpetual licensing (excl. annual maintenance)'
  }
];

export function normalizeCapexStatus(raw?: string | null): CapexStatus2027 {
  const lower = String(raw || '').trim().toLowerCase();
  if (lower === 'complete' || lower === 'completed' || lower === 'done') return 'Complete';
  if (lower === 'cancelled' || lower === 'canceled') return 'Cancelled';
  return 'In Progress';
}

export function normalizeCapexStage(raw?: string | null, status?: string | null): CapexStageTag {
  const lower = String(raw || '').trim().toLowerCase();
  if (lower === 'estimate') return 'Estimate';
  if (lower === 'agreement') return 'Agreement';
  if (lower === 'bill' || lower === 'billed') return 'Bill';
  if (lower === 'planning') return 'Planning';
  const sLower = String(status || '').trim().toLowerCase();
  if (sLower === 'complete' || sLower === 'completed') return 'Bill';
  if (sLower === 'approved') return 'Agreement';
  return 'Planning';
}

export function monthLabelToIndex(val?: string | null): number {
  if (!val) return -1;
  const s = String(val).trim().toLowerCase();
  // Match 'Jan', 'January', '2027-01-15', '1'..'12'
  const idx = MONTH_KEYS.findIndex(m => s === m || s.startsWith(m));
  if (idx >= 0) return idx;
  const dateMatch = s.match(/^\d{4}-(\d{1,2})/);
  if (dateMatch) {
    const m = parseInt(dateMatch[1], 10) - 1;
    if (m >= 0 && m < 12) return m;
  }
  const num = parseInt(s, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) return num - 1;
  return -1;
}

export function indexToMonthLabel(idx: number): string {
  return MONTH_LABELS[Math.max(0, Math.min(11, idx))] || 'Jan';
}

export function distributeAmountAcrossMonths(
  totalAmount: number,
  startMonthLabel: string,
  completeMonthLabel: string
): Record<string, { planned: number; actual: number }> {
  const result: Record<string, { planned: number; actual: number }> = {};
  MONTH_KEYS.forEach(m => {
    result[m] = { planned: 0, actual: 0 };
  });

  const sIdx = Math.max(0, monthLabelToIndex(startMonthLabel));
  let eIdx = monthLabelToIndex(completeMonthLabel);
  if (eIdx < 0) eIdx = sIdx;
  if (eIdx < sIdx) eIdx = sIdx;

  const span = eIdx - sIdx + 1;
  const roundedTotal = Math.round((Number(totalAmount) || 0) * 100) / 100;
  if (roundedTotal <= 0 || span <= 0) return result;

  const baseShare = Math.floor((roundedTotal / span) * 100) / 100;
  let allocated = 0;

  for (let i = sIdx; i <= eIdx; i++) {
    const key = MONTH_KEYS[i];
    if (i === eIdx) {
      result[key].planned = Math.round((roundedTotal - allocated) * 100) / 100;
    } else {
      result[key].planned = baseShare;
      allocated += baseShare;
    }
  }
  return result;
}
