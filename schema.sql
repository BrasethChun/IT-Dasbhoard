-- =========================================================================
-- KHEMA GLOBAL IT & FIXED ASSET MANAGEMENT (ASSET CONTROL) SCHEMA
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB, phpMyAdmin, and CLI
-- =========================================================================

CREATE DATABASE IF NOT EXISTS khema_ainotes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE khema_ainotes;

-- -------------------------------------------------------------------------
-- 1. Asset Categories (IT Equipment vs Fixed Capital Assets)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asset_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('IT_ASSET', 'FIXED_ASSET') NOT NULL DEFAULT 'IT_ASSET',
    depreciation_years DECIMAL(4, 1) NOT NULL DEFAULT 3.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cat_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------------------
-- 2. Locations & Departments
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS locations_departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    location_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_branch (branch_name),
    INDEX idx_dept (department_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------------------
-- 3. Core Assets Table (IT Equipment & Fixed Assets)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assets (
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
    INDEX idx_assets_archived (is_archived),
    CONSTRAINT fk_assets_category FOREIGN KEY (category_id) REFERENCES asset_categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_assets_location FOREIGN KEY (location_id) REFERENCES locations_departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------------------
-- 4. Immutable Asset Custody & Assignment History Logs
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asset_assignment_logs (
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
    INDEX idx_assign_date (action_date),
    CONSTRAINT fk_assign_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------------------
-- 5. Asset Maintenance, Servicing & Repair Logs
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asset_maintenance_logs (
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
    INDEX idx_maint_status (status),
    CONSTRAINT fk_maint_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================================
-- SEED DATA: Pre-populate Categories, Locations & Initial Enterprise Assets
-- =========================================================================

-- Standard Asset Categories
INSERT INTO asset_categories (id, name, type, depreciation_years) VALUES
(1, 'Laptops & Mobile Workstations', 'IT_ASSET', 3.0),
(2, 'Desktop Terminals & AIOs', 'IT_ASSET', 4.0),
(3, 'Enterprise Servers & Storage (NAS/SAN)', 'IT_ASSET', 5.0),
(4, 'Network Switches, Routers & Firewalls', 'IT_ASSET', 5.0),
(5, 'Medical Imaging & Clinical Diagnostic', 'FIXED_ASSET', 7.0),
(6, 'Office Furniture & Workstation Ergonomics', 'FIXED_ASSET', 10.0),
(7, 'Uninterruptible Power Supplies (UPS & Genset)', 'FIXED_ASSET', 5.0),
(8, 'Security, Biometric & CCTV Systems', 'IT_ASSET', 4.0)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Standard Hospital & Clinic Locations
INSERT INTO locations_departments (id, branch_name, department_name, location_code) VALUES
(1, 'Main Hospital (K1)', 'Information Technology & Data Center', 'K1-IT-DC01'),
(2, 'Main Hospital (K1)', 'Emergency & Inpatient Admissions', 'K1-ADM-01'),
(3, 'Main Hospital (K1)', 'Radiology & Imaging Suite', 'K1-RAD-02'),
(4, 'North Clinic (K2)', 'Outpatient Consultation (OPD)', 'K2-OPD-101'),
(5, 'North Clinic (K2)', 'Pharmacy & Dispensing', 'K2-PHARM-01'),
(6, 'South Clinic (KG)', 'Clinical Laboratory & Pathology', 'KG-LAB-01'),
(7, 'South Clinic (KG)', 'Executive & Administrative Office', 'KG-ADMIN-02')
ON DUPLICATE KEY UPDATE branch_name=VALUES(branch_name);

-- Initial Enterprise Assets
INSERT INTO assets (
    id, asset_tag, serial_number, name, category_id, model_specs,
    status, condition_status, location_id, assigned_to_name, assigned_to_emp_id,
    purchase_date, purchase_cost, salvage_value, warranty_expiry,
    supplier_name, invoice_ref, notes, is_archived
) VALUES
(
    'a1000000-0000-0000-0000-000000000001',
    'AST-IT-2026-0001',
    'DL-R750-89102-KH',
    'Dell PowerEdge R750 Hospital PACS & HIS Database Server',
    3,
    '2x Intel Xeon Gold 6338, 256GB DDR4 ECC, 8x 3.84TB NVMe SSD RAID-10, Dual 10GbE SFP+',
    'Available (In Stock)',
    'New',
    1,
    'Sokha Chan (IT SysAdmin)',
    'EMP-IT-004',
    '2024-03-15',
    18500.00,
    1850.00,
    '2029-03-15',
    'Dell Technologies Asia / Anana Computer',
    'INV-DELL-2024-889',
    'Primary hypervisor for virtualized HIS production database cluster. High redundancy.',
    0
),
(
    'a1000000-0000-0000-0000-000000000002',
    'AST-IT-2026-0002',
    'C9300-48P-9921',
    'Cisco Catalyst 9300 48-Port PoE+ Core Switch',
    4,
    '48x 1GbE PoE+ Ports (740W budget), 4x 10GbE Uplinks, Network Advantage StackWise-480',
    'Available (In Stock)',
    'Good',
    1,
    'Vannak Seng (Network Eng)',
    'EMP-IT-007',
    '2023-08-20',
    5200.00,
    500.00,
    '2028-08-20',
    'Cisco Systems Cambodia',
    'INV-CSCO-2023-411',
    'Main core switch rack in Server Room K1. Connects all floor distribution switches.',
    0
),
(
    'a1000000-0000-0000-0000-000000000003',
    'AST-IT-2026-0003',
    'LEN-T14G4-1029',
    'Lenovo ThinkPad T14 Gen 4 Core i7 Staff Laptop',
    1,
    'Intel Core i7-1365U vPro, 32GB RAM, 1TB NVMe Gen4, 14\" WUXGA Anti-Glare, Windows 11 Pro',
    'Assigned',
    'Good',
    2,
    'Dr. Rithy Vuth (Head of Admissions)',
    'EMP-MED-012',
    '2024-01-10',
    1650.00,
    150.00,
    '2027-01-10',
    'Lenovo Enterprise Distributor',
    'INV-LEN-2024-055',
    'Assigned for emergency department patient admission triaging and mobile round rounds.',
    0
),
(
    'a1000000-0000-0000-0000-000000000004',
    'AST-IT-2026-0004',
    'HP-ELITEDESK-800G9',
    'HP EliteDesk 800 G9 Outpatient Consulting Station',
    2,
    'Intel Core i5-13500, 16GB DDR5, 512GB SSD, Dual HP 24\" IPS Monitors + Barcode Scanner',
    'Assigned',
    'Good',
    4,
    'Dr. Socheata Meas (Consultant Physician)',
    'EMP-MED-044',
    '2023-11-05',
    1350.00,
    100.00,
    '2026-11-05',
    'HP Cambodia Solutions',
    'INV-HP-2023-921',
    'Dedicated outpatient workstation running eHospital HIS clinical consultation terminal.',
    0
),
(
    'a1000000-0000-0000-0000-000000000005',
    'AST-FA-2026-0005',
    'GE-LOGIQ-E9-001',
    'GE Logiq E9 XDclear Color Doppler Ultrasound Console',
    5,
    'High-resolution medical imaging system with matrix cardiac and convex abdominal probes',
    'Available (In Stock)',
    'Good',
    3,
    'Radiology Department Team',
    'EMP-RAD-001',
    '2022-06-18',
    42000.00,
    5000.00,
    '2027-06-18',
    'GE Healthcare Indochina',
    'INV-GE-2022-1082',
    'Certified diagnostic ultrasound unit in Radiology Suite K1-RAD-02. Annual calibration done.',
    0
),
(
    'a1000000-0000-0000-0000-000000000006',
    'AST-IT-2026-0006',
    'AP-SRT5KXLI-2023',
    'APC Smart-UPS On-Line SRT 5000VA 230V Medical Grade UPS',
    7,
    '5000VA/4500W, Extended Run Rack/Tower 3U, SmartSlot Card AP9631 Network Management',
    'In Repair / Maintenance',
    'Fair',
    1,
    'Central IT Store',
    'EMP-IT-001',
    '2021-09-12',
    4800.00,
    400.00,
    '2024-09-12',
    'Schneider Electric Partner',
    'INV-SCH-2021-399',
    'Currently scheduled for internal battery pack replacement module (RBC140) by certified vendor.',
    0
)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Initial Assignment Audit Log Entries
INSERT INTO asset_assignment_logs (
    id, asset_id, action_type, previous_custodian, new_custodian, location_id, condition_on_action, performed_by, remarks
) VALUES
('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'CHECK_IN', NULL, 'Sokha Chan (IT SysAdmin)', 1, 'New', 'Head of IT', 'Initial procurement intake and data center rack installation.'),
('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'CHECK_IN', NULL, 'Vannak Seng (Network Eng)', 1, 'Good', 'Head of IT', 'Commissioned into core rack distribution.'),
('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'CHECK_OUT', 'IT Inventory Storage', 'Dr. Rithy Vuth (Head of Admissions)', 2, 'Good', 'IT Asset Manager', 'Handed over for mobile clinical admissions with docking station and security lock.'),
('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'CHECK_OUT', 'IT Inventory Storage', 'Dr. Socheata Meas (Consultant Physician)', 4, 'Good', 'IT Asset Manager', 'Installed in North Clinic OPD room 101 with peripheral scanner.'),
('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'CHECK_IN', NULL, 'Radiology Department Team', 3, 'Good', 'Biomedical Director', 'Imported and placed into K1 Radiology examination room.'),
('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 'STATUS_CHANGE', 'Server Room Rack 2', 'Central IT Store (Repair Bay)', 1, 'Fair', 'IT SysAdmin', 'Battery warning indicator triggered. Moved to repair bay for cell replacement.')
ON DUPLICATE KEY UPDATE performed_by=VALUES(performed_by);

-- Initial Maintenance Log Entry
INSERT INTO asset_maintenance_logs (
    id, asset_id, issue_description, vendor_or_technician, cost, start_date, completion_date, status
) VALUES
(
    'm1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000006',
    'UPS Battery Cartridge Depletion (Error Code 166). Procured 2x OEM replacement battery packs.',
    'APC Certified Service Center (Schneider Electric Cambodia)',
    420.00,
    '2026-10-18',
    NULL,
    'IN_PROGRESS'
)
ON DUPLICATE KEY UPDATE vendor_or_technician=VALUES(vendor_or_technician);

-- -------------------------------------------------------------
-- Khema Global Two-Tier Asset Management & Physical Audit
-- -------------------------------------------------------------

-- 1. Fixed Assets Register (FixAssets - 31 columns + BU)
CREATE TABLE IF NOT EXISTS it_fixed_assets (
  id VARCHAR(36) PRIMARY KEY,
  bu_name ENUM('Khema TK', 'Khema BKK', 'Sakal 2004') NOT NULL DEFAULT 'Khema TK',
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
  current_user VARCHAR(150),
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
);

-- 2. Assets Control Register (Assets Control - 13 columns + BU)
CREATE TABLE IF NOT EXISTS it_assets_control (
  id VARCHAR(36) PRIMARY KEY,
  bu_name ENUM('Khema TK', 'Khema BKK', 'Sakal 2004') NOT NULL DEFAULT 'Khema TK',
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
  current_user VARCHAR(150),
  remark TEXT,
  status ENUM('Active', 'In Repair', 'Plan dispose', 'Disposed', 'Missing') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ac_bu (bu_name),
  INDEX idx_ac_cat (category),
  INDEX idx_ac_status (status),
  INDEX idx_ac_floor (floor),
  INDEX idx_ac_code (ac_code_cms)
);

-- 3. Yearly Physical Asset Audits
CREATE TABLE IF NOT EXISTS it_physical_audits (
  id VARCHAR(36) PRIMARY KEY,
  audit_year INT NOT NULL DEFAULT 2026,
  bu_name ENUM('Khema TK', 'Khema BKK', 'Sakal 2004') NOT NULL,
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
);