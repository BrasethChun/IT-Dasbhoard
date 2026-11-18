import { Express, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import axios from 'axios';
import crypto from 'crypto';
import cron from 'node-cron';

export interface PersonalEventRecord {
  id: string;
  user_id: string;
  title: string;
  event_type: 'Meeting' | 'Vendor Call' | 'Workshop' | 'Training' | 'Event';
  event_date: string;
  event_end_date?: string;
  start_time: string;
  end_time: string;
  location: string;
  join_url: string;
  host_name: string;
  notes: string;
  reminder_minutes_before: number;
  reminder_at_utc: string | null;
  reminder_sent: boolean;
  reminder_sent_at: string | null;
  last_alert_error: string | null;
  status: 'Upcoming' | 'Joined' | 'Completed' | 'Cancelled';
  linked_note_id?: string | null;
  linked_note_title?: string | null;
  linked_note_excerpt?: string | null;
  linked_note_updated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_PHYSICAL_ROOMS = [
  'KHEMA TK Meeting Room',
  'KHEMA BKK Meeting Room',
  'SAKAL Meeting Room'
];

let tableInitialized = false;
let userColsInitialized = false;
let cronStarted = false;
let isSweepRunning = false;

export function sanitizeJoinUrl(raw?: string | null): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return '';
}

export function formatLeadLabel(minutes: number): string {
  if (!minutes || minutes <= 0) return 'At start time';
  if (minutes === 1440) return '1 day before';
  if (minutes >= 60 && minutes % 60 === 0) {
    const hrs = minutes / 60;
    return `${hrs} hour${hrs > 1 ? 's' : ''} before`;
  }
  return `${minutes} min before`;
}

export function detectMeetingPlatform(url?: string | null): string {
  const lower = (url || '').toLowerCase();
  if (!lower) return '';
  if (lower.includes('zoom.us')) return 'Zoom';
  if (lower.includes('meet.google.com')) return 'Google Meet';
  if (lower.includes('teams.microsoft.com') || lower.includes('teams.live.com')) return 'Microsoft Teams';
  if (lower.includes('webex.com')) return 'Webex';
  return 'Online Meeting';
}

export function buildPersonalTelegramAlertMessage(data: {
  title: string;
  event_type?: string;
  event_date: string;
  event_end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  join_url?: string;
  host_name?: string;
  notes?: string;
  reminder_minutes_before?: number;
}): string {
  const eventType = (data.event_type || 'Meeting').trim();
  const timeWindow = data.end_time
    ? `${data.start_time || '09:00'} – ${data.end_time}`
    : (data.start_time || '09:00');
  const startDate = String(data.event_date || '').slice(0, 10);
  const endDate = String(data.event_end_date || '').slice(0, 10);
  const dateDisplay = endDate && endDate !== startDate ? `${startDate} → ${endDate}` : startDate;
  const lead = Number(data.reminder_minutes_before || 0);
  const leadNote = lead > 0 ? `Reminder (${formatLeadLabel(lead)})` : 'Schedule Reminder';

  const lines: string[] = [
    `🔔 ${leadNote}: ${data.title}`,
    ``,
    `Type: ${eventType}`,
    `Date: ${dateDisplay}`,
    `Time: ${timeWindow}`
  ];

  if (data.host_name?.trim()) {
    lines.push(`Host: ${data.host_name.trim()}`);
  }
  if (data.location?.trim()) {
    lines.push(`Location: ${data.location.trim()}`);
  }
  if (data.join_url?.trim()) {
    const platform = detectMeetingPlatform(data.join_url);
    lines.push(`Join (${platform}): ${data.join_url.trim()}`);
  }
  if (data.notes?.trim()) {
    lines.push(``);
    lines.push(`Notes:`);
    lines.push(data.notes.trim());
  }

  return lines.join('\n');
}

function toMysqlUtcDatetime(isoOrSql?: string | null): string | null {
  if (!isoOrSql || !String(isoOrSql).trim()) return null;
  const parsed = new Date(isoOrSql);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 19).replace('T', ' ');
}

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

export function parsePhysicalRooms(raw?: string | null): string[] {
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.map(v => String(v).trim()).filter(Boolean);
        if (cleaned.length > 0) return Array.from(new Set(cleaned));
      }
    } catch {}
  }
  return [...DEFAULT_PHYSICAL_ROOMS];
}

export async function ensurePersonalUserColumns(db: mysql.Pool): Promise<void> {
  if (userColsInitialized) return;
  const alterQueries = [
    'ALTER TABLE users ADD COLUMN telegram_chat_id VARCHAR(255)',
    'ALTER TABLE users ADD COLUMN telegram_bot_token VARCHAR(255)',
    'ALTER TABLE users ADD COLUMN telegram_enabled BOOLEAN DEFAULT TRUE',
    'ALTER TABLE users ADD COLUMN personal_telegram_chat_id VARCHAR(255)',
    'ALTER TABLE users ADD COLUMN personal_telegram_bot_token VARCHAR(255)',
    'ALTER TABLE users ADD COLUMN personal_telegram_enabled BOOLEAN DEFAULT TRUE',
    'ALTER TABLE users ADD COLUMN personal_alert_after_it_meeting BOOLEAN DEFAULT TRUE',
    'ALTER TABLE users ADD COLUMN physical_rooms_json TEXT',
    'ALTER TABLE users ADD COLUMN default_physical_room VARCHAR(255)'
  ];
  for (const sql of alterQueries) {
    await db.query(sql).catch(() => {});
  }
  userColsInitialized = true;
}

export async function initPersonalEventTables(db: mysql.Pool): Promise<void> {
  await ensurePersonalUserColumns(db);
  if (tableInitialized) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS it_personal_events (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      event_type VARCHAR(50) DEFAULT 'Meeting',
      event_date DATE NOT NULL,
      event_end_date DATE NULL,
      start_time VARCHAR(20) NOT NULL DEFAULT '09:00',
      end_time VARCHAR(20) DEFAULT '10:00',
      location VARCHAR(255) DEFAULT '',
      join_url TEXT,
      host_name VARCHAR(150) DEFAULT '',
      notes TEXT,
      reminder_minutes_before INT DEFAULT 15,
      reminder_at_utc DATETIME NULL,
      reminder_sent BOOLEAN DEFAULT FALSE,
      reminder_sent_at DATETIME NULL,
      last_alert_error TEXT,
      status VARCHAR(30) DEFAULT 'Upcoming',
      linked_note_id VARCHAR(36) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_pe_user_date (user_id, event_date),
      INDEX idx_pe_reminder_due (reminder_sent, reminder_at_utc)
    )
  `).catch((e: any) => console.warn('[Personal Scheduler] Table init warning:', e.message));
  await db.query('ALTER TABLE it_personal_events ADD COLUMN linked_note_id VARCHAR(36) NULL').catch(() => {});
  await db.query('ALTER TABLE it_personal_events ADD COLUMN event_end_date DATE NULL').catch(() => {});
  tableInitialized = true;
}

export interface ResolvedPersonalTelegramConfig {
  personalChatId: string;
  personalBotToken: string;
  fallbackChatId: string;
  fallbackBotToken: string;
  effectiveChatId: string;
  effectiveBotToken: string;
  personalEnabled: boolean;
  alertAfterItMeeting: boolean;
  physicalRooms: string[];
  defaultPhysicalRoom: string;
}

export async function resolveUserPersonalTelegramConfig(
  db: mysql.Pool,
  userId: string
): Promise<ResolvedPersonalTelegramConfig> {
  await ensurePersonalUserColumns(db);

  const [userRows]: any = await db.query(
    `SELECT telegram_chat_id, telegram_bot_token, telegram_enabled,
            personal_telegram_chat_id, personal_telegram_bot_token,
            personal_telegram_enabled, personal_alert_after_it_meeting,
            physical_rooms_json, default_physical_room
     FROM users WHERE id = ?`,
    [userId]
  ).catch(() => [[]]);

  const [meetingCfgRows]: any = await db.query(
    'SELECT bot_token FROM it_meeting_telegram_config ORDER BY id DESC LIMIT 1'
  ).catch(() => [[]]);

  const u = userRows?.[0] || {};
  const meetingBotToken = String(meetingCfgRows?.[0]?.bot_token || '').trim();
  const envBotToken = String(process.env.TELEGRAM_BOT_TOKEN || '').trim();

  const personalChatId = String(u.personal_telegram_chat_id || '').trim();
  const personalBotToken = String(u.personal_telegram_bot_token || '').trim();
  const fallbackChatId = String(u.telegram_chat_id || '').trim();
  const fallbackBotToken = String(u.telegram_bot_token || meetingBotToken || envBotToken || '').trim();

  const effectiveChatId = personalChatId || fallbackChatId;
  const effectiveBotToken = personalBotToken || fallbackBotToken;

  const personalEnabled = personalChatId
    ? u.personal_telegram_enabled !== 0
    : (u.personal_telegram_enabled !== 0 && u.telegram_enabled !== 0);

  const alertAfterItMeeting = u.personal_alert_after_it_meeting !== 0;
  const physicalRooms = parsePhysicalRooms(u.physical_rooms_json);
  const defaultPhysicalRoom = String(u.default_physical_room || physicalRooms[0] || DEFAULT_PHYSICAL_ROOMS[0]).trim();

  return {
    personalChatId,
    personalBotToken,
    fallbackChatId,
    fallbackBotToken,
    effectiveChatId,
    effectiveBotToken,
    personalEnabled,
    alertAfterItMeeting,
    physicalRooms,
    defaultPhysicalRoom
  };
}

export async function sendDedicatedPersonalAlertAfterItMeeting(
  db: mysql.Pool,
  userId: string | null | undefined,
  meetingData: {
    title: string;
    meeting_date: string;
    start_time?: string;
    end_time?: string;
    venue?: string;
    room_booking_note?: string | null;
  },
  broadcastResult?: {
    totalSent: number;
    results?: Array<{ name: string; chat_id: string; success: boolean }>;
  }
): Promise<{ sent: boolean; skipped?: boolean; chatId?: string; error?: string }> {
  if (!userId) return { sent: false, skipped: true };

  try {
    const cfg = await resolveUserPersonalTelegramConfig(db, userId);
    if (!cfg.personalEnabled || !cfg.alertAfterItMeeting || !cfg.effectiveChatId || !cfg.effectiveBotToken) {
      return { sent: false, skipped: true };
    }

    // Avoid duplicate send if the exact same chat ID was already included in the group broadcast
    const alreadySentToSameChat = Boolean(
      broadcastResult?.results?.some(
        r => r.success && String(r.chat_id).trim() === cfg.effectiveChatId
      )
    );
    if (alreadySentToSameChat) {
      return { sent: false, skipped: true };
    }

    const notifiedNames = (broadcastResult?.results || [])
      .filter(r => r.success)
      .map(r => r.name)
      .join(', ');

    const lines = [
      `📌 Personal Alert — IT Meeting Alert Broadcasted`,
      ``,
      `Meeting: ${meetingData.title || 'IT Monthly Meeting'}`,
      `Date: ${meetingData.meeting_date}`,
      `Time: ${meetingData.start_time || '2pm'}${meetingData.end_time ? ` – ${meetingData.end_time}` : ''}`,
      `Physical Location / Room: ${meetingData.venue || 'Sakal Polyclinic'}`
    ];

    if (meetingData.room_booking_note?.trim()) {
      lines.push(`Room Note: ${meetingData.room_booking_note.trim()}`);
    }
    if (notifiedNames) {
      lines.push(`Broadcasted To (${broadcastResult?.totalSent || 0}): ${notifiedNames}`);
    }

    await axios.post(
      `https://api.telegram.org/bot${cfg.effectiveBotToken}/sendMessage`,
      {
        chat_id: cfg.effectiveChatId,
        text: lines.join('\n')
      },
      { timeout: 10000 }
    );

    return { sent: true, chatId: cfg.effectiveChatId };
  } catch (err: any) {
    return {
      sent: false,
      error: err.response?.data?.description || err.message || 'Personal alert dispatch failed'
    };
  }
}

async function sendPersonalTelegramMessage(
  botToken: string,
  chatId: string,
  eventData: any
): Promise<{ success: boolean; error?: string }> {
  const token = (botToken || '').trim();
  const chat = (chatId || '').trim();
  if (!token || !chat) {
    return {
      success: false,
      error: 'Personal Telegram Bot Token and Chat ID are not configured. Open Telegram Settings to add your personal bot.'
    };
  }

  try {
    const text = buildPersonalTelegramAlertMessage(eventData);
    await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id: chat,
        text,
        disable_web_page_preview: false
      },
      { timeout: 10000 }
    );
    return { success: true };
  } catch (err: any) {
    const desc = err.response?.data?.description || err.message || 'Telegram API dispatch failed';
    return { success: false, error: desc };
  }
}

export async function runDuePersonalRemindersSweep(
  getDb: () => mysql.Pool
): Promise<{ skipped?: boolean; checked: number; sent: number; failed: number; error?: string }> {
  if (isSweepRunning) return { skipped: true, checked: 0, sent: 0, failed: 0 };
  isSweepRunning = true;
  let checked = 0;
  let sent = 0;
  let failed = 0;
  try {
    const db = getDb();
    await initPersonalEventTables(db);

    const [dueRows]: any = await db.query(`
      SELECT e.*
      FROM it_personal_events e
      JOIN users u ON u.id = e.user_id
      WHERE e.reminder_sent = 0
        AND e.reminder_at_utc IS NOT NULL
        AND e.reminder_at_utc <= UTC_TIMESTAMP()
        AND e.reminder_at_utc >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR)
        AND e.status IN ('Upcoming', 'Joined')
        AND COALESCE(u.personal_telegram_enabled, 1) != 0
      LIMIT 25
    `);

    checked = Array.isArray(dueRows) ? dueRows.length : 0;

    for (const row of dueRows) {
      const cfg = await resolveUserPersonalTelegramConfig(db, row.user_id);
      if (!cfg.personalEnabled || !cfg.effectiveChatId || !cfg.effectiveBotToken) {
        continue;
      }

      const cleanDate = formatSqlDate(row.event_date);
      const cleanEndDate = row.event_end_date ? formatSqlDate(row.event_end_date) : cleanDate;
      const result = await sendPersonalTelegramMessage(
        cfg.effectiveBotToken,
        cfg.effectiveChatId,
        {
          title: row.title,
          event_type: row.event_type,
          event_date: cleanDate,
          event_end_date: cleanEndDate,
          start_time: row.start_time,
          end_time: row.end_time,
          location: row.location,
          join_url: row.join_url,
          host_name: row.host_name,
          notes: row.notes,
          reminder_minutes_before: row.reminder_minutes_before
        }
      );

      if (result.success) {
        sent++;
        await db.query(
          'UPDATE it_personal_events SET reminder_sent = 1, reminder_sent_at = NOW(), last_alert_error = NULL WHERE id = ?',
          [row.id]
        );
      } else {
        failed++;
        await db.query(
          'UPDATE it_personal_events SET last_alert_error = ? WHERE id = ?',
          [result.error || 'Dispatch error', row.id]
        );
      }
    }
    return { checked, sent, failed };
  } catch (err: any) {
    console.warn('[Personal Scheduler] Cron sweep warning:', err.message);
    return { checked, sent, failed, error: err.message };
  } finally {
    isSweepRunning = false;
  }
}

export function setupPersonalSchedulerRoutes(
  app: Express,
  authenticateToken: any,
  getDb: () => mysql.Pool
) {
  if (!cronStarted) {
    cronStarted = true;
    cron.schedule('* * * * *', () => {
      runDuePersonalRemindersSweep(getDb).catch(() => {});
    });
  }

  // --- 0A. GET PERSONAL TELEGRAM ID & PHYSICAL ROOM SETTINGS ---
  app.get('/api/personal-events/settings', authenticateToken, async (req: any, res: Response) => {
    try {
      const db = getDb();
      const cfg = await resolveUserPersonalTelegramConfig(db, req.user.id);
      res.json({
        personal_chat_id: cfg.personalChatId,
        personal_bot_token: cfg.personalBotToken,
        fallback_chat_id: cfg.fallbackChatId,
        has_fallback_bot_token: Boolean(cfg.fallbackBotToken),
        personal_enabled: cfg.personalEnabled,
        alert_after_it_meeting: cfg.alertAfterItMeeting,
        physical_rooms: cfg.physicalRooms,
        default_physical_room: cfg.defaultPhysicalRoom
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 0B. SAVE PERSONAL TELEGRAM ID & PHYSICAL ROOM SETTINGS ---
  app.post('/api/personal-events/settings', authenticateToken, async (req: any, res: Response) => {
    try {
      const db = getDb();
      await ensurePersonalUserColumns(db);

      const {
        personal_chat_id,
        personal_bot_token,
        personal_enabled,
        alert_after_it_meeting,
        physical_rooms,
        default_physical_room
      } = req.body || {};

      const cleanRooms = Array.isArray(physical_rooms)
        ? Array.from(new Set(physical_rooms.map((r: any) => String(r).trim()).filter(Boolean)))
        : [...DEFAULT_PHYSICAL_ROOMS];
      const finalRooms = cleanRooms.length > 0 ? cleanRooms : [...DEFAULT_PHYSICAL_ROOMS];
      const finalDefaultRoom = String(default_physical_room || finalRooms[0] || DEFAULT_PHYSICAL_ROOMS[0]).trim();

      await db.query(
        `UPDATE users SET
          personal_telegram_chat_id = ?,
          personal_telegram_bot_token = ?,
          personal_telegram_enabled = ?,
          personal_alert_after_it_meeting = ?,
          physical_rooms_json = ?,
          default_physical_room = ?
         WHERE id = ?`,
        [
          String(personal_chat_id || '').trim(),
          String(personal_bot_token || '').trim(),
          personal_enabled !== false ? 1 : 0,
          alert_after_it_meeting !== false ? 1 : 0,
          JSON.stringify(finalRooms),
          finalDefaultRoom,
          req.user.id
        ]
      );

      res.json({
        success: true,
        physical_rooms: finalRooms,
        default_physical_room: finalDefaultRoom
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 0C. TEST DEDICATED PERSONAL TELEGRAM ID ---
  app.post('/api/personal-events/test-personal-alert', authenticateToken, async (req: any, res: Response) => {
    try {
      const db = getDb();
      const cfg = await resolveUserPersonalTelegramConfig(db, req.user.id);
      const targetChatId = String(req.body?.personal_chat_id ?? cfg.effectiveChatId).trim();
      const targetBotToken = String(req.body?.personal_bot_token || cfg.effectiveBotToken).trim();

      if (!targetChatId) {
        return res.status(400).json({ error: 'Please enter a Personal Telegram Chat ID to test.' });
      }
      if (!targetBotToken) {
        return res.status(400).json({ error: 'A Telegram Bot Token is required (enter a Personal Bot Token or configure one in Notifications / IT Meeting Alert).' });
      }

      await axios.post(
        `https://api.telegram.org/bot${targetBotToken}/sendMessage`,
        {
          chat_id: targetChatId,
          text: `🔔 [TEST] Personal Telegram ID Alert Connected!\n\nDefault Physical Room: ${cfg.defaultPhysicalRoom}\nIT Meeting Post-Broadcast Personal Alerts: ${cfg.alertAfterItMeeting ? 'Enabled' : 'Disabled'}`
        },
        { timeout: 10000 }
      );

      res.json({ success: true, message: `Test alert delivered to Personal Telegram ID (${targetChatId})!` });
    } catch (e: any) {
      const desc = e.response?.data?.description || e.message;
      res.status(400).json({ error: `Failed to send personal test alert: ${desc}` });
    }
  });

  // --- 1. GET PERSONAL SCHEDULED EVENTS FOR CURRENT USER ---
  app.get('/api/personal-events', authenticateToken, async (req: any, res: Response) => {
    try {
      const db = getDb();
      await initPersonalEventTables(db);

      const userId = req.user.id;
      const [rows]: any = await db.query(
        'SELECT * FROM it_personal_events WHERE user_id = ? ORDER BY event_date ASC, start_time ASC',
        [userId]
      );

      const cfg = await resolveUserPersonalTelegramConfig(db, userId);
      const telegramReady = Boolean(
        cfg.personalEnabled &&
        cfg.effectiveBotToken &&
        cfg.effectiveChatId
      );

      // Lookup linked notes for user's personal events
      let noteRows: any[] = [];
      try {
        const [nRows]: any = await db.query(
          'SELECT id, title, content, updated_at, linked_source_id FROM notes WHERE linked_source_type = ? OR id IN (SELECT linked_note_id FROM it_personal_events WHERE user_id = ? AND linked_note_id IS NOT NULL)',
          ['personal_event', userId]
        );
        noteRows = Array.isArray(nRows) ? nRows : [];
      } catch {
        const [fallbackNotes]: any = await db.query(
          'SELECT id, title, content, updated_at FROM notes WHERE id IN (SELECT linked_note_id FROM it_personal_events WHERE user_id = ? AND linked_note_id IS NOT NULL)',
          [userId]
        ).catch(() => [[]]);
        noteRows = Array.isArray(fallbackNotes) ? fallbackNotes : [];
      }

      const noteById = new Map<string, any>();
      const noteByEventId = new Map<string, any>();
      for (const n of noteRows) {
        noteById.set(n.id, n);
        if (n.linked_source_id) {
          noteByEventId.set(n.linked_source_id, n);
        }
      }

      const events = rows.map((r: any) => {
        const matchedNote = (r.linked_note_id ? noteById.get(r.linked_note_id) : null) || noteByEventId.get(r.id) || null;
        const plainExcerpt = matchedNote?.content
          ? String(matchedNote.content).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140)
          : '';
        const normalizedStart = formatSqlDate(r.event_date);
        const normalizedEnd = r.event_end_date ? formatSqlDate(r.event_end_date) : normalizedStart;
        return {
          ...r,
          event_date: normalizedStart,
          event_end_date: normalizedEnd,
          reminder_minutes_before: Number(r.reminder_minutes_before ?? 15),
          reminder_sent: Boolean(r.reminder_sent),
          linked_note_id: matchedNote?.id || r.linked_note_id || null,
          linked_note_title: matchedNote?.title || null,
          linked_note_excerpt: plainExcerpt || null,
          linked_note_updated_at: matchedNote?.updated_at || null
        };
      });

      res.json({
        events,
        telegram_configured: telegramReady,
        telegram_enabled: cfg.personalEnabled,
        personal_chat_id: cfg.personalChatId,
        physical_rooms: cfg.physicalRooms,
        default_physical_room: cfg.defaultPhysicalRoom
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 2. PREVIEW PERSONAL TELEGRAM ALERT MESSAGE ---
  app.post('/api/personal-events/preview-alert', authenticateToken, async (req: Request, res: Response) => {
    try {
      const startDate = req.body.event_start_date || req.body.event_date || new Date().toISOString().slice(0, 10);
      const endDate = req.body.event_end_date || startDate;
      const message = buildPersonalTelegramAlertMessage({
        title: req.body.title || 'Scheduled Event',
        event_type: req.body.event_type || 'Meeting',
        event_date: startDate,
        event_end_date: endDate,
        start_time: req.body.start_time || '09:00',
        end_time: req.body.end_time || '10:00',
        location: req.body.location || '',
        join_url: sanitizeJoinUrl(req.body.join_url),
        host_name: req.body.host_name || '',
        notes: req.body.notes || '',
        reminder_minutes_before: Number(req.body.reminder_minutes_before ?? 15)
      });
      res.json({ message });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 3. CREATE PERSONAL SCHEDULED EVENT ---
  app.post('/api/personal-events', authenticateToken, async (req: any, res: Response) => {
    try {
      const db = getDb();
      await initPersonalEventTables(db);

      const userId = req.user.id;
      const {
        title,
        event_type,
        event_date,
        event_start_date,
        event_end_date,
        start_time,
        end_time,
        location,
        join_url,
        host_name,
        notes,
        reminder_minutes_before,
        reminder_at_utc,
        send_alert_now
      } = req.body;

      const rawStartDate = event_start_date || event_date;
      if (!title?.trim() || !rawStartDate) {
        return res.status(400).json({ error: 'Event title and start date are required' });
      }

      const cleanUrl = sanitizeJoinUrl(join_url);
      if (join_url && String(join_url).trim() && !cleanUrl) {
        return res.status(400).json({ error: 'Please enter a valid http/https meeting join URL' });
      }

      const id = crypto.randomUUID();
      const cleanDate = String(rawStartDate).slice(0, 10);
      const cleanEndDate = event_end_date && String(event_end_date).trim()
        ? String(event_end_date).slice(0, 10)
        : cleanDate;
      if (cleanEndDate < cleanDate) {
        return res.status(400).json({ error: 'Event end date cannot be before event start date' });
      }

      const startTimeStr = (start_time || '09:00').trim();
      const endTimeStr = (end_time || '').trim();
      const leadMinutes = Number.isFinite(Number(reminder_minutes_before))
        ? Math.max(-1, parseInt(String(reminder_minutes_before), 10))
        : 15;
      const reminderUtc = leadMinutes >= 0 ? toMysqlUtcDatetime(reminder_at_utc) : null;

      await db.query(
        `INSERT INTO it_personal_events
          (id, user_id, title, event_type, event_date, event_end_date, start_time, end_time, location, join_url, host_name, notes, reminder_minutes_before, reminder_at_utc, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Upcoming')`,
        [
          id,
          userId,
          title.trim(),
          event_type || 'Meeting',
          cleanDate,
          cleanEndDate,
          startTimeStr,
          endTimeStr,
          (location || '').trim(),
          cleanUrl,
          (host_name || '').trim(),
          (notes || '').trim(),
          leadMinutes,
          reminderUtc
        ]
      );

      let alertSent = false;
      let alertError: string | null = null;

      if (send_alert_now) {
        const cfg = await resolveUserPersonalTelegramConfig(db, userId);
        if (!cfg.personalEnabled) {
          alertError = 'Personal Telegram notifications are disabled in your Personal Alert settings.';
        } else {
          const result = await sendPersonalTelegramMessage(
            cfg.effectiveBotToken,
            cfg.effectiveChatId,
            {
              title: title.trim(),
              event_type: event_type || 'Meeting',
              event_date: cleanDate,
              event_end_date: cleanEndDate,
              start_time: startTimeStr,
              end_time: endTimeStr,
              location: (location || '').trim(),
              join_url: cleanUrl,
              host_name: (host_name || '').trim(),
              notes: (notes || '').trim(),
              reminder_minutes_before: leadMinutes
            }
          );
          if (result.success) {
            alertSent = true;
            await db.query(
              'UPDATE it_personal_events SET reminder_sent = 1, reminder_sent_at = NOW(), last_alert_error = NULL WHERE id = ?',
              [id]
            );
          } else {
            alertError = result.error || 'Failed to send personal Telegram alert';
            await db.query('UPDATE it_personal_events SET last_alert_error = ? WHERE id = ?', [alertError, id]);
          }
        }
      }

      const [rows]: any = await db.query('SELECT * FROM it_personal_events WHERE id = ?', [id]);
      const created = rows[0];
      const normalizedCreatedStart = formatSqlDate(created.event_date);
      const normalizedCreatedEnd = created.event_end_date ? formatSqlDate(created.event_end_date) : normalizedCreatedStart;
      res.json({
        ...created,
        event_date: normalizedCreatedStart,
        event_end_date: normalizedCreatedEnd,
        reminder_sent: Boolean(created.reminder_sent),
        alert_sent: alertSent,
        alert_error: alertError
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 4. UPDATE PERSONAL SCHEDULED EVENT ---
  app.put('/api/personal-events/:id', authenticateToken, async (req: any, res: Response) => {
    try {
      const db = getDb();
      await initPersonalEventTables(db);

      const userId = req.user.id;
      const { id } = req.params;

      const [existingRows]: any = await db.query(
        'SELECT * FROM it_personal_events WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      if (existingRows.length === 0) {
        return res.status(404).json({ error: 'Personal event not found' });
      }
      const existing = existingRows[0];

      const {
        title,
        event_type,
        event_date,
        event_start_date,
        event_end_date,
        start_time,
        end_time,
        location,
        join_url,
        host_name,
        notes,
        reminder_minutes_before,
        reminder_at_utc,
        status,
        linked_note_id
      } = req.body;

      let cleanUrl = existing.join_url || '';
      if (join_url !== undefined) {
        cleanUrl = sanitizeJoinUrl(join_url);
        if (join_url && String(join_url).trim() && !cleanUrl) {
          return res.status(400).json({ error: 'Please enter a valid http/https meeting join URL' });
        }
      }

      const existingStartDate = formatSqlDate(existing.event_date);
      const nextStartDateRaw = event_start_date || event_date;
      const resolvedStartDate = nextStartDateRaw ? String(nextStartDateRaw).slice(0, 10) : existingStartDate;
      const resolvedEndDate = event_end_date !== undefined
        ? (event_end_date && String(event_end_date).trim() ? String(event_end_date).slice(0, 10) : resolvedStartDate)
        : (existing.event_end_date ? formatSqlDate(existing.event_end_date) : resolvedStartDate);

      if (resolvedStartDate && resolvedEndDate && resolvedEndDate < resolvedStartDate) {
        return res.status(400).json({ error: 'Event end date cannot be before event start date' });
      }

      const leadMinutes = reminder_minutes_before !== undefined
        ? Math.max(-1, parseInt(String(reminder_minutes_before), 10))
        : Number(existing.reminder_minutes_before ?? 15);

      const nextReminderUtc = reminder_at_utc !== undefined
        ? (leadMinutes >= 0 ? toMysqlUtcDatetime(reminder_at_utc) : null)
        : existing.reminder_at_utc;

      // Reset reminder_sent if user explicitly updated trigger timestamp to a future time
      let resetSentFlag = false;
      if (nextReminderUtc) {
        const prevUtc = existing.reminder_at_utc ? new Date(existing.reminder_at_utc).getTime() : 0;
        const newUtc = new Date(String(nextReminderUtc).replace(' ', 'T') + 'Z').getTime();
        if (newUtc !== prevUtc && newUtc > Date.now()) {
          resetSentFlag = true;
        }
      }

      await db.query(
        `UPDATE it_personal_events SET
          title = COALESCE(?, title),
          event_type = COALESCE(?, event_type),
          event_date = COALESCE(?, event_date),
          event_end_date = ?,
          start_time = COALESCE(?, start_time),
          end_time = ?,
          location = ?,
          join_url = ?,
          host_name = ?,
          notes = ?,
          reminder_minutes_before = ?,
          reminder_at_utc = ?,
          status = COALESCE(?, status),
          linked_note_id = CASE WHEN ? = 1 THEN ? ELSE linked_note_id END,
          reminder_sent = CASE WHEN ? = 1 THEN 0 ELSE reminder_sent END,
          last_alert_error = CASE WHEN ? = 1 THEN NULL ELSE last_alert_error END
         WHERE id = ? AND user_id = ?`,
        [
          title !== undefined ? String(title).trim() : null,
          event_type ?? null,
          nextStartDateRaw ? resolvedStartDate : null,
          resolvedEndDate || null,
          start_time ?? null,
          end_time !== undefined ? String(end_time).trim() : (existing.end_time || ''),
          location !== undefined ? String(location).trim() : (existing.location || ''),
          cleanUrl,
          host_name !== undefined ? String(host_name).trim() : (existing.host_name || ''),
          notes !== undefined ? String(notes).trim() : (existing.notes || ''),
          leadMinutes,
          nextReminderUtc,
          status ?? null,
          linked_note_id !== undefined ? 1 : 0,
          linked_note_id || null,
          resetSentFlag ? 1 : 0,
          resetSentFlag ? 1 : 0,
          id,
          userId
        ]
      );

      const [updatedRows]: any = await db.query(
        'SELECT * FROM it_personal_events WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      const updated = updatedRows[0];
      const normalizedUpdatedStart = formatSqlDate(updated.event_date);
      const normalizedUpdatedEnd = updated.event_end_date ? formatSqlDate(updated.event_end_date) : normalizedUpdatedStart;
      res.json({
        ...updated,
        event_date: normalizedUpdatedStart,
        event_end_date: normalizedUpdatedEnd,
        reminder_sent: Boolean(updated.reminder_sent)
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 5. DELETE PERSONAL SCHEDULED EVENT ---
  app.delete('/api/personal-events/:id', authenticateToken, async (req: any, res: Response) => {
    try {
      const db = getDb();
      await initPersonalEventTables(db);
      const [result]: any = await db.query(
        'DELETE FROM it_personal_events WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
      );
      if (!result?.affectedRows) {
        return res.status(404).json({ error: 'Personal event not found' });
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 6. MANUAL TRIGGER: SEND ALERT TO PERSONAL TELEGRAM BOT NOW ---
  app.post('/api/personal-events/:id/send-alert', authenticateToken, async (req: any, res: Response) => {
    try {
      const db = getDb();
      await initPersonalEventTables(db);
      const userId = req.user.id;
      const { id } = req.params;

      const [rows]: any = await db.query(
        'SELECT * FROM it_personal_events WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Personal event not found' });
      }
      const ev = rows[0];

      const cfg = await resolveUserPersonalTelegramConfig(db, userId);
      if (!cfg.personalEnabled) {
        return res.status(400).json({ error: 'Personal Telegram notifications are disabled in Personal Alert settings.' });
      }

      const evStartDate = formatSqlDate(ev.event_date);
      const evEndDate = ev.event_end_date ? formatSqlDate(ev.event_end_date) : evStartDate;
      const result = await sendPersonalTelegramMessage(
        cfg.effectiveBotToken,
        cfg.effectiveChatId,
        {
          title: ev.title,
          event_type: ev.event_type,
          event_date: evStartDate,
          event_end_date: evEndDate,
          start_time: ev.start_time,
          end_time: ev.end_time,
          location: ev.location,
          join_url: ev.join_url,
          host_name: ev.host_name,
          notes: ev.notes,
          reminder_minutes_before: ev.reminder_minutes_before
        }
      );

      if (!result.success) {
        await db.query('UPDATE it_personal_events SET last_alert_error = ? WHERE id = ?', [result.error, id]);
        return res.status(400).json({ error: result.error });
      }

      await db.query(
        'UPDATE it_personal_events SET reminder_sent = 1, reminder_sent_at = NOW(), last_alert_error = NULL WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        sentAt: new Date().toISOString(),
        message: `Personal Telegram reminder sent for "${ev.title}".`
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
