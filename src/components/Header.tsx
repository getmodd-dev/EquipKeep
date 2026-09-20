import { Wrench, Shield, Calendar, History, Plus, Bell, Settings, HardDrive, BellRing } from 'lucide-react';
import { PushoverConfig } from '../types';

interface HeaderProps {
  activeTab: 'equipment' | 'warranties' | 'maintenance' | 'service_logs';
  onTabChange: (tab: 'equipment' | 'warranties' | 'maintenance' | 'service_logs') => void;
  onAddEquipment: () => void;
  onOpenSettings: () => void;
  onTriggerPushoverScan: () => void;
  isScanningPushover: boolean;
  overdueCount: number;
  expiringWarrantyCount: number;
  pushoverConfig?: PushoverConfig;
}

export function Header({
  activeTab,
  onTabChange,
  onAddEquipment,
  onOpenSettings,
  onTriggerPushoverScan,
  isScanningPushover,
  overdueCount,
  expiringWarrantyCount,
  pushoverConfig,
}: HeaderProps) {
  const isPushoverConfigured = Boolean(pushoverConfig?.userKey && pushoverConfig?.apiToken);

  return (
    <header className="sticky top-0 z-30 bg-zinc-900 border-b border-zinc-800 text-zinc-100 shadow-md">
      {/* Homelab / Unraid Top Status Bar */}
      <div className="bg-zinc-950/80 px-4 sm:px-6 py-1.5 border-b border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-zinc-300">Unraid Local Server</span>
          <span className="hidden sm:inline text-zinc-600">•</span>
          <span className="hidden sm:inline font-mono text-zinc-400">Web Portal :3000</span>
          <span className="hidden md:inline text-zinc-600">•</span>
          <span className="hidden md:inline text-zinc-400">All Devices on LAN</span>
        </div>

        <div className="flex items-center gap-3">
          {isPushoverConfigured ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Pushover Active
            </span>
          ) : (
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-[11px] font-medium bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40 hover:bg-amber-950 transition-colors"
            >
              <Bell className="w-3 h-3" />
              Configure Pushover Keys
            </button>
          )}

          <span className="hidden sm:flex items-center gap-1 text-zinc-400">
            <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
            <span className="font-mono">JSON Appdata</span>
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-950/30">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-tight">EquipKeep</h1>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                Homelab Hub
              </span>
            </div>
            <p className="text-xs text-zinc-400">Appliances, Manuals & Service Records</p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onTriggerPushoverScan}
            disabled={isScanningPushover}
            title="Scan for overdue tasks and expiring warranties, and push notification to phone"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            <BellRing className={`w-3.5 h-3.5 text-amber-400 ${isScanningPushover ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Push Alert to Phone</span>
            <span className="sm:hidden">Alert</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Pushover API Settings & Unraid Backup"
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onAddEquipment}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-900/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Equipment</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-zinc-800/80 pt-1 pb-1 scrollbar-none">
        <button
          onClick={() => onTabChange('equipment')}
          className={`px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'equipment'
              ? 'bg-zinc-800 text-orange-400 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Equipment & Manuals</span>
        </button>

        <button
          onClick={() => onTabChange('warranties')}
          className={`px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 relative ${
            activeTab === 'warranties'
              ? 'bg-zinc-800 text-orange-400 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Warranty Tracker</span>
          {expiringWarrantyCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {expiringWarrantyCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('maintenance')}
          className={`px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 relative ${
            activeTab === 'maintenance'
              ? 'bg-zinc-800 text-orange-400 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Maintenance Schedule</span>
          {overdueCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {overdueCount} overdue
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('service_logs')}
          className={`px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'service_logs'
              ? 'bg-zinc-800 text-orange-400 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Service History Logs</span>
        </button>
      </div>
    </header>
  );
}
