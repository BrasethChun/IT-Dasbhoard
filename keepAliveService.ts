import { Express, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import { runDuePersonalRemindersSweep } from './personalSchedulerServer';
import { runDueSystemUpdateRemindersSweep } from './systemUpdateServer';
import { runAutoSync } from './mailServer';
import { runRemoteHeartbeatCheck } from './telegramAlertService';

export interface KeepAliveSweepResult {
  source: 'startup' | 'cpanel-cron' | 'manual' | 'internal-cron';
  executedAt: string;
  durationMs: number;
  skipped?: boolean;
  workers: {
    personalReminders: { skipped?: boolean; checked: number; sent: number; failed: number; error?: string };
    systemUpdates: { skipped?: boolean; checked: number; sent: number; failed: number; error?: string };
    dbHeartbeat: { isRemote: boolean; ok: boolean; latencyMs?: number; host: string; error?: string };
    mailAutoSync: { skipped?: boolean; checked: number; synced: number; failed: number; error?: string };
  };
}

let cronStateTableReady = false;
let activeSweepPromise: Promise<KeepAliveSweepResult> | null = null;
const processStartedAt = Date.now();

async function ensureCronStateRow(db: mysql.Pool): Promise<{
  keepalive_key: string;
  last_tick_at: string | null;
  last_tick_source: string | null;
  last_result_json: string | null;
  total_ticks: number;
}> {
  if (!cronStateTableReady) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS app_cron_state (
        id INT PRIMARY KEY,
        keepalive_key VARCHAR(128) NOT NULL,
        last_tick_at DATETIME NULL,
        last_tick_source VARCHAR(50) NULL,
        last_result_json TEXT NULL,
        total_ticks INT DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `).catch((e: any) => console.warn('[KeepAlive] Table init warning:', e.message));
    cronStateTableReady = true;
  }

  const [rows]: any = await db.query('SELECT * FROM app_cron_state WHERE id = 1');
  if (rows && rows.length > 0) {
    const envOverride = (process.env.CRON_KEEPALIVE_KEY || '').trim();
    if (envOverride && envOverride !== rows[0].keepalive_key) {
      await db.query('UPDATE app_cron_state SET keepalive_key = ? WHERE id = 1', [envOverride]).catch(() => {});
      rows[0].keepalive_key = envOverride;
    }
    return rows[0];
  }

  const initialKey = (process.env.CRON_KEEPALIVE_KEY || '').trim() || crypto.randomBytes(24).toString('hex');
  await db.query(
    'INSERT INTO app_cron_state (id, keepalive_key, total_ticks) VALUES (1, ?, 0) ON DUPLICATE KEY UPDATE id = 1',
    [initialKey]
  ).catch(() => {});

  const [freshRows]: any = await db.query('SELECT * FROM app_cron_state WHERE id = 1');
  return freshRows?.[0] || {
    keepalive_key: initialKey,
    last_tick_at: null,
    last_tick_source: null,
    last_result_json: null,
    total_ticks: 0
  };
}

export async function executeAllBackgroundSweeps(
  getDb: () => mysql.Pool,
  source: KeepAliveSweepResult['source'] = 'manual',
  onDbStatusChange?: (isRestored: boolean, latencyMs?: number) => void
): Promise<KeepAliveSweepResult> {
  if (activeSweepPromise) {
    return activeSweepPromise;
  }

  activeSweepPromise = (async () => {
    const started = Date.now();
    const db = getDb();
    await ensureCronStateRow(db).catch(() => {});

    const [personalRes, systemUpdateRes, dbHeartbeatRes, mailSyncRes] = await Promise.all([
      runDuePersonalRemindersSweep(getDb).catch((err: any) => ({
        checked: 0,
        sent: 0,
        failed: 0,
        error: err?.message || 'Personal reminder sweep error'
      })),
      runDueSystemUpdateRemindersSweep(getDb).catch((err: any) => ({
        checked: 0,
        sent: 0,
        failed: 0,
        error: err?.message || 'System update sweep error'
      })),
      runRemoteHeartbeatCheck(onDbStatusChange).catch((err: any) => ({
        isRemote: false,
        ok: false,
        host: process.env.MYSQL_HOST || 'localhost',
        error: err?.message || 'Heartbeat check error'
      })),
      runAutoSync(db).catch((err: any) => ({
        checked: 0,
        synced: 0,
        failed: 0,
        error: err?.message || 'Mail sync error'
      }))
    ]);

    const result: KeepAliveSweepResult = {
      source,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      workers: {
        personalReminders: personalRes,
        systemUpdates: systemUpdateRes,
        dbHeartbeat: dbHeartbeatRes,
        mailAutoSync: mailSyncRes
      }
    };

    try {
      await db.query(
        `UPDATE app_cron_state
         SET last_tick_at = NOW(),
             last_tick_source = ?,
             last_result_json = ?,
             total_ticks = COALESCE(total_ticks, 0) + 1
         WHERE id = 1`,
        [source, JSON.stringify(result)]
      );
    } catch (err: any) {
      console.warn('[KeepAlive] Could not persist cron tick state:', err.message);
    }

    return result;
  })();

  try {
    return await activeSweepPromise;
  } finally {
    activeSweepPromise = null;
  }
}

export function setupKeepAliveRoutes(
  app: Express,
  authenticateToken: any,
  getDb: () => mysql.Pool,
  onDbStatusChange?: (isRestored: boolean, latencyMs?: number) => void
) {
  // Run immediate catch-up sweep shortly after boot/wake so Passenger restarts never miss alerts
  setTimeout(() => {
    executeAllBackgroundSweeps(getDb, 'startup', onDbStatusChange).catch((err: any) => {
      console.warn('[KeepAlive Startup Catch-Up Notice]:', err?.message || err);
    });
  }, 4000);

  // Public (key-protected) endpoint for GoDaddy cPanel Cron Jobs / Uptime monitors
  const handleKeepAlivePing = async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const state = await ensureCronStateRow(db);
      const providedKey = String(
        req.query.key || req.headers['x-cron-key'] || (req.body && req.body.key) || ''
      ).trim();

      if (!providedKey || providedKey !== state.keepalive_key) {
        return res.status(401).json({ error: 'Invalid or missing keep-alive key' });
      }

      const result = await executeAllBackgroundSweeps(getDb, 'cpanel-cron', onDbStatusChange);
      res.json({
        ok: true,
        uptimeSeconds: Math.floor((Date.now() - processStartedAt) / 1000),
        ...result
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Keep-alive sweep failed' });
    }
  };

  app.get('/api/cron/keep-alive', handleKeepAlivePing);
  app.post('/api/cron/keep-alive', handleKeepAlivePing);

  // Authenticated status endpoint for Settings -> 24H & Deploy tab
  app.get('/api/cron/status', authenticateToken, async (_req: Request, res: Response) => {
    try {
      const db = getDb();
      const state = await ensureCronStateRow(db);

      let lastResult: KeepAliveSweepResult | null = null;
      if (state.last_result_json) {
        try {
          lastResult = JSON.parse(state.last_result_json);
        } catch {}
      }

      res.json({
        keepAliveKey: state.keepalive_key,
        lastTickAt: state.last_tick_at ? new Date(state.last_tick_at).toISOString() : (lastResult?.executedAt || null),
        lastTickSource: state.last_tick_source || lastResult?.source || null,
        totalTicks: Number(state.total_ticks || 0),
        uptimeSeconds: Math.floor((Date.now() - processStartedAt) / 1000),
        nodeEnv: process.env.NODE_ENV || 'development',
        port: process.env.PORT || '3000',
        sessionExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
        lastResult
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to read cron status' });
    }
  });

  // Manual trigger from Settings UI
  app.post('/api/cron/run-now', authenticateToken, async (_req: Request, res: Response) => {
    try {
      const result = await executeAllBackgroundSweeps(getDb, 'manual', onDbStatusChange);
      const db = getDb();
      const state = await ensureCronStateRow(db);

      res.json({
        ok: true,
        keepAliveKey: state.keepalive_key,
        lastTickAt: result.executedAt,
        lastTickSource: result.source,
        totalTicks: Number(state.total_ticks || 0),
        uptimeSeconds: Math.floor((Date.now() - processStartedAt) / 1000),
        lastResult: result
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Manual sweep failed' });
    }
  });

  // Rotate keep-alive secret key
  app.post('/api/cron/rotate-key', authenticateToken, async (_req: Request, res: Response) => {
    try {
      const db = getDb();
      await ensureCronStateRow(db);
      const nextKey = crypto.randomBytes(24).toString('hex');
      await db.query('UPDATE app_cron_state SET keepalive_key = ? WHERE id = 1', [nextKey]);
      res.json({ ok: true, keepAliveKey: nextKey });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to rotate key' });
    }
  });
}
