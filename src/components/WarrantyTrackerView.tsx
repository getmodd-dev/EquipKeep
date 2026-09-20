import { useState, useMemo } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Clock, Search, Filter, Phone, Send, ExternalLink, Calendar } from 'lucide-react';
import { Equipment } from '../types';
import { getWarrantyStatus, formatDate, formatCurrency, getDaysDifference } from '../utils/date';
import { CATEGORIES } from '../utils/categories';

interface WarrantyTrackerViewProps {
  equipmentList: Equipment[];
  onSelectEquipment: (equipment: Equipment) => void;
  onSendPushoverAlert: (title: string, message: string, priority?: number) => void;
}

export function WarrantyTrackerView({
  equipmentList,
  onSelectEquipment,
  onSendPushoverAlert,
}: WarrantyTrackerViewProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'expiring_soon' | 'active' | 'lifetime' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate warranty metrics
  const stats = useMemo(() => {
    let active = 0;
    let expiringSoon = 0;
    let lifetime = 0;
    let expired = 0;
    let totalProtectedValue = 0;

    equipmentList.forEach((eq) => {
      const meta = getWarrantyStatus(eq.warranty);
      if (meta.status === 'lifetime') lifetime++;
      else if (meta.status === 'expiring_soon') {
        expiringSoon++;
        if (eq.purchasePrice) totalProtectedValue += eq.purchasePrice;
      } else if (meta.status === 'active') {
        active++;
        if (eq.purchasePrice) totalProtectedValue += eq.purchasePrice;
      } else if (meta.status === 'expired') {
        expired++;
      }
    });

    return { active, expiringSoon, lifetime, expired, totalProtectedValue };
  }, [equipmentList]);

  // Filtered equipment
  const filteredList = useMemo(() => {
    return equipmentList.filter((eq) => {
      const meta = getWarrantyStatus(eq.warranty);

      // Status filter
      if (filterStatus !== 'all' && meta.status !== filterStatus) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = eq.name.toLowerCase().includes(query);
        const matchBrand = eq.brand.toLowerCase().includes(query);
        const matchModel = eq.modelNumber.toLowerCase().includes(query);
        const matchProvider = eq.warranty?.provider?.toLowerCase().includes(query);
        const matchPolicy = eq.warranty?.policyNumber?.toLowerCase().includes(query);
        return matchName || matchBrand || matchModel || matchProvider || matchPolicy;
      }

      return true;
    });
  }, [equipmentList, filterStatus, searchQuery]);

  const handleSendPushoverSummary = () => {
    const expiring = equipmentList.filter((eq) => getWarrantyStatus(eq.warranty).status === 'expiring_soon');
    if (expiring.length === 0) {
      onSendPushoverAlert(
        'Warranty Radar Status',
        'All equipment warranties are healthy! No warranties expiring in the next 30 days.',
        0
      );
      return;
    }

    let msg = `⚠️ EXPIRING WARRANTIES (${expiring.length}):\n`;
    expiring.forEach((eq) => {
      const diff = getDaysDifference(eq.warranty?.expirationDate);
      msg += `• ${eq.name}: Expires ${eq.warranty?.expirationDate} (${diff}d left). Policy: ${eq.warranty?.policyNumber || 'N/A'}\n`;
    });

    onSendPushoverAlert(`EquipKeep: ${expiring.length} Warranty Expirations Alert`, msg.trim(), 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-500" />
            Warranty Expiration Radar
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Monitor factory warranties, extended protection plans, and claims contacts across all appliances.
          </p>
        </div>

        <button
          onClick={handleSendPushoverSummary}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Send className="w-3.5 h-3.5 text-amber-400" />
          <span>Push Warranty Status to Phone</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setFilterStatus('all')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterStatus === 'all'
              ? 'bg-orange-50/60 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800/80 shadow-sm'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Tracked</span>
            <Shield className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{equipmentList.length}</p>
          <span className="text-[11px] text-zinc-500">Equipment in inventory</span>
        </div>

        <div
          onClick={() => setFilterStatus('expiring_soon')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterStatus === 'expiring_soon'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 shadow-sm'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Expiring Soon</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.expiringSoon}</p>
          <span className="text-[11px] text-zinc-500">&le; 30 days remaining</span>
        </div>

        <div
          onClick={() => setFilterStatus('active')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterStatus === 'active'
              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 shadow-sm'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Active Plans</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.active}</p>
          <span className="text-[11px] text-zinc-500">In full manufacturer/ext coverage</span>
        </div>

        <div
          onClick={() => setFilterStatus('lifetime')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterStatus === 'lifetime'
              ? 'bg-teal-50/60 dark:bg-teal-950/30 border-teal-300 dark:border-teal-800/80 shadow-sm'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-teal-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-teal-700 dark:text-teal-300">Lifetime Cover</span>
            <Shield className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">{stats.lifetime}</p>
          <span className="text-[11px] text-zinc-500">No expiration limit</span>
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
            placeholder="Search brand, model, policy #, provider..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-zinc-400 flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>

          <button
            onClick={() => setFilterStatus('all')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('expiring_soon')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'expiring_soon'
                ? 'bg-amber-600 text-white'
                : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            Expiring Soon
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'active'
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('lifetime')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'lifetime'
                ? 'bg-teal-600 text-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Lifetime
          </button>
          <button
            onClick={() => setFilterStatus('expired')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterStatus === 'expired'
                ? 'bg-zinc-600 text-white'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Expired
          </button>
        </div>
      </div>

      {/* Warranty Records List */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <Shield className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
          <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-200">No warranty records matched</h3>
          <p className="text-xs text-zinc-500 mt-1">Try clearing search filters or add warranty terms to your equipment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((eq) => {
            const meta = getWarrantyStatus(eq.warranty);
            const categoryMeta = CATEGORIES[eq.category] || CATEGORIES.other;

            return (
              <div
                key={eq.id}
                onClick={() => onSelectEquipment(eq)}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm hover:shadow-md hover:border-orange-500/40 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${categoryMeta.bg} ${categoryMeta.text} ${categoryMeta.border}`}>
                      {categoryMeta.label}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.badgeClass}`}>
                      {meta.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 leading-snug">
                    {eq.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {eq.brand} • <span className="font-mono">{eq.modelNumber || 'No Model #'}</span>
                  </p>

                  <div className="mt-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Provider:</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">
                        {eq.warranty?.provider || 'Manufacturer Direct'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Policy / ID:</span>
                      <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                        {eq.warranty?.policyNumber || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Expires:</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {eq.warranty?.hasLifetimeWarranty ? 'Lifetime (No Expiry)' : formatDate(eq.warranty?.expirationDate)}
                      </span>
                    </div>

                    {eq.warranty?.contactPhoneOrUrl && (
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 dark:border-zinc-800">
                        <span className="text-zinc-500">Claims:</span>
                        <span className="text-orange-600 dark:text-orange-400 font-medium truncate max-w-[200px]">
                          {eq.warranty.contactPhoneOrUrl}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                  <span>Purchased: {formatDate(eq.purchaseDate)}</span>
                  <span className="text-orange-600 dark:text-orange-400 font-medium">View full policy &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
