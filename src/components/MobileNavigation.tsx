import { useState } from 'react';
import {
  Tv,
  Tractor,
  ClipboardList,
  FolderArchive,
  Calendar,
  Shield,
  History,
  QrCode,
  BellRing,
  Settings,
  Plus,
  X,
  ChevronRight,
  SlidersHorizontal,
  HardDrive
} from 'lucide-react';
import { AppTab } from './Header';

interface MobileNavigationProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenScanner: () => void;
  onOpenAddEquipment: () => void;
  onOpenSettings: () => void;
  onOpenQRModal: () => void;
  onTriggerPushoverScan: () => void;
  isScanningPushover: boolean;
  appliancesCount: number;
  largeEquipmentCount: number;
  projectsCount: number;
  homeDocumentsCount: number;
  overdueCount: number;
  expiringWarrantyCount: number;
}

export function MobileNavigation({
  activeTab,
  onTabChange,
  onOpenScanner,
  onOpenAddEquipment,
  onOpenSettings,
  onOpenQRModal,
  onTriggerPushoverScan,
  isScanningPushover,
  appliancesCount,
  largeEquipmentCount,
  projectsCount,
  homeDocumentsCount,
  overdueCount,
  expiringWarrantyCount,
}: MobileNavigationProps) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const handleSelectTab = (tab: AppTab) => {
    onTabChange(tab);
    setIsMoreMenuOpen(false);
  };

  const moreBadgeCount = overdueCount + expiringWarrantyCount;

  return (
    <>
      {/* Mobile Bottom Sheet Menu for "More" */}
      {isMoreMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end md:hidden animate-in fade-in duration-150"
          onClick={() => setIsMoreMenuOpen(false)}
        >
          <div
            className="bg-zinc-900 border-t border-zinc-800 rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto pb-safe space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Hub Navigation & Tools</h3>
                  <p className="text-[11px] text-zinc-400">All home sections and utility tools</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenAddEquipment();
                }}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Equipment</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenQRModal();
                }}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs border border-zinc-700"
              >
                <QrCode className="w-4 h-4 text-orange-400" />
                <span>50x30 Labels</span>
              </button>
            </div>

            {/* Navigation Options List */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 block pt-1">
                Sections & Utilities
              </span>

              {/* Maintenance Schedule */}
              <button
                type="button"
                onClick={() => handleSelectTab('maintenance')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-semibold transition-colors ${
                  activeTab === 'maintenance'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-zinc-200 hover:bg-zinc-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
                    <Calendar className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <span className="block">Maintenance Schedule</span>
                    <span className="text-[11px] text-zinc-400 font-normal">Recurring filters & service dates</span>
                  </div>
                </div>
                {overdueCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {overdueCount} overdue
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                )}
              </button>

              {/* Warranty Tracker */}
              <button
                type="button"
                onClick={() => handleSelectTab('warranties')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-semibold transition-colors ${
                  activeTab === 'warranties'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-zinc-200 hover:bg-zinc-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
                    <Shield className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="block">Warranty Tracker</span>
                    <span className="text-[11px] text-zinc-400 font-normal">Coverage terms & expiration</span>
                  </div>
                </div>
                {expiringWarrantyCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {expiringWarrantyCount} expiring
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                )}
              </button>

              {/* Home Documents & Receipts */}
              <button
                type="button"
                onClick={() => handleSelectTab('home_documents')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-semibold transition-colors ${
                  activeTab === 'home_documents'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-zinc-200 hover:bg-zinc-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
                    <FolderArchive className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <span className="block">Home Documents & Receipts</span>
                    <span className="text-[11px] text-zinc-400 font-normal">Stored manuals, contracts, files</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-zinc-400">
                  {homeDocumentsCount}
                </span>
              </button>

              {/* Service Logs */}
              <button
                type="button"
                onClick={() => handleSelectTab('service_logs')}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-semibold transition-colors ${
                  activeTab === 'service_logs'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-zinc-200 hover:bg-zinc-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
                    <History className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="block">Service History Logs</span>
                    <span className="text-[11px] text-zinc-400 font-normal">Past repairs & technician notes</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </button>
            </div>

            {/* System Actions */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onTriggerPushoverScan();
                }}
                disabled={isScanningPushover}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors disabled:opacity-50"
              >
                <BellRing className={`w-3.5 h-3.5 text-amber-400 ${isScanningPushover ? 'animate-spin' : ''}`} />
                <span>Push Alert to Phone</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenSettings();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/90 pb-safe md:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.4)]"
      >
        <div className="flex items-center justify-around px-2 py-1">
          {/* Tab 1: Appliances */}
          <button
            type="button"
            onClick={() => handleSelectTab('appliances_electronics')}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-colors relative min-w-[60px] ${
              activeTab === 'appliances_electronics'
                ? 'text-orange-500 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 font-medium'
            }`}
          >
            <div className="relative">
              <Tv className="w-5 h-5" />
              {appliancesCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-[9px] flex items-center justify-center font-bold px-0.5">
                  {appliancesCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Appliances</span>
          </button>

          {/* Tab 2: Large Equipment */}
          <button
            type="button"
            onClick={() => handleSelectTab('large_equipment')}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-colors relative min-w-[60px] ${
              activeTab === 'large_equipment'
                ? 'text-orange-500 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 font-medium'
            }`}
          >
            <div className="relative">
              <Tractor className="w-5 h-5" />
              {largeEquipmentCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-[9px] flex items-center justify-center font-bold px-0.5">
                  {largeEquipmentCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Equipment</span>
          </button>

          {/* Center Prominent Action: SCAN QR CODE */}
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex flex-col items-center justify-center -mt-4 relative group"
            title="Scan QR Code on appliance"
            aria-label="Scan appliance QR label"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-orange-400 text-white flex items-center justify-center shadow-lg shadow-orange-600/40 border-2 border-zinc-950 group-active:scale-95 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-orange-400 mt-1">Scan QR</span>
          </button>

          {/* Tab 3: Projects */}
          <button
            type="button"
            onClick={() => handleSelectTab('projects')}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-colors relative min-w-[60px] ${
              activeTab === 'projects'
                ? 'text-orange-500 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 font-medium'
            }`}
          >
            <div className="relative">
              <ClipboardList className="w-5 h-5" />
              {projectsCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] rounded-full bg-emerald-900 border border-emerald-700 text-emerald-300 text-[9px] flex items-center justify-center font-bold px-0.5">
                  {projectsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Projects</span>
          </button>

          {/* Tab 4: More / Tools */}
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-colors relative min-w-[60px] ${
              ['maintenance', 'warranties', 'home_documents', 'service_logs'].includes(activeTab) || isMoreMenuOpen
                ? 'text-orange-500 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 font-medium'
            }`}
          >
            <div className="relative">
              <SlidersHorizontal className="w-5 h-5" />
              {moreBadgeCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-bold px-0.5">
                  {moreBadgeCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
