import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, FileText, ArrowUpRight, Calendar, Search, Bell, Trash2, Loader2, X,
  CalendarPlus, Send, CheckCircle2, Clock, MessageSquare, Edit2, AlertCircle, Sparkles, RefreshCw, MapPin, User,
  Users, CheckSquare, Square
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Note, RoutePath } from '../../types';
import { noteService } from '../../services/noteService';
import { StorageImage } from '../../components/ui/StorageImage';
import { SettingsModal, ITMeetingTelegramGroup } from './SettingsModal';
import { getDefaultCoverForNote, getCoverBadge } from '../../src/utils/sampleCovers';
import { ScheduleMeetingModal, ITMeetingRecord, formatMeetingPreviewText } from '../../components/ScheduleMeetingModal';

export const MyNotes: React.FC = () => {
  const navigate = useNavigate();
  const [activeSubView, setActiveSubView] = useState<'notes' | 'meetings'>('notes');

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
        alert(d.error || 'Failed to delete meeting');
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting meeting');
    } finally {
      setIsDeletingMeeting(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotes(searchQuery, periodFrom, periodTo);
  };

  useEffect(() => {
    fetchNotes(searchQuery, periodFrom, periodTo);
    fetchMeetings();
    fetchTelegramConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodFrom, periodTo]);

  useEffect(() => {
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

  const todayStr = new Date().toISOString().slice(0, 10);
  const filteredMeetings = meetings.filter(m => {
    if (meetingFilter === 'upcoming') {
      return (m.meeting_date >= todayStr) && m.status !== 'Cancelled';
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

      {/* Sub-view switcher: Notes & Minutes vs Scheduled IT Meetings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveSubView('notes')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubView === 'notes'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={14} className={activeSubView === 'notes' ? 'text-indigo-600' : 'text-slate-400'} />
            <span>Notes & Documents</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
              activeSubView === 'notes' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {notes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('meetings')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubView === 'meetings'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar size={14} className={activeSubView === 'meetings' ? 'text-indigo-600' : 'text-slate-400'} />
            <span>Schedule & IT Meetings</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
              activeSubView === 'meetings' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {meetings.length}
            </span>
          </button>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button 
            onClick={() => setIsSettingsOpen(true)} 
            variant="secondary" 
            size="md" 
            className="rounded-full shadow-sm whitespace-nowrap h-10 px-4 text-xs font-semibold"
          >
            <Bell className="mr-2 h-4 w-4 text-indigo-500" />
            Telegram Settings
          </Button>

          <button
            type="button"
            onClick={() => {
              setEditingMeeting(null);
              setShowScheduleModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-full shadow-lg shadow-indigo-600/20 whitespace-nowrap h-10 transition-all hover:scale-[1.02]"
            title="Schedule an IT monthly meeting and broadcast reminder to Telegram group"
          >
            <CalendarPlus size={16} />
            <span>Schedule Meeting</span>
          </button>

          <Button 
            onClick={() => navigate(RoutePath.CREATE_NOTE)} 
            size="md" 
            className="rounded-full shadow-lg shadow-indigo-500/20 whitespace-nowrap h-10 px-5 text-xs font-semibold"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </div>
      </div>

      {/* Date & Search Filters Toolbar (when in notes view) */}
      {activeSubView === 'notes' && (
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        {/* Date Range Picker */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-full bg-white px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm">
            <span className="text-xs font-semibold text-slate-400 mr-2 uppercase tracking-wide">From</span>
            <input 
              type="date"
              title="Period From"
              value={periodFrom}
              onChange={(e) => setPeriodFrom(e.target.value)}
              className="w-28 text-sm focus:outline-none text-slate-700 bg-transparent"
            />
          </div>
          <span className="text-slate-300 font-medium">-</span>
          <div className="flex items-center border border-slate-200 rounded-full bg-white px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm">
            <span className="text-xs font-semibold text-slate-400 mr-2 uppercase tracking-wide">To</span>
            <input 
              type="date"
              title="Period To"
              value={periodTo}
              onChange={(e) => setPeriodTo(e.target.value)}
              className="w-28 text-sm focus:outline-none text-slate-700 bg-transparent"
            />
          </div>
          {(periodFrom || periodTo) && (
            <button
              onClick={() => { setPeriodFrom(''); setPeriodTo(''); }}
              className="p-1.5 text-xs text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              title="Clear date filter"
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        {/* Search & Actions */}
        <div className="flex flex-1 items-center gap-3 justify-end flex-wrap sm:flex-nowrap">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs group">
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
                    
                    <p className="text-slate-500 line-clamp-3 leading-relaxed text-sm mb-5 font-light">
                      {getPreviewText(note.content) || <span className="italic opacity-50">Empty note</span>}
                    </p>

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

      {/* SCHEDULED IT MEETINGS VIEW */}
      {activeSubView === 'meetings' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Sub-filter & status summary bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                Filter Meetings:
              </span>
              <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMeetingFilter('upcoming')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    meetingFilter === 'upcoming'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  onClick={() => setMeetingFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    meetingFilter === 'all'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Scheduled ({meetings.length})
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2 pr-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Telegram Bot integration active</span>
            </div>
          </div>

          {loadingMeetings ? (
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
                  </div>

                  {/* Card Footer: Organizer & Telegram Alert Dispatch Status */}
                  <div className="mt-auto pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <User size={13} />
                      <span>Yours, <strong className="text-slate-800">{m.organizer_name}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
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
                        disabled={sendingMeetingAlertId === m.id}
                        onClick={() => handleSendTelegramAlert(m)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
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
          ) : (
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

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={showScheduleModal}
        meeting={editingMeeting}
        onClose={() => setShowScheduleModal(false)}
        onSaved={(_saved, alertSent) => {
          fetchMeetings();
          showToast(
            alertSent 
              ? 'IT meeting scheduled and Telegram alert broadcasted to group!' 
              : 'IT meeting schedule saved successfully!',
            'success'
          );
        }}
      />

      {/* Delete Meeting Confirmation Modal */}
      {meetingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md space-y-4 rounded-3xl border border-white/80 bg-white/95 backdrop-blur-2xl p-6 md:p-7 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Scheduled Meeting?</h3>
                  <p className="text-xs text-slate-500">Remove meeting from schedule records</p>
                </div>
              </div>
              <button 
                onClick={() => setMeetingToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
              Are you sure you want to delete <strong className="text-slate-900 font-semibold">"{meetingToDelete.title}"</strong> on {meetingToDelete.meeting_date}?
            </p>
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button"
                disabled={isDeletingMeeting}
                onClick={() => setMeetingToDelete(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingMeeting}
                onClick={handleDeleteMeetingConfirm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-500/20 hover:bg-rose-700 transition-all outline-none disabled:opacity-50"
              >
                {isDeletingMeeting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete Meeting'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Note Confirmation Modal */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md space-y-4 rounded-3xl border border-white/80 bg-white/95 backdrop-blur-2xl p-6 md:p-7 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete note?</h3>
                  <p className="text-xs text-slate-500">This action cannot be undone.</p>
                </div>
              </div>
              <button 
                onClick={() => setNoteToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
              Are you sure you want to permanently delete <strong className="text-slate-900 font-semibold">"{noteToDelete.title || 'Untitled note'}"</strong>? All associated content and attachments will be removed.
            </p>

            {deleteNoteError && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                {deleteNoteError}
              </div>
            )}
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button"
                disabled={isDeletingNote}
                onClick={() => { setNoteToDelete(null); setDeleteNoteError(null); }}
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingNote}
                onClick={handleDeleteNoteConfirm}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-red-500/20 hover:bg-red-700 active:scale-95 transition-all outline-none disabled:opacity-50"
              >
                {isDeletingNote ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete note'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Group Broadcast Confirmation Modal */}
      {broadcastMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
                  <Send size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Broadcast Alert to Telegram Groups</h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {broadcastMeetingModal.title} · {broadcastMeetingModal.meeting_date}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastMeetingModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs">
              {/* Target Groups Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Users size={13} className="text-indigo-600" />
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
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {broadcastSelectedGroupIds.length === availableGroups.length ? 'Clear All' : 'Select All'}
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {availableGroups.length === 0 ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px]">
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
                              ? 'bg-indigo-50/90 border-indigo-200 text-indigo-950 font-semibold shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isChecked ? (
                              <CheckSquare size={14} className="text-indigo-600 shrink-0" />
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
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare size={12} className="text-indigo-600" />
                    <span>Formatted Template Message</span>
                  </span>
                  <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
                    Exact Notification
                  </span>
                </div>
                <pre className="text-[10px] font-mono text-slate-800 whitespace-pre-wrap max-h-36 overflow-y-auto bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
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

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  variant="ghost"
                  disabled={isBroadcasting}
                  onClick={() => setBroadcastMeetingModal(null)}
                  className="rounded-xl text-xs h-9 px-4"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmBroadcast}
                  disabled={isBroadcasting || broadcastSelectedGroupIds.length === 0}
                  className="rounded-xl text-xs h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/25"
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
              </div>
            </div>
          </div>
        </div>
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};