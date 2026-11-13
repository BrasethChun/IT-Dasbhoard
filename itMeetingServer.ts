import { Express, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import axios from 'axios';
import crypto from 'crypto';

export interface ITMeetingTelegramGroup {
  id: string;
  name: string;
  chat_id: string;
  is_default: boolean;
}

export interface ITMeetingRecord {
  id: string;
  user_id: string | null;
  title: string;
  meeting_date: string;
  day_of_week_label: string | null;
  start_time: string;
  end_time: string;
  venue: string;
  room_booking_note: string | null;
  agenda: string;
  organizer_name: string;
  telegram_alert_sent: boolean;
  last_alert_sent_at: string | null;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  target_groups?: string[];
  alert_delivery_report?: any;
  created_at?: string;
  updated_at?: string;
}

export interface ITMeetingTelegramConfig {
  bot_token: string;
  group_chat_id: string;
  groups: ITMeetingTelegramGroup[];
  default_venue: string;
  default_room_note: string;
  default_organizer: string;
  default_start_time: string;
  default_end_time: string;
}

export const DEFAULT_GROUPS: ITMeetingTelegramGroup[] = [
  { id: 'grp-it-core', name: 'IT Core Operations', chat_id: '', is_default: true },
  { id: 'grp-sakal', name: 'Sakal Polyclinic IT', chat_id: '', is_default: true },
  { id: 'grp-kg', name: 'Khema Global (KG)', chat_id: '', is_default: false },
  { id: 'grp-k1k2', name: 'K1 & K2 Campus Team', chat_id: '', is_default: false }
];

const DEFAULT_CONFIG: ITMeetingTelegramConfig = {
  bot_token: '',
  group_chat_id: '',
  groups: DEFAULT_GROUPS,
  default_venue: 'Sakal Polyclinic',
  default_room_note: 'Bunnarith, please help to book the meeting room',
  default_organizer: 'Braseth',
  default_start_time: '2pm',
  default_end_time: '4PM'
};

const DEFAULT_AGENDA = `1- Monthly Reporting by Portfolios (including updates on any follow-ups from the last meeting)
2- Upcoming Planned Activities
3- AOB`;

/**
 * Format date nicely e.g. "Saturdays, 12 September 2026"
 */
function formatMeetingDateDisplay(dateStr: string): { dayLabel: string; formattedDate: string } {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      
      const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const dayLabel = dayNames[d.getDay()];
      const formattedDate = `${day} ${monthNames[month]} ${year}`;
      return { dayLabel, formattedDate };
    }
  } catch (e) {
    // fallback
  }
  return { dayLabel: 'Saturdays', formattedDate: dateStr };
}

/**
 * Build the exact message template requested by the user:
 * 
 * Dear All,
 *  
 * Please be reminded of our IT monthly meeting on this coming Saturdays, 12 September 2026 from 2pm to 4PM, at Sakal Polyclinic (Bunnarith, please help to book the meeting room).
 * 
 * Following are our provisional agenda:
 * 
 * 1- Monthly Reporting by Portfolios (including updates on any follow-ups from the last meeting)
 * 2- Upcoming Planned Activities
 * 3- AOB
 * 
 * Yours,
 * 
 * Braseth
 */
export function buildMeetingTelegramMessage(data: {
  title?: string;
  meeting_date: string;
  day_of_week_label?: string | null;
  start_time?: string;
  end_time?: string;
  venue?: string;
  room_booking_note?: string | null;
  agenda?: string;
  organizer_name?: string;
}): string {
  const { dayLabel, formattedDate } = formatMeetingDateDisplay(data.meeting_date);
  const dayPrefix = data.day_of_week_label?.trim() || `this coming ${dayLabel}`;
  const startTime = (data.start_time || '2pm').trim();
  const endTime = (data.end_time || '4PM').trim();
  const venue = (data.venue || 'Sakal Polyclinic').trim();
  const roomNote = data.room_booking_note?.trim();
  const organizer = (data.organizer_name || 'Braseth').trim();
  const agenda = (data.agenda || DEFAULT_AGENDA).trim();

  let locationText = `at ${venue}`;
  if (roomNote) {
    locationText += ` (${roomNote})`;
  }

  const message = `Dear All,
 
Please be reminded of our IT monthly meeting on ${dayPrefix}, ${formattedDate} from ${startTime} to ${endTime}, ${locationText}.

Following are our provisional agenda:

${agenda}

Yours,

${organizer}`;

  return message;
}

/**
 * Initialize database tables and seed sample meeting
 */
export async function initItMeetingTables(db: mysql.Pool): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS it_meetings (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      title VARCHAR(255) NOT NULL,
      meeting_date DATE NOT NULL,
      day_of_week_label VARCHAR(100),
      start_time VARCHAR(50) DEFAULT '2pm',
      end_time VARCHAR(50) DEFAULT '4PM',
      venue VARCHAR(255) DEFAULT 'Sakal Polyclinic',
      room_booking_note TEXT,
      agenda TEXT,
      organizer_name VARCHAR(100) DEFAULT 'Braseth',
      telegram_alert_sent BOOLEAN DEFAULT FALSE,
      last_alert_sent_at DATETIME,
      status VARCHAR(50) DEFAULT 'Scheduled',
      target_groups_json TEXT,
      alert_delivery_report TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `).catch(e => console.warn('it_meetings table creation warning:', e.message));

  await db.query(`
    CREATE TABLE IF NOT EXISTS it_meeting_telegram_config (
      id INT PRIMARY KEY AUTO_INCREMENT,
      bot_token VARCHAR(255),
      group_chat_id VARCHAR(255),
      groups_json TEXT,
      default_venue VARCHAR(255) DEFAULT 'Sakal Polyclinic',
      default_room_note VARCHAR(255) DEFAULT 'Bunnarith, please help to book the meeting room',
      default_organizer VARCHAR(100) DEFAULT 'Braseth',
      default_start_time VARCHAR(50) DEFAULT '2pm',
      default_end_time VARCHAR(50) DEFAULT '4PM',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `).catch(e => console.warn('it_meeting_telegram_config table creation warning:', e.message));

  // Ensure new columns exist on already created tables
  await db.query(`ALTER TABLE it_meeting_telegram_config ADD COLUMN groups_json TEXT`).catch(() => {});
  await db.query(`ALTER TABLE it_meetings ADD COLUMN target_groups_json TEXT`).catch(() => {});
  await db.query(`ALTER TABLE it_meetings ADD COLUMN alert_delivery_report TEXT`).catch(() => {});

  // Seed default meeting config row if empty
  const [configRows]: any = await db.query('SELECT COUNT(*) as cnt FROM it_meeting_telegram_config').catch(() => [[{ cnt: 0 }]]);
  if (configRows && configRows[0]?.cnt === 0) {
    await db.query(`
      INSERT INTO it_meeting_telegram_config 
      (bot_token, group_chat_id, groups_json, default_venue, default_room_note, default_organizer, default_start_time, default_end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['', '', JSON.stringify(DEFAULT_GROUPS), DEFAULT_CONFIG.default_venue, DEFAULT_CONFIG.default_room_note, DEFAULT_CONFIG.default_organizer, DEFAULT_CONFIG.default_start_time, DEFAULT_CONFIG.default_end_time])
    .catch(() => {});
  }

  // Seed default initial IT monthly meeting matching user's template
  const [meetingRows]: any = await db.query('SELECT COUNT(*) as cnt FROM it_meetings').catch(() => [[{ cnt: 0 }]]);
  if (meetingRows && meetingRows[0]?.cnt === 0) {
    const seedId = crypto.randomUUID();
    await db.query(`
      INSERT INTO it_meetings 
      (id, title, meeting_date, day_of_week_label, start_time, end_time, venue, room_booking_note, agenda, organizer_name, status, target_groups_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      seedId,
      'IT Monthly Meeting',
      '2026-09-12',
      'this coming Saturdays',
      '2pm',
      '4PM',
      'Sakal Polyclinic',
      'Bunnarith, please help to book the meeting room',
      DEFAULT_AGENDA,
      'Braseth',
      'Scheduled',
      JSON.stringify(['grp-it-core', 'grp-sakal'])
    ]).catch(e => console.warn('Error seeding initial it_meeting:', e.message));
  }
}

/**
 * Parse groups list from config row with backward compatibility
 */
function parseConfigGroups(row: any): ITMeetingTelegramGroup[] {
  if (row?.groups_json) {
    try {
      const parsed = JSON.parse(row.groups_json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {}
  }

  // If group_chat_id exists (e.g. comma-separated or single)
  if (row?.group_chat_id) {
    const parts = String(row.group_chat_id).split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts.map((cid, idx) => ({
        id: `grp-${idx + 1}`,
        name: idx === 0 ? 'Primary IT Group' : `Telegram Group ${idx + 1}`,
        chat_id: cid,
        is_default: true
      }));
    }
  }

  return DEFAULT_GROUPS;
}

/**
 * Setup IT meeting management and Telegram alert endpoints
 */
export function setupItMeetingRoutes(app: Express, authenticateToken: any, getDb: () => mysql.Pool) {

  // --- 1. GET ALL SCHEDULED IT MEETINGS ---
  app.get('/api/it-meetings', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      await initItMeetingTables(db);
      const [rows]: any = await db.query(
        'SELECT * FROM it_meetings ORDER BY meeting_date ASC, start_time ASC'
      );
      
      const mapped = rows.map((r: any) => {
        let targetGroups: string[] = [];
        if (r.target_groups_json) {
          try { targetGroups = JSON.parse(r.target_groups_json); } catch {}
        }
        let deliveryReport = null;
        if (r.alert_delivery_report) {
          try { deliveryReport = JSON.parse(r.alert_delivery_report); } catch {}
        }

        return {
          ...r,
          meeting_date: r.meeting_date ? String(r.meeting_date).slice(0, 10) : '',
          telegram_alert_sent: Boolean(r.telegram_alert_sent),
          target_groups: targetGroups,
          alert_delivery_report: deliveryReport
        };
      });

      res.json(mapped);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 2. GET IT MEETING TELEGRAM CONFIG (MUST BE BEFORE :id) ---
  app.get('/api/it-meetings/telegram-config', authenticateToken, async (req: any, res: Response) => {
    try {
      const db = getDb();
      await initItMeetingTables(db);

      const [rows]: any = await db.query('SELECT * FROM it_meeting_telegram_config ORDER BY id DESC LIMIT 1');
      let config: ITMeetingTelegramConfig = { ...DEFAULT_CONFIG };

      if (rows.length > 0) {
        const groups = parseConfigGroups(rows[0]);
        config = {
          bot_token: rows[0].bot_token || '',
          group_chat_id: rows[0].group_chat_id || groups.map(g => g.chat_id).filter(Boolean).join(', '),
          groups,
          default_venue: rows[0].default_venue || DEFAULT_CONFIG.default_venue,
          default_room_note: rows[0].default_room_note || DEFAULT_CONFIG.default_room_note,
          default_organizer: rows[0].default_organizer || DEFAULT_CONFIG.default_organizer,
          default_start_time: rows[0].default_start_time || DEFAULT_CONFIG.default_start_time,
          default_end_time: rows[0].default_end_time || DEFAULT_CONFIG.default_end_time
        };
      }

      // If bot_token is empty, check user profile fallback
      if (!config.bot_token) {
        const [userRows]: any = await db.query('SELECT telegram_chat_id, telegram_bot_token FROM users WHERE id = ?', [req.user.id]);
        if (userRows.length > 0) {
          if (!config.bot_token) config.bot_token = userRows[0].telegram_bot_token || '';
          if (config.groups.every(g => !g.chat_id) && userRows[0].telegram_chat_id) {
            config.groups[0] = { ...config.groups[0], chat_id: userRows[0].telegram_chat_id };
          }
        }
      }

      res.json(config);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 3. SAVE IT MEETING TELEGRAM CONFIG ---
  app.post('/api/it-meetings/telegram-config', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      await initItMeetingTables(db);

      const {
        bot_token,
        group_chat_id,
        groups,
        default_venue,
        default_room_note,
        default_organizer,
        default_start_time,
        default_end_time
      } = req.body;

      const normalizedGroups: ITMeetingTelegramGroup[] = Array.isArray(groups) ? groups : DEFAULT_GROUPS;
      const groupsJson = JSON.stringify(normalizedGroups);
      const combinedChatIds = normalizedGroups.map(g => g.chat_id).filter(Boolean).join(', ') || (group_chat_id || '');

      const [existing]: any = await db.query('SELECT id FROM it_meeting_telegram_config ORDER BY id DESC LIMIT 1');

      if (existing.length > 0) {
        await db.query(`
          UPDATE it_meeting_telegram_config SET
            bot_token = ?,
            group_chat_id = ?,
            groups_json = ?,
            default_venue = ?,
            default_room_note = ?,
            default_organizer = ?,
            default_start_time = ?,
            default_end_time = ?
          WHERE id = ?
        `, [
          bot_token || '',
          combinedChatIds,
          groupsJson,
          default_venue || DEFAULT_CONFIG.default_venue,
          default_room_note || DEFAULT_CONFIG.default_room_note,
          default_organizer || DEFAULT_CONFIG.default_organizer,
          default_start_time || DEFAULT_CONFIG.default_start_time,
          default_end_time || DEFAULT_CONFIG.default_end_time,
          existing[0].id
        ]);
      } else {
        await db.query(`
          INSERT INTO it_meeting_telegram_config 
          (bot_token, group_chat_id, groups_json, default_venue, default_room_note, default_organizer, default_start_time, default_end_time)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          bot_token || '',
          combinedChatIds,
          groupsJson,
          default_venue || DEFAULT_CONFIG.default_venue,
          default_room_note || DEFAULT_CONFIG.default_room_note,
          default_organizer || DEFAULT_CONFIG.default_organizer,
          default_start_time || DEFAULT_CONFIG.default_start_time,
          default_end_time || DEFAULT_CONFIG.default_end_time
        ]);
      }

      res.json({ success: true, message: 'IT Meeting Telegram multi-group configuration saved successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 4. PREVIEW MEETING TELEGRAM MESSAGE ---
  app.post('/api/it-meetings/preview-alert', authenticateToken, async (req: Request, res: Response) => {
    try {
      const message = buildMeetingTelegramMessage(req.body);
      res.json({ message });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 5. TEST IT MEETING TELEGRAM ALERT DISPATCH (MULTI-GROUP) ---
  app.post('/api/it-meetings/test-alert', authenticateToken, async (req: any, res: Response) => {
    try {
      const db = getDb();
      const { bot_token, group_chat_id, group_id, test_all_groups, groups } = req.body;

      const sampleMessage = buildMeetingTelegramMessage({
        title: 'IT Monthly Meeting (Test Broadcast)',
        meeting_date: '2026-09-12',
        day_of_week_label: 'this coming Saturdays',
        start_time: '2pm',
        end_time: '4PM',
        venue: 'Sakal Polyclinic',
        room_booking_note: 'Bunnarith, please help to book the meeting room',
        agenda: DEFAULT_AGENDA,
        organizer_name: 'Braseth'
      });

      let token = (bot_token || '').trim();
      let targetList: Array<{ name: string; chat_id: string }> = [];

      // Fetch saved config if needed
      const [cfgRows]: any = await db.query('SELECT bot_token, group_chat_id, groups_json FROM it_meeting_telegram_config ORDER BY id DESC LIMIT 1');
      const cfgRow = cfgRows.length > 0 ? cfgRows[0] : null;

      if (!token && cfgRow?.bot_token) token = cfgRow.bot_token;
      if (!token) {
        const [userRows]: any = await db.query('SELECT telegram_bot_token FROM users WHERE id = ?', [req.user.id]);
        if (userRows.length > 0) token = userRows[0].telegram_bot_token;
      }
      if (!token) token = process.env.TELEGRAM_BOT_TOKEN || '';

      if (!token) {
        return res.status(400).json({ error: 'Telegram Bot Token must be configured in Settings.' });
      }

      // Determine target list
      if (groups && Array.isArray(groups)) {
        targetList = groups.filter((g: any) => g.chat_id?.trim()).map((g: any) => ({ name: g.name || 'Telegram Group', chat_id: g.chat_id.trim() }));
      } else if (group_chat_id) {
        targetList = [{ name: 'Specified Group', chat_id: group_chat_id.trim() }];
      } else if (cfgRow) {
        const parsed = parseConfigGroups(cfgRow);
        if (group_id) {
          const matched = parsed.find(g => g.id === group_id && g.chat_id);
          if (matched) targetList = [{ name: matched.name, chat_id: matched.chat_id }];
        } else if (test_all_groups) {
          targetList = parsed.filter(g => g.chat_id?.trim()).map(g => ({ name: g.name, chat_id: g.chat_id.trim() }));
        } else {
          const defaultOne = parsed.find(g => g.is_default && g.chat_id) || parsed.find(g => g.chat_id);
          if (defaultOne) targetList = [{ name: defaultOne.name, chat_id: defaultOne.chat_id }];
        }
      }

      if (targetList.length === 0) {
        return res.status(400).json({ error: 'No valid Telegram Group Chat ID found to send test message.' });
      }

      const dispatchResults: Array<{ name: string; chat_id: string; success: boolean; error?: string }> = [];

      for (const tgt of targetList) {
        try {
          const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
          await axios.post(tgUrl, {
            chat_id: tgt.chat_id,
            text: `🔔 [TEST NOTIFICATION - IT MEETING MULTI-GROUP ALERT]\nTarget Group: ${tgt.name}\n\n${sampleMessage}`
          });
          dispatchResults.push({ name: tgt.name, chat_id: tgt.chat_id, success: true });
        } catch (err: any) {
          const desc = err.response?.data?.description || err.message;
          dispatchResults.push({ name: tgt.name, chat_id: tgt.chat_id, success: false, error: desc });
        }
      }

      const successCount = dispatchResults.filter(r => r.success).length;
      if (successCount === 0) {
        return res.status(400).json({
          error: `Test alert failed: ${dispatchResults.map(r => `${r.name}: ${r.error}`).join('; ')}`,
          results: dispatchResults
        });
      }

      res.json({
        success: true,
        message: `Test alert broadcast sent to ${successCount}/${targetList.length} group(s)!`,
        results: dispatchResults
      });
    } catch (e: any) {
      const desc = e.response?.data?.description || e.message;
      res.status(500).json({ error: `Telegram dispatch error: ${desc}` });
    }
  });

  // --- 6. GET SINGLE MEETING ---
  app.get('/api/it-meetings/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const [rows]: any = await db.query('SELECT * FROM it_meetings WHERE id = ?', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Meeting not found' });
      const r = rows[0];

      let targetGroups: string[] = [];
      if (r.target_groups_json) {
        try { targetGroups = JSON.parse(r.target_groups_json); } catch {}
      }
      let deliveryReport = null;
      if (r.alert_delivery_report) {
        try { deliveryReport = JSON.parse(r.alert_delivery_report); } catch {}
      }

      res.json({
        ...r,
        meeting_date: r.meeting_date ? String(r.meeting_date).slice(0, 10) : '',
        telegram_alert_sent: Boolean(r.telegram_alert_sent),
        target_groups: targetGroups,
        alert_delivery_report: deliveryReport
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 7. CREATE SCHEDULED MEETING (WITH OPTIONAL MULTI-GROUP ALERT) ---
  app.post('/api/it-meetings', authenticateToken, async (req: any, res: Response) => {
    try {
      const db = getDb();
      await initItMeetingTables(db);

      const {
        title,
        meeting_date,
        day_of_week_label,
        start_time,
        end_time,
        venue,
        room_booking_note,
        agenda,
        organizer_name,
        target_groups,
        send_alert_now
      } = req.body;

      if (!title || !meeting_date) {
        return res.status(400).json({ error: 'Meeting title and date are required' });
      }

      const id = crypto.randomUUID();
      const userId = req.user?.id || null;
      const cleanDate = String(meeting_date).slice(0, 10);
      const startTime = start_time || '2pm';
      const endTime = end_time || '4PM';
      const venueStr = venue || 'Sakal Polyclinic';
      const roomNote = room_booking_note || null;
      const agendaStr = agenda || DEFAULT_AGENDA;
      const organizer = organizer_name || 'Braseth';
      const dayLabel = day_of_week_label || null;
      const targetGroupsJson = JSON.stringify(Array.isArray(target_groups) ? target_groups : []);

      await db.query(`
        INSERT INTO it_meetings 
        (id, user_id, title, meeting_date, day_of_week_label, start_time, end_time, venue, room_booking_note, agenda, organizer_name, target_groups_json, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled')
      `, [id, userId, title, cleanDate, dayLabel, startTime, endTime, venueStr, roomNote, agendaStr, organizer, targetGroupsJson]);

      let alertSent = false;
      let alertError: string | null = null;
      let alertDetails: any = null;

      if (send_alert_now) {
        try {
          const alertResult = await dispatchTelegramAlert(db, req.user?.id, {
            title,
            meeting_date: cleanDate,
            day_of_week_label: dayLabel,
            start_time: startTime,
            end_time: endTime,
            venue: venueStr,
            room_booking_note: roomNote,
            agenda: agendaStr,
            organizer_name: organizer
          }, target_groups);

          if (alertResult.success) {
            alertSent = true;
            alertDetails = alertResult;
            await db.query('UPDATE it_meetings SET telegram_alert_sent = 1, last_alert_sent_at = NOW(), alert_delivery_report = ? WHERE id = ?', [
              JSON.stringify(alertResult),
              id
            ]);
          } else {
            alertError = alertResult.error || 'Failed to dispatch alert';
          }
        } catch (err: any) {
          alertError = err.message;
        }
      }

      const [rows]: any = await db.query('SELECT * FROM it_meetings WHERE id = ?', [id]);
      const created = rows[0];

      res.json({
        ...created,
        meeting_date: created.meeting_date ? String(created.meeting_date).slice(0, 10) : '',
        telegram_alert_sent: alertSent,
        target_groups: Array.isArray(target_groups) ? target_groups : [],
        alert_sent: alertSent,
        alert_error: alertError,
        alert_details: alertDetails
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 8. UPDATE SCHEDULED MEETING ---
  app.put('/api/it-meetings/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const {
        title,
        meeting_date,
        day_of_week_label,
        start_time,
        end_time,
        venue,
        room_booking_note,
        agenda,
        organizer_name,
        target_groups,
        status
      } = req.body;

      const cleanDate = meeting_date ? String(meeting_date).slice(0, 10) : undefined;
      const targetGroupsJson = target_groups !== undefined ? JSON.stringify(Array.isArray(target_groups) ? target_groups : []) : undefined;

      await db.query(`
        UPDATE it_meetings SET
          title = COALESCE(?, title),
          meeting_date = COALESCE(?, meeting_date),
          day_of_week_label = COALESCE(?, day_of_week_label),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          venue = COALESCE(?, venue),
          room_booking_note = ?,
          agenda = COALESCE(?, agenda),
          organizer_name = COALESCE(?, organizer_name),
          target_groups_json = COALESCE(?, target_groups_json),
          status = COALESCE(?, status)
        WHERE id = ?
      `, [
        title, cleanDate, day_of_week_label, start_time, end_time,
        venue, room_booking_note ?? null, agenda, organizer_name, targetGroupsJson, status, id
      ]);

      const [rows]: any = await db.query('SELECT * FROM it_meetings WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Meeting not found' });
      const r = rows[0];

      let parsedTargetGroups: string[] = [];
      if (r.target_groups_json) {
        try { parsedTargetGroups = JSON.parse(r.target_groups_json); } catch {}
      }

      res.json({
        ...r,
        meeting_date: r.meeting_date ? String(r.meeting_date).slice(0, 10) : '',
        telegram_alert_sent: Boolean(r.telegram_alert_sent),
        target_groups: parsedTargetGroups
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 9. DELETE SCHEDULED MEETING ---
  app.delete('/api/it-meetings/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const db = getDb();
      const { id } = req.params;
      await db.query('DELETE FROM it_meetings WHERE id = ?', [id]);
      res.json({ success: true, message: 'Meeting deleted successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- 10. DISPATCH TELEGRAM MULTI-GROUP ALERT FOR EXISTING MEETING ---
  app.post('/api/it-meetings/:id/send-alert', authenticateToken, async (req: any, res: Response) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { target_group_ids } = req.body || {};

      const [rows]: any = await db.query('SELECT * FROM it_meetings WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Meeting not found' });
      const meeting = rows[0];

      let meetingTargetGroups: string[] = [];
      if (target_group_ids && Array.isArray(target_group_ids) && target_group_ids.length > 0) {
        meetingTargetGroups = target_group_ids;
      } else if (meeting.target_groups_json) {
        try { meetingTargetGroups = JSON.parse(meeting.target_groups_json); } catch {}
      }

      const cleanDate = meeting.meeting_date ? String(meeting.meeting_date).slice(0, 10) : '';

      const alertResult = await dispatchTelegramAlert(db, req.user?.id, {
        title: meeting.title,
        meeting_date: cleanDate,
        day_of_week_label: meeting.day_of_week_label,
        start_time: meeting.start_time,
        end_time: meeting.end_time,
        venue: meeting.venue,
        room_booking_note: meeting.room_booking_note,
        agenda: meeting.agenda,
        organizer_name: meeting.organizer_name
      }, meetingTargetGroups);

      if (!alertResult.success) {
        return res.status(400).json({ error: alertResult.error || 'Failed to dispatch Telegram message to groups' });
      }

      await db.query('UPDATE it_meetings SET telegram_alert_sent = 1, last_alert_sent_at = NOW(), alert_delivery_report = ? WHERE id = ?', [
        JSON.stringify(alertResult),
        id
      ]);

      const deliveredNames = alertResult.results.filter(r => r.success).map(r => r.name).join(', ');

      res.json({
        success: true,
        message: `Telegram alert broadcast sent to ${alertResult.totalSent} group(s): ${deliveredNames}`,
        deliveredGroups: alertResult.results.filter(r => r.success),
        failedGroups: alertResult.results.filter(r => !r.success),
        totalSent: alertResult.totalSent,
        sentAt: new Date().toISOString()
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}

/**
 * Helper to dispatch Telegram message to multiple target groups
 */
async function dispatchTelegramAlert(
  db: mysql.Pool, 
  userId: string | null, 
  meetingData: any,
  requestedGroupIds?: string[]
): Promise<{
  success: boolean;
  totalSent: number;
  totalFailed: number;
  results: Array<{ id: string; name: string; chat_id: string; success: boolean; error?: string }>;
  error?: string;
}> {
  try {
    let token = '';
    let configuredGroups: ITMeetingTelegramGroup[] = [];

    // 1. Check it_meeting_telegram_config
    const [cfgRows]: any = await db.query('SELECT bot_token, group_chat_id, groups_json FROM it_meeting_telegram_config ORDER BY id DESC LIMIT 1').catch(() => [[]]);
    if (cfgRows && cfgRows.length > 0) {
      token = (cfgRows[0].bot_token || '').trim();
      configuredGroups = parseConfigGroups(cfgRows[0]);
    }

    // 2. Fallback to user's telegram settings
    if (!token && userId) {
      const [userRows]: any = await db.query('SELECT telegram_chat_id, telegram_bot_token FROM users WHERE id = ?', [userId]).catch(() => [[]]);
      if (userRows && userRows.length > 0) {
        if (!token) token = (userRows[0].telegram_bot_token || '').trim();
        if (configuredGroups.every(g => !g.chat_id) && userRows[0].telegram_chat_id) {
          configuredGroups = [{ id: 'grp-user', name: 'User Default Group', chat_id: userRows[0].telegram_chat_id.trim(), is_default: true }];
        }
      }
    }

    // 3. Fallback to environment variables
    if (!token) token = process.env.TELEGRAM_BOT_TOKEN || '';
    if (configuredGroups.every(g => !g.chat_id) && process.env.TELEGRAM_CHAT_ID) {
      configuredGroups = [{ id: 'grp-env', name: 'Environment Telegram Group', chat_id: process.env.TELEGRAM_CHAT_ID.trim(), is_default: true }];
    }

    if (!token) {
      return { 
        success: false, 
        totalSent: 0, 
        totalFailed: 0, 
        results: [], 
        error: 'Telegram Bot Token is not configured. Please set it in IT Meeting Telegram Settings.' 
      };
    }

    // Determine target groups
    let targetGroups: ITMeetingTelegramGroup[] = [];

    if (requestedGroupIds && requestedGroupIds.length > 0) {
      // Find matching by ID or Chat ID
      targetGroups = configuredGroups.filter(g => 
        requestedGroupIds.includes(g.id) || requestedGroupIds.includes(g.chat_id) || requestedGroupIds.includes(g.name)
      );
      // If some requested IDs are raw chat IDs not in configured list (ad-hoc chat IDs)
      const matchedIds = new Set(targetGroups.map(g => g.id).concat(targetGroups.map(g => g.chat_id)));
      for (const reqId of requestedGroupIds) {
        if (!matchedIds.has(reqId) && (reqId.startsWith('-') || /^\d+$/.test(reqId) || reqId.startsWith('@'))) {
          targetGroups.push({ id: `adhoc-${reqId}`, name: reqId, chat_id: reqId, is_default: true });
        }
      }
    }

    // If still no groups selected, use default groups (or all configured groups with a chat_id)
    if (targetGroups.length === 0) {
      const defaults = configuredGroups.filter(g => g.is_default && g.chat_id?.trim());
      targetGroups = defaults.length > 0 ? defaults : configuredGroups.filter(g => g.chat_id?.trim());
    }

    if (targetGroups.length === 0) {
      return { 
        success: false, 
        totalSent: 0, 
        totalFailed: 0, 
        results: [], 
        error: 'No target Telegram group chat IDs configured. Please add group chat IDs in Settings > IT Meeting Alert.' 
      };
    }

    const message = buildMeetingTelegramMessage(meetingData);
    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;

    const dispatchResults: Array<{ id: string; name: string; chat_id: string; success: boolean; error?: string }> = [];

    // Send to each group
    for (const group of targetGroups) {
      if (!group.chat_id?.trim()) continue;
      try {
        await axios.post(tgUrl, {
          chat_id: group.chat_id.trim(),
          text: message
        });
        dispatchResults.push({ id: group.id, name: group.name, chat_id: group.chat_id.trim(), success: true });
      } catch (err: any) {
        const desc = err.response?.data?.description || err.message;
        dispatchResults.push({ id: group.id, name: group.name, chat_id: group.chat_id.trim(), success: false, error: desc });
      }
    }

    const totalSent = dispatchResults.filter(r => r.success).length;
    const totalFailed = dispatchResults.filter(r => !r.success).length;

    if (totalSent === 0) {
      const errorMsg = dispatchResults.map(r => `${r.name}: ${r.error}`).join('; ');
      return {
        success: false,
        totalSent: 0,
        totalFailed,
        results: dispatchResults,
        error: `Failed to dispatch to all groups: ${errorMsg}`
      };
    }

    return {
      success: true,
      totalSent,
      totalFailed,
      results: dispatchResults
    };
  } catch (err: any) {
    const desc = err.response?.data?.description || err.message;
    return { success: false, totalSent: 0, totalFailed: 1, results: [], error: desc };
  }
}
