import { useState } from 'react';
import {
  FileText,
  Calendar,
  AlertTriangle,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Wrench,
  ChevronRight,
  ShieldCheck,
  Tag,
  QrCode,
  UserCheck,
  Phone,
  BellOff
} from 'lucide-react';
import { Equipment } from '../types';
import { CATEGORIES } from '../utils/categories';
import { getWarrantyStatus, getDaysDifference } from '../utils/date';

interface EquipmentCardProps {
  equipment: Equipment;
  onSelect: (equipment: Equipment) => void;
  onLogService: (equipment: Equipment) => void;
  onEdit: (equipment: Equipment) => void;
  onOpenQRCode?: (equipment: Equipment) => void;
}

export function EquipmentCard({ equipment, onSelect, onLogService, onEdit, onOpenQRCode }: EquipmentCardProps) {
  const [copiedSerial, setCopiedSerial] = useState(false);

  const categoryMeta = CATEGORIES[equipment.category] || CATEGORIES.other;
  const warrantyMeta = getWarrantyStatus(equipment.warranty);

  // Find next maintenance task
  let nextTask: { title: string; daysLeft: number | null; isOverdue: boolean } | null = null;
  if (equipment.maintenanceTasks && equipment.maintenanceTasks.length > 0) {
    const sortedTasks = [...equipment.maintenanceTasks].sort((a, b) => {
      const diffA = getDaysDifference(a.nextDueDate) ?? 9999;
      const diffB = getDaysDifference(b.nextDueDate) ?? 9999;
      return diffA - diffB;
    });

    const first = sortedTasks[0];
    const diff = getDaysDifference(first.nextDueDate);
    nextTask = {
      title: first.title,
      daysLeft: diff,
      isOverdue: diff !== null && diff < 0,
    };
  }

  const handleCopySerial = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!equipment.serialNumber) return;
    navigator.clipboard.writeText(equipment.serialNumber);
    setCopiedSerial(true);
    setTimeout(() => setCopiedSerial(false), 2000);
  };

  return (
    <div
      onClick={() => onSelect(equipment)}
      className="group relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md hover:border-orange-500/40 dark:hover:border-orange-500/40 transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${categoryMeta.bg} ${categoryMeta.text} ${categoryMeta.border}`}
          >
            {categoryMeta.label}
          </span>

          <div className="flex items-center gap-1.5">
            {(equipment.disableAlerts || equipment.warranty?.disableAlerts) && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1"
                title="Alerts are muted for this item"
              >
                <BellOff className="w-2.5 h-2.5" />
                <span>Muted</span>
              </span>
            )}
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${warrantyMeta.badgeClass}`}
              title={`Warranty: ${equipment.warranty?.type || 'Standard'} • ${equipment.warranty?.expirationDate || 'N/A'}`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>{warrantyMeta.label}</span>
            </span>
          </div>
        </div>

        {/* Name and Brand */}
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-snug">
              {equipment.name}
            </h3>
          </div>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-0.5">
            {equipment.brand} • <span className="font-mono">{equipment.modelNumber || 'No Model #'}</span>
          </p>
        </div>

        {/* Location & Serial */}
        <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/80 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Location:</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[170px]">
              {equipment.locationRoom || 'Unassigned'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Serial #:</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-zinc-800 dark:text-zinc-300">
                {equipment.serialNumber || 'N/A'}
              </span>
              {equipment.serialNumber && (
                <button
                  onClick={handleCopySerial}
                  title="Copy serial number"
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 rounded transition-colors"
                >
                  {copiedSerial ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>

          {equipment.specifications?.filterSize && (
            <div className="flex items-center justify-between border-t border-zinc-200/60 dark:border-zinc-800 pt-1.5 mt-1.5">
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Tag className="w-3 h-3 text-orange-500" /> Consumable / Filter:
              </span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200 text-right truncate max-w-[160px]" title={equipment.specifications.filterSize}>
                {equipment.specifications.filterSize}
              </span>
            </div>
          )}

          {(equipment.contractor?.name || equipment.contractorName || equipment.contractor?.phone || equipment.contractorPhone) && (
            <div className="flex items-center justify-between border-t border-zinc-200/60 dark:border-zinc-800 pt-1.5 mt-1.5">
              <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-orange-500" /> Tech:
              </span>
              <div className="flex items-center gap-1.5 text-right font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[170px]">
                <span className="truncate">
                  {equipment.contractor?.name || equipment.contractorName || equipment.contractor?.company}
                </span>
                {(equipment.contractor?.phone || equipment.contractorPhone) && (
                  <a
                    href={`tel:${equipment.contractor?.phone || equipment.contractorPhone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-orange-600 dark:text-orange-400 hover:text-orange-500 inline-flex items-center shrink-0 p-0.5"
                    title={`Call: ${equipment.contractor?.phone || equipment.contractorPhone}`}
                  >
                    <Phone className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Next Maintenance Indicator */}
        {nextTask && (
          <div className="mb-3">
            <div
              className={`flex items-start gap-2 p-2 rounded-lg text-xs border ${
                nextTask.isOverdue
                  ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60'
                  : nextTask.daysLeft !== null && nextTask.daysLeft <= 7
                  ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60'
                  : 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-300 dark:border-zinc-800'
              }`}
            >
              {nextTask.isOverdue ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{nextTask.title}</p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {nextTask.isOverdue
                    ? `Overdue by ${Math.abs(nextTask.daysLeft || 0)} days`
                    : nextTask.daysLeft === 0
                    ? 'Due today!'
                    : `Due in ${nextTask.daysLeft} days`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>{equipment.documents?.length || 0}</span>
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{equipment.maintenanceTasks?.length || 0} tasks</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenQRCode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenQRCode(equipment);
              }}
              className="p-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-colors"
              title="Print QR Code Tag & Maintenance Link"
            >
              <QrCode className="w-3.5 h-3.5 text-orange-500" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onLogService(equipment);
            }}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300/60 dark:border-zinc-700 transition-colors flex items-center gap-1"
          >
            <Wrench className="w-3 h-3 text-orange-500" />
            <span>Log Service</span>
          </button>

          <span className="text-zinc-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all">
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
