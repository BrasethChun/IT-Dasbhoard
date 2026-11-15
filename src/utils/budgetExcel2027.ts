import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import {
  ASSET_TYPES_MASTER,
  BUSINESS_LINES_MASTER,
  COA_SUMMARY_2027,
  DEPT_DEFINITIONS,
  HISTORICAL_UNIT_PRICE_CATALOG,
  MONTH_KEYS,
  MONTH_LABELS,
  findAssetTypeMeta,
  findCoaByCode,
  findCoaByName,
  formatBuForCapex,
  formatBuForOpex,
  normalizeBuCanonical,
  normalizeCapexStage,
  normalizeCapexStatus,
  normalizeDepartmentCode,
  monthLabelToIndex,
  indexToMonthLabel,
  UnitPriceCatalogItem
} from '../data/itBudget2027MasterData';

export type BudgetExportMode = 'planned' | 'actual' | 'both';

export interface ParsedGlActualRow {
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
  source: string;
}

export interface ParsedWorkbookResult {
  capexItems: any[];
  opexItems: any[];
  glActuals: ParsedGlActualRow[];
  warnings: string[];
  detectedSheets: string[];
}

const VALID_CAPEX_BUS = new Set(['K1', 'K2', 'KG', 'K3', 'Sakal Lab', 'All Sites']);
const VALID_OPEX_BUS = new Set(['K1', 'K2', 'KG', 'K3', 'Sakal', 'Sakal Lab', 'All Sites']);

// Standard Excel Formats & Borders
const ACC_USD_FMT = '_("$"* #,##0.00_);_("$"* \\(#,##0.00\\);_("$"* "-"??_);_(@_)';
const ACC_DASH_FMT = '_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)';
const MONTH_BLANK_ZERO_FMT = '#,##0.00;(#,##0.00);""';

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } }
};

const MEDIUM_BOX_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'medium', color: { argb: 'FF000000' } },
  left: { style: 'medium', color: { argb: 'FF000000' } },
  bottom: { style: 'medium', color: { argb: 'FF000000' } },
  right: { style: 'medium', color: { argb: 'FF000000' } }
};

const HEADER_BLUE_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF9BC2E6' }
};

const OPEX_MONTH_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD9E1F2' }
};

const YELLOW_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFFF00' }
};

const GREY_CAPEX_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFBFBFBF' }
};

function colLetter(colIdxZeroBased: number): string {
  let n = colIdxZeroBased + 1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function triggerBrowserDownload(buffer: ArrayBuffer | Uint8Array, filename: string) {
  const blob = new Blob([buffer as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function parseExcelNumber(val: any): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (val === null || val === undefined || val === '') return 0;
  const cleaned = String(val).replace(/[$,\s]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseExcelDate(val: any, fallbackYear: number): string {
  if (!val) return `${fallbackYear}-01-01`;
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === 'number' && val > 25569) {
    const utcDays = Math.floor(val - 25569);
    const d = new Date(utcDays * 86400 * 1000);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return `${fallbackYear}-01-01`;
}

function styleReferenceSheet(
  ws: ExcelJS.Worksheet,
  headers: string[],
  rows: any[][],
  widths: number[],
  tabColorArgb?: string
) {
  if (tabColorArgb) {
    ws.properties.tabColor = { argb: tabColorArgb };
  }
  const headerRow = ws.getRow(1);
  headerRow.height = 24;
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
    cell.fill = HEADER_BLUE_FILL;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = THIN_BORDER;
  });

  rows.forEach((rowData, rIdx) => {
    const row = ws.getRow(2 + rIdx);
    row.height = 19;
    rowData.forEach((val, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = val;
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };
      cell.border = THIN_BORDER;
      cell.alignment = {
        vertical: 'middle',
        horizontal: typeof val === 'number' ? 'right' : 'left',
        wrapText: true
      };
    });
  });

  widths.forEach((w, idx) => {
    ws.getColumn(idx + 1).width = w;
  });
  ws.autoFilter = `A1:${colLetter(headers.length - 1)}1`;
  ws.views = [{ state: 'frozen', ySplit: 1 }];
}

/**
 * Populates a single CAPEX worksheet using the exact attached CAPEX PLAN template
 * for either 'planned' or 'actual' monthly values.
 */
function populateCapexSheet(
  wb: ExcelJS.Workbook,
  sheetName: string,
  capexItems: any[],
  fiscalYear: number,
  metric: 'planned' | 'actual',
  tabColorArgb: string
) {
  const isActual = metric === 'actual';
  const ws = wb.addWorksheet(sheetName, {
    properties: { tabColor: { argb: tabColorArgb } },
    views: [{ state: 'frozen', ySplit: 4, showGridLines: true }]
  });

  // Title Row 1
  const titleCell = ws.getCell('A1');
  titleCell.value = isActual ? `CAPEX ACTUAL ${fiscalYear}` : `CAPEX PLAN ${fiscalYear}`;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF000000' } };
  ws.getRow(1).height = 24;
  ws.getRow(2).height = 20;
  ws.getRow(3).height = 20;
  ws.getRow(4).height = 17;

  const capexColWidths: Record<number, number> = {
    1: 5.5,  // A: No.
    2: 8,    // B: BU
    3: 13,   // C: Capex#
    4: 30,   // D: Description
    5: 26,   // E: Specifications
    6: 16,   // F: Asset Type
    7: 28,   // G: Justification
    8: 12,   // H: Department
    9: 12,   // I: Cost Center
    10: 15,  // J: Person in charge
    11: 6,   // K: Qty
    12: 14,  // L: Est. Unit Cost
    13: 15,  // M: Total Est. Cost
    14: 13,  // N: Expected Start
    15: 19,  // O: Expected Complete Month
    16: 13,  // P: Status
    17: 2.2, // Q: Blank spacer
    18: 11, 19: 11, 20: 11, 21: 11, 22: 11, 23: 11,
    24: 11, 25: 11, 26: 11, 27: 11, 28: 11, 29: 11, // R..AC: Jan..Dec
    30: 16,  // AD: Total Est. Spending / Total Actual Spending
    31: 2.2, // AE: Blank spacer
    32: 13,  // AF: Stage
    33: 13,  // AG: Asset Owner
    34: 16,  // AH: Asset Supervisor
    35: 12, 36: 12, 37: 12, 38: 12 // AI..AL: Q1..Q4
  };
  Object.entries(capexColWidths).forEach(([c, w]) => {
    ws.getColumn(Number(c)).width = w;
  });

  const leftHeaders: Array<{ col: number; label: string; unitRow4?: string }> = [
    { col: 1, label: 'No.' },
    { col: 2, label: 'BU' },
    { col: 3, label: 'Capex#' },
    { col: 4, label: 'Description' },
    { col: 5, label: 'Specifications' },
    { col: 6, label: 'Asset Type' },
    { col: 7, label: 'Justification' },
    { col: 8, label: 'Department' },
    { col: 9, label: 'Cost Center' },
    { col: 10, label: 'Person in charge' },
    { col: 11, label: 'Qty' },
    { col: 12, label: 'Est. Unit Cost', unitRow4: '$' },
    { col: 13, label: 'Total Est. Cost', unitRow4: '$' },
    { col: 14, label: 'Expected Start' },
    { col: 15, label: 'Expected Complete Month' },
    { col: 16, label: 'Status' }
  ];

  const applyHeaderStyle = (cell: ExcelJS.Cell, text: string | null) => {
    if (text !== null) cell.value = text;
    cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF000000' } };
    cell.fill = HEADER_BLUE_FILL;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = THIN_BORDER;
  };

  leftHeaders.forEach(({ col, label, unitRow4 }) => {
    const letter = colLetter(col - 1);
    ws.mergeCells(`${letter}2:${letter}3`);
    applyHeaderStyle(ws.getCell(2, col), label);
    applyHeaderStyle(ws.getCell(3, col), null);
    applyHeaderStyle(ws.getCell(4, col), unitRow4 || '');
  });

  // Estimated / Actual Spending by Month (R2:AC2 merged), Jan..Dec (R3..AC3), $ (R4..AC4)
  ws.mergeCells('R2:AC2');
  for (let c = 18; c <= 29; c++) {
    applyHeaderStyle(
      ws.getCell(2, c),
      c === 18 ? (isActual ? 'Actual Spending by Month' : 'Estimated Spending by Month') : null
    );
    applyHeaderStyle(ws.getCell(3, c), MONTH_LABELS[c - 18]);
    applyHeaderStyle(ws.getCell(4, c), '$');
  }

  // Total Est. / Actual Spending (AD2:AD3 merged), $ (AD4)
  ws.mergeCells('AD2:AD3');
  applyHeaderStyle(ws.getCell(2, 30), isActual ? 'Total Actual Spending' : 'Total Est. Spending');
  applyHeaderStyle(ws.getCell(3, 30), null);
  applyHeaderStyle(ws.getCell(4, 30), '$');

  // Supplementary Stage, Asset Owner, Supervisor, Quarterly columns (AF..AL)
  const extraLeft: Array<{ col: number; label: string }> = [
    { col: 32, label: 'Stage' },
    { col: 33, label: 'Asset Owner' },
    { col: 34, label: 'Asset Supervisor' }
  ];
  extraLeft.forEach(({ col, label }) => {
    const letter = colLetter(col - 1);
    ws.mergeCells(`${letter}2:${letter}3`);
    applyHeaderStyle(ws.getCell(2, col), label);
    applyHeaderStyle(ws.getCell(3, col), null);
    applyHeaderStyle(ws.getCell(4, col), '');
  });
  ws.mergeCells('AI2:AL2');
  ['Q1', 'Q2', 'Q3', 'Q4'].forEach((qLabel, idx) => {
    const c = 35 + idx;
    applyHeaderStyle(ws.getCell(2, c), idx === 0 ? 'Quarterly Spending' : null);
    applyHeaderStyle(ws.getCell(3, c), qLabel);
    applyHeaderStyle(ws.getCell(4, c), '$');
  });

  ws.autoFilter = 'A4:AD4';

  const startDataRow = 5;
  const rowCount = Math.max(capexItems.length, 1);

  for (let idx = 0; idx < rowCount; idx++) {
    const r = startDataRow + idx;
    const item = capexItems[idx];
    const row = ws.getRow(r);
    row.height = 18;

    const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
    const isPlaceholder = !item;
    const qty = item ? Number(item.qty) || 1 : 0;
    const unitCost = item ? round2(Number(item.unit_price) || 0) : 0;
    const totalEstCost = round2(qty * unitCost);
    const meta = item ? findAssetTypeMeta(item.asset_type) : undefined;
    const months = item
      ? MONTH_KEYS.map(m => round2(Number(item.monthly_spending?.[m]?.[metric] || 0)))
      : MONTH_KEYS.map(() => 0);
    const monthlySum = round2(months.reduce((a, b) => a + b, 0));
    const q1 = round2(months[0] + months[1] + months[2]);
    const q2 = round2(months[3] + months[4] + months[5]);
    const q3 = round2(months[6] + months[7] + months[8]);
    const q4 = round2(months[9] + months[10] + months[11]);

    const values: Array<{ col: number; val: any; numFmt?: string; align?: 'left' | 'center' | 'right'; fill?: ExcelJS.Fill }> = [
      { col: 1, val: idx + 1, align: 'center' },
      { col: 2, val: item ? formatBuForCapex(item.site || item.bu || 'K1') : '', align: 'center' },
      { col: 3, val: item ? item.capex_code || `K1000${idx + 1}` : '', align: 'center', fill: GREY_CAPEX_FILL },
      { col: 4, val: item ? item.description || '' : '', align: 'left' },
      { col: 5, val: item ? item.specifications || '' : '', align: 'left' },
      { col: 6, val: item ? item.asset_type || 'Computer' : '', align: 'left' },
      { col: 7, val: item ? item.justification || '' : '', align: 'left' },
      { col: 8, val: item ? normalizeDepartmentCode(item.department || 'IT') : '', align: 'center' },
      { col: 9, val: item ? item.cost_center || 'IT' : '', align: 'center' },
      { col: 10, val: item ? item.pic || '' : '', align: 'center' },
      { col: 11, val: isPlaceholder ? null : qty, align: 'center' },
      { col: 12, val: isPlaceholder ? null : unitCost, numFmt: ACC_USD_FMT, align: 'right' },
      { col: 13, val: { formula: `ROUND(K${r}*L${r},2)`, result: totalEstCost }, numFmt: ACC_DASH_FMT, align: 'right' },
      { col: 14, val: item ? item.expected_start_month || 'Jan' : '', align: 'center' },
      { col: 15, val: item ? item.expected_complete_month || 'Dec' : '', align: 'center' },
      { col: 16, val: item ? normalizeCapexStatus(item.status) : '', align: 'center' }
    ];

    values.forEach(({ col, val, numFmt, align, fill }) => {
      const cell = row.getCell(col);
      cell.value = val;
      cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF000000' } };
      cell.border = THIN_BORDER;
      if (fill) cell.fill = fill;
      if (numFmt) cell.numFmt = numFmt;
      cell.alignment = { vertical: 'middle', horizontal: align || 'left', wrapText: col === 4 || col === 5 || col === 7 };
    });

    months.forEach((mVal, mIdx) => {
      const c = 18 + mIdx;
      const cell = row.getCell(c);
      cell.value = mVal;
      cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF000000' } };
      cell.border = THIN_BORDER;
      cell.numFmt = MONTH_BLANK_ZERO_FMT;
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    });

    const adCell = row.getCell(30);
    adCell.value = { formula: `SUM(R${r}:AC${r})`, result: monthlySum };
    adCell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF000000' } };
    adCell.border = THIN_BORDER;
    adCell.numFmt = ACC_DASH_FMT;
    adCell.alignment = { vertical: 'middle', horizontal: 'right' };

    const stageVal = item ? normalizeCapexStage(item.stage_tag, item.status) : '';
    const extraCells: Array<{ col: number; val: any; numFmt?: string; align?: 'left' | 'center' | 'right' }> = [
      { col: 32, val: stageVal, align: 'center' },
      { col: 33, val: item ? item.asset_owner || meta?.asset_owner || 'IT' : '', align: 'center' },
      { col: 34, val: item ? item.asset_supervisor || meta?.asset_supervisor || 'ITO' : '', align: 'center' },
      { col: 35, val: { formula: `SUM(R${r}:T${r})`, result: q1 }, numFmt: ACC_DASH_FMT, align: 'right' },
      { col: 36, val: { formula: `SUM(U${r}:W${r})`, result: q2 }, numFmt: ACC_DASH_FMT, align: 'right' },
      { col: 37, val: { formula: `SUM(X${r}:Z${r})`, result: q3 }, numFmt: ACC_DASH_FMT, align: 'right' },
      { col: 38, val: { formula: `SUM(AA${r}:AC${r})`, result: q4 }, numFmt: ACC_DASH_FMT, align: 'right' }
    ];
    extraCells.forEach(({ col, val, numFmt, align }) => {
      const cell = row.getCell(col);
      cell.value = val;
      cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF000000' } };
      cell.border = THIN_BORDER;
      if (numFmt) cell.numFmt = numFmt;
      cell.alignment = { vertical: 'middle', horizontal: align || 'left' };
    });
  }

  const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
  const endDataRow = startDataRow + rowCount - 1;
  const totalRowNum = endDataRow + 1;
  const totalRow = ws.getRow(totalRowNum);
  totalRow.height = 19;

  const grandTotalCost = round2(
    capexItems.reduce(
      (acc, c) => acc + round2((Number(c.qty) || 1) * round2(Number(c.unit_price) || 0)),
      0
    )
  );
  const sumMonthlyAll = MONTH_KEYS.map(m =>
    round2(capexItems.reduce((acc, c) => acc + round2(Number(c.monthly_spending?.[m]?.[metric]) || 0), 0))
  );
  const grandMonthly = round2(sumMonthlyAll.reduce((a, b) => a + b, 0));

  for (let c = 1; c <= 16; c++) {
    const cell = totalRow.getCell(c);
    cell.border = THIN_BORDER;
    cell.font = { name: 'Calibri', size: 9.5, bold: c === 4 || c === 13, color: { argb: 'FF000000' } };
    if (c === 4) {
      cell.value = 'Total';
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    } else if (c === 13) {
      cell.value = { formula: `SUBTOTAL(9,M${startDataRow}:M${endDataRow})`, result: grandTotalCost };
      cell.numFmt = ACC_DASH_FMT;
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    }
  }

  for (let c = 18; c <= 30; c++) {
    const col = colLetter(c - 1);
    const cell = totalRow.getCell(c);
    const cached = c === 30 ? grandMonthly : sumMonthlyAll[c - 18];
    cell.value = { formula: `SUBTOTAL(9,${col}${startDataRow}:${col}${endDataRow})`, result: cached };
    cell.font = { name: 'Calibri', size: 9.5, bold: c === 30, color: { argb: 'FF000000' } };
    cell.border = THIN_BORDER;
    cell.numFmt = ACC_DASH_FMT;
    cell.alignment = { vertical: 'middle', horizontal: 'right' };
  }

  // Stage Summary Box directly beneath Total Spending
  const stageColors: Record<string, string> = {
    Estimate: 'FFFFFF00',
    Agreement: 'FF70AD47',
    Bill: 'FF5B9BD5',
    Planning: 'FFED7D31'
  };
  const stagesOrdered: Array<'Estimate' | 'Agreement' | 'Bill' | 'Planning'> = [
    'Estimate',
    'Agreement',
    'Bill',
    'Planning'
  ];

  const stageStartRow = totalRowNum + 2;
  stagesOrdered.forEach((stage, idx) => {
    const r = stageStartRow + idx;
    const row = ws.getRow(r);
    row.height = 18;
    const fill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: stageColors[stage] }
    };
    const stageVal = round2(
      capexItems
        .filter(c => normalizeCapexStage(c.stage_tag, c.status) === stage)
        .reduce(
          (a, c) =>
            a + MONTH_KEYS.reduce((s, m) => s + round2(Number(c.monthly_spending?.[m]?.[metric]) || 0), 0),
          0
        )
    );

    const labelCell = row.getCell(29);
    labelCell.value = stage;
    labelCell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF000000' } };
    labelCell.fill = fill;
    labelCell.border = THIN_BORDER;
    labelCell.alignment = { vertical: 'middle', horizontal: 'left' };

    const valCell = row.getCell(30);
    valCell.value = {
      formula: `SUMIF(AF${startDataRow}:AF${endDataRow},"${stage}",AD${startDataRow}:AD${endDataRow})`,
      result: stageVal
    };
    valCell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF000000' } };
    valCell.fill = fill;
    valCell.border = THIN_BORDER;
    valCell.numFmt = ACC_DASH_FMT;
    valCell.alignment = { vertical: 'middle', horizontal: 'right' };
  });
}

/**
 * Builds the 2027 CapEx Workbook matching the attached CAPEX PLAN template
 * for Planning ('planned'), Actual ('actual'), or Both ('both').
 */
export async function buildCapexTemplateWorkbook(
  capexItems: any[],
  fiscalYear: number,
  options?: {
    unitPriceCatalog?: UnitPriceCatalogItem[];
    mode?: BudgetExportMode;
  }
): Promise<ExcelJS.Workbook> {
  const mode: BudgetExportMode = options?.mode || 'both';
  const wb = new ExcelJS.Workbook();
  wb.creator = 'IT CapEx & Operation Tracking';
  wb.created = new Date();

  const unitPrices =
    options?.unitPriceCatalog && options.unitPriceCatalog.length > 0
      ? options.unitPriceCatalog
      : HISTORICAL_UNIT_PRICE_CATALOG;

  if (mode === 'planned' || mode === 'both') {
    populateCapexSheet(wb, 'CAPEX', capexItems, fiscalYear, 'planned', 'FFFFFF00');
  }
  if (mode === 'actual' || mode === 'both') {
    const actualSheetName = mode === 'actual' ? 'CAPEX' : 'CAPEX Actual';
    populateCapexSheet(wb, actualSheetName, capexItems, fiscalYear, 'actual', 'FF5B9BD5');
  }

  // Reference Sheets matching template tabs
  const wsDept = wb.addWorksheet('Dept. Definition');
  styleReferenceSheet(
    wsDept,
    ['Dept. Code', 'Department Name', 'Definition / Scope', 'Default for IT'],
    DEPT_DEFINITIONS.map(d => [d.code, d.name, d.description, d.is_default ? 'YES' : 'NO']),
    [13, 25, 65, 15],
    'FF00B050'
  );

  const wsAssets = wb.addWorksheet('Asset Types');
  styleReferenceSheet(
    wsAssets,
    ['Code', 'Asset Type', 'Explanation', 'Asset Owner', 'Asset Supervisor', 'Primary IT Option'],
    ASSET_TYPES_MASTER.map(a => [
      a.code,
      a.asset_type,
      a.explanation,
      a.asset_owner,
      a.asset_supervisor,
      a.is_it ? 'YES' : 'NO'
    ]),
    [9, 24, 62, 15, 18, 17],
    'FF00B050'
  );

  const wsBl = wb.addWorksheet('Business Line');
  styleReferenceSheet(
    wsBl,
    [
      'Service Group',
      'Sub-Lines / Clinical Scope',
      'Status',
      'Head of Service',
      'Responsible Team',
      'Account Number',
      'KHEMA TK',
      'KHEMA BKK',
      'SAKAL 2004',
      'Included in CapEx & OpEx Plans'
    ],
    BUSINESS_LINES_MASTER.map(b => [
      b.service_group,
      b.sub_line,
      b.status,
      b.head_of_service,
      b.responsible_team,
      b.account_number,
      b.khema_tk ? 'YES' : 'NO',
      b.khema_bkk ? 'YES' : 'NO',
      b.sakal_2004 ? 'YES' : 'NO',
      b.included_in_plans ? 'YES' : 'NO'
    ]),
    [28, 46, 15, 22, 24, 16, 12, 12, 13, 28],
    'FF7030A0'
  );

  const wsUnit = wb.addWorksheet('Est. Unit Price');
  styleReferenceSheet(
    wsUnit,
    [
      'Asset Category',
      'CapEx Code',
      'Item Name',
      'Vendor',
      'Brand / Model',
      'Posting Date',
      'Unit (Qty)',
      'Unit Price',
      'Total Amount',
      'Remark'
    ],
    unitPrices.map(u => [
      u.asset_category,
      u.capex_code,
      u.item_name,
      u.vendor,
      u.brand_model,
      u.posting_date ? String(u.posting_date).slice(0, 10) : '',
      Number(u.qty) || 1,
      Number(u.unit_price) || 0,
      Number(u.total_amount) || 0,
      u.remark || ''
    ]),
    [18, 14, 34, 22, 36, 14, 11, 14, 15, 36],
    'FF00B0F0'
  );
  for (let r = 2; r <= unitPrices.length + 1; r++) {
    wsUnit.getCell(r, 8).numFmt = ACC_USD_FMT;
    wsUnit.getCell(r, 9).numFmt = ACC_USD_FMT;
  }

  return wb;
}

/**
 * Exports the styled 2027 CapEx Template Workbook (Plan, Actual, or Plan & Actual).
 */
export async function exportCapexTemplateWorkbook(
  capexItems: any[],
  fiscalYear: number,
  options?: {
    unitPriceCatalog?: UnitPriceCatalogItem[];
    mode?: BudgetExportMode;
  }
): Promise<string> {
  const mode: BudgetExportMode = options?.mode || 'both';
  const wb = await buildCapexTemplateWorkbook(capexItems, fiscalYear, options);
  const buffer = await wb.xlsx.writeBuffer();
  const suffix =
    mode === 'both'
      ? 'Plan_and_Actual'
      : mode === 'actual'
        ? 'Actual'
        : 'Plan';
  const filename = `${fiscalYear}_IT_Capex_${suffix}_Export.xlsx`;
  triggerBrowserDownload(buffer, filename);
  return filename;
}

/**
 * Populates a single OPEX worksheet using the exact attached OPEX PLAN 2027 template
 * for either 'planned' or 'actual' monthly values.
 */
function populateOpexSheet(
  wb: ExcelJS.Workbook,
  sheetName: string,
  opexItems: any[],
  fiscalYear: number,
  metric: 'planned' | 'actual',
  tabColorArgb?: string
) {
  const isActual = metric === 'actual';
  const ws = wb.addWorksheet(sheetName, {
    properties: tabColorArgb ? { tabColor: { argb: tabColorArgb } } : undefined,
    views: [{ state: 'frozen', ySplit: 4, showGridLines: true }]
  });

  ws.getRow(1).height = 22;
  ws.getRow(2).height = 17;
  ws.getRow(3).height = 17;
  ws.getRow(4).height = 20;

  const opexWidths: Record<number, number> = {
    1: 5.5,  // A: No
    2: 8,    // B: BU
    3: 30,   // C: Description
    4: 28,   // D: Remark
    5: 6.5,  // E: Qty
    6: 13,   // F: Unit Price
    7: 14,   // G: Account Code
    8: 26,   // H: Account Name
    9: 13,   // I: Cost Center
    10: 13,  // J: PIC
    11: 11, 12: 11, 13: 11, 14: 11, 15: 11, 16: 11,
    17: 11, 18: 11, 19: 11, 20: 11, 21: 11, 22: 11, // K..V: Jan..Dec
    23: 14   // W: Total
  };
  Object.entries(opexWidths).forEach(([c, w]) => {
    ws.getColumn(Number(c)).width = w;
  });

  const titleCell = ws.getCell('A1');
  titleCell.value = isActual ? `OPEX ACTUAL ${fiscalYear}` : `OPEX PLAN ${fiscalYear}`;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF000000' } };

  const row2Label = isActual ? 'Actual' : 'Plan';
  const row2ColorArgb = isActual ? 'FF0070C0' : 'FFFF0000';

  for (let mIdx = 0; mIdx < 12; mIdx++) {
    const col = 11 + mIdx;
    const mName = MONTH_LABELS[mIdx];

    const r1 = ws.getCell(1, col);
    r1.value = mName;
    r1.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
    r1.alignment = { vertical: 'middle', horizontal: 'center' };
    r1.border = THIN_BORDER;

    const r2 = ws.getCell(2, col);
    r2.value = row2Label;
    r2.font = { name: 'Calibri', size: 10, bold: isActual, color: { argb: row2ColorArgb } };
    r2.alignment = { vertical: 'middle', horizontal: 'center' };
    r2.border = THIN_BORDER;

    const r3 = ws.getCell(3, col);
    r3.value = fiscalYear;
    r3.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };
    r3.alignment = { vertical: 'middle', horizontal: 'center' };
    r3.border = THIN_BORDER;
  }

  const w1 = ws.getCell(1, 23);
  w1.value = 'Total';
  w1.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
  w1.alignment = { vertical: 'middle', horizontal: 'center' };
  w1.border = { top: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'thin' } };

  const w2 = ws.getCell(2, 23);
  w2.value = row2Label;
  w2.font = { name: 'Calibri', size: 10, bold: isActual, color: { argb: row2ColorArgb } };
  w2.alignment = { vertical: 'middle', horizontal: 'center' };
  w2.border = { left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'thin' } };

  const w3 = ws.getCell(3, 23);
  w3.value = fiscalYear;
  w3.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };
  w3.alignment = { vertical: 'middle', horizontal: 'center' };
  w3.border = { left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' } };

  const opexRow4Headers = [
    'No', 'BU', 'Description', 'Remark', 'Qty', 'Unit Price',
    'Account Code', 'Account Name', 'Cost Center', 'PIC',
    ...MONTH_LABELS,
    'Total'
  ];
  opexRow4Headers.forEach((h, idx) => {
    const col = idx + 1;
    const cell = ws.getCell(4, col);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: col <= 10 || col === 23, color: { argb: 'FF000000' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = col === 23 ? MEDIUM_BOX_BORDER : THIN_BORDER;
  });

  ws.autoFilter = 'A4:W4';

  const startDataRow = 5;
  const rowCount = Math.max(opexItems.length, 1);

  for (let idx = 0; idx < rowCount; idx++) {
    const r = startDataRow + idx;
    const item = opexItems[idx];
    const row = ws.getRow(r);
    row.height = 18;

    const months = item
      ? MONTH_KEYS.map(m => Number(item.monthly_spending?.[m]?.[metric] || 0))
      : MONTH_KEYS.map(() => 0);
    const rowTotal = months.reduce((a, b) => a + b, 0);

    const metaCells: Array<{ col: number; val: any; numFmt?: string; align?: 'left' | 'center' | 'right' }> = [
      { col: 1, val: idx + 1, align: 'center' },
      { col: 2, val: item ? formatBuForOpex(item.site || item.bu_canonical || 'K1') : '', align: 'center' },
      { col: 3, val: item ? item.description || '' : '', align: 'left' },
      { col: 4, val: item ? item.remark || item.justification || '' : '', align: 'left' },
      { col: 5, val: item ? Number(item.qty) || 1 : null, align: 'center' },
      { col: 6, val: item ? Number(item.unit_price) || 0 : 0, numFmt: ACC_USD_FMT, align: 'right' },
      { col: 7, val: item ? item.account_code || '630104' : '', align: 'center' },
      { col: 8, val: item ? item.account_name || 'Other Outside Services' : '', align: 'left' },
      { col: 9, val: item ? item.cost_center || 'IT' : '', align: 'center' },
      { col: 10, val: item ? item.pic || '' : '', align: 'center' }
    ];

    metaCells.forEach(({ col, val, numFmt, align }) => {
      const cell = row.getCell(col);
      cell.value = val;
      cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF000000' } };
      cell.border = THIN_BORDER;
      if (numFmt) cell.numFmt = numFmt;
      cell.alignment = { vertical: 'middle', horizontal: align || 'left', wrapText: col === 3 || col === 4 };
    });

    months.forEach((mVal, mIdx) => {
      const cell = row.getCell(11 + mIdx);
      cell.value = mVal;
      cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF000000' } };
      cell.fill = OPEX_MONTH_FILL;
      cell.border = THIN_BORDER;
      cell.numFmt = ACC_USD_FMT;
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    });

    const totCell = row.getCell(23);
    totCell.value = { formula: `SUM(K${r}:V${r})`, result: rowTotal };
    totCell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF000000' } };
    totCell.fill = YELLOW_FILL;
    totCell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'medium', color: { argb: 'FF000000' } }
    };
    totCell.numFmt = ACC_USD_FMT;
    totCell.alignment = { vertical: 'middle', horizontal: 'right' };
  }

  const endDataRow = startDataRow + rowCount - 1;
  const totalRowNum = endDataRow + 1;
  const totalRow = ws.getRow(totalRowNum);
  totalRow.height = 20;

  const sumMonthlyAll = MONTH_KEYS.map(m =>
    opexItems.reduce((acc, o) => acc + (Number(o.monthly_spending?.[m]?.[metric]) || 0), 0)
  );
  const grandTotal = sumMonthlyAll.reduce((a, b) => a + b, 0);

  const labelTotalCell = totalRow.getCell(10);
  labelTotalCell.value = 'Total:';
  labelTotalCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
  labelTotalCell.alignment = { vertical: 'middle', horizontal: 'right' };

  for (let c = 11; c <= 23; c++) {
    const col = colLetter(c - 1);
    const cell = totalRow.getCell(c);
    const cached = c === 23 ? grandTotal : sumMonthlyAll[c - 11];
    cell.value = { formula: `SUBTOTAL(9,${col}${startDataRow}:${col}${endDataRow})`, result: cached };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
    cell.fill = YELLOW_FILL;
    cell.border = MEDIUM_BOX_BORDER;
    cell.numFmt = ACC_USD_FMT;
    cell.alignment = { vertical: 'middle', horizontal: 'right' };
  }
}

/**
 * Builds the 2027 OPEX Workbook matching the attached OPEX PLAN 2027 template
 * for Planning ('planned'), Actual ('actual'), or Both ('both').
 */
export async function buildOpexTemplateWorkbook(
  opexItems: any[],
  glActuals: any[],
  fiscalYear: number,
  options?: {
    mode?: BudgetExportMode;
  }
): Promise<ExcelJS.Workbook> {
  const mode: BudgetExportMode = options?.mode || 'both';
  const wb = new ExcelJS.Workbook();
  wb.creator = 'IT CapEx & Operation Tracking';
  wb.created = new Date();

  const hasPlanSheet = mode === 'planned' || mode === 'both';
  const hasActualSheet = mode === 'actual' || mode === 'both';
  const actualSheetName = mode === 'actual' ? 'OPEX' : 'OPEX Actual';

  if (hasPlanSheet) {
    populateOpexSheet(wb, 'OPEX', opexItems, fiscalYear, 'planned');
  }
  if (hasActualSheet) {
    populateOpexSheet(wb, actualSheetName, opexItems, fiscalYear, 'actual', 'FF5B9BD5');
  }

  const startDataRow = 5;
  const endDataRow = startDataRow + Math.max(opexItems.length, 1) - 1;

  // --- COA Summary (17 G/L Accounts comparing Planned, OPEX Actual, and GL Ledger Actual) ---
  const wsCoaSummary = wb.addWorksheet('COA Summary', {
    properties: { tabColor: { argb: 'FF00B050' } },
    views: [{ state: 'frozen', ySplit: 2 }]
  });
  wsCoaSummary.getCell('A1').value = `CHART OF ACCOUNTS SUMMARY — FY ${fiscalYear} IT OPEX`;
  wsCoaSummary.getCell('A1').font = { name: 'Calibri', size: 12, bold: true };
  wsCoaSummary.getRow(1).height = 22;

  const coaHeaders = [
    'Account Code',
    'Account Name',
    'Category',
    'Planned Total ($)',
    'OPEX Actual Total ($)',
    'GL Actual Total ($)'
  ];
  wsCoaSummary.getRow(2).height = 22;
  coaHeaders.forEach((h, i) => {
    const cell = wsCoaSummary.getCell(2, i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true };
    cell.fill = HEADER_BLUE_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  COA_SUMMARY_2027.forEach((c, idx) => {
    const r = 3 + idx;
    const plannedSum = opexItems
      .filter(o => String(o.account_code || '').startsWith(c.account_code))
      .reduce((acc, o) => acc + MONTH_KEYS.reduce((s, m) => s + (Number(o.monthly_spending?.[m]?.planned) || 0), 0), 0);
    const actualSum = opexItems
      .filter(o => String(o.account_code || '').startsWith(c.account_code))
      .reduce((acc, o) => acc + MONTH_KEYS.reduce((s, m) => s + (Number(o.monthly_spending?.[m]?.actual) || 0), 0), 0);
    const glSum = glActuals
      .filter(g => String(g.gl_account_no || '').startsWith(c.account_code))
      .reduce((acc, g) => acc + (Number(g.amount) || 0), 0);

    const row = wsCoaSummary.getRow(r);
    row.height = 18;
    [c.account_code, c.account_name, c.category].forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val;
      cell.font = { name: 'Calibri', size: 10 };
      cell.border = THIN_BORDER;
      cell.alignment = { vertical: 'middle', horizontal: ci === 0 ? 'center' : 'left' };
    });

    const pCell = row.getCell(4);
    pCell.value =
      opexItems.length > 0 && hasPlanSheet
        ? { formula: `SUMIF(OPEX!$G$${startDataRow}:$G$${endDataRow},A${r},OPEX!$W$${startDataRow}:$W$${endDataRow})`, result: plannedSum }
        : plannedSum;
    pCell.font = { name: 'Calibri', size: 10 };
    pCell.border = THIN_BORDER;
    pCell.numFmt = ACC_USD_FMT;
    pCell.alignment = { vertical: 'middle', horizontal: 'right' };

    const aCell = row.getCell(5);
    aCell.value =
      opexItems.length > 0 && hasActualSheet
        ? { formula: `SUMIF('${actualSheetName}'!$G$${startDataRow}:$G$${endDataRow},A${r},'${actualSheetName}'!$W$${startDataRow}:$W$${endDataRow})`, result: actualSum }
        : actualSum;
    aCell.font = { name: 'Calibri', size: 10 };
    aCell.border = THIN_BORDER;
    aCell.numFmt = ACC_USD_FMT;
    aCell.alignment = { vertical: 'middle', horizontal: 'right' };

    const gCell = row.getCell(6);
    gCell.value =
      glActuals.length > 0
        ? { formula: `SUMIF('COA Details'!$D$3:$D$${2 + glActuals.length},A${r},'COA Details'!$H$3:$H$${2 + glActuals.length})`, result: glSum }
        : glSum;
    gCell.font = { name: 'Calibri', size: 10 };
    gCell.border = THIN_BORDER;
    gCell.numFmt = ACC_USD_FMT;
    gCell.alignment = { vertical: 'middle', horizontal: 'right' };
  });
  [15, 32, 22, 18, 20, 18].forEach((w, i) => {
    wsCoaSummary.getColumn(i + 1).width = w;
  });

  // --- COA Details (Headers Row 2, Data starts Row 3) ---
  const wsCoaDetails = wb.addWorksheet('COA Details', {
    properties: { tabColor: { argb: 'FF00B0F0' } },
    views: [{ state: 'frozen', ySplit: 2 }]
  });
  wsCoaDetails.getCell('A1').value = `GL ACTUALS TRANSACTION LEDGER (COA DETAILS) — FY ${fiscalYear}`;
  wsCoaDetails.getCell('A1').font = { name: 'Calibri', size: 12, bold: true };
  wsCoaDetails.getRow(1).height = 22;

  const glHeaders = [
    'Posting Date', 'External Document No.', 'Document No.',
    'G/L Account No.', 'G/L Account Name', 'ItemValue_Desc',
    'Description', 'Amount', 'Business Unit Code'
  ];
  wsCoaDetails.getRow(2).height = 22;
  glHeaders.forEach((h, i) => {
    const cell = wsCoaDetails.getCell(2, i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true };
    cell.fill = HEADER_BLUE_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  glActuals.forEach((g, idx) => {
    const row = wsCoaDetails.getRow(3 + idx);
    row.height = 18;
    const vals = [
      g.posting_date ? String(g.posting_date).slice(0, 10) : '',
      g.external_document_no || '',
      g.document_no || '',
      g.gl_account_no || '',
      g.gl_account_name || '',
      g.item_value_desc || '',
      g.description || '',
      Number(g.amount) || 0,
      g.bu_code || 'K1'
    ];
    vals.forEach((v, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = v;
      cell.font = { name: 'Calibri', size: 10 };
      cell.border = THIN_BORDER;
      if (cIdx === 7) {
        cell.numFmt = ACC_USD_FMT;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: cIdx === 0 || cIdx === 3 || cIdx === 8 ? 'center' : 'left' };
      }
    });
  });

  [14, 22, 18, 16, 28, 24, 36, 15, 18].forEach((w, i) => {
    wsCoaDetails.getColumn(i + 1).width = w;
  });
  wsCoaDetails.autoFilter = 'A2:I2';

  return wb;
}

/**
 * Exports the styled 2027 OPEX Template Workbook (Plan, Actual, or Plan & Actual).
 */
export async function exportOpexTemplateWorkbook(
  opexItems: any[],
  glActuals: any[],
  fiscalYear: number,
  options?: {
    mode?: BudgetExportMode;
  }
): Promise<string> {
  const mode: BudgetExportMode = options?.mode || 'both';
  const wb = await buildOpexTemplateWorkbook(opexItems, glActuals, fiscalYear, options);
  const buffer = await wb.xlsx.writeBuffer();
  const suffix =
    mode === 'both'
      ? 'Plan_and_Actual'
      : mode === 'actual'
        ? 'Actual'
        : 'Plan';
  const filename = `${fiscalYear}_IT_Operational_${suffix}_Export.xlsx`;
  triggerBrowserDownload(buffer, filename);
  return filename;
}

/**
 * Finds the header row index inside a 2D AOA sheet using preferred row index first,
 * then scanning rows 0..14 for known required column keywords.
 */
function findHeaderRowIndex(aoa: any[][], preferredIndex0: number, matchKeywords: string[]): number {
  const rowHasMatch = (row: any[]) => {
    if (!Array.isArray(row)) return false;
    const joined = row.map(c => String(c || '').trim().toLowerCase());
    return matchKeywords.some(kw => joined.some(cell => cell === kw || cell.includes(kw)));
  };

  if (preferredIndex0 >= 0 && preferredIndex0 < aoa.length && rowHasMatch(aoa[preferredIndex0])) {
    return preferredIndex0;
  }
  for (let i = 0; i < Math.min(aoa.length, 15); i++) {
    if (rowHasMatch(aoa[i])) return i;
  }
  return -1;
}

function buildRowMap(headerRow: any[], dataRow: any[]): Record<string, any> {
  const obj: Record<string, any> = {};
  headerRow.forEach((h, idx) => {
    const key = String(h || '').trim();
    if (key) obj[key] = dataRow[idx];
  });
  return obj;
}

function getField(row: Record<string, any>, candidates: string[]): any {
  const entries = Object.entries(row);
  for (const cand of candidates) {
    const lowerCand = cand.toLowerCase();
    const hit = entries.find(([k]) => k.toLowerCase() === lowerCand);
    if (hit && hit[1] !== undefined && hit[1] !== null && hit[1] !== '') return hit[1];
  }
  return undefined;
}

function isSummaryOrFooterRow(text: string): boolean {
  const lower = (text || '').trim().toLowerCase();
  if (!lower) return true;
  return (
    lower.startsWith('total') ||
    lower.startsWith('subtotal') ||
    lower.startsWith('summary') ||
    lower.startsWith('stage:') ||
    lower.startsWith('status:') ||
    lower.startsWith('grand total') ||
    lower === 'estimate' ||
    lower === 'agreement' ||
    lower === 'bill' ||
    lower === 'planning'
  );
}

/**
 * Parses 2027 CAPEX, 2027 OPEX (both Plan & Actual sheets), and COA Details workbooks
 * while validating BUs, Asset Types, Statuses, and G/L Accounts.
 */
export function parseBudgetWorkbook(buffer: ArrayBuffer, fiscalYear: number): ParsedWorkbookResult {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const capexItems: any[] = [];
  const opexItems: any[] = [];
  const glActuals: ParsedGlActualRow[] = [];
  const warnings: string[] = [];
  const detectedSheets: string[] = [];

  // Process plan sheets first so corresponding Actual sheets merge cleanly into the same rows
  const sortedNames = [...wb.SheetNames].sort((a, b) => {
    const aAct = a.toLowerCase().includes('actual') ? 1 : 0;
    const bAct = b.toLowerCase().includes('actual') ? 1 : 0;
    return aAct - bAct;
  });

  sortedNames.forEach((sheetName) => {
    const lower = sheetName.trim().toLowerCase();
    const ws = wb.Sheets[sheetName];
    const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
    if (!aoa || aoa.length === 0) return;

    // 1. CAPEX Sheet (Supports Plan, Actual, or Plan & Actual merged headers)
    if (lower === 'capex' || lower.includes('capex')) {
      detectedSheets.push(sheetName);
      const isActualSheet =
        lower.includes('actual') ||
        String(aoa[0]?.[0] || '').toLowerCase().includes('capex actual');

      const headerIdx = findHeaderRowIndex(aoa, 1, ['description', 'capex#', 'capex code', 'est. unit cost']);
      if (headerIdx < 0) {
        warnings.push(`Sheet "${sheetName}": Could not locate CAPEX header row.`);
        return;
      }

      const nextRow = aoa[headerIdx + 1] || [];
      const nextRowJoined = nextRow.map(c => String(c || '').trim().toLowerCase());
      const hasMonthSubheader = nextRowJoined.includes('jan') && nextRowJoined.includes('feb');

      let mergedHeaders = [...aoa[headerIdx]];
      let dataStartIdx = headerIdx + 1;

      if (hasMonthSubheader) {
        const maxLen = Math.max(mergedHeaders.length, nextRow.length);
        mergedHeaders = Array.from({ length: maxLen }, (_, idx) => {
          const topVal = String(aoa[headerIdx][idx] || '').trim();
          const subVal = String(nextRow[idx] || '').trim();
          if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|q1|q2|q3|q4)$/i.test(subVal)) {
            return subVal;
          }
          return topVal || subVal;
        });
        dataStartIdx = headerIdx + 2;

        const thirdRow = aoa[dataStartIdx] || [];
        const hasDollarBar = thirdRow.some(c => String(c || '').trim() === '$');
        if (hasDollarBar) {
          dataStartIdx += 1;
        }
      }

      for (let rIdx = dataStartIdx; rIdx < aoa.length; rIdx++) {
        const rowMap = buildRowMap(mergedHeaders, aoa[rIdx]);
        const desc = String(getField(rowMap, ['Description', 'Item Description']) || '').trim();
        const noRaw = String(getField(rowMap, ['No.', 'No']) || '').trim();
        if (!desc || isSummaryOrFooterRow(desc) || isSummaryOrFooterRow(noRaw)) continue;

        const rawBu = String(getField(rowMap, ['BU', 'Site', 'Business Unit', 'Campus']) || 'K1').trim();
        const normBu = normalizeBuCanonical(rawBu);
        if (!VALID_CAPEX_BUS.has(normBu)) {
          warnings.push(`CAPEX "${desc}": Unrecognized BU "${rawBu}" — defaulted/kept as "${normBu || 'K1'}".`);
        }

        const rawAssetType = String(getField(rowMap, ['Asset Type', 'Category']) || 'Computer').trim();
        const assetMeta = findAssetTypeMeta(rawAssetType);
        if (!assetMeta) {
          warnings.push(`CAPEX "${desc}": Asset Type "${rawAssetType}" is not in 2027 Asset Types master.`);
        }

        const rawStatus = String(getField(rowMap, ['Status']) || 'In Progress').trim();
        const normStatus = normalizeCapexStatus(rawStatus);
        const normStage = normalizeCapexStage(String(getField(rowMap, ['Stage', 'Stage / Category Tag']) || ''), rawStatus);
        const qty = parseExcelNumber(getField(rowMap, ['Qty', 'Quantity'])) || 1;
        const unitPrice = parseExcelNumber(getField(rowMap, ['Est. Unit Cost', 'Unit Price ($)', 'Unit Price', 'UnitPrice']));
        const requestedAmount = Math.round(qty * unitPrice * 100) / 100;
        const siteLabel = formatBuForCapex(normBu || rawBu || 'K1');
        const capexCode = String(getField(rowMap, ['Capex#', 'Capex Code', 'Code']) || `K1000${capexItems.length + 1}`).trim();

        const spending: Record<string, { planned: number; actual: number }> = {};
        MONTH_KEYS.forEach((m, mIdx) => {
          const mLabel = MONTH_LABELS[mIdx];
          const primaryNum = parseExcelNumber(getField(rowMap, [mLabel, `${m.toUpperCase()} (Planned)`, m.toUpperCase()]));
          const explicitActual = parseExcelNumber(getField(rowMap, [`${m.toUpperCase()} (Actual)`]));
          spending[m] = isActualSheet
            ? { planned: 0, actual: explicitActual || primaryNum }
            : { planned: primaryNum, actual: explicitActual };
        });

        // Merge with existing planned item if importing both CAPEX & CAPEX Actual sheets
        if (isActualSheet) {
          const match = capexItems.find(
            c =>
              (c.capex_code && capexCode && c.capex_code === capexCode) ||
              (c.description.toLowerCase() === desc.toLowerCase() && normalizeBuCanonical(c.site) === normBu)
          );
          if (match) {
            MONTH_KEYS.forEach(m => {
              match.monthly_spending[m] = {
                planned: Number(match.monthly_spending[m]?.planned || 0),
                actual: Number(spending[m]?.actual || 0)
              };
            });
            continue;
          }
        }

        const rawStart = getField(rowMap, ['Expected Start Month', 'Expected Start', 'Start Date']);
        const rawComplete = getField(rowMap, ['Expected Complete Month', 'Expected Complete', 'Complete Date']);
        const sIdx = monthLabelToIndex(rawStart ? String(rawStart) : '');
        const cIdx = monthLabelToIndex(rawComplete ? String(rawComplete) : '');

        capexItems.push({
          fiscal_year: fiscalYear,
          item_no: parseInt(noRaw, 10) || capexItems.length + 1,
          site: siteLabel,
          capex_code: capexCode,
          description: desc,
          specifications: String(getField(rowMap, ['Specifications', 'Specs']) || '').trim(),
          asset_type: assetMeta ? assetMeta.asset_type : rawAssetType,
          asset_owner: String(getField(rowMap, ['Asset Owner']) || assetMeta?.asset_owner || 'IT').trim(),
          asset_supervisor: String(getField(rowMap, ['Asset Supervisor']) || assetMeta?.asset_supervisor || 'ITO').trim(),
          justification: String(getField(rowMap, ['Justification']) || '').trim(),
          department: normalizeDepartmentCode(String(getField(rowMap, ['Department', 'Dept']) || 'IT')),
          cost_center: String(getField(rowMap, ['Cost Center']) || 'IT').trim(),
          pic: String(getField(rowMap, ['PIC', 'Person in charge (PIC)', 'Person in charge', 'Owner']) || 'Braseth').trim(),
          project_owner: String(getField(rowMap, ['Project Owner', 'PIC', 'Person in charge']) || 'Braseth').trim(),
          qty,
          unit_price: unitPrice,
          requested_amount: requestedAmount,
          expected_start_month: sIdx >= 0 ? indexToMonthLabel(sIdx) : 'Jan',
          expected_complete_month: cIdx >= 0 ? indexToMonthLabel(cIdx) : 'Dec',
          start_date: sIdx >= 0 ? `${fiscalYear}-${String(sIdx + 1).padStart(2, '0')}-01` : `${fiscalYear}-01-01`,
          complete_date: cIdx >= 0 ? `${fiscalYear}-${String(cIdx + 1).padStart(2, '0')}-28` : `${fiscalYear}-12-31`,
          status: normStatus,
          stage_tag: normStage,
          monthly_spending: spending
        });
      }
      return;
    }

    // 2. OPEX Sheet (Supports Plan, Actual, or Plan & Actual sheets)
    if (lower === 'opex' || lower.includes('opex')) {
      detectedSheets.push(sheetName);
      const isActualSheet =
        lower.includes('actual') ||
        String(aoa[0]?.[0] || '').toLowerCase().includes('opex actual') ||
        String(aoa[1]?.[10] || '').trim().toLowerCase() === 'actual';

      const headerIdx = findHeaderRowIndex(aoa, 3, ['account code', 'account name', 'unit price', 'description']);
      if (headerIdx < 0) {
        warnings.push(`Sheet "${sheetName}": Could not locate OPEX header row.`);
        return;
      }
      const headers = aoa[headerIdx];
      for (let rIdx = headerIdx + 1; rIdx < aoa.length; rIdx++) {
        const rowMap = buildRowMap(headers, aoa[rIdx]);
        const desc = String(getField(rowMap, ['Description', 'Item Description']) || '').trim();
        const noRaw = String(getField(rowMap, ['No', 'No.']) || '').trim();
        if (!desc || isSummaryOrFooterRow(desc) || isSummaryOrFooterRow(noRaw)) continue;

        const rawBu = String(getField(rowMap, ['BU', 'Site', 'Business Unit', 'Campus']) || 'K1').trim();
        const normBu = normalizeBuCanonical(rawBu);
        if (!VALID_OPEX_BUS.has(normBu) && !VALID_OPEX_BUS.has(rawBu)) {
          warnings.push(`OPEX "${desc}": Unrecognized BU "${rawBu}" — normalized as "${normBu || 'K1'}".`);
        }

        const rawCode = String(getField(rowMap, ['Account Code', 'G/L Account No.']) || '').trim();
        const rawName = String(getField(rowMap, ['Account Name', 'G/L Account Name']) || '').trim();
        const coa = findCoaByCode(rawCode) || findCoaByName(rawName);
        if (!coa && (rawCode || rawName)) {
          warnings.push(`OPEX "${desc}": Account "${rawCode || rawName}" is outside the 17-account COA Summary.`);
        }

        const resolvedCode = coa ? coa.account_code : (rawCode || '630104');
        const resolvedName = coa ? coa.account_name : (rawName || 'Other Outside Services');
        const qty = parseExcelNumber(getField(rowMap, ['Qty', 'Quantity'])) || 1;
        const unitPrice = parseExcelNumber(getField(rowMap, ['Unit Price', 'Unit Price ($)', 'UnitPrice']));
        const spending: Record<string, { planned: number; actual: number }> = {};
        let monthSum = 0;

        MONTH_KEYS.forEach((m, mIdx) => {
          const mLabel = MONTH_LABELS[mIdx];
          const primaryNum = parseExcelNumber(getField(rowMap, [mLabel, `${m.toUpperCase()} (Planned)`, m.toUpperCase()]));
          const explicitActual = parseExcelNumber(getField(rowMap, [`${m.toUpperCase()} (Actual)`]));
          if (isActualSheet) {
            spending[m] = { planned: 0, actual: explicitActual || primaryNum };
            monthSum += spending[m].actual;
          } else {
            spending[m] = { planned: primaryNum, actual: explicitActual };
            monthSum += primaryNum;
          }
        });

        // Merge with existing OPEX Plan line if importing both OPEX & OPEX Actual
        if (isActualSheet) {
          const match = opexItems.find(
            o =>
              o.description.toLowerCase() === desc.toLowerCase() &&
              normalizeBuCanonical(o.site) === normBu &&
              String(o.account_code) === resolvedCode
          );
          if (match) {
            MONTH_KEYS.forEach(m => {
              match.monthly_spending[m] = {
                planned: Number(match.monthly_spending[m]?.planned || 0),
                actual: Number(spending[m]?.actual || 0)
              };
            });
            continue;
          }
        }

        const remark = String(getField(rowMap, ['Remark', 'Justification', 'Notes']) || '').trim();

        opexItems.push({
          fiscal_year: fiscalYear,
          item_no: parseInt(noRaw, 10) || opexItems.length + 1,
          site: formatBuForOpex(normBu || rawBu || 'K1'),
          description: desc,
          remark,
          justification: remark,
          qty,
          unit_price: unitPrice,
          account_code: resolvedCode,
          account_name: resolvedName,
          cost_center: String(getField(rowMap, ['Cost Center']) || 'IT').trim(),
          pic: String(getField(rowMap, ['PIC']) || 'Braseth').trim(),
          billing_cycle: String(getField(rowMap, ['Billing Cycle']) || 'Monthly').trim(),
          renewal_date: getField(rowMap, ['Renewal Date']) ? parseExcelDate(getField(rowMap, ['Renewal Date']), fiscalYear) : null,
          annual_cost: Math.round(monthSum * 100) / 100,
          monthly_spending: spending
        });
      }
      return;
    }

    // 3. COA Details Sheet (Template header Row 2 [0-idx 1], data Row 3 [0-idx 2])
    if (lower === 'coa details' || lower.includes('coa detail') || lower.includes('gl actual')) {
      detectedSheets.push(sheetName);
      const headerIdx = findHeaderRowIndex(aoa, 1, ['posting date', 'g/l account no.', 'document no.', 'itemvalue_desc']);
      if (headerIdx < 0) {
        warnings.push(`Sheet "${sheetName}": Could not locate COA Details header row.`);
        return;
      }
      const headers = aoa[headerIdx];
      for (let rIdx = headerIdx + 1; rIdx < aoa.length; rIdx++) {
        const rowMap = buildRowMap(headers, aoa[rIdx]);
        const desc = String(getField(rowMap, ['Description', 'ItemValue_Desc']) || '').trim();
        const amount = parseExcelNumber(getField(rowMap, ['Amount']));
        if (!desc && amount === 0) continue;
        if (isSummaryOrFooterRow(desc)) continue;

        const rawCode = String(getField(rowMap, ['G/L Account No.', 'Account Code']) || '').trim();
        const rawName = String(getField(rowMap, ['G/L Account Name', 'Account Name']) || '').trim();
        const coa = findCoaByCode(rawCode) || findCoaByName(rawName);
        if (!coa && rawCode) {
          warnings.push(`GL Line "${desc}": G/L Account "${rawCode}" not in COA Summary.`);
        }

        const rawBu = String(getField(rowMap, ['Business Unit Code', 'BU', 'Site']) || 'K1').trim();
        const normBu = normalizeBuCanonical(rawBu) || rawBu || 'K1';

        glActuals.push({
          fiscal_year: fiscalYear,
          posting_date: parseExcelDate(getField(rowMap, ['Posting Date']), fiscalYear),
          external_document_no: String(getField(rowMap, ['External Document No.', 'Ext Doc No']) || '').trim(),
          document_no: String(getField(rowMap, ['Document No.', 'Doc No']) || '').trim(),
          gl_account_no: coa ? coa.account_code : (rawCode || '630104'),
          gl_account_name: coa ? coa.account_name : (rawName || 'Other Outside Services'),
          item_value_desc: String(getField(rowMap, ['ItemValue_Desc', 'Item Value']) || '').trim(),
          description: desc || rawName || 'GL Posting',
          amount,
          bu_code: normBu,
          source: 'COA Details'
        });
      }
    }
  });

  return { capexItems, opexItems, glActuals, warnings, detectedSheets };
}
