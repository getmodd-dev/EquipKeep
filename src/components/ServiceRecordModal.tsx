import { useState } from 'react';
import { X, Wrench, DollarSign, Calendar, CheckCircle2 } from 'lucide-react';
import { Equipment, MaintenanceTask, ServiceRecord, ServiceType } from '../types';
import { getTodayDateString, addDaysToDate } from '../utils/date';

interface ServiceRecordModalProps {
  equipmentList: Equipment[];
  preSelectedEquipment?: Equipment | null;
  preSelectedTask?: MaintenanceTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (recordData: Partial<ServiceRecord> & { taskId?: string }) => void;
}

export function ServiceRecordModal({
  equipmentList,
  preSelectedEquipment,
  preSelectedTask,
  isOpen,
  onClose,
  onSave,
}: ServiceRecordModalProps) {
  if (!isOpen) return null;

  const [equipmentId, setEquipmentId] = useState(
    preSelectedEquipment?.id || (equipmentList.length > 0 ? equipmentList[0].id : '')
  );
  const [date, setDate] = useState(getTodayDateString());
  const [type, setType] = useState<ServiceType>(preSelectedTask ? 'routine' : 'routine');
  const [technicianOrCompany, setTechnicianOrCompany] = useState(
    preSelectedTask ? 'Self (DIY Maintenance)' : 'Self (DIY Maintenance)'
  );
  const [cost, setCost] = useState<string>('');
  const [description, setDescription] = useState(
    preSelectedTask ? `Completed scheduled maintenance: ${preSelectedTask.title}` : ''
  );
  const [partsReplaced, setPartsReplaced] = useState(
    preSelectedTask?.filterOrPartSpecs || ''
  );
  const [invoiceOrReceiptNote, setInvoiceOrReceiptNote] = useState('');
  const [nextServiceDueDate, setNextServiceDueDate] = useState(
    preSelectedTask ? addDaysToDate(getTodayDateString(), preSelectedTask.intervalDays) : ''
  );

  const selectedEquipment = equipmentList.find((e) => e.id === equipmentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentId || !date) return;

    onSave({
      equipmentId,
      equipmentName: selectedEquipment?.name || 'Home Equipment',
      date,
      type,
      technicianOrCompany: technicianOrCompany.trim() || 'Self',
      cost: cost ? parseFloat(cost) : 0,
      description: description.trim() || 'Standard service performed.',
      partsReplaced: partsReplaced.trim() || undefined,
      nextServiceDueDate: nextServiceDueDate || undefined,
      invoiceOrReceiptNote: invoiceOrReceiptNote.trim() || undefined,
      taskId: preSelectedTask?.id,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {preSelectedTask ? 'Complete Task & Log Service' : 'Log Service or Repair Record'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {selectedEquipment ? selectedEquipment.name : 'Select an appliance'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs text-zinc-800 dark:text-zinc-200">
          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Equipment *</label>
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              disabled={Boolean(preSelectedEquipment)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-medium disabled:opacity-75"
            >
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.brand})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Service Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Service Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ServiceType)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 capitalize"
              >
                <option value="routine">Routine Maintenance</option>
                <option value="repair">Professional Repair</option>
                <option value="diy">DIY Fix / Repair</option>
                <option value="inspection">Inspection / Tune-up</option>
                <option value="warranty_claim">Warranty Claim Service</option>
                <option value="part_replacement">Part Replacement</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                Technician / Performed By
              </label>
              <input
                type="text"
                value={technicianOrCompany}
                onChange={(e) => setTechnicianOrCompany(e.target.value)}
                placeholder="e.g. Self, Carrier Certified, Sears"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">Total Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
              Work Performed / Notes *
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what was done, filter change, oil drained, parts lubricated..."
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                Parts Installed / Replaced
              </label>
              <input
                type="text"
                value={partsReplaced}
                onChange={(e) => setPartsReplaced(e.target.value)}
                placeholder="e.g. Filter #1037, Anode Rod SP11526"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                Next Service Due Date
              </label>
              <input
                type="date"
                value={nextServiceDueDate}
                onChange={(e) => setNextServiceDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
              Receipt Reference / Work Order #
            </label>
            <input
              type="text"
              value={invoiceOrReceiptNote}
              onChange={(e) => setInvoiceOrReceiptNote(e.target.value)}
              placeholder="e.g. Invoice #29401 or Amazon order"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
          </div>

          {preSelectedTask && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Completing this task will advance the next scheduled date by{' '}
                <strong>{preSelectedTask.intervalDays} days</strong>.
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
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
              Save Service Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
