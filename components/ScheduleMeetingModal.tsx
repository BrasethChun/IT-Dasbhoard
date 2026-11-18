import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, MapPin, User, MessageSquare, Send, Check, Copy, AlertCircle, RefreshCw, Users, CheckSquare, Square } from 'lucide-react';
import { Button } from './ui/Button';
import { SmartModal, SMART_INPUT_CLASS, SMART_TEXTAREA_CLASS } from './ui/SmartModal';

export interface ITMeetingTelegramGroup {
  id: string;
  name: string;
  chat_id: string;
  is_default: boolean;
}

export interface ITMeetingRecord {
  id: string;
  user_id?: string | null;
  title: string;
  meeting_date: string;
  day_of_week_label?: string | null;
  start_time: string;
  end_time: string;
  venue: string;
  room_booking_note?: string | null;
  agenda: string;
  organizer_name: string;
  telegram_alert_sent: boolean;
  last_alert_sent_at?: string | null;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  target_groups?: string[];
  alert_delivery_report?: any;
  linked_note_id?: string | null;
  linked_note_title?: string | null;
  linked_note_excerpt?: string | null;
  linked_note_updated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ITMeetingDraft {
  meeting_date?: string;
  start_time?: string;
  end_time?: string;
}

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  meeting: ITMeetingRecord | null;
  initialDraft?: ITMeetingDraft | null;
  onClose: () => void;
  onSaved: (meeting: ITMeetingRecord, alertSent: boolean, personalAlertSent?: boolean) => void;
}

const DEFAULT_PHYSICAL_ROOMS = [
  'KHEMA TK Meeting Room',
  'KHEMA BKK Meeting Room',
  'SAKAL Meeting Room'
];

const DEFAULT_AGENDA = `1- Monthly Reporting by Portfolios (including updates on any follow-ups from the last meeting)
2- Upcoming Planned Activities
3- AOB`;

export function formatMeetingPreviewText(data: {
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
  let dayLabel = 'Saturdays';
  let formattedDate = data.meeting_date || '12 September 2026';

  try {
    const parts = (data.meeting_date || '').split('-');
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
      
      dayLabel = dayNames[d.getDay()] || 'Saturdays';
      formattedDate = `${day} ${monthNames[month]} ${year}`;
    }
  } catch (e) {
    // fallback
  }

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

  return `Dear All,
 
Please be reminded of our IT monthly meeting on ${dayPrefix}, ${formattedDate} from ${startTime} to ${endTime}, ${locationText}.

Following are our provisional agenda:

${agenda}

Yours,

${organizer}`;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  meeting,
  initialDraft,
  onClose,
  onSaved
}) => {
  const [title, setTitle] = useState('IT Monthly Meeting');
  const [meetingDate, setMeetingDate] = useState('2026-09-12');
  const [dayOfWeekLabel, setDayOfWeekLabel] = useState('this coming Saturdays');
  const [startTime, setStartTime] = useState('2pm');
  const [endTime, setEndTime] = useState('4PM');
  const [venue, setVenue] = useState('Sakal Polyclinic');
  const [roomBookingNote, setRoomBookingNote] = useState('Bunnarith, please help to book the meeting room');
  const [agenda, setAgenda] = useState(DEFAULT_AGENDA);
  const [organizerName, setOrganizerName] = useState('Braseth');
  const [sendAlertNow, setSendAlertNow] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Multi-group state
  const [availableGroups, setAvailableGroups] = useState<ITMeetingTelegramGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [physicalRooms, setPhysicalRooms] = useState<string[]>(DEFAULT_PHYSICAL_ROOMS);
  const [isCustomVenue, setIsCustomVenue] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Fetch configured Telegram groups and physical rooms on open
  useEffect(() => {
    if (!isOpen) return;

    const fetchConfig = async () => {
      setLoadingConfig(true);
      try {
        const token = localStorage.getItem('token');
        const [cfgRes, personalRes] = await Promise.all([
          fetch('/api/it-meetings/telegram-config', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/personal-events/settings', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        let loadedRooms = [...DEFAULT_PHYSICAL_ROOMS];
        let loadedDefaultRoom = DEFAULT_PHYSICAL_ROOMS[0];

        if (personalRes.ok) {
          const pData = await personalRes.json();
          if (Array.isArray(pData.physical_rooms) && pData.physical_rooms.length > 0) {
            loadedRooms = pData.physical_rooms;
          }
          if (pData.default_physical_room) {
            loadedDefaultRoom = pData.default_physical_room;
          }
          setPhysicalRooms(loadedRooms);
        }

        if (cfgRes.ok) {
          const cfg = await cfgRes.json();
          const groups: ITMeetingTelegramGroup[] = cfg.groups || [];
          setAvailableGroups(groups);

          if (meeting && meeting.target_groups && meeting.target_groups.length > 0) {
            setSelectedGroupIds(meeting.target_groups);
          } else {
            const defaultIds = groups.filter(g => g.is_default).map(g => g.id);
            setSelectedGroupIds(defaultIds.length > 0 ? defaultIds : groups.map(g => g.id));
          }

          if (!meeting) {
            const defaultVenue = cfg.default_venue || loadedDefaultRoom;
            setVenue(defaultVenue);
            setIsCustomVenue(Boolean(defaultVenue) && !loadedRooms.includes(defaultVenue));
            if (cfg.default_room_note !== undefined) setRoomBookingNote(cfg.default_room_note || '');
            if (cfg.default_organizer) setOrganizerName(cfg.default_organizer);
            if (!initialDraft?.start_time && cfg.default_start_time) setStartTime(cfg.default_start_time);
            if (!initialDraft?.end_time && cfg.default_end_time) setEndTime(cfg.default_end_time);
          } else {
            const existingVenue = meeting.venue || '';
            setIsCustomVenue(Boolean(existingVenue) && !loadedRooms.includes(existingVenue));
          }
        }
      } catch (e) {
        console.warn('Failed to load telegram config for meeting modal', e);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, [isOpen, meeting, initialDraft]);

  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title || 'IT Monthly Meeting');
      setMeetingDate(meeting.meeting_date || '2026-09-12');
      setDayOfWeekLabel(meeting.day_of_week_label || 'this coming Saturdays');
      setStartTime(meeting.start_time || '2pm');
      setEndTime(meeting.end_time || '4PM');
      setVenue(meeting.venue || DEFAULT_PHYSICAL_ROOMS[2]);
      setRoomBookingNote(meeting.room_booking_note || '');
      setAgenda(meeting.agenda || DEFAULT_AGENDA);
      setOrganizerName(meeting.organizer_name || 'Braseth');
      setSendAlertNow(false);
      if (meeting.target_groups && meeting.target_groups.length > 0) {
        setSelectedGroupIds(meeting.target_groups);
      }
    } else {
      const draftDate = initialDraft?.meeting_date || '2026-09-12';
      let computedDayLabel = 'this coming Saturdays';
      try {
        const parts = draftDate.split('-');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
          const day = dayNames[d.getDay()];
          if (day) computedDayLabel = `this coming ${day}`;
        }
      } catch {}
      setTitle('IT Monthly Meeting');
      setMeetingDate(draftDate);
      setDayOfWeekLabel(computedDayLabel);
      setStartTime(initialDraft?.start_time || '2pm');
      setEndTime(initialDraft?.end_time || '4PM');
      setVenue(DEFAULT_PHYSICAL_ROOMS[2]);
      setRoomBookingNote('Bunnarith, please help to book the meeting room');
      setAgenda(DEFAULT_AGENDA);
      setOrganizerName('Braseth');
      setSendAlertNow(true);
    }
    setErrorMsg(null);
  }, [meeting, isOpen, initialDraft]);

  // Dynamically update day label when date changes if user hasn't heavily customized it
  const handleDateChange = (val: string) => {
    setMeetingDate(val);
    try {
      const parts = val.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
        const day = dayNames[d.getDay()];
        if (day) {
          setDayOfWeekLabel(`this coming ${day}`);
        }
      }
    } catch (e) {}
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSelectAllGroups = () => {
    if (selectedGroupIds.length === availableGroups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(availableGroups.map(g => g.id));
    }
  };

  const selectedGroupNames = useMemo(() => {
    return availableGroups
      .filter(g => selectedGroupIds.includes(g.id))
      .map(g => g.name);
  }, [availableGroups, selectedGroupIds]);

  const previewMessage = useMemo(() => {
    return formatMeetingPreviewText({
      title,
      meeting_date: meetingDate,
      day_of_week_label: dayOfWeekLabel,
      start_time: startTime,
      end_time: endTime,
      venue,
      room_booking_note: roomBookingNote,
      agenda,
      organizer_name: organizerName
    });
  }, [title, meetingDate, dayOfWeekLabel, startTime, endTime, venue, roomBookingNote, agenda, organizerName]);

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(previewMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !meetingDate) {
      setErrorMsg('Meeting Title and Date are required');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('token');
      const url = meeting ? `/api/it-meetings/${meeting.id}` : '/api/it-meetings';
      const method = meeting ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          meeting_date: meetingDate,
          day_of_week_label: dayOfWeekLabel.trim(),
          start_time: startTime.trim(),
          end_time: endTime.trim(),
          venue: venue.trim(),
          room_booking_note: roomBookingNote.trim() || null,
          agenda: agenda.trim(),
          organizer_name: organizerName.trim(),
          target_groups: selectedGroupIds,
          send_alert_now: !meeting && sendAlertNow
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save meeting');
      }

      const savedData = await res.json();
      onSaved(
        savedData,
        Boolean(savedData.telegram_alert_sent || savedData.alert_sent),
        Boolean(savedData.personal_alert_sent)
      );
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving meeting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SmartModal
      open={isOpen}
      onClose={onClose}
      title={meeting ? 'Edit Scheduled Meeting' : 'Schedule New IT Meeting'}
      subtitle="Automated multi-group Telegram reminder dispatcher"
      icon={<Calendar size={18} />}
      size="lg"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="schedule-meeting-form"
            size="sm"
            disabled={saving}
            className="gap-1.5"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving Meeting...</span>
              </>
            ) : (
              <>
                <Calendar size={14} />
                <span>{meeting ? 'Update Meeting' : sendAlertNow ? `Save & Alert ${selectedGroupIds.length} Group(s)` : 'Save Meeting'}</span>
              </>
            )}
          </Button>
        </>
      }
    >
      <form id="schedule-meeting-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Meeting Title & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Meeting Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. IT Monthly Meeting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={SMART_INPUT_CLASS}
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Meeting Date *
            </label>
            <input
              type="date"
              required
              value={meetingDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className={`${SMART_INPUT_CLASS} font-mono`}
            />
          </div>
        </div>

        {/* Day of week phrase & Time range */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Day Label (in reminder)
            </label>
            <input
              type="text"
              placeholder="e.g. this coming Saturdays"
              value={dayOfWeekLabel}
              onChange={(e) => setDayOfWeekLabel(e.target.value)}
              className={SMART_INPUT_CLASS}
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1">
              <Clock size={12} className="text-indigo-500" />
              <span>Start Time *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 2pm"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={SMART_INPUT_CLASS}
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1">
              <Clock size={12} className="text-indigo-500" />
              <span>End Time *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 4PM"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={SMART_INPUT_CLASS}
            />
          </div>
        </div>

        {/* Physical Location / Room & Organizer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1">
              <MapPin size={12} className="text-indigo-500" />
              <span>Physical Location / Room *</span>
            </label>
            <select
              value={
                isCustomVenue
                  ? '__custom__'
                  : physicalRooms.includes(venue)
                    ? venue
                    : '__custom__'
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__custom__') {
                  setIsCustomVenue(true);
                  if (physicalRooms.includes(venue)) setVenue('');
                } else {
                  setIsCustomVenue(false);
                  setVenue(val);
                }
              }}
              className={SMART_INPUT_CLASS}
            >
              {physicalRooms.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
              <option value="__custom__">Other / Custom location...</option>
            </select>
            {(isCustomVenue || !physicalRooms.includes(venue)) && (
              <input
                type="text"
                required
                placeholder="Enter custom venue or meeting room..."
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className={`${SMART_INPUT_CLASS} mt-1.5`}
              />
            )}
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1">
              <User size={12} className="text-indigo-500" />
              <span>Organizer Sign-off *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Braseth"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              className={SMART_INPUT_CLASS}
            />
          </div>
        </div>

        {/* Room Booking Assignee Note */}
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Room Booking Note / Action Item
          </label>
          <input
            type="text"
            placeholder="e.g. Bunnarith, please help to book the meeting room"
            value={roomBookingNote}
            onChange={(e) => setRoomBookingNote(e.target.value)}
            className={SMART_INPUT_CLASS}
          />
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
            Will appear in parentheses directly after the venue in the Telegram alert.
          </span>
        </div>

        {/* Agenda items */}
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Provisional Agenda (Numbered List) *
          </label>
          <textarea
            rows={4}
            required
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            className={`${SMART_TEXTAREA_CLASS} font-mono text-[11px] leading-relaxed`}
          />
        </div>

        {/* TARGET TELEGRAM GROUPS (MULTI-GROUP BROADCAST) */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Users size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>Target Telegram Broadcast Groups ({selectedGroupIds.length}/{availableGroups.length})</span>
            </span>
            {availableGroups.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllGroups}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                {selectedGroupIds.length === availableGroups.length ? 'Clear All' : 'Select All Groups'}
              </button>
            )}
          </div>

          {loadingConfig ? (
            <div className="text-[11px] text-slate-400 py-2">Loading configured Telegram groups...</div>
          ) : availableGroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {availableGroups.map((group) => {
                const isSelected = selectedGroupIds.includes(group.id);
                const hasChatId = Boolean(group.chat_id?.trim());
                return (
                  <div
                    key={group.id}
                    onClick={() => toggleGroupSelection(group.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-700 text-indigo-950 dark:text-indigo-100 font-semibold shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="pt-0.5 text-indigo-600 dark:text-indigo-400">
                      {isSelected ? <CheckSquare size={14} /> : <Square size={14} className="text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{group.name}</span>
                        {group.is_default && (
                          <span className="text-[9px] px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 truncate block">
                        {hasChatId ? group.chat_id : 'No chat ID configured'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
              No Telegram groups configured. You can manage groups in Settings &gt; IT Meeting Alert.
            </div>
          )}
        </div>

        {/* Live Telegram Message Preview Card */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <MessageSquare size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>Live Telegram Message Alert Preview</span>
            </span>
            <button
              type="button"
              onClick={handleCopyPreview}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>

          {selectedGroupNames.length > 0 && (
            <div className="text-[11px] text-indigo-800 dark:text-indigo-200 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium">
              <Users size={12} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Will broadcast to {selectedGroupNames.length} group(s): <strong>{selectedGroupNames.join(', ')}</strong></span>
            </div>
          )}

          <pre className="text-[11px] font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-700 whitespace-pre-wrap leading-relaxed shadow-2xs">
            {previewMessage}
          </pre>
        </div>

        {/* Instant Dispatch Checkbox (for new meetings) */}
        {!meeting && (
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendAlertNow}
              onChange={(e) => setSendAlertNow(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <div>
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block">
                Broadcast Telegram Alert to selected {selectedGroupIds.length} group(s) immediately upon saving
              </span>
              <span className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 block">
                Pushes this formatted reminder directly to all selected Telegram groups in parallel.
              </span>
            </div>
          </label>
        )}
      </form>
    </SmartModal>
  );
};
