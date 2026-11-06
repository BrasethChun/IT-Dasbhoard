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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_exp_fy (fiscal_year),
      INDEX idx_exp_site (site_name),
      INDEX idx_exp_budget (budget_type, linked_budget_id),
      INDEX idx_exp_date (expense_date)
    )`);

    // Persistent System Metadata Table to prevent auto-resetting deleted expenses on reboot/refresh
    await db.query(`CREATE TABLE IF NOT EXISTS it_system_metadata (
      meta_key VARCHAR(100) PRIMARY KEY,
      meta_value VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

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
  } catch (err: any) {
    console.error('[IT Expense Tables Init Warning]:', err.message);
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

export function setupItExpenseRoutes(app: Express, authenticateToken: any, getDb: () => any) {
  // Ensure table exists on boot
  const db = getDb();
  initItExpenseTables(db).catch(e => console.warn('[IT Expense Boot]:', e.message));

  // --- 1. GET ALL EXPENSE TRANSACTIONS ---
  app.get('/api/it-expenses', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { fiscal_year, site, budget_type, payment_status, vendor, search, from_date, to_date } = req.query as any;
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
        sql += ' AND site_name = ?';
        params.push(site);
      }
      if (budget_type && budget_type !== 'All Types') {
        sql += ' AND budget_type = ?';
        params.push(budget_type);
      }
      if (payment_status && payment_status !== 'All Statuses') {
        sql += ' AND payment_status = ?';
        params.push(payment_status);
      }
      if (vendor && vendor !== 'All Vendors') {
        sql += ' AND vendor_name = ?';
        params.push(vendor);
      }
      if (search && search.trim()) {
        sql += ' AND (description LIKE ? OR invoice_no LIKE ? OR po_no LIKE ? OR vendor_name LIKE ? OR linked_item_name LIKE ?)';
        params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
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
          category: c.asset_type,
          budget_amount: parseFloat(c.requested_amount) || 0
        })),
        opexOptions: opexRows.map((o: any) => ({
          id: o.id,
          name: `${o.description} (${o.account_code ? o.account_code.split('-')[0].trim() : 'OpEx'} - ${o.site})`,
          raw_name: o.description,
          site: o.site,
          category: o.account_name || 'Outside Services',
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
        whereSql += ' AND site_name = ?';
        params.push(site);
      }

      const [txRows]: any = await db.query(`SELECT * FROM it_expense_transactions ${whereSql}`, params);

      let totalExpenses = 0;
      let totalCapexExpenses = 0;
      let totalOpexExpenses = 0;
      let totalPending = 0;
      let totalOverdue = 0;

      const monthlyBreakdown: Record<string, { capex: number; opex: number; total: number }> = {};
      MONTH_KEYS.forEach(m => {
        monthlyBreakdown[m] = { capex: 0, opex: 0, total: 0 };
      });

      const siteBreakdown: Record<string, number> = { K1: 0, K2: 0, KG: 0, KB: 0, Sakal: 0, 'All Sites': 0 };
      const vendorBreakdown: Record<string, number> = {};

      txRows.forEach((tx: any) => {
        const amt = parseFloat(tx.amount) || 0;
        totalExpenses += amt;

        if (tx.budget_type === 'CapEx') {
          totalCapexExpenses += amt;
        } else {
          totalOpexExpenses += amt;
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
              if (tx.budget_type === 'CapEx') {
                monthlyBreakdown[mKey].capex += amt;
              } else {
                monthlyBreakdown[mKey].opex += amt;
              }
              monthlyBreakdown[mKey].total += amt;
            }
          }
        }
      });

      // Top vendors list
      const topVendors = Object.entries(vendorBreakdown)
        .map(([name, total]) => ({ name, total: Math.round(total) }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);

      const monthlyChartData = MONTH_KEYS.map(m => ({
        month: m.toUpperCase(),
        capex: Math.round(monthlyBreakdown[m].capex),
        opex: Math.round(monthlyBreakdown[m].opex),
        total: Math.round(monthlyBreakdown[m].total)
      }));

      res.json({
        fiscal_year: fy,
        totalExpenses,
        totalCapexExpenses,
        totalOpexExpenses,
        totalPending,
        totalOverdue,
        transactionCount: txRows.length,
        monthlyChartData,
        siteBreakdown,
        topVendors
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
        amount, payment_status, payment_method, payment_date, receipt_url, notes
      } = req.body;

      if (!description?.trim() || !vendor_name?.trim() || !expense_date) {
        return res.status(400).json({ error: 'Description, Vendor Name, and Expense Date are required' });
      }

      const fy = parseInt(fiscal_year, 10) || 2027;
      const numAmount = parseFloat(amount) || 0;
      const id = crypto.randomUUID();

      await db.query(`INSERT INTO it_expense_transactions 
        (id, fiscal_year, expense_date, invoice_no, po_no, vendor_name, description, budget_type, linked_budget_id, linked_item_name, site_name, category, amount, payment_status, payment_method, payment_date, receipt_url, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, fy, expense_date, invoice_no || null, po_no || null, vendor_name.trim(),
          description.trim(), budget_type || 'OpEx', linked_budget_id || null,
          linked_item_name || null, site_name || 'K1', category || 'General IT',
          numAmount, payment_status || 'Paid', payment_method || 'Bank Transfer',
          payment_date || expense_date, receipt_url || null, notes || ''
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
        amount, payment_status, payment_method, payment_date, receipt_url, notes
      } = req.body;

      // Get prior record to know if linked_budget_id changed
      const [oldRows]: any = await db.query('SELECT * FROM it_expense_transactions WHERE id = ?', [id]);
      const oldRecord = oldRows[0];

      const fy = parseInt(fiscal_year, 10) || oldRecord?.fiscal_year || 2027;
      const numAmount = parseFloat(amount) || 0;

      await db.query(`UPDATE it_expense_transactions SET
        fiscal_year = ?, expense_date = ?, invoice_no = ?, po_no = ?, vendor_name = ?,
        description = ?, budget_type = ?, linked_budget_id = ?, linked_item_name = ?,
        site_name = ?, category = ?, amount = ?, payment_status = ?, payment_method = ?,
        payment_date = ?, receipt_url = ?, notes = ?
        WHERE id = ?`,
        [
          fy, expense_date, invoice_no || null, po_no || null, vendor_name,
          description, budget_type, linked_budget_id || null, linked_item_name || null,
          site_name, category, numAmount, payment_status, payment_method,
          payment_date || null, receipt_url || null, notes || '', id
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
}
