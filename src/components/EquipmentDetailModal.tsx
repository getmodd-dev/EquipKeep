import { useState, useEffect, useRef } from 'react';
import {
  X,
  Wrench,
  Shield,
  Calendar,
  FileText,
  Clock,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Phone,
  DollarSign,
  Tag,
  Copy,
  Check,
  Send,
  Folder,
  HardDrive,
  Upload,
  RefreshCw,
  Camera,
  Download,
  FileCheck,
  File,
  Loader2,
  Image as ImageIcon,
  QrCode,
  Printer,
  UserCheck,
  Building2,
  Tractor,
  Search,
  Bell,
  BellOff,
  Pencil,
  Globe,
  ShieldOff,
  Link as LinkIcon
} from 'lucide-react';
import { Equipment, MaintenanceTask, ServiceRecord, DocumentItem, WarrantyType } from '../types';
import { CATEGORIES } from '../utils/categories';
import { formatDate, formatCurrency, getWarrantyStatus, getDaysDifference } from '../utils/date';

interface EquipmentDetailModalProps {
  equipment: Equipment;
  serviceRecords: ServiceRecord[];
  onClose: () => void;
  onEdit: (equipment: Equipment) => void;
  onDelete: (id: string) => void;
  onLogService: (equipment: Equipment, task?: MaintenanceTask) => void;
  onCompleteTask: (equipmentId: string, taskId: string, completionData: { date: string; cost?: number; notes?: string }) => void;
  onUpdateEquipment: (updated: Equipment) => void;
  onSendPushoverAlert: (title: string, message: string, priority?: number) => void;
  onOpenQRCode?: (equipment: Equipment) => void;
}

export function EquipmentDetailModal({
  equipment,
  serviceRecords,
  onClose,
  onEdit,
  onDelete,
  onLogService,
  onCompleteTask,
  onUpdateEquipment,
  onSendPushoverAlert,
  onOpenQRCode,
}: EquipmentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'specs' | 'maintenance' | 'history' | 'documents' | 'warranty'>('specs');
  const [copiedSerial, setCopiedSerial] = useState(false);
  const [copiedFolderPath, setCopiedFolderPath] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // New task form state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskInterval, setNewTaskInterval] = useState(90);
  const [newTaskInstructions, setNewTaskInstructions] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [newTaskSpecs, setNewTaskSpecs] = useState('');

  // Document management state
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [docMode, setDocMode] = useState<'upload' | 'link'>('upload');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocNotes, setNewDocNotes] = useState('');
  const [docCategoryType, setDocCategoryType] = useState('PDF Manual');
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRescanningFolder, setIsRescanningFolder] = useState(false);
  const [storageFeedback, setStorageFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Local folder info on disk
  const [folderInfo, setFolderInfo] = useState<{
    folderName: string;
    folderPath: string;
    fileCount: number;
    totalBytes: number;
    formattedSize: string;
    files: any[];
  } | null>(null);

  const fileUploadInputRef = useRef<HTMLInputElement>(null);
  const photoUploadInputRef = useRef<HTMLInputElement>(null);

  // Helper for human-readable bytes
  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Fetch local folder details from server
  const fetchFolderInfo = async () => {
    try {
      const res = await fetch(`/api/equipment/${equipment.id}/folder-info`);
      if (res.ok) {
        const data = await res.json();
        setFolderInfo(data);
      }
    } catch (err) {
      console.error('Failed to fetch folder info:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchFolderInfo();
    }
  }, [activeTab, equipment.id]);

  // AI suggestion state
  const [isFetchingAi, setIsFetchingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[] | null>(null);

  const categoryMeta = CATEGORIES[equipment.category] || CATEGORIES.other;
  const warrantyMeta = getWarrantyStatus(equipment.warranty);
  const equipmentRecords = serviceRecords.filter((r) => r.equipmentId === equipment.id);
  const totalSpent = equipmentRecords.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);

  const handleCopySerial = () => {
    if (!equipment.serialNumber) return;
    navigator.clipboard.writeText(equipment.serialNumber);
    setCopiedSerial(true);
    setTimeout(() => setCopiedSerial(false), 2000);
  };

  const handleCopyFolderPath = () => {
    if (!folderInfo?.folderPath) return;
    navigator.clipboard.writeText(folderInfo.folderPath);
    setCopiedFolderPath(true);
    setTimeout(() => setCopiedFolderPath(false), 2000);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const today = new Date();
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + (Number(newTaskInterval) || 90));

    const task: MaintenanceTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      intervalDays: Number(newTaskInterval) || 90,
      nextDueDate: nextDate.toISOString().split('T')[0],
      instructions: newTaskInstructions.trim() || undefined,
      priority: newTaskPriority,
      filterOrPartSpecs: newTaskSpecs.trim() || undefined,
    };

    const updatedTasks = [...(equipment.maintenanceTasks || []), task];
    onUpdateEquipment({ ...equipment, maintenanceTasks: updatedTasks });

    // Reset form
    setNewTaskTitle('');
    setNewTaskInstructions('');
    setNewTaskSpecs('');
    setIsAddingTask(false);
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = (equipment.maintenanceTasks || []).filter((t) => t.id !== taskId);
    onUpdateEquipment({ ...equipment, maintenanceTasks: updatedTasks });
  };

  // Edit task state and handlers
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskInterval, setEditTaskInterval] = useState(90);
  const [editTaskNextDueDate, setEditTaskNextDueDate] = useState('');
  const [editTaskLastCompletedDate, setEditTaskLastCompletedDate] = useState('');
  const [editTaskInstructions, setEditTaskInstructions] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [editTaskSpecs, setEditTaskSpecs] = useState('');

  const handleStartEditTask = (task: MaintenanceTask) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskInterval(task.intervalDays || 90);
    setEditTaskNextDueDate(task.nextDueDate || '');
    setEditTaskLastCompletedDate(task.lastCompletedDate || '');
    setEditTaskInstructions(task.instructions || '');
    setEditTaskPriority(task.priority || 'normal');
    setEditTaskSpecs(task.filterOrPartSpecs || '');
  };

  const handleSaveEditTask = () => {
    if (!editingTaskId || !editTaskTitle.trim()) return;
    const updatedTasks = (equipment.maintenanceTasks || []).map((t) => {
      if (t.id !== editingTaskId) return t;
      return {
        ...t,
        title: editTaskTitle.trim(),
        intervalDays: Number(editTaskInterval) || 30,
        nextDueDate: editTaskNextDueDate || t.nextDueDate,
        lastCompletedDate: editTaskLastCompletedDate.trim() || undefined,
        instructions: editTaskInstructions.trim() || undefined,
        priority: editTaskPriority,
        filterOrPartSpecs: editTaskSpecs.trim() || undefined,
      };
    });
    onUpdateEquipment({ ...equipment, maintenanceTasks: updatedTasks });
    setEditingTaskId(null);
  };

  const handleCancelEditTask = () => {
    setEditingTaskId(null);
  };

  // Warranty editing and removing state
  const [isEditingWarranty, setIsEditingWarranty] = useState(false);
  const [editWarrantyType, setEditWarrantyType] = useState<WarrantyType>(equipment.warranty?.type || 'manufacturer');
  const [editWarrantyExpiration, setEditWarrantyExpiration] = useState(equipment.warranty?.expirationDate || '');
  const [editWarrantyProvider, setEditWarrantyProvider] = useState(equipment.warranty?.provider || '');
  const [editWarrantyPolicy, setEditWarrantyPolicy] = useState(equipment.warranty?.policyNumber || '');
  const [editWarrantyContact, setEditWarrantyContact] = useState(equipment.warranty?.contactPhoneOrUrl || '');
  const [editWarrantyNotes, setEditWarrantyNotes] = useState(equipment.warranty?.notes || '');
  const [editHasLifetimeWarranty, setEditHasLifetimeWarranty] = useState(
    equipment.warranty?.hasLifetimeWarranty || equipment.warranty?.type === 'lifetime' || false
  );

  const handleStartEditWarranty = () => {
    setEditWarrantyType(equipment.warranty?.type || 'manufacturer');
    setEditWarrantyExpiration(equipment.warranty?.expirationDate || '');
    setEditWarrantyProvider(equipment.warranty?.provider || '');
    setEditWarrantyPolicy(equipment.warranty?.policyNumber || '');
    setEditWarrantyContact(equipment.warranty?.contactPhoneOrUrl || '');
    setEditWarrantyNotes(equipment.warranty?.notes || '');
    setEditHasLifetimeWarranty(
      equipment.warranty?.hasLifetimeWarranty || equipment.warranty?.type === 'lifetime' || false
    );
    setIsEditingWarranty(true);
  };

  const handleSaveWarranty = () => {
    const updatedWarranty = {
      type: editHasLifetimeWarranty ? ('lifetime' as const) : editWarrantyType,
      expirationDate: editHasLifetimeWarranty || editWarrantyType === 'none' ? '' : editWarrantyExpiration,
      provider: editWarrantyType === 'none' ? undefined : (editWarrantyProvider.trim() || undefined),
      policyNumber: editWarrantyType === 'none' ? undefined : (editWarrantyPolicy.trim() || undefined),
      contactPhoneOrUrl: editWarrantyType === 'none' ? undefined : (editWarrantyContact.trim() || undefined),
      notes: editWarrantyType === 'none' ? undefined : (editWarrantyNotes.trim() || undefined),
      hasLifetimeWarranty: editWarrantyType === 'none' ? false : editHasLifetimeWarranty,
      disableAlerts: equipment.warranty?.disableAlerts ?? equipment.disableAlerts ?? false,
    };
    onUpdateEquipment({ ...equipment, warranty: updatedWarranty });
    setIsEditingWarranty(false);
  };

  const handleRemoveWarranty = () => {
    if (confirm(`Are you sure you want to remove all warranty information for ${equipment.name}?`)) {
      const updatedWarranty = {
        type: 'none' as const,
        expirationDate: '',
        provider: undefined,
        policyNumber: undefined,
        contactPhoneOrUrl: undefined,
        notes: undefined,
        hasLifetimeWarranty: false,
        disableAlerts: equipment.warranty?.disableAlerts ?? equipment.disableAlerts ?? false,
      };
      onUpdateEquipment({ ...equipment, warranty: updatedWarranty });
      setIsEditingWarranty(false);
    }
  };

  // Alerts toggles for this item
  const isAlertsMuted = Boolean(equipment.disableAlerts || equipment.warranty?.disableAlerts);

  const handleToggleAlerts = () => {
    const currentlyMuted = isAlertsMuted;
    const newDisableState = !currentlyMuted;
    const updated = {
      ...equipment,
      disableAlerts: newDisableState,
      warranty: {
        ...equipment.warranty,
        disableAlerts: newDisableState,
      },
    };
    onUpdateEquipment(updated);
  };

  const handleToggleWarrantyAlertsOnly = () => {
    const newDisableState = !equipment.warranty?.disableAlerts;
    const updated = {
      ...equipment,
      warranty: {
        ...equipment.warranty,
        disableAlerts: newDisableState,
      },
    };
    onUpdateEquipment(updated);
  };

  // Find Manual Online modal state
  const [isFindManualOpen, setIsFindManualOpen] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState(
    `${equipment.brand} ${equipment.modelNumber || equipment.name} manual pdf`
  );
  const [manualLinkTitle, setManualLinkTitle] = useState(
    `${equipment.brand} ${equipment.modelNumber || equipment.name} Owner's Manual`
  );
  const [manualLinkUrl, setManualLinkUrl] = useState('');
  const [copiedManualSearch, setCopiedManualSearch] = useState(false);

  useEffect(() => {
    setManualSearchQuery(`${equipment.brand} ${equipment.modelNumber || equipment.name} manual pdf`);
    setManualLinkTitle(`${equipment.brand} ${equipment.modelNumber || equipment.name} Owner's Manual`);
  }, [equipment.brand, equipment.modelNumber, equipment.name]);

  const handleCopyManualQuery = () => {
    navigator.clipboard.writeText(manualSearchQuery);
    setCopiedManualSearch(true);
    setTimeout(() => setCopiedManualSearch(false), 2000);
  };

  const handleSaveManualLink = () => {
    if (!manualLinkUrl.trim()) return;
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: manualLinkTitle.trim() || `${equipment.brand} ${equipment.modelNumber || equipment.name} Owner's Manual`,
      fileType: 'PDF Manual',
      url: manualLinkUrl.trim(),
      notes: 'Found online via Manual Search',
      dateAdded: new Date().toISOString(),
      isLocal: false,
    };
    const updatedDocs = [...(equipment.documents || []), newDoc];
    onUpdateEquipment({ ...equipment, documents: updatedDocs });
    setManualLinkUrl('');
    setIsFindManualOpen(false);
    setStorageFeedback({
      text: 'Saved online manual link to appliance documents successfully!',
      type: 'success',
    });
  };

  // Upload document directly to appliance's folder on disk
  const handleUploadLocalDocument = async () => {
    if (!selectedUploadFile) {
      setStorageFeedback({ text: 'Please select a file to upload.', type: 'error' });
      return;
    }

    setIsUploadingDoc(true);
    setStorageFeedback(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedUploadFile);
      if (newDocTitle.trim()) formData.append('title', newDocTitle.trim());
      formData.append('fileType', docCategoryType);
      if (newDocNotes.trim()) formData.append('notes', newDocNotes.trim());

      const res = await fetch(`/api/equipment/${equipment.id}/upload-document`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to upload document');
      }

      onUpdateEquipment(result.equipment);
      setStorageFeedback({
        text: `Successfully saved ${result.document.fileName} to local appliance folder!`,
        type: 'success',
      });

      // Reset form
      setSelectedUploadFile(null);
      setNewDocTitle('');
      setNewDocNotes('');
      setIsAddingDoc(false);
      fetchFolderInfo();
    } catch (err: any) {
      setStorageFeedback({ text: err.message || 'Error uploading file', type: 'error' });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Upload equipment photo to its local folder
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setStorageFeedback(null);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`/api/equipment/${equipment.id}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to upload photo');
      }

      onUpdateEquipment(result.equipment);
      setStorageFeedback({ text: 'Equipment photo saved to appliance folder!', type: 'success' });
      fetchFolderInfo();
    } catch (err: any) {
      setStorageFeedback({ text: err.message || 'Error uploading photo', type: 'error' });
    } finally {
      setIsUploadingPhoto(false);
      if (photoUploadInputRef.current) photoUploadInputRef.current.value = '';
    }
  };

  // Scan appliance folder on disk for files added externally via Unraid/SMB share
  const handleRescanFolder = async () => {
    setIsRescanningFolder(true);
    setStorageFeedback(null);
    try {
      const res = await fetch(`/api/equipment/${equipment.id}/rescan-files`, {
        method: 'POST',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Rescan failed');

      onUpdateEquipment(result.equipment);
      setStorageFeedback({ text: result.message, type: 'success' });
      fetchFolderInfo();
    } catch (err: any) {
      setStorageFeedback({ text: err.message || 'Rescan failed', type: 'error' });
    } finally {
      setIsRescanningFolder(false);
    }
  };

  const handleAddWebLinkDoc = () => {
    if (!newDocTitle.trim()) return;
    const doc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: newDocTitle.trim(),
      url: newDocUrl.trim() || undefined,
      fileType: docCategoryType || 'Web / PDF Manual',
      notes: newDocNotes.trim() || undefined,
      dateAdded: new Date().toISOString().split('T')[0],
      isLocal: false,
    };

    const updatedDocs = [...(equipment.documents || []), doc];
    onUpdateEquipment({ ...equipment, documents: updatedDocs });

    setNewDocTitle('');
    setNewDocUrl('');
    setNewDocNotes('');
    setIsAddingDoc(false);
  };

  const handleDeleteDoc = async (doc: DocumentItem) => {
    if (doc.isLocal && doc.fileName) {
      if (!confirm(`Delete ${doc.fileName} from local storage folder permanently?`)) return;
      try {
        const res = await fetch(`/api/storage/files/${equipment.id}/${encodeURIComponent(doc.fileName)}`, {
          method: 'DELETE',
        });
        const result = await res.json();
        if (res.ok) {
          onUpdateEquipment(result.equipment);
          fetchFolderInfo();
          setStorageFeedback({ text: `Deleted ${doc.fileName} from local disk.`, type: 'success' });
          return;
        }
      } catch (err) {
        console.error('Failed to delete file from disk:', err);
      }
    }

    // Fallback or external link deletion
    const updatedDocs = (equipment.documents || []).filter((d) => d.id !== doc.id);
    onUpdateEquipment({ ...equipment, documents: updatedDocs });
  };

  const handleFetchAiSuggestions = async () => {
    setIsFetchingAi(true);
    try {
      const res = await fetch('/api/ai/suggest-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: equipment.brand,
          modelNumber: equipment.modelNumber,
          name: equipment.name,
          category: equipment.category,
        }),
      });
      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setAiSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setIsFetchingAi(false);
    }
  };

  const handleApplyAiSuggestion = (sugg: any) => {
    const today = new Date();
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + (Number(sugg.intervalDays) || 90));

    const task: MaintenanceTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: sugg.title,
      intervalDays: Number(sugg.intervalDays) || 90,
      nextDueDate: nextDate.toISOString().split('T')[0],
      instructions: sugg.instructions || '',
      priority: sugg.priority || 'normal',
      filterOrPartSpecs: sugg.filterOrPartSpecs || '',
    };

    const updatedTasks = [...(equipment.maintenanceTasks || []), task];
    onUpdateEquipment({ ...equipment, maintenanceTasks: updatedTasks });
    setAiSuggestions((prev) => prev?.filter((s) => s.title !== sugg.title) || null);
  };

  const handleSendWarrantyAlert = () => {
    const title = `Warranty Alert: ${equipment.name}`;
    const msg = `Warranty status: ${warrantyMeta.label}. Model: ${equipment.modelNumber || 'N/A'}. Provider: ${equipment.warranty?.provider || 'Manufacturer'}. Expiration date: ${equipment.warranty?.expirationDate || 'N/A'}.`;
    onSendPushoverAlert(title, msg, 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4 bg-zinc-50 dark:bg-zinc-950/60">
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            {/* Appliance Photo / Avatar with Local Upload */}
            <div className="relative group shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                {equipment.imageUrl ? (
                  <img
                    src={equipment.imageUrl}
                    alt={equipment.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-7 h-7 text-zinc-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => photoUploadInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute inset-0 bg-black/50 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs text-[10px] font-semibold flex-col gap-0.5"
                title="Upload equipment photo to local storage"
              >
                {isUploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Change</span>
                  </>
                )}
              </button>
              <input
                ref={photoUploadInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${categoryMeta.bg} ${categoryMeta.text} ${categoryMeta.border}`}
                >
                  {categoryMeta.label}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${warrantyMeta.badgeClass}`}>
                  {warrantyMeta.label}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  {equipment.locationRoom || 'No Room'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                {equipment.name}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                <span className="font-semibold">{equipment.brand}</span> • Model:{' '}
                <span className="font-mono">{equipment.modelNumber || 'N/A'}</span> • Serial:{' '}
                <span className="font-mono">{equipment.serialNumber || 'N/A'}</span>
                {equipment.serialNumber && (
                  <button
                    onClick={handleCopySerial}
                    className="ml-1.5 inline-flex items-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    title="Copy serial number"
                  >
                    {copiedSerial ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
                {(equipment.contractor?.phone || equipment.contractorPhone) && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium">
                    • <UserCheck className="w-3 h-3 text-orange-500" /> Tech:
                    <a
                      href={`tel:${equipment.contractor?.phone || equipment.contractorPhone}`}
                      className="hover:underline font-semibold inline-flex items-center gap-0.5"
                      title="Call primary contractor / technician"
                    >
                      <span>{equipment.contractor?.name || equipment.contractorName || 'Assigned'}</span>
                      <Phone className="w-2.5 h-2.5" />
                    </a>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Find Manual Online quick action */}
            <button
              type="button"
              onClick={() => setIsFindManualOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Search and find appliance manuals online"
            >
              <Search className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span className="hidden sm:inline">Find Manual</span>
            </button>

            {/* Mute/Enable Alerts Quick Toggle */}
            <button
              type="button"
              onClick={handleToggleAlerts}
              className={`px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                isAlertsMuted
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:text-orange-600'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              }`}
              title={isAlertsMuted ? 'Alerts are muted for this item. Click to enable.' : 'Alerts are active for this item. Click to mute.'}
            >
              {isAlertsMuted ? (
                <BellOff className="w-3.5 h-3.5 text-zinc-400" />
              ) : (
                <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="hidden md:inline">{isAlertsMuted ? 'Alerts Muted' : 'Alerts On'}</span>
            </button>

            {onOpenQRCode && (
              <button
                type="button"
                onClick={() => onOpenQRCode(equipment)}
                className="px-2.5 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Create scannable QR code & printable label"
              >
                <QrCode className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="hidden sm:inline">QR Code Label</span>
              </button>
            )}

            <button
              onClick={() => onEdit(equipment)}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
              title="Edit Equipment"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${equipment.name}?`)) {
                  onDelete(equipment.id);
                  onClose();
                }
              }}
              className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors"
              title="Delete Equipment"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-5 bg-white dark:bg-zinc-900 overflow-x-auto no-scrollbar scroll-smooth gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'specs'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Overview & Specs</span>
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 relative ${
              activeTab === 'maintenance'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Maintenance Schedule ({equipment.maintenanceTasks?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Service History ({equipmentRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Manuals & Docs ({equipment.documents?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('warranty')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'warranty'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Warranty Details</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-zinc-800 dark:text-zinc-200 space-y-6">
          {/* TAB 1: OVERVIEW & SPECS */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              {/* Primary Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Purchase Details</span>
                  <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {formatDate(equipment.purchaseDate)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {equipment.purchasePrice ? formatCurrency(equipment.purchasePrice) : 'Price unrecorded'} • {equipment.vendorStore || 'Unknown Store'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Service Spend</span>
                  <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {formatCurrency(totalSpent)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">Across {equipmentRecords.length} recorded service event(s)</p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Current Status</span>
                  <p className="text-base font-bold capitalize text-zinc-900 dark:text-zinc-100 mt-1">
                    {equipment.status.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{equipment.locationRoom || 'Main premises'}</p>
                </div>
              </div>

              {/* Printable QR Code Label Banner */}
              {onOpenQRCode && (
                <div className="p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/60 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                        Equipment QR Code Sticker &amp; Maintenance Tag
                      </h4>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                        Print a physical label or sticker to attach to this unit. Scanning with any smartphone camera opens its manuals and service log.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenQRCode(equipment)}
                    className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Unit QR Label</span>
                  </button>
                </div>
              )}

              {/* Dedicated Contractor / Maintenance Technician Card */}
              <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-orange-500" />
                    Contractor &amp; Maintenance Technician
                  </h4>
                  {equipment.section === 'large_equipment' && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 flex items-center gap-1">
                      <Tractor className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      Primary Service Contact for Large Equipment
                    </span>
                  )}
                </div>

                {(equipment.contractor?.name || equipment.contractorName || equipment.contractor?.phone || equipment.contractorPhone || equipment.contractor?.company) ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      {/* Technician Name */}
                      <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-500 dark:text-zinc-400 block mb-1">Assigned Technician / Specialist</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-orange-500 shrink-0" />
                          {equipment.contractor?.name || equipment.contractorName || 'Technician on file'}
                        </span>
                      </div>

                      {/* Direct Phone Number with Call & Copy */}
                      <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-500 dark:text-zinc-400 block mb-1">Contact Phone Number</span>
                        {(equipment.contractor?.phone || equipment.contractorPhone) ? (
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <a
                              href={`tel:${equipment.contractor?.phone || equipment.contractorPhone}`}
                              className="font-mono font-bold text-sm text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1.5 truncate"
                              title="Click to call technician directly"
                            >
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{equipment.contractor?.phone || equipment.contractorPhone}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                const phone = equipment.contractor?.phone || equipment.contractorPhone || '';
                                navigator.clipboard.writeText(phone);
                                setCopiedPhone(true);
                                setTimeout(() => setCopiedPhone(false), 2000);
                              }}
                              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors shrink-0"
                              title="Copy phone number"
                            >
                              {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-500 italic">No phone recorded</span>
                        )}
                      </div>

                      {/* Company / Service Facility */}
                      <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 sm:col-span-2 md:col-span-1">
                        <span className="text-zinc-500 dark:text-zinc-400 block mb-1">Company / Facility</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-1.5 truncate">
                          <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span className="truncate">
                            {equipment.contractor?.company || equipment.vendorStore || 'Independent Specialist'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Dispatch Notes / Account details if present */}
                    {equipment.contractor?.notes && (
                      <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400 block font-medium mb-1">
                          Service Notes &amp; Dispatch Instructions
                        </span>
                        <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                          {equipment.contractor.notes}
                        </p>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Primary contact for routine preventative maintenance and emergency repairs.
                      </div>
                      <div className="flex items-center gap-2">
                        {(equipment.contractor?.phone || equipment.contractorPhone) && (
                          <a
                            href={`tel:${equipment.contractor?.phone || equipment.contractorPhone}`}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call Technician</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onEdit(equipment)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Update Tech Info</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
                    <div>
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        No contractor or maintenance technician assigned
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Add your primary technician's name, phone number, and service company for quick 1-click calls and service logging.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEdit(equipment)}
                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Add Contractor Info</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Consumable & Filter Specifications */}
              {equipment.specifications && (
                <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-orange-500" />
                    Consumables, Filters & Physical Specs
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {equipment.specifications.filterSize && (
                      <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-500 dark:text-zinc-400 block mb-1">Filter / Consumable Spec</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                          {equipment.specifications.filterSize}
                        </span>
                      </div>
                    )}

                    {equipment.specifications.powerRequirements && (
                      <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-500 dark:text-zinc-400 block mb-1">Power / Electrical Spec</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                          {equipment.specifications.powerRequirements}
                        </span>
                      </div>
                    )}

                    {equipment.specifications.fuelOrRefrigerant && (
                      <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-500 dark:text-zinc-400 block mb-1">Fuel / Refrigerant / Fluids</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                          {equipment.specifications.fuelOrRefrigerant}
                        </span>
                      </div>
                    )}

                    {equipment.specifications.customSpecs &&
                      Object.entries(equipment.specifications.customSpecs).map(([key, val]) => (
                        <div key={key} className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                          <span className="text-zinc-500 dark:text-zinc-400 block mb-1">{key}</span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{val}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {equipment.notes && (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Equipment Notes & Tips
                  </h4>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                    {equipment.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => onLogService(equipment)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white shadow transition-colors flex items-center gap-1.5"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Log Service Event</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MAINTENANCE SCHEDULE */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Recurring Maintenance Tasks</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Completing a task automatically resets the schedule and logs a service record.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleFetchAiSuggestions}
                    disabled={isFetchingAi}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isFetchingAi ? 'animate-spin' : ''}`} />
                    <span>{isFetchingAi ? 'Analyzing Model...' : 'Suggest Tasks (AI)'}</span>
                  </button>

                  <button
                    onClick={() => setIsAddingTask(true)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                </div>
              </div>

              {/* AI Suggestions Box */}
              {aiSuggestions && aiSuggestions.length > 0 && (
                <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Recommended Maintenance for {equipment.brand} {equipment.modelNumber || equipment.name}
                    </span>
                    <button
                      onClick={() => setAiSuggestions(null)}
                      className="text-indigo-400 hover:text-indigo-700 text-xs font-medium"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiSuggestions.map((sugg, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-zinc-800 text-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{sugg.title}</span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              Every {sugg.intervalDays}d
                            </span>
                          </div>
                          {sugg.instructions && (
                            <p className="text-zinc-600 dark:text-zinc-400 text-[11px] mb-2 leading-relaxed">
                              {sugg.instructions}
                            </p>
                          )}
                          {sugg.filterOrPartSpecs && (
                            <p className="text-zinc-500 text-[10px]">
                              Spec: <span className="font-medium text-zinc-700 dark:text-zinc-300">{sugg.filterOrPartSpecs}</span>
                            </p>
                          )}
                        </div>
                        <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                          <button
                            onClick={() => handleApplyAiSuggestion(sugg)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                          >
                            Add to Schedule
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Task Form Inline */}
              {isAddingTask && (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-300 dark:border-zinc-700 space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      New Maintenance Task
                    </h4>
                    <button
                      onClick={() => setIsAddingTask(false)}
                      className="text-zinc-400 hover:text-zinc-600 text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Task Name *
                      </label>
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="e.g. Replace Air Filter (20x25x4)"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Frequency (Days) *
                      </label>
                      <input
                        type="number"
                        value={newTaskInterval}
                        onChange={(e) => setNewTaskInterval(parseInt(e.target.value) || 30)}
                        min={1}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Priority
                      </label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High (Critical)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Consumable / Part Specification
                      </label>
                      <input
                        type="text"
                        value={newTaskSpecs}
                        onChange={(e) => setNewTaskSpecs(e.target.value)}
                        placeholder="e.g. Filter #FC100A1037 / Oil 10W-30"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Maintenance Instructions
                      </label>
                      <textarea
                        value={newTaskInstructions}
                        onChange={(e) => setNewTaskInstructions(e.target.value)}
                        placeholder="Step by step guidance, valve locations, safety instructions..."
                        rows={2}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsAddingTask(false)}
                      className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddTask}
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white"
                    >
                      Save Task
                    </button>
                  </div>
                </div>
              )}

              {/* Tasks List */}
              {(!equipment.maintenanceTasks || equipment.maintenanceTasks.length === 0) && !isAddingTask ? (
                <div className="text-center py-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <Calendar className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No maintenance tasks set</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    Add tasks like filter replacements, coil cleanings, or oil changes to receive Pushover reminders.
                  </p>
                  <button
                    onClick={() => setIsAddingTask(true)}
                    className="mt-3 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Task</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {equipment.maintenanceTasks.map((task) => {
                    if (editingTaskId === task.id) {
                      return (
                        <div
                          key={task.id}
                          className="p-4 rounded-xl bg-orange-50/30 dark:bg-zinc-900 border border-orange-300 dark:border-orange-700/70 space-y-3 shadow-xs"
                        >
                          <div className="flex items-center justify-between border-b border-orange-200 dark:border-zinc-800 pb-2">
                            <h4 className="text-xs font-bold text-orange-950 dark:text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Pencil className="w-3.5 h-3.5 text-orange-500" />
                              Edit Maintenance Task
                            </h4>
                            <button
                              type="button"
                              onClick={handleCancelEditTask}
                              className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            >
                              Cancel
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Task Title *
                              </label>
                              <input
                                type="text"
                                value={editTaskTitle}
                                onChange={(e) => setEditTaskTitle(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-orange-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Recurrence (Days) *
                              </label>
                              <input
                                type="number"
                                value={editTaskInterval}
                                onChange={(e) => setEditTaskInterval(Number(e.target.value) || 30)}
                                min={1}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Next Due Date *
                              </label>
                              <input
                                type="date"
                                value={editTaskNextDueDate}
                                onChange={(e) => setEditTaskNextDueDate(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Last Completed Date
                              </label>
                              <input
                                type="date"
                                value={editTaskLastCompletedDate}
                                onChange={(e) => setEditTaskLastCompletedDate(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Priority Level
                              </label>
                              <select
                                value={editTaskPriority}
                                onChange={(e) => setEditTaskPriority(e.target.value as any)}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                              >
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High (Critical)</option>
                              </select>
                            </div>

                            <div className="sm:col-span-3">
                              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Consumable / Part Specification
                              </label>
                              <input
                                type="text"
                                value={editTaskSpecs}
                                onChange={(e) => setEditTaskSpecs(e.target.value)}
                                placeholder="e.g. Filter #FC100A1037 / Oil 10W-30"
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-mono"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Maintenance Instructions &amp; Safety
                              </label>
                              <textarea
                                value={editTaskInstructions}
                                onChange={(e) => setEditTaskInstructions(e.target.value)}
                                rows={2}
                                placeholder="Step by step maintenance instructions..."
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                            <button
                              type="button"
                              onClick={handleCancelEditTask}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEditTask}
                              disabled={!editTaskTitle.trim()}
                              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white shadow-xs"
                            >
                              Save Task Changes
                            </button>
                          </div>
                        </div>
                      );
                    }

                    const daysLeft = getDaysDifference(task.nextDueDate);
                    const isOverdue = daysLeft !== null && daysLeft < 0;

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isOverdue
                            ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                            : daysLeft !== null && daysLeft <= 7
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{task.title}</h4>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  task.priority === 'high'
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                                }`}
                              >
                                {task.priority}
                              </span>
                              <span className="text-[11px] text-zinc-500">Every {task.intervalDays} days</span>
                            </div>

                            {task.instructions && (
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1.5 leading-relaxed">
                                {task.instructions}
                              </p>
                            )}

                            {task.filterOrPartSpecs && (
                              <p className="text-xs text-zinc-500 flex items-center gap-1">
                                <Tag className="w-3 h-3 text-orange-500" />
                                <span>Part / Spec:</span>
                                <span className="font-medium text-zinc-800 dark:text-zinc-200 font-mono">
                                  {task.filterOrPartSpecs}
                                </span>
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                              <span>Last Done: {formatDate(task.lastCompletedDate)}</span>
                              <span
                                className={`font-semibold ${
                                  isOverdue
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : daysLeft !== null && daysLeft <= 7
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-zinc-700 dark:text-zinc-300'
                                }`}
                              >
                                Due: {formatDate(task.nextDueDate)}{' '}
                                {daysLeft !== null &&
                                  (isOverdue
                                    ? `(${Math.abs(daysLeft)}d overdue)`
                                    : daysLeft === 0
                                    ? '(Due Today)'
                                    : `(in ${daysLeft}d)`)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => onLogService(equipment, task)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Done & Log</span>
                            </button>

                            <button
                              onClick={() => handleStartEditTask(task)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors"
                              title="Edit maintenance task"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SERVICE HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Service & Repair History</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Lifetime maintenance and repair logs for this equipment.
                  </p>
                </div>

                <button
                  onClick={() => onLogService(equipment)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Service Record</span>
                </button>
              </div>

              {equipmentRecords.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <Wrench className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No service records yet</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Log maintenance, oil changes, warranty repairs, or DIY fixes to keep a complete record.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {equipmentRecords.map((record) => (
                    <div
                      key={record.id}
                      className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {formatDate(record.date)}
                          </span>
                          <span className="capitalize px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {record.type.replace('_', ' ')}
                          </span>
                        </div>

                        <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(record.cost)}
                        </span>
                      </div>

                      <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal">
                        {record.description}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200/60 dark:border-zinc-800">
                        <span>Technician: <strong className="text-zinc-700 dark:text-zinc-300">{record.technicianOrCompany || 'Self'}</strong></span>
                        {record.partsReplaced && (
                          <span>Parts: <strong className="text-zinc-700 dark:text-zinc-300 font-mono">{record.partsReplaced}</strong></span>
                        )}
                        {record.invoiceOrReceiptNote && (
                          <span className="italic">Ref: {record.invoiceOrReceiptNote}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DOCUMENTS & LOCAL MANUALS */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Storage Feedback Banner */}
              {storageFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
                    storageFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {storageFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    )}
                    <span>{storageFeedback.text}</span>
                  </div>
                  <button
                    onClick={() => setStorageFeedback(null)}
                    className="p-1 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Dedicated Local Appliance Folder Info Banner */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-orange-500 shrink-0" />
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      Local File System Folder
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Disk Storage Active
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRescanFolder}
                      disabled={isRescanningFolder}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition-colors"
                      title="Scan folder on Unraid array/disk for files added externally"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRescanningFolder ? 'animate-spin' : ''}`} />
                      <span>{isRescanningFolder ? 'Scanning Disk...' : 'Rescan Folder'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2 min-w-0 flex-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 truncate">
                    <HardDrive className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate" title={folderInfo?.folderPath || 'Loading path...'}>
                      {folderInfo?.folderPath || 'Initializing local appliance folder...'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyFolderPath}
                    className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 shrink-0"
                    title="Copy full folder path"
                  >
                    {copiedFolderPath ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedFolderPath ? 'Copied' : 'Copy Path'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                  <span>
                    Folder: <strong className="text-zinc-700 dark:text-zinc-300 font-mono">{folderInfo?.folderName || equipment.folderName || 'appliance_folder'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Files on disk: <strong className="text-zinc-700 dark:text-zinc-300">{folderInfo?.fileCount ?? equipment.documents?.length ?? 0}</strong>
                  </span>
                  {folderInfo?.formattedSize && (
                    <>
                      <span>•</span>
                      <span>Total size: <strong className="text-zinc-700 dark:text-zinc-300">{folderInfo.formattedSize}</strong></span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Manuals, Wiring & Documentation</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Store PDFs, wiring diagrams, receipts, and images locally in this appliance's folder.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setManualSearchQuery(`${equipment.brand} ${equipment.modelNumber || equipment.name} user manual pdf`);
                      setManualLinkTitle(`${equipment.brand} ${equipment.modelNumber || equipment.name} Owner's Manual`);
                      setIsFindManualOpen(true);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 transition-colors flex items-center gap-1.5"
                    title="Search Google for owner manuals and PDFs for this model"
                  >
                    <Search className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    <span>Find Manual Online</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsAddingDoc(true);
                      setDocMode('upload');
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Document</span>
                  </button>
                </div>
              </div>

              {/* Upload or Add Web Link Modal / Inline Form */}
              {isAddingDoc && (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/90 border border-zinc-300 dark:border-zinc-700 space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setDocMode('upload')}
                        className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors ${
                          docMode === 'upload'
                            ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                            : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                        }`}
                      >
                        Upload Local File to Disk
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocMode('link')}
                        className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors ${
                          docMode === 'link'
                            ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                            : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                        }`}
                      >
                        External Web Link
                      </button>
                    </div>

                    <button
                      onClick={() => setIsAddingDoc(false)}
                      className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {docMode === 'upload' ? (
                    <div className="space-y-3">
                      {/* Drag & Drop File Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          Select PDF, Diagram, Image, or Receipt *
                        </label>
                        <div
                          onClick={() => fileUploadInputRef.current?.click()}
                          className="p-5 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-orange-500 dark:hover:border-orange-500 rounded-xl cursor-pointer bg-white dark:bg-zinc-900 text-center transition-colors group"
                        >
                          <input
                            ref={fileUploadInputRef}
                            type="file"
                            accept=".pdf,image/*,.doc,.docx,.txt,.png,.jpg,.jpeg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedUploadFile(file);
                                if (!newDocTitle) {
                                  setNewDocTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
                                }
                              }
                            }}
                            className="hidden"
                          />
                          {selectedUploadFile ? (
                            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                              <FileCheck className="w-5 h-5 text-emerald-500" />
                              <span className="font-mono">{selectedUploadFile.name}</span>
                              <span className="text-zinc-400 font-normal">
                                ({formatFileSize(selectedUploadFile.size)})
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <Upload className="w-6 h-6 mx-auto text-zinc-400 group-hover:text-orange-500 transition-colors" />
                              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Click to browse or drop file here
                              </p>
                              <p className="text-[11px] text-zinc-400">
                                PDF manuals, schematics, photos, warranty documents (saved directly into appliance folder)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                            Document Title
                          </label>
                          <input
                            type="text"
                            value={newDocTitle}
                            onChange={(e) => setNewDocTitle(e.target.value)}
                            placeholder="e.g. Owner Installation Manual"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                            Document Type
                          </label>
                          <select
                            value={docCategoryType}
                            onChange={(e) => setDocCategoryType(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                          >
                            <option value="PDF Manual">PDF Manual</option>
                            <option value="Wiring Diagram">Wiring Diagram</option>
                            <option value="Warranty Document">Warranty Document</option>
                            <option value="Receipt / Invoice">Receipt / Invoice</option>
                            <option value="Spec Sheet">Spec Sheet</option>
                            <option value="Equipment Photo">Equipment Photo</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                            Notes / Page References (Optional)
                          </label>
                          <input
                            type="text"
                            value={newDocNotes}
                            onChange={(e) => setNewDocNotes(e.target.value)}
                            placeholder="e.g. Page 14 has filter sizing, Page 22 has error codes"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setIsAddingDoc(false)}
                          className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleUploadLocalDocument}
                          disabled={!selectedUploadFile || isUploadingDoc}
                          className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white flex items-center gap-1.5"
                        >
                          {isUploadingDoc ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Saving to Disk...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" />
                              <span>Save to Appliance Folder</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                            Document Title *
                          </label>
                          <input
                            type="text"
                            value={newDocTitle}
                            onChange={(e) => setNewDocTitle(e.target.value)}
                            placeholder="e.g. Manufacturer Online Support Portal"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                            Web Link URL *
                          </label>
                          <input
                            type="url"
                            value={newDocUrl}
                            onChange={(e) => setNewDocUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                            Notes
                          </label>
                          <input
                            type="text"
                            value={newDocNotes}
                            onChange={(e) => setNewDocNotes(e.target.value)}
                            placeholder="e.g. Contains online diagnostics tool"
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setIsAddingDoc(false)}
                          className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddWebLinkDoc}
                          disabled={!newDocTitle.trim() || !newDocUrl.trim()}
                          className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white"
                        >
                          Save Web Link
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Documents List */}
              {(!equipment.documents || equipment.documents.length === 0) && !isAddingDoc ? (
                <div className="text-center py-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-zinc-400" />
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No documentation in folder</p>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                    Upload manufacturer PDF manuals, wiring schematics, or photos directly to this appliance's folder on disk, or drop files into{' '}
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-zinc-700 dark:text-zinc-300">
                      {folderInfo?.folderName || 'appliance_folder'}
                    </code>{' '}
                    and click "Rescan Folder".
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {equipment.documents?.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">
                            {doc.title}
                          </h4>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {doc.isLocal ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                <HardDrive className="w-2.5 h-2.5" />
                                <span>Local Disk</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                Web Link
                              </span>
                            )}
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              {doc.fileType || 'Doc'}
                            </span>
                          </div>
                        </div>

                        {doc.fileName && (
                          <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 truncate mb-1">
                            📄 {doc.fileName}
                            {doc.fileSize && (
                              <span className="ml-1 text-zinc-400 font-sans">({formatFileSize(doc.fileSize)})</span>
                            )}
                          </p>
                        )}

                        {doc.notes && (
                          <p className="text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed">{doc.notes}</p>
                        )}
                      </div>

                      <div className="pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between mt-2">
                        <span className="text-[11px] text-zinc-400">Added: {formatDate(doc.dateAdded)}</span>

                        <div className="flex items-center gap-2">
                          {doc.url && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/60 flex items-center gap-1 font-semibold transition-colors"
                              title={doc.isLocal ? 'Open / View local file' : 'Open web link'}
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

                          {doc.isLocal && doc.url && (
                            <a
                              href={doc.url}
                              download={doc.fileName || true}
                              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                              title="Download copy"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            onClick={() => handleDeleteDoc(doc)}
                            className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
                            title={doc.isLocal ? 'Delete file from disk and records' : 'Remove document record'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: WARRANTY DETAILS */}
          {activeTab === 'warranty' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Warranty & Protection Plan</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Track coverage periods, policy details, and claim contacts.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!isEditingWarranty && (
                    <>
                      <button
                        type="button"
                        onClick={handleStartEditWarranty}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 transition-colors flex items-center gap-1.5"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit Warranty</span>
                      </button>

                      {equipment.warranty && equipment.warranty.type !== 'none' && (
                        <button
                          type="button"
                          onClick={handleRemoveWarranty}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors flex items-center gap-1.5"
                          title="Remove all warranty details for this item"
                        >
                          <ShieldOff className="w-3.5 h-3.5" />
                          <span>Remove Warranty</span>
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={handleSendWarrantyAlert}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                    <span>Push Info to Phone</span>
                  </button>
                </div>
              </div>

              {/* Item Alerts & Notifications Management Card */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 ${isAlertsMuted ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'}`}>
                      {isAlertsMuted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                          Push Alerts &amp; Notifications for this Appliance
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAlertsMuted ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'}`}>
                          {isAlertsMuted ? 'Muted' : 'Active'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {isAlertsMuted
                          ? 'Alerts are disabled for this appliance. Pushover reminders for maintenance tasks and warranty expiration are silenced.'
                          : 'Alerts are actively enabled. You will receive notifications when maintenance tasks and warranty expirations are due.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleAlerts}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 shadow-xs ${
                      isAlertsMuted
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600'
                        : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {isAlertsMuted ? (
                      <>
                        <Bell className="w-3.5 h-3.5" />
                        <span>Enable Alerts</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-3.5 h-3.5" />
                        <span>Mute Alerts for this Item</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Warranty Editing Form */}
              {isEditingWarranty ? (
                <div className="p-4 rounded-xl bg-orange-50/40 dark:bg-zinc-900 border border-orange-300 dark:border-orange-700/70 space-y-4">
                  <div className="flex items-center justify-between border-b border-orange-200 dark:border-zinc-800 pb-2.5">
                    <h4 className="text-xs font-bold text-orange-950 dark:text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5 text-orange-500" />
                      Edit Warranty Information
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsEditingWarranty(false)}
                      className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Warranty Type
                      </label>
                      <select
                        value={editWarrantyType}
                        onChange={(e) => setEditWarrantyType(e.target.value as WarrantyType)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                      >
                        <option value="none">No Warranty / None</option>
                        <option value="manufacturer">Manufacturer Warranty</option>
                        <option value="extended">Extended Warranty</option>
                        <option value="store">Store / Dealer Plan</option>
                        <option value="lifetime">Lifetime Guarantee</option>
                      </select>
                    </div>

                    {editWarrantyType !== 'none' && (
                      <div className="flex items-center pt-6">
                        <label className="relative flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editHasLifetimeWarranty}
                            onChange={(e) => setEditHasLifetimeWarranty(e.target.checked)}
                            className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                          />
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Lifetime Warranty (No expiration date)
                          </span>
                        </label>
                      </div>
                    )}

                    {editWarrantyType !== 'none' && !editHasLifetimeWarranty && (
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Expiration Date
                        </label>
                        <input
                          type="date"
                          value={editWarrantyExpiration}
                          onChange={(e) => setEditWarrantyExpiration(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    )}

                    {editWarrantyType !== 'none' && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Provider / Company Name
                          </label>
                          <input
                            type="text"
                            value={editWarrantyProvider}
                            onChange={(e) => setEditWarrantyProvider(e.target.value)}
                            placeholder="e.g. Whirlpool Direct, Asurion, Home Depot"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Policy or Contract Number
                          </label>
                          <input
                            type="text"
                            value={editWarrantyPolicy}
                            onChange={(e) => setEditWarrantyPolicy(e.target.value)}
                            placeholder="e.g. POL-994827"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Claims Phone or URL
                          </label>
                          <input
                            type="text"
                            value={editWarrantyContact}
                            onChange={(e) => setEditWarrantyContact(e.target.value)}
                            placeholder="e.g. 1-800-253-1301 or support.brand.com"
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Terms, Notes &amp; Deductible
                          </label>
                          <textarea
                            value={editWarrantyNotes}
                            onChange={(e) => setEditWarrantyNotes(e.target.value)}
                            rows={2}
                            placeholder="Covers parts & labor, excludes water damage..."
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={handleRemoveWarranty}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1"
                    >
                      <ShieldOff className="w-3.5 h-3.5" />
                      <span>Remove Warranty Information</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingWarranty(false)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveWarranty}
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white shadow-xs"
                      >
                        Save Warranty Details
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  <div
                    className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                      equipment.warranty?.type === 'none'
                        ? 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-950/60 dark:text-zinc-300 dark:border-zinc-800'
                        : warrantyMeta.status === 'lifetime'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
                        : warrantyMeta.status === 'expiring_soon'
                        ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800'
                        : warrantyMeta.status === 'expired'
                        ? 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'
                        : 'bg-zinc-50 text-zinc-900 border-zinc-200 dark:bg-zinc-950/60 dark:text-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider block opacity-75">
                        Warranty Status
                      </span>
                      <p className="text-lg font-bold mt-0.5">
                        {equipment.warranty?.type === 'none' ? 'No Active Warranty' : warrantyMeta.label}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs opacity-75 block">Coverage Type</span>
                      <span className="font-semibold capitalize text-sm">
                        {equipment.warranty?.type === 'none'
                          ? 'None'
                          : `${equipment.warranty?.type || 'Manufacturer'} Warranty`}
                      </span>
                    </div>
                  </div>

              {/* Detail Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 block mb-1">Expiration Date</span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {equipment.warranty?.hasLifetimeWarranty
                      ? 'Lifetime Guarantee (No Expiration)'
                      : formatDate(equipment.warranty?.expirationDate)}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 block mb-1">Provider / Carrier</span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {equipment.warranty?.provider || 'Manufacturer Direct'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 block mb-1">Policy / Contract #</span>
                  <p className="text-sm font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                    {equipment.warranty?.policyNumber || 'N/A'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 block mb-1">Claim Support / Phone</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {equipment.warranty?.contactPhoneOrUrl || 'Check manufacturer website'}
                    </span>
                  </div>
                </div>

                {(equipment.contractor?.name || equipment.contractorName || equipment.contractor?.phone || equipment.contractorPhone) && (
                  <div className="p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 sm:col-span-2">
                    <span className="text-orange-800 dark:text-orange-300 font-semibold block mb-1 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      Designated Service Contractor &amp; Technician
                    </span>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {equipment.contractor?.name || equipment.contractorName}
                          {equipment.contractor?.company && (
                            <span className="text-xs font-normal text-zinc-500 ml-1">({equipment.contractor.company})</span>
                          )}
                        </p>
                      </div>
                      {(equipment.contractor?.phone || equipment.contractorPhone) && (
                        <a
                          href={`tel:${equipment.contractor?.phone || equipment.contractorPhone}`}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call {equipment.contractor?.phone || equipment.contractorPhone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {equipment.warranty?.notes && (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Coverage Terms & Exclusions
                  </h4>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                    {equipment.warranty.notes}
                  </p>
                </div>
              )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Find Manual Online Modal */}
      {isFindManualOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-zinc-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-xs">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Find Owner's Manual Online
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {equipment.brand} • {equipment.modelNumber || equipment.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFindManualOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-white/50 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Search Query Preview & Copy */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Target Search Query
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={manualSearchQuery}
                    onChange={(e) => setManualSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-mono focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleCopyManualQuery}
                    className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                    title="Copy query to clipboard"
                  >
                    {copiedManualSearch ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedManualSearch ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Instant Google Search Launcher */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Instant Google Search
                </label>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(manualSearchQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 hover:border-orange-500 hover:bg-orange-50/30 dark:hover:bg-orange-950/20 transition-all flex items-center justify-between group shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <span>Search Google for Manuals &amp; PDFs</span>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" />
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Opens Google Search in a new tab with your exact model and PDF search query
                      </p>
                    </div>
                  </div>

                  <span className="px-3.5 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold group-hover:bg-orange-500 transition-colors flex items-center gap-1 shrink-0">
                    <span>Search Google</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              </div>

              {/* Save Found Manual Link */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-orange-500" />
                  Save Found Online Manual to this Appliance
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Once you find the manual or PDF URL, paste it below to link it permanently to this appliance for fast 1-click access.
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Manual Document Title
                    </label>
                    <input
                      type="text"
                      value={manualLinkTitle}
                      onChange={(e) => setManualLinkTitle(e.target.value)}
                      placeholder="e.g. Whirlpool Refrigerator User Guide & Wiring PDF"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Online Manual URL (PDF or Web Link)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={manualLinkUrl}
                        onChange={(e) => setManualLinkUrl(e.target.value)}
                        placeholder="https://... /manual.pdf"
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                      />
                      <button
                        type="button"
                        onClick={handleSaveManualLink}
                        disabled={!manualLinkUrl.trim()}
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Save Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-end">
              <button
                type="button"
                onClick={() => setIsFindManualOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
