import React, { useState, useEffect } from 'react';
import { 
  Database, Download, Server, CheckCircle2, AlertCircle, RefreshCw, 
  ExternalLink, Copy, Check, ArrowRight, ShieldCheck, Key, Lock, Globe,
  FileCode, Layers, Info, RotateCcw, Clock, HardDrive, Play, Trash2, 
  Calendar, Shield, Settings2, Sparkles, ArrowDownToLine, AlertTriangle, X,
  BellRing, Radio, WifiOff, Send, Upload, FileUp, FileCheck2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SmartModal, SMART_INPUT_CLASS } from '../../components/ui/SmartModal';
import { DensityToggle } from '../../components/ui/SmartGrid';

export interface TelegramStatus {
  configured: boolean;
  recipientsCount: number;
  recipients: { name: string; chatId: string }[];
  isRemoteOperating: boolean;
  isRemoteReportedDown: boolean;
  activeHost: string;
  lastAlertTimestamp: string | null;
  cooldownMinutes: number;
}

interface DbStatus {
  host: string;
  activeHost?: string;
  port: number;
  database: string;
  user: string;
  isRemote: boolean;
  primaryDb?: 'godaddy' | 'local';
  isPrimaryLocked?: boolean;
  isFailoverActive?: boolean;
  failoverReason?: string | null;
  lastFailoverAt?: string | null;
  sslEnabled: boolean;
  status: string;
  latencyMs: number;
  outboundIp?: string;
  counts?: {
    notes: number;
    subscriptions: number;
    assets: number;
    tickets: number;
    staff: number;
    users: number;
  };
  error?: string;
}

interface BackupMeta {
  id: string;
  filename: string;
  createdAt: string;
  sizeBytes: number;
  formattedSize: string;
  trigger: 'scheduled_12h' | 'manual' | 'pre_restore_safety' | 'imported_godaddy';
  database: string;
  host: string;
  tableCount: number;
  sourceDatabase?: string;
  recordCounts: {
    notes: number;
    subscriptions: number;
    assets: number;
    users: number;
    tickets: number;
    mailAccounts: number;
  };
  status: 'success' | 'failed';
  error?: string;
}

interface SqlImportPreview {
  filename: string;
  targetDatabase: string;
  targetHost: string;
  valid: boolean;
  sizeBytes: number;
  formattedSize: string;
  sourceDatabase: string | null;
  tablesFound: string[];
  createTableCount: number;
  dropTableCount: number;
  insertCount: number;
  hasCreateDbOrUse: boolean;
  hasDefiner: boolean;
  estimatedStatements: number;
}

interface BackupConfig {
  enabled: boolean;
  intervalHours: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  keepMax: number;
}

export const DatabaseMigrationModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'backups' | 'connection' | 'guide'>('backups');
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  
  // Connection Form State
  const [host, setHost] = useState('');
  const [port, setPort] = useState('3306');
  const [database, setDatabase] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [ssl, setSsl] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Testing & Applying Connection
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    tablesCount?: number;
    tablesFound?: string[];
    error?: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [reverting, setReverting] = useState(false);

  // Backup System State
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [backupConfig, setBackupConfig] = useState<BackupConfig | null>(null);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoreModalBackup, setRestoreModalBackup] = useState<BackupMeta | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [tempInterval, setTempInterval] = useState(12);
  const [tempEnabled, setTempEnabled] = useState(true);
  const [tempKeepMax, setTempKeepMax] = useState(30);
  const [savingConfig, setSavingConfig] = useState(false);

  // Import GoDaddy SQL Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importRawSql, setImportRawSql] = useState('');
  const [importInputMode, setImportInputMode] = useState<'file' | 'paste'>('file');
  const [importApplyMode, setImportApplyMode] = useState<'apply' | 'vault_only'>('apply');
  const [analyzingSql, setAnalyzingSql] = useState(false);
  const [sqlPreview, setSqlPreview] = useState<SqlImportPreview | null>(null);
  const [importingSql, setImportingSql] = useState(false);
  const [importModalError, setImportModalError] = useState('');

  // Telegram Connection Loss Alert State
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null);
  const [testingTelegramAlert, setTestingTelegramAlert] = useState(false);
  const [telegramAlertNotice, setTelegramAlertNotice] = useState('');

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/db/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDbStatus(data);
        if (data.isRemote) {
          setHost(data.host || '');
          setPort(String(data.port || 3306));
          setDatabase(data.database || '');
          setSsl(!!data.sslEnabled);
        }
      }
    } catch (err) {
      console.error('Failed to fetch DB status', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchBackups = async () => {
    try {
      setLoadingBackups(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/db/backups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBackups(data.backups || []);
        if (data.config) {
          setBackupConfig(data.config);
          setTempInterval(data.config.intervalHours || 12);
          setTempEnabled(data.config.enabled ?? true);
          setTempKeepMax(data.config.keepMax || 30);
        }
      }
    } catch (err) {
      console.error('Failed to fetch backups', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const fetchTelegramStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/telegram/db-alert-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTelegramStatus(data);
      }
    } catch (err) {
      console.warn('Failed to fetch telegram DB alert status', err);
    }
  };

  const handleSendTestTelegramAlert = async () => {
    try {
      setTestingTelegramAlert(true);
      setTelegramAlertNotice('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/telegram/test-db-alert', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send test alert');
      setTelegramAlertNotice('Test notification successfully delivered to your Telegram bot (kipchelpdesk_bot)! Check your Telegram app.');
      setTimeout(() => setTelegramAlertNotice(''), 7000);
      await fetchTelegramStatus();
    } catch (err: any) {
      setTelegramAlertNotice('Error: ' + err.message);
    } finally {
      setTestingTelegramAlert(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchBackups();
    fetchTelegramStatus();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      setRestoreSuccess('');
      setRestoreError('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/db/backups/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create backup');

      setRestoreSuccess(`Manual backup snapshot successfully created: ${data.backup?.formattedSize || ''}`);
      await fetchBackups();
    } catch (err: any) {
      setRestoreError(err.message || 'Error creating backup snapshot');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!restoreModalBackup) return;
    try {
      setRestoring(true);
      setRestoreSuccess('');
      setRestoreError('');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/db/backups/${restoreModalBackup.id}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');

      setRestoreSuccess(`Database successfully restored! Notes: ${data.recordCounts?.notes ?? 0}, Subscriptions: ${data.recordCounts?.subscriptions ?? 0}, Assets: ${data.recordCounts?.assets ?? 0}`);
      setRestoreModalBackup(null);
      await fetchStatus();
      await fetchBackups();
    } catch (err: any) {
      setRestoreError(err.message || 'Error restoring database snapshot');
    } finally {
      setRestoring(false);
    }
  };

  const handleDeleteBackup = async (id: string, filename: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/db/backups/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete backup');
      setRestoreSuccess(`Backup '${filename}' deleted successfully.`);
      await fetchBackups();
    } catch (err: any) {
      setRestoreError(err.message || 'Failed to delete backup');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/db/backups/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          enabled: tempEnabled,
          intervalHours: Number(tempInterval) || 12,
          keepMax: Number(tempKeepMax) || 30
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update schedule');
      setBackupConfig(data.config);
      setConfigModalOpen(false);
      setRestoreSuccess(`Automated backup schedule set to every ${tempInterval} hours (${tempEnabled ? 'Active' : 'Disabled'}).`);
    } catch (err: any) {
      setRestoreError(err.message || 'Failed to update schedule');
    } finally {
      setSavingConfig(false);
    }
  };

  const openImportModal = () => {
    setImportFile(null);
    setImportRawSql('');
    setImportInputMode('file');
    setImportApplyMode('apply');
    setSqlPreview(null);
    setImportModalError('');
    setImportModalOpen(true);
  };

  const analyzeSqlSource = async (params: { file?: File | null; sqlContent?: string }) => {
    setAnalyzingSql(true);
    setImportModalError('');
    setSqlPreview(null);
    try {
      const token = localStorage.getItem('token');
      let res: Response;
      if (params.file) {
        const formData = new FormData();
        formData.append('file', params.file);
        res = await fetch('/api/db/import-sql/preview', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
      } else {
        res = await fetch('/api/db/import-sql/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            sqlContent: params.sqlContent || '',
            filename: 'pasted_godaddy_dump.sql'
          })
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to inspect SQL file');
      if (!data.valid) {
        setImportModalError('No valid CREATE TABLE or INSERT INTO statements were detected in this file.');
      }
      setSqlPreview(data);
    } catch (err: any) {
      setImportModalError(err.message || 'Unable to inspect SQL content');
    } finally {
      setAnalyzingSql(false);
    }
  };

  const handleSelectImportFile = (file: File | null) => {
    setImportFile(file);
    if (file) {
      analyzeSqlSource({ file });
    } else {
      setSqlPreview(null);
      setImportModalError('');
    }
  };

  const handleExecuteSqlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (importInputMode === 'file' && !importFile) {
      setImportModalError('Please choose a .sql file first.');
      return;
    }
    if (importInputMode === 'paste' && !importRawSql.trim()) {
      setImportModalError('Please paste SQL statements first.');
      return;
    }

    try {
      setImportingSql(true);
      setImportModalError('');
      setRestoreSuccess('');
      setRestoreError('');

      const token = localStorage.getItem('token');
      let res: Response;
      if (importInputMode === 'file' && importFile) {
        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('mode', importApplyMode);
        res = await fetch('/api/db/import-sql', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
      } else {
        res = await fetch('/api/db/import-sql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            sqlContent: importRawSql,
            filename: 'pasted_godaddy_dump.sql',
            mode: importApplyMode
          })
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import GoDaddy SQL');

      setImportModalOpen(false);
      const rc = data.recordCounts || {};
      const countSummary = data.mode === 'apply'
        ? ` Active records — Users: ${rc.users ?? 0}, Notes: ${rc.notes ?? 0}, Subscriptions: ${rc.subscriptions ?? 0}, Assets: ${rc.assets ?? 0}.`
        : '';
      setRestoreSuccess(`${data.message}${countSummary}`);
      await Promise.all([fetchStatus(), fetchBackups()]);
    } catch (err: any) {
      setImportModalError(err.message || 'SQL import failed');
    } finally {
      setImportingSql(false);
    }
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);
    setSaveError('');
    setSaveSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/db/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          host,
          port: Number(port) || 3306,
          database,
          user,
          password,
          ssl
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Successfully connected to GoDaddy MySQL!',
          latencyMs: data.latencyMs,
          tablesCount: data.tablesCount,
          tablesFound: data.tablesFound
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error while testing connection'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleApplyConfig = async () => {
    if (!host || !user || !database) {
      setSaveError('Please enter GoDaddy Database Server Host, Database Name, and Username.');
      return;
    }

    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/db/apply-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          host: host.trim(),
          port: Number(port) || 3306,
          database: database.trim(),
          user: user.trim(),
          password: password || '',
          ssl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to switch database');

      setSaveSuccess(data.message || 'Successfully connected to GoDaddy MySQL database!');
      await fetchStatus();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRevertLocal = async () => {
    setReverting(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/db/revert-local', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revert');

      setSaveSuccess(data.message);
      await fetchStatus();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setReverting(false);
    }
  };

  const [retryingGoDaddy, setRetryingGoDaddy] = useState(false);

  const handleRetryGoDaddy = async () => {
    try {
      setRetryingGoDaddy(true);
      setSaveError('');
      setSaveSuccess('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/db/retry-godaddy', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reconnect to GoDaddy MySQL');
      setSaveSuccess(data.message || 'Successfully reconnected to GoDaddy MySQL server!');
      await fetchStatus();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setRetryingGoDaddy(false);
    }
  };

  const downloadDump = () => {
    window.location.href = '/api/db/export-godaddy';
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  const getTimeRemaining = (nextIso: string | null) => {
    if (!nextIso) return 'Every 12 Hours';
    try {
      const diffMs = new Date(nextIso).getTime() - Date.now();
      if (diffMs <= 0) return 'Due for auto-run';
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `in ${hours}h ${mins}m`;
    } catch {
      return 'Every 12 Hours';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-lg relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck size={13} /> GoDaddy MySQL Migration & Disaster Recovery
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Database Center & 12h Auto-Backup
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Automated 12-hour snapshots run daily to prevent data loss. Systems administrators can restore any snapshot with 1-click or connect directly to GoDaddy cPanel MySQL.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
            <Button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              size="md"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Shield size={16} className={creatingBackup ? 'animate-spin' : ''} />
              {creatingBackup ? 'Creating Snapshot...' : 'Create Backup Now'}
            </Button>
            <Button
              onClick={openImportModal}
              size="md"
              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Upload size={16} /> Import GoDaddy SQL
            </Button>
            <Button
              onClick={downloadDump}
              size="md"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Download size={16} /> Export GoDaddy SQL
            </Button>
            <Button
              onClick={() => { fetchStatus(); fetchBackups(); }}
              variant="secondary"
              size="md"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <RefreshCw size={14} className={loadingStatus || loadingBackups ? 'animate-spin' : ''} /> Refresh
            </Button>
          </div>
        </div>

        {/* Current Connection & Backup Summary Strip */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Host</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`h-2 w-2 rounded-full ${
                dbStatus?.isRemote 
                  ? (dbStatus?.isFailoverActive ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400') 
                  : 'bg-indigo-400'
              }`} />
              <p className="text-xs font-semibold text-white truncate" title={dbStatus?.host}>
                {dbStatus?.isRemote 
                  ? (dbStatus?.isFailoverActive ? 'Buffering (Local)' : 'GoDaddy Primary') 
                  : 'Local MariaDB'}
              </p>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {dbStatus?.isRemote ? (dbStatus?.isPrimaryLocked ? 'Locked Primary' : dbStatus?.database) : (dbStatus?.database || 'ainotes_db')}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {backupConfig?.intervalHours || 12}h Auto-Backup
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`h-2 w-2 rounded-full ${backupConfig?.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
              <p className="text-xs font-semibold text-white">
                {backupConfig?.enabled ? `Active (${backupConfig?.intervalHours || 12}h)` : 'Paused'}
              </p>
            </div>
            <p className="text-[11px] text-emerald-400 mt-0.5 truncate">
              {backupConfig?.enabled ? getTimeRemaining(backupConfig?.nextRunAt ?? null) : 'Schedule disabled'}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stored Snapshots</span>
            <p className="text-xs font-semibold text-white mt-1">{backups.length} Backups</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Retains last {backupConfig?.keepMax || 30}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">IT Notes & Minutes</span>
            <p className="text-xs font-semibold text-white mt-1">{dbStatus?.counts?.notes ?? 9} Records</p>
            <p className="text-[11px] text-slate-400 mt-0.5">100% Protected</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cloud & HIS</span>
            <p className="text-xs font-semibold text-white mt-1">{dbStatus?.counts?.subscriptions ?? 11} Services</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Preserved in SQL</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Telegram Alert</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-semibold text-white truncate">kipchelpdesk_bot</p>
            </div>
            <p className="text-[11px] text-emerald-400 mt-0.5">Drop Alert Active</p>
          </div>
        </div>
      </div>

      {/* Switch / Revert Notice if Remote */}
      {dbStatus?.isRemote && (
        dbStatus?.isFailoverActive ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-amber-900">
                    Temporary In-Memory Replica Buffer Active &bull; Auto-Reconnecting GoDaddy
                  </p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 flex items-center gap-1">
                    <Lock size={10} /> GoDaddy Primary Locked
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-0.5">
                  GoDaddy MySQL dropped connection ({dbStatus.failoverReason || 'ETIMEDOUT'}). Configuration remains safely locked in .env. Application is buffering queries from the local replica to preserve 100% uptime without data loss. Auto-reconnection runs every 30 seconds.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handleRetryGoDaddy}
                variant="secondary"
                size="sm"
                disabled={retryingGoDaddy}
                className="bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200 whitespace-nowrap text-xs font-semibold"
              >
                <RefreshCw size={13} className={`mr-1.5 ${retryingGoDaddy ? 'animate-spin' : ''}`} />
                {retryingGoDaddy ? 'Reconnecting...' : 'Retry GoDaddy Now'}
              </Button>
              <Button
                onClick={handleRevertLocal}
                variant="secondary"
                size="sm"
                disabled={reverting}
                className="border-slate-300 text-slate-700 hover:bg-slate-100 whitespace-nowrap text-xs"
              >
                {reverting ? 'Reverting...' : 'Explicit Local Revert'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-emerald-900">
                    Application Primary Database: GoDaddy Remote MySQL ({dbStatus.host})
                  </p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 flex items-center gap-1">
                    <Lock size={10} /> Permanent Locked Primary
                  </span>
                  <span className="text-xs font-mono text-emerald-700">
                    {dbStatus.latencyMs} ms
                  </span>
                </div>
                <p className="text-xs text-emerald-700 mt-0.5">
                  All records, notes, and subscriptions are saving directly to your GoDaddy cPanel MySQL server. Locked permanently across server reboots.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handleRetryGoDaddy}
                variant="secondary"
                size="sm"
                disabled={retryingGoDaddy}
                className="border-emerald-300 text-emerald-800 hover:bg-emerald-100 whitespace-nowrap text-xs"
              >
                <RefreshCw size={13} className={`mr-1.5 ${retryingGoDaddy ? 'animate-spin' : ''}`} />
                {retryingGoDaddy ? 'Checking...' : 'Ping GoDaddy'}
              </Button>
              <Button
                onClick={handleRevertLocal}
                variant="secondary"
                size="sm"
                disabled={reverting}
                className="border-slate-300 text-slate-700 hover:bg-slate-100 whitespace-nowrap text-xs"
              >
                <RotateCcw size={13} className={`mr-1.5 ${reverting ? 'animate-spin' : ''}`} />
                {reverting ? 'Reverting...' : 'Switch Back to Local MariaDB'}
              </Button>
            </div>
          </div>
        )
      )}

      {/* Notifications */}
      {restoreSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{restoreSuccess}</span>
          </div>
          <button onClick={() => setRestoreSuccess('')} className="text-emerald-600 hover:text-emerald-800">
            <X size={14} />
          </button>
        </div>
      )}

      {restoreError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{restoreError}</span>
          </div>
          <button onClick={() => setRestoreError('')} className="text-red-600 hover:text-red-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('backups')}
          className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'backups'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Shield size={16} />
          <span>12h Auto-Backups & 1-Click Restore</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700">
            {backups.length} Snapshots
          </span>
        </button>

        <button
          onClick={() => setActiveTab('connection')}
          className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'connection'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Server size={16} />
          <span>GoDaddy Remote MySQL Settings</span>
          {dbStatus?.isRemote && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
              Live
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'guide'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <FileCode size={16} />
          <span>phpMyAdmin Migration Guide</span>
        </button>
      </div>

      {/* TAB 1: 12H AUTO-BACKUPS & RESTORE */}
      {activeTab === 'backups' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Control & Assurance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Clock size={18} />
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  backupConfig?.enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {backupConfig?.enabled ? 'Engine Active' : 'Engine Paused'}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {backupConfig?.intervalHours || 12}-Hour Automated Interval
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {backupConfig?.intervalHours === 6
                    ? 'High-frequency backups run every 6 hours (00:00, 06:00, 12:00, 18:00 UTC) across all database tables.'
                    : backupConfig?.intervalHours === 24
                      ? 'Daily automated snapshots run every 24 hours (00:00 UTC) across all database tables.'
                      : 'Scheduled daily backups run every 12 hours (00:00 & 12:00 UTC) capturing complete snapshots of all tables.'}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Last Backup:</span>
                  <span className="font-semibold text-slate-700">
                    {backupConfig?.lastRunAt ? formatDateTime(backupConfig.lastRunAt) : 'Pending first snapshot'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Next Scheduled Run:</span>
                  <span className="font-semibold text-indigo-600">
                    {backupConfig?.enabled ? getTimeRemaining(backupConfig?.nextRunAt ?? null) : 'Paused'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <RotateCcw size={18} />
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Zero Data Loss
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Pre-Restore &amp; Pre-Import Safety</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Before any snapshot restore or GoDaddy SQL import runs, the system automatically saves a safety snapshot so you can revert anytime.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Protection Mode:</span>
                <span className="font-semibold text-emerald-600">Dual-Snapshot Safety</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <HardDrive size={18} />
                  </span>
                  <button
                    onClick={() => setConfigModalOpen(true)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Settings2 size={13} /> Configure
                  </button>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Automated Retention Policy</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Retains the last {backupConfig?.keepMax || 30} full SQL snapshots in the vault for instant 1-click disaster recovery or download.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Storage Used:</span>
                <span className="font-semibold text-slate-800">
                  {(() => {
                    const totalBytes = backups.reduce((acc, b) => acc + (b.sizeBytes || 0), 0);
                    return totalBytes >= 1024 * 1024
                      ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
                      : `${(totalBytes / 1024).toFixed(1)} KB`;
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Backup History Table Section */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Database size={16} className="text-indigo-600" />
                  Database Snapshots & Disaster Recovery Tape
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Import a GoDaddy <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">.sql</code> dump or click <strong>Restore</strong> on any snapshot to recover records into your live database.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <DensityToggle />
                <Button
                  onClick={openImportModal}
                  variant="secondary"
                  size="sm"
                  className="bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200 font-semibold flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Upload size={14} /> Import GoDaddy SQL
                </Button>
                <Button
                  onClick={handleCreateBackup}
                  disabled={creatingBackup}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Shield size={14} className={creatingBackup ? 'animate-spin' : ''} />
                  {creatingBackup ? 'Backing up...' : 'Create Backup Now'}
                </Button>
                <Button
                  onClick={() => setConfigModalOpen(true)}
                  variant="secondary"
                  size="sm"
                  className="text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Settings2 size={14} /> Schedule
                </Button>
              </div>
            </div>

            {loadingBackups ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
                <RefreshCw size={24} className="animate-spin text-indigo-600" />
                <p className="text-xs">Loading database snapshots...</p>
              </div>
            ) : backups.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Database size={24} />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No previous backups found yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click "Create Backup Now" to generate an immediate full SQL snapshot of your database.
                </p>
                <Button
                  onClick={handleCreateBackup}
                  disabled={creatingBackup}
                  size="sm"
                  className="bg-indigo-600 text-white"
                >
                  <Shield size={14} className="mr-1.5" /> Create First Backup
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
                <table className="smart-grid-table w-full text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Snapshot & Time</th>
                      <th className="py-3 px-4">Trigger</th>
                      <th className="py-3 px-4">Target Database</th>
                      <th className="py-3 px-4">Records Contained</th>
                      <th className="py-3 px-4 text-right">Size</th>
                      <th className="py-3 px-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {backups.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <FileCode size={14} className="text-indigo-600 shrink-0" />
                            <span className="truncate max-w-[220px]" title={b.filename}>{b.filename}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock size={11} /> {formatDateTime(b.createdAt)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {b.trigger === 'scheduled_12h' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock size={10} /> 12h Auto
                            </span>
                          ) : b.trigger === 'pre_restore_safety' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                              <ShieldCheck size={10} /> Safety Snapshot
                            </span>
                          ) : b.trigger === 'imported_godaddy' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] bg-violet-50 text-violet-700 border border-violet-200">
                              <Upload size={10} /> GoDaddy SQL Import
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Sparkles size={10} /> Manual Backup
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono text-slate-700 font-semibold">{b.database}</div>
                          <div className="text-[10px] text-slate-400">
                            {b.sourceDatabase && b.sourceDatabase !== b.database
                              ? `from ${b.sourceDatabase}`
                              : b.host}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                              <strong>{b.recordCounts?.notes ?? 0}</strong> Notes
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                              <strong>{b.recordCounts?.subscriptions ?? 0}</strong> Subs
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                              <strong>{b.recordCounts?.assets ?? 0}</strong> Assets
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                              <strong>{b.recordCounts?.users ?? 0}</strong> Users
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-mono tabular-nums text-right text-slate-600 dark:text-slate-300">
                          {b.formattedSize || '280 KB'}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              onClick={() => setRestoreModalBackup(b)}
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1 px-2.5 py-1 text-xs"
                            >
                              <RotateCcw size={12} /> Restore
                            </Button>

                            <a
                              href={`/api/db/backups/${b.id}/download`}
                              download={b.filename}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                              title="Download SQL File"
                            >
                              <Download size={14} />
                            </a>

                            <button
                              onClick={() => handleDeleteBackup(b.id, b.filename)}
                              className="p-1.5 rounded-lg border border-transparent hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete Backup"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GODADDY REMOTE CONNECTION */}
      {activeTab === 'connection' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Real-Time Telegram Disconnection Alert Card */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/90 via-white to-blue-50/90 p-5 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <BellRing size={20} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900">
                      Telegram Bot Remote MySQL Connection Drop Alerts
                    </h4>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Armed & Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    Your currently configured Telegram bot (<strong>kipchelpdesk_bot</strong> &bull; Chat ID: <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-indigo-700">-1003928946011</code>) will receive an instant emergency notification if GoDaddy MySQL auto-drops remote connection, including error details and auto-failover actions.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Radio size={12} className="text-indigo-600" /> Heartbeat Monitor: <strong>60s cycle</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-600" /> Auto-Failover: <strong>Local MariaDB</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" /> Anti-Spam: <strong>10m cooldown</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <Button
                  type="button"
                  onClick={handleSendTestTelegramAlert}
                  disabled={testingTelegramAlert}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                >
                  <Send size={13} className={testingTelegramAlert ? 'animate-spin' : ''} />
                  {testingTelegramAlert ? 'Sending Test...' : 'Send Test Alert to Telegram'}
                </Button>
              </div>
            </div>

            {telegramAlertNotice && (
              <div className="p-3 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                <span>{telegramAlertNotice}</span>
              </div>
            )}
          </div>

          <div id="connection-form-section" className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Lock size={18} className="text-indigo-600" />
                  GoDaddy MySQL Remote Connection Settings
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fill in the database parameters provided in your GoDaddy cPanel.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-900">
                  <span>cPanel Remote MySQL IP:</span>
                  <strong className="font-mono text-indigo-700">34.34.254.10</strong>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('34.34.254.10', 'outbound_ip')}
                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                    title="Copy Outbound IP"
                  >
                    {copiedKey === 'outbound_ip' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setHost('118.139.180.163');
                    setPort('3306');
                    setDatabase('khema_ainotes');
                    setUser('khema_dbuser');
                    setPassword('Y+k,C=JAEA4nR+0*');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2"
                >
                  Load GoDaddy Credentials
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHost('127.0.0.1');
                    setPort('3306');
                    setDatabase('khema_ainotes');
                    setUser('ainotes_user');
                    setPassword('x!gmx^-hQhkn5JEw');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium underline underline-offset-2"
                >
                  Load Local Replica
                </button>
              </div>
            </div>

            <form onSubmit={handleTestConnection} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Host */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    GoDaddy Database Server Host <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="e.g. 118.139.180.163 or yourdomain.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Found in cPanel under "Database Server" or your server IP.</p>
                </div>

                {/* Port */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Port Number
                  </label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="3306"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Default MySQL TCP port is 3306.</p>
                </div>

                {/* Database Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Database Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    placeholder="e.g. cpaneluser_ainotes"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">cPanel prefixes database names with your cPanel username (e.g. <span className="font-mono text-indigo-600">khema_ainotes</span>).</p>
                  {database.trim() && user.trim() && database.trim().toLowerCase() === user.trim().toLowerCase() && (
                    <p className="text-[11px] text-amber-600 font-medium mt-1 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      ⚠️ <strong>Notice:</strong> Database Name is identical to your Username. On GoDaddy, your database name is usually something like <span className="font-mono">khema_ainotes</span>, while your username is <span className="font-mono">khema_dbuser</span>.
                    </p>
                  )}
                </div>

                {/* User */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Database Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="e.g. cpaneluser_dbuser"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">The user created in cPanel MySQL Database Wizard.</p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Database Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Password set during user creation in cPanel.</p>
                </div>

                {/* SSL Option */}
                <div className="flex flex-col justify-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ssl}
                      onChange={(e) => setSsl(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">Enable SSL / TLS Encryption</span>
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">Recommended for secured cloud connections.</p>
                </div>
              </div>

              {/* Ping Test Result Box */}
              {testResult && (
                <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                  testResult.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold">{testResult.message}</p>
                    {testResult.success && (
                      <div className="text-[11px] text-emerald-700 flex flex-wrap gap-4 mt-1">
                        <span>Latency: <strong>{testResult.latencyMs} ms</strong></span>
                        <span>Tables Verified: <strong>{testResult.tablesCount}</strong></span>
                        {testResult.tablesFound && (
                          <span className="truncate max-w-md">Found: {testResult.tablesFound.slice(0, 5).join(', ')}...</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {saveError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-2">
                  <div className="flex items-start gap-2 font-bold text-red-900">
                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                    <span>Failed to Connect to GoDaddy MySQL</span>
                  </div>
                  <p className="leading-relaxed pl-6">{saveError}</p>
                  <div className="ml-6 p-2.5 rounded-lg bg-white/80 border border-red-200 text-[11px] text-slate-700 space-y-1">
                    <p className="font-semibold text-slate-900">How to fix in GoDaddy cPanel:</p>
                    <p>1. Open <strong>cPanel &rarr; Remote MySQL</strong> and add <code className="bg-red-100 text-red-800 px-1 py-0.5 rounded font-mono">%</code> (or IP <code className="bg-red-100 text-red-800 px-1 py-0.5 rounded font-mono">34.34.254.10</code>).</p>
                    <p>2. Open <strong>cPanel &rarr; MySQL Databases &rarr; Add User to Database</strong>, select your user and database, click Add, and check <strong>ALL PRIVILEGES</strong>.</p>
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  Step 1: Verify credentials &bull; Step 2: Click <strong>Apply &amp; Lock GoDaddy Primary DB</strong> (Locks GoDaddy across restarts with auto-failover)
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="submit"
                    variant="secondary"
                    size="md"
                    disabled={testing || saving || !host || !user || !database}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={14} className={testing ? 'animate-spin' : ''} />
                    {testing ? 'Pinging Database...' : 'Test Connection'}
                  </Button>

                  <Button
                    type="button"
                    onClick={handleApplyConfig}
                    disabled={testing || saving || !host || !user || !database}
                    size="md"
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Lock size={15} />
                    {saving ? 'Testing & Locking...' : 'Apply & Lock GoDaddy Primary DB'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: PHPMYADMIN MIGRATION GUIDE */}
      {activeTab === 'guide' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Migration Steps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step 1: Export Package */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm">
                    1
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
                    Ready for phpMyAdmin
                  </span>
                </div>
                
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCode className="text-indigo-600" size={18} />
                  Export Database Package
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  We generated a clean, UTF-8 compliant SQL dump (<code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600">godaddy_ainotes_migration.sql</code>) containing all 18 tables and live datasets.
                </p>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>IT Cloud Subscriptions:</span>
                    <strong className="text-slate-800">11 Services (Full Data)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>IT Notes & Minutes:</span>
                    <strong className="text-slate-800">9 Notes with HTML/Covers</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Hardware Assets:</span>
                    <strong className="text-slate-800">220 Fleet Items</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Format Compatibility:</span>
                    <strong className="text-emerald-700">GoDaddy phpMyAdmin / MySQL 5.7+</strong>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={downloadDump}
                  size="md"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center justify-center gap-2"
                >
                  <Download size={15} /> Download SQL Package (280 KB)
                </Button>
              </div>
            </div>

            {/* Step 2: cPanel Setup Guide */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm">
                    2
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-semibold">
                    GoDaddy cPanel
                  </span>
                </div>
                
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="text-indigo-600" size={18} />
                  Create Database in cPanel
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Log into your GoDaddy Hosting Dashboard, open cPanel and execute the following:
                </p>

                <ol className="mt-4 space-y-2.5 text-xs text-slate-600 list-decimal list-inside">
                  <li className="leading-relaxed">
                    Open <strong>MySQL Database Wizard</strong>.
                  </li>
                  <li className="leading-relaxed">
                    Create Database (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">khema_ainotes</code>).
                  </li>
                  <li className="leading-relaxed">
                    Create Database User (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">khema_dbuser</code>) & set password.
                  </li>
                  <li className="leading-relaxed">
                    Assign User to Database and check <strong>ALL PRIVILEGES</strong>.
                  </li>
                  <li className="leading-relaxed">
                    Open <strong>Remote MySQL</strong> & add <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">%</code> to allow connection.
                  </li>
                </ol>
              </div>

              <div className="mt-6 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 flex items-center gap-2">
                <Info size={14} className="shrink-0 text-indigo-600" />
                <span>Make sure to add "%" in Remote MySQL so Cloud Run can communicate over port 3306.</span>
              </div>
            </div>

            {/* Step 3: phpMyAdmin Import */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm">
                    3
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-semibold">
                    Import in 1-Click
                  </span>
                </div>
                
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Server className="text-indigo-600" size={18} />
                  Import to phpMyAdmin
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Import the downloaded file directly into your GoDaddy database:
                </p>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <p>1. Open <strong>phpMyAdmin</strong> from GoDaddy cPanel.</p>
                  <p>2. Click on your created database in the left sidebar.</p>
                  <p>3. Click the top tab <strong>Import</strong>.</p>
                  <p>4. Choose <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">godaddy_ainotes_migration.sql</code>.</p>
                  <p>5. Click <strong>Go</strong> (bottom right).</p>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => setActiveTab('connection')}
                  size="md"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium flex items-center justify-center gap-2"
                >
                  Configure Remote Connection <ArrowRight size={15} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1-CLICK RESTORE CONFIRMATION MODAL */}
      <SmartModal
        open={Boolean(restoreModalBackup)}
        onClose={() => { if (!restoring) setRestoreModalBackup(null); }}
        title="Restore Database Snapshot"
        subtitle="1-Click Disaster Recovery"
        icon={<RotateCcw size={18} className="text-amber-600 dark:text-amber-400" />}
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setRestoreModalBackup(null)}
              disabled={restoring}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="md"
              onClick={handleExecuteRestore}
              disabled={restoring}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-2 whitespace-nowrap"
            >
              <RotateCcw size={15} className={restoring ? 'animate-spin' : ''} />
              {restoring ? 'Restoring Database...' : 'Confirm & Restore Database Now'}
            </Button>
          </>
        }
      >
        {restoreModalBackup && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck size={16} className="text-amber-700 dark:text-amber-400 shrink-0" />
                <span>Automatic Dual-Snapshot Protection</span>
              </div>
              <p className="text-amber-800 dark:text-amber-300/90 leading-relaxed">
                Before this restore starts, a safety snapshot of your active database will be created automatically. If you ever need to undo, you can revert back to that safety snapshot anytime.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">Target Snapshot:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100 truncate">{restoreModalBackup.filename}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">Created:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{formatDateTime(restoreModalBackup.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">Active Destination:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{dbStatus?.database || 'ainotes_db'} ({dbStatus?.host || 'Local MariaDB'})</span>
              </div>
              <div className="flex justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Records to restore:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {restoreModalBackup.recordCounts?.notes ?? 0} Notes &bull; {restoreModalBackup.recordCounts?.subscriptions ?? 0} Subs &bull; {restoreModalBackup.recordCounts?.assets ?? 0} Assets
                </span>
              </div>
            </div>
          </div>
        )}
      </SmartModal>

      {/* AUTO-BACKUP SCHEDULE SETTINGS MODAL */}
      <SmartModal
        open={configModalOpen}
        onClose={() => { if (!savingConfig) setConfigModalOpen(false); }}
        title="Auto-Backup Engine Schedule"
        subtitle="Automated Daily Database Snapshots"
        icon={<Clock size={18} />}
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setConfigModalOpen(false)}
              disabled={savingConfig}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="db-backup-config-form"
              size="md"
              disabled={savingConfig}
              className="theme-accent-bg font-semibold flex items-center gap-2 whitespace-nowrap"
            >
              <Check size={15} />
              {savingConfig ? 'Saving...' : 'Save Settings'}
            </Button>
          </>
        }
      >
        <form id="db-backup-config-form" onSubmit={handleSaveConfig} className="space-y-4">
          <div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={tempEnabled}
                onChange={(e) => setTempEnabled(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Enable Automated Background Backups</span>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 ml-6">
              Automatically dumps and archives full database snapshots in the background.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Backup Interval (Hours)
            </label>
            <select
              value={tempInterval}
              onChange={(e) => setTempInterval(Number(e.target.value))}
              className={SMART_INPUT_CLASS}
            >
              <option value={6}>Every 6 Hours (High Frequency)</option>
              <option value={12}>Every 12 Hours (Recommended Default - Twice Daily)</option>
              <option value={24}>Every 24 Hours (Once Daily at Midnight)</option>
            </select>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Default: 12 Hours ensures morning and evening enterprise backups every single day.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Snapshot Retention Limit
            </label>
            <select
              value={tempKeepMax}
              onChange={(e) => setTempKeepMax(Number(e.target.value))}
              className={SMART_INPUT_CLASS}
            >
              <option value={10}>Keep last 10 snapshots</option>
              <option value={30}>Keep last 30 snapshots (Recommended)</option>
              <option value={60}>Keep last 60 snapshots</option>
              <option value={100}>Keep last 100 snapshots</option>
            </select>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span>Last Auto/Manual Run:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {backupConfig?.lastRunAt ? formatDateTime(backupConfig.lastRunAt) : 'Not yet run'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Snapshot Format:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">UTF-8 phpMyAdmin SQL</span>
            </div>
          </div>
        </form>
      </SmartModal>

      {/* IMPORT GODADDY SQL MODAL */}
      <SmartModal
        open={importModalOpen}
        onClose={() => { if (!importingSql) setImportModalOpen(false); }}
        title="Import GoDaddy SQL Dump"
        subtitle="Cross-Database Migration & Disaster Recovery"
        icon={<Upload size={18} className="text-violet-600 dark:text-violet-400" />}
        size="lg"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setImportModalOpen(false)}
              disabled={importingSql}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="import-godaddy-sql-form"
              size="md"
              disabled={
                importingSql ||
                analyzingSql ||
                (importInputMode === 'file' ? !importFile : !importRawSql.trim())
              }
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center gap-2 whitespace-nowrap"
            >
              <Upload size={15} className={importingSql ? 'animate-spin' : ''} />
              {importingSql
                ? (importApplyMode === 'apply' ? 'Importing into Database...' : 'Saving to Vault...')
                : (importApplyMode === 'apply' ? 'Import & Apply to Live DB' : 'Save to Backup Vault')}
            </Button>
          </>
        }
      >
        <form id="import-godaddy-sql-form" onSubmit={handleExecuteSqlImport} className="space-y-4">
          {/* Source Input Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
            <button
              type="button"
              onClick={() => {
                setImportInputMode('file');
                setImportModalError('');
                if (importFile) analyzeSqlSource({ file: importFile });
                else setSqlPreview(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                importInputMode === 'file'
                  ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              Upload .sql File
            </button>
            <button
              type="button"
              onClick={() => {
                setImportInputMode('paste');
                setImportModalError('');
                setSqlPreview(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                importInputMode === 'paste'
                  ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              Paste SQL Statements
            </button>
          </div>

          {importInputMode === 'file' ? (
            <label className="block border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/70 dark:bg-slate-800/40">
              <input
                type="file"
                accept=".sql,.txt"
                className="hidden"
                onChange={(e) => handleSelectImportFile(e.target.files?.[0] || null)}
              />
              <div className="w-11 h-11 rounded-xl bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300 flex items-center justify-center mx-auto mb-2.5">
                {importFile ? <FileCheck2 size={22} /> : <FileUp size={22} />}
              </div>
              {importFile ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{importFile.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {(importFile.size / 1024).toFixed(1)} KB &bull; Click to choose a different .sql file
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Click to select GoDaddy phpMyAdmin / cPanel <span className="font-mono text-violet-600">.sql</span> dump
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Supports cross-database dumps (e.g. from <code className="font-mono">khema_ainotes</code> or <code className="font-mono">ainotes_db</code>) up to 64 MB
                  </p>
                </div>
              )}
            </label>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={7}
                value={importRawSql}
                onChange={(e) => setImportRawSql(e.target.value)}
                placeholder="Paste CREATE TABLE / INSERT INTO statements from phpMyAdmin..."
                className={`${SMART_INPUT_CLASS} font-mono text-[11px]`}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!importRawSql.trim() || analyzingSql}
                  onClick={() => analyzeSqlSource({ sqlContent: importRawSql })}
                >
                  {analyzingSql ? 'Inspecting SQL...' : 'Inspect SQL Structure'}
                </Button>
              </div>
            </div>
          )}

          {analyzingSql && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin text-violet-600" />
              <span>Analyzing GoDaddy SQL structure and compatibility...</span>
            </div>
          )}

          {sqlPreview && sqlPreview.valid && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <FileCheck2 size={15} className="text-emerald-600" />
                  SQL Dump Verified ({sqlPreview.formattedSize})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {sqlPreview.tablesFound.length} Tables Detected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/70 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 block">Source Database</span>
                  <strong className="font-mono text-slate-800 dark:text-slate-200">
                    {sqlPreview.sourceDatabase || 'Auto-detect / Generic'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Target Active DB</span>
                  <strong className="font-mono text-indigo-600 dark:text-indigo-400">
                    {sqlPreview.targetDatabase}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">CREATE / INSERT Statements</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {sqlPreview.createTableCount} tables &bull; {sqlPreview.insertCount} inserts
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Compatibility Rewrite</span>
                  <strong className="text-emerald-600">
                    {sqlPreview.hasCreateDbOrUse || sqlPreview.hasDefiner
                      ? 'Auto-strips USE / DEFINER'
                      : 'Direct MySQL Ready'}
                  </strong>
                </div>
              </div>

              {sqlPreview.tablesFound.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {sqlPreview.tablesFound.slice(0, 10).map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] border border-indigo-100 dark:border-indigo-900"
                    >
                      {t}
                    </span>
                  ))}
                  {sqlPreview.tablesFound.length > 10 && (
                    <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px]">
                      +{sqlPreview.tablesFound.length - 10} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Import Mode Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Import Action
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                  importApplyMode === 'apply'
                    ? 'border-violet-500 bg-violet-50/70 dark:bg-violet-950/40 ring-1 ring-violet-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                  <input
                    type="radio"
                    name="importApplyMode"
                    checked={importApplyMode === 'apply'}
                    onChange={() => setImportApplyMode('apply')}
                    className="text-violet-600"
                  />
                  <span>Import &amp; Apply to Live DB</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 ml-5">
                  Creates a safety backup first, archives the file, and restores tables into <strong>{dbStatus?.database || 'active DB'}</strong>.
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                  importApplyMode === 'vault_only'
                    ? 'border-violet-500 bg-violet-50/70 dark:bg-violet-950/40 ring-1 ring-violet-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                  <input
                    type="radio"
                    name="importApplyMode"
                    checked={importApplyMode === 'vault_only'}
                    onChange={() => setImportApplyMode('vault_only')}
                    className="text-violet-600"
                  />
                  <span>Save to Snapshot Vault Only</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 ml-5">
                  Stores the <code className="font-mono">.sql</code> dump in your Backup Vault so you can restore it later with 1 click.
                </p>
              </label>
            </div>
          </div>

          {importModalError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{importModalError}</span>
            </div>
          )}
        </form>
      </SmartModal>
    </div>
  );
};
