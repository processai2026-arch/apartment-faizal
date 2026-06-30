/**
 * WhatsApp share utility — no paid APIs, no external npm packages.
 *
 * Phone number format for wa.me URLs:
 *   - Strip all non-digit characters (spaces, dashes, brackets, +)
 *   - The number must already include the country code (e.g. 60123456789 for Malaysia).
 *   - If a number starts with 0 (local format) the caller should supply the full
 *     international format or the link will silently open the wrong number.
 *   - Example: "+60 12-345 6789" → "60123456789"
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WhatsAppSharePayload {
  type:
    | 'visitor_invite'
    | 'complaint_update'
    | 'maintenance_reminder'
    | 'rental_listing'
    | 'vendor_recommendation'
    | 'announcement'
    | 'emergency_contact'
    | 'invoice_reminder';
  title: string;
  message: string;  // pre-formatted, human-readable
  phone?: string;   // target phone (optional — if given, opens wa.me/<phone>)
  url?: string;     // deep-link URL appended at end of message (optional)
}

// ─── Core URL builder ────────────────────────────────────────────────────────

/** Strip all non-digit characters from a phone string. */
function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Build the final text that will be sent via WhatsApp.
 * Optionally appends a deep-link URL at the end.
 */
export function buildWhatsAppMessage(payload: WhatsAppSharePayload): string {
  const parts: string[] = [payload.message.trim()];
  if (payload.url) {
    parts.push('');
    parts.push(`🔗 ${payload.url}`);
  }
  return parts.join('\n');
}

/**
 * Build a wa.me share URL.
 * - If payload.phone is provided: opens a pre-filled chat with that contact.
 * - Otherwise: opens the WhatsApp share sheet (lets the user pick a chat).
 */
export function buildWhatsAppUrl(payload: WhatsAppSharePayload): string {
  const text = encodeURIComponent(buildWhatsAppMessage(payload));
  if (payload.phone) {
    const phone = sanitizePhone(payload.phone);
    return `https://wa.me/${phone}?text=${text}`;
  }
  return `https://wa.me/?text=${text}`;
}

// ─── QR Code ─────────────────────────────────────────────────────────────────

/**
 * Generate a QR code image URL using the free public QR Server API
 * (no API key required, no npm package required).
 *
 * Returns a URL string like:
 *   https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=...
 *
 * Usage:
 *   const qrUrl = await generateQRDataUrl('https://wa.me/...');
 *   <img src={qrUrl} width={200} height={200} alt="QR" />
 */
export async function generateQRDataUrl(text: string, size = 200): Promise<string> {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=png&margin=4`;
}

// ─── Template factories ───────────────────────────────────────────────────────

export function visitorInvitePayload(opts: {
  visitorName: string;
  host: string;
  date: string;
  time: string;
  officeNo: string;
  qrUrl?: string;
}): WhatsAppSharePayload {
  const message = [
    `🏠 *OfficeGate — Visitor Invitation*`,
    ``,
    `Hello ${opts.visitorName}! 👋`,
    ``,
    `You have been invited to visit *${opts.officeNo}*.`,
    ``,
    `📅 Date: ${opts.date}`,
    `⏰ Time: ${opts.time}`,
    `👤 Host: ${opts.host}`,
    ``,
    `Please show this message at the reception desk upon arrival.`,
    ...(opts.qrUrl ? [``, `🔑 Access QR: ${opts.qrUrl}`] : []),
    ``,
    `_Powered by OfficeGate_`,
  ].join('\n');

  return {
    type: 'visitor_invite',
    title: 'Visitor Invitation',
    message,
    url: opts.qrUrl,
  };
}

export function complaintUpdatePayload(opts: {
  ticketId: string;
  subject: string;
  status: string;
  remarks?: string;
}): WhatsAppSharePayload {
  const message = [
    `📋 *Complaint Update — OfficeGate*`,
    ``,
    `Ticket: *#${opts.ticketId}*`,
    `Subject: ${opts.subject}`,
    ``,
    `✅ Status updated to: *${opts.status}*`,
    ...(opts.remarks ? [``, `📝 Remarks: ${opts.remarks}`] : []),
    ``,
    `For queries, please contact the management office.`,
    ``,
    `_OfficeGate Complaint Management_`,
  ].join('\n');

  return {
    type: 'complaint_update',
    title: 'Complaint Status Update',
    message,
  };
}

export function maintenanceReminderPayload(opts: {
  ticketId: string;
  title: string;
  scheduledDate: string;
  assignee?: string;
}): WhatsAppSharePayload {
  const message = [
    `🔧 *Maintenance Update — OfficeGate*`,
    ``,
    `Ticket: *#${opts.ticketId}*`,
    `Issue: ${opts.title}`,
    ``,
    `📅 Scheduled: ${opts.scheduledDate}`,
    ...(opts.assignee ? [`👷 Assigned to: ${opts.assignee}`] : []),
    ``,
    `Our team will be working on this. Please ensure access is available.`,
    ``,
    `_OfficeGate Maintenance Team_`,
  ].join('\n');

  return {
    type: 'maintenance_reminder',
    title: 'Maintenance Reminder',
    message,
  };
}

export function rentalListingPayload(opts: {
  title: string;
  rent: number;
  location: string;
  listingUrl?: string;
}): WhatsAppSharePayload {
  const message = [
    `🏠 *Rental Listing — OfficeGate*`,
    ``,
    `*${opts.title}*`,
    ``,
    `📍 Location: ${opts.location}`,
    `💰 Rent: ₹${opts.rent.toLocaleString('en-IN')}/month`,
    ``,
    `Interested? Contact us to schedule a viewing!`,
    ...(opts.listingUrl ? [``, `🔗 View listing: ${opts.listingUrl}`] : []),
    ``,
    `_OfficeGate Rental Marketplace_`,
  ].join('\n');

  return {
    type: 'rental_listing',
    title: 'Rental Listing',
    message,
    url: opts.listingUrl,
  };
}

export function vendorRecommendationPayload(opts: {
  vendorName: string;
  serviceType: string;
  contact: string;
}): WhatsAppSharePayload {
  const message = [
    `🛠️ *Vendor Recommendation — OfficeGate*`,
    ``,
    `I recommend *${opts.vendorName}* for ${opts.serviceType} services!`,
    ``,
    `📞 Contact: ${opts.contact}`,
    ``,
    `They are a verified vendor on the OfficeGate marketplace.`,
    ``,
    `_OfficeGate Vendor Marketplace_`,
  ].join('\n');

  return {
    type: 'vendor_recommendation',
    title: 'Vendor Recommendation',
    message,
    phone: opts.contact,
  };
}

export function announcementPayload(opts: {
  title: string;
  body: string;
  date: string;
}): WhatsAppSharePayload {
  const message = [
    `📢 *Announcement — OfficeGate*`,
    ``,
    `*${opts.title}*`,
    ``,
    `${opts.body}`,
    ``,
    `📅 Posted: ${opts.date}`,
    ``,
    `_OfficeGate Management_`,
  ].join('\n');

  return {
    type: 'announcement',
    title: opts.title,
    message,
  };
}

export function emergencyContactPayload(opts: {
  name: string;
  role: string;
  phone: string;
}): WhatsAppSharePayload {
  const message = [
    `🚨 *Emergency Contact — OfficeGate*`,
    ``,
    `*${opts.name}*`,
    `🏷️ Role: ${opts.role}`,
    `📞 Phone: ${opts.phone}`,
    ``,
    `Save this number for emergencies.`,
    ``,
    `_OfficeGate Emergency Services_`,
  ].join('\n');

  return {
    type: 'emergency_contact',
    title: `Emergency: ${opts.name}`,
    message,
    phone: opts.phone,
  };
}

export function invoiceReminderPayload(opts: {
  invoiceNo: string;
  amount: number;
  dueDate: string;
  tenantName: string;
}): WhatsAppSharePayload {
  const message = [
    `💰 *Invoice Reminder — OfficeGate*`,
    ``,
    `Dear ${opts.tenantName},`,
    ``,
    `Invoice *${opts.invoiceNo}* is due for payment.`,
    ``,
    `💵 Amount: ₹${opts.amount.toLocaleString('en-IN')}`,
    `📅 Due Date: ${opts.dueDate}`,
    ``,
    `Please make the payment before the due date to avoid penalties.`,
    `For payment queries, contact the management office.`,
    ``,
    `_OfficeGate Financial Management_`,
  ].join('\n');

  return {
    type: 'invoice_reminder',
    title: `Invoice ${opts.invoiceNo}`,
    message,
  };
}
