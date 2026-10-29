# AI Notes — Enterprise IT Operations Platform: Installation & Deployment Guide

Welcome to the technical installation, architecture, and deployment documentation for the **AI Notes Enterprise IT Operations Platform**. This document provides an exhaustive, production-grade guide to setting up, configuring, and operating the platform in our current Linux containerized environment as well as self-hosted physical/virtual servers.

---

## 1. System Overview & Technical Stack

The platform is engineered as a unified full-stack web application combining a responsive React SPA frontend with an Express API backend, directly integrated with a persistent MariaDB relational database.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER (Browser)                               │
│  React 19 SPA · React Router (HashRouter) · Tailwind CSS · Lucide Icons · Recharts     │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP / JSON API & Static Bundles (Port 3000)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   SERVER LAYER (Node.js 22)                            │
│  Express 4 · Vite Dev Middleware (dev) / Static Dist (prod) · Multer File Uploads       │
│                                                                                        │
│  ┌───────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────────┐ │
│  │    Authentication     │  │   Dashboard & Analytics │  │  Operations & Logistics  │ │
│  │  /api/auth/* (JWT)    │  │  /api/it-dashboard      │  │  /api/assets             │ │
│  │  Bcrypt Hash Verify   │  │  /api/cloud-subscript.  │  │  /api/helpdesk           │ │
│  │  Role Authorization   │  │  /api/expenses          │  │  /api/staffing           │ │
│  └───────────────────────┘  └─────────────────────────┘  └──────────────────────────┘ │
│  ┌───────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────────┐ │
│  │    Invoicing & CRM    │  │   Knowledge & Notes     │  │  Automations & Exports   │ │
│  │  /api/vendors         │  │  /api/notes             │  │  PDF Report Generation   │ │
│  │  /api/invoices        │  │  /api/templates         │  │  Telegram Bot (node-cron)│ │
│  └───────────────────────┘  └─────────────────────────┘  └──────────────────────────┘ │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ MySQL2 Connection Pool (Port 3306 / Socket)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                DATABASE LAYER (MariaDB 10.11+)                         │
│  Databases: `ainotes` / `ainotes_db`                                                   │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │  Core Tables:                                                                    │  │
│  │  · it_cloud_subscriptions (10 Active Services: AWS, Azure, Google Cloud, etc.)   │  │
│  │  · it_assets (Hardware, Serial Numbers, Warranty, Status, Assigned Techs)        │  │
│  │  · it_helpdesk (Incident Tickets, Priorities, SLA Tracking, Timestamps)          │  │
│  │  · it_staffing (Technician Profiles, Monthly Shifts, Performance Scores)         │  │
│  │  · it_sites (Multi-Hospital & Clinic Locations, Geo Metadata)                    │  │
│  │  · it_expenses (Monthly IT Budgets vs Actual Expenditures)                       │  │
│  │  · vendors & invoices (Procurement, Terms, Currency, Payment Status)             │  │
│  │  · notes & note_templates (Meeting Agendas, Markdown Content, Attachments)       │  │
│  │  · users (System Credentials, Admin/User Roles, Security Tokens)                 │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Core Technologies
- **Runtime Environment**: Node.js 22 LTS (64-bit Linux)
- **Frontend Framework**: React 19 (TypeScript, JSX, React Hooks)
- **UI & Styling**: Tailwind CSS, Lucide React icon suite, Recharts visual analytics
- **Backend Framework**: Express 4.21 with `vite.middlewares` mounted in development
- **Relational Database**: MariaDB 10.11+ (`mysql2/promise` connection pooling)
- **Authentication**: Stateless JSON Web Tokens (`jsonwebtoken`) with `bcrypt` salt hashing
- **File System & Storage**: `multer` handling multipart document and attachment uploads to local `/uploads` directory
- **Automated Tasks**: `node-cron` scheduled background jobs and Telegram Bot notification delivery

---

## 2. Codebase Directory & File Structure

```
/
├── App.tsx                    # Top-level client routing (HashRouter), AuthProvider, ProtectedRoute definitions
├── index.html                 # HTML5 entry shell with viewport meta, fonts, and root container
├── index.tsx                  # React DOM client mounting point
├── package.json               # Package definitions, scripts ("dev", "build", "start")
├── server.ts                  # Unified Express full-stack server: Vite middleware, API routes, DB pool, Cron
├── start-db.sh                # Container database lifecycle orchestrator: packages, daemon, schemas, seeds
├── ainotes_db.sql             # SQL schema definitions and initial seed dataset for all enterprise tables
├── .env                       # Active runtime environment configuration (MySQL credentials, JWT, Telegram)
├── .env.example               # Template environment configuration for developers
├── .mariadb-debs/             # Persistent local offline Debian cache for rapid database restoration
│
├── pages/
│   ├── auth/                  # Authentication pages: SignIn, SignUp, ForgotPassword, ResetPassword
│   │   ├── SignIn.tsx         # User authentication form with JWT token capture
│   │   ├── SignUp.tsx         # User registration form with role assignment
│   │   ├── ForgotPassword.tsx # Password recovery initiation
│   │   └── ResetPassword.tsx  # Token-based credential reset
│   └── dashboard/
│       ├── ITDashboard.tsx    # Master multi-tab operations center (KPIs, site filtering, PDF exports)
│       ├── ExecutiveSummaryModule.tsx  # Executive overview: cross-module rollups & analytics
│       ├── CloudSubscriptionsModule.tsx # Cloud & SaaS subscription management, currency conversion
│       ├── AssetsModule.tsx   # Hardware/Software asset inventory tracking and lifecycle management
│       ├── SettingsModule.tsx # Multi-site configuration (Main Hospital, Clinics, Departments)
│       ├── VendorList.tsx     # 3rd-party vendor CRM, contact information, service agreements
│       ├── InvoicesList.tsx   # Procurement invoice ledger, payment tracking, total spend
│       ├── CreateInvoice.tsx  # Dynamic invoice creation & editing with line items and tax
│       ├── MyNotes.tsx        # IT Meeting notes, documentation, search, and categorization
│       ├── CreateNote.tsx     # Rich note authoring with priority, venue, tags, and file attachments
│       ├── SingleNote.tsx     # Full-view note presentation with export and sharing
│       ├── Account.tsx        # User profile, role badges, and credential management
│       └── Settings.tsx       # System preferences and integration controls
│
├── components/
│   ├── Sidebar.tsx            # Responsive desktop/mobile navigation sidebar with active route states
│   ├── auth/                  # Authentication guards
│   │   └── ProtectedRoute.tsx # Route barrier verifying active authentication token
│   └── ui/                    # Reusable design components
│       ├── Button.tsx         # Standardized button variants (primary, secondary, danger, ghost)
│       ├── Modal.tsx          # Accessible overlay dialogue for CRUD forms
│       ├── StatCard.tsx       # KPI visual card with icon badges and trend metrics
│       └── Dropdown.tsx       # Context and filter selection dropdowns
│
├── context/
│   └── AuthContext.tsx        # Global user authentication state, token storage, and session lifecycle
│
├── services/
│   ├── noteService.ts         # Client API connector for note management
│   ├── storageService.ts      # Local client caching and persistence helpers
│   └── mockService.ts         # Fallback data provider for standalone preview
│
└── uploads/                   # Server-side file attachment storage for invoices and note documents
```

---

## 3. Environment Variables Configuration

The application reads configuration parameters from `.env` in the project root. Create or update your `.env` file based on `.env.example`:

```bash
# ==============================================================================
# Database Configuration
# ==============================================================================
# Database host: Use '127.0.0.1' or 'localhost' when connecting locally.
MYSQL_HOST=127.0.0.1

# MySQL / MariaDB application user
MYSQL_USER=ainotes_user

# MySQL / MariaDB application password
MYSQL_PASSWORD=your_secure_password_here

# Target database name
MYSQL_DATABASE=ainotes

# ==============================================================================
# Security & Authentication
# ==============================================================================
# Long, randomly generated secret string used to sign and verify JWT tokens
JWT_SECRET=e7b41b8a92f4c3917d5e4b2a8f01c9d3e5a7b9c1d3f5a7b9c1d3f5a7b9c1d3f5

# ==============================================================================
# Optional External Integrations
# ==============================================================================
# Google Gemini API key (optional, used for automated notes synthesis)
GEMINI_API_KEY=

# Telegram Bot Integration for automated system alerts
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### Generating a Secure JWT Secret
You can quickly generate a cryptographic 256-bit secret using OpenSSL or Node:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 4. Step-by-Step Installation Guide

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **npm**: v10.x or higher
- **MariaDB** or **MySQL**: v10.6+ or MySQL 8.0+
- **Operating System**: Linux (Debian 12 / Ubuntu 22.04+ recommended), macOS, or Windows with WSL2

---

### Step 1: Clone Repository & Install Dependencies
```bash
# Clone the repository
git clone <repository_url> ainotes
cd ainotes

# Install node dependencies
npm install --no-audit --no-fund
```

---

### Step 2: Database Initialization

#### Automated Initialization (Linux / Container)
The project includes a self-healing lifecycle script `start-db.sh` that checks for missing MariaDB packages, installs from the local `.mariadb-debs/` cache, launches the daemon, creates databases, grants user permissions, and imports `ainotes_db.sql`:

```bash
chmod +x start-db.sh
./start-db.sh
```

#### Manual Initialization (Standard MySQL / MariaDB Server)
If you already have a MySQL/MariaDB server running on your system:
```bash
# Log in to MariaDB as root
mariadb -u root -p

# Execute database and user creation queries:
CREATE DATABASE IF NOT EXISTS `ainotes` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `ainotes_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'ainotes_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';
CREATE USER IF NOT EXISTS 'ainotes_user'@'127.0.0.1' IDENTIFIED BY 'your_secure_password_here';
GRANT ALL PRIVILEGES ON `ainotes`.* TO 'ainotes_user'@'localhost';
GRANT ALL PRIVILEGES ON `ainotes`.* TO 'ainotes_user'@'127.0.0.1';
GRANT ALL PRIVILEGES ON `ainotes_db`.* TO 'ainotes_user'@'localhost';
GRANT ALL PRIVILEGES ON `ainotes_db`.* TO 'ainotes_user'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;

# Import the schema and seed data
mariadb -u ainotes_user -p ainotes < ainotes_db.sql
```

---

### Step 3: Run the Development Server
```bash
npm run dev
```
- The Express server starts on port `3000`.
- Vite dev middleware automatically compiles and serves frontend assets with Hot Module Replacement (HMR).
- Access the web interface at: `http://localhost:3000`

---

### Step 4: Build for Production
To generate an optimized, minified production build:
```bash
# Build the client bundle to /dist
npm run build

# Start the full-stack production server
npm run start
```

---

## 5. Production Deployment (Nginx & Systemd)

### 5.1 Nginx Reverse Proxy Configuration
In production environments, route traffic through Nginx listening on port 80/443 to the Node.js server on port 3000.

Create `/etc/nginx/sites-available/ainotes`:
```nginx
server {
    listen 80;
    server_name it.yourdomain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/ainotes /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.2 Systemd Service Unit
Create `/etc/systemd/system/ainotes.service`:
```ini
[Unit]
Description=AI Notes IT Operations Platform
After=network.target mariadb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/ainotes
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=/var/www/ainotes/.env

[Install]
WantedBy=multi-user.target
```
Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ainotes
```

---

## 6. Troubleshooting & Diagnostics

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| `ECONNREFUSED 127.0.0.1:3306` | MariaDB daemon is not running. | Execute `bash ./start-db.sh` or run `sudo systemctl start mariadb`. |
| `ER_ACCESS_DENIED_ERROR` | Incorrect database credentials in `.env`. | Verify `MYSQL_USER` and `MYSQL_PASSWORD` match your MariaDB grant statements. |
| `bun install failed: signal: killed` | Ephemeral container supervisor invoking Bun. | The project uses Node.js/npm. Ensure `bun.lock` is removed and excluded via `.gitignore`. |
| Port 3000 already in use | Another process is holding port 3000. | Check running processes with `lsof -i :3000` or `fuser -k 3000/tcp` to release it. |
| File upload failure (`ENOENT /uploads`) | Missing upload directory permissions. | Run `mkdir -p uploads && chmod 755 uploads`. |
