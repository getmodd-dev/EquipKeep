export type EquipmentCategory =
  | 'kitchen'
  | 'laundry'
  | 'hvac'
  | 'plumbing'
  | 'workshop'
  | 'lawn_garden'
  | 'electrical'
  | 'smart_home'
  | 'other';

export type EquipmentSection = 'appliances_electronics' | 'large_equipment';

export type EquipmentStatus =
  | 'operational'
  | 'maintenance_due'
  | 'repair_needed'
  | 'retired';

export type WarrantyType =
  | 'manufacturer'
  | 'extended'
  | 'store'
  | 'limited'
  | 'lifetime';

export type WarrantyStatus =
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'lifetime'
  | 'none';

export type ServiceType =
  | 'routine'
  | 'repair'
  | 'diy'
  | 'inspection'
  | 'warranty_claim'
  | 'part_replacement';

export interface DocumentItem {
  id: string;
  title: string;
  url?: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  fileType?: string;
  notes?: string;
  dateAdded: string;
  isLocal?: boolean;
}

export interface MaintenanceTask {
  id: string;
  title: string;
  intervalDays: number;
  lastCompletedDate?: string;
  nextDueDate: string;
  instructions?: string;
  priority: 'low' | 'normal' | 'high';
  filterOrPartSpecs?: string;
}

export interface ServiceRecord {
  id: string;
  equipmentId: string;
  equipmentName?: string;
  date: string;
  type: ServiceType;
  technicianOrCompany: string;
  cost: number;
  description: string;
  partsReplaced?: string;
  nextServiceDueDate?: string;
  invoiceOrReceiptNote?: string;
  createdAt: string;
}

export interface ContractorInfo {
  name?: string;
  company?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface Equipment {
  id: string;
  name: string;
  brand: string;
  modelNumber: string;
  serialNumber: string;
  category: EquipmentCategory;
  section?: EquipmentSection;
  locationRoom: string;
  purchaseDate: string;
  purchasePrice?: number;
  vendorStore?: string;
  status: EquipmentStatus;
  contractor?: ContractorInfo;
  contractorName?: string;
  contractorPhone?: string;
  warranty: {
    type: WarrantyType;
    expirationDate: string;
    provider?: string;
    policyNumber?: string;
    contactPhoneOrUrl?: string;
    notes?: string;
    hasLifetimeWarranty?: boolean;
  };
  specifications?: {
    filterSize?: string;
    powerRequirements?: string;
    fuelOrRefrigerant?: string;
    customSpecs?: Record<string, string>;
  };
  maintenanceTasks: MaintenanceTask[];
  documents: DocumentItem[];
  notes?: string;
  imageUrl?: string;
  folderName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PushoverConfig {
  userKey: string;
  apiToken: string;
  defaultDevice?: string;
  defaultPriority: number;
  defaultSound: string;
  notifyOnWarrantyDays: number;
  notifyOnMaintenanceDue: boolean;
  lastTestedAt?: string;
  storageLocation?: string;
}

export interface StorageStatus {
  storageLocation: string;
  defaultLocation: string;
  exists: boolean;
  writable: boolean;
  totalApplianceFolders: number;
  totalFiles: number;
  totalBytes: number;
  formattedTotalSize: string;
  folders: StorageFolderItem[];
}

export interface StorageFolderItem {
  folderName: string;
  fullPath: string;
  equipmentId?: string;
  equipmentName?: string;
  fileCount: number;
  totalBytes: number;
  formattedSize: string;
  files: StorageFileItem[];
}

export interface StorageFileItem {
  fileName: string;
  fullPath: string;
  url: string;
  sizeBytes: number;
  formattedSize: string;
  mimeType: string;
  updatedAt: string;
}

export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  type: 'warranty' | 'maintenance' | 'system';
  severity: 'info' | 'warning' | 'critical';
  equipmentId?: string;
  equipmentName?: string;
  date: string;
  sentToPushover?: boolean;
}

export type ProjectCategory =
  | 'gutters_roof'
  | 'painting_exterior'
  | 'painting_interior'
  | 'landscaping_grounds'
  | 'deck_patio'
  | 'pressure_washing'
  | 'seasonal_prep'
  | 'general_home';

export type ProjectStatus = 'planned' | 'scheduled' | 'in_progress' | 'completed';
export type ProjectRecurrence = 'one_time' | 'seasonal_spring' | 'seasonal_fall' | 'biannual' | 'annual' | 'multi_year';

export interface ProjectChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface HomeProject {
  id: string;
  title: string;
  category: ProjectCategory;
  description?: string;
  targetDate: string; // YYYY-MM-DD
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'year_round';
  status: ProjectStatus;
  priority: 'low' | 'normal' | 'high';
  recurrence: ProjectRecurrence;
  estimatedCost?: number;
  actualCost?: number;
  assignedType: 'diy' | 'contractor';
  contractorName?: string;
  contractorContact?: string;
  contractorQuote?: string;
  materialsNeeded?: string;
  checklist: ProjectChecklistItem[];
  notes?: string;
  lastCompletedDate?: string;
  createdAt: string;
  updatedAt: string;
}

