import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  HelpCircle,
  Link2,
  ListChecks,
  MapPin,
  Pin,
  Save,
  Sparkles,
  User
} from 'lucide-react';
import { Note } from '../types';
import { noteService } from '../services/noteService';
import { Button } from './ui/Button';
import { Editor } from './ui/Editor';
import { SmartModal, SMART_INPUT_CLASS } from './ui/SmartModal';

export interface LiveMeetingNoteTarget {
  sourceType: 'it_meeting' | 'personal_event';
  sourceId: string;
  title: string;
  date: string;
  timeRange: string;
  location: string;
  hostOrOrganizer: string;
  joinUrl?: string;
  agendaOrNotes?: string;
  linkedNoteId?: string | null;
  initialMode?: 'edit' | 'view';
}

interface LiveMeetingNotesModalProps {
  isOpen: boolean;
  target: LiveMeetingNoteTarget | null;
  availableNotes: Note[];
  onClose: () => void;
  onSaved: (note: Note) => void;
  onOpenFullNote: (noteId: string, edit?: boolean) => void;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildInitialMeetingMinutesHtml(target: LiveMeetingNoteTarget): string {
  const safeTitle = escapeHtml(target.title || 'Meeting Notes');
  const safeDate = escapeHtml(target.date || '');
  const safeTime = escapeHtml(target.timeRange || '');
  const safeLoc = escapeHtml(target.location || 'TBD');
  const safeHost = escapeHtml(target.hostOrOrganizer || 'Team');

  const rawAgenda = (target.agendaOrNotes || '').trim();
  const agendaLines = rawAgenda
    ? rawAgenda
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
    : [];

  let agendaHtml = '';
  if (agendaLines.length > 0) {
    agendaHtml = `<h2>Agenda &amp; Discussion</h2>`;
    for (const line of agendaLines) {
      agendaHtml += `<h3>${escapeHtml(line)}</h3><ul><li>Notes: </li></ul>`;
    }
  } else {
    agendaHtml = `<h2>Discussion Notes</h2><ul><li>Key topic: </li></ul>`;
  }

  return `<h2>Meeting Context</h2><ul><li><strong>Title:</strong> ${safeTitle}</li><li><strong>Date &amp; Time:</strong> ${safeDate}${safeTime ? ` · ${safeTime}` : ''}</li><li><strong>Physical Location / Room:</strong> ${safeLoc}</li><li><strong>Host / Organizer:</strong> ${safeHost}</li></ul>${agendaHtml}<h2>Key Decisions</h2><ul><li>Decision: </li></ul><h2>Action Items</h2><ul><li>[ ] Task — <strong>Owner:</strong> | <strong>Due:</strong> </li></ul>`;
}

export const LiveMeetingNotesModal: React.FC<LiveMeetingNotesModalProps> = ({
  isOpen,
  target,
  availableNotes,
  onClose,
  onSaved,
  onOpenFullNote
}) => {
  const [mode, setMode] = useState<'edit' | 'view'>('edit');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [loadingNote, setLoadingNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [linkingExisting, setLinkingExisting] = useState(false);
  const [selectedExistingId, setSelectedExistingId] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen || !target) return;

    let cancelled = false;
    setStatusMsg(null);
    setSelectedExistingId('');
    setIsDirty(false);
    quillRef.current = null;

    const initSession = async () => {
      if (target.linkedNoteId) {
        setLoadingNote(true);
        try {
          const existing = await noteService.getById(target.linkedNoteId);
          if (!cancelled && existing) {
            setActiveNoteId(existing.id);
            setNoteTitle(existing.title || `${target.title} — Notes`);
            setNoteContent(existing.content || buildInitialMeetingMinutesHtml(target));
            setMode(target.initialMode || 'view');
            setLoadingNote(false);
            return;
          }
        } catch (err) {
          console.warn('Could not load linked note:', err);
        } finally {
          if (!cancelled) setLoadingNote(false);
        }
      }

      if (!cancelled) {
        setActiveNoteId(null);
        setNoteTitle(`${target.title} — Notes (${target.date})`);
        setNoteContent(buildInitialMeetingMinutesHtml(target));
        setMode('edit');
      }
    };

    initSession();
    return () => {
      cancelled = true;
    };
  }, [isOpen, target]);

  const unlinkedOrAllNotes = useMemo(() => {
    return availableNotes.filter((n) => n.id !== activeNoteId);
  }, [availableNotes, activeNoteId]);

  const insertHtmlSnippet = (htmlSnippet: string) => {
    setMode('edit');
    setIsDirty(true);
    const q = quillRef.current;
    if (q) {
      const range = q.getSelection(true);
      const index = range ? range.index : Math.max(0, q.getLength() - 1);
      q.clipboard.dangerouslyPasteHTML(index, htmlSnippet, 'user');
      const nextHtml = q.root.innerHTML;
      setNoteContent(nextHtml === '<p><br></p>' ? '' : nextHtml);
    } else {
      setNoteContent((prev) => `${prev || ''}${htmlSnippet}`);
    }
  };

  const handleInsertTimestamp = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    insertHtmlSnippet(`<p><strong>[${hh}:${mm}]</strong> </p>`);
  };

  const handleInsertDecision = () => {
    insertHtmlSnippet(`<p><strong>✅ Decision:</strong> </p>`);
  };

  const handleInsertActionItem = () => {
    insertHtmlSnippet(`<p><strong>📌 Action Item:</strong> [Task] — <strong>Owner:</strong> @ | <strong>Due:</strong> </p>`);
  };

  const handleInsertFollowUp = () => {
    insertHtmlSnippet(`<p><strong>❓ Follow-up:</strong> </p>`);
  };

  const persistNote = async (): Promise<Note | null> => {
    if (!target) return null;
    if (!noteTitle.trim() && !noteContent.trim()) {
      setStatusMsg({ text: 'Please enter a title or meeting notes before saving.', type: 'error' });
      return null;
    }

    setSaving(true);
    setStatusMsg(null);
    try {
      let saved: Note;
      if (activeNoteId) {
        saved = await noteService.update(activeNoteId, {
          title: noteTitle.trim() || `${target.title} — Notes`,
          content: noteContent,
          meetingDate: target.date,
          meetingVenue: target.location,
          agenda: target.agendaOrNotes || '',
          linkedSourceType: target.sourceType,
          linkedSourceId: target.sourceId,
          linkedSourceTitle: target.title
        });
      } else {
        saved = await noteService.create(
          {
            title: noteTitle.trim() || `${target.title} — Notes (${target.date})`,
            content: noteContent,
            tags: [target.sourceType === 'it_meeting' ? 'IT Meeting' : 'My Scheduler'],
            meetingDate: target.date,
            meetingVenue: target.location,
            agenda: target.agendaOrNotes || '',
            meetingPriority: 'Medium',
            linkedSourceType: target.sourceType,
            linkedSourceId: target.sourceId,
            linkedSourceTitle: target.title
          },
          true
        );
        setActiveNoteId(saved.id);
      }

      setIsDirty(false);
      setStatusMsg({ text: 'Meeting notes saved and linked cleanly.', type: 'success' });
      onSaved(saved);
      return saved;
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to save meeting notes.', type: 'error' });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleLinkExistingNote = async (existingId: string) => {
    if (!existingId || !target) return;
    setLinkingExisting(true);
    setStatusMsg(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/notes/${existingId}/link-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceType: target.sourceType,
          sourceId: target.sourceId,
          sourceTitle: target.title
        })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to link existing note');
      }
      const linkedNote: Note = await res.json();
      setActiveNoteId(linkedNote.id);
      setNoteTitle(linkedNote.title || '');
      setNoteContent(linkedNote.content || '');
      setIsDirty(false);
      setSelectedExistingId('');
      setStatusMsg({ text: `Linked existing note "${linkedNote.title}" to this schedule.`, type: 'success' });
      onSaved(linkedNote);
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Could not link existing note.', type: 'error' });
    } finally {
      setLinkingExisting(false);
    }
  };

  const handleSaveAndClose = async () => {
    const saved = await persistNote();
    if (saved) onClose();
  };

  const handleOpenFull = async () => {
    let noteIdToOpen = activeNoteId;
    if (!noteIdToOpen || isDirty) {
      const saved = await persistNote();
      if (!saved) return;
      noteIdToOpen = saved.id;
    }
    onClose();
    onOpenFullNote(noteIdToOpen!, mode === 'edit');
  };

  if (!target) return null;

  return (
    <SmartModal
      open={isOpen}
      onClose={() => !saving && onClose()}
      title={activeNoteId ? 'Meeting / Event Notes' : 'Take Live Meeting Notes'}
      subtitle={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
          <span className="font-semibold text-indigo-700 dark:text-indigo-300">
            {target.sourceType === 'it_meeting' ? 'Schedule & IT Meetings' : 'My Scheduler'}
          </span>
          <span>·</span>
          <span className="font-mono tabular-nums">{target.date}</span>
          {target.timeRange && (
            <>
              <span>·</span>
              <span className="font-mono tabular-nums">{target.timeRange}</span>
            </>
          )}
          {target.location && (
            <>
              <span>·</span>
              <span>{target.location}</span>
            </>
          )}
        </span>
      }
      icon={<FileText size={18} />}
      size="xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2 text-xs">
            {isDirty ? (
              <span className="text-amber-700 dark:text-amber-300 font-medium">Unsaved changes</span>
            ) : activeNoteId ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                <CheckCircle2 size={13} />
                <span>Linked &amp; Synced</span>
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenFull}
              disabled={saving || loadingNote}
              className="gap-1.5"
            >
              <ExternalLink size={13} />
              <span>Open Full Note</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={saving}
            >
              Close
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={persistNote}
              isLoading={saving}
              disabled={loadingNote}
              className="gap-1.5"
            >
              <Save size={13} />
              <span>Save</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveAndClose}
              isLoading={saving}
              disabled={loadingNote}
              className="gap-1.5"
            >
              <CheckCircle2 size={13} />
              <span>Save &amp; Done</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Live Schedule Reference Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
          <div className="space-y-1 min-w-0">
            <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
              {target.title}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <Calendar size={12} className="text-indigo-500" />
                <span>{target.date}</span>
              </span>
              {target.timeRange && (
                <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                  <Clock size={12} className="text-slate-400" />
                  <span>{target.timeRange}</span>
                </span>
              )}
              {target.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400" />
                  <span>{target.location}</span>
                </span>
              )}
              {target.hostOrOrganizer && (
                <span className="inline-flex items-center gap-1">
                  <User size={12} className="text-slate-400" />
                  <span>{target.hostOrOrganizer}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {target.joinUrl && (
              <a
                href={target.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap shrink-0 transition-colors"
              >
                <Link2 size={12} />
                <span>Join Meeting</span>
                <ExternalLink size={11} />
              </a>
            )}

            {/* Edit / View Toggle */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  mode === 'edit'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Edit3 size={12} />
                <span>Take Notes</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('view')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  mode === 'view'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Eye size={12} />
                <span>View</span>
              </button>
            </div>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button
              type="button"
              onClick={() => setStatusMsg(null)}
              className="opacity-60 hover:opacity-100 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* Link Existing Note Helper */}
        {unlinkedOrAllNotes.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {activeNoteId
                ? 'Want to switch to a different note from Notes & Documents?'
                : 'Or connect an existing note from Notes & Documents:'}
            </span>
            <div className="flex items-center gap-2 sm:w-80">
              <select
                value={selectedExistingId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedExistingId(val);
                  if (val) handleLinkExistingNote(val);
                }}
                disabled={linkingExisting}
                className={`${SMART_INPUT_CLASS} py-1.5 text-[11px]`}
              >
                <option value="">
                  {linkingExisting ? 'Linking note...' : 'Select existing note to link...'}
                </option>
                {unlinkedOrAllNotes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title || 'Untitled note'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {loadingNote ? (
          <div className="h-64 flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : mode === 'view' ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {noteTitle || 'Untitled Meeting Note'}
              </h2>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Edit3 size={12} />
                <span>Edit Notes</span>
              </button>
            </div>
            <div
              className="prose prose-sm prose-slate dark:prose-invert max-w-none leading-relaxed min-h-[220px]"
              dangerouslySetInnerHTML={{
                __html: noteContent || '<p class="italic text-slate-400">No notes captured yet. Switch to Take Notes to start writing.</p>'
              }}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Note Title
              </label>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => {
                  setNoteTitle(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Meeting / Event Note Title..."
                className={`${SMART_INPUT_CLASS} font-semibold`}
              />
            </div>

            {/* Smart Quick-Capture Helpers */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1.5 flex items-center gap-1">
                <Sparkles size={12} className="text-indigo-500" />
                <span>Quick Insert:</span>
              </span>
              <button
                type="button"
                onClick={handleInsertTimestamp}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                <Clock size={11} />
                <span>+ Time</span>
              </button>
              <button
                type="button"
                onClick={handleInsertDecision}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-300 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                <CheckCircle2 size={11} className="text-emerald-600" />
                <span>+ Decision</span>
              </button>
              <button
                type="button"
                onClick={handleInsertActionItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                <ListChecks size={11} className="text-indigo-600" />
                <span>+ Action Item</span>
              </button>
              <button
                type="button"
                onClick={handleInsertFollowUp}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-300 hover:text-amber-700 transition-colors cursor-pointer"
              >
                <HelpCircle size={11} className="text-amber-600" />
                <span>+ Follow-up</span>
              </button>
              {target.agendaOrNotes && (
                <button
                  type="button"
                  onClick={() =>
                    insertHtmlSnippet(
                      `<h3>Agenda Reference</h3><p>${escapeHtml(target.agendaOrNotes || '').replace(/\n/g, '<br/>')}</p>`
                    )
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                  <Pin size={11} className="text-slate-500" />
                  <span>+ Agenda</span>
                </button>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white overflow-hidden">
              <Editor
                key={`${target.sourceId}-${activeNoteId || 'new'}`}
                value={noteContent}
                onChange={(html) => {
                  setNoteContent(html);
                  setIsDirty(true);
                }}
                onReady={(quill) => {
                  quillRef.current = quill;
                }}
                placeholder="Start capturing live meeting discussion, decisions, and action items..."
                className="min-h-[260px]"
              />
            </div>
          </div>
        )}
      </div>
    </SmartModal>
  );
};
