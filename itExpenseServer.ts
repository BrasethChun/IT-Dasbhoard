import { Express, Request, Response } from 'express';
import crypto from 'crypto';
import { MONTH_KEYS, YearMonthlySpending, createEmptyMonthlySpending, computeQuarterlyFromMonthly } from './itBudgetServer';

export interface ITExpenseTransaction {
  id: string;
  fiscal_year: number;
  expense_date: string;
  invoice_no: string;
  po_no: string;
  vendor_name: string;
  description: string;
  budget_type: 'CapEx' | 'OpEx';
  linked_budget_id: string | null;
  linked_item_name: string | null;
  site_name: string;
  category: string;
  amount: number;
  payment_status: 'Paid' | 'Pending' | 'Processing' | 'Overdue';
  payment_method: string;
  payment_date: string | null;
  receipt_url: string | null;
  notes: string;
}

export async function initItExpenseTables(db: any) {
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS it_expense_transactions (
      id VARCHAR(36) PRIMARY KEY,
      fiscal_year INT NOT NULL DEFAULT 2027,
      expense_date DATE NOT NULL,
      invoice_no VARCHAR(100),
      po_no VARCHAR(100),
      vendor_name VARCHAR(150) NOT NULL,
      description VARCHAR(255) NOT NULL,
      budget_type ENUM('CapEx', 'OpEx') NOT NULL,
      linked_budget_id VARCHAR(36),
      linked_item_name VARCHAR(255),
      site_name VARCHAR(50) NOT NULL,
      category VARCHAR(100) NOT NULL,
      amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
      payment_status ENUM('Paid', 'Pending', 'Processing', 'Overdue') DEFAULT 'Paid',
      payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
      payment_date DATE,
      receipt_url VARCHAR(255),
      notes TEXT,
      budget_classification VARCHAR(50) DEFAULT 'Planned',
      unplanned_reason VARCHAR(255) DEFAULT '',
      approval_ref VARCHAR(100) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_exp_fy (fiscal_year),
      INDEX idx_exp_site (site_name),
      INDEX idx_exp_budget (budget_type, linked_budget_id),
      INDEX idx_exp_date (expense_date)
    )`);

    // Ensure columns exist on older tables
    try {
      const [expCols]: any = await db.query('DESCRIBE it_expense_transactions');
      if (!expCols.some((c: any) => c.Field === 'budget_classification')) {
        await db.query("ALTER TABLE it_expense_transactions ADD COLUMN budget_classification VARCHAR(50) DEFAULT 'Planned'");
      }
      if (!expCols.some((c: any) => c.Field === 'unplanned_reason')) {
        await db.query("ALTER TABLE it_expense_transactions ADD COLUMN unplanned_reason VARCHAR(255) DEFAULT ''");
      }
      if (!expCols.some((c: any) => c.Field === 'approval_ref')) {
        await db.query("ALTER TABLE it_expense_transactions ADD COLUMN approval_ref VARCHAR(100) DEFAULT ''");
      }
      if (!expCols.some((c: any) => c.Field === 'settlement_status')) {
        await db.query("ALTER TABLE it_expense_transactions ADD COLUMN settlement_status VARCHAR(50) DEFAULT 'Unsettled'");
      }
    } catch (e: any) {
      console.warn('[IT Expenses] Columns migration:', e.message);
    }

    // Persistent System Metadata Table to prevent auto-resetting deleted expenses on reboot/refresh
    await db.query(`CREATE TABLE IF NOT EXISTS it_system_metadata (
      meta_key VARCHAR(100) PRIMARY KEY,
      meta_value VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // General IT & Expense Categories Table
    await db.query(`CREATE TABLE IF NOT EXISTS it_expense_categories (
      id VARCHAR(36) PRIMARY KEY,
      category_name VARCHAR(100) NOT NULL UNIQUE,
      code VARCHAR(50) NOT NULL,
      gl_account_code VARCHAR(50) DEFAULT '',
      budget_type ENUM('CapEx', 'OpEx', 'Both') DEFAULT 'OpEx',
      description TEXT,
      status ENUM('Active', 'Inactive') DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_cat_name (category_name),
      INDEX idx_cat_code (code)
    )`);

    // Ensure columns exist on older installations if needed
    try {
      const [catCols]: any = await db.query('DESCRIBE it_expense_categories');
      if (!catCols.some((c: any) => c.Field === 'gl_account_code')) {
        await db.query("ALTER TABLE it_expense_categories ADD COLUMN gl_account_code VARCHAR(50) DEFAULT ''");
      }
      if (!catCols.some((c: any) => c.Field === 'budget_type')) {
        await db.query("ALTER TABLE it_expense_categories ADD COLUMN budget_type ENUM('CapEx', 'OpEx', 'Both') DEFAULT 'OpEx'");
      }
    } catch (e: any) {
      console.warn('[IT Expense Categories Columns Migration]:', e.message);
    }

    // Seed default categories if table is empty
    const [catCount]: any = await db.query('SELECT COUNT(*) as c FROM it_expense_categories').catch(() => [[{ c: 0 }]]);
    if (!catCount[0]?.c) {
      const defaultCategories = [
        { name: 'Hardware & Printers', code: 'HW-PRN', gl: '6100-10', budget: 'CapEx', desc: 'Workplace printers, scanners, labelers, and local peripherals' },
        { name: 'Computers & Terminals', code: 'CMP-TRM', gl: '6100-20', budget: 'CapEx', desc: 'Desktop workstations, nursing station terminals, clinical PCs' },
        { name: 'Laptops & Mobile', code: 'LPT-MOB', gl: '6100-30', budget: 'CapEx', desc: 'Medical tablets, executive laptops, mobile diagnostic units' },
        { name: 'CCTV & Security', code: 'SEC-CCTV', gl: '6150-10', budget: 'CapEx', desc: 'Surveillance IP cameras, biometric access control, NVRs' },
        { name: 'Network & Infrastructure', code: 'NET-INF', gl: '6200-10', budget: 'Both', desc: 'Core switches, wireless APs, routers, server racks, UPS' },
        { name: 'Software Maintenance', code: 'SFT-MNT', gl: '6300-10', budget: 'OpEx', desc: 'HIS/EMR licensing, antivirus, firewall subscriptions, annual SLAs' },
        { name: 'Cloud Infrastructure', code: 'CLD-INF', gl: '6300-20', budget: 'OpEx', desc: 'AWS/GCP hosting, cloud backup, Microsoft 365, domain DNS' },
        { name: 'Equipment Rental', code: 'EQP-RNT', gl: '6400-10', budget: 'OpEx', desc: 'Photocopier leases, temporary UPS, fiber test rental' },
        { name: 'Telecommunications', code: 'TEL-DAT', gl: '6500-10', budget: 'OpEx', desc: 'Dedicated leased lines, branch MPLS, SIP trunk, ISP fiber' },
        { name: 'General IT Services', code: 'GEN-SVC', gl: '6600-10', budget: 'OpEx', desc: 'Outsourced engineering, cabling labor, emergency repairs' }
      ];

      for (const cat of defaultCategories) {
        await db.query(
          'INSERT IGNORE INTO it_expense_categories (id, category_name, code, gl_account_code, budget_type, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [crypto.randomUUID(), cat.name, cat.code, cat.gl, cat.budget, cat.desc, 'Active']
        );
      }
    }

    // Check if initial seeding was already completed in the past
    const [metaRows]: any = await db.query(
      "SELECT meta_value FROM it_system_metadata WHERE meta_key = 'it_expenses_seed_completed'"
    );

    const [totalExpenses]: any = await db.query('SELECT COUNT(*) as c FROM it_expense_transactions');
    const hasExistingData = (totalExpenses[0]?.c || 0) > 0;

    if (metaRows.length > 0 || hasExistingData) {
      // System was already initialized. Preserve user deletions - never auto-reset!
      if (metaRows.length === 0) {
        await db.query(
          "INSERT IGNORE INTO it_system_metadata (meta_key, meta_value) VALUES ('it_expenses_seed_completed', 'true')"
        );
      }
    } else {
      // First-time fresh install: seed initial expenses once
      await seedInitialExpenses(db, 2026);
      await seedInitialExpenses(db, 2027);
      await db.query(
        "INSERT INTO it_system_metadata (meta_key, meta_value) VALUES ('it_expenses_seed_completed', 'true')"
      );
    }

    // Auto-repair stale/orphan linked_budget_id references (e.g. if plan rows were re-seeded or regenerated)
    try {
      const [brokenLinks]: any = await db.query(`
        SELECT t.id, t.fiscal_year, t.budget_type, t.linked_budget_id, t.linked_item_name, t.description, t.site_name
        FROM it_expense_transactions t
        WHERE t.linked_budget_id IS NOT NULL
          AND (t.budget_classification != 'Unplanned' OR t.budget_classification IS NULL)
          AND (
            (t.budget_type = 'CapEx' AND NOT EXISTS (SELECT 1 FROM it_capex_plan c WHERE c.id = t.linked_budget_id))
            OR
            (t.budget_type = 'OpEx' AND NOT EXISTS (SELECT 1 FROM it_opex_plan o WHERE o.id = t.linked_budget_id))
          )
      `);

      for (const tx of brokenLinks) {
        const table = tx.budget_type === 'CapEx' ? 'it_capex_plan' : 'it_opex_plan';
        const [candidates]: any = await db.query(
          `SELECT id, description, site FROM ${table} WHERE fiscal_year = ?`,
          [tx.fiscal_year]
        );
        const searchName = (tx.linked_item_name || tx.description || '').toLowerCase().trim();
        let match = candidates.find((c: any) => (c.description || '').toLowerCase().trim() === searchName);
        if (!match && searchName) {
          match = candidates.find((c: any) => {
            const desc = (c.description || '').toLowerCase().trim();
            return desc.includes(searchName) || searchName.includes(desc);
          });
        }
        if (match) {
          await db.query(
            'UPDATE it_expense_transactions SET linked_budget_id = ?, linked_item_name = ? WHERE id = ?',
            [match.id, match.description, tx.id]
          );
          await syncExpensesToBudget(db, tx.budget_type, match.id, tx.fiscal_year);
          console.log(`[IT Expenses] Reconciled broken linked_budget_id for "${tx.description}" -> ${match.id} (${match.description})`);
        }
      }
    } catch (repairErr: any) {
      console.warn('[IT Expenses] Link repair warning:', repairErr.message);
    }

    // Sync distinct CapEx asset_types and OpEx account_codes into it_expense_categories
    await syncBudgetCategoriesIntoExpenseCategories(db);

    // One-time consolidation of existing expense transactions & cleanup of legacy 0-count categories
    try {
      const [consMeta]: any = await db.query(
        "SELECT meta_value FROM it_system_metadata WHERE meta_key = 'it_expense_categories_plan_consolidated_v1'"
      );
      if (consMeta.length === 0) {
        const [capRes]: any = await db.query(`
          UPDATE it_expense_transactions t
          JOIN it_capex_plan c ON t.linked_budget_id = c.id
          SET t.category = TRIM(c.asset_type)
          WHERE t.budget_type = 'CapEx' AND c.asset_type IS NOT NULL AND TRIM(c.asset_type) != ''
        `);
        const [opxRes]: any = await db.query(`
          UPDATE it_expense_transactions t
          JOIN it_opex_plan o ON t.linked_budget_id = o.id
          SET t.category = TRIM(o.account_code)
          WHERE t.budget_type = 'OpEx' AND o.account_code IS NOT NULL AND TRIM(o.account_code) != ''
        `);

        // Remove superseded 0-count legacy categories that are not CapEx asset_types or OpEx account_codes
        await db.query(`
          DELETE FROM it_expense_categories
          WHERE LOWER(category_name) NOT IN (
            SELECT DISTINCT LOWER(TRIM(asset_type)) FROM it_capex_plan WHERE asset_type IS NOT NULL AND TRIM(asset_type) != ''
          )
          AND LOWER(category_name) NOT IN (
            SELECT DISTINCT LOWER(TRIM(account_code)) FROM it_opex_plan WHERE account_code IS NOT NULL AND TRIM(account_code) != ''
          )
          AND NOT EXISTS (
            SELECT 1 FROM it_expense_transactions e WHERE LOWER(TRIM(e.category)) = LOWER(TRIM(it_expense_categories.category_name))
          )
        `);

        await db.query(
          "INSERT IGNORE INTO it_system_metadata (meta_key, meta_value) VALUES ('it_expense_categories_plan_consolidated_v1', 'true')"
        );
        console.log(`[IT Expenses] Consolidated expense categories with CapEx asset_type (${capRes?.affectedRows || 0} rows) and OpEx account_code (${opxRes?.affectedRows || 0} rows)`);
      }
    } catch (consErr: any) {
      console.warn('[IT Expenses] Category consolidation warning:', consErr.message);
    }
  } catch (err: any) {
    console.error('[IT Expense Tables Init Warning]:', err.message);
  }
}

async function syncBudgetCategoriesIntoExpenseCategories(db: any) {
  try {
    const [capexTypes]: any = await db.query(
      "SELECT DISTINCT TRIM(asset_type) AS asset_type FROM it_capex_plan WHERE asset_type IS NOT NULL AND TRIM(asset_type) != ''"
    );
    for (const row of capexTypes) {
      const name = row.asset_type;
      const [existing]: any = await db.query(
        'SELECT id FROM it_expense_categories WHERE LOWER(TRIM(category_name)) = LOWER(?)',
        [name]
      );
      if (existing.length === 0) {
        const cleanCode = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase() || 'CAPEX';
        await db.query(
          'INSERT IGNORE INTO it_expense_categories (id, category_name, code, gl_account_code, budget_type, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [crypto.randomUUID(), name, `CAP-${cleanCode}`, '', 'CapEx', `CapEx Asset Type: ${name}`, 'Active']
        );
      }
    }

    const [opexAccounts]: any = await db.query(
      "SELECT DISTINCT TRIM(account_code) AS account_code, MAX(TRIM(account_name)) AS account_name FROM it_opex_plan WHERE account_code IS NOT NULL AND TRIM(account_code) != '' GROUP BY TRIM(account_code)"
    );
    for (const row of opexAccounts) {
      const name = row.account_code;
      const glPrefix = (name.match(/^(\d+)/)?.[1] || name.split('-')[0] || '').trim();
      const [existing]: any = await db.query(
        'SELECT id FROM it_expense_categories WHERE LOWER(TRIM(category_name)) = LOWER(?)',
        [name]
      );
      if (existing.length === 0) {
        await db.query(
          'INSERT IGNORE INTO it_expense_categories (id, category_name, code, gl_account_code, budget_type, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [crypto.randomUUID(), name, glPrefix ? `OPX-${glPrefix}` : 'OPEX', glPrefix, 'OpEx', `OpEx Account: ${row.account_name || name}`, 'Active']
        );
      }
    }
  } catch (err: any) {
    console.warn('[IT Expense Categories Sync Warning]:', err.message);
  }
}

async function resolvePlanCategory(db: any, budgetType: 'CapEx' | 'OpEx', linkedBudgetId: string | null | undefined): Promise<string | null> {
  if (!linkedBudgetId) return null;
  try {
    if (budgetType === 'CapEx') {
      const [rows]: any = await db.query('SELECT asset_type FROM it_capex_plan WHERE id = ?', [linkedBudgetId]);
      return rows[0]?.asset_type?.trim() || null;
    } else {
      const [rows]: any = await db.query('SELECT account_code FROM it_opex_plan WHERE id = ?', [linkedBudgetId]);
      return rows[0]?.account_code?.trim() || null;
    }
  } catch {
    return null;
  }
}

// Seed initial realistic transactions linked to 2027 CapEx and OpEx items
async function seedInitialExpenses(db: any, fiscalYear: number = 2027) {
  try {
    // Find CapEx and OpEx items to link to
    const [capexRows]: any = await db.query('SELECT id, description, site, asset_type FROM it_capex_plan WHERE fiscal_year = ?', [fiscalYear]);
    const [opexRows]: any = await db.query('SELECT id, description, site, account_code FROM it_opex_plan WHERE fiscal_year = ?', [fiscalYear]);

    const printerItem = capexRows.find((c: any) => c.description.includes('Printer'));
    const dellItem = capexRows.find((c: any) => c.description.includes('Dell'));
    const laptopItem = capexRows.find((c: any) => c.description.includes('Laptop'));

    const ehospitalItem = opexRows.find((o: any) => o.description.includes('eHospital'));
    const vcloudiaItem = opexRows.find((o: any) => o.description.includes('Vcloudia'));
    const anzerItem = opexRows.find((o: any) => o.description.includes('Anzer'));
    const printerRentalItem = opexRows.find((o: any) => o.description.includes('MOS/BOS'));

    const sampleTransactions: any[] = [
      {
        fiscal_year: fiscalYear,
        expense_date: `${fiscalYear}-01-15`,
        invoice_no: `INV-${fiscalYear}-001`,
        po_no: `PO-${fiscalYear}-101`,
        vendor_name: 'MedTech Systems Asia',
        description: 'eHospital HIS Annual Maintenance & Support Renewal',
        budget_type: 'OpEx',
        linked_budget_id: ehospitalItem?.id || null,
        linked_item_name: ehospitalItem?.description || 'eHospital Annual Maintenance Fee',
        site_name: 'K1',
        category: 'Software Maintenance',
        amount: 18500.00,
        payment_status: 'Paid',
        payment_method: 'Bank Transfer',
        payment_date: `${fiscalYear}-01-15`,
        notes: 'Annual license fee paid in full per SLA agreement.'
      },
      {
        fiscal_year: fiscalYear,
        expense_date: `${fiscalYear}-01-28`,
        invoice_no: `INV-${fiscalYear}-002`,
        po_no: `PO-${fiscalYear}-102`,
        vendor_name: 'Vcloudia Cloud Services',
        description: 'Vcloudia High Availability Cloud VPC - Jan Hosting',
        budget_type: 'OpEx',
        linked_budget_id: vcloudiaItem?.id || null,
        linked_item_name: vcloudiaItem?.description || 'Vcloudia Cloud VPC',
        site_name: 'K1',
        category: 'Cloud Infrastructure',
        amount: 650.00,
        payment_status: 'Paid',
        payment_method: 'Credit Card',
        payment_date: `${fiscalYear}-01-28`,
        notes: 'Monthly recurring cloud VPC subscription.'
      },
      {
        fiscal_year: fiscalYear,
        expense_date: `${fiscalYear}-02-10`,
        invoice_no: `INV-${fiscalYear}-003`,
        po_no: `PO-${fiscalYear}-103`,
        vendor_name: 'Zebra Technologies Distributor',
        description: 'Patient Smart Card Identification Printers (2 Units)',
        budget_type: 'CapEx',
        linked_budget_id: printerItem?.id || null,
        linked_item_name: printerItem?.description || 'Patient Card Printer',
        site_name: 'K1',
        category: 'Hardware & Printers',
        amount: 2900.00,
        payment_status: 'Paid',
        payment_method: 'Bank Transfer',
        payment_date: `${fiscalYear}-02-12`,
        notes: 'Delivered and installed at K1 Admissions & Reception.'
      },
      {
        fiscal_year: fiscalYear,
        expense_date: `${fiscalYear}-02-20`,
        invoice_no: `INV-${fiscalYear}-004`,
        po_no: `PO-${fiscalYear}-104`,
        vendor_name: 'Dell Solutions Cambodia',
        description: 'Dell All-in-One Outpatient Workstations (Phase 1 - 5 Units)',
        budget_type: 'CapEx',
        linked_budget_id: dellItem?.id || null,
        linked_item_name: dellItem?.description || 'Dell AIO Computer',
        site_name: 'KG',
        category: 'Computers & Terminals',
        amount: 4250.00,
        payment_status: 'Paid',
        payment_method: 'Bank Transfer',
        payment_date: `${fiscalYear}-02-22`,
        notes: 'Deployed across KG OPD consulting rooms.'
      },
      {
        fiscal_year: fiscalYear,
        expense_date: `${fiscalYear}-02-28`,
        invoice_no: `INV-${fiscalYear}-005`,
        po_no: `PO-${fiscalYear}-105`,
        vendor_name: 'Vcloudia Cloud Services',
        description: 'Vcloudia High Availability Cloud VPC - Feb Hosting',
        budget_type: 'OpEx',
        linked_budget_id: vcloudiaItem?.id || null,
        linked_item_name: vcloudiaItem?.description || 'Vcloudia Cloud VPC',
        site_name: 'K1',
        category: 'Cloud Infrastructure',
        amount: 650.00,
        payment_status: 'Paid',
        payment_method: 'Credit Card',
        payment_date: `${fiscalYear}-02-28`,
        notes: 'Monthly recurring cloud VPC subscription.'
      },
      {
        fiscal_year: fiscalYear,
        expense_date: `${fiscalYear}-03-05`,
        invoice_no: `INV-${fiscalYear}-006`,
        po_no: `PO-${fiscalYear}-106`,
        vendor_name: 'Lenovo Enterprise Partner',
        description: 'Administrative Workstation Laptops (5 Units)',
        budget_type: 'CapEx',
        linked_budget_id: laptopItem?.id || null,
        linked_item_name: laptopItem?.description || 'Administrative Laptop',
        site_name: 'K2',
        category: 'Laptops & Mobile',
        amount: 5400.00,
        payment_status: 'Paid',
        payment_method: 'Bank Transfer',
        payment_date: `${fiscalYear}-03-08`,
        notes: 'Clinical supervisor and operations mobile units.'
      },
      {
        fiscal_year: fiscalYear,
        expense_date: `${fiscalYear}-03-15`,
        invoice_no: `INV-${fiscalYear}-007`,
        po_no: `PO-${fiscalYear}-107`,
        vendor_name: 'Anzer LIS Corp',
        description: 'Anzer Laboratory Information System Annual Maintenance',
        budget_type: 'OpEx',
        linked_budget_id: anzerItem?.id || null,
        linked_item_name: anzerItem?.description || 'Anzer Annual Maintenance Fee',
        site_name: 'KG',
        category: 'Software Maintenance',
        amount: 9200.00,
        payment_status: 'Paid',
        payment_method: 'Bank Transfer',
        payment_date: `${fiscalYear}-03-16`,
        notes: 'LIS instrument interfacing & quality control SLA.'
      },
      {
        fiscal_year: fiscalYear,
        expense_date: `${fiscalYear}-03-25`,
        invoice_no: `INV-${fiscalYear}-008`,
        po_no: `PO-${fiscalYear}-108`,
        vendor_name: 'BOS Equipment Rental',
        description: 'Heavy-Duty Network Multifunction Copier Monthly Rental',
        budget_type: 'OpEx',
        linked_budget_id: printerRentalItem?.id || null,
        linked_item_name: printerRentalItem?.description || 'MOS/BOS Heavy-Duty Network Printer Rental',
        site_name: 'K1',
        category: 'Equipment Rental',
        amount: 1250.00,
        payment_status: 'Paid',
        payment_method: 'Bank Transfer',
        payment_date: `${fiscalYear}-03-27`,
        notes: 'Q1 copier leasing and print maintenance package.'
      }
    ];

    for (const t of sampleTransactions) {
      await db.query(`INSERT INTO it_expense_transactions 
        (id, fiscal_year, expense_date, invoice_no, po_no, vendor_name, description, budget_type, linked_budget_id, linked_item_name, site_name, category, amount, payment_status, payment_method, payment_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(), t.fiscal_year, t.expense_date, t.invoice_no, t.po_no, t.vendor_name,
          t.description, t.budget_type, t.linked_budget_id, t.linked_item_name, t.site_name,
          t.category, t.amount, t.payment_status, t.payment_method, t.payment_date, t.notes
        ]
      );
    }

    console.log(`[IT Expenses] Seeded ${sampleTransactions.length} initial transactions for FY ${fiscalYear}`);
  } catch (err: any) {
    console.error('[IT Expense Seeding Warning]:', err.message);
  }
}

// Automatically recalculates and synchronizes monthly actuals into it_capex_plan or it_opex_plan
export async function syncExpensesToBudget(db: any, budgetType: 'CapEx' | 'OpEx', linkedBudgetId: string | null, fiscalYear: number) {
  if (!linkedBudgetId) return;

  try {
    const table = budgetType === 'CapEx' ? 'it_capex_plan' : 'it_opex_plan';
    const [planRows]: any = await db.query(`SELECT id, monthly_spending FROM ${table} WHERE id = ?`, [linkedBudgetId]);
    if (planRows.length === 0) return;

    let spending: YearMonthlySpending;
    try {
      spending = typeof planRows[0].monthly_spending === 'string'
        ? JSON.parse(planRows[0].monthly_spending)
        : planRows[0].monthly_spending;
    } catch {
      spending = createEmptyMonthlySpending();
    }
    if (!spending) spending = createEmptyMonthlySpending();

    // Query all transactions for this linked item in this fiscal year
    const [transactions]: any = await db.query(
      `SELECT expense_date, amount, payment_status FROM it_expense_transactions 
       WHERE linked_budget_id = ? AND fiscal_year = ?`,
      [linkedBudgetId, fiscalYear]
    );

    // Reset actuals to 0
    MONTH_KEYS.forEach(m => {
      if (spending[m]) spending[m].actual = 0;
    });

    // Sum actuals per month from transactions
    transactions.forEach((tx: any) => {
      if (tx.expense_date) {
        const d = new Date(tx.expense_date);
        if (!isNaN(d.getTime())) {
          const monthIdx = d.getMonth();
          const mKey = MONTH_KEYS[monthIdx];
          if (spending[mKey]) {
            spending[mKey].actual += parseFloat(tx.amount) || 0;
          }
        }
      }
    });

    // Compute updated quarterly rollups if CapEx
    if (budgetType === 'CapEx') {
      const quarterly = computeQuarterlyFromMonthly(spending);
      await db.query(
        `UPDATE it_capex_plan SET monthly_spending = ?, quarterly_spending = ? WHERE id = ?`,
        [JSON.stringify(spending), JSON.stringify(quarterly), linkedBudgetId]
      );
    } else {
      await db.query(
        `UPDATE it_opex_plan SET monthly_spending = ? WHERE id = ?`,
        [JSON.stringify(spending), linkedBudgetId]
      );
    }
  } catch (err: any) {
    console.error('[IT Budget Sync Error]:', err.message);
  }
}

export function normalizeExpenseSite(site?: string): string[] {
  if (!site || site === 'All Sites' || site === 'All') return [];
  const s = site.toLowerCase().trim();
  if (s === 'k1' || s.includes('tk') || s.includes('toul') || s.includes('north')) return ['K1', 'Khema TK', 'Khema Toul Kork', 'North Clinic'];
  if (s === 'k2' || s.includes('bkk') || s.includes('south') || s.includes('boeung')) return ['K2', 'Khema BKK', 'Boeung Keng Kang', 'South Clinic'];
  if (s === 'kg' || s.includes('global') || s.includes('main')) return ['KG', 'Khema Global', 'Main Hospital'];
  if (s === 'sakal' || s.includes('2004')) return ['Sakal', 'Sakal 2004', 'Sakal Polyclinic'];
  return [site];
}

export function setupItExpenseRoutes(app: Express, authenticateToken: any, getDb: () => any) {
  // Ensure table exists on boot
  const db = getDb();
  initItExpenseTables(db).catch(e => console.warn('[IT Expense Boot]:', e.message));

  // --- 1. GET ALL EXPENSE TRANSACTIONS ---
  app.get('/api/it-expenses', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { fiscal_year, site, budget_type, payment_status, vendor, search, from_date, to_date, budget_classification } = req.query as any;
      const fy = parseInt(fiscal_year, 10) || 2026;

      let sql = 'SELECT * FROM it_expense_transactions WHERE fiscal_year = ?';
      const params: any[] = [fy];

      if (from_date && from_date.trim()) {
        sql += ' AND expense_date >= ?';
        params.push(from_date.trim());
      }
      if (to_date && to_date.trim()) {
        sql += ' AND expense_date <= ?';
        params.push(to_date.trim());
      }
      if (site && site !== 'All Sites') {
        const aliases = normalizeExpenseSite(site);
        if (aliases.length > 0) {
          sql += ` AND site_name IN (${aliases.map(() => '?').join(',')})`;
          params.push(...aliases);
        }
      }
      if (budget_type && budget_type !== 'All Types') {
        if (budget_type === 'Unbudgeted' || budget_type === 'Unplanned') {
          sql += " AND (budget_classification = 'Unplanned' OR (linked_budget_id IS NULL AND budget_classification != 'Settled'))";
        } else {
          sql += ' AND budget_type = ?';
          params.push(budget_type);
        }
      }
      if (budget_classification && budget_classification !== 'All') {
        if (budget_classification === 'Unplanned') {
          sql += " AND (budget_classification = 'Unplanned' OR (linked_budget_id IS NULL AND budget_classification != 'Settled') OR budget_type = 'Unbudgeted')";
        } else if (budget_classification === 'Planned') {
          sql += " AND ((budget_classification = 'Planned' OR budget_classification = 'Settled') AND linked_budget_id IS NOT NULL)";
        } else {
          sql += ' AND budget_classification = ?';
          params.push(budget_classification);
        }
      }
      if (payment_status && payment_status !== 'All Statuses') {
        sql += ' AND payment_status = ?';
        params.push(payment_status);
      }
      if (vendor && vendor !== 'All Vendors') {
        sql += ' AND vendor_name = ?';
        params.push(vendor);
      }
      const { category, linked_budget_id } = req.query as any;
      if (category && category !== 'All Categories' && category !== 'All') {
        sql += ' AND category = ?';
        params.push(category);
      }
      if (linked_budget_id && linked_budget_id !== 'All' && linked_budget_id !== 'All Items') {
        sql += ' AND linked_budget_id = ?';
        params.push(linked_budget_id);
      }
      if (search && search.trim()) {
        sql += ' AND (description LIKE ? OR invoice_no LIKE ? OR po_no LIKE ? OR vendor_name LIKE ? OR category LIKE ? OR linked_item_name LIKE ? OR approval_ref LIKE ? OR unplanned_reason LIKE ?)';
        params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
      }

      sql += ' ORDER BY expense_date DESC, created_at DESC';
      const [rows] = await db.query(sql, params);

      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 2. GET BUDGET OPTIONS (CapEx & OpEx items for dropdown linking) ---
  app.get('/api/it-expenses/budget-options', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const fy = parseInt(req.query.fiscal_year as string, 10) || 2026;

      const [capexRows]: any = await db.query(
        'SELECT id, item_no, description, capex_code, asset_type, site, requested_amount FROM it_capex_plan WHERE fiscal_year = ? ORDER BY item_no ASC',
        [fy]
      );

      const [opexRows]: any = await db.query(
        'SELECT id, item_no, description, account_code, account_name, site, annual_cost, billing_cycle FROM it_opex_plan WHERE fiscal_year = ? ORDER BY item_no ASC',
        [fy]
      );

      res.json({
        fiscal_year: fy,
        capexOptions: capexRows.map((c: any) => ({
          id: c.id,
          name: `${c.description} (${c.capex_code || 'CapEx'} - ${c.site})`,
          raw_name: c.description,
          site: c.site,
          category: (c.asset_type || '').trim() || 'PC HARDWARE',
          budget_amount: parseFloat(c.requested_amount) || 0
        })),
        opexOptions: opexRows.map((o: any) => ({
          id: o.id,
          name: `${o.description} (${o.account_code ? o.account_code.split('-')[0].trim() : 'OpEx'} - ${o.site})`,
          raw_name: o.description,
          site: o.site,
          category: (o.account_code || o.account_name || '630104 - Other Outside Services').trim(),
          account_code: o.account_code || '',
          budget_amount: parseFloat(o.annual_cost) || 0
        }))
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 3. EXPENSE ANALYTICS & KPIS ---
  app.get('/api/it-expenses/analytics', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const fy = parseInt(req.query.fiscal_year as string, 10) || 2026;
      const site = req.query.site as string;
      const fromDate = req.query.from_date as string;
      const toDate = req.query.to_date as string;
      const budgetType = req.query.budget_type as string;
      const category = req.query.category as string;
      const linkedBudgetId = req.query.linked_budget_id as string;

      let whereSql = 'WHERE fiscal_year = ?';
      const params: any[] = [fy];
      if (fromDate && fromDate.trim()) {
        whereSql += ' AND expense_date >= ?';
        params.push(fromDate.trim());
      }
      if (toDate && toDate.trim()) {
        whereSql += ' AND expense_date <= ?';
        params.push(toDate.trim());
      }
      if (site && site !== 'All Sites') {
        const aliases = normalizeExpenseSite(site);
        if (aliases.length > 0) {
          whereSql += ` AND site_name IN (${aliases.map(() => '?').join(',')})`;
          params.push(...aliases);
        }
      }

      if (category && category !== 'All Categories' && category !== 'All') {
        whereSql += ' AND category = ?';
        params.push(category);
      }

      // Snapshot contextual scope BEFORE applying budget_type / classification / linked_budget_id filters
      const baseScopeWhereSql = whereSql;
      const baseScopeParams = [...params];
      let hasScopeSpecificFilter = false;

      if (budgetType && budgetType !== 'All Types' && budgetType !== 'All') {
        hasScopeSpecificFilter = true;
        if (budgetType === 'Unbudgeted' || budgetType === 'Unplanned') {
          whereSql += " AND (budget_classification = 'Unplanned' OR (linked_budget_id IS NULL AND budget_classification != 'Settled'))";
        } else {
          whereSql += ' AND budget_type = ?';
          params.push(budgetType);
        }
      }

      if (linkedBudgetId && linkedBudgetId !== 'All' && linkedBudgetId !== 'All Items') {
        hasScopeSpecificFilter = true;
        whereSql += ' AND linked_budget_id = ?';
        params.push(linkedBudgetId);
      }

      const classification = req.query.budget_classification as string;
      if (classification && classification !== 'All') {
        hasScopeSpecificFilter = true;
        if (classification === 'Unplanned') {
          whereSql += " AND (budget_classification = 'Unplanned' OR (linked_budget_id IS NULL AND budget_classification != 'Settled') OR budget_type = 'Unbudgeted')";
        } else if (classification === 'Planned') {
          whereSql += " AND ((budget_classification = 'Planned' OR budget_classification = 'Settled') AND linked_budget_id IS NOT NULL)";
        } else {
          whereSql += ' AND budget_classification = ?';
          params.push(classification);
        }
      }

      const [txRows]: any = await db.query(`SELECT * FROM it_expense_transactions ${whereSql}`, params);

      let scopeSourceRows: any[] = txRows;
      if (hasScopeSpecificFilter) {
        const [unfilteredRows]: any = await db.query(
          `SELECT budget_type, budget_classification, linked_budget_id, amount FROM it_expense_transactions ${baseScopeWhereSql}`,
          baseScopeParams
        );
        scopeSourceRows = unfilteredRows;
      }

      const scopeCounts = {
        all: { count: 0, total: 0 },
        plannedOpex: { count: 0, total: 0 },
        plannedCapex: { count: 0, total: 0 },
        unplannedAll: { count: 0, total: 0 },
        unplannedCapex: { count: 0, total: 0 },
        unplannedOpex: { count: 0, total: 0 },
        settled: { count: 0, total: 0 }
      };

      scopeSourceRows.forEach((r: any) => {
        const amt = parseFloat(r.amount) || 0;
        const isUnp = r.budget_classification === 'Unplanned' || (!r.linked_budget_id && r.budget_classification !== 'Settled');
        const isSet = r.budget_classification === 'Settled';

        scopeCounts.all.count += 1;
        scopeCounts.all.total += amt;

        if (isUnp) {
          scopeCounts.unplannedAll.count += 1;
          scopeCounts.unplannedAll.total += amt;
          if (r.budget_type === 'CapEx') {
            scopeCounts.unplannedCapex.count += 1;
            scopeCounts.unplannedCapex.total += amt;
          } else {
            scopeCounts.unplannedOpex.count += 1;
            scopeCounts.unplannedOpex.total += amt;
          }
        } else {
          if (r.budget_type === 'CapEx') {
            scopeCounts.plannedCapex.count += 1;
            scopeCounts.plannedCapex.total += amt;
          } else {
            scopeCounts.plannedOpex.count += 1;
            scopeCounts.plannedOpex.total += amt;
          }
        }

        if (isSet) {
          scopeCounts.settled.count += 1;
          scopeCounts.settled.total += amt;
        }
      });

      // Fetch CapEx & OpEx Planning figures for authoritative budget ceilings & plan comparison
      let planCapexSql = 'SELECT id, description, site, requested_amount, monthly_spending FROM it_capex_plan WHERE fiscal_year = ?';
      let planOpexSql = 'SELECT id, description, site, annual_cost, monthly_spending FROM it_opex_plan WHERE fiscal_year = ?';
      const planCapexParams: any[] = [fy];
      const planOpexParams: any[] = [fy];

      if (site && site !== 'All Sites') {
        const aliases = normalizeExpenseSite(site);
        if (aliases.length > 0) {
          const placeholders = aliases.map(() => '?').join(',');
          planCapexSql += ` AND site IN (${placeholders})`;
          planCapexParams.push(...aliases);
          planOpexSql += ` AND site IN (${placeholders})`;
          planOpexParams.push(...aliases);
        }
      }

      const [capexPlanRows]: any = await db.query(planCapexSql, planCapexParams);
      const [opexPlanRows]: any = await db.query(planOpexSql, planOpexParams);

      let capexPlannedBudget = 0;
      let opexPlannedBudget = 0;
      let capexPlanningActual = 0;
      let opexPlanningActual = 0;
      const budgetItemPlanAmountMap: Record<string, number> = {};

      capexPlanRows.forEach((row: any) => {
        const reqAmt = parseFloat(row.requested_amount) || 0;
        capexPlannedBudget += reqAmt;
        budgetItemPlanAmountMap[row.id] = reqAmt;
        try {
          const spending = typeof row.monthly_spending === 'string' ? JSON.parse(row.monthly_spending) : row.monthly_spending;
          MONTH_KEYS.forEach(m => {
            capexPlanningActual += Number(spending?.[m]?.actual || 0);
          });
        } catch {}
      });

      opexPlanRows.forEach((row: any) => {
        const annAmt = parseFloat(row.annual_cost) || 0;
        opexPlannedBudget += annAmt;
        budgetItemPlanAmountMap[row.id] = annAmt;
        try {
          const spending = typeof row.monthly_spending === 'string' ? JSON.parse(row.monthly_spending) : row.monthly_spending;
          MONTH_KEYS.forEach(m => {
            opexPlanningActual += Number(spending?.[m]?.actual || 0);
          });
        } catch {}
      });

      const totalPlannedBudget = parseFloat((capexPlannedBudget + opexPlannedBudget).toFixed(2));

      let totalExpenses = 0;
      let totalCapexExpenses = 0;     // Budgeted CapEx (Planned + Settled) - aligns 1:1 with CapEx Planning Actual
      let totalOpexExpenses = 0;      // Budgeted OpEx (Planned + Settled) - aligns 1:1 with OpEx Planning Actual
      let totalUnplannedCapex = 0;    // Unplanned items tagged CapEx
      let totalUnplannedOpex = 0;     // Unplanned items tagged OpEx
      let totalPending = 0;
      let totalOverdue = 0;
      let totalUnplannedExpenses = 0;
      let unplannedCount = 0;
      let totalPlannedExpenses = 0;   // All budget-linked spend (Planned + Settled)
      let plannedCount = 0;
      let totalDirectPlannedExpenses = 0;
      let directPlannedCount = 0;
      let totalSettledExpenses = 0;
      let settledCount = 0;

      const plannedItemMap: Record<string, { id: string; name: string; budget_type: string; total: number; count: number; budget_amount: number }> = {};

      const monthlyBreakdown: Record<string, { capex: number; opex: number; unplanned: number; total: number }> = {};
      MONTH_KEYS.forEach(m => {
        monthlyBreakdown[m] = { capex: 0, opex: 0, unplanned: 0, total: 0 };
      });

      const siteBreakdown: Record<string, number> = { K1: 0, K2: 0, KG: 0, KB: 0, Sakal: 0, 'All Sites': 0 };
      const vendorBreakdown: Record<string, number> = {};

      txRows.forEach((tx: any) => {
        const amt = parseFloat(tx.amount) || 0;
        totalExpenses += amt;

        const isUnplanned = tx.budget_classification === 'Unplanned' || (!tx.linked_budget_id && tx.budget_classification !== 'Settled');
        const isSettled = tx.budget_classification === 'Settled';

        if (isUnplanned) {
          totalUnplannedExpenses += amt;
          unplannedCount += 1;
          if (tx.budget_type === 'CapEx') {
            totalUnplannedCapex += amt;
          } else {
            totalUnplannedOpex += amt;
          }
        } else {
          // Both direct Planned and Settled transactions are linked to it_capex_plan / it_opex_plan
          totalPlannedExpenses += amt;
          plannedCount += 1;

          if (isSettled) {
            totalSettledExpenses += amt;
            settledCount += 1;
          } else {
            totalDirectPlannedExpenses += amt;
            directPlannedCount += 1;
          }

          if (tx.budget_type === 'CapEx') {
            totalCapexExpenses += amt;
          } else {
            totalOpexExpenses += amt;
          }

          const bId = tx.linked_budget_id || 'unlinked';
          const bName = tx.linked_item_name || `${tx.budget_type}: ${tx.description}`;
          if (!plannedItemMap[bId]) {
            plannedItemMap[bId] = {
              id: bId,
              name: bName,
              budget_type: tx.budget_type,
              total: 0,
              count: 0,
              budget_amount: budgetItemPlanAmountMap[bId] || 0
            };
          }
          plannedItemMap[bId].total += amt;
          plannedItemMap[bId].count += 1;
        }

        if (tx.payment_status === 'Pending' || tx.payment_status === 'Processing') {
          totalPending += amt;
        } else if (tx.payment_status === 'Overdue') {
          totalOverdue += amt;
        }

        const s = tx.site_name || 'Other';
        siteBreakdown[s] = (siteBreakdown[s] || 0) + amt;

        const v = tx.vendor_name || 'Unknown';
        vendorBreakdown[v] = (vendorBreakdown[v] || 0) + amt;

        if (tx.expense_date) {
          const d = new Date(tx.expense_date);
          if (!isNaN(d.getTime())) {
            const mKey = MONTH_KEYS[d.getMonth()];
            if (monthlyBreakdown[mKey]) {
              if (isUnplanned) {
                monthlyBreakdown[mKey].unplanned += amt;
              } else if (tx.budget_type === 'CapEx') {
                monthlyBreakdown[mKey].capex += amt;
              } else {
                monthlyBreakdown[mKey].opex += amt;
              }
              monthlyBreakdown[mKey].total += amt;
            }
          }
        }
      });

      const round2 = (n: number) => parseFloat(n.toFixed(2));
      totalExpenses = round2(totalExpenses);
      totalCapexExpenses = round2(totalCapexExpenses);
      totalOpexExpenses = round2(totalOpexExpenses);
      totalUnplannedCapex = round2(totalUnplannedCapex);
      totalUnplannedOpex = round2(totalUnplannedOpex);
      totalPlannedExpenses = round2(totalPlannedExpenses);
      totalDirectPlannedExpenses = round2(totalDirectPlannedExpenses);
      totalSettledExpenses = round2(totalSettledExpenses);
      totalUnplannedExpenses = round2(totalUnplannedExpenses);
      const totalCapexGross = round2(totalCapexExpenses + totalUnplannedCapex);
      const totalOpexGross = round2(totalOpexExpenses + totalUnplannedOpex);

      // Top vendors list
      const topVendors = Object.entries(vendorBreakdown)
        .map(([name, total]) => ({ name, total: Math.round(total) }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);

      const monthlyChartData = MONTH_KEYS.map(m => ({
        month: m.toUpperCase(),
        capex: round2(monthlyBreakdown[m].capex),
        opex: round2(monthlyBreakdown[m].opex),
        unplanned: round2(monthlyBreakdown[m].unplanned),
        total: round2(monthlyBreakdown[m].total)
      }));

      const plannedAdherenceRate = totalExpenses > 0 
        ? parseFloat(((totalPlannedExpenses / totalExpenses) * 100).toFixed(1)) 
        : 100.0;

      const capexExecutionRate = capexPlannedBudget > 0
        ? parseFloat(((totalCapexExpenses / capexPlannedBudget) * 100).toFixed(1))
        : 0;
      const opexExecutionRate = opexPlannedBudget > 0
        ? parseFloat(((totalOpexExpenses / opexPlannedBudget) * 100).toFixed(1))
        : 0;
      const budgetExecutionRate = totalPlannedBudget > 0
        ? parseFloat(((totalPlannedExpenses / totalPlannedBudget) * 100).toFixed(1))
        : 0;

      const plannedBudgetItemsBreakdown = Object.values(plannedItemMap)
        .map(item => ({ ...item, total: round2(item.total) }))
        .sort((a, b) => b.total - a.total);

      res.json({
        fiscal_year: fy,
        totalExpenses,
        totalCapexExpenses,
        totalOpexExpenses,
        totalUnplannedCapex,
        totalUnplannedOpex,
        totalCapexGross,
        totalOpexGross,
        totalPending: round2(totalPending),
        totalOverdue: round2(totalOverdue),
        totalUnplannedExpenses,
        unplannedCount,
        totalPlannedExpenses,
        plannedCount,
        totalDirectPlannedExpenses,
        directPlannedCount,
        totalSettledExpenses,
        settledCount,
        capexPlannedBudget: round2(capexPlannedBudget),
        opexPlannedBudget: round2(opexPlannedBudget),
        totalPlannedBudget,
        capexPlanningActual: round2(capexPlanningActual),
        opexPlanningActual: round2(opexPlanningActual),
        capexExecutionRate,
        opexExecutionRate,
        budgetExecutionRate,
        plannedAdherenceRate,
        plannedBudgetItemsBreakdown,
        transactionCount: txRows.length,
        monthlyChartData,
        siteBreakdown,
        topVendors,
        scopeCounts: {
          all: { count: scopeCounts.all.count, total: round2(scopeCounts.all.total) },
          plannedOpex: { count: scopeCounts.plannedOpex.count, total: round2(scopeCounts.plannedOpex.total) },
          plannedCapex: { count: scopeCounts.plannedCapex.count, total: round2(scopeCounts.plannedCapex.total) },
          unplannedAll: { count: scopeCounts.unplannedAll.count, total: round2(scopeCounts.unplannedAll.total) },
          unplannedCapex: { count: scopeCounts.unplannedCapex.count, total: round2(scopeCounts.unplannedCapex.total) },
          unplannedOpex: { count: scopeCounts.unplannedOpex.count, total: round2(scopeCounts.unplannedOpex.total) },
          settled: { count: scopeCounts.settled.count, total: round2(scopeCounts.settled.total) }
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 4. CREATE NEW EXPENSE TRANSACTION ---
  app.post('/api/it-expenses', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const {
        fiscal_year, expense_date, invoice_no, po_no, vendor_name, description,
        budget_type, linked_budget_id, linked_item_name, site_name, category,
        amount, payment_status, payment_method, payment_date, receipt_url, notes,
        budget_classification, unplanned_reason, approval_ref, settlement_status
      } = req.body;

      if (!description?.trim() || !vendor_name?.trim() || !expense_date) {
        return res.status(400).json({ error: 'Description, Vendor Name, and Expense Date are required' });
      }

      const fy = parseInt(fiscal_year, 10) || 2027;
      const numAmount = parseFloat(amount) || 0;
      const id = crypto.randomUUID();
      const statusSettlement = settlement_status || (budget_classification === 'Unplanned' ? 'Unsettled' : 'Settled');
      const resolvedBudgetType = (budget_type || 'OpEx') as 'CapEx' | 'OpEx';
      const planCategory = await resolvePlanCategory(db, resolvedBudgetType, linked_budget_id);
      const finalCategory = planCategory || category || (resolvedBudgetType === 'CapEx' ? 'PC HARDWARE' : '630104 - Other Outside Services');

      await db.query(`INSERT INTO it_expense_transactions 
        (id, fiscal_year, expense_date, invoice_no, po_no, vendor_name, description, budget_type, linked_budget_id, linked_item_name, site_name, category, amount, payment_status, payment_method, payment_date, receipt_url, notes, budget_classification, unplanned_reason, approval_ref, settlement_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, fy, expense_date, invoice_no || null, po_no || null, vendor_name.trim(),
          description.trim(), resolvedBudgetType, linked_budget_id || null,
          linked_item_name || null, site_name || 'K1', finalCategory,
          numAmount, payment_status || 'Paid', payment_method || 'Bank Transfer',
          payment_date || expense_date, receipt_url || null, notes || '',
          budget_classification || 'Planned', unplanned_reason || '', approval_ref || '',
          statusSettlement
        ]
      );

      // Auto-synchronize this transaction into the linked CapEx or OpEx monthly actual
      if (linked_budget_id) {
        await syncExpensesToBudget(db, budget_type, linked_budget_id, fy);
      }

      res.status(201).json({ id, success: true, message: 'Expense transaction recorded and budget updated' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 5. UPDATE EXPENSE TRANSACTION ---
  app.put('/api/it-expenses/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const {
        fiscal_year, expense_date, invoice_no, po_no, vendor_name, description,
        budget_type, linked_budget_id, linked_item_name, site_name, category,
        amount, payment_status, payment_method, payment_date, receipt_url, notes,
        budget_classification, unplanned_reason, approval_ref, settlement_status
      } = req.body;

      // Get prior record to know if linked_budget_id changed
      const [oldRows]: any = await db.query('SELECT * FROM it_expense_transactions WHERE id = ?', [id]);
      const oldRecord = oldRows[0];

      const fy = parseInt(fiscal_year, 10) || oldRecord?.fiscal_year || 2027;
      const numAmount = parseFloat(amount) || 0;
      const statusSettlement = settlement_status || oldRecord?.settlement_status || (budget_classification === 'Unplanned' ? 'Unsettled' : 'Settled');
      const resolvedBudgetType = (budget_type || oldRecord?.budget_type || 'OpEx') as 'CapEx' | 'OpEx';
      const planCategory = await resolvePlanCategory(db, resolvedBudgetType, linked_budget_id);
      const finalCategory = planCategory || category;

      await db.query(`UPDATE it_expense_transactions SET
        fiscal_year = ?, expense_date = ?, invoice_no = ?, po_no = ?, vendor_name = ?,
        description = ?, budget_type = ?, linked_budget_id = ?, linked_item_name = ?,
        site_name = ?, category = ?, amount = ?, payment_status = ?, payment_method = ?,
        payment_date = ?, receipt_url = ?, notes = ?,
        budget_classification = ?, unplanned_reason = ?, approval_ref = ?, settlement_status = ?
        WHERE id = ?`,
        [
          fy, expense_date, invoice_no || null, po_no || null, vendor_name,
          description, resolvedBudgetType, linked_budget_id || null, linked_item_name || null,
          site_name, finalCategory, numAmount, payment_status, payment_method,
          payment_date || null, receipt_url || null, notes || '',
          budget_classification || 'Planned', unplanned_reason || '', approval_ref || '',
          statusSettlement, id
        ]
      );

      // Recalculate old linked item if changed
      if (oldRecord?.linked_budget_id && oldRecord.linked_budget_id !== linked_budget_id) {
        await syncExpensesToBudget(db, oldRecord.budget_type, oldRecord.linked_budget_id, oldRecord.fiscal_year);
      }

      // Recalculate new linked item
      if (linked_budget_id) {
        await syncExpensesToBudget(db, budget_type, linked_budget_id, fy);
      }

      res.json({ success: true, message: 'Expense transaction updated and budget actuals synced' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 6. DELETE EXPENSE TRANSACTION ---
  app.delete('/api/it-expenses/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { id } = req.params;

      const [rows]: any = await db.query('SELECT * FROM it_expense_transactions WHERE id = ?', [id]);
      if (rows.length > 0) {
        const tx = rows[0];
        await db.query('DELETE FROM it_expense_transactions WHERE id = ?', [id]);

        // Recalculate linked budget actuals
        if (tx.linked_budget_id) {
          await syncExpensesToBudget(db, tx.budget_type, tx.linked_budget_id, tx.fiscal_year);
        }
      }

      res.json({ success: true, message: 'Expense transaction deleted and budget actuals updated' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 7. SETTLE UNPLANNED EXPENSE TO BUDGET ITEM ---
  app.post('/api/it-expenses/:id/settle', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { budget_type, linked_budget_id, linked_item_name } = req.body;

      if (!linked_budget_id || !budget_type) {
        return res.status(400).json({ error: 'Target budget item and budget type are required for settlement' });
      }

      const [txRows]: any = await db.query('SELECT * FROM it_expense_transactions WHERE id = ?', [id]);
      if (txRows.length === 0) {
        return res.status(404).json({ error: 'Expense transaction not found' });
      }
      const tx = txRows[0];

      const planCategory = await resolvePlanCategory(db, budget_type, linked_budget_id);

      await db.query(`UPDATE it_expense_transactions SET
        budget_type = ?,
        linked_budget_id = ?,
        linked_item_name = ?,
        category = COALESCE(?, category),
        budget_classification = 'Settled',
        settlement_status = 'Settled'
        WHERE id = ?`,
        [budget_type, linked_budget_id, linked_item_name || 'Settled Item', planCategory, id]
      );

      // Auto-synchronize this transaction into the target CapEx or OpEx monthly actual
      await syncExpensesToBudget(db, budget_type, linked_budget_id, tx.fiscal_year);

      res.json({ success: true, message: 'Expense transaction successfully settled and linked to budget item' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 8. GENERAL IT & EXPENSE CATEGORIES CRUD ---
  // List all categories (auto-synced with CapEx asset_types & OpEx account_codes) with live transaction stats
  app.get('/api/expense-categories', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      await syncBudgetCategoriesIntoExpenseCategories(db);
      const [rows]: any = await db.query(`
        SELECT c.*,
          COALESCE((SELECT COUNT(*) FROM it_expense_transactions e WHERE e.category = c.category_name), 0) AS expense_count,
          COALESCE((SELECT SUM(e.amount) FROM it_expense_transactions e WHERE e.category = c.category_name), 0) AS total_expense_amount
        FROM it_expense_categories c
        ORDER BY FIELD(c.budget_type, 'CapEx', 'OpEx', 'Both'), c.category_name ASC
      `);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create new category
  app.post('/api/expense-categories', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { category_name, code, gl_account_code, budget_type, description, status } = req.body;
      if (!category_name || !category_name.trim()) {
        return res.status(400).json({ error: 'Category name is required' });
      }
      const trimmedName = category_name.trim();
      const trimmedCode = (code || trimmedName.slice(0, 8).toUpperCase().replace(/\s+/g, '-')).trim();

      const [existing]: any = await db.query(
        'SELECT id FROM it_expense_categories WHERE LOWER(category_name) = LOWER(?)',
        [trimmedName]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: `Category "${trimmedName}" already exists` });
      }

      const id = crypto.randomUUID();
      await db.query(
        'INSERT INTO it_expense_categories (id, category_name, code, gl_account_code, budget_type, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          trimmedName,
          trimmedCode,
          gl_account_code ? gl_account_code.trim() : '',
          budget_type || 'OpEx',
          description ? description.trim() : '',
          status || 'Active'
        ]
      );

      res.json({
        id,
        category_name: trimmedName,
        code: trimmedCode,
        gl_account_code: gl_account_code ? gl_account_code.trim() : '',
        budget_type: budget_type || 'OpEx',
        description: description ? description.trim() : '',
        status: status || 'Active',
        expense_count: 0,
        total_expense_amount: 0
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update existing category (with live cascade to it_expense_transactions)
  app.put('/api/expense-categories/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { category_name, code, gl_account_code, budget_type, description, status, sync_expenses = true } = req.body;

      if (!category_name || !category_name.trim()) {
        return res.status(400).json({ error: 'Category name is required' });
      }
      const trimmedName = category_name.trim();
      const trimmedCode = (code || trimmedName.slice(0, 8).toUpperCase().replace(/\s+/g, '-')).trim();

      const [existing]: any = await db.query('SELECT * FROM it_expense_categories WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      const prevName = existing[0].category_name;

      if (prevName.toLowerCase() !== trimmedName.toLowerCase()) {
        const [dup]: any = await db.query(
          'SELECT id FROM it_expense_categories WHERE LOWER(category_name) = LOWER(?) AND id != ?',
          [trimmedName, id]
        );
        if (dup.length > 0) {
          return res.status(400).json({ error: `Another category with name "${trimmedName}" already exists` });
        }
      }

      await db.query(
        'UPDATE it_expense_categories SET category_name = ?, code = ?, gl_account_code = ?, budget_type = ?, description = ?, status = ? WHERE id = ?',
        [
          trimmedName,
          trimmedCode,
          gl_account_code ? gl_account_code.trim() : '',
          budget_type || 'OpEx',
          description ? description.trim() : '',
          status || 'Active',
          id
        ]
      );

      let updatedExpenses = 0;
      if (sync_expenses && prevName !== trimmedName) {
        const [updateRes]: any = await db.query(
          'UPDATE it_expense_transactions SET category = ? WHERE category = ?',
          [trimmedName, prevName]
        ).catch(() => [{ affectedRows: 0 }]);
        updatedExpenses = updateRes?.affectedRows || 0;
      }

      res.json({
        success: true,
        id,
        category_name: trimmedName,
        code: trimmedCode,
        gl_account_code: gl_account_code ? gl_account_code.trim() : '',
        budget_type: budget_type || 'OpEx',
        description: description ? description.trim() : '',
        status: status || 'Active',
        updatedExpenses
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete category with safe reassignment
  app.delete('/api/expense-categories/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { reassign_to } = req.body || {};

      const [existing]: any = await db.query('SELECT * FROM it_expense_categories WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      const deletedCat = existing[0];
      const targetCategory = reassign_to || 'General IT Services';

      const [reassignRes]: any = await db.query(
        'UPDATE it_expense_transactions SET category = ? WHERE category = ?',
        [targetCategory, deletedCat.category_name]
      ).catch(() => [{ affectedRows: 0 }]);

      await db.query('DELETE FROM it_expense_categories WHERE id = ?', [id]);

      res.json({
        success: true,
        message: `Category "${deletedCat.category_name}" deleted. Linked expenses reassigned to "${targetCategory}".`,
        reassigned_count: reassignRes?.affectedRows || 0
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
