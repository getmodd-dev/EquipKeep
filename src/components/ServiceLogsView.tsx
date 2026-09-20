import { useState, useMemo } from 'react';
import {
  History,
  Wrench,
  Search,
  Filter,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  Download,
  FileText
} from 'lucide-react';
import { Equipment, ServiceRecord, ServiceType } from '../types';
import { formatDate, formatCurrency } from '../utils/date';

interface ServiceLogsViewProps {
  serviceRecords: ServiceRecord[];
  equipmentList: Equipment[];
  onAddRecord: () => void;
  onDeleteRecord: (id: string) => void;
  onSelectEquipment: (equipment: Equipment) => void;
}

export function ServiceLogsView({
  serviceRecords,
  equipmentList,
  onAddRecord,
  onDeleteRecord,
  onSelectEquipment,
}: ServiceLogsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('all');

  // Calculate spending analytics
  const metrics = useMemo(() => {
    let totalSpend = 0;
    let routineSpend = 0;
    let repairSpend = 0;
    let diyCount = 0;
    let proCount = 0;

    serviceRecords.forEach((r) => {
      const c = Number(r.cost) || 0;
      totalSpend += c;

      if (r.type === 'routine') routineSpend += c;
      if (r.type === 'repair' || r.type === 'part_replacement') repairSpend += c;

      const tech = (r.technicianOrCompany || '').toLowerCase();
      if (tech.includes('self') || tech.includes('diy') || r.type === 'diy') {
        diyCount++;
      } else {
        proCount++;
      }
    });

    return { totalSpend, routineSpend, repairSpend, diyCount, proCount };
  }, [serviceRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return serviceRecords.filter((r) => {
      if (selectedType !== 'all' && r.type !== selectedType) return false;
      if (selectedEquipmentId !== 'all' && r.equipmentId !== selectedEquipmentId) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = r.description.toLowerCase().includes(q);
        const matchName = (r.equipmentName || '').toLowerCase().includes(q);
        const matchTech = r.technicianOrCompany.toLowerCase().includes(q);
        const matchParts = (r.partsReplaced || '').toLowerCase().includes(q);
        const matchRef = (r.invoiceOrReceiptNote || '').toLowerCase().includes(q);
        return matchDesc || matchName || matchTech || matchParts || matchRef;
      }

      return true;
    });
  }, [serviceRecords, selectedType, selectedEquipmentId, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-orange-500" />
            Home Equipment Service History
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Complete audit trail of all maintenance, professional repairs, DIY fixes, and parts replacements.
          </p>
        </div>

        <button
          onClick={onAddRecord}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Service</span>
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Investment</span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            {formatCurrency(metrics.totalSpend)}
          </p>
          <span className="text-[11px] text-zinc-500">Across {serviceRecords.length} service logs</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Routine Maintenance</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(metrics.routineSpend)}
          </p>
          <span className="text-[11px] text-zinc-500">Filters, flushes, tune-ups</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Repairs & Parts</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(metrics.repairSpend)}
          </p>
          <span className="text-[11px] text-zinc-500">Unscheduled repairs</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">DIY vs Pro Ratio</span>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {metrics.diyCount} / {metrics.proCount}
          </p>
          <span className="text-[11px] text-zinc-500">Self-performed vs Contractor</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search description, tech, parts replaced, receipts..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 capitalize font-medium"
          >
            <option value="all">All Service Types</option>
            <option value="routine">Routine Maintenance</option>
            <option value="repair">Repair</option>
            <option value="diy">DIY Fix</option>
            <option value="inspection">Inspection</option>
            <option value="warranty_claim">Warranty Claim</option>
            <option value="part_replacement">Part Replacement</option>
          </select>

          <select
            value={selectedEquipmentId}
            onChange={(e) => setSelectedEquipmentId(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-medium max-w-[200px]"
          >
            <option value="all">All Equipment</option>
            {equipmentList.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Service Records Table / List */}
      {filteredRecords.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <History className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
          <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-200">No service records found</h3>
          <p className="text-xs text-zinc-500 mt-1">Try resetting filters or click "Log New Service" to create your first record.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => {
            const eq = equipmentList.find((e) => e.id === record.equipmentId);

            return (
              <div
                key={record.id}
                className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col gap-2.5"
              >
                {/* Top Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {formatDate(record.date)}
                    </span>

                    <span className="capitalize px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                      {record.type.replace('_', ' ')}
                    </span>

                    {eq && (
                      <button
                        onClick={() => onSelectEquipment(eq)}
                        className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                      >
                        {record.equipmentName || eq.name} &rarr;
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(record.cost)}
                    </span>

                    <button
                      onClick={() => {
                        if (confirm('Delete this service record?')) {
                          onDeleteRecord(record.id);
                        }
                      }}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Work Description */}
                <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  {record.description}
                </p>

                {/* Footer Metadata */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex flex-wrap items-center gap-4">
                    <span>
                      Performed By: <strong className="text-zinc-700 dark:text-zinc-300">{record.technicianOrCompany || 'Self'}</strong>
                    </span>

                    {record.partsReplaced && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-orange-500" />
                        <span>Parts:</span>
                        <strong className="font-mono text-zinc-700 dark:text-zinc-300">{record.partsReplaced}</strong>
                      </span>
                    )}

                    {record.invoiceOrReceiptNote && (
                      <span className="italic">Ref: {record.invoiceOrReceiptNote}</span>
                    )}
                  </div>

                  {record.nextServiceDueDate && (
                    <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                      Next Due: {formatDate(record.nextServiceDueDate)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
