import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, MapPin, User, MessageSquare, Send, Check, Copy, AlertCircle, RefreshCw, Users, CheckSquare, Square } from 'lucide-react';
import { Button } from './ui/Button';

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
  created_at?: string;
  updated_at?: string;
}

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  meeting: ITMeetingRecord | null;
  onClose: () => void;
  onSaved: (meeting: ITMeetingRecord, alertSent: boolean) => void;
}

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
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Fetch configured Telegram groups on open
  useEffect(() => {
    if (!isOpen) return;

    const fetchConfig = async () => {
      setLoadingConfig(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/it-meetings/telegram-config', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const cfg = await res.json();
          const groups: ITMeetingTelegramGroup[] = cfg.groups || [];
          setAvailableGroups(groups);

          if (meeting && meeting.target_groups && meeting.target_groups.length > 0) {
            setSelectedGroupIds(meeting.target_groups);
          } else {
            // Default to groups marked as default (or all if none marked)
            const defaultIds = groups.filter(g => g.is_default).map(g => g.id);
            setSelectedGroupIds(defaultIds.length > 0 ? defaultIds : groups.map(g => g.id));
          }
        }
      } catch (e) {
        console.warn('Failed to load telegram config for meeting modal', e);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchConfig();
  }, [isOpen, meeting]);

  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title || 'IT Monthly Meeting');
      setMeetingDate(meeting.meeting_date || '2026-09-12');
      setDayOfWeekLabel(meeting.day_of_week_label || 'this coming Saturdays');
      setStartTime(meeting.start_time || '2pm');
      setEndTime(meeting.end_time || '4PM');
      setVenue(meeting.venue || 'Sakal Polyclinic');
      setRoomBookingNote(meeting.room_booking_note || '');
      setAgenda(meeting.agenda || DEFAULT_AGENDA);
      setOrganizerName(meeting.organizer_name || 'Braseth');
      setSendAlertNow(false);
      if (meeting.target_groups && meeting.target_groups.length > 0) {
        setSelectedGroupIds(meeting.target_groups);
      }
    } else {
      // Default initial meeting values
      setTitle('IT Monthly Meeting');
      setMeetingDate('2026-09-12');
      setDayOfWeekLabel('this coming Saturdays');
      setStartTime('2pm');
      setEndTime('4PM');
      setVenue('Sakal Polyclinic');
      setRoomBookingNote('Bunnarith, please help to book the meeting room');
      setAgenda(DEFAULT_AGENDA);
      setOrganizerName('Braseth');
      setSendAlertNow(true);
    }
    setErrorMsg(null);
  }, [meeting, isOpen]);

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
      onSaved(savedData, Boolean(savedData.telegram_alert_sent || savedData.alert_sent));
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving meeting');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {meeting ? 'Edit Scheduled Meeting' : 'Schedule New IT Meeting'}
              </h2>
              <p className="text-xs text-slate-500">
                Automated multi-group Telegram reminder dispatcher
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Meeting Title & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Meeting Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. IT Monthly Meeting"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Meeting Date *
              </label>
              <input
                type="date"
                required
                value={meetingDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-mono"
              />
            </div>
          </div>

          {/* Day of week phrase & Time range */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Day Label (in reminder)
              </label>
              <input
                type="text"
                placeholder="e.g. this coming Saturdays"
                value={dayOfWeekLabel}
                onChange={(e) => setDayOfWeekLabel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Clock size={12} className="text-indigo-500" />
                <span>Start Time</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 2pm"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Clock size={12} className="text-indigo-500" />
                <span>End Time</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 4PM"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Venue & Organizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <MapPin size={12} className="text-indigo-500" />
                <span>Venue Campus *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sakal Polyclinic"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <User size={12} className="text-indigo-500" />
                <span>Organizer Sign-off</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Braseth"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Room Booking Assignee Note */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Room Booking Note / Action Item
            </label>
            <input
              type="text"
              placeholder="e.g. Bunnarith, please help to book the meeting room"
              value={roomBookingNote}
              onChange={(e) => setRoomBookingNote(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none text-xs"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Will appear in parentheses directly after the venue in the Telegram alert.
            </span>
          </div>

          {/* Agenda items */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Provisional Agenda (Numbered List)
            </label>
            <textarea
              rows={4}
              required
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
            />
          </div>

          {/* TARGET TELEGRAM GROUPS (MULTI-GROUP BROADCAST) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users size={14} className="text-indigo-600" />
                <span>Target Telegram Broadcast Groups ({selectedGroupIds.length}/{availableGroups.length})</span>
              </span>
              {availableGroups.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllGroups}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
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
                          ? 'bg-indigo-50/90 border-indigo-200 text-indigo-950 font-semibold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="pt-0.5 text-indigo-600">
                        {isSelected ? <CheckSquare size={14} /> : <Square size={14} className="text-slate-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate">{group.name}</span>
                          {group.is_default && (
                            <span className="text-[9px] px-1 rounded bg-slate-100 text-slate-500 font-mono">
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
              <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                No Telegram groups configured. You can manage groups in Settings &gt; IT Meeting Alert.
              </div>
            )}
          </div>

          {/* Live Telegram Message Preview Card */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MessageSquare size={13} className="text-indigo-600" />
                <span>Live Telegram Message Alert Preview</span>
              </span>
              <button
                type="button"
                onClick={handleCopyPreview}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs"
              >
                {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            {selectedGroupNames.length > 0 && (
              <div className="text-[11px] text-indigo-800 bg-indigo-50/80 border border-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium">
                <Users size={12} className="text-indigo-600 shrink-0" />
                <span>Will broadcast to {selectedGroupNames.length} group(s): <strong>{selectedGroupNames.join(', ')}</strong></span>
              </div>
            )}

            <pre className="text-[11px] font-mono text-slate-800 bg-white p-3.5 rounded-xl border border-slate-200/90 whitespace-pre-wrap leading-relaxed shadow-2xs">
              {previewMessage}
            </pre>
          </div>

          {/* Instant Dispatch Checkbox (for new meetings) */}
          {!meeting && (
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendAlertNow}
                onChange={(e) => setSendAlertNow(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div>
                <span className="text-xs font-bold text-indigo-900 block">
                  Broadcast Telegram Alert to selected {selectedGroupIds.length} group(s) immediately upon saving
                </span>
                <span className="text-[11px] text-indigo-700/80 block">
                  Pushes this formatted reminder directly to all selected Telegram groups in parallel.
                </span>
              </div>
            </label>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md shadow-indigo-600/25 flex items-center gap-1.5"
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
          </div>
        </form>
      </div>
    </div>
  );
};
