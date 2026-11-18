import express from 'express';
import mysql from 'mysql2/promise';
import { escape as sqlEscape } from 'mysql2';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import cron from 'node-cron';
import { getDbEnvConfig } from './dbConfig';

export interface BackupRecordCounts {
  notes: number;
  subscriptions: number;
  assets: number;
  users: number;
  tickets: number;
  mailAccounts: number;
}

export interface BackupMeta {
  id: string;
  filename: string;
  createdAt: string;
  sizeBytes: number;
  formattedSize: string;
  trigger: 'scheduled_12h' | 'manual' | 'pre_restore_safety' | 'imported_godaddy';
  database: string;
  host: string;
  tableCount: number;
  recordCounts: BackupRecordCounts;
  status: 'success' | 'failed';
  sourceDatabase?: string;
  error?: string;
}

export interface BackupConfig {
  enabled: boolean;
  intervalHours: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  keepMax: number;
}

export interface BackupRoutesOptions {
  getActiveTarget?: () => { host?: string; socketPath?: string; port: number } | null;
  onSchemaRestored?: () => Promise<void> | void;
}

export interface SqlAnalysis {
  valid: boolean;
  sizeBytes: number;
  formattedSize: string;
  sourceDatabase: string | null;
  tablesFound: string[];
  createTableCount: number;
  dropTableCount: number;
  insertCount: number;
  hasCreateDbOrUse: boolean;
  hasDefiner: boolean;
  estimatedStatements: number;
}

const BACKUPS_DIR = path.join(process.cwd(), 'backups');
const CONFIG_FILE = path.join(BACKUPS_DIR, 'backup_config.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const sqlUpload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 64 * 1024 * 1024 }
});

let activeCronTask: ReturnType<typeof cron.schedule> | null = null;

function getCronExpressionForInterval(intervalHours: number): string {
  if (intervalHours === 6) return '0 0,6,12,18 * * *';
  if (intervalHours === 24) return '0 0 * * *';
  return '0 0,12 * * *';
}

export function computeNextScheduledRun(intervalHours: number, from = new Date()): Date {
  const step = intervalHours === 6 ? 6 : intervalHours === 24 ? 24 : 12;
  const currentUtcHour = from.getUTCHours();
  const nextBoundaryHour = Math.floor(currentUtcHour / step) * step + step;
  const next = new Date(Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
    nextBoundaryHour,
    0,
    0,
    0
  ));
  if (next.getTime() <= from.getTime()) {
    next.setUTCHours(next.getUTCHours() + step);
  }
  return next;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getBackupConfig(): BackupConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      const parsed = JSON.parse(content);
      const intervalHours = [6, 12, 24].includes(Number(parsed.intervalHours))
        ? Number(parsed.intervalHours)
        : 12;
      return {
        enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
        intervalHours,
        lastRunAt: parsed.lastRunAt || null,
        nextRunAt: parsed.nextRunAt || computeNextScheduledRun(intervalHours).toISOString(),
        keepMax: Number(parsed.keepMax) > 0 ? Number(parsed.keepMax) : 30
      };
    }
  } catch (e) {
    console.error('Error reading backup config:', e);
  }

  return {
    enabled: true,
    intervalHours: 12,
    lastRunAt: null,
    nextRunAt: computeNextScheduledRun(12).toISOString(),
    keepMax: 30
  };
}

export function saveBackupConfig(config: BackupConfig) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving backup config:', e);
  }
}

export function listBackups(): BackupMeta[] {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) return [];
    const files = fs.readdirSync(BACKUPS_DIR);
    const metaFiles = files.filter(f => f.endsWith('.json') && f !== 'backup_config.json');

    const backups: BackupMeta[] = [];
    for (const mf of metaFiles) {
      try {
        const fullPath = path.join(BACKUPS_DIR, mf);
        const data: BackupMeta = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const sqlPath = path.join(BACKUPS_DIR, data.filename);
        if (fs.existsSync(sqlPath)) {
          const stats = fs.statSync(sqlPath);
          data.sizeBytes = stats.size;
          data.formattedSize = formatBytes(stats.size);
        }
        backups.push(data);
      } catch {
        console.warn('Skipping corrupted backup meta:', mf);
      }
    }

    return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error('Error listing backups:', e);
    return [];
  }
}

export function analyzeSqlDump(rawSql: string): SqlAnalysis {
  const cleaned = rawSql.replace(/^\uFEFF/, '');
  const sizeBytes = Buffer.byteLength(cleaned, 'utf8');

  let sourceDatabase: string | null = null;
  const useMatch = cleaned.match(/^\s*USE\s+`?([A-Za-z0-9_$-]+)`?\s*;/im);
  const createDbMatch = cleaned.match(/^\s*CREATE\s+(?:DATABASE|SCHEMA)\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([A-Za-z0-9_$-]+)`?/im);
  const headerDbMatch = cleaned.match(/^--\s*(?:Database|Host:.*?Database):\s*`?([A-Za-z0-9_$-]+)`?/im);

  if (useMatch?.[1]) sourceDatabase = useMatch[1];
  else if (createDbMatch?.[1]) sourceDatabase = createDbMatch[1];
  else if (headerDbMatch?.[1]) sourceDatabase = headerDbMatch[1];

  const tablesSet = new Set<string>();
  const createMatches = cleaned.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`?[A-Za-z0-9_$-]+`?\.)?`?([A-Za-z0-9_$-]+)`?/gi);
  let createTableCount = 0;
  for (const m of createMatches) {
    createTableCount++;
    if (m[1]) tablesSet.add(m[1]);
  }

  const dropMatches = cleaned.matchAll(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:`?[A-Za-z0-9_$-]+`?\.)?`?([A-Za-z0-9_$-]+)`?/gi);
  let dropTableCount = 0;
  for (const _ of dropMatches) {
    dropTableCount++;
  }

  const insertMatches = cleaned.matchAll(/INSERT\s+(?:IGNORE\s+)?INTO\s+(?:`?[A-Za-z0-9_$-]+`?\.)?`?([A-Za-z0-9_$-]+)`?/gi);
  let insertCount = 0;
  for (const m of insertMatches) {
    insertCount++;
    if (m[1]) tablesSet.add(m[1]);
  }

  const hasCreateDbOrUse =
    /^\s*(?:CREATE\s+(?:DATABASE|SCHEMA)|USE)\b/im.test(cleaned);
  const hasDefiner = /DEFINER\s*=\s*/i.test(cleaned);
  const estimatedStatements = (cleaned.match(/;\s*(?:\r?\n|$)/g) || []).length;

  const valid =
    sizeBytes > 0 &&
    (createTableCount > 0 || insertCount > 0 || /\b(?:CREATE|INSERT|ALTER|DROP|UPDATE|REPLACE)\b/i.test(cleaned));

  return {
    valid,
    sizeBytes,
    formattedSize: formatBytes(sizeBytes),
    sourceDatabase,
    tablesFound: Array.from(tablesSet),
    createTableCount,
    dropTableCount,
    insertCount,
    hasCreateDbOrUse,
    hasDefiner,
    estimatedStatements
  };
}

export function sanitizeSqlForTargetDatabase(rawSql: string, wrapSafeSession = true): string {
  let sql = rawSql
    .replace(/^\uFEFF/, '')
    .replace(/^\s*CREATE\s+(?:DATABASE|SCHEMA)\b[^;]*;/gim, '')
    .replace(/^\s*USE\s+`?[^`;\s]+`?\s*;/gim, '')
    .replace(/\bDEFINER\s*=\s*(?:`[^`]+`|'[^']+'|[^\s*]+)\s*@\s*(?:`[^`]+`|'[^']+'|[^\s*]+)\s*/gi, '')
    .replace(/\bSQL\s+SECURITY\s+DEFINER\b/gi, 'SQL SECURITY INVOKER')
    .trim();

  if (wrapSafeSession && sql) {
    sql = `SET FOREIGN_KEY_CHECKS=0;\nSET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";\n\n${sql}\n\nSET FOREIGN_KEY_CHECKS=1;\n`;
  }
  return sql;
}

async function queryRecordCounts(db: mysql.Pool): Promise<BackupRecordCounts> {
  const counts: BackupRecordCounts = {
    notes: 0,
    subscriptions: 0,
    assets: 0,
    users: 0,
    tickets: 0,
    mailAccounts: 0
  };

  try {
    const [notes]: any = await db.query('SELECT COUNT(*) as c FROM notes').catch(() => [[{ c: 0 }]]);
    const [subs]: any = await db.query('SELECT COUNT(*) as c FROM it_cloud_subscriptions').catch(() => [[{ c: 0 }]]);
    const [assets]: any = await db.query('SELECT COUNT(*) as c FROM it_assets').catch(() => [[{ c: 0 }]]);
    const [users]: any = await db.query('SELECT COUNT(*) as c FROM users').catch(() => [[{ c: 0 }]]);
    const [tickets]: any = await db.query('SELECT COUNT(*) as c FROM helpdesk').catch(() => [[{ c: 0 }]]);
    const [mail]: any = await db.query('SELECT COUNT(*) as c FROM mail_accounts').catch(() => [[{ c: 0 }]]);

    counts.notes = Number(notes[0]?.c || 0);
    counts.subscriptions = Number(subs[0]?.c || 0);
    counts.assets = Number(assets[0]?.c || 0);
    counts.users = Number(users[0]?.c || 0);
    counts.tickets = Number(tickets[0]?.c || 0);
    counts.mailAccounts = Number(mail[0]?.c || 0);
  } catch (err) {
    console.warn('Could not query all record counts:', err);
  }

  return counts;
}

export async function generateLiveSqlDump(
  getDb: () => mysql.Pool,
  trigger = 'manual_export'
): Promise<{ sql: string; tableCount: number; database: string; host: string }> {
  const now = new Date();
  const db = getDb();
  const envCfg = getDbEnvConfig();
  const host = process.env.ACTIVE_MYSQL_HOST || envCfg.host;
  const dbName = envCfg.database;

  const [tableRows]: any = await db.query('SHOW FULL TABLES');
  const entries: Array<{ name: string; type: string }> = tableRows.map((r: any) => {
    const vals = Object.values(r);
    return {
      name: String(vals[0]),
      type: String(vals[1] || 'BASE TABLE')
    };
  });

  // Sort base tables first, views last
  entries.sort((a, b) => {
    if (a.type === b.type) return 0;
    return a.type === 'VIEW' ? 1 : -1;
  });

  const chunks: string[] = [];
  chunks.push(`-- AI Notes Enterprise GoDaddy/MySQL Database Dump\n`);
  chunks.push(`-- Generated at: ${now.toISOString()}\n`);
  chunks.push(`-- Host: ${host}\n`);
  chunks.push(`-- Database: ${dbName}\n`);
  chunks.push(`-- Trigger: ${trigger}\n\n`);
  chunks.push(`SET FOREIGN_KEY_CHECKS=0;\nSET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";\nSET NAMES utf8mb4;\n\n`);

  const BATCH_SIZE = 150;

  for (const entry of entries) {
    const tName = entry.name;
    const [createRows]: any = await db.query(`SHOW CREATE TABLE \`${tName}\``);
    const createTableSql = createRows[0]?.['Create Table'];
    const createViewSql = createRows[0]?.['Create View'];

    if (createViewSql) {
      const cleanedView = String(createViewSql)
        .replace(/\bDEFINER\s*=\s*(?:`[^`]+`|'[^']+'|[^\s*]+)\s*@\s*(?:`[^`]+`|'[^']+'|[^\s*]+)\s*/gi, '')
        .replace(/\bSQL\s+SECURITY\s+DEFINER\b/gi, 'SQL SECURITY INVOKER');
      chunks.push(`DROP VIEW IF EXISTS \`${tName}\`;\n${cleanedView};\n\n`);
      continue;
    }

    if (createTableSql) {
      chunks.push(`DROP TABLE IF EXISTS \`${tName}\`;\n${createTableSql};\n\n`);
    }

    const [rows]: any = await db.query(`SELECT * FROM \`${tName}\``);
    if (Array.isArray(rows) && rows.length > 0) {
      const colNames = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const valLines = batch.map((r: any) => {
          const vals = Object.values(r).map(v => {
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'boolean') return v ? '1' : '0';
            if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
            if (v instanceof Date) {
              if (isNaN(v.getTime())) return 'NULL';
              return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
            }
            if (Buffer.isBuffer(v)) {
              return `X'${v.toString('hex')}'`;
            }
            if (typeof v === 'object') {
              return sqlEscape(JSON.stringify(v));
            }
            return sqlEscape(String(v));
          });
          return `(${vals.join(', ')})`;
        });
        chunks.push(`INSERT INTO \`${tName}\` (${colNames}) VALUES\n${valLines.join(',\n')};\n\n`);
      }
    }
  }

  chunks.push(`SET FOREIGN_KEY_CHECKS=1;\n`);
  return {
    sql: chunks.join(''),
    tableCount: entries.length,
    database: dbName,
    host
  };
}

async function createTargetSqlConnection(options?: BackupRoutesOptions): Promise<mysql.Connection> {
  const envCfg = getDbEnvConfig();
  const activeTarget = options?.getActiveTarget?.();
  const socketPath = activeTarget?.socketPath || (envCfg.host.startsWith('/') ? envCfg.host : undefined);
  const host = socketPath ? undefined : (activeTarget?.host || process.env.ACTIVE_MYSQL_HOST || envCfg.host);
  const port = activeTarget?.port || envCfg.port;

  return mysql.createConnection({
    ...(socketPath ? { socketPath } : { host, port }),
    user: envCfg.user,
    password: envCfg.password,
    database: envCfg.database,
    multipleStatements: true,
    connectTimeout: 20000,
    ssl: !socketPath && envCfg.ssl ? { rejectUnauthorized: false } : undefined
  });
}

export async function createDatabaseBackup(
  trigger: 'scheduled_12h' | 'manual' | 'pre_restore_safety',
  getDb: () => mysql.Pool
): Promise<BackupMeta> {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const randSuffix = Math.random().toString(36).slice(2, 6);
  const id = `backup_${dateStr}_${trigger}_${randSuffix}`;
  const filename = `ainotes_backup_${dateStr}_${trigger}.sql`;
  const sqlFilePath = path.join(BACKUPS_DIR, filename);
  const metaFilePath = path.join(BACKUPS_DIR, `${id}.json`);

  const db = getDb();
  const envCfg = getDbEnvConfig();
  const host = process.env.ACTIVE_MYSQL_HOST || envCfg.host;
  const dbName = envCfg.database;

  const recordCounts = await queryRecordCounts(db);
  let tableCount = 0;

  try {
    const dumpResult = await generateLiveSqlDump(getDb, trigger);
    tableCount = dumpResult.tableCount;
    fs.writeFileSync(sqlFilePath, dumpResult.sql, 'utf8');

    const stats = fs.statSync(sqlFilePath);
    const meta: BackupMeta = {
      id,
      filename,
      createdAt: now.toISOString(),
      sizeBytes: stats.size,
      formattedSize: formatBytes(stats.size),
      trigger,
      database: dbName,
      host: dumpResult.host || host,
      tableCount,
      recordCounts,
      status: 'success'
    };

    fs.writeFileSync(metaFilePath, JSON.stringify(meta, null, 2), 'utf8');

    const config = getBackupConfig();
    if (trigger === 'scheduled_12h' || trigger === 'manual') {
      config.lastRunAt = now.toISOString();
      config.nextRunAt = computeNextScheduledRun(config.intervalHours, now).toISOString();
      saveBackupConfig(config);
    }

    pruneOldBackups(config.keepMax);

    console.log(`[Database Backup] Created backup: ${filename} (${meta.formattedSize}, ${meta.tableCount} tables)`);
    return meta;
  } catch (err: any) {
    console.error(`[Database Backup Error] Failed to create backup:`, err);
    const meta: BackupMeta = {
      id,
      filename,
      createdAt: now.toISOString(),
      sizeBytes: 0,
      formattedSize: '0 B',
      trigger,
      database: dbName,
      host,
      tableCount,
      recordCounts,
      status: 'failed',
      error: err.message
    };
    fs.writeFileSync(metaFilePath, JSON.stringify(meta, null, 2), 'utf8');
    throw err;
  }
}

function pruneOldBackups(keepMax = 30) {
  try {
    const backups = listBackups();
    if (backups.length <= keepMax) return;

    const toRemove = backups.slice(keepMax);
    for (const b of toRemove) {
      const sqlFile = path.join(BACKUPS_DIR, b.filename);
      const metaFile = path.join(BACKUPS_DIR, `${b.id}.json`);
      if (fs.existsSync(sqlFile)) fs.unlinkSync(sqlFile);
      if (fs.existsSync(metaFile)) fs.unlinkSync(metaFile);
      console.log(`[Backup Retention] Pruned old backup: ${b.filename}`);
    }
  } catch (e) {
    console.warn('Error during backup pruning:', e);
  }
}

export async function restoreDatabaseBackup(
  backupId: string,
  getDb: () => mysql.Pool,
  options?: BackupRoutesOptions
): Promise<{ success: boolean; message: string; recordCounts: BackupRecordCounts }> {
  const metaFile = path.join(BACKUPS_DIR, `${backupId}.json`);
  if (!fs.existsSync(metaFile)) {
    throw new Error('Backup metadata file not found');
  }

  const meta: BackupMeta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  const sqlFile = path.join(BACKUPS_DIR, meta.filename);
  if (!fs.existsSync(sqlFile)) {
    throw new Error(`Backup SQL dump file '${meta.filename}' not found`);
  }

  console.log('[Database Restore] Creating safety backup snapshot before proceeding...');
  try {
    await createDatabaseBackup('pre_restore_safety', getDb);
  } catch (e: any) {
    console.warn('[Database Restore Warning] Pre-restore safety backup skipped:', e.message);
  }

  const envCfg = getDbEnvConfig();
  const rawSql = fs.readFileSync(sqlFile, 'utf8');
  const cleanedSql = sanitizeSqlForTargetDatabase(rawSql, true);

  const conn = await createTargetSqlConnection(options);
  try {
    await conn.query(cleanedSql);
  } finally {
    await conn.end().catch(() => {});
  }

  if (options?.onSchemaRestored) {
    await options.onSchemaRestored();
  }

  const updatedCounts = await queryRecordCounts(getDb());
  console.log(`[Database Restore] Successfully restored '${meta.filename}' into '${envCfg.database}'.`);

  return {
    success: true,
    message: `Database '${envCfg.database}' successfully restored from '${meta.filename}'.`,
    recordCounts: updatedCounts
  };
}

export async function importGoDaddySql(
  params: {
    rawSql: string;
    originalFilename: string;
    mode: 'apply' | 'vault_only';
  },
  getDb: () => mysql.Pool,
  options?: BackupRoutesOptions
): Promise<{
  success: boolean;
  mode: 'apply' | 'vault_only';
  message: string;
  backup: BackupMeta;
  safetyBackupId: string | null;
  database: string;
  analysis: SqlAnalysis;
  recordCounts: BackupRecordCounts;
}> {
  const analysis = analyzeSqlDump(params.rawSql);
  if (!analysis.valid) {
    throw new Error('The uploaded file does not contain valid SQL statements (CREATE TABLE / INSERT INTO).');
  }

  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const randSuffix = Math.random().toString(36).slice(2, 6);
  const safeBase = params.originalFilename
    .replace(/\.sql$/i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 32) || 'godaddy_import';
  const id = `backup_${dateStr}_imported_godaddy_${randSuffix}`;
  const storedFilename = `${safeBase}_${dateStr}.sql`;
  const sqlFilePath = path.join(BACKUPS_DIR, storedFilename);
  const metaFilePath = path.join(BACKUPS_DIR, `${id}.json`);

  const envCfg = getDbEnvConfig();
  const activeHost = process.env.ACTIVE_MYSQL_HOST || envCfg.host;
  const db = getDb();

  let safetyBackupId: string | null = null;

  if (params.mode === 'apply') {
    try {
      const safetyMeta = await createDatabaseBackup('pre_restore_safety', getDb);
      safetyBackupId = safetyMeta.id;
    } catch (e: any) {
      console.warn('[GoDaddy SQL Import] Pre-import safety snapshot skipped:', e.message);
    }

    const cleanedSql = sanitizeSqlForTargetDatabase(params.rawSql, true);
    const conn = await createTargetSqlConnection(options);
    try {
      await conn.query(cleanedSql);
    } finally {
      await conn.end().catch(() => {});
    }

    if (options?.onSchemaRestored) {
      await options.onSchemaRestored();
    }
  }

  // Archive the imported SQL file into the Snapshot Vault for download/re-restore
  fs.writeFileSync(sqlFilePath, params.rawSql.replace(/^\uFEFF/, ''), 'utf8');
  const stats = fs.statSync(sqlFilePath);
  const recordCounts = await queryRecordCounts(db);

  let tableCount = analysis.tablesFound.length;
  try {
    const [tables]: any = await db.query('SHOW TABLES');
    if (params.mode === 'apply' && Array.isArray(tables)) {
      tableCount = tables.length;
    }
  } catch {}

  const meta: BackupMeta = {
    id,
    filename: storedFilename,
    createdAt: now.toISOString(),
    sizeBytes: stats.size,
    formattedSize: formatBytes(stats.size),
    trigger: 'imported_godaddy',
    database: envCfg.database,
    host: activeHost,
    tableCount,
    recordCounts,
    sourceDatabase: analysis.sourceDatabase || undefined,
    status: 'success'
  };

  fs.writeFileSync(metaFilePath, JSON.stringify(meta, null, 2), 'utf8');
  pruneOldBackups(getBackupConfig().keepMax);

  const msg =
    params.mode === 'apply'
      ? `Imported '${params.originalFilename}' into '${envCfg.database}' (${analysis.tablesFound.length} tables).${safetyBackupId ? ' A safety snapshot was created before import.' : ''}`
      : `Saved '${params.originalFilename}' into the Backup Snapshot Vault. Click Restore whenever you are ready to apply it.`;

  return {
    success: true,
    mode: params.mode,
    message: msg,
    backup: meta,
    safetyBackupId,
    database: envCfg.database,
    analysis,
    recordCounts
  };
}

function rescheduleAutoBackupWorker(getDb: () => mysql.Pool, options?: BackupRoutesOptions) {
  if (activeCronTask) {
    try {
      activeCronTask.stop();
    } catch {}
    activeCronTask = null;
  }

  const config = getBackupConfig();
  if (!config.enabled) {
    console.log('[Auto-Backup Worker] Disabled in settings; scheduler stopped.');
    return;
  }

  const expr = getCronExpressionForInterval(config.intervalHours);
  config.nextRunAt = computeNextScheduledRun(config.intervalHours).toISOString();
  saveBackupConfig(config);

  activeCronTask = cron.schedule(
    expr,
    async () => {
      const latest = getBackupConfig();
      if (!latest.enabled) return;
      console.log(`[Auto-Backup Worker] Running scheduled ${latest.intervalHours}h automated database backup...`);
      try {
        await createDatabaseBackup('scheduled_12h', getDb);
      } catch (err: any) {
        console.error('[Auto-Backup Worker Error]', err.message);
      }
    },
    { timezone: 'UTC' }
  );

  console.log(`[Auto-Backup Worker] Scheduled every ${config.intervalHours}h (cron: "${expr}" UTC, next run: ${config.nextRunAt})`);
  void options;
}

async function ensureBackupAdminRole(getDb: () => mysql.Pool, userId: string): Promise<void> {
  const db = getDb();
  const [userRows]: any = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
  const role = userRows?.[0]?.role;
  if (!role || (role !== 'owner' && role !== 'admin')) {
    const err: any = new Error('Restricted: Database backup & SQL import operations require an Owner or Admin account.');
    err.statusCode = 403;
    throw err;
  }
}

export function setupBackupRoutes(
  app: express.Express,
  getDb: () => mysql.Pool,
  authenticateToken: any,
  options?: BackupRoutesOptions
) {
  // 1. Get backups list and auto-backup config
  app.get('/api/db/backups', authenticateToken, async (_req: any, res) => {
    try {
      const backups = listBackups();
      const config = getBackupConfig();
      res.json({ backups, config });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Trigger on-demand backup
  app.post('/api/db/backups/create', authenticateToken, async (req: any, res) => {
    try {
      await ensureBackupAdminRole(getDb, req.user.id);
      const backup = await createDatabaseBackup('manual', getDb);
      res.json({
        success: true,
        message: `Database backup created successfully (${backup.formattedSize})`,
        backup
      });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: 'Backup creation failed: ' + err.message });
    }
  });

  // 3. Inspect/preview uploaded GoDaddy SQL file before importing
  app.post('/api/db/import-sql/preview', authenticateToken, sqlUpload.single('file'), async (req: any, res) => {
    let uploadedPath: string | undefined;
    try {
      await ensureBackupAdminRole(getDb, req.user.id);
      let rawSql = typeof req.body?.sqlContent === 'string' ? req.body.sqlContent : '';
      const originalFilename = req.file?.originalname || req.body?.filename || 'godaddy_import.sql';
      if (!rawSql && req.file?.path) {
        uploadedPath = req.file.path;
        rawSql = fs.readFileSync(req.file.path, 'utf8');
      }
      if (!rawSql.trim()) {
        return res.status(400).json({ error: 'Uploaded SQL file is empty.' });
      }
      const analysis = analyzeSqlDump(rawSql);
      const envCfg = getDbEnvConfig();
      res.json({
        filename: originalFilename,
        targetDatabase: envCfg.database,
        targetHost: process.env.ACTIVE_MYSQL_HOST || envCfg.host,
        ...analysis
      });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Failed to inspect SQL file.' });
    } finally {
      if (uploadedPath && fs.existsSync(uploadedPath)) {
        try { fs.unlinkSync(uploadedPath); } catch {}
      }
    }
  });

  // 4. Import GoDaddy SQL dump (.sql upload or raw SQL)
  app.post('/api/db/import-sql', authenticateToken, sqlUpload.single('file'), async (req: any, res) => {
    let uploadedPath: string | undefined;
    try {
      await ensureBackupAdminRole(getDb, req.user.id);
      let rawSql = typeof req.body?.sqlContent === 'string' ? req.body.sqlContent : '';
      const originalFilename = req.file?.originalname || req.body?.filename || 'godaddy_import.sql';
      const mode: 'apply' | 'vault_only' = req.body?.mode === 'vault_only' ? 'vault_only' : 'apply';

      if (!rawSql && req.file?.path) {
        uploadedPath = req.file.path;
        rawSql = fs.readFileSync(req.file.path, 'utf8');
      }

      if (!rawSql || !rawSql.trim()) {
        return res.status(400).json({ error: 'Please select a valid .sql file or paste SQL statements.' });
      }

      const result = await importGoDaddySql(
        { rawSql, originalFilename, mode },
        getDb,
        options
      );
      res.json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: 'GoDaddy SQL import failed: ' + err.message });
    } finally {
      if (uploadedPath && fs.existsSync(uploadedPath)) {
        try { fs.unlinkSync(uploadedPath); } catch {}
      }
    }
  });

  // 5. Restore backup by ID
  app.post('/api/db/backups/:id/restore', authenticateToken, async (req: any, res) => {
    try {
      await ensureBackupAdminRole(getDb, req.user.id);
      const { id } = req.params;
      const result = await restoreDatabaseBackup(id, getDb, options);
      res.json(result);
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: 'Database restore failed: ' + err.message });
    }
  });

  // 6. Download .sql backup file
  app.get('/api/db/backups/:id/download', (req: any, res) => {
    try {
      const { id } = req.params;
      const metaFile = path.join(BACKUPS_DIR, `${id}.json`);
      if (!fs.existsSync(metaFile)) {
        return res.status(404).json({ error: 'Backup not found' });
      }

      const meta: BackupMeta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
      const sqlFile = path.join(BACKUPS_DIR, meta.filename);
      if (!fs.existsSync(sqlFile)) {
        return res.status(404).json({ error: 'SQL file not found' });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${meta.filename}"`);
      res.setHeader('Content-Type', 'application/sql');
      fs.createReadStream(sqlFile).pipe(res);
    } catch (err: any) {
      res.status(500).json({ error: 'Download failed: ' + err.message });
    }
  });

  // 7. Delete backup
  app.delete('/api/db/backups/:id', authenticateToken, async (req: any, res) => {
    try {
      await ensureBackupAdminRole(getDb, req.user.id);
      const { id } = req.params;
      const metaFile = path.join(BACKUPS_DIR, `${id}.json`);
      if (fs.existsSync(metaFile)) {
        const meta: BackupMeta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
        const sqlFile = path.join(BACKUPS_DIR, meta.filename);
        if (fs.existsSync(sqlFile)) fs.unlinkSync(sqlFile);
        fs.unlinkSync(metaFile);
      }
      res.json({ success: true, message: 'Backup deleted successfully' });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: 'Failed to delete backup: ' + err.message });
    }
  });

  // 8. Update auto-backup configuration (and immediately reschedule worker)
  app.post('/api/db/backups/config', authenticateToken, async (req: any, res) => {
    try {
      await ensureBackupAdminRole(getDb, req.user.id);
      const { enabled, intervalHours, keepMax } = req.body;
      const config = getBackupConfig();

      if (typeof enabled === 'boolean') config.enabled = enabled;
      if (typeof intervalHours === 'number' && [6, 12, 24].includes(intervalHours)) {
        config.intervalHours = intervalHours;
      }
      if (typeof keepMax === 'number' && keepMax >= 5 && keepMax <= 200) {
        config.keepMax = keepMax;
      }

      config.nextRunAt = computeNextScheduledRun(config.intervalHours).toISOString();
      saveBackupConfig(config);

      rescheduleAutoBackupWorker(getDb, options);
      pruneOldBackups(config.keepMax);

      res.json({ success: true, message: 'Backup configuration updated', config: getBackupConfig() });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ error: 'Failed to update config: ' + err.message });
    }
  });

  // 9. Initialize dynamic 12h (or configured 6h/12h/24h) Automated Cron Worker
  rescheduleAutoBackupWorker(getDb, options);

  // 10. Startup baseline / overdue catch-up snapshot check
  setTimeout(async () => {
    try {
      const existing = listBackups();
      const config = getBackupConfig();
      if (existing.length === 0) {
        console.log('[Auto-Backup Baseline] No previous backups found. Creating initial system snapshot...');
        await createDatabaseBackup('scheduled_12h', getDb);
        return;
      }

      if (config.enabled && config.lastRunAt) {
        const elapsedMs = Date.now() - new Date(config.lastRunAt).getTime();
        const intervalMs = config.intervalHours * 60 * 60 * 1000;
        if (elapsedMs >= intervalMs) {
          console.log(`[Auto-Backup Catch-Up] Last backup was ${(elapsedMs / 3600000).toFixed(1)}h ago (>= ${config.intervalHours}h). Creating catch-up snapshot...`);
          await createDatabaseBackup('scheduled_12h', getDb);
        }
      }
    } catch (err: any) {
      console.warn('[Auto-Backup Startup Notice]:', err.message);
    }
  }, 4000);
}
