import React, { useState, useEffect } from 'react';
import { X, Save, Bell, HelpCircle, FileText, Plus, Trash2, Edit2, ChevronLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'telegram' | 'templates'>('telegram');

  // Telegram state
  const [chatId, setChatId] = useState('');
  const [botToken, setBotToken] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [loadingTelegram, setLoadingTelegram] = useState(false);
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [tgMsg, setTgMsg] = useState('');
  const [alertTemplates, setAlertTemplates] = useState<string[]>([]);

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
      loadTemplates();
      setActiveTab('telegram');
      setEditingTemplate(null);
    }
  }, [isOpen]);

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
