import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  Check,
  CheckSquare,
  Clock,
  Copy,
  Edit3,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Send,
  Settings,
  Square,
  Users
} from 'lucide-react';
import { Button } from './ui/Button';
import { SmartModal, SMART_INPUT_CLASS, SMART_TEXTAREA_CLASS } from './ui/SmartModal';
import { ITMeetingTelegramGroup } from './ScheduleMeetingModal';

export interface SystemUpdateRecord {
  id: string;
  user_id?: string | null;
  application_name: string;
  update_date: string;
  date_label: string;
  update_time: string;
  downtime_duration: string;
  update_reason: string;
  sign_off: string;
  custom_message?: string | null;
  target_groups: string[];
  initial_alert_sent: boolean;
  initial_alert_sent_at?: string | null;
  reminder_minutes_before: number;
  reminder_at_utc?: string | null;
  reminder_sent: boolean;
  reminder_sent_at?: string | null;
  alert_delivery_report?: any;
  last_alert_error?: string | null;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  created_at?: string;
  updated_at?: string;
}

export function getLocalTodayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function formatDefaultDatePhraseClient(dateStr?: string | null): string {
  const clean = (dateStr || '').slice(0, 10);
  if (!clean) return 'today';

  const todayStr = getLocalTodayIso();
  if (clean === todayStr) return 'today';

  const tmrw = new Date();
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

export function parseTimeTo24h(timeStr: string): string {
  const raw = (timeStr || '').trim();
  const match24 = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = Math.min(23, Math.max(0, parseInt(match24[1], 10)));
    const m = Math.min(59, Math.max(0, parseInt(match24[2], 10)));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const match12 = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2] || '0', 10);
    const mer = match12[3].toLowerCase();
    if (mer === 'pm' && h < 12) h += 12;
    if (mer === 'am' && h === 12) h = 0;
    return `${String(Math.min(23, Math.max(0, h))).padStart(2, '0')}:${String(Math.min(59, Math.max(0, m))).padStart(2, '0')}`;
  }
  return '21:00';
}

export function format24hTo12h(hhmm: string): string {
  const parts = (hhmm || '21:00').split(':');
  const h24 = parseInt(parts[0] || '21', 10);
  const mins = parseInt(parts[1] || '0', 10);
  if (isNaN(h24) || isNaN(mins)) return '9:00 PM';
  const mer = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mins).padStart(2, '0')} ${mer}`;
}

export function computeReminderUtcIso(
  dateStr: string,
  timeText: string,
  minutesBefore: number
): string | null {
  if (!dateStr || !minutesBefore || minutesBefore <= 0) return null;
  const hhmm = parseTimeTo24h(timeText);
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  if ([y, m, d, hh, mm].some((n) => isNaN(n))) return null;
  const targetLocal = new Date(y, m - 1, d, hh, mm, 0, 0);
  const reminderLocal = new Date(targetLocal.getTime() - minutesBefore * 60 * 1000);
  return reminderLocal.toISOString();
}

export function formatSystemUpdatePreviewText(
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
    : formatDefaultDatePhraseClient(data.update_date);
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
    const mins = Number(data.reminder_minutes_before || 0);
    const leadText = mins >= 60 && mins % 60 === 0
      ? `${mins / 60} hour${mins / 60 > 1 ? 's' : ''} before`
      : mins > 0
        ? `${mins} min before`
        : '';
    const header = leadText
      ? `⏰ REMINDER (${leadText} · ${app} update ${whenPhrase} at ${timeText})`
      : `⏰ REMINDER · Upcoming ${app} update ${whenPhrase} at ${timeText}`;
    return `${header}\n\n${baseMessage}`;
  }

  return baseMessage;
}

interface SystemUpdateModalProps {
  isOpen: boolean;
  updateRecord: SystemUpdateRecord | null;
  onClose: () => void;
  onSaved: (record: SystemUpdateRecord, alertSent: boolean) => void;
  onOpenTelegramSettings?: () => void;
}

export const SystemUpdateModal: React.FC<SystemUpdateModalProps> = ({
  isOpen,
  updateRecord,
  onClose,
  onSaved,
  onOpenTelegramSettings
}) => {
  const [applicationName, setApplicationName] = useState('eHospital');
  const [updateDate, setUpdateDate] = useState(getLocalTodayIso());
  const [dateLabel, setDateLabel] = useState('today');
  const [dateLabelTouched, setDateLabelTouched] = useState(false);
  const [updateTime, setUpdateTime] = useState('9:00 PM');
  const [timePickerVal, setTimePickerVal] = useState('21:00');
  const [downtimeDuration, setDowntimeDuration] = useState('45minutes');
  const [updateReason, setUpdateReason] = useState('For bug update');
  const [signOff, setSignOff] = useState('Head IT');
  const [status, setStatus] = useState<SystemUpdateRecord['status']>('Scheduled');
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number>(15);
  const [isCustomMessage, setIsCustomMessage] = useState(false);
  const [customMessageText, setCustomMessageText] = useState('');
  const [previewMode, setPreviewMode] = useState<'notice' | 'reminder'>('notice');
  const [sendAlertNow, setSendAlertNow] = useState(true);

  const [availableGroups, setAvailableGroups] = useState<ITMeetingTelegramGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadGroups = async () => {
      setLoadingConfig(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/it-meetings/telegram-config', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const groups: ITMeetingTelegramGroup[] = Array.isArray(data.groups) ? data.groups : [];
          setAvailableGroups(groups);

          if (updateRecord && Array.isArray(updateRecord.target_groups) && updateRecord.target_groups.length > 0) {
            setSelectedGroupIds(updateRecord.target_groups);
          } else {
            const defaults = groups.filter(g => g.is_default && g.chat_id?.trim()).map(g => g.id);
            const fallback = groups.filter(g => g.chat_id?.trim()).map(g => g.id);
            setSelectedGroupIds(defaults.length > 0 ? defaults : fallback);
          }
        }
      } catch (e) {
        console.warn('Failed to load Telegram config for System Update modal:', e);
      } finally {
        setLoadingConfig(false);
      }
    };

    loadGroups();
  }, [isOpen, updateRecord]);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setCopied(false);
    setPreviewMode('notice');

    if (updateRecord) {
      setApplicationName(updateRecord.application_name || 'eHospital');
      const d = (updateRecord.update_date || getLocalTodayIso()).slice(0, 10);
      setUpdateDate(d);
      setDateLabel(updateRecord.date_label || formatDefaultDatePhraseClient(d));
      setDateLabelTouched(true);
      const t = updateRecord.update_time || '9:00 PM';
      setUpdateTime(t);
      setTimePickerVal(parseTimeTo24h(t));
      setDowntimeDuration(updateRecord.downtime_duration || '45minutes');
      setUpdateReason(updateRecord.update_reason || 'For bug update');
      setSignOff(updateRecord.sign_off || 'Head IT');
      setStatus(updateRecord.status || 'Scheduled');
      setReminderMinutesBefore(Number(updateRecord.reminder_minutes_before ?? 15));
      if (updateRecord.custom_message && updateRecord.custom_message.trim()) {
        setIsCustomMessage(true);
        setCustomMessageText(updateRecord.custom_message);
      } else {
        setIsCustomMessage(false);
        setCustomMessageText('');
      }
      setSendAlertNow(false);
    } else {
      const today = getLocalTodayIso();
      setApplicationName('eHospital');
      setUpdateDate(today);
      setDateLabel('today');
      setDateLabelTouched(false);
      setUpdateTime('9:00 PM');
      setTimePickerVal('21:00');
      setDowntimeDuration('45minutes');
      setUpdateReason('For bug update');
      setSignOff('Head IT');
      setStatus('Scheduled');
      setReminderMinutesBefore(15);
      setIsCustomMessage(false);
      setCustomMessageText('');
      setSendAlertNow(true);
    }
  }, [isOpen, updateRecord]);

  const templatePreviewNotice = useMemo(() => {
    return formatSystemUpdatePreviewText(
      {
        application_name: applicationName,
        update_date: updateDate,
        date_label: dateLabel,
        update_time: updateTime,
        downtime_duration: downtimeDuration,
        update_reason: updateReason,
        sign_off: signOff,
        custom_message: null,
        reminder_minutes_before: reminderMinutesBefore
      },
      'notice'
    );
  }, [applicationName, updateDate, dateLabel, updateTime, downtimeDuration, updateReason, signOff, reminderMinutesBefore]);

  const activeMessageText = useMemo(() => {
    return formatSystemUpdatePreviewText(
      {
        application_name: applicationName,
        update_date: updateDate,
        date_label: dateLabel,
        update_time: updateTime,
        downtime_duration: downtimeDuration,
        update_reason: updateReason,
        sign_off: signOff,
        custom_message: isCustomMessage ? customMessageText : null,
        reminder_minutes_before: reminderMinutesBefore
      },
      previewMode
    );
  }, [
    applicationName,
    updateDate,
    dateLabel,
    updateTime,
    downtimeDuration,
    updateReason,
    signOff,
    isCustomMessage,
    customMessageText,
    reminderMinutesBefore,
    previewMode
  ]);

  const scheduledReminderLocalLabel = useMemo(() => {
    const iso = computeReminderUtcIso(updateDate, updateTime, reminderMinutesBefore);
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }, [updateDate, updateTime, reminderMinutesBefore]);

  const handleDateChange = (nextDate: string) => {
    setUpdateDate(nextDate);
    if (!dateLabelTouched) {
      setDateLabel(formatDefaultDatePhraseClient(nextDate));
    }
  };

  const handleTimePickerChange = (hhmm: string) => {
    setTimePickerVal(hhmm);
    setUpdateTime(format24hTo12h(hhmm));
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(activeMessageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnableCustomEdit = () => {
    if (!isCustomMessage) {
      setCustomMessageText(templatePreviewNotice);
      setIsCustomMessage(true);
      setPreviewMode('notice');
    }
  };

  const handleResetTemplate = () => {
    setIsCustomMessage(false);
    setCustomMessageText('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!applicationName.trim() || !updateDate) {
      setErrorMsg('Application name and update date are required.');
      return;
    }

    if (sendAlertNow && selectedGroupIds.length === 0 && availableGroups.some(g => g.chat_id?.trim())) {
      setErrorMsg('Please select at least one Telegram group to send the system update notice.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const reminderAtUtc = computeReminderUtcIso(updateDate, updateTime, reminderMinutesBefore);
      const payload = {
        application_name: applicationName.trim(),
        update_date: updateDate,
        date_label: dateLabel.trim() || formatDefaultDatePhraseClient(updateDate),
        update_time: updateTime.trim() || '9:00 PM',
        downtime_duration: downtimeDuration.trim() || '45minutes',
        update_reason: updateReason.trim() || 'For bug update',
        sign_off: signOff.trim() || 'Head IT',
        custom_message: isCustomMessage && customMessageText.trim() ? customMessageText.trim() : null,
        target_groups: selectedGroupIds,
        reminder_minutes_before: reminderMinutesBefore,
        reminder_at_utc: reminderAtUtc,
        status,
        send_alert_now: !updateRecord ? sendAlertNow : false
      };

      const url = updateRecord ? `/api/system-updates/${updateRecord.id}` : '/api/system-updates';
      const method = updateRecord ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save system update notice');
      }

      if (updateRecord && sendAlertNow) {
        const sendRes = await fetch(`/api/system-updates/${updateRecord.id}/send-alert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            alert_type: 'notice',
            target_group_ids: selectedGroupIds
          })
        });
        const sendData = await sendRes.json();
        if (!sendRes.ok) {
          throw new Error(sendData.error || 'Saved changes, but failed to send Telegram alert');
        }
        onSaved(sendData.record || data, true);
        onClose();
        return;
      }

      if (!updateRecord && sendAlertNow && data.alert_error && !data.alert_sent) {
        setErrorMsg(`Saved update schedule, but Telegram alert failed: ${data.alert_error}`);
        onSaved(data, false);
        setSaving(false);
        return;
      }

      onSaved(data, Boolean(data.alert_sent));
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SmartModal
      open={isOpen}
      onClose={onClose}
      title={updateRecord ? 'Edit System Update Alert' : 'New System Update Inform & Reminder'}
      subtitle="Configure eHospital / system maintenance details, live Telegram notice & pre-downtime reminder"
      icon={<AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />}
      size="2xl"
      footer={
        <div className="flex items-center justify-between w-full gap-3 flex-wrap">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            {reminderMinutesBefore > 0 && scheduledReminderLocalLabel
              ? `Auto-reminder scheduled: ${scheduledReminderLocalLabel}`
              : 'Auto-reminder disabled (manual send available anytime)'}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="system-update-form"
              size="sm"
              isLoading={saving}
              className="gap-1.5"
            >
              {sendAlertNow ? <Send size={14} /> : <Check size={14} />}
              <span>
                {saving
                  ? 'Saving...'
                  : sendAlertNow
                    ? `Save & Send to ${selectedGroupIds.length || 0} Group(s)`
                    : updateRecord
                      ? 'Save Changes'
                      : 'Save Schedule'}
              </span>
            </Button>
          </div>
        </div>
      }
    >
      <form id="system-update-form" onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-200">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT COLUMN: STRUCTURED CONFIGURATION */}
          <div className="lg:col-span-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Application Name *
                </label>
                <input
                  type="text"
                  required
                  value={applicationName}
                  onChange={(e) => setApplicationName(e.target.value)}
                  placeholder="eHospital"
                  className={SMART_INPUT_CLASS}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sign-off / Sender
                </label>
                <input
                  type="text"
                  value={signOff}
                  onChange={(e) => setSignOff(e.target.value)}
                  placeholder="Head IT"
                  className={SMART_INPUT_CLASS}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Update Date *
                </label>
                <input
                  type="date"
                  required
                  value={updateDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className={SMART_INPUT_CLASS}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date Phrase in Message
                </label>
                <input
                  type="text"
                  value={dateLabel}
                  onChange={(e) => {
                    setDateLabelTouched(true);
                    setDateLabel(e.target.value);
                  }}
                  placeholder="today"
                  className={SMART_INPUT_CLASS}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Update Time (24h Picker &amp; Display)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={timePickerVal}
                    onChange={(e) => handleTimePickerChange(e.target.value)}
                    className={`${SMART_INPUT_CLASS} w-[108px] shrink-0 tabular-nums`}
                    title="Pick exact maintenance start time"
                  />
                  <input
                    type="text"
                    value={updateTime}
                    onChange={(e) => {
                      setUpdateTime(e.target.value);
                      setTimePickerVal(parseTimeTo24h(e.target.value));
                    }}
                    placeholder="9:00 PM"
                    className={SMART_INPUT_CLASS}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unavailable Duration
                </label>
                <input
                  type="text"
                  value={downtimeDuration}
                  onChange={(e) => setDowntimeDuration(e.target.value)}
                  placeholder="45minutes"
                  className={SMART_INPUT_CLASS}
                />
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {['15minutes', '30minutes', '45minutes', '1 hour'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDowntimeDuration(preset)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer ${
                        downtimeDuration === preset
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Update Reason
                </label>
                <input
                  type="text"
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  placeholder="For bug update"
                  className={SMART_INPUT_CLASS}
                />
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {['For bug update', 'For system upgrade', 'For maintenance'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setUpdateReason(preset)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer ${
                        updateReason === preset
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Auto Reminder + Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <BellRing size={12} className="text-amber-600 dark:text-amber-400" />
                  <span>Auto-Reminder Before Downtime</span>
                </label>
                <select
                  value={reminderMinutesBefore}
                  onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                  className={SMART_INPUT_CLASS}
                >
                  <option value={0}>No automatic reminder</option>
                  <option value={15}>15 minutes before update</option>
                  <option value={30}>30 minutes before update</option>
                  <option value={60}>1 hour before update</option>
                  <option value={120}>2 hours before update</option>
                </select>
                {reminderMinutesBefore > 0 && scheduledReminderLocalLabel && (
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 tabular-nums">
                    <Clock size={10} />
                    <span>Fires automatically: {scheduledReminderLocalLabel}</span>
                  </p>
                )}
              </div>

              {updateRecord && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notice Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SystemUpdateRecord['status'])}
                    className={SMART_INPUT_CLASS}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>

            {/* Target Telegram Groups */}
            <div className="pt-1 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Users size={13} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Target Telegram Groups ({selectedGroupIds.length}/{availableGroups.length})</span>
                </label>
                <div className="flex items-center gap-2.5">
                  {availableGroups.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedGroupIds(
                          selectedGroupIds.length === availableGroups.length ? [] : availableGroups.map(g => g.id)
                        )
                      }
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {selectedGroupIds.length === availableGroups.length ? 'Clear All' : 'Select All'}
                    </button>
                  )}
                  {onOpenTelegramSettings && (
                    <button
                      type="button"
                      onClick={onOpenTelegramSettings}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <Settings size={11} />
                      <span>Configure</span>
                    </button>
                  )}
                </div>
              </div>

              {loadingConfig ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Loading Telegram groups...</span>
                </div>
              ) : availableGroups.length === 0 ? (
                <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-[11px] text-amber-800 dark:text-amber-200">
                  No Telegram groups configured yet. Open Telegram Settings to add your bot token and group Chat IDs.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
                  {availableGroups.map((group) => {
                    const checked = selectedGroupIds.includes(group.id);
                    const hasChatId = Boolean(group.chat_id?.trim());
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                          checked
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-950 dark:text-indigo-100 font-semibold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 min-w-0">
                          {checked ? (
                            <CheckSquare size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                          ) : (
                            <Square size={14} className="text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{group.name}</span>
                        </span>
                        <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                          {hasChatId ? 'Ready' : 'No ID'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <label className="flex items-center gap-2 pt-1 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendAlertNow}
                  onChange={(e) => setSendAlertNow(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  {updateRecord
                    ? 'Broadcast updated notice to selected Telegram group(s) immediately on save'
                    : 'Send initial announcement to selected Telegram group(s) immediately on save'}
                </span>
              </label>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE TELEGRAM PREVIEW & CUSTOM EDITOR */}
          <div className="lg:col-span-6 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <MessageSquare size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Live Telegram Message Preview
                </span>
              </div>

              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setPreviewMode('notice')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    previewMode === 'notice'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Initial Notice
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('reminder')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    previewMode === 'reminder'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Auto-Reminder
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">
                {isCustomMessage
                  ? 'Custom message active (manual override)'
                  : 'Synced automatically with template fields'}
              </span>
              <div className="flex items-center gap-2">
                {isCustomMessage ? (
                  <button
                    type="button"
                    onClick={handleResetTemplate}
                    className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Reset to Template</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnableCustomEdit}
                    className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Edit3 size={11} />
                    <span>Customize Text</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopyPreview}
                  className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {isCustomMessage && previewMode === 'notice' ? (
              <textarea
                rows={12}
                value={customMessageText}
                onChange={(e) => setCustomMessageText(e.target.value)}
                className={`${SMART_TEXTAREA_CLASS} font-sans text-xs leading-relaxed flex-1 min-h-[240px]`}
                placeholder="Customize Telegram announcement text..."
              />
            ) : (
              <div className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-4 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed min-h-[240px] max-h-[340px] overflow-y-auto">
                {activeMessageText}
              </div>
            )}

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Dispatches using the configured IT Telegram Bot to all selected groups. Auto-reminders automatically prepend the countdown notice before downtime.
            </p>
          </div>
        </div>
      </form>
    </SmartModal>
  );
};
