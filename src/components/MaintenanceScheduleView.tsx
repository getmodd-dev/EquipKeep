import { useState, useMemo } from 'react';
import {
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  Search,
  Filter,
  Tag,
  Wrench,
  ChevronRight
} from 'lucide-react';
import { Equipment, MaintenanceTask } from '../types';
import { getDaysDifference, formatDate } from '../utils/date';
import { CATEGORIES } from '../utils/categories';

interface MaintenanceScheduleViewProps {
  equipmentList: Equipment[];
  onSelectEquipment: (equipment: Equipment) => void;
  onLogServiceForTask: (equipment: Equipment, task: MaintenanceTask) => void;
  onSendPushoverAlert: (title: string, message: string, priority?: number) => void;
}

interface FlattenedTask {
  equipment: Equipment;
  task: MaintenanceTask;
  daysLeft: number | null;
  isOverdue: boolean;
  isDueSoon: boolean;
}

export function MaintenanceScheduleView({
  equipmentList,
  onSelectEquipment,
  onLogServiceForTask,
  onSendPushoverAlert,
}: MaintenanceScheduleViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Flatten all tasks
  const allTasks: FlattenedTask[] = useMemo(() => {
    const list: FlattenedTask[] = [];

    equipmentList.forEach((eq) => {
      eq.maintenanceTasks?.forEach((task) => {
        const days = getDaysDifference(task.nextDueDate);
        list.push({
          equipment: eq,
          task,
          daysLeft: days,
          isOverdue: days !== null && days < 0,
          isDueSoon: days !== null && days >= 0 && days <= 30,
        });
      });
    });

    // Sort by due date ascending (overdue first, then soonest)
    list.sort((a, b) => {
      const dayA = a.daysLeft ?? 9999;
      const dayB = b.daysLeft ?? 9999;
      return dayA - dayB;
    });

    return list;
  }, [equipmentList]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return allTasks.filter(({ equipment, task }) => {
      if (selectedCategory !== 'all' && equipment.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchEq = equipment.name.toLowerCase().includes(q);
        const matchBrand = equipment.brand.toLowerCase().includes(q);
        const matchSpecs = task.filterOrPartSpecs?.toLowerCase().includes(q);
        return matchTitle || matchEq || matchBrand || matchSpecs;
      }
      return true;
    });
  }, [allTasks, selectedCategory, searchQuery]);

  const overdueList = filteredTasks.filter((t) => t.isOverdue);
  const dueSoonList = filteredTasks.filter((t) => t.isDueSoon);
  const upcomingList = filteredTasks.filter((t) => !t.isOverdue && !t.isDueSoon);

  const handleSendMaintenancePush = () => {
    if (overdueList.length === 0 && dueSoonList.length === 0) {
      onSendPushoverAlert(
        'EquipKeep Maintenance',
        'All equipment maintenance is currently up to date! No tasks overdue.',
        0
      );
      return;
    }

    let msg = '';
    if (overdueList.length > 0) {
      msg += `🚨 OVERDUE MAINTENANCE (${overdueList.length}):\n`;
      overdueList.slice(0, 3).forEach(({ equipment, task, daysLeft }) => {
        msg += `• ${equipment.name}: ${task.title} (${Math.abs(daysLeft || 0)}d overdue)\n`;
      });
      if (overdueList.length > 3) msg += `+ ${overdueList.length - 3} more overdue\n`;
      msg += '\n';
    }

    if (dueSoonList.length > 0) {
      msg += `📅 DUE NEXT 30 DAYS (${dueSoonList.length}):\n`;
      dueSoonList.slice(0, 3).forEach(({ equipment, task, daysLeft }) => {
        msg += `• ${equipment.name}: ${task.title} (in ${daysLeft}d)\n`;
      });
    }

    onSendPushoverAlert('Maintenance Alert • EquipKeep', msg.trim(), overdueList.length > 0 ? 1 : 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            Recurring Maintenance Schedule
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Keep appliances in peak condition with automated schedule tracking and Pushover phone alerts.
          </p>
        </div>

        <button
          onClick={handleSendMaintenancePush}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Send className="w-3.5 h-3.5 text-amber-400" />
          <span>Push Maintenance Alert to Phone</span>
        </button>
      </div>

      {/* Metric summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
          <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">Overdue Tasks</span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{overdueList.length}</p>
          <span className="text-[11px] text-zinc-500">Requires immediate attention</span>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Due Next 30 Days</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{dueSoonList.length}</p>
          <span className="text-[11px] text-zinc-500">Order filters / prepare parts</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Total Tasks Monitored</span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{allTasks.length}</p>
          <span className="text-[11px] text-zinc-500">Across {equipmentList.length} appliances</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search task, equipment, filter part #..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-zinc-400 shrink-0">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-medium"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORIES).map(([catKey, val]) => (
              <option key={catKey} value={catKey}>
                {val.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TASK SECTIONS */}
      <div className="space-y-6">
        {/* OVERDUE TASKS */}
        {overdueList.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Overdue Tasks ({overdueList.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {overdueList.map(({ equipment, task, daysLeft }) => (
                <div
                  key={`${equipment.id}-${task.id}`}
                  className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        onClick={() => onSelectEquipment(equipment)}
                        className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-orange-500 cursor-pointer flex items-center gap-1"
                      >
                        {equipment.name} &rarr;
                      </span>
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full">
                        {Math.abs(daysLeft || 0)}d Overdue
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{task.title}</h4>

                    {task.instructions && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                        {task.instructions}
                      </p>
                    )}

                    {task.filterOrPartSpecs && (
                      <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-orange-500" />
                        <span>Part Spec:</span>
                        <span className="font-medium font-mono text-zinc-800 dark:text-zinc-200">
                          {task.filterOrPartSpecs}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Every {task.intervalDays} days</span>

                    <button
                      onClick={() => onLogServiceForTask(equipment, task)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Done & Log</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DUE NEXT 30 DAYS */}
        {dueSoonList.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Due in Next 30 Days ({dueSoonList.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dueSoonList.map(({ equipment, task, daysLeft }) => (
                <div
                  key={`${equipment.id}-${task.id}`}
                  className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        onClick={() => onSelectEquipment(equipment)}
                        className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-orange-500 cursor-pointer flex items-center gap-1"
                      >
                        {equipment.name} &rarr;
                      </span>
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                        {daysLeft === 0 ? 'Due Today' : `In ${daysLeft} days`}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{task.title}</h4>

                    {task.instructions && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                        {task.instructions}
                      </p>
                    )}

                    {task.filterOrPartSpecs && (
                      <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-orange-500" />
                        <span>Part Spec:</span>
                        <span className="font-medium font-mono text-zinc-800 dark:text-zinc-200">
                          {task.filterOrPartSpecs}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Scheduled: {formatDate(task.nextDueDate)}</span>

                    <button
                      onClick={() => onLogServiceForTask(equipment, task)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Done</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UPCOMING SCHEDULED TASKS */}
        {upcomingList.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-zinc-400" />
              Upcoming Scheduled Maintenance ({upcomingList.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upcomingList.map(({ equipment, task, daysLeft }) => (
                <div
                  key={`${equipment.id}-${task.id}`}
                  className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        onClick={() => onSelectEquipment(equipment)}
                        className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-orange-500 cursor-pointer"
                      >
                        {equipment.name}
                      </span>
                      <span className="text-[11px] font-medium text-zinc-500">
                        In {daysLeft} days
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{task.title}</h4>

                    {task.instructions && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {task.instructions}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                    <span>Due: {formatDate(task.nextDueDate)}</span>

                    <button
                      onClick={() => onLogServiceForTask(equipment, task)}
                      className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                    >
                      Log Early
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {allTasks.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <Calendar className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
            <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-200">No maintenance tasks scheduled</h3>
            <p className="text-xs text-zinc-500 mt-1">Open an appliance to add recurring maintenance tasks or apply AI suggestions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
