import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Search,
  CheckSquare,
  Clock,
  DollarSign,
  UserCheck,
  CheckCircle2,
  Trash2,
  Edit2,
  AlertTriangle,
  RotateCw,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { HomeProject, ProjectCategory, ProjectStatus } from '../types';
import { PROJECT_CATEGORIES, PROJECT_RECURRENCE_LABELS } from '../utils/categories';
import { ProjectModal } from './ProjectModal';

interface ProjectPlanningViewProps {
  projects: HomeProject[];
  onAddProject: (project: Partial<HomeProject>) => Promise<void>;
  onUpdateProject: (id: string, project: Partial<HomeProject>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onCompleteProject: (id: string, logServiceRecord: boolean, actualCost?: number) => Promise<void>;
}

export function ProjectPlanningView({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onCompleteProject,
}: ProjectPlanningViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<HomeProject | null>(null);

  // Completion modal state
  const [completingProject, setCompletingProject] = useState<HomeProject | null>(null);
  const [logAsServiceRecord, setLogAsServiceRecord] = useState(true);
  const [completionCost, setCompletionCost] = useState('');

  // Quick stats
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === 'scheduled' || p.status === 'in_progress').length;
    const planned = projects.filter((p) => p.status === 'planned').length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    const totalEstCost = projects.reduce((acc, p) => acc + (p.estimatedCost || 0), 0);
    const totalActCost = projects.reduce((acc, p) => acc + (p.actualCost || 0), 0);
    return { total, active, planned, completed, totalEstCost, totalActCost };
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = (p.description || '').toLowerCase().includes(q);
        const matchMat = (p.materialsNeeded || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchMat) return false;
      }
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedSeason !== 'all' && p.season !== selectedSeason) return false;
      if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
      return true;
    });
  }, [projects, searchQuery, selectedCategory, selectedSeason, selectedStatus]);

  const handleToggleChecklistItem = async (project: HomeProject, itemId: string, completed: boolean) => {
    const updatedChecklist = (project.checklist || []).map((item) =>
      item.id === itemId ? { ...item, completed } : item
    );
    await onUpdateProject(project.id, { checklist: updatedChecklist });
  };

  const handleConfirmCompletion = async () => {
    if (!completingProject) return;
    const costNum = parseFloat(completionCost) || completingProject.actualCost || completingProject.estimatedCost || 0;
    await onCompleteProject(completingProject.id, logAsServiceRecord, costNum);
    setCompletingProject(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active Projects</span>
            <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.active}</span>
            <span className="text-xs text-zinc-500">of {stats.total} total scheduled</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Planned / Backlog</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.planned}</span>
            <span className="text-xs text-zinc-500">awaiting target date</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Completed</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.completed}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Logged & historical</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Est. Budget</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">${stats.totalEstCost.toLocaleString()}</span>
            <span className="text-xs text-zinc-500">actual: ${stats.totalActCost.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Action Header & Filters */}
      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search upkeep projects (gutters, painting, mulch, lawn)..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {/* Add Project Button */}
          <button
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Plan New Project
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
          <div className="flex items-center gap-1 text-zinc-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {Object.entries(PROJECT_CATEGORIES).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>

          {/* Season Dropdown */}
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
          >
            <option value="all">All Seasons</option>
            <option value="spring">Spring 🌱</option>
            <option value="summer">Summer ☀️</option>
            <option value="fall">Fall 🍂</option>
            <option value="winter">Winter ❄️</option>
            <option value="year_round">Year-Round 🗓️</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="planned">Planned</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {(selectedCategory !== 'all' || selectedSeason !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSeason('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="text-orange-600 dark:text-orange-400 hover:underline text-xs ml-auto font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Projects List / Grid */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <Calendar className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">No Upkeep Projects Found</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
            Get started by scheduling recurring maintenance like cleaning gutters, exterior painting, or seasonal landscaping.
          </p>
          <button
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
            className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Plan First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const catInfo = PROJECT_CATEGORIES[project.category] || PROJECT_CATEGORIES.general_home;
            const completedChecklistCount = (project.checklist || []).filter((c) => c.completed).length;
            const totalChecklistCount = (project.checklist || []).length;
            const progressPercent = totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;

            // Target date calculations
            const target = new Date(project.targetDate);
            const now = new Date();
            const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 3600 * 24));
            const isOverdue = diffDays < 0 && project.status !== 'completed';

            return (
              <div
                key={project.id}
                className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-4 space-y-3.5">
                  {/* Category & Status Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${catInfo.bg} ${catInfo.text} ${catInfo.border}`}>
                        {catInfo.label}
                      </span>
                      {project.season && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 capitalize">
                          {project.season}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          project.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : project.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : project.status === 'scheduled'
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        {project.status.replace('_', ' ')}
                      </span>

                      <button
                        onClick={() => {
                          setEditingProject(project);
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Edit project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete project "${project.title}"?`)) {
                            onDeleteProject(project.id);
                          }
                        }}
                        className="p-1 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">{project.title}</h3>
                    {project.description && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">{project.description}</p>
                    )}
                  </div>

                  {/* Key Metadata Row */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>
                        Due:{' '}
                        <strong className={isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100'}>
                          {project.targetDate}
                        </strong>
                        {isOverdue && <span className="text-[10px] text-rose-500 font-bold ml-1">(Overdue)</span>}
                        {!isOverdue && diffDays >= 0 && diffDays <= 60 && (
                          <span className="text-[10px] text-zinc-500 ml-1">({diffDays === 0 ? 'Today' : `in ${diffDays}d`})</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                      <RotateCw className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{PROJECT_RECURRENCE_LABELS[project.recurrence] || project.recurrence}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                      <UserCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>
                        {project.assignedType === 'contractor' ? (
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            Pro: {project.contractorName || 'Contractor'}
                          </span>
                        ) : (
                          <span>DIY Self-Work</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                      <DollarSign className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>
                        Est: <strong>${project.estimatedCost || 0}</strong>
                        {project.actualCost ? ` / Act: $${project.actualCost}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Materials & Tools requirement note */}
                  {project.materialsNeeded && (
                    <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400">
                      <strong className="text-zinc-700 dark:text-zinc-300">Required:</strong> {project.materialsNeeded}
                    </div>
                  )}

                  {/* Checklist & Progress */}
                  {totalChecklistCount > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                          <CheckSquare className="w-3.5 h-3.5 text-orange-500" />
                          Checklist ({completedChecklistCount}/{totalChecklistCount})
                        </span>
                        <span className="text-zinc-500 font-mono">{progressPercent}%</span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 transition-all duration-300 rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      {/* Quick checklist items */}
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {project.checklist.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-start gap-2 p-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer text-xs transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={(e) => handleToggleChecklistItem(project, item.id, e.target.checked)}
                              className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                            />
                            <span className={`text-[11px] leading-tight ${item.completed ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                              {item.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-zinc-500">
                    {project.lastCompletedDate ? (
                      <span>Last done: {project.lastCompletedDate}</span>
                    ) : (
                      <span>Not yet logged</span>
                    )}
                  </div>

                  {project.status !== 'completed' ? (
                    <button
                      onClick={() => {
                        setCompletingProject(project);
                        setCompletionCost(project.actualCost?.toString() || project.estimatedCost?.toString() || '0');
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Completed
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Modal (Add/Edit) */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        onSave={async (data) => {
          if (editingProject) {
            await onUpdateProject(editingProject.id, data);
          } else {
            await onAddProject(data);
          }
        }}
        projectToEdit={editingProject}
      />

      {/* Completion Confirmation Dialog */}
      {completingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Complete Project</h3>
                <p className="text-zinc-500 text-[11px]">{completingProject.title}</p>
              </div>
            </div>

            <p className="text-zinc-600 dark:text-zinc-400">
              Marking this project completed will log today&apos;s completion date. If it is a recurring task (e.g.{' '}
              <strong>{PROJECT_RECURRENCE_LABELS[completingProject.recurrence]}</strong>), it will automatically advance to
              the next scheduled cycle.
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">Final / Actual Cost ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={completionCost}
                  onChange={(e) => setCompletionCost(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={logAsServiceRecord}
                  onChange={(e) => setLogAsServiceRecord(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                  Log permanent entry in <strong>Service Records</strong>
                </span>
              </label>
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCompletingProject(null)}
                className="px-4 py-2 font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCompletion}
                className="px-4 py-2 font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
              >
                Complete & Schedule Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
