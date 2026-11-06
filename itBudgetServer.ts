import { Express, Request, Response } from 'express';
import crypto from 'crypto';

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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_opex_fy (fiscal_year),
      INDEX idx_opex_site (site)
    )`);

    // Ensure fiscal_year column exists if table was created previously without it
    try {
      const [capexCols]: any = await db.query('DESCRIBE it_capex_plan');
      const hasCapexFy = capexCols.some((c: any) => c.Field === 'fiscal_year');
      if (!hasCapexFy) {
        await db.query('ALTER TABLE it_capex_plan ADD COLUMN fiscal_year INT NOT NULL DEFAULT 2027 AFTER id');
        await db.query('ALTER TABLE it_capex_plan ADD INDEX idx_capex_fy (fiscal_year)');
        await db.query('UPDATE it_capex_plan SET fiscal_year = 2027 WHERE fiscal_year IS NULL OR fiscal_year = 0');
      }
    } catch (e: any) {
      console.warn('[IT Budget] Capex column check:', e.message);
    }

    try {
      const [opexCols]: any = await db.query('DESCRIBE it_opex_plan');
      const hasOpexFy = opexCols.some((c: any) => c.Field === 'fiscal_year');
      if (!hasOpexFy) {
        await db.query('ALTER TABLE it_opex_plan ADD COLUMN fiscal_year INT NOT NULL DEFAULT 2027 AFTER id');
        await db.query('ALTER TABLE it_opex_plan ADD INDEX idx_opex_fy (fiscal_year)');
        await db.query('UPDATE it_opex_plan SET fiscal_year = 2027 WHERE fiscal_year IS NULL OR fiscal_year = 0');
      }
    } catch (e: any) {
      console.warn('[IT Budget] Opex column check:', e.message);
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

    // Seed master account codes if table is empty
    try {
      const [codeCount]: any = await db.query('SELECT COUNT(*) as c FROM it_account_codes');
      if ((codeCount[0]?.c || 0) === 0) {
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
      }
    } catch (e: any) {
      console.warn('[IT Budget] Account codes seed warning:', e.message);
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

export function setupItBudgetRoutes(app: Express, authenticateToken: any, getDb: () => any) {
  // Ensure tables exist on boot
  const db = getDb();
  initItBudgetTables(db).catch(e => console.warn('[IT Budget Boot Init]:', e.message));

  // --- 1. EXECUTIVE SUMMARY & KPIS ---
  app.get('/api/it-budget/summary', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const site = req.query.site as string;
      const fiscalYear = parseInt(req.query.fiscal_year as string, 10) || 2026;

      let whereCapex = 'WHERE fiscal_year = ?';
      let whereOpex = 'WHERE fiscal_year = ?';
      const paramsCapex: any[] = [fiscalYear];
      const paramsOpex: any[] = [fiscalYear];

      if (site && site !== 'All Sites') {
        whereCapex += ' AND site = ?';
        paramsCapex.push(site);
        whereOpex += ' AND site = ?';
        paramsOpex.push(site);
      }

      const [capexRows]: any = await db.query(`SELECT * FROM it_capex_plan ${whereCapex}`, paramsCapex);
      const [opexRows]: any = await db.query(`SELECT * FROM it_opex_plan ${whereOpex}`, paramsOpex);

      // Available years list across tables
      const [yearRowsCapex]: any = await db.query('SELECT DISTINCT fiscal_year FROM it_capex_plan');
      const [yearRowsOpex]: any = await db.query('SELECT DISTINCT fiscal_year FROM it_opex_plan');
      const yearSet = new Set<number>([2026, 2027, 2028, 2029, 2030]);
      yearRowsCapex.forEach((r: any) => r.fiscal_year && yearSet.add(r.fiscal_year));
      yearRowsOpex.forEach((r: any) => r.fiscal_year && yearSet.add(r.fiscal_year));
      const availableYears = Array.from(yearSet).sort((a, b) => a - b);

      // Total CapEx Planned vs Actual
      let totalCapexRequested = 0;
      let totalCapexApproved = 0;
      let totalCapexInProgress = 0;
      let totalCapexCompleted = 0;
      let totalCapexActual = 0;

      const capexByAssetType: Record<string, { planned: number; actual: number }> = {};
      const capexBySite: Record<string, { planned: number; actual: number }> = { 
        K1: { planned: 0, actual: 0 }, 
        K2: { planned: 0, actual: 0 }, 
        KG: { planned: 0, actual: 0 }, 
        Sakal: { planned: 0, actual: 0 }, 
        'All Sites': { planned: 0, actual: 0 } 
      };

      // Monthly cash flow buckets (Jan - Dec)
      const monthlyCashFlow: Record<string, {
        planned_capex: number;
        actual_capex: number;
        planned_opex: number;
        actual_opex: number;
        planned_total: number;
        actual_total: number;
        variance: number;
        sites: Record<string, { planned: number; actual: number }>;
      }> = {};

      MONTH_KEYS.forEach(m => {
        monthlyCashFlow[m] = {
          planned_capex: 0,
          actual_capex: 0,
          planned_opex: 0,
          actual_opex: 0,
          planned_total: 0,
          actual_total: 0,
          variance: 0,
          sites: { 
            K1: { planned: 0, actual: 0 }, 
            K2: { planned: 0, actual: 0 }, 
            KG: { planned: 0, actual: 0 }, 
            Sakal: { planned: 0, actual: 0 }, 
            'All Sites': { planned: 0, actual: 0 } 
          }
        };
      });

      capexRows.forEach((row: any) => {
        const reqAmt = parseFloat(row.requested_amount) || 0;
        totalCapexRequested += reqAmt;
        if (row.status === 'Approved') totalCapexApproved += reqAmt;
        if (row.status === 'In Progress') totalCapexInProgress += reqAmt;
        if (row.status === 'Completed') totalCapexCompleted += reqAmt;

        const asset = row.asset_type || 'Other';
        if (!capexByAssetType[asset]) capexByAssetType[asset] = { planned: 0, actual: 0 };
        capexByAssetType[asset].planned += reqAmt;

        const rowSite = row.site || 'Other';
        if (!capexBySite[rowSite]) capexBySite[rowSite] = { planned: 0, actual: 0 };
        capexBySite[rowSite].planned += reqAmt;

        let spending: YearMonthlySpending;
        try {
          spending = typeof row.monthly_spending === 'string' ? JSON.parse(row.monthly_spending) : row.monthly_spending;
        } catch {
          spending = createEmptyMonthlySpending();
        }

        MONTH_KEYS.forEach(m => {
          const planAmt = spending?.[m]?.planned || 0;
          const actAmt = spending?.[m]?.actual || 0;
          totalCapexActual += actAmt;
          capexByAssetType[asset].actual += actAmt;
          capexBySite[rowSite].actual += actAmt;

          if (monthlyCashFlow[m]) {
            monthlyCashFlow[m].planned_capex += planAmt;
            monthlyCashFlow[m].actual_capex += actAmt;
            monthlyCashFlow[m].planned_total += planAmt;
            monthlyCashFlow[m].actual_total += actAmt;
            if (monthlyCashFlow[m].sites[rowSite]) {
              monthlyCashFlow[m].sites[rowSite].planned += planAmt;
              monthlyCashFlow[m].sites[rowSite].actual += actAmt;
            }
          }
        });
      });

      // OpEx aggregations
      let totalAnnualOpex = 0;
      let totalAnnualOpexActual = 0;
      const opexByAccount: Record<string, { planned: number; actual: number }> = {};
      const opexBySite: Record<string, { planned: number; actual: number }> = { 
        K1: { planned: 0, actual: 0 }, 
        K2: { planned: 0, actual: 0 }, 
        KG: { planned: 0, actual: 0 }, 
        Sakal: { planned: 0, actual: 0 }, 
        'All Sites': { planned: 0, actual: 0 } 
      };
      const upcomingRenewals: any[] = [];
      const now = new Date();

      opexRows.forEach((row: any) => {
        const annual = parseFloat(row.annual_cost) || 0;
        totalAnnualOpex += annual;

        const acct = row.account_code || 'Other';
        if (!opexByAccount[acct]) opexByAccount[acct] = { planned: 0, actual: 0 };
        opexByAccount[acct].planned += annual;

        const rowSite = row.site || 'Other';
        if (!opexBySite[rowSite]) opexBySite[rowSite] = { planned: 0, actual: 0 };
        opexBySite[rowSite].planned += annual;

        let spending: YearMonthlySpending;
        try {
          spending = typeof row.monthly_spending === 'string' ? JSON.parse(row.monthly_spending) : row.monthly_spending;
        } catch {
          spending = createEmptyMonthlySpending();
        }

        MONTH_KEYS.forEach(m => {
          const planAmt = spending?.[m]?.planned || 0;
          const actAmt = spending?.[m]?.actual || 0;
          totalAnnualOpexActual += actAmt;
          opexByAccount[acct].actual += actAmt;
          opexBySite[rowSite].actual += actAmt;

          if (monthlyCashFlow[m]) {
            monthlyCashFlow[m].planned_opex += planAmt;
            monthlyCashFlow[m].actual_opex += actAmt;
            monthlyCashFlow[m].planned_total += planAmt;
            monthlyCashFlow[m].actual_total += actAmt;
            if (monthlyCashFlow[m].sites[rowSite]) {
              monthlyCashFlow[m].sites[rowSite].planned += planAmt;
              monthlyCashFlow[m].sites[rowSite].actual += actAmt;
            }
          }
        });

        // Renewal alerts check
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

      // Calculate monthly variances
      MONTH_KEYS.forEach(m => {
        monthlyCashFlow[m].variance = monthlyCashFlow[m].planned_total - monthlyCashFlow[m].actual_total;
      });

      // Site total blend (CapEx + OpEx)
      const totalBySite: Record<string, { 
        planned: number; 
        actual: number; 
        variance: number;
        capex_planned: number; 
        capex_actual: number;
        opex_planned: number; 
        opex_actual: number;
      }> = {};

      ['K1', 'K2', 'KG', 'Sakal', 'All Sites'].forEach(s => {
        const cp = capexBySite[s]?.planned || 0;
        const ca = capexBySite[s]?.actual || 0;
        const op = opexBySite[s]?.planned || 0;
        const oa = opexBySite[s]?.actual || 0;
        const planned = cp + op;
        const actual = ca + oa;
        totalBySite[s] = {
          planned,
          actual,
          variance: planned - actual,
          capex_planned: cp,
          capex_actual: ca,
          opex_planned: op,
          opex_actual: oa
        };
      });

      const totalFiscalBudget = totalCapexRequested + totalAnnualOpex;
      const totalFiscalActual = totalCapexActual + totalAnnualOpexActual;
      const totalFiscalVariance = totalFiscalBudget - totalFiscalActual;

      // Transform monthly cash flow into chart-ready array
      const cashFlowChartData = MONTH_KEYS.map(m => ({
        month: m.toUpperCase(),
        planned_capex: Math.round(monthlyCashFlow[m].planned_capex),
        actual_capex: Math.round(monthlyCashFlow[m].actual_capex),
        planned_opex: Math.round(monthlyCashFlow[m].planned_opex),
        actual_opex: Math.round(monthlyCashFlow[m].actual_opex),
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
        totalAnnualOpexVariance: totalAnnualOpex - totalAnnualOpexActual,
        capexCount: capexRows.length,
        opexCount: opexRows.length,
        upcomingRenewals: upcomingRenewals.sort((a, b) => a.daysRemaining - b.daysRemaining),
        capexByAssetType,
        opexByAccount,
        totalBySite,
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
      const { site, asset_type, status, search, fiscal_year } = req.query as any;
      const fy = parseInt(fiscal_year, 10) || 2027;

      let sql = 'SELECT * FROM it_capex_plan WHERE fiscal_year = ?';
      const params: any[] = [fy];

      if (site && site !== 'All Sites') {
        sql += ' AND site = ?';
        params.push(site);
      }
      if (asset_type && asset_type !== 'All Types') {
        sql += ' AND asset_type = ?';
        params.push(asset_type);
      }
      if (status && status !== 'All Statuses') {
        sql += ' AND status = ?';
        params.push(status);
      }
      if (search && search.trim()) {
        sql += ' AND (description LIKE ? OR capex_code LIKE ? OR justification LIKE ?)';
        params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
      }

      sql += ' ORDER BY item_no ASC, created_at DESC';
      const [rows] = await db.query(sql, params);

      // Parse JSON columns and enrich rollups
      const parsed = (rows as any[]).map(r => {
        let monthly = r.monthly_spending;
        try { if (typeof monthly === 'string') monthly = JSON.parse(monthly); } catch {}
        if (!monthly || typeof monthly !== 'object') monthly = createEmptyMonthlySpending();
        
        const rollups = computeQuarterlyFromMonthly(monthly);
        return { 
          ...r, 
          monthly_spending: monthly, 
          quarterly_spending: rollups 
        };
      });

      res.json(parsed);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/it-budget/capex', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const {
        fiscal_year, item_no, description, asset_type, site, pic, cost_center, project_owner,
        department, qty, capex_code, unit_price, start_date, complete_date,
        status, justification, monthly_spending
      } = req.body;

      if (!description?.trim()) {
        return res.status(400).json({ error: 'Description is required' });
      }

      const fy = parseInt(fiscal_year, 10) || 2027;
      const id = crypto.randomUUID();
      const numQty = parseInt(qty, 10) || 1;
      const numPrice = parseFloat(unit_price) || 0;
      const requested_amount = numQty * numPrice;

      // Handle monthly phasing
      let spending = monthly_spending;
      if (!spending || typeof spending !== 'object') {
        spending = createEmptyMonthlySpending();
        if (start_date) {
          const d = new Date(start_date);
          if (!isNaN(d.getTime())) {
            const m = MONTH_KEYS[d.getMonth()] || 'jan';
            spending[m] = { planned: requested_amount, actual: 0 };
          }
        }
      }
      const quarterly = computeQuarterlyFromMonthly(spending);

      await db.query(`INSERT INTO it_capex_plan 
        (id, fiscal_year, item_no, description, asset_type, site, pic, cost_center, project_owner, department, qty, capex_code, unit_price, requested_amount, start_date, complete_date, status, justification, monthly_spending, quarterly_spending)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, fy, item_no || 1, description.trim(), asset_type || 'Hardware', site || 'K1', pic || 'Braseth',
          cost_center || 'IT', project_owner || 'Braseth', department || 'IT Department', numQty,
          capex_code || `Capex#${fy}-${String(Math.floor(Math.random() * 900) + 100)}`,
          numPrice, requested_amount, start_date || null, complete_date || null, status || 'Planned',
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
        fiscal_year, item_no, description, asset_type, site, pic, cost_center, project_owner,
        department, qty, capex_code, unit_price, start_date, complete_date,
        status, justification, monthly_spending
      } = req.body;

      const numQty = parseInt(qty, 10) || 1;
      const numPrice = parseFloat(unit_price) || 0;
      const requested_amount = numQty * numPrice;

      let spending = monthly_spending;
      if (!spending || typeof spending !== 'object') {
        spending = createEmptyMonthlySpending();
      }
      const quarterly = computeQuarterlyFromMonthly(spending);

      await db.query(`UPDATE it_capex_plan SET
        fiscal_year = COALESCE(?, fiscal_year), item_no = ?, description = ?, asset_type = ?, site = ?, pic = ?,
        cost_center = ?, project_owner = ?, department = ?, qty = ?, capex_code = ?,
        unit_price = ?, requested_amount = ?, start_date = ?, complete_date = ?,
        status = ?, justification = ?, monthly_spending = ?, quarterly_spending = ?
        WHERE id = ?`,
        [
          fiscal_year ? parseInt(fiscal_year, 10) : null,
          item_no || 1, description, asset_type, site, pic,
          cost_center, project_owner, department, numQty, capex_code,
          numPrice, requested_amount, start_date || null, complete_date || null,
          status, justification || '', JSON.stringify(spending), JSON.stringify(quarterly), id
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
      const { site, account_code, search, fiscal_year } = req.query as any;
      const fy = parseInt(fiscal_year, 10) || 2027;

      let sql = 'SELECT * FROM it_opex_plan WHERE fiscal_year = ?';
      const params: any[] = [fy];

      if (site && site !== 'All Sites') {
        sql += ' AND site = ?';
        params.push(site);
      }
      if (account_code && account_code !== 'All Accounts') {
        sql += ' AND account_code = ?';
        params.push(account_code);
      }
      if (search && search.trim()) {
        sql += ' AND (description LIKE ? OR justification LIKE ? OR account_name LIKE ?)';
        params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
      }

      sql += ' ORDER BY item_no ASC, created_at DESC';
      const [rows] = await db.query(sql, params);

      const parsed = (rows as any[]).map(r => {
        let monthly = r.monthly_spending;
        try { if (typeof monthly === 'string') monthly = JSON.parse(monthly); } catch {}
        if (!monthly || typeof monthly !== 'object') monthly = createEmptyMonthlySpending();
        const rollups = computeQuarterlyFromMonthly(monthly);
        return { 
          ...r, 
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
        fiscal_year, item_no, account_code, account_name, description, justification,
        site, cost_center, pic, billing_cycle, renewal_date, qty, unit_price,
        monthly_spending, autoSmartSpread
      } = req.body;

      if (!description?.trim()) {
        return res.status(400).json({ error: 'Description is required' });
      }

      const fy = parseInt(fiscal_year, 10) || 2027;
      const id = crypto.randomUUID();
      const numQty = parseInt(qty, 10) || 1;
      const numPrice = parseFloat(unit_price) || 0;
      const cycle = billing_cycle || 'Annual';

      let spending = monthly_spending;
      if (autoSmartSpread || !spending) {
        spending = applySmartSpread(cycle, renewal_date, numPrice, numQty);
      }

      let annual_cost = 0;
      if (spending && typeof spending === 'object') {
        annual_cost = MONTH_KEYS.reduce((acc, m) => acc + (spending[m]?.planned || 0), 0);
      } else {
        annual_cost = cycle === 'Monthly' ? numPrice * 12 : numPrice * numQty;
      }

      await db.query(`INSERT INTO it_opex_plan 
        (id, fiscal_year, item_no, account_code, account_name, description, justification, site, cost_center, pic, billing_cycle, renewal_date, qty, unit_price, annual_cost, monthly_spending)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, fy, item_no || 1, account_code || '630104 - Other Outside Services',
          account_name || 'Other Outside Services', description.trim(), justification || '',
          site || 'K1', cost_center || 'IT', pic || 'Braseth', cycle, renewal_date || null,
          numQty, numPrice, annual_cost, JSON.stringify(spending)
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
        fiscal_year, item_no, account_code, account_name, description, justification,
        site, cost_center, pic, billing_cycle, renewal_date, qty, unit_price,
        monthly_spending, autoSmartSpread
      } = req.body;

      const numQty = parseInt(qty, 10) || 1;
      const numPrice = parseFloat(unit_price) || 0;
      const cycle = billing_cycle || 'Annual';

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
        annual_cost = MONTH_KEYS.reduce((acc, m) => acc + (spending[m]?.planned || 0), 0);
      } else {
        annual_cost = cycle === 'Monthly' ? numPrice * 12 : numPrice * numQty;
      }

      await db.query(`UPDATE it_opex_plan SET
        fiscal_year = COALESCE(?, fiscal_year), item_no = ?, account_code = ?, account_name = ?,
        description = ?, justification = ?, site = ?, cost_center = ?, pic = ?,
        billing_cycle = ?, renewal_date = ?, qty = ?, unit_price = ?,
        annual_cost = ?, monthly_spending = ?
        WHERE id = ?`,
        [
          fiscal_year ? parseInt(fiscal_year, 10) : null,
          item_no || 1, account_code, account_name, description, justification || '',
          site, cost_center, pic, cycle, renewal_date || null, numQty, numPrice,
          annual_cost, JSON.stringify(spending), id
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
      const fromYear = parseInt(req.body.from_year, 10) || 2027;
      const toYear = parseInt(req.body.to_year, 10);

      if (!toYear || toYear < 2020 || toYear > 2050) {
        return res.status(400).json({ error: 'Valid destination fiscal year is required' });
      }

      // Check if items already exist for target year
      const [existing]: any = await db.query(
        'SELECT (SELECT COUNT(*) FROM it_capex_plan WHERE fiscal_year = ?) + (SELECT COUNT(*) FROM it_opex_plan WHERE fiscal_year = ?) as c',
        [toYear, toYear]
      );
      if (existing[0].c > 0 && !req.body.overwrite) {
        return res.status(400).json({ 
          error: `Fiscal Year ${toYear} already has ${existing[0].c} records. Confirm overwrite to replace.` 
        });
      }

      if (req.body.overwrite) {
        await db.query('DELETE FROM it_capex_plan WHERE fiscal_year = ?', [toYear]);
        await db.query('DELETE FROM it_opex_plan WHERE fiscal_year = ?', [toYear]);
      }

      // Clone CapEx items
      const [capexRows]: any = await db.query('SELECT * FROM it_capex_plan WHERE fiscal_year = ?', [fromYear]);
      for (const c of capexRows) {
        let monthly = c.monthly_spending;
        try { if (typeof monthly === 'string') monthly = JSON.parse(monthly); } catch {}
        if (!monthly) monthly = createEmptyMonthlySpending();
        // Reset actuals to 0 in cloned plan
        MONTH_KEYS.forEach(m => {
          if (monthly[m]) monthly[m].actual = 0;
        });
        const rollups = computeQuarterlyFromMonthly(monthly);

        await db.query(`INSERT INTO it_capex_plan 
          (id, fiscal_year, item_no, description, asset_type, site, pic, cost_center, project_owner, department, qty, capex_code, unit_price, requested_amount, start_date, complete_date, status, justification, monthly_spending, quarterly_spending)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(), toYear, c.item_no, c.description, c.asset_type, c.site, c.pic,
            c.cost_center, c.project_owner, c.department, c.qty, `Capex#${toYear}-${c.item_no}`,
            c.unit_price, c.requested_amount, null, null, 'Planned', c.justification,
            JSON.stringify(monthly), JSON.stringify(rollups)
          ]
        );
      }

      // Clone OpEx items
      const [opexRows]: any = await db.query('SELECT * FROM it_opex_plan WHERE fiscal_year = ?', [fromYear]);
      for (const o of opexRows) {
        let monthly = o.monthly_spending;
        try { if (typeof monthly === 'string') monthly = JSON.parse(monthly); } catch {}
        if (!monthly) monthly = createEmptyMonthlySpending();
        // Reset actuals to 0
        MONTH_KEYS.forEach(m => {
          if (monthly[m]) monthly[m].actual = 0;
        });

        await db.query(`INSERT INTO it_opex_plan 
          (id, fiscal_year, item_no, account_code, account_name, description, justification, site, cost_center, pic, billing_cycle, renewal_date, qty, unit_price, annual_cost, monthly_spending)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(), toYear, o.item_no, o.account_code, o.account_name, o.description,
            o.justification, o.site, o.cost_center, o.pic, o.billing_cycle, null, o.qty, o.unit_price,
            o.annual_cost, JSON.stringify(monthly)
          ]
        );
      }

      res.json({
        success: true,
        message: `Successfully cloned plan from FY ${fromYear} into FY ${toYear} with ${capexRows.length} CapEx and ${opexRows.length} OpEx items!`
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

  // --- 7. BULK SYNC / IMPORT ---
  app.post('/api/it-budget/bulk-sync', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { capexItems, opexItems, replaceExisting, fiscal_year } = req.body;
      const fy = parseInt(fiscal_year, 10) || 2027;

      if (replaceExisting) {
        if (Array.isArray(capexItems) && capexItems.length > 0) {
          await db.query('DELETE FROM it_capex_plan WHERE fiscal_year = ?', [fy]);
        }
        if (Array.isArray(opexItems) && opexItems.length > 0) {
          await db.query('DELETE FROM it_opex_plan WHERE fiscal_year = ?', [fy]);
        }
      }

      let importedCapex = 0;
      let importedOpex = 0;

      if (Array.isArray(capexItems)) {
        for (const c of capexItems) {
          if (!c.description?.trim()) continue;
          const id = c.id || crypto.randomUUID();
          const itemFy = parseInt(c.fiscal_year, 10) || fy;
          const qty = parseInt(c.qty, 10) || 1;
          const unit_price = parseFloat(c.unit_price) || 0;
          const requested_amount = parseFloat(c.requested_amount) || (qty * unit_price);
          const spending = c.monthly_spending || createEmptyMonthlySpending();
          const quarterly = computeQuarterlyFromMonthly(spending);

          await db.query(`INSERT INTO it_capex_plan 
            (id, fiscal_year, item_no, description, asset_type, site, pic, cost_center, project_owner, department, qty, capex_code, unit_price, requested_amount, start_date, complete_date, status, justification, monthly_spending, quarterly_spending)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE description = VALUES(description), asset_type = VALUES(asset_type), site = VALUES(site),
              qty = VALUES(qty), unit_price = VALUES(unit_price), requested_amount = VALUES(requested_amount),
              monthly_spending = VALUES(monthly_spending), quarterly_spending = VALUES(quarterly_spending)`,
            [
              id, itemFy, c.item_no || 1, c.description.trim(), c.asset_type || 'Hardware', c.site || 'K1',
              c.pic || 'Braseth', c.cost_center || 'IT', c.project_owner || 'Braseth', c.department || 'IT Department',
              qty, c.capex_code || `Capex#${itemFy}`, unit_price, requested_amount, c.start_date || null,
              c.complete_date || null, c.status || 'Planned', c.justification || '',
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
          const qty = parseInt(o.qty, 10) || 1;
          const unit_price = parseFloat(o.unit_price) || 0;
          const cycle = o.billing_cycle || 'Annual';
          const spending = o.monthly_spending || applySmartSpread(cycle, o.renewal_date, unit_price, qty);
          const annual_cost = parseFloat(o.annual_cost) || MONTH_KEYS.reduce((acc, m) => acc + (spending[m]?.planned || 0), 0);

          await db.query(`INSERT INTO it_opex_plan 
            (id, fiscal_year, item_no, account_code, account_name, description, justification, site, cost_center, pic, billing_cycle, renewal_date, qty, unit_price, annual_cost, monthly_spending)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE description = VALUES(description), account_code = VALUES(account_code),
              account_name = VALUES(account_name), site = VALUES(site), billing_cycle = VALUES(billing_cycle),
              renewal_date = VALUES(renewal_date), qty = VALUES(qty), unit_price = VALUES(unit_price),
              annual_cost = VALUES(annual_cost), monthly_spending = VALUES(monthly_spending)`,
            [
              id, itemFy, o.item_no || 1, o.account_code || '630104 - Other Outside Services',
              o.account_name || 'Other Outside Services', o.description.trim(), o.justification || '',
              o.site || 'K1', o.cost_center || 'IT', o.pic || 'Braseth', cycle, o.renewal_date || null,
              qty, unit_price, annual_cost, JSON.stringify(spending)
            ]
          );
          importedOpex++;
        }
      }

      res.json({
        success: true,
        importedCapex,
        importedOpex,
        message: `Successfully synchronized ${importedCapex} CapEx items and ${importedOpex} OpEx items for FY ${fy}!`
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
