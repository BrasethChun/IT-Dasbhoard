import { Express, Request, Response } from 'express';
import crypto from 'crypto';

export interface AssetCategory {
  id: number;
  name: string;
  type: 'IT_ASSET' | 'FIXED_ASSET';
  depreciation_years: number;
}

export interface LocationDepartment {
  id: number;
  branch_name: string;
  department_name: string;
  location_code: string;
}

export interface AssetRecord {
  id: string;
  asset_tag: string;
  serial_number: string | null;
  name: string;
  category_id: number;
  model_specs: string | null;
  status: 'Available (In Stock)' | 'Assigned' | 'In Repair / Maintenance' | 'Retired / Disposed' | 'Lost / Stolen';
  condition_status: 'New' | 'Good' | 'Fair' | 'Damaged';
  location_id: number | null;
  assigned_to_name: string | null;
  assigned_to_emp_id: string | null;
  purchase_date: string;
  purchase_cost: number;
  salvage_value: number;
  warranty_expiry: string | null;
  supplier_name: string | null;
  invoice_ref: string | null;
  notes: string | null;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------------------------
// Straight-Line Depreciation Engine (GAAP/IFRS standard)
// -------------------------------------------------------------------------
export function calculateDepreciation(
  purchaseCost: number | string,
  salvageValue: number | string,
  usefulLifeYears: number | string,
  purchaseDate: string
) {
  const cost = Math.max(0, parseFloat(String(purchaseCost)) || 0);
  const salvage = Math.max(0, parseFloat(String(salvageValue)) || 0);
  const lifeYears = Math.max(0.5, parseFloat(String(usefulLifeYears)) || 3.0);

  const depreciableAmount = Math.max(0, cost - salvage);
  const annualDepreciation = depreciableAmount / lifeYears;
  const monthlyDepreciation = annualDepreciation / 12;

  const pDate = new Date(purchaseDate);
  const now = new Date();
  let elapsedMonths = 0;
  if (!isNaN(pDate.getTime())) {
    elapsedMonths = Math.max(
      0,
      (now.getFullYear() - pDate.getFullYear()) * 12 + (now.getMonth() - pDate.getMonth())
    );
  }

  const totalDepreciationMonths = Math.round(lifeYears * 12);
  const effectiveMonths = Math.min(elapsedMonths, totalDepreciationMonths);
  const accumulatedDepreciation = Math.min(depreciableAmount, monthlyDepreciation * effectiveMonths);
  const currentBookValue = Math.max(salvage, cost - accumulatedDepreciation);

  return {
    purchaseCost: cost,
    salvageValue: salvage,
    usefulLifeYears: lifeYears,
    elapsedMonths,
    totalDepreciationMonths,
    annualDepreciation: Math.round(annualDepreciation * 100) / 100,
    monthlyDepreciation: Math.round(monthlyDepreciation * 100) / 100,
    accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
    currentBookValue: Math.round(currentBookValue * 100) / 100,
    depreciationPercentage:
      depreciableAmount > 0
        ? Math.min(100, Math.round((accumulatedDepreciation / depreciableAmount) * 100))
        : 0
  };
}

// -------------------------------------------------------------------------
// MySQL Schema Initializer & Auto-Seeder
// -------------------------------------------------------------------------
export async function initAssetTables(db: any) {
  try {
    // 1. asset_categories
    await db.query(`CREATE TABLE IF NOT EXISTS asset_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type ENUM('IT_ASSET', 'FIXED_ASSET') NOT NULL DEFAULT 'IT_ASSET',
      depreciation_years DECIMAL(4, 1) NOT NULL DEFAULT 3.0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_cat_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // 2. locations_departments
    await db.query(`CREATE TABLE IF NOT EXISTS locations_departments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      branch_name VARCHAR(100) NOT NULL,
      department_name VARCHAR(100) NOT NULL,
      location_code VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_branch (branch_name),
      INDEX idx_dept (department_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // 3. assets
    await db.query(`CREATE TABLE IF NOT EXISTS assets (
      id VARCHAR(36) PRIMARY KEY,
      asset_tag VARCHAR(50) NOT NULL UNIQUE,
      serial_number VARCHAR(100),
      name VARCHAR(150) NOT NULL,
      category_id INT NOT NULL,
      model_specs TEXT,
      status ENUM(
        'Available (In Stock)',
        'Assigned',
        'In Repair / Maintenance',
        'Retired / Disposed',
        'Lost / Stolen'
      ) NOT NULL DEFAULT 'Available (In Stock)',
      condition_status ENUM('New', 'Good', 'Fair', 'Damaged') NOT NULL DEFAULT 'Good',
      location_id INT,
      assigned_to_name VARCHAR(150),
      assigned_to_emp_id VARCHAR(50),
      purchase_date DATE NOT NULL,
      purchase_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      salvage_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      warranty_expiry DATE,
      supplier_name VARCHAR(150),
      invoice_ref VARCHAR(100),
      notes TEXT,
      is_archived TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_assets_tag (asset_tag),
      INDEX idx_assets_status (status),
      INDEX idx_assets_cat (category_id),
      INDEX idx_assets_loc (location_id),
      INDEX idx_assets_warranty (warranty_expiry),
      INDEX idx_assets_archived (is_archived)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // 4. asset_assignment_logs
    await db.query(`CREATE TABLE IF NOT EXISTS asset_assignment_logs (
      id VARCHAR(36) PRIMARY KEY,
      asset_id VARCHAR(36) NOT NULL,
      action_type ENUM('CHECK_OUT', 'CHECK_IN', 'TRANSFER', 'STATUS_CHANGE') NOT NULL,
      previous_custodian VARCHAR(150),
      new_custodian VARCHAR(150),
      location_id INT,
      condition_on_action ENUM('New', 'Good', 'Fair', 'Damaged') DEFAULT 'Good',
      performed_by VARCHAR(150) NOT NULL,
      action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      remarks TEXT,
      INDEX idx_assign_asset (asset_id),
      INDEX idx_assign_date (action_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // 5. asset_maintenance_logs
    await db.query(`CREATE TABLE IF NOT EXISTS asset_maintenance_logs (
      id VARCHAR(36) PRIMARY KEY,
      asset_id VARCHAR(36) NOT NULL,
      issue_description TEXT NOT NULL,
      vendor_or_technician VARCHAR(150) NOT NULL,
      cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      start_date DATE NOT NULL,
      completion_date DATE,
      status ENUM('OPEN', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'OPEN',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_maint_asset (asset_id),
      INDEX idx_maint_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // Check if initial categories exist
    const [catCount]: any = await db.query('SELECT COUNT(*) as c FROM asset_categories');
    if (catCount[0].c === 0) {
      await db.query(`INSERT INTO asset_categories (id, name, type, depreciation_years) VALUES
        (1, 'Laptops & Mobile Workstations', 'IT_ASSET', 3.0),
        (2, 'Desktop Terminals & AIOs', 'IT_ASSET', 4.0),
        (3, 'Enterprise Servers & Storage (NAS/SAN)', 'IT_ASSET', 5.0),
        (4, 'Network Switches, Routers & Firewalls', 'IT_ASSET', 5.0),
        (5, 'Medical Imaging & Clinical Diagnostic', 'FIXED_ASSET', 7.0),
        (6, 'Office Furniture & Workstation Ergonomics', 'FIXED_ASSET', 10.0),
        (7, 'Uninterruptible Power Supplies (UPS & Genset)', 'FIXED_ASSET', 5.0),
        (8, 'Security, Biometric & CCTV Systems', 'IT_ASSET', 4.0)`);
    }

    // Check if initial locations exist
    const [locCount]: any = await db.query('SELECT COUNT(*) as c FROM locations_departments');
    if (locCount[0].c === 0) {
      await db.query(`INSERT INTO locations_departments (id, branch_name, department_name, location_code) VALUES
        (1, 'Main Hospital (K1)', 'Information Technology & Data Center', 'K1-IT-DC01'),
        (2, 'Main Hospital (K1)', 'Emergency & Inpatient Admissions', 'K1-ADM-01'),
        (3, 'Main Hospital (K1)', 'Radiology & Imaging Suite', 'K1-RAD-02'),
        (4, 'North Clinic (K2)', 'Outpatient Consultation (OPD)', 'K2-OPD-101'),
        (5, 'North Clinic (K2)', 'Pharmacy & Dispensing', 'K2-PHARM-01'),
        (6, 'South Clinic (KG)', 'Clinical Laboratory & Pathology', 'KG-LAB-01'),
        (7, 'South Clinic (KG)', 'Executive & Administrative Office', 'KG-ADMIN-02')`);
    }

    // Check if enterprise assets exist
    const [assetCount]: any = await db.query('SELECT COUNT(*) as c FROM assets');
    if (assetCount[0].c === 0) {
      await seedEnterpriseAssets(db);
    }
  } catch (err: any) {
    console.error('[Asset Control Tables Init]:', err.message);
  }
}

async function seedEnterpriseAssets(db: any) {
  try {
    const initialAssets = [
      {
        id: 'a1000000-0000-0000-0000-000000000001',
        asset_tag: 'AST-IT-2026-0001',
        serial_number: 'DL-R750-89102-KH',
        name: 'Dell PowerEdge R750 Hospital PACS & HIS Database Server',
        category_id: 3,
        model_specs: '2x Intel Xeon Gold 6338, 256GB DDR4 ECC, 8x 3.84TB NVMe SSD RAID-10, Dual 10GbE SFP+',
        status: 'Available (In Stock)',
        condition_status: 'New',
        location_id: 1,
        assigned_to_name: 'Sokha Chan (IT SysAdmin)',
        assigned_to_emp_id: 'EMP-IT-004',
        purchase_date: '2024-03-15',
        purchase_cost: 18500.00,
        salvage_value: 1850.00,
        warranty_expiry: '2029-03-15',
        supplier_name: 'Dell Technologies Asia / Anana Computer',
        invoice_ref: 'INV-DELL-2024-889',
        notes: 'Primary hypervisor for virtualized HIS production database cluster. High redundancy.'
      },
      {
        id: 'a1000000-0000-0000-0000-000000000002',
        asset_tag: 'AST-IT-2026-0002',
        serial_number: 'C9300-48P-9921',
        name: 'Cisco Catalyst 9300 48-Port PoE+ Core Switch',
        category_id: 4,
        model_specs: '48x 1GbE PoE+ Ports (740W budget), 4x 10GbE Uplinks, Network Advantage StackWise-480',
        status: 'Available (In Stock)',
        condition_status: 'Good',
        location_id: 1,
        assigned_to_name: 'Vannak Seng (Network Eng)',
        assigned_to_emp_id: 'EMP-IT-007',
        purchase_date: '2023-08-20',
        purchase_cost: 5200.00,
        salvage_value: 500.00,
        warranty_expiry: '2028-08-20',
        supplier_name: 'Cisco Systems Cambodia',
        invoice_ref: 'INV-CSCO-2023-411',
        notes: 'Main core switch rack in Server Room K1. Connects all floor distribution switches.'
      },
      {
        id: 'a1000000-0000-0000-0000-000000000003',
        asset_tag: 'AST-IT-2026-0003',
        serial_number: 'LEN-T14G4-1029',
        name: 'Lenovo ThinkPad T14 Gen 4 Core i7 Staff Laptop',
        category_id: 1,
        model_specs: 'Intel Core i7-1365U vPro, 32GB RAM, 1TB NVMe Gen4, 14" WUXGA Anti-Glare, Windows 11 Pro',
        status: 'Assigned',
        condition_status: 'Good',
        location_id: 2,
        assigned_to_name: 'Dr. Rithy Vuth (Head of Admissions)',
        assigned_to_emp_id: 'EMP-MED-012',
        purchase_date: '2024-01-10',
        purchase_cost: 1650.00,
        salvage_value: 150.00,
        warranty_expiry: '2027-01-10',
        supplier_name: 'Lenovo Enterprise Distributor',
        invoice_ref: 'INV-LEN-2024-055',
        notes: 'Assigned for emergency department patient admission triaging and mobile rounds.'
      },
      {
        id: 'a1000000-0000-0000-0000-000000000004',
        asset_tag: 'AST-IT-2026-0004',
        serial_number: 'HP-ELITEDESK-800G9',
        name: 'HP EliteDesk 800 G9 Outpatient Consulting Station',
        category_id: 2,
        model_specs: 'Intel Core i5-13500, 16GB DDR5, 512GB SSD, Dual HP 24" IPS Monitors + Barcode Scanner',
        status: 'Assigned',
        condition_status: 'Good',
        location_id: 4,
        assigned_to_name: 'Dr. Socheata Meas (Consultant Physician)',
        assigned_to_emp_id: 'EMP-MED-044',
        purchase_date: '2023-11-05',
        purchase_cost: 1350.00,
        salvage_value: 100.00,
        warranty_expiry: '2026-11-05',
        supplier_name: 'HP Cambodia Solutions',
        invoice_ref: 'INV-HP-2023-921',
        notes: 'Dedicated outpatient workstation running eHospital HIS clinical consultation terminal.'
      },
      {
        id: 'a1000000-0000-0000-0000-000000000005',
        asset_tag: 'AST-FA-2026-0005',
        serial_number: 'GE-LOGIQ-E9-001',
        name: 'GE Logiq E9 XDclear Color Doppler Ultrasound Console',
        category_id: 5,
        model_specs: 'High-resolution medical imaging system with matrix cardiac and convex abdominal probes',
        status: 'Available (In Stock)',
        condition_status: 'Good',
        location_id: 3,
        assigned_to_name: 'Radiology Department Team',
        assigned_to_emp_id: 'EMP-RAD-001',
        purchase_date: '2022-06-18',
        purchase_cost: 42000.00,
        salvage_value: 5000.00,
        warranty_expiry: '2027-06-18',
        supplier_name: 'GE Healthcare Indochina',
        invoice_ref: 'INV-GE-2022-1082',
        notes: 'Certified diagnostic ultrasound unit in Radiology Suite K1-RAD-02. Annual calibration done.'
      },
      {
        id: 'a1000000-0000-0000-0000-000000000006',
        asset_tag: 'AST-IT-2026-0006',
        serial_number: 'AP-SRT5KXLI-2023',
        name: 'APC Smart-UPS On-Line SRT 5000VA 230V Medical Grade UPS',
        category_id: 7,
        model_specs: '5000VA/4500W, Extended Run Rack/Tower 3U, SmartSlot Card AP9631 Network Management',
        status: 'In Repair / Maintenance',
        condition_status: 'Fair',
        location_id: 1,
        assigned_to_name: 'Central IT Store',
        assigned_to_emp_id: 'EMP-IT-001',
        purchase_date: '2021-09-12',
        purchase_cost: 4800.00,
        salvage_value: 400.00,
        warranty_expiry: '2024-09-12',
        supplier_name: 'Schneider Electric Partner',
        invoice_ref: 'INV-SCH-2021-399',
        notes: 'Currently scheduled for internal battery pack replacement module (RBC140) by certified vendor.'
      }
    ];

    for (const a of initialAssets) {
      await db.query(
        `INSERT INTO assets (
          id, asset_tag, serial_number, name, category_id, model_specs,
          status, condition_status, location_id, assigned_to_name, assigned_to_emp_id,
          purchase_date, purchase_cost, salvage_value, warranty_expiry,
          supplier_name, invoice_ref, notes, is_archived
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [
          a.id, a.asset_tag, a.serial_number, a.name, a.category_id, a.model_specs,
          a.status, a.condition_status, a.location_id, a.assigned_to_name, a.assigned_to_emp_id,
          a.purchase_date, a.purchase_cost, a.salvage_value, a.warranty_expiry,
          a.supplier_name, a.invoice_ref, a.notes
        ]
      );

      // Create initial custody log
      await db.query(
        `INSERT INTO asset_assignment_logs (
          id, asset_id, action_type, previous_custodian, new_custodian, location_id, condition_on_action, performed_by, remarks
        ) VALUES (?, ?, 'CHECK_IN', NULL, ?, ?, ?, 'Head of IT', 'Initial inventory intake and system registration')
        ON DUPLICATE KEY UPDATE performed_by=VALUES(performed_by)`,
        [crypto.randomUUID(), a.id, a.assigned_to_name, a.location_id, a.condition_status]
      );
    }

    // Add initial maintenance ticket for the UPS asset
    await db.query(
      `INSERT INTO asset_maintenance_logs (
        id, asset_id, issue_description, vendor_or_technician, cost, start_date, completion_date, status
      ) VALUES (?, 'a1000000-0000-0000-0000-000000000006', ?, ?, '2026-10-18', NULL, 'IN_PROGRESS')
      ON DUPLICATE KEY UPDATE vendor_or_technician=VALUES(vendor_or_technician)`,
      [
        crypto.randomUUID(),
        'UPS Battery Cartridge Depletion (Error Code 166). Procured 2x OEM replacement battery packs (RBC140).',
        'APC Certified Service Center (Schneider Electric Cambodia)',
        420.00
      ]
    );

    console.log('[Asset Control]: Seeded initial enterprise assets successfully.');
  } catch (err: any) {
    console.error('[Asset Control Seed Error]:', err.message);
  }
}

// -------------------------------------------------------------------------
// Express REST API Route Handler
// -------------------------------------------------------------------------
export function setupAssetRoutes(app: Express, authenticateToken: any, getDb: () => any) {
  // Ensure tables exist on boot
  const db = getDb();
  initAssetTables(db).catch(e => console.warn('[Asset Control Boot]:', e.message));

  // --- 1. GET ASSETS SUMMARY (Head of IT KPI Dashboard) ---
  app.get('/api/assets/summary', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const [assets]: any = await db.query(`
        SELECT a.*, c.name as category_name, c.type as category_type, c.depreciation_years,
               l.branch_name, l.department_name
        FROM assets a
        LEFT JOIN asset_categories c ON a.category_id = c.id
        LEFT JOIN locations_departments l ON a.location_id = l.id
        WHERE a.is_archived = 0
      `);

      let totalActiveAssets = 0;
      let totalPurchaseCost = 0;
      let totalCurrentBookValue = 0;
      let totalMonthlyDepreciation = 0;
      let inStockCount = 0;
      let assignedCount = 0;
      let underRepairCount = 0;
      let retiredCount = 0;
      let lostCount = 0;

      let warrantyExpiring30 = 0;
      let warrantyExpiring60 = 0;
      let warrantyExpiring90 = 0;
      let warrantyExpired = 0;

      const categoryMap: Record<string, { count: number; totalCost: number; currentBookValue: number }> = {};
      const branchMap: Record<string, { count: number; totalCost: number }> = {};

      const now = new Date();
      const msPerDay = 86400000;

      assets.forEach((a: any) => {
        totalActiveAssets += 1;
        const cost = parseFloat(a.purchase_cost) || 0;
        totalPurchaseCost += cost;

        const dep = calculateDepreciation(
          cost,
          a.salvage_value,
          a.depreciation_years || 3,
          a.purchase_date
        );
        totalCurrentBookValue += dep.currentBookValue;
        totalMonthlyDepreciation += dep.monthlyDepreciation;

        if (a.status === 'Available (In Stock)') inStockCount += 1;
        else if (a.status === 'Assigned') assignedCount += 1;
        else if (a.status === 'In Repair / Maintenance') underRepairCount += 1;
        else if (a.status === 'Retired / Disposed') retiredCount += 1;
        else if (a.status === 'Lost / Stolen') lostCount += 1;

        // Warranty calculations
        if (a.warranty_expiry) {
          const wDate = new Date(a.warranty_expiry);
          if (!isNaN(wDate.getTime())) {
            const diffDays = Math.ceil((wDate.getTime() - now.getTime()) / msPerDay);
            if (diffDays < 0) warrantyExpired += 1;
            else if (diffDays <= 30) warrantyExpiring30 += 1;
            else if (diffDays <= 60) warrantyExpiring60 += 1;
            else if (diffDays <= 90) warrantyExpiring90 += 1;
          }
        }

        // Category stats
        const catName = a.category_name || 'Uncategorized';
        if (!categoryMap[catName]) {
          categoryMap[catName] = { count: 0, totalCost: 0, currentBookValue: 0 };
        }
        categoryMap[catName].count += 1;
        categoryMap[catName].totalCost += cost;
        categoryMap[catName].currentBookValue += dep.currentBookValue;

        // Branch stats
        const branch = a.branch_name || 'Unassigned';
        if (!branchMap[branch]) {
          branchMap[branch] = { count: 0, totalCost: 0 };
        }
        branchMap[branch].count += 1;
        branchMap[branch].totalCost += cost;
      });

      res.json({
        totalActiveAssets,
        totalPurchaseCost: Math.round(totalPurchaseCost * 100) / 100,
        totalCurrentBookValue: Math.round(totalCurrentBookValue * 100) / 100,
        totalMonthlyDepreciation: Math.round(totalMonthlyDepreciation * 100) / 100,
        statusBreakdown: {
          inStock: inStockCount,
          assigned: assignedCount,
          underRepair: underRepairCount,
          retired: retiredCount,
          lost: lostCount
        },
        warrantyAlerts: {
          expiring30: warrantyExpiring30,
          expiring60: warrantyExpiring60,
          expiring90: warrantyExpiring90,
          expired: warrantyExpired
        },
        categories: Object.entries(categoryMap).map(([name, val]) => ({
          name,
          ...val
        })),
        branches: Object.entries(branchMap).map(([name, val]) => ({
          name,
          ...val
        }))
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 2. GET ASSETS LIST (Search, Multi-Filter, Sorting, Straight-Line Metrics) ---
  app.get('/api/assets', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const {
        search,
        status,
        category_id,
        location_id,
        type,
        warranty_alert,
        include_archived
      } = req.query as any;

      let sql = `
        SELECT a.*, c.name as category_name, c.type as category_type, c.depreciation_years,
               l.branch_name, l.department_name, l.location_code
        FROM assets a
        LEFT JOIN asset_categories c ON a.category_id = c.id
        LEFT JOIN locations_departments l ON a.location_id = l.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (include_archived !== '1' && include_archived !== 'true') {
        sql += ' AND a.is_archived = 0';
      }

      if (status && status !== 'All Statuses') {
        sql += ' AND a.status = ?';
        params.push(status);
      }

      if (category_id && category_id !== 'All Categories') {
        sql += ' AND a.category_id = ?';
        params.push(parseInt(category_id, 10));
      }

      if (location_id && location_id !== 'All Locations') {
        sql += ' AND a.location_id = ?';
        params.push(parseInt(location_id, 10));
      }

      if (type && type !== 'ALL') {
        sql += ' AND c.type = ?';
        params.push(type);
      }

      if (search && search.trim()) {
        const q = `%${search.trim()}%`;
        sql += ` AND (
          a.asset_tag LIKE ? OR
          a.name LIKE ? OR
          a.serial_number LIKE ? OR
          a.assigned_to_name LIKE ? OR
          a.assigned_to_emp_id LIKE ? OR
          a.model_specs LIKE ? OR
          a.supplier_name LIKE ? OR
          a.invoice_ref LIKE ?
        )`;
        params.push(q, q, q, q, q, q, q, q);
      }

      sql += ' ORDER BY a.created_at DESC';

      const [rows]: any = await db.query(sql, params);

      // Enhance with depreciation metrics & warranty status
      const now = new Date();
      const msPerDay = 86400000;

      let enhanced = rows.map((r: any) => {
        const dep = calculateDepreciation(
          r.purchase_cost,
          r.salvage_value,
          r.depreciation_years || 3,
          r.purchase_date
        );

        let warrantyDaysLeft: number | null = null;
        let warrantyStatus: 'valid' | 'expiring_30' | 'expiring_60' | 'expiring_90' | 'expired' | 'none' = 'none';

        if (r.warranty_expiry) {
          const wDate = new Date(r.warranty_expiry);
          if (!isNaN(wDate.getTime())) {
            warrantyDaysLeft = Math.ceil((wDate.getTime() - now.getTime()) / msPerDay);
            if (warrantyDaysLeft < 0) warrantyStatus = 'expired';
            else if (warrantyDaysLeft <= 30) warrantyStatus = 'expiring_30';
            else if (warrantyDaysLeft <= 60) warrantyStatus = 'expiring_60';
            else if (warrantyDaysLeft <= 90) warrantyStatus = 'expiring_90';
            else warrantyStatus = 'valid';
          }
        }

        return {
          ...r,
          purchase_cost: parseFloat(r.purchase_cost) || 0,
          salvage_value: parseFloat(r.salvage_value) || 0,
          depreciation: dep,
          warranty_days_left: warrantyDaysLeft,
          warranty_status: warrantyStatus
        };
      });

      // Filter by warranty_alert if requested
      if (warranty_alert === '30') {
        enhanced = enhanced.filter((a: any) => a.warranty_days_left !== null && a.warranty_days_left >= 0 && a.warranty_days_left <= 30);
      } else if (warranty_alert === '60') {
        enhanced = enhanced.filter((a: any) => a.warranty_days_left !== null && a.warranty_days_left >= 0 && a.warranty_days_left <= 60);
      } else if (warranty_alert === '90') {
        enhanced = enhanced.filter((a: any) => a.warranty_days_left !== null && a.warranty_days_left >= 0 && a.warranty_days_left <= 90);
      } else if (warranty_alert === 'expired') {
        enhanced = enhanced.filter((a: any) => a.warranty_days_left !== null && a.warranty_days_left < 0);
      }

      res.json(enhanced);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 3. GET NEXT ASSET TAG PREVIEW (Auto-Increment / Type-Aware) ---
  app.get('/api/assets/next-tag', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const type = (req.query.type as string) || 'IT_ASSET';
      const year = new Date().getFullYear();
      const prefix = type === 'FIXED_ASSET' ? `AST-FA-${year}-` : `AST-IT-${year}-`;

      const [rows]: any = await db.query(
        'SELECT asset_tag FROM assets WHERE asset_tag LIKE ? ORDER BY asset_tag DESC LIMIT 1',
        [`${prefix}%`]
      );

      let nextNum = 1;
      if (rows.length > 0) {
        const lastTag = rows[0].asset_tag;
        const parts = lastTag.split('-');
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) nextNum = lastSeq + 1;
      }

      const nextTag = `${prefix}${String(nextNum).padStart(4, '0')}`;
      res.json({ nextTag, prefix });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 4. GET SINGLE ASSET (Details + Complete Custody History + Maintenance Logs) ---
  app.get('/api/assets/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const [rows]: any = await db.query(`
        SELECT a.*, c.name as category_name, c.type as category_type, c.depreciation_years,
               l.branch_name, l.department_name, l.location_code
        FROM assets a
        LEFT JOIN asset_categories c ON a.category_id = c.id
        LEFT JOIN locations_departments l ON a.location_id = l.id
        WHERE a.id = ?
      `, [req.params.id]);

      if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
      const asset = rows[0];

      // Fetch assignment audit logs
      const [assignmentLogs]: any = await db.query(`
        SELECT l.*, d.branch_name, d.department_name
        FROM asset_assignment_logs l
        LEFT JOIN locations_departments d ON l.location_id = d.id
        WHERE l.asset_id = ?
        ORDER BY l.action_date DESC
      `, [req.params.id]);

      // Fetch maintenance logs
      const [maintenanceLogs]: any = await db.query(`
        SELECT * FROM asset_maintenance_logs
        WHERE asset_id = ?
        ORDER BY start_date DESC, created_at DESC
      `, [req.params.id]);

      const dep = calculateDepreciation(
        asset.purchase_cost,
        asset.salvage_value,
        asset.depreciation_years || 3,
        asset.purchase_date
      );

      res.json({
        ...asset,
        purchase_cost: parseFloat(asset.purchase_cost) || 0,
        salvage_value: parseFloat(asset.salvage_value) || 0,
        depreciation: dep,
        assignment_logs: assignmentLogs,
        maintenance_logs: maintenanceLogs
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 5. CREATE ASSET (With Duplicate Check & Initial Audit Log within Transaction) ---
  app.post('/api/assets', authenticateToken, async (req: Request, res: Response) => {
    const db = getDb();
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const {
        asset_tag,
        serial_number,
        name,
        category_id,
        model_specs,
        status = 'Available (In Stock)',
        condition_status = 'New',
        location_id,
        assigned_to_name,
        assigned_to_emp_id,
        purchase_date,
        purchase_cost,
        salvage_value = 0,
        warranty_expiry,
        supplier_name,
        invoice_ref,
        notes
      } = req.body;

      if (!asset_tag || !name || !purchase_date) {
        await conn.rollback();
        return res.status(400).json({ error: 'Asset Tag, Name, and Purchase Date are required' });
      }

      // Check unique asset_tag
      const [existing]: any = await conn.query('SELECT id FROM assets WHERE asset_tag = ?', [asset_tag.trim()]);
      if (existing.length > 0) {
        await conn.rollback();
        return res.status(400).json({ error: `Asset Tag "${asset_tag}" already exists in the system` });
      }

      const id = crypto.randomUUID();
      await conn.query(`
        INSERT INTO assets (
          id, asset_tag, serial_number, name, category_id, model_specs,
          status, condition_status, location_id, assigned_to_name, assigned_to_emp_id,
          purchase_date, purchase_cost, salvage_value, warranty_expiry,
          supplier_name, invoice_ref, notes, is_archived
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `, [
        id,
        asset_tag.trim(),
        serial_number?.trim() || null,
        name.trim(),
        parseInt(category_id, 10) || 1,
        model_specs?.trim() || null,
        status,
        condition_status,
        location_id ? parseInt(location_id, 10) : null,
        assigned_to_name?.trim() || null,
        assigned_to_emp_id?.trim() || null,
        purchase_date,
        parseFloat(purchase_cost) || 0.00,
        parseFloat(salvage_value) || 0.00,
        warranty_expiry || null,
        supplier_name?.trim() || null,
        invoice_ref?.trim() || null,
        notes?.trim() || null
      ]);

      // Initial assignment log
      const performedBy = (req as any).user?.name || (req as any).user?.email || 'Head of IT';
      await conn.query(`
        INSERT INTO asset_assignment_logs (
          id, asset_id, action_type, previous_custodian, new_custodian, location_id, condition_on_action, performed_by, remarks
        ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?)
      `, [
        crypto.randomUUID(),
        id,
        status === 'Assigned' ? 'CHECK_OUT' : 'CHECK_IN',
        assigned_to_name?.trim() || 'IT Inventory Storage',
        location_id ? parseInt(location_id, 10) : null,
        condition_status,
        performedBy,
        'Asset registered into system catalog'
      ]);

      await conn.commit();
      res.json({ success: true, id, asset_tag });
    } catch (e: any) {
      await conn.rollback();
      res.status(500).json({ error: e.message });
    } finally {
      conn.release();
    }
  });

  // --- 6. UPDATE ASSET (With Automatic Audit History on Custodian/Status Change) ---
  app.put('/api/assets/:id', authenticateToken, async (req: Request, res: Response) => {
    const db = getDb();
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existingRows]: any = await conn.query('SELECT * FROM assets WHERE id = ?', [req.params.id]);
      if (existingRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'Asset not found' });
      }
      const old = existingRows[0];

      const {
        asset_tag,
        serial_number,
        name,
        category_id,
        model_specs,
        status,
        condition_status,
        location_id,
        assigned_to_name,
        assigned_to_emp_id,
        purchase_date,
        purchase_cost,
        salvage_value,
        warranty_expiry,
        supplier_name,
        invoice_ref,
        notes,
        audit_remarks
      } = req.body;

      // Duplicate check if asset_tag changed
      if (asset_tag && asset_tag.trim() !== old.asset_tag) {
        const [dup]: any = await conn.query('SELECT id FROM assets WHERE asset_tag = ? AND id != ?', [asset_tag.trim(), req.params.id]);
        if (dup.length > 0) {
          await conn.rollback();
          return res.status(400).json({ error: `Asset Tag "${asset_tag}" is already in use by another asset` });
        }
      }

      await conn.query(`
        UPDATE assets SET
          asset_tag = ?, serial_number = ?, name = ?, category_id = ?, model_specs = ?,
          status = ?, condition_status = ?, location_id = ?, assigned_to_name = ?, assigned_to_emp_id = ?,
          purchase_date = ?, purchase_cost = ?, salvage_value = ?, warranty_expiry = ?,
          supplier_name = ?, invoice_ref = ?, notes = ?
        WHERE id = ?
      `, [
        (asset_tag || old.asset_tag).trim(),
        serial_number !== undefined ? serial_number?.trim() || null : old.serial_number,
        (name || old.name).trim(),
        category_id ? parseInt(category_id, 10) : old.category_id,
        model_specs !== undefined ? model_specs?.trim() || null : old.model_specs,
        status || old.status,
        condition_status || old.condition_status,
        location_id !== undefined ? (location_id ? parseInt(location_id, 10) : null) : old.location_id,
        assigned_to_name !== undefined ? assigned_to_name?.trim() || null : old.assigned_to_name,
        assigned_to_emp_id !== undefined ? assigned_to_emp_id?.trim() || null : old.assigned_to_emp_id,
        purchase_date || old.purchase_date,
        purchase_cost !== undefined ? parseFloat(purchase_cost) || 0 : old.purchase_cost,
        salvage_value !== undefined ? parseFloat(salvage_value) || 0 : old.salvage_value,
        warranty_expiry !== undefined ? warranty_expiry || null : old.warranty_expiry,
        supplier_name !== undefined ? supplier_name?.trim() || null : old.supplier_name,
        invoice_ref !== undefined ? invoice_ref?.trim() || null : old.invoice_ref,
        notes !== undefined ? notes?.trim() || null : old.notes,
        req.params.id
      ]);

      // If custodian or status or location changed, insert audit trail record
      const custodianChanged = (assigned_to_name || '') !== (old.assigned_to_name || '');
      const statusChanged = status && status !== old.status;
      const locationChanged = location_id && String(location_id) !== String(old.location_id);

      if (custodianChanged || statusChanged || locationChanged) {
        let actionType = 'STATUS_CHANGE';
        if (custodianChanged) {
          actionType = assigned_to_name ? 'CHECK_OUT' : 'CHECK_IN';
        } else if (locationChanged) {
          actionType = 'TRANSFER';
        }

        const performedBy = (req as any).user?.name || (req as any).user?.email || 'Head of IT';
        await conn.query(`
          INSERT INTO asset_assignment_logs (
            id, asset_id, action_type, previous_custodian, new_custodian, location_id, condition_on_action, performed_by, remarks
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          crypto.randomUUID(),
          req.params.id,
          actionType,
          old.assigned_to_name,
          assigned_to_name || 'IT Inventory Storage',
          location_id ? parseInt(location_id, 10) : old.location_id,
          condition_status || old.condition_status,
          performedBy,
          audit_remarks || `Updated: ${[custodianChanged ? 'Custodian' : '', statusChanged ? 'Status' : '', locationChanged ? 'Location' : ''].filter(Boolean).join(', ')}`
        ]);
      }

      await conn.commit();
      res.json({ success: true, message: 'Asset updated successfully' });
    } catch (e: any) {
      await conn.rollback();
      res.status(500).json({ error: e.message });
    } finally {
      conn.release();
    }
  });

  // --- 7. DEDICATED RAPID CHECK-OUT / CHECK-IN / TRANSFER WORKFLOW ---
  app.post('/api/assets/:id/assign', authenticateToken, async (req: Request, res: Response) => {
    const db = getDb();
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existingRows]: any = await conn.query('SELECT * FROM assets WHERE id = ?', [req.params.id]);
      if (existingRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'Asset not found' });
      }
      const asset = existingRows[0];

      const {
        action_type, // 'CHECK_OUT' | 'CHECK_IN' | 'TRANSFER'
        assigned_to_name,
        assigned_to_emp_id,
        location_id,
        condition_on_action = 'Good',
        remarks
      } = req.body;

      let newStatus = asset.status;
      let newAssigneeName = asset.assigned_to_name;
      let newAssigneeEmpId = asset.assigned_to_emp_id;
      let newLocationId = location_id ? parseInt(location_id, 10) : asset.location_id;

      if (action_type === 'CHECK_OUT') {
        newStatus = 'Assigned';
        newAssigneeName = assigned_to_name?.trim() || null;
        newAssigneeEmpId = assigned_to_emp_id?.trim() || null;
      } else if (action_type === 'CHECK_IN') {
        newStatus = 'Available (In Stock)';
        newAssigneeName = null;
        newAssigneeEmpId = null;
      } else if (action_type === 'TRANSFER') {
        newAssigneeName = assigned_to_name?.trim() || asset.assigned_to_name;
        newAssigneeEmpId = assigned_to_emp_id?.trim() || asset.assigned_to_emp_id;
      }

      // Update asset record
      await conn.query(`
        UPDATE assets SET
          status = ?,
          condition_status = ?,
          assigned_to_name = ?,
          assigned_to_emp_id = ?,
          location_id = ?
        WHERE id = ?
      `, [newStatus, condition_on_action, newAssigneeName, newAssigneeEmpId, newLocationId, req.params.id]);

      // Write immutable audit trail log
      const performedBy = (req as any).user?.name || (req as any).user?.email || 'Head of IT';
      await conn.query(`
        INSERT INTO asset_assignment_logs (
          id, asset_id, action_type, previous_custodian, new_custodian, location_id, condition_on_action, performed_by, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        crypto.randomUUID(),
        req.params.id,
        action_type,
        asset.assigned_to_name || 'IT Inventory Storage',
        newAssigneeName || 'IT Inventory Storage',
        newLocationId,
        condition_on_action,
        performedBy,
        remarks || `${action_type} executed by ${performedBy}`
      ]);

      await conn.commit();
      res.json({
        success: true,
        action_type,
        new_status: newStatus,
        assigned_to: newAssigneeName
      });
    } catch (e: any) {
      await conn.rollback();
      res.status(500).json({ error: e.message });
    } finally {
      conn.release();
    }
  });

  // --- 8. LOG MAINTENANCE OR REPAIR EVENT ---
  app.post('/api/assets/:id/maintenance', authenticateToken, async (req: Request, res: Response) => {
    const db = getDb();
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const {
        issue_description,
        vendor_or_technician,
        cost = 0,
        start_date = new Date().toISOString().slice(0, 10),
        completion_date,
        status = 'IN_PROGRESS',
        update_asset_status = true
      } = req.body;

      if (!issue_description || !vendor_or_technician) {
        await conn.rollback();
        return res.status(400).json({ error: 'Issue description and vendor/technician are required' });
      }

      const maintId = crypto.randomUUID();
      await conn.query(`
        INSERT INTO asset_maintenance_logs (
          id, asset_id, issue_description, vendor_or_technician, cost, start_date, completion_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        maintId,
        req.params.id,
        issue_description.trim(),
        vendor_or_technician.trim(),
        parseFloat(cost) || 0,
        start_date,
        completion_date || null,
        status
      ]);

      // If requested, update the asset status
      if (update_asset_status) {
        if (status === 'OPEN' || status === 'IN_PROGRESS') {
          await conn.query(
            "UPDATE assets SET status = 'In Repair / Maintenance' WHERE id = ?",
            [req.params.id]
          );
        } else if (status === 'COMPLETED') {
          await conn.query(
            "UPDATE assets SET status = 'Available (In Stock)' WHERE id = ?",
            [req.params.id]
          );
        }
      }

      await conn.commit();
      res.json({ success: true, maintId });
    } catch (e: any) {
      await conn.rollback();
      res.status(500).json({ error: e.message });
    } finally {
      conn.release();
    }
  });

  // --- 9. UPDATE MAINTENANCE EVENT STATUS ---
  app.put('/api/assets/maintenance/:maintId', authenticateToken, async (req: Request, res: Response) => {
    const db = getDb();
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const { status, completion_date, cost, remarks } = req.body;
      const [maintRows]: any = await conn.query('SELECT * FROM asset_maintenance_logs WHERE id = ?', [req.params.maintId]);
      if (maintRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'Maintenance ticket not found' });
      }
      const ticket = maintRows[0];

      await conn.query(`
        UPDATE asset_maintenance_logs SET
          status = ?,
          completion_date = ?,
          cost = ?
        WHERE id = ?
      `, [
        status || ticket.status,
        completion_date || (status === 'COMPLETED' ? new Date().toISOString().slice(0, 10) : ticket.completion_date),
        cost !== undefined ? parseFloat(cost) || 0 : ticket.cost,
        req.params.maintId
      ]);

      if (status === 'COMPLETED') {
        await conn.query(
          "UPDATE assets SET status = 'Available (In Stock)' WHERE id = ? AND status = 'In Repair / Maintenance'",
          [ticket.asset_id]
        );
      }

      await conn.commit();
      res.json({ success: true });
    } catch (e: any) {
      await conn.rollback();
      res.status(500).json({ error: e.message });
    } finally {
      conn.release();
    }
  });

  // --- 10. SOFT-DELETE (ARCHIVE / DISPOSE) ASSET ---
  app.delete('/api/assets/:id', authenticateToken, async (req: Request, res: Response) => {
    const db = getDb();
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existing]: any = await conn.query('SELECT * FROM assets WHERE id = ?', [req.params.id]);
      if (existing.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'Asset not found' });
      }
      const asset = existing[0];

      // Mark archived and status to 'Retired / Disposed'
      await conn.query(`
        UPDATE assets SET
          is_archived = 1,
          status = 'Retired / Disposed'
        WHERE id = ?
      `, [req.params.id]);

      const performedBy = (req as any).user?.name || (req as any).user?.email || 'Head of IT';
      await conn.query(`
        INSERT INTO asset_assignment_logs (
          id, asset_id, action_type, previous_custodian, new_custodian, condition_on_action, performed_by, remarks
        ) VALUES (?, ?, 'STATUS_CHANGE', ?, 'Archived / Decommissioned', 'Fair', ?, 'Asset soft-deleted and retired from service')
      `, [
        crypto.randomUUID(),
        req.params.id,
        asset.assigned_to_name,
        performedBy
      ]);

      await conn.commit();
      res.json({ success: true, message: 'Asset archived and retired from fleet' });
    } catch (e: any) {
      await conn.rollback();
      res.status(500).json({ error: e.message });
    } finally {
      conn.release();
    }
  });

  // --- 11. ASSET CATEGORIES CRUD ---
  app.get('/api/asset-categories', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const [rows] = await db.query(`
        SELECT c.*, COUNT(a.id) as asset_count
        FROM asset_categories c
        LEFT JOIN assets a ON c.id = a.category_id AND a.is_archived = 0
        GROUP BY c.id
        ORDER BY c.type ASC, c.name ASC
      `);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/asset-categories', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { name, type = 'IT_ASSET', depreciation_years = 3.0 } = req.body;
      if (!name) return res.status(400).json({ error: 'Category name is required' });

      const [result]: any = await db.query(
        'INSERT INTO asset_categories (name, type, depreciation_years) VALUES (?, ?, ?)',
        [name.trim(), type, parseFloat(depreciation_years) || 3.0]
      );
      res.json({ id: result.insertId, name, type, depreciation_years });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 12. ASSET LOCATIONS & DEPARTMENTS CRUD ---
  app.get('/api/asset-locations', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const [rows] = await db.query(`
        SELECT l.*, COUNT(a.id) as asset_count
        FROM locations_departments l
        LEFT JOIN assets a ON l.id = a.location_id AND a.is_archived = 0
        GROUP BY l.id
        ORDER BY l.branch_name ASC, l.department_name ASC
      `);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/asset-locations', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { branch_name, department_name, location_code } = req.body;
      if (!branch_name || !department_name) {
        return res.status(400).json({ error: 'Branch name and department name are required' });
      }

      const code = location_code || `${branch_name.slice(0, 2).toUpperCase()}-${department_name.slice(0, 3).toUpperCase()}`;
      const [result]: any = await db.query(
        'INSERT INTO locations_departments (branch_name, department_name, location_code) VALUES (?, ?, ?)',
        [branch_name.trim(), department_name.trim(), code]
      );
      res.json({ id: result.insertId, branch_name, department_name, location_code: code });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
