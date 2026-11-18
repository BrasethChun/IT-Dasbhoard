import React, { useState, useEffect } from 'react';
import { X, Save, Bell, HelpCircle, FileText, Plus, Trash2, Edit2, ChevronLeft, Calendar, Send, CheckCircle2, MessageSquare, Users, CheckSquare, Square, Sparkles, MapPin, BellRing, Server, RefreshCw, Copy, Check, KeyRound, Database, Mail, ShieldCheck, GitBranch, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SmartModal, SMART_INPUT_CLASS, SMART_TEXTAREA_CLASS } from '../../components/ui/SmartModal';

export type SettingsModalTab = 'telegram' | 'meeting-telegram' | 'personal-telegram' | 'templates' | '24h-deploy';

export const DEFAULT_PHYSICAL_ROOMS = [
  'KHEMA TK Meeting Room',
  'KHEMA BKK Meeting Room',
  'SAKAL Meeting Room'
];

export interface ITMeetingTelegramGroup {
  id: string;
  name: string;
  chat_id: string;
  is_default: boolean;
}

export const SettingsModal = ({
  isOpen,
  onClose,
  initialTab = 'telegram'
}: {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsModalTab;
}) => {
  const [activeTab, setActiveTab] = useState<SettingsModalTab>(initialTab);

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

  // Dedicated Personal Telegram ID Alert & Physical Rooms state
  const [personalChatId, setPersonalChatId] = useState('');
  const [personalBotToken, setPersonalBotToken] = useState('');
  const [personalEnabled, setPersonalEnabled] = useState(true);
  const [alertAfterItMeeting, setAlertAfterItMeeting] = useState(true);
  const [physicalRooms, setPhysicalRooms] = useState<string[]>([...DEFAULT_PHYSICAL_ROOMS]);
  const [defaultPhysicalRoom, setDefaultPhysicalRoom] = useState<string>(DEFAULT_PHYSICAL_ROOMS[0]);
  const [newRoomInput, setNewRoomInput] = useState('');
  const [loadingPersonalTg, setLoadingPersonalTg] = useState(false);
  const [savingPersonalTg, setSavingPersonalTg] = useState(false);
  const [testingPersonalTg, setTestingPersonalTg] = useState(false);
  const [personalTgMsg, setPersonalTgMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

  // 24H & GitHub Deploy state
  const [cronStatus, setCronStatus] = useState<{
    keepAliveKey: string;
    lastTickAt: string | null;
    lastTickSource: string | null;
    totalTicks: number;
    uptimeSeconds: number;
    nodeEnv: string;
    port: string;
    sessionExpiresIn: string;
    lastResult: {
      executedAt: string;
      durationMs: number;
      source: string;
      workers?: {
        personalReminders?: { checked: number; sent: number; failed: number; error?: string; skipped?: boolean };
        systemUpdates?: { checked: number; sent: number; failed: number; error?: string; skipped?: boolean };
        dbHeartbeat?: { isRemote: boolean; ok: boolean; latencyMs?: number; host: string; error?: string };
        mailAutoSync?: { checked: number; synced: number; failed: number; error?: string; skipped?: boolean };
      };
    } | null;
  } | null>(null);
  const [loadingCronStatus, setLoadingCronStatus] = useState(false);
  const [runningCronSweep, setRunningCronSweep] = useState(false);
  const [rotatingCronKey, setRotatingCronKey] = useState(false);
  const [copiedCronCmd, setCopiedCronCmd] = useState(false);
  const [cronMsg, setCronMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTelegramSettings();
      loadMeetingTelegramSettings();
      loadPersonalAlertSettings();
      loadTemplates();
      loadCronStatus();
      setActiveTab(initialTab || 'telegram');
      setEditingTemplate(null);
      setPersonalTgMsg(null);
      setCronMsg(null);
    }
  }, [isOpen, initialTab]);

  const loadPersonalAlertSettings = async () => {
    setLoadingPersonalTg(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/personal-events/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPersonalChatId(data.personal_chat_id || '');
        setPersonalBotToken(data.personal_bot_token || '');
        setPersonalEnabled(data.personal_enabled !== false);
        setAlertAfterItMeeting(data.alert_after_it_meeting !== false);
        const rooms = Array.isArray(data.physical_rooms) && data.physical_rooms.length > 0
          ? data.physical_rooms
          : [...DEFAULT_PHYSICAL_ROOMS];
        setPhysicalRooms(rooms);
        setDefaultPhysicalRoom(data.default_physical_room || rooms[0]);
      }
    } catch (e) {
      console.error('Failed to load personal alert settings:', e);
    }
    setLoadingPersonalTg(false);
  };

  const handleSavePersonalAlert = async (overrideRoom?: string) => {
    setSavingPersonalTg(true);
    setPersonalTgMsg(null);
    try {
      const token = localStorage.getItem('token');
      const roomToSave = (overrideRoom ?? defaultPhysicalRoom) || physicalRooms[0] || DEFAULT_PHYSICAL_ROOMS[0];
      const res = await fetch('/api/personal-events/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          personal_chat_id: personalChatId.trim(),
          personal_bot_token: personalBotToken.trim(),
          personal_enabled: personalEnabled,
          alert_after_it_meeting: alertAfterItMeeting,
          physical_rooms: physicalRooms,
          default_physical_room: roomToSave
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data.physical_rooms)) setPhysicalRooms(data.physical_rooms);
        if (data.default_physical_room) setDefaultPhysicalRoom(data.default_physical_room);
        setPersonalTgMsg({ text: 'Dedicated Personal Telegram ID & Room settings saved!', type: 'success' });
        setTimeout(() => setPersonalTgMsg(null), 4000);
      } else {
        setPersonalTgMsg({ text: data.error || 'Failed to save personal alert settings.', type: 'error' });
      }
    } catch (e: any) {
      setPersonalTgMsg({ text: e.message || 'An error occurred.', type: 'error' });
    }
    setSavingPersonalTg(false);
  };

  const handleTestPersonalAlert = async () => {
    setTestingPersonalTg(true);
    setPersonalTgMsg(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/personal-events/test-personal-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          personal_chat_id: personalChatId.trim() || chatId.trim(),
          personal_bot_token: personalBotToken.trim() || botToken.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPersonalTgMsg({ text: data.message || 'Test message sent to your Personal Telegram ID!', type: 'success' });
      } else {
        setPersonalTgMsg({ text: data.error || 'Failed to send test alert.', type: 'error' });
      }
    } catch (e: any) {
      setPersonalTgMsg({ text: e.message || 'Failed to send test alert.', type: 'error' });
    }
    setTestingPersonalTg(false);
  };

  const handleAddPhysicalRoom = () => {
    const trimmed = newRoomInput.trim();
    if (!trimmed) return;
    if (!physicalRooms.includes(trimmed)) {
      setPhysicalRooms(prev => [...prev, trimmed]);
    }
    setDefaultPhysicalRoom(trimmed);
    setNewRoomInput('');
  };

  const handleRemovePhysicalRoom = (roomName: string) => {
    setPhysicalRooms(prev => {
      const next = prev.filter(r => r !== roomName);
      if (next.length === 0) return [...DEFAULT_PHYSICAL_ROOMS];
      if (defaultPhysicalRoom === roomName) {
        setDefaultPhysicalRoom(next[0]);
      }
      return next;
    });
  };

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
      const [res] = await Promise.all([
        fetch('/api/telegram/settings', {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ chatId, botToken, enabled, alertTemplates })
        }),
        fetch('/api/personal-events/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            personal_chat_id: personalChatId.trim(),
            personal_bot_token: personalBotToken.trim(),
            personal_enabled: personalEnabled,
            alert_after_it_meeting: alertAfterItMeeting,
            physical_rooms: physicalRooms,
            default_physical_room: defaultPhysicalRoom
          })
        })
      ]);
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

  const loadCronStatus = async () => {
    setLoadingCronStatus(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/cron/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCronStatus(data);
      }
    } catch (e) {
      console.error('Failed to load 24H keep-alive status:', e);
    }
    setLoadingCronStatus(false);
  };

  const handleRunCronSweepNow = async () => {
    setRunningCronSweep(true);
    setCronMsg(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/cron/run-now', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCronStatus(prev => ({
          ...(prev || { nodeEnv: 'production', port: '3000', sessionExpiresIn: '30d' }),
          ...data
        }));
        setCronMsg({
          text: `All 4 background workers swept in ${data.lastResult?.durationMs ?? 0}ms.`,
          type: 'success'
        });
      } else {
        setCronMsg({ text: data.error || 'Sweep failed.', type: 'error' });
      }
    } catch (e: any) {
      setCronMsg({ text: e.message || 'Sweep request failed.', type: 'error' });
    }
    setRunningCronSweep(false);
  };

  const handleRotateCronKey = async () => {
    setRotatingCronKey(true);
    setCronMsg(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/cron/rotate-key', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.keepAliveKey) {
        setCronStatus(prev => prev ? { ...prev, keepAliveKey: data.keepAliveKey } : prev);
        setCronMsg({
          text: 'Keep-alive secret key rotated. Update your cPanel Cron Job URL with the new command.',
          type: 'success'
        });
      } else {
        setCronMsg({ text: data.error || 'Failed to rotate key.', type: 'error' });
      }
    } catch (e: any) {
      setCronMsg({ text: e.message || 'Key rotation failed.', type: 'error' });
    }
    setRotatingCronKey(false);
  };

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  const cpanelCronCommand = cronStatus?.keepAliveKey
    ? `curl -fsS "${appOrigin}/api/cron/keep-alive?key=${cronStatus.keepAliveKey}" >/dev/null 2>&1`
    : `curl -fsS "${appOrigin}/api/cron/keep-alive?key=LOADING_KEY" >/dev/null 2>&1`;

  const handleCopyCronCommand = async () => {
    try {
      await navigator.clipboard.writeText(cpanelCronCommand);
      setCopiedCronCmd(true);
      setTimeout(() => setCopiedCronCmd(false), 2500);
    } catch {}
  };

  const formatUptime = (seconds: number) => {
    if (!seconds || seconds < 0) return '0m';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${seconds % 60}s`;
  };

  const handleDownloadGoDaddyEnv = () => {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    const generatedJwtSecret = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    const keepAliveKey = cronStatus?.keepAliveKey || '';

    const envLines = [
      '# GoDaddy Production Environment Configuration',
      'NODE_ENV=production',
      '',
      '# Database (Use 118.139.180.163 for GoDaddy Node.js App cloud; use localhost only on same cPanel server)',
      'PRIMARY_DB=godaddy',
      'PRIMARY_LOCKED=true',
      'MYSQL_HOST=118.139.180.163',
      'MYSQL_PORT=3306',
      'MYSQL_USER=khema_dbuser',
      'MYSQL_PASSWORD=YOUR_GODADDY_MYSQL_PASSWORD',
      'MYSQL_DATABASE=khema_ainotes',
      'MYSQL_SSL=false',
      '',
      '# 30-Day Persistent Login Session',
      `JWT_SECRET=${generatedJwtSecret}`,
      'JWT_EXPIRES_IN=30d',
      '',
      '# 24H Keep-Alive Cron Key',
      `CRON_KEEPALIVE_KEY=${keepAliveKey}`,
      '',
      '# Optional Integrations',
      'GEMINI_API_KEY=',
      'TELEGRAM_BOT_TOKEN=',
      'TELEGRAM_CHAT_ID=',
      ''
    ].join('\n');

    const blob = new Blob([envLines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'godaddy.env';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCronMsg({
      text: 'Downloaded godaddy.env (replace YOUR_GODADDY_MYSQL_PASSWORD before uploading to GoDaddy).',
      type: 'success'
    });
  };

  return (
    <>
      <SmartModal
        open={isOpen}
        onClose={onClose}
        title="Notifications, Meeting Alerts & Templates"
        subtitle="Configure Telegram bots, IT meeting groups, personal alerts, rooms, and note templates"
        icon={
          activeTab === 'telegram'
            ? <Bell size={18} />
            : activeTab === 'meeting-telegram'
              ? <Calendar size={18} />
              : activeTab === 'personal-telegram'
                ? <BellRing size={18} />
                : activeTab === '24h-deploy'
                  ? <Server size={18} />
                  : <FileText size={18} />
        }
        size="lg"
        footer={
          activeTab === 'telegram' ? (
            <>
              <Button variant="secondary" size="sm" type="button" onClick={onClose}>Cancel</Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleTestTelegram}
                isLoading={testingTelegram}
                disabled={!botToken || !chatId}
                className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-500/20"
              >
                Test
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={handleSaveTelegram}
                isLoading={savingTelegram}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <Save size={15} />
                Save
              </Button>
            </>
          ) : activeTab === 'meeting-telegram' ? (
            <>
              <Button variant="secondary" size="sm" type="button" onClick={onClose}>Cancel</Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => handleTestMeetingTelegram()}
                isLoading={testingMeetingTg}
                disabled={meetingGroups.every(g => !g.chat_id?.trim())}
                className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-500/20 gap-1.5"
                title="Send test alert to all configured groups with valid Chat IDs"
              >
                <Send size={14} />
                <span>Test Broadcast All ({meetingGroups.filter(g => g.chat_id?.trim()).length})</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={handleSaveMeetingTelegram}
                isLoading={savingMeetingTg}
                className="gap-1.5"
              >
                <Save size={15} />
                <span>Save Multi-Group Config</span>
              </Button>
            </>
          ) : activeTab === 'personal-telegram' ? (
            <>
              <Button variant="secondary" size="sm" type="button" onClick={onClose}>Cancel</Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleTestPersonalAlert}
                isLoading={testingPersonalTg}
                disabled={!(personalChatId.trim() || chatId.trim())}
                className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-500/20 gap-1.5"
              >
                <Send size={14} />
                <span>Test Personal ID</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => handleSavePersonalAlert()}
                isLoading={savingPersonalTg}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <Save size={15} />
                <span>Save Personal Alert</span>
              </Button>
            </>
          ) : activeTab === '24h-deploy' ? (
            <>
              <Button variant="secondary" size="sm" type="button" onClick={onClose}>Close</Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleDownloadGoDaddyEnv}
                className="gap-1.5"
              >
                <Download size={14} />
                <span>Download .env</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={handleRunCronSweepNow}
                isLoading={runningCronSweep}
                className="gap-1.5"
              >
                <RefreshCw size={14} />
                <span>Run Keep-Alive Sweep Now</span>
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>Close</Button>
          )
        }
      >
        {/* Modal Tab Strip */}
        <div className="-mx-5 -mt-4 mb-4 flex flex-wrap items-center gap-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('telegram')}
            className={`pb-2.5 flex items-center gap-2 font-semibold text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'telegram'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Bell size={15} /> Notifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('meeting-telegram')}
            className={`pb-2.5 flex items-center gap-2 font-semibold text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'meeting-telegram'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Calendar size={15} /> IT Meeting Alert
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('personal-telegram')}
            className={`pb-2.5 flex items-center gap-2 font-semibold text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'personal-telegram'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <BellRing size={15} /> Personal Alert
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`pb-2.5 flex items-center gap-2 font-semibold text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'templates'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <FileText size={15} /> Note Templates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('24h-deploy')}
            className={`pb-2.5 flex items-center gap-2 font-semibold text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === '24h-deploy'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Server size={15} /> 24H &amp; Deploy
          </button>
        </div>

        {activeTab === 'meeting-telegram' && (
          <div className="space-y-5">
            {loadingMeetingTg ? (
              <div className="flex justify-center p-8"><div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <>
                {meetingTgMsg && (
                  <div className={`px-4 py-3 rounded-xl text-xs font-semibold border flex items-center justify-between ${
                    meetingTgMsg.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                  }`}>
                    <span>{meetingTgMsg.text}</span>
                    <button onClick={() => setMeetingTgMsg(null)} className="text-xs opacity-60 hover:opacity-100">&times;</button>
                  </div>
                )}

                {/* Template Format Preview Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Template Message Format (Auto-Formatted Broadcast)</span>
                    </span>
                    <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                      Markdown / Plain Text
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 whitespace-pre-wrap leading-relaxed shadow-2xs">
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
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Telegram Bot Token (Optional Override)
                  </label>
                  <input
                    type="password"
                    placeholder="Leave blank to use system bot token (or enter 123456:ABC-DEF...)"
                    value={meetingBotToken}
                    onChange={(e) => setMeetingBotToken(e.target.value)}
                    className={`${SMART_INPUT_CLASS} font-mono text-xs`}
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                    Used to dispatch automated meeting reminders to all configured groups below.
                  </span>
                </div>

                {/* MULTI-GROUP ALERT MANAGER */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Configured Telegram Alert Groups ({meetingGroups.length})
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Meeting alerts can be broadcast to any or all of these groups in parallel.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddGroup}
                      className="rounded-xl text-xs h-8 px-3 gap-1.5 font-bold"
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
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-slate-700 dark:text-slate-200 hover:text-indigo-700 transition-colors shadow-2xs flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <Sparkles size={10} className="text-indigo-500" />
                        <span>+ {preset}</span>
                      </button>
                    ))}
                  </div>

                  {/* Groups List */}
                  <div className="space-y-2.5 pt-1">
                    {meetingGroups.length === 0 ? (
                      <div className="text-center py-6 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400">
                        No Telegram groups added yet. Click &quot;Add Group&quot; or choose a quick preset above.
                      </div>
                    ) : (
                      meetingGroups.map((group) => (
                        <div
                          key={group.id}
                          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                                Group Label / Name
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. IT Core Operations"
                                value={group.name}
                                onChange={(e) => handleUpdateGroup(group.id, { name: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                                Telegram Chat ID *
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. -100123456789 or @group_id"
                                value={group.chat_id}
                                onChange={(e) => handleUpdateGroup(group.id, { chat_id: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 dark:text-slate-300 select-none">
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
                                className="px-2 py-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg border border-indigo-200/80 dark:border-indigo-800 transition-colors disabled:opacity-40 cursor-pointer"
                                title="Send test reminder only to this group"
                              >
                                {testingGroupId === group.id ? 'Sending...' : 'Test'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteGroup(group.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
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
                <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Default Meeting Schedule Presets
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                        Default Physical Location / Room
                      </label>
                      <select
                        value={
                          physicalRooms.includes(meetingVenue)
                            ? meetingVenue
                            : '__custom__'
                        }
                        onChange={(e) => {
                          if (e.target.value !== '__custom__') {
                            setMeetingVenue(e.target.value);
                          } else if (physicalRooms.includes(meetingVenue)) {
                            setMeetingVenue('');
                          }
                        }}
                        className={SMART_INPUT_CLASS}
                      >
                        {physicalRooms.map((room) => (
                          <option key={room} value={room}>
                            {room}
                          </option>
                        ))}
                        <option value="__custom__">Other / Custom Venue...</option>
                      </select>
                      {!physicalRooms.includes(meetingVenue) && (
                        <input
                          type="text"
                          placeholder="Enter custom venue or room name"
                          value={meetingVenue}
                          onChange={(e) => setMeetingVenue(e.target.value)}
                          className={`${SMART_INPUT_CLASS} mt-1.5`}
                        />
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                        Default Organizer Sign-off
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Braseth"
                        value={meetingOrganizer}
                        onChange={(e) => setMeetingOrganizer(e.target.value)}
                        className={SMART_INPUT_CLASS}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      Default Room Booking Note / Assignee
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bunnarith, please help to book the meeting room"
                      value={meetingRoomNote}
                      onChange={(e) => setMeetingRoomNote(e.target.value)}
                      className={SMART_INPUT_CLASS}
                    />
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                      Appended in parentheses after the venue in the Telegram alert message.
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'personal-telegram' && (
          <div className="space-y-5">
            {loadingPersonalTg ? (
              <div className="flex justify-center p-8">
                <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {personalTgMsg && (
                  <div
                    className={`px-4 py-3 rounded-xl text-xs font-semibold border flex items-center justify-between ${
                      personalTgMsg.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    <span>{personalTgMsg.text}</span>
                    <button
                      type="button"
                      onClick={() => setPersonalTgMsg(null)}
                      className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                )}

                {/* Dedicated Personal Telegram ID Alert Section */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 rounded-2xl space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <BellRing size={15} className="text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Dedicated Personal Telegram ID Alert
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Receive personal My Scheduler reminders and post-broadcast IT Meeting alerts directly to your private Telegram User/Chat ID.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        Personal Telegram Chat ID *
                      </label>
                      <input
                        type="text"
                        value={personalChatId}
                        onChange={(e) => setPersonalChatId(e.target.value)}
                        placeholder={chatId ? `Leave blank to use ${chatId}` : 'e.g. 123456789'}
                        className={`${SMART_INPUT_CLASS} font-mono`}
                      />
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                        Your direct numeric Telegram ID (from @userinfobot).
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        Personal Bot Token (Optional Override)
                      </label>
                      <input
                        type="password"
                        value={personalBotToken}
                        onChange={(e) => setPersonalBotToken(e.target.value)}
                        placeholder="Leave blank to reuse Notifications / IT Meeting bot"
                        className={`${SMART_INPUT_CLASS} font-mono`}
                      />
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                        Optional separate personal bot token from @BotFather.
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-200 font-medium">
                      <input
                        type="checkbox"
                        checked={personalEnabled}
                        onChange={(e) => setPersonalEnabled(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                      />
                      <span>Enable automatic personal Telegram alerts for My Scheduler events</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-200 font-medium">
                      <input
                        type="checkbox"
                        checked={alertAfterItMeeting}
                        onChange={(e) => setAlertAfterItMeeting(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                      />
                      <span>
                        Send dedicated confirmation alert to my Personal Telegram ID right after an IT Meeting Alert broadcast
                      </span>
                    </label>
                  </div>
                </div>

                {/* Physical Location / Room Dropdown Settings */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Physical Location / Room Dropdown Configuration
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPhysicalRooms([...DEFAULT_PHYSICAL_ROOMS]);
                        setDefaultPhysicalRoom(DEFAULT_PHYSICAL_ROOMS[0]);
                      }}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Restore Defaults
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      Default Physical Location / Room
                    </label>
                    <select
                      value={defaultPhysicalRoom}
                      onChange={(e) => setDefaultPhysicalRoom(e.target.value)}
                      className={SMART_INPUT_CLASS}
                    >
                      {physicalRooms.map((room) => (
                        <option key={room} value={room}>
                          {room}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                      Configured Room Options ({physicalRooms.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {physicalRooms.map((room) => (
                        <div
                          key={room}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200"
                        >
                          <span>{room}</span>
                          {physicalRooms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePhysicalRoom(room)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                              title={`Remove ${room}`}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newRoomInput}
                        onChange={(e) => setNewRoomInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPhysicalRoom();
                          }
                        }}
                        placeholder="Add custom meeting room..."
                        className={SMART_INPUT_CLASS}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddPhysicalRoom}
                        disabled={!newRoomInput.trim()}
                        className="whitespace-nowrap shrink-0"
                      >
                        <Plus size={14} className="mr-1" />
                        Add Room
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'telegram' && (
          <div className="space-y-5">
            {loadingTelegram ? (
              <div className="flex justify-center p-8"><div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <>
                {tgMsg && (
                  <div className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-200 px-4 py-3 rounded-xl text-sm border border-indigo-100/50 dark:border-indigo-800">
                    {tgMsg}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Bot Token</label>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-start gap-1.5 leading-relaxed">
                    <HelpCircle size={14} className="shrink-0 mt-0.5" />
                    You can get a token from <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">https://t.me/BotFather</a>
                  </div>
                  <input
                    type="text"
                    value={botToken}
                    onChange={e => setBotToken(e.target.value)}
                    placeholder="1234567890:AAH_xxxxxxxxxxxxxxx"
                    className={`${SMART_INPUT_CLASS} font-mono`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Chat ID</label>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-start gap-1.5 leading-relaxed">
                    <HelpCircle size={14} className="shrink-0 mt-0.5" />
                    Support Direct Chat / Group / Channel&apos;s Chat ID. Get it by sending a message to your bot and checking bot updates.
                  </div>
                  <input
                    type="text"
                    value={chatId}
                    onChange={e => setChatId(e.target.value)}
                    placeholder="-100xxxxxxx"
                    className={`${SMART_INPUT_CLASS} font-mono`}
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer group pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className={`relative w-10 h-5 transition-colors duration-300 rounded-full ${enabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${enabled ? 'translate-x-[20px]' : 'translate-x-0'}`}></div>
                  </div>
                  <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="hidden" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Default enabled</span>
                </label>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Default Physical Location / Room
                  </label>
                  <select
                    value={defaultPhysicalRoom}
                    onChange={(e) => setDefaultPhysicalRoom(e.target.value)}
                    className={SMART_INPUT_CLASS}
                  >
                    {physicalRooms.map((room) => (
                      <option key={room} value={room}>
                        {room}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                    Used as the default room selection across Scheduler &amp; Meetings. Manage rooms in the Personal Alert tab.
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-3">Send instant push notifications for these templates:</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {[
                      { id: 'it-meeting', name: 'IT Team Meeting' },
                      { id: 'ops-meeting', name: 'KHEMA - OPERATIONS MANAGEMENT Meeting' },
                      ...templates
                    ].map(t => (
                      <label key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                          checked={alertTemplates.includes(t.id)}
                          onChange={(e) => {
                            if (e.target.checked) setAlertTemplates(prev => [...prev, t.id]);
                            else setAlertTemplates(prev => prev.filter(id => id !== t.id));
                          }}
                        />
                        <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium">{t.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            {editingTemplate ? (
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <button type="button" onClick={() => setEditingTemplate(null)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <ChevronLeft size={20} />
                  </button>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{editingTemplate.isNew ? 'Create Template' : 'Edit Template'}</h3>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Template Name (e.g. Daily Standup) *</label>
                  <input type="text" value={tmplName} onChange={e => setTmplName(e.target.value)} className={SMART_INPUT_CLASS} placeholder="Template Name" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Default Note Title (Optional)</label>
                  <input type="text" value={tmplTitle} onChange={e => setTmplTitle(e.target.value)} className={SMART_INPUT_CLASS} placeholder="Note Title..." />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Default Content (HTML allowed)</label>
                  <textarea rows={6} value={tmplContent} onChange={e => setTmplContent(e.target.value)} className={`${SMART_TEXTAREA_CLASS} font-mono text-xs`} placeholder="<p>Points to discuss...</p>" />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="secondary" type="button" onClick={() => setEditingTemplate(null)} size="sm">Cancel</Button>
                  <Button variant="primary" type="button" onClick={handleSaveTemplate} isLoading={savingTemplate} size="sm" disabled={!tmplName.trim()}>Save Template</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">Your Templates</h3>
                  <Button variant="outline" size="sm" onClick={() => openTemplateEditor()} className="h-8 shadow-sm">
                    <Plus size={14} className="mr-1.5" /> New Template
                  </Button>
                </div>

                {loadingTemplates ? (
                  <div className="py-8 flex justify-center"><div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : templates.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <FileText size={32} className="mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm">No custom templates yet.</p>
                    <p className="text-xs mt-1">Create one to quickly generate standardized notes.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {templates.map(tmpl => (
                      <div key={tmpl.id} className="flex items-center justify-between p-3 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-xs hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
                        <div className="min-w-0 pr-3">
                          <div className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">{tmpl.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">{tmpl.title || 'No default title'}</div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button type="button" onClick={() => openTemplateEditor(tmpl)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-md transition-colors cursor-pointer"><Edit2 size={14}/></button>
                          <button type="button" onClick={() => handleDeleteTemplate(tmpl.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors cursor-pointer"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === '24h-deploy' && (
          <div className="space-y-4">
            {loadingCronStatus && !cronStatus ? (
              <div className="flex justify-center p-8">
                <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {cronMsg && (
                  <div
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-between ${
                      cronMsg.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    <span>{cronMsg.text}</span>
                    <button
                      type="button"
                      onClick={() => setCronMsg(null)}
                      className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                )}

                {/* Runtime & 30-Day Session Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Session TTL</span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {cronStatus?.sessionExpiresIn || '30d'} Sliding
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Persists browser close</div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <Server size={13} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Process Uptime</span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatUptime(cronStatus?.uptimeSeconds || 0)}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {cronStatus?.nodeEnv || 'dev'} : {cronStatus?.port || '3000'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <RefreshCw size={13} className="text-indigo-600 dark:text-indigo-400" />
                      <span>Total 24H Ticks</span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {cronStatus?.totalTicks ?? 0}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {cronStatus?.lastTickSource ? `Last: ${cronStatus.lastTickSource}` : 'Awaiting first tick'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Last Sweep</span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {cronStatus?.lastResult?.durationMs !== undefined
                        ? `${cronStatus.lastResult.durationMs}ms`
                        : '—'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {cronStatus?.lastTickAt
                        ? new Date(cronStatus.lastTickAt).toLocaleTimeString()
                        : 'Not run yet'}
                    </div>
                  </div>
                </div>

                {/* 4 Background Workers Status Grid */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        24/7 Background Workers (Browser-Independent)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Swept automatically on startup and every minute via GoDaddy cPanel Cron Keep-Alive with 24H catch-up.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={loadCronStatus}
                      disabled={loadingCronStatus}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <RefreshCw size={12} className={loadingCronStatus ? 'animate-spin' : ''} />
                      Refresh
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 flex items-start gap-2.5">
                      <BellRing size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">Personal Scheduler Alerts</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                          {cronStatus?.lastResult?.workers?.personalReminders
                            ? cronStatus.lastResult.workers.personalReminders.error
                              ? `Error: ${cronStatus.lastResult.workers.personalReminders.error}`
                              : `Checked ${cronStatus.lastResult.workers.personalReminders.checked}, sent ${cronStatus.lastResult.workers.personalReminders.sent}`
                            : 'Ready (24H catch-up enabled)'}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 flex items-start gap-2.5">
                      <Calendar size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">System Update Reminders</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                          {cronStatus?.lastResult?.workers?.systemUpdates
                            ? cronStatus.lastResult.workers.systemUpdates.error
                              ? `Error: ${cronStatus.lastResult.workers.systemUpdates.error}`
                              : `Checked ${cronStatus.lastResult.workers.systemUpdates.checked}, sent ${cronStatus.lastResult.workers.systemUpdates.sent}`
                            : 'Ready (24H catch-up enabled)'}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 flex items-start gap-2.5">
                      <Database size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">MySQL Heartbeat Monitor</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums mt-0.5 truncate">
                          {cronStatus?.lastResult?.workers?.dbHeartbeat
                            ? cronStatus.lastResult.workers.dbHeartbeat.ok
                              ? `${cronStatus.lastResult.workers.dbHeartbeat.host} OK${cronStatus.lastResult.workers.dbHeartbeat.latencyMs ? ` (${cronStatus.lastResult.workers.dbHeartbeat.latencyMs}ms)` : ''}`
                              : `Warning: ${cronStatus.lastResult.workers.dbHeartbeat.error || 'unreachable'}`
                            : 'Active'}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 flex items-start gap-2.5">
                      <Mail size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">Background IMAP Mail Sync</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                          {cronStatus?.lastResult?.workers?.mailAutoSync
                            ? cronStatus.lastResult.workers.mailAutoSync.error
                              ? `Error: ${cronStatus.lastResult.workers.mailAutoSync.error}`
                              : `Accounts checked ${cronStatus.lastResult.workers.mailAutoSync.checked}, synced ${cronStatus.lastResult.workers.mailAutoSync.synced}`
                            : 'Ready'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* cPanel Cron Keep-Alive Command */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        GoDaddy cPanel Cron Job Command (Once Per Minute: <code className="font-mono">* * * * *</code>)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Paste into <strong>cPanel &rarr; Advanced &rarr; Cron Jobs</strong> so Node.js stays awake 24H even when all browsers are closed.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRotateCronKey}
                        isLoading={rotatingCronKey}
                        className="h-7 px-2.5 text-[11px] gap-1"
                      >
                        <KeyRound size={12} />
                        <span>Rotate Key</span>
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleCopyCronCommand}
                        className="h-7 px-2.5 text-[11px] gap-1"
                      >
                        {copiedCronCmd ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedCronCmd ? 'Copied' : 'Copy Command'}</span>
                      </Button>
                    </div>
                  </div>

                  <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto select-all border border-slate-800">
                    {cpanelCronCommand}
                  </pre>
                </div>

                {/* GitHub -> GoDaddy cPanel Deployment Steps */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2">
                  <div className="flex items-center gap-2">
                    <GitBranch size={14} className="text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      GitHub &rarr; GoDaddy cPanel Deployment Checklist
                    </h4>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    <li>
                      Open <strong>GoDaddy cPanel &rarr; Git&trade; Version Control &rarr; Create</strong>, toggle <strong>Clone a Repository</strong>, paste your GitHub repo URL, then click <strong>Manage &rarr; Pull or Deploy &rarr; Deploy HEAD Commit</strong> (runs <code className="font-mono">.cpanel.yml</code> automatically).
                    </li>
                    <li>
                      Open <strong>cPanel &rarr; Setup Node.js App &rarr; Create Application</strong>: select Node 20/22, <strong>Production</strong> mode, Application Root matching your cloned repo folder, and Startup File <code className="font-mono">app.js</code>.
                    </li>
                    <li>
                      Set environment variables (<code className="font-mono">NODE_ENV=production</code>, MySQL credentials, <code className="font-mono">JWT_SECRET</code>, <code className="font-mono">JWT_EXPIRES_IN=30d</code>) and click <strong>Restart</strong>.
                    </li>
                    <li>
                      Add the <strong>Once Per Minute (<code className="font-mono">* * * * *</code>)</strong> Cron Job command above in cPanel so alerts, heartbeats, and IMAP mail sync run 24/7.
                    </li>
                  </ol>
                </div>
              </>
            )}
          </div>
        )}
      </SmartModal>

      <SmartModal
        open={Boolean(confirmDeleteTemplateId)}
        onClose={() => setConfirmDeleteTemplateId(null)}
        title="Delete Template"
        subtitle="Remove note template"
        icon={<Trash2 size={16} className="text-rose-600" />}
        size="sm"
        zIndexClass="z-[60]"
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmDeleteTemplateId(null)}>Cancel</Button>
            <Button type="button" variant="danger" size="sm" onClick={confirmDeleteTemplate}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delete this template? This action cannot be undone.
        </p>
      </SmartModal>
    </>
  );
};
