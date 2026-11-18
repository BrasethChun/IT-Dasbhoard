import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, FileText, ArrowUpRight, Calendar, Search, Bell, Trash2, Loader2, X,
  CalendarPlus, Send, CheckCircle2, Clock, MessageSquare, Edit2, AlertCircle, Sparkles, RefreshCw, MapPin, User,
  Users, CheckSquare, Square, Link2, ExternalLink, Copy, Check, BellRing, PlusCircle, NotebookPen, Eye,
  LayoutGrid, CalendarDays, Megaphone
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SmartModal } from '../../components/ui/SmartModal';
import { Note, RoutePath } from '../../types';
import { noteService } from '../../services/noteService';
import { StorageImage } from '../../components/ui/StorageImage';
import { SettingsModal, ITMeetingTelegramGroup, SettingsModalTab, DEFAULT_PHYSICAL_ROOMS } from './SettingsModal';
import { getDefaultCoverForNote, getCoverBadge } from '../../src/utils/sampleCovers';
import { ScheduleMeetingModal, ITMeetingRecord, ITMeetingDraft, formatMeetingPreviewText } from '../../components/ScheduleMeetingModal';
import {
  PersonalEventModal,
  PersonalEventRecord,
  PersonalEventDraft,
  detectJoinPlatform,
  formatLeadTimeText
} from '../../components/PersonalEventModal';
import { LiveMeetingNotesModal, LiveMeetingNoteTarget } from '../../components/LiveMeetingNotesModal';
import { OutlookCalendarDashboard } from '../../components/OutlookCalendarDashboard';
import { SystemUpdateModal, SystemUpdateRecord } from '../../components/SystemUpdateModal';
import { SystemUpdatesPanel } from '../../components/SystemUpdatesPanel';

export const MyNotes: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTabParam = searchParams.get('tab');
  const [activeSubView, setActiveSubView] = useState<'notes' | 'calendar' | 'meetings' | 'personal' | 'updates'>(
    initialTabParam === 'calendar' || initialTabParam === 'meetings' || initialTabParam === 'personal' || initialTabParam === 'updates'
      ? initialTabParam
      : 'notes'
  );
  const [meetingsDisplayMode, setMeetingsDisplayMode] = useState<'cards' | 'calendar'>('cards');
  const [personalDisplayMode, setPersonalDisplayMode] = useState<'cards' | 'calendar'>('cards');
  const [liveNoteTarget, setLiveNoteTarget] = useState<LiveMeetingNoteTarget | null>(null);

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [deleteNoteError, setDeleteNoteError] = useState<string | null>(null);

  // Scheduled IT Meetings state
  const [meetings, setMeetings] = useState<ITMeetingRecord[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<ITMeetingRecord | null>(null);
  const [meetingDraft, setMeetingDraft] = useState<ITMeetingDraft | null>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<ITMeetingRecord | null>(null);
  const [isDeletingMeeting, setIsDeletingMeeting] = useState(false);
  const [sendingMeetingAlertId, setSendingMeetingAlertId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [meetingFilter, setMeetingFilter] = useState<'upcoming' | 'all'>('upcoming');

  // Multi-group broadcast state
  const [availableGroups, setAvailableGroups] = useState<ITMeetingTelegramGroup[]>([]);
  const [broadcastMeetingModal, setBroadcastMeetingModal] = useState<ITMeetingRecord | null>(null);
  const [broadcastSelectedGroupIds, setBroadcastSelectedGroupIds] = useState<string[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Personal Scheduler state
  const [personalEvents, setPersonalEvents] = useState<PersonalEventRecord[]>([]);
  const [loadingPersonalEvents, setLoadingPersonalEvents] = useState(false);
  const [personalTelegramReady, setPersonalTelegramReady] = useState(false);
  const [physicalRooms, setPhysicalRooms] = useState<string[]>([...DEFAULT_PHYSICAL_ROOMS]);
  const [defaultPhysicalRoom, setDefaultPhysicalRoom] = useState<string>(DEFAULT_PHYSICAL_ROOMS[0]);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsModalTab>('telegram');
  const [personalFilter, setPersonalFilter] = useState<'today' | 'upcoming' | 'all'>('upcoming');
  const [personalSearch, setPersonalSearch] = useState('');
  const [showPersonalEventModal, setShowPersonalEventModal] = useState(false);
  const [editingPersonalEvent, setEditingPersonalEvent] = useState<PersonalEventRecord | null>(null);
  const [personalDraft, setPersonalDraft] = useState<PersonalEventDraft | null>(null);
  const [personalEventToDelete, setPersonalEventToDelete] = useState<PersonalEventRecord | null>(null);
  const [isDeletingPersonalEvent, setIsDeletingPersonalEvent] = useState(false);
  const [sendingPersonalAlertId, setSendingPersonalAlertId] = useState<string | null>(null);
  const [copiedJoinId, setCopiedJoinId] = useState<string | null>(null);

  // System Updates state
  const [systemUpdates, setSystemUpdates] = useState<SystemUpdateRecord[]>([]);
  const [loadingSystemUpdates, setLoadingSystemUpdates] = useState(false);
  const [showSystemUpdateModal, setShowSystemUpdateModal] = useState(false);
  const [editingSystemUpdate, setEditingSystemUpdate] = useState<SystemUpdateRecord | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'notes' || tabParam === 'calendar' || tabParam === 'meetings' || tabParam === 'personal' || tabParam === 'updates') {
      setActiveSubView(tabParam);
    }
  }, [searchParams]);

  const switchSubView = (view: 'notes' | 'calendar' | 'meetings' | 'personal' | 'updates') => {
    setActiveSubView(view);
    const next = new URLSearchParams(searchParams);
    next.set('tab', view);
    setSearchParams(next, { replace: true });
  };

  const openSettingsTab = (tab?: SettingsModalTab) => {
    const resolvedTab =
      tab ||
      (activeSubView === 'personal'
        ? 'personal-telegram'
        : activeSubView === 'meetings' || activeSubView === 'updates'
          ? 'meeting-telegram'
          : 'telegram');
    setSettingsInitialTab(resolvedTab);
    setIsSettingsOpen(true);
  };

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchNotes = async (query: string, fromDate: string, toDate: string) => {
    if (query !== '' || fromDate !== '' || toDate !== '') setIsSearching(true);
    else setLoading(true);
    
    try {
      let data = query 
        ? await noteService.search(query)
        : await noteService.getAll();

      if (fromDate) {
        data = data.filter((n: Note) => {
           const d = new Date(n.meetingDate || n.updatedAt || n.createdAt);
           const frm = new Date(fromDate);
           frm.setHours(0, 0, 0, 0);
           return d >= frm;
        });
      }
      if (toDate) {
        const toD = new Date(toDate);
        toD.setHours(23, 59, 59, 999);
        data = data.filter((n: Note) => {
           const d = new Date(n.meetingDate || n.updatedAt || n.createdAt);
           return d <= toD;
        });
      }

      setNotes(data);
    } catch (error) {
      console.error("Failed to fetch notes", error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const fetchMeetings = async () => {
    setLoadingMeetings(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/it-meetings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (e) {
      console.error('Failed to fetch meetings:', e);
    } finally {
      setLoadingMeetings(false);
    }
  };

  const fetchTelegramConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/it-meetings/telegram-config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.groups)) {
          setAvailableGroups(data.groups);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch telegram config:', e);
    }
  };

  const getMeetingTargetGroupLabels = (meeting: ITMeetingRecord): string[] => {
    if (!meeting.target_groups || meeting.target_groups.length === 0) {
      return availableGroups.filter(g => g.is_default).map(g => g.name);
    }
    return meeting.target_groups.map(id => {
      const found = availableGroups.find(g => g.id === id || g.chat_id === id);
      return found ? found.name : id;
    });
  };

  const openBroadcastModal = (meeting: ITMeetingRecord) => {
    setBroadcastMeetingModal(meeting);
    if (meeting.target_groups && meeting.target_groups.length > 0) {
      setBroadcastSelectedGroupIds(meeting.target_groups);
    } else {
      const defaultIds = availableGroups.filter(g => g.is_default && g.chat_id?.trim()).map(g => g.id);
      setBroadcastSelectedGroupIds(defaultIds.length > 0 ? defaultIds : availableGroups.map(g => g.id));
    }
  };

  const handleConfirmBroadcast = async () => {
    if (!broadcastMeetingModal) return;
    setIsBroadcasting(true);
    setSendingMeetingAlertId(broadcastMeetingModal.id);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/it-meetings/${broadcastMeetingModal.id}/send-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          target_group_ids: broadcastSelectedGroupIds
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Telegram alert successfully sent to selected group(s)!', 'success');
        setMeetings(prev => prev.map(m => m.id === broadcastMeetingModal.id ? {
          ...m,
          telegram_alert_sent: true,
          last_alert_sent_at: new Date().toISOString(),
          target_groups: broadcastSelectedGroupIds
        } : m));
        setBroadcastMeetingModal(null);
      } else {
        showToast(data.error || 'Failed to dispatch Telegram message', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error dispatching Telegram alert', 'error');
    } finally {
      setIsBroadcasting(false);
      setSendingMeetingAlertId(null);
    }
  };

  const handleSendTelegramAlert = async (meeting: ITMeetingRecord) => {
    openBroadcastModal(meeting);
  };

  const fetchPersonalEvents = async () => {
    setLoadingPersonalEvents(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/personal-events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPersonalEvents(Array.isArray(data.events) ? data.events : []);
        setPersonalTelegramReady(Boolean(data.telegram_configured));
        if (Array.isArray(data.physical_rooms) && data.physical_rooms.length > 0) {
          setPhysicalRooms(data.physical_rooms);
        }
        if (data.default_physical_room) {
          setDefaultPhysicalRoom(data.default_physical_room);
        }
      }
    } catch (e) {
      console.error('Failed to fetch personal events:', e);
    } finally {
      setLoadingPersonalEvents(false);
    }
  };

  const fetchSystemUpdates = async () => {
    setLoadingSystemUpdates(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/system-updates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSystemUpdates(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to fetch system updates:', e);
    } finally {
      setLoadingSystemUpdates(false);
    }
  };

  const handleSendPersonalAlert = async (ev: PersonalEventRecord) => {
    setSendingPersonalAlertId(ev.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/personal-events/${ev.id}/send-alert`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Reminder sent to your personal Telegram bot for "${ev.title}".`, 'success');
        setPersonalEvents(prev =>
          prev.map(item =>
            item.id === ev.id
              ? { ...item, reminder_sent: true, reminder_sent_at: data.sentAt || new Date().toISOString(), last_alert_error: null }
              : item
          )
        );
      } else {
        showToast(data.error || 'Failed to send personal Telegram alert', 'error');
        fetchPersonalEvents();
      }
    } catch (e: any) {
      showToast(e.message || 'Error sending personal Telegram alert', 'error');
    } finally {
      setSendingPersonalAlertId(null);
    }
  };

  const handleUpdatePersonalStatus = async (
    ev: PersonalEventRecord,
    nextStatus: PersonalEventRecord['status']
  ) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/personal-events/${ev.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setPersonalEvents(prev => prev.map(item => (item.id === ev.id ? updated : item)));
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to update event status', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to update event status', 'error');
    }
  };

  const handleCopyJoinUrl = async (ev: PersonalEventRecord) => {
    if (!ev.join_url) return;
    try {
      await navigator.clipboard.writeText(ev.join_url);
      setCopiedJoinId(ev.id);
      showToast('Join link copied to clipboard', 'info');
      setTimeout(() => setCopiedJoinId(prev => (prev === ev.id ? null : prev)), 2000);
    } catch {
      showToast('Could not copy link automatically', 'error');
    }
  };

  const handleDeletePersonalConfirm = async () => {
    if (!personalEventToDelete) return;
    setIsDeletingPersonalEvent(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/personal-events/${personalEventToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPersonalEvents(prev => prev.filter(item => item.id !== personalEventToDelete.id));
        showToast('Personal event removed from scheduler', 'info');
        setPersonalEventToDelete(null);
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || 'Failed to delete personal event', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error deleting personal event', 'error');
    } finally {
      setIsDeletingPersonalEvent(false);
    }
  };

  const handleDeleteMeetingConfirm = async () => {
    if (!meetingToDelete) return;
    setIsDeletingMeeting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/it-meetings/${meetingToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMeetings(prev => prev.filter(m => m.id !== meetingToDelete.id));
        showToast('Meeting schedule deleted successfully', 'info');
        setMeetingToDelete(null);
      } else {
        const d = await res.json();
        showToast(d.error || 'Failed to delete meeting', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error deleting meeting', 'error');
    } finally {
      setIsDeletingMeeting(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotes(searchQuery, periodFrom, periodTo);
  };

  useEffect(() => {
    fetchMeetings();
    fetchTelegramConfig();
    fetchPersonalEvents();
    fetchSystemUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchNotes(searchQuery, periodFrom, periodTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodFrom, periodTo]);

  const didMountSearchRef = useRef(false);
  useEffect(() => {
    if (!didMountSearchRef.current) {
      didMountSearchRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      fetchNotes(searchQuery, periodFrom, periodTo);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const getPreviewText = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleDeleteNoteConfirm = async () => {
    if (!noteToDelete) return;
    setIsDeletingNote(true);
    setDeleteNoteError(null);
    try {
      await noteService.delete(noteToDelete.id);
      setNotes((prev) => prev.filter((n) => n.id !== noteToDelete.id));
      setNoteToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete note", err);
      setDeleteNoteError(err.message || "Failed to delete note");
    } finally {
      setIsDeletingNote(false);
    }
  };

  const localNow = new Date();
  const todayStr = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, '0')}-${String(localNow.getDate()).padStart(2, '0')}`;
  const filteredMeetings = meetings.filter(m => {
    if (meetingFilter === 'upcoming') {
      return (m.meeting_date >= todayStr) && m.status !== 'Cancelled';
    }
    return true;
  });

  const filteredPersonalEvents = personalEvents.filter(ev => {
    const q = personalSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      ev.title.toLowerCase().includes(q) ||
      (ev.host_name || '').toLowerCase().includes(q) ||
      (ev.location || '').toLowerCase().includes(q) ||
      (ev.event_type || '').toLowerCase().includes(q);
    if (!matchesQuery) return false;

    const evStart = ev.event_date;
    const evEnd = ev.event_end_date || ev.event_date;
    if (personalFilter === 'today') {
      return evStart <= todayStr && evEnd >= todayStr;
    }
    if (personalFilter === 'upcoming') {
      return evEnd >= todayStr && ev.status !== 'Cancelled' && ev.status !== 'Completed';
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Toast notification banner */}
      {toastMessage && (
        <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border shadow-sm animate-in slide-in-from-top-2 duration-200 ${
          toastMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' :
          toastMessage.type === 'error' ? 'bg-rose-50 text-rose-900 border-rose-200' :
          'bg-indigo-50 text-indigo-900 border-indigo-200'
        }`}>
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-700 ml-4">&times;</button>
        </div>
      )}

      {/* Sub-view switcher: Notes & Documents vs Schedule & IT Meetings vs My Scheduler */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => switchSubView('notes')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubView === 'notes'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText size={14} className={activeSubView === 'notes' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
            <span>Notes & Documents</span>
            <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-md font-bold ${
              activeSubView === 'notes' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {notes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchSubView('calendar')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubView === 'calendar'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarDays size={14} className={activeSubView === 'calendar' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
            <span>Calendar</span>
            <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-md font-bold ${
              activeSubView === 'calendar' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {meetings.length + personalEvents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchSubView('meetings')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubView === 'meetings'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar size={14} className={activeSubView === 'meetings' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
            <span>Schedule & IT Meetings</span>
            <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-md font-bold ${
              activeSubView === 'meetings' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {meetings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchSubView('personal')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubView === 'personal'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BellRing size={14} className={activeSubView === 'personal' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
            <span>My Scheduler</span>
            <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-md font-bold ${
              activeSubView === 'personal' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {personalEvents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchSubView('updates')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeSubView === 'updates'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Megaphone size={14} className={activeSubView === 'updates' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
            <span>System Updates</span>
            <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-md font-bold ${
              activeSubView === 'updates' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {systemUpdates.length}
            </span>
          </button>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button 
            onClick={() => openSettingsTab()} 
            variant="secondary" 
            size="md" 
            className="rounded-full shadow-sm whitespace-nowrap shrink-0 h-10 px-4 text-xs font-semibold"
          >
            <Bell className="mr-2 h-4 w-4 text-indigo-500" />
            Telegram Settings
          </Button>

          <button
            type="button"
            onClick={() => {
              setEditingSystemUpdate(null);
              setShowSystemUpdateModal(true);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap shrink-0 h-10 transition-all cursor-pointer ${
              activeSubView === 'updates'
                ? 'text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-lg shadow-indigo-600/20'
                : 'border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950/70 shadow-sm'
            }`}
            title="Inform users and schedule automatic Telegram reminder for system updates"
          >
            <Megaphone size={15} />
            <span>System Update Alert</span>
          </button>

          {(activeSubView === 'personal' || activeSubView === 'calendar') && (
            <button
              type="button"
              onClick={() => {
                setEditingPersonalEvent(null);
                setPersonalDraft(null);
                setShowPersonalEventModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-full shadow-lg shadow-indigo-600/20 whitespace-nowrap shrink-0 h-10 transition-all cursor-pointer"
              title="Add a meeting or event you plan to join with personal Telegram alerts"
            >
              <PlusCircle size={16} />
              <span>Add Event</span>
            </button>
          )}

          {activeSubView !== 'personal' && activeSubView !== 'updates' && (
            <button
              type="button"
              onClick={() => {
                setEditingMeeting(null);
                setMeetingDraft(null);
                setShowScheduleModal(true);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap shrink-0 h-10 transition-all cursor-pointer ${
                activeSubView === 'calendar'
                  ? 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm'
                  : 'text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-lg shadow-indigo-600/20 hover:scale-[1.02]'
              }`}
              title="Schedule an IT monthly meeting and broadcast reminder to Telegram group"
            >
              <CalendarPlus size={16} />
              <span>Schedule Meeting</span>
            </button>
          )}

          <Button 
            onClick={() => navigate(RoutePath.CREATE_NOTE)} 
            size="md" 
            className="rounded-full shadow-lg shadow-indigo-500/20 whitespace-nowrap shrink-0 h-10 px-5 text-xs font-semibold"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </div>
      </div>

      {/* Date & Search Filters Toolbar (when in notes view) */}
      {activeSubView === 'notes' && (
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 pb-4 gap-3.5 sm:gap-4">
        {/* Date Range Picker */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-full bg-white px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm flex-1 sm:flex-none min-w-[140px]">
            <span className="text-xs font-semibold text-slate-400 mr-2 uppercase tracking-wide shrink-0">From</span>
            <input 
              type="date"
              title="Period From"
              value={periodFrom}
              onChange={(e) => setPeriodFrom(e.target.value)}
              className="min-w-[115px] w-full sm:w-32 text-sm focus:outline-none text-slate-700 bg-transparent"
            />
          </div>
          <span className="text-slate-300 font-medium hidden sm:inline">-</span>
          <div className="flex items-center border border-slate-200 rounded-full bg-white px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm flex-1 sm:flex-none min-w-[140px]">
            <span className="text-xs font-semibold text-slate-400 mr-2 uppercase tracking-wide shrink-0">To</span>
            <input 
              type="date"
              title="Period To"
              value={periodTo}
              onChange={(e) => setPeriodTo(e.target.value)}
              className="min-w-[115px] w-full sm:w-32 text-sm focus:outline-none text-slate-700 bg-transparent"
            />
          </div>
          {(periodFrom || periodTo) && (
            <button
              onClick={() => { setPeriodFrom(''); setPeriodTo(''); }}
              className="p-2 text-xs text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              title="Clear date filter"
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        {/* Search & Actions */}
        <div className="flex flex-1 items-center gap-3 justify-end flex-wrap sm:flex-nowrap">
          <div className="relative min-w-0 w-full sm:min-w-[200px] sm:max-w-xs group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* NOTES VIEW */}
      {activeSubView === 'notes' && (
        <>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                 <div key={n} className="h-72 animate-pulse rounded-2xl bg-white border border-slate-200"></div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
              {notes.map((note) => (
                <div 
                  key={note.id} 
                  onClick={() => navigate(RoutePath.NOTE_DETAIL.replace(':id', note.id))}
                  className="group cursor-pointer flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300"
                >
                  {/* Image / Header with Auto Default Sample Cover */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-900 border-b border-slate-100">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent z-10" />
                    <StorageImage 
                        path={getDefaultCoverForNote(note)} 
                        alt={note.title} 
                        className="h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-105" 
                    />
                    
                    {/* Category Badge on Cover */}
                    <div className="absolute bottom-2.5 left-3 z-20">
                      <span className="rounded-md bg-slate-900/75 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold text-white/95 shadow-sm ring-1 ring-white/10">
                        {getCoverBadge(getDefaultCoverForNote(note))}
                      </span>
                    </div>
                    
                    {/* Date Badge & Delete Action */}
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                      <div className="flex items-center gap-1.5 rounded-full bg-white/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-600 shadow-sm ring-1 ring-slate-200">
                        <Calendar size={11} className="text-slate-400" />
                        <span>{new Date(note.meetingDate || note.updatedAt || note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteToDelete(note);
                        }}
                        className="p-1 rounded-full bg-white/85 backdrop-blur-md text-slate-400 hover:text-red-600 hover:bg-white shadow-sm ring-1 ring-slate-200 transition-all group/del"
                        title="Delete note"
                      >
                        <Trash2 size={13} className="transition-transform group-hover/del:scale-110" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="mb-2 text-lg font-bold tracking-tight text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                      {note.title || 'My notes'}
                    </h3>
                    
                    <p className="text-slate-500 line-clamp-3 leading-relaxed text-sm mb-4 font-light">
                      {getPreviewText(note.content) || <span className="italic opacity-50">Empty note</span>}
                    </p>

                    {note.linkedSourceType && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          switchSubView(note.linkedSourceType === 'it_meeting' ? 'meetings' : 'personal');
                        }}
                        className="mb-4 inline-flex items-center gap-1.5 self-start rounded-lg border border-indigo-200/80 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-semibold text-indigo-800 hover:bg-indigo-100/80 transition-colors cursor-pointer max-w-full"
                        title={`Go to linked ${note.linkedSourceType === 'it_meeting' ? 'IT Meeting' : 'Personal Event'}`}
                      >
                        <Link2 size={12} className="text-indigo-600 shrink-0" />
                        <span className="truncate">
                          {note.linkedSourceType === 'it_meeting' ? 'IT Meeting' : 'My Scheduler'}: {note.linkedSourceTitle || 'Linked Event'}
                        </span>
                      </button>
                    )}

                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                       <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                            ME
                          </div>
                          <span className="text-xs text-slate-500">
                            {note.meetingDate ? `Meeting: ${new Date(note.meetingDate).toLocaleDateString()}` : 'Note'}
                          </span>
                       </div>
                       <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNoteToDelete(note);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete note"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div className="flex items-center text-xs font-medium text-slate-400 group-hover:text-indigo-600 transition-colors">
                            <span>Open</span>
                            <ArrowUpRight size={14} className="ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && notes.length === 0 && (
              <div className="flex h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/50 text-center px-4">
                 <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-200 mb-5">
                     <FileText size={28} className="text-slate-400" />
                 </div>
                 <h3 className="text-lg font-semibold text-slate-900">
                   {searchQuery ? 'No matching notes' : 'No notes yet'}
                 </h3>
                 <p className="text-slate-500 mb-6 max-w-sm">
                   {searchQuery 
                     ? `We couldn't find any notes matching "${searchQuery}"`
                     : 'Create your first note to get started.'}
                 </p>
                 {searchQuery ? (
                   <Button onClick={() => setSearchQuery('')} variant="secondary" className="rounded-full">Clear Search</Button>
                 ) : (
                   <Button onClick={() => navigate(RoutePath.CREATE_NOTE)} variant="primary" className="rounded-full">Create your first note</Button>
                 )}
              </div>
          )}
        </>
      )}

      {/* UNIFIED OUTLOOK CALENDAR DASHBOARD VIEW */}
      {activeSubView === 'calendar' && (
        <div className="animate-in fade-in duration-200">
          <OutlookCalendarDashboard
            scope="unified"
            meetings={meetings}
            personalEvents={personalEvents}
            loading={loadingMeetings || loadingPersonalEvents}
            sendingMeetingAlertId={sendingMeetingAlertId}
            sendingPersonalAlertId={sendingPersonalAlertId}
            onCreateItMeeting={(draft) => {
              setEditingMeeting(null);
              setMeetingDraft(draft);
              setShowScheduleModal(true);
            }}
            onCreatePersonalEvent={(draft) => {
              setEditingPersonalEvent(null);
              setPersonalDraft(draft);
              setShowPersonalEventModal(true);
            }}
            onEditItMeeting={(m) => {
              setMeetingDraft(null);
              setEditingMeeting(m);
              setShowScheduleModal(true);
            }}
            onDeleteItMeeting={(m) => setMeetingToDelete(m)}
            onSendItMeetingAlert={(m) => handleSendTelegramAlert(m)}
            onEditPersonalEvent={(ev) => {
              setPersonalDraft(null);
              setEditingPersonalEvent(ev);
              setShowPersonalEventModal(true);
            }}
            onDeletePersonalEvent={(ev) => setPersonalEventToDelete(ev)}
            onSendPersonalAlert={(ev) => handleSendPersonalAlert(ev)}
            onUpdatePersonalStatus={(ev, status) => handleUpdatePersonalStatus(ev, status)}
            onOpenLiveNotes={(target) => setLiveNoteTarget(target)}
          />
        </div>
      )}

      {/* SYSTEM UPDATES INFORM & REMINDER VIEW */}
      {activeSubView === 'updates' && (
        <SystemUpdatesPanel
          updates={systemUpdates}
          loading={loadingSystemUpdates}
          availableGroups={availableGroups}
          onCreateNew={() => {
            setEditingSystemUpdate(null);
            setShowSystemUpdateModal(true);
          }}
          onEdit={(record) => {
            setEditingSystemUpdate(record);
            setShowSystemUpdateModal(true);
          }}
          onRefresh={fetchSystemUpdates}
          onOpenTelegramSettings={() => openSettingsTab('meeting-telegram')}
          onShowToast={showToast}
        />
      )}

      {/* SCHEDULED IT MEETINGS VIEW */}
      {activeSubView === 'meetings' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Sub-filter & Cards/Calendar mode switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              {meetingsDisplayMode === 'cards' && (
                <>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pl-1">
                    Filter Meetings:
                  </span>
                  <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setMeetingFilter('upcoming')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        meetingFilter === 'upcoming'
                          ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Upcoming
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeetingFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        meetingFilter === 'all'
                          ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      All Scheduled ({meetings.length})
                    </button>
                  </div>
                </>
              )}
              {meetingsDisplayMode === 'calendar' && (
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 pl-1">
                  IT Meetings Outlook Calendar · Click any date or hour slot to schedule
                </span>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 hidden md:flex items-center gap-2 pr-1">
                <span>Telegram Bot active</span>
              </div>

              <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMeetingsDisplayMode('cards')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    meetingsDisplayMode === 'cards'
                      ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutGrid size={13} />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMeetingsDisplayMode('calendar')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    meetingsDisplayMode === 'calendar'
                      ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CalendarDays size={13} />
                  <span>Calendar</span>
                </button>
              </div>
            </div>
          </div>

          {meetingsDisplayMode === 'calendar' ? (
            <OutlookCalendarDashboard
              scope="meetings"
              meetings={meetings}
              personalEvents={personalEvents}
              loading={loadingMeetings}
              sendingMeetingAlertId={sendingMeetingAlertId}
              sendingPersonalAlertId={sendingPersonalAlertId}
              onCreateItMeeting={(draft) => {
                setEditingMeeting(null);
                setMeetingDraft(draft);
                setShowScheduleModal(true);
              }}
              onCreatePersonalEvent={(draft) => {
                setEditingPersonalEvent(null);
                setPersonalDraft(draft);
                setShowPersonalEventModal(true);
              }}
              onEditItMeeting={(m) => {
                setMeetingDraft(null);
                setEditingMeeting(m);
                setShowScheduleModal(true);
              }}
              onDeleteItMeeting={(m) => setMeetingToDelete(m)}
              onSendItMeetingAlert={(m) => handleSendTelegramAlert(m)}
              onEditPersonalEvent={(ev) => {
                setPersonalDraft(null);
                setEditingPersonalEvent(ev);
                setShowPersonalEventModal(true);
              }}
              onDeletePersonalEvent={(ev) => setPersonalEventToDelete(ev)}
              onSendPersonalAlert={(ev) => handleSendPersonalAlert(ev)}
              onUpdatePersonalStatus={(ev, status) => handleUpdatePersonalStatus(ev, status)}
              onOpenLiveNotes={(target) => setLiveNoteTarget(target)}
            />
          ) : loadingMeetings ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {[1, 2].map((n) => (
                <div key={n} className="h-64 animate-pulse rounded-3xl bg-white border border-slate-200"></div>
              ))}
            </div>
          ) : filteredMeetings.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
              {filteredMeetings.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-6 flex flex-col space-y-4"
                >
                  {/* Top card bar: Title, Date, Badges */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {m.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {m.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900/90 font-mono">
                        <Calendar size={13} className="text-indigo-600" />
                        <span>{m.day_of_week_label || 'Saturdays'}, {m.meeting_date}</span>
                        <span className="text-slate-300 font-sans">·</span>
                        <Clock size={13} className="text-indigo-600" />
                        <span>{m.start_time} to {m.end_time}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMeeting(m);
                          setShowScheduleModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        title="Edit Meeting"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeetingToDelete(m)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete Meeting"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Venue & Room Booking Note */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-slate-700 font-medium">
                      <MapPin size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span>Venue: <strong>{m.venue}</strong></span>
                        {m.room_booking_note && (
                          <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg mt-1 font-semibold inline-block">
                            Room Note: {m.room_booking_note}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Provisional Agenda Box */}
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5 mt-2">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        Provisional Agenda:
                      </span>
                      <pre className="text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {m.agenda}
                      </pre>
                    </div>

                    {/* Target Alert Groups Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Users size={12} className="text-indigo-600" />
                        <span>Alert Groups:</span>
                      </span>
                      {(() => {
                        const groupLabels = getMeetingTargetGroupLabels(m);
                        if (groupLabels.length === 0) {
                          return (
                            <span className="text-[10px] text-slate-400 italic bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md">
                              All default groups
                            </span>
                          );
                        }
                        return groupLabels.map((lbl, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs"
                          >
                            {lbl}
                          </span>
                        ));
                      })()}
                    </div>
                    {/* Linked Live Notes Preview */}
                    {m.linked_note_id && (
                      <div className="flex items-start justify-between gap-3 rounded-2xl border border-indigo-200/80 bg-indigo-50/50 p-3 mt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setLiveNoteTarget({
                              sourceType: 'it_meeting',
                              sourceId: m.id,
                              title: m.title,
                              date: m.meeting_date,
                              timeRange: `${m.start_time} – ${m.end_time}`,
                              location: m.venue,
                              hostOrOrganizer: m.organizer_name,
                              agendaOrNotes: m.agenda,
                              linkedNoteId: m.linked_note_id,
                              initialMode: 'view'
                            })
                          }
                          className="text-left min-w-0 flex-1 cursor-pointer group/note"
                        >
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-900 group-hover/note:text-indigo-700">
                            <NotebookPen size={12} className="text-indigo-600 shrink-0" />
                            <span className="truncate">Linked Notes: {m.linked_note_title || 'Meeting Notes'}</span>
                          </div>
                          {m.linked_note_excerpt && (
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                              {m.linked_note_excerpt}
                            </p>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setLiveNoteTarget({
                              sourceType: 'it_meeting',
                              sourceId: m.id,
                              title: m.title,
                              date: m.meeting_date,
                              timeRange: `${m.start_time} – ${m.end_time}`,
                              location: m.venue,
                              hostOrOrganizer: m.organizer_name,
                              agendaOrNotes: m.agenda,
                              linkedNoteId: m.linked_note_id,
                              initialMode: 'view'
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100/70 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Organizer & Telegram Alert Dispatch Status */}
                  <div className="mt-auto pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <User size={13} />
                      <span>Yours, <strong className="text-slate-800">{m.organizer_name}</strong></span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {m.telegram_alert_sent ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <span>Alert Broadcasted</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                          <Clock size={13} className="text-amber-600" />
                          <span>Pending Broadcast</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setLiveNoteTarget({
                            sourceType: 'it_meeting',
                            sourceId: m.id,
                            title: m.title,
                            date: m.meeting_date,
                            timeRange: `${m.start_time} – ${m.end_time}`,
                            location: m.venue,
                            hostOrOrganizer: m.organizer_name,
                            agendaOrNotes: m.agenda,
                            linkedNoteId: m.linked_note_id,
                            initialMode: m.linked_note_id ? 'edit' : 'edit'
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                        title="Take or view live meeting notes linked to this IT meeting"
                      >
                        <NotebookPen size={12} />
                        <span>{m.linked_note_id ? 'Edit Notes' : 'Take Notes'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={sendingMeetingAlertId === m.id}
                        onClick={() => handleSendTelegramAlert(m)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                          m.telegram_alert_sent
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                        }`}
                        title="Broadcast formatted reminder to configured Telegram group(s)"
                      >
                        {sendingMeetingAlertId === m.id ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Broadcasting...</span>
                          </>
                        ) : (
                          <>
                            <Send size={12} />
                            <span>{m.telegram_alert_sent ? 'Re-broadcast Alert' : 'Broadcast Alert'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {meetingsDisplayMode === 'cards' && !loadingMeetings && filteredMeetings.length === 0 && (
            <div className="flex h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/50 text-center px-4">
              <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-xs border border-indigo-100 mb-4">
                <CalendarPlus size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No scheduled IT meetings found
              </h3>
              <p className="text-xs text-slate-500 mb-5 max-w-sm mt-1">
                Plan your upcoming monthly IT meeting, format the agenda, and notify the team Telegram group in one step.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingMeeting(null);
                  setMeetingDraft(null);
                  setShowScheduleModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-md shadow-indigo-600/25 transition-all"
              >
                <CalendarPlus size={15} />
                <span>Schedule First Meeting</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MY PERSONAL SCHEDULER VIEW */}
      {activeSubView === 'personal' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Personal Telegram Bot Readiness Strip */}
          {personalTelegramReady ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-200">
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    Personal Telegram Bot Connected
                  </span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Automated reminders check every minute using your own Bot Token and Chat ID.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openSettingsTab('personal-telegram')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Manage Bot Credentials
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/30">
              <div className="flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Personal Telegram Bot not configured yet</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    Add your own Personal Telegram Chat ID and Bot Token in Personal Alert settings to receive automated alerts before each meeting or event.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openSettingsTab('personal-telegram')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                Configure Personal Bot
              </button>
            </div>
          )}

          {/* Filter, Cards/Calendar Switcher & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPersonalDisplayMode('cards')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    personalDisplayMode === 'cards'
                      ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutGrid size={13} />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPersonalDisplayMode('calendar')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    personalDisplayMode === 'calendar'
                      ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CalendarDays size={13} />
                  <span>Calendar</span>
                </button>
              </div>

              {personalDisplayMode === 'cards' && (
                <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {(
                    [
                      { key: 'today', label: 'Today' },
                      { key: 'upcoming', label: 'Upcoming' },
                      { key: 'all', label: `All (${personalEvents.length})` }
                    ] as const
                  ).map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setPersonalFilter(tab.key)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        personalFilter === tab.key
                          ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-1 md:max-w-md justify-end">
              {personalDisplayMode === 'cards' && (
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={personalSearch}
                    onChange={(e) => setPersonalSearch(e.target.value)}
                    placeholder="Search events, host, or room..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditingPersonalEvent(null);
                  setPersonalDraft(null);
                  setShowPersonalEventModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Event</span>
              </button>
            </div>
          </div>

          {personalDisplayMode === 'calendar' ? (
            <OutlookCalendarDashboard
              scope="personal"
              meetings={meetings}
              personalEvents={personalEvents}
              loading={loadingPersonalEvents}
              sendingMeetingAlertId={sendingMeetingAlertId}
              sendingPersonalAlertId={sendingPersonalAlertId}
              onCreateItMeeting={(draft) => {
                setEditingMeeting(null);
                setMeetingDraft(draft);
                setShowScheduleModal(true);
              }}
              onCreatePersonalEvent={(draft) => {
                setEditingPersonalEvent(null);
                setPersonalDraft(draft);
                setShowPersonalEventModal(true);
              }}
              onEditItMeeting={(m) => {
                setMeetingDraft(null);
                setEditingMeeting(m);
                setShowScheduleModal(true);
              }}
              onDeleteItMeeting={(m) => setMeetingToDelete(m)}
              onSendItMeetingAlert={(m) => handleSendTelegramAlert(m)}
              onEditPersonalEvent={(ev) => {
                setPersonalDraft(null);
                setEditingPersonalEvent(ev);
                setShowPersonalEventModal(true);
              }}
              onDeletePersonalEvent={(ev) => setPersonalEventToDelete(ev)}
              onSendPersonalAlert={(ev) => handleSendPersonalAlert(ev)}
              onUpdatePersonalStatus={(ev, status) => handleUpdatePersonalStatus(ev, status)}
              onOpenLiveNotes={(target) => setLiveNoteTarget(target)}
            />
          ) : loadingPersonalEvents ? (
            <div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
              {[1, 2].map((n) => (
                <div key={n} className="h-56 animate-pulse rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
              ))}
            </div>
          ) : filteredPersonalEvents.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
              {filteredPersonalEvents.map((ev) => {
                const platformLabel = detectJoinPlatform(ev.join_url);
                const statusTone =
                  ev.status === 'Joined'
                    ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800'
                    : ev.status === 'Completed'
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
                    : ev.status === 'Cancelled'
                    ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    : 'text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

                return (
                  <div
                    key={ev.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors p-5 flex flex-col space-y-3.5"
                  >
                    {/* Header: Title, Status, Edit & Delete */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {ev.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-300 font-semibold">
                            <Calendar size={12} />
                            <span>
                              {ev.event_end_date && ev.event_end_date !== ev.event_date
                                ? `${ev.event_date} – ${ev.event_end_date}`
                                : ev.event_date}
                            </span>
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} className="text-slate-400" />
                            <span>
                              {ev.start_time}
                              {ev.end_time ? ` – ${ev.end_time}` : ''}
                            </span>
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Bell size={12} />
                            <span>{formatLeadTimeText(ev.reminder_minutes_before)}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          aria-label={`Status for ${ev.title}`}
                          value={ev.status}
                          onChange={(e) =>
                            handleUpdatePersonalStatus(
                              ev,
                              e.target.value as PersonalEventRecord['status']
                            )
                          }
                          className={`text-[11px] font-semibold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${statusTone}`}
                        >
                          <option value="Upcoming">Upcoming</option>
                          <option value="Joined">Joined</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPersonalEvent(ev);
                            setShowPersonalEventModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPersonalEventToDelete(ev)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Clean Dot-Separated Event Metadata */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{ev.event_type}</span>
                      {ev.host_name && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="inline-flex items-center gap-1">
                            <User size={12} className="text-slate-400" />
                            <span>{ev.host_name}</span>
                          </span>
                        </>
                      )}
                      {ev.location && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" />
                            <span>{ev.location}</span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Join Link Bar (when URL is provided) */}
                    {ev.join_url && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                        <div className="flex items-center gap-2 min-w-0 text-xs">
                          <Link2 size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 mr-1.5">
                              {platformLabel || 'Meeting Link'}:
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] truncate block sm:inline">
                              {ev.join_url}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyJoinUrl(ev)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                            title="Copy join URL"
                          >
                            {copiedJoinId === ev.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            <span>{copiedJoinId === ev.id ? 'Copied' : 'Copy'}</span>
                          </button>
                          <a
                            href={ev.join_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (ev.status === 'Upcoming') {
                                handleUpdatePersonalStatus(ev, 'Joined');
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap shrink-0 transition-colors"
                          >
                            <span>Join {platformLabel === 'Online Link' ? 'Meeting' : platformLabel}</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Prep Notes */}
                    {ev.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-3 whitespace-pre-wrap leading-relaxed">
                        {ev.notes}
                      </p>
                    )}

                    {ev.last_alert_error && (
                      <div className="text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl px-3 py-2">
                        Alert delivery note: {ev.last_alert_error}
                      </div>
                    )}

                    {/* Linked Live Notes Preview */}
                    {ev.linked_note_id && (
                      <div className="flex items-start justify-between gap-3 rounded-xl border border-indigo-200/80 dark:border-indigo-800/70 bg-indigo-50/50 dark:bg-indigo-950/30 p-3">
                        <button
                          type="button"
                          onClick={() =>
                            setLiveNoteTarget({
                              sourceType: 'personal_event',
                              sourceId: ev.id,
                              title: ev.title,
                              date: ev.event_end_date && ev.event_end_date !== ev.event_date ? `${ev.event_date} – ${ev.event_end_date}` : ev.event_date,
                              timeRange: ev.end_time ? `${ev.start_time} – ${ev.end_time}` : ev.start_time,
                              location: ev.location || 'TBD',
                              hostOrOrganizer: ev.host_name || 'Self',
                              joinUrl: ev.join_url,
                              agendaOrNotes: ev.notes,
                              linkedNoteId: ev.linked_note_id,
                              initialMode: 'view'
                            })
                          }
                          className="text-left min-w-0 flex-1 cursor-pointer group/evnote"
                        >
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-900 dark:text-indigo-200 group-hover/evnote:text-indigo-700">
                            <NotebookPen size={12} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span className="truncate">Linked Notes: {ev.linked_note_title || 'Event Notes'}</span>
                          </div>
                          {ev.linked_note_excerpt && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                              {ev.linked_note_excerpt}
                            </p>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setLiveNoteTarget({
                              sourceType: 'personal_event',
                              sourceId: ev.id,
                              title: ev.title,
                              date: ev.event_end_date && ev.event_end_date !== ev.event_date ? `${ev.event_date} – ${ev.event_end_date}` : ev.event_date,
                              timeRange: ev.end_time ? `${ev.start_time} – ${ev.end_time}` : ev.start_time,
                              location: ev.location || 'TBD',
                              hostOrOrganizer: ev.host_name || 'Self',
                              joinUrl: ev.join_url,
                              agendaOrNotes: ev.notes,
                              linkedNoteId: ev.linked_note_id,
                              initialMode: 'view'
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/70 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                      </div>
                    )}

                    {/* Footer: Alert Status, Live Notes & Manual Trigger */}
                    <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        {ev.reminder_sent ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 size={13} />
                            <span>Personal Alert Sent</span>
                          </span>
                        ) : ev.reminder_minutes_before < 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            <Clock size={13} />
                            <span>Manual reminder only</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                            <Clock size={13} />
                            <span>Auto-alert scheduled ({formatLeadTimeText(ev.reminder_minutes_before)})</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setLiveNoteTarget({
                              sourceType: 'personal_event',
                              sourceId: ev.id,
                              title: ev.title,
                              date: ev.event_end_date && ev.event_end_date !== ev.event_date ? `${ev.event_date} – ${ev.event_end_date}` : ev.event_date,
                              timeRange: ev.end_time ? `${ev.start_time} – ${ev.end_time}` : ev.start_time,
                              location: ev.location || 'TBD',
                              hostOrOrganizer: ev.host_name || 'Self',
                              joinUrl: ev.join_url,
                              agendaOrNotes: ev.notes,
                              linkedNoteId: ev.linked_note_id,
                              initialMode: 'edit'
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                          title="Take or view notes during this meeting/event"
                        >
                          <NotebookPen size={12} />
                          <span>{ev.linked_note_id ? 'Edit Notes' : 'Take Notes'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={sendingPersonalAlertId === ev.id}
                          onClick={() => handleSendPersonalAlert(ev)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-60"
                          title="Send immediate reminder to your personal Telegram bot"
                        >
                          {sendingPersonalAlertId === ev.id ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send size={12} className="text-indigo-600 dark:text-indigo-400" />
                              <span>Alert My Bot Now</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/50 text-center px-4">
              <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-800 mb-3.5">
                <BellRing size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {personalSearch || personalFilter !== 'all'
                  ? 'No personal events match this filter'
                  : 'Your personal scheduler is clear'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-md mt-1">
                Track meetings or events you are joining with Zoom, Google Meet, or Teams links, room locations, and automatic alerts to your personal Telegram bot.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingPersonalEvent(null);
                  setShowPersonalEventModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors cursor-pointer"
              >
                <PlusCircle size={15} />
                <span>Schedule Your First Event</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Personal Scheduler Event Modal */}
      <PersonalEventModal
        isOpen={showPersonalEventModal}
        eventRecord={editingPersonalEvent}
        initialDraft={personalDraft}
        telegramConfigured={personalTelegramReady}
        physicalRooms={physicalRooms}
        defaultPhysicalRoom={defaultPhysicalRoom}
        onClose={() => {
          setShowPersonalEventModal(false);
          setPersonalDraft(null);
        }}
        onOpenTelegramSettings={() => openSettingsTab('personal-telegram')}
        onSaved={(_saved, alertSent, alertError) => {
          fetchPersonalEvents();
          if (alertError) {
            showToast(`Event saved, but Telegram alert failed: ${alertError}`, 'error');
          } else {
            showToast(
              alertSent
                ? 'Event saved and reminder sent to your personal Telegram bot!'
                : 'Personal event saved with scheduled reminder.',
              'success'
            );
          }
        }}
      />

      {/* Delete Personal Event Confirmation Modal */}
      <SmartModal
        open={Boolean(personalEventToDelete)}
        onClose={() => !isDeletingPersonalEvent && setPersonalEventToDelete(null)}
        title="Remove Scheduled Event?"
        subtitle="Cancel personal reminder and remove from My Scheduler"
        icon={<Trash2 size={18} className="text-rose-600" />}
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isDeletingPersonalEvent}
              onClick={() => setPersonalEventToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeletingPersonalEvent}
              onClick={handleDeletePersonalConfirm}
            >
              {isDeletingPersonalEvent ? 'Removing...' : 'Remove Event'}
            </Button>
          </>
        }
      >
        {personalEventToDelete && (
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
            Are you sure you want to remove <strong className="text-slate-900 dark:text-slate-100 font-semibold">&quot;{personalEventToDelete.title}&quot;</strong> scheduled for {personalEventToDelete.event_end_date && personalEventToDelete.event_end_date !== personalEventToDelete.event_date ? `${personalEventToDelete.event_date} – ${personalEventToDelete.event_end_date}` : personalEventToDelete.event_date}?
          </p>
        )}
      </SmartModal>

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={showScheduleModal}
        meeting={editingMeeting}
        initialDraft={meetingDraft}
        onClose={() => {
          setShowScheduleModal(false);
          setMeetingDraft(null);
        }}
        onSaved={(_saved, alertSent, personalAlertSent) => {
          fetchMeetings();
          showToast(
            alertSent
              ? personalAlertSent
                ? 'IT meeting scheduled, group alert broadcasted, and your Personal Telegram ID notified!'
                : 'IT meeting scheduled and Telegram alert broadcasted to group!'
              : 'IT meeting schedule saved successfully!',
            'success'
          );
        }}
      />

      {/* System Update Alert & Reminder Modal */}
      <SystemUpdateModal
        isOpen={showSystemUpdateModal}
        updateRecord={editingSystemUpdate}
        onClose={() => {
          setShowSystemUpdateModal(false);
          setEditingSystemUpdate(null);
        }}
        onOpenTelegramSettings={() => openSettingsTab('meeting-telegram')}
        onSaved={(_record, alertSent) => {
          fetchSystemUpdates();
          switchSubView('updates');
          showToast(
            alertSent
              ? 'System update notice saved and sent to selected Telegram group(s)!'
              : 'System update notice & auto-reminder saved!',
            'success'
          );
        }}
      />

      {/* Delete Meeting Confirmation Modal */}
      <SmartModal
        open={Boolean(meetingToDelete)}
        onClose={() => !isDeletingMeeting && setMeetingToDelete(null)}
        title="Delete Scheduled Meeting?"
        subtitle="Remove meeting from schedule records"
        icon={<Trash2 size={18} className="text-rose-600" />}
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isDeletingMeeting}
              onClick={() => setMeetingToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeletingMeeting}
              onClick={handleDeleteMeetingConfirm}
            >
              {isDeletingMeeting ? 'Deleting...' : 'Delete Meeting'}
            </Button>
          </>
        }
      >
        {meetingToDelete && (
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
            Are you sure you want to delete <strong className="text-slate-900 dark:text-slate-100 font-semibold">&quot;{meetingToDelete.title}&quot;</strong> on {meetingToDelete.meeting_date}?
          </p>
        )}
      </SmartModal>

      {/* Delete Note Confirmation Modal */}
      <SmartModal
        open={Boolean(noteToDelete)}
        onClose={() => {
          if (!isDeletingNote) {
            setNoteToDelete(null);
            setDeleteNoteError(null);
          }
        }}
        title="Delete note?"
        subtitle="This action cannot be undone."
        icon={<Trash2 size={18} className="text-rose-600" />}
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isDeletingNote}
              onClick={() => {
                setNoteToDelete(null);
                setDeleteNoteError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeletingNote}
              onClick={handleDeleteNoteConfirm}
            >
              {isDeletingNote ? 'Deleting...' : 'Delete note'}
            </Button>
          </>
        }
      >
        {noteToDelete && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
              Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-slate-100 font-semibold">&quot;{noteToDelete.title || 'Untitled note'}&quot;</strong>? All associated content and attachments will be removed.
            </p>
            {deleteNoteError && (
              <div className="text-xs text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-lg border border-rose-100 dark:border-rose-800">
                {deleteNoteError}
              </div>
            )}
          </div>
        )}
      </SmartModal>

      {/* Multi-Group Broadcast Confirmation Modal */}
      <SmartModal
        open={Boolean(broadcastMeetingModal)}
        onClose={() => !isBroadcasting && setBroadcastMeetingModal(null)}
        title="Broadcast Alert to Telegram Groups"
        subtitle={
          broadcastMeetingModal ? (
            <span className="font-mono">
              {broadcastMeetingModal.title} · {broadcastMeetingModal.meeting_date}
            </span>
          ) : undefined
        }
        icon={<Send size={16} />}
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isBroadcasting}
              onClick={() => setBroadcastMeetingModal(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmBroadcast}
              disabled={isBroadcasting || broadcastSelectedGroupIds.length === 0}
              className="gap-1.5"
            >
              {isBroadcasting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Broadcasting to Groups...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Broadcast to {broadcastSelectedGroupIds.length} Group(s)</span>
                </>
              )}
            </Button>
          </>
        }
      >
        {broadcastMeetingModal && (
          <div className="space-y-4 text-xs">
            {/* Target Groups Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Users size={13} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Select Target Telegram Groups ({broadcastSelectedGroupIds.length}/{availableGroups.length})</span>
                </label>
                {availableGroups.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (broadcastSelectedGroupIds.length === availableGroups.length) {
                        setBroadcastSelectedGroupIds([]);
                      } else {
                        setBroadcastSelectedGroupIds(availableGroups.map(g => g.id));
                      }
                    }}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    {broadcastSelectedGroupIds.length === availableGroups.length ? 'Clear All' : 'Select All'}
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {availableGroups.length === 0 ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-[11px]">
                    No Telegram groups configured. You can configure multiple groups in Settings &gt; IT Meeting Alert.
                  </div>
                ) : (
                  availableGroups.map((group) => {
                    const isChecked = broadcastSelectedGroupIds.includes(group.id);
                    const hasChatId = Boolean(group.chat_id?.trim());
                    return (
                      <div
                        key={group.id}
                        onClick={() => {
                          setBroadcastSelectedGroupIds(prev =>
                            prev.includes(group.id)
                              ? prev.filter(id => id !== group.id)
                              : [...prev, group.id]
                          );
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-700 text-indigo-950 dark:text-indigo-100 font-semibold shadow-2xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isChecked ? (
                            <CheckSquare size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                          ) : (
                            <Square size={14} className="text-slate-400 shrink-0" />
                          )}
                          <span className="font-medium truncate">{group.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {hasChatId ? group.chat_id : 'No Chat ID'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Message Template Preview Box */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare size={12} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Formatted Template Message</span>
                </span>
                <span className="text-[10px] font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  Exact Notification
                </span>
              </div>
              <pre className="text-[10px] font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-36 overflow-y-auto bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed">
                {formatMeetingPreviewText({
                  title: broadcastMeetingModal.title,
                  meeting_date: broadcastMeetingModal.meeting_date,
                  day_of_week_label: broadcastMeetingModal.day_of_week_label,
                  start_time: broadcastMeetingModal.start_time,
                  end_time: broadcastMeetingModal.end_time,
                  venue: broadcastMeetingModal.venue,
                  room_booking_note: broadcastMeetingModal.room_booking_note,
                  agenda: broadcastMeetingModal.agenda,
                  organizer_name: broadcastMeetingModal.organizer_name
                })}
              </pre>
            </div>
          </div>
        )}
      </SmartModal>

      <LiveMeetingNotesModal
        isOpen={Boolean(liveNoteTarget)}
        target={liveNoteTarget}
        availableNotes={notes}
        onClose={() => setLiveNoteTarget(null)}
        onSaved={() => {
          fetchNotes(searchQuery, periodFrom, periodTo);
          fetchMeetings();
          fetchPersonalEvents();
        }}
        onOpenFullNote={(noteId, edit) =>
          navigate((edit ? RoutePath.EDIT_NOTE : RoutePath.NOTE_DETAIL).replace(':id', noteId))
        }
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        initialTab={settingsInitialTab}
        onClose={() => {
          setIsSettingsOpen(false);
          fetchPersonalEvents();
          fetchTelegramConfig();
        }}
      />
    </div>
  );
};