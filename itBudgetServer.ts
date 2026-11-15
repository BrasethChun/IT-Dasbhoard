import { Express, Request, Response } from 'express';
import crypto from 'crypto';
import {
  BU_MASTER_LIST,
  DEPT_DEFINITIONS,
  ASSET_TYPES_MASTER,
  BUSINESS_LINES_MASTER,
  COA_SUMMARY_2027,
  HISTORICAL_UNIT_PRICE_CATALOG,
  normalizeBuCanonical,
  normalizeDepartmentCode,
  findAssetTypeMeta,
  findCoaByCode,
  findCoaByName,
  extractGlCodeNumber,
  normalizeCapexStatus,
  normalizeCapexStage,
  monthLabelToIndex,
  indexToMonthLabel
} from './src/data/itBudget2027MasterData';

export interface MonthlyPhasing {
  planned: number;
  actual: number;
}

export interface YearMonthlySpending {
  jan: MonthlyPhasing;
  feb: MonthlyPhasing;
  mar: MonthlyPhasing;
  apr: MonthlyPhasing;
  may: MonthlyPhasing;
  jun: MonthlyPhasing;
  jul: MonthlyPhasing;
  aug: MonthlyPhasing;
  sep: MonthlyPhasing;
  oct: MonthlyPhasing;
  nov: MonthlyPhasing;
  dec: MonthlyPhasing;
}

export const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

export function createEmptyMonthlySpending(): YearMonthlySpending {
  const res: any = {};
  MONTH_KEYS.forEach(m => {
    res[m] = { planned: 0, actual: 0 };
  });
  return res as YearMonthlySpending;
}

export function computeQuarterlyFromMonthly(monthly: YearMonthlySpending) {
  const getP = (m: keyof YearMonthlySpending) => Number(monthly?.[m]?.planned || 0);
  const getA = (m: keyof YearMonthlySpending) => Number(monthly?.[m]?.actual || 0);

  const q1_planned = getP('jan') + getP('feb') + getP('mar');
  const q1_actual = getA('jan') + getA('feb') + getA('mar');
  const q1_variance = q1_planned - q1_actual;

  const q2_planned = getP('apr') + getP('may') + getP('jun');
  const q2_actual = getA('apr') + getA('may') + getA('jun');
  const q2_variance = q2_planned - q2_actual;

  const q3_planned = getP('jul') + getP('aug') + getP('sep');
  const q3_actual = getA('jul') + getA('aug') + getA('sep');
  const q3_variance = q3_planned - q3_actual;

  const q4_planned = getP('oct') + getP('nov') + getP('dec');
  const q4_actual = getA('oct') + getA('nov') + getA('dec');
  const q4_variance = q4_planned - q4_actual;

  const total_planned = q1_planned + q2_planned + q3_planned + q4_planned;
  const total_actual = q1_actual + q2_actual + q3_actual + q4_actual;
  const total_variance = total_planned - total_actual;

  return {
    q1: q1_planned,
    q2: q2_planned,
    q3: q3_planned,
    q4: q4_planned,
    total: total_planned,
    planned: { q1: q1_planned, q2: q2_planned, q3: q3_planned, q4: q4_planned, total: total_planned },
    actual: { q1: q1_actual, q2: q2_actual, q3: q3_actual, q4: q4_actual, total: total_actual },
    variance: { q1: q1_variance, q2: q2_variance, q3: q3_variance, q4: q4_variance, total: total_variance }
  };
}

export function applySmartSpread(
  billingCycle: string, 
  renewalDate: string | null | undefined, 
  unitPrice: number, 
  qty: number = 1
): YearMonthlySpending {
  const spending = createEmptyMonthlySpending();
  const totalCost = Number(unitPrice || 0) * Number(qty || 1);

  if (billingCycle === 'Monthly') {
    // Distribute monthly cost equally across all 12 months
    const monthlyAmt = Number(unitPrice || 0) * Number(qty || 1);
    MONTH_KEYS.forEach(m => {
      spending[m] = { planned: monthlyAmt, actual: 0 };
    });
  } else if (billingCycle === 'Quarterly') {
    // Distribute into Mar, Jun, Sep, Dec
    const quarterlyAmt = totalCost / 4;
    spending.mar = { planned: quarterlyAmt, actual: 0 };
    spending.jun = { planned: quarterlyAmt, actual: 0 };
    spending.sep = { planned: quarterlyAmt, actual: 0 };
    spending.dec = { planned: quarterlyAmt, actual: 0 };
  } else {
    // Annual: assign lump sum to renewal month
    let targetMonthIdx = 0; // default Jan
    if (renewalDate) {
      const dateStr = String(renewalDate).trim();
      const parts = dateStr.slice(0, 10).split('-');
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        if (!isNaN(m) && m >= 1 && m <= 12) {
          targetMonthIdx = m - 1;
        }
      } else {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          targetMonthIdx = d.getMonth();
        }
      }
    }
    const monthKey = MONTH_KEYS[targetMonthIdx] || 'jan';
    spending[monthKey] = { planned: totalCost, actual: 0 };
  }

  return spending;
}

export async function initItBudgetTables(db: any) {
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS it_capex_plan (
      id VARCHAR(36) PRIMARY KEY,
      fiscal_year INT NOT NULL DEFAULT 2027,
      item_no INT DEFAULT 1,
      description VARCHAR(255) NOT NULL,
      asset_type VARCHAR(100) NOT NULL,
      site VARCHAR(50) NOT NULL,
      pic VARCHAR(100) DEFAULT 'Braseth',
      cost_center VARCHAR(50) DEFAULT 'IT',
      project_owner VARCHAR(100) DEFAULT 'Braseth',
      department VARCHAR(100) DEFAULT 'IT Department',
      qty INT DEFAULT 1,
      capex_code VARCHAR(100),
      unit_price DECIMAL(15,2) DEFAULT 0,
      requested_amount DECIMAL(15,2) DEFAULT 0,
      start_date DATE,
      complete_date DATE,
      status VARCHAR(50) DEFAULT 'Planned',
      justification TEXT,
      monthly_spending JSON,
      quarterly_spending JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_capex_fy (fiscal_year),
      INDEX idx_capex_site (site)
    )`);

    await db.query(`CREATE TABLE IF NOT EXISTS it_opex_plan (
      id VARCHAR(36) PRIMARY KEY,
      fiscal_year INT NOT NULL DEFAULT 2027,
      item_no INT DEFAULT 1,
      account_code VARCHAR(50) NOT NULL,
      account_name VARCHAR(150) NOT NULL,
      description VARCHAR(255) NOT NULL,
      justification TEXT,
      site VARCHAR(50) NOT NULL,
      cost_center VARCHAR(50) DEFAULT 'IT',
      pic VARCHAR(100) DEFAULT 'Braseth',
      billing_cycle VARCHAR(50) DEFAULT 'Annual',
      renewal_date DATE,
      qty INT DEFAULT 1,
      unit_price DECIMAL(15,2) DEFAULT 0,
      annual_cost DECIMAL(15,2) DEFAULT 0,
      monthly_spending JSON,
      budget_classification VARCHAR(50) DEFAULT 'Planned',
      unplanned_reason VARCHAR(255) DEFAULT '',
      approval_ref VARCHAR(100) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_opex_fy (fiscal_year),
      INDEX idx_opex_site (site)
    )`);

    // Ensure 2027 CapEx & OpEx columns exist without disturbing legacy rows
    try {
      const [capexCols]: any = await db.query('DESCRIBE it_capex_plan');
      const hasCapexCol = (name: string) => capexCols.some((c: any) => c.Field === name);
      if (!hasCapexCol('fiscal_year')) {
        await db.query('ALTER TABLE it_capex_plan ADD COLUMN fiscal_year INT NOT NULL DEFAULT 2027 AFTER id');
        await db.query('ALTER TABLE it_capex_plan ADD INDEX idx_capex_fy (fiscal_year)');
        await db.query('UPDATE it_capex_plan SET fiscal_year = 2027 WHERE fiscal_year IS NULL OR fiscal_year = 0');
      }
      if (!hasCapexCol('specifications')) {
        await db.query('ALTER TABLE it_capex_plan ADD COLUMN specifications TEXT AFTER description');
      }
      if (!hasCapexCol('asset_owner')) {
        await db.query("ALTER TABLE it_capex_plan ADD COLUMN asset_owner VARCHAR(50) DEFAULT 'IT' AFTER asset_type");
      }
      if (!hasCapexCol('asset_supervisor')) {
        await db.query("ALTER TABLE it_capex_plan ADD COLUMN asset_supervisor VARCHAR(50) DEFAULT 'ITO' AFTER asset_owner");
      }
      if (!hasCapexCol('expected_start_month')) {
        await db.query("ALTER TABLE it_capex_plan ADD COLUMN expected_start_month VARCHAR(20) DEFAULT 'Jan' AFTER complete_date");
      }
      if (!hasCapexCol('expected_complete_month')) {
        await db.query("ALTER TABLE it_capex_plan ADD COLUMN expected_complete_month VARCHAR(20) DEFAULT 'Dec' AFTER expected_start_month");
      }
      if (!hasCapexCol('stage_tag')) {
        await db.query("ALTER TABLE it_capex_plan ADD COLUMN stage_tag VARCHAR(50) DEFAULT 'Planning' AFTER status");
      }
    } catch (e: any) {
      console.warn('[IT Budget] Capex column check:', e.message);
    }

    try {
      const [opexCols]: any = await db.query('DESCRIBE it_opex_plan');
      const hasOpexCol = (name: string) => opexCols.some((c: any) => c.Field === name);
      if (!hasOpexCol('fiscal_year')) {
        await db.query('ALTER TABLE it_opex_plan ADD COLUMN fiscal_year INT NOT NULL DEFAULT 2027 AFTER id');
        await db.query('ALTER TABLE it_opex_plan ADD INDEX idx_opex_fy (fiscal_year)');
        await db.query('UPDATE it_opex_plan SET fiscal_year = 2027 WHERE fiscal_year IS NULL OR fiscal_year = 0');
      }
      if (!hasOpexCol('remark')) {
        await db.query('ALTER TABLE it_opex_plan ADD COLUMN remark TEXT AFTER description');
      }
      if (!hasOpexCol('budget_classification')) {
        await db.query("ALTER TABLE it_opex_plan ADD COLUMN budget_classification VARCHAR(50) DEFAULT 'Planned'");
      }
      if (!hasOpexCol('unplanned_reason')) {
        await db.query("ALTER TABLE it_opex_plan ADD COLUMN unplanned_reason VARCHAR(255) DEFAULT ''");
      }
      if (!hasOpexCol('approval_ref')) {
        await db.query("ALTER TABLE it_opex_plan ADD COLUMN approval_ref VARCHAR(100) DEFAULT ''");
      }
    } catch (e: any) {
      console.warn('[IT Budget] Opex column check:', e.message);
    }

    // GL Actuals Ledger Table (COA Details)
    await db.query(`CREATE TABLE IF NOT EXISTS it_gl_actuals (
      id VARCHAR(36) PRIMARY KEY,
      fiscal_year INT NOT NULL DEFAULT 2027,
      posting_date DATE NOT NULL,
      external_document_no VARCHAR(120) DEFAULT '',
      document_no VARCHAR(120) DEFAULT '',
      gl_account_no VARCHAR(50) NOT NULL,
      gl_account_name VARCHAR(180) NOT NULL,
      item_value_desc VARCHAR(255) DEFAULT '',
      description VARCHAR(255) NOT NULL,
      amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      bu_code VARCHAR(50) NOT NULL DEFAULT 'K1',
      source VARCHAR(50) DEFAULT 'COA Details',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_gl_fy (fiscal_year),
      INDEX idx_gl_bu (bu_code),
      INDEX idx_gl_acct (gl_account_no),
      INDEX idx_gl_date (posting_date)
    )`);

    // Historical Unit Price Benchmark Catalog Table (Est. Unit Price)
    await db.query(`CREATE TABLE IF NOT EXISTS it_unit_price_catalog (
      id VARCHAR(36) PRIMARY KEY,
      asset_category VARCHAR(100) NOT NULL,
      capex_code VARCHAR(100) DEFAULT '',
      item_name VARCHAR(255) NOT NULL,
      vendor VARCHAR(150) DEFAULT '',
      brand_model VARCHAR(255) DEFAULT '',
      posting_date DATE NULL,
      qty INT DEFAULT 1,
      unit_price DECIMAL(15,2) DEFAULT 0.00,
      total_amount DECIMAL(15,2) DEFAULT 0.00,
      remark TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_upc_cat (asset_category)
    )`);

    try {
      const [upcCount]: any = await db.query('SELECT COUNT(*) as c FROM it_unit_price_catalog');
      if ((upcCount[0]?.c || 0) === 0) {
        for (const item of HISTORICAL_UNIT_PRICE_CATALOG) {
          await db.query(
            `INSERT IGNORE INTO it_unit_price_catalog
             (id, asset_category, capex_code, item_name, vendor, brand_model, posting_date, qty, unit_price, total_amount, remark)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              item.id, item.asset_category, item.capex_code, item.item_name,
              item.vendor, item.brand_model, item.posting_date || null,
              item.qty, item.unit_price, item.total_amount, item.remark
            ]
          );
        }
      }
    } catch (e: any) {
      console.warn('[IT Budget] Unit price catalog seed warning:', e.message);
    }

    // Master Account Codes Table for OpEx Services
    await db.query(`CREATE TABLE IF NOT EXISTS it_account_codes (
      id VARCHAR(36) PRIMARY KEY,
      code VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      category VARCHAR(50) DEFAULT 'OpEx',
      is_active TINYINT(1) DEFAULT 1,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Ensure all 17 official 2027 COA Summary accounts are seeded without deleting legacy codes
    try {
      const [existingCodes]: any = await db.query('SELECT code FROM it_account_codes');
      const existingSet = new Set(existingCodes.map((r: any) => extractGlCodeNumber(r.code)));
      for (const coa of COA_SUMMARY_2027) {
        if (!existingSet.has(coa.account_code)) {
          await db.query(
            `INSERT IGNORE INTO it_account_codes (id, code, name, description, category, sort_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              crypto.randomUUID(),
              coa.account_code,
              coa.account_name,
              `Official 2027 OPEX COA Account (${coa.account_code} — ${coa.account_name})`,
              coa.category,
              coa.sort_order
            ]
          );
        }
      }
    } catch (e: any) {
      console.warn('[IT Budget] COA Summary seed warning:', e.message);
    }

    // Persistent System Metadata Table to prevent auto-resetting deleted data on reboot/refresh
    await db.query(`CREATE TABLE IF NOT EXISTS it_system_metadata (
      meta_key VARCHAR(100) PRIMARY KEY,
      meta_value VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Check if initial seeding was already completed in the past
    const [metaRows]: any = await db.query(
      "SELECT meta_value FROM it_system_metadata WHERE meta_key = 'it_budget_seed_completed'"
    );

    const [totalCapex]: any = await db.query('SELECT COUNT(*) as c FROM it_capex_plan');
    const [totalOpex]: any = await db.query('SELECT COUNT(*) as c FROM it_opex_plan');
    const hasExistingData = (totalCapex[0]?.c || 0) > 0 || (totalOpex[0]?.c || 0) > 0;

    if (metaRows.length > 0 || hasExistingData) {
      // System was already initialized. Preserve user deletions - never auto-reset!
      if (metaRows.length === 0) {
        await db.query(
          "INSERT IGNORE INTO it_system_metadata (meta_key, meta_value) VALUES ('it_budget_seed_completed', 'true')"
        );
      }
    } else {
      // First-time fresh install: seed initial template once
      await seedItBudgetDefaults(db, 2026);
      await seedItBudgetDefaults(db, 2027);
      await db.query(
        "INSERT INTO it_system_metadata (meta_key, meta_value) VALUES ('it_budget_seed_completed', 'true')"
      );
    }
  } catch (err: any) {
    console.error('[IT Budget Tables Init Warning]:', err.message);
  }
}

export async function seedItBudgetDefaults(db: any, fiscalYear: number = 2027) {
  try {
    // 1. Seed CapEx Items
    const capexSeeds = [
      {
        item_no: 1,
        description: 'Patient Card Printer',
        asset_type: 'Printer',
        site: 'K1',
        pic: 'Braseth',
        cost_center: 'IT',
        project_owner: 'Braseth',
        department: 'IT Department',
        qty: 2,
        capex_code: `Capex#${fiscalYear}-01`,
        unit_price: 1450.00,
        start_date: `${fiscalYear}-01-15`,
        complete_date: `${fiscalYear}-02-28`,
        status: 'Approved',
        justification: 'High-durability patient identification and hospital smart badge printing.',
        monthPlan: { feb: { planned: 2900, actual: 2900 } }
      },
      {
        item_no: 2,
        description: 'Dell AIO Computer',
        asset_type: 'Computer',
        site: 'KG',
        pic: 'Braseth',
        cost_center: 'IT',
        project_owner: 'Braseth',
        department: 'IT Department',
        qty: 15,
        capex_code: `Capex#${fiscalYear}-02`,
        unit_price: 850.00,
        start_date: `${fiscalYear}-02-01`,
        complete_date: `${fiscalYear}-04-30`,
        status: 'In Progress',
        justification: 'Standard outpatient consultation and nursing station terminal hardware refreshes.',
        monthPlan: { 
          feb: { planned: 4250, actual: 4250 }, 
          mar: { planned: 4250, actual: 4100 }, 
          apr: { planned: 4250, actual: 0 } 
        }
      },
      {
        item_no: 3,
        description: 'Administrative Laptop',
        asset_type: 'Laptop',
        site: 'K2',
        pic: 'Braseth',
        cost_center: 'IT',
        project_owner: 'Braseth',
        department: 'IT Department',
        qty: 5,
        capex_code: `Capex#${fiscalYear}-03`,
        unit_price: 1100.00,
        start_date: `${fiscalYear}-03-01`,
        complete_date: `${fiscalYear}-03-31`,
        status: 'Approved',
        justification: 'Mobile computing workstations for clinical supervisors and operations.',
        monthPlan: { mar: { planned: 5500, actual: 5400 } }
      },
      {
        item_no: 4,
        description: 'DVR & IP CCTV System',
        asset_type: 'CCTV',
        site: 'Sakal',
        pic: 'Braseth',
        cost_center: 'IT',
        project_owner: 'Braseth',
        department: 'IT Department',
        qty: 1,
        capex_code: `Capex#${fiscalYear}-04`,
        unit_price: 3200.00,
        start_date: `${fiscalYear}-05-01`,
        complete_date: `${fiscalYear}-06-30`,
        status: 'Planned',
        justification: 'Perimeter security, medication room surveillance, and entrance recording coverage.',
        monthPlan: { 
          may: { planned: 1600, actual: 0 }, 
          jun: { planned: 1600, actual: 0 } 
        }
      }
    ];

    for (const c of capexSeeds) {
      const requested_amount = c.qty * c.unit_price;
      const spending = createEmptyMonthlySpending();
      Object.entries(c.monthPlan).forEach(([m, val]) => {
        if ((spending as any)[m]) {
          (spending as any)[m] = val;
        }
      });
      const quarterly = computeQuarterlyFromMonthly(spending);

      await db.query(`INSERT INTO it_capex_plan 
        (id, fiscal_year, item_no, description, asset_type, site, pic, cost_center, project_owner, department, qty, capex_code, unit_price, requested_amount, start_date, complete_date, status, justification, monthly_spending, quarterly_spending)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(), fiscalYear, c.item_no, c.description, c.asset_type, c.site, c.pic,
          c.cost_center, c.project_owner, c.department, c.qty, c.capex_code, c.unit_price,
          requested_amount, c.start_date, c.complete_date, c.status, c.justification,
          JSON.stringify(spending), JSON.stringify(quarterly)
        ]
      );
    }

    // 2. Seed OpEx Items
    const opexSeeds = [
      {
        item_no: 1,
        account_code: '630104 - Other Outside Services',
        account_name: 'Other Outside Services',
        description: 'eHospital Annual Maintenance Fee',
        justification: 'Core Hospital Information System (HIS/EMR) 24/7 SLA maintenance and database tuning.',
        site: 'K1',
        cost_center: 'IT',
        pic: 'Braseth',
        billing_cycle: 'Annual',
        renewal_date: `${fiscalYear}-01-10`,
        qty: 1,
        unit_price: 18500.00,
        actualMonth: { jan: 18500 }
      },
      {
        item_no: 2,
        account_code: '630104 - Other Outside Services',
        account_name: 'Other Outside Services',
        description: 'Anzer Annual Maintenance Fee',
        justification: 'Laboratory Information System (LIS) integration, instrument interfacing, and QC modules.',
        site: 'KG',
        cost_center: 'IT',
        pic: 'Braseth',
        billing_cycle: 'Annual',
        renewal_date: `${fiscalYear}-03-15`,
        qty: 1,
        unit_price: 9200.00,
        actualMonth: { mar: 9200 }
      },
      {
        item_no: 3,
        account_code: '630104 - Other Outside Services',
        account_name: 'Other Outside Services',
        description: 'Vcloudia Cloud VPC',
        justification: 'Production web application hosting, high-availability clusters, backup VM instances.',
        site: 'K1',
        cost_center: 'IT',
        pic: 'Braseth',
        billing_cycle: 'Monthly',
        renewal_date: `${fiscalYear}-12-31`,
        qty: 1,
        unit_price: 650.00,
        monthlyActual: 650
      },
      {
        item_no: 4,
        account_code: '630104 - Other Outside Services',
        account_name: 'Other Outside Services',
        description: 'Cyfuture Enterprise Cloud VPC',
        justification: 'Disaster recovery failover environment, encrypted cloud storage, staging servers.',
        site: 'KG',
        cost_center: 'IT',
        pic: 'Braseth',
        billing_cycle: 'Monthly',
        renewal_date: `${fiscalYear}-12-31`,
        qty: 1,
        unit_price: 480.00,
        monthlyActual: 480
      },
      {
        item_no: 5,
        account_code: '630104 - Other Outside Services',
        account_name: 'Other Outside Services',
        description: 'D365 Annual Local Support & Subscriptions',
        justification: 'Microsoft Dynamics 365 Finance & Operations user licensing and partner support.',
        site: 'K1',
        cost_center: 'IT',
        pic: 'Braseth',
        billing_cycle: 'Annual',
        renewal_date: `${fiscalYear}-11-01`,
        qty: 1,
        unit_price: 14000.00
      },
      {
        item_no: 6,
        account_code: '630104 - Other Outside Services',
        account_name: 'Other Outside Services',
        description: 'RadiAnt Dicom Viewer License',
        justification: 'Hospital-wide radiological image viewing, multi-slice reconstruction, PACS integration.',
        site: 'All Sites',
        cost_center: 'IT',
        pic: 'Braseth',
        billing_cycle: 'Annual',
        renewal_date: `${fiscalYear}-08-15`,
        qty: 1,
        unit_price: 3600.00
      },
      {
        item_no: 7,
        account_code: '630104 - Other Outside Services',
        account_name: 'Other Outside Services',
        description: 'Bluehost & GoDaddy Web Services & DNS',
        justification: 'Public portals, DNS record failover, and SSL certificate management.',
        site: 'All Sites',
        cost_center: 'IT',
        pic: 'Braseth',
        billing_cycle: 'Annual',
        renewal_date: `${fiscalYear}-02-28`,
        qty: 1,
        unit_price: 950.00,
        actualMonth: { feb: 950 }
      },
      {
        item_no: 8,
        account_code: '630104 - Other Outside Services',
        account_name: 'Other Outside Services',
        description: 'iDrive Cloud Enterprise Backup',
        justification: 'Encrypted offsite backup for PACS archives and mission-critical databases.',
        site: 'All Sites',
        cost_center: 'IT',
        pic: 'Braseth',
        billing_cycle: 'Annual',
        renewal_date: `${fiscalYear}-05-20`,
        qty: 1,
        unit_price: 1800.00
      },
      {
        item_no: 9,
        account_code: '630103 - Rent - Non-Medical equipment',
        account_name: 'Rent - Non-Medical equipment',
        description: 'MOS/BOS Heavy-Duty Network Printer Rental',
        justification: 'Multi-function clinical copying, scanning, and secure medical record printing.',
        site: 'K1',
        cost_center: 'IT',
        pic: 'Braseth',
        billing_cycle: 'Monthly',
        renewal_date: `${fiscalYear}-12-31`,
        qty: 1,
        unit_price: 1250.00,
        monthlyActual: 1250
      }
    ];

    for (const o of opexSeeds) {
      const spending = applySmartSpread(o.billing_cycle, o.renewal_date, o.unit_price, o.qty);
      if (o.monthlyActual) {
        MONTH_KEYS.forEach(m => {
          if (m === 'jan' || m === 'feb' || m === 'mar') {
            spending[m].actual = o.monthlyActual;
          }
        });
      }
      if (o.actualMonth) {
        Object.entries(o.actualMonth).forEach(([m, val]) => {
          if (spending[m as keyof YearMonthlySpending]) {
            spending[m as keyof YearMonthlySpending].actual = Number(val);
          }
        });
      }
      const annual_cost = MONTH_KEYS.reduce((acc, m) => acc + (spending[m]?.planned || 0), 0);

      await db.query(`INSERT INTO it_opex_plan 
        (id, fiscal_year, item_no, account_code, account_name, description, justification, site, cost_center, pic, billing_cycle, renewal_date, qty, unit_price, annual_cost, monthly_spending)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(), fiscalYear, o.item_no, o.account_code, o.account_name, o.description, o.justification, o.site, o.cost_center, o.pic,
          o.billing_cycle, o.renewal_date, o.qty, o.unit_price, annual_cost, JSON.stringify(spending)
        ]
      );
    }
    console.log(`[IT Budget] Successfully seeded initial ${fiscalYear} CapEx & S-Operation items`);
  } catch (err: any) {
    console.error('[IT Budget Seeding Error]:', err.message);
  }
}

export function normalizeBudgetSite(site?: string): string | null {
  if (!site || site === 'All Sites' || site === 'All' || site === 'All BUs') return null;
  const canonical = normalizeBuCanonical(site);
  if (canonical === 'All Sites') return null;
  return canonical;
}

function buildBuFilterSql(colName: string, site: string | undefined, params: any[]): string {
  const canonical = normalizeBudgetSite(site);
  if (!canonical) return '';
  if (canonical === 'K3') {
    params.push('K3', 'Sakal', 'Sakal 2004', 'K3 / Sakal');
    return ` AND ${colName} IN (?, ?, ?, ?)`;
  }
  if (canonical === 'Sakal Lab') {
    params.push('Sakal Lab', 'Sakal Laboratory', 'SL');
    return ` AND ${colName} IN (?, ?, ?)`;
  }
  if (canonical === 'K1') {
    params.push('K1', 'Khema TK', 'TK');
    return ` AND ${colName} IN (?, ?, ?)`;
  }
  if (canonical === 'K2') {
    params.push('K2', 'Khema BKK', 'BKK');
    return ` AND ${colName} IN (?, ?, ?)`;
  }
  if (canonical === 'KG') {
    params.push('KG', 'Khema Global', 'Global');
    return ` AND ${colName} IN (?, ?, ?)`;
  }
  params.push(site);
  return ` AND ${colName} = ?`;
}

function resolveCoaPair(accountCode?: string, accountName?: string): { code: string; name: string } {
  const byCode = findCoaByCode(accountCode);
  if (byCode) return { code: byCode.account_code, name: byCode.account_name };
  const byName = findCoaByName(accountName);
  if (byName) return { code: byName.account_code, name: byName.account_name };
  const cleanCode = extractGlCodeNumber(accountCode) || (accountCode || '630104').trim();
  const cleanName = (accountName || (accountCode && accountCode.includes('-') ? accountCode.split('-').slice(1).join('-').trim() : '') || 'Other Outside Services').trim();
  return { code: cleanCode, name: cleanName };
}

function deriveExpectedMonth(val?: string | null, fallback: string = 'Jan'): string {
  const idx = monthLabelToIndex(val);
  return idx >= 0 ? indexToMonthLabel(idx) : fallback;
}

export function setupItBudgetRoutes(app: Express, authenticateToken: any, getDb: () => any) {
  // Ensure tables exist on boot
  const db = getDb();
  initItBudgetTables(db).catch(e => console.warn('[IT Budget Boot Init]:', e.message));

  // --- 1. EXECUTIVE SUMMARY & KPIS ---
  app.get('/api/it-budget/summary', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const site = req.query.site as string;
      const fiscalYear = parseInt(req.query.fiscal_year as string, 10) || 2027;

      let whereCapex = 'WHERE fiscal_year = ?';
      let whereOpex = 'WHERE fiscal_year = ?';
      let whereGl = 'WHERE fiscal_year = ?';
      const paramsCapex: any[] = [fiscalYear];
      const paramsOpex: any[] = [fiscalYear];
      const paramsGl: any[] = [fiscalYear];

      whereCapex += buildBuFilterSql('site', site, paramsCapex);
      whereOpex += buildBuFilterSql('site', site, paramsOpex);
      whereGl += buildBuFilterSql('bu_code', site, paramsGl);

      const [capexRows]: any = await db.query(`SELECT * FROM it_capex_plan ${whereCapex}`, paramsCapex);
      const [opexRows]: any = await db.query(`SELECT * FROM it_opex_plan ${whereOpex}`, paramsOpex);
      const [glRows]: any = await db.query(`SELECT * FROM it_gl_actuals ${whereGl}`, paramsGl).catch(() => [[]]);

      // Available years list across tables
      const [yearRowsCapex]: any = await db.query('SELECT DISTINCT fiscal_year FROM it_capex_plan');
      const [yearRowsOpex]: any = await db.query('SELECT DISTINCT fiscal_year FROM it_opex_plan');
      const [yearRowsGl]: any = await db.query('SELECT DISTINCT fiscal_year FROM it_gl_actuals').catch(() => [[]]);
      const yearSet = new Set<number>([2026, 2027, 2028, 2029, 2030]);
      yearRowsCapex.forEach((r: any) => r.fiscal_year && yearSet.add(r.fiscal_year));
      yearRowsOpex.forEach((r: any) => r.fiscal_year && yearSet.add(r.fiscal_year));
      yearRowsGl.forEach((r: any) => r.fiscal_year && yearSet.add(r.fiscal_year));
      const availableYears = Array.from(yearSet).sort((a, b) => a - b);

      let totalCapexRequested = 0;
      let totalCapexApproved = 0;
      let totalCapexInProgress = 0;
      let totalCapexCompleted = 0;
      let totalCapexActual = 0;

      const capexByAssetType: Record<string, { planned: number; actual: number; count: number }> = {};
      const capexByStatus: Record<string, { planned: number; actual: number; count: number }> = {
        'In Progress': { planned: 0, actual: 0, count: 0 },
        'Complete': { planned: 0, actual: 0, count: 0 },
        'Cancelled': { planned: 0, actual: 0, count: 0 }
      };
      const capexByStage: Record<string, { planned: number; actual: number; count: number }> = {
        'Estimate': { planned: 0, actual: 0, count: 0 },
        'Agreement': { planned: 0, actual: 0, count: 0 },
        'Bill': { planned: 0, actual: 0, count: 0 },
        'Planning': { planned: 0, actual: 0, count: 0 }
      };
      const capexQuarterly = { q1: 0, q2: 0, q3: 0, q4: 0, total: 0 };

      const BU_KEYS = ['K1', 'K2', 'KG', 'K3', 'Sakal Lab', 'All Sites'];
      const capexBySite: Record<string, { planned: number; actual: number; count: number }> = {};
      const opexBySite: Record<string, { planned: number; actual: number; glActual: number; count: number }> = {};
      BU_KEYS.forEach(k => {
        capexBySite[k] = { planned: 0, actual: 0, count: 0 };
        opexBySite[k] = { planned: 0, actual: 0, glActual: 0, count: 0 };
      });

      const monthlyCashFlow: Record<string, {
        planned_capex: number;
        actual_capex: number;
        planned_opex: number;
        actual_opex: number;
        gl_actual_opex: number;
        planned_total: number;
        actual_total: number;
        variance: number;
      }> = {};

      MONTH_KEYS.forEach(m => {
        monthlyCashFlow[m] = {
          planned_capex: 0,
          actual_capex: 0,
          planned_opex: 0,
          actual_opex: 0,
          gl_actual_opex: 0,
          planned_total: 0,
          actual_total: 0,
          variance: 0
        };
      });

      capexRows.forEach((row: any) => {
        const reqAmt = parseFloat(row.requested_amount) || 0;
        totalCapexRequested += reqAmt;
        const normStatus = normalizeCapexStatus(row.status);
        const normStage = normalizeCapexStage(row.stage_tag, row.status);
        if (normStatus === 'In Progress') totalCapexInProgress += reqAmt;
        if (normStatus === 'Complete') totalCapexCompleted += reqAmt;
        if (row.status === 'Approved' || normStage === 'Agreement') totalCapexApproved += reqAmt;

        const asset = row.asset_type || 'Other';
        if (!capexByAssetType[asset]) capexByAssetType[asset] = { planned: 0, actual: 0, count: 0 };
        capexByAssetType[asset].planned += reqAmt;
        capexByAssetType[asset].count += 1;

        capexByStatus[normStatus].planned += reqAmt;
        capexByStatus[normStatus].count += 1;

        capexByStage[normStage].planned += reqAmt;
        capexByStage[normStage].count += 1;

        const rowBu = normalizeBuCanonical(row.site) || 'All Sites';
        if (!capexBySite[rowBu]) capexBySite[rowBu] = { planned: 0, actual: 0, count: 0 };
        capexBySite[rowBu].planned += reqAmt;
        capexBySite[rowBu].count += 1;

        let spending: YearMonthlySpending;
        try {
          spending = typeof row.monthly_spending === 'string' ? JSON.parse(row.monthly_spending) : row.monthly_spending;
        } catch {
          spending = createEmptyMonthlySpending();
        }

        const q = computeQuarterlyFromMonthly(spending);
        capexQuarterly.q1 += q.q1;
        capexQuarterly.q2 += q.q2;
        capexQuarterly.q3 += q.q3;
        capexQuarterly.q4 += q.q4;
        capexQuarterly.total += q.total;

        MONTH_KEYS.forEach(m => {
          const planAmt = Number(spending?.[m]?.planned) || 0;
          const actAmt = Number(spending?.[m]?.actual) || 0;
          totalCapexActual += actAmt;
          capexByAssetType[asset].actual += actAmt;
          capexByStatus[normStatus].actual += actAmt;
          capexByStage[normStage].actual += actAmt;
          capexBySite[rowBu].actual += actAmt;

          monthlyCashFlow[m].planned_capex += planAmt;
          monthlyCashFlow[m].actual_capex += actAmt;
          monthlyCashFlow[m].planned_total += planAmt;
          monthlyCashFlow[m].actual_total += actAmt;
        });
      });

      // OpEx aggregations
      let totalAnnualOpex = 0;
      let totalAnnualOpexActual = 0;
      let totalUnplannedOpexPlanned = 0;
      let totalUnplannedOpexActual = 0;
      let unplannedOpexCount = 0;

      const opexByAccount: Record<string, { code: string; name: string; planned: number; actual: number; glActual: number; count: number }> = {};
      const upcomingRenewals: any[] = [];
      const now = new Date();

      opexRows.forEach((row: any) => {
        const annual = parseFloat(row.annual_cost) || 0;
        totalAnnualOpex += annual;

        const isUnplanned = row.budget_classification === 'Unplanned' || row.budget_classification === 'Out-of-Budget';
        if (isUnplanned) {
          totalUnplannedOpexPlanned += annual;
          unplannedOpexCount += 1;
        }

        const coa = resolveCoaPair(row.account_code, row.account_name);
        const acctKey = `${coa.code} — ${coa.name}`;
        if (!opexByAccount[acctKey]) {
          opexByAccount[acctKey] = { code: coa.code, name: coa.name, planned: 0, actual: 0, glActual: 0, count: 0 };
        }
        opexByAccount[acctKey].planned += annual;
        opexByAccount[acctKey].count += 1;

        const rowBu = normalizeBuCanonical(row.site) || 'All Sites';
        if (!opexBySite[rowBu]) opexBySite[rowBu] = { planned: 0, actual: 0, glActual: 0, count: 0 };
        opexBySite[rowBu].planned += annual;
        opexBySite[rowBu].count += 1;

        let spending: YearMonthlySpending;
        try {
          spending = typeof row.monthly_spending === 'string' ? JSON.parse(row.monthly_spending) : row.monthly_spending;
        } catch {
          spending = createEmptyMonthlySpending();
        }

        MONTH_KEYS.forEach(m => {
          const planAmt = Number(spending?.[m]?.planned) || 0;
          const actAmt = Number(spending?.[m]?.actual) || 0;
          totalAnnualOpexActual += actAmt;
          if (isUnplanned) {
            totalUnplannedOpexActual += actAmt;
          }
          opexByAccount[acctKey].actual += actAmt;
          opexBySite[rowBu].actual += actAmt;

          monthlyCashFlow[m].planned_opex += planAmt;
          monthlyCashFlow[m].actual_opex += actAmt;
          monthlyCashFlow[m].planned_total += planAmt;
          monthlyCashFlow[m].actual_total += actAmt;
        });

        if (row.renewal_date) {
          const renewDate = new Date(row.renewal_date);
          const diffMs = renewDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 60) {
            upcomingRenewals.push({
              id: row.id,
              description: row.description,
              site: row.site,
              account_code: row.account_code,
              annual_cost: row.annual_cost,
              renewal_date: row.renewal_date,
              daysRemaining: diffDays,
              isCritical: diffDays <= 30
            });
          }
        }
      });

      // Aggregate GL Actuals (COA Details) for FY
      let totalGlActual = 0;
      const glByBU: Record<string, number> = {};
      const glByAccount: Record<string, { code: string; name: string; amount: number; count: number }> = {};

      (glRows as any[]).forEach((gl: any) => {
        const amt = parseFloat(gl.amount) || 0;
        totalGlActual += amt;
        const rowBu = normalizeBuCanonical(gl.bu_code) || 'All Sites';
        glByBU[rowBu] = (glByBU[rowBu] || 0) + amt;
        if (!opexBySite[rowBu]) opexBySite[rowBu] = { planned: 0, actual: 0, glActual: 0, count: 0 };
        opexBySite[rowBu].glActual += amt;

        const coa = resolveCoaPair(gl.gl_account_no, gl.gl_account_name);
        const acctKey = `${coa.code} — ${coa.name}`;
        if (!glByAccount[acctKey]) glByAccount[acctKey] = { code: coa.code, name: coa.name, amount: 0, count: 0 };
        glByAccount[acctKey].amount += amt;
        glByAccount[acctKey].count += 1;

        if (!opexByAccount[acctKey]) {
          opexByAccount[acctKey] = { code: coa.code, name: coa.name, planned: 0, actual: 0, glActual: 0, count: 0 };
        }
        opexByAccount[acctKey].glActual += amt;

        if (gl.posting_date) {
          const dt = new Date(gl.posting_date);
          if (!isNaN(dt.getTime())) {
            const mKey = MONTH_KEYS[dt.getMonth()];
            if (mKey && monthlyCashFlow[mKey]) {
              monthlyCashFlow[mKey].gl_actual_opex += amt;
            }
          }
        }
      });

      MONTH_KEYS.forEach(m => {
        monthlyCashFlow[m].variance = monthlyCashFlow[m].planned_total - monthlyCashFlow[m].actual_total;
      });

      // Site total blend (normalized K3 / Sakal unified + legacy Sakal alias)
      const totalBySite: Record<string, any> = {};
      ['K1', 'K2', 'KG', 'K3', 'Sakal Lab', 'All Sites'].forEach(s => {
        const cp = capexBySite[s]?.planned || 0;
        const ca = capexBySite[s]?.actual || 0;
        const op = opexBySite[s]?.planned || 0;
        const oa = opexBySite[s]?.actual || 0;
        const gl = opexBySite[s]?.glActual || 0;
        const effectiveOpexAct = gl > 0 ? gl : oa;
        const planned = cp + op;
        const actual = ca + effectiveOpexAct;
        const label = s === 'K3' ? 'K3 / Sakal' : s;
        totalBySite[label] = {
          bu_code: s,
          planned,
          actual,
          variance: planned - actual,
          capex_planned: cp,
          capex_actual: ca,
          opex_planned: op,
          opex_actual: oa,
          gl_actual: gl
        };
      });

      const effectiveOpexActual = totalGlActual > 0 ? totalGlActual : totalAnnualOpexActual;
      const totalFiscalBudget = totalCapexRequested + totalAnnualOpex;
      const totalFiscalActual = totalCapexActual + effectiveOpexActual;
      const totalFiscalVariance = totalFiscalBudget - totalFiscalActual;

      const cashFlowChartData = MONTH_KEYS.map(m => ({
        month: m.toUpperCase(),
        planned_capex: Math.round(monthlyCashFlow[m].planned_capex),
        actual_capex: Math.round(monthlyCashFlow[m].actual_capex),
        planned_opex: Math.round(monthlyCashFlow[m].planned_opex),
        actual_opex: Math.round(monthlyCashFlow[m].actual_opex),
        gl_actual_opex: Math.round(monthlyCashFlow[m].gl_actual_opex),
        planned_total: Math.round(monthlyCashFlow[m].planned_total),
        actual_total: Math.round(monthlyCashFlow[m].actual_total),
        variance: Math.round(monthlyCashFlow[m].variance)
      }));

      res.json({
        fiscalYear,
        availableYears,
        totalFiscalBudget,
        totalFiscalActual,
        totalFiscalVariance,
        variancePercentage: totalFiscalBudget > 0 ? ((totalFiscalVariance / totalFiscalBudget) * 100).toFixed(1) : '0.0',
        totalCapexRequested,
        totalCapexApproved,
        totalCapexInProgress,
        totalCapexCompleted,
        totalCapexActual,
        totalCapexVariance: totalCapexRequested - totalCapexActual,
        totalAnnualOpex,
        totalAnnualOpexActual,
        totalGlActual,
        effectiveOpexActual,
        totalAnnualOpexVariance: totalAnnualOpex - effectiveOpexActual,
        totalUnplannedOpexPlanned,
        totalUnplannedOpexActual,
        unplannedOpexCount,
        capexCount: capexRows.length,
        opexCount: opexRows.length,
        glEntryCount: (glRows as any[]).length,
        upcomingRenewals: upcomingRenewals.sort((a, b) => a.daysRemaining - b.daysRemaining),
        capexByAssetType,
        capexByStatus,
        capexByStage,
        capexByBU: capexBySite,
        capexQuarterly,
        opexByAccount,
        opexByBU: opexBySite,
        glByBU,
        glByAccount,
        totalBySite,
        totals: {
          planned_capex: totalCapexRequested,
          actual_capex: totalCapexActual,
          planned_opex: totalAnnualOpex,
          actual_opex: effectiveOpexActual
        },
        cashFlowChartData
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 2. CAPEX ROUTES ---
  app.get('/api/it-budget/capex', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { site, asset_type, department, status, stage_tag, search, fiscal_year } = req.query as any;
      const fy = parseInt(fiscal_year, 10) || 2027;

      let sql = 'SELECT * FROM it_capex_plan WHERE fiscal_year = ?';
      const params: any[] = [fy];

      sql += buildBuFilterSql('site', site, params);

      if (asset_type && asset_type !== 'All Types') {
        sql += ' AND asset_type = ?';
        params.push(asset_type);
      }
      if (department && department !== 'All Departments') {
        sql += ' AND department = ?';
        params.push(department);
      }
      if (stage_tag && stage_tag !== 'All Stages') {
        sql += ' AND stage_tag = ?';
        params.push(stage_tag);
      }
      if (search && search.trim()) {
        sql += ' AND (description LIKE ? OR specifications LIKE ? OR capex_code LIKE ? OR justification LIKE ? OR pic LIKE ?)';
        const q = `%${search.trim()}%`;
        params.push(q, q, q, q, q);
      }

      sql += ' ORDER BY item_no ASC, created_at DESC';
      const [rows] = await db.query(sql, params);

      let parsed = (rows as any[]).map(r => {
        let monthly = r.monthly_spending;
        try { if (typeof monthly === 'string') monthly = JSON.parse(monthly); } catch {}
        if (!monthly || typeof monthly !== 'object') monthly = createEmptyMonthlySpending();

        const rollups = computeQuarterlyFromMonthly(monthly);
        const assetMeta = findAssetTypeMeta(r.asset_type);
        const normStatus = normalizeCapexStatus(r.status);
        const normStage = normalizeCapexStage(r.stage_tag, r.status);
        const expectedStart = deriveExpectedMonth(r.expected_start_month || r.start_date, 'Jan');
        const expectedComplete = deriveExpectedMonth(r.expected_complete_month || r.complete_date, expectedStart);

        return {
          ...r,
          bu: normalizeBuCanonical(r.site) || r.site,
          department: normalizeDepartmentCode(r.department),
          asset_owner: r.asset_owner || assetMeta?.asset_owner || 'IT',
          asset_supervisor: r.asset_supervisor || assetMeta?.asset_supervisor || 'ITO',
          specifications: r.specifications || '',
          expected_start_month: expectedStart,
          expected_complete_month: expectedComplete,
          status: normStatus,
          stage_tag: normStage,
          monthly_spending: monthly,
          quarterly_spending: rollups
        };
      });

      if (status && status !== 'All Statuses') {
        const target = normalizeCapexStatus(status);
        parsed = parsed.filter(item => item.status === target || item.status === status);
      }

      res.json(parsed);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/it-budget/capex', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const {
        fiscal_year, item_no, description, specifications, asset_type, asset_owner, asset_supervisor,
        site, pic, cost_center, project_owner, department, qty, capex_code, unit_price,
        start_date, complete_date, expected_start_month, expected_complete_month,
        status, stage_tag, justification, monthly_spending
      } = req.body;

      if (!description?.trim()) {
        return res.status(400).json({ error: 'Description is required' });
      }

      const fy = parseInt(fiscal_year, 10) || 2027;
      const id = crypto.randomUUID();
      const numQty = parseFloat(qty) || 1;
      const numPrice = parseFloat(unit_price) || 0;
      const requested_amount = Math.round(numQty * numPrice * 100) / 100;
      const normBu = normalizeBuCanonical(site) || 'K1';
      const normDept = normalizeDepartmentCode(department || 'IT');
      const meta = findAssetTypeMeta(asset_type);
      const finalOwner = asset_owner || meta?.asset_owner || 'IT';
      const finalSupervisor = asset_supervisor || meta?.asset_supervisor || 'ITO';
      const normStatus = normalizeCapexStatus(status || 'In Progress');
      const normStage = normalizeCapexStage(stage_tag, status);
      const expStart = deriveExpectedMonth(expected_start_month || start_date, 'Jan');
      const expComplete = deriveExpectedMonth(expected_complete_month || complete_date, expStart);

      let spending = monthly_spending;
      if (!spending || typeof spending !== 'object') {
        spending = createEmptyMonthlySpending();
        const mKey = MONTH_KEYS[Math.max(0, monthLabelToIndex(expStart))] || 'jan';
        spending[mKey] = { planned: requested_amount, actual: 0 };
      }
      const quarterly = computeQuarterlyFromMonthly(spending);

      await db.query(`INSERT INTO it_capex_plan 
        (id, fiscal_year, item_no, description, specifications, asset_type, asset_owner, asset_supervisor, site, pic, cost_center, project_owner, department, qty, capex_code, unit_price, requested_amount, start_date, complete_date, expected_start_month, expected_complete_month, status, stage_tag, justification, monthly_spending, quarterly_spending)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, fy, item_no || 1, description.trim(), specifications || '', asset_type || 'Computer',
          finalOwner, finalSupervisor, normBu, pic || 'Braseth', cost_center || 'IT',
          project_owner || pic || 'Braseth', normDept, numQty,
          capex_code || `${normBu === 'Sakal Lab' ? 'SKPH' : normBu}000${String(Math.floor(Math.random() * 900) + 100)}`,
          numPrice, requested_amount, start_date || null, complete_date || null,
          expStart, expComplete, normStatus, normStage,
          justification || '', JSON.stringify(spending), JSON.stringify(quarterly)
        ]
      );

      res.status(201).json({ id, success: true, message: 'CapEx item created successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/it-budget/capex/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const {
        fiscal_year, item_no, description, specifications, asset_type, asset_owner, asset_supervisor,
        site, pic, cost_center, project_owner, department, qty, capex_code, unit_price,
        start_date, complete_date, expected_start_month, expected_complete_month,
        status, stage_tag, justification, monthly_spending
      } = req.body;

      const numQty = parseFloat(qty) || 1;
      const numPrice = parseFloat(unit_price) || 0;
      const requested_amount = Math.round(numQty * numPrice * 100) / 100;
      const normBu = normalizeBuCanonical(site) || site || 'K1';
      const normDept = normalizeDepartmentCode(department || 'IT');
      const meta = findAssetTypeMeta(asset_type);
      const finalOwner = asset_owner || meta?.asset_owner || 'IT';
      const finalSupervisor = asset_supervisor || meta?.asset_supervisor || 'ITO';
      const normStatus = normalizeCapexStatus(status);
      const normStage = normalizeCapexStage(stage_tag, status);
      const expStart = deriveExpectedMonth(expected_start_month || start_date, 'Jan');
      const expComplete = deriveExpectedMonth(expected_complete_month || complete_date, expStart);

      let spending = monthly_spending;
      if (!spending || typeof spending !== 'object') {
        spending = createEmptyMonthlySpending();
      }
      const quarterly = computeQuarterlyFromMonthly(spending);

      await db.query(`UPDATE it_capex_plan SET
        fiscal_year = COALESCE(?, fiscal_year), item_no = ?, description = ?, specifications = ?,
        asset_type = ?, asset_owner = ?, asset_supervisor = ?, site = ?, pic = ?,
        cost_center = ?, project_owner = ?, department = ?, qty = ?, capex_code = ?,
        unit_price = ?, requested_amount = ?, start_date = ?, complete_date = ?,
        expected_start_month = ?, expected_complete_month = ?,
        status = ?, stage_tag = ?, justification = ?, monthly_spending = ?, quarterly_spending = ?
        WHERE id = ?`,
        [
          fiscal_year ? parseInt(fiscal_year, 10) : null,
          item_no || 1, description, specifications || '', asset_type, finalOwner, finalSupervisor,
          normBu, pic, cost_center, project_owner || pic, normDept, numQty, capex_code,
          numPrice, requested_amount, start_date || null, complete_date || null,
          expStart, expComplete, normStatus, normStage, justification || '',
          JSON.stringify(spending), JSON.stringify(quarterly), id
        ]
      );

      res.json({ success: true, message: 'CapEx item updated successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/it-budget/capex/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { id } = req.params;
      await db.query('DELETE FROM it_capex_plan WHERE id = ?', [id]);
      res.json({ success: true, id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 3. OPEX ROUTES ---
  app.get('/api/it-budget/opex', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { site, account_code, cost_center, pic, search, fiscal_year, budget_classification } = req.query as any;
      const fy = parseInt(fiscal_year, 10) || 2027;

      let sql = 'SELECT * FROM it_opex_plan WHERE fiscal_year = ?';
      const params: any[] = [fy];

      sql += buildBuFilterSql('site', site, params);

      if (account_code && account_code !== 'All Accounts') {
        const sixDigit = extractGlCodeNumber(account_code);
        sql += ' AND (account_code = ? OR account_code LIKE ?)';
        params.push(account_code, `${sixDigit}%`);
      }
      if (cost_center && cost_center !== 'All Cost Centers') {
        sql += ' AND cost_center = ?';
        params.push(cost_center);
      }
      if (pic && pic !== 'All PICs') {
        sql += ' AND pic = ?';
        params.push(pic);
      }
      if (budget_classification && budget_classification !== 'All') {
        sql += ' AND budget_classification = ?';
        params.push(budget_classification);
      }
      if (search && search.trim()) {
        sql += ' AND (description LIKE ? OR remark LIKE ? OR justification LIKE ? OR account_name LIKE ? OR account_code LIKE ? OR approval_ref LIKE ? OR unplanned_reason LIKE ?)';
        const q = `%${search.trim()}%`;
        params.push(q, q, q, q, q, q, q);
      }

      sql += ' ORDER BY item_no ASC, created_at DESC';
      const [rows] = await db.query(sql, params);

      const parsed = (rows as any[]).map(r => {
        let monthly = r.monthly_spending;
        try { if (typeof monthly === 'string') monthly = JSON.parse(monthly); } catch {}
        if (!monthly || typeof monthly !== 'object') monthly = createEmptyMonthlySpending();
        const rollups = computeQuarterlyFromMonthly(monthly);
        const coa = resolveCoaPair(r.account_code, r.account_name);
        return {
          ...r,
          account_code: coa.code,
          account_name: coa.name,
          remark: r.remark || r.justification || '',
          bu_canonical: normalizeBuCanonical(r.site) || r.site,
          monthly_spending: monthly,
          quarterly_spending: rollups
        };
      });

      res.json(parsed);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/it-budget/opex', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const {
        fiscal_year, item_no, account_code, account_name, description, remark, justification,
        site, cost_center, pic, billing_cycle, renewal_date, qty, unit_price,
        monthly_spending, autoSmartSpread, budget_classification, unplanned_reason, approval_ref
      } = req.body;

      if (!description?.trim()) {
        return res.status(400).json({ error: 'Description is required' });
      }

      const fy = parseInt(fiscal_year, 10) || 2027;
      const id = crypto.randomUUID();
      const numQty = parseFloat(qty) || 1;
      const numPrice = parseFloat(unit_price) || 0;
      const cycle = billing_cycle || 'Annual';
      const coa = resolveCoaPair(account_code, account_name);
      const normBu = normalizeBuCanonical(site) === 'K3' ? 'Sakal' : (normalizeBuCanonical(site) || 'K1');

      let spending = monthly_spending;
      if (autoSmartSpread || !spending) {
        spending = applySmartSpread(cycle, renewal_date, numPrice, numQty);
      }

      let annual_cost = 0;
      if (spending && typeof spending === 'object') {
        annual_cost = Math.round(MONTH_KEYS.reduce((acc, m) => acc + (Number(spending[m]?.planned) || 0), 0) * 100) / 100;
      } else {
        annual_cost = cycle === 'Monthly' ? numPrice * numQty * 12 : numPrice * numQty;
      }

      const finalRemark = (remark ?? justification ?? '').trim();

      await db.query(`INSERT INTO it_opex_plan 
        (id, fiscal_year, item_no, account_code, account_name, description, remark, justification, site, cost_center, pic, billing_cycle, renewal_date, qty, unit_price, annual_cost, monthly_spending, budget_classification, unplanned_reason, approval_ref)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, fy, item_no || 1, coa.code, coa.name, description.trim(), finalRemark, finalRemark,
          normBu, cost_center || 'IT', pic || 'Braseth', cycle, renewal_date || null,
          numQty, numPrice, annual_cost, JSON.stringify(spending),
          budget_classification || 'Planned', unplanned_reason || '', approval_ref || ''
        ]
      );

      res.status(201).json({ id, success: true, message: 'OpEx item created successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/it-budget/opex/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const {
        fiscal_year, item_no, account_code, account_name, description, remark, justification,
        site, cost_center, pic, billing_cycle, renewal_date, qty, unit_price,
        monthly_spending, autoSmartSpread, budget_classification, unplanned_reason, approval_ref
      } = req.body;

      const numQty = parseFloat(qty) || 1;
      const numPrice = parseFloat(unit_price) || 0;
      const cycle = billing_cycle || 'Annual';
      const coa = resolveCoaPair(account_code, account_name);
      const normBu = normalizeBuCanonical(site) === 'K3' ? 'Sakal' : (normalizeBuCanonical(site) || site || 'K1');

      let spending = monthly_spending;
      if (autoSmartSpread) {
        spending = applySmartSpread(cycle, renewal_date, numPrice, numQty);
      } else if (!spending) {
        const [existing]: any = await db.query('SELECT monthly_spending FROM it_opex_plan WHERE id = ?', [id]);
        if (existing.length > 0 && existing[0].monthly_spending) {
          try {
            spending = typeof existing[0].monthly_spending === 'string'
              ? JSON.parse(existing[0].monthly_spending)
              : existing[0].monthly_spending;
          } catch {
            spending = applySmartSpread(cycle, renewal_date, numPrice, numQty);
          }
        } else {
          spending = applySmartSpread(cycle, renewal_date, numPrice, numQty);
        }
      }

      let annual_cost = 0;
      if (spending && typeof spending === 'object') {
        annual_cost = Math.round(MONTH_KEYS.reduce((acc, m) => acc + (Number(spending[m]?.planned) || 0), 0) * 100) / 100;
      } else {
        annual_cost = cycle === 'Monthly' ? numPrice * numQty * 12 : numPrice * numQty;
      }

      const finalRemark = (remark ?? justification ?? '').trim();

      await db.query(`UPDATE it_opex_plan SET
        fiscal_year = COALESCE(?, fiscal_year), item_no = ?, account_code = ?, account_name = ?,
        description = ?, remark = ?, justification = ?, site = ?, cost_center = ?, pic = ?,
        billing_cycle = ?, renewal_date = ?, qty = ?, unit_price = ?,
        annual_cost = ?, monthly_spending = ?,
        budget_classification = ?, unplanned_reason = ?, approval_ref = ?
        WHERE id = ?`,
        [
          fiscal_year ? parseInt(fiscal_year, 10) : null,
          item_no || 1, coa.code, coa.name, description, finalRemark, finalRemark,
          normBu, cost_center, pic, cycle, renewal_date || null, numQty, numPrice,
          annual_cost, JSON.stringify(spending),
          budget_classification || 'Planned', unplanned_reason || '', approval_ref || '',
          id
        ]
      );

      res.json({ success: true, message: 'OpEx item updated successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/it-budget/opex/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { id } = req.params;
      await db.query('DELETE FROM it_opex_plan WHERE id = ?', [id]);
      res.json({ success: true, id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 3.5. MASTER CRUD: CONFIGURE OPEX ACCOUNT CODES ---
  app.get('/api/it-budget/account-codes', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      let [rows]: any = await db.query('SELECT * FROM it_account_codes ORDER BY sort_order ASC, code ASC');
      if (rows.length === 0) {
        const defaultCodes = [
          { code: '630104 - Other Outside Services', name: 'Other Outside Services', description: 'External vendor contracts, technical maintenance SLAs, IT service retainers', sort: 1 },
          { code: '630103 - Rent - Non-Medical equipment', name: 'Rent - Non-Medical equipment', description: 'Printers, POS terminals, scanners, and hardware leases', sort: 2 },
          { code: '630102 - Communication & Internet', name: 'Communication & Internet', description: 'Fiber internet lines, backup links, VoIP trunking, SIM cards', sort: 3 },
          { code: '630105 - Cloud & SaaS Licenses', name: 'Cloud & SaaS Licenses', description: 'AWS/GCP/Azure hosting, Office 365, Antivirus, backup SaaS', sort: 4 },
          { code: '630106 - Software Maintenance & Support', name: 'Software Maintenance & Support', description: 'HIS/LIS/PACS database maintenance and support agreements', sort: 5 },
          { code: '630107 - Hardware Maintenance & Repairs', name: 'Hardware Maintenance & Repairs', description: 'UPS batteries replacement, spare parts, computer repair services', sort: 6 }
        ];
        for (const item of defaultCodes) {
          await db.query(
            `INSERT IGNORE INTO it_account_codes (id, code, name, description, category, sort_order)
             VALUES (?, ?, ?, ?, 'OpEx', ?)`,
            [crypto.randomUUID(), item.code, item.name, item.description, item.sort]
          );
        }
        [rows] = await db.query('SELECT * FROM it_account_codes ORDER BY sort_order ASC, code ASC');
      }
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/it-budget/account-codes', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { code, name, description, category, sort_order, is_active } = req.body;
      if (!code?.trim() || !name?.trim()) {
        return res.status(400).json({ error: 'Account code and name are required' });
      }
      const trimmedCode = code.trim();
      const [existing]: any = await db.query('SELECT id FROM it_account_codes WHERE code = ?', [trimmedCode]);
      if (existing.length > 0) {
        return res.status(409).json({ error: `Account code "${trimmedCode}" already exists` });
      }
      const id = crypto.randomUUID();
      await db.query(
        `INSERT INTO it_account_codes (id, code, name, description, category, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id, trimmedCode, name.trim(), description?.trim() || '',
          category || 'OpEx', parseInt(sort_order, 10) || 0, is_active !== false ? 1 : 0
        ]
      );
      const [created]: any = await db.query('SELECT * FROM it_account_codes WHERE id = ?', [id]);
      res.status(201).json(created[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/it-budget/account-codes/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { code, name, description, category, sort_order, is_active } = req.body;
      if (!code?.trim() || !name?.trim()) {
        return res.status(400).json({ error: 'Account code and name are required' });
      }
      const [current]: any = await db.query('SELECT * FROM it_account_codes WHERE id = ?', [id]);
      if (current.length === 0) {
        return res.status(404).json({ error: 'Account code not found' });
      }
      const oldCode = current[0].code;
      const newCode = code.trim();

      if (oldCode !== newCode) {
        const [dup]: any = await db.query('SELECT id FROM it_account_codes WHERE code = ? AND id != ?', [newCode, id]);
        if (dup.length > 0) {
          return res.status(409).json({ error: `Account code "${newCode}" already exists` });
        }
      }

      await db.query(
        `UPDATE it_account_codes SET
         code = ?, name = ?, description = ?, category = ?, sort_order = ?, is_active = ?
         WHERE id = ?`,
        [
          newCode, name.trim(), description?.trim() || '',
          category || 'OpEx', parseInt(sort_order, 10) || 0, is_active !== false ? 1 : 0,
          id
        ]
      );

      // Cascade update to it_opex_plan if code changed
      if (oldCode !== newCode) {
        await db.query('UPDATE it_opex_plan SET account_code = ?, account_name = ? WHERE account_code = ?', [
          newCode, name.trim(), oldCode
        ]);
      }

      const [updated]: any = await db.query('SELECT * FROM it_account_codes WHERE id = ?', [id]);
      res.json(updated[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/it-budget/account-codes/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const [target]: any = await db.query('SELECT * FROM it_account_codes WHERE id = ?', [id]);
      if (target.length === 0) {
        return res.status(404).json({ error: 'Account code not found' });
      }
      const codeToDelete = target[0].code;
      const [usage]: any = await db.query('SELECT COUNT(*) as c FROM it_opex_plan WHERE account_code = ?', [codeToDelete]);
      const inUseCount = usage[0]?.c || 0;
      if (inUseCount > 0) {
        return res.status(400).json({ 
          error: `Cannot delete "${codeToDelete}" because it is currently linked to ${inUseCount} OpEx service(s). Please reassign them first.` 
        });
      }
      await db.query('DELETE FROM it_account_codes WHERE id = ?', [id]);
      res.json({ success: true, message: 'Account code deleted', id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 4. AUTO-LINK ACTUALS FROM IT_EXPENSES TABLE ---
  app.post('/api/it-budget/sync-expenses', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const fiscalYear = parseInt(req.body.fiscal_year, 10) || 2027;

      // Query all expense records for this year (e.g., month = '2027-01' to '2027-12')
      const [expenseRows]: any = await db.query(
        "SELECT * FROM it_expenses WHERE month LIKE ? ORDER BY month ASC",
        [`${fiscalYear}-%`]
      );

      // If no expenses in it_expenses yet for this year, inform the user
      if (expenseRows.length === 0) {
        return res.json({
          success: true,
          syncedCount: 0,
          message: `No expense records found in 'it_expenses' table for year ${fiscalYear}. Current manual actuals preserved.`
        });
      }

      // Group actuals by month index (0 = jan, 11 = dec) and category / site
      const monthlyActualsByCategory: Record<string, Record<string, number>> = {};
      expenseRows.forEach((r: any) => {
        const parts = (r.month || '').split('-');
        if (parts.length === 2) {
          const monthIdx = parseInt(parts[1], 10) - 1;
          if (monthIdx >= 0 && monthIdx < 12) {
            const mKey = MONTH_KEYS[monthIdx];
            const cat = (r.category || 'General').toLowerCase();
            const spend = parseFloat(r.actual_spend) || 0;
            if (!monthlyActualsByCategory[cat]) monthlyActualsByCategory[cat] = {};
            monthlyActualsByCategory[cat][mKey] = (monthlyActualsByCategory[cat][mKey] || 0) + spend;
          }
        }
      });

      // Update OpEx items matching categories or distribute
      const [opexRows]: any = await db.query('SELECT * FROM it_opex_plan WHERE fiscal_year = ?', [fiscalYear]);
      let updatedOpex = 0;

      for (const row of opexRows) {
        let spending = row.monthly_spending;
        try { if (typeof spending === 'string') spending = JSON.parse(spending); } catch {}
        if (!spending) spending = createEmptyMonthlySpending();

        // Check if there's matching category in it_expenses
        const desc = (row.description || '').toLowerCase();
        let matched = false;
        Object.entries(monthlyActualsByCategory).forEach(([cat, months]) => {
          if (desc.includes(cat) || cat.includes('software') || cat.includes('cloud') || cat.includes('service')) {
            matched = true;
            MONTH_KEYS.forEach(m => {
              if (months[m] !== undefined) {
                spending[m].actual = months[m];
              }
            });
          }
        });

        if (matched) {
          await db.query('UPDATE it_opex_plan SET monthly_spending = ? WHERE id = ?', [JSON.stringify(spending), row.id]);
          updatedOpex++;
        }
      }

      res.json({
        success: true,
        syncedCount: expenseRows.length,
        updatedOpex,
        message: `Successfully synchronized ${expenseRows.length} expense entries from it_expenses for FY ${fiscalYear}!`
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 5. CLONE / PLAN NEW FISCAL YEAR ---
  app.post('/api/it-budget/clone-year', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const fromYear = parseInt(req.body.from_year, 10) || 2026;
      const toYear = parseInt(req.body.to_year, 10);
      const copyCapex = req.body.copy_capex !== false;
      const copyOpex = req.body.copy_opex !== false;
      const campusFilter = req.body.campus_filter && req.body.campus_filter !== 'All Sites' ? req.body.campus_filter : null;
      const adjustmentPercent = parseFloat(req.body.adjustment_percent) || 0;
      const multiplier = 1 + (adjustmentPercent / 100);

      if (!toYear || toYear < 2020 || toYear > 2050) {
        return res.status(400).json({ error: 'Valid destination fiscal year is required' });
      }

      if (!copyCapex && !copyOpex) {
        return res.status(400).json({ error: 'Select at least CapEx or OpEx/S-Operation to copy' });
      }

      // Check existing items in target year
      let existingQuery = 'SELECT ';
      const queryParts: string[] = [];
      const queryParams: any[] = [];
      if (copyCapex) {
        queryParts.push('(SELECT COUNT(*) FROM it_capex_plan WHERE fiscal_year = ?' + (campusFilter ? ' AND site = ?' : '') + ')');
        queryParams.push(toYear);
        if (campusFilter) queryParams.push(campusFilter);
      }
      if (copyOpex) {
        queryParts.push('(SELECT COUNT(*) FROM it_opex_plan WHERE fiscal_year = ?' + (campusFilter ? ' AND site = ?' : '') + ')');
        queryParams.push(toYear);
        if (campusFilter) queryParams.push(campusFilter);
      }
      existingQuery += queryParts.join(' + ') + ' AS c';

      const [existing]: any = await db.query(existingQuery, queryParams);
      const existingCount = existing && existing[0] ? existing[0].c : 0;
      if (existingCount > 0 && !req.body.overwrite) {
        return res.status(400).json({ 
          error: `Fiscal Year ${toYear} already has ${existingCount} existing records. Enable overwrite to replace.` 
        });
      }

      // If overwrite, delete target records based on selected components
      if (req.body.overwrite) {
        if (copyCapex) {
          if (campusFilter) {
            await db.query('DELETE FROM it_capex_plan WHERE fiscal_year = ? AND site = ?', [toYear, campusFilter]);
          } else {
            await db.query('DELETE FROM it_capex_plan WHERE fiscal_year = ?', [toYear]);
          }
        }
        if (copyOpex) {
          if (campusFilter) {
            await db.query('DELETE FROM it_opex_plan WHERE fiscal_year = ? AND site = ?', [toYear, campusFilter]);
          } else {
            await db.query('DELETE FROM it_opex_plan WHERE fiscal_year = ?', [toYear]);
          }
        }
      }

      let capexCount = 0;
      let opexCount = 0;

      // 1. Clone CapEx items
      if (copyCapex) {
        const capexSql = 'SELECT * FROM it_capex_plan WHERE fiscal_year = ?' + (campusFilter ? ' AND site = ?' : '');
        const capexParams = campusFilter ? [fromYear, campusFilter] : [fromYear];
        const [capexRows]: any = await db.query(capexSql, capexParams);

        for (const c of capexRows) {
          let monthly = c.monthly_spending;
          try { if (typeof monthly === 'string') monthly = JSON.parse(monthly); } catch {}
          if (!monthly) monthly = createEmptyMonthlySpending();

          // Reset actuals to 0 and scale planned spending if adjustment specified
          MONTH_KEYS.forEach(m => {
            if (monthly[m]) {
              const basePlanned = parseFloat(monthly[m].planned) || 0;
              monthly[m].planned = Math.round(basePlanned * multiplier * 100) / 100;
              monthly[m].actual = 0;
            } else {
              monthly[m] = { planned: 0, actual: 0 };
            }
          });
          const rollups = computeQuarterlyFromMonthly(monthly);

          const scaledUnitPrice = Math.round((parseFloat(c.unit_price) || 0) * multiplier * 100) / 100;
          const scaledRequestedAmount = Math.round((parseFloat(c.requested_amount) || 0) * multiplier * 100) / 100;

          await db.query(`INSERT INTO it_capex_plan 
            (id, fiscal_year, item_no, description, specifications, asset_type, asset_owner, asset_supervisor, site, pic, cost_center, project_owner, department, qty, capex_code, unit_price, requested_amount, start_date, complete_date, expected_start_month, expected_complete_month, status, stage_tag, justification, monthly_spending, quarterly_spending)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              crypto.randomUUID(), toYear, c.item_no, c.description, c.specifications || '', c.asset_type,
              c.asset_owner || 'IT', c.asset_supervisor || 'ITO', c.site, c.pic,
              c.cost_center, c.project_owner, normalizeDepartmentCode(c.department), c.qty, c.capex_code || `Capex#${toYear}-${c.item_no}`,
              scaledUnitPrice, scaledRequestedAmount, null, null,
              c.expected_start_month || 'Jan', c.expected_complete_month || 'Dec',
              'In Progress', 'Planning', c.justification || '',
              JSON.stringify(monthly), JSON.stringify(rollups)
            ]
          );
          capexCount++;
        }
      }

      // 2. Clone OpEx & S-Operation items
      if (copyOpex) {
        const opexSql = 'SELECT * FROM it_opex_plan WHERE fiscal_year = ?' + (campusFilter ? ' AND site = ?' : '');
        const opexParams = campusFilter ? [fromYear, campusFilter] : [fromYear];
        const [opexRows]: any = await db.query(opexSql, opexParams);

        for (const o of opexRows) {
          let monthly = o.monthly_spending;
          try { if (typeof monthly === 'string') monthly = JSON.parse(monthly); } catch {}
          if (!monthly) monthly = createEmptyMonthlySpending();

          // Reset actuals to 0 and scale planned spending
          MONTH_KEYS.forEach(m => {
            if (monthly[m]) {
              const basePlanned = parseFloat(monthly[m].planned) || 0;
              monthly[m].planned = Math.round(basePlanned * multiplier * 100) / 100;
              monthly[m].actual = 0;
            } else {
              monthly[m] = { planned: 0, actual: 0 };
            }
          });

          const scaledUnitPrice = Math.round((parseFloat(o.unit_price) || 0) * multiplier * 100) / 100;
          const scaledAnnualCost = Math.round((parseFloat(o.annual_cost) || 0) * multiplier * 100) / 100;

          await db.query(`INSERT INTO it_opex_plan 
            (id, fiscal_year, item_no, account_code, account_name, description, remark, justification, site, cost_center, pic, billing_cycle, renewal_date, qty, unit_price, annual_cost, monthly_spending)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              crypto.randomUUID(), toYear, o.item_no, o.account_code, o.account_name, o.description,
              o.remark || o.justification || '', o.justification || '', o.site, o.cost_center, o.pic, o.billing_cycle, null, o.qty, scaledUnitPrice,
              scaledAnnualCost, JSON.stringify(monthly)
            ]
          );
          opexCount++;
        }
      }

      res.json({
        success: true,
        from_year: fromYear,
        to_year: toYear,
        capex_cloned: capexCount,
        opex_cloned: opexCount,
        adjustment_percent: adjustmentPercent,
        message: `Successfully rolled over FY ${fromYear} plan into FY ${toYear} with ${capexCount} CapEx and ${opexCount} OpEx/S-Operation line items (actuals reset to $0.00)!`
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 6. RESET / RESTORE DEFAULTS ---
  app.post('/api/it-budget/restore-defaults', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const fiscalYear = parseInt(req.body.fiscal_year, 10) || 2027;
      await db.query('DELETE FROM it_capex_plan WHERE fiscal_year = ?', [fiscalYear]);
      await db.query('DELETE FROM it_opex_plan WHERE fiscal_year = ?', [fiscalYear]);
      await seedItBudgetDefaults(db, fiscalYear);
      res.json({ success: true, message: `Successfully restored ${fiscalYear} Khema IT CapEx & S-Operation template data!` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 7. BULK SYNC / IMPORT (2027 CAPEX + OPEX + GL ACTUALS) ---
  app.post('/api/it-budget/bulk-sync', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { capexItems, opexItems, glActuals, replaceExisting, fiscal_year } = req.body;
      const fy = parseInt(fiscal_year, 10) || 2027;

      if (replaceExisting) {
        if (Array.isArray(capexItems) && capexItems.length > 0) {
          await db.query('DELETE FROM it_capex_plan WHERE fiscal_year = ?', [fy]);
        }
        if (Array.isArray(opexItems) && opexItems.length > 0) {
          await db.query('DELETE FROM it_opex_plan WHERE fiscal_year = ?', [fy]);
        }
        if (Array.isArray(glActuals) && glActuals.length > 0) {
          await db.query('DELETE FROM it_gl_actuals WHERE fiscal_year = ?', [fy]);
        }
      }

      let importedCapex = 0;
      let importedOpex = 0;
      let importedGl = 0;

      if (Array.isArray(capexItems)) {
        for (const c of capexItems) {
          if (!c.description?.trim()) continue;
          const id = c.id || crypto.randomUUID();
          const itemFy = parseInt(c.fiscal_year, 10) || fy;
          const qty = parseFloat(c.qty) || 1;
          const unit_price = parseFloat(c.unit_price) || 0;
          const requested_amount = Math.round((parseFloat(c.requested_amount) || (qty * unit_price)) * 100) / 100;
          const spending = c.monthly_spending || createEmptyMonthlySpending();
          const quarterly = computeQuarterlyFromMonthly(spending);
          const normBu = normalizeBuCanonical(c.site || c.bu) || 'K1';
          const normDept = normalizeDepartmentCode(c.department || 'IT');
          const meta = findAssetTypeMeta(c.asset_type);
          const normStatus = normalizeCapexStatus(c.status);
          const normStage = normalizeCapexStage(c.stage_tag, c.status);
          const expStart = deriveExpectedMonth(c.expected_start_month || c.start_date, 'Jan');
          const expComplete = deriveExpectedMonth(c.expected_complete_month || c.complete_date, expStart);

          await db.query(`INSERT INTO it_capex_plan 
            (id, fiscal_year, item_no, description, specifications, asset_type, asset_owner, asset_supervisor, site, pic, cost_center, project_owner, department, qty, capex_code, unit_price, requested_amount, start_date, complete_date, expected_start_month, expected_complete_month, status, stage_tag, justification, monthly_spending, quarterly_spending)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE description = VALUES(description), specifications = VALUES(specifications),
              asset_type = VALUES(asset_type), asset_owner = VALUES(asset_owner), asset_supervisor = VALUES(asset_supervisor),
              site = VALUES(site), department = VALUES(department), cost_center = VALUES(cost_center), pic = VALUES(pic),
              qty = VALUES(qty), unit_price = VALUES(unit_price), requested_amount = VALUES(requested_amount),
              expected_start_month = VALUES(expected_start_month), expected_complete_month = VALUES(expected_complete_month),
              status = VALUES(status), stage_tag = VALUES(stage_tag),
              monthly_spending = VALUES(monthly_spending), quarterly_spending = VALUES(quarterly_spending)`,
            [
              id, itemFy, c.item_no || importedCapex + 1, c.description.trim(), c.specifications || '',
              c.asset_type || 'Computer', c.asset_owner || meta?.asset_owner || 'IT',
              c.asset_supervisor || meta?.asset_supervisor || 'ITO', normBu,
              c.pic || 'Braseth', c.cost_center || 'IT', c.project_owner || c.pic || 'Braseth', normDept,
              qty, c.capex_code || `${normBu === 'Sakal Lab' ? 'SKPH' : normBu}000${importedCapex + 1}`,
              unit_price, requested_amount, c.start_date || null, c.complete_date || null,
              expStart, expComplete, normStatus, normStage, c.justification || '',
              JSON.stringify(spending), JSON.stringify(quarterly)
            ]
          );
          importedCapex++;
        }
      }

      if (Array.isArray(opexItems)) {
        for (const o of opexItems) {
          if (!o.description?.trim()) continue;
          const id = o.id || crypto.randomUUID();
          const itemFy = parseInt(o.fiscal_year, 10) || fy;
          const qty = parseFloat(o.qty) || 1;
          const unit_price = parseFloat(o.unit_price) || 0;
          const cycle = o.billing_cycle || 'Annual';
          const spending = o.monthly_spending || applySmartSpread(cycle, o.renewal_date, unit_price, qty);
          const annual_cost = Math.round((parseFloat(o.annual_cost) || MONTH_KEYS.reduce((acc, m) => acc + (Number(spending[m]?.planned) || 0), 0)) * 100) / 100;
          const coa = resolveCoaPair(o.account_code, o.account_name);
          const normBu = normalizeBuCanonical(o.site || o.bu) === 'K3' ? 'Sakal' : (normalizeBuCanonical(o.site || o.bu) || 'K1');
          const finalRemark = (o.remark || o.justification || '').trim();

          await db.query(`INSERT INTO it_opex_plan 
            (id, fiscal_year, item_no, account_code, account_name, description, remark, justification, site, cost_center, pic, billing_cycle, renewal_date, qty, unit_price, annual_cost, monthly_spending)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE description = VALUES(description), remark = VALUES(remark),
              account_code = VALUES(account_code), account_name = VALUES(account_name),
              site = VALUES(site), cost_center = VALUES(cost_center), pic = VALUES(pic),
              billing_cycle = VALUES(billing_cycle), renewal_date = VALUES(renewal_date),
              qty = VALUES(qty), unit_price = VALUES(unit_price),
              annual_cost = VALUES(annual_cost), monthly_spending = VALUES(monthly_spending)`,
            [
              id, itemFy, o.item_no || importedOpex + 1, coa.code, coa.name, o.description.trim(),
              finalRemark, finalRemark, normBu, o.cost_center || 'IT', o.pic || 'Braseth',
              cycle, o.renewal_date || null, qty, unit_price, annual_cost, JSON.stringify(spending)
            ]
          );
          importedOpex++;
        }
      }

      if (Array.isArray(glActuals)) {
        for (const g of glActuals) {
          const amt = parseFloat(g.amount);
          if (!g.description?.trim() && isNaN(amt)) continue;
          const id = g.id || crypto.randomUUID();
          const itemFy = parseInt(g.fiscal_year, 10) || fy;
          const coa = resolveCoaPair(g.gl_account_no, g.gl_account_name);
          const normBu = normalizeBuCanonical(g.bu_code) || 'K1';
          const postingDate = g.posting_date ? String(g.posting_date).slice(0, 10) : `${itemFy}-01-01`;

          await db.query(
            `INSERT INTO it_gl_actuals
             (id, fiscal_year, posting_date, external_document_no, document_no, gl_account_no, gl_account_name, item_value_desc, description, amount, bu_code, source)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id, itemFy, postingDate, g.external_document_no || '', g.document_no || '',
              coa.code, coa.name, g.item_value_desc || '', (g.description || g.item_value_desc || coa.name).trim(),
              isNaN(amt) ? 0 : amt, normBu, g.source || 'COA Details'
            ]
          );
          importedGl++;
        }
      }

      res.json({
        success: true,
        importedCapex,
        importedOpex,
        importedGl,
        message: `Successfully synchronized ${importedCapex} CapEx, ${importedOpex} OpEx, and ${importedGl} GL Actual lines for FY ${fy}!`
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 8. MASTER REFERENCE TABLES & UNIT PRICE CATALOG ---
  app.get('/api/it-budget/master-data', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const [unitPrices]: any = await db.query(
        'SELECT * FROM it_unit_price_catalog ORDER BY asset_category ASC, posting_date DESC'
      ).catch(() => [HISTORICAL_UNIT_PRICE_CATALOG]);
      const [accountCodes]: any = await db.query(
        'SELECT * FROM it_account_codes ORDER BY sort_order ASC, code ASC'
      ).catch(() => [[]]);

      res.json({
        businessUnits: BU_MASTER_LIST,
        departments: DEPT_DEFINITIONS,
        assetTypes: ASSET_TYPES_MASTER,
        businessLines: BUSINESS_LINES_MASTER,
        coaSummary: COA_SUMMARY_2027,
        accountCodes,
        unitPriceCatalog: unitPrices
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/it-budget/unit-price-catalog', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { asset_category, capex_code, item_name, vendor, brand_model, posting_date, qty, unit_price, remark } = req.body;
      if (!item_name?.trim()) return res.status(400).json({ error: 'Item Name is required' });
      const id = crypto.randomUUID();
      const nQty = parseFloat(qty) || 1;
      const nPrice = parseFloat(unit_price) || 0;
      const total_amount = Math.round(nQty * nPrice * 100) / 100;
      await db.query(
        `INSERT INTO it_unit_price_catalog (id, asset_category, capex_code, item_name, vendor, brand_model, posting_date, qty, unit_price, total_amount, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, asset_category || 'Computer', capex_code || '', item_name.trim(), vendor || '', brand_model || '', posting_date || null, nQty, nPrice, total_amount, remark || '']
      );
      const [created]: any = await db.query('SELECT * FROM it_unit_price_catalog WHERE id = ?', [id]);
      res.status(201).json(created[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/it-budget/unit-price-catalog/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      await db.query('DELETE FROM it_unit_price_catalog WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 9. GL ACTUALS LEDGER (COA DETAILS) & PLAN VS ACTUAL ---
  app.get('/api/it-budget/gl-actuals', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { fiscal_year, site, gl_account_no, month, search } = req.query as any;
      const fy = parseInt(fiscal_year, 10) || 2027;

      let sql = 'SELECT * FROM it_gl_actuals WHERE fiscal_year = ?';
      const params: any[] = [fy];

      sql += buildBuFilterSql('bu_code', site, params);

      if (gl_account_no && gl_account_no !== 'All Accounts') {
        const six = extractGlCodeNumber(gl_account_no);
        sql += ' AND (gl_account_no = ? OR gl_account_no LIKE ?)';
        params.push(gl_account_no, `${six}%`);
      }
      if (month && month !== 'All') {
        const idx = monthLabelToIndex(month);
        if (idx >= 0) {
          sql += ' AND MONTH(posting_date) = ?';
          params.push(idx + 1);
        }
      }
      if (search && search.trim()) {
        const q = `%${search.trim()}%`;
        sql += ' AND (description LIKE ? OR item_value_desc LIKE ? OR external_document_no LIKE ? OR document_no LIKE ? OR gl_account_name LIKE ?)';
        params.push(q, q, q, q, q);
      }

      sql += ' ORDER BY posting_date DESC, created_at DESC';
      const [rows]: any = await db.query(sql, params);

      const normalized = rows.map((r: any) => ({
        ...r,
        bu_canonical: normalizeBuCanonical(r.bu_code) || r.bu_code,
        posting_date: r.posting_date ? new Date(r.posting_date).toISOString().slice(0, 10) : ''
      }));
      res.json(normalized);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/it-budget/gl-actuals', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const {
        fiscal_year, posting_date, external_document_no, document_no,
        gl_account_no, gl_account_name, item_value_desc, description, amount, bu_code
      } = req.body;

      if (!description?.trim() && !item_value_desc?.trim()) {
        return res.status(400).json({ error: 'Description is required' });
      }
      const fy = parseInt(fiscal_year, 10) || 2027;
      const coa = resolveCoaPair(gl_account_no, gl_account_name);
      const normBu = normalizeBuCanonical(bu_code) || 'K1';
      const id = crypto.randomUUID();
      const pDate = posting_date ? String(posting_date).slice(0, 10) : `${fy}-01-01`;

      await db.query(
        `INSERT INTO it_gl_actuals
         (id, fiscal_year, posting_date, external_document_no, document_no, gl_account_no, gl_account_name, item_value_desc, description, amount, bu_code, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Manual GL')`,
        [
          id, fy, pDate, external_document_no || '', document_no || '',
          coa.code, coa.name, item_value_desc || '', (description || item_value_desc || '').trim(),
          parseFloat(amount) || 0, normBu
        ]
      );
      const [created]: any = await db.query('SELECT * FROM it_gl_actuals WHERE id = ?', [id]);
      res.status(201).json(created[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/it-budget/gl-actuals/bulk', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { fiscal_year, entries, replaceExisting } = req.body;
      const fy = parseInt(fiscal_year, 10) || 2027;
      if (!Array.isArray(entries)) {
        return res.status(400).json({ error: 'entries array is required' });
      }
      if (replaceExisting) {
        await db.query('DELETE FROM it_gl_actuals WHERE fiscal_year = ?', [fy]);
      }
      let inserted = 0;
      for (const g of entries) {
        const amt = parseFloat(g.amount);
        if (!g.description?.trim() && !g.item_value_desc?.trim() && isNaN(amt)) continue;
        const coa = resolveCoaPair(g.gl_account_no, g.gl_account_name);
        const normBu = normalizeBuCanonical(g.bu_code) || 'K1';
        const pDate = g.posting_date ? String(g.posting_date).slice(0, 10) : `${fy}-01-01`;
        await db.query(
          `INSERT INTO it_gl_actuals
           (id, fiscal_year, posting_date, external_document_no, document_no, gl_account_no, gl_account_name, item_value_desc, description, amount, bu_code, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COA Details')`,
          [
            crypto.randomUUID(), fy, pDate, g.external_document_no || '', g.document_no || '',
            coa.code, coa.name, g.item_value_desc || '', (g.description || g.item_value_desc || coa.name).trim(),
            isNaN(amt) ? 0 : amt, normBu
          ]
        );
        inserted++;
      }
      res.json({ success: true, inserted, message: `Imported ${inserted} GL Actuals lines into FY ${fy} COA Details.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/it-budget/gl-actuals/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      await db.query('DELETE FROM it_gl_actuals WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/it-budget/gl-actuals/sync-to-opex', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const fy = parseInt(req.body.fiscal_year, 10) || 2027;
      const [glRows]: any = await db.query('SELECT * FROM it_gl_actuals WHERE fiscal_year = ?', [fy]);
      const [opexRows]: any = await db.query('SELECT * FROM it_opex_plan WHERE fiscal_year = ?', [fy]);

      // Group GL actuals by canonical BU + 6-digit GL account + monthKey
      const glBucket: Record<string, Record<string, number>> = {};
      glRows.forEach((g: any) => {
        const bu = normalizeBuCanonical(g.bu_code) || 'All Sites';
        const code = extractGlCodeNumber(g.gl_account_no);
        const dt = g.posting_date ? new Date(g.posting_date) : null;
        if (!dt || isNaN(dt.getTime())) return;
        const mKey = MONTH_KEYS[dt.getMonth()];
        const key = `${bu}::${code}`;
        if (!glBucket[key]) glBucket[key] = {};
        glBucket[key][mKey] = (glBucket[key][mKey] || 0) + (parseFloat(g.amount) || 0);
      });

      // Distribute bucket sums onto first matching OPEX plan row per BU + Account
      const appliedKeys = new Set<string>();
      let updatedOpex = 0;

      for (const row of opexRows) {
        const bu = normalizeBuCanonical(row.site) || 'All Sites';
        const code = extractGlCodeNumber(row.account_code);
        const key = `${bu}::${code}`;
        const bucket = glBucket[key];
        if (!bucket || appliedKeys.has(key)) continue;

        let spending = row.monthly_spending;
        try { if (typeof spending === 'string') spending = JSON.parse(spending); } catch {}
        if (!spending) spending = createEmptyMonthlySpending();

        MONTH_KEYS.forEach(m => {
          if (bucket[m] !== undefined) {
            spending[m] = { ...(spending[m] || { planned: 0, actual: 0 }), actual: Math.round(bucket[m] * 100) / 100 };
          }
        });
        await db.query('UPDATE it_opex_plan SET monthly_spending = ? WHERE id = ?', [JSON.stringify(spending), row.id]);
        appliedKeys.add(key);
        updatedOpex++;
      }

      res.json({
        success: true,
        glEntries: glRows.length,
        updatedOpex,
        message: `Synced ${glRows.length} GL actual entries across ${updatedOpex} matching OPEX plan lines for FY ${fy}.`
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
