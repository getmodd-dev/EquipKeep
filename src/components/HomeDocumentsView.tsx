import { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Upload,
  Plus,
  Search,
  ExternalLink,
  Download,
  Trash2,
  Edit2,
  Shield,
  Zap,
  Paintbrush,
  DollarSign,
  Calendar,
  Building,
  X,
  Tag,
  Eye,
  Grid,
  List,
  FolderArchive,
  HardDrive,
  Globe,
  Loader2,
  FileSpreadsheet,
  FileCheck2,
  Receipt,
  File,
  AlertCircle,
  MapPin,
  HelpCircle,
} from 'lucide-react';
import { HomeDocument, HomeDocumentCategory } from '../types';
import { formatCurrency, formatDate } from '../utils/date';

interface HomeDocumentsViewProps {
  documents: HomeDocument[];
  onUploadDocument: (formData: FormData) => Promise<boolean>;
  onAddDocumentLink: (data: Partial<HomeDocument>) => Promise<boolean>;
  onUpdateDocument: (id: string, data: Partial<HomeDocument>) => Promise<boolean>;
  onDeleteDocument: (id: string) => Promise<boolean>;
}

export const HOME_DOCUMENT_CATEGORIES: {
  id: HomeDocumentCategory;
  label: string;
  shortLabel: string;
  icon: any;
  colorClasses: string;
  badgeClasses: string;
}[] = [
  {
    id: 'receipt',
    label: 'Receipts & Invoices',
    shortLabel: 'Receipts',
    icon: Receipt,
    colorClasses: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    badgeClasses: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'manual',
    label: 'Whole-Home Manuals',
    shortLabel: 'Manuals',
    icon: FileText,
    colorClasses: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    badgeClasses: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  {
    id: 'warranty_insurance',
    label: 'Insurance & Home Warranty',
    shortLabel: 'Insurance',
    icon: Shield,
    colorClasses: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    badgeClasses: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
  {
    id: 'permit_blueprint',
    label: 'Permits & Blueprints',
    shortLabel: 'Permits',
    icon: Building,
    colorClasses: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    badgeClasses: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  {
    id: 'contractor_work',
    label: 'Contractor Estimates & Work',
    shortLabel: 'Contractors',
    icon: FileCheck2,
    colorClasses: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
    badgeClasses: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
  },
  {
    id: 'utility_infrastructure',
    label: 'Utilities & Infrastructure',
    shortLabel: 'Utilities',
    icon: Zap,
    colorClasses: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
    badgeClasses: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  },
  {
    id: 'paint_materials',
    label: 'Paint Codes & Materials',
    shortLabel: 'Paint & Finishes',
    icon: Paintbrush,
    colorClasses: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
    badgeClasses: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  },
  {
    id: 'tax_closing',
    label: 'Closing & Property Tax',
    shortLabel: 'Taxes & Closing',
    icon: FileSpreadsheet,
    colorClasses: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
    badgeClasses: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  },
  {
    id: 'other',
    label: 'General & Miscellaneous',
    shortLabel: 'Other',
    icon: FolderArchive,
    colorClasses: 'text-zinc-500 bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800',
    badgeClasses: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
  },
];

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function HomeDocumentsView({
  documents,
  onUploadDocument,
  onAddDocumentLink,
  onUpdateDocument,
  onDeleteDocument,
}: HomeDocumentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'title' | 'amount_desc'>('date_desc');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<HomeDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<HomeDocument | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<HomeDocumentCategory>('receipt');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadAmount, setUploadAmount] = useState('');
  const [uploadVendor, setUploadVendor] = useState('');
  const [uploadArea, setUploadArea] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states for link
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkCategory, setLinkCategory] = useState<HomeDocumentCategory>('manual');
  const [linkDate, setLinkDate] = useState(new Date().toISOString().split('T')[0]);
  const [linkAmount, setLinkAmount] = useState('');
  const [linkVendor, setLinkVendor] = useState('');
  const [linkArea, setLinkArea] = useState('');
  const [linkNotes, setLinkNotes] = useState('');

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let result = documents.filter((doc) => {
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        (doc.notes && doc.notes.toLowerCase().includes(q)) ||
        (doc.vendorOrIssuer && doc.vendorOrIssuer.toLowerCase().includes(q)) ||
        (doc.roomOrArea && doc.roomOrArea.toLowerCase().includes(q)) ||
        (doc.fileName && doc.fileName.toLowerCase().includes(q)) ||
        (doc.fileType && doc.fileType.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });

    result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        const dateA = a.documentDate || a.dateAdded || '';
        const dateB = b.documentDate || b.dateAdded || '';
        return dateB.localeCompare(dateA);
      }
      if (sortBy === 'date_asc') {
        const dateA = a.documentDate || a.dateAdded || '';
        const dateB = b.documentDate || b.dateAdded || '';
        return dateA.localeCompare(dateB);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'amount_desc') {
        return (b.amount || 0) - (a.amount || 0);
      }
      return 0;
    });

    return result;
  }, [documents, selectedCategory, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const totalDocs = documents.length;
    const receipts = documents.filter((d) => d.category === 'receipt' || (d.amount !== undefined && d.amount > 0));
    const totalAmount = receipts.reduce((sum, d) => sum + (d.amount || 0), 0);
    const localFiles = documents.filter((d) => d.isLocal);
    const totalBytes = documents.reduce((sum, d) => sum + (d.fileSize || 0), 0);

    return {
      totalDocs,
      receiptCount: receipts.length,
      totalAmount,
      localFilesCount: localFiles.length,
      formattedTotalBytes: formatBytes(totalBytes),
    };
  }, [documents]);

  // File selection handler
  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setUploadFile(file);
    if (!uploadTitle.trim()) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setUploadTitle(nameWithoutExt.replace(/[-_]/g, ' '));
    }
  };

  // Submit Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle.trim());
    formData.append('category', uploadCategory);
    formData.append('documentDate', uploadDate);
    if (uploadAmount.trim()) formData.append('amount', uploadAmount.trim());
    if (uploadVendor.trim()) formData.append('vendorOrIssuer', uploadVendor.trim());
    if (uploadArea.trim()) formData.append('roomOrArea', uploadArea.trim());
    if (uploadNotes.trim()) formData.append('notes', uploadNotes.trim());

    const success = await onUploadDocument(formData);
    setIsSubmitting(false);
    if (success) {
      setIsUploadModalOpen(false);
      resetUploadForm();
    }
  };

  // Submit Web Link
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim()) return;

    setIsSubmitting(true);
    const success = await onAddDocumentLink({
      title: linkTitle.trim(),
      url: linkUrl.trim() || undefined,
      category: linkCategory,
      documentDate: linkDate,
      amount: linkAmount.trim() ? parseFloat(linkAmount) : undefined,
      vendorOrIssuer: linkVendor.trim() || undefined,
      roomOrArea: linkArea.trim() || undefined,
      notes: linkNotes.trim() || undefined,
    });
    setIsSubmitting(false);
    if (success) {
      setIsLinkModalOpen(false);
      resetLinkForm();
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    setIsSubmitting(true);
    const success = await onUpdateDocument(editingDoc.id, {
      title: editingDoc.title,
      category: editingDoc.category,
      documentDate: editingDoc.documentDate,
      amount: editingDoc.amount,
      vendorOrIssuer: editingDoc.vendorOrIssuer,
      roomOrArea: editingDoc.roomOrArea,
      notes: editingDoc.notes,
      url: editingDoc.url,
    });
    setIsSubmitting(false);
    if (success) {
      setEditingDoc(null);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitle('');
    setUploadCategory('receipt');
    setUploadDate(new Date().toISOString().split('T')[0]);
    setUploadAmount('');
    setUploadVendor('');
    setUploadArea('');
    setUploadNotes('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetLinkForm = () => {
    setLinkUrl('');
    setLinkTitle('');
    setLinkCategory('manual');
    setLinkDate(new Date().toISOString().split('T')[0]);
    setLinkAmount('');
    setLinkVendor('');
    setLinkArea('');
    setLinkNotes('');
  };

  const getCategoryMeta = (catId: HomeDocumentCategory) => {
    return HOME_DOCUMENT_CATEGORIES.find((c) => c.id === catId) || HOME_DOCUMENT_CATEGORIES[HOME_DOCUMENT_CATEGORIES.length - 1];
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Context */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <span>Home Documents & Receipts</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-normal border border-zinc-700">
                  {documents.length} items
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                General manuals, receipts, permits, insurance policies, and documents not tied to a specific appliance.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsLinkModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span>Add Web Link</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-colors flex items-center gap-2 shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document / Receipt</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            Total Home Files
          </span>
          <div className="text-xl font-bold text-zinc-100">{stats.totalDocs}</div>
          <span className="text-[10px] text-zinc-500">{stats.localFilesCount} stored locally in /data/documents</span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
            Tracked Receipts
          </span>
          <div className="text-xl font-bold text-emerald-400">{stats.receiptCount}</div>
          <span className="text-[10px] text-zinc-500">{formatCurrency(stats.totalAmount)} total cost logged</span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            Insurance & Permits
          </span>
          <div className="text-xl font-bold text-zinc-100">
            {documents.filter((d) => d.category === 'warranty_insurance' || d.category === 'permit_blueprint').length}
          </div>
          <span className="text-[10px] text-zinc-500">Coverage, plats & blueprints</span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-orange-400" />
            Disk Storage
          </span>
          <div className="text-xl font-bold text-zinc-100">{stats.formattedTotalBytes}</div>
          <span className="text-[10px] text-zinc-500">Stored on Unraid array</span>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search receipts, manuals, permits, vendor, notes..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort and View Toggle */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="date_desc">Newest Date</option>
              <option value="date_asc">Oldest Date</option>
              <option value="title">Title (A-Z)</option>
              <option value="amount_desc">Highest Amount ($)</option>
            </select>

            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-zinc-800 text-orange-400 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Grid view"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-zinc-800 text-orange-400 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Table view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-xs'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800'
            }`}
          >
            <span>All Documents</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
              {documents.length}
            </span>
          </button>

          {HOME_DOCUMENT_CATEGORIES.map((cat) => {
            const count = documents.filter((d) => d.category === cat.id).length;
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-xs'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.shortLabel}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Content */}
      {filteredDocuments.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 text-zinc-400 flex items-center justify-center mx-auto">
            <FolderArchive className="w-6 h-6 text-zinc-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-200">No documents found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search query or category filter.'
                : 'Upload your home receipts, property surveys, paint codes, or whole-house manuals to keep them safe.'}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload First Document</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const catMeta = getCategoryMeta(doc.category);
            const CatIcon = catMeta.icon;

            return (
              <div
                key={doc.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4.5 flex flex-col justify-between transition-all group shadow-xs hover:shadow-md"
              >
                <div className="space-y-3">
                  {/* Top Bar: Category badge & Amount */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${catMeta.badgeClasses}`}
                    >
                      <CatIcon className="w-3 h-3" />
                      <span>{catMeta.shortLabel}</span>
                    </span>

                    {doc.amount !== undefined && doc.amount > 0 && (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-lg">
                        {formatCurrency(doc.amount)}
                      </span>
                    )}
                  </div>

                  {/* Document Title */}
                  <div>
                    <h3
                      className="text-sm font-bold text-zinc-100 group-hover:text-orange-400 transition-colors line-clamp-2"
                      title={doc.title}
                    >
                      {doc.title}
                    </h3>

                    {/* Metadata Subline: Vendor, Area, Date */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400 mt-1.5">
                      {doc.vendorOrIssuer && (
                        <span className="flex items-center gap-1 font-medium text-zinc-300">
                          <Building className="w-3 h-3 text-zinc-400" />
                          <span>{doc.vendorOrIssuer}</span>
                        </span>
                      )}

                      {doc.roomOrArea && (
                        <span className="flex items-center gap-1 text-zinc-400">
                          <MapPin className="w-3 h-3 text-zinc-500" />
                          <span>{doc.roomOrArea}</span>
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-zinc-400">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        <span>{formatDate(doc.documentDate || doc.dateAdded)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Notes / Description */}
                  {doc.notes && (
                    <p className="text-xs text-zinc-400 bg-zinc-950/50 border border-zinc-800/70 p-2.5 rounded-xl line-clamp-2">
                      {doc.notes}
                    </p>
                  )}
                </div>

                {/* Bottom Footer: File info & Actions */}
                <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                    {doc.isLocal ? (
                      <span className="inline-flex items-center gap-1 text-zinc-400" title="Saved locally on Unraid storage">
                        <HardDrive className="w-3 h-3 text-orange-400" />
                        <span>{doc.fileSize ? formatBytes(doc.fileSize) : 'Local file'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-zinc-400" title="Online document link">
                        <Globe className="w-3 h-3 text-blue-400" />
                        <span>Web Link</span>
                      </span>
                    )}
                  </div>

                  {/* Action Icons */}
                  <div className="flex items-center gap-1">
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                        title="Open file / link in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {doc.isLocal && doc.url && (
                      <a
                        href={doc.url}
                        download={doc.fileName || true}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                        title="Download file to computer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditingDoc(doc)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-orange-400 hover:bg-zinc-800 transition-colors"
                      title="Edit metadata"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(doc.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-400 text-[11px] uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Title & Description</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Issuer / Area</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filteredDocuments.map((doc) => {
                  const catMeta = getCategoryMeta(doc.category);
                  const CatIcon = catMeta.icon;

                  return (
                    <tr key={doc.id} className="hover:bg-zinc-800/40 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-100 group-hover:text-orange-400 transition-colors">
                          {doc.title}
                        </div>
                        {doc.notes && (
                          <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{doc.notes}</div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1">
                          {doc.isLocal ? (
                            <span className="flex items-center gap-1 text-zinc-400">
                              <HardDrive className="w-2.5 h-2.5 text-orange-400" />
                              <span>{doc.fileName || 'Local file'}</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-zinc-400">
                              <Globe className="w-2.5 h-2.5 text-blue-400" />
                              <span>Web link</span>
                            </span>
                          )}
                          {doc.fileSize ? <span>• {formatBytes(doc.fileSize)}</span> : null}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${catMeta.badgeClasses}`}
                        >
                          <CatIcon className="w-3 h-3" />
                          <span>{catMeta.shortLabel}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-zinc-300">
                        {formatDate(doc.documentDate || doc.dateAdded)}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-300">
                        {doc.vendorOrIssuer && <div className="font-medium">{doc.vendorOrIssuer}</div>}
                        {doc.roomOrArea && <div className="text-[11px] text-zinc-500">{doc.roomOrArea}</div>}
                        {!doc.vendorOrIssuer && !doc.roomOrArea && <span className="text-zinc-600">—</span>}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {doc.amount !== undefined && doc.amount > 0 ? (
                          <span className="font-bold text-emerald-400">{formatCurrency(doc.amount)}</span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {doc.url && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                              title="Open file"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {doc.isLocal && doc.url && (
                            <a
                              href={doc.url}
                              download={doc.fileName || true}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditingDoc(doc)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-orange-400 hover:bg-zinc-800 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(doc.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: UPLOAD FILE MODAL                                 */}
      {/* ========================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Upload Document or Receipt</h3>
                  <p className="text-[11px] text-zinc-400">Stores directly to Unraid storage / General_Home_Documents</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  resetUploadForm();
                }}
                className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 overflow-y-auto">
              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Select File (PDF, Receipt Image, JPG, PNG, Document) *
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileChange(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-orange-500 bg-orange-500/10'
                      : uploadFile
                      ? 'border-emerald-500/60 bg-emerald-500/5'
                      : 'border-zinc-700 hover:border-zinc-600 bg-zinc-950/40'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt,.csv,.xlsx,.zip"
                  />

                  {uploadFile ? (
                    <div className="space-y-1">
                      <FileCheck2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <div className="text-xs font-bold text-zinc-100">{uploadFile.name}</div>
                      <div className="text-[11px] text-zinc-400">{formatBytes(uploadFile.size)} • Ready to upload</div>
                      <span className="text-[10px] text-orange-400 underline block pt-1">Click to change file</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Upload className="w-7 h-7 text-zinc-500 mx-auto" />
                      <div className="text-xs font-semibold text-zinc-200">
                        Drag &amp; drop file here, or <span className="text-orange-400">browse</span>
                      </div>
                      <p className="text-[10px] text-zinc-500">Supports PDF manuals, camera receipts, invoices, photos up to 100MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Document / Receipt Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Home Depot Roof Sealant Receipt, Paint Codes, Fence Permit"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as HomeDocumentCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {HOME_DOCUMENT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Document / Receipt Date
                  </label>
                  <input
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Vendor / Issuer & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Store, Vendor or Issuer (Optional)
                  </label>
                  <input
                    type="text"
                    value={uploadVendor}
                    onChange={(e) => setUploadVendor(e.target.value)}
                    placeholder="e.g. Home Depot, State Farm, City Zoning"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Receipt Cost / Amount ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={uploadAmount}
                      onChange={(e) => setUploadAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Room or Area */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Property Area / Room (Optional)
                </label>
                <input
                  type="text"
                  value={uploadArea}
                  onChange={(e) => setUploadArea(e.target.value)}
                  placeholder="e.g. Whole House, Attic, Roof, Front Porch, Electrical Panel"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Notes &amp; Details
                </label>
                <textarea
                  rows={2}
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Policy numbers, warranty terms, paint codes, contractor notes..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    resetUploadForm();
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !uploadFile || !uploadTitle.trim()}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>Save Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD WEB LINK / MANUAL URL MODAL                   */}
      {/* ========================================================= */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Add Online Document Link</h3>
                  <p className="text-[11px] text-zinc-400">Link external Google Drive, municipal permit, or online manual</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLinkModalOpen(false);
                  resetLinkForm();
                }}
                className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="p-5 space-y-4 overflow-y-auto">
              {/* URL */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Document Web URL / Link *
                </label>
                <input
                  type="url"
                  required
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://citypermits.gov/..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="e.g. HOA Bylaws & Architectural Guidelines, City Water Connection Map"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={linkCategory}
                    onChange={(e) => setLinkCategory(e.target.value as HomeDocumentCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {HOME_DOCUMENT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={linkDate}
                    onChange={(e) => setLinkDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Vendor / Issuer & Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Vendor / Issuer (Optional)
                  </label>
                  <input
                    type="text"
                    value={linkVendor}
                    onChange={(e) => setLinkVendor(e.target.value)}
                    placeholder="e.g. HOA Board, Utility Dept"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Property Area / Room (Optional)
                  </label>
                  <input
                    type="text"
                    value={linkArea}
                    onChange={(e) => setLinkArea(e.target.value)}
                    placeholder="e.g. Whole House, Backyard"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={linkNotes}
                  onChange={(e) => setLinkNotes(e.target.value)}
                  placeholder="Notes, account details, login reminders..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsLinkModalOpen(false);
                    resetLinkForm();
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !linkTitle.trim()}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT DOCUMENT MODAL                               */}
      {/* ========================================================= */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Edit Document Metadata</h3>
                  <p className="text-[11px] text-zinc-400">Update title, category, date, costs or notes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingDoc.title}
                  onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={editingDoc.category}
                    onChange={(e) => setEditingDoc({ ...editingDoc, category: e.target.value as HomeDocumentCategory })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {HOME_DOCUMENT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editingDoc.documentDate || editingDoc.dateAdded || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, documentDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Vendor & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Store / Vendor / Issuer
                  </label>
                  <input
                    type="text"
                    value={editingDoc.vendorOrIssuer || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, vendorOrIssuer: e.target.value })}
                    placeholder="e.g. Sherwin-Williams, State Farm"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Receipt Cost / Amount ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingDoc.amount !== undefined ? editingDoc.amount : ''}
                      onChange={(e) =>
                        setEditingDoc({
                          ...editingDoc,
                          amount: e.target.value !== '' ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Room or Area */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Property Area / Room
                </label>
                <input
                  type="text"
                  value={editingDoc.roomOrArea || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, roomOrArea: e.target.value })}
                  placeholder="e.g. Whole House, Attic, Roof"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* URL (if web link) */}
              {!editingDoc.isLocal && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Web URL / Link
                  </label>
                  <input
                    type="url"
                    value={editingDoc.url || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, url: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={editingDoc.notes || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !editingDoc.title.trim()}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit2 className="w-3.5 h-3.5" />}
                  <span>Update Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DIALOG: CONFIRM DELETE                                    */}
      {/* ========================================================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-100">Delete Document?</h4>
                <p className="text-xs text-zinc-400">This will permanently remove the record and any file stored on disk.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = deleteConfirmId;
                  setDeleteConfirmId(null);
                  await onDeleteDocument(id);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
