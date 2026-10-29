import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env'), override: true });
dotenv.config({ override: true });

import express from 'express';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import multer from 'multer';
import crypto from 'crypto';
import cron from 'node-cron';
import axios from 'axios';
import { initMailTables, setupMailRoutes } from './mailServer';
import { setupBackupRoutes } from './backupManager';
import { 
  notifyGoDaddyDisconnection, 
  startRemoteDatabaseHeartbeat, 
  setupTelegramAlertRoutes 
} from './telegramAlertService';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

// Primary GoDaddy MySQL Database Configuration
const GODADDY_CONFIG = {
  host: '118.139.180.163',
  port: 3306,
  user: 'khema_dbuser',
  password: 'Y+k,C=JAEA4nR+0*',
  database: 'khema_ainotes',
  ssl: false
};

const LOCAL_CONFIG = {
  host: '127.0.0.1',
  port: 3306,
  user: 'ainotes_user',
  password: 'x!gmx^-hQhkn5JEw',
  database: 'ainotes_db',
  ssl: false
};

let primaryPool: mysql.Pool | null = null;
let fallbackPool: mysql.Pool | null = null;
let isFailoverActive = false;
let failoverReason = '';
let lastFailoverAt: string | null = null;

function createDirectPool(config?: {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
}): mysql.Pool {
  const host = config?.host || process.env.MYSQL_HOST || GODADDY_CONFIG.host;
  const port = Number(config?.port || process.env.MYSQL_PORT) || GODADDY_CONFIG.port;
  const user = config?.user || process.env.MYSQL_USER || GODADDY_CONFIG.user;
  const password = config?.password !== undefined ? config.password : (process.env.MYSQL_PASSWORD ?? GODADDY_CONFIG.password);
  const database = config?.database || process.env.MYSQL_DATABASE || GODADDY_CONFIG.database;
  const isSsl = config?.ssl !== undefined ? config.ssl : (process.env.MYSQL_SSL === 'true' || GODADDY_CONFIG.ssl);

  return mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 8000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 5000,
    ssl: isSsl ? { rejectUnauthorized: false } : undefined
  });
}

function getFallbackPool(): mysql.Pool {
  if (!fallbackPool) {
    fallbackPool = mysql.createPool({
      host: LOCAL_CONFIG.host,
      port: LOCAL_CONFIG.port,
      user: LOCAL_CONFIG.user,
      password: LOCAL_CONFIG.password,
      database: LOCAL_CONFIG.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 4000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 5000
    });
  }
  return fallbackPool;
}

function explicitlySwitchToLocalDb(): mysql.Pool {
  console.warn('[Database Admin Action] Explicitly reverting primary database to local ainotes_db instance.');
  process.env.MYSQL_HOST = LOCAL_CONFIG.host;
  process.env.MYSQL_PORT = String(LOCAL_CONFIG.port);
  process.env.MYSQL_USER = LOCAL_CONFIG.user;
  process.env.MYSQL_PASSWORD = LOCAL_CONFIG.password;
  process.env.MYSQL_DATABASE = LOCAL_CONFIG.database;
  process.env.MYSQL_SSL = 'false';
  process.env.PRIMARY_DB = 'local';
  process.env.PRIMARY_LOCKED = 'false';

  updateEnvFile({
    MYSQL_HOST: LOCAL_CONFIG.host,
    MYSQL_PORT: String(LOCAL_CONFIG.port),
    MYSQL_USER: LOCAL_CONFIG.user,
    MYSQL_PASSWORD: LOCAL_CONFIG.password,
    MYSQL_DATABASE: LOCAL_CONFIG.database,
    MYSQL_SSL: 'false',
    PRIMARY_DB: 'local',
    PRIMARY_LOCKED: 'false'
  });

  if (primaryPool) {
    try { primaryPool.end().catch(() => {}); } catch {}
    primaryPool = null;
  }

  isFailoverActive = false;
  failoverReason = '';

  primaryPool = createDirectPool(LOCAL_CONFIG);
  return primaryPool;
}

function getDb(): mysql.Pool {
  if (!primaryPool) {
    primaryPool = createDirectPool();
  }

  const isLockedToGoDaddy = (process.env.PRIMARY_LOCKED === 'true' || process.env.PRIMARY_DB === 'godaddy' || !process.env.MYSQL_HOST || process.env.MYSQL_HOST === '118.139.180.163');

  // When GoDaddy is locked as primary, connect directly to GoDaddy without falling back to 127.0.0.1
  if (isLockedToGoDaddy) {
    return primaryPool;
  }

  const isRemoteConfigured = (process.env.MYSQL_HOST && process.env.MYSQL_HOST !== '127.0.0.1' && process.env.MYSQL_HOST !== 'localhost');

  // If local standalone mode, return primary pool directly
  if (!isRemoteConfigured) {
    return primaryPool;
  }

  // Resilient Proxy for Remote GoDaddy with In-Memory Local MariaDB Fallback
  return new Proxy(primaryPool, {
    get(target, prop, receiver) {
      if (prop === 'query' || prop === 'execute') {
        return async (...args: any[]) => {
          // If in-memory failover is already active, direct immediately to local MariaDB replica buffer
          if (isFailoverActive) {
            const fallback = getFallbackPool();
            return await (fallback as any)[prop](...args);
          }

          try {
            return await (target as any)[prop](...args);
          } catch (err: any) {
            const isConnectionLoss = 
              err?.code === 'ER_BAD_DB_ERROR' || 
              err?.code === 'ECONNREFUSED' || 
              err?.code === 'ETIMEDOUT' ||
              err?.code === 'ENOTFOUND' ||
              err?.code === 'EHOSTUNREACH' ||
              err?.code === 'ECONNRESET' ||
              err?.code === 'PROTOCOL_CONNECTION_LOST';

            if (isConnectionLoss) {
              console.warn(`[GoDaddy MySQL Connection Drop] (${err.code}: ${err.message}). Retrying once after 500ms...`);
              await new Promise(res => setTimeout(res, 500));
              try {
                return await (target as any)[prop](...args);
              } catch (retryErr: any) {
                // Secondary check failed: GoDaddy is temporarily unreachable
                console.warn(`[GoDaddy In-Memory Failover Activated] Primary host ${process.env.MYSQL_HOST} unreachable (${retryErr.code}). Buffering in local MariaDB without modifying .env configuration.`);
                isFailoverActive = true;
                failoverReason = `${retryErr.code}: ${retryErr.message}`;
                lastFailoverAt = new Date().toISOString();

                // Dispatch Telegram alert asynchronously without blocking query execution
                notifyGoDaddyDisconnection({
                  host: process.env.MYSQL_HOST,
                  database: process.env.MYSQL_DATABASE,
                  errorCode: retryErr.code,
                  errorMessage: retryErr.message,
                  actionTaken: 'GoDaddy configuration remains locked as Primary. Application temporarily buffering queries in local MariaDB replica to maintain 100% uptime with zero data loss. Auto-reconnection will resume GoDaddy traffic automatically once reachable.'
                }).catch(e => console.warn('Telegram alert notice:', e.message));

                const fallback = getFallbackPool();
                return await (fallback as any)[prop](...args);
              }
            }
            throw err;
          }
        };
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}

function updateEnvFile(newConfig: Record<string, string>) {
  const envPath = path.join(process.cwd(), '.env');
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  for (const [key, val] of Object.entries(newConfig)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${val}`);
    } else {
      content += `\n${key}=${val}`;
    }
  }
  fs.writeFileSync(envPath, content.trim() + '\n', 'utf8');
}

// Ensure uploads dir
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({ dest: 'uploads/' });

function mapDbToNote(row: any) {
  let tags = row.tags;
  let attachments = row.attachments;
  if(typeof tags === 'string') {
    try { tags = JSON.parse(tags); } catch { tags = []; }
  }
  if(typeof attachments === 'string') {
    try { attachments = JSON.parse(attachments); } catch { attachments = []; }
  }

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    thumbnailUrl: row.thumbnail_url,
    tags: tags || [],
    attachments: attachments || [],
    meetingDate: row.meeting_date,
    meetingVenue: row.meeting_venue,
    agenda: row.agenda,
    meetingPriority: row.meeting_priority
  };
}

async function startServer() {
  const app = express();
  // Bind to dynamic hosting environment PORT (GoDaddy, Cloud Run, Passenger) or default to 3000
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  
  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ error: "No token provided" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(401).json({ error: "Invalid token" });
      req.user = user;
      next();
    });
  };

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', dbConfigured: !!process.env.MYSQL_HOST });
  });

  // --- DATABASE MIGRATION & GODADDY MYSQL ENDPOINTS ---

  // Download GoDaddy phpMyAdmin SQL Migration Dump
  app.get('/api/db/export-godaddy', (req, res) => {
    try {
      const dumpPath = path.join(process.cwd(), 'godaddy_migration_dump.sql');
      const fallbackPath = path.join(process.cwd(), 'ainotes_db.sql');
      const targetFile = fs.existsSync(dumpPath) ? dumpPath : fallbackPath;
      
      if (!fs.existsSync(targetFile)) {
        return res.status(404).json({ error: 'Migration SQL file not found' });
      }

      res.setHeader('Content-Disposition', 'attachment; filename="godaddy_ainotes_migration.sql"');
      res.setHeader('Content-Type', 'application/sql');
      fs.createReadStream(targetFile).pipe(res);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to export migration SQL: ' + err.message });
    }
  });

  // Get current DB connection info & table statistics (Restricted to Owner account for security)
  app.get('/api/db/status', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const [userRows]: any = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
      if (!userRows || userRows.length === 0 || userRows[0].role !== 'owner') {
        return res.status(403).json({ error: 'Access denied: SQL status is restricted to Owner accounts only for security.' });
      }

      const configuredHost = process.env.MYSQL_HOST || '127.0.0.1';
      const isRemote = configuredHost !== 'localhost' && configuredHost !== '127.0.0.1';
      const isPrimaryLocked = process.env.PRIMARY_LOCKED === 'true' || isRemote;
      const primaryDb = isRemote ? 'godaddy' : 'local';

      const startTime = Date.now();
      await db.query('SELECT 1');
      const pingMs = Date.now() - startTime;

      let activeHost = configuredHost;
      let statusText = 'Connected';

      if (isFailoverActive) {
        activeHost = '127.0.0.1 (Local MariaDB Replica Buffer)';
        statusText = 'Temporary Local Buffer Active (Auto-reconnecting GoDaddy...)';
      } else if (isRemote) {
        statusText = 'GoDaddy Remote Primary (Locked & Live)';
      } else {
        statusText = 'Local MariaDB Active';
      }

      const [notesCount]: any = await db.query('SELECT COUNT(*) as c FROM notes').catch(() => [[{ c: 0 }]]);
      const [subsCount]: any = await db.query('SELECT COUNT(*) as c FROM it_cloud_subscriptions').catch(() => [[{ c: 0 }]]);
      const [assetsCount]: any = await db.query('SELECT COUNT(*) as c FROM it_assets').catch(() => [[{ c: 0 }]]);
      const [ticketsCount]: any = await db.query('SELECT COUNT(*) as c FROM helpdesk').catch(() => [[{ c: 0 }]]);
      const [staffCount]: any = await db.query('SELECT COUNT(*) as c FROM it_staffing').catch(() => [[{ c: 0 }]]);
      const [usersCount]: any = await db.query('SELECT COUNT(*) as c FROM users').catch(() => [[{ c: 0 }]]);

      res.json({
        host: configuredHost,
        activeHost,
        port: Number(process.env.MYSQL_PORT) || 3306,
        database: process.env.MYSQL_DATABASE || 'ainotes_db',
        user: process.env.MYSQL_USER || 'ainotes_user',
        isRemote,
        primaryDb,
        isPrimaryLocked,
        isFailoverActive,
        failoverReason: isFailoverActive ? failoverReason : null,
        lastFailoverAt: isFailoverActive ? lastFailoverAt : null,
        sslEnabled: process.env.MYSQL_SSL === 'true',
        status: statusText,
        latencyMs: pingMs,
        outboundIp: '34.34.254.10',
        counts: {
          notes: notesCount[0]?.c || 0,
          subscriptions: subsCount[0]?.c || 0,
          assets: assetsCount[0]?.c || 0,
          tickets: ticketsCount[0]?.c || 0,
          staff: staffCount[0]?.c || 0,
          users: usersCount[0]?.c || 0
        }
      });
    } catch (err: any) {
      res.status(500).json({
        status: 'Error',
        host: process.env.MYSQL_HOST || '127.0.0.1',
        isFailoverActive,
        error: err.message
      });
    }
  });

  // Test GoDaddy Remote Connection
  app.post('/api/db/test-connection', authenticateToken, async (req: any, res) => {
    const { host, port, user, password, database, ssl } = req.body;
    if (!host || !user || !database) {
      return res.status(400).json({ error: 'Host, database name, and user are required.' });
    }

    let testConn: any = null;
    try {
      const startTime = Date.now();
      testConn = await mysql.createConnection({
        host: host.trim(),
        port: Number(port) || 3306,
        user: user.trim(),
        password: password || '',
        database: database.trim(),
        connectTimeout: 8000,
        ssl: ssl ? { rejectUnauthorized: false } : undefined
      });

      await testConn.query('SELECT 1');
      const [tables]: any = await testConn.query('SHOW TABLES');
      const latency = Date.now() - startTime;
      const tableNames = tables.map((t: any) => Object.values(t)[0]);

      await testConn.end();
      testConn = null;

      res.json({
        success: true,
        message: 'Successfully connected to GoDaddy MySQL server!',
        latencyMs: latency,
        tablesCount: tableNames.length,
        tablesFound: tableNames
      });
    } catch (err: any) {
      if (testConn) {
        try { await testConn.end(); } catch {}
      }

      let friendlyMsg = err.message || 'Connection failed';
      if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        friendlyMsg = `Could not reach GoDaddy host at ${host}:${port || 3306}. Please ensure you have added '%' (or outbound IP 34.34.254.10) in cPanel -> Remote MySQL, and that your server hostname is correct.`;
      } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        friendlyMsg = `Access denied for user '${user}'. In GoDaddy cPanel, go to 'Remote MySQL' and add '%' (or outbound IP 34.34.254.10) to the Access Hosts list. Also ensure user '${user}' is assigned to database '${database}' with ALL PRIVILEGES.`;
      } else if (err.code === 'ER_BAD_DB_ERROR') {
        friendlyMsg = `Database '${database}' does not exist on this server. Please create it first in GoDaddy cPanel MySQL Database Wizard.`;
      }

      res.status(400).json({
        success: false,
        error: friendlyMsg,
        rawCode: err.code
      });
    }
  });

  // Apply & Lock GoDaddy Database Configuration as Permanent Primary
  app.post('/api/db/apply-config', authenticateToken, async (req: any, res) => {
    const { host, port, user, password, database, ssl } = req.body;
    if (!host || !user || !database) {
      return res.status(400).json({ error: 'Host, database name, and user are required.' });
    }

    const cleanHost = host.trim();
    const cleanPort = String(Number(port) || 3306);
    const cleanUser = user.trim();
    const cleanPassword = password || '';
    const cleanDb = database.trim();
    const cleanSsl = ssl ? 'true' : 'false';

    let testConn: any = null;
    try {
      // 1. Validate connection first
      testConn = await mysql.createConnection({
        host: cleanHost,
        port: Number(cleanPort),
        user: cleanUser,
        password: cleanPassword,
        database: cleanDb,
        connectTimeout: 8000,
        ssl: ssl ? { rejectUnauthorized: false } : undefined
      });
      await testConn.query('SELECT 1');
      await testConn.end();
      testConn = null;

      // 2. Update process.env and permanently lock as primary
      process.env.MYSQL_HOST = cleanHost;
      process.env.MYSQL_PORT = cleanPort;
      process.env.MYSQL_USER = cleanUser;
      process.env.MYSQL_PASSWORD = cleanPassword;
      process.env.MYSQL_DATABASE = cleanDb;
      process.env.MYSQL_SSL = cleanSsl;
      process.env.PRIMARY_DB = 'godaddy';
      process.env.PRIMARY_LOCKED = 'true';

      // 3. Persist to .env permanently
      updateEnvFile({
        MYSQL_HOST: cleanHost,
        MYSQL_PORT: cleanPort,
        MYSQL_USER: cleanUser,
        MYSQL_PASSWORD: cleanPassword,
        MYSQL_DATABASE: cleanDb,
        MYSQL_SSL: cleanSsl,
        PRIMARY_DB: 'godaddy',
        PRIMARY_LOCKED: 'true'
      });

      // 4. Reset pools and failover state
      if (primaryPool) {
        await primaryPool.end().catch(() => {});
        primaryPool = null;
      }
      isFailoverActive = false;
      failoverReason = '';
      lastFailoverAt = null;

      // 5. Initialize fresh primary pool
      primaryPool = createDirectPool();
      await primaryPool.query('SELECT 1');

      res.json({
        success: true,
        message: `GoDaddy MySQL locked as permanent Primary: ${cleanHost} (${cleanDb}). Auto-failover and auto-reconnect are active.`
      });
    } catch (err: any) {
      if (testConn) {
        try { await testConn.end(); } catch {}
      }

      // CRITICAL: DO NOT erase .env or revert on failure!
      let friendlyMsg = err.message || 'Connection failed';
      if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        friendlyMsg = `Could not reach GoDaddy host at ${cleanHost}:${cleanPort}. Please ensure you have added '%' (or outbound IP 34.34.254.10) in cPanel -> Remote MySQL.`;
      } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        friendlyMsg = `Access denied for user '${cleanUser}'. In GoDaddy cPanel, go to 'Remote MySQL' and add '%' (or outbound IP 34.34.254.10) to the Access Hosts list. Also ensure user '${cleanUser}' is assigned to database '${cleanDb}' with ALL PRIVILEGES.`;
      } else if (err.code === 'ER_BAD_DB_ERROR') {
        friendlyMsg = `Database '${cleanDb}' does not exist on this server. Please create it first in GoDaddy cPanel MySQL Database Wizard.`;
      }

      res.status(400).json({ error: friendlyMsg, rawCode: err.code });
    }
  });

  // Revert back to local database (explicit admin action only)
  app.post('/api/db/revert-local', authenticateToken, async (req: any, res) => {
    try {
      const localPool = explicitlySwitchToLocalDb();
      await localPool.query('SELECT 1');

      res.json({
        success: true,
        message: 'Successfully reverted database to local instance (ainotes_db).'
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to revert database: ' + err.message });
    }
  });

  // Manual trigger to test or resume GoDaddy primary connection immediately
  app.post('/api/db/retry-godaddy', authenticateToken, async (req: any, res) => {
    try {
      const currentHost = process.env.MYSQL_HOST || '127.0.0.1';
      const isRemote = currentHost !== '127.0.0.1' && currentHost !== 'localhost';

      if (!isRemote) {
        return res.status(400).json({ error: 'No remote GoDaddy database is configured as primary.' });
      }

      const startTime = Date.now();
      const testConn = await mysql.createConnection({
        host: currentHost,
        port: Number(process.env.MYSQL_PORT) || 3306,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        connectTimeout: 6000,
        ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
      });
      await testConn.query('SELECT 1');
      const latencyMs = Date.now() - startTime;
      await testConn.end();

      // If test succeeded, reconnect primary pool
      if (primaryPool) {
        await primaryPool.end().catch(() => {});
        primaryPool = null;
      }
      primaryPool = createDirectPool();
      await primaryPool.query('SELECT 1');

      isFailoverActive = false;
      failoverReason = '';
      lastFailoverAt = null;

      res.json({
        success: true,
        latencyMs,
        message: `Successfully reconnected to GoDaddy MySQL server (${latencyMs}ms)! Live traffic resumed on Primary.`
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: `Could not reach GoDaddy host ${process.env.MYSQL_HOST}: ${err.message}`,
        rawCode: err.code
      });
    }
  });


  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const email = req.body.email?.trim()?.toLowerCase();
      const { password, full_name, display_name } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const db = getDb();
      if (!db) {
         return res.status(500).json({ error: 'Database could not be initialized.'});
      }

      // Check if user already exists
      const [existing]: any = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Email already in use.' });
      }
      
      const id = crypto.randomUUID();
      await db.query(
        'INSERT INTO users (id, email, password, full_name, display_name) VALUES (?, ?, ?, ?, ?)',
        [id, email, hashedPassword, full_name, display_name]
      );
      
      const user = { 
        id, 
        email, 
        name: full_name || display_name,
        full_name,
        display_name,
        role: 'user',
        can_access_welcome: true,
        can_access_it: false,
        can_access_pro: false
      };
      const token = jwt.sign({ id, email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ user, token });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const email = req.body.email?.trim()?.toLowerCase();
      const { password } = req.body;
      const db = getDb();
      if (!db) {
         return res.status(500).json({ error: 'Database could not be initialized.'});
      }
      const [rows]: any = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length === 0) return res.status(400).json({ error: 'Invalid email or password' });
      
      const valid = await bcrypt.compare(password, rows[0].password);
      if (!valid) return res.status(400).json({ error: 'Invalid email or password' });

      if (rows[0].status === 'Inactive') {
        return res.status(403).json({ error: 'This user account is currently inactive. Please contact the administrator.' });
      }
      
      const user = { 
        id: rows[0].id, 
        email: rows[0].email, 
        name: rows[0].full_name || rows[0].display_name,
        full_name: rows[0].full_name,
        display_name: rows[0].display_name,
        role: rows[0].role,
        status: rows[0].status || 'Active',
        can_access_welcome: rows[0].can_access_welcome,
        can_access_it: rows[0].can_access_it,
        can_access_pro: rows[0].can_access_pro
      };
      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ user, token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const email = req.body.email?.trim()?.toLowerCase();
      const db = getDb();
      // Safely ensure columns exist
      await db.query('ALTER TABLE users ADD COLUMN reset_token VARCHAR(255)').catch(e => {});
      await db.query('ALTER TABLE users ADD COLUMN reset_token_expires BIGINT').catch(e => {});
      
      const [rows]: any = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        return res.json({ success: true, message: 'If an account exists, a reset link will be sent.' });
      }
      
      const token = crypto.randomBytes(32).toString('hex');
      const expires = Date.now() + 3600000; // 1 hour
      
      await db.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?', [token, expires, email]);
      
      console.log(`Password reset link requested: /#/reset-password?token=${token}`);
      
      // In a real app we'd send an email. For demo, we return the token directly so the user can test it
      res.json({ success: true, message: 'Password reset link sent (check console).', token });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }
      const db = getDb();
      const [rows]: any = await db.query('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?', [token, Date.now()]);
      
      if (rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hashedPassword, rows[0].id]);
      
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '396522502341-jsusuml98fi8j4uf27i89ta73k05ofv6.apps.googleusercontent.com';
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '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';

  app.get('/api/auth/google/url', (req, res) => {
    const redirectUri = req.query.redirectUri as string;
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." });
    }
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: redirectUri // pass redirect_uri through state so the callback knows it
    });
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    res.json({ url: authUrl });
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    const { code, state } = req.query; // we can pass redirectUri via state!
    const redirectUri = state as string;

    try {
      if (!code) throw new Error("No code provided");

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        })
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.id_token) throw new Error("Failed to get ID token from Google");

      const payload = JSON.parse(Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString());
      
      const email = payload.email?.trim()?.toLowerCase();
      const full_name = payload.name;
      const display_name = payload.given_name;

      const db = getDb();
      let [rows]: any = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      let user;

      if (rows.length === 0) {
        const id = crypto.randomUUID();
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        await db.query(
          'INSERT INTO users (id, email, password, full_name, display_name) VALUES (?, ?, ?, ?, ?)',
          [id, email, hashedPassword, full_name, display_name || full_name]
        );
        user = { 
          id, 
          email, 
          name: full_name,
          full_name,
          display_name: display_name || full_name,
          role: 'user',
          can_access_welcome: true,
          can_access_it: false,
          can_access_pro: false
        };
      } else {
        user = { 
          id: rows[0].id, 
          email: rows[0].email, 
          name: rows[0].full_name || rows[0].display_name,
          full_name: rows[0].full_name,
          display_name: rows[0].display_name,
          role: rows[0].role,
          can_access_welcome: rows[0].can_access_welcome,
          can_access_it: rows[0].can_access_it,
          can_access_pro: rows[0].can_access_pro
        };
      }

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${token}', user: ${JSON.stringify(user)} }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (e: any) {
      console.error(e);
      res.status(500).send(`Authentication failed: ${e.message}`);
    }
  });
  
  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
     try {
       const db = getDb();
       const [rows]: any = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
       if (rows && rows.length > 0) {
         res.json({ user: rows[0] });
       } else {
         res.status(401).json({ error: "User session expired or not found" });
       }
     } catch (e: any) {
       res.status(500).json({ error: e.message });
     }
  });

  app.get('/api/users', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await db.query('ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT "user"').catch(e => {});
      await db.query('ALTER TABLE users ADD COLUMN can_access_welcome BOOLEAN DEFAULT TRUE').catch(e => {});
      await db.query('ALTER TABLE users ADD COLUMN can_access_it BOOLEAN DEFAULT FALSE').catch(e => {});
      await db.query('ALTER TABLE users ADD COLUMN can_access_pro BOOLEAN DEFAULT FALSE').catch(e => {});
      await db.query('ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT "Active"').catch(e => {});
      const [rows] = await db.query('SELECT id, email, full_name, display_name, role, COALESCE(status, "Active") as status, can_access_welcome, can_access_it, can_access_pro FROM users ORDER BY created_at DESC');
      res.json(rows);
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/users/:id/role', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { role, can_access_welcome, can_access_it, can_access_pro, status } = req.body;
      const { id } = req.params;
      
      let updateFields = [];
      let params = [];
      
      if (role !== undefined) {
        updateFields.push('role = ?');
        params.push(role);
      }
      if (can_access_welcome !== undefined) {
        updateFields.push('can_access_welcome = ?');
        params.push(can_access_welcome ? 1 : 0);
      }
      if (can_access_it !== undefined) {
        updateFields.push('can_access_it = ?');
        params.push(can_access_it ? 1 : 0);
      }
      if (can_access_pro !== undefined) {
        updateFields.push('can_access_pro = ?');
        params.push(can_access_pro ? 1 : 0);
      }
      if (status !== undefined) {
        updateFields.push('status = ?');
        params.push(status);
      }
      
      if (updateFields.length > 0) {
        params.push(id);
        await db.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, params);
      }
      
      res.json({ success: true });
    } catch(e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/users/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { full_name, display_name, email, role, status, can_access_welcome, can_access_it, can_access_pro, password } = req.body;
      const { id } = req.params;

      let updateFields: string[] = [];
      let params: any[] = [];

      if (full_name !== undefined) {
        updateFields.push('full_name = ?');
        params.push(full_name);
      }
      if (display_name !== undefined) {
        updateFields.push('display_name = ?');
        params.push(display_name);
      }
      if (email !== undefined) {
        updateFields.push('email = ?');
        params.push(email.trim().toLowerCase());
      }
      if (role !== undefined) {
        updateFields.push('role = ?');
        params.push(role);
      }
      if (status !== undefined) {
        updateFields.push('status = ?');
        params.push(status);
      }
      if (can_access_welcome !== undefined) {
        updateFields.push('can_access_welcome = ?');
        params.push(can_access_welcome ? 1 : 0);
      }
      if (can_access_it !== undefined) {
        updateFields.push('can_access_it = ?');
        params.push(can_access_it ? 1 : 0);
      }
      if (can_access_pro !== undefined) {
        updateFields.push('can_access_pro = ?');
        params.push(can_access_pro ? 1 : 0);
      }
      if (password && password.trim().length >= 6) {
        const hashedPassword = await bcrypt.hash(password.trim(), 10);
        updateFields.push('password = ?');
        params.push(hashedPassword);
      }

      if (updateFields.length > 0) {
        params.push(id);
        await db.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, params);
      }

      const [updatedRows]: any = await db.query('SELECT id, email, full_name, display_name, role, COALESCE(status, "Active") as status, can_access_welcome, can_access_it, can_access_pro FROM users WHERE id = ?', [id]);
      res.json(updatedRows[0]);
    } catch(e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/users/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      
      // Prevent deleting own account
      if (req.user?.id === id) {
        return res.status(400).json({ error: 'You cannot delete your own active account.' });
      }

      await db.query('DELETE FROM users WHERE id = ?', [id]);
      res.json({ success: true, message: 'User deleted successfully.' });
    } catch(e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/users/:id/reset-password', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { password } = req.body;

      if (!password || password.trim().length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

      res.json({ success: true, message: 'Password has been reset successfully.' });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Notes Routes
  app.get('/api/notes', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await db.query('ALTER TABLE notes ADD COLUMN meeting_date VARCHAR(100)').catch(e => {});
      await db.query('ALTER TABLE notes ADD COLUMN meeting_venue VARCHAR(255)').catch(e => {});
      await db.query('ALTER TABLE notes ADD COLUMN agenda TEXT').catch(e => {});
      await db.query('ALTER TABLE notes ADD COLUMN meeting_priority VARCHAR(50)').catch(e => {});
      await db.query('ALTER TABLE notes ADD COLUMN telegram_alert_sent BOOLEAN DEFAULT FALSE').catch(e => {});
      const [userRows]: any = await db.query('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC', [req.user.id]);
      const [userProfile]: any = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
      const role = userProfile?.[0]?.role || req.user.role;
      if (role === 'owner' || role === 'admin' || userRows.length === 0) {
        const [allRows]: any = await db.query('SELECT * FROM notes ORDER BY updated_at DESC');
        return res.json(allRows.map(mapDbToNote));
      }
      res.json(userRows.map(mapDbToNote));
    } catch (e: any) {
      if (e.code === 'ER_ACCESS_DENIED_ERROR') {
        return res.status(500).json({ error: 'Database access denied. Please ensure your MySQL user has permissions to connect from this server\'s IP.' });
      }
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/notes/count', authenticateToken, async (req: any, res: any) => {
     try {
       if (!req.user || !req.user.id) {
          return res.status(401).json({ error: 'Unauthorized' });
       }
       const db = getDb();
       const [rows]: any = await db.query('SELECT COUNT(*) as count FROM notes WHERE user_id = ?', [req.user.id]);
       res.json({ count: rows[0].count });
     } catch (e: any) {
       let msg = e.message;
       if (e.code === 'ER_ACCESS_DENIED_ERROR') {
          msg = 'Database access denied. Please ensure your MySQL user has permissions to connect from this server\'s IP, and the credentials are correct.';
       }
       res.status(500).json({ error: msg });
     }
  });

  app.get('/api/notes/:id', authenticateToken, async (req: any, res: any) => {
    try {
      const db = getDb();
      const [userProfile]: any = await db.query('SELECT role, can_access_it FROM users WHERE id = ?', [req.user.id]);
      const role = userProfile?.[0]?.role || req.user.role;
      const isPrivileged = role === 'owner' || role === 'admin' || userProfile?.[0]?.can_access_it;

      const [rows]: any = isPrivileged
        ? await db.query('SELECT * FROM notes WHERE id = ?', [req.params.id])
        : await db.query('SELECT * FROM notes WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [req.params.id, req.user.id]);

      if (rows.length === 0) return res.status(404).json({ error: 'Note not found' });
      res.json(mapDbToNote(rows[0]));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/public/notes/:id', async (req: any, res: any) => {
    try {
      const db = getDb();
      const [rows]: any = await db.query('SELECT * FROM notes WHERE id = ?', [req.params.id]);
      if(rows.length === 0) return res.status(404).json({ error: 'Note not found' });
      res.json(mapDbToNote(rows[0]));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/notes', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await db.query('ALTER TABLE notes ADD COLUMN meeting_date VARCHAR(100)').catch(e => {});
      await db.query('ALTER TABLE notes ADD COLUMN meeting_venue VARCHAR(255)').catch(e => {});
      await db.query('ALTER TABLE notes ADD COLUMN agenda TEXT').catch(e => {});
      await db.query('ALTER TABLE notes ADD COLUMN meeting_priority VARCHAR(50)').catch(e => {});
      await db.query('ALTER TABLE notes ADD COLUMN telegram_alert_sent BOOLEAN DEFAULT FALSE').catch(e => {});
      const { title, content, thumbnailUrl, tags, attachments, meetingDate, meetingVenue, agenda, meetingPriority, templateId } = req.body;
      const id = crypto.randomUUID();
      await db.query(
        'INSERT INTO notes (id, user_id, title, content, thumbnail_url, tags, attachments, meeting_date, meeting_venue, agenda, meeting_priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, req.user.id, title || '', content || '', thumbnailUrl || null, JSON.stringify(tags || []), JSON.stringify(attachments || []), meetingDate || null, meetingVenue || null, agenda || null, meetingPriority || null]
      );
      
      if (templateId) {
        // Send alert if user has telegram configs properly set up and template is selected
        try {
           const [userRows]: any = await db.query('SELECT telegram_chat_id, telegram_bot_token, telegram_enabled, telegram_alert_templates FROM users WHERE id = ?', [req.user.id]);
           if (userRows.length > 0) {
              const u = userRows[0];
              if (u.telegram_enabled && u.telegram_chat_id && u.telegram_alert_templates) {
                  let alertTemplates = [];
                  try { alertTemplates = JSON.parse(u.telegram_alert_templates); } catch (e) {}
                  
                  if (alertTemplates.includes(templateId)) {
                      const botToken = u.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN;
                      if (botToken) {
                           const originUrl = req.headers.origin || (req.get('host') ? 'https://' + req.get('host') : '');
                           const noteUrl = originUrl ? `${originUrl}/#/public/notes/${id}` : `Note ID: ${id}`;
                           const createDate = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                           let templateName = 'Custom Template';
                           if (templateId === 'it-meeting') templateName = 'IT Team Meeting';
                           else if (templateId === 'ops-meeting') templateName = 'KHEMA Operations Meeting';
                           
                           let message = `📝 *New Note Created*\n`;
                           message += `*Title:* ${title || 'My notes'}\n`;
                           message += `*Template:* ${templateName}\n`;
                           message += `*Created:* ${createDate}\n`;
                           if (meetingPriority) message += `*Priority:* ${meetingPriority}\n`;
                           if (meetingDate) message += `*Schedule:* ${new Date(meetingDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}\n`;
                           if (meetingVenue) message += `*Venue:* ${meetingVenue}\n`;
                           if (agenda) {
                               const plainAgenda = agenda.replace(/<[^>]+>/g, '').trim();
                               if (plainAgenda) {
                                   message += `*Agenda:* ${plainAgenda.substring(0, 100)}${plainAgenda.length > 100 ? '...' : ''}\n`;
                               }
                           }
                           message += `\n[View Note in App](${noteUrl})`;
                          axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                             chat_id: u.telegram_chat_id,
                             text: message,
                             parse_mode: 'Markdown'
                          }).catch(e => console.error('Error sending instant Telegram alert', e.response?.data || e.message));
                      }
                  }
              }
           }
        } catch (err) {
           console.error('Failed to trigger instant push notification', err);
        }
      }

      const [rows]: any = await db.query('SELECT * FROM notes WHERE id = ?', [id]);
      res.json(mapDbToNote(rows[0]));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/notes/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await db.query('ALTER TABLE notes ADD COLUMN meeting_date VARCHAR(100)').catch(e => {});
      await db.query('ALTER TABLE notes ADD COLUMN meeting_venue VARCHAR(255)').catch(e => {});
      await db.query('ALTER TABLE notes ADD COLUMN agenda TEXT').catch(e => {});
      await db.query('ALTER TABLE notes ADD COLUMN meeting_priority VARCHAR(50)').catch(e => {});
      await db.query('ALTER TABLE notes ADD COLUMN telegram_alert_sent BOOLEAN DEFAULT FALSE').catch(e => {});
      const { title, content, thumbnailUrl, tags, attachments, meetingDate, meetingVenue, agenda, meetingPriority } = req.body;
      
      const [userProfile]: any = await db.query('SELECT role, can_access_it FROM users WHERE id = ?', [req.user.id]);
      const role = userProfile?.[0]?.role || req.user.role;
      const isPrivileged = role === 'owner' || role === 'admin' || userProfile?.[0]?.can_access_it;

      const [existing]: any = isPrivileged
        ? await db.query('SELECT id FROM notes WHERE id = ?', [req.params.id])
        : await db.query('SELECT id FROM notes WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [req.params.id, req.user.id]);

      if (existing.length === 0) return res.status(404).json({ error: 'Note not found' });

      await db.query(
        'UPDATE notes SET title=?, content=?, thumbnail_url=?, tags=?, attachments=?, meeting_date=?, meeting_venue=?, agenda=?, meeting_priority=?, updated_at=NOW() WHERE id=?',
        [title, content, thumbnailUrl, JSON.stringify(tags||[]), JSON.stringify(attachments||[]), meetingDate || null, meetingVenue || null, agenda || null, meetingPriority || null, req.params.id]
      );
      
      const [rows]: any = await db.query('SELECT * FROM notes WHERE id = ?', [req.params.id]);
      res.json(mapDbToNote(rows[0]));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/notes/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const [userProfile]: any = await db.query('SELECT role, can_access_it FROM users WHERE id = ?', [req.user.id]);
      const role = userProfile?.[0]?.role || req.user.role;
      const isPrivileged = role === 'owner' || role === 'admin' || userProfile?.[0]?.can_access_it;

      let result: any;
      if (isPrivileged) {
        [result] = await db.query('DELETE FROM notes WHERE id = ?', [req.params.id]);
      } else {
        [result] = await db.query('DELETE FROM notes WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [req.params.id, req.user.id]);
      }

      if (result.affectedRows === 0) {
        const [exists]: any = await db.query('SELECT id FROM notes WHERE id = ?', [req.params.id]);
        if (exists.length === 0) {
          return res.status(404).json({ error: 'Note not found or already deleted' });
        }
        return res.status(403).json({ error: 'Permission denied to delete this note' });
      }

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Note Templates API
  app.get('/api/note-templates', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await db.query(`CREATE TABLE IF NOT EXISTS note_templates (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(100),
        title TEXT,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`).catch(e => console.log('Init Table Error:', e.message));

      const [userRows]: any = await db.query('SELECT * FROM note_templates WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
      if (userRows.length > 0) return res.json(userRows);
      const [allRows]: any = await db.query('SELECT * FROM note_templates ORDER BY created_at DESC');
      res.json(allRows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/note-templates', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await db.query(`CREATE TABLE IF NOT EXISTS note_templates (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(100),
        title TEXT,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`).catch(e => console.log('Init Table Error:', e.message));

      const { name, title, content } = req.body;
      const id = crypto.randomUUID();
      await db.query(
        'INSERT INTO note_templates (id, user_id, name, title, content) VALUES (?, ?, ?, ?, ?)',
        [id, req.user.id, name, title || '', content || '']
      );
      const [rows]: any = await db.query('SELECT * FROM note_templates WHERE id = ?', [id]);
      res.json(rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/note-templates/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { name, title, content } = req.body;
      await db.query(
        'UPDATE note_templates SET name=?, title=?, content=? WHERE id=? AND user_id=?',
        [name, title || '', content || '', req.params.id, req.user.id]
      );
      const [rows]: any = await db.query('SELECT * FROM note_templates WHERE id = ?', [req.params.id]);
      res.json(rows[0] || { success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/note-templates/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await db.query('DELETE FROM note_templates WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Storage Route
  app.post('/api/upload', authenticateToken, upload.single('file'), (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileOriginalName = req.file.originalname;
    // To preserve extension
    const ext = path.extname(fileOriginalName);
    const newFileName = `${req.file.filename}${ext}`;
    const newPath = path.join(uploadDir, newFileName);
    fs.renameSync(req.file.path, newPath);
    
    // In production you would want bucket paths, here we just host statically
    const url = `/uploads/${newFileName}`;
    res.json({ url, path: url });
  });

  app.delete('/api/upload', authenticateToken, async (req: any, res: any) => {
    try {
      const { path: filePath } = req.body;
      if (filePath && filePath.startsWith('/uploads/')) {
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Invoices API
  app.get('/api/invoices', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const [userRows]: any = await db.query('SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
      const [userProfile]: any = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
      const role = userProfile?.[0]?.role || req.user.role;
      if (role === 'owner' || role === 'admin' || userRows.length === 0) {
        const [allRows]: any = await db.query('SELECT * FROM invoices ORDER BY created_at DESC');
        return res.json(allRows);
      }
      res.json(userRows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/invoices/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const [rows]: any = await db.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/invoices', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { invoice_no, date, billed_to, from_address, items, total, payment_method, note } = req.body;
      const id = req.body.id || crypto.randomUUID();
      await db.query(
        'INSERT INTO invoices (id, invoice_no, date, billed_to, from_address, items, total, payment_method, note, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, invoice_no, date, billed_to, from_address, JSON.stringify(items || []), total || 0, payment_method, note, req.user.id]
      );
      const [rows]: any = await db.query('SELECT * FROM invoices WHERE id = ?', [id]);
      res.json(rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/invoices/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { invoice_no, date, billed_to, from_address, items, total, payment_method, note } = req.body;
      await db.query(
        'UPDATE invoices SET invoice_no = ?, date = ?, billed_to = ?, from_address = ?, items = ?, total = ?, payment_method = ?, note = ? WHERE id = ? AND user_id = ?',
        [invoice_no, date, billed_to, from_address, JSON.stringify(items || []), total || 0, payment_method, note, req.params.id, req.user.id]
      );
      const [rows]: any = await db.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
      res.json(rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/invoices/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await db.query('DELETE FROM invoices WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- VENDORS API ---
  app.get('/api/vendors', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await db.query(`CREATE TABLE IF NOT EXISTS vendors (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        vendor_type VARCHAR(100),
        contact_person VARCHAR(255),
        contact_email VARCHAR(255),
        vendor VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Active',
        user_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`).catch(e => console.log('Init Table Error:', e.message));

      await db.query('ALTER TABLE vendors ADD COLUMN vendor_type VARCHAR(100)').catch(() => {});
      await db.query('ALTER TABLE vendors ADD COLUMN vendor VARCHAR(100)').catch(() => {});

      const [countRows]: any = await db.query('SELECT COUNT(*) as c FROM vendors');
      if (countRows[0].c === 0) {
        const seedVendors = [
          { name: 'Microsoft Corporation', vendor_type: 'Subscription', category: 'Software & Cloud', contact_person: 'Sarah Jenkins', contact_email: 'sjenkins@microsoft.com', vendor: 'Microsoft', status: 'Active' },
          { name: 'Dell Technologies', vendor_type: 'Device', category: 'Hardware', contact_person: 'Robert Chen', contact_email: 'r.chen@dell.com', vendor: 'Dell', status: 'Active' },
          { name: 'Cisco Systems', vendor_type: 'Rental', category: 'Networking', contact_person: 'David Miller', contact_email: 'dmiller@cisco.com', vendor: 'Cisco', status: 'Active' },
          { name: 'Amazon Web Services', vendor_type: 'Subscription', category: 'Cloud Infrastructure', contact_person: 'Alex Wong', contact_email: 'aws-support@amazon.com', vendor: 'AWS', status: 'Active' },
          { name: 'Fortinet Security', vendor_type: 'Device', category: 'Cybersecurity', contact_person: 'Michael Ross', contact_email: 'mross@fortinet.com', vendor: 'Fortinet', status: 'Active' }
        ];
        for (const v of seedVendors) {
          await db.query(
            'INSERT INTO vendors (id, name, category, vendor_type, contact_person, contact_email, vendor, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [crypto.randomUUID(), v.name, v.category, v.vendor_type, v.contact_person, v.contact_email, v.vendor, v.status, req.user?.id || 'system']
          );
        }
      }

      const [userRows]: any = await db.query('SELECT * FROM vendors WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
      if (userRows.length > 0) {
        return res.json(userRows);
      }
      const [allRows]: any = await db.query('SELECT * FROM vendors ORDER BY created_at DESC');
      res.json(allRows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/vendors', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { name, category, vendor_type, contact_person, contact_email, vendor, status } = req.body;
      const id = req.body.id || crypto.randomUUID();
      await db.query(
        'INSERT INTO vendors (id, name, category, vendor_type, contact_person, contact_email, vendor, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, name, category, vendor_type || '', contact_person, contact_email, vendor || '', status || 'Active', req.user.id]
      );
      const [rows]: any = await db.query('SELECT * FROM vendors WHERE id = ?', [id]);
      res.json(rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/vendors/bulk', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { vendors } = req.body;
      if (!Array.isArray(vendors)) {
         return res.status(400).json({ error: 'Expected an array of vendors' });
      }
      for (const v of vendors) {
        const id = crypto.randomUUID();
        await db.query(
          'INSERT INTO vendors (id, name, category, vendor_type, contact_person, contact_email, vendor, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, v.name, v.category, v.vendor_type || '', v.contact_person, v.contact_email, v.vendor || '', v.status || 'Active', req.user.id]
        );
      }
      res.json({ success: true, count: vendors.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/vendors/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { name, category, vendor_type, contact_person, contact_email, vendor, status } = req.body;
      const { id } = req.params;
      await db.query(
        'UPDATE vendors SET name = ?, category = ?, vendor_type = ?, contact_person = ?, contact_email = ?, vendor = ?, status = ? WHERE id = ?',
        [name, category, vendor_type || '', contact_person, contact_email, vendor || '', status || 'Active', id]
      );
      const [rows]: any = await db.query('SELECT * FROM vendors WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      res.json(rows[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/vendors/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await db.query('DELETE FROM vendors WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Khema Global Actual Cloud Subscriptions (From User System)
  const KHEMA_DEFAULT_CLOUD_SUBSCRIPTIONS = [
    ['sub-radiant-01', 'RandiAnt Dicom Viewer', 'RadiAnt Dicom Viewer', 'RadiAnt Dicom Viewer', 'RadiAnt Dicom Viewer', 'Annually', 236.36, 'USD', 6, 6, 'Active', '2026-11-06', 1, 'KHEMA GLOBAL CO.,LTD', 'IT Operations', '', 'Corporate Invoice', 'https://www.radiantviewer.com', 'DICOM Medical Image Viewer licenses for radiology and doctors'],
    ['sub-vcloudia-02', 'VPC Local Cloud Subscription', 'VCLOUDIA', 'Cloud Infrastructure', 'VPC Local Cloud', 'Annually', 11684.40, 'USD', 1, 0, 'Active', '2026-12-31', 1, 'KHEMA GLOBAL CO.,LTD', 'IT Operations', 'VCLOUD-KHEMA-01', 'Corporate Invoice', 'https://vcloudia.com', 'VPC Local Cloud Infrastructure for hospital systems and medical imaging'],
    ['sub-idrive-03', 'IDrive Cloud Storage Backup', 'Idrive', 'Database & Storage', 'Cloud Storage Backup', 'Annually', 249.50, 'USD', 1, 1, 'Active', '2027-02-18', 1, 'All Sites', 'IT Operations', 'IDRIVE-KHEMA', 'Credit Card', 'https://www.idrive.com', 'Off-site encrypted cloud backup for critical clinical records and database snapshots'],
    ['sub-cyfuture-04', '16 VM Cloud Fix Plans - Business Basic USD', 'Cyfuture', 'Cloud Infrastructure', 'Business Basic USD (16 VM)', 'Annually', 9293.00, 'USD', 16, 16, 'Active', '2027-02-19', 1, 'Sakal Polyclinic Street 2004', 'IT Operations', 'CYF-16VM', 'Corporate Invoice', 'https://cyfuture.cloud', '16 Virtual Machines hosting Sakal Polyclinic applications, database, and local servers'],
    ['sub-cyfuture-05', 'Extra Package - Monitering Services (SoftEther VPN)', 'Cyfuture', 'Cloud Infrastructure', 'Monitoring Services (SoftEther VPN)', 'Annually', 160.00, 'USD', 1, 1, 'Active', '2027-02-27', 1, 'Sakal Polyclinic Street 2004', 'IT Operations', 'CYF-VPN-MON', 'Corporate Invoice', 'https://cyfuture.cloud', 'SoftEther VPN site-to-site connectivity monitoring and security package'],
    ['sub-godaddy-06', '6 Domain Registration (3Years)', 'Godaddy', 'Cloud Infrastructure', '3Years Domain Registration', 'Annually', 50.00, 'USD', 6, 6, 'Active', '2027-03-05', 1, 'Sakal Polyclinic Street 2004', 'IT Operations', 'GD-DOMAINS', 'Credit Card', 'https://www.godaddy.com', 'Domain name registrations (3-year cycle, 6 active domains)'],
    ['sub-bluehost-07', 'khemahospital.com Domain +Domain Privacy + Protection', 'BlueHost', 'Cloud Infrastructure', 'Domain Privacy + Protection', 'Annually', 37.19, 'USD', 1, 1, 'Active', '2027-05-21', 1, 'KHEMA GLOBAL CO.,LTD', 'IT Operations', 'BH-KHEMA-DOM', 'Credit Card', 'https://www.bluehost.com', 'Primary hospital domain khemahospital.com with WHOIS privacy and domain security lock'],
    ['sub-cyfuture-08', '2 VM New Anzer accounting systems Business Basic Plan', 'Cyfuture', 'Cloud Infrastructure', 'Business Basic Plan (2 VM)', 'Monthly', 889.00, 'USD', 2, 0, 'Active', '2027-06-23', 1, 'Sakal Polyclinic Street 2004', 'IT Operations', 'CYF-ANZER', 'Corporate Invoice', 'https://cyfuture.cloud', '2 Virtual Machines hosting New Anzer hospital accounting and ERP systems'],
    ['sub-bluehost-09', 'WordPress Professional Hosting & Xcitium Backup Professional', 'BlueHost', 'Cloud Infrastructure', 'WordPress Professional Hosting', 'Annually', 455.76, 'USD', 1, 1, 'Active', '2027-07-01', 1, 'KHEMA GLOBAL CO.,LTD', 'IT Operations', 'BH-WP-HOST', 'Credit Card', 'https://www.bluehost.com', 'WordPress managed hosting for Khema Hospital website with Xcitium enterprise backup'],
    ['sub-godaddy-10', 'Web Hosting Ultimate Renewal + Daily Backups - 30 days', 'Godaddy', 'Cloud Infrastructure', 'Ultimate Renewal + Daily Backups', 'Annually', 356.14, 'USD', 1, 1, 'Active', '2027-08-26', 1, 'All Sites', 'IT Operations', 'GD-WEB-HOST', 'Credit Card', 'https://www.godaddy.com', 'Ultimate web hosting plan with 30-day automated rolling daily snapshots and backup protection'],
    ['749cf378-1c4b-4c0b-a555-0c1440576d86', 'Airo AI Web agent builder Annual Fee', 'Godaddy', 'AI & Machine Learning', '', 'Annually', 233.87, 'USD', 0, 0, 'Active', '2027-10-24', 1, 'KHEMA GLOBAL CO.,LTD', 'IT Operations', '', 'Credit Card', 'https://airo-builder.godaddy.com/manage-plan', 'for IT Research managment dasbhaord builder.']
  ];

  async function seedKhemaCloudSubscriptions(db: any) {
    for (const s of KHEMA_DEFAULT_CLOUD_SUBSCRIPTIONS) {
      await db.query(`
        INSERT INTO it_cloud_subscriptions 
        (id, name, provider, category, plan_tier, billing_cycle, cost, currency, seats_total, seats_used, status, renewal_date, auto_renew, site_name, owner_team, account_id, payment_method, portal_url, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          name=VALUES(name), provider=VALUES(provider), category=VALUES(category),
          plan_tier=VALUES(plan_tier), billing_cycle=VALUES(billing_cycle), cost=VALUES(cost),
          currency=VALUES(currency), seats_total=VALUES(seats_total), seats_used=VALUES(seats_used),
          status=VALUES(status), renewal_date=VALUES(renewal_date), auto_renew=VALUES(auto_renew),
          site_name=VALUES(site_name), owner_team=VALUES(owner_team), account_id=VALUES(account_id),
          payment_method=VALUES(payment_method), portal_url=VALUES(portal_url), notes=VALUES(notes)
      `, s).catch((e: any) => console.log('Seed subscription error:', e.message));
    }
  }

  // --- IT DASHBOARD API ---
  app.get('/api/it-dashboard', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      if (!db) throw new Error('DB not initialized');
      
      const tables = [
        `CREATE TABLE IF NOT EXISTS it_sites (id VARCHAR(36) PRIMARY KEY, site_name VARCHAR(100) UNIQUE, location VARCHAR(150), status VARCHAR(50))`,
        `CREATE TABLE IF NOT EXISTS it_staffing (id VARCHAR(36) PRIMARY KEY, staff_id VARCHAR(50), site_name VARCHAR(100), employee_name VARCHAR(100), role VARCHAR(100), status VARCHAR(50), performance_score DECIMAL(3,2), monthly_schedule VARCHAR(255))`,
        `CREATE TABLE IF NOT EXISTS helpdesk (id VARCHAR(36) PRIMARY KEY, helpdesk_id VARCHAR(50), site_name VARCHAR(100), assignee VARCHAR(100), in_progress_count INT, completed_count INT, testing_count INT, not_started_count INT, create_date_time VARCHAR(100), period_from DATE, period_to DATE)`,
        `CREATE TABLE IF NOT EXISTS helpesk (id VARCHAR(36) PRIMARY KEY, helpdesk_id VARCHAR(50), site_name VARCHAR(100), assignee VARCHAR(100), in_progress_count INT, completed_count INT, testing_count INT, not_started_count INT, create_date_time VARCHAR(100), period_from DATE, period_to DATE)`,
        `CREATE TABLE IF NOT EXISTS it_asset_categories (id VARCHAR(36) PRIMARY KEY, category_name VARCHAR(100) UNIQUE, description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
        `CREATE TABLE IF NOT EXISTS it_assets (id VARCHAR(36) PRIMARY KEY, asset_tag VARCHAR(50), category VARCHAR(100), site_name VARCHAR(100), model VARCHAR(100), status VARCHAR(50), purchase_price DECIMAL(10,2), warranty_expiry DATE)`,
        `CREATE TABLE IF NOT EXISTS it_training (id VARCHAR(36) PRIMARY KEY, site_name VARCHAR(100), training_name VARCHAR(100), category VARCHAR(100), attendees_count INT, completion_rate DECIMAL(5,2), start_date DATE)`,
        `CREATE TABLE IF NOT EXISTS it_infrastructure (id VARCHAR(36) PRIMARY KEY, site_name VARCHAR(100), component VARCHAR(100), status VARCHAR(50), uptime_percentage DECIMAL(5,2), risk_flag VARCHAR(50))`,
        `CREATE TABLE IF NOT EXISTS it_performance (id VARCHAR(36) PRIMARY KEY, site_name VARCHAR(100), employee_name VARCHAR(100), kpi_name VARCHAR(100), target VARCHAR(50), actual VARCHAR(50), status VARCHAR(50))`,
        `CREATE TABLE IF NOT EXISTS it_expenses (id VARCHAR(36) PRIMARY KEY, site_name VARCHAR(100), category VARCHAR(100), budget DECIMAL(10,2), actual_spend DECIMAL(10,2), month VARCHAR(7))`,
        `CREATE TABLE IF NOT EXISTS it_cloud_subscriptions (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          provider VARCHAR(100) NOT NULL,
          category VARCHAR(100) NOT NULL DEFAULT 'Cloud Infrastructure',
          plan_tier VARCHAR(100) DEFAULT '',
          billing_cycle VARCHAR(50) DEFAULT 'Monthly',
          cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          currency VARCHAR(10) DEFAULT 'USD',
          seats_total INT DEFAULT 0,
          seats_used INT DEFAULT 0,
          status VARCHAR(50) DEFAULT 'Active',
          renewal_date DATE,
          auto_renew TINYINT(1) DEFAULT 1,
          site_name VARCHAR(100) DEFAULT 'All Sites',
          owner_team VARCHAR(100) DEFAULT 'IT Operations',
          account_id VARCHAR(150) DEFAULT '',
          payment_method VARCHAR(100) DEFAULT 'Credit Card',
          portal_url VARCHAR(255) DEFAULT '',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS it_cloud_providers (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL,
          default_category VARCHAR(100) DEFAULT '',
          website VARCHAR(255) DEFAULT '',
          description TEXT,
          is_default TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS it_cloud_categories (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          color VARCHAR(50) DEFAULT 'indigo',
          is_default TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      ];
      for (let query of tables) {
        await db.query(query).catch(e => console.log('Init Table Error:', e.message));
      }

      // Handle table migrations
      for (let query of tables) {
        await db.query(query).catch(e => console.log('Init Table Error:', e.message));
      }
      await db.query('ALTER TABLE it_staffing ADD COLUMN staff_id VARCHAR(50)').catch(e => {});
      await db.query('ALTER TABLE it_staffing ADD COLUMN monthly_schedule VARCHAR(255)').catch(e => {});
      await db.query('ALTER TABLE helpdesk ADD COLUMN period_from DATE').catch(e => {});
      await db.query('ALTER TABLE helpdesk ADD COLUMN period_to DATE').catch(e => {});
      await db.query('ALTER TABLE helpesk ADD COLUMN period_from DATE').catch(e => {});
      await db.query('ALTER TABLE helpesk ADD COLUMN period_to DATE').catch(e => {});

      await db.query('ALTER TABLE vendors ADD COLUMN vendor_type VARCHAR(100)').catch(e => {});
      await db.query('ALTER TABLE vendors ADD COLUMN vendor VARCHAR(100)').catch(e => {});

      await db.query('ALTER TABLE it_assets ADD COLUMN brand VARCHAR(100)').catch(e => {});
      await db.query('ALTER TABLE it_assets ADD COLUMN specification TEXT').catch(e => {});
      await db.query('ALTER TABLE it_assets ADD COLUMN asset_location VARCHAR(150)').catch(e => {});
      await db.query('ALTER TABLE it_assets ADD COLUMN assign_to VARCHAR(100)').catch(e => {});
      await db.query('ALTER TABLE it_assets ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP').catch(e => {});
      await db.query('ALTER TABLE it_assets ADD COLUMN purchase_date DATE').catch(e => {});
      await db.query('ALTER TABLE it_assets ADD COLUMN serial_number VARCHAR(100)').catch(e => {});
      await db.query('ALTER TABLE it_assets ADD COLUMN notes TEXT').catch(e => {});

      await db.query('CREATE TABLE IF NOT EXISTS it_asset_history (id VARCHAR(36) PRIMARY KEY, asset_id VARCHAR(36), action VARCHAR(100), performed_by VARCHAR(100), old_assignee VARCHAR(100), new_assignee VARCHAR(100), old_status VARCHAR(50), new_status VARCHAR(50), old_site VARCHAR(100), new_site VARCHAR(100), old_location VARCHAR(100), new_location VARCHAR(100), notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)').catch(e => {});

      await db.query('ALTER TABLE it_asset_history ADD COLUMN old_site VARCHAR(100)').catch(e => {});
      await db.query('ALTER TABLE it_asset_history ADD COLUMN new_site VARCHAR(100)').catch(e => {});
      await db.query('ALTER TABLE it_asset_history ADD COLUMN old_location VARCHAR(150)').catch(e => {});
      await db.query('ALTER TABLE it_asset_history ADD COLUMN new_location VARCHAR(150)').catch(e => {});

      await db.query('ALTER TABLE it_staffing DROP COLUMN monthly_salary').catch(e => {});

      // insert default sites if empty
      const [sites]: any = await db.query('SELECT COUNT(*) as c FROM it_sites');
      if (sites[0].c === 0) {
        await db.query(`INSERT INTO it_sites (id, site_name, status) VALUES ('1', 'Main Hospital', 'Active'), ('2', 'North Clinic', 'Active'), ('3', 'South Clinic', 'Active')`);
      }

      // insert default categories if empty
      const [cats]: any = await db.query('SELECT COUNT(*) as c FROM it_asset_categories');
      if (cats[0].c === 0) {
        await db.query(`INSERT INTO it_asset_categories (id, category_name, description) VALUES 
          (?, 'Computer', 'Desktops, Laptops, MacBooks'),
          (?, 'Network', 'Routers, Switches, Access Points'),
          (?, 'Server', 'Application Servers, Database Servers'),
          (?, 'Peripheral', 'Keyboards, Mice, Monitors, Printers'),
          (?, 'Software', 'OS Licenses, Utility Software')
        `, [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()]);
      }
      // Compute metrics dynamically
      const { site, from, to } = req.query;

      let helpdeskConditions = [];
      let helpdeskParams = [];
      if (site && site !== 'All Sites') {
        helpdeskConditions.push('site_name = ?');
        helpdeskParams.push(site);
      }
      if (from) {
        helpdeskConditions.push('period_from >= ?');
        helpdeskParams.push(from + '-01'); 
      }
      if (to) {
        helpdeskConditions.push('period_to <= ?');
        helpdeskParams.push(to + '-31'); 
      }
      let hdWhere = helpdeskConditions.length > 0 ? 'WHERE ' + helpdeskConditions.join(' AND ') : '';
      const [hdStats]: any = await db.query(`SELECT SUM(in_progress_count) as total_in_progress, SUM(completed_count) as total_completed, SUM(testing_count) as total_testing, SUM(not_started_count) as total_not_started FROM helpdesk ${hdWhere}`, helpdeskParams);

      let staffWhere = (site && site !== 'All Sites') ? 'WHERE site_name = ?' : '';
      const [staffStats]: any = await db.query(`SELECT COUNT(*) as total_staff FROM it_staffing ${staffWhere}`, (site && site !== 'All Sites') ? [site] : []);

      let expConditions = [];
      let expParams = [];
      if (site && site !== 'All Sites') {
        expConditions.push('site_name = ?');
        expParams.push(site);
      }
      if (from) {
        expConditions.push('month >= ?');
        expParams.push(from); 
      }
      if (to) {
        expConditions.push('month <= ?');
        expParams.push(to); 
      }
      let expWhere = expConditions.length > 0 ? 'WHERE ' + expConditions.join(' AND ') : '';
      const [expenseStats]: any = await db.query(`SELECT SUM(budget) as total_budget, SUM(actual_spend) as total_actual FROM it_expenses ${expWhere}`, expParams);

      res.json({
        success: true,
        data: {
          metrics: { 
            totalTickets: (Number(hdStats[0]?.total_in_progress) || 0) + (Number(hdStats[0]?.total_completed) || 0) + (Number(hdStats[0]?.total_testing) || 0) + (Number(hdStats[0]?.total_not_started) || 0), 
            openTickets: (Number(hdStats[0]?.total_in_progress) || 0) + (Number(hdStats[0]?.total_testing) || 0) + (Number(hdStats[0]?.total_not_started) || 0), 
            avgResolutionTime: '4.2 hrs', 
            totalStaff: Number(staffStats[0]?.total_staff) || 0,
            budgetVariance: (Number(expenseStats[0]?.total_budget) || 0) - (Number(expenseStats[0]?.total_actual) || 0),
            totalActualExpense: Number(expenseStats[0]?.total_actual) || 0,
            assetsDeployed: 432 
          }
        }
      });
    } catch (e: any) {
      console.log('Error in /api/it-dashboard:', e.message);
      res.json({ success: true, data: { metrics: { totalTickets: 0, openTickets: 0, avgResolutionTime: '4.2 hrs', totalStaff: 0, budgetVariance: 0, totalActualExpense: 0, assetsDeployed: 432 } } });
    }
  });

  // --- IT SITES CRUD API ---
  app.get('/api/sites', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const [rows] = await db.query('SELECT * FROM it_sites ORDER BY site_name');
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/sites', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { site_name, location, status } = req.body;
      const id = crypto.randomUUID();
      await db.query(
        'INSERT INTO it_sites (id, site_name, location, status) VALUES (?, ?, ?, ?)',
        [id, site_name, location || '', status || 'Active']
      );
      res.json({ id, site_name, location, status: status || 'Active' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/sites/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { site_name, location, status } = req.body;
      await db.query(
        'UPDATE it_sites SET site_name = ?, location = ?, status = ? WHERE id = ?',
        [site_name, location || '', status, req.params.id]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/sites/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await db.query('DELETE FROM it_sites WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  // Vite Integration for frontend
  
  // --- IT STAFFING CRUD API ---
  app.get('/api/staffing', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const [rows] = await db.query('SELECT * FROM it_staffing');
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/staffing', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { staff_id, site_name, employee_name, role, status, performance_score, monthly_schedule } = req.body;
      const id = crypto.randomUUID();
      await db.query(
        'INSERT INTO it_staffing (id, staff_id, site_name, employee_name, role, status, performance_score, monthly_schedule) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, staff_id || '', site_name, employee_name, role, status, performance_score || null, monthly_schedule || '']
      );
      res.json({ id, staff_id, site_name, employee_name, role, status, performance_score, monthly_schedule });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/staffing/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { staff_id, site_name, employee_name, role, status, performance_score, monthly_schedule } = req.body;
      await db.query(
        'UPDATE it_staffing SET staff_id = ?, site_name = ?, employee_name = ?, role = ?, status = ?, performance_score = ?, monthly_schedule = ? WHERE id = ?',
        [staff_id || '', site_name, employee_name, role, status, performance_score || null, monthly_schedule || '', req.params.id]
      );
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/staffing/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await db.query('DELETE FROM it_staffing WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- IT HELPDESK API ---
  const handleGetHelpdesk = async (req: any, res: any, table: string) => {
    try {
      const db = getDb();
      const [rows] = await db.query(`SELECT * FROM ${table} ORDER BY create_date_time DESC`);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  };
  const handlePostHelpdesk = async (req: any, res: any, table: string) => {
    try {
      const db = getDb();
      const { helpdesk_id, site_name, assignee, in_progress_count, testing_count, not_started_count, completed_count, create_date_time, period_from, period_to } = req.body;
      const id = crypto.randomUUID();
      const generatedId = helpdesk_id || `HD-${new Date().toISOString().slice(0, 7).replace('-', '')}-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
      await db.query(
        `INSERT INTO ${table} (id, helpdesk_id, site_name, assignee, in_progress_count, completed_count, testing_count, not_started_count, create_date_time, period_from, period_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, generatedId, site_name, assignee || '', in_progress_count || 0, completed_count || 0, testing_count || 0, not_started_count || 0, create_date_time || new Date().toISOString(), period_from || null, period_to || null]
      );
      res.json({ success: true, data: { id, helpdesk_id: generatedId, site_name, assignee, in_progress_count, completed_count, testing_count, not_started_count, create_date_time, period_from, period_to } });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  };
  const handlePutHelpdesk = async (req: any, res: any, table: string) => {
    try {
      const db = getDb();
      const { helpdesk_id, site_name, assignee, in_progress_count, testing_count, not_started_count, completed_count, create_date_time, period_from, period_to } = req.body;
      await db.query(
        `UPDATE ${table} SET helpdesk_id = ?, site_name = ?, assignee = ?, in_progress_count = ?, completed_count = ?, testing_count = ?, not_started_count = ?, create_date_time = ?, period_from = ?, period_to = ? WHERE id = ?`,
        [helpdesk_id || '', site_name, assignee || '', in_progress_count || 0, completed_count || 0, testing_count || 0, not_started_count || 0, create_date_time || new Date().toISOString(), period_from || null, period_to || null, req.params.id]
      );
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  };
  const handleDeleteHelpdesk = async (req: any, res: any, table: string) => {
    try {
      const db = getDb();
      await db.query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  };

  app.get('/api/helpdesk', authenticateToken, (req, res) => handleGetHelpdesk(req, res, 'helpdesk'));
  app.post('/api/helpdesk', authenticateToken, (req, res) => handlePostHelpdesk(req, res, 'helpdesk'));
  app.put('/api/helpdesk/:id', authenticateToken, (req, res) => handlePutHelpdesk(req, res, 'helpdesk'));
  app.delete('/api/helpdesk/:id', authenticateToken, (req, res) => handleDeleteHelpdesk(req, res, 'helpdesk'));

  app.get('/api/helpesk', authenticateToken, (req, res) => handleGetHelpdesk(req, res, 'helpesk'));
  app.post('/api/helpesk', authenticateToken, (req, res) => handlePostHelpdesk(req, res, 'helpesk'));
  app.put('/api/helpesk/:id', authenticateToken, (req, res) => handlePutHelpdesk(req, res, 'helpesk'));
  app.delete('/api/helpesk/:id', authenticateToken, (req, res) => handleDeleteHelpdesk(req, res, 'helpesk'));

  // --- IT ASSET CATEGORIES API ---
  app.get('/api/asset-categories', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const [rows] = await db.query('SELECT * FROM it_asset_categories ORDER BY category_name ASC');
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/asset-categories', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { category_name, description } = req.body;
      const [existing]: any = await db.query('SELECT id FROM it_asset_categories WHERE category_name = ?', [category_name]);
      if (existing.length > 0) return res.status(400).json({ error: 'Category already exists' });
      const id = crypto.randomUUID();
      await db.query('INSERT INTO it_asset_categories (id, category_name, description) VALUES (?, ?, ?)', [id, category_name, description || '']);
      res.json({ id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/asset-categories/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { category_name, description } = req.body;
      const [existing]: any = await db.query('SELECT id FROM it_asset_categories WHERE category_name = ? AND id != ?', [category_name, req.params.id]);
      if (existing.length > 0) return res.status(400).json({ error: 'Category already exists' });
      await db.query('UPDATE it_asset_categories SET category_name=?, description=? WHERE id=?', [category_name, description || '', req.params.id]);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/asset-categories/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await db.query('DELETE FROM it_asset_categories WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // --- IT ASSETS API ---
  app.get('/api/assets', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const [rows] = await db.query('SELECT * FROM it_assets ORDER BY created_at DESC');
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/assets', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { asset_tag, category, site_name, asset_location, brand, model, specification, status, purchase_price, purchase_date, warranty_expiry, assign_to, serial_number, notes } = req.body;
      
      // Check for duplicate asset tag
      const [existing]: any = await db.query('SELECT id FROM it_assets WHERE asset_tag = ?', [asset_tag]);
      if (existing.length > 0) return res.status(400).json({ error: 'Asset code already exists' });

      const id = crypto.randomUUID();
      await db.query(
        'INSERT INTO it_assets (id, asset_tag, category, site_name, asset_location, brand, model, specification, status, purchase_price, purchase_date, warranty_expiry, assign_to, serial_number, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, asset_tag, category, site_name, asset_location || '', brand || '', model, specification || '', status, purchase_price || null, purchase_date || null, warranty_expiry || null, assign_to || '', serial_number || '', notes || '']
      );

      // Audit trail
      await db.query('INSERT INTO it_asset_history (id, asset_id, action, performed_by, new_assignee, new_status, new_site, new_location, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [crypto.randomUUID(), id, 'Created Asset', req.user.name || req.user.email, assign_to || '', status, site_name, asset_location || '', 'Initial registration']);

      res.json({ id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/assets/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { asset_tag, category, site_name, asset_location, brand, model, specification, status, purchase_price, purchase_date, warranty_expiry, assign_to, serial_number, notes, transfer_notes } = req.body;
      
      const [oldRecord]: any = await db.query('SELECT * FROM it_assets WHERE id = ?', [req.params.id]);
      if (oldRecord.length === 0) return res.status(404).json({ error: 'Asset not found' });
      const old = oldRecord[0];

      await db.query(
        'UPDATE it_assets SET asset_tag=?, category=?, site_name=?, asset_location=?, brand=?, model=?, specification=?, status=?, purchase_price=?, purchase_date=?, warranty_expiry=?, assign_to=?, serial_number=?, notes=? WHERE id=?',
        [asset_tag, category, site_name, asset_location || '', brand || '', model, specification || '', status, purchase_price || null, purchase_date || null, warranty_expiry || null, assign_to || '', serial_number || '', notes || '', req.params.id]
      );

      // Audit trail if assignee, status, site, or location changed
      if (old.assign_to !== assign_to || old.status !== status || old.site_name !== site_name || old.asset_location !== asset_location) {
         let action = 'Updated Asset';
         if (old.site_name !== site_name || old.asset_location !== asset_location) action = 'Transferred Asset';
         else if (old.assign_to !== assign_to) action = 'Reassigned Asset';
         else if (old.status !== status) action = 'Status Changed';

         await db.query('INSERT INTO it_asset_history (id, asset_id, action, performed_by, old_assignee, new_assignee, old_status, new_status, old_site, new_site, old_location, new_location, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [crypto.randomUUID(), req.params.id, action, req.user.name || req.user.email, old.assign_to, assign_to, old.status, status, old.site_name, site_name, old.asset_location, asset_location, transfer_notes || '']);
      }

      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/assets/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await db.query('DELETE FROM it_assets WHERE id = ?', [req.params.id]);
      await db.query('DELETE FROM it_asset_history WHERE asset_id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/assets/:id/history', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const [rows] = await db.query('SELECT * FROM it_asset_history WHERE asset_id = ? ORDER BY created_at DESC', [req.params.id]);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // --- IT CLOUD SUBSCRIPTIONS API ---
  app.get('/api/cloud-subscriptions', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { site, status, category, provider, search } = req.query;
      let query = 'SELECT * FROM it_cloud_subscriptions WHERE 1=1';
      const params: any[] = [];

      if (site && site !== 'All Sites') {
        query += ' AND (site_name = ? OR site_name = "All Sites")';
        params.push(site);
      }
      if (status && status !== 'All Statuses') {
        query += ' AND status = ?';
        params.push(status);
      }
      if (category && category !== 'All Categories') {
        query += ' AND category = ?';
        params.push(category);
      }
      if (provider && provider !== 'All Providers') {
        query += ' AND provider = ?';
        params.push(provider);
      }
      if (search) {
        query += ' AND (name LIKE ? OR provider LIKE ? OR category LIKE ? OR account_id LIKE ? OR owner_team LIKE ?)';
        const term = `%${search}%`;
        params.push(term, term, term, term, term);
      }

      query += ' ORDER BY CASE WHEN renewal_date IS NULL THEN 1 ELSE 0 END, renewal_date ASC, created_at DESC';
      const [rows] = await db.query(query, params);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/cloud-subscriptions/summary', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { site } = req.query;
      let query = 'SELECT * FROM it_cloud_subscriptions WHERE 1=1';
      const params: any[] = [];
      if (site && site !== 'All Sites') {
        query += ' AND (site_name = ? OR site_name = "All Sites")';
        params.push(site);
      }
      const [rows]: any = await db.query(query, params);

      let totalCount = rows.length;
      let activeCount = 0;
      let totalMonthlySpend = 0;
      let expiring30Days = 0;
      let totalSeats = 0;
      let usedSeats = 0;
      const categoryMap: Record<string, { count: number, spend: number }> = {};
      const providerMap: Record<string, { count: number, spend: number }> = {};

      const now = new Date();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      for (const row of rows) {
        if (row.status === 'Active' || row.status === 'Expiring Soon') {
          activeCount++;
        }
        
        // Normalize monthly cost
        const cost = parseFloat(row.cost) || 0;
        let monthly = cost;
        if (row.billing_cycle === 'Annually') {
          monthly = cost / 12;
        } else if (row.billing_cycle === 'Quarterly') {
          monthly = cost / 3;
        }
        if (row.status !== 'Cancelled' && row.status !== 'Expired') {
          totalMonthlySpend += monthly;
        }

        // Seats
        totalSeats += parseInt(row.seats_total) || 0;
        usedSeats += parseInt(row.seats_used) || 0;

        // Expiring in 30 days
        if (row.renewal_date && row.status !== 'Cancelled' && row.status !== 'Expired') {
          const rDate = new Date(row.renewal_date);
          const diff = rDate.getTime() - now.getTime();
          if (diff >= 0 && diff <= thirtyDaysMs) {
            expiring30Days++;
          }
        }

        // Category breakdown
        const cat = row.category || 'Other';
        if (!categoryMap[cat]) categoryMap[cat] = { count: 0, spend: 0 };
        categoryMap[cat].count++;
        if (row.status !== 'Cancelled' && row.status !== 'Expired') {
          categoryMap[cat].spend += monthly;
        }

        // Provider breakdown
        const prov = row.provider || 'Other';
        if (!providerMap[prov]) providerMap[prov] = { count: 0, spend: 0 };
        providerMap[prov].count++;
        if (row.status !== 'Cancelled' && row.status !== 'Expired') {
          providerMap[prov].spend += monthly;
        }
      }

      res.json({
        totalCount,
        activeCount,
        totalMonthlySpend: Math.round(totalMonthlySpend * 100) / 100,
        annualRunRate: Math.round(totalMonthlySpend * 12 * 100) / 100,
        expiring30Days,
        totalSeats,
        usedSeats,
        seatUtilization: totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0,
        categoryBreakdown: Object.keys(categoryMap).map(cat => ({ category: cat, ...categoryMap[cat] })),
        providerBreakdown: Object.keys(providerMap).map(prov => ({ provider: prov, ...providerMap[prov] }))
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/cloud-subscriptions', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const {
        name, provider, category, plan_tier, billing_cycle, cost, currency,
        seats_total, seats_used, status, renewal_date, auto_renew,
        site_name, owner_team, account_id, payment_method, portal_url, notes
      } = req.body;

      if (!name || !provider) {
        return res.status(400).json({ error: 'Subscription name and provider are required' });
      }

      const sanitizedRenewalDate = renewal_date ? String(renewal_date).slice(0, 10) : null;

      const id = crypto.randomUUID();
      await db.query(
        `INSERT INTO it_cloud_subscriptions 
        (id, name, provider, category, plan_tier, billing_cycle, cost, currency, seats_total, seats_used, status, renewal_date, auto_renew, site_name, owner_team, account_id, payment_method, portal_url, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          name.trim(),
          provider.trim(),
          category || 'Cloud Infrastructure',
          plan_tier || '',
          billing_cycle || 'Monthly',
          parseFloat(cost) || 0,
          currency || 'USD',
          parseInt(seats_total) || 0,
          parseInt(seats_used) || 0,
          status || 'Active',
          sanitizedRenewalDate,
          auto_renew === false || auto_renew === 0 ? 0 : 1,
          site_name || 'All Sites',
          owner_team || 'IT Operations',
          account_id || '',
          payment_method || 'Credit Card',
          portal_url || '',
          notes || ''
        ]
      );

      const [newRow]: any = await db.query('SELECT * FROM it_cloud_subscriptions WHERE id = ?', [id]);
      res.json(newRow[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/cloud-subscriptions/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const {
        name, provider, category, plan_tier, billing_cycle, cost, currency,
        seats_total, seats_used, status, renewal_date, auto_renew,
        site_name, owner_team, account_id, payment_method, portal_url, notes
      } = req.body;

      const [existing]: any = await db.query('SELECT id FROM it_cloud_subscriptions WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      const sanitizedRenewalDate = renewal_date ? String(renewal_date).slice(0, 10) : null;

      await db.query(
        `UPDATE it_cloud_subscriptions SET 
          name = ?, provider = ?, category = ?, plan_tier = ?, billing_cycle = ?,
          cost = ?, currency = ?, seats_total = ?, seats_used = ?, status = ?,
          renewal_date = ?, auto_renew = ?, site_name = ?, owner_team = ?,
          account_id = ?, payment_method = ?, portal_url = ?, notes = ?
        WHERE id = ?`,
        [
          name.trim(),
          provider.trim(),
          category || 'Cloud Infrastructure',
          plan_tier || '',
          billing_cycle || 'Monthly',
          parseFloat(cost) || 0,
          currency || 'USD',
          parseInt(seats_total) || 0,
          parseInt(seats_used) || 0,
          status || 'Active',
          sanitizedRenewalDate,
          auto_renew === false || auto_renew === 0 ? 0 : 1,
          site_name || 'All Sites',
          owner_team || 'IT Operations',
          account_id || '',
          payment_method || 'Credit Card',
          portal_url || '',
          notes || '',
          id
        ]
      );

      const [updatedRow]: any = await db.query('SELECT * FROM it_cloud_subscriptions WHERE id = ?', [id]);
      res.json(updatedRow[0]);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/cloud-subscriptions/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      if (!id || id === 'undefined' || id === 'null' || id.trim() === '' || id === 'settings' || id === 'bulk-delete' || id === 'restore') {
        return res.status(400).json({ error: 'Valid subscription ID is required' });
      }
      await db.query('DELETE FROM it_cloud_subscriptions WHERE id = ?', [id]);
      res.json({ success: true, id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/cloud-subscriptions/bulk-delete', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Valid array of ids required' });
      }
      // Filter out invalid/empty ids
      const validIds = ids.filter(id => id && typeof id === 'string' && id.trim() !== '' && id !== 'undefined' && id !== 'null');
      if (validIds.length === 0) {
        return res.status(400).json({ error: 'No valid ids provided for deletion' });
      }
      await db.query('DELETE FROM it_cloud_subscriptions WHERE id IN (?)', [validIds]);
      res.json({ success: true, deletedCount: validIds.length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/cloud-subscriptions', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { confirmAll } = req.body || {};
      if (confirmAll !== 'CONFIRM_DELETE_ALL') {
        return res.status(400).json({ 
          error: 'Explicit confirmation required. Send { confirmAll: "CONFIRM_DELETE_ALL" } in the body to clear all records.' 
        });
      }
      await db.query('DELETE FROM it_cloud_subscriptions');
      res.json({ success: true, message: 'All cloud subscriptions deleted successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post('/api/cloud-subscriptions/bulk-import', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { subscriptions, replaceExisting } = req.body;
      if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
        return res.status(400).json({ error: 'Subscriptions array is required' });
      }

      if (replaceExisting) {
        await db.query('DELETE FROM it_cloud_subscriptions');
      }

      let inserted = 0;
      for (const item of subscriptions) {
        if (!item || !item.name) continue;
        const id = item.id || crypto.randomUUID();
        const name = String(item.name || '').trim();
        const provider = String(item.provider || 'Other').trim();
        const category = String(item.category || 'Cloud Infrastructure').trim();
        const plan_tier = String(item.plan_tier || item.plan || '').trim();
        const billing_cycle = ['Monthly', 'Annually', 'Quarterly', 'Usage-Based'].includes(item.billing_cycle) ? item.billing_cycle : 'Monthly';
        const cost = parseFloat(item.cost) || 0;
        const currency = String(item.currency || 'USD').trim();
        const seats_total = parseInt(item.seats_total) || 0;
        const seats_used = parseInt(item.seats_used) || 0;
        const status = ['Active', 'Expiring Soon', 'In Trial', 'Cancelled', 'Expired', 'Under Review'].includes(item.status) ? item.status : 'Active';
        const renewal_date = item.renewal_date ? String(item.renewal_date).split('T')[0] : null;
        const auto_renew = (item.auto_renew === false || item.auto_renew === 0 || item.auto_renew === '0' || item.auto_renew === 'false') ? 0 : 1;
        const site_name = String(item.site_name || item.site || 'All Sites').trim();
        const owner_team = String(item.owner_team || item.team || 'IT Operations').trim();
        const account_id = String(item.account_id || '').trim();
        const payment_method = String(item.payment_method || 'Credit Card').trim();
        const portal_url = String(item.portal_url || '').trim();
        const notes = String(item.notes || '').trim();

        await db.query(`
          INSERT INTO it_cloud_subscriptions 
          (id, name, provider, category, plan_tier, billing_cycle, cost, currency, seats_total, seats_used, status, renewal_date, auto_renew, site_name, owner_team, account_id, payment_method, portal_url, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            name=VALUES(name), provider=VALUES(provider), category=VALUES(category),
            plan_tier=VALUES(plan_tier), billing_cycle=VALUES(billing_cycle), cost=VALUES(cost),
            currency=VALUES(currency), seats_total=VALUES(seats_total), seats_used=VALUES(seats_used),
            status=VALUES(status), renewal_date=VALUES(renewal_date), auto_renew=VALUES(auto_renew),
            site_name=VALUES(site_name), owner_team=VALUES(owner_team), account_id=VALUES(account_id),
            payment_method=VALUES(payment_method), portal_url=VALUES(portal_url), notes=VALUES(notes)
        `, [id, name, provider, category, plan_tier, billing_cycle, cost, currency, seats_total, seats_used, status, renewal_date, auto_renew, site_name, owner_team, account_id, payment_method, portal_url, notes]);
        inserted++;
      }

      const [rows] = await db.query('SELECT * FROM it_cloud_subscriptions ORDER BY renewal_date ASC');
      res.json({ success: true, message: `Successfully imported ${inserted} cloud subscriptions`, count: inserted, subscriptions: rows });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/cloud-subscriptions/restore', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await seedKhemaCloudSubscriptions(db);
      const [rows] = await db.query('SELECT * FROM it_cloud_subscriptions ORDER BY renewal_date ASC');
      res.json({ success: true, message: 'Khema Global cloud subscriptions restored successfully', count: (rows as any[]).length });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/cloud-subscriptions/reset-sample-data', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await seedKhemaCloudSubscriptions(db);
      res.json({ success: true, message: 'Khema Global cloud subscriptions restored successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- CLOUD SUBSCRIPTIONS FIELD SETTINGS (PROVIDERS & CATEGORIES) ---
  app.get('/api/cloud-subscriptions/settings', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      // Ensure tables exist
      await db.query(`CREATE TABLE IF NOT EXISTS it_cloud_providers (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        default_category VARCHAR(100) DEFAULT '',
        website VARCHAR(255) DEFAULT '',
        description TEXT,
        is_default TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`).catch(e => {});

      await db.query(`CREATE TABLE IF NOT EXISTS it_cloud_categories (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        color VARCHAR(50) DEFAULT 'indigo',
        is_default TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`).catch(e => {});

      // Seed default providers if empty
      const [pCount]: any = await db.query('SELECT COUNT(*) as c FROM it_cloud_providers');
      if (pCount[0].c === 0) {
        const defaultProviders = [
          ['Amazon Web Services', 'Cloud Infrastructure', 'https://aws.amazon.com', 'Compute (EC2), Databases (RDS), Object Storage (S3), and VPC cloud infrastructure.'],
          ['Microsoft', 'SaaS & Productivity', 'https://microsoft.com', 'Microsoft 365, Azure Cloud, Entra ID, Defender, and Windows enterprise.'],
          ['Google Cloud', 'Cloud Infrastructure', 'https://cloud.google.com', 'GCP compute, BigQuery data warehouse, Vertex AI, and Workspace.'],
          ['GitHub', 'DevOps & CI/CD', 'https://github.com', 'Git source control, GitHub Actions CI/CD runners, and code security.'],
          ['Cloudflare', 'Security & Compliance', 'https://cloudflare.com', 'WAF security, DDoS mitigation, DNS management, and CDN caching.'],
          ['Datadog', 'Monitoring & Observability', 'https://datadoghq.com', 'Infrastructure monitoring, APM tracing, logs, and synthetic alerting.'],
          ['Zoom', 'Communication', 'https://zoom.us', 'Video conferencing, webinars, and telehealth communication.'],
          ['Atlassian', 'DevOps & CI/CD', 'https://atlassian.com', 'Jira issue tracking, Confluence documentation, and Trello.'],
          ['Salesforce', 'Marketing & CRM', 'https://salesforce.com', 'CRM, sales pipeline, service cloud, and customer support.'],
          ['Slack', 'Communication', 'https://slack.com', 'Internal team collaboration, channels, and incident bridges.'],
          ['Docker', 'DevOps & CI/CD', 'https://docker.com', 'Container runtime, Docker Hub repository, and image builds.'],
          ['Figma', 'SaaS & Productivity', 'https://figma.com', 'UI/UX interface design, prototyping, and design systems.'],
          ['MongoDB Atlas', 'Database & Storage', 'https://mongodb.com', 'Fully managed cloud NoSQL database cluster.'],
          ['OpenAI', 'AI & Machine Learning', 'https://openai.com', 'LLM generative AI APIs, ChatGPT team licenses, and embeddings.'],
          ['Twilio', 'Communication', 'https://twilio.com', 'SMS notifications, WhatsApp business API, and telephony.'],
          ['Stripe', 'SaaS & Productivity', 'https://stripe.com', 'Payment processing gateway and subscription billing platform.'],
          ['Oracle Cloud', 'Cloud Infrastructure', 'https://oracle.com/cloud', 'Oracle Cloud Infrastructure (OCI) and enterprise databases.'],
          ['Supabase', 'Database & Storage', 'https://supabase.com', 'Postgres backend, authentication, and realtime database.'],
          ['Other', 'Other', '', 'Custom or unlisted cloud vendor / provider.']
        ];
        for (const [name, cat, web, desc] of defaultProviders) {
          await db.query('INSERT IGNORE INTO it_cloud_providers (id, name, default_category, website, description, is_default) VALUES (?, ?, ?, ?, ?, 1)', 
            [crypto.randomUUID(), name, cat, web, desc]);
        }
      }

      // Seed default categories if empty
      const [cCount]: any = await db.query('SELECT COUNT(*) as c FROM it_cloud_categories');
      if (cCount[0].c === 0) {
        const defaultCats = [
          ['Cloud Infrastructure', 'Compute (VMs), VPC networks, containers, and bare metal hosting', 'blue'],
          ['SaaS & Productivity', 'Office suites, collaboration tools, document editors, and business apps', 'indigo'],
          ['DevOps & CI/CD', 'Source control repositories, build pipelines, test runners, deployment tools', 'emerald'],
          ['Security & Compliance', 'WAF, firewalls, identity management (IAM), antivirus, and audit tools', 'rose'],
          ['Monitoring & Observability', 'APM tracing, log aggregation, uptime checks, and error metrics', 'amber'],
          ['Communication', 'Video conferencing, VoIP telephony, SMS gateways, and team chats', 'cyan'],
          ['AI & Machine Learning', 'LLM APIs, model training, speech recognition, and computer vision', 'purple'],
          ['Database & Storage', 'Managed relational & NoSQL databases, object storage, and backups', 'teal'],
          ['Marketing & CRM', 'Customer relationship management, email automation, analytics pipelines', 'orange'],
          ['Other', 'Miscellaneous unclassified cloud services and software toolings', 'slate']
        ];
        for (const [name, desc, color] of defaultCats) {
          await db.query('INSERT IGNORE INTO it_cloud_categories (id, name, description, color, is_default) VALUES (?, ?, ?, ?, 1)',
            [crypto.randomUUID(), name, desc, color]);
        }
      }

      const [providers] = await db.query('SELECT * FROM it_cloud_providers ORDER BY name ASC');
      const [categories] = await db.query('SELECT * FROM it_cloud_categories ORDER BY name ASC');

      res.json({ providers, categories });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/cloud-subscriptions/settings/providers', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { name, default_category, website, description } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'Provider name is required' });

      const [existing]: any = await db.query('SELECT id FROM it_cloud_providers WHERE LOWER(name) = LOWER(?)', [name.trim()]);
      if (existing.length > 0) return res.status(400).json({ error: 'A provider with this name already exists' });

      const id = crypto.randomUUID();
      await db.query(
        'INSERT INTO it_cloud_providers (id, name, default_category, website, description, is_default) VALUES (?, ?, ?, ?, ?, 0)',
        [id, name.trim(), default_category || '', website || '', description || '']
      );
      res.json({ success: true, id, name: name.trim() });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/cloud-subscriptions/settings/providers/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { name, default_category, website, description } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'Provider name is required' });

      const [existing]: any = await db.query('SELECT id FROM it_cloud_providers WHERE LOWER(name) = LOWER(?) AND id != ?', [name.trim(), id]);
      if (existing.length > 0) return res.status(400).json({ error: 'Another provider already uses this name' });

      const [old]: any = await db.query('SELECT name FROM it_cloud_providers WHERE id = ?', [id]);
      if (old.length > 0 && old[0].name !== name.trim()) {
        await db.query('UPDATE it_cloud_subscriptions SET provider = ? WHERE provider = ?', [name.trim(), old[0].name]);
      }

      await db.query(
        'UPDATE it_cloud_providers SET name = ?, default_category = ?, website = ?, description = ? WHERE id = ?',
        [name.trim(), default_category || '', website || '', description || '', id]
      );
      res.json({ success: true, id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/cloud-subscriptions/settings/providers/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      await db.query('DELETE FROM it_cloud_providers WHERE id = ?', [id]);
      res.json({ success: true, id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/cloud-subscriptions/settings/categories', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { name, description, color } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });

      const [existing]: any = await db.query('SELECT id FROM it_cloud_categories WHERE LOWER(name) = LOWER(?)', [name.trim()]);
      if (existing.length > 0) return res.status(400).json({ error: 'A category with this name already exists' });

      const id = crypto.randomUUID();
      await db.query(
        'INSERT INTO it_cloud_categories (id, name, description, color, is_default) VALUES (?, ?, ?, ?, 0)',
        [id, name.trim(), description || '', color || 'indigo']
      );
      res.json({ success: true, id, name: name.trim() });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/cloud-subscriptions/settings/categories/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { name, description, color } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });

      const [existing]: any = await db.query('SELECT id FROM it_cloud_categories WHERE LOWER(name) = LOWER(?) AND id != ?', [name.trim(), id]);
      if (existing.length > 0) return res.status(400).json({ error: 'Another category already uses this name' });

      const [old]: any = await db.query('SELECT name FROM it_cloud_categories WHERE id = ?', [id]);
      if (old.length > 0 && old[0].name !== name.trim()) {
        await db.query('UPDATE it_cloud_subscriptions SET category = ? WHERE category = ?', [name.trim(), old[0].name]);
      }

      await db.query(
        'UPDATE it_cloud_categories SET name = ?, description = ?, color = ? WHERE id = ?',
        [name.trim(), description || '', color || 'indigo', id]
      );
      res.json({ success: true, id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/cloud-subscriptions/settings/categories/:id', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      await db.query('DELETE FROM it_cloud_categories WHERE id = ?', [id]);
      res.json({ success: true, id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/cloud-subscriptions/settings/reset', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await db.query('DELETE FROM it_cloud_providers');
      await db.query('DELETE FROM it_cloud_categories');
      res.json({ success: true, message: 'Settings reset successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/telegram/settings', authenticateToken, async (req: any, res) => {
    try {
      const db = getDb();
      await db.query('ALTER TABLE users ADD COLUMN telegram_chat_id VARCHAR(255)').catch(e => {});
      await db.query('ALTER TABLE users ADD COLUMN telegram_bot_token VARCHAR(255)').catch(e => {});
      await db.query('ALTER TABLE users ADD COLUMN telegram_enabled BOOLEAN DEFAULT TRUE').catch(e => {});
      await db.query('ALTER TABLE users ADD COLUMN telegram_alert_templates TEXT').catch(e => {});

      const [rows]: any = await db.query('SELECT telegram_chat_id, telegram_bot_token, telegram_enabled, telegram_alert_templates FROM users WHERE id = ?', [req.user.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
      
      let alertTemplates: string[] = [];
      try {
        if (rows[0].telegram_alert_templates) {
          alertTemplates = JSON.parse(rows[0].telegram_alert_templates);
        }
      } catch (e) {}

      res.json({
          chatId: rows[0].telegram_chat_id || '',
          botToken: rows[0].telegram_bot_token || '',
          enabled: rows[0].telegram_enabled !== 0, // MySQL boolean is tinyint
          alertTemplates
      });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/telegram/settings', authenticateToken, async (req: any, res) => {
    try {
      const { chatId, botToken, enabled, alertTemplates } = req.body;
      const db = getDb();
      await db.query('ALTER TABLE users ADD COLUMN telegram_chat_id VARCHAR(255)').catch(e => {});
      await db.query('ALTER TABLE users ADD COLUMN telegram_bot_token VARCHAR(255)').catch(e => {});
      await db.query('ALTER TABLE users ADD COLUMN telegram_enabled BOOLEAN DEFAULT TRUE').catch(e => {});
      await db.query('ALTER TABLE users ADD COLUMN telegram_alert_templates TEXT').catch(e => {});

      await db.query(
        'UPDATE users SET telegram_chat_id = ?, telegram_bot_token = ?, telegram_enabled = ?, telegram_alert_templates = ? WHERE id = ?',
        [chatId, botToken, enabled, JSON.stringify(alertTemplates || []), req.user.id]
      );

      res.json({ success: true });
    } catch(e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/telegram/test', authenticateToken, async (req: any, res) => {
    try {
      const { chatId, botToken } = req.body;
      if (!chatId || !botToken) return res.status(400).json({ error: 'Chat ID and Bot Token are required' });
      
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          chat_id: chatId,
          text: '🔔 This is a test notification from AI Notes!'
      });
      
      res.json({ success: true });
    } catch(e: any) {
      res.status(500).json({ error: 'Failed to send telegram message: ' + (e.response?.data?.description || e.message) });
    }
  });

  // Initialize Mail Assistant tables and routes
  await initMailTables(getDb()).catch(e => console.warn('Mail tables init warning:', e.message));
  setupMailRoutes(app, getDb, authenticateToken);

  // Initialize 12-Hour Automated Database Backups & 1-Click Disaster Recovery
  setupBackupRoutes(app, getDb, authenticateToken);

  // Initialize Telegram GoDaddy MySQL Disconnection Alert routes & Heartbeat Monitor
  setupTelegramAlertRoutes(app, authenticateToken);
  startRemoteDatabaseHeartbeat(getDb, async (isReachable, latencyMs) => {
    if (isReachable && isFailoverActive) {
      console.log(`[Auto-Reconnect] GoDaddy MySQL is reachable again (${latencyMs}ms)! Restoring primary live pool...`);
      try {
        if (primaryPool) {
          await primaryPool.query('SELECT 1');
        } else {
          primaryPool = createDirectPool();
        }
        isFailoverActive = false;
        failoverReason = '';
        lastFailoverAt = null;
        console.log('[Auto-Reconnect] GoDaddy primary live traffic successfully resumed.');
      } catch (e: any) {
        console.warn('[Auto-Reconnect] Probe succeeded but primary pool re-test failed:', e.message);
      }
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/*path', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const isNamedPipeOrSocket = typeof PORT === 'string' && isNaN(Number(PORT));
  const server = isNamedPipeOrSocket
    ? app.listen(PORT, () => {
        console.log(`Server running on socket ${PORT}`);
      })
    : app.listen(Number(PORT), "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
      });

  server.on('listening', () => {
    // Non-blocking background verification of local MariaDB replica daemon (if local standalone mode)
    const isRemoteDb = process.env.PRIMARY_DB === 'godaddy' || (process.env.MYSQL_HOST && process.env.MYSQL_HOST !== '127.0.0.1' && process.env.MYSQL_HOST !== 'localhost');
    if (!isRemoteDb && fs.existsSync('./start-db.sh')) {
      import('child_process').then(({ spawn }) => {
        try {
          const child = spawn('bash', ['./start-db.sh'], { detached: true, stdio: 'ignore' });
          child.unref();
        } catch (e: any) {
          console.warn('[Background DB Starter]:', e.message);
        }
      }).catch(() => {});
    }
  });
}

startServer();