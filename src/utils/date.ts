import { WarrantyStatus, Equipment } from '../types';

export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getDaysDifference(targetDateString?: string): number | null {
  if (!targetDateString) return null;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = targetDateString.split('-');
    let target: Date;
    if (parts.length === 3) {
      target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      target = new Date(targetDateString);
    }
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

export function getWarrantyStatus(
  warranty?: Equipment['warranty']
): { status: WarrantyStatus; daysRemaining: number | null; label: string; badgeClass: string } {
  if (!warranty) {
    return { status: 'none', daysRemaining: null, label: 'No Warranty', badgeClass: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' };
  }

  if (warranty.hasLifetimeWarranty || warranty.type === 'lifetime') {
    return { status: 'lifetime', daysRemaining: null, label: 'Lifetime Warranty', badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60' };
  }

  if (!warranty.expirationDate) {
    return { status: 'none', daysRemaining: null, label: 'Unknown', badgeClass: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' };
  }

  const days = getDaysDifference(warranty.expirationDate);
  if (days === null) {
    return { status: 'none', daysRemaining: null, label: 'Invalid Date', badgeClass: 'bg-zinc-100 text-zinc-600' };
  }

  if (days < 0) {
    const expiredDaysAgo = Math.abs(days);
    return {
      status: 'expired',
      daysRemaining: days,
      label: `Expired (${expiredDaysAgo}d ago)`,
      badgeClass: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200/60 dark:border-red-800/60',
    };
  }

  if (days <= 30) {
    return {
      status: 'expiring_soon',
      daysRemaining: days,
      label: days === 0 ? 'Expires Today' : `Expires in ${days}d`,
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 font-medium',
    };
  }

  if (days <= 90) {
    return {
      status: 'active',
      daysRemaining: days,
      label: `Expires in ${days}d`,
      badgeClass: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300 border border-yellow-200/60 dark:border-yellow-800/60',
    };
  }

  const years = (days / 365.25).toFixed(1);
  return {
    status: 'active',
    daysRemaining: days,
    label: `Active (${years} yrs left)`,
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60',
  };
}

export function formatCurrency(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val);
}

export function addDaysToDate(baseDateString: string, days: number): string {
  const parts = baseDateString.split('-');
  let d: Date;
  if (parts.length === 3) {
    d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    d = new Date(baseDateString);
  }
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
