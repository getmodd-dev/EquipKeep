import {
  Wrench,
  Shield,
  Calendar,
  History,
  Plus,
  Bell,
  Settings,
  HardDrive,
  BellRing,
  Tv,
  Tractor,
  ClipboardList,
} from 'lucide-react';
import { PushoverConfig } from '../types';

export type AppTab =
  | 'appliances_electronics'
  | 'large_equipment'
  | 'projects'
  | 'maintenance'
  | 'warranties'
  | 'service_logs';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onAddEquipment: () => void;
  onOpenSettings: () => void;
  onTriggerPushoverScan: () => void;
  isScanningPushover: boolean;
  overdueCount: number;
  expiringWarrantyCount: number;
  appliancesCount: number;
  largeEquipmentCount: number;
  projectsCount: number;
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
  appliancesCount,
  largeEquipmentCount,
  projectsCount,
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
          <span className="inline-flex items-center gap-1 font-mono text-orange-400 font-semibold bg-orange-950/50 px-1.5 py-0.5 rounded border border-orange-900/60">
            Port :3500 (Host)
          </span>
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
            <p className="text-xs text-zinc-400">Appliances, Equipment & Project Scheduling</p>
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
            title="Pushover API Settings, Storage & Unraid Setup"
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
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs - 3 Primary Sections + Utilities */}
      <div className="border-t border-zinc-800/80 bg-zinc-900/95 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1.5 overflow-x-auto pt-2 pb-2.5 scroll-smooth no-scrollbar overscroll-x-contain">
          {/* Section 1: Appliances & Electronics */}
        <button
          onClick={() => onTabChange('appliances_electronics')}
          className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'appliances_electronics'
              ? 'bg-orange-500/15 text-orange-400 font-bold border border-orange-500/30 shadow-xs'
              : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Tv className="w-3.5 h-3.5 text-amber-400" />
          <span>Appliances & Electronics</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            {appliancesCount}
          </span>
        </button>

        {/* Section 2: Large Equipment */}
        <button
          onClick={() => onTabChange('large_equipment')}
          className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'large_equipment'
              ? 'bg-orange-500/15 text-orange-400 font-bold border border-orange-500/30 shadow-xs'
              : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Tractor className="w-3.5 h-3.5 text-orange-400" />
          <span>Large Equipment</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            {largeEquipmentCount}
          </span>
        </button>

        {/* Section 3: Project Planning & Scheduling */}
        <button
          onClick={() => onTabChange('projects')}
          className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'projects'
              ? 'bg-orange-500/15 text-orange-400 font-bold border border-orange-500/30 shadow-xs'
              : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
          <span>Project Planning & Scheduling</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
            {projectsCount}
          </span>
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-1 shrink-0" />

        {/* Maintenance Schedule */}
        <button
          onClick={() => onTabChange('maintenance')}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 relative ${
            activeTab === 'maintenance'
              ? 'bg-zinc-800 text-orange-400 font-semibold shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Maintenance</span>
          {overdueCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {overdueCount} due
            </span>
          )}
        </button>

        {/* Warranty Tracker */}
        <button
          onClick={() => onTabChange('warranties')}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 relative ${
            activeTab === 'warranties'
              ? 'bg-zinc-800 text-orange-400 font-semibold shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Warranties</span>
          {expiringWarrantyCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {expiringWarrantyCount}
            </span>
          )}
        </button>

        {/* Service Logs */}
        <button
          onClick={() => onTabChange('service_logs')}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'service_logs'
              ? 'bg-zinc-800 text-orange-400 font-semibold shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Service Logs</span>
        </button>
      </div>
    </div>
  </header>
);
}

