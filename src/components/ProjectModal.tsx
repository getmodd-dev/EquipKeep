import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, CheckSquare, DollarSign, UserCheck, Sparkles } from 'lucide-react';
import { HomeProject, ProjectCategory, ProjectRecurrence, ProjectStatus } from '../types';
import { PROJECT_CATEGORIES, PROJECT_RECURRENCE_LABELS } from '../utils/categories';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Partial<HomeProject>) => Promise<void>;
  projectToEdit?: HomeProject | null;
}

const TEMPLATES: Array<{
  name: string;
  title: string;
  category: ProjectCategory;
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'year_round';
  recurrence: ProjectRecurrence;
  estimatedCost: number;
  assignedType: 'diy' | 'contractor';
  description: string;
  materialsNeeded: string;
  checklist: string[];
}> = [
  {
    name: '🍂 Gutter Cleaning',
    title: 'Clean Gutters & Downspouts',
    category: 'gutters_roof',
    season: 'fall',
    recurrence: 'seasonal_fall',
    estimatedCost: 0,
    assignedType: 'diy',
    description: 'Clear leaves, needles, and debris from gutters and flush all downspouts to prevent overflow.',
    materialsNeeded: 'Ladder standoff stabilizer, gutter scoop, bucket, hose nozzle',
    checklist: [
      'Position ladder safely with standoff stabilizer on fascia',
      'Scoop accumulated wet leaves into bucket for yard waste',
      'Flush downspouts with garden hose to verify free drainage',
      'Check gutter pitch and secure loose spike/ferrule brackets',
    ],
  },
  {
    name: '🎨 Exterior Painting',
    title: 'Exterior Siding, Trim & Door Painting',
    category: 'painting_exterior',
    season: 'summer',
    recurrence: 'multi_year',
    estimatedCost: 250,
    assignedType: 'diy',
    description: 'Scrape loose paint, sand, prime bare wood, and apply two coats of premium exterior satin.',
    materialsNeeded: 'Exterior primer, exterior acrylic satin paint, sash brushes, drop cloths, scraper',
    checklist: [
      'Wash mildew and dirt off surface and allow 48h to dry',
      'Scrape peeling edges and sand feathered edges smooth',
      'Spot prime raw exposed wood with exterior primer',
      'Caulk gaps around trim with exterior acrylic urethane',
      'Apply 2 coats of exterior finish paint',
    ],
  },
  {
    name: '🌱 Spring Landscaping & Mulch',
    title: 'Spring Landscaping, Lawn Aeration & Mulch',
    category: 'landscaping_grounds',
    season: 'spring',
    recurrence: 'seasonal_spring',
    estimatedCost: 300,
    assignedType: 'diy',
    description: 'Core aerate lawn, spade trench bed edges, apply pre-emergent fertilizer, and spread hardwood mulch.',
    materialsNeeded: 'Hardwood shredded mulch (3-5 cu yds), pre-emergent fertilizer, spade shovel, wheelbarrow',
    checklist: [
      'Core aerate lawn while soil is moist',
      'Cut clean 3-inch trench edges along garden beds and walkways',
      'Pull spring weeds and apply pre-emergent herbicide',
      'Spread 2 to 3 inches of fresh mulch around plants and trees',
    ],
  },
  {
    name: '🪵 Deck Power Wash & Seal',
    title: 'Deck Power Washing & Protective Staining',
    category: 'deck_patio',
    season: 'spring',
    recurrence: 'biannual',
    estimatedCost: 120,
    assignedType: 'diy',
    description: 'Gentle pressure wash wood decking, let dry completely, and roll penetrating semi-transparent sealant.',
    materialsNeeded: 'Deck cleaner wash, penetrating oil-based or acrylic stain, roller & extension pole',
    checklist: [
      'Sweep deck clear and apply deck wash solution',
      'Rinse with low pressure (under 1200 PSI) along grain',
      'Let wood dry 72 hours under warm sunshine',
      'Apply uniform coat of deck stain with roller and back-brush',
    ],
  },
];

export function ProjectModal({ isOpen, onClose, onSave, projectToEdit }: ProjectModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('gutters_roof');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [season, setSeason] = useState<'spring' | 'summer' | 'fall' | 'winter' | 'year_round'>('fall');
  const [status, setStatus] = useState<ProjectStatus>('planned');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [recurrence, setRecurrence] = useState<ProjectRecurrence>('annual');
  const [estimatedCost, setEstimatedCost] = useState<string>('0');
  const [actualCost, setActualCost] = useState<string>('0');
  const [assignedType, setAssignedType] = useState<'diy' | 'contractor'>('diy');
  const [contractorName, setContractorName] = useState('');
  const [contractorContact, setContractorContact] = useState('');
  const [contractorQuote, setContractorQuote] = useState('');
  const [materialsNeeded, setMaterialsNeeded] = useState('');
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState<Array<{ id: string; text: string; completed: boolean }>>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setTitle(projectToEdit.title || '');
      setCategory(projectToEdit.category || 'gutters_roof');
      setDescription(projectToEdit.description || '');
      setTargetDate(projectToEdit.targetDate || '');
      setSeason(projectToEdit.season || 'fall');
      setStatus(projectToEdit.status || 'planned');
      setPriority(projectToEdit.priority || 'normal');
      setRecurrence(projectToEdit.recurrence || 'annual');
      setEstimatedCost(projectToEdit.estimatedCost?.toString() || '0');
      setActualCost(projectToEdit.actualCost?.toString() || '0');
      setAssignedType(projectToEdit.assignedType || 'diy');
      setContractorName(projectToEdit.contractorName || '');
      setContractorContact(projectToEdit.contractorContact || '');
      setContractorQuote(projectToEdit.contractorQuote || '');
      setMaterialsNeeded(projectToEdit.materialsNeeded || '');
      setNotes(projectToEdit.notes || '');
      setChecklist(projectToEdit.checklist || []);
    } else {
      // Default to 1 month from today
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setTitle('');
      setCategory('gutters_roof');
      setDescription('');
      setTargetDate(defaultDate.toISOString().split('T')[0]);
      setSeason('fall');
      setStatus('planned');
      setPriority('normal');
      setRecurrence('annual');
      setEstimatedCost('0');
      setActualCost('0');
      setAssignedType('diy');
      setContractorName('');
      setContractorContact('');
      setContractorQuote('');
      setMaterialsNeeded('');
      setNotes('');
      setChecklist([
        { id: `c-${Date.now()}-1`, text: 'Gather tools and safety equipment', completed: false },
        { id: `c-${Date.now()}-2`, text: 'Inspect area and execute work', completed: false },
        { id: `c-${Date.now()}-3`, text: 'Clean up debris and check results', completed: false },
      ]);
    }
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    setTitle(tmpl.title);
    setCategory(tmpl.category);
    setSeason(tmpl.season);
    setRecurrence(tmpl.recurrence);
    setEstimatedCost(tmpl.estimatedCost.toString());
    setAssignedType(tmpl.assignedType);
    setDescription(tmpl.description);
    setMaterialsNeeded(tmpl.materialsNeeded);
    setChecklist(
      tmpl.checklist.map((item, idx) => ({
        id: `c-tmpl-${Date.now()}-${idx}`,
        text: item,
        completed: false,
      }))
    );
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklist((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        text: newChecklistText.trim(),
        completed: false,
      },
    ]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        category,
        description: description.trim(),
        targetDate,
        season,
        status,
        priority,
        recurrence,
        estimatedCost: parseFloat(estimatedCost) || 0,
        actualCost: parseFloat(actualCost) || 0,
        assignedType,
        contractorName: assignedType === 'contractor' ? contractorName.trim() : undefined,
        contractorContact: assignedType === 'contractor' ? contractorContact.trim() : undefined,
        contractorQuote: assignedType === 'contractor' ? contractorQuote.trim() : undefined,
        materialsNeeded: materialsNeeded.trim(),
        notes: notes.trim(),
        checklist,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              {projectToEdit ? 'Edit Home Upkeep Project' : 'New Home Project & Schedule'}
            </h2>
            <p className="text-xs text-zinc-500">Plan recurring or one-time maintenance (gutters, painting, landscaping, etc.)</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Quick Template Picker (if creating new) */}
          {!projectToEdit && (
            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-orange-800 dark:text-orange-300 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <span>Quick Start from Template:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium border border-orange-200 dark:border-orange-800/60 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors shadow-2xs"
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Clean Gutters & Downspouts, Exterior Painting, Spring Mulch"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              >
                {Object.entries(PROJECT_CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Recurrence Interval</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as ProjectRecurrence)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              >
                {Object.entries(PROJECT_RECURRENCE_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Date, Season, Status, Priority */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Scheduled Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Target Season</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as any)}
                className="w-full px-2.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              >
                <option value="spring">Spring 🌱</option>
                <option value="summer">Summer ☀️</option>
                <option value="fall">Fall 🍂</option>
                <option value="winter">Winter ❄️</option>
                <option value="year_round">Year-Round 🗓️</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-2.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              >
                <option value="planned">Planned</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-2.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-orange-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Execution: DIY vs Contractor */}
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-orange-500" />
                Execution Mode
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssignedType('diy')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    assignedType === 'diy'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  DIY (Self)
                </button>
                <button
                  type="button"
                  onClick={() => setAssignedType('contractor')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    assignedType === 'contractor'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  Contractor / Pro
                </button>
              </div>
            </div>

            {assignedType === 'contractor' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Contractor / Company</label>
                  <input
                    type="text"
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    placeholder="e.g. Apex Gutter Pros"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Contact / Phone / Email</label>
                  <input
                    type="text"
                    value={contractorContact}
                    onChange={(e) => setContractorContact(e.target.value)}
                    placeholder="555-0192 / info@apex.com"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Quote / Estimate Details</label>
                  <input
                    type="text"
                    value={contractorQuote}
                    onChange={(e) => setContractorQuote(e.target.value)}
                    placeholder="$250 quoted via email"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>
            )}

            {/* Cost Tracker */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
                  Estimated Cost ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  Actual Cost ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Description & Materials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Scope & Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What needs to be done, specific areas, safety measures..."
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Required Materials & Tools</label>
              <textarea
                rows={3}
                value={materialsNeeded}
                onChange={(e) => setMaterialsNeeded(e.target.value)}
                placeholder="Paint color codes, mulch cubic yards, ladder, filter, gloves..."
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Checklist Tasks */}
          <div className="space-y-2">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-orange-500" />
                Checklist Steps ({checklist.filter((c) => c.completed).length}/{checklist.length})
              </span>
            </label>

            {checklist.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(e) =>
                          setChecklist((prev) =>
                            prev.map((c) => (c.id === item.id ? { ...c, completed: e.target.checked } : c))
                          )
                        }
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className={`text-xs truncate ${item.completed ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                        {item.text}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="text-zinc-400 hover:text-rose-500 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                placeholder="Add checklist step (e.g. Scrape flaking paint, Flush downspout)..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 font-semibold text-zinc-700 dark:text-zinc-200 rounded-lg flex items-center gap-1 border border-zinc-300 dark:border-zinc-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Step
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : projectToEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
