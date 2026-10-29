import express from 'express';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import cron from 'node-cron';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

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
  trigger: 'scheduled_12h' | 'manual' | 'pre_restore_safety';
  database: string;
  host: string;
  tableCount: number;
  recordCounts: BackupRecordCounts;
  status: 'success' | 'failed';
  error?: string;
}

export interface BackupConfig {
  enabled: boolean;
  intervalHours: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  keepMax: number;
}

const BACKUPS_DIR = path.join(process.cwd(), 'backups');
const CONFIG_FILE = path.join(BACKUPS_DIR, 'backup_config.json');

// Ensure backups dir exists
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

export function getBackupConfig(): BackupConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading backup config:', e);
  }

  // Default configuration: Every 12 Hours
  const now = new Date();
  const nextRun = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  return {
    enabled: true,
    intervalHours: 12,
    lastRunAt: null,
    nextRunAt: nextRun.toISOString(),
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
        // Verify corresponding .sql file exists
        const sqlPath = path.join(BACKUPS_DIR, data.filename);
        if (fs.existsSync(sqlPath)) {
          const stats = fs.statSync(sqlPath);
          data.sizeBytes = stats.size;
          data.formattedSize = formatBytes(stats.size);
        }
        backups.push(data);
      } catch (err) {
        console.warn('Skipping corrupted backup meta:', mf);
      }
    }

    // Sort newest first
    return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    console.error('Error listing backups:', e);
    return [];
  }
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

    counts.notes = notes[0]?.c || 0;
    counts.subscriptions = subs[0]?.c || 0;
    counts.assets = assets[0]?.c || 0;
    counts.users = users[0]?.c || 0;
    counts.tickets = tickets[0]?.c || 0;
    counts.mailAccounts = mail[0]?.c || 0;
  } catch (err) {
    console.warn('Could not query all record counts:', err);
  }

  return counts;
}

export async function createDatabaseBackup(
  trigger: 'scheduled_12h' | 'manual' | 'pre_restore_safety',
  getDb: () => mysql.Pool
): Promise<BackupMeta> {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const id = `backup_${dateStr}_${trigger}`;
  const filename = `ainotes_backup_${dateStr}_${trigger}.sql`;
  const sqlFilePath = path.join(BACKUPS_DIR, filename);
  const metaFilePath = path.join(BACKUPS_DIR, `${id}.json`);

  const db = getDb();
  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const dbName = process.env.MYSQL_DATABASE || 'ainotes_db';
  const isLocal = host === 'localhost' || host === '127.0.0.1';

  const recordCounts = await queryRecordCounts(db);
  let tableCount = 0;

  try {
    const [tables]: any = await db.query('SHOW TABLES').catch(() => [[]]);
    tableCount = tables.length;
  } catch {}

  try {
    if (isLocal && fs.existsSync('/usr/bin/mariadb-dump')) {
      // Use mariadb-dump directly for ultra-fast, robust snapshot
      const cmd = `/usr/bin/mariadb-dump --protocol=socket -u root ${dbName} --single-transaction --quick --skip-lock-tables > "${sqlFilePath}"`;
      await execAsync(cmd);
    } else {
      // Remote GoDaddy MySQL or fallback dump generator
      const [tableRows]: any = await db.query('SHOW TABLES');
      const tableNames = tableRows.map((r: any) => Object.values(r)[0]);
      tableCount = tableNames.length;

      let dumpSql = `-- AI Notes Enterprise GoDaddy/Local Database Backup\n`;
      dumpSql += `-- Generated at: ${now.toISOString()}\n`;
      dumpSql += `-- Host: ${host} | Database: ${dbName} | Trigger: ${trigger}\n\n`;
      dumpSql += `SET FOREIGN_KEY_CHECKS=0;\nSET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";\nSET NAMES utf8mb4;\n\n`;

      for (const tName of tableNames) {
        const [createRows]: any = await db.query(`SHOW CREATE TABLE \`${tName}\``);
        const createSql = createRows[0]?.['Create Table'] || createRows[0]?.['Create View'];
        if (createSql) {
          dumpSql += `DROP TABLE IF EXISTS \`${tName}\`;\n${createSql};\n\n`;
        }

        const [rows]: any = await db.query(`SELECT * FROM \`${tName}\``);
        if (rows.length > 0) {
          const colNames = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
          dumpSql += `INSERT INTO \`${tName}\` (${colNames}) VALUES\n`;
          const valLines = rows.map((r: any) => {
            const vals = Object.values(r).map(v => {
              if (v === null || v === undefined) return 'NULL';
              if (typeof v === 'number' || typeof v === 'boolean') return v;
              if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
              return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
            });
            return `(${vals.join(', ')})`;
          });
          dumpSql += valLines.join(',\n') + ';\n\n';
        }
      }

      dumpSql += `SET FOREIGN_KEY_CHECKS=1;\n`;
      fs.writeFileSync(sqlFilePath, dumpSql, 'utf8');
    }

    const stats = fs.statSync(sqlFilePath);
    const meta: BackupMeta = {
      id,
      filename,
      createdAt: now.toISOString(),
      sizeBytes: stats.size,
      formattedSize: formatBytes(stats.size),
      trigger,
      database: dbName,
      host,
      tableCount,
      recordCounts,
      status: 'success'
    };

    fs.writeFileSync(metaFilePath, JSON.stringify(meta, null, 2), 'utf8');

    // Update config next run time
    const config = getBackupConfig();
    config.lastRunAt = now.toISOString();
    const nextRun = new Date(now.getTime() + config.intervalHours * 60 * 60 * 1000);
    config.nextRunAt = nextRun.toISOString();
    saveBackupConfig(config);

    // Prune old backups if exceeding keepMax
    pruneOldBackups(config.keepMax);

    console.log(`[Database Backup] Successfully created backup: ${filename} (${meta.formattedSize}, ${meta.tableCount} tables)`);
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
  getDb: () => mysql.Pool
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

  // 1. Take safety snapshot before restore!
  console.log('[Database Restore] Creating safety backup snapshot before proceeding...');
  try {
    await createDatabaseBackup('pre_restore_safety', getDb);
  } catch (e: any) {
    console.warn('[Database Restore Warning] Pre-restore safety backup failed, continuing with restore:', e.message);
  }

  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const dbName = process.env.MYSQL_DATABASE || 'ainotes_db';
  const isLocal = host === 'localhost' || host === '127.0.0.1';

  if (isLocal) {
    // Run restore directly into local DB
    const cmd = `mariadb --protocol=socket -u root "${dbName}" < "${sqlFile}"`;
    await execAsync(cmd);
  } else {
    // Remote GoDaddy database
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    const remoteConn = await mysql.createConnection({
      host,
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: dbName,
      multipleStatements: true,
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    });

    try {
      await remoteConn.query(sqlContent);
    } finally {
      await remoteConn.end().catch(() => {});
    }
  }

  // Query updated counts
  const updatedCounts = await queryRecordCounts(getDb());
  console.log(`[Database Restore] Successfully restored backup '${meta.filename}'. Notes: ${updatedCounts.notes}, Subscriptions: ${updatedCounts.subscriptions}`);

  return {
    success: true,
    message: `Database '${dbName}' successfully restored from backup '${meta.filename}'.`,
    recordCounts: updatedCounts
  };
}

export function setupBackupRoutes(
  app: express.Express,
  getDb: () => mysql.Pool,
  authenticateToken: any
) {
  // 1. Get backups list and auto-backup config
  app.get('/api/db/backups', authenticateToken, async (req: any, res) => {
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
      const backup = await createDatabaseBackup('manual', getDb);
      res.json({
        success: true,
        message: `Database backup created successfully (${backup.formattedSize})`,
        backup
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Backup creation failed: ' + err.message });
    }
  });

  // 3. Restore backup by ID
  app.post('/api/db/backups/:id/restore', authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const result = await restoreDatabaseBackup(id, getDb);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Database restore failed: ' + err.message });
    }
  });

  // 4. Download .sql backup file
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

  // 5. Delete backup
  app.delete('/api/db/backups/:id', authenticateToken, async (req: any, res) => {
    try {
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
      res.status(500).json({ error: 'Failed to delete backup: ' + err.message });
    }
  });

  // 6. Update auto-backup configuration
  app.post('/api/db/backups/config', authenticateToken, async (req: any, res) => {
    try {
      const { enabled, intervalHours, keepMax } = req.body;
      const config = getBackupConfig();

      if (typeof enabled === 'boolean') config.enabled = enabled;
      if (typeof intervalHours === 'number' && intervalHours > 0) config.intervalHours = intervalHours;
      if (typeof keepMax === 'number' && keepMax > 0) config.keepMax = keepMax;

      const now = new Date();
      const nextRun = new Date(now.getTime() + config.intervalHours * 60 * 60 * 1000);
      config.nextRunAt = nextRun.toISOString();

      saveBackupConfig(config);
      res.json({ success: true, message: 'Backup configuration updated', config });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update config: ' + err.message });
    }
  });

  // 7. Initialize 12-Hour Automated Cron Worker
  // Schedule: Every 12 hours (at minute 0 past hour 0 and 12)
  cron.schedule('0 0,12 * * *', async () => {
    const config = getBackupConfig();
    if (!config.enabled) {
      console.log('[Auto-Backup] Automated backup is disabled in settings. Skipping.');
      return;
    }
    console.log('[Auto-Backup Worker] Running scheduled 12-hour automated database backup...');
    try {
      await createDatabaseBackup('scheduled_12h', getDb);
    } catch (err: any) {
      console.error('[Auto-Backup Worker Error]', err.message);
    }
  });

  // Initial check: if no backup exists yet, create an initial baseline snapshot
  setTimeout(async () => {
    try {
      const existing = listBackups();
      if (existing.length === 0) {
        console.log('[Auto-Backup Baseline] No previous backups found. Creating initial system snapshot...');
        await createDatabaseBackup('scheduled_12h', getDb);
      }
    } catch (err: any) {
      console.warn('[Auto-Backup Baseline Notice]:', err.message);
    }
  }, 3000);
}
