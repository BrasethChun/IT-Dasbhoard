import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, ArrowUpRight, Calendar, Search, Bell, Trash2, Loader2, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Note, RoutePath } from '../../types';
import { noteService } from '../../services/noteService';
import { StorageImage } from '../../components/ui/StorageImage';
import { SettingsModal } from './SettingsModal';
import { getDefaultCoverForNote, getCoverBadge } from '../../src/utils/sampleCovers';

export const MyNotes: React.FC = () => {
  const navigate = useNavigate();
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotes(searchQuery, periodFrom, periodTo);
  };

  useEffect(() => {
    fetchNotes(searchQuery, periodFrom, periodTo);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Compact Top Bar without H1 header */}
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

          <div className="flex items-center gap-2">
            <Button onClick={() => setIsSettingsOpen(true)} variant="secondary" size="md" className="rounded-full shadow-sm whitespace-nowrap h-10 px-4">
              <Bell className="mr-2 h-4 w-4 text-indigo-500" />
              Settings
            </Button>
            <Button onClick={() => navigate(RoutePath.CREATE_NOTE)} size="md" className="rounded-full shadow-lg shadow-indigo-500/20 whitespace-nowrap h-10 px-5">
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Button>
          </div>
        </div>
      </div>

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

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};