import { EquipmentCategory } from '../types';

export interface CategoryInfo {
  id: EquipmentCategory;
  label: string;
  iconName: string;
  colorClass: string;
}

export const CATEGORIES: Record<EquipmentCategory, { label: string; bg: string; text: string; border: string }> = {
  hvac: {
    label: 'HVAC & Climate',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800/60',
  },
  kitchen: {
    label: 'Kitchen Appliances',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/60',
  },
  laundry: {
    label: 'Laundry',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800/60',
  },
  plumbing: {
    label: 'Plumbing & Water',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800/60',
  },
  workshop: {
    label: 'Workshop & Garage',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800/60',
  },
  lawn_garden: {
    label: 'Lawn & Garden',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/60',
  },
  electrical: {
    label: 'Electrical & Power',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800/60',
  },
  smart_home: {
    label: 'Smart Home & Network',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-800/60',
  },
  other: {
    label: 'Other Equipment',
    bg: 'bg-zinc-50 dark:bg-zinc-800/60',
    text: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-200 dark:border-zinc-700',
  },
};
