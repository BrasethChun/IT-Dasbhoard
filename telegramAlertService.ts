import express from 'express';
import mysql from 'mysql2/promise';
import axios from 'axios';
import cron from 'node-cron';

export interface TelegramRecipient {
  botToken: string;
  chatId: string;
  name: string;
}

export interface DbAlertDetails {
  host?: string;
  database?: string;
  user?: string;
  errorCode?: string;
  errorMessage?: string;
  actionTaken?: string;
  latencyMs?: number;
}

let isRemoteReportedDown = false;
let lastDownAlertTimestamp = 0;
let lastAlertMessage = '';
let lastAlertTimestamp: string | null = null;
const ALERT_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes cooldown between duplicate down alerts

/**
 * Fetch all enabled Telegram bot recipients from users table or environment variables
 */
export async function getTelegramRecipients(): Promise<TelegramRecipient[]> {
  const recipients: TelegramRecipient[] = [];

  try {
    // Query users directly from local MariaDB
    const localConn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'ainotes_user',
      password: 'x!gmx^-hQhkn5JEw',
      database: 'ainotes_db',
      connectTimeout: 4000
    });

    try {
      const [rows]: any = await localConn.query(
        'SELECT full_name, display_name, telegram_chat_id, telegram_bot_token, telegram_enabled FROM users WHERE telegram_enabled = 1 AND telegram_chat_id IS NOT NULL AND telegram_chat_id != ""'
      );

      for (const row of rows) {
        const botToken = row.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN;
        if (botToken && row.telegram_chat_id) {
          recipients.push({
            botToken: botToken.trim(),
            chatId: String(row.telegram_chat_id).trim(),
            name: row.full_name || row.display_name || 'Admin'
          });
        }
      }
    } finally {
      await localConn.end().catch(() => {});
    }
  } catch (err: any) {
    console.warn('[Telegram Alert Service] Could not fetch users from database:', err.message);
  }

  // Fallback to environment variables if no DB recipients found
  if (recipients.length === 0 && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    recipients.push({
      botToken: process.env.TELEGRAM_BOT_TOKEN.trim(),
      chatId: process.env.TELEGRAM_CHAT_ID.trim(),
      name: 'System Admin'
    });
  }

  // Deduplicate by botToken + chatId
  const seen = new Set<string>();
  return recipients.filter(r => {
    const key = `${r.botToken}__${r.chatId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Format and send rich HTML Telegram database alert
 */
export async function sendTelegramDatabaseAlert(
  type: 'REMOTE_CONNECTION_LOST' | 'REMOTE_CONNECTION_RESTORED' | 'TEST_ALERT',
  details: DbAlertDetails
): Promise<{ success: boolean; sentCount: number; errors: string[] }> {
  const recipients = await getTelegramRecipients();
  if (recipients.length === 0) {
    console.warn('[Telegram Alert Notice] No active Telegram recipients configured in users table.');
    return { success: false, sentCount: 0, errors: ['No active Telegram recipients configured'] };
  }

  const nowStr = new Date().toLocaleString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });

  const host = details.host || process.env.MYSQL_HOST || '118.139.180.163';
  const database = details.database || process.env.MYSQL_DATABASE || 'khema_ainotes';
  const errorCode = details.errorCode || 'UNKNOWN_ERROR';
  const errorMessage = details.errorMessage || 'Connection terminated unexpectedly';
  const actionTaken = details.actionTaken || 'Application auto-failed over to local MariaDB replica to maintain 100% uptime with zero data loss.';

  let text = '';

  if (type === 'REMOTE_CONNECTION_LOST') {
    text = `🚨 <b>[AI Notes Alert] GoDaddy MySQL Connection Lost!</b>\n\n` +
           `⚠️ <b>Incident:</b> Remote GoDaddy MySQL server dropped or refused connection.\n` +
           `🌐 <b>Remote Host:</b> <code>${host}</code>\n` +
           `🗄️ <b>Database:</b> <code>${database}</code>\n` +
           `❌ <b>Error:</b> <code>${errorCode}</code> (${errorMessage})\n\n` +
           `🛡️ <b>Temporary In-Memory Failover:</b>\n` +
           `<i>GoDaddy configuration remains locked as Primary. The application is temporarily buffering queries from the local MariaDB replica to maintain 100% uptime with zero data loss. Auto-reconnection will resume GoDaddy traffic automatically once reachable.</i>\n\n` +
           `⏰ <b>Timestamp:</b> ${nowStr}\n` +
           `👉 <i>Check cPanel Remote MySQL settings and database service status.</i>`;
  } else if (type === 'REMOTE_CONNECTION_RESTORED') {
    text = `✅ <b>[AI Notes Recovery] GoDaddy MySQL Connection Restored!</b>\n\n` +
           `🌐 <b>Remote Host:</b> <code>${host}</code>\n` +
           `🗄️ <b>Database:</b> <code>${database}</code>\n` +
           `🟢 <b>Status:</b> Remote MySQL server reconnected${details.latencyMs ? ` (${details.latencyMs} ms)` : ''}. Live traffic automatically resumed on GoDaddy Primary.\n\n` +
           `⏰ <b>Timestamp:</b> ${nowStr}`;
  } else {
    // TEST_ALERT
    text = `🔔 <b>[AI Notes Test Alert] GoDaddy MySQL Monitor Active</b>\n\n` +
           `🤖 <b>Bot Status:</b> Connected & Monitoring\n` +
           `🌐 <b>Configured Host:</b> <code>${host}</code>\n` +
           `🗄️ <b>Database:</b> <code>${database}</code>\n` +
           `📡 <b>Heartbeat:</b> Active (Pings remote database every 30s)\n` +
           `🔒 <b>Primary Policy:</b> Locked (No auto-reset on transient drops)\n\n` +
           `✅ If GoDaddy MySQL loses remote connection at any time, an alert will be dispatched to this chat immediately.\n\n` +
           `⏰ <b>Timestamp:</b> ${nowStr}`;
  }

  let sentCount = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${recipient.botToken}/sendMessage`,
        {
          chat_id: recipient.chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        },
        { timeout: 7000 }
      );
      sentCount++;
      console.log(`[Telegram Alert Sent] Delivered '${type}' alert to ${recipient.name} (${recipient.chatId})`);
    } catch (err: any) {
      const errMsg = err.response?.data?.description || err.message;
      console.error(`[Telegram Alert Error] Failed to send to ${recipient.chatId}:`, errMsg);
      errors.push(`${recipient.chatId}: ${errMsg}`);
    }
  }

  lastAlertMessage = text;
  lastAlertTimestamp = new Date().toISOString();

  return { success: sentCount > 0, sentCount, errors };
}

/**
 * Triggered automatically when a connection drop or error occurs on remote GoDaddy MySQL
 */
export async function notifyGoDaddyDisconnection(details: DbAlertDetails) {
  const now = Date.now();
  const isCooldownActive = isRemoteReportedDown && (now - lastDownAlertTimestamp < ALERT_COOLDOWN_MS);

  if (isCooldownActive) {
    console.log('[Telegram Alert Cooldown] Connection drop alert suppressed by cooldown window.');
    return;
  }

  isRemoteReportedDown = true;
  lastDownAlertTimestamp = now;

  console.warn('[Telegram Alert Trigger] Dispatching remote MySQL disconnection alert to Telegram bot...');
  await sendTelegramDatabaseAlert('REMOTE_CONNECTION_LOST', details);
}

/**
 * Triggered automatically when remote connection is re-established
 */
export async function notifyGoDaddyRestored(details: DbAlertDetails) {
  if (!isRemoteReportedDown) return;

  isRemoteReportedDown = false;
  lastDownAlertTimestamp = 0;

  console.log('[Telegram Alert Trigger] Dispatching remote MySQL restoration notice to Telegram bot...');
  await sendTelegramDatabaseAlert('REMOTE_CONNECTION_RESTORED', details);
}

/**
 * Periodic Heartbeat & Health Check Worker for Remote GoDaddy MySQL
 */
export function startRemoteDatabaseHeartbeat(
  getDb: () => mysql.Pool,
  onStatusChange?: (isRestored: boolean, latencyMs?: number) => void
) {
  // Run heartbeat monitor every 30 seconds for faster recovery
  cron.schedule('*/30 * * * * *', async () => {
    const currentHost = process.env.MYSQL_HOST || '127.0.0.1';
    const isRemote = currentHost !== '127.0.0.1' && currentHost !== 'localhost';

    // If app is operating on remote GoDaddy MySQL:
    if (isRemote) {
      try {
        const startTime = Date.now();
        const testConn = await mysql.createConnection({
          host: currentHost,
          port: Number(process.env.MYSQL_PORT) || 3306,
          user: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD,
          database: process.env.MYSQL_DATABASE,
          connectTimeout: 5000,
          ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined
        });

        await testConn.query('SELECT 1');
        const latencyMs = Date.now() - startTime;
        await testConn.end();

        if (onStatusChange) {
          onStatusChange(true, latencyMs);
        }

        // If it was down, notify restored!
        if (isRemoteReportedDown) {
          await notifyGoDaddyRestored({
            host: currentHost,
            database: process.env.MYSQL_DATABASE,
            latencyMs
          });
        }
      } catch (err: any) {
        console.warn(`[Remote MySQL Heartbeat Failed] (${err.code}: ${err.message})`);
        if (onStatusChange) {
          onStatusChange(false);
        }
        await notifyGoDaddyDisconnection({
          host: currentHost,
          database: process.env.MYSQL_DATABASE,
          errorCode: err.code || 'CONNECTION_FAILED',
          errorMessage: err.message || 'Remote heartbeat check failed',
          actionTaken: 'Heartbeat failure detected. Temporary replica buffering active while auto-reconnecting.'
        });
      }
    }
  });

  console.log('[Remote MySQL Monitor] Heartbeat monitor initialized (30-second cycle).');
}

/**
 * Setup Telegram Database Alert routes in Express
 */
export function setupTelegramAlertRoutes(app: express.Express, authenticateToken: any) {
  // 1. Get current Telegram DB alert status
  app.get('/api/telegram/db-alert-status', authenticateToken, async (req: any, res) => {
    try {
      const recipients = await getTelegramRecipients();
      const currentHost = process.env.MYSQL_HOST || '127.0.0.1';
      const isRemote = currentHost !== '127.0.0.1' && currentHost !== 'localhost';

      res.json({
        configured: recipients.length > 0,
        recipientsCount: recipients.length,
        recipients: recipients.map(r => ({
          name: r.name,
          chatId: r.chatId.startsWith('-') ? r.chatId : `***${r.chatId.slice(-4)}`
        })),
        isRemoteOperating: isRemote,
        isRemoteReportedDown,
        activeHost: currentHost,
        lastAlertTimestamp,
        cooldownMinutes: ALERT_COOLDOWN_MS / (60 * 1000)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Send instant Test Alert to configured Telegram bot
  app.post('/api/telegram/test-db-alert', authenticateToken, async (req: any, res) => {
    try {
      const currentHost = process.env.MYSQL_HOST || '118.139.180.163';
      const currentDb = process.env.MYSQL_DATABASE || 'khema_ainotes';

      const result = await sendTelegramDatabaseAlert('TEST_ALERT', {
        host: currentHost,
        database: currentDb
      });

      if (!result.success) {
        return res.status(400).json({
          error: 'Failed to send alert to Telegram bot: ' + (result.errors.join(', ') || 'No recipients')
        });
      }

      res.json({
        success: true,
        message: `Successfully delivered test alert to ${result.sentCount} Telegram channel(s)!`,
        sentCount: result.sentCount
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Test alert failed: ' + err.message });
    }
  });
}
