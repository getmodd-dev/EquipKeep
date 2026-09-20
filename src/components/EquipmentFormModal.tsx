import { useState, useEffect } from 'react';
import { X, Wrench, Shield, Sparkles, Plus, Trash2 } from 'lucide-react';
import { Equipment, EquipmentCategory, WarrantyType } from '../types';
import { CATEGORIES } from '../utils/categories';
import { getTodayDateString, addDaysToDate } from '../utils/date';

interface EquipmentFormModalProps {
  equipmentToEdit?: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipment: Partial<Equipment>) => void;
}

const PRESETS: Record<
  string,
  {
    name: string;
    category: EquipmentCategory;
    filterSize?: string;
    warrantyYears: number;
    tasks: { title: string; intervalDays: number; priority: 'low' | 'normal' | 'high'; filterOrPartSpecs?: string }[];
  }
> = {
  hvac: {
    name: 'Central Heat Pump / Air Handler',
    category: 'hvac',
    filterSize: '20x25x4 MERV 11',
    warrantyYears: 10,
    tasks: [
      { title: 'Replace Media Air Filter', intervalDays: 90, priority: 'high', filterOrPartSpecs: '20x25x4 MERV 11' },
      { title: 'Condensate Drain Line Vinegar Flush', intervalDays: 60, priority: 'normal' },
      { title: 'Annual Professional Coil Clean & Tune-up', intervalDays: 365, priority: 'high' },
    ],
  },
  refrigerator: {
    name: 'French Door Refrigerator',
    category: 'kitchen',
    filterSize: 'Internal Water Filter',
    warrantyYears: 2,
    tasks: [
      { title: 'Replace Water Filter Cartridge', intervalDays: 180, priority: 'high', filterOrPartSpecs: 'Water Filter' },
      { title: 'Vacuum Rear Condenser Coils', intervalDays: 180, priority: 'normal' },
    ],
  },
  dishwasher: {
    name: 'Built-in Dishwasher',
    category: 'kitchen',
    warrantyYears: 1,
    tasks: [
      { title: 'Clean Triple Mesh Filter', intervalDays: 30, priority: 'high' },
      { title: 'Run Tub Descaling Cycle', intervalDays: 90, priority: 'normal' },
    ],
  },
  water_heater: {
    name: 'Water Heater (Heat Pump / Tank)',
    category: 'plumbing',
    filterSize: 'Top Air Filter (if Hybrid)',
    warrantyYears: 10,
    tasks: [
      { title: 'Sediment Tank Flush & T&P Valve Test', intervalDays: 365, priority: 'high' },
      { title: 'Inspect Anode Rod', intervalDays: 730, priority: 'normal' },
    ],
  },
  washer: {
    name: 'Front-Load Washing Machine',
    category: 'laundry',
    warrantyYears: 2,
    tasks: [
      { title: 'Run Tub Clean Cycle with Bleach/Affresh', intervalDays: 30, priority: 'normal' },
      { title: 'Clean Drain Pump Filter & Debris Trap', intervalDays: 90, priority: 'normal' },
    ],
  },
  dryer: {
    name: 'Clothes Dryer',
    category: 'laundry',
    warrantyYears: 2,
    tasks: [
      { title: 'Deep Clean Lint Screen & Housing', intervalDays: 30, priority: 'normal' },
      { title: 'Inspect & Vacuum Exhaust Ductwork', intervalDays: 180, priority: 'high' },
    ],
  },
  generator: {
    name: 'Portable / Standby Generator',
    category: 'workshop',
    warrantyYears: 3,
    tasks: [
      { title: 'Engine Oil Change', intervalDays: 180, priority: 'high', filterOrPartSpecs: '10W-30 Full Synthetic' },
      { title: 'Monthly Exercise Run under Load', intervalDays: 30, priority: 'normal' },
      { title: 'Inspect Spark Plug & Air Cleaner', intervalDays: 180, priority: 'normal' },
    ],
  },
  lawnmower: {
    name: 'Rotary Lawnmower',
    category: 'lawn_garden',
    warrantyYears: 3,
    tasks: [
      { title: 'Sharpen Cutting Blade', intervalDays: 120, priority: 'normal' },
      { title: 'Clean / Replace Air Filter', intervalDays: 180, priority: 'normal' },
      { title: 'Engine Oil Change', intervalDays: 180, priority: 'high' },
    ],
  },
};

export function EquipmentFormModal({
  equipmentToEdit,
  isOpen,
  onClose,
  onSave,
}: EquipmentFormModalProps) {
  if (!isOpen) return null;

  const [name, setName] = useState(equipmentToEdit?.name || '');
  const [brand, setBrand] = useState(equipmentToEdit?.brand || '');
  const [modelNumber, setModelNumber] = useState(equipmentToEdit?.modelNumber || '');
  const [serialNumber, setSerialNumber] = useState(equipmentToEdit?.serialNumber || '');
  const [category, setCategory] = useState<EquipmentCategory>(equipmentToEdit?.category || 'kitchen');
  const [locationRoom, setLocationRoom] = useState(equipmentToEdit?.locationRoom || '');
  const [purchaseDate, setPurchaseDate] = useState(equipmentToEdit?.purchaseDate || getTodayDateString());
  const [purchasePrice, setPurchasePrice] = useState<string>(
    equipmentToEdit?.purchasePrice !== undefined ? String(equipmentToEdit.purchasePrice) : ''
  );
  const [vendorStore, setVendorStore] = useState(equipmentToEdit?.vendorStore || '');
  const [status, setStatus] = useState(equipmentToEdit?.status || 'operational');

  // Warranty
  const [warrantyType, setWarrantyType] = useState<WarrantyType>(equipmentToEdit?.warranty?.type || 'manufacturer');
  const [hasLifetimeWarranty, setHasLifetimeWarranty] = useState(
    equipmentToEdit?.warranty?.hasLifetimeWarranty || equipmentToEdit?.warranty?.type === 'lifetime' || false
  );
  const [warrantyExpirationDate, setWarrantyExpirationDate] = useState(
    equipmentToEdit?.warranty?.expirationDate || addDaysToDate(getTodayDateString(), 365)
  );
  const [warrantyProvider, setWarrantyProvider] = useState(equipmentToEdit?.warranty?.provider || '');
  const [warrantyPolicyNumber, setWarrantyPolicyNumber] = useState(equipmentToEdit?.warranty?.policyNumber || '');
  const [warrantyContact, setWarrantyContact] = useState(equipmentToEdit?.warranty?.contactPhoneOrUrl || '');
  const [warrantyNotes, setWarrantyNotes] = useState(equipmentToEdit?.warranty?.notes || '');

  // Specs
  const [filterSize, setFilterSize] = useState(equipmentToEdit?.specifications?.filterSize || '');
  const [powerRequirements, setPowerRequirements] = useState(
    equipmentToEdit?.specifications?.powerRequirements || ''
  );
  const [notes, setNotes] = useState(equipmentToEdit?.notes || '');

  // Pre-configured maintenance tasks for new items
  const [tasks, setTasks] = useState<any[]>(equipmentToEdit?.maintenanceTasks || []);

  const handleApplyPreset = (key: string) => {
    const preset = PRESETS[key];
    if (!preset) return;

    setName(preset.name);
    setCategory(preset.category);
    if (preset.filterSize) setFilterSize(preset.filterSize);

    const exp = addDaysToDate(purchaseDate || getTodayDateString(), preset.warrantyYears * 365);
    setWarrantyExpirationDate(exp);
    setWarrantyProvider(`${preset.name.split(' ')[0]} Warranty`);

    const generatedTasks = preset.tasks.map((t) => ({
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: t.title,
      intervalDays: t.intervalDays,
      nextDueDate: addDaysToDate(getTodayDateString(), t.intervalDays),
      priority: t.priority,
      filterOrPartSpecs: t.filterOrPartSpecs || '',
    }));
    setTasks(generatedTasks);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: Partial<Equipment> = {
      name: name.trim(),
      brand: brand.trim(),
      modelNumber: modelNumber.trim(),
      serialNumber: serialNumber.trim(),
      category,
      locationRoom: locationRoom.trim() || 'Unassigned',
      purchaseDate,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      vendorStore: vendorStore.trim() || undefined,
      status: status as any,
      warranty: {
        type: hasLifetimeWarranty ? 'lifetime' : warrantyType,
        expirationDate: hasLifetimeWarranty ? '' : warrantyExpirationDate,
        provider: warrantyProvider.trim() || undefined,
        policyNumber: warrantyPolicyNumber.trim() || undefined,
        contactPhoneOrUrl: warrantyContact.trim() || undefined,
        notes: warrantyNotes.trim() || undefined,
        hasLifetimeWarranty,
      },
      specifications: {
        filterSize: filterSize.trim() || undefined,
        powerRequirements: powerRequirements.trim() || undefined,
      },
      maintenanceTasks: tasks,
      notes: notes.trim() || undefined,
      documents: equipmentToEdit?.documents || [],
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/60">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
              {equipmentToEdit ? 'Edit Equipment Details' : 'Add New Equipment or Appliance'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Store documentation, parts specs, warranty, and recurring service intervals.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-zinc-800 dark:text-zinc-200">
          {/* Quick Presets (Only if adding new) */}
          {!equipmentToEdit && (
            <div className="p-3.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40">
              <span className="font-semibold text-orange-900 dark:text-orange-300 block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                Quick Presets (auto-populates common tasks & specs):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(PRESETS).map(([key, p]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleApplyPreset(key)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-orange-200 dark:border-zinc-700 hover:border-orange-500 transition-colors"
                  >
                    {p.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Core Identification */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Basic Identification
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Equipment / Appliance Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Carrier 3-Ton Heat Pump"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                >
                  {Object.entries(CATEGORIES).map(([catKey, val]) => (
                    <option key={catKey} value={catKey}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Brand / Make</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Carrier, Bosch, GE"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Model Number</label>
                <input
                  type="text"
                  value={modelNumber}
                  onChange={(e) => setModelNumber(e.target.value)}
                  placeholder="e.g. 25VNA436A003"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Serial Number</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. 2421E88392"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Location / Room
                </label>
                <input
                  type="text"
                  value={locationRoom}
                  onChange={(e) => setLocationRoom(e.target.value)}
                  placeholder="e.g. Basement, Attic, Kitchen"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Operational Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 capitalize"
                >
                  <option value="operational">Operational (Good)</option>
                  <option value="maintenance_due">Maintenance Due</option>
                  <option value="repair_needed">Repair Needed</option>
                  <option value="retired">Retired / Decommissioned</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Purchase Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="e.g. 1299.00"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Store / Dealer</label>
                <input
                  type="text"
                  value={vendorStore}
                  onChange={(e) => setVendorStore(e.target.value)}
                  placeholder="e.g. Home Depot, Ferguson Supply, Best Buy"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>
          </div>

          {/* Consumables & Physical Specs */}
          <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Consumables & Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Filter / Consumable Specs
                </label>
                <input
                  type="text"
                  value={filterSize}
                  onChange={(e) => setFilterSize(e.target.value)}
                  placeholder="e.g. 20x25x4 MERV 11 or RPWFE Water Filter"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Power / Electrical Requirements
                </label>
                <input
                  type="text"
                  value={powerRequirements}
                  onChange={(e) => setPowerRequirements(e.target.value)}
                  placeholder="e.g. 240V 30A Double Pole or 120V 15A"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>
          </div>

          {/* Warranty Tracking */}
          <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Warranty & Protection Plan
              </h3>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={hasLifetimeWarranty}
                  onChange={(e) => setHasLifetimeWarranty(e.target.checked)}
                  className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                />
                <span>Lifetime Warranty (No Expiration)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Warranty Type</label>
                <select
                  value={warrantyType}
                  onChange={(e) => setWarrantyType(e.target.value as WarrantyType)}
                  disabled={hasLifetimeWarranty}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 capitalize disabled:opacity-50"
                >
                  <option value="manufacturer">Manufacturer Warranty</option>
                  <option value="extended">Extended Warranty Plan</option>
                  <option value="store">Store Protection Plan</option>
                  <option value="limited">Limited Warranty</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={warrantyExpirationDate}
                  onChange={(e) => setWarrantyExpirationDate(e.target.value)}
                  disabled={hasLifetimeWarranty}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Provider / Carrier</label>
                <input
                  type="text"
                  value={warrantyProvider}
                  onChange={(e) => setWarrantyProvider(e.target.value)}
                  placeholder="e.g. Carrier 10-Yr Plan"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Policy / Contract #</label>
                <input
                  type="text"
                  value={warrantyPolicyNumber}
                  onChange={(e) => setWarrantyPolicyNumber(e.target.value)}
                  placeholder="e.g. POL-8829104"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Claim Contact Phone / Web URL
                </label>
                <input
                  type="text"
                  value={warrantyContact}
                  onChange={(e) => setWarrantyContact(e.target.value)}
                  placeholder="e.g. 1-800-227-7437 or https://carrier.com/warranty"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Warranty Coverage Notes & Conditions
                </label>
                <textarea
                  value={warrantyNotes}
                  onChange={(e) => setWarrantyNotes(e.target.value)}
                  placeholder="e.g. Covers parts and compressor only, labor excluded after year 1."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <label className="block text-zinc-600 dark:text-zinc-400 font-medium">General Equipment Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any installation details, breakers, shutdown switches, or specific quirks..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white shadow"
            >
              {equipmentToEdit ? 'Save Changes' : 'Create Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
