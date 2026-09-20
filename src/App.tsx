import { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Search,
  Filter,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Home,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Server,
  QrCode,
  Tv,
  Tractor,
  ClipboardList,
} from 'lucide-react';
import { Header, AppTab } from './components/Header';
import { EquipmentCard } from './components/EquipmentCard';
import { EquipmentDetailModal } from './components/EquipmentDetailModal';
import { EquipmentFormModal } from './components/EquipmentFormModal';
import { ServiceRecordModal } from './components/ServiceRecordModal';
import { WarrantyTrackerView } from './components/WarrantyTrackerView';
import { MaintenanceScheduleView } from './components/MaintenanceScheduleView';
import { ServiceLogsView } from './components/ServiceLogsView';
import { PushoverSettingsModal } from './components/PushoverSettingsModal';
import { QRCodeModal } from './components/QRCodeModal';
import { ProjectPlanningView } from './components/ProjectPlanningView';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Equipment, ServiceRecord, PushoverConfig, MaintenanceTask, HomeProject, EquipmentSection } from './types';
import { CATEGORIES, getEquipmentSection, EQUIPMENT_SECTIONS } from './utils/categories';
import { getWarrantyStatus, getDaysDifference, getTodayDateString } from './utils/date';

export default function App() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [projects, setProjects] = useState<HomeProject[]>([]);
  const [settings, setSettings] = useState<PushoverConfig>({
    userKey: '',
    apiToken: '',
    defaultPriority: 0,
    defaultSound: 'pushover',
    notifyOnWarrantyDays: 30,
    notifyOnMaintenanceDue: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>('appliances_electronics');

  // Modals state
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isEquipmentFormOpen, setIsEquipmentFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [formDefaultSection, setFormDefaultSection] = useState<EquipmentSection>('appliances_electronics');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceTargetEquipment, setServiceTargetEquipment] = useState<Equipment | null>(null);
  const [serviceTargetTask, setServiceTargetTask] = useState<MaintenanceTask | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScanningPushover, setIsScanningPushover] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrTargetEquipment, setQrTargetEquipment] = useState<Equipment | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [roomFilter, setRoomFilter] = useState<string>('all');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [eqRes, srvRes, setRes, projRes] = await Promise.all([
        fetch('/api/equipment'),
        fetch('/api/service-records'),
        fetch('/api/settings'),
        fetch('/api/projects'),
      ]);

      if (eqRes.ok) {
        const eqData = await eqRes.json();
        setEquipmentList(eqData);
      }
      if (srvRes.ok) {
        const srvData = await srvRes.json();
        setServiceRecords(srvData);
      }
      if (setRes.ok) {
        const setData = await setRes.json();
        setSettings(setData);
      }
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      addToast('error', 'Connection Error', 'Could not sync with local Unraid server node.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Detect ?equipment=<id> in URL from scanned QR codes
  useEffect(() => {
    if (equipmentList.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('equipment') || params.get('id');
    if (targetId) {
      const found = equipmentList.find((e) => e.id === targetId);
      if (found) {
        setSelectedEquipment(found);
      }
    }
  }, [equipmentList]);

  // Keep URL search param in sync when selecting equipment
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (selectedEquipment) {
      url.searchParams.set('equipment', selectedEquipment.id);
    } else {
      url.searchParams.delete('equipment');
      url.searchParams.delete('id');
    }
    window.history.replaceState({}, '', url.toString());
  }, [selectedEquipment]);

  // Section items breakdown
  const appliancesList = useMemo(() => {
    return equipmentList.filter((eq) => {
      const sec = eq.section || getEquipmentSection(eq.category);
      return sec === 'appliances_electronics';
    });
  }, [equipmentList]);

  const largeEquipmentList = useMemo(() => {
    return equipmentList.filter((eq) => {
      const sec = eq.section || getEquipmentSection(eq.category);
      return sec === 'large_equipment';
    });
  }, [equipmentList]);

  const activeProjectsCount = useMemo(() => {
    return projects.filter((p) => p.status !== 'completed').length;
  }, [projects]);

  // Compute overdue count & expiring warranty count
  const overdueCount = useMemo(() => {
    let count = 0;
    equipmentList.forEach((eq) => {
      eq.maintenanceTasks?.forEach((task) => {
        const diff = getDaysDifference(task.nextDueDate);
        if (diff !== null && diff < 0) count++;
      });
    });
    return count;
  }, [equipmentList]);

  const expiringWarrantyCount = useMemo(() => {
    let count = 0;
    equipmentList.forEach((eq) => {
      const meta = getWarrantyStatus(eq.warranty);
      if (meta.status === 'expiring_soon') count++;
    });
    return count;
  }, [equipmentList]);

  // Current equipment dataset depending on active tab
  const currentTabEquipment = useMemo(() => {
    if (activeTab === 'appliances_electronics') return appliancesList;
    if (activeTab === 'large_equipment') return largeEquipmentList;
    return equipmentList;
  }, [activeTab, appliancesList, largeEquipmentList, equipmentList]);

  // Unique rooms list for the active tab's items
  const rooms = useMemo(() => {
    const set = new Set<string>();
    currentTabEquipment.forEach((eq) => {
      if (eq.locationRoom?.trim()) set.add(eq.locationRoom.trim());
    });
    return Array.from(set).sort();
  }, [currentTabEquipment]);

  // Filtered equipment list for active equipment section
  const filteredEquipment = useMemo(() => {
    return currentTabEquipment.filter((eq) => {
      if (categoryFilter !== 'all' && eq.category !== categoryFilter) return false;
      if (roomFilter !== 'all' && eq.locationRoom !== roomFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = eq.name.toLowerCase().includes(q);
        const matchBrand = eq.brand.toLowerCase().includes(q);
        const matchModel = eq.modelNumber.toLowerCase().includes(q);
        const matchSerial = eq.serialNumber.toLowerCase().includes(q);
        const matchRoom = eq.locationRoom.toLowerCase().includes(q);
        const matchFilter = eq.specifications?.filterSize?.toLowerCase().includes(q);
        return matchName || matchBrand || matchModel || matchSerial || matchRoom || matchFilter;
      }

      return true;
    });
  }, [currentTabEquipment, categoryFilter, roomFilter, searchQuery]);

  // Handle equipment CRUD
  const handleSaveEquipment = async (equipmentData: Partial<Equipment>) => {
    try {
      if (editingEquipment) {
        // Edit existing
        const res = await fetch(`/api/equipment/${editingEquipment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(equipmentData),
        });
        if (!res.ok) throw new Error('Failed to update equipment');
        const updated = await res.json();
        setEquipmentList((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        if (selectedEquipment?.id === updated.id) setSelectedEquipment(updated);
        addToast('success', 'Equipment Updated', `${updated.name} has been updated.`);
      } else {
        // Create new
        const res = await fetch('/api/equipment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(equipmentData),
        });
        if (!res.ok) throw new Error('Failed to create equipment');
        const created = await res.json();
        setEquipmentList((prev) => [created, ...prev]);
        addToast('success', 'Equipment Added', `${created.name} added to inventory.`);
      }
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    try {
      const res = await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete equipment');
      setEquipmentList((prev) => prev.filter((e) => e.id !== id));
      if (selectedEquipment?.id === id) setSelectedEquipment(null);
      addToast('info', 'Equipment Deleted', 'Item removed from database.');
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  // Handle service record creation
  const handleSaveServiceRecord = async (
    recordData: Partial<ServiceRecord> & { taskId?: string }
  ) => {
    try {
      const res = await fetch('/api/service-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData),
      });
      if (!res.ok) throw new Error('Failed to save service record');
      const created = await res.json();

      setServiceRecords((prev) => [created, ...prev]);

      // Refresh equipment list in case task schedule updated
      const eqRes = await fetch('/api/equipment');
      if (eqRes.ok) {
        const updatedList = await eqRes.json();
        setEquipmentList(updatedList);
        if (selectedEquipment) {
          const freshSelected = updatedList.find((e: Equipment) => e.id === selectedEquipment.id);
          if (freshSelected) setSelectedEquipment(freshSelected);
        }
      }

      addToast(
        'success',
        'Service Recorded',
        `Logged ${recordData.type} service for ${created.equipmentName}.`
      );
    } catch (err: any) {
      addToast('error', 'Failed to log service', err.message);
    }
  };

  const handleDeleteServiceRecord = async (id: string) => {
    try {
      const res = await fetch(`/api/service-records/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete record');
      setServiceRecords((prev) => prev.filter((r) => r.id !== id));
      addToast('info', 'Record Deleted', 'Service entry removed.');
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  // Handle Home Project CRUD & Scheduling
  const handleAddProject = async (projectData: Partial<HomeProject>) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      if (!res.ok) throw new Error('Failed to create project');
      const created = await res.json();
      setProjects((prev) => [created, ...prev]);
      addToast('success', 'Project Added', `"${created.title}" added to project planning.`);
    } catch (err: any) {
      addToast('error', 'Project Save Failed', err.message);
    }
  };

  const handleUpdateProject = async (id: string, projectData: Partial<HomeProject>) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      if (!res.ok) throw new Error('Failed to update project');
      const updated = await res.json();
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      addToast('success', 'Project Updated', `"${updated.title}" updated.`);
    } catch (err: any) {
      addToast('error', 'Project Update Failed', err.message);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      setProjects((prev) => prev.filter((p) => p.id !== id));
      addToast('info', 'Project Removed', 'Project removed from schedule.');
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  const handleCompleteProject = async (id: string, logServiceRecord: boolean, actualCost?: number) => {
    try {
      const res = await fetch(`/api/projects/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cost: actualCost, logAsService: logServiceRecord }),
      });
      if (!res.ok) throw new Error('Failed to complete project');
      const data = await res.json();
      setProjects((prev) => prev.map((p) => (p.id === id ? data.project : p)));
      if (data.serviceRecord) {
        setServiceRecords((prev) => [data.serviceRecord, ...prev]);
      }
      addToast(
        'success',
        'Project Completed',
        data.project.recurrence !== 'once'
          ? `Completed! Next run scheduled for ${data.project.scheduledDate}.`
          : 'Project marked as completed.'
      );
    } catch (err: any) {
      addToast('error', 'Error Completing Project', err.message);
    }
  };

  // Pushover alert scan
  const handleTriggerPushoverScan = async () => {
    setIsScanningPushover(true);
    try {
      const res = await fetch('/api/pushover/check-and-notify', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch alert');
      }

      if (data.notified) {
        addToast('success', 'Pushover Alert Sent', data.message);
      } else {
        addToast('info', 'All Clear', data.message);
      }
    } catch (err: any) {
      addToast('error', 'Pushover Error', err.message);
      setIsSettingsOpen(true);
    } finally {
      setIsScanningPushover(false);
    }
  };

  const handleSendCustomPushover = async (title: string, message: string, priority = 0) => {
    try {
      const res = await fetch('/api/pushover/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, priority }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send alert');
      addToast('success', 'Alert Dispatched', 'Notification sent to your mobile phone!');
    } catch (err: any) {
      addToast('error', 'Pushover Failed', err.message);
    }
  };

  const handleSaveSettings = async (updatedSettings: PushoverConfig) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSettings),
    });
    if (!res.ok) throw new Error('Failed to save settings');
    const saved = await res.json();
    setSettings(saved);
    addToast('success', 'Settings Saved', 'Pushover keys and alert preferences updated.');
  };

  const handleTestPushover = async (userKey: string, apiToken: string, sound: string) => {
    const res = await fetch('/api/pushover/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userKey, apiToken, sound }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send test push');
    addToast('success', 'Test Delivered', 'Pushover notification received successfully.');
  };

  const handleExportBackup = () => {
    window.location.href = '/api/backup/export';
  };

  const handleImportBackup = async (backupJson: any) => {
    const res = await fetch('/api/backup/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupJson),
    });
    if (!res.ok) throw new Error('Import failed');
    await fetchData();
    addToast('success', 'Backup Restored', 'Database successfully updated from backup file.');
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans antialiased selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setCategoryFilter('all');
        }}
        onAddEquipment={() => {
          setEditingEquipment(null);
          setFormDefaultSection(activeTab === 'large_equipment' ? 'large_equipment' : 'appliances_electronics');
          setIsEquipmentFormOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onTriggerPushoverScan={handleTriggerPushoverScan}
        isScanningPushover={isScanningPushover}
        overdueCount={overdueCount}
        expiringWarrantyCount={expiringWarrantyCount}
        appliancesCount={appliancesList.length}
        largeEquipmentCount={largeEquipmentList.length}
        projectsCount={activeProjectsCount}
        pushoverConfig={settings}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mb-3" />
            <p className="text-sm font-semibold">Connecting to EquipKeep Local Portal...</p>
          </div>
        ) : (
          <>
            {/* SECTION 1: APPLIANCES & ELECTRONICS */}
            {activeTab === 'appliances_electronics' && (
              <div className="space-y-6">
                {/* Section Header Card */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 rounded-2xl">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold shrink-0 shadow-xs">
                      <Tv className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                          Section 1: Appliances & Electronics
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                          {appliancesList.length} items
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Kitchen appliances, laundry machines, refrigerators, dishwashers, and smart home electronics.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingEquipment(null);
                      setFormDefaultSection('appliances_electronics');
                      setIsEquipmentFormOpen(true);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Appliance</span>
                  </button>
                </div>

                {/* Search, Filter & Quick Bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search appliance, brand, model #, filter size, room..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  {/* Filter Selects */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-medium"
                    >
                      <option value="all">All Appliance Categories</option>
                      {Object.entries(CATEGORIES)
                        .filter(([key]) =>
                          EQUIPMENT_SECTIONS.appliances_electronics.defaultCategories.includes(key as any)
                        )
                        .map(([key, val]) => (
                          <option key={key} value={key}>
                            {val.label}
                          </option>
                        ))}
                    </select>

                    <select
                      value={roomFilter}
                      onChange={(e) => setRoomFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-medium max-w-[180px]"
                    >
                      <option value="all">All Locations / Rooms</option>
                      {rooms.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        setQrTargetEquipment(null);
                        setIsQrModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300/80 dark:border-zinc-700 flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
                      title="Generate and print QR code labels"
                    >
                      <QrCode className="w-3.5 h-3.5 text-orange-500" />
                      <span>QR Labels</span>
                    </button>
                  </div>
                </div>

                {/* Equipment Cards Grid */}
                {filteredEquipment.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    <Tv className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
                    <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-200">
                      No appliances or electronics found
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                      Try clearing your search query or add a refrigerator, dishwasher, or washer to this section.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('all');
                        setRoomFilter('all');
                      }}
                      className="mt-4 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredEquipment.map((eq) => (
                      <EquipmentCard
                        key={eq.id}
                        equipment={eq}
                        onSelect={(item) => setSelectedEquipment(item)}
                        onOpenQRCode={(item) => {
                          setQrTargetEquipment(item);
                          setIsQrModalOpen(true);
                        }}
                        onLogService={(item) => {
                          setServiceTargetEquipment(item);
                          setServiceTargetTask(null);
                          setIsServiceModalOpen(true);
                        }}
                        onEdit={(item) => {
                          setEditingEquipment(item);
                          setFormDefaultSection('appliances_electronics');
                          setIsEquipmentFormOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: LARGE EQUIPMENT */}
            {activeTab === 'large_equipment' && (
              <div className="space-y-6">
                {/* Section Header Card */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 rounded-2xl">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold shrink-0 shadow-xs">
                      <Tractor className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                          Section 2: Large Equipment
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-500 border border-orange-500/30">
                          {largeEquipmentList.length} units
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        HVAC heat pumps, water heaters, standby generators, lawnmowers, pressure washers & power machinery.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingEquipment(null);
                      setFormDefaultSection('large_equipment');
                      setIsEquipmentFormOpen(true);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Large Equipment</span>
                  </button>
                </div>

                {/* Search, Filter & Quick Bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search HVAC, generator, lawnmower, brand, model #, room..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  {/* Filter Selects */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-medium"
                    >
                      <option value="all">All Large Equipment Categories</option>
                      {Object.entries(CATEGORIES)
                        .filter(([key]) =>
                          EQUIPMENT_SECTIONS.large_equipment.defaultCategories.includes(key as any)
                        )
                        .map(([key, val]) => (
                          <option key={key} value={key}>
                            {val.label}
                          </option>
                        ))}
                    </select>

                    <select
                      value={roomFilter}
                      onChange={(e) => setRoomFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-medium max-w-[180px]"
                    >
                      <option value="all">All Locations / Rooms</option>
                      {rooms.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        setQrTargetEquipment(null);
                        setIsQrModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300/80 dark:border-zinc-700 flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
                      title="Generate and print QR code labels"
                    >
                      <QrCode className="w-3.5 h-3.5 text-orange-500" />
                      <span>QR Labels</span>
                    </button>
                  </div>
                </div>

                {/* Large Equipment Cards Grid */}
                {filteredEquipment.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    <Tractor className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
                    <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-200">
                      No large equipment found
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                      Try clearing your search query or add a central heat pump, generator, or lawnmower.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('all');
                        setRoomFilter('all');
                      }}
                      className="mt-4 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredEquipment.map((eq) => (
                      <EquipmentCard
                        key={eq.id}
                        equipment={eq}
                        onSelect={(item) => setSelectedEquipment(item)}
                        onOpenQRCode={(item) => {
                          setQrTargetEquipment(item);
                          setIsQrModalOpen(true);
                        }}
                        onLogService={(item) => {
                          setServiceTargetEquipment(item);
                          setServiceTargetTask(null);
                          setIsServiceModalOpen(true);
                        }}
                        onEdit={(item) => {
                          setEditingEquipment(item);
                          setFormDefaultSection('large_equipment');
                          setIsEquipmentFormOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 3: PROJECT PLANNING & SCHEDULING */}
            {activeTab === 'projects' && (
              <ProjectPlanningView
                projects={projects}
                onAddProject={handleAddProject}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                onCompleteProject={handleCompleteProject}
              />
            )}

            {/* UTILITY VIEW: WARRANTY TRACKER */}
            {activeTab === 'warranties' && (
              <WarrantyTrackerView
                equipmentList={equipmentList}
                onSelectEquipment={(eq) => setSelectedEquipment(eq)}
                onSendPushoverAlert={handleSendCustomPushover}
              />
            )}

            {/* UTILITY VIEW: MAINTENANCE SCHEDULE */}
            {activeTab === 'maintenance' && (
              <MaintenanceScheduleView
                equipmentList={equipmentList}
                onSelectEquipment={(eq) => setSelectedEquipment(eq)}
                onLogServiceForTask={(eq, task) => {
                  setServiceTargetEquipment(eq);
                  setServiceTargetTask(task);
                  setIsServiceModalOpen(true);
                }}
                onSendPushoverAlert={handleSendCustomPushover}
              />
            )}

            {/* UTILITY VIEW: SERVICE HISTORY LOGS */}
            {activeTab === 'service_logs' && (
              <ServiceLogsView
                serviceRecords={serviceRecords}
                equipmentList={equipmentList}
                onAddRecord={() => {
                  setServiceTargetEquipment(null);
                  setServiceTargetTask(null);
                  setIsServiceModalOpen(true);
                }}
                onDeleteRecord={handleDeleteServiceRecord}
                onSelectEquipment={(eq) => setSelectedEquipment(eq)}
              />
            )}
          </>
        )}
      </main>

      {/* Equipment Detail Modal */}
      {selectedEquipment && (
        <EquipmentDetailModal
          equipment={selectedEquipment}
          serviceRecords={serviceRecords}
          onClose={() => setSelectedEquipment(null)}
          onEdit={(eq) => {
            setEditingEquipment(eq);
            setIsEquipmentFormOpen(true);
          }}
          onDelete={handleDeleteEquipment}
          onLogService={(eq, task) => {
            setServiceTargetEquipment(eq);
            setServiceTargetTask(task || null);
            setIsServiceModalOpen(true);
          }}
          onCompleteTask={async (eqId, taskId, data) => {
            try {
              const res = await fetch(`/api/equipment/${eqId}/tasks/${taskId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              });
              if (!res.ok) throw new Error('Failed to complete task');
              const resData = await res.json();
              setServiceRecords((prev) => [resData.serviceRecord, ...prev]);
              setEquipmentList((prev) => prev.map((e) => (e.id === eqId ? resData.equipment : e)));
              setSelectedEquipment(resData.equipment);
              addToast('success', 'Task Completed', `Maintenance recorded and next due date scheduled.`);
            } catch (err: any) {
              addToast('error', 'Error', err.message);
            }
          }}
          onUpdateEquipment={async (updated) => {
            try {
              const res = await fetch(`/api/equipment/${updated.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
              });
              if (!res.ok) throw new Error('Update failed');
              const saved = await res.json();
              setEquipmentList((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
              setSelectedEquipment(saved);
              addToast('success', 'Equipment Updated');
            } catch (err: any) {
              addToast('error', 'Error', err.message);
            }
          }}
          onSendPushoverAlert={handleSendCustomPushover}
          onOpenQRCode={(item) => {
            setQrTargetEquipment(item);
            setIsQrModalOpen(true);
          }}
        />
      )}

      {/* Add / Edit Equipment Modal */}
      <EquipmentFormModal
        isOpen={isEquipmentFormOpen}
        equipmentToEdit={editingEquipment}
        defaultSection={formDefaultSection}
        onClose={() => {
          setIsEquipmentFormOpen(false);
          setEditingEquipment(null);
        }}
        onSave={handleSaveEquipment}
      />

      {/* Service Record / Task Completion Modal */}
      <ServiceRecordModal
        isOpen={isServiceModalOpen}
        equipmentList={equipmentList}
        preSelectedEquipment={serviceTargetEquipment}
        preSelectedTask={serviceTargetTask}
        onClose={() => {
          setIsServiceModalOpen(false);
          setServiceTargetEquipment(null);
          setServiceTargetTask(null);
        }}
        onSave={handleSaveServiceRecord}
      />

      {/* Pushover & Server Settings Modal */}
      <PushoverSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={settings}
        onSaveConfig={handleSaveSettings}
        onTestPushover={handleTestPushover}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
      />

      {/* Scannable Equipment QR Codes & Printable Labels Modal */}
      <QRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          setQrTargetEquipment(null);
        }}
        equipment={qrTargetEquipment}
        allEquipment={equipmentList}
        onSelectEquipment={(eq) => {
          setSelectedEquipment(eq);
        }}
      />

      {/* Global Toast Alerts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
