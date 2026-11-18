import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Calendar, Clock, Link2, MapPin, MessageSquare, Send, User } from 'lucide-react';
import { Button } from './ui/Button';
import { SmartModal, SMART_INPUT_CLASS, SMART_TEXTAREA_CLASS } from './ui/SmartModal';

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

export interface PersonalEventDraft {
  event_date?: string;
  event_end_date?: string;
  start_time?: string;
  end_time?: string;
}

interface PersonalEventModalProps {
  isOpen: boolean;
  eventRecord: PersonalEventRecord | null;
  initialDraft?: PersonalEventDraft | null;
  telegramConfigured: boolean;
  physicalRooms?: string[];
  defaultPhysicalRoom?: string;
  onClose: () => void;
  onOpenTelegramSettings: () => void;
  onSaved: (record: PersonalEventRecord, alertSent: boolean, alertError?: string | null) => void;
}

export const DEFAULT_PHYSICAL_ROOMS = [
  'KHEMA TK Meeting Room',
  'KHEMA BKK Meeting Room',
  'SAKAL Meeting Room'
];

const LEAD_TIME_PRESETS = [
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before', value: 1440 },
  { label: 'At start time', value: 0 },
  { label: 'No auto reminder', value: -1 }
];

const EVENT_TYPES: PersonalEventRecord['event_type'][] = [
  'Meeting',
  'Vendor Call',
  'Workshop',
  'Training',
  'Event'
];

export function detectJoinPlatform(url?: string | null): string {
  const lower = (url || '').toLowerCase();
  if (!lower) return '';
  if (lower.includes('zoom.us')) return 'Zoom';
  if (lower.includes('meet.google.com')) return 'Google Meet';
  if (lower.includes('teams.microsoft.com') || lower.includes('teams.live.com')) return 'Microsoft Teams';
  if (lower.includes('webex.com')) return 'Webex';
  return 'Online Link';
}

export function formatLeadTimeText(minutes: number): string {
  if (minutes < 0) return 'Manual only';
  if (minutes === 0) return 'At start time';
  if (minutes === 1440) return '1d before';
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60}h before`;
  return `${minutes}m before`;
}

function computeReminderUtcIso(eventDate: string, startTime: string, leadMinutes: number): string | null {
  if (leadMinutes < 0 || !eventDate || !startTime) return null;
  const normalizedTime = /^\d{2}:\d{2}$/.test(startTime.trim()) ? `${startTime.trim()}:00` : '09:00:00';
  const localStart = new Date(`${eventDate}T${normalizedTime}`);
  if (isNaN(localStart.getTime())) return null;
  const triggerMs = localStart.getTime() - leadMinutes * 60 * 1000;
  return new Date(triggerMs).toISOString();
}

export const PersonalEventModal: React.FC<PersonalEventModalProps> = ({
  isOpen,
  eventRecord,
  initialDraft,
  telegramConfigured,
  physicalRooms,
  defaultPhysicalRoom,
  onClose,
  onOpenTelegramSettings,
  onSaved
}) => {
  const roomOptions = useMemo(() => {
    const list = Array.isArray(physicalRooms) && physicalRooms.length > 0
      ? physicalRooms
      : DEFAULT_PHYSICAL_ROOMS;
    return Array.from(new Set(list.map(r => r.trim()).filter(Boolean)));
  }, [physicalRooms]);

  const resolvedDefaultRoom = useMemo(() => {
    if (defaultPhysicalRoom && roomOptions.includes(defaultPhysicalRoom)) {
      return defaultPhysicalRoom;
    }
    return roomOptions[0] || DEFAULT_PHYSICAL_ROOMS[0];
  }, [defaultPhysicalRoom, roomOptions]);

  const todayIso = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<PersonalEventRecord['event_type']>('Meeting');
  const [eventStartDate, setEventStartDate] = useState(todayIso);
  const [eventEndDate, setEventEndDate] = useState(todayIso);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [joinUrl, setJoinUrl] = useState('');
  const [location, setLocation] = useState(resolvedDefaultRoom);
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [hostName, setHostName] = useState('');
  const [notes, setNotes] = useState('');
  const [leadChoice, setLeadChoice] = useState<number | 'custom'>(15);
  const [customLeadMinutes, setCustomLeadMinutes] = useState<string>('45');
  const [sendAlertNow, setSendAlertNow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSendAlertNow(false);

    if (eventRecord) {
      const recStart = eventRecord.event_date || todayIso;
      const recEnd = eventRecord.event_end_date || recStart;
      setTitle(eventRecord.title || '');
      setEventType(eventRecord.event_type || 'Meeting');
      setEventStartDate(recStart);
      setEventEndDate(recEnd);
      setStartTime(eventRecord.start_time || '09:00');
      setEndTime(eventRecord.end_time || '');
      setJoinUrl(eventRecord.join_url || '');
      const existingLoc = (eventRecord.location || '').trim();
      setLocation(existingLoc);
      setIsCustomLocation(
        Boolean(existingLoc) &&
        !roomOptions.includes(existingLoc) &&
        existingLoc !== 'Online / Remote'
      );
      setHostName(eventRecord.host_name || '');
      setNotes(eventRecord.notes || '');
      const mins = Number(eventRecord.reminder_minutes_before ?? 15);
      const isPreset = LEAD_TIME_PRESETS.some(p => p.value === mins);
      if (isPreset) {
        setLeadChoice(mins);
      } else {
        setLeadChoice('custom');
        setCustomLeadMinutes(String(Math.max(1, mins)));
      }
    } else {
      const draftStart = initialDraft?.event_date || todayIso;
      const draftEnd = initialDraft?.event_end_date || draftStart;
      setTitle('');
      setEventType('Meeting');
      setEventStartDate(draftStart);
      setEventEndDate(draftEnd);
      setStartTime(initialDraft?.start_time || '09:00');
      setEndTime(initialDraft?.end_time || '10:00');
      setJoinUrl('');
      setLocation(resolvedDefaultRoom);
      setIsCustomLocation(false);
      setHostName('');
      setNotes('');
      setLeadChoice(15);
      setCustomLeadMinutes('45');
    }
  }, [isOpen, eventRecord, initialDraft, todayIso, roomOptions, resolvedDefaultRoom]);

  const effectiveLeadMinutes = useMemo(() => {
    if (leadChoice === 'custom') {
      const parsed = parseInt(customLeadMinutes, 10);
      return isNaN(parsed) ? 15 : Math.max(0, parsed);
    }
    return leadChoice;
  }, [leadChoice, customLeadMinutes]);

  const livePreview = useMemo(() => {
    const timeStr = endTime ? `${startTime} – ${endTime}` : startTime;
    const dateDisplay = eventEndDate && eventEndDate !== eventStartDate
      ? `${eventStartDate} → ${eventEndDate}`
      : eventStartDate;
    const leadLabel =
      effectiveLeadMinutes < 0
        ? 'Schedule Reminder'
        : `Reminder (${formatLeadTimeText(effectiveLeadMinutes)})`;
    const lines = [
      `🔔 ${leadLabel}: ${title.trim() || 'Untitled Meeting / Event'}`,
      '',
      `Type: ${eventType}`,
      `Date: ${dateDisplay}`,
      `Time: ${timeStr}`
    ];
    if (hostName.trim()) lines.push(`Host: ${hostName.trim()}`);
    if (location.trim()) lines.push(`Location: ${location.trim()}`);
    if (joinUrl.trim()) {
      const platform = detectJoinPlatform(joinUrl);
      lines.push(`Join (${platform}): ${joinUrl.trim()}`);
    }
    if (notes.trim()) {
      lines.push('');
      lines.push('Notes:');
      lines.push(notes.trim());
    }
    return lines.join('\n');
  }, [title, eventType, eventStartDate, eventEndDate, startTime, endTime, hostName, location, joinUrl, notes, effectiveLeadMinutes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter an event or meeting title.');
      return;
    }
    if (!eventStartDate) {
      setErrorMsg('Please choose an event start date.');
      return;
    }
    const resolvedEndDate = eventEndDate || eventStartDate;
    if (resolvedEndDate < eventStartDate) {
      setErrorMsg('Event end date cannot be before event start date.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem('token');
      const reminderAtUtc = computeReminderUtcIso(eventStartDate, startTime, effectiveLeadMinutes);
      const isEdit = Boolean(eventRecord?.id);
      const url = isEdit ? `/api/personal-events/${eventRecord!.id}` : '/api/personal-events';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          event_type: eventType,
          event_date: eventStartDate,
          event_start_date: eventStartDate,
          event_end_date: resolvedEndDate,
          start_time: startTime,
          end_time: endTime,
          location: location.trim(),
          join_url: joinUrl.trim(),
          host_name: hostName.trim(),
          notes: notes.trim(),
          reminder_minutes_before: effectiveLeadMinutes,
          reminder_at_utc: reminderAtUtc,
          send_alert_now: !isEdit && sendAlertNow
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to save scheduled event.');
        setSaving(false);
        return;
      }

      onSaved(data, Boolean(data.alert_sent), data.alert_error || null);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while saving event.');
    } finally {
      setSaving(false);
    }
  };

  const detectedPlatform = detectJoinPlatform(joinUrl);

  return (
    <SmartModal
      open={isOpen}
      onClose={() => !saving && onClose()}
      title={eventRecord ? 'Edit Personal Event' : 'Schedule Meeting / Event to Join'}
      subtitle="Saved privately to your account with automatic personal Telegram bot alerts"
      icon={<Calendar size={18} />}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="personal-event-form" size="sm" isLoading={saving} className="gap-1.5">
            {sendAlertNow && !eventRecord ? <Send size={14} /> : <Bell size={14} />}
            <span>
              {eventRecord
                ? 'Save Changes'
                : sendAlertNow
                  ? 'Save & Alert My Bot'
                  : 'Save to My Scheduler'}
            </span>
          </Button>
        </>
      }
    >
      <form id="personal-event-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
        {!telegramConfigured && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200">
            <div>
              <p className="font-semibold">Personal Telegram Bot not connected yet</p>
              <p className="text-[11px] opacity-90">
                Add your own Bot Token and Chat ID in Telegram Settings to receive automated reminders.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTelegramSettings();
              }}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Configure Bot
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Meeting / Event Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Anzer LIS Upgrade Sync / Cloud Vendor Call"
              className={SMART_INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Event Type
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as PersonalEventRecord['event_type'])}
              className={SMART_INPUT_CLASS}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Event Start Date *
            </label>
            <input
              type="date"
              required
              value={eventStartDate}
              onChange={(e) => {
                const nextStart = e.target.value;
                const prevStart = eventStartDate;
                setEventStartDate(nextStart);
                if (!eventEndDate || eventEndDate === prevStart || (nextStart && eventEndDate < nextStart)) {
                  setEventEndDate(nextStart);
                }
              }}
              className={`${SMART_INPUT_CLASS} font-mono tabular-nums`}
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Event End Date *
            </label>
            <input
              type="date"
              required
              min={eventStartDate || undefined}
              value={eventEndDate}
              onChange={(e) => setEventEndDate(e.target.value)}
              className={`${SMART_INPUT_CLASS} font-mono tabular-nums`}
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Start Time *
            </label>
            <div className="relative">
              <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`${SMART_INPUT_CLASS} pl-8 font-mono tabular-nums`}
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              End Time
            </label>
            <div className="relative">
              <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`${SMART_INPUT_CLASS} pl-8 font-mono tabular-nums`}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Online Join Link (Zoom, Meet, Teams)
              </label>
              {detectedPlatform && (
                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                  {detectedPlatform}
                </span>
              )}
            </div>
            <div className="relative">
              <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={joinUrl}
                onChange={(e) => setJoinUrl(e.target.value)}
                placeholder="https://meet.google.com/... or zoom.us/j/..."
                className={`${SMART_INPUT_CLASS} pl-8`}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Physical Location / Room
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={
                  isCustomLocation
                    ? '__custom__'
                    : roomOptions.includes(location) || location === 'Online / Remote' || location === ''
                      ? location
                      : '__custom__'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__custom__') {
                    setIsCustomLocation(true);
                    if (roomOptions.includes(location) || location === 'Online / Remote') {
                      setLocation('');
                    }
                  } else {
                    setIsCustomLocation(false);
                    setLocation(val);
                  }
                }}
                className={`${SMART_INPUT_CLASS} pl-8`}
              >
                {roomOptions.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
                <option value="Online / Remote">Online / Remote</option>
                <option value="">None / Not specified</option>
                <option value="__custom__">Other / Custom location...</option>
              </select>
            </div>
            {(isCustomLocation || (location !== '' && !roomOptions.includes(location) && location !== 'Online / Remote')) && (
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter custom physical room or address..."
                className={`${SMART_INPUT_CLASS} mt-1.5`}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Host / Organizer
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="e.g. Vendor Team / IT Lead"
                className={`${SMART_INPUT_CLASS} pl-8`}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Personal Telegram Reminder Lead Time
            </label>
            <div className="flex items-center gap-2">
              <select
                value={leadChoice}
                onChange={(e) => {
                  const val = e.target.value;
                  setLeadChoice(val === 'custom' ? 'custom' : parseInt(val, 10));
                }}
                className={SMART_INPUT_CLASS}
              >
                {LEAD_TIME_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
                <option value="custom">Custom minutes...</option>
              </select>
              {leadChoice === 'custom' && (
                <input
                  type="number"
                  min={1}
                  max={10080}
                  value={customLeadMinutes}
                  onChange={(e) => setCustomLeadMinutes(e.target.value)}
                  className={`${SMART_INPUT_CLASS} w-24 font-mono tabular-nums`}
                  title="Minutes before event start"
                />
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Personal Prep Notes / Agenda
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Questions to raise, dial-in passcode, or items to review before joining..."
            className={SMART_TEXTAREA_CLASS}
          />
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <MessageSquare size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>Personal Telegram Bot Message Preview</span>
            </span>
            <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {formatLeadTimeText(effectiveLeadMinutes)}
            </span>
          </div>
          <pre className="text-[11px] font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700 leading-relaxed max-h-32 overflow-y-auto">
            {livePreview}
          </pre>
        </div>

        {!eventRecord && (
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={sendAlertNow}
              onChange={(e) => setSendAlertNow(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Also send an immediate test reminder to my personal Telegram bot on save</span>
          </label>
        )}
      </form>
    </SmartModal>
  );
};
