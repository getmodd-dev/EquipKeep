import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  ExternalLink,
  Tag,
  Wrench,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Settings2,
  HardDrive
} from 'lucide-react';
import { Equipment } from '../types';
import { CATEGORIES } from '../utils/categories';
import { formatDate } from '../utils/date';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  allEquipment?: Equipment[];
  onSelectEquipment?: (eq: Equipment) => void;
}

type LabelSize = 'standard' | 'compact' | 'badge';

export function QRCodeModal({
  isOpen,
  onClose,
  equipment: initialEquipment,
  allEquipment = [],
}: QRCodeModalProps) {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(
    initialEquipment?.id || allEquipment[0]?.id || ''
  );
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>([]);
  const [labelSize, setLabelSize] = useState<LabelSize>('standard');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Custom host URL settings (homelab local IP vs cloud URL)
  const [customHost, setCustomHost] = useState('');
  const [isEditingHost, setIsEditingHost] = useState(false);

  // Label options
  const [showFilterSpecs, setShowFilterSpecs] = useState(true);
  const [showSerial, setShowSerial] = useState(true);
  const [showNextDue, setShowNextDue] = useState(true);
  const [showLocation, setShowLocation] = useState(true);

  // Cache of QR data URLs for rendering
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Active single equipment
  const currentEquipment =
    allEquipment.find((e) => e.id === selectedEquipmentId) || initialEquipment || allEquipment[0];

  // Initialize host and batch list on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const defaultOrigin = window.location.origin;
      setCustomHost(defaultOrigin);
    }
    if (allEquipment.length > 0) {
      setBatchSelectedIds(allEquipment.map((e) => e.id));
    }
  }, [allEquipment]);

  useEffect(() => {
    if (initialEquipment) {
      setSelectedEquipmentId(initialEquipment.id);
      setIsBatchMode(false);
    }
  }, [initialEquipment]);

  // Construct target deep-link URL for an equipment item
  const getEquipmentUrl = (eqId: string): string => {
    const base = (customHost || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
    return `${base}/?equipment=${encodeURIComponent(eqId)}`;
  };

  // Generate QR codes using qrcode library
  useEffect(() => {
    if (!isOpen) return;

    const generateCodes = async () => {
      setIsGeneratingQr(true);
      const newUrls: Record<string, string> = {};

      const itemsToGenerate = isBatchMode
        ? allEquipment.filter((e) => batchSelectedIds.includes(e.id))
        : currentEquipment
        ? [currentEquipment]
        : [];

      for (const item of itemsToGenerate) {
        const url = getEquipmentUrl(item.id);
        try {
          const dataUrl = await QRCode.toDataURL(url, {
            width: 320,
            margin: 1,
            color: {
              dark: '#09090b',
              light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
          });
          newUrls[item.id] = dataUrl;
        } catch (err) {
          console.error(`Failed to generate QR for ${item.name}:`, err);
        }
      }

      setQrCodeDataUrls((prev) => ({ ...prev, ...newUrls }));
      setIsGeneratingQr(false);
    };

    generateCodes();
  }, [isOpen, isBatchMode, selectedEquipmentId, batchSelectedIds, customHost, allEquipment]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!currentEquipment) return;
    const url = getEquipmentUrl(currentEquipment.id);
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSingleQr = (eq: Equipment) => {
    const dataUrl = qrCodeDataUrls[eq.id];
    if (!dataUrl) return;

    const safeName = (eq.brand ? `${eq.brand}_` : '') + eq.name.replace(/[^a-zA-Z0-9]/g, '_');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `EquipKeep_QR_${safeName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleToggleBatchId = (id: string) => {
    setBatchSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllBatch = () => {
    if (batchSelectedIds.length === allEquipment.length) {
      setBatchSelectedIds([]);
    } else {
      setBatchSelectedIds(allEquipment.map((e) => e.id));
    }
  };

  // Helper to render individual label content
  const renderLabelCard = (eq: Equipment, size: LabelSize = labelSize) => {
    const qrSrc = qrCodeDataUrls[eq.id];
    const category = CATEGORIES[eq.category] || CATEGORIES.other;
    const nextTask = eq.maintenanceTasks?.[0];

    if (size === 'compact') {
      // 2" x 1.5" Mini Sticker
      return (
        <div
          key={eq.id}
          className="print-label-card bg-white text-zinc-900 border-2 border-zinc-900 rounded-lg p-2.5 flex items-center gap-3 w-full max-w-[280px] shadow-xs select-none"
        >
          <div className="shrink-0 w-20 h-20 bg-white flex items-center justify-center p-0.5 border border-zinc-300 rounded">
            {qrSrc ? (
              <img src={qrSrc} alt={`QR for ${eq.name}`} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-[9px] text-zinc-400">
                Loading...
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 truncate">
              {eq.brand || 'Appliance'}
            </div>
            <div className="text-xs font-bold text-zinc-950 truncate leading-tight">{eq.name}</div>
            {showSerial && eq.serialNumber && (
              <div className="text-[9px] font-mono text-zinc-600 truncate">SN: {eq.serialNumber}</div>
            )}
            {showLocation && eq.locationRoom && (
              <div className="text-[9px] text-zinc-500 truncate">{eq.locationRoom}</div>
            )}
            <div className="pt-0.5 text-[8px] font-semibold text-zinc-400 uppercase tracking-tight">
              Scan for Maintenance & Info
            </div>
          </div>
        </div>
      );
    }

    if (size === 'badge') {
      // 4" x 2.5" Comprehensive Maintenance Badge
      return (
        <div
          key={eq.id}
          className="print-label-card bg-white text-zinc-900 border-2 border-zinc-900 rounded-xl p-3.5 flex flex-col justify-between w-full max-w-[360px] shadow-sm select-none"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b-2 border-zinc-900 pb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-zinc-900 text-white">
                  EQUIPKEEP
                </span>
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide truncate">
                  {eq.brand}
                </span>
              </div>
              <h4 className="text-sm font-black text-zinc-950 truncate mt-0.5">{eq.name}</h4>
            </div>
            <div className="text-right text-[10px] font-semibold text-zinc-600 shrink-0">
              {showLocation && eq.locationRoom && <div>{eq.locationRoom}</div>}
              <div className="text-[9px] text-zinc-500">{category.label}</div>
            </div>
          </div>

          {/* Body with QR and Specs */}
          <div className="flex items-center gap-3 py-2.5">
            <div className="shrink-0 w-24 h-24 bg-white p-1 border border-zinc-300 rounded-lg flex items-center justify-center">
              {qrSrc ? (
                <img src={qrSrc} alt={`QR for ${eq.name}`} className="w-full h-full object-contain" />
              ) : (
                <div className="text-[10px] text-zinc-400">Loading...</div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1 text-[11px]">
              <div>
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">Model & Serial</span>
                <span className="font-mono text-zinc-900 font-semibold block truncate">
                  {eq.modelNumber || 'N/A'}
                </span>
                {showSerial && eq.serialNumber && (
                  <span className="font-mono text-zinc-600 text-[10px] block truncate">
                    SN: {eq.serialNumber}
                  </span>
                )}
              </div>

              {showFilterSpecs && eq.specifications?.filterSize && (
                <div className="pt-0.5">
                  <span className="text-[9px] uppercase font-bold text-orange-600 block">Filter / Consumable</span>
                  <span className="font-semibold text-zinc-900 truncate block text-[10px]">
                    {eq.specifications.filterSize}
                  </span>
                </div>
              )}

              {showNextDue && nextTask && (
                <div className="pt-0.5">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 block">Next Service</span>
                  <span className="text-[10px] font-medium text-zinc-800 truncate block">
                    {nextTask.title} ({formatDate(nextTask.nextDueDate)})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Callout */}
          <div className="pt-1.5 border-t border-dashed border-zinc-300 flex items-center justify-between text-[9px] font-mono text-zinc-500">
            <span>Scan with phone camera to view logs & manuals</span>
            <span className="font-bold text-zinc-700 uppercase">ID: {eq.id}</span>
          </div>
        </div>
      );
    }

    // Standard Asset Tag (3.5" x 2" standard sticker)
    return (
      <div
        key={eq.id}
        className="print-label-card bg-white text-zinc-900 border-2 border-zinc-900 rounded-lg p-3 flex items-center gap-3.5 w-full max-w-[340px] shadow-sm select-none"
      >
        {/* QR Code Container */}
        <div className="shrink-0 flex flex-col items-center">
          <div className="w-24 h-24 bg-white p-1 border border-zinc-300 rounded-md flex items-center justify-center">
            {qrSrc ? (
              <img src={qrSrc} alt={`QR for ${eq.name}`} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-[10px] text-zinc-400">
                Loading...
              </div>
            )}
          </div>
          <span className="text-[8px] font-bold uppercase tracking-tight text-zinc-500 mt-1">
            Scan to Open
          </span>
        </div>

        {/* Info Column */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-extrabold uppercase px-1 rounded bg-zinc-900 text-white">
              EQUIPMENT
            </span>
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide truncate">
              {eq.brand}
            </span>
          </div>

          <h4 className="text-xs font-bold text-zinc-950 leading-tight line-clamp-2">{eq.name}</h4>

          <div className="text-[10px] font-mono text-zinc-600 space-y-0.5">
            {eq.modelNumber && <div className="truncate">Mod: {eq.modelNumber}</div>}
            {showSerial && eq.serialNumber && <div className="truncate">Ser: {eq.serialNumber}</div>}
          </div>

          {showFilterSpecs && eq.specifications?.filterSize && (
            <div className="text-[10px] text-zinc-800 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded truncate font-medium">
              <span className="font-bold text-orange-700">Filter: </span>
              {eq.specifications.filterSize}
            </div>
          )}

          {showLocation && eq.locationRoom && (
            <div className="text-[9px] text-zinc-500 truncate">📍 {eq.locationRoom}</div>
          )}
        </div>
      </div>
    );
  };

  const targetUrl = currentEquipment ? getEquipmentUrl(currentEquipment.id) : '';

  return (
    <>
      {/* Hidden Print Styling to ensure only the label sheet prints cleanly */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qr-sheet, #printable-qr-sheet * {
            visibility: visible;
          }
          #printable-qr-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10mm;
            background: white !important;
            color: black !important;
          }
          .print-label-card {
            box-shadow: none !important;
            page-break-inside: avoid;
            break-inside: avoid;
            border-color: #000 !important;
          }
          @page {
            size: auto;
            margin: 10mm;
          }
        }
      `}</style>

      {/* Screen Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <span>Equipment QR Codes & Printable Labels</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Direct Deep-Link
                  </span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Generate scannable tags to attach to units for instant access to manuals, filter sizes, and maintenance logs.
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

          {/* Mode Switcher Tabs */}
          <div className="px-5 pt-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/40">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBatchMode(false)}
                className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-colors ${
                  !isBatchMode
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Single Unit Label</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBatchMode(true)}
                className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-colors ${
                  isBatchMode
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Batch Sheet ({allEquipment.length} Units)</span>
              </button>
            </div>

            {/* Quick Print Button in Header */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {isBatchMode ? `All Labels (${batchSelectedIds.length})` : 'Label'}</span>
            </button>
          </div>

          {/* Modal Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Host URL / Target Link Configuration Banner */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                  <HardDrive className="w-3.5 h-3.5 text-orange-500" />
                  <span>QR Code Target Host URL</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingHost(!isEditingHost)}
                    className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                  >
                    <Settings2 className="w-3 h-3" />
                    <span>{isEditingHost ? 'Close Host Settings' : 'Change Host IP / Port'}</span>
                  </button>
                </div>
              </div>

              {isEditingHost ? (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customHost}
                      onChange={(e) => setCustomHost(e.target.value)}
                      placeholder="http://192.168.1.150:3100 or http://unraid.local:3100"
                      className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingHost(false)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 text-white"
                    >
                      Apply
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Tip: If scanning from your mobile phone camera while connected to home Wi-Fi, enter your local server IP (e.g. <code className="font-mono text-orange-600">http://192.168.1.100:3100</code>).
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono">
                  <div className="flex items-center gap-2 truncate text-zinc-600 dark:text-zinc-400">
                    <span className="text-zinc-400">Target Link:</span>
                    <span className="text-zinc-900 dark:text-zinc-200 truncate font-semibold">
                      {targetUrl || 'Select equipment'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-sans font-semibold"
                    >
                      {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUrl ? 'Copied' : 'Copy Link'}</span>
                    </button>
                    {targetUrl && (
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                        title="Test opening link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Label Layout & Options Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 text-xs">
              {/* Size Selector */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px]">
                  Tag Size:
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-300 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setLabelSize('compact')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      labelSize === 'compact'
                        ? 'bg-orange-600 text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Compact (2"×1.5")
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabelSize('standard')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      labelSize === 'standard'
                        ? 'bg-orange-600 text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Standard Asset Tag (3.5"×2")
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabelSize('badge')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      labelSize === 'badge'
                        ? 'bg-orange-600 text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Maintenance Badge (4"×2.5")
                  </button>
                </div>
              </div>

              {/* Detail Toggles */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-600 dark:text-zinc-400">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFilterSpecs}
                    onChange={(e) => setShowFilterSpecs(e.target.checked)}
                    className="rounded border-zinc-300 text-orange-600"
                  />
                  <span>Filter / Consumables</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSerial}
                    onChange={(e) => setShowSerial(e.target.checked)}
                    className="rounded border-zinc-300 text-orange-600"
                  />
                  <span>Serial #</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLocation}
                    onChange={(e) => setShowLocation(e.target.checked)}
                    className="rounded border-zinc-300 text-orange-600"
                  />
                  <span>Room Location</span>
                </label>
              </div>
            </div>

            {/* SINGLE MODE VIEW */}
            {!isBatchMode && (
              <div className="space-y-4">
                {/* Equipment Picker Dropdown */}
                {allEquipment.length > 1 && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                      Select Appliance:
                    </label>
                    <select
                      value={selectedEquipmentId}
                      onChange={(e) => setSelectedEquipmentId(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-semibold"
                    >
                      {allEquipment.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name} ({eq.brand}) - {eq.locationRoom || 'No Room'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Single Label Preview Canvas */}
                <div className="p-6 bg-zinc-100 dark:bg-zinc-950/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center space-y-4">
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
                    Live Printable Preview ({labelSize} Tag)
                  </div>

                  {currentEquipment ? (
                    <div id="printable-qr-sheet" className="p-2">
                      {renderLabelCard(currentEquipment)}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-400">No equipment selected</div>
                  )}

                  {/* Actions for this single unit */}
                  {currentEquipment && (
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Physical Sticker</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadSingleQr(currentEquipment)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download QR PNG (Label Maker)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-colors"
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUrl ? 'Link Copied' : 'Copy Scannable URL'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BATCH MODE VIEW */}
            {isBatchMode && (
              <div className="space-y-4">
                {/* Batch Checklist Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSelectAllBatch}
                      className="font-bold text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      {batchSelectedIds.length === allEquipment.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-zinc-500">
                      {batchSelectedIds.length} of {allEquipment.length} equipment selected for sheet
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-400">
                    Prints on standard 8.5"×11" paper or sticker sheets with dotted cut guides
                  </div>
                </div>

                {/* Selectable Equipment Chips */}
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                  {allEquipment.map((eq) => {
                    const selected = batchSelectedIds.includes(eq.id);
                    return (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => handleToggleBatchId(eq.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1.5 transition-colors ${
                          selected
                            ? 'bg-orange-50 dark:bg-orange-950/50 border-orange-300 dark:border-orange-800 text-orange-800 dark:text-orange-300'
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300'
                        }`}
                      >
                        <span>{selected ? '✓' : '+'}</span>
                        <span className="font-semibold">{eq.name}</span>
                        {eq.brand && <span className="text-zinc-400">({eq.brand})</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Printable Sheet Grid Container */}
                <div className="p-6 bg-zinc-100 dark:bg-zinc-950/80 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <span>Printable Sheet Grid Preview</span>
                    <span>{batchSelectedIds.length} Labels</span>
                  </div>

                  <div
                    id="printable-qr-sheet"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2 bg-white rounded-xl border border-zinc-200 shadow-xs"
                  >
                    {allEquipment
                      .filter((eq) => batchSelectedIds.includes(eq.id))
                      .map((eq) => renderLabelCard(eq))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/60">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Scanning with iOS or Android camera will immediately open that unit's maintenance record.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Labels</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
