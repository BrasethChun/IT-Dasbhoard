import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  CheckSquare,
  Clock,
  Edit2,
  Megaphone,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Square,
  Trash2,
  Users
} from 'lucide-react';
import { Button } from './ui/Button';
import { SmartModal } from './ui/SmartModal';
import { ITMeetingTelegramGroup } from './ScheduleMeetingModal';
import { SystemUpdateRecord, formatSystemUpdatePreviewText } from './SystemUpdateModal';

interface SystemUpdatesPanelProps {
  updates: SystemUpdateRecord[];
  loading: boolean;
  availableGroups: ITMeetingTelegramGroup[];
  onCreateNew: () => void;
  onEdit: (record: SystemUpdateRecord) => void;
  onRefresh: () => void;
  onOpenTelegramSettings: () => void;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const SystemUpdatesPanel: React.FC<SystemUpdatesPanelProps> = ({
  updates,
  loading,
  availableGroups,
  onCreateNew,
  onEdit,
  onRefresh,
  onOpenTelegramSettings,
  onShowToast
}) => {
  const [filterStatus, setFilterStatus] = useState<'scheduled' | 'completed' | 'all'>('scheduled');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Dispatch confirmation modal state (Notice or Reminder)
  const [dispatchTarget, setDispatchTarget] = useState<{
    record: SystemUpdateRecord;
    mode: 'notice' | 'reminder';
  } | null>(null);
  const [dispatchGroupIds, setDispatchGroupIds] = useState<string[]>([]);
  const [isDispatching, setIsDispatching] = useState(false);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<SystemUpdateRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const configuredGroupsCount = useMemo(
    () => availableGroups.filter(g => Boolean(g.chat_id?.trim())).length,
    [availableGroups]
  );

  const filteredUpdates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return updates.filter((u) => {
      if (filterStatus === 'scheduled' && u.status !== 'Scheduled' && u.status !== 'In Progress') {
        return false;
      }
      if (filterStatus === 'completed' && u.status !== 'Completed' && u.status !== 'Cancelled') {
        return false;
      }
      if (!q) return true;
      return (
        u.application_name.toLowerCase().includes(q) ||
        u.update_reason.toLowerCase().includes(q) ||
        u.update_date.toLowerCase().includes(q) ||
        u.sign_off.toLowerCase().includes(q)
      );
    });
  }, [updates, filterStatus, searchQuery]);

  const scheduledCount = useMemo(
    () => updates.filter(u => u.status === 'Scheduled' || u.status === 'In Progress').length,
    [updates]
  );

  const resolveGroupNames = (groupIds: string[]): string[] => {
    if (!groupIds || groupIds.length === 0) {
      const defaults = availableGroups.filter(g => g.is_default && g.chat_id?.trim()).map(g => g.name);
      return defaults.length > 0 ? defaults : ['Default Configured Groups'];
    }
    return groupIds.map(id => {
      const match = availableGroups.find(g => g.id === id || g.chat_id === id);
      return match ? match.name : id;
    });
  };

  const openDispatchModal = (record: SystemUpdateRecord, mode: 'notice' | 'reminder') => {
    setDispatchTarget({ record, mode });
    if (record.target_groups && record.target_groups.length > 0) {
      setDispatchGroupIds(record.target_groups);
    } else {
      const defaults = availableGroups.filter(g => g.is_default && g.chat_id?.trim()).map(g => g.id);
      setDispatchGroupIds(defaults.length > 0 ? defaults : availableGroups.filter(g => g.chat_id?.trim()).map(g => g.id));
    }
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchTarget) return;
    setIsDispatching(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/system-updates/${dispatchTarget.record.id}/send-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          alert_type: dispatchTarget.mode,
          target_group_ids: dispatchGroupIds
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch Telegram message');
      }
      onShowToast(data.message || 'Telegram alert dispatched successfully!', 'success');
      setDispatchTarget(null);
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message || 'Error sending Telegram alert', 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleMarkStatus = async (record: SystemUpdateRecord, nextStatus: SystemUpdateRecord['status']) => {
    setUpdatingStatusId(record.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/system-updates/${record.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update status');
      }
      onShowToast(`Marked ${record.application_name} update as ${nextStatus}`, 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/system-updates/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to delete system update notice');
      }
      onShowToast('System update notice deleted', 'info');
      setDeleteTarget(null);
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message || 'Delete failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTimestamp = (iso?: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toolbar: Segmented Filter + Search + Telegram Readiness */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterStatus('scheduled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filterStatus === 'scheduled'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Scheduled ({scheduledCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filterStatus === 'completed'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Completed
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({updates.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search app, date, reason..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap">
          <button
            type="button"
            onClick={onOpenTelegramSettings}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Settings size={13} />
            <span className="tabular-nums">
              {configuredGroupsCount}/{availableGroups.length} Telegram Group(s) Ready
            </span>
          </button>

          <Button
            type="button"
            size="sm"
            onClick={onCreateNew}
            className="rounded-xl whitespace-nowrap shrink-0 gap-1.5"
          >
            <Plus size={14} />
            <span>New System Update Alert</span>
          </Button>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((idx) => (
            <div
              key={idx}
              className="h-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse p-5"
            />
          ))}
        </div>
      ) : filteredUpdates.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 py-14 px-6 text-center">
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center mb-4">
            <Megaphone size={22} className="text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
            {searchQuery || filterStatus !== 'all'
              ? 'No matching system update notices'
              : 'No system update notices scheduled yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-5 leading-relaxed">
            Create an eHospital or system maintenance announcement using your standard Telegram alert template and schedule automatic pre-downtime reminders for user groups.
          </p>
          <Button type="button" size="sm" onClick={onCreateNew} className="gap-1.5 rounded-xl">
            <Plus size={14} />
            <span>New System Update Alert</span>
          </Button>
        </div>
      ) : (
        /* System Update Notices Grid */
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredUpdates.map((item) => {
            const previewMsg = formatSystemUpdatePreviewText(item, 'notice');
            const targetGroupNames = resolveGroupNames(item.target_groups);
            const initialSentLabel = formatTimestamp(item.initial_alert_sent_at);
            const reminderFireLabel = formatTimestamp(item.reminder_at_utc);
            const reminderSentLabel = formatTimestamp(item.reminder_sent_at);

            const statusBadge =
              item.status === 'Completed'
                ? { icon: CheckCircle2, cls: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800', label: 'Completed' }
                : item.status === 'Cancelled'
                  ? { icon: AlertCircle, cls: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700', label: 'Cancelled' }
                  : item.status === 'In Progress'
                    ? { icon: RefreshCw, cls: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800', label: 'In Progress' }
                    : { icon: AlertTriangle, cls: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800', label: 'Scheduled' };

            const StatusIcon = statusBadge.icon;

            return (
              <div
                key={item.id}
                className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Header Row: Title + Clean Unboxed Metadata + Status Label */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                      {item.application_name} Update Alert
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap tabular-nums">
                      <span>{item.update_date} ({item.date_label})</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{item.update_time}</span>
                      <span aria-hidden="true">·</span>
                      <span>Unavailable {item.downtime_duration}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.update_reason}</span>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold shrink-0 ${statusBadge.cls}`}>
                    <StatusIcon size={12} />
                    <span>{statusBadge.label}</span>
                  </span>
                </div>

                {/* Formatted Telegram Message Excerpt */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3.5 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto">
                  {previewMsg}
                </div>

                {/* Delivery & Reminder Status Summary (unboxed clean rows) */}
                <div className="space-y-1.5 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Send size={12} className={item.initial_alert_sent ? 'text-emerald-600' : 'text-slate-400'} />
                      <span>Initial Notice:</span>
                      <strong className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                        {item.initial_alert_sent
                          ? `Sent${initialSentLabel ? ` · ${initialSentLabel}` : ''}`
                          : 'Not sent yet'}
                      </strong>
                    </span>

                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <BellRing
                        size={12}
                        className={
                          item.reminder_sent
                            ? 'text-emerald-600'
                            : item.reminder_minutes_before > 0
                              ? 'text-amber-600'
                              : 'text-slate-400'
                        }
                      />
                      <span>Reminder:</span>
                      <strong className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                        {item.reminder_sent
                          ? `Sent${reminderSentLabel ? ` · ${reminderSentLabel}` : ''}`
                          : item.reminder_minutes_before > 0
                            ? `${item.reminder_minutes_before}m before${reminderFireLabel ? ` (${reminderFireLabel})` : ''}`
                            : 'Manual only'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <Users size={12} className="shrink-0 text-indigo-500" />
                    <span className="truncate">
                      Groups: {targetGroupNames.join(', ')} · Sign-off: {item.sign_off}
                    </span>
                  </div>

                  {item.last_alert_error && (
                    <div className="text-[11px] text-rose-600 dark:text-rose-400 pt-0.5">
                      Last dispatch warning: {item.last_alert_error}
                    </div>
                  )}
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => openDispatchModal(item, 'notice')}
                      className="rounded-lg h-8 px-3 text-xs gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Send size={12} />
                      <span>{item.initial_alert_sent ? 'Resend Notice' : 'Send Notice Now'}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => openDispatchModal(item, 'reminder')}
                      className="rounded-lg h-8 px-3 text-xs gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Clock size={12} />
                      <span>Send Reminder</span>
                    </Button>

                    {item.status === 'Scheduled' && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={updatingStatusId === item.id}
                        onClick={() => handleMarkStatus(item, 'Completed')}
                        className="rounded-lg h-8 px-2.5 text-xs gap-1 whitespace-nowrap shrink-0"
                      >
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>Mark Done</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit system update alert"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete system update alert"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-Group Telegram Dispatch Confirmation Modal */}
      <SmartModal
        open={Boolean(dispatchTarget)}
        onClose={() => !isDispatching && setDispatchTarget(null)}
        title={
          dispatchTarget?.mode === 'reminder'
            ? 'Send System Update Reminder to Telegram'
            : 'Send System Update Inform to Telegram'
        }
        subtitle={
          dispatchTarget
            ? `${dispatchTarget.record.application_name} · ${dispatchTarget.record.update_date} at ${dispatchTarget.record.update_time}`
            : undefined
        }
        icon={<Send size={16} />}
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isDispatching}
              onClick={() => setDispatchTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDispatching || (availableGroups.some(g => g.chat_id?.trim()) && dispatchGroupIds.length === 0)}
              onClick={handleConfirmDispatch}
              className="gap-1.5"
            >
              {isDispatching ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>
                    {dispatchTarget?.mode === 'reminder' ? 'Send Reminder' : 'Send Notice'} ({dispatchGroupIds.length} Group(s))
                  </span>
                </>
              )}
            </Button>
          </>
        }
      >
        {dispatchTarget && (
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Users size={13} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Target Telegram Groups ({dispatchGroupIds.length}/{availableGroups.length})</span>
                </span>
                {availableGroups.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setDispatchGroupIds(
                        dispatchGroupIds.length === availableGroups.length ? [] : availableGroups.map(g => g.id)
                      )
                    }
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {dispatchGroupIds.length === availableGroups.length ? 'Clear All' : 'Select All'}
                  </button>
                )}
              </div>

              {availableGroups.length === 0 ? (
                <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-[11px]">
                  No Telegram groups configured. Open Telegram Settings to add your bot token and group Chat IDs.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {availableGroups.map((group) => {
                    const checked = dispatchGroupIds.includes(group.id);
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() =>
                          setDispatchGroupIds(prev =>
                            prev.includes(group.id) ? prev.filter(id => id !== group.id) : [...prev, group.id]
                          )
                        }
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                          checked
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-700 text-indigo-950 dark:text-indigo-100 font-semibold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          {checked ? (
                            <CheckSquare size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                          ) : (
                            <Square size={14} className="text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{group.name}</span>
                        </span>
                        <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                          {group.chat_id?.trim() ? group.chat_id : 'No Chat ID'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <MessageSquare size={12} className="text-indigo-600 dark:text-indigo-400" />
                <span>Exact Telegram Message Preview</span>
              </span>
              <pre className="font-sans text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto leading-relaxed">
                {formatSystemUpdatePreviewText(dispatchTarget.record, dispatchTarget.mode)}
              </pre>
            </div>
          </div>
        )}
      </SmartModal>

      {/* Delete Confirmation Modal */}
      <SmartModal
        open={Boolean(deleteTarget)}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        title="Delete System Update Alert?"
        subtitle="Remove maintenance alert schedule and history"
        icon={<Trash2 size={18} className="text-rose-600" />}
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
            Delete the <strong className="font-semibold text-slate-900 dark:text-white">{deleteTarget.application_name}</strong> update alert scheduled for {deleteTarget.update_date} at {deleteTarget.update_time}?
          </p>
        )}
      </SmartModal>
    </div>
  );
};
