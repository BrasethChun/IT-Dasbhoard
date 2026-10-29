# GoDaddy MySQL Primary Database Persistence & Auto-Reconnection

Lock GoDaddy MySQL as the permanent primary database across server reboots, eliminating unintended resets to local storage while providing resilient auto-retries, in-memory failover, and automated reconnection upon network recovery.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed in Phase 1:
> - **Connection Drop Strategy**: Auto-retry GoDaddy with temporary in-memory fallback and automated background reconnection. The system will **never** permanently overwrite `.env` or delete GoDaddy connection parameters during transient outages.
> - **Configuration Persistence**: GoDaddy MySQL will remain locked as the permanent primary database across container restarts and reboots.
> - **Telegram Notifications**: Real-time alerts will notify administrators via `kipchelpdesk_bot` when remote connectivity drops and when connection is successfully restored.

---

### 1. Overview & Core Concept

Currently, when any database query to GoDaddy MySQL times out or drops an idle connection (`ETIMEDOUT`, `PROTOCOL_CONNECTION_LOST`), the database proxy executes `resetToLocalDb()`, which permanently rewrites `.env` to `127.0.0.1` and clears the remote host settings. This forces systems administrators to manually re-enter their GoDaddy configuration.

This upgrade transforms the connection architecture into an **Enterprise Dual-Tier Database Engine**:
1. **Locked Primary Tier (GoDaddy Remote MySQL)**: The authoritative configuration in `.env` stays locked to GoDaddy.
2. **Transient Failover Tier (Local MariaDB Replica)**: If a GoDaddy network glitch occurs, the system temporarily services the query from the local replica to prevent user downtime, while keeping GoDaddy locked as primary.
3. **Automated Health Prober & Reconnection Worker**: Pings GoDaddy every 30 seconds. As soon as GoDaddy is reachable, queries immediately route back to GoDaddy and a recovery notice is dispatched to Telegram.

---

### 2. User Experience & Visual Design

#### A. Database Center Status View (`DatabaseMigrationModule.tsx`)
- **Primary Database Lock Badge**: A clear indicator showing `Primary Database: GoDaddy Remote (Locked)` with a lock icon.
- **Failover & Reconnection Pill**: Displays real-time state:
  - `🟢 Connected to GoDaddy MySQL (Primary Active)`
  - `🟡 GoDaddy Temporary Hiccup (Auto-Retrying · Local Replica Buffering)`
- **One-Click Manual Controls**:
  - `Lock as Permanent Primary`: Persists GoDaddy credentials in `.env` and `backup_config.json`.
  - `Revert Primary to Local MariaDB`: Explicit admin-initiated switch without accidental resets.
  - `Test Connection & Ping`: Live diagnostic button verifying latency and table schemas.

#### B. Visual Hierarchy & Theme Compliance
- Strict adherence to the SaaS & Dashboard guidelines: clean 1px border lines, unboxed metadata text with `·` separators, and tabular numeric values (`tabular-nums`) for latency and timestamps.
- Zero decorative pulsing dots on static text; status indicators reserved solely for active connection state.

---

### 3. Key Product Decisions & Trade-Offs

#### Decision 1: In-Memory Transient Failover vs. Permanent Configuration Reset
- **Chosen Approach**: In-memory transient fallback. When a query to GoDaddy fails, the system logs the incident, sends a Telegram alert, and routes the single query or active session to the local replica **without altering the `.env` file**.
- **Why**: Prevents permanent configuration loss caused by routine 30-second GoDaddy idle timeouts or Cloud Run network blips.
- **Alternatives Considered**: Complete process termination or immediate 500 error (rejected because it breaks active user sessions).

#### Decision 2: Connection Pool Keep-Alive Tuning for GoDaddy cPanel
- **Chosen Approach**: Configure `mysql2` with aggressive TCP keep-alive (`enableKeepAlive: true`, `keepAliveInitialDelay: 5000`), connection validation before borrow, and automatic reconnect on `PROTOCOL_CONNECTION_LOST`.
- **Why**: GoDaddy cPanel MySQL has aggressive idle timeouts that drop socket connections every 60 seconds. Client-side keep-alive packets prevent socket closure.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       Express Backend                       │
│                                                             │
│   Incoming Request  ──►  Resilient DB Proxy (getDb)         │
│                                    │                        │
│                 ┌──────────────────┴──────────────────┐     │
│                 ▼                                     ▼     │
│       [Primary: GoDaddy MySQL]             [Failover Replica]│
│       Host: *.secureserver.net             Host: 127.0.0.1  │
│       Database: khema_ainotes              Database: local  │
│                 │                                     │     │
│                 ▼ (If transient drop)                 │     │
│       Trigger Telegram Alert                          │     │
│       Keep .env locked to GoDaddy                     │     │
│       Temporary in-memory buffer ─────────────────────┘     │
│                 ▲                                           │
│                 │                                           │
│       Background Health Prober (every 30s)                  │
│       Auto-reconnects when GoDaddy responds                 │
└─────────────────────────────────────────────────────────────┘
```

#### Component & File Updates
1. `server.ts`:
   - Refactor `getDb()` to eliminate destructive `resetToLocalDb()` on `.env`.
   - Implement `isGoDaddyPrimaryLocked: boolean` flag loaded from `.env` (`PRIMARY_DB=godaddy`).
   - Add query auto-retry with exponential backoff before transient failover.
   - Configure connection pool keep-alive (`enableKeepAlive: true`, `keepAliveInitialDelay: 5000`, `maxIdle: 5`).
2. `start-db.sh`:
   - Preserve remote GoDaddy configuration in `.env` across container reboots, ensuring it is never overwritten by local setup scripts.
3. `telegramAlertService.ts`:
   - Align alert dispatch so it clarifies: *"GoDaddy temporary hiccup detected. System serving from replica while actively auto-reconnecting. Configuration remains locked."*
4. `pages/dashboard/DatabaseMigrationModule.tsx`:
   - Update UI status cards to display Permanent Primary status, active failover posture, and real-time reconnection telemetry.
