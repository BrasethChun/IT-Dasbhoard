import React, { useState, useEffect } from 'react';
import { X, Save, Bell, HelpCircle, FileText, Plus, Trash2, Edit2, ChevronLeft, Calendar, Send, CheckCircle2, MessageSquare, Users, CheckSquare, Square, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export interface ITMeetingTelegramGroup {
  id: string;
  name: string;
  chat_id: string;
  is_default: boolean;
}

export const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'telegram' | 'meeting-telegram' | 'templates'>('telegram');

  // Telegram state
  const [chatId, setChatId] = useState('');
  const [botToken, setBotToken] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [loadingTelegram, setLoadingTelegram] = useState(false);
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [tgMsg, setTgMsg] = useState('');
  const [alertTemplates, setAlertTemplates] = useState<string[]>([]);

  // IT Meeting Telegram state
  const [meetingGroups, setMeetingGroups] = useState<ITMeetingTelegramGroup[]>([
    { id: 'grp-it-core', name: 'IT Core Operations', chat_id: '', is_default: true },
    { id: 'grp-sakal', name: 'Sakal Polyclinic IT', chat_id: '', is_default: true },
    { id: 'grp-kg', name: 'Khema Global (KG)', chat_id: '', is_default: false },
    { id: 'grp-k1k2', name: 'K1 & K2 Campus Team', chat_id: '', is_default: false }
  ]);
  const [meetingGroupChatId, setMeetingGroupChatId] = useState('');
  const [meetingBotToken, setMeetingBotToken] = useState('');
  const [meetingVenue, setMeetingVenue] = useState('Sakal Polyclinic');
  const [meetingRoomNote, setMeetingRoomNote] = useState('Bunnarith, please help to book the meeting room');
  const [meetingOrganizer, setMeetingOrganizer] = useState('Braseth');
  const [meetingStartTime, setMeetingStartTime] = useState('2pm');
  const [meetingEndTime, setMeetingEndTime] = useState('4PM');
  const [loadingMeetingTg, setLoadingMeetingTg] = useState(false);
  const [savingMeetingTg, setSavingMeetingTg] = useState(false);
  const [testingMeetingTg, setTestingMeetingTg] = useState(false);
  const [testingGroupId, setTestingGroupId] = useState<string | null>(null);
  const [meetingTgMsg, setMeetingTgMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Templates state
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  // Template CRUD state
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [tmplName, setTmplName] = useState('');
  const [tmplTitle, setTmplTitle] = useState('');
  const [tmplContent, setTmplContent] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTelegramSettings();
      loadMeetingTelegramSettings();
      loadTemplates();
      setActiveTab('telegram');
      setEditingTemplate(null);
    }
  }, [isOpen]);

  const loadMeetingTelegramSettings = async () => {
    setLoadingMeetingTg(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/it-meetings/telegram-config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMeetingGroups(Array.isArray(data.groups) && data.groups.length > 0 ? data.groups : [
          { id: 'grp-it-core', name: 'IT Core Operations', chat_id: '', is_default: true },
          { id: 'grp-sakal', name: 'Sakal Polyclinic IT', chat_id: '', is_default: true },
          { id: 'grp-kg', name: 'Khema Global (KG)', chat_id: '', is_default: false },
          { id: 'grp-k1k2', name: 'K1 & K2 Campus Team', chat_id: '', is_default: false }
        ]);
        setMeetingGroupChatId(data.group_chat_id || '');
        setMeetingBotToken(data.bot_token || '');
        setMeetingVenue(data.default_venue || 'Sakal Polyclinic');
        setMeetingRoomNote(data.default_room_note || 'Bunnarith, please help to book the meeting room');
        setMeetingOrganizer(data.default_organizer || 'Braseth');
        setMeetingStartTime(data.default_start_time || '2pm');
        setMeetingEndTime(data.default_end_time || '4PM');
      }
    } catch (e) {
      console.error('Failed to load IT meeting telegram config:', e);
    }
    setLoadingMeetingTg(false);
  };

  const handleAddGroup = () => {
    const newId = `grp-${Date.now()}`;
    setMeetingGroups(prev => [
      ...prev,
      { id: newId, name: `Telegram Group ${prev.length + 1}`, chat_id: '', is_default: false }
    ]);
  };

  const handleUpdateGroup = (id: string, updates: Partial<ITMeetingTelegramGroup>) => {
    setMeetingGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const handleDeleteGroup = (id: string) => {
    setMeetingGroups(prev => prev.filter(g => g.id !== id));
  };

  const handleAddPresetGroup = (name: string) => {
    const newId = `grp-${Date.now()}`;
    setMeetingGroups(prev => [
      ...prev,
      { id: newId, name, chat_id: '', is_default: true }
    ]);
  };

  const handleSaveMeetingTelegram = async () => {
    setSavingMeetingTg(true);
    setMeetingTgMsg(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/it-meetings/telegram-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bot_token: meetingBotToken.trim(),
          group_chat_id: meetingGroupChatId.trim(),
          groups: meetingGroups,
          default_venue: meetingVenue.trim(),
          default_room_note: meetingRoomNote.trim(),
          default_organizer: meetingOrganizer.trim(),
          default_start_time: meetingStartTime.trim(),
          default_end_time: meetingEndTime.trim()
        })
      });
      if (res.ok) {
        setMeetingTgMsg({ text: `IT Meeting multi-group settings saved successfully (${meetingGroups.length} groups)!`, type: 'success' });
        setTimeout(() => setMeetingTgMsg(null), 4000);
      } else {
        const d = await res.json();
        setMeetingTgMsg({ text: d.error || 'Failed to save settings.', type: 'error' });
      }
    } catch (e: any) {
      setMeetingTgMsg({ text: e.message || 'An error occurred.', type: 'error' });
    }
    setSavingMeetingTg(false);
  };

  const handleTestMeetingTelegram = async (specificGroupId?: string) => {
    if (specificGroupId) {
      setTestingGroupId(specificGroupId);
    } else {
      setTestingMeetingTg(true);
    }
    setMeetingTgMsg(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/it-meetings/test-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bot_token: meetingBotToken.trim(),
          groups: meetingGroups,
          group_id: specificGroupId || null,
          test_all_groups: !specificGroupId
        })
      });
      const d = await res.json();
      if (res.ok) {
        setMeetingTgMsg({ text: d.message || 'Test meeting notification dispatched to Telegram group(s)!', type: 'success' });
      } else {
        setMeetingTgMsg({ text: d.error || 'Failed to send test alert.', type: 'error' });
      }
    } catch (e: any) {
      setMeetingTgMsg({ text: e.message || 'Test broadcast failed.', type: 'error' });
    }
    setTestingMeetingTg(false);
    setTestingGroupId(null);
  };

  const loadTelegramSettings = async () => {
    setLoadingTelegram(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/telegram/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChatId(data.chatId || '');
        setBotToken(data.botToken || '');
        setEnabled(data.enabled);
        setAlertTemplates(data.alertTemplates || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingTelegram(false);
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/note-templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTemplates(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingTemplates(false);
  };

  const handleSaveTelegram = async () => {
    setSavingTelegram(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/telegram/settings', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ chatId, botToken, enabled, alertTemplates })
      });
      if (res.ok) {
        setTgMsg('Settings saved successfully!');
        setTimeout(() => setTgMsg(''), 3000);
      } else {
        setTgMsg('Failed to save settings.');
      }
    } catch (e) {
      console.error(e);
      setTgMsg('An error occurred.');
    }
    setSavingTelegram(false);
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/telegram/test', {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ chatId, botToken })
        });
        if (res.ok) {
          setTgMsg('Test notification sent!');
        } else {
          const data = await res.json();
          setTgMsg(`Error: ${data.error || 'Failed to send test.'}`);
        }
        setTimeout(() => setTgMsg(''), 5000);
      } catch (e) {
        console.error(e);
        setTgMsg('An error occurred.');
      }
      setTestingTelegram(false);
  };

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      const token = localStorage.getItem('token');
      const isEdit = !!editingTemplate?.id;
      const url = isEdit ? `/api/note-templates/${editingTemplate.id}` : '/api/note-templates';
      const method = isEdit ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: tmplName, title: tmplTitle, content: tmplContent })
      });
      if (res.ok) {
        await loadTemplates();
        setEditingTemplate(null);
      }
    } catch (e) {
       console.error(e);
    }
    setSavingTemplate(false);
  };

  const handleDeleteTemplate = (id: string) => {
    setConfirmDeleteTemplateId(id);
  };

  const confirmDeleteTemplate = async () => {
    if (!confirmDeleteTemplateId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/note-templates/${confirmDeleteTemplateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setConfirmDeleteTemplateId(null);
        await loadTemplates();
      }
    } catch (e) {
      console.error(e);
      setConfirmDeleteTemplateId(null);
    }
  };

  const openTemplateEditor = (tmpl?: any) => {
    if (tmpl) {
        setEditingTemplate(tmpl);
        setTmplName(tmpl.name || '');
        setTmplTitle(tmpl.title || '');
        setTmplContent(tmpl.content || '');
    } else {
        setEditingTemplate({ isNew: true });
        setTmplName('');
        setTmplTitle('');
        setTmplContent('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 h-[600px] flex flex-col">
        <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-6">
            <button 
                onClick={() => setActiveTab('telegram')} 
                className={`flex items-center gap-2 font-semibold text-sm transition-colors ${activeTab === 'telegram' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Bell size={16} /> Notifications
            </button>
            <button 
                onClick={() => setActiveTab('meeting-telegram')} 
                className={`flex items-center gap-2 font-semibold text-sm transition-colors ${activeTab === 'meeting-telegram' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Calendar size={16} /> IT Meeting Alert
            </button>
            <button 
                onClick={() => setActiveTab('templates')} 
                className={`flex items-center gap-2 font-semibold text-sm transition-colors ${activeTab === 'templates' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <FileText size={16} /> Note Templates
            </button>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {activeTab === 'meeting-telegram' && (
                <div className="p-6 space-y-5">
                    {loadingMeetingTg ? (
                        <div className="flex justify-center p-8"><div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                        <>
                        {meetingTgMsg && (
                            <div className={`px-4 py-3 rounded-xl text-xs font-semibold border flex items-center justify-between ${
                              meetingTgMsg.type === 'success' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              <span>{meetingTgMsg.text}</span>
                              <button onClick={() => setMeetingTgMsg(null)} className="text-xs opacity-60 hover:opacity-100">&times;</button>
                            </div>
                        )}

                        {/* Template Format Preview Card */}
                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <MessageSquare size={14} className="text-indigo-600" />
                                    <span>Template Message Format (Auto-Formatted Broadcast)</span>
                                </span>
                                <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                    Markdown / Plain Text
                                </span>
                            </div>
                            <pre className="text-[11px] font-mono text-slate-700 bg-white p-3 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed shadow-2xs">
{`Dear All,
 
Please be reminded of our IT monthly meeting on this coming Saturdays, 12 September 2026 from ${meetingStartTime || '2pm'} to ${meetingEndTime || '4PM'}, at ${meetingVenue || 'Sakal Polyclinic'}${meetingRoomNote ? ` (${meetingRoomNote})` : ''}.

Following are our provisional agenda:

1- Monthly Reporting by Portfolios (including updates on any follow-ups from the last meeting)
2- Upcoming Planned Activities
3- AOB

Yours,

${meetingOrganizer || 'Braseth'}`}
                            </pre>
                        </div>

                        {/* Telegram Bot Token (Global / Override) */}
                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-800 block">
                                    Telegram Bot Token (Optional Override)
                                </label>
                                <input
                                    type="password"
                                    placeholder="Leave blank to use system bot token (or enter 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)"
                                    value={meetingBotToken}
                                    onChange={(e) => setMeetingBotToken(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <span className="text-[10px] text-slate-400 block">
                                    Used to dispatch automated meeting reminders to all configured groups below.
                                </span>
                            </div>
                        </div>

                        {/* MULTI-GROUP ALERT MANAGER */}
                        <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Users size={16} className="text-indigo-600" />
                                        <h4 className="text-xs font-bold text-slate-900">
                                            Configured Telegram Alert Groups ({meetingGroups.length})
                                        </h4>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                        Meeting alerts can be broadcast to any or all of these groups in parallel.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAddGroup}
                                    className="rounded-xl text-xs h-8 px-3 text-indigo-700 bg-white hover:bg-indigo-50 border-indigo-200 flex items-center gap-1.5 font-bold shadow-2xs"
                                >
                                    <Plus size={13} />
                                    <span>Add Group</span>
                                </Button>
                            </div>

                            {/* Preset Buttons */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                                    Quick Presets:
                                </span>
                                {[
                                    'IT Core Operations',
                                    'Sakal Polyclinic Team',
                                    'Khema Global (KG)',
                                    'K1 & K2 Campus Team'
                                ].map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => handleAddPresetGroup(preset)}
                                        className="text-[10px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 transition-colors shadow-2xs flex items-center gap-1 font-medium"
                                    >
                                        <Sparkles size={10} className="text-indigo-500" />
                                        <span>+ {preset}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Groups List */}
                            <div className="space-y-2.5 pt-1">
                                {meetingGroups.length === 0 ? (
                                    <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
                                        No Telegram groups added yet. Click &quot;Add Group&quot; or choose a quick preset above.
                                    </div>
                                ) : (
                                    meetingGroups.map((group, idx) => (
                                        <div
                                            key={group.id}
                                            className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                        >
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                                        Group Label / Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. IT Core Operations"
                                                        value={group.name}
                                                        onChange={(e) => handleUpdateGroup(group.id, { name: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                                        Telegram Chat ID *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. -100123456789 or @group_id"
                                                        value={group.chat_id}
                                                        onChange={(e) => handleUpdateGroup(group.id, { chat_id: e.target.value })}
                                                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:bg-white focus:outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                                <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={group.is_default}
                                                        onChange={(e) => handleUpdateGroup(group.id, { is_default: e.target.checked })}
                                                        className="w-3.5 h-3.5 text-indigo-600 rounded"
                                                    />
                                                    <span className="font-medium">Default</span>
                                                </label>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        disabled={!group.chat_id || testingGroupId === group.id}
                                                        onClick={() => handleTestMeetingTelegram(group.id)}
                                                        className="px-2 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200/80 transition-colors disabled:opacity-40"
                                                        title="Send test reminder only to this group"
                                                    >
                                                        {testingGroupId === group.id ? 'Sending...' : 'Test'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteGroup(group.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Delete group"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Default Meeting Variables */}
                        <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
                            <span className="text-xs font-bold text-slate-800 block">
                                Default Meeting Schedule Presets
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 block">
                                        Default Campus Venue
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Sakal Polyclinic"
                                        value={meetingVenue}
                                        onChange={(e) => setMeetingVenue(e.target.value)}
                                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 block">
                                        Default Organizer Sign-off
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Braseth"
                                        value={meetingOrganizer}
                                        onChange={(e) => setMeetingOrganizer(e.target.value)}
                                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-700 block">
                                    Default Room Booking Note / Assignee
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Bunnarith, please help to book the meeting room"
                                    value={meetingRoomNote}
                                    onChange={(e) => setMeetingRoomNote(e.target.value)}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-400 block">
                                    Appended in parentheses after the venue in the Telegram alert message.
                                </span>
                            </div>
                        </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'telegram' && (
                <div className="p-6 space-y-6">
                    {loadingTelegram ? (
                        <div className="flex justify-center p-8"><div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                        <>
                        {tgMsg && (
                            <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-xl text-sm border border-indigo-100/50">
                            {tgMsg}
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 block">Bot Token</label>
                            <div className="text-xs text-slate-500 mb-1 flex items-start gap-1.5 leading-relaxed">
                                <HelpCircle size={14} className="shrink-0 mt-0.5" />
                                You can get a token from <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">https://t.me/BotFather</a>
                            </div>
                            <input 
                            type="text" 
                            value={botToken}
                            onChange={e => setBotToken(e.target.value)}
                            placeholder="1234567890:AAH_xxxxxxxxxxxxxxx"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 block">Chat ID</label>
                            <div className="text-xs text-slate-500 mb-1 flex items-start gap-1.5 leading-relaxed">
                                <HelpCircle size={14} className="shrink-0 mt-0.5" />
                                Support Direct Chat / Group / Channel's Chat ID. Get it by sending a message to your bot and checking bot updates.
                            </div>
                            <input 
                            type="text" 
                            value={chatId}
                            onChange={e => setChatId(e.target.value)}
                            placeholder="-100xxxxxxx"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                            />
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer group mt-4 pt-4 border-t border-slate-100">
                            <div className={`relative w-10 h-5 transition-colors duration-300 rounded-full ${enabled ? 'bg-green-500' : 'bg-slate-300'}`}>
                                <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${enabled ? 'translate-x-[20px]' : 'translate-x-0'}`}></div>
                            </div>
                            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="hidden" />
                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Default enabled</span>
                        </label>

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <label className="text-sm font-medium text-slate-700 block mb-3">Send instant push notifications for these templates:</label>
                            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-2">
                                {[
                                    { id: 'it-meeting', name: 'IT Team Meeting' },
                                    { id: 'ops-meeting', name: 'KHEMA - OPERATIONS MANAGEMENT Meeting' },
                                    ...templates
                                ].map(t => (
                                    <label key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-100 cursor-pointer transition-colors">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                            checked={alertTemplates.includes(t.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setAlertTemplates(prev => [...prev, t.id]);
                                                else setAlertTemplates(prev => prev.filter(id => id !== t.id));
                                            }}
                                        />
                                        <span className="text-sm text-slate-700 font-medium">{t.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'templates' && (
                <div className="p-6 h-full flex flex-col">
                   {editingTemplate ? (
                       <div className="space-y-4 flex-1 flex flex-col">
                           <div className="flex items-center gap-2 mb-2">
                               <button onClick={() => setEditingTemplate(null)} className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors">
                                  <ChevronLeft size={20} />
                               </button>
                               <h3 className="font-semibold text-slate-800">{editingTemplate.isNew ? 'Create Template' : 'Edit Template'}</h3>
                           </div>
                           
                           <div>
                               <label className="text-sm font-medium text-slate-700 block mb-1">Template Name (e.g. Daily Standup)</label>
                               <input type="text" value={tmplName} onChange={e => setTmplName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="Template Name" />
                           </div>
                           <div>
                               <label className="text-sm font-medium text-slate-700 block mb-1">Default Note Title (Optional)</label>
                               <input type="text" value={tmplTitle} onChange={e => setTmplTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="Note Title..." />
                           </div>
                           <div className="flex-1 flex flex-col">
                               <label className="text-sm font-medium text-slate-700 block mb-1">Default Content (HTML allowed)</label>
                               <textarea value={tmplContent} onChange={e => setTmplContent(e.target.value)} className="w-full flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-mono" placeholder="<p>Points to discuss...</p>" />
                           </div>
                           
                           <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <Button variant="ghost" onClick={() => setEditingTemplate(null)} size="sm">Cancel</Button>
                                <Button variant="primary" onClick={handleSaveTemplate} isLoading={savingTemplate} size="sm" disabled={!tmplName.trim()}>Save Template</Button>
                           </div>
                       </div>
                   ) : (
                       <div className="space-y-4">
                           <div className="flex items-center justify-between">
                               <h3 className="font-semibold text-slate-800">Your Templates</h3>
                               <Button variant="outline" size="sm" onClick={() => openTemplateEditor()} className="h-8 shadow-sm">
                                   <Plus size={14} className="mr-1.5" /> New Template
                               </Button>
                           </div>
                           
                           {loadingTemplates ? (
                               <div className="py-8 flex justify-center"><div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                           ) : templates.length === 0 ? (
                               <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                   <FileText size={32} className="mb-3 text-slate-300" />
                                   <p className="text-sm">No custom templates yet.</p>
                                   <p className="text-xs mt-1">Create one to quickly generate standardized notes.</p>
                               </div>
                           ) : (
                               <div className="grid gap-3">
                                   {templates.map(tmpl => (
                                       <div key={tmpl.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-white shadow-sm hover:border-indigo-100 transition-colors">
                                            <div>
                                                <div className="font-medium text-sm text-slate-800">{tmpl.name}</div>
                                                <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{tmpl.title || 'No default title'}</div>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => openTemplateEditor(tmpl)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Edit2 size={14}/></button>
                                                <button onClick={() => handleDeleteTemplate(tmpl.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={14}/></button>
                                            </div>
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>
                   )}
                </div>
            )}
        </div>

        {activeTab === 'telegram' && (
            <div className="h-20 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end px-6 gap-3 shrink-0">
                <Button variant="ghost" onClick={onClose} className="rounded-xl h-10 w-24">Cancel</Button>
                <Button variant="outline" onClick={handleTestTelegram} isLoading={testingTelegram} disabled={!botToken || !chatId} className="rounded-xl h-10 px-6 font-medium bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20 hover:border-amber-300 hover:text-amber-800">
                Test 
                </Button>
                <Button variant="primary" onClick={handleSaveTelegram} isLoading={savingTelegram} className="rounded-xl h-10 px-6 bg-green-500 hover:bg-green-600 border-none shadow-md shadow-green-500/30 text-white">
                    <Save size={16} className="mr-2" />
                    Save
                </Button>
            </div>
        )}

        {activeTab === 'meeting-telegram' && (
            <div className="h-20 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end px-6 gap-3 shrink-0">
                <Button variant="ghost" onClick={onClose} className="rounded-xl h-10 w-24">Cancel</Button>
                <Button 
                    variant="outline" 
                    onClick={() => handleTestMeetingTelegram()} 
                    isLoading={testingMeetingTg} 
                    disabled={meetingGroups.every(g => !g.chat_id?.trim())} 
                    className="rounded-xl h-10 px-6 font-medium bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20 hover:border-amber-300 hover:text-amber-800 flex items-center gap-1.5"
                    title="Send test alert to all configured groups with valid Chat IDs"
                >
                    <Send size={15} />
                    <span>Test Broadcast All ({meetingGroups.filter(g => g.chat_id?.trim()).length})</span>
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleSaveMeetingTelegram} 
                    isLoading={savingMeetingTg} 
                    className="rounded-xl h-10 px-6 bg-indigo-600 hover:bg-indigo-700 border-none shadow-md shadow-indigo-600/30 text-white flex items-center gap-1.5"
                >
                    <Save size={16} />
                    <span>Save Multi-Group Config</span>
                </Button>
            </div>
        )}
      </div>
      
      {confirmDeleteTemplateId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-slate-900">Delete Template</h3>
            <p className="text-sm text-slate-500">Are you sure you want to delete this template? This action cannot be undone.</p>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setConfirmDeleteTemplateId(null)}>Cancel</Button>
              <Button type="button" onClick={confirmDeleteTemplate} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
