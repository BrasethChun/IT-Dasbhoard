# AI Notes — Enterprise IT Operations Platform: Complete User Guide

Welcome to the **AI Notes Enterprise IT Operations Platform User Guide**. This handbook provides an exhaustive, step-by-step walkthrough of every module, dashboard, and feature available in the application.

---

## Table of Contents
1. [Platform Overview & User Roles](#1-platform-overview--user-roles)
2. [Authentication & Account Security](#2-authentication--account-security)
3. [Global Navigation & Layout](#3-global-navigation--layout)
4. [Executive Summary Module](#4-executive-summary-module)
5. [Cloud Subscriptions & SaaS Tracking](#5-cloud-subscriptions--saas-tracking)
6. [Asset Inventory Management](#6-asset-inventory-management)
7. [Helpdesk & Incident Response](#7-helpdesk--incident-response)
8. [Staffing, Shifts & Scheduling](#8-staffing-shifts--scheduling)
9. [Sites & Infrastructure Settings](#9-sites--infrastructure-settings)
10. [Vendor Directory & Contracts](#10-vendor-directory--contracts)
11. [Invoicing & Procurement Management](#11-invoicing--procurement-management)
12. [IT Knowledge Base & Meeting Notes](#12-it-knowledge-base--meeting-notes)
13. [Profile & Personal Settings](#13-profile--personal-settings)

---

## 1. Platform Overview & User Roles

The AI Notes platform is designed for enterprise healthcare and corporate IT departments managing multi-site operations (hospitals, clinics, regional centers). It provides a unified system of record for assets, cloud expenditures, support tickets, technician shifts, vendor contracts, and institutional knowledge.

### Supported User Roles
- **System Administrator**: Full read/write access to all modules, multi-site settings, user account privileges, and database configuration.
- **IT Manager / Director**: Access to Executive Summary rollups, budget vs actual expenses, invoice creation, and PDF executive dossier export.
- **IT Support Engineer / Technician**: Access to helpdesk ticket queues, asset repair logs, shift schedules, and technical documentation notes.
- **Guest / Read-Only User**: Restricted view of public documentation and read-only executive metrics.

---

## 2. Authentication & Account Security

### 2.1 Signing In
1. Navigate to the login route (`/#/login`).
2. Enter your registered email address and password.
3. Click **Sign In**.
4. Upon successful authentication, the server issues a secure JSON Web Token (JWT) that persists in your browser's session storage. You are automatically routed to the Home Dashboard.

### 2.2 Registering a New Account
1. From the login screen, click **Don't have an account? Sign Up** (`/#/signup`).
2. Provide your Full Name, Work Email, and a password (minimum 6 characters).
3. Select your department or role.
4. Click **Create Account**. Your profile will be created in the `users` database table with salted bcrypt password hashing.

### 2.3 Password Recovery
1. If you forget your password, click **Forgot Password?** on the sign-in modal.
2. Enter your account email to receive a secure recovery token.
3. Access the reset interface (`/#/reset-password?token=...`) to establish a new password.

---

## 3. Global Navigation & Layout

The application features a responsive, collapsible sidebar accessible from every authenticated view:

- **Home** (`/#/`): Landing hub, quick access cards, and personal overview.
- **IT Dashboard** (`/#/it-dashboard`): Collapsible executive & operational analytics suite:
  - **Executive Summary** (`/#/it-dashboard?tab=executive`): Top-level management KPIs, cross-module rollups, and consolidated report export.
  - **Staffing & Shifts** (`/#/it-dashboard?tab=staffing`): IT personnel roster, monthly site shift schedules, and on-call rotations.
  - **Helpdesk Tickets** (`/#/it-dashboard?tab=helpdesk`): Incident queue, SLA compliance, and technician assignment.
  - **Assets Inventory** (`/#/it-dashboard?tab=assets`): Physical hardware, servers, and software license lifecycle.
  - **Cloud Subscriptions** (`/#/it-dashboard?tab=subscriptions`): Multi-cloud infrastructure and SaaS license cost tracking.
  - **Vendor Management** (`/#/vendors`): 3rd-party technology vendors, agreements, and support escalations.
- **IT Tools** (Dedicated operational utility suite directly below IT Dashboard):
  - **Mail Assistant** (`/#/mail`): Bluehost webmail integration with 3-column split view, Inbox & Sent synchronization, automated polling, and Gemini-powered smart email drafting and replies.
  - **IT Notes & Meetings** (`/#/notes`): Technical documentation, SOPs, agendas, and meeting minutes.
  - **Invoices** (`/#/invoices`): Billing records, purchase orders, PDF generation, and payment approvals.
- **Create Note** (`/#/notes/new`): Rich-text markdown editor for authoring new technical documentation.
- **Account** (`/#/account`): User profile, role badges, and credential updates.
- **Settings** (`/#/settings`): Centralized system settings featuring Sites & Facilities, Asset Categories taxonomy, and User Roles & Access.

---

## 4. Executive Summary Module

The Executive Summary is the command cockpit for IT Directors and CIOs, aggregating data from all operational modules into high-impact visual indicators.

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  TOTAL TICKETS  │  │  OPEN INCIDENTS │  │ AVG RESOLUTION  │  │  SERVER UPTIME  │
│       145       │  │       12        │  │     4.2 hrs     │  │     99.99%      │
│  +8% this month │  │  3 High Priority│  │ -15m vs last mo │  │ SLA Compliant   │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Key Capabilities:
- **Global Multi-Site Filter**: Use the site dropdown at the top right to filter the entire dashboard by:
  - *All Sites* (aggregate view across the enterprise)
  - *Main Hospital*
  - *North Clinic*
  - *South Clinic*
- **Consolidated Monthly Expense Tracker**: Interactive Recharts bar and line graphs comparing budgeted IT expenditure vs actual spending month-over-month.
- **Ticket Status Breakdown**: Donut chart displaying resolution percentages (*Resolved*, *In Progress*, *Open*).
- **Consolidated PDF Export**: Click the **Export PDF** button in the header. The system queries all four operational endpoints (`/api/cloud-subscriptions/summary`, `/api/assets`, `/api/helpdesk`, `/api/staffing`) and compiles a formal multi-page PDF document formatted with auto-tables and key metrics.

---

## 5. Cloud Subscriptions & SaaS Tracking

Located under the **Cloud Subscriptions** tab of the IT Dashboard, this module provides granular visibility into all active cloud services, license tiers, and recurring financial commitments.

### Current Tracked Services:
The database maintains 10 active cloud services:
1. **Amazon Web Services (AWS)** — Infrastructure & Hosting (Production Cluster)
2. **Microsoft Azure** — Active Directory, Windows Server VMs & Healthcare APIs
3. **Google Cloud Platform (GCP)** — BigQuery Analytics & Machine Learning Models
4. **Google Workspace Enterprise** — Email, Docs, Drive, and Video Conferencing
5. **Microsoft 365 E5** — Office suite, Teams, and Compliance Archiving
6. **Zoom Enterprise** — Telehealth Video Conferencing & Clinical Webinars
7. **Slack Enterprise Grid** — Inter-departmental real-time operations messaging
8. **GitHub Enterprise Cloud** — Code repositories, CI/CD pipelines, and secrets auditing
9. **Datadog Pro** — Application performance monitoring (APM) & log retention
10. **Cloudflare Business** — DDoS mitigation, Web Application Firewall (WAF), and global CDN

### Managing Subscriptions:
- **Add New Subscription**: Click **+ Add Subscription**. Fill in:
  - *Service Name* (e.g., Salesforce Health Cloud)
  - *Provider* (e.g., Salesforce / AWS / Google Cloud)
  - *Category* (Hosting, Productivity, Monitoring, Security)
  - *Billing Cycle* (Monthly, Quarterly, Annual)
  - *Cost & Currency* (USD, EUR, KHR)
  - *Renewal Date*: Set the calendar date to activate automated expiration warnings.
- **Renewal Alert Flags**: Subscriptions renewing within 14 days display a warning badge to prevent service interruption.
- **Edit & Terminate**: Click the pencil icon to update license counts or trash icon to decommission a service.

---

## 6. Asset Inventory Management

The **Assets Module** tracks the complete lifecycle of clinical and enterprise IT hardware from procurement to decommissioning.

### Core Asset Attributes:
- **Asset Tag**: Unique barcode/tag identifier (e.g., `AST-9921`).
- **Category**: Workstation, Server, Mobile Tablet, Medical Cart, Network Switch, Laser Printer.
- **Location / Site**: Facility where the device is physically deployed.
- **Make & Model**: Hardware specifications (e.g., *Dell PowerEdge R740*, *Lenovo ThinkCentre M70q*).
- **Warranty Expiration**: Date countdown triggering preventative maintenance before vendor coverage lapses.
- **Lifecycle Status**:
  - `Active`: In production service.
  - `In Repair`: Under maintenance with internal technician or vendor RMA.
  - `Spare / Ready`: Available in IT storage for immediate deployment.
  - `Decommissioned`: Retired and securely wiped.

### Actions:
- **Register New Asset**: Click **+ Register Asset** to log serial numbers, purchase date, and department allocation.
- **Filter by Location & Category**: Narrow the inventory list by selecting specific clinics or device categories.

---

## 7. Helpdesk & Incident Response

The **Helpdesk Module** provides incident management adhering to ITIL best practices.

### Ticket Attributes:
- **Ticket ID**: Auto-generated ticket code (e.g., `INC-1042`).
- **Site / Clinic**: Affected medical center or department.
- **Issue Description**: Concise summary of the incident or service request.
- **Priority Matrix**:
  - `Critical`: System-wide outage affecting patient care or EHR availability (SLA: 1 hour).
  - `High`: Major departmental impairment with no workaround (SLA: 4 hours).
  - `Medium`: Localized problem with temporary workaround (SLA: 8 hours).
  - `Low`: General inquiry, equipment relocation, or non-urgent request (SLA: 24 hours).
- **Assigned Technician**: On-duty technician responsible for resolution.
- **Status Workflow**: `Open` ➔ `In Progress` ➔ `Resolved` ➔ `Closed`.

---

## 8. Staffing, Shifts & Scheduling

The **Staffing Module** coordinates technician rosters, monthly site allocations, and on-call rotations across all hospital campuses.

### Roster Attributes:
- **Technician Name & Contact**: Primary phone and email.
- **Role & Specialization**: System Administrator, Network Engineer, Helpdesk L1/L2 Support, Bio-medical IT Specialist.
- **Base Site**: Primary facility assignment.
- **Monthly Schedule**: Rotational schedule mapping showing shift coverage (Morning, Evening, Night On-Call).
- **Performance Rating**: 5-star metric based on closed ticket satisfaction surveys and SLA compliance.

---

## 9. Sites & Infrastructure Settings

Located under **Sites & Settings**, this module configures the organizational hierarchy of the enterprise.

- **Facilities & Clinics**: Manage site names (e.g., *Main Hospital Campus*, *North Pediatric Clinic*, *South Surgical Center*).
- **Physical Address & Contact**: Emergency IT dispatch phone numbers and building floor plans.
- **Network Subnets**: Associate IP ranges with specific clinics for automated ticket location routing.

---

## 10. Vendor Directory & Contracts

Accessed via **Vendors** in the navigation sidebar (`/#/vendors`).

### Vendor Record Details:
- **Vendor Name**: Company name (e.g., *Cisco Systems*, *Dell Technologies*, *Oracle Healthcare*).
- **Category**: Hardware Supplier, Cloud Provider, Telecommunications Carrier, Consulting Partner.
- **Contract Reference**: Service level agreement (SLA) reference number and contract term expiration.
- **Primary Account Representative**: Direct name, email, and 24/7 priority support hotline.
- **Active Invoices**: Direct link to outstanding and historical invoices associated with this vendor.

---

## 11. Invoicing & Procurement Management

Accessed via **Invoices** (`/#/invoices`) and **Create Invoice** (`/#/invoices/create`).

```
┌────────────────────────────────────────────────────────────────────────┐
│ INVOICE #INV-2026-089                                 STATUS: PAID    │
│ Vendor: Dell Technologies                             Date: 2026-10-15 │
├────────────────────────────────────────────────────────────────────────┤
│ Item Description                Qty    Unit Price        Total Price   │
│ Dell PowerEdge R740 Server       2     $4,200.00          $8,400.00   │
│ 10GbE SFP+ Optical Transceiver   4       $120.00            $480.00   │
├────────────────────────────────────────────────────────────────────────┤
│                                        Subtotal:          $8,880.00   │
│                                        Tax (10%):           $888.00   │
│                                        TOTAL:             $9,768.00   │
└────────────────────────────────────────────────────────────────────────┘
```

### Creating an Invoice:
1. Navigate to **Create Invoice** (`/#/invoices/create`).
2. Select the vendor from the dropdown or input a new vendor.
3. Specify Invoice Number, Issue Date, Due Date, and Currency.
4. Add line items: Enter description, quantity, and unit cost. The system automatically computes subtotals, configurable tax percentages, and final grand totals.
5. Upload an optional PDF receipt or contract attachment.
6. Click **Save Invoice**.

---

## 12. IT Knowledge Base & Meeting Notes

Accessed via **IT Notes** (`/#/notes`) and **Create Note** (`/#/notes/create`).

### Note Authoring:
- **Meeting Metadata**: Record meeting date, conference room / venue, attendees, and priority.
- **Rich Content & Agendas**: Write detailed markdown documentation for incident post-mortems, software migration checklists, or disaster recovery plans.
- **Tags & Search**: Organize notes with searchable tags (e.g., `#firewall`, `#hms-update`, `#backup-policy`).
- **File Attachments**: Upload network topology diagrams, configuration files, and vendor quotes directly into the note record.

---

## 13. System Settings & User Role Administration

Accessed via **Settings** (`/#/settings`) from the primary sidebar navigation.

### 13.1 User Roles & Access Management
The **User Roles & Access** tab provides enterprise-grade identity and access management:
- **Active / In-Active Account Status**: Toggle users between `Active` and `In-Active` with a single click. In-active accounts are immediately barred from logging into the platform (`HTTP 403 Forbidden`).
- **Direct Password Reset**: Click the amber Key icon on any user row to open the quick Reset Password modal. Administrators can input a custom password or click **"Generate Strong"** to produce a 12-character high-entropy secret, with a one-click copy-to-clipboard button and password visibility toggle.
- **Edit User Account**: Click the pencil icon to modify full name, email, system role (`Owner`, `Admin`, `User`), account status, module permissions (Dashboard, IT Suite, Pro Access), or set a new password.
- **Delete User Account**: Permanently remove user profiles with confirmation. The system enforces strict protection preventing administrators from deleting their own active account.
- **Add New User**: Use the **+ Add User** button to register a team member directly with predefined roles and permissions.
- **Search & Filters**: Instantly filter users by name, email, role, or active status.

### 13.2 Profile & Personal Settings
Accessed via **Account** (`/#/account`):
- **User Profile**: Update your personal display name, email, and avatar.
- **Security**: Update personal passwords securely with bcrypt encryption.
- **Role Badges**: Review currently assigned enterprise roles and access permissions.
