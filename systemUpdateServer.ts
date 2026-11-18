import { Express, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import cron from 'node-cron';
import { dispatchRawMessageToItTelegramGroups } from './itMeetingServer';

export interface SystemUpdateRecord {
  id: string;
  user_id: string | null;
  application_name: string;
  update_date: string;
  date_label: string;
  update_time: string;
  downtime_duration: string;
  update_reason: string;
  sign_off: string;
  custom_message: string | null;
  target_groups: string[];
  initial_alert_sent: boolean;
  initial_alert_sent_at: string | null;
  reminder_minutes_before: number;
  reminder_at_utc: string | null;
  reminder_sent: boolean;
  reminder_sent_at: string | null;
  alert_delivery_report: any;
  last_alert_error: string | null;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  created_at?: string;
  updated_at?: string;
}

let tableInitialized = false;
let cronStarted = false;
let isSweepRunning = false;

function formatSqlDate(val: any): string {
  if (!val) return '';
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return str.slice(0, 10);
}

function toMysqlUtcDatetime(isoOrSql?: any): string | null {
  if (!isoOrSql) return null;
  if (isoOrSql instanceof Date) {
    if (isNaN(isoOrSql.getTime())) return null;
    const y = isoOrSql.getFullYear();
    const m = String(isoOrSql.getMonth() + 1).padStart(2, '0');
    const d = String(isoOrSql.getDate()).padStart(2, '0');
    const hh = String(isoOrSql.getHours()).padStart(2, '0');
    const mm = String(isoOrSql.getMinutes()).padStart(2, '0');
    const ss = String(isoOrSql.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }
  const str = String(isoOrSql).trim();
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) {
    return str;
  }
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 19).replace('T', ' ');
}

function formatUtcSqlDatetimeToIso(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const utcMs = Date.UTC(
      val.getFullYear(),
      val.getMonth(),
      val.getDate(),
      val.getHours(),
      val.getMinutes(),
      val.getSeconds(),
      val.getMilliseconds()
    );
    return new Date(utcMs).toISOString();
  }
  const str = String(val).trim();
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(str)) {
    const normalized = str.slice(0, 19).replace(' ', 'T') + 'Z';
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function formatLeadLabel(minutes: number): string {
  if (!minutes || minutes <= 0) return '';
  if (minutes >= 60 && minutes % 60 === 0) {
    const hrs = minutes / 60;
    return `${hrs} hour${hrs > 1 ? 's' : ''} before`;
  }
  return `${minutes} min before`;
}

export function formatDefaultDatePhrase(dateStr?: string | null): string {
  const clean = formatSqlDate(dateStr);
  if (!clean) return 'today';

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (clean === todayStr) return 'today';

  const tmrw = new Date(now);
  tmrw.setDate(tmrw.getDate() + 1);
  const tmrwStr = `${tmrw.getFullYear()}-${String(tmrw.getMonth() + 1).padStart(2, '0')}-${String(tmrw.getDate()).padStart(2, '0')}`;
  if (clean === tmrwStr) return 'tomorrow';

  const parts = clean.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    if (months[month]) {
      return `on ${day} ${months[month]} ${year}`;
    }
  }
  return `on ${clean}`;
}

export function buildSystemUpdateTelegramMessage(
  data: {
    application_name?: string;
    update_date?: string;
    date_label?: string | null;
    update_time?: string;
    downtime_duration?: string;
    update_reason?: string;
    sign_off?: string;
    custom_message?: string | null;
    reminder_minutes_before?: number;
  },
  mode: 'notice' | 'reminder' = 'notice'
): string {
  const app = (data.application_name || 'eHospital').trim();
  const whenPhrase = (data.date_label && data.date_label.trim())
    ? data.date_label.trim()
    : formatDefaultDatePhrase(data.update_date);
  const timeText = (data.update_time || '9:00 PM').trim();
  const durationText = (data.downtime_duration || '45minutes').trim();
  const reasonText = (data.update_reason || 'For bug update').trim();
  const signOff = (data.sign_off || 'Head IT').trim();

  const baseMessage = data.custom_message && data.custom_message.trim()
    ? data.custom_message.trim()
    : `Dear All Users,

We would like to inform you that the ${app} application will be updated ${whenPhrase} at ${timeText} application unavailable ${durationText} ${reasonText}.

⏳ During the updating, ${app}  may be temporarily unavailable, Please preparing necessary task before we stop application.
✅ We appreciate your patience and understanding.

Thank you,
${signOff}`;

  if (mode === 'reminder') {
    const leadText = formatLeadLabel(Number(data.reminder_minutes_before || 0));
    const header = leadText
      ? `⏰ REMINDER (${leadText} · ${app} update ${whenPhrase} at ${timeText})`
      : `⏰ REMINDER · Upcoming ${app} update ${whenPhrase} at ${timeText}`;
    return `${header}\n\n${baseMessage}`;
  }

  return baseMessage;
}

function mapRowToSystemUpdate(r: any): SystemUpdateRecord {
  let targetGroups: string[] = [];
  if (r.target_groups_json) {
    try {
      const parsed = JSON.parse(r.target_groups_json);
      if (Array.isArray(parsed)) targetGroups = parsed;
    } catch {}
  }

  let deliveryReport: any = null;
  if (r.alert_delivery_report) {
    try {
      deliveryReport = JSON.parse(r.alert_delivery_report);
    } catch {}
  }

  return {
    id: r.id,
    user_id: r.user_id || null,
    application_name: r.application_name || 'eHospital',
    update_date: formatSqlDate(r.update_date),
    date_label: r.date_label || 'today',
    update_time: r.update_time || '9:00 PM',
    downtime_duration: r.downtime_duration || '45minutes',
    update_reason: r.update_reason || 'For bug update',
    sign_off: r.sign_off || 'Head IT',
    custom_message: r.custom_message || null,
    target_groups: targetGroups,
    initial_alert_sent: Boolean(r.initial_alert_sent),
    initial_alert_sent_at: r.initial_alert_sent_at ? new Date(r.initial_alert_sent_at).toISOString() : null,
    reminder_minutes_before: Number(r.reminder_minutes_before ?? 15),
    reminder_at_utc: formatUtcSqlDatetimeToIso(r.reminder_at_utc),
    reminder_sent: Boolean(r.reminder_sent),
    reminder_sent_at: r.reminder_sent_at ? new Date(r.reminder_sent_at).toISOString() : null,
    alert_delivery_report: deliveryReport,
    last_alert_error: r.last_alert_error || null,
    status: (r.status || 'Scheduled') as SystemUpdateRecord['status'],
    created_at: r.created_at || undefined,
    updated_at: r.updated_at || undefined
  };
}

export async function initSystemUpdateTables(db: mysql.Pool): Promise<void> {
  if (tableInitialized) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS it_system_updates (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NULL,
      application_name VARCHAR(150) NOT NULL DEFAULT 'eHospital',
      update_date DATE NOT NULL,
      date_label VARCHAR(100) DEFAULT 'today',
      update_time VARCHAR(50) NOT NULL DEFAULT '9:00 PM',
      downtime_duration VARCHAR(100) NOT NULL DEFAULT '45minutes',
      update_reason VARCHAR(255) NOT NULL DEFAULT 'For bug update',
      sign_off VARCHAR(100) NOT NULL DEFAULT 'Head IT',
      custom_message TEXT NULL,
      target_groups_json TEXT,
      initial_alert_sent BOOLEAN DEFAULT FALSE,
      initial_alert_sent_at DATETIME NULL,
      reminder_minutes_before INT DEFAULT 15,
      reminder_at_utc DATETIME NULL,
      reminder_sent BOOLEAN DEFAULT FALSE,
      reminder_sent_at DATETIME NULL,
      alert_delivery_report TEXT,
      last_alert_error TEXT NULL,
      status VARCHAR(50) DEFAULT 'Scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_su_reminder_due (status, reminder_sent, reminder_at_utc),
      INDEX idx_su_date (update_date)
    )
  `).catch((e: any) => console.warn('[System Updates] Table init warning:', e.message));
  tableInitialized = true;
}

export async function runDueSystemUpdateRemindersSweep(
  getDb: () => mysql.Pool
): Promise<{ skipped?: boolean; checked: number; sent: number; failed: number; error?: string }> {
  if (isSweepRunning) return { skipped: true, checked: 0, sent: 0, failed: 0 };
  isSweepRunning = true;
  let checked = 0;
  let sent = 0;
  let failed = 0;
  try {
    const db = getDb();
    await initSystemUpdateTables(db);

    const [dueRows]: any = await db.query(`
      SELECT *
      FROM it_system_updates
      WHERE reminder_sent = 0
        AND reminder_minutes_before > 0
        AND reminder_at_utc IS NOT NULL
        AND reminder_at_utc <= UTC_TIMESTAMP()
        AND reminder_at_utc >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR)
        AND status = 'Scheduled'
      LIMIT 20
    `);

    checked = Array.isArray(dueRows) ? dueRows.length : 0;

    for (const row of dueRows) {
      let targetGroups: string[] = [];
      if (row.target_groups_json) {
        try {
          const parsed = JSON.parse(row.target_groups_json);
          if (Array.isArray(parsed)) targetGroups = parsed;
        } catch {}
      }

      const reminderMsg = buildSystemUpdateTelegramMessage(
        {
          application_name: row.application_name,
          update_date: formatSqlDate(row.update_date),
          date_label: row.date_label,
          update_time: row.update_time,
          downtime_duration: row.downtime_duration,
          update_reason: row.update_reason,
          sign_off: row.sign_off,
          custom_message: row.custom_message,
          reminder_minutes_before: row.reminder_minutes_before
        },
        'reminder'
      );

      const dispatchRes = await dispatchRawMessageToItTelegramGroups(
        db,
        row.user_id || null,
        reminderMsg,
        targetGroups
      );

      if (dispatchRes.success) {
        sent++;
        await db.query(
          `UPDATE it_system_updates
           SET reminder_sent = 1,
               reminder_sent_at = NOW(),
               alert_delivery_report = ?,
               last_alert_error = NULL
           WHERE id = ?`,
          [JSON.stringify({ mode: 'auto_reminder', ...dispatchRes }), row.id]
        );
      } else {
        failed++;
        await db.query(
          `UPDATE it_system_updates SET last_alert_error = ? WHERE id = ?`,
          [dispatchRes.error || 'Reminder dispatch failed', row.id]
        );
      }
    }
    return { checked, sent, failed };
  } catch (err: any) {
    console.warn('[System Updates] Cron sweep warning:', err.message);
    return { checked, sent, failed, error: err.message };
  } finally {
    isSweepRunning = false;
  }
}

export function setupSystemUpdateRoutes(
  app: Express,
  authenticateToken: any,
  getDb: () => mysql.Pool
) {
  if (!cronStarted) {
    cronStarted = true;
    cron.schedule('* * * * *', () => {
      runDueSystemUpdateRemindersSweep(getDb).catch(() => {});
    });
  }

  // --- 1. GET ALL SYSTEM UPDATE NOTICES ---
  app.get('/api/system-updates', authenticateToken, async (_req: Request, res: Response) => {
    try {
      const db = getDb();
      await initSystemUpdateTables(db);
      const [rows]: any = await db.query(
        'SELECT * FROM it_system_updates ORDER BY update_date DESC, created_at DESC'
      );
      res.json(Array.isArray(rows) ? rows.map(mapRowToSystemUpdate) : []);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 2. PREVIEW FORMATTED SYSTEM UPDATE MESSAGE ---
  app.post('/api/system-updates/preview', authenticateToken, async (req: Request, res: Response) => {
    try {
      const noticeMessage = buildSystemUpdateTelegramMessage(req.body || {}, 'notice');
      const reminderMessage = buildSystemUpdateTelegramMessage(req.body || {}, 'reminder');
      res.json({ notice_message: noticeMessage, reminder_message: reminderMessage });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 3. CREATE SYSTEM UPDATE NOTICE (WITH OPTIONAL IMMEDIATE TELEGRAM DISPATCH) ---
  app.post('/api/system-updates', authenticateToken, async (req: any, res: Response) => {
    try {
      const db = getDb();
      await initSystemUpdateTables(db);

      const {
        application_name,
        update_date,
        date_label,
        update_time,
        downtime_duration,
        update_reason,
        sign_off,
        custom_message,
        target_groups,
        reminder_minutes_before,
        reminder_at_utc,
        send_alert_now,
        status
      } = req.body || {};

      const cleanDate = formatSqlDate(update_date || new Date());
      if (!cleanDate) {
        return res.status(400).json({ error: 'Update date is required' });
      }

      const id = crypto.randomUUID();
      const userId = req.user?.id || null;
      const appName = (application_name || 'eHospital').trim();
      const datePhrase = (date_label || formatDefaultDatePhrase(cleanDate)).trim();
      const timeStr = (update_time || '9:00 PM').trim();
      const durationStr = (downtime_duration || '45minutes').trim();
      const reasonStr = (update_reason || 'For bug update').trim();
      const signOffStr = (sign_off || 'Head IT').trim();
      const customMsgVal = custom_message && String(custom_message).trim() ? String(custom_message).trim() : null;
      const groupIds = Array.isArray(target_groups) ? target_groups : [];
      const leadMinutes = Math.max(0, Number(reminder_minutes_before ?? 15) || 0);
      const reminderUtcSql = leadMinutes > 0 ? toMysqlUtcDatetime(reminder_at_utc) : null;
      const statusVal = status || 'Scheduled';

      await db.query(
        `INSERT INTO it_system_updates (
          id, user_id, application_name, update_date, date_label, update_time,
          downtime_duration, update_reason, sign_off, custom_message,
          target_groups_json, reminder_minutes_before, reminder_at_utc, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          appName,
          cleanDate,
          datePhrase,
          timeStr,
          durationStr,
          reasonStr,
          signOffStr,
          customMsgVal,
          JSON.stringify(groupIds),
          leadMinutes,
          reminderUtcSql,
          statusVal
        ]
      );

      let alertSent = false;
      let alertError: string | null = null;
      let alertDetails: any = null;

      if (send_alert_now) {
        const noticeText = buildSystemUpdateTelegramMessage(
          {
            application_name: appName,
            update_date: cleanDate,
            date_label: datePhrase,
            update_time: timeStr,
            downtime_duration: durationStr,
            update_reason: reasonStr,
            sign_off: signOffStr,
            custom_message: customMsgVal,
            reminder_minutes_before: leadMinutes
          },
          'notice'
        );
        const dispatchRes = await dispatchRawMessageToItTelegramGroups(db, userId, noticeText, groupIds);
        if (dispatchRes.success) {
          alertSent = true;
          alertDetails = dispatchRes;
          await db.query(
            `UPDATE it_system_updates
             SET initial_alert_sent = 1,
                 initial_alert_sent_at = NOW(),
                 alert_delivery_report = ?,
                 last_alert_error = NULL
             WHERE id = ?`,
            [JSON.stringify({ mode: 'initial_notice', ...dispatchRes }), id]
          );
        } else {
          alertError = dispatchRes.error || 'Failed to dispatch Telegram announcement';
          await db.query('UPDATE it_system_updates SET last_alert_error = ? WHERE id = ?', [alertError, id]);
        }
      }

      const [rows]: any = await db.query('SELECT * FROM it_system_updates WHERE id = ?', [id]);
      const mapped = mapRowToSystemUpdate(rows[0]);
      res.json({
        ...mapped,
        alert_sent: alertSent,
        alert_error: alertError,
        alert_details: alertDetails
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 4. UPDATE SYSTEM UPDATE NOTICE ---
  app.put('/api/system-updates/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      await initSystemUpdateTables(db);
      const { id } = req.params;

      const [existingRows]: any = await db.query('SELECT * FROM it_system_updates WHERE id = ?', [id]);
      if (!existingRows || existingRows.length === 0) {
        return res.status(404).json({ error: 'System update notice not found' });
      }
      const existing = existingRows[0];

      const {
        application_name,
        update_date,
        date_label,
        update_time,
        downtime_duration,
        update_reason,
        sign_off,
        custom_message,
        target_groups,
        reminder_minutes_before,
        reminder_at_utc,
        status,
        reset_reminder
      } = req.body || {};

      const cleanDate = update_date ? formatSqlDate(update_date) : formatSqlDate(existing.update_date);
      const leadMinutes =
        reminder_minutes_before !== undefined
          ? Math.max(0, Number(reminder_minutes_before) || 0)
          : Number(existing.reminder_minutes_before ?? 15);

      const existingReminderSql = toMysqlUtcDatetime(existing.reminder_at_utc);
      const newReminderUtcSql =
        reminder_at_utc !== undefined
          ? (leadMinutes > 0 ? toMysqlUtcDatetime(reminder_at_utc) : null)
          : existingReminderSql;

      const scheduleChanged =
        Boolean(reset_reminder) ||
        cleanDate !== formatSqlDate(existing.update_date) ||
        (update_time !== undefined && update_time !== existing.update_time) ||
        (reminder_minutes_before !== undefined && Number(reminder_minutes_before) !== Number(existing.reminder_minutes_before)) ||
        (reminder_at_utc !== undefined && newReminderUtcSql !== existingReminderSql);

      const customMsgVal =
        custom_message === undefined
          ? existing.custom_message
          : custom_message && String(custom_message).trim()
            ? String(custom_message).trim()
            : null;

      await db.query(
        `UPDATE it_system_updates SET
          application_name = ?,
          update_date = ?,
          date_label = ?,
          update_time = ?,
          downtime_duration = ?,
          update_reason = ?,
          sign_off = ?,
          custom_message = ?,
          target_groups_json = ?,
          reminder_minutes_before = ?,
          reminder_at_utc = ?,
          reminder_sent = ?,
          status = ?
         WHERE id = ?`,
        [
          (application_name ?? existing.application_name).trim(),
          cleanDate,
          (date_label ?? existing.date_label ?? 'today').trim(),
          (update_time ?? existing.update_time).trim(),
          (downtime_duration ?? existing.downtime_duration).trim(),
          (update_reason ?? existing.update_reason).trim(),
          (sign_off ?? existing.sign_off).trim(),
          customMsgVal,
          target_groups !== undefined
            ? JSON.stringify(Array.isArray(target_groups) ? target_groups : [])
            : existing.target_groups_json,
          leadMinutes,
          newReminderUtcSql,
          scheduleChanged ? 0 : existing.reminder_sent,
          status ?? existing.status,
          id
        ]
      );

      const [rows]: any = await db.query('SELECT * FROM it_system_updates WHERE id = ?', [id]);
      res.json(mapRowToSystemUpdate(rows[0]));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 5. DELETE SYSTEM UPDATE NOTICE ---
  app.delete('/api/system-updates/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      await initSystemUpdateTables(db);
      await db.query('DELETE FROM it_system_updates WHERE id = ?', [req.params.id]);
      res.json({ success: true, message: 'System update notice deleted' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 6. MANUAL TELEGRAM DISPATCH (INITIAL NOTICE OR PRE-DOWNTIME REMINDER) ---
  app.post('/api/system-updates/:id/send-alert', authenticateToken, async (req: any, res: Response) => {
    try {
      const db = getDb();
      await initSystemUpdateTables(db);
      const { id } = req.params;
      const { alert_type = 'notice', target_group_ids, message_override } = req.body || {};
      const mode: 'notice' | 'reminder' = alert_type === 'reminder' ? 'reminder' : 'notice';

      const [rows]: any = await db.query('SELECT * FROM it_system_updates WHERE id = ?', [id]);
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'System update notice not found' });
      }
      const record = mapRowToSystemUpdate(rows[0]);

      const groupIds =
        Array.isArray(target_group_ids) && target_group_ids.length > 0
          ? target_group_ids
          : record.target_groups;

      const textToSend =
        message_override && String(message_override).trim()
          ? String(message_override).trim()
          : buildSystemUpdateTelegramMessage(record, mode);

      const dispatchRes = await dispatchRawMessageToItTelegramGroups(
        db,
        req.user?.id || record.user_id,
        textToSend,
        groupIds
      );

      if (!dispatchRes.success) {
        await db.query('UPDATE it_system_updates SET last_alert_error = ? WHERE id = ?', [
          dispatchRes.error || 'Telegram dispatch failed',
          id
        ]);
        return res.status(400).json({ error: dispatchRes.error || 'Failed to dispatch Telegram message' });
      }

      if (mode === 'reminder') {
        await db.query(
          `UPDATE it_system_updates
           SET reminder_sent = 1,
               reminder_sent_at = NOW(),
               alert_delivery_report = ?,
               last_alert_error = NULL
           WHERE id = ?`,
          [JSON.stringify({ mode: 'manual_reminder', ...dispatchRes }), id]
        );
      } else {
        await db.query(
          `UPDATE it_system_updates
           SET initial_alert_sent = 1,
               initial_alert_sent_at = NOW(),
               target_groups_json = ?,
               alert_delivery_report = ?,
               last_alert_error = NULL
           WHERE id = ?`,
          [JSON.stringify(groupIds), JSON.stringify({ mode: 'notice', ...dispatchRes }), id]
        );
      }

      const [updatedRows]: any = await db.query('SELECT * FROM it_system_updates WHERE id = ?', [id]);
      const deliveredNames = dispatchRes.results.filter(r => r.success).map(r => r.name).join(', ');

      res.json({
        success: true,
        mode,
        message:
          mode === 'reminder'
            ? `Reminder sent to ${dispatchRes.totalSent} Telegram group(s): ${deliveredNames}`
            : `System update notice sent to ${dispatchRes.totalSent} Telegram group(s): ${deliveredNames}`,
        deliveredGroups: dispatchRes.results.filter(r => r.success),
        failedGroups: dispatchRes.results.filter(r => !r.success),
        totalSent: dispatchRes.totalSent,
        sentAt: new Date().toISOString(),
        record: updatedRows[0] ? mapRowToSystemUpdate(updatedRows[0]) : record
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
