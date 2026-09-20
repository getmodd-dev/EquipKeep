import { useState, useRef, useEffect } from 'react';
import {
  X,
  Bell,
  HardDrive,
  Send,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Server,
  Terminal,
  Layers,
  Copy,
  Check,
  FileCode,
  Github,
  Folder,
  RefreshCw,
  Save,
  Loader2
} from 'lucide-react';
import { PushoverConfig } from '../types';

interface PushoverSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PushoverConfig;
  onSaveConfig: (updated: PushoverConfig) => Promise<void>;
  onTestPushover: (userKey: string, apiToken: string, sound: string) => Promise<void>;
  onExportBackup: () => void;
  onImportBackup: (jsonContent: any) => Promise<void>;
}

const PUSHOVER_SOUNDS = [
  { id: 'pushover', name: 'Pushover (Default)' },
  { id: 'bike', name: 'Bike Bell' },
  { id: 'bugle', name: 'Bugle' },
  { id: 'cosmic', name: 'Cosmic' },
  { id: 'echo', name: 'Echo' },
  { id: 'falling', name: 'Falling' },
  { id: 'gamelan', name: 'Gamelan' },
  { id: 'incoming', name: 'Incoming' },
  { id: 'mechanical', name: 'Mechanical' },
  { id: 'siren', name: 'Siren' },
  { id: 'spacealarm', name: 'Space Alarm' },
  { id: 'tugboat', name: 'Tugboat' },
  { id: 'none', name: 'Silent' },
];

export function PushoverSettingsModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTestPushover,
  onExportBackup,
  onImportBackup,
}: PushoverSettingsModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'pushover' | 'ghcr' | 'storage'>('pushover');

  const [userKey, setUserKey] = useState(config.userKey || '');
  const [apiToken, setApiToken] = useState(config.apiToken || '');
  const [device, setDevice] = useState(config.defaultDevice || '');
  const [priority, setPriority] = useState<number>(config.defaultPriority ?? 0);
  const [sound, setSound] = useState(config.defaultSound || 'pushover');
  const [notifyDays, setNotifyDays] = useState<number>(config.notifyOnWarrantyDays ?? 30);
  const [notifyMaintenance, setNotifyMaintenance] = useState(config.notifyOnMaintenanceDue ?? true);

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Local storage management state
  const [storagePath, setStoragePath] = useState(config.storageLocation || '/data/documents');
  const [migrateExistingFiles, setMigrateExistingFiles] = useState(true);
  const [storageStatus, setStorageStatus] = useState<{
    storageLocation: string;
    totalBytes: number;
    formattedSize: string;
    totalFiles: number;
    folderCount: number;
    folders: { folderName: string; fileCount: number; totalBytes: number; formattedSize: string }[];
  } | null>(null);
  const [isSavingStorage, setIsSavingStorage] = useState(false);
  const [isSyncingFolders, setIsSyncingFolders] = useState(false);
  const [storageMessage, setStorageMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStorageStatus = async () => {
    try {
      const res = await fetch('/api/storage/status');
      if (res.ok) {
        const data = await res.json();
        setStorageStatus(data);
        if (data.storageLocation) {
          setStoragePath(data.storageLocation);
        }
      }
    } catch (err) {
      console.error('Failed to load storage status:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'storage' && isOpen) {
      fetchStorageStatus();
    }
  }, [activeTab, isOpen]);

  const handleUpdateStorageConfig = async () => {
    if (!storagePath.trim()) return;
    setIsSavingStorage(true);
    setStorageMessage(null);
    try {
      const res = await fetch('/api/storage/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storageLocation: storagePath.trim(),
          migrateFiles: migrateExistingFiles,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update storage location');

      setStorageMessage({
        type: 'success',
        text: `Storage location updated! ${data.migratedFiles ? `(Migrated ${data.migratedFiles} files)` : ''}`,
      });
      fetchStorageStatus();
    } catch (err: any) {
      setStorageMessage({ type: 'error', text: err.message || 'Error updating storage path' });
    } finally {
      setIsSavingStorage(false);
    }
  };

  const handleSyncAllFolders = async () => {
    setIsSyncingFolders(true);
    setStorageMessage(null);
    try {
      const res = await fetch('/api/storage/sync-folders', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to synchronize folders');

      setStorageMessage({
        type: 'success',
        text: `Appliance folders synced on disk! Verified ${data.folderCount} folders.`,
      });
      fetchStorageStatus();
    } catch (err: any) {
      setStorageMessage({ type: 'error', text: err.message || 'Failed to sync folders' });
    } finally {
      setIsSyncingFolders(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveConfig({
        userKey: userKey.trim(),
        apiToken: apiToken.trim(),
        defaultDevice: device.trim() || undefined,
        defaultPriority: priority,
        defaultSound: sound,
        notifyOnWarrantyDays: Number(notifyDays) || 30,
        notifyOnMaintenanceDue: notifyMaintenance,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!userKey.trim() || !apiToken.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter both your Pushover User Key and Application API Token before testing.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      await onTestPushover(userKey.trim(), apiToken.trim(), sound);
      setTestResult({
        success: true,
        message: 'Notification sent successfully! Check your phone.',
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to dispatch test notification.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await onImportBackup(json);
        alert('Backup successfully imported! The portal database has been updated.');
        onClose();
      } catch (err) {
        alert('Invalid JSON backup file. Please select a valid EquipKeep backup file.');
      }
    };
    reader.readAsText(file);
  };

  const dockerRunSnippet = `docker run -d \\
  --name equipkeep \\
  --restart unless-stopped \\
  -p 3100:3000 \\
  -v /mnt/user/appdata/equipkeep:/app/data \\
  -e NODE_ENV=production \\
  ghcr.io/yourusername/equipkeep:latest`;

  const dockerComposeSnippet = `version: '3.8'
services:
  equipkeep:
    image: ghcr.io/yourusername/equipkeep:latest
    container_name: equipkeep
    restart: unless-stopped
    ports:
      - '3100:3000'
    volumes:
      - /mnt/user/appdata/equipkeep:/app/data
    environment:
      - NODE_ENV=production
      - PORT=3000`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                EquipKeep Settings & Unraid Homelab
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pushover notifications, GHCR Docker pipeline, and appdata backups.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-5 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('pushover')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'pushover'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Pushover Mobile Alerts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ghcr')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'ghcr'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GHCR & GitHub Actions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'storage'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Local Storage & Backups</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-zinc-800 dark:text-zinc-200">
          {/* TAB 1: PUSHOVER ALERTS */}
          {activeTab === 'pushover' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-orange-500" />
                    Pushover API Credentials
                  </h3>
                  <a
                    href="https://pushover.net"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Keys on Pushover.net</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-zinc-500 leading-relaxed text-[11px]">
                  Pushover delivers instant push notifications to your iPhone, Android, or desktop. Enter your 30-character
                  User Key and Application API Token.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                      Pushover User Key *
                    </label>
                    <input
                      type="text"
                      value={userKey}
                      onChange={(e) => setUserKey(e.target.value)}
                      placeholder="e.g. uQiRzpo4DXghDmr9QnoxfkeP..."
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-xs focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                      Application API Token / Key *
                    </label>
                    <input
                      type="text"
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                      placeholder="e.g. azGDORePK8gMaC0QOYAMyEE7..."
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-xs focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                        Notification Sound
                      </label>
                      <select
                        value={sound}
                        onChange={(e) => setSound(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                      >
                        {PUSHOVER_SOUNDS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                        Default Priority
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                      >
                        <option value={-2}>Lowest (No sound/vibrate)</option>
                        <option value={-1}>Low (Quiet)</option>
                        <option value={0}>Normal</option>
                        <option value={1}>High (Bypasses quiet hours)</option>
                        <option value={2}>Emergency (Requires ack)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                        Target Device (Optional)
                      </label>
                      <input
                        type="text"
                        value={device}
                        onChange={(e) => setDevice(e.target.value)}
                        placeholder="Leave empty for all"
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                      />
                    </div>
                  </div>

                  {/* Test Button & Result */}
                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={isTesting || !userKey || !apiToken}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Send className={`w-3.5 h-3.5 text-amber-400 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Sending to Phone...' : 'Send Test Notification to Phone'}</span>
                    </button>

                    {testResult && (
                      <div
                        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md ${
                          testResult.success
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {testResult.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span>{testResult.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Alert Trigger Rules */}
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Automated Alert Rules
                </h3>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyMaintenance}
                      onChange={(e) => setNotifyMaintenance(e.target.checked)}
                      className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-medium">Include overdue and upcoming maintenance tasks in scan alert</span>
                  </label>

                  <div className="flex items-center gap-2 pt-1">
                    <span>Alert for warranties expiring within:</span>
                    <input
                      type="number"
                      value={notifyDays}
                      onChange={(e) => setNotifyDays(parseInt(e.target.value) || 30)}
                      min={1}
                      max={365}
                      className="w-16 px-2 py-1 text-center rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold"
                    />
                    <span>days</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GHCR & GITHUB ACTIONS AUTOMATION */}
          {activeTab === 'ghcr' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300 space-y-1">
                  <p className="font-bold text-zinc-900 dark:text-white">
                    GitHub Actions GHCR Workflow is Configured
                  </p>
                  <p>
                    Every push to <code className="font-mono bg-orange-100 dark:bg-orange-900/60 px-1 py-0.5 rounded">main</code> or git tag creates multi-arch container images (<code className="font-mono">linux/amd64</code> and <code className="font-mono">linux/arm64</code>) and automatically publishes them to <strong className="text-orange-600 dark:text-orange-400 font-mono">ghcr.io</strong>.
                  </p>
                </div>
              </div>

              {/* Workflow details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-zinc-500" />
                    GitHub Actions Workflow File:
                  </span>
                  <code className="text-[11px] text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                    .github/workflows/docker-publish.yml
                  </code>
                </div>

                <div className="text-[11px] text-zinc-500 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Registry:</span>
                    <span className="font-mono">ghcr.io</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Image Name:</span>
                    <span className="font-mono">ghcr.io/&lt;owner&gt;/equipkeep:latest</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">Authentication:</span>
                    <span>Built-in GITHUB_TOKEN (Zero external secrets needed)</span>
                  </div>
                </div>
              </div>

              {/* Unraid Template Download & CLI */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-orange-500" />
                    Deploy to Unraid
                  </h4>
                  <a
                    href="/api/unraid-template/download"
                    download="my-EquipKeep.xml"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded bg-orange-600 hover:bg-orange-500 text-white transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Unraid XML Template</span>
                  </a>
                </div>

                {/* Docker run snippet */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 font-medium">Unraid Terminal / Docker Run Command:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(dockerRunSnippet, 'run')}
                      className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                    >
                      {copiedSection === 'run' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSection === 'run' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-zinc-950 text-zinc-200 font-mono text-[11px] overflow-x-auto border border-zinc-800">
                    {dockerRunSnippet}
                  </pre>
                </div>

                {/* Docker Compose snippet */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 font-medium">docker-compose.yml:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(dockerComposeSnippet, 'compose')}
                      className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                    >
                      {copiedSection === 'compose' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSection === 'compose' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-zinc-950 text-zinc-200 font-mono text-[11px] overflow-x-auto border border-zinc-800">
                    {dockerComposeSnippet}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOCAL STORAGE & BACKUPS */}
          {activeTab === 'storage' && (
            <div className="space-y-5">
              {/* Storage Message Banner */}
              {storageMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
                    storageMessage.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {storageMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    )}
                    <span>{storageMessage.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStorageMessage(null)}
                    className="p-1 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Local Storage Location Configuration */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
                      <Folder className="w-3.5 h-3.5 text-orange-500" />
                      Appliance Documents Storage Directory
                    </h4>
                    <p className="text-zinc-500 text-[11px]">
                      Specify where equipment folders, PDF manuals, and photos are saved on the host or Unraid filesystem.
                    </p>
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                    Host / Container Path
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={storagePath}
                      onChange={(e) => setStoragePath(e.target.value)}
                      placeholder="/data/documents or /mnt/user/documents/appliances"
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={handleUpdateStorageConfig}
                      disabled={isSavingStorage || !storagePath.trim()}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50 flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      {isSavingStorage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Location</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Preset Locations */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setStoragePath('/data/documents')}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                    >
                      /data/documents (Standard)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStoragePath('/mnt/user/documents/appliances')}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                    >
                      /mnt/user/documents/appliances (Unraid Share)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStoragePath('/mnt/user/appdata/equipkeep/documents')}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                    >
                      /mnt/user/appdata/equipkeep/documents
                    </button>
                  </div>

                  <label className="flex items-center gap-2 pt-1 text-[11px] text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={migrateExistingFiles}
                      onChange={(e) => setMigrateExistingFiles(e.target.checked)}
                      className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span>Automatically move existing appliance files and folders to new path</span>
                  </label>
                </div>
              </div>

              {/* Live Disk Usage & Appliance Folders Breakdown */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
                      <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                      Local Disk Usage & Folder Hierarchy
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Each appliance has a dedicated folder created automatically on the local filesystem.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncAllFolders}
                    disabled={isSyncingFolders}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors"
                    title="Verify that each equipment in database has an appliance folder on disk"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingFolders ? 'animate-spin' : ''}`} />
                    <span>{isSyncingFolders ? 'Syncing...' : 'Sync Folders'}</span>
                  </button>
                </div>

                {/* Storage Metrics Badges */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
                    <span className="block text-[10px] text-zinc-400 font-medium uppercase">Total Disk Used</span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {storageStatus?.formattedSize || '0 B'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
                    <span className="block text-[10px] text-zinc-400 font-medium uppercase">Stored Files</span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {storageStatus?.totalFiles ?? 0} files
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
                    <span className="block text-[10px] text-zinc-400 font-medium uppercase">Appliance Folders</span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {storageStatus?.folderCount ?? 0} folders
                    </span>
                  </div>
                </div>

                {/* Folder List */}
                {storageStatus?.folders && storageStatus.folders.length > 0 && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">Appliance Folders on Disk:</span>
                    {storageStatus.folders.map((f) => (
                      <div
                        key={f.folderName}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px]"
                      >
                        <div className="flex items-center gap-2 truncate font-mono text-zinc-800 dark:text-zinc-200">
                          <Folder className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span className="truncate">{f.folderName}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-zinc-500">
                          <span>{f.fileCount} {f.fileCount === 1 ? 'file' : 'files'}</span>
                          <span>•</span>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">{f.formattedSize}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* JSON Database Backup & Restore */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 space-y-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-zinc-500" />
                    Database JSON Backup & Disaster Recovery
                  </h4>
                  <p className="text-zinc-500 text-[11px]">
                    Export a timestamped JSON snapshot of all equipment and maintenance logs, or restore from a previously downloaded backup.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onExportBackup}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold flex items-center gap-1.5 transition-colors text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON Backup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold flex items-center gap-1.5 transition-colors border border-zinc-300 dark:border-zinc-700 text-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Restore JSON Backup</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
            >
              Close
            </button>
            {activeTab === 'pushover' && (
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white shadow transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
