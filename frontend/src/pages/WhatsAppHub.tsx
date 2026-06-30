import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import WhatsAppShareButton from '@/components/features/WhatsAppShareButton';
import {
  visitorInvitePayload,
  complaintUpdatePayload,
  maintenanceReminderPayload,
  rentalListingPayload,
  vendorRecommendationPayload,
  announcementPayload,
  emergencyContactPayload,
  invoiceReminderPayload,
  type WhatsAppSharePayload,
} from '@/lib/whatsapp';

// ─── Template definitions ────────────────────────────────────────────────────

interface TemplateField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date';
  placeholder?: string;
  defaultValue?: string;
}

interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  emoji: string;
  fields: TemplateField[];
  buildPayload: (values: Record<string, string>) => WhatsAppSharePayload;
}

const TEMPLATES: TemplateConfig[] = [
  {
    id: 'visitor_invite',
    name: 'Visitor Invitation',
    description: 'Send a pre-formatted invitation to a visitor with date, time, and office details.',
    emoji: '👋',
    fields: [
      { key: 'visitorName', label: 'Visitor Name', placeholder: 'John Doe', defaultValue: 'John Doe' },
      { key: 'host', label: 'Host Name', placeholder: 'Mr. Faizal', defaultValue: 'Mr. Faizal' },
      { key: 'date', label: 'Visit Date', placeholder: '1 July 2026', defaultValue: '1 July 2026' },
      { key: 'time', label: 'Visit Time', placeholder: '10:00 AM', defaultValue: '10:00 AM' },
      { key: 'officeNo', label: 'Office / Unit', placeholder: 'Office 3A', defaultValue: 'Office 3A' },
    ],
    buildPayload: (v) => visitorInvitePayload({
      visitorName: v.visitorName || 'Guest',
      host: v.host || 'Host',
      date: v.date || 'TBD',
      time: v.time || 'TBD',
      officeNo: v.officeNo || 'N/A',
    }),
  },
  {
    id: 'complaint_update',
    name: 'Complaint Update',
    description: 'Notify a tenant about their complaint status change.',
    emoji: '📋',
    fields: [
      { key: 'ticketId', label: 'Ticket ID', placeholder: 'TKT-001', defaultValue: 'TKT-001' },
      { key: 'subject', label: 'Complaint Subject', placeholder: 'Water leakage in bathroom', defaultValue: 'Water leakage in bathroom' },
      { key: 'status', label: 'New Status', placeholder: 'In Progress', defaultValue: 'In Progress' },
      { key: 'remarks', label: 'Remarks (optional)', placeholder: 'Plumber assigned, will visit tomorrow', defaultValue: '' },
    ],
    buildPayload: (v) => complaintUpdatePayload({
      ticketId: v.ticketId || 'N/A',
      subject: v.subject || 'Complaint',
      status: v.status || 'Updated',
      remarks: v.remarks || undefined,
    }),
  },
  {
    id: 'maintenance_reminder',
    name: 'Maintenance Reminder',
    description: 'Remind a tenant about upcoming scheduled maintenance work.',
    emoji: '🔧',
    fields: [
      { key: 'ticketId', label: 'Ticket ID', placeholder: 'MNT-002', defaultValue: 'MNT-002' },
      { key: 'title', label: 'Maintenance Title', placeholder: 'AC Filter Replacement', defaultValue: 'AC Filter Replacement' },
      { key: 'scheduledDate', label: 'Scheduled Date', placeholder: '5 July 2026', defaultValue: '5 July 2026' },
      { key: 'assignee', label: 'Assigned To (optional)', placeholder: 'Cool Air Services', defaultValue: '' },
    ],
    buildPayload: (v) => maintenanceReminderPayload({
      ticketId: v.ticketId || 'N/A',
      title: v.title || 'Maintenance Work',
      scheduledDate: v.scheduledDate || 'TBD',
      assignee: v.assignee || undefined,
    }),
  },
  {
    id: 'rental_listing',
    name: 'Rental Listing',
    description: 'Share a rental property listing with prospective tenants.',
    emoji: '🏠',
    fields: [
      { key: 'title', label: 'Listing Title', placeholder: 'Spacious Office Suite, Level 5', defaultValue: 'Spacious Office Suite, Level 5' },
      { key: 'rent', label: 'Monthly Rent (₹)', type: 'number', placeholder: '25000', defaultValue: '25000' },
      { key: 'location', label: 'Location / Property Type', placeholder: 'Office, Block B', defaultValue: 'Office, Block B' },
    ],
    buildPayload: (v) => rentalListingPayload({
      title: v.title || 'Rental Property',
      rent: Number(v.rent) || 0,
      location: v.location || 'N/A',
    }),
  },
  {
    id: 'vendor_recommendation',
    name: 'Vendor Recommendation',
    description: 'Recommend a verified vendor to a neighbour or colleague.',
    emoji: '🛠️',
    fields: [
      { key: 'vendorName', label: 'Vendor Name', placeholder: 'Quick Fix Plumbing', defaultValue: 'Quick Fix Plumbing' },
      { key: 'serviceType', label: 'Service Type', placeholder: 'Plumbing & Drainage', defaultValue: 'Plumbing & Drainage' },
      { key: 'contact', label: 'Contact Number', placeholder: '+60 12-345 6789', defaultValue: '+60 12-345 6789' },
    ],
    buildPayload: (v) => vendorRecommendationPayload({
      vendorName: v.vendorName || 'Vendor',
      serviceType: v.serviceType || 'General Services',
      contact: v.contact || 'N/A',
    }),
  },
  {
    id: 'announcement',
    name: 'Announcement',
    description: 'Broadcast an official building announcement to residents.',
    emoji: '📢',
    fields: [
      { key: 'title', label: 'Announcement Title', placeholder: 'Water Shutdown Notice', defaultValue: 'Water Shutdown Notice' },
      { key: 'body', label: 'Announcement Body', placeholder: 'Water supply will be interrupted on 4 July 2026 from 9am to 1pm for maintenance work.', defaultValue: 'Water supply will be interrupted on 4 July 2026 from 9am to 1pm for maintenance work.' },
      { key: 'date', label: 'Posted Date', placeholder: '1 July 2026', defaultValue: '1 July 2026' },
    ],
    buildPayload: (v) => announcementPayload({
      title: v.title || 'Announcement',
      body: v.body || '',
      date: v.date || new Date().toLocaleDateString('en-IN'),
    }),
  },
  {
    id: 'emergency_contact',
    name: 'Emergency Contact',
    description: 'Share an emergency contact number with residents for quick access.',
    emoji: '🚨',
    fields: [
      { key: 'name', label: 'Contact Name', placeholder: 'Building Security', defaultValue: 'Building Security' },
      { key: 'role', label: 'Role / Category', placeholder: 'Security', defaultValue: 'Security' },
      { key: 'phone', label: 'Phone Number', placeholder: '+60 3-1234 5678', defaultValue: '+60 3-1234 5678' },
    ],
    buildPayload: (v) => emergencyContactPayload({
      name: v.name || 'Emergency Contact',
      role: v.role || 'Emergency',
      phone: v.phone || 'N/A',
    }),
  },
  {
    id: 'invoice_reminder',
    name: 'Invoice Reminder',
    description: 'Send a payment reminder for an outstanding invoice.',
    emoji: '💰',
    fields: [
      { key: 'invoiceNo', label: 'Invoice Number', placeholder: 'INV-2026-042', defaultValue: 'INV-2026-042' },
      { key: 'amount', label: 'Amount (₹)', type: 'number', placeholder: '35000', defaultValue: '35000' },
      { key: 'dueDate', label: 'Due Date', placeholder: '10 July 2026', defaultValue: '10 July 2026' },
      { key: 'tenantName', label: 'Tenant / Company Name', placeholder: 'Acme Corp Sdn Bhd', defaultValue: 'Acme Corp Sdn Bhd' },
    ],
    buildPayload: (v) => invoiceReminderPayload({
      invoiceNo: v.invoiceNo || 'INV-N/A',
      amount: Number(v.amount) || 0,
      dueDate: v.dueDate || 'N/A',
      tenantName: v.tenantName || 'Tenant',
    }),
  },
];

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({ template }: { template: TemplateConfig }) {
  const initialValues = template.fields.reduce<Record<string, string>>((acc, f) => {
    acc[f.key] = f.defaultValue ?? '';
    return acc;
  }, {});

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [expanded, setExpanded] = useState(false);

  const payload = template.buildPayload(values);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10 text-xl">
            {template.emoji}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 font-[Outfit]">{template.name}</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{template.description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            'flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            expanded
              ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              : 'bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20'
          )}
        >
          {expanded ? 'Collapse' : 'Preview & Share'}
        </button>
      </div>

      {/* Expandable form + preview */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-5 pb-5 pt-4 space-y-4">
          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {template.fields.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  {field.label}
                </label>
                <input
                  type={field.type ?? 'text'}
                  value={values[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
                />
              </div>
            ))}
          </div>

          {/* Message preview */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Message Preview
            </p>
            <pre className="whitespace-pre-wrap break-words rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed max-h-48 overflow-y-auto">
              {payload.message}
            </pre>
          </div>

          {/* Share button */}
          <div className="flex items-center gap-3">
            <WhatsAppShareButton
              payload={payload}
              size="default"
              variant="default"
            />
            <p className="text-xs text-slate-400">
              Edit the fields above to customise the message, then share.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WhatsAppHub() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#25D366]">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">WhatsApp Hub</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Share building updates, reminders, and notifications instantly via WhatsApp — no subscription required.
          </p>
        </div>
      </div>

      {/* How it works banner */}
      <div className="rounded-2xl border border-[#25D366]/20 bg-[#25D366]/5 px-5 py-4">
        <h2 className="font-semibold text-[#1a8a4a] dark:text-[#25D366] text-sm mb-2">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white font-bold text-[10px]">1</span>
            <span>Choose a message template below and fill in the details.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white font-bold text-[10px]">2</span>
            <span>Preview the formatted message and click "Open in WhatsApp".</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white font-bold text-[10px]">3</span>
            <span>WhatsApp opens with the pre-filled message — just select a contact and send!</span>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          Uses the free <code className="font-mono">wa.me</code> share link — no WhatsApp Business API, no fees.
        </p>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {TEMPLATES.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
