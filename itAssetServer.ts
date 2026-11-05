import { Express, Request, Response } from 'express';
import crypto from 'crypto';

export interface FixedAssetRecord {
  id: string;
  no?: number;
  bu_name: 'Khema Global' | 'Khema TK' | 'Khema BKK' | 'Sakal 2004';
  asset_code: string;
  asset_date: string;
  category: string;
  item_name: string;
  brand: string;
  model: string;
  serial_num: string;
  key_specification: string;
  supplier: string;
  room_name: string;
  floor: string;
  current_user: string;
  admin_password?: string;
  user_email?: string;
  hostname: string;
  ip_lan: string;
  ip_address_lan_secondary?: string;
  ip_address_wan?: string;
  issue_date?: string;
  purchase_date?: string;
  invoice_ref?: string;
  quantity: number;
  unit_price: number;
  before_dis_vat_price: number;
  grand_total: number;
  win_license?: string;
  ms_license?: string;
  ms_account_email?: string;
  ms_account_password?: string;
  remark?: string;
  status: 'Active' | 'In Repair' | 'Plan dispose' | 'Disposed' | 'Spare';
}

export interface AssetControlRecord {
  id: string;
  no?: number;
  bu_name: 'Khema Global' | 'Khema TK' | 'Khema BKK' | 'Sakal 2004';
  ac_code_cms: string;
  category: string;
  item_name: string;
  brand: string;
  model: string;
  serial_num: string;
  key_specification: string;
  supplier: string;
  room_name: string;
  floor: string;
  current_user: string;
  remark?: string;
  status: 'Active' | 'In Repair' | 'Plan dispose' | 'Disposed' | 'Missing';
}

export const FIXED_ASSET_CATEGORIES = [
  'COMPUTER',
  'LAPTOP',
  'Synology',
  'TV',
  'PRINTER',
  'UPS',
  'Swing Door',
  'Video Conference'
];

export const ASSET_CONTROL_CATEGORIES = [
  'PRINTER',
  'FINGERPRINT',
  'SERVER ROOM',
  'TV',
  'MOBILE PHONE',
  'BILL COUNTER',
  'PROJECTOR',
  'ICOM',
  'COMPUTER',
  'UPS',
  'CAMERA SECURITY',
  'WIFI'
];

export async function initItAssetTables(db: any) {
  try {
    // 1. Fixed Assets Table (31 columns + bu_name)
    await db.query(`CREATE TABLE IF NOT EXISTS it_fixed_assets (
      id VARCHAR(36) PRIMARY KEY,
      bu_name ENUM('Khema Global', 'Khema TK', 'Khema BKK', 'Sakal 2004') NOT NULL DEFAULT 'Khema Global',
      asset_code VARCHAR(50) NOT NULL UNIQUE,
      asset_date DATE,
      category VARCHAR(60) NOT NULL,
      item_name VARCHAR(100) NOT NULL,
      brand VARCHAR(100) NOT NULL,
      model VARCHAR(150),
      serial_num VARCHAR(100),
      key_specification TEXT,
      supplier VARCHAR(150),
      room_name VARCHAR(100) NOT NULL,
      floor VARCHAR(20) NOT NULL DEFAULT 'G',
      \`current_user\` VARCHAR(150),
      admin_password VARCHAR(255),
      user_email TEXT,
      hostname VARCHAR(100),
      ip_lan VARCHAR(50),
      ip_address_lan_secondary VARCHAR(50),
      ip_address_wan VARCHAR(50),
      issue_date DATE,
      purchase_date DATE,
      invoice_ref VARCHAR(100),
      quantity INT NOT NULL DEFAULT 1,
      unit_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
      before_dis_vat_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
      grand_total DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
      win_license VARCHAR(100),
      ms_license VARCHAR(100),
      ms_account_email VARCHAR(150),
      ms_account_password VARCHAR(255),
      remark TEXT,
      status ENUM('Active', 'In Repair', 'Plan dispose', 'Disposed', 'Spare') NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_fa_bu (bu_name),
      INDEX idx_fa_cat (category),
      INDEX idx_fa_status (status),
      INDEX idx_fa_floor (floor),
      INDEX idx_fa_code (asset_code)
    )`);

    // 2. Assets Control Table (13 columns + bu_name)
    await db.query(`CREATE TABLE IF NOT EXISTS it_assets_control (
      id VARCHAR(36) PRIMARY KEY,
      bu_name ENUM('Khema Global', 'Khema TK', 'Khema BKK', 'Sakal 2004') NOT NULL DEFAULT 'Khema Global',
      ac_code_cms VARCHAR(50) NOT NULL UNIQUE,
      category VARCHAR(60) NOT NULL,
      item_name VARCHAR(100) NOT NULL,
      brand VARCHAR(100) NOT NULL,
      model VARCHAR(150),
      serial_num VARCHAR(100),
      key_specification TEXT,
      supplier VARCHAR(150),
      room_name VARCHAR(100) NOT NULL,
      floor VARCHAR(20) NOT NULL DEFAULT 'G',
      \`current_user\` VARCHAR(150),
      remark TEXT,
      status ENUM('Active', 'In Repair', 'Plan dispose', 'Disposed', 'Missing') NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_ac_bu (bu_name),
      INDEX idx_ac_cat (category),
      INDEX idx_ac_status (status),
      INDEX idx_ac_floor (floor),
      INDEX idx_ac_code (ac_code_cms)
    )`);

    // 3. Physical Audits Table
    await db.query(`CREATE TABLE IF NOT EXISTS it_physical_audits (
      id VARCHAR(36) PRIMARY KEY,
      audit_year INT NOT NULL DEFAULT 2026,
      bu_name ENUM('Khema Global', 'Khema TK', 'Khema BKK', 'Sakal 2004') NOT NULL DEFAULT 'Khema Global',
      asset_type ENUM('Fixed Asset', 'Asset Control') NOT NULL,
      asset_id VARCHAR(36) NOT NULL,
      asset_code VARCHAR(50) NOT NULL,
      item_name VARCHAR(100),
      expected_floor VARCHAR(20),
      expected_room VARCHAR(100),
      actual_floor VARCHAR(20),
      actual_room VARCHAR(100),
      status ENUM('Verified (Matched)', 'Location Mismatch', 'Condition Changed', 'Missing') NOT NULL DEFAULT 'Verified (Matched)',
      notes TEXT,
      audited_by VARCHAR(100),
      synced_to_register TINYINT(1) DEFAULT 0,
      synced_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_pa_bu (bu_name),
      INDEX idx_pa_year (audit_year),
      INDEX idx_pa_status (status)
    )`);

    // 4. Asset Categories Configuration Table
    await db.query(`CREATE TABLE IF NOT EXISTS it_asset_categories (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      type ENUM('fixed', 'control', 'both') NOT NULL DEFAULT 'both',
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // 5. Asset Locations Configuration Table (Floor level + customizable tag & room)
    await db.query(`CREATE TABLE IF NOT EXISTS it_asset_locations (
      id VARCHAR(36) PRIMARY KEY,
      bu_name VARCHAR(100) NOT NULL DEFAULT 'Khema Global',
      floor_level VARCHAR(20) NOT NULL DEFAULT 'G',
      location_name VARCHAR(120) NOT NULL,
      room_details VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_loc_bu (bu_name),
      INDEX idx_loc_fl (floor_level)
    )`);

    // 6. Business Units Configuration Table
    await db.query(`CREATE TABLE IF NOT EXISTS it_business_units (
      id VARCHAR(36) PRIMARY KEY,
      bu_name VARCHAR(100) NOT NULL UNIQUE,
      code_prefix_fixed VARCHAR(20) NOT NULL,
      code_prefix_control VARCHAR(20) NOT NULL,
      address VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Alter tables to ensure Khema Global is accepted in existing ENUM columns
    await db.query(`ALTER TABLE it_fixed_assets MODIFY COLUMN bu_name ENUM('Khema Global', 'Khema TK', 'Khema BKK', 'Sakal 2004') NOT NULL DEFAULT 'Khema Global'`).catch(() => {});
    await db.query(`ALTER TABLE it_assets_control MODIFY COLUMN bu_name ENUM('Khema Global', 'Khema TK', 'Khema BKK', 'Sakal 2004') NOT NULL DEFAULT 'Khema Global'`).catch(() => {});
    await db.query(`ALTER TABLE it_physical_audits MODIFY COLUMN bu_name ENUM('Khema Global', 'Khema TK', 'Khema BKK', 'Sakal 2004') NOT NULL DEFAULT 'Khema Global'`).catch(() => {});

    // Seed configuration tables if empty
    await seedConfigTables(db);

    // Only seed on completely pristine initial database creation (0 records across all tables)
    const [fixedCount]: any = await db.query('SELECT COUNT(*) as c FROM it_fixed_assets');
    const [controlCount]: any = await db.query('SELECT COUNT(*) as c FROM it_assets_control');
    if (fixedCount[0].c === 0 && controlCount[0].c === 0) {
      await seedInitialAssets(db);
    }
  } catch (err: any) {
    console.error('[IT Asset Tables Init Warning]:', err.message);
  }
}

// Seed Initial Categories, Locations, and Business Units
async function seedConfigTables(db: any) {
  try {
    // 1. Business Units Seed
    const [buCount]: any = await db.query('SELECT COUNT(*) as c FROM it_business_units');
    if (buCount[0].c === 0) {
      const defaultBUs = [
        { id: crypto.randomUUID(), bu_name: 'Khema Global', code_prefix_fixed: 'KGPH', code_prefix_control: 'KG-AC', address: 'Headquarters, Preah Monivong Blvd, Phnom Penh' },
        { id: crypto.randomUUID(), bu_name: 'Khema TK', code_prefix_fixed: 'K2PH', code_prefix_control: 'K2-AC', address: 'Toul Kork Medical Campus, St. 528, Phnom Penh' },
        { id: crypto.randomUUID(), bu_name: 'Khema BKK', code_prefix_fixed: 'KBPH', code_prefix_control: 'KB-AC', address: 'Boeung Keng Kang Clinic, St. 294, Phnom Penh' },
        { id: crypto.randomUUID(), bu_name: 'Sakal 2004', code_prefix_fixed: 'SKPH', code_prefix_control: 'SK-AC', address: 'Sakal 2004 Medical Branch, Street 2004, Phnom Penh' }
      ];
      for (const b of defaultBUs) {
        await db.query(
          'INSERT IGNORE INTO it_business_units (id, bu_name, code_prefix_fixed, code_prefix_control, address) VALUES (?, ?, ?, ?, ?)',
          [b.id, b.bu_name, b.code_prefix_fixed, b.code_prefix_control, b.address]
        );
      }
    }

    // 2. Categories Seed
    const [catCount]: any = await db.query('SELECT COUNT(*) as c FROM it_asset_categories');
    if (catCount[0].c === 0) {
      const defaultCats = [
        { name: 'COMPUTER', type: 'both', desc: 'Workstations, Desktops & All-in-One PC' },
        { name: 'LAPTOP', type: 'fixed', desc: 'Notebooks, MacBooks & Ultrabooks' },
        { name: 'Synology', type: 'fixed', desc: 'NAS Storage & Backup Servers' },
        { name: 'TV', type: 'both', desc: 'Smart Displays & Patient Monitors' },
        { name: 'PRINTER', type: 'both', desc: 'LaserJet, InkTank & Thermal Label Printers' },
        { name: 'UPS', type: 'both', desc: 'Uninterruptible Power Supplies & Inverters' },
        { name: 'Swing Door', type: 'fixed', desc: 'Access Control Speed Gates & Turnstiles' },
        { name: 'Video Conference', type: 'fixed', desc: 'Poly, Logitech & Meeting Room Cam Bars' },
        { name: 'FINGERPRINT', type: 'control', desc: 'Biometric Attendance & Time Clock Terminals' },
        { name: 'SERVER ROOM', type: 'control', desc: 'Server Rack Enclosures & Precision Cooling' },
        { name: 'MOBILE PHONE', type: 'control', desc: 'Duty Phones, Android Handsets & Hotlines' },
        { name: 'BILL COUNTER', type: 'control', desc: 'Cash Desks UV Currency Counters' },
        { name: 'PROJECTOR', type: 'control', desc: 'Auditorium & Training Projectors' },
        { name: 'ICOM', type: 'control', desc: 'Walkie-Talkies & Security Radios' },
        { name: 'CAMERA SECURITY', type: 'control', desc: 'CCTV Dome & Bullet IP Cameras' },
        { name: 'WIFI', type: 'control', desc: 'Wireless Access Points & Mesh APs' }
      ];
      for (const c of defaultCats) {
        await db.query(
          'INSERT IGNORE INTO it_asset_categories (id, category_name, type, description) VALUES (?, ?, ?, ?)',
          [crypto.randomUUID(), c.name, c.type, c.desc]
        );
      }
    }

    // 3. Locations Seed (Floor Level + Custom Location Tag)
    const [locCount]: any = await db.query('SELECT COUNT(*) as c FROM it_asset_locations');
    if (locCount[0].c === 0) {
      const defaultLocations = [
        // Khema Global (HQ)
        { bu_name: 'Khema Global', floor_level: 'G', location_name: 'Ground Lobby & Reception', room_details: 'Front Desk Counter 1-3' },
        { bu_name: 'Khema Global', floor_level: '1', location_name: 'Executive Suites', room_details: 'C-Level & Director Offices' },
        { bu_name: 'Khema Global', floor_level: '2', location_name: 'Datacenter & Central NOC', room_details: 'Main Rack Suite 201' },
        { bu_name: 'Khema Global', floor_level: '3', location_name: 'Finance & Procurement Hub', room_details: 'Accounting Hall 302' },
        { bu_name: 'Khema Global', floor_level: '4', location_name: 'Boardroom & Conference Wing', room_details: 'Video Conference Room 405' },

        // Khema TK
        { bu_name: 'Khema TK', floor_level: 'G', location_name: 'Ground Customer Service', room_details: 'CS Counter & Registration' },
        { bu_name: 'Khema TK', floor_level: 'G', location_name: 'Emergency Room (ER)', room_details: 'Triage & Resuscitation' },
        { bu_name: 'Khema TK', floor_level: '1', location_name: 'Outpatient Clinic (OPD)', room_details: 'Consultation Rooms 101-112' },
        { bu_name: 'Khema TK', floor_level: '2', location_name: 'Diagnostic Imaging & Lab', room_details: 'CT/MRI & Hematology' },
        { bu_name: 'Khema TK', floor_level: '3', location_name: 'Inpatient Ward East', room_details: 'Rooms 301-320' },
        { bu_name: 'Khema TK', floor_level: '4', location_name: 'Inpatient Ward West', room_details: 'Rooms 401-420' },
        { bu_name: 'Khema TK', floor_level: '5', location_name: 'Maternity & Pediatric Wing', room_details: 'Labor Rooms 501-508' },
        { bu_name: 'Khema TK', floor_level: '6', location_name: 'Surgical Operating Theatres', room_details: 'OR 1-4 & Recovery' },
        { bu_name: 'Khema TK', floor_level: '7', location_name: 'Hospital Administration', room_details: 'HR & Nursing Management' },
        { bu_name: 'Khema TK', floor_level: '8', location_name: 'Campus Server Room', room_details: 'IDF / Core Switch Room' },

        // Khema BKK
        { bu_name: 'Khema BKK', floor_level: 'G', location_name: 'Main Clinic Reception', room_details: 'Front Desk & Cashier' },
        { bu_name: 'Khema BKK', floor_level: '1', location_name: 'Specialist Consultation', room_details: 'Doctor Suites 101-106' },
        { bu_name: 'Khema BKK', floor_level: '2', location_name: 'Ultrasound & Pharmacy', room_details: 'Pharma Dispensing & US Lab' },
        { bu_name: 'Khema BKK', floor_level: '3', location_name: 'Day Care Surgery Unit', room_details: 'Recovery Bay 301' },
        { bu_name: 'Khema BKK', floor_level: '4', location_name: 'BKK IT & Admin Office', room_details: 'Office 402' },

        // Sakal 2004
        { bu_name: 'Sakal 2004', floor_level: 'G', location_name: 'Emergency & Triage Front', room_details: 'Admission Desk' },
        { bu_name: 'Sakal 2004', floor_level: '1', location_name: 'Diagnostics & Pathology', room_details: 'Blood Bank & X-Ray' },
        { bu_name: 'Sakal 2004', floor_level: '2', location_name: 'Intensive Care Unit (ICU)', room_details: 'Beds 1-8 Nursing Station' },
        { bu_name: 'Sakal 2004', floor_level: '3', location_name: 'Branch Management & Server', room_details: 'IT Network Closet' }
      ];

      for (const loc of defaultLocations) {
        await db.query(
          'INSERT INTO it_asset_locations (id, bu_name, floor_level, location_name, room_details) VALUES (?, ?, ?, ?, ?)',
          [crypto.randomUUID(), loc.bu_name, loc.floor_level, loc.location_name, loc.room_details]
        );
      }
    }
  } catch (err: any) {
    console.error('[IT Asset Seed Config Warning]:', err.message);
  }
}

// Seed realistic sample records for Khema TK, Khema BKK, and Sakal 2004
async function seedInitialAssets(db: any) {
  try {
    const fixedSeeds: any[] = [
      // Khema TK (K2)
      {
        id: crypto.randomUUID(),
        bu_name: 'Khema TK',
        asset_code: 'K2PH000084',
        asset_date: '2022-06-01',
        category: 'COMPUTER',
        item_name: 'AIO',
        brand: 'DELL',
        model: 'Dell Optiplex 5490 AIO',
        serial_num: 'BWQNRH3',
        key_specification: 'Ram DDR4 8GB, CPU Intel Core i5-11500T(6 cores), SSD 500GB',
        supplier: 'Anana Computer',
        room_name: 'Customer Service',
        floor: 'G',
        current_user: 'Customer Service',
        admin_password: 'Admin@K2#2022',
        user_email: 'cs.tk@khemaglobal.com',
        hostname: 'CSF3-PC',
        ip_lan: '192.168.5.235',
        ip_address_lan_secondary: '192.168.0.219',
        quantity: 1,
        unit_price: 850.00,
        before_dis_vat_price: 850.00,
        grand_total: 850.00,
        win_license: 'OEM Windows 11 Pro',
        ms_license: 'Office 2021 Home & Business',
        ms_account_email: 'khema.cs01@outlook.com',
        ms_account_password: 'Pass@Outlook2022',
        remark: 'Original deployment at CS Counter Desk 1',
        status: 'Active'
      },
      {
        id: crypto.randomUUID(),
        bu_name: 'Khema TK',
        asset_code: 'K2PH000034',
        asset_date: '2016-08-01',
        category: 'COMPUTER',
        item_name: 'AIO',
        brand: 'DELL',
        model: 'OptiPlex 3240 All-in-One',
        serial_num: 'HB8GH62',
        key_specification: 'Ram DDR4 8GB, CPU Intel Core i5-6500, HDD 1TB',
        supplier: 'Chantrea Tech',
        room_name: 'Pharmacy right',
        floor: 'G',
        current_user: 'Doctor and Nurse',
        admin_password: 'Admin@K2#Old',
        user_email: 'pharmacy.tk@khemaglobal.com',
        hostname: 'PC-COO',
        ip_lan: '192.168.5.229',
        quantity: 1,
        unit_price: 680.00,
        before_dis_vat_price: 680.00,
        grand_total: 680.00,
        win_license: 'Windows 10 Pro',
        remark: 'Older hardware (>7 years). Needs disposal plan and replacement.',
        status: 'Plan dispose'
      },
      {
        id: crypto.randomUUID(),
        bu_name: 'Khema TK',
        asset_code: 'K2PH000092',
        asset_date: '2023-01-15',
        category: 'Synology',
        item_name: 'NAS Storage',
        brand: 'Synology',
        model: 'DiskStation DS923+',
        serial_num: 'SYN923K2001',
        key_specification: 'AMD Ryzen R1600, 32GB ECC RAM, 4x 8TB IronWolf RAID 10 (16TB Usable)',
        supplier: 'Synology Cambodia Partner',
        room_name: 'Server Room',
        floor: '1',
        current_user: 'IT Infrastructure Team',
        admin_password: 'SynologyRootK2!',
        hostname: 'K2-NAS-BACKUP',
        ip_lan: '192.168.5.10',
        ip_address_lan_secondary: '192.168.5.11',
        quantity: 1,
        unit_price: 2450.00,
        before_dis_vat_price: 2450.00,
        grand_total: 2450.00,
        remark: 'Primary PACS imaging backup repository',
        status: 'Active'
      },
      // Khema BKK
      {
        id: crypto.randomUUID(),
        bu_name: 'Khema BKK',
        asset_code: 'KBPH000042',
        asset_date: '2022-04-10',
        category: 'COMPUTER',
        item_name: 'Desktop',
        brand: 'HP',
        model: 'HP ProDesk 400 G7',
        serial_num: '8CG14529LP',
        key_specification: 'Intel Core i7-10700, 16GB RAM, 512GB NVMe SSD, HP 24" Monitor',
        supplier: 'PTC Computer',
        room_name: 'Billing Team',
        floor: '1',
        current_user: 'Billing Team',
        admin_password: 'BkkAdmin@2022',
        user_email: 'billing.bkk@khemaglobal.com',
        hostname: 'BKK-BILL01',
        ip_lan: '192.168.2.140',
        quantity: 1,
        unit_price: 980.00,
        before_dis_vat_price: 980.00,
        grand_total: 980.00,
        win_license: 'Windows 11 Pro OEM',
        remark: 'Installed at BKK Cashier & Admissions Counter 2',
        status: 'Active'
      },
      {
        id: crypto.randomUUID(),
        bu_name: 'Khema BKK',
        asset_code: 'KBPH000015',
        asset_date: '2023-09-01',
        category: 'LAPTOP',
        item_name: 'Laptop',
        brand: 'DELL',
        model: 'Dell Latitude 5430',
        serial_num: '9KJH382',
        key_specification: 'Intel Core i5-1245U, 16GB DDR4, 512GB SSD, 14" FHD',
        supplier: 'Dell Cambodia',
        room_name: 'Executive Office',
        floor: '3',
        current_user: 'Medical Director',
        admin_password: 'BkkExecPass#1',
        user_email: 'director.bkk@khemaglobal.com',
        hostname: 'BKK-DIR-LT',
        ip_lan: '192.168.2.88',
        quantity: 1,
        unit_price: 1150.00,
        before_dis_vat_price: 1150.00,
        grand_total: 1150.00,
        win_license: 'Win 11 Pro',
        ms_license: 'MS 365 Business Standard',
        remark: 'Assigned for clinical leadership mobility',
        status: 'Active'
      },
      // Sakal 2004
      {
        id: crypto.randomUUID(),
        bu_name: 'Sakal 2004',
        asset_code: 'SKPH000018',
        asset_date: '2023-05-12',
        category: 'COMPUTER',
        item_name: 'AIO',
        brand: 'DELL',
        model: 'Dell Optiplex 5400 AIO',
        serial_num: '7MNL892',
        key_specification: 'Intel Core i5-12500, 8GB RAM, 512GB SSD',
        supplier: 'Anana Computer',
        room_name: 'Reception',
        floor: 'G',
        current_user: 'Pharmacist',
        admin_password: 'SakalAdmin#2023',
        user_email: 'reception.sakal@khemaglobal.com',
        hostname: 'SK-RECEP-01',
        ip_lan: '192.168.4.105',
        quantity: 1,
        unit_price: 890.00,
        before_dis_vat_price: 890.00,
        grand_total: 890.00,
        win_license: 'Win 11 Pro',
        remark: 'Main check-in terminal for Sakal branch',
        status: 'Active'
      }
    ];

    for (const f of fixedSeeds) {
      await db.query(
        `INSERT IGNORE INTO it_fixed_assets 
        (id, bu_name, asset_code, asset_date, category, item_name, brand, model, serial_num, key_specification, supplier, room_name, floor, \`current_user\`, admin_password, user_email, hostname, ip_lan, ip_address_lan_secondary, quantity, unit_price, before_dis_vat_price, grand_total, win_license, ms_license, ms_account_email, ms_account_password, remark, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [f.id, f.bu_name, f.asset_code, f.asset_date, f.category, f.item_name, f.brand, f.model, f.serial_num, f.key_specification, f.supplier, f.room_name, f.floor, f.current_user, f.admin_password, f.user_email || '', f.hostname, f.ip_lan, f.ip_address_lan_secondary || '', f.quantity, f.unit_price, f.before_dis_vat_price, f.grand_total, f.win_license || '', f.ms_license || '', f.ms_account_email || '', f.ms_account_password || '', f.remark, f.status]
      );
    }

    const controlSeeds: any[] = [
      // Khema TK (K2)
      {
        id: crypto.randomUUID(),
        bu_name: 'Khema TK',
        ac_code_cms: 'K2-AC0001',
        category: 'PRINTER',
        item_name: 'Printer',
        brand: 'Epson',
        model: 'L805',
        serial_num: 'W7ZK141689',
        key_specification: 'L805 Wi-Fi Photo Ink Tank Printer',
        supplier: 'Thearun',
        room_name: 'Admin Manager',
        floor: '10',
        current_user: 'Admin',
        remark: 'Direct USB connected for photo ID and report prints',
        status: 'Active'
      },
      {
        id: crypto.randomUUID(),
        bu_name: 'Khema TK',
        ac_code_cms: 'K2-AC0007',
        category: 'PRINTER',
        item_name: 'Printer',
        brand: 'HP',
        model: 'Color Laser Jet Pro M154nw',
        serial_num: 'VNC7M01180',
        key_specification: 'Compact Network Color Laser Printer 16ppm',
        supplier: 'B.O.S',
        room_name: 'ICU',
        floor: '8',
        current_user: 'Doctor',
        remark: 'Dedicated lab & vitals print queue',
        status: 'Active'
      },
      {
        id: crypto.randomUUID(),
        bu_name: 'Khema TK',
        ac_code_cms: 'K2-AC0045',
        category: 'FINGERPRINT',
        item_name: 'Time Attendance Scanner',
        brand: 'ZKTeco',
        model: 'K40 Pro',
        serial_num: 'ZK9988114',
        key_specification: 'Biometric fingerprint + RFID card terminal with TCP/IP',
        supplier: 'ZKTeco Cambodia',
        room_name: 'Staff Entrance',
        floor: 'G',
        current_user: 'HR / Staff',
        remark: 'Main employee shift check-in clock',
        status: 'Active'
      },
      // Khema BKK
      {
        id: crypto.randomUUID(),
        bu_name: 'Khema BKK',
        ac_code_cms: 'KB-AC0012',
        category: 'PRINTER',
        item_name: 'Receipt Printer',
        brand: 'Epson',
        model: 'TM-T82III',
        serial_num: 'EPS99281A',
        key_specification: 'Thermal 80mm POS receipt printer with USB+Ethernet',
        supplier: 'ICE Electronics',
        room_name: 'Cashier Counter',
        floor: 'G',
        current_user: 'Cashier',
        remark: 'HMS patient invoice and deposit slips',
        status: 'Active'
      },
      {
        id: crypto.randomUUID(),
        bu_name: 'Khema BKK',
        ac_code_cms: 'KB-AC0024',
        category: 'WIFI',
        item_name: 'Wireless Access Point',
        brand: 'UniFi',
        model: 'U6 Pro',
        serial_num: 'U6P-BKK-001',
        key_specification: 'Wi-Fi 6 Dual-Band ceiling AP, PoE Powered',
        supplier: 'MikroTik Cambodia',
        room_name: 'OPD Waiting Lounge',
        floor: '1',
        current_user: 'Patient Guest Wi-Fi',
        remark: 'SSID: Khema-Guest & Khema-Medical',
        status: 'Active'
      },
      // Sakal 2004
      {
        id: crypto.randomUUID(),
        bu_name: 'Sakal 2004',
        ac_code_cms: 'SK-AC0005',
        category: 'CAMERA SECURITY',
        item_name: 'Dome CCTV Camera',
        brand: 'Hikvision',
        model: 'DS-2CD2143G2-I',
        serial_num: 'HIK4MP-SK05',
        key_specification: '4MP AcuSense Fixed Dome Network Camera, PoE',
        supplier: 'Security Systems Asia',
        room_name: 'Pharmacy Storage',
        floor: 'G',
        current_user: 'Security',
        remark: 'Continuous recording to Sakal NVR',
        status: 'Active'
      }
    ];

    for (const c of controlSeeds) {
      await db.query(
        `INSERT IGNORE INTO it_assets_control 
        (id, bu_name, ac_code_cms, category, item_name, brand, model, serial_num, key_specification, supplier, room_name, floor, \`current_user\`, remark, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.bu_name, c.ac_code_cms, c.category, c.item_name, c.brand, c.model, c.serial_num, c.key_specification, c.supplier, c.room_name, c.floor, c.current_user, c.remark, c.status]
      );
    }

    console.log('[IT Asset Seeder] Pre-loaded multi-BU seed data for Khema TK, Khema BKK, and Sakal 2004.');
  } catch (err: any) {
    console.error('[IT Asset Seeder Error]:', err.message);
  }
}

// Seed realistic sample records for Khema Global (HQ Enterprise & Infrastructure)
async function seedKhemaGlobalAssets(db: any) {
  try {
    const kgFixed = [
      {
        id: crypto.randomUUID(),
        bu_name: 'Khema Global',
        asset_code: 'KGPH000001',
        asset_date: '2023-05-10',
        category: 'Synology',
        item_name: 'Enterprise Storage NAS',
        brand: 'Synology',
        model: 'DiskStation DS3622xs+',
        serial_num: 'SYN99120KG',
        key_specification: 'Intel Xeon D-1531 6-core, 32GB ECC DDR4, 12x16TB Enterprise SAS RAID6',
        supplier: 'Synology Official',
        room_name: 'HQ Server Room',
        floor: '10',
        current_user: 'IT Infrastructure Team',
        admin_password: 'Admin@KG#Nas2023',
        user_email: 'it.infrastructure@khemaglobal.com',
        hostname: 'KG-DC-NAS01',
        ip_lan: '192.168.1.10',
        ip_address_lan_secondary: '192.168.1.11',
        quantity: 1,
        unit_price: 4850.00,
        before_dis_vat_price: 4850.00,
        grand_total: 4850.00,
        win_license: 'DSM Enterprise 7.2',
        ms_license: '',
        ms_account_email: 'it.nas@khemaglobal.com',
        ms_account_password: 'NasPass@KG2023',
        remark: 'Centralized PACS, HIS database backups and VM snapshot vault for all Khema branches',
        status: 'Active'
      },
      {
        id: crypto.randomUUID(),
        bu_name: 'Khema Global',
        asset_code: 'KGPH000002',
        asset_date: '2023-08-20',
        category: 'Video Conference',
        item_name: 'Conference System',
        brand: 'Poly',
        model: 'Poly Studio X70 & TC8 Touch',
        serial_num: 'PLY77192KG',
        key_specification: 'Dual 4K cameras, 4K beamforming microphone array, TC8 touch controller',
        supplier: 'Comin Khmere',
        room_name: 'HQ Boardroom',
        floor: '10',
        current_user: 'Executive Board',
        admin_password: 'PolyAdmin@KG2023',
        user_email: 'boardroom@khemaglobal.com',
        hostname: 'KG-CONF-BR10',
        ip_lan: '192.168.1.45',
        quantity: 1,
        unit_price: 3900.00,
        before_dis_vat_price: 3900.00,
        grand_total: 3900.00,
        win_license: 'Poly VideoOS',
        ms_license: 'Teams Rooms Pro',
        ms_account_email: 'boardroom@khemaglobal.com',
        ms_account_password: 'Board@KG2023',
        remark: 'High-definition tele-health & executive video conferences across all branches',
        status: 'Active'
      },
      {
        id: crypto.randomUUID(),
        bu_name: 'Khema Global',
        asset_code: 'KGPH000003',
        asset_date: '2024-01-15',
        category: 'LAPTOP',
        item_name: 'Executive Laptop',
        brand: 'DELL',
        model: 'Latitude 7440',
        serial_num: 'DL88912KG',
        key_specification: 'Intel Core i7-1365U vPro, 32GB LPDDR5, 1TB NVMe Gen4 SSD, 14" FHD+ Touch',
        supplier: 'Anana Computer',
        room_name: 'Executive Suite',
        floor: '10',
        current_user: 'Chief Executive Officer',
        admin_password: 'Admin@KG#7440',
        user_email: 'ceo@khemaglobal.com',
        hostname: 'KG-CEO-LT',
        ip_lan: '192.168.1.102',
        quantity: 1,
        unit_price: 1850.00,
        before_dis_vat_price: 1850.00,
        grand_total: 1850.00,
        win_license: 'Windows 11 Pro',
        ms_license: 'Microsoft 365 E5',
        ms_account_email: 'ceo@khemaglobal.com',
        ms_account_password: 'CeoPass@KG2024',
        remark: 'Executive mobile workstation with BitLocker and FortiClient VPN',
        status: 'Active'
      }
    ];

    for (const f of kgFixed) {
      await db.query(
        `INSERT IGNORE INTO it_fixed_assets 
        (id, bu_name, asset_code, asset_date, category, item_name, brand, model, serial_num, key_specification, supplier, room_name, floor, \`current_user\`, admin_password, user_email, hostname, ip_lan, ip_address_lan_secondary, quantity, unit_price, before_dis_vat_price, grand_total, win_license, ms_license, ms_account_email, ms_account_password, remark, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [f.id, f.bu_name, f.asset_code, f.asset_date, f.category, f.item_name, f.brand, f.model, f.serial_num, f.key_specification, f.supplier, f.room_name, f.floor, f.current_user, f.admin_password, f.user_email, f.hostname, f.ip_lan, f.ip_address_lan_secondary || '', f.quantity, f.unit_price, f.before_dis_vat_price, f.grand_total, f.win_license, f.ms_license, f.ms_account_email, f.ms_account_password, f.remark, f.status]
      );
    }

    const kgControl = [
      {
        id: crypto.randomUUID(),
        bu_name: 'Khema Global',
        ac_code_cms: 'KG-AC0001',
        category: 'SERVER ROOM',
        item_name: 'Core Enterprise Router & Firewall',
        brand: 'Fortinet',
        model: 'FortiGate 100F',
        serial_num: 'FG100F-KG-01',
        key_specification: '10x GE RJ45, 8x SFP, 4x 10GE SFP+ FortiASIC SOC4, Dual Power Supply',
        supplier: 'First Cambodia',
        room_name: 'HQ Server Room',
        floor: '10',
        current_user: 'IT Network Team',
        remark: 'HQ SD-WAN hub connecting TK, BKK, and Sakal campuses',
        status: 'Active'
      },
      {
        id: crypto.randomUUID(),
        bu_name: 'Khema Global',
        ac_code_cms: 'KG-AC0002',
        category: 'FINGERPRINT',
        item_name: 'Face & Palm Biometric Scanner',
        brand: 'ZKTeco',
        model: 'SpeedFace-V5L',
        serial_num: 'ZK-FACE-KG01',
        key_specification: 'Visible light facial recognition, palm recognition, fever & mask detection',
        supplier: 'ZKTeco Cambodia',
        room_name: 'HQ Executive Reception',
        floor: '10',
        current_user: 'HR & Corporate Staff',
        remark: 'Corporate HQ executive attendance & door access controller',
        status: 'Active'
      },
      {
        id: crypto.randomUUID(),
        bu_name: 'Khema Global',
        ac_code_cms: 'KG-AC0003',
        category: 'WIFI',
        item_name: 'Enterprise Wi-Fi 6 Access Point',
        brand: 'UniFi',
        model: 'U6 Pro',
        serial_num: 'U6PRO-KG-08',
        key_specification: 'Dual-Band WiFi 6 AP with 5.3 Gbps aggregate throughput rate, PoE+',
        supplier: 'Thearun Technology',
        room_name: 'HQ Executive Floor',
        floor: '10',
        current_user: 'All Corporate Staff',
        remark: 'HQ corporate secure wireless mesh and guest portal',
        status: 'Active'
      }
    ];

    for (const c of kgControl) {
      await db.query(
        `INSERT IGNORE INTO it_assets_control 
        (id, bu_name, ac_code_cms, category, item_name, brand, model, serial_num, key_specification, supplier, room_name, floor, \`current_user\`, remark, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.bu_name, c.ac_code_cms, c.category, c.item_name, c.brand, c.model, c.serial_num, c.key_specification, c.supplier, c.room_name, c.floor, c.current_user, c.remark, c.status]
      );
    }

    console.log('[IT Asset Seeder] Seeded Khema Global HQ assets.');
  } catch (err: any) {
    console.error('[IT Asset Khema Global Seeder Error]:', err.message);
  }
}

export function setupItAssetRoutes(app: Express, authenticateToken: any, getDb: () => any) {
  const db = getDb();
  initItAssetTables(db).catch(e => console.warn('[IT Asset Boot]:', e.message));

  // --- 1. FIXED ASSETS REGISTER (FixAssets) ---
  app.get('/api/fixed-assets', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { bu_name, category, floor, status, search } = req.query as any;

      let sql = 'SELECT * FROM it_fixed_assets WHERE 1=1';
      const params: any[] = [];

      if (bu_name && bu_name !== 'All BUs' && bu_name !== 'All') {
        sql += ' AND bu_name = ?';
        params.push(bu_name);
      }
      if (category && category !== 'All Categories') {
        sql += ' AND category = ?';
        params.push(category);
      }
      if (floor && floor !== 'All Floors') {
        sql += ' AND floor = ?';
        params.push(floor);
      }
      if (status && status !== 'All Statuses') {
        sql += ' AND status = ?';
        params.push(status);
      }
      if (search && search.trim()) {
        const q = `%${search.trim()}%`;
        sql += ' AND (asset_code LIKE ? OR item_name LIKE ? OR brand LIKE ? OR model LIKE ? OR serial_num LIKE ? OR room_name LIKE ? OR hostname LIKE ? OR ip_lan LIKE ? OR current_user LIKE ?)';
        params.push(q, q, q, q, q, q, q, q, q);
      }

      sql += ' ORDER BY bu_name ASC, category ASC, asset_code ASC';
      const [rows] = await db.query(sql, params);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/fixed-assets', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const item = req.body;
      const id = crypto.randomUUID();

      const [existing]: any = await db.query('SELECT id FROM it_fixed_assets WHERE asset_code = ?', [item.asset_code]);
      if (existing.length > 0) {
        return res.status(400).json({ error: `Asset Code "${item.asset_code}" already exists.` });
      }

      const qty = parseInt(item.quantity, 10) || 1;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const grandTotal = item.grand_total !== undefined && item.grand_total !== '' ? parseFloat(item.grand_total) : (qty * unitPrice);

      await db.query(
        `INSERT INTO it_fixed_assets (
          id, bu_name, asset_code, asset_date, category, item_name, brand, model, serial_num, key_specification,
          supplier, room_name, floor, \`current_user\`, admin_password, user_email, hostname, ip_lan,
          ip_address_lan_secondary, ip_address_wan, issue_date, purchase_date, invoice_ref, quantity,
          unit_price, before_dis_vat_price, grand_total, win_license, ms_license, ms_account_email,
          ms_account_password, remark, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          item.bu_name || 'Khema TK',
          item.asset_code.trim(),
          item.asset_date || null,
          item.category || 'COMPUTER',
          item.item_name || 'Desktop',
          item.brand || 'DELL',
          item.model || '',
          item.serial_num || '',
          item.key_specification || '',
          item.supplier || '',
          item.room_name || 'General',
          item.floor || 'G',
          item.current_user || '',
          item.admin_password || '',
          item.user_email || '',
          item.hostname || '',
          item.ip_lan || '',
          item.ip_address_lan_secondary || '',
          item.ip_address_wan || '',
          item.issue_date || null,
          item.purchase_date || null,
          item.invoice_ref || '',
          qty,
          unitPrice,
          parseFloat(item.before_dis_vat_price) || unitPrice,
          grandTotal,
          item.win_license || '',
          item.ms_license || '',
          item.ms_account_email || '',
          item.ms_account_password || '',
          item.remark || '',
          item.status || 'Active'
        ]
      );

      res.json({ id, asset_code: item.asset_code });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/fixed-assets/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const item = req.body;
      const { id } = req.params;

      const qty = parseInt(item.quantity, 10) || 1;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const grandTotal = item.grand_total !== undefined && item.grand_total !== '' ? parseFloat(item.grand_total) : (qty * unitPrice);

      await db.query(
        `UPDATE it_fixed_assets SET 
          bu_name = ?, asset_code = ?, asset_date = ?, category = ?, item_name = ?, brand = ?, model = ?,
          serial_num = ?, key_specification = ?, supplier = ?, room_name = ?, floor = ?, \`current_user\` = ?,
          admin_password = ?, user_email = ?, hostname = ?, ip_lan = ?, ip_address_lan_secondary = ?,
          ip_address_wan = ?, issue_date = ?, purchase_date = ?, invoice_ref = ?, quantity = ?,
          unit_price = ?, before_dis_vat_price = ?, grand_total = ?, win_license = ?, ms_license = ?,
          ms_account_email = ?, ms_account_password = ?, remark = ?, status = ?
        WHERE id = ?`,
        [
          item.bu_name || 'Khema TK',
          item.asset_code.trim(),
          item.asset_date || null,
          item.category || 'COMPUTER',
          item.item_name || 'Desktop',
          item.brand || 'DELL',
          item.model || '',
          item.serial_num || '',
          item.key_specification || '',
          item.supplier || '',
          item.room_name || 'General',
          item.floor || 'G',
          item.current_user || '',
          item.admin_password || '',
          item.user_email || '',
          item.hostname || '',
          item.ip_lan || '',
          item.ip_address_lan_secondary || '',
          item.ip_address_wan || '',
          item.issue_date || null,
          item.purchase_date || null,
          item.invoice_ref || '',
          qty,
          unitPrice,
          parseFloat(item.before_dis_vat_price) || unitPrice,
          grandTotal,
          item.win_license || '',
          item.ms_license || '',
          item.ms_account_email || '',
          item.ms_account_password || '',
          item.remark || '',
          item.status || 'Active',
          id
        ]
      );

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/fixed-assets/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      await db.query('DELETE FROM it_fixed_assets WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 2. ASSETS CONTROL REGISTER (Assets Control) ---
  app.get('/api/assets-control', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { bu_name, category, floor, status, search } = req.query as any;

      let sql = 'SELECT * FROM it_assets_control WHERE 1=1';
      const params: any[] = [];

      if (bu_name && bu_name !== 'All BUs' && bu_name !== 'All') {
        sql += ' AND bu_name = ?';
        params.push(bu_name);
      }
      if (category && category !== 'All Categories') {
        sql += ' AND category = ?';
        params.push(category);
      }
      if (floor && floor !== 'All Floors') {
        sql += ' AND floor = ?';
        params.push(floor);
      }
      if (status && status !== 'All Statuses') {
        sql += ' AND status = ?';
        params.push(status);
      }
      if (search && search.trim()) {
        const q = `%${search.trim()}%`;
        sql += ' AND (ac_code_cms LIKE ? OR item_name LIKE ? OR brand LIKE ? OR model LIKE ? OR serial_num LIKE ? OR room_name LIKE ? OR current_user LIKE ?)';
        params.push(q, q, q, q, q, q, q);
      }

      sql += ' ORDER BY bu_name ASC, category ASC, ac_code_cms ASC';
      const [rows] = await db.query(sql, params);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/assets-control', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const item = req.body;
      const id = crypto.randomUUID();

      const [existing]: any = await db.query('SELECT id FROM it_assets_control WHERE ac_code_cms = ?', [item.ac_code_cms]);
      if (existing.length > 0) {
        return res.status(400).json({ error: `Control Code "${item.ac_code_cms}" already exists.` });
      }

      await db.query(
        `INSERT INTO it_assets_control (
          id, bu_name, ac_code_cms, category, item_name, brand, model, serial_num, key_specification,
          supplier, room_name, floor, \`current_user\`, remark, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          item.bu_name || 'Khema TK',
          item.ac_code_cms.trim(),
          item.category || 'PRINTER',
          item.item_name || 'Printer',
          item.brand || 'Epson',
          item.model || '',
          item.serial_num || '',
          item.key_specification || '',
          item.supplier || '',
          item.room_name || 'General',
          item.floor || 'G',
          item.current_user || '',
          item.remark || '',
          item.status || 'Active'
        ]
      );

      res.json({ id, ac_code_cms: item.ac_code_cms });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/assets-control/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const item = req.body;
      const { id } = req.params;

      await db.query(
        `UPDATE it_assets_control SET 
          bu_name = ?, ac_code_cms = ?, category = ?, item_name = ?, brand = ?, model = ?, serial_num = ?,
          key_specification = ?, supplier = ?, room_name = ?, floor = ?, \`current_user\` = ?, remark = ?, status = ?
        WHERE id = ?`,
        [
          item.bu_name || 'Khema TK',
          item.ac_code_cms.trim(),
          item.category || 'PRINTER',
          item.item_name || 'Printer',
          item.brand || 'Epson',
          item.model || '',
          item.serial_num || '',
          item.key_specification || '',
          item.supplier || '',
          item.room_name || 'General',
          item.floor || 'G',
          item.current_user || '',
          item.remark || '',
          item.status || 'Active',
          id
        ]
      );

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/assets-control/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      await db.query('DELETE FROM it_assets_control WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 3. AUTO CODE SEQUENCING BY BUSINESS UNIT ---
  const handleNextCode = async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const bu = (req.query.bu_name as string) || 'Khema Global';
      const type = (req.query.type as string) || 'fixed'; // 'fixed' | 'control'

      let prefix = 'KGPH';
      let controlPrefix = 'KG-AC';
      if (bu === 'Khema TK') {
        prefix = 'K2PH';
        controlPrefix = 'K2-AC';
      } else if (bu === 'Khema BKK') {
        prefix = 'KBPH';
        controlPrefix = 'KB-AC';
      } else if (bu === 'Sakal 2004') {
        prefix = 'SKPH';
        controlPrefix = 'SK-AC';
      }

      if (type === 'fixed') {
        const [rows]: any = await db.query(
          `SELECT asset_code FROM it_fixed_assets WHERE asset_code LIKE ? ORDER BY asset_code DESC LIMIT 1`,
          [`${prefix}%`]
        );
        let nextNum = 1;
        if (rows.length > 0) {
          const match = rows[0].asset_code.match(/\d+/);
          if (match) nextNum = parseInt(match[0], 10) + 1;
        }
        const nextCode = `${prefix}${String(nextNum).padStart(6, '0')}`;
        res.json({ nextCode });
      } else {
        const [rows]: any = await db.query(
          `SELECT ac_code_cms FROM it_assets_control WHERE ac_code_cms LIKE ? ORDER BY ac_code_cms DESC LIMIT 1`,
          [`${controlPrefix}%`]
        );
        let nextNum = 1;
        if (rows.length > 0) {
          const match = rows[0].ac_code_cms.match(/\d+/);
          if (match) nextNum = parseInt(match[0], 10) + 1;
        }
        const nextCode = `${controlPrefix}${String(nextNum).padStart(4, '0')}`;
        res.json({ nextCode });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };

  app.get('/api/it-assets/next-code', authenticateToken, handleNextCode);
  app.get('/api/assets/next-code', authenticateToken, handleNextCode);

  // --- 4. ASSET TRANSFER LOGGING ---
  const handleTransfer = async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { type, id, to_bu, to_floor, to_room, to_user, reason } = req.body;
      const dateStr = new Date().toISOString().slice(0, 10);
      const logEntry = `Transfer on ${dateStr} to ${to_bu || ''} Fl:${to_floor} Rm:${to_room}${to_user ? ` User:${to_user}` : ''} (${reason || 'Relocation'})`;

      if (type === 'fixed') {
        const [rows]: any = await db.query('SELECT remark FROM it_fixed_assets WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
        const oldRemark = rows[0].remark || '';
        const newRemark = oldRemark ? `${oldRemark} | ${logEntry}` : logEntry;

        await db.query(
          'UPDATE it_fixed_assets SET bu_name = COALESCE(?, bu_name), floor = ?, room_name = ?, `current_user` = COALESCE(?, `current_user`), remark = ? WHERE id = ?',
          [to_bu || null, to_floor, to_room, to_user || null, newRemark, id]
        );
      } else {
        const [rows]: any = await db.query('SELECT remark FROM it_assets_control WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
        const oldRemark = rows[0].remark || '';
        const newRemark = oldRemark ? `${oldRemark} | ${logEntry}` : logEntry;

        await db.query(
          'UPDATE it_assets_control SET bu_name = COALESCE(?, bu_name), floor = ?, room_name = ?, `current_user` = COALESCE(?, `current_user`), remark = ? WHERE id = ?',
          [to_bu || null, to_floor, to_room, to_user || null, newRemark, id]
        );
      }

      res.json({ success: true, message: 'Asset transferred successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };
  app.post('/api/it-assets/transfer', authenticateToken, handleTransfer);
  app.post('/api/assets/transfer', authenticateToken, handleTransfer);

  // --- 5. EXECUTIVE ASSET ANALYTICS DASHBOARD ---
  const handleAnalytics = async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { bu_name } = req.query as any;

      let fixedWhere = 'WHERE 1=1';
      let controlWhere = 'WHERE 1=1';
      const fixedParams: any[] = [];
      const controlParams: any[] = [];

      if (bu_name && bu_name !== 'All BUs' && bu_name !== 'All') {
        fixedWhere += ' AND bu_name = ?';
        fixedParams.push(bu_name);
        controlWhere += ' AND bu_name = ?';
        controlParams.push(bu_name);
      }

      const [fixedRows]: any = await db.query(`SELECT * FROM it_fixed_assets ${fixedWhere}`, fixedParams);
      const [controlRows]: any = await db.query(`SELECT * FROM it_assets_control ${controlWhere}`, controlParams);

      let totalFixedValuation = 0;
      let totalFixedCount = fixedRows.length;
      let totalControlCount = controlRows.length;
      let planDisposeCount = 0;
      let networkedEndpointsCount = 0;

      const categoryMap: Record<string, number> = {};
      const floorMap: Record<string, number> = {};
      const buValuationMap: Record<string, { valuation: number; fixedCount: number; controlCount: number }> = {
        'Khema Global': { valuation: 0, fixedCount: 0, controlCount: 0 },
        'Khema TK': { valuation: 0, fixedCount: 0, controlCount: 0 },
        'Khema BKK': { valuation: 0, fixedCount: 0, controlCount: 0 },
        'Sakal 2004': { valuation: 0, fixedCount: 0, controlCount: 0 }
      };

      const now = new Date();
      const refreshAlerts: any[] = [];

      fixedRows.forEach((r: any) => {
        const val = parseFloat(r.grand_total) || 0;
        totalFixedValuation += val;

        if (buValuationMap[r.bu_name]) {
          buValuationMap[r.bu_name].valuation += val;
          buValuationMap[r.bu_name].fixedCount += 1;
        }

        if (r.status === 'Plan dispose') planDisposeCount += 1;
        if (r.ip_lan || r.hostname) networkedEndpointsCount += 1;

        const cat = r.category || 'OTHER';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;

        const fl = `Floor ${r.floor || 'G'}`;
        floorMap[fl] = (floorMap[fl] || 0) + 1;

        // Check age: 5 years or older
        let isOld = false;
        let ageYears = 0;
        const d = r.asset_date || r.purchase_date;
        if (d) {
          const dateObj = new Date(d);
          if (!isNaN(dateObj.getTime())) {
            ageYears = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
            if (ageYears >= 5) isOld = true;
          }
        }
        if (isOld || r.status === 'Plan dispose') {
          refreshAlerts.push({
            id: r.id,
            bu_name: r.bu_name,
            asset_code: r.asset_code,
            item_name: r.item_name,
            model: r.model,
            brand: r.brand,
            floor: r.floor,
            room_name: r.room_name,
            current_user: r.current_user,
            age_years: ageYears,
            status: r.status,
            asset_date: r.asset_date
          });
        }
      });

      controlRows.forEach((r: any) => {
        if (buValuationMap[r.bu_name]) {
          buValuationMap[r.bu_name].controlCount += 1;
        }
        if (r.status === 'Plan dispose') planDisposeCount += 1;

        const cat = r.category || 'OTHER';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;

        const fl = `Floor ${r.floor || 'G'}`;
        floorMap[fl] = (floorMap[fl] || 0) + 1;
      });

      const categoryData = Object.entries(categoryMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const floorData = Object.entries(floorMap)
        .map(([floor, count]) => ({ floor, count }))
        .sort((a, b) => {
          const numA = parseInt(a.floor.replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(b.floor.replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        });

      res.json({
        totalFixedValuation,
        totalFixedCount,
        totalControlCount,
        planDisposeCount,
        networkedEndpointsCount,
        buValuationMap,
        categoryData,
        floorData,
        refreshAlerts
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };
  app.get('/api/it-assets/analytics', authenticateToken, handleAnalytics);
  app.get('/api/fixed-assets/analytics', authenticateToken, handleAnalytics);

  // --- 6. YEARLY PHYSICAL ASSET AUDIT & RECONCILIATION ---
  app.get('/api/physical-audits', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { bu_name, floor, year } = req.query as any;
      const currentYear = parseInt(year, 10) || 2026;

      let sql = 'SELECT * FROM it_physical_audits WHERE audit_year = ?';
      const params: any[] = [currentYear];

      if (bu_name && bu_name !== 'All BUs' && bu_name !== 'All') {
        sql += ' AND bu_name = ?';
        params.push(bu_name);
      }
      if (floor && floor !== 'All Floors') {
        sql += ' AND (expected_floor = ? OR actual_floor = ?)';
        params.push(floor, floor);
      }

      sql += ' ORDER BY created_at DESC';
      const [rows] = await db.query(sql, params);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Quick lookup & match verification when scanning code
  app.get('/api/physical-audits/verify-code', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const code = (req.query.code as string || '').trim();
      const currentFloor = (req.query.floor as string || 'G').trim();
      const currentBu = (req.query.bu_name as string || 'Khema TK').trim();

      if (!code) return res.status(400).json({ error: 'Code is required' });

      // Search in Fixed Assets first
      const [fixedRows]: any = await db.query(
        'SELECT * FROM it_fixed_assets WHERE asset_code = ? OR serial_num = ? LIMIT 1',
        [code, code]
      );

      if (fixedRows.length > 0) {
        const item = fixedRows[0];
        const isMatched = item.bu_name === currentBu && String(item.floor).toUpperCase() === currentFloor.toUpperCase();
        return res.json({
          found: true,
          asset_type: 'Fixed Asset',
          item,
          suggested_status: isMatched ? 'Verified (Matched)' : 'Location Mismatch',
          expected_bu: item.bu_name,
          expected_floor: item.floor,
          expected_room: item.room_name
        });
      }

      // Search in Assets Control
      const [controlRows]: any = await db.query(
        'SELECT * FROM it_assets_control WHERE ac_code_cms = ? OR serial_num = ? LIMIT 1',
        [code, code]
      );

      if (controlRows.length > 0) {
        const item = controlRows[0];
        const isMatched = item.bu_name === currentBu && String(item.floor).toUpperCase() === currentFloor.toUpperCase();
        return res.json({
          found: true,
          asset_type: 'Asset Control',
          item,
          suggested_status: isMatched ? 'Verified (Matched)' : 'Location Mismatch',
          expected_bu: item.bu_name,
          expected_floor: item.floor,
          expected_room: item.room_name
        });
      }

      res.json({ found: false, message: `No registered asset matched code "${code}".` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Record an audit entry
  app.post('/api/physical-audits/record', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const {
        bu_name,
        audit_year,
        asset_type,
        asset_id,
        asset_code,
        item_name,
        expected_floor,
        expected_room,
        actual_floor,
        actual_room,
        status,
        notes
      } = req.body;

      const id = crypto.randomUUID();
      const year = audit_year || 2026;
      const userName = (req as any).user?.name || (req as any).user?.email || 'IT Auditor';

      await db.query(
        `INSERT INTO it_physical_audits (
          id, audit_year, bu_name, asset_type, asset_id, asset_code, item_name,
          expected_floor, expected_room, actual_floor, actual_room, status, notes, audited_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          year,
          bu_name || 'Khema TK',
          asset_type || 'Fixed Asset',
          asset_id,
          asset_code,
          item_name || '',
          expected_floor || '',
          expected_room || '',
          actual_floor || expected_floor,
          actual_room || expected_room,
          status || 'Verified (Matched)',
          notes || '',
          userName
        ]
      );

      res.json({ id, success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Sync audit findings to main registers
  app.post('/api/physical-audits/sync-register', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { bu_name, floor, year } = req.body;
      const currentYear = parseInt(year, 10) || 2026;

      let sql = 'SELECT * FROM it_physical_audits WHERE audit_year = ? AND synced_to_register = 0';
      const params: any[] = [currentYear];

      if (bu_name && bu_name !== 'All BUs' && bu_name !== 'All') {
        sql += ' AND bu_name = ?';
        params.push(bu_name);
      }
      if (floor && floor !== 'All Floors') {
        sql += ' AND (expected_floor = ? OR actual_floor = ?)';
        params.push(floor, floor);
      }

      const [pendingAudits]: any = await db.query(sql, params);
      let updatedCount = 0;

      for (const audit of pendingAudits) {
        const auditTimestamp = new Date().toISOString().slice(0, 10);
        const remarkNote = `Audit ${currentYear} (${audit.status}): Verified on Fl:${audit.actual_floor} Rm:${audit.actual_room} on ${auditTimestamp}`;

        if (audit.asset_type === 'Fixed Asset') {
          // If Condition Changed to dispose
          let newStatus = undefined;
          if (audit.status === 'Condition Changed') newStatus = 'Plan dispose';

          let updateSql = 'UPDATE it_fixed_assets SET floor = ?, room_name = ?, remark = CONCAT(COALESCE(remark, ""), " | ", ?)';
          const updateParams: any[] = [audit.actual_floor, audit.actual_room, remarkNote];
          if (newStatus) {
            updateSql += ', status = ?';
            updateParams.push(newStatus);
          }
          updateSql += ' WHERE id = ?';
          updateParams.push(audit.asset_id);

          await db.query(updateSql, updateParams);
        } else {
          let newStatus = undefined;
          if (audit.status === 'Condition Changed') newStatus = 'Plan dispose';
          else if (audit.status === 'Missing') newStatus = 'Missing';

          let updateSql = 'UPDATE it_assets_control SET floor = ?, room_name = ?, remark = CONCAT(COALESCE(remark, ""), " | ", ?)';
          const updateParams: any[] = [audit.actual_floor, audit.actual_room, remarkNote];
          if (newStatus) {
            updateSql += ', status = ?';
            updateParams.push(newStatus);
          }
          updateSql += ' WHERE id = ?';
          updateParams.push(audit.asset_id);

          await db.query(updateSql, updateParams);
        }

        // Mark audit record as synced
        await db.query(
          'UPDATE it_physical_audits SET synced_to_register = 1, synced_at = CURRENT_TIMESTAMP WHERE id = ?',
          [audit.id]
        );
        updatedCount += 1;
      }

      res.json({ success: true, updatedCount, message: `Synced ${updatedCount} audit records to the main register.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

// Helper to sanitize dates from Excel import into MySQL YYYY-MM-DD format
const sanitizeDate = (val: any): string | null => {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    if (y < 1970) return null;
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'number') {
    if (val <= 0 || isNaN(val)) return null;
    const msPerDay = 86400000;
    const utcDays = val - 25569;
    const date = new Date(Math.round(utcDays * msPerDay));
    if (isNaN(date.getTime()) || date.getFullYear() < 1970) return null;
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (!str || str === '--' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str.toLowerCase() === 'n/a') {
    return null;
  }
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = String(parseInt(ymdMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(ymdMatch[3], 10)).padStart(2, '0');
    if (y >= 1970 && y <= 2100) return `${y}-${m}-${d}`;
  }
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const d = String(parseInt(dmyMatch[1], 10)).padStart(2, '0');
    const m = String(parseInt(dmyMatch[2], 10)).padStart(2, '0');
    const y = parseInt(dmyMatch[3], 10);
    if (y >= 1970 && y <= 2100) return `${y}-${m}-${d}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 1970) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return null;
};

  // --- 7. BATCH EXCEL IMPORT ---
  const handleImportExcel = async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { fixedAssets, controlAssets, bu_name } = req.body;
      const defaultBu = bu_name || 'Khema TK';

      let fixedNew = 0;
      let fixedUpdated = 0;
      let fixedUnchanged = 0;
      let controlNew = 0;
      let controlUpdated = 0;
      let controlUnchanged = 0;

      if (Array.isArray(fixedAssets)) {
        for (const item of fixedAssets) {
          if (!item.asset_code) continue;
          const id = crypto.randomUUID();
          const cleanDate = sanitizeDate(item.asset_date || item.purchase_date || item.issue_date);
          const [result]: any = await db.query(
            `INSERT INTO it_fixed_assets (
              id, bu_name, asset_code, asset_date, purchase_date, issue_date, category, item_name, brand, model, serial_num, key_specification,
              supplier, room_name, floor, \`current_user\`, hostname, ip_lan, quantity, unit_price, before_dis_vat_price,
              grand_total, win_license, ms_license, remark, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
              bu_name = VALUES(bu_name),
              asset_date = VALUES(asset_date), purchase_date = VALUES(purchase_date), issue_date = VALUES(issue_date),
              category = VALUES(category), item_name = VALUES(item_name), brand = VALUES(brand), model = VALUES(model),
              serial_num = VALUES(serial_num), room_name = VALUES(room_name), floor = VALUES(floor),
              \`current_user\` = VALUES(\`current_user\`), hostname = VALUES(hostname), ip_lan = VALUES(ip_lan),
              grand_total = VALUES(grand_total), status = VALUES(status), remark = VALUES(remark)`,
            [
              id,
              item.bu_name || defaultBu,
              String(item.asset_code).trim(),
              cleanDate,
              cleanDate,
              cleanDate,
              item.category || 'COMPUTER',
              item.item_name || 'Device',
              item.brand || 'DELL',
              item.model || '',
              item.serial_num || '',
              item.key_specification || '',
              item.supplier || '',
              item.room_name || 'General',
              item.floor || 'G',
              item.current_user || '',
              item.hostname || '',
              item.ip_lan || '',
              parseInt(item.quantity, 10) || 1,
              parseFloat(item.unit_price) || 0,
              parseFloat(item.before_dis_vat_price) || 0,
              parseFloat(item.grand_total) || 0,
              item.win_license || '',
              item.ms_license || '',
              item.remark || '',
              item.status || 'Active'
            ]
          );
          if (result.affectedRows === 1) {
            fixedNew += 1;
          } else if (result.affectedRows === 2) {
            fixedUpdated += 1;
          } else {
            fixedUnchanged += 1;
          }
        }
      }

      if (Array.isArray(controlAssets)) {
        for (const item of controlAssets) {
          if (!item.ac_code_cms) continue;
          const id = crypto.randomUUID();
          const [result]: any = await db.query(
            `INSERT INTO it_assets_control (
              id, bu_name, ac_code_cms, category, item_name, brand, model, serial_num, key_specification,
              supplier, room_name, floor, \`current_user\`, remark, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
              bu_name = VALUES(bu_name),
              category = VALUES(category), item_name = VALUES(item_name), brand = VALUES(brand), model = VALUES(model),
              serial_num = VALUES(serial_num), room_name = VALUES(room_name), floor = VALUES(floor),
              \`current_user\` = VALUES(\`current_user\`), remark = VALUES(remark), status = VALUES(status)`,
            [
              id,
              item.bu_name || defaultBu,
              String(item.ac_code_cms).trim(),
              item.category || 'PRINTER',
              item.item_name || 'Equipment',
              item.brand || 'Epson',
              item.model || '',
              item.serial_num || '',
              item.key_specification || '',
              item.supplier || '',
              item.room_name || 'General',
              item.floor || 'G',
              item.current_user || '',
              item.remark || '',
              item.status || 'Active'
            ]
          );
          if (result.affectedRows === 1) {
            controlNew += 1;
          } else if (result.affectedRows === 2) {
            controlUpdated += 1;
          } else {
            controlUnchanged += 1;
          }
        }
      }

      const fixedTotal = fixedNew + fixedUpdated + fixedUnchanged;
      const controlTotal = controlNew + controlUpdated + controlUnchanged;
      const totalAssets = fixedTotal + controlTotal;

      res.json({
        success: true,
        totalAssets,
        fixedTotal,
        fixedNew,
        fixedUpdated,
        fixedUnchanged,
        controlTotal,
        controlNew,
        controlUpdated,
        controlUnchanged,
        message: `Successfully validated and processed ${totalAssets} total asset rows (${fixedTotal} Fixed Assets, ${controlTotal} Control Assets).`
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };
  app.post('/api/it-assets/import-excel', authenticateToken, handleImportExcel);
  app.post('/api/assets/import-excel', authenticateToken, handleImportExcel);

  // --- 8. ASSET CONFIGURATION (Categories, BUs, Locations) ---
  app.get('/api/it-assets/config', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const [categories]: any = await db.query(
        "SELECT id, category_name AS name, category_name, IFNULL(type, 'both') AS type, description, created_at FROM it_asset_categories ORDER BY category_name ASC"
      );
      const [locations]: any = await db.query('SELECT * FROM it_asset_locations ORDER BY bu_name ASC, floor_level ASC, location_name ASC');
      const [businessUnits]: any = await db.query('SELECT * FROM it_business_units ORDER BY bu_name ASC');

      res.json({
        categories: categories || [],
        locations: locations || [],
        businessUnits: businessUnits || []
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Categories CRUD
  app.post('/api/it-assets/config/categories', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { name, type, description } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });

      const catName = name.trim();
      const catType = type || 'both';
      const catDesc = description ? description.trim() : '';
      const id = crypto.randomUUID();

      await db.query(
        `INSERT INTO it_asset_categories (id, category_name, type, description) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE type = VALUES(type), description = VALUES(description)`,
        [id, catName, catType, catDesc]
      );

      res.json({ success: true, message: `Category "${catName}" saved.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/it-assets/config/categories/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { name, type, description } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });

      // Fetch old category name for cascading updates if changed
      const [existing]: any = await db.query('SELECT category_name FROM it_asset_categories WHERE id = ?', [id]);
      const oldName = existing && existing[0] ? existing[0].category_name : null;

      await db.query(
        'UPDATE it_asset_categories SET category_name = ?, type = ?, description = ? WHERE id = ?',
        [name.trim(), type || 'both', description ? description.trim() : '', id]
      );

      if (oldName && oldName !== name.trim()) {
        await db.query('UPDATE it_fixed_assets SET category = ? WHERE category = ?', [name.trim(), oldName]).catch(() => {});
        await db.query('UPDATE it_assets_control SET category = ? WHERE category = ?', [name.trim(), oldName]).catch(() => {});
      }

      res.json({ success: true, message: `Category "${name}" updated successfully.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/it-assets/config/categories/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      await db.query('DELETE FROM it_asset_categories WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Locations CRUD (Floor + Custom Location Tag + BU + Room details)
  app.post('/api/it-assets/config/locations', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { bu_name, floor_level, location_name, room_details } = req.body;
      if (!location_name || !location_name.trim()) {
        return res.status(400).json({ error: 'Location name is required' });
      }

      const id = crypto.randomUUID();
      await db.query(
        'INSERT INTO it_asset_locations (id, bu_name, floor_level, location_name, room_details) VALUES (?, ?, ?, ?, ?)',
        [id, bu_name || 'Khema Global', floor_level || 'G', location_name.trim(), room_details ? room_details.trim() : '']
      );

      res.json({ success: true, message: `Location "${location_name}" created.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/it-assets/config/locations/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { bu_name, floor_level, location_name, room_details } = req.body;
      if (!location_name || !location_name.trim()) {
        return res.status(400).json({ error: 'Location name is required' });
      }

      await db.query(
        'UPDATE it_asset_locations SET bu_name = ?, floor_level = ?, location_name = ?, room_details = ? WHERE id = ?',
        [bu_name || 'Khema Global', floor_level || 'G', location_name.trim(), room_details ? room_details.trim() : '', id]
      );

      res.json({ success: true, message: `Location "${location_name}" updated successfully.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/it-assets/config/locations/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      await db.query('DELETE FROM it_asset_locations WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Business Units CRUD
  app.post('/api/it-assets/config/bus', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { bu_name, code_prefix_fixed, code_prefix_control, address } = req.body;
      if (!bu_name || !bu_name.trim()) return res.status(400).json({ error: 'BU name is required' });

      const id = crypto.randomUUID();
      await db.query(
        `INSERT INTO it_business_units (id, bu_name, code_prefix_fixed, code_prefix_control, address) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE code_prefix_fixed = VALUES(code_prefix_fixed), code_prefix_control = VALUES(code_prefix_control), address = VALUES(address)`,
        [id, bu_name.trim(), code_prefix_fixed ? code_prefix_fixed.trim().toUpperCase() : 'KGPH', code_prefix_control ? code_prefix_control.trim().toUpperCase() : 'KG-AC', address ? address.trim() : '']
      );

      res.json({ success: true, message: `Business Unit "${bu_name}" saved.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/it-assets/config/bus/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { bu_name, code_prefix_fixed, code_prefix_control, address } = req.body;
      if (!bu_name || !bu_name.trim()) return res.status(400).json({ error: 'BU name is required' });

      await db.query(
        'UPDATE it_business_units SET bu_name = ?, code_prefix_fixed = ?, code_prefix_control = ?, address = ? WHERE id = ?',
        [bu_name.trim(), code_prefix_fixed ? code_prefix_fixed.trim().toUpperCase() : 'KGPH', code_prefix_control ? code_prefix_control.trim().toUpperCase() : 'KG-AC', address ? address.trim() : '', id]
      );

      res.json({ success: true, message: `Business Unit "${bu_name}" updated successfully.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/it-assets/config/bus/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      await db.query('DELETE FROM it_business_units WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}

