import { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, RefreshCcw, FolderOpen, Clock, AlertTriangle, Pencil, Trash2, Archive, Upload, X, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import DataTable, { Column } from '@/components/features/DataTable';
import StatCard from '@/components/features/StatCard';
import StatusBadge from '@/components/features/StatusBadge';
import EmptyState from '@/components/features/EmptyState';
import { api, tokenStorage } from '@/lib/api';
import { useDocumentStore } from '@/stores/useDocumentStore';
import type { OfficeDocument, DocumentCategory, Office } from '@/types';

const CATEGORIES: DocumentCategory[] = ['Office Documents', 'Legal', 'Financial', 'Compliance', 'Contracts', 'Correspondence', 'Other'];
const STATUSES: OfficeDocument['status'][] = ['Active', 'Archived', 'Expired'];
const TABS: (DocumentCategory | 'All')[] = ['All', ...CATEGORIES];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8010';
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

// Best-effort public link to the stored attachment file.
function attachmentUrl(doc: OfficeDocument): string | undefined {
  if (!doc.attachment?.storedPath) return undefined;
  return `${API_BASE_URL}/storage/${doc.attachment.storedPath}`;
}

// Days until expiry (negative = already expired).
function daysToExpiry(expiry?: string): number | null {
  if (!expiry) return null;
  const ms = new Date(expiry).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(ms / 86_400_000);
}

function ExpiryBadge({ expiry }: { expiry?: string }) {
  if (!expiry) return <span className="text-slate-400">—</span>;
  const days = daysToExpiry(expiry);
  const label = fmtDate(expiry);
  if (days === null) return <span className="text-slate-400">—</span>;
  if (days < 0) return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700"><AlertTriangle className="h-3 w-3" /> Expired · {label}</span>;
  if (days <= 30) return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"><Clock className="h-3 w-3" /> {days}d · {label}</span>;
  return <span className="text-slate-600">{label}</span>;
}

// ── Attachment upload field ──────────────────────────────────────────────────
function UploadField({ value, fileName, onChange }: { value?: string; fileName?: string; onChange: (id?: string, name?: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await api.uploads.create(file, 'documents');
      onChange(String(uploaded.id), file.name);
      toast.success('File uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally { setUploading(false); }
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Document File *</label>
      <div className="flex items-center gap-2">
        <label className={cn('flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-2 text-sm transition-colors', value ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600')}>
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'Uploading…' : value ? (fileName ? `Attached — ${fileName}` : `Attached (#${value})`) : 'Upload image / PDF'}
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
        {value && (
          <button type="button" title="Remove attachment" onClick={() => onChange(undefined, undefined)} className="rounded-lg bg-slate-100 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-700">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DocumentManagement() {
  const { documents, summary, loading, loadDocuments, loadSummary, createDocument, updateDocument, deleteDocument } = useDocumentStore();
  const [tab, setTab] = useState<DocumentCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState('');
  const [officeFilter, setOfficeFilter] = useState('');
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [offices, setOffices] = useState<Office[]>([]);
  const [form, setForm] = useState<(Partial<OfficeDocument>) | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.offices.list().then(setOffices).catch(() => undefined);
  }, []);

  const refresh = useCallback(() => {
    Promise.all([
      loadDocuments({
        category: tab === 'All' ? undefined : tab,
        status: statusFilter || undefined,
        office_id: officeFilter || undefined,
        expiring_soon: expiringOnly ? '1' : undefined,
      }),
      loadSummary(),
    ]).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to load documents'));
  }, [tab, statusFilter, officeFilter, expiringOnly, loadDocuments, loadSummary]);

  useEffect(() => { refresh(); }, [refresh]);

  const officeLabel = (id?: string) => {
    if (!id) return '—';
    const o = offices.find((x) => x.id === id);
    return o ? `${o.companyName} · ${o.block}-${o.floorNumber}` : `#${id}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.attachmentId) { toast.error('Please upload the document file first'); return; }
    setSaving(true);
    try {
      if (form.id) { await updateDocument(form.id, form); toast.success('Document updated'); }
      else { const created = await createDocument(form); toast.success(`Document stored — ${created.docNo}`); }
      setForm(null);
      loadSummary().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to save document'); }
    finally { setSaving(false); }
  };

  const handleArchive = async (doc: OfficeDocument) => {
    try {
      await updateDocument(doc.id, { status: doc.status === 'Archived' ? 'Active' : 'Archived' });
      toast.success(doc.status === 'Archived' ? 'Document restored' : 'Document archived');
      loadSummary().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to update'); }
  };

  const handleDownload = async (doc: OfficeDocument) => {
    const url = attachmentUrl(doc);
    if (!url) return;
    try {
      const token = tokenStorage.getAccessToken();
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      // ISSUE-5 fix: check response status before consuming blob
      if (!res.ok) {
        toast.error(`File not available (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const mime = doc.attachment?.mimeType ?? '';
      const ext = mime.includes('pdf') ? '.pdf'
        : mime.includes('jpeg') || mime.includes('jpg') ? '.jpg'
        : mime.includes('png') ? '.png'
        : mime.includes('webp') ? '.webp'
        : '';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = doc.title + ext;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDelete = async (doc: OfficeDocument) => {
    if (!confirm(`Delete document ${doc.docNo}?`)) return;
    try {
      await deleteDocument(doc.id);
      toast.success('Document deleted');
      loadSummary().catch(() => undefined);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to delete'); }
  };

  const columns: Column<OfficeDocument>[] = [
    {
      key: 'docNo', label: 'Document',
      render: (d) => (
        <div>
          <p className="font-medium text-slate-900">{d.title}</p>
          <p className="text-xs text-slate-400">{d.docNo}</p>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (d) => <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{d.category}</span> },
    { key: 'officeId', label: 'Office / Unit', render: (d) => <span className="text-slate-600">{officeLabel(d.officeId)}</span> },
    { key: 'expiryDate', label: 'Expiry', render: (d) => <ExpiryBadge expiry={d.expiryDate} /> },
    { key: 'status', label: 'Status', render: (d) => <StatusBadge status={d.status} size="sm" /> },
    {
      key: 'attachmentId', label: 'File',
      render: (d) => {
        const url = attachmentUrl(d);
        if (!url) return <span className="text-slate-400">—</span>;
        return (
          <div className="flex items-center gap-1.5">
            <a href={url} target="_blank" rel="noreferrer" title="View" className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"><ExternalLink className="h-3.5 w-3.5" /></a>
            <button type="button" onClick={() => handleDownload(d)} title="Download" className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"><Download className="h-3.5 w-3.5" /></button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Documents</h1>
          <p className="text-sm text-slate-500">Office document storage, expiry tracking &amp; maintenance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} title="Refresh" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700">
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
          <button onClick={() => setForm({ category: 'Office Documents', status: 'Active' })} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Add Document
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Documents" value={summary?.total ?? 0} icon={FileText} color="indigo" />
        <StatCard label="Office Documents" value={summary?.officeDocs ?? 0} icon={FolderOpen} color="blue" />
        <StatCard label="Expiring Soon (30d)" value={summary?.expiringSoon ?? 0} icon={Clock} color="amber" />
        <StatCard label="Expired" value={summary?.expired ?? 0} icon={AlertTriangle} color="red" />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('rounded-lg px-3 py-2 text-sm font-medium transition-colors', tab === t ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400', t === 'Office Documents' && tab !== t && 'text-indigo-600')}>
            {t}
          </button>
        ))}
      </div>

      <DataTable
        data={documents}
        columns={columns}
        searchKeys={['docNo', 'title', 'tags', 'fileName']}
        searchPlaceholder="Search documents…"
        toolbar={
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Office / Unit</label>
              <select value={officeFilter} onChange={(e) => setOfficeFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">All Offices</option>
                {offices.map((o) => <option key={o.id} value={o.id}>{o.companyName} · {o.block}-{o.floorNumber}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="">All Statuses</option>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 dark:border-slate-700">
              <input type="checkbox" checked={expiringOnly} onChange={(e) => setExpiringOnly(e.target.checked)} /> Expiring soon
            </label>
            {(statusFilter || officeFilter || expiringOnly) && (
              <button onClick={() => { setStatusFilter(''); setOfficeFilter(''); setExpiringOnly(false); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:border-slate-700">
                Clear filters
              </button>
            )}
          </div>
        }
        empty={<EmptyState icon={FileText} title="No documents found" description="Upload your first office document." />}
        actions={(d) => (
          <>
            <button title={d.status === 'Archived' ? 'Restore' : 'Archive'} onClick={() => handleArchive(d)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600"><Archive className="h-3.5 w-3.5" /></button>
            <button title="Edit" onClick={() => setForm(d)} className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"><Pencil className="h-3.5 w-3.5" /></button>
            <button title="Delete" onClick={() => handleDelete(d)} className="rounded-lg bg-slate-100 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
          </>
        )}
      />

      {/* Add / Edit dialog */}
      {form !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="mb-4 font-[Outfit] text-lg font-semibold text-slate-900 dark:text-slate-100">
              {form.id ? `Edit Document ${form.docNo ?? ''}` : 'Add Document'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Title *</label>
                <input required value={form.title ?? ''} onChange={(e) => setForm((f) => f && { ...f, title: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Category *</label>
                  <select required value={form.category ?? 'Office Documents'} onChange={(e) => setForm((f) => f && { ...f, category: e.target.value as DocumentCategory })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Office / Unit</label>
                  <select value={form.officeId ?? ''} onChange={(e) => setForm((f) => f && { ...f, officeId: e.target.value || undefined })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <option value="">Not linked</option>
                    {offices.map((o) => <option key={o.id} value={o.id}>{o.companyName} · {o.block}-{o.floorNumber}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Expiry Date</label>
                  <input type="date" value={form.expiryDate ?? ''} onChange={(e) => setForm((f) => f && { ...f, expiryDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                  <select value={form.status ?? 'Active'} onChange={(e) => setForm((f) => f && { ...f, status: e.target.value as OfficeDocument['status'] })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Tags</label>
                <input value={form.tags ?? ''} onChange={(e) => setForm((f) => f && { ...f, tags: e.target.value })} placeholder="comma,separated,tags" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>

              <UploadField value={form.attachmentId} fileName={form.fileName} onChange={(id, name) => setForm((f) => f && { ...f, attachmentId: id, fileName: name ?? f.fileName })} />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
                <textarea rows={2} value={form.notes ?? ''} onChange={(e) => setForm((f) => f && { ...f, notes: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setForm(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving…' : form.id ? 'Update Document' : 'Save Document'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
