import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Calendar,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Edit2,
  ExternalLink,
  Eye,
  Link2,
  MapPin,
  NotebookPen,
  PanelLeft,
  Plus,
  PlusCircle,
  RefreshCw,
  Search,
  Send,
  Trash2,
  User,
  Users,
  X
} from 'lucide-react';
import { ITMeetingDraft, ITMeetingRecord } from './ScheduleMeetingModal';
import {
  detectJoinPlatform,
  formatLeadTimeText,
  PersonalEventDraft,
  PersonalEventRecord
} from './PersonalEventModal';
import { LiveMeetingNoteTarget } from './LiveMeetingNotesModal';
import { SmartModal } from './ui/SmartModal';
import { Button } from './ui/Button';

export type OutlookCalendarViewMode = 'month' | 'work_week' | 'week' | 'day';
export type OutlookCalendarScope = 'unified' | 'meetings' | 'personal';

export interface CalendarScheduleItem {
  key: string;
  id: string;
  source: 'it_meeting' | 'personal_event';
  title: string;
  categoryLabel: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTimeLabel: string;
  endTimeLabel: string;
  startMinutes: number; // 0..1439
  endMinutes: number;   // 1..1440
  isMultiDay: boolean;
  location: string;
  roomNote: string;
  organizerOrHost: string;
  joinUrl: string;
  notesOrAgenda: string;
  status: string;
  alertSent: boolean;
  lastAlertError?: string | null;
  reminderMinutesBefore?: number;
  linkedNoteId?: string | null;
  linkedNoteTitle?: string | null;
  linkedNoteExcerpt?: string | null;
  rawMeeting?: ITMeetingRecord;
  rawPersonalEvent?: PersonalEventRecord;
}

interface OutlookCalendarDashboardProps {
  scope: OutlookCalendarScope;
  meetings: ITMeetingRecord[];
  personalEvents: PersonalEventRecord[];
  loading?: boolean;
  sendingMeetingAlertId?: string | null;
  sendingPersonalAlertId?: string | null;
  onCreateItMeeting: (draft: ITMeetingDraft) => void;
  onCreatePersonalEvent: (draft: PersonalEventDraft) => void;
  onEditItMeeting: (meeting: ITMeetingRecord) => void;
  onDeleteItMeeting: (meeting: ITMeetingRecord) => void;
  onSendItMeetingAlert: (meeting: ITMeetingRecord) => void;
  onEditPersonalEvent: (ev: PersonalEventRecord) => void;
  onDeletePersonalEvent: (ev: PersonalEventRecord) => void;
  onSendPersonalAlert: (ev: PersonalEventRecord) => void;
  onUpdatePersonalStatus: (ev: PersonalEventRecord, status: PersonalEventRecord['status']) => void;
  onOpenLiveNotes: (target: LiveMeetingNoteTarget) => void;
}

const HOUR_HEIGHT_PX = 56;
const HOURS = Array.from({ length: 24 }, (_, idx) => idx);
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function toDateIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoDate(iso: string): Date {
  const parts = (iso || '').split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(y, m, day);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

function addDays(d: Date, delta: number): Date {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta);
  return next;
}

function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function startOfWeekSun(d: Date): Date {
  const day = d.getDay();
  return addDays(d, -day);
}

function startOfWorkWeekMon(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function parseTimeToMinutes(raw?: string | null, fallbackMinutes = 540): number {
  const str = (raw || '').trim().toLowerCase();
  if (!str) return fallbackMinutes;

  // Match 24h or 12h: "09:30", "14:00", "2pm", "2:30 pm", "4PM"
  const m = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return fallbackMinutes;

  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  const meridiem = m[3]?.toLowerCase();

  if (isNaN(hour) || isNaN(minute) || minute < 0 || minute > 59) {
    return fallbackMinutes;
  }

  if (meridiem) {
    if (hour === 12) {
      hour = meridiem === 'am' ? 0 : 12;
    } else if (meridiem === 'pm' && hour < 12) {
      hour += 12;
    }
  }

  if (hour < 0 || hour > 23) return fallbackMinutes;
  return hour * 60 + minute;
}

function formatHourLabel(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${suffix}`;
}

function formatHHMM(minutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, minutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function format12hCompact(minutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, minutes));
  const h24 = Math.floor(clamped / 60);
  const m = clamped % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h12}${suffix.toLowerCase()}` : `${h12}:${String(m).padStart(2, '0')}${suffix.toLowerCase()}`;
}

function getToneClasses(item: CalendarScheduleItem, isSelected: boolean): string {
  const isCancelled = item.status === 'Cancelled';
  if (isCancelled) {
    return `bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 line-through opacity-75 ${
      isSelected ? 'ring-2 ring-slate-400' : ''
    }`;
  }
  if (item.source === 'it_meeting') {
    return `bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-100 border-indigo-200 dark:border-indigo-700/80 hover:bg-indigo-100/90 dark:hover:bg-indigo-900/60 ${
      isSelected ? 'ring-2 ring-indigo-500 border-indigo-400' : ''
    }`;
  }
  switch (item.categoryLabel) {
    case 'Vendor Call':
      return `bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-100 border-sky-200 dark:border-sky-700/80 hover:bg-sky-100/80 dark:hover:bg-sky-900/60 ${
        isSelected ? 'ring-2 ring-sky-500 border-sky-400' : ''
      }`;
    case 'Workshop':
    case 'Training':
      return `bg-amber-50 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100 border-amber-200 dark:border-amber-700/80 hover:bg-amber-100/80 dark:hover:bg-amber-900/60 ${
        isSelected ? 'ring-2 ring-amber-500 border-amber-400' : ''
      }`;
    case 'Event':
      return `bg-violet-50 dark:bg-violet-950/50 text-violet-950 dark:text-violet-100 border-violet-200 dark:border-violet-700/80 hover:bg-violet-100/80 dark:hover:bg-violet-900/60 ${
        isSelected ? 'ring-2 ring-violet-500 border-violet-400' : ''
      }`;
    default:
      return `bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 border-emerald-200 dark:border-emerald-700/80 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 ${
        isSelected ? 'ring-2 ring-emerald-500 border-emerald-400' : ''
      }`;
  }
}

function getSourceIndicatorColor(item: CalendarScheduleItem): string {
  if (item.status === 'Cancelled') return 'bg-slate-400';
  if (item.source === 'it_meeting') return 'bg-indigo-600 dark:bg-indigo-400';
  switch (item.categoryLabel) {
    case 'Vendor Call':
      return 'bg-sky-600 dark:bg-sky-400';
    case 'Workshop':
    case 'Training':
      return 'bg-amber-600 dark:bg-amber-400';
    case 'Event':
      return 'bg-violet-600 dark:bg-violet-400';
    default:
      return 'bg-emerald-600 dark:bg-emerald-400';
  }
}

interface PositionedTimeItem {
  item: CalendarScheduleItem;
  startMins: number;
  endMins: number;
  col: number;
  totalCols: number;
}

function layoutDayTimedItems(items: CalendarScheduleItem[]): PositionedTimeItem[] {
  const sorted = [...items]
    .map((item) => {
      const s = Math.max(0, Math.min(23 * 60 + 30, item.startMinutes));
      const rawEnd = item.endMinutes > s ? item.endMinutes : s + 60;
      const e = Math.min(24 * 60, Math.max(s + 30, rawEnd));
      return { item, startMins: s, endMins: e };
    })
    .sort((a, b) => (a.startMins !== b.startMins ? a.startMins - b.startMins : b.endMins - a.endMins));

  const clusters: Array<Array<{ item: CalendarScheduleItem; startMins: number; endMins: number }>> = [];
  let currentCluster: Array<{ item: CalendarScheduleItem; startMins: number; endMins: number }> = [];
  let clusterEnd = -1;

  for (const entry of sorted) {
    if (currentCluster.length === 0 || entry.startMins < clusterEnd) {
      currentCluster.push(entry);
      clusterEnd = Math.max(clusterEnd, entry.endMins);
    } else {
      clusters.push(currentCluster);
      currentCluster = [entry];
      clusterEnd = entry.endMins;
    }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);

  const result: PositionedTimeItem[] = [];
  for (const cluster of clusters) {
    const colEnds: number[] = [];
    const placed: Array<{ item: CalendarScheduleItem; startMins: number; endMins: number; col: number }> = [];

    for (const entry of cluster) {
      let colIdx = colEnds.findIndex((end) => end <= entry.startMins);
      if (colIdx === -1) {
        colIdx = colEnds.length;
        colEnds.push(entry.endMins);
      } else {
        colEnds[colIdx] = entry.endMins;
      }
      placed.push({ ...entry, col: colIdx });
    }

    const totalCols = Math.max(1, colEnds.length);
    for (const p of placed) {
      result.push({ ...p, totalCols });
    }
  }

  return result;
}

export const OutlookCalendarDashboard: React.FC<OutlookCalendarDashboardProps> = ({
  scope,
  meetings,
  personalEvents,
  loading = false,
  sendingMeetingAlertId,
  sendingPersonalAlertId,
  onCreateItMeeting,
  onCreatePersonalEvent,
  onEditItMeeting,
  onDeleteItMeeting,
  onSendItMeetingAlert,
  onEditPersonalEvent,
  onDeletePersonalEvent,
  onSendPersonalAlert,
  onUpdatePersonalStatus,
  onOpenLiveNotes
}) => {
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => toDateIso(today), [today]);

  const [viewMode, setViewMode] = useState<OutlookCalendarViewMode>('month');
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const [miniMonthDate, setMiniMonthDate] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [searchTerm, setSearchTerm] = useState('');
  const [showItMeetings, setShowItMeetings] = useState(true);
  const [showPersonalEvents, setShowPersonalEvents] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const [copiedJoinKey, setCopiedJoinKey] = useState<string | null>(null);

  // Unified empty slot creation picker
  const [slotChooserDraft, setSlotChooserDraft] = useState<{
    dateIso: string;
    endDateIso: string;
    startTime24: string;
    endTime24: string;
    startTime12: string;
    endTime12: string;
  } | null>(null);

  const timeGridScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll time-grid to 07:30 when switching into Week/Work Week/Day view
  useEffect(() => {
    if (viewMode !== 'month' && timeGridScrollRef.current) {
      timeGridScrollRef.current.scrollTop = Math.max(0, 7 * HOUR_HEIGHT_PX - 12);
    }
  }, [viewMode]);

  // Normalize IT Meetings & Personal Events into one unified list
  const allNormalizedItems = useMemo<CalendarScheduleItem[]>(() => {
    const list: CalendarScheduleItem[] = [];

    if (scope === 'unified' || scope === 'meetings') {
      for (const m of meetings) {
        const sDate = (m.meeting_date || '').slice(0, 10);
        if (!sDate) continue;
        const startMins = parseTimeToMinutes(m.start_time, 14 * 60);
        const parsedEnd = parseTimeToMinutes(m.end_time, startMins + 120);
        const endMins = parsedEnd > startMins ? parsedEnd : Math.min(24 * 60, startMins + 90);
        list.push({
          key: `it_meeting:${m.id}`,
          id: m.id,
          source: 'it_meeting',
          title: m.title || 'IT Meeting',
          categoryLabel: 'IT Meeting',
          startDate: sDate,
          endDate: sDate,
          startTimeLabel: m.start_time || '2pm',
          endTimeLabel: m.end_time || '',
          startMinutes: startMins,
          endMinutes: endMins,
          isMultiDay: false,
          location: m.venue || '',
          roomNote: m.room_booking_note || '',
          organizerOrHost: m.organizer_name || '',
          joinUrl: '',
          notesOrAgenda: m.agenda || '',
          status: m.status || 'Scheduled',
          alertSent: Boolean(m.telegram_alert_sent),
          linkedNoteId: m.linked_note_id,
          linkedNoteTitle: m.linked_note_title,
          linkedNoteExcerpt: m.linked_note_excerpt,
          rawMeeting: m
        });
      }
    }

    if (scope === 'unified' || scope === 'personal') {
      for (const ev of personalEvents) {
        const sDate = (ev.event_date || '').slice(0, 10);
        if (!sDate) continue;
        const eDateRaw = (ev.event_end_date || sDate).slice(0, 10);
        const eDate = eDateRaw >= sDate ? eDateRaw : sDate;
        const startMins = parseTimeToMinutes(ev.start_time, 9 * 60);
        const parsedEnd = ev.end_time ? parseTimeToMinutes(ev.end_time, startMins + 60) : startMins + 60;
        const endMins = parsedEnd > startMins ? parsedEnd : Math.min(24 * 60, startMins + 60);
        list.push({
          key: `personal_event:${ev.id}`,
          id: ev.id,
          source: 'personal_event',
          title: ev.title,
          categoryLabel: ev.event_type || 'Meeting',
          startDate: sDate,
          endDate: eDate,
          startTimeLabel: ev.start_time || '09:00',
          endTimeLabel: ev.end_time || '',
          startMinutes: startMins,
          endMinutes: endMins,
          isMultiDay: eDate > sDate,
          location: ev.location || '',
          roomNote: '',
          organizerOrHost: ev.host_name || '',
          joinUrl: ev.join_url || '',
          notesOrAgenda: ev.notes || '',
          status: ev.status || 'Upcoming',
          alertSent: Boolean(ev.reminder_sent),
          lastAlertError: ev.last_alert_error,
          reminderMinutesBefore: ev.reminder_minutes_before,
          linkedNoteId: ev.linked_note_id,
          linkedNoteTitle: ev.linked_note_title,
          linkedNoteExcerpt: ev.linked_note_excerpt,
          rawPersonalEvent: ev
        });
      }
    }

    return list.sort((a, b) => {
      if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
      return a.startMinutes - b.startMinutes;
    });
  }, [scope, meetings, personalEvents]);

  const visibleItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allNormalizedItems.filter((item) => {
      if (scope === 'unified') {
        if (item.source === 'it_meeting' && !showItMeetings) return false;
        if (item.source === 'personal_event' && !showPersonalEvents) return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.organizerOrHost.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [allNormalizedItems, scope, showItMeetings, showPersonalEvents, searchTerm]);

  const selectedItem = useMemo(
    () => allNormalizedItems.find((i) => i.key === selectedItemKey) || null,
    [allNormalizedItems, selectedItemKey]
  );

  // Set of date ISOs having events (for mini-month indicator dots)
  const datesWithEvents = useMemo(() => {
    const map = new Set<string>();
    const monthStart = new Date(miniMonthDate.getFullYear(), miniMonthDate.getMonth(), 1);
    const gridStart = startOfWeekSun(monthStart);
    const gridEnd = addDays(gridStart, 41);
    const gridStartIso = toDateIso(gridStart);
    const gridEndIso = toDateIso(gridEnd);

    for (const item of visibleItems) {
      if (item.endDate < gridStartIso || item.startDate > gridEndIso) continue;
      let cursor = parseIsoDate(item.startDate < gridStartIso ? gridStartIso : item.startDate);
      const stopIso = item.endDate > gridEndIso ? gridEndIso : item.endDate;
      for (let guard = 0; guard < 45; guard++) {
        const curIso = toDateIso(cursor);
        if (curIso > stopIso) break;
        map.add(curIso);
        cursor = addDays(cursor, 1);
      }
    }
    return map;
  }, [visibleItems, miniMonthDate]);

  const anchorIso = toDateIso(anchorDate);

  // Selected day agenda for Left Rail "Up Next"
  const anchorDayAgenda = useMemo(() => {
    return visibleItems.filter((item) => item.startDate <= anchorIso && item.endDate >= anchorIso);
  }, [visibleItems, anchorIso]);

  // Visible day columns for Week / Work Week / Day view
  const timeGridDays = useMemo(() => {
    if (viewMode === 'day') return [anchorDate];
    if (viewMode === 'work_week') {
      const mon = startOfWorkWeekMon(anchorDate);
      return Array.from({ length: 5 }, (_, i) => addDays(mon, i));
    }
    const sun = startOfWeekSun(anchorDate);
    return Array.from({ length: 7 }, (_, i) => addDays(sun, i));
  }, [viewMode, anchorDate]);

  // Month calendar weeks (6 rows x 7 cols)
  const monthWeeks = useMemo(() => {
    const firstOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const gridStart = startOfWeekSun(firstOfMonth);
    const weeks: Date[][] = [];
    for (let w = 0; w < 6; w++) {
      weeks.push(Array.from({ length: 7 }, (_, d) => addDays(gridStart, w * 7 + d)));
    }
    return weeks;
  }, [anchorDate]);

  // Mini month 6x7 days
  const miniMonthDays = useMemo(() => {
    const first = new Date(miniMonthDate.getFullYear(), miniMonthDate.getMonth(), 1);
    const gridStart = startOfWeekSun(first);
    return Array.from({ length: 42 }, (_, idx) => addDays(gridStart, idx));
  }, [miniMonthDate]);

  // Header title string matching Outlook formatting
  const headerRangeTitle = useMemo(() => {
    if (viewMode === 'month') {
      return `${MONTH_NAMES[anchorDate.getMonth()]} ${anchorDate.getFullYear()}`;
    }
    if (viewMode === 'day') {
      return anchorDate.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
    const first = timeGridDays[0];
    const last = timeGridDays[timeGridDays.length - 1];
    if (first.getMonth() === last.getMonth()) {
      return `${MONTH_SHORT[first.getMonth()]} ${first.getDate()} – ${last.getDate()}, ${last.getFullYear()}`;
    }
    return `${MONTH_SHORT[first.getMonth()]} ${first.getDate()} – ${MONTH_SHORT[last.getMonth()]} ${last.getDate()}, ${last.getFullYear()}`;
  }, [viewMode, anchorDate, timeGridDays]);

  const handleNavigate = (direction: -1 | 1) => {
    let next: Date;
    if (viewMode === 'month') {
      next = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + direction, 1);
    } else if (viewMode === 'week' || viewMode === 'work_week') {
      next = addDays(anchorDate, direction * 7);
    } else {
      next = addDays(anchorDate, direction);
    }
    setAnchorDate(next);
    setMiniMonthDate(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  const handleToday = () => {
    const now = new Date();
    setAnchorDate(now);
    setMiniMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const handleEmptySlotClick = (dateIso: string, startMinutes = 9 * 60) => {
    const startTime24 = formatHHMM(startMinutes);
    const endTime24 = formatHHMM(Math.min(23 * 60 + 59, startMinutes + 60));
    const startTime12 = format12hCompact(startMinutes);
    const endTime12 = format12hCompact(Math.min(23 * 60 + 59, startMinutes + 60));

    if (scope === 'personal') {
      onCreatePersonalEvent({
        event_date: dateIso,
        event_end_date: dateIso,
        start_time: startTime24,
        end_time: endTime24
      });
      return;
    }
    if (scope === 'meetings') {
      onCreateItMeeting({
        meeting_date: dateIso,
        start_time: startTime12,
        end_time: endTime12
      });
      return;
    }
    // Unified mode: ask user cleanly whether they want to add Personal Event or IT Meeting
    setSlotChooserDraft({
      dateIso,
      endDateIso: dateIso,
      startTime24,
      endTime24,
      startTime12,
      endTime12
    });
  };

  const handleCopyJoinUrl = async (item: CalendarScheduleItem) => {
    if (!item.joinUrl) return;
    try {
      await navigator.clipboard.writeText(item.joinUrl);
      setCopiedJoinKey(item.key);
      setTimeout(() => setCopiedJoinKey(null), 2000);
    } catch {}
  };

  // Current time indicator position (minutes)
  const nowMinutes = today.getHours() * 60 + today.getMinutes();

  const itMeetingCount = meetings.length;
  const personalCount = personalEvents.length;

  return (
    <div className="space-y-4">
      {/* Outlook-Style Top Action & Navigation Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMobileSidebar((v) => !v)}
            className="xl:hidden inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Toggle mini calendar and sources"
          >
            <PanelLeft size={16} />
          </button>

          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Today
          </button>

          <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-0.5">
            <button
              type="button"
              onClick={() => handleNavigate(-1)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
              aria-label="Previous period"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => handleNavigate(1)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
              aria-label="Next period"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 px-1 font-display tabular-nums">
            {headerRangeTitle}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-between xl:justify-end">
          {/* Live Calendar Search */}
          <div className="relative flex-1 sm:flex-none sm:w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, room, host..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Segmented Outlook View Switcher */}
          <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto max-w-full">
            {(
              [
                { key: 'month', label: 'Month' },
                { key: 'work_week', label: 'Work Week' },
                { key: 'week', label: 'Week' },
                { key: 'day', label: 'Day' }
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setViewMode(opt.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  viewMode === opt.key
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Outlook Workspace: Left Mini-Rail + Center Calendar Grid + Optional Right Detail Drawer */}
      <div className="flex flex-col xl:flex-row gap-4 items-start">
        {/* Left Rail (Mini Month Navigator + Calendars Filter + Day Agenda) */}
        <aside
          className={`${
            showMobileSidebar ? 'flex' : 'hidden xl:flex'
          } w-full xl:w-64 shrink-0 flex-col gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4`}
        >
          {/* Mini Month Calendar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-display">
                {MONTH_NAMES[miniMonthDate.getMonth()]} {miniMonthDate.getFullYear()}
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setMiniMonthDate((d) => addMonths(d, -1))}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Previous mini month"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setMiniMonthDate((d) => addMonths(d, 1))}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Next mini month"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((lbl, idx) => (
                <span key={idx} className="text-[10px] font-semibold text-slate-400 py-1">
                  {lbl}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {miniMonthDays.map((d) => {
                const iso = toDateIso(d);
                const isCurMonth = d.getMonth() === miniMonthDate.getMonth();
                const isToday = iso === todayIso;
                const isSelected = iso === anchorIso;
                const hasEvent = datesWithEvents.has(iso);
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => {
                      setAnchorDate(d);
                      if (viewMode === 'month') {
                        setMiniMonthDate(new Date(d.getFullYear(), d.getMonth(), 1));
                      }
                    }}
                    className={`relative h-8 rounded-lg text-[11px] font-mono tabular-nums flex flex-col items-center justify-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold'
                        : isToday
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold'
                        : isCurMonth
                        ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        : 'text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span>{d.getDate()}</span>
                    {hasEvent && (
                      <span
                        className={`w-1 h-1 rounded-full mt-0.5 ${
                          isSelected ? 'bg-white' : 'bg-indigo-500 dark:bg-indigo-400'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">My Calendars</h3>

            {(scope === 'unified' || scope === 'meetings') && (
              <label
                className={`flex items-center justify-between gap-2 text-xs py-1 px-2 rounded-lg transition-colors ${
                  scope === 'unified'
                    ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70'
                    : ''
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  {scope === 'unified' ? (
                    <input
                      type="checkbox"
                      checked={showItMeetings}
                      onChange={(e) => setShowItMeetings(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 shrink-0" />
                  )}
                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                  <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                    IT Meetings
                  </span>
                </span>
                <span className="text-[11px] font-mono tabular-nums text-slate-400">
                  {itMeetingCount}
                </span>
              </label>
            )}

            {(scope === 'unified' || scope === 'personal') && (
              <label
                className={`flex items-center justify-between gap-2 text-xs py-1 px-2 rounded-lg transition-colors ${
                  scope === 'unified'
                    ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70'
                    : ''
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  {scope === 'unified' ? (
                    <input
                      type="checkbox"
                      checked={showPersonalEvents}
                      onChange={(e) => setShowPersonalEvents(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 shrink-0" />
                  )}
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                    My Scheduler
                  </span>
                </span>
                <span className="text-[11px] font-mono tabular-nums text-slate-400">
                  {personalCount}
                </span>
              </label>
            )}

            <div className="pt-1 flex flex-col gap-1.5">
              {(scope === 'unified' || scope === 'personal') && (
                <button
                  type="button"
                  onClick={() =>
                    onCreatePersonalEvent({
                      event_date: anchorIso,
                      event_end_date: anchorIso,
                      start_time: '09:00',
                      end_time: '10:00'
                    })
                  }
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                >
                  <PlusCircle size={13} />
                  <span>New Personal Event</span>
                </button>
              )}
              {(scope === 'unified' || scope === 'meetings') && (
                <button
                  type="button"
                  onClick={() =>
                    onCreateItMeeting({
                      meeting_date: anchorIso,
                      start_time: '2pm',
                      end_time: '4PM'
                    })
                  }
                  className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    scope === 'meetings'
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <CalendarPlus size={13} />
                  <span>New IT Meeting</span>
                </button>
              )}
            </div>
          </div>

          {/* Selected Day Agenda Summary */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {anchorIso === todayIso ? 'Today’s Agenda' : `Agenda · ${anchorIso}`}
              </h3>
              <span className="text-[11px] font-mono tabular-nums text-slate-400">
                {anchorDayAgenda.length}
              </span>
            </div>

            {anchorDayAgenda.length === 0 ? (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                No events scheduled for this day. Click any date or time slot on the grid to add one.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                {anchorDayAgenda.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedItemKey(item.key)}
                    className={`w-full text-left p-2 rounded-xl border text-xs transition-colors cursor-pointer ${getToneClasses(
                      item,
                      selectedItemKey === item.key
                    )}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-mono tabular-nums opacity-80">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getSourceIndicatorColor(item)}`} />
                      <span className="truncate">
                        {item.startTimeLabel}
                        {item.endTimeLabel ? ` – ${item.endTimeLabel}` : ''}
                      </span>
                    </div>
                    <p className="font-semibold truncate mt-0.5">{item.title}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center Main Calendar Grid */}
        <div className="flex-1 min-w-0 w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, idx) => (
                  <div key={idx} className="h-6 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 28 }).map((_, idx) => (
                  <div key={idx} className="h-24 rounded-xl bg-slate-50 dark:bg-slate-800/60 animate-pulse" />
                ))}
              </div>
            </div>
          ) : viewMode === 'month' ? (
            /* ================= MONTH VIEW ================= */
            <div>
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                {WEEKDAY_SHORT.map((dayName) => (
                  <div
                    key={dayName}
                    className="py-2 px-2 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-r last:border-r-0 border-slate-100 dark:border-slate-800"
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {monthWeeks.map((week, wIdx) => {
                  const weekStartIso = toDateIso(week[0]);
                  const weekEndIso = toDateIso(week[6]);

                  // Multi-day spanning events intersecting this week
                  const multiDaySegments = visibleItems
                    .filter((item) => item.isMultiDay && item.endDate >= weekStartIso && item.startDate <= weekEndIso)
                    .map((item) => {
                      const clippedStart = item.startDate < weekStartIso ? weekStartIso : item.startDate;
                      const clippedEnd = item.endDate > weekEndIso ? weekEndIso : item.endDate;
                      const startIdx = week.findIndex((d) => toDateIso(d) === clippedStart);
                      const endIdx = week.findIndex((d) => toDateIso(d) === clippedEnd);
                      const colStart = Math.max(0, startIdx);
                      const spanCols = Math.max(1, endIdx - colStart + 1);
                      return { item, colStart, spanCols };
                    });

                  return (
                    <div key={wIdx} className="relative min-h-[116px] sm:min-h-[132px]">
                      {/* Background Layer: Full-height clickable 7-day columns with continuous vertical borders */}
                      <div className="absolute inset-0 grid grid-cols-7">
                        {week.map((dayDate) => {
                          const iso = toDateIso(dayDate);
                          const isCurrentMonth = dayDate.getMonth() === anchorDate.getMonth();
                          const isToday = iso === todayIso;
                          return (
                            <div
                              key={iso}
                              onClick={() => handleEmptySlotClick(iso, 9 * 60)}
                              className={`border-r last:border-r-0 border-slate-100 dark:border-slate-800 transition-colors cursor-pointer group ${
                                !isCurrentMonth
                                  ? 'bg-slate-50/60 dark:bg-slate-950/40'
                                  : isToday
                                  ? 'bg-indigo-50/30 dark:bg-indigo-950/20'
                                  : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/30'
                              }`}
                            />
                          );
                        })}
                      </div>

                      {/* Foreground Layer: Day numbers + Multi-day bars + Single-day events */}
                      <div className="relative z-10 pointer-events-none flex flex-col pb-1.5">
                        {/* Row 1: Day Numbers */}
                        <div className="grid grid-cols-7">
                          {week.map((dayDate) => {
                            const iso = toDateIso(dayDate);
                            const isCurrentMonth = dayDate.getMonth() === anchorDate.getMonth();
                            const isToday = iso === todayIso;
                            const isSelectedDay = iso === anchorIso;
                            return (
                              <div key={iso} className="flex items-center justify-between px-1.5 pt-1.5 pb-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAnchorDate(dayDate);
                                  }}
                                  className={`pointer-events-auto inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono tabular-nums transition-colors cursor-pointer ${
                                    isToday
                                      ? 'bg-indigo-600 text-white font-bold'
                                      : isSelectedDay
                                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold'
                                      : isCurrentMonth
                                      ? 'text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-200/70 dark:hover:bg-slate-700'
                                      : 'text-slate-400 dark:text-slate-600'
                                  }`}
                                  title={`Select ${iso}`}
                                >
                                  {dayDate.getDate()}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEmptySlotClick(iso, 9 * 60);
                                  }}
                                  className="pointer-events-auto p-0.5 rounded text-slate-400 hover:text-indigo-600 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                                  title={`Schedule on ${iso}`}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Row 2: Multi-Day Spanning Bars */}
                        {multiDaySegments.length > 0 && (
                          <div className="grid grid-cols-7 gap-1 px-1 mb-1">
                            {multiDaySegments.slice(0, 2).map(({ item, colStart, spanCols }) => (
                              <button
                                key={`${item.key}-w${wIdx}`}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItemKey(item.key);
                                }}
                                style={{
                                  gridColumn: `${colStart + 1} / span ${spanCols}`
                                }}
                                className={`pointer-events-auto text-left px-2 py-0.5 rounded-md border text-[11px] font-semibold truncate flex items-center gap-1.5 transition-colors cursor-pointer ${getToneClasses(
                                  item,
                                  selectedItemKey === item.key
                                )}`}
                                title={`${item.title} (${item.startDate} → ${item.endDate})`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getSourceIndicatorColor(item)}`} />
                                <span className="truncate">{item.title}</span>
                                <span className="hidden sm:inline font-mono text-[10px] opacity-75 shrink-0">
                                  {item.startDate.slice(5)}→{item.endDate.slice(5)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Row 3: Single-Day Events per Cell */}
                        <div className="grid grid-cols-7">
                          {week.map((dayDate) => {
                            const iso = toDateIso(dayDate);
                            const dayItems = visibleItems.filter(
                              (i) => !i.isMultiDay && i.startDate === iso
                            );
                            const multiDayInDayCount = multiDaySegments.filter(
                              (seg) =>
                                seg.item.startDate <= iso &&
                                seg.item.endDate >= iso
                            ).length;
                            const maxSingleVisible = Math.max(1, 3 - Math.min(2, multiDayInDayCount));
                            const shownItems = dayItems.slice(0, maxSingleVisible);
                            const overflowCount = Math.max(0, dayItems.length - shownItems.length);

                            return (
                              <div key={iso} className="px-1.5 space-y-1 min-w-0">
                                {shownItems.map((item) => (
                                  <button
                                    key={item.key}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedItemKey(item.key);
                                    }}
                                    className={`pointer-events-auto w-full text-left px-1.5 py-1 rounded-md border text-[11px] leading-tight flex items-center gap-1 transition-colors cursor-pointer ${getToneClasses(
                                      item,
                                      selectedItemKey === item.key
                                    )}`}
                                    title={`${item.startTimeLabel} · ${item.title}`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${getSourceIndicatorColor(item)}`}
                                    />
                                    <span className="hidden sm:inline font-mono tabular-nums text-[10px] opacity-75 shrink-0">
                                      {item.startTimeLabel}
                                    </span>
                                    <span className="font-semibold truncate">{item.title}</span>
                                  </button>
                                ))}

                                {overflowCount > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAnchorDate(dayDate);
                                      setViewMode('day');
                                    }}
                                    className="pointer-events-auto w-full text-left px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                  >
                                    +{overflowCount} more
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ================= WORK WEEK / WEEK / DAY TIME-GRID VIEW ================= */
            <div className="overflow-x-auto">
              <div className={viewMode === 'day' ? 'min-w-[340px]' : 'min-w-[680px]'}>
                {/* Sticky Day Column Headers */}
                <div
                  className="grid border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40"
                  style={{
                    gridTemplateColumns: `64px repeat(${timeGridDays.length}, minmax(0, 1fr))`
                  }}
                >
                  <div className="py-2.5 px-2 text-[10px] font-mono text-slate-400 flex items-end justify-end border-r border-slate-200 dark:border-slate-800">
                    Local
                  </div>
                  {timeGridDays.map((d) => {
                    const iso = toDateIso(d);
                    const isToday = iso === todayIso;
                    return (
                      <div
                        key={iso}
                        onClick={() => setAnchorDate(d)}
                        className={`py-2 px-3 border-r last:border-r-0 border-slate-200 dark:border-slate-800 flex items-center gap-2 cursor-pointer ${
                          isToday ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                        }`}
                      >
                        <span
                          className={`text-[11px] font-semibold ${
                            isToday ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {WEEKDAY_SHORT[d.getDay()]}
                        </span>
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono tabular-nums font-bold ${
                            isToday
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {d.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* All-Day / Multi-Day Strip */}
                {(() => {
                  const rangeStart = toDateIso(timeGridDays[0]);
                  const rangeEnd = toDateIso(timeGridDays[timeGridDays.length - 1]);
                  const multiDayItems = visibleItems.filter(
                    (i) => i.isMultiDay && i.endDate >= rangeStart && i.startDate <= rangeEnd
                  );
                  if (multiDayItems.length === 0) return null;

                  return (
                    <div
                      className="grid border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60"
                      style={{
                        gridTemplateColumns: `64px repeat(${timeGridDays.length}, minmax(0, 1fr))`
                      }}
                    >
                      <div className="py-2 px-2 text-[10px] font-semibold text-slate-400 text-right border-r border-slate-200 dark:border-slate-800">
                        Multi-day
                      </div>
                      <div
                        className="p-1.5 grid gap-1"
                        style={{
                          gridColumn: `2 / span ${timeGridDays.length}`,
                          gridTemplateColumns: `repeat(${timeGridDays.length}, minmax(0, 1fr))`
                        }}
                      >
                        {multiDayItems.map((item) => {
                          const clippedStart = item.startDate < rangeStart ? rangeStart : item.startDate;
                          const clippedEnd = item.endDate > rangeEnd ? rangeEnd : item.endDate;
                          const sIdx = Math.max(
                            0,
                            timeGridDays.findIndex((d) => toDateIso(d) === clippedStart)
                          );
                          const eIdx = Math.max(
                            sIdx,
                            timeGridDays.findIndex((d) => toDateIso(d) === clippedEnd)
                          );
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setSelectedItemKey(item.key)}
                              style={{
                                gridColumn: `${sIdx + 1} / span ${eIdx - sIdx + 1}`
                              }}
                              className={`text-left px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-2 truncate cursor-pointer ${getToneClasses(
                                item,
                                selectedItemKey === item.key
                              )}`}
                            >
                              <span className={`w-2 h-2 rounded-full shrink-0 ${getSourceIndicatorColor(item)}`} />
                              <span className="truncate">{item.title}</span>
                              <span className="font-mono text-[10px] opacity-75 shrink-0">
                                {item.startDate} → {item.endDate}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Scrollable 24-Hour Time Grid */}
                <div
                  ref={timeGridScrollRef}
                  className="max-h-[600px] overflow-y-auto relative"
                >
                  <div
                    className="grid relative"
                    style={{
                      gridTemplateColumns: `64px repeat(${timeGridDays.length}, minmax(0, 1fr))`,
                      height: `${24 * HOUR_HEIGHT_PX}px`
                    }}
                  >
                    {/* Left Sticky Time Gutter */}
                    <div className="border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          style={{ height: `${HOUR_HEIGHT_PX}px` }}
                          className="relative pr-2 text-right"
                        >
                          {h > 0 && (
                            <span className="text-[10px] font-mono tabular-nums text-slate-400 -translate-y-2 inline-block">
                              {formatHourLabel(h)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Day Columns */}
                    {timeGridDays.map((dayDate) => {
                      const iso = toDateIso(dayDate);
                      const isToday = iso === todayIso;
                      const dayTimed = visibleItems.filter(
                        (item) => !item.isMultiDay && item.startDate === iso
                      );
                      const positioned = layoutDayTimedItems(dayTimed);

                      return (
                        <div
                          key={iso}
                          className={`relative border-r last:border-r-0 border-slate-200 dark:border-slate-800 ${
                            isToday ? 'bg-indigo-50/15 dark:bg-indigo-950/10' : ''
                          }`}
                        >
                          {/* Clickable Hour Slots */}
                          {HOURS.map((h) => (
                            <div
                              key={h}
                              onClick={() => handleEmptySlotClick(iso, h * 60)}
                              style={{ height: `${HOUR_HEIGHT_PX}px` }}
                              className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer group relative"
                              title={`Click to schedule on ${iso} at ${formatHourLabel(h)}`}
                            >
                              <span className="hidden group-hover:inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 px-2 py-1">
                                <Plus size={11} />
                                <span>{formatHourLabel(h)}</span>
                              </span>
                            </div>
                          ))}

                          {/* Live Current Time Line */}
                          {isToday && (
                            <div
                              className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                              style={{ top: `${(nowMinutes / 60) * HOUR_HEIGHT_PX}px` }}
                            >
                              <span className="w-2 h-2 rounded-full bg-rose-600 -ml-1 shrink-0" />
                              <div className="h-[1.5px] bg-rose-600 flex-1" />
                            </div>
                          )}

                          {/* Timed Event Blocks */}
                          {positioned.map(({ item, startMins, endMins, col, totalCols }) => {
                            const topPx = (startMins / 60) * HOUR_HEIGHT_PX + 1;
                            const heightPx = Math.max(26, ((endMins - startMins) / 60) * HOUR_HEIGHT_PX - 2);
                            const widthPct = 100 / totalCols;
                            const leftPct = col * widthPct;

                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedItemKey(item.key);
                                }}
                                style={{
                                  top: `${topPx}px`,
                                  height: `${heightPx}px`,
                                  left: `calc(${leftPct}% + 2px)`,
                                  width: `calc(${widthPct}% - 4px)`
                                }}
                                className={`absolute z-10 rounded-lg border px-2 py-1 text-left overflow-hidden flex flex-col justify-start transition-shadow hover:shadow-md cursor-pointer ${getToneClasses(
                                  item,
                                  selectedItemKey === item.key
                                )}`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${getSourceIndicatorColor(item)}`}
                                  />
                                  <span className="text-[11px] font-bold truncate">{item.title}</span>
                                </div>
                                {heightPx >= 38 && (
                                  <div className="text-[10px] font-mono tabular-nums opacity-80 truncate mt-0.5">
                                    {item.startTimeLabel}
                                    {item.endTimeLabel ? ` – ${item.endTimeLabel}` : ''}
                                    {item.location ? ` · ${item.location}` : ''}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Event Detail Drawer (when an event is clicked) */}
        {selectedItem && (
          <aside className="w-full xl:w-[340px] shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            {/* Drawer Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className={`w-2 h-2 rounded-full ${getSourceIndicatorColor(selectedItem)}`} />
                  <span>
                    {selectedItem.source === 'it_meeting'
                      ? 'IT Meeting'
                      : `My Scheduler · ${selectedItem.categoryLabel}`}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {selectedItem.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedItemKey(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close event details"
              >
                <X size={16} />
              </button>
            </div>

            {/* Schedule & Room Metadata */}
            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2 font-mono tabular-nums">
                <Calendar size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedItem.endDate !== selectedItem.startDate
                    ? `${selectedItem.startDate} – ${selectedItem.endDate}`
                    : selectedItem.startDate}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono tabular-nums">
                <Clock size={14} className="text-slate-400 shrink-0" />
                <span>
                  {selectedItem.startTimeLabel}
                  {selectedItem.endTimeLabel ? ` – ${selectedItem.endTimeLabel}` : ''}
                </span>
              </div>

              {selectedItem.location && (
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{selectedItem.location}</span>
                    {selectedItem.roomNote && (
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                        {selectedItem.roomNote}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedItem.organizerOrHost && (
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400 shrink-0" />
                  <span>
                    {selectedItem.source === 'it_meeting' ? 'Organizer: ' : 'Host: '}
                    <strong className="text-slate-900 dark:text-slate-100">{selectedItem.organizerOrHost}</strong>
                  </span>
                </div>
              )}

              {/* Status Control */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-slate-500 dark:text-slate-400">Status</span>
                {selectedItem.source === 'personal_event' && selectedItem.rawPersonalEvent ? (
                  <select
                    aria-label="Event status"
                    value={selectedItem.rawPersonalEvent.status}
                    onChange={(e) =>
                      onUpdatePersonalStatus(
                        selectedItem.rawPersonalEvent!,
                        e.target.value as PersonalEventRecord['status']
                      )
                    }
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Joined">Joined</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedItem.status}
                  </span>
                )}
              </div>
            </div>

            {/* Online Join Link Action */}
            {selectedItem.joinUrl && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <Link2 size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>{detectJoinPlatform(selectedItem.joinUrl) || 'Meeting Link'}</span>
                </div>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                  {selectedItem.joinUrl}
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedItem.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (
                        selectedItem.source === 'personal_event' &&
                        selectedItem.rawPersonalEvent &&
                        selectedItem.rawPersonalEvent.status === 'Upcoming'
                      ) {
                        onUpdatePersonalStatus(selectedItem.rawPersonalEvent, 'Joined');
                      }
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap transition-colors"
                  >
                    <span>Join Online</span>
                    <ExternalLink size={12} />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyJoinUrl(selectedItem)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {copiedJoinKey === selectedItem.key ? (
                      <Check size={12} className="text-emerald-600" />
                    ) : (
                      <Copy size={12} />
                    )}
                    <span>{copiedJoinKey === selectedItem.key ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Agenda / Prep Notes */}
            {selectedItem.notesOrAgenda && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {selectedItem.source === 'it_meeting' ? 'Provisional Agenda' : 'Prep Notes'}
                </span>
                <pre className="text-xs font-sans text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-3 max-h-40 overflow-y-auto leading-relaxed">
                  {selectedItem.notesOrAgenda}
                </pre>
              </div>
            )}

            {/* Live Notes Link & Action */}
            <div className="p-3 rounded-xl border border-indigo-200/80 dark:border-indigo-800/70 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200 truncate">
                  <NotebookPen size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="truncate">
                    {selectedItem.linkedNoteTitle || 'Meeting & Event Notes'}
                  </span>
                </span>
              </div>
              {selectedItem.linkedNoteExcerpt && (
                <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {selectedItem.linkedNoteExcerpt}
                </p>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onOpenLiveNotes({
                      sourceType: selectedItem.source,
                      sourceId: selectedItem.id,
                      title: selectedItem.title,
                      date:
                        selectedItem.endDate !== selectedItem.startDate
                          ? `${selectedItem.startDate} – ${selectedItem.endDate}`
                          : selectedItem.startDate,
                      timeRange: selectedItem.endTimeLabel
                        ? `${selectedItem.startTimeLabel} – ${selectedItem.endTimeLabel}`
                        : selectedItem.startTimeLabel,
                      location: selectedItem.location || 'TBD',
                      hostOrOrganizer: selectedItem.organizerOrHost || 'Self',
                      joinUrl: selectedItem.joinUrl || undefined,
                      agendaOrNotes: selectedItem.notesOrAgenda,
                      linkedNoteId: selectedItem.linkedNoteId,
                      initialMode: 'edit'
                    })
                  }
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/70 cursor-pointer"
                >
                  <NotebookPen size={12} />
                  <span>{selectedItem.linkedNoteId ? 'Edit Notes' : 'Take Notes'}</span>
                </button>
                {selectedItem.linkedNoteId && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenLiveNotes({
                        sourceType: selectedItem.source,
                        sourceId: selectedItem.id,
                        title: selectedItem.title,
                        date:
                          selectedItem.endDate !== selectedItem.startDate
                            ? `${selectedItem.startDate} – ${selectedItem.endDate}`
                            : selectedItem.startDate,
                        timeRange: selectedItem.endTimeLabel
                          ? `${selectedItem.startTimeLabel} – ${selectedItem.endTimeLabel}`
                          : selectedItem.startTimeLabel,
                        location: selectedItem.location || 'TBD',
                        hostOrOrganizer: selectedItem.organizerOrHost || 'Self',
                        joinUrl: selectedItem.joinUrl || undefined,
                        agendaOrNotes: selectedItem.notesOrAgenda,
                        linkedNoteId: selectedItem.linkedNoteId,
                        initialMode: 'view'
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/70 cursor-pointer"
                  >
                    <Eye size={12} />
                    <span>View</span>
                  </button>
                )}
              </div>
            </div>

            {/* Telegram Alert Status & Trigger */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Bell size={13} />
                  <span>Telegram Alert</span>
                </span>
                {selectedItem.alertSent ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={13} />
                    <span>Sent</span>
                  </span>
                ) : (
                  <span className="font-medium text-amber-700 dark:text-amber-300">
                    {selectedItem.source === 'personal_event'
                      ? formatLeadTimeText(selectedItem.reminderMinutesBefore ?? 15)
                      : 'Pending Broadcast'}
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={
                  selectedItem.source === 'it_meeting'
                    ? sendingMeetingAlertId === selectedItem.id
                    : sendingPersonalAlertId === selectedItem.id
                }
                onClick={() => {
                  if (selectedItem.source === 'it_meeting' && selectedItem.rawMeeting) {
                    onSendItMeetingAlert(selectedItem.rawMeeting);
                  } else if (selectedItem.rawPersonalEvent) {
                    onSendPersonalAlert(selectedItem.rawPersonalEvent);
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition-colors cursor-pointer disabled:opacity-60"
              >
                {(selectedItem.source === 'it_meeting'
                  ? sendingMeetingAlertId === selectedItem.id
                  : sendingPersonalAlertId === selectedItem.id) ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={12} className="text-indigo-600 dark:text-indigo-400" />
                    <span>
                      {selectedItem.source === 'it_meeting'
                        ? selectedItem.alertSent
                          ? 'Re-broadcast Alert'
                          : 'Broadcast Group Alert'
                        : 'Alert My Bot Now'}
                    </span>
                  </>
                )}
              </button>

              {/* Edit & Delete Footer */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedItem.source === 'it_meeting' && selectedItem.rawMeeting) {
                      onEditItMeeting(selectedItem.rawMeeting);
                    } else if (selectedItem.rawPersonalEvent) {
                      onEditPersonalEvent(selectedItem.rawPersonalEvent);
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedItem.source === 'it_meeting' && selectedItem.rawMeeting) {
                      onDeleteItMeeting(selectedItem.rawMeeting);
                    } else if (selectedItem.rawPersonalEvent) {
                      onDeletePersonalEvent(selectedItem.rawPersonalEvent);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-800/80 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 cursor-pointer"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Unified Mode: Choose What to Schedule on Clicked Empty Slot */}
      <SmartModal
        open={Boolean(slotChooserDraft)}
        onClose={() => setSlotChooserDraft(null)}
        title="Schedule on Calendar Slot"
        subtitle={
          slotChooserDraft ? (
            <span className="font-mono tabular-nums">
              {slotChooserDraft.dateIso} · {slotChooserDraft.startTime24} – {slotChooserDraft.endTime24}
            </span>
          ) : undefined
        }
        icon={<CalendarPlus size={18} />}
        size="sm"
        footer={
          <Button type="button" variant="secondary" size="sm" onClick={() => setSlotChooserDraft(null)}>
            Cancel
          </Button>
        }
      >
        {slotChooserDraft && (
          <div className="space-y-3 text-xs">
            <button
              type="button"
              onClick={() => {
                const draft = slotChooserDraft;
                setSlotChooserDraft(null);
                onCreatePersonalEvent({
                  event_date: draft.dateIso,
                  event_end_date: draft.endDateIso,
                  start_time: draft.startTime24,
                  end_time: draft.endTime24
                });
              }}
              className="w-full text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer space-y-1"
            >
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                <Bell size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>My Scheduler — Personal Meeting / Event to Join</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Supports Event Start &amp; End Dates, Zoom/Meet/Teams link, room selection, and personal Telegram bot alerts.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                const draft = slotChooserDraft;
                setSlotChooserDraft(null);
                onCreateItMeeting({
                  meeting_date: draft.dateIso,
                  start_time: draft.startTime12,
                  end_time: draft.endTime12
                });
              }}
              className="w-full text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-900 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer space-y-1"
            >
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                <Users size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>Schedule &amp; IT Meetings — Team Broadcast</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Schedule an IT team meeting with provisional agenda, physical room, and multi-group Telegram broadcast.
              </p>
            </button>
          </div>
        )}
      </SmartModal>
    </div>
  );
};
