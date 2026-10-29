import React, { useState, useEffect } from 'react';
import { 
  Inbox, Send, Star, Trash2, Mail, RefreshCw, Settings, PenSquare, 
  Search, CheckCircle2, AlertCircle, Sparkles, CornerDownLeft, 
  ArrowLeft, Clock, ShieldCheck, X, ChevronRight, Server, MessageSquare,
  FileText, ExternalLink, Loader2, Layout, AlignLeft, Users, ReplyAll,
  Check, Info, PenTool, History, CornerDownRight, ChevronDown, ChevronUp,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { MailMessage, MailAccount } from '../../types';
import { apiClient } from '../../src/apiClient';

export const MailAssistant: React.FC = () => {
  // Folder & list state
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'starred' | 'trash' | 'drafts'>('inbox');
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MailMessage | null>(null);
  const [counts, setCounts] = useState({
    inbox_total: 0,
    inbox_unread: 0,
    sent_total: 0,
    starred_total: 0,
    trash_total: 0,
    drafts_total: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);
  const [bodyViewMode, setBodyViewMode] = useState<'html' | 'text'>('html');

  // Accounts & Bluehost sync state
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Modals state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'server' | 'signatures'>('server');
  const [showComposeModal, setShowComposeModal] = useState(false);

  // Bluehost settings form (credentials & signatures)
  const [settingsForm, setSettingsForm] = useState({
    email: '',
    provider: 'bluehost',
    imap_host: '',
    imap_port: 993,
    smtp_host: '',
    smtp_port: 465,
    username: '',
    password: '',
    auto_sync_interval: 15,
    compose_signature: '',
    reply_signature: '',
    include_reply_signature: true
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; diagnostics: string[] } | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Compose / Reply form
  const [composeForm, setComposeForm] = useState({
    to: '',
    cc: '',
    subject: '',
    body: '',
    replyToId: ''
  });
  const [showCcField, setShowCcField] = useState(false);
  const [isReplyAll, setIsReplyAll] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // AI Assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<'Professional' | 'Concise' | 'Direct' | 'Urgent' | 'Friendly'>('Professional');
  const [generatingAiDraft, setGeneratingAiDraft] = useState(false);
  
  // Smart Quick Replies state for selected email
  const [smartReplies, setSmartReplies] = useState<{ options: string[]; suggestedDraft: string } | null>(null);
  const [loadingSmartReplies, setLoadingSmartReplies] = useState(false);

  // Thread summarizer state
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  // Thread & reply history state
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Record<string, boolean>>({});

  const toggleHistoryItem = (id: string) => {
    setExpandedHistoryIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // In-app Toast notification state (avoiding window.alert)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch accounts and messages
  const fetchAccounts = async () => {
    try {
      const data = await apiClient.fetch('/mail/accounts');
      if (Array.isArray(data) && data.length > 0) {
        setAccounts(data);
        const primary = data[0];
        setSettingsForm({
          email: primary.email || '',
          provider: 'bluehost',
          imap_host: primary.imap_host || '',
          imap_port: primary.imap_port || 993,
          smtp_host: primary.smtp_host || '',
          smtp_port: primary.smtp_port || 465,
          username: primary.username || primary.email || '',
          password: '',
          auto_sync_interval: primary.auto_sync_interval || 15,
          compose_signature: primary.compose_signature || '',
          reply_signature: primary.reply_signature || '',
          include_reply_signature: primary.include_reply_signature !== false
        });
      }
    } catch (err) {
      console.error('Failed to fetch mail accounts', err);
    }
  };

  const fetchMessages = async (folder = activeFolder, search = searchQuery) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({ folder });
      if (search) queryParams.set('search', search);

      const res = await apiClient.fetch(`/mail/messages?${queryParams.toString()}`);
      if (res && res.messages) {
        setMessages(res.messages);
        if (res.counts) setCounts(res.counts);

        // If currently selected message is no longer in list, update or keep
        if (selectedMessage) {
          const found = res.messages.find((m: MailMessage) => m.id === selectedMessage.id);
          if (found) setSelectedMessage(found);
        } else if (res.messages.length > 0 && window.innerWidth >= 1024) {
          // Auto select first message on desktop
          setSelectedMessage(res.messages[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch mail messages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [activeFolder]);

  // When selected email changes, reset AI smart reply and summary
  useEffect(() => {
    setSummary(null);
    setSmartReplies(null);
    if (selectedMessage) {
      loadSmartReplies(selectedMessage);
    }
  }, [selectedMessage?.id]);

  // Trigger manual sync
  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('Connecting to Bluehost mail servers...');
    try {
      const res = await apiClient.fetch('/mail/sync', { method: 'POST' });
      setSyncStatusMsg(res.message || 'Synchronization complete');
      await fetchMessages();
      await fetchAccounts();
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } catch (err: any) {
      setSyncStatusMsg(err.message || 'Sync encountered a problem');
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle star
  const handleToggleStar = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await apiClient.fetch(`/mail/messages/${id}/star`, { method: 'PUT' });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_starred: res.is_starred === 1 } : m));
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(prev => prev ? { ...prev, is_starred: res.is_starred === 1 } : null);
      }
    } catch (err) {
      console.error('Star toggle failed', err);
    }
  };

  // Delete / move to trash
  const handleDeleteMessage = async (id: string) => {
    try {
      await apiClient.fetch(`/mail/messages/${id}`, { method: 'DELETE' });
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
      }
      fetchMessages();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  // Select message
  const handleSelectMessage = async (msg: MailMessage) => {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      try {
        await apiClient.fetch(`/mail/messages/${msg.id}/read`, { 
          method: 'PUT', 
          body: JSON.stringify({ is_read: 1 }) 
        });
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
        setCounts(prev => ({ ...prev, inbox_unread: Math.max(0, prev.inbox_unread - 1) }));
      } catch (err) {
        console.error('Read update error', err);
      }
    }

    // Load full message details and complete conversation thread / sent replies history
    setLoadingHistory(true);
    try {
      const fullMsg = await apiClient.fetch(`/mail/messages/${msg.id}`);
      if (fullMsg && fullMsg.id) {
        setSelectedMessage(fullMsg);
        setMessages(prev => prev.map(m => m.id === fullMsg.id ? { ...m, ...fullMsg } : m));
        // Pre-expand newest reply in history if any
        if (Array.isArray(fullMsg.thread_history) && fullMsg.thread_history.length > 0) {
          const newest = fullMsg.thread_history[fullMsg.thread_history.length - 1];
          setExpandedHistoryIds(prev => ({ ...prev, [newest.id]: true }));
        }
      }
    } catch (err) {
      console.warn('Could not load message thread history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // AI: Load Smart Quick Replies
  const loadSmartReplies = async (msg: MailMessage) => {
    setLoadingSmartReplies(true);
    try {
      const res = await apiClient.fetch('/mail/ai/reply', {
        method: 'POST',
        body: JSON.stringify({
          emailSubject: msg.subject,
          emailBody: msg.body_text,
          senderName: msg.from_name
        })
      });
      if (res && res.options) {
        setSmartReplies(res);
      }
    } catch (err) {
      console.warn('Smart replies unavailable:', err);
    } finally {
      setLoadingSmartReplies(false);
    }
  };

  // AI: Summarize Email
  const handleSummarizeThread = async () => {
    if (!selectedMessage) return;
    setSummarizing(true);
    try {
      const res = await apiClient.fetch('/mail/ai/summarize', {
        method: 'POST',
        body: JSON.stringify({
          emailSubject: selectedMessage.subject,
          emailBody: selectedMessage.body_text
        })
      });
      if (res && res.summary) {
        setSummary(res.summary);
      }
    } catch (err: any) {
      showToast('Could not summarize email: ' + err.message, 'error');
    } finally {
      setSummarizing(false);
    }
  };

  // AI: Generate Draft in Compose modal
  const handleGenerateAiDraft = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingAiDraft(true);
    try {
      const res = await apiClient.fetch('/mail/ai/draft', {
        method: 'POST',
        body: JSON.stringify({
          prompt: aiPrompt,
          recipient: composeForm.to,
          subject: composeForm.subject,
          tone: aiTone
        })
      });
      if (res && res.draft) {
        setComposeForm(prev => ({ ...prev, body: res.draft }));
        setAiPrompt('');
      }
    } catch (err: any) {
      showToast('Failed to generate draft: ' + err.message, 'error');
    } finally {
      setGeneratingAiDraft(false);
    }
  };

  // Send Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeForm.to.trim() || !composeForm.subject.trim()) {
      showToast('Please specify recipient and subject.', 'error');
      return;
    }

    const currentReplyToId = composeForm.replyToId;
    setSendingEmail(true);
    try {
      await apiClient.fetch('/mail/send', {
        method: 'POST',
        body: JSON.stringify(composeForm)
      });
      setShowComposeModal(false);
      setComposeForm({ to: '', cc: '', subject: '', body: '', replyToId: '' });
      await fetchMessages();

      // If sending a reply to the currently active email, refresh its thread history immediately
      if (currentReplyToId) {
        try {
          const updatedMsg = await apiClient.fetch(`/mail/messages/${currentReplyToId}`);
          if (updatedMsg && updatedMsg.id) {
            setSelectedMessage(updatedMsg);
            if (Array.isArray(updatedMsg.thread_history) && updatedMsg.thread_history.length > 0) {
              const newest = updatedMsg.thread_history[updatedMsg.thread_history.length - 1];
              setExpandedHistoryIds(prev => ({ ...prev, [newest.id]: true }));
            }
          }
        } catch (_) {}
      }

      showToast('Email sent and recorded in Sent & History.', 'success');
    } catch (err: any) {
      showToast('Error sending email: ' + err.message, 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // Test Bluehost Connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await apiClient.fetch('/mail/accounts/test', {
        method: 'POST',
        body: JSON.stringify(settingsForm)
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        diagnostics: [err.message || 'Connection attempt timed out.']
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Save Bluehost Settings (Server & Signatures)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      await apiClient.fetch('/mail/accounts', {
        method: 'POST',
        body: JSON.stringify(settingsForm)
      });
      setShowSettingsModal(false);
      await fetchAccounts();
      handleSyncNow();
      showToast('Mail configuration and signatures saved successfully.', 'success');
    } catch (err: any) {
      showToast('Failed to save settings: ' + err.message, 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Save Signatures Dedicated Action
  const handleSaveSignatures = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const accId = accounts[0]?.id;
    if (!accId) {
      // Save via general endpoint
      return handleSaveSettings(e as any);
    }
    setSettingsSaving(true);
    try {
      await apiClient.fetch(`/mail/accounts/${accId}/signatures`, {
        method: 'PUT',
        body: JSON.stringify({
          compose_signature: settingsForm.compose_signature,
          reply_signature: settingsForm.reply_signature,
          include_reply_signature: settingsForm.include_reply_signature
        })
      });
      await fetchAccounts();
      showToast('Email signatures saved successfully!', 'success');
    } catch (err: any) {
      showToast('Failed to save signatures: ' + err.message, 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Open New Compose Modal with auto-inserted compose signature
  const handleOpenCompose = () => {
    const primary = accounts[0];
    const signature = primary?.compose_signature ? `\n\n${primary.compose_signature}` : '';
    setComposeForm({
      to: '',
      cc: '',
      subject: '',
      body: signature,
      replyToId: ''
    });
    setIsReplyAll(false);
    setShowCcField(false);
    setShowComposeModal(true);
  };

  // Open Reply / Reply All Modal with auto-inserted reply signature and CC handling
  const handleOpenReply = (customDraft?: string, replyAll = false) => {
    if (!selectedMessage) return;
    const primary = accounts[0];
    const myEmail = (primary?.email || '').toLowerCase().trim();

    // Determine CC addresses if Reply All
    let replyCc = '';
    if (replyAll) {
      const candidates: string[] = [];
      if (selectedMessage.cc_address) {
        selectedMessage.cc_address.split(/[,;]/).forEach(e => {
          const trimmed = e.trim();
          if (trimmed) candidates.push(trimmed);
        });
      }
      if (selectedMessage.to_address) {
        selectedMessage.to_address.split(/[,;]/).forEach(e => {
          const trimmed = e.trim();
          if (trimmed) candidates.push(trimmed);
        });
      }
      const fromAddr = selectedMessage.from_address.toLowerCase().trim();
      const unique = Array.from(new Set(candidates)).filter(addr => {
        const lower = addr.toLowerCase().trim();
        return lower !== myEmail && lower !== fromAddr && !lower.includes(myEmail) && !lower.includes(fromAddr);
      });
      replyCc = unique.join(', ');
    }

    // Determine signature
    const includeSig = primary?.include_reply_signature !== false;
    const replySig = (includeSig && primary?.reply_signature) ? `\n\n${primary.reply_signature}` : '';

    const quotedThread = `\n\n--- On ${new Date(selectedMessage.received_at).toLocaleString()}, ${selectedMessage.from_name} <${selectedMessage.from_address}> wrote:\n> ${selectedMessage.body_text.slice(0, 400).replace(/\n/g, '\n> ')}...`;

    const initialBody = customDraft 
      ? `${customDraft}${replySig}${quotedThread}`
      : `\n${replySig}${quotedThread}`;

    setComposeForm({
      to: selectedMessage.from_address,
      cc: replyCc,
      subject: selectedMessage.subject.startsWith('Re:') ? selectedMessage.subject : `Re: ${selectedMessage.subject}`,
      body: initialBody,
      replyToId: selectedMessage.id
    });
    setIsReplyAll(replyAll);
    setShowCcField(replyAll || Boolean(replyCc));
    setShowComposeModal(true);
  };

  const filteredMessages = messages.filter(m => {
    if (filterUnread && m.is_read) return false;
    return true;
  });

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-[#F8FAFC] rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-in fade-in duration-300">
      
      {/* Top Header Bar */}
      <header className="h-16 px-6 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Mail size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Mail Assistant</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100 flex items-center gap-1">
                <Server size={11} /> Bluehost Mail
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {accounts.length > 0 ? accounts[0].email : 'Configured for Bluehost IMAP & SMTP'} · Syncing Inbox & Sent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {syncStatusMsg && (
            <span className="text-xs font-medium text-indigo-600 animate-in fade-in slide-in-from-right-1 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
              {syncStatusMsg}
            </span>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="h-9 px-3 text-xs bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-none gap-1.5"
            title="Synchronize Inbox and Sent folders from Bluehost"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin text-indigo-600' : 'text-slate-500'} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSettingsModal(true)}
            className="h-9 px-3 text-xs bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-none gap-1.5"
            title="Configure Bluehost IMAP and SMTP settings"
          >
            <Settings size={14} className="text-slate-500" />
            <span className="hidden sm:inline">Settings</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCompose}
            className="h-9 px-3.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm gap-1.5"
          >
            <PenSquare size={14} />
            <span>Compose</span>
          </Button>
        </div>
      </header>

      {/* 3-Column Body View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* COLUMN 1: Folders & System Status */}
        <aside className="w-56 border-r border-slate-200/80 bg-white/70 p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 px-3">
                Mailboxes
              </span>
              <nav className="mt-2 space-y-1">
                <button
                  onClick={() => { setActiveFolder('inbox'); setSelectedMessage(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeFolder === 'inbox' 
                      ? 'bg-indigo-50/90 text-indigo-700 shadow-sm border border-indigo-100 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Inbox size={16} className={activeFolder === 'inbox' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span>Inbox</span>
                  </div>
                  {counts.inbox_unread > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                      {counts.inbox_unread}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setActiveFolder('sent'); setSelectedMessage(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeFolder === 'sent' 
                      ? 'bg-indigo-50/90 text-indigo-700 shadow-sm border border-indigo-100 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Send size={16} className={activeFolder === 'sent' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span>Sent</span>
                  </div>
                  {counts.sent_total > 0 && (
                    <span className="text-xs font-medium text-slate-400">
                      {counts.sent_total}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setActiveFolder('starred'); setSelectedMessage(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeFolder === 'starred' 
                      ? 'bg-indigo-50/90 text-indigo-700 shadow-sm border border-indigo-100 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Star size={16} className={activeFolder === 'starred' ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
                    <span>Starred</span>
                  </div>
                  {counts.starred_total > 0 && (
                    <span className="text-xs font-medium text-slate-400">
                      {counts.starred_total}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setActiveFolder('trash'); setSelectedMessage(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeFolder === 'trash' 
                      ? 'bg-indigo-50/90 text-indigo-700 shadow-sm border border-indigo-100 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Trash2 size={16} className={activeFolder === 'trash' ? 'text-rose-600' : 'text-slate-400'} />
                    <span>Trash</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Bluehost Server Info Card */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Bluehost IMAP</span>
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-mono">
                  SSL: 993
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Host: {accounts[0]?.imap_host || 'mail.domain.com'}
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Auto-sync</span>
                <span className="font-semibold text-slate-700">Every {accounts[0]?.auto_sync_interval || 15}m</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 space-y-1 px-1">
            <p>Last synced:</p>
            <p className="font-mono text-slate-600">
              {accounts[0]?.last_synced_at ? new Date(accounts[0].last_synced_at).toLocaleTimeString() : 'Just now'}
            </p>
          </div>
        </aside>

        {/* COLUMN 2: Message List & Search */}
        <section className="w-80 sm:w-96 border-r border-slate-200/80 bg-white flex flex-col shrink-0">
          {/* Search & Filter Header */}
          <div className="p-3.5 border-b border-slate-200/80 space-y-2.5">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject, sender, body..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchMessages(activeFolder, searchQuery)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="font-semibold text-slate-700 capitalize">
                {activeFolder} ({filteredMessages.length})
              </span>
              <button
                onClick={() => setFilterUnread(!filterUnread)}
                className={`text-[11px] font-medium transition-colors ${filterUnread ? 'text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-700'}`}
              >
                {filterUnread ? 'Show All' : 'Unread Only'}
              </button>
            </div>
          </div>

          {/* Email Card Stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <Loader2 size={18} className="animate-spin text-indigo-500" />
                <span>Loading mailbox messages...</span>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <Mail size={24} className="mx-auto text-slate-300" />
                <p className="font-medium text-slate-600">No emails found in {activeFolder}</p>
                <p className="text-[11px] text-slate-400">Click Sync Now to pull fresh messages from Bluehost.</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-3.5 cursor-pointer transition-all flex flex-col gap-1 relative ${
                      isSelected 
                        ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600' 
                        : msg.is_read 
                          ? 'hover:bg-slate-50/80 bg-white' 
                          : 'bg-slate-50/40 hover:bg-indigo-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        {!msg.is_read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" title="Unread" />
                        )}
                        <span className={`text-xs truncate ${!msg.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {msg.from_name || msg.from_address}
                        </span>
                        {Boolean(msg.is_replied || msg.replied_at) && (
                          <span 
                            className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/90 px-1.5 py-0.5 rounded shrink-0 shadow-2xs"
                            title={`Replied on ${msg.replied_at ? new Date(msg.replied_at).toLocaleString() : 'earlier'}`}
                          >
                            <CornerDownLeft size={9} className="stroke-[2.5]" />
                            <span>Replied</span>
                          </span>
                        )}
                        {msg.folder === 'sent' && msg.reply_to_id && (
                          <span 
                            className="inline-flex items-center gap-0.5 text-[9px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.5 rounded shrink-0"
                            title="Sent as reply"
                          >
                            <CornerDownRight size={9} />
                            <span>Reply</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(msg.received_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h4 className={`text-xs truncate ${!msg.is_read ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>
                      {msg.subject || '(No Subject)'}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {msg.snippet || msg.body_text}
                    </p>

                    <div className="mt-1 flex items-center justify-between">
                      <button
                        onClick={(e) => handleToggleStar(e, msg.id)}
                        className="text-slate-300 hover:text-amber-500 transition-colors p-0.5"
                      >
                        <Star size={13} className={msg.is_starred ? 'text-amber-500 fill-amber-500' : ''} />
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(msg.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* COLUMN 3: Reading Pane & Embedded AI Assistant */}
        <main className="flex-1 bg-white flex flex-col overflow-y-auto">
          {selectedMessage ? (
            <div className="flex-1 flex flex-col p-6 space-y-6">
              
              {/* Message Header */}
              <div className="pb-5 border-b border-slate-200/80 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
                    {selectedMessage.subject || '(No Subject)'}
                  </h2>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => handleToggleStar(e, selectedMessage.id)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-amber-500 transition-colors"
                      title={selectedMessage.is_starred ? 'Unstar' : 'Star'}
                    >
                      <Star size={16} className={selectedMessage.is_starred ? 'text-amber-500 fill-amber-500' : ''} />
                    </button>
                    <button
                      onClick={() => handleOpenReply(undefined, false)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                      title="Reply (Sender only)"
                    >
                      <CornerDownLeft size={16} />
                    </button>
                    <button
                      onClick={() => handleOpenReply(undefined, true)}
                      className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                      title="Reply All (Sender + CC recipients)"
                    >
                      <ReplyAll size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-indigo-700 text-sm">
                      {(selectedMessage.from_name || selectedMessage.from_address).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{selectedMessage.from_name}</span>
                        <span className="text-slate-400 text-[11px]">&lt;{selectedMessage.from_address}&gt;</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                        <p className="text-[11px] text-slate-500">
                          <span className="font-medium text-slate-600">To:</span> {selectedMessage.to_address}
                        </p>
                        {selectedMessage.cc_address && (
                          <div className="flex items-center gap-1 text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            <span className="font-semibold text-indigo-600">Cc:</span>
                            <span className="max-w-[320px] truncate" title={selectedMessage.cc_address}>
                              {selectedMessage.cc_address}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {new Date(selectedMessage.received_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              {/* Reply / Thread Status Notification Banners */}
              {Boolean(selectedMessage.is_replied || selectedMessage.replied_at) && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/90 text-xs text-emerald-950 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                      <CornerDownLeft size={13} className="stroke-[2.5]" />
                    </span>
                    <div>
                      <span className="font-semibold text-emerald-900">Replied to this email</span>
                      <span className="text-emerald-700 ml-1.5 text-[11px]">
                        {selectedMessage.replied_at 
                          ? `on ${new Date(selectedMessage.replied_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`
                          : 'logged in database'}
                      </span>
                    </div>
                  </div>
                  {selectedMessage.thread_history && selectedMessage.thread_history.length > 0 && (
                    <a 
                      href="#sent-reply-history"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                    >
                      <History size={12} />
                      <span>Jump to history ({selectedMessage.thread_history.length})</span>
                      <ChevronDown size={11} />
                    </a>
                  )}
                </div>
              )}

              {selectedMessage.folder === 'sent' && selectedMessage.reply_to_id && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200/90 text-xs text-indigo-950 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                      <CornerDownRight size={13} />
                    </span>
                    <div>
                      <span className="font-semibold text-indigo-900">Sent Reply</span>
                      <span className="text-indigo-700 ml-1.5 text-[11px]">
                        This email was sent in response to an original received message.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!selectedMessage.reply_to_id) return;
                      try {
                        const orig = await apiClient.fetch(`/mail/messages/${selectedMessage.reply_to_id}`);
                        if (orig && orig.id) {
                          handleSelectMessage(orig);
                          showToast('Opened original received message.', 'info');
                        }
                      } catch (err: any) {
                        showToast('Original email could not be retrieved.', 'error');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>View Original Email</span>
                    <ArrowUpRight size={12} />
                  </button>
                </div>
              )}

              {/* AI Quick Actions Bar */}
              <div className="p-4 rounded-xl border border-indigo-100/80 bg-gradient-to-r from-indigo-50/60 to-violet-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-950">
                    <Sparkles size={15} className="text-indigo-600" />
                    <span>AI Assistant for this Email</span>
                  </div>
                  <button
                    onClick={handleSummarizeThread}
                    disabled={summarizing}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    {summarizing ? <Loader2 size={12} className="animate-spin" /> : null}
                    <span>{summarizing ? 'Summarizing...' : 'Summarize Thread'}</span>
                  </button>
                </div>

                {/* AI Summary View */}
                {summary && (
                  <div className="p-3 rounded-lg bg-white border border-indigo-200/70 text-xs text-slate-700 leading-relaxed animate-in fade-in slide-in-from-top-1 whitespace-pre-line">
                    <div className="font-semibold text-indigo-900 mb-1 flex items-center justify-between">
                      <span>Executive Summary</span>
                      <button onClick={() => setSummary(null)} className="text-slate-400 hover:text-slate-600"><X size={12}/></button>
                    </div>
                    {summary}
                  </div>
                )}

                {/* AI Smart Quick Reply Buttons */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-slate-600">Smart Quick Replies (1-Click Draft):</span>
                  {loadingSmartReplies ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                      <Loader2 size={12} className="animate-spin text-indigo-500" />
                      <span>Generating tailored response options with Gemini...</span>
                    </div>
                  ) : smartReplies?.options && smartReplies.options.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {smartReplies.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleOpenReply(smartReplies.suggestedDraft)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-medium text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm flex items-center gap-1"
                        >
                          <span>{opt}</span>
                          <ChevronRight size={12} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenReply(`Hi ${selectedMessage.from_name},\n\nThank you for reaching out. We have logged this request and are investigating. We will update you shortly.`)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-all shadow-sm"
                      >
                        Acknowledge Request
                      </button>
                      <button
                        onClick={() => handleOpenReply(`Hi ${selectedMessage.from_name},\n\nCould you please provide the system logs and asset tag so we can troubleshoot further?`)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-all shadow-sm"
                      >
                        Ask for Diagnostic Info
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Header & View Switcher */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Message Content
                </span>
                {selectedMessage.body_html && (
                  <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200/80 text-[11px] font-medium text-slate-600">
                    <button
                      type="button"
                      onClick={() => setBodyViewMode('html')}
                      className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                        bodyViewMode === 'html'
                          ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Layout size={12} />
                      <span>Formatted (HTML)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBodyViewMode('text')}
                      className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                        bodyViewMode === 'text'
                          ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <AlignLeft size={12} />
                      <span>Plain Text</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Message Body Content (HTML / Text) */}
              {bodyViewMode === 'html' && selectedMessage.body_html ? (
                <div 
                  className="flex-1 text-sm text-slate-800 leading-relaxed font-sans overflow-x-auto p-4 rounded-xl bg-white border border-slate-100 selection:bg-indigo-500/20 max-w-full email-body-view"
                  dangerouslySetInnerHTML={{ __html: selectedMessage.body_html }}
                />
              ) : (
                <div className="flex-1 text-sm text-slate-800 leading-relaxed whitespace-pre-line font-sans selection:bg-indigo-500/20 p-4 rounded-xl bg-white border border-slate-100">
                  {selectedMessage.body_text}
                </div>
              )}

              {/* Sent / Reply Conversation History Section */}
              <div id="sent-reply-history" className="pt-2 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <History size={13} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800 tracking-tight">
                      Conversation & Sent/Reply History
                    </h3>
                    {selectedMessage.thread_history && selectedMessage.thread_history.length > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {selectedMessage.thread_history.length} {selectedMessage.thread_history.length === 1 ? 'message' : 'messages'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {loadingHistory && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Loader2 size={12} className="animate-spin text-indigo-500" />
                        <span>Updating history...</span>
                      </span>
                    )}
                    {Boolean(selectedMessage.is_replied || selectedMessage.replied_at) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        <CheckCircle2 size={11} />
                        <span>Replied</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Timeline Stream */}
                {selectedMessage.thread_history && selectedMessage.thread_history.length > 0 ? (
                  <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {selectedMessage.thread_history.map((hist) => {
                      const isSent = hist.folder === 'sent' || hist.reply_to_id === selectedMessage.id;
                      const isExpanded = expandedHistoryIds[hist.id] ?? false;

                      return (
                        <div key={hist.id} className="relative group">
                          {/* Timeline bullet */}
                          <div 
                            className={`absolute -left-6 top-3 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white shadow-xs ${
                              isSent ? 'bg-indigo-600' : 'bg-slate-600'
                            }`}
                          >
                            {isSent ? <CornerDownRight size={10} /> : <Inbox size={10} />}
                          </div>

                          {/* Card */}
                          <div className={`rounded-xl border transition-all ${
                            isSent 
                              ? 'border-indigo-100 bg-indigo-50/30 hover:border-indigo-200' 
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}>
                            {/* Card Header */}
                            <div 
                              onClick={() => toggleHistoryItem(hist.id)}
                              className="p-3 cursor-pointer flex items-center justify-between gap-3 select-none"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                                  isSent 
                                    ? 'bg-indigo-600 text-white' 
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {isSent ? 'Sent Reply' : 'Received'}
                                </span>
                                <span className="text-xs font-semibold text-slate-800 truncate">
                                  {isSent ? `To: ${hist.to_address}` : `From: ${hist.from_name || hist.from_address}`}
                                </span>
                                {hist.cc_address && (
                                  <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 truncate max-w-[200px]" title={`Cc: ${hist.cc_address}`}>
                                    Cc: {hist.cc_address}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                  <Clock size={11} />
                                  {new Date(hist.received_at || hist.created_at || Date.now()).toLocaleString([], { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectMessage(hist);
                                  }}
                                  className="p-1 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors"
                                  title="Open in main reading view"
                                >
                                  <ArrowUpRight size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="p-1 rounded hover:bg-slate-200/60 text-slate-400 transition-colors"
                                >
                                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                </button>
                              </div>
                            </div>

                            {/* Card Expanded Content */}
                            {isExpanded && (
                              <div className="px-3 pb-3 pt-0 border-t border-slate-100 mt-1 space-y-2 text-xs text-slate-700">
                                <div className="text-[11px] font-medium text-slate-500 pt-2 flex items-center justify-between">
                                  <span>Subject: <strong className="text-slate-800">{hist.subject}</strong></span>
                                  <button
                                    onClick={() => handleSelectMessage(hist)}
                                    className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5"
                                  >
                                    <span>Focus message</span>
                                    <ArrowUpRight size={11} />
                                  </button>
                                </div>
                                <div className="p-3 rounded-lg bg-white border border-slate-100 text-slate-800 font-sans whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
                                  {hist.body_text || hist.snippet}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-1">
                    <p className="text-xs font-medium text-slate-600">
                      {selectedMessage.is_replied 
                        ? 'A reply has been logged for this email.' 
                        : 'No sent replies yet for this message.'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      When you reply using the button below or AI quick draft, the complete conversation history will be automatically preserved here.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Reply Trigger Box at Bottom */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleOpenReply(undefined, false)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium gap-2 shadow-sm"
                  >
                    <CornerDownLeft size={14} />
                    <span>Reply to {selectedMessage.from_name}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleOpenReply(undefined, true)}
                    className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs font-medium gap-1.5 shadow-none"
                    title="Reply to sender and keep CC recipients"
                  >
                    <ReplyAll size={14} className="text-indigo-600" />
                    <span>Reply All {selectedMessage.cc_address ? '(+CC)' : ''}</span>
                  </Button>
                </div>
                <span className="text-xs text-slate-400">
                  Outgoing server: {accounts[0]?.smtp_host || 'mail.bluehost.com'}:465
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                <Mail size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-700">No Email Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Select an email from the list on the left to read, summarize, or generate AI smart replies.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleOpenCompose}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
                >
                  <PenSquare size={14} />
                  <span>Write New Email</span>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleSyncNow}
                  className="bg-white border-slate-200 text-slate-700 text-xs gap-1.5"
                >
                  <RefreshCw size={14} />
                  <span>Check Bluehost Mailbox</span>
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: Bluehost Configuration & Signatures Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  {settingsTab === 'server' ? <Server size={18} /> : <PenTool size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Mail Account & Assistant Settings</h3>
                  <p className="text-xs text-slate-500">Configure connection credentials and professional email signatures</p>
                </div>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-4">
              <button
                type="button"
                onClick={() => setSettingsTab('server')}
                className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  settingsTab === 'server'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Server size={14} />
                <span>IMAP & SMTP Server</span>
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('signatures')}
                className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  settingsTab === 'signatures'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <PenTool size={14} />
                <span>Email Signatures</span>
                {(settingsForm.compose_signature || settingsForm.reply_signature) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-4 overflow-y-auto flex-1">
              {settingsTab === 'server' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. it-support@yourdomain.com"
                      value={settingsForm.email}
                      onChange={(e) => {
                        const email = e.target.value;
                        const domain = email.includes('@') ? email.split('@')[1] : '';
                        setSettingsForm({
                          ...settingsForm,
                          email,
                          imap_host: settingsForm.imap_host || (domain ? `mail.${domain}` : ''),
                          smtp_host: settingsForm.smtp_host || (domain ? `mail.${domain}` : ''),
                          username: settingsForm.username || email
                        });
                      }}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Incoming Host (IMAP)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="mail.yourdomain.com"
                        value={settingsForm.imap_host}
                        onChange={(e) => setSettingsForm({ ...settingsForm, imap_host: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        IMAP Port (SSL)
                      </label>
                      <input
                        type="number"
                        value={settingsForm.imap_port}
                        onChange={(e) => setSettingsForm({ ...settingsForm, imap_port: parseInt(e.target.value) || 993 })}
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Outgoing Host (SMTP)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="mail.yourdomain.com"
                        value={settingsForm.smtp_host}
                        onChange={(e) => setSettingsForm({ ...settingsForm, smtp_host: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        SMTP Port (SSL)
                      </label>
                      <input
                        type="number"
                        value={settingsForm.smtp_port}
                        onChange={(e) => setSettingsForm({ ...settingsForm, smtp_port: parseInt(e.target.value) || 465 })}
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Username / Account
                      </label>
                      <input
                        type="text"
                        placeholder="Same as email address"
                        value={settingsForm.username}
                        onChange={(e) => setSettingsForm({ ...settingsForm, username: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Password / App Key</span>
                        {accounts[0]?.has_password && (
                          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 size={11} /> Saved
                          </span>
                        )}
                      </label>
                      <input
                        type="password"
                        placeholder={accounts[0]?.has_password ? "•••••••• (leave blank to keep current)" : "Bluehost password"}
                        value={settingsForm.password}
                        onChange={(e) => setSettingsForm({ ...settingsForm, password: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      {accounts[0]?.has_password && (
                        <p className="text-[10px] text-slate-400 mt-1">Leave blank to retain current verified password</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Auto-Sync Frequency (Background Polling)
                    </label>
                    <select
                      value={settingsForm.auto_sync_interval}
                      onChange={(e) => setSettingsForm({ ...settingsForm, auto_sync_interval: parseInt(e.target.value) || 15 })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value={5}>Every 5 minutes</option>
                      <option value={15}>Every 15 minutes (Recommended)</option>
                      <option value={30}>Every 30 minutes</option>
                      <option value={60}>Every 1 hour</option>
                      <option value={0}>Manual Sync Only</option>
                    </select>
                  </div>

                  {/* Connection Diagnostics Banner */}
                  {testResult && (
                    <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                      testResult.success 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                      <div className="font-semibold flex items-center gap-1.5">
                        {testResult.success ? <CheckCircle2 size={14} className="text-emerald-600" /> : <AlertCircle size={14} className="text-amber-600" />}
                        <span>{testResult.success ? 'Connection Test Passed' : 'Connection Test Results'}</span>
                      </div>
                      {testResult.diagnostics.map((d, i) => (
                        <p key={i} className="text-[11px] leading-relaxed opacity-90">{d}</p>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* SIGNATURES TAB */
                <div className="space-y-4">
                  {/* Quick Preset Templates */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-indigo-600" />
                      <span>Signature Quick Presets (Click to autofill)</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const compose = `Best regards,\nIT Operations & Infrastructure Team\nKhema Hospital & Medical Group\nInternal Hotline: Ext. 9911 | Email: ${settingsForm.email || 'it-support@khemahospital.com'}`;
                          const reply = `Regards,\nIT Operations Team | Khema Hospital`;
                          setSettingsForm(prev => ({ ...prev, compose_signature: compose, reply_signature: reply }));
                          showToast('Hospital IT Support preset applied', 'info');
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 rounded-lg transition-all"
                      >
                        🏥 Hospital IT Team
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const compose = `Kind regards,\nClinical Systems & Diagnostic Technology\nKhema Global Healthcare\nDirect: +855 23 222 333 | Web: https://khemahospital.com`;
                          const reply = `Best regards,\nClinical Systems Support`;
                          setSettingsForm(prev => ({ ...prev, compose_signature: compose, reply_signature: reply }));
                          showToast('Clinical Systems preset applied', 'info');
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 rounded-lg transition-all"
                      >
                        🩺 Clinical Systems
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const compose = `Thanks & regards,\nIT Department | Khema Hospital`;
                          const reply = `Thanks,\nIT Operations`;
                          setSettingsForm(prev => ({ ...prev, compose_signature: compose, reply_signature: reply }));
                          showToast('Minimalist preset applied', 'info');
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 rounded-lg transition-all"
                      >
                        ⚡ Minimalist
                      </button>
                    </div>
                  </div>

                  {/* 1. New Compose Signature */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        New Compose Signature
                      </label>
                      <span className="text-[10px] text-slate-400">Appended when writing new emails</span>
                    </div>
                    <textarea
                      rows={4}
                      placeholder={`e.g.\nBest regards,\nIT Operations & Infrastructure Team\nKhema Hospital\nHotline: ext 9911`}
                      value={settingsForm.compose_signature}
                      onChange={(e) => setSettingsForm({ ...settingsForm, compose_signature: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-mono resize-none leading-relaxed"
                    />
                  </div>

                  {/* 2. Reply Signature */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Reply Signature
                      </label>
                      <span className="text-[10px] text-slate-400">Appended when replying to incoming emails</span>
                    </div>
                    <textarea
                      rows={3}
                      placeholder={`e.g.\nThanks & regards,\nIT Support Desk`}
                      value={settingsForm.reply_signature}
                      onChange={(e) => setSettingsForm({ ...settingsForm, reply_signature: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-mono resize-none leading-relaxed"
                    />
                  </div>

                  {/* 3. Toggle auto-reply signature */}
                  <div className="flex items-center gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="include_reply_sig"
                      checked={settingsForm.include_reply_signature}
                      onChange={(e) => setSettingsForm({ ...settingsForm, include_reply_signature: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="include_reply_sig" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                      Automatically append reply signature when replying to an email
                    </label>
                  </div>

                  {/* Live Signature Preview Card */}
                  {(settingsForm.compose_signature || settingsForm.reply_signature) && (
                    <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                      <div className="text-[11px] font-semibold text-indigo-900 flex items-center justify-between">
                        <span>Live Preview (How recipients see it):</span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-2 font-sans">
                        <div className="text-slate-400 text-[11px] italic">[Message body from composer...]</div>
                        <div className="border-t border-slate-200 pt-2 text-slate-700 whitespace-pre-line text-xs font-sans leading-relaxed">
                          {settingsForm.compose_signature || settingsForm.reply_signature}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                {settingsTab === 'server' ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={testingConnection || !settingsForm.email}
                    className="text-xs bg-slate-50 border-slate-200"
                  >
                    {testingConnection ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                    <span>{testingConnection ? 'Probing Servers...' : 'Test Connection'}</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSettingsForm(prev => ({ ...prev, compose_signature: '', reply_signature: '' }));
                      showToast('Signatures cleared', 'info');
                    }}
                    className="text-xs text-slate-500 border-slate-200"
                  >
                    Clear Signatures
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setShowSettingsModal(false)}>
                    Cancel
                  </Button>
                  {settingsTab === 'signatures' && accounts[0]?.id ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveSignatures}
                      disabled={settingsSaving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {settingsSaving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Check size={14} className="mr-1.5" />}
                      <span>Save Signatures</span>
                    </Button>
                  ) : (
                    <Button type="submit" size="sm" disabled={settingsSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      {settingsSaving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                      <span>Save Configuration</span>
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Compose & AI Drafter Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <PenSquare size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {isReplyAll ? 'Reply All to Email' : (composeForm.replyToId ? 'Reply to Email' : 'New Email Message')}
                  </h3>
                  <p className="text-xs text-slate-500">Dispatching via Bluehost SMTP: {accounts[0]?.email || 'Default'}</p>
                </div>
              </div>
              <button onClick={() => setShowComposeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="p-6 space-y-4 overflow-y-auto flex-1 flex flex-col">
              
              {/* Recipient & Subject fields */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                  <span className="w-16 text-xs font-semibold text-slate-500">To:</span>
                  <input
                    type="email"
                    required
                    placeholder="recipient@example.com"
                    value={composeForm.to}
                    onChange={(e) => setComposeForm({ ...composeForm, to: e.target.value })}
                    className="flex-1 text-xs outline-none bg-transparent"
                  />
                  {!showCcField && !composeForm.cc && (
                    <button
                      type="button"
                      onClick={() => setShowCcField(true)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 transition-colors shrink-0"
                    >
                      + Cc
                    </button>
                  )}
                </div>

                {/* CC Recipient field */}
                {(showCcField || Boolean(composeForm.cc)) && (
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-2 animate-in fade-in duration-150">
                    <span className="w-16 text-xs font-semibold text-indigo-600 flex items-center gap-1">
                      <span>Cc:</span>
                    </span>
                    <input
                      type="text"
                      placeholder="comma-separated emails (e.g. colleague@khemahospital.com, doctor@khemahospital.com)"
                      value={composeForm.cc}
                      onChange={(e) => setComposeForm({ ...composeForm, cc: e.target.value })}
                      className="flex-1 text-xs outline-none bg-transparent placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setComposeForm({ ...composeForm, cc: '' });
                        setShowCcField(false);
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1"
                      title="Clear & hide CC"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                  <span className="w-16 text-xs font-semibold text-slate-500">Subject:</span>
                  <input
                    type="text"
                    required
                    placeholder="Enter email subject"
                    value={composeForm.subject}
                    onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                    className="flex-1 text-xs outline-none bg-transparent font-medium"
                  />
                </div>
              </div>

              {/* AI Draft Generator Card */}
              <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-600" />
                    <span>AI Mail Assistant (Gemini 3.8 Flash)</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">Tone:</span>
                    <select
                      value={aiTone}
                      onChange={(e: any) => setAiTone(e.target.value)}
                      className="text-[11px] border border-indigo-200 rounded-md bg-white px-2 py-0.5 outline-none font-medium text-indigo-800"
                    >
                      <option value="Professional">Professional</option>
                      <option value="Concise">Concise</option>
                      <option value="Direct">Direct</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Friendly">Friendly</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter key bullet points (e.g. Server maintenance delayed to 3am, reboot required)..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleGenerateAiDraft())}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGenerateAiDraft}
                    disabled={generatingAiDraft || !aiPrompt.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 shadow-none shrink-0"
                  >
                    {generatingAiDraft ? <Loader2 size={13} className="animate-spin mr-1" /> : <Sparkles size={13} className="mr-1" />}
                    <span>{generatingAiDraft ? 'Drafting...' : 'Write Draft'}</span>
                  </Button>
                </div>
              </div>

              {/* Email Body Header & Signature Insert Action */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Message Content
                </span>
                <div className="flex items-center gap-2">
                  {composeForm.replyToId ? (
                    settingsForm.reply_signature ? (
                      <button
                        type="button"
                        onClick={() => {
                          const sig = settingsForm.reply_signature;
                          if (!composeForm.body.includes(sig)) {
                            setComposeForm(prev => ({
                              ...prev,
                              body: prev.body ? `${prev.body}\n\n${sig}` : `\n\n${sig}`
                            }));
                            showToast('Reply signature inserted', 'info');
                          } else {
                            showToast('Reply signature already present in email body', 'info');
                          }
                        }}
                        className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                        title="Append configured reply signature"
                      >
                        <PenTool size={12} />
                        <span>Insert Reply Signature</span>
                      </button>
                    ) : null
                  ) : (
                    settingsForm.compose_signature ? (
                      <button
                        type="button"
                        onClick={() => {
                          const sig = settingsForm.compose_signature;
                          if (!composeForm.body.includes(sig)) {
                            setComposeForm(prev => ({
                              ...prev,
                              body: prev.body ? `${prev.body}\n\n${sig}` : `\n\n${sig}`
                            }));
                            showToast('Compose signature inserted', 'info');
                          } else {
                            showToast('Compose signature already present in email body', 'info');
                          }
                        }}
                        className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                        title="Append configured compose signature"
                      >
                        <PenTool size={12} />
                        <span>Insert Compose Signature</span>
                      </button>
                    ) : null
                  )}
                </div>
              </div>

              {/* Email Body Textarea */}
              <div className="flex-1 min-h-[180px] flex flex-col">
                <textarea
                  required
                  placeholder="Compose your email here, or use the AI Mail Assistant above to draft it..."
                  value={composeForm.body}
                  onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                  className="w-full flex-1 p-3.5 border border-slate-200 rounded-xl text-xs leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-sans"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Sending as {accounts[0]?.email || 'Bluehost User'}
                </span>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setShowComposeModal(false)}>
                    Discard
                  </Button>
                  <Button type="submit" size="sm" disabled={sendingEmail} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                    {sendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>{sendingEmail ? 'Sending...' : 'Send Message'}</span>
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium animate-in slide-in-from-bottom-3 duration-200 ${
          toast.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          {toast.type === 'error' ? (
            <AlertCircle size={15} className="text-rose-600 shrink-0" />
          ) : toast.type === 'success' ? (
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          ) : (
            <Info size={15} className="text-slate-300 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
