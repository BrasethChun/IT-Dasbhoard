import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Edit3, Trash2, ArrowLeft, Calendar, Clock, AlertCircle, Paperclip, FileText, Download, Link2, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SmartModal } from '../../components/ui/SmartModal';
import { noteService } from '../../services/noteService';
import { storageService } from '../../services/storageService';
import { Note, RoutePath } from '../../types';
import { StorageImage } from '../../components/ui/StorageImage';
import { getDefaultCoverForNote, getCoverBadge } from '../../src/utils/sampleCovers';

export const SingleNote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchNote = async () => {
      try {
        const isPublicRoute = location.pathname.includes('/public/notes/');
        const data = isPublicRoute ? await noteService.getPublicById(id) : await noteService.getById(id);
        if (data) {
          setNote(data);
        } else {
          if (isPublicRoute) {
            setError("This note could not be found or is not available publicly.");
          } else {
            navigate(RoutePath.NOTES);
          }
        }
      } catch (err) {
        console.error("Failed to fetch note", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsConfirmOpen(false);
      }
    };
    
    if (isConfirmOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isConfirmOpen]);

  const initiateDelete = () => {
    setIsConfirmOpen(true);
  };

  const performDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    setError(null);

    try {
      await noteService.delete(id);
      navigate(RoutePath.NOTES);
    } catch (err) {
      console.error("Failed to delete note:", err);
      setError("Something went wrong while deleting this note. Please try again.");
      setIsDeleting(false);
      setIsConfirmOpen(false); 
    }
  };

  const handleEdit = () => {
    if (id) {
      navigate(RoutePath.EDIT_NOTE.replace(':id', id));
    }
  };

  const downloadAttachment = async (path: string) => {
    const url = await storageService.getSignedUrl(path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900"></div></div>;
  if (!note && !error) return null;

  const isPublicRoute = location.pathname.includes('/public/notes/');

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6 animate-in fade-in duration-300 pb-8 sm:pb-20 relative">
        {/* Sticky Header */}
        <div className="flex items-center justify-between sticky top-14 lg:top-0 bg-[#FAFAFA]/90 backdrop-blur-sm py-3 sm:py-4 z-10 px-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(isPublicRoute ? RoutePath.HOME : RoutePath.NOTES)} className="-ml-3 text-zinc-500 hover:text-zinc-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {!isPublicRoute && (
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleEdit}
              disabled={isDeleting}
            >
              <Edit3 className="mr-2 h-3.5 w-3.5 text-zinc-500" />
              Edit
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={initiateDelete} 
              isLoading={isDeleting}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-100"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Note Content */}
        {note && (
          <article className="rounded-xl border border-zinc-200/60 bg-white shadow-subtle overflow-hidden">
            {/* Cover Header Banner */}
            <div className="relative h-48 sm:h-64 md:h-72 w-full bg-slate-900 border-b border-zinc-100 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent z-10" />
              <StorageImage 
                path={getDefaultCoverForNote(note)} 
                alt={note.title} 
                className="h-full w-full object-cover" 
              />
              <div className="absolute bottom-4 left-5 sm:left-6 md:left-10 z-20">
                <span className="rounded-md bg-slate-900/80 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white/95 shadow-md ring-1 ring-white/10">
                  {getCoverBadge(getDefaultCoverForNote(note))}
                </span>
              </div>
            </div>
            
            <div className="p-5 sm:p-8 md:p-12">
              <h1 className="mb-5 sm:mb-6 text-2xl sm:text-4xl font-bold tracking-tight text-zinc-900">{note.title || 'My notes'}</h1>
            
            <div className="mb-6 flex flex-wrap gap-4 text-xs font-medium uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-6">
              <span className="flex items-center"><Calendar size={14} className="mr-1.5 opacity-70" /> Created: {new Date(note.createdAt).toLocaleDateString()}</span>
              <span className="flex items-center"><Clock size={14} className="mr-1.5 opacity-70" /> Updated: {new Date(note.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>

            {note.linkedSourceType && (
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-indigo-200/80 bg-indigo-50/60 px-4 py-3 text-xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Link2 size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-bold text-indigo-950">
                      {note.linkedSourceType === 'it_meeting'
                        ? 'Linked to Schedule & IT Meetings'
                        : 'Linked to My Scheduler'}
                    </div>
                    <div className="text-indigo-900/80 font-medium truncate mt-0.5">
                      {note.linkedSourceTitle || note.title}
                      {note.meetingDate ? ` · ${note.meetingDate}` : ''}
                      {note.meetingVenue ? (
                        <span className="inline-flex items-center gap-1 ml-2 text-indigo-800/80">
                          <MapPin size={11} />
                          {note.meetingVenue}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                {!isPublicRoute && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `${RoutePath.NOTES}?tab=${
                          note.linkedSourceType === 'it_meeting' ? 'meetings' : 'personal'
                        }`
                      )
                    }
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100/70 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  >
                    {note.linkedSourceType === 'it_meeting' ? 'Open in IT Meetings' : 'Open in Scheduler'}
                  </button>
                )}
              </div>
            )}

            <div 
              className="prose prose-zinc prose-lg max-w-none text-zinc-600 leading-8"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />

            {/* Attachments Section */}
            {note.attachments && note.attachments.length > 0 && (
              <div className="mt-12 border-t border-zinc-100 pt-8">
                 <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                    <Paperclip size={16} className="text-zinc-400" />
                    Attachments
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {note.attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-white hover:shadow-sm transition-all group">
                         <div className="h-10 w-10 shrink-0 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 shadow-sm">
                            <FileText size={20} />
                         </div>
                         <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-zinc-700 truncate">{att.name}</p>
                            <p className="text-xs text-zinc-400">{(att.size / 1024).toFixed(1)} KB</p>
                         </div>
                         <button 
                            onClick={() => downloadAttachment(att.path)}
                            className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Download"
                         >
                            <Download size={16} />
                         </button>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </div>
        </article>
        )}
      </div>

      {/* Confirmation Modal */}
      <SmartModal
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Delete this note?"
        subtitle="This action cannot be undone"
        icon={<Trash2 size={18} className="text-rose-600" />}
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isDeleting}
              onClick={() => setIsConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={performDelete}
            >
              {isDeleting ? 'Deleting...' : 'Delete note'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          This action cannot be undone. Are you sure you want to permanently delete this note?
        </p>
      </SmartModal>
    </>
  );
};