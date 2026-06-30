import type { Announcement, AppNotification, BusinessAd, BusinessAdDashboard, BusinessCategory, CameraDevice, CameraDashboard, CameraEvent, CameraSnapshot, CommunityEvent, ComplaintTicket, ComplaintUpdate, DailyWorker, EmergencyContact, EventDashboard, EventRegistration, FinancialSummary, InventoryItem, Invoice, ListingStatusHistory, MaintenanceRequestTicket, MaintenanceUpdate, MarketplaceVendor, NotificationSummary, Office, RentalDashboard, RentalListing, Staff, UtilityTask, Vehicle, Vendor, VendorBooking, VendorCategory, VendorGalleryItem, VendorMarketplaceDashboard, VendorMarketplaceStats, VendorReview, VendorService, Visitor, VisitorPass, VisitorPassDashboard, WorkerAttendance, WorkerTodaySummary, AnalyticsSummary, OccupancyAnalytics, ComplaintAnalytics, MaintenanceAnalytics, VendorAnalytics, RentalAnalytics, VisitorAnalytics, RevenueAnalytics, WorkerAnalytics, SubscriptionPlan, Subscription, PremiumFeature, SubscriptionDashboard, AdPackage, AdBilling, AdAnalytics, BillingSummary, AdExportRow, PaymentTransaction, RazorpayOrder, PaymentDashboard } from '@/types';
import type { User, ManagedUser, UserRole } from '@/types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8010';

export interface ApiSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

interface ApiMeta {
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  summary?: Record<string, unknown>;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: ApiMeta;
  errors?: Record<string, unknown>;
}

class ApiError extends Error {
  constructor(message: string, public status: number, public errors?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
  }
}

export const tokenStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem('officegate.accessToken');
  },
  getRefreshToken(): string | null {
    return localStorage.getItem('officegate.refreshToken');
  },
  set(accessToken: string, refreshToken: string) {
    localStorage.setItem('officegate.accessToken', accessToken);
    localStorage.setItem('officegate.refreshToken', refreshToken);
  },
  clear() {
    localStorage.removeItem('officegate.accessToken');
    localStorage.removeItem('officegate.refreshToken');
  },
};

async function requestEnvelope<T>(path: string, options: RequestInit = {}, retry = true): Promise<ApiEnvelope<T>> {
  const headers = new Headers(options.headers);
  const token = tokenStorage.getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const hasBody = options.body !== undefined;
  if (hasBody && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (response.status === 401 && retry && tokenStorage.getRefreshToken()) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return requestEnvelope<T>(path, options, false);
    }
  }

  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.message || 'API request failed', response.status, payload?.errors);
  }

  return payload;
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const payload = await requestEnvelope<T>(path, options, retry);
  return payload.data;
}

async function refreshSession(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const session = await request<ApiSession>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }, false);
    tokenStorage.set(session.accessToken, session.refreshToken);
    return true;
  } catch {
    tokenStorage.clear();
    return false;
  }
}

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : '';
}

function gateHeaders(token: string) {
  return { 'X-Gate-Token': token };
}

function unwrapList<T>(path: string) {
  return request<T[]>(path);
}

export interface NotificationListResult {
  items: AppNotification[];
  pagination?: ApiMeta['pagination'];
  summary: NotificationSummary;
}

export interface NotificationCreatePayload {
  title: string;
  message: string;
  type: 'Announcement' | 'Emergency Alert' | 'System Notification' | 'Maintenance Reminder' | 'Rental Approved' | 'Rental Rejected';
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  actionUrl?: string;
  referenceType?: string;
  referenceId?: string;
  role?: UserRole;
  roles?: UserRole[];
  userId?: string;
  userIds?: string[];
  officeId?: string;
}

export const api = {
  login(email: string, password: string) {
    return request<ApiSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  sendOtp(phone: string, purpose: string) {
    return request<{ phone: string; purpose: string; expiresAt: string }>('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone, purpose }),
    });
  },
  verifyOtp(phone: string, purpose: string, otp: string) {
    return request<ApiSession | { verified: boolean }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, purpose, otp }),
    });
  },
  logout() {
    const refreshToken = tokenStorage.getRefreshToken();
    return request<null>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);
  },
  me() {
    return request<User>('/auth/me');
  },
  changePassword(currentPassword: string, newPassword: string) {
    return request<null>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  offices: {
    list: () => unwrapList<OfficeDto>('/admin/offices?perPage=100').then((rows) => rows.map(toOffice)),
    create: (office: Partial<Office>) => request<OfficeDto>('/admin/offices', { method: 'POST', body: JSON.stringify(fromOffice(office)) }).then(toOffice),
    update: (office: Office) => request<OfficeDto>(`/admin/offices/${office.id}`, { method: 'PUT', body: JSON.stringify(fromOffice(office)) }).then(toOffice),
    status: (id: string, status: Office['status']) => request<OfficeDto>(`/admin/offices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }).then(toOffice),
    remove: (id: string) => request<{ id: number | string }>(`/admin/offices/${id}`, { method: 'DELETE' }),
  },
  visitors: {
    list: () => unwrapList<VisitorDto>('/admin/visitors?perPage=100').then((rows) => rows.map(toVisitor)),
    create: (visitor: Partial<Visitor>) => request<VisitorDto>('/admin/visitors/entry', { method: 'POST', body: JSON.stringify(fromVisitor(visitor)) }).then(toVisitor),
    checkout: (id: string) => request<VisitorDto>(`/admin/visitors/${id}/checkout`, { method: 'POST', body: JSON.stringify({}) }).then(toVisitor),
    publicEntry: (visitor: Partial<Visitor>, gateToken: string) => request<VisitorDto>('/public/scan/visitor-entry', { method: 'POST', headers: gateHeaders(gateToken), body: JSON.stringify(fromVisitor(visitor)) }).then(toVisitor),
    publicCheckout: (id: string, checkoutToken: string, gateToken: string) => request<VisitorDto>('/public/scan/visitor-checkout', { method: 'POST', headers: gateHeaders(gateToken), body: JSON.stringify({ visitor_id: id, checkout_token: checkoutToken }) }).then(toVisitor),
  },
  vehicles: {
    list: () => unwrapList<VehicleDto>('/admin/vehicles?perPage=100').then((rows) => rows.map(toVehicle)),
    create: (vehicle: Partial<Vehicle>) => request<VehicleDto>('/admin/vehicles/entry', { method: 'POST', body: JSON.stringify(fromVehicle(vehicle)) }).then(toVehicle),
    checkout: (id: string) => request<VehicleDto>(`/admin/vehicles/${id}/checkout`, { method: 'POST', body: JSON.stringify({}) }).then(toVehicle),
    publicEntry: (vehicle: Partial<Vehicle>, gateToken: string) => request<VehicleDto>('/admin/vehicles/entry', { method: 'POST', headers: gateHeaders(gateToken), body: JSON.stringify(fromVehicle(vehicle)) }).then(toVehicle),
    publicCheckout: (id: string, checkoutToken: string, gateToken: string) => request<VehicleDto>('/public/scan/vehicle-checkout', { method: 'POST', headers: gateHeaders(gateToken), body: JSON.stringify({ vehicle_id: id, checkout_token: checkoutToken }) }).then(toVehicle),
  },
  vendors: {
    list: () => unwrapList<VendorDto>('/admin/vendors?perPage=100').then((rows) => rows.map(toVendor)),
    create: (vendor: Partial<Vendor>) => request<VendorDto>('/admin/vendors', { method: 'POST', body: JSON.stringify(fromVendor(vendor)) }).then(toVendor),
  },
  staff: {
    list: () => unwrapList<StaffDto>('/admin/staff?perPage=100').then((rows) => rows.map(toStaff)),
    create: (staff: Partial<Staff>) => request<StaffDto>('/admin/staff', { method: 'POST', body: JSON.stringify(fromStaff(staff)) }).then(toStaff),
    update: (staff: Staff) => request<StaffDto>(`/admin/staff/${staff.id}`, { method: 'PUT', body: JSON.stringify(fromStaff(staff)) }).then(toStaff),
    attendance: (id: string, date: string, status: 'P' | 'A' | 'H') => request<{ staffId: number; status: 'P' | 'A' | 'H' }>(`/admin/staff/${id}/attendance`, { method: 'POST', body: JSON.stringify({ date, status }) }),
  },
  inventory: {
    list: () => unwrapList<InventoryDto>('/admin/inventory?perPage=100').then((rows) => rows.map(toInventory)),
    create: (item: Partial<InventoryItem>) => request<InventoryDto>('/admin/inventory', { method: 'POST', body: JSON.stringify(fromInventory(item)) }).then(toInventory),
  },
  utilities: {
    list: () => unwrapList<UtilityDto>('/admin/utilities?perPage=100').then((rows) => rows.map(toUtility)),
    create: (task: Partial<UtilityTask>) => request<UtilityDto>('/admin/utilities', { method: 'POST', body: JSON.stringify(fromUtility(task)) }).then(toUtility),
    complete: (id: string) => request<UtilityDto>(`/admin/utilities/${id}/complete`, { method: 'POST', body: JSON.stringify({}) }).then(toUtility),
  },
  tenant: {
    dashboard: () => request<TenantDashboardDto>('/tenant/dashboard'),
  },
  users: {
    list: () => unwrapList<UserDto>('/admin/users?perPage=100').then((rows) => rows.map(toManagedUser)),
    create: (payload: { name: string; email: string; phone?: string; password: string; role: 'security' | 'tenant'; officeId?: number | null }) =>
      request<UserDto>('/admin/users', { method: 'POST', body: JSON.stringify({
        name: payload.name, email: payload.email, phone: payload.phone, password: payload.password, role: payload.role, officeId: payload.officeId ?? null,
      }) }).then(toManagedUser),
    update: (id: string, payload: { name?: string; email?: string; phone?: string; password?: string; status?: 'active' | 'inactive' }) =>
      request<UserDto>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }).then(toManagedUser),
    remove: (id: string) => request<{ id: number | string }>(`/admin/users/${id}`, { method: 'DELETE' }),
  },
  uploads: {
    create: (file: File, module = 'complaints') => {
      const form = new FormData();
      form.append('file', file);
      form.append('module', module);
      return request<{ id: number; path: string; url?: string }>('/uploads', { method: 'POST', body: form });
    },
  },
  complaints: {
    tenantList: () => unwrapList<ComplaintDto>('/tenant/complaints?perPage=100').then((rows) => rows.map(toComplaint)),
    tenantCreate: (payload: { category: string; subject: string; description: string; priority?: ComplaintTicket['priority']; attachmentId?: string | number }) =>
      request<ComplaintDto>('/tenant/complaints', { method: 'POST', body: JSON.stringify(fromComplaintCreate(payload)) }).then(toComplaint),
    tenantShow: (id: string) => request<ComplaintDto>(`/tenant/complaints/${id}`).then(toComplaint),

    list: (params: { status?: string; priority?: string; category?: string; search?: string } = {}) =>
      unwrapList<ComplaintDto>(`/admin/complaints${query({ perPage: 100, ...params })}`).then((rows) => rows.map(toComplaint)),
    show: (id: string) => request<ComplaintDto>(`/admin/complaints/${id}`).then(toComplaint),
    update: (id: string, payload: Partial<{ category: string; subject: string; description: string; priority: ComplaintTicket['priority'] }>) =>
      request<ComplaintDto>(`/admin/complaints/${id}`, { method: 'PUT', body: JSON.stringify(payload) }).then(toComplaint),
    remove: (id: string) => request<{ id: number | string }>(`/admin/complaints/${id}`, { method: 'DELETE' }),
    assign: (id: string, vendorId: string, remarks?: string) =>
      request<ComplaintDto>(`/admin/complaints/${id}/assign`, { method: 'POST', body: JSON.stringify({ vendor_id: Number(vendorId), remarks }) }).then(toComplaint),
    status: (id: string, status: ComplaintTicket['status'], remarks?: string) =>
      request<ComplaintDto>(`/admin/complaints/${id}/status`, { method: 'POST', body: JSON.stringify({ status, remarks }) }).then(toComplaint),
  },
  maintenanceRequests: {
    tenantList: () => unwrapList<MaintenanceRequestDto>('/tenant/maintenance-requests?perPage=100').then((rows) => rows.map(toMaintenanceRequest)),
    tenantCreate: (payload: { category: string; title: string; description: string; priority?: MaintenanceRequestTicket['priority']; attachmentId?: string | number; expectedCompletion?: string }) =>
      request<MaintenanceRequestDto>('/tenant/maintenance-requests', { method: 'POST', body: JSON.stringify(fromMaintenanceRequestCreate(payload)) }).then(toMaintenanceRequest),
    tenantShow: (id: string) => request<MaintenanceRequestDto>(`/tenant/maintenance-requests/${id}`).then(toMaintenanceRequest),
    tenantCancel: (id: string, remarks?: string) =>
      request<MaintenanceRequestDto>(`/tenant/maintenance-requests/${id}/cancel`, { method: 'POST', body: JSON.stringify({ remarks }) }).then(toMaintenanceRequest),

    list: (params: { status?: string; priority?: string; category?: string; search?: string } = {}) =>
      unwrapList<MaintenanceRequestDto>(`/admin/maintenance-requests${query({ perPage: 100, ...params })}`).then((rows) => rows.map(toMaintenanceRequest)),
    show: (id: string) => request<MaintenanceRequestDto>(`/admin/maintenance-requests/${id}`).then(toMaintenanceRequest),
    update: (id: string, payload: Partial<{ category: string; title: string; description: string; priority: MaintenanceRequestTicket['priority']; expectedCompletion: string }>) =>
      request<MaintenanceRequestDto>(`/admin/maintenance-requests/${id}`, { method: 'PUT', body: JSON.stringify(payload) }).then(toMaintenanceRequest),
    remove: (id: string) => request<{ id: number | string }>(`/admin/maintenance-requests/${id}`, { method: 'DELETE' }),
    assignVendor: (id: string, vendorId: string, remarks?: string) =>
      request<MaintenanceRequestDto>(`/admin/maintenance-requests/${id}/assign`, { method: 'POST', body: JSON.stringify({ vendor_id: Number(vendorId), remarks }) }).then(toMaintenanceRequest),
    assignStaff: (id: string, staffId: string, remarks?: string) =>
      request<MaintenanceRequestDto>(`/admin/maintenance-requests/${id}/assign-staff`, { method: 'POST', body: JSON.stringify({ staff_id: Number(staffId), remarks }) }).then(toMaintenanceRequest),
    status: (id: string, status: MaintenanceRequestTicket['status'], remarks?: string) =>
      request<MaintenanceRequestDto>(`/admin/maintenance-requests/${id}/status`, { method: 'POST', body: JSON.stringify({ status, remarks }) }).then(toMaintenanceRequest),
  },
  notifications: {
    list: async (role: UserRole, params: { page?: number; perPage?: number; search?: string; read?: 'read' | 'unread'; priority?: string; category?: string; date?: string; sort?: 'newest' | 'oldest' | 'priority' } = {}): Promise<NotificationListResult> => {
      const payload = await requestEnvelope<NotificationDto[]>(`/${role}/notifications${query({ perPage: params.perPage ?? 20, page: params.page, search: params.search, read: params.read, priority: params.priority, category: params.category, date: params.date, sort: params.sort })}`);
      return {
        items: payload.data.map(toNotification),
        pagination: payload.meta?.pagination,
        summary: toNotificationSummary(payload.meta?.summary),
      };
    },
    show: (id: string) => request<NotificationDto>(`/admin/notifications/${id}`).then(toNotification),
    markRead: (role: UserRole, id: string) => request<NotificationDto>(`/${role}/notifications/${id}/read`, { method: 'PUT', body: JSON.stringify({}) }).then(toNotification),
    markAllRead: (role: UserRole) => request<{ updated: number }>(`/${role}/notifications/read-all`, { method: 'PUT', body: JSON.stringify({}) }),
    remove: (id: string) => request<{ id: number | string }>(`/admin/notifications/${id}`, { method: 'DELETE' }),
    create: (payload: NotificationCreatePayload) => request<{ items: NotificationDto[]; created: number }>('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(fromNotificationCreate(payload)),
    }),
  },
  financials: {
    list: (params: { status?: string; officeId?: string; search?: string } = {}) =>
      unwrapList<InvoiceDto>(`/admin/invoices${query({ perPage: 100, status: params.status, office_id: params.officeId, search: params.search })}`).then((rows) => rows.map(toInvoice)),
    show: (id: string) => request<InvoiceDto>(`/admin/invoices/${id}`).then(toInvoice),
    create: (payload: { officeId?: string; invoiceNo: string; description?: string; amount: number; dueDate?: string; status?: Invoice['status'] }) =>
      request<InvoiceDto>('/admin/invoices', { method: 'POST', body: JSON.stringify(fromInvoiceCreate(payload)) }).then(toInvoice),
    update: (id: string, payload: Partial<{ description: string; amount: number; dueDate: string; status: Invoice['status'] }>) =>
      request<InvoiceDto>(`/admin/invoices/${id}`, { method: 'PUT', body: JSON.stringify({ description: payload.description, amount: payload.amount, due_date: payload.dueDate, status: payload.status }) }).then(toInvoice),
    recordPayment: (id: string, amount: number, mode?: string, referenceNo?: string) =>
      request<InvoiceDto>(`/admin/invoices/${id}/payments`, { method: 'POST', body: JSON.stringify({ amount, mode, reference_no: referenceNo }) }).then(toInvoice),
    summary: () => request<FinancialSummaryDto>('/admin/financials/summary').then(toFinancialSummary),
    // P24 Razorpay payment methods
    createPaymentOrder: (id: string) =>
      request<{ order_id: string; amount: number; currency: string; key_id: string; invoice_id: number }>('/admin/invoices/' + id + '/payment-order', { method: 'POST', body: JSON.stringify({}) }).then((d): RazorpayOrder => ({
        orderId: d.order_id,
        amount: d.amount,
        currency: d.currency,
        keyId: d.key_id,
        invoiceId: String(d.invoice_id),
      })),
    verifyPayment: (id: string, payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
      request<InvoiceDto>('/admin/invoices/' + id + '/verify-payment', { method: 'POST', body: JSON.stringify(payload) }).then(toInvoice),
    paymentHistory: (id: string) =>
      request<PaymentTransactionDto[]>('/admin/invoices/' + id + '/payment-history').then((rows) => rows.map(toPaymentTransaction)),
    retryPayment: (id: string) =>
      request<{ order_id: string; amount: number; currency: string; key_id: string; invoice_id: number }>('/admin/invoices/' + id + '/retry-payment', { method: 'POST', body: JSON.stringify({}) }).then((d): RazorpayOrder => ({
        orderId: d.order_id,
        amount: d.amount,
        currency: d.currency,
        keyId: d.key_id,
        invoiceId: String(d.invoice_id),
      })),
    refund: (id: string) =>
      request<{ status: string; message: string; refund_id?: string }>('/admin/invoices/' + id + '/refund', { method: 'POST', body: JSON.stringify({}) }),
    paymentDashboard: () =>
      request<PaymentDashboardDto>('/admin/payments/dashboard').then(toPaymentDashboard),
  },
  vendorMarketplace: {
    // ---- Tenant browse ----
    tenantList: (params: { search?: string; categoryId?: string; serviceArea?: string; featured?: string; minRating?: string } = {}) =>
      unwrapList<MarketplaceVendorDto>(`/tenant/vendors${query({ perPage: 100, search: params.search, category_id: params.categoryId, service_area: params.serviceArea, featured: params.featured, min_rating: params.minRating })}`).then((rows) => rows.map(toMarketplaceVendor)),
    tenantShow: (id: string) => request<MarketplaceVendorDto>(`/tenant/vendors/${id}`).then(toMarketplaceVendor),
    tenantCategories: () => unwrapList<VendorCategoryDto>('/tenant/vendor-categories?perPage=100').then((rows) => rows.map(toVendorCategory)),

    tenantBookings: () => unwrapList<VendorBookingDto>('/tenant/vendor-bookings?perPage=100').then((rows) => rows.map(toVendorBooking)),
    book: (payload: { vendorId: string; serviceId?: string; title: string; description?: string; scheduledFor?: string }) =>
      request<VendorBookingDto>('/tenant/vendor-bookings', { method: 'POST', body: JSON.stringify({ vendor_id: Number(payload.vendorId), service_id: payload.serviceId ? Number(payload.serviceId) : null, title: payload.title, description: payload.description ?? null, scheduled_for: payload.scheduledFor ?? null }) }).then(toVendorBooking),
    cancelBooking: (id: string) => request<VendorBookingDto>(`/tenant/vendor-bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({}) }).then(toVendorBooking),
    review: (payload: { vendorId: string; bookingId?: string; rating: number; title?: string; comment?: string; attachmentId?: string }) =>
      request<VendorReviewDto>('/tenant/vendor-reviews', { method: 'POST', body: JSON.stringify({ vendor_id: Number(payload.vendorId), booking_id: payload.bookingId ? Number(payload.bookingId) : null, rating: payload.rating, title: payload.title ?? null, comment: payload.comment ?? null, attachment_id: payload.attachmentId ? Number(payload.attachmentId) : null }) }).then(toVendorReview),

    // ---- Admin ----
    adminList: (params: { search?: string; categoryId?: string; featured?: string; verified?: string; minRating?: string } = {}) =>
      unwrapList<MarketplaceVendorDto>(`/admin/vendors${query({ perPage: 100, search: params.search, category_id: params.categoryId, featured: params.featured, verified: params.verified, min_rating: params.minRating })}`).then((rows) => rows.map(toMarketplaceVendor)),
    adminShow: (id: string) => request<MarketplaceVendorDto>(`/admin/vendor-marketplace/vendors/${id}`).then(toMarketplaceVendor),
    verify: (id: string, verified: boolean) => request<MarketplaceVendorDto>(`/admin/vendor-marketplace/vendors/${id}/verify`, { method: 'POST', body: JSON.stringify({ verified }) }).then(toMarketplaceVendor),
    feature: (id: string, featured: boolean) => request<MarketplaceVendorDto>(`/admin/vendor-marketplace/vendors/${id}/feature`, { method: 'POST', body: JSON.stringify({ featured }) }).then(toMarketplaceVendor),

    dashboard: () => request<VendorDashboardDto>('/admin/vendor-marketplace/dashboard').then(toVendorDashboard),
    statistics: () => request<VendorStatsDto>('/admin/vendor-marketplace/statistics').then(toVendorStats),

    reviews: (params: { status?: string; vendorId?: string } = {}) =>
      unwrapList<VendorReviewDto>(`/admin/vendor-reviews${query({ perPage: 100, status: params.status, vendor_id: params.vendorId })}`).then((rows) => rows.map(toVendorReview)),
    moderateReview: (id: string, status: VendorReview['status']) =>
      request<VendorReviewDto>(`/admin/vendor-reviews/${id}/moderate`, { method: 'POST', body: JSON.stringify({ status }) }).then(toVendorReview),

    bookings: (params: { vendorId?: string } = {}) =>
      unwrapList<VendorBookingDto>(`/admin/vendor-bookings${query({ perPage: 100, vendor_id: params.vendorId })}`).then((rows) => rows.map(toVendorBooking)),
    bookingStatus: (id: string, status: VendorBooking['status']) =>
      request<VendorBookingDto>(`/admin/vendor-bookings/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }).then(toVendorBooking),

    categories: () => unwrapList<VendorCategoryDto>('/admin/vendor-categories?perPage=100').then((rows) => rows.map(toVendorCategory)),
    createCategory: (payload: { name: string; slug: string; description?: string; icon?: string }) =>
      request<VendorCategoryDto>('/admin/vendor-categories', { method: 'POST', body: JSON.stringify(payload) }).then(toVendorCategory),
    deleteCategory: (id: string) => request<{ id: number | string }>(`/admin/vendor-categories/${id}`, { method: 'DELETE' }),

    createService: (payload: { vendorId: string; name: string; description?: string; price?: number; unit?: string }) =>
      request<VendorServiceDto>('/admin/vendor-services', { method: 'POST', body: JSON.stringify({ vendor_id: Number(payload.vendorId), name: payload.name, description: payload.description ?? null, price: payload.price ?? null, unit: payload.unit ?? null }) }).then(toVendorService),
    deleteService: (id: string) => request<{ id: number | string }>(`/admin/vendor-services/${id}`, { method: 'DELETE' }),

    addGallery: (payload: { vendorId: string; attachmentId: string; caption?: string; sortOrder?: number }) =>
      request<VendorGalleryDto>('/admin/vendor-gallery', { method: 'POST', body: JSON.stringify({ vendor_id: Number(payload.vendorId), attachment_id: Number(payload.attachmentId), caption: payload.caption ?? null, sort_order: payload.sortOrder ?? 0 }) }).then(toVendorGalleryItem),
    deleteGallery: (id: string) => request<{ id: number | string }>(`/admin/vendor-gallery/${id}`, { method: 'DELETE' }),
  },

  // ── Rental Marketplace (P9/P10) ────────────────────────────────────────────
  rental: {
    // Tenant
    tenantList: (params?: Record<string, string | undefined>) =>
      requestEnvelope<RentalListingDto[]>(`/tenant/rental/listings${query(params ?? {})}`).then((e) => (e.data ?? []).map(toRentalListing)),
    tenantShow: (id: string) =>
      request<RentalListingDto>(`/tenant/rental/listings/${id}`).then(toRentalListing),
    myListings: (params?: Record<string, string | undefined>) =>
      requestEnvelope<RentalListingDto[]>(`/tenant/rental/my-listings${query(params ?? {})}`).then((e) => (e.data ?? []).map(toRentalListing)),
    create: (payload: Partial<RentalListing>) =>
      request<RentalListingDto>('/tenant/rental/listings', { method: 'POST', body: JSON.stringify(fromRentalListing(payload)) }).then(toRentalListing),
    update: (id: string, payload: Partial<RentalListing>) =>
      request<RentalListingDto>(`/tenant/rental/listings/${id}`, { method: 'PUT', body: JSON.stringify(fromRentalListing(payload)) }).then(toRentalListing),
    destroy: (id: string) => request<unknown>(`/tenant/rental/listings/${id}`, { method: 'DELETE' }),
    toggleFavorite: (id: string) => request<{ favorited: boolean }>(`/tenant/rental/listings/${id}/favorite`, { method: 'POST' }),
    myFavorites: () => requestEnvelope<RentalListingDto[]>('/tenant/rental/favorites').then((e) => (e.data ?? []).map(toRentalListing)),
    // Admin
    adminList: (params?: Record<string, string | undefined>) =>
      requestEnvelope<RentalListingDto[]>(`/admin/rental/listings${query(params ?? {})}`).then((e) => ({ items: (e.data ?? []).map(toRentalListing), pagination: e.meta?.pagination })),
    adminShow: (id: string) => request<RentalListingDto>(`/admin/rental/listings/${id}`).then(toRentalListing),
    approve: (id: string, status: string, comment?: string) =>
      request<RentalListingDto>(`/admin/rental/listings/${id}/approve`, { method: 'POST', body: JSON.stringify({ status, comment }) }).then(toRentalListing),
    feature: (id: string, featured: boolean) =>
      request<RentalListingDto>(`/admin/rental/listings/${id}/feature`, { method: 'POST', body: JSON.stringify({ featured }) }).then(toRentalListing),
    adminDestroy: (id: string) => request<unknown>(`/admin/rental/listings/${id}`, { method: 'DELETE' }),
    dashboard: () => request<RentalDashboard>('/admin/rental/dashboard'),
  },

  // ── Business Ads (P11) ────────────────────────────────────────────────────
  businessAds: {
    tenantList: (params?: Record<string, string | undefined>) =>
      requestEnvelope<BusinessAdDto[]>(`/tenant/business-ads${query(params ?? {})}`).then((e) => (e.data ?? []).map(toBusinessAd)),
    tenantShow: (id: string) => request<BusinessAdDto>(`/tenant/business-ads/${id}`).then(toBusinessAd),
    click: (id: string) => request<{ clicked: boolean }>(`/tenant/business-ads/${id}/click`, { method: 'POST' }),
    tenantCategories: () => requestEnvelope<BusinessCategoryDto[]>('/tenant/business-categories').then((e) => (e.data ?? []).map(toBusinessCategory)),
    adminList: (params?: Record<string, string | undefined>) =>
      requestEnvelope<BusinessAdDto[]>(`/admin/business-ads${query(params ?? {})}`).then((e) => ({ items: (e.data ?? []).map(toBusinessAd), pagination: e.meta?.pagination })),
    adminShow: (id: string) => request<BusinessAdDto>(`/admin/business-ads/${id}`).then(toBusinessAd),
    adminCreate: (payload: Partial<BusinessAd>) =>
      request<BusinessAdDto>('/admin/business-ads', { method: 'POST', body: JSON.stringify(fromBusinessAd(payload)) }).then(toBusinessAd),
    adminUpdate: (id: string, payload: Partial<BusinessAd>) =>
      request<BusinessAdDto>(`/admin/business-ads/${id}`, { method: 'PUT', body: JSON.stringify(fromBusinessAd(payload)) }).then(toBusinessAd),
    adminDestroy: (id: string) => request<unknown>(`/admin/business-ads/${id}`, { method: 'DELETE' }),
    adminStatus: (id: string, status: string) =>
      request<BusinessAdDto>(`/admin/business-ads/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }).then(toBusinessAd),
    dashboard: () => request<BusinessAdDashboard>('/admin/business-ads/dashboard'),
    adminCategories: () => requestEnvelope<BusinessCategoryDto[]>('/admin/business-categories').then((e) => (e.data ?? []).map(toBusinessCategory)),
    createCategory: (payload: { name: string; slug: string; icon?: string }) =>
      request<BusinessCategoryDto>('/admin/business-categories', { method: 'POST', body: JSON.stringify(payload) }).then(toBusinessCategory),
    updateCategory: (id: string, payload: Partial<BusinessCategory>) =>
      request<BusinessCategoryDto>(`/admin/business-categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }).then(toBusinessCategory),
    deleteCategory: (id: string) => request<unknown>(`/admin/business-categories/${id}`, { method: 'DELETE' }),
    // P23
    analytics: () => request<AdAnalyticsDto>('/admin/business-ads/analytics').then(toAdAnalytics),
    trackImpression: (id: string) => request<unknown>(`/admin/business-ads/${id}/impression`, { method: 'POST', body: JSON.stringify({}) }),
    sendRenewalReminder: (id: string) => request<{ reminded: boolean }>(`/admin/business-ads/${id}/renewal-reminder`, { method: 'POST', body: JSON.stringify({}) }),
    exportReport: () => request<AdExportRow[]>('/admin/business-ads/export'),
  },

  // ── Ad Billing & Analytics (P23) ────────────────────────────────────────
  adBilling: {
    list: () => request<AdBillingDto[]>('/admin/business-ads/billing').then((rows) => rows.map(toAdBilling)),
    summary: () => request<BillingSummary>('/admin/business-ads/billing/summary'),
    create: (payload: { adId: string; packageId?: string; amount: number; dueDate?: string; paymentRef?: string; notes?: string }) =>
      request<AdBillingDto>('/admin/business-ads/billing', {
        method: 'POST',
        body: JSON.stringify({
          ad_id: Number(payload.adId),
          package_id: payload.packageId ? Number(payload.packageId) : null,
          amount: payload.amount,
          due_date: payload.dueDate ?? null,
          payment_ref: payload.paymentRef ?? null,
          notes: payload.notes ?? null,
        }),
      }).then(toAdBilling),
    pay: (id: string, paymentRef?: string) =>
      request<AdBillingDto>(`/admin/business-ads/billing/${id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ payment_ref: paymentRef ?? null }),
      }).then(toAdBilling),
    packages: () => request<AdPackageDto[]>('/admin/ad-packages').then((rows) => rows.map(toAdPackage)),
    createPackage: (payload: Partial<AdPackage>) =>
      request<AdPackageDto>('/admin/ad-packages', {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name,
          description: payload.description ?? null,
          price: payload.price ?? 0,
          duration_days: payload.durationDays ?? 30,
          max_impressions: payload.maxImpressions ?? 0,
          features: payload.features ?? [],
          is_active: payload.isActive !== false ? 1 : 0,
          sort_order: payload.sortOrder ?? 0,
        }),
      }).then(toAdPackage),
    updatePackage: (id: string, payload: Partial<AdPackage>) =>
      request<AdPackageDto>(`/admin/ad-packages/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
          price: payload.price,
          duration_days: payload.durationDays,
          max_impressions: payload.maxImpressions,
          features: payload.features,
          is_active: payload.isActive !== undefined ? (payload.isActive ? 1 : 0) : undefined,
          sort_order: payload.sortOrder,
        }),
      }).then(toAdPackage),
    deletePackage: (id: string) => request<unknown>(`/admin/ad-packages/${id}`, { method: 'DELETE' }),
  },

  // ── Announcements (P12) ───────────────────────────────────────────────────
  announcements: {
    tenantList: (params?: Record<string, string | undefined>) =>
      requestEnvelope<AnnouncementDto[]>(`/tenant/announcements${query(params ?? {})}`).then((e) => (e.data ?? []).map(toAnnouncement)),
    tenantShow: (id: string) => request<AnnouncementDto>(`/tenant/announcements/${id}`).then(toAnnouncement),
    markRead: (id: string) => request<{ read: boolean }>(`/tenant/announcements/${id}/read`, { method: 'POST' }),
    unreadCount: () => request<{ count: number }>('/tenant/announcements/unread-count'),
    adminList: (params?: Record<string, string | undefined>) =>
      requestEnvelope<AnnouncementDto[]>(`/admin/announcements${query(params ?? {})}`).then((e) => ({ items: (e.data ?? []).map(toAnnouncement), pagination: e.meta?.pagination })),
    adminShow: (id: string) => request<AnnouncementDto>(`/admin/announcements/${id}`).then(toAnnouncement),
    adminCreate: (payload: Partial<Announcement> & { publishNow?: boolean }) =>
      request<AnnouncementDto>('/admin/announcements', { method: 'POST', body: JSON.stringify(fromAnnouncement(payload)) }).then(toAnnouncement),
    adminUpdate: (id: string, payload: Partial<Announcement>) =>
      request<AnnouncementDto>(`/admin/announcements/${id}`, { method: 'PUT', body: JSON.stringify(fromAnnouncement(payload)) }).then(toAnnouncement),
    publish: (id: string) => request<AnnouncementDto>(`/admin/announcements/${id}/publish`, { method: 'POST' }).then(toAnnouncement),
    adminDestroy: (id: string) => request<unknown>(`/admin/announcements/${id}`, { method: 'DELETE' }),
  },

  // ── Emergency Contacts (P13) ──────────────────────────────────────────────
  emergencyContacts: {
    list: (params?: Record<string, string | undefined>) =>
      requestEnvelope<EmergencyContactDto[]>(`/tenant/emergency-contacts${query(params ?? {})}`).then((e) => (e.data ?? []).map(toEmergencyContact)),
    adminList: (params?: Record<string, string | undefined>) =>
      requestEnvelope<EmergencyContactDto[]>(`/admin/emergency-contacts${query(params ?? {})}`).then((e) => ({ items: (e.data ?? []).map(toEmergencyContact), pagination: e.meta?.pagination })),
    adminCreate: (payload: Partial<EmergencyContact>) =>
      request<EmergencyContactDto>('/admin/emergency-contacts', { method: 'POST', body: JSON.stringify(fromEmergencyContact(payload)) }).then(toEmergencyContact),
    adminUpdate: (id: string, payload: Partial<EmergencyContact>) =>
      request<EmergencyContactDto>(`/admin/emergency-contacts/${id}`, { method: 'PUT', body: JSON.stringify(fromEmergencyContact(payload)) }).then(toEmergencyContact),
    adminDestroy: (id: string) => request<unknown>(`/admin/emergency-contacts/${id}`, { method: 'DELETE' }),
  },

  // ── Daily Workers (P14) ───────────────────────────────────────────────────
  dailyWorkers: {
    adminList: (params?: Record<string, string | undefined>) =>
      requestEnvelope<DailyWorkerDto[]>(`/admin/daily-workers${query(params ?? {})}`).then((e) => ({ items: (e.data ?? []).map(toDailyWorker), pagination: e.meta?.pagination })),
    adminShow: (id: string) => request<DailyWorkerDto>(`/admin/daily-workers/${id}`).then(toDailyWorker),
    adminCreate: (payload: Partial<DailyWorker>) =>
      request<DailyWorkerDto>('/admin/daily-workers', { method: 'POST', body: JSON.stringify(fromDailyWorker(payload)) }).then(toDailyWorker),
    adminUpdate: (id: string, payload: Partial<DailyWorker>) =>
      request<DailyWorkerDto>(`/admin/daily-workers/${id}`, { method: 'PUT', body: JSON.stringify(fromDailyWorker(payload)) }).then(toDailyWorker),
    adminDestroy: (id: string) => request<unknown>(`/admin/daily-workers/${id}`, { method: 'DELETE' }),
    generateQr: (id: string) => request<{ qr_code: string }>(`/admin/daily-workers/${id}/qr`, { method: 'POST' }),
    markAttendance: (payload: { workerId: string; status: string; entryTime?: string; exitTime?: string; notes?: string }) =>
      request<WorkerAttendanceDto>('/admin/worker-attendance', { method: 'POST', body: JSON.stringify({ worker_id: Number(payload.workerId), status: payload.status, entry_time: payload.entryTime, exit_time: payload.exitTime, notes: payload.notes }) }).then(toWorkerAttendance),
    attendance: (params?: Record<string, string | undefined>) =>
      requestEnvelope<WorkerAttendanceDto[]>(`/admin/daily-workers/attendance${query(params ?? {})}`).then((e) => (e.data ?? []).map(toWorkerAttendance)),
    todaySummary: () => request<WorkerTodaySummary>('/admin/daily-workers/today-summary'),
    recordEntry: (payload: { workerId: string; officeId?: string; notes?: string }) =>
      request<DailyWorkerDto>('/admin/worker-entry', { method: 'POST', body: JSON.stringify({ worker_id: Number(payload.workerId), office_id: payload.officeId ? Number(payload.officeId) : undefined, notes: payload.notes }) }).then(toDailyWorker),
    recordExit: (visitId: string) => request<{ exit_recorded: boolean }>('/admin/worker-exit', { method: 'POST', body: JSON.stringify({ visit_id: Number(visitId) }) }),
  },

  // ── Visitor Passes (P17) ─────────────────────────────────────────────────
  visitorPasses: {
    list: (params?: Record<string, string | undefined>) =>
      requestEnvelope<VisitorPassDto[]>(`/admin/visitor-passes${query(params ?? {})}`).then((e) => ({
        items: (e.data ?? []).map(toVisitorPass),
        pagination: e.meta?.pagination,
      })),
    dashboard: () =>
      request<VisitorPassDashboardDto>('/admin/visitor-passes/dashboard').then(toVisitorPassDashboard),
    create: (payload: {
      passType: string;
      visitorName: string;
      visitorPhone?: string;
      hostName?: string;
      hostOfficeId?: number;
      purpose?: string;
      validFrom: string;
      validUntil: string;
      maxUses: number;
      notes?: string;
    }) =>
      request<VisitorPassDto>('/admin/visitor-passes', {
        method: 'POST',
        body: JSON.stringify({
          pass_type: payload.passType,
          visitor_name: payload.visitorName,
          visitor_phone: payload.visitorPhone ?? null,
          host_name: payload.hostName ?? null,
          host_office_id: payload.hostOfficeId ?? null,
          purpose: payload.purpose ?? null,
          valid_from: payload.validFrom,
          valid_until: payload.validUntil,
          max_uses: payload.maxUses,
          notes: payload.notes ?? null,
        }),
      }).then(toVisitorPass),
    show: (id: string) =>
      request<VisitorPassDto>(`/admin/visitor-passes/${id}`).then(toVisitorPass),
    update: (id: string, payload: Partial<{
      passType: string;
      visitorName: string;
      visitorPhone: string;
      hostName: string;
      purpose: string;
      validFrom: string;
      validUntil: string;
      maxUses: number;
      notes: string;
      sharedVia: string;
    }>) =>
      request<VisitorPassDto>(`/admin/visitor-passes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          pass_type: payload.passType,
          visitor_name: payload.visitorName,
          visitor_phone: payload.visitorPhone,
          host_name: payload.hostName,
          purpose: payload.purpose,
          valid_from: payload.validFrom,
          valid_until: payload.validUntil,
          max_uses: payload.maxUses,
          notes: payload.notes,
          shared_via: payload.sharedVia,
        }),
      }).then(toVisitorPass),
    cancel: (id: string) =>
      request<VisitorPassDto>(`/admin/visitor-passes/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({}),
      }).then(toVisitorPass),
    scan: (id: string, action: 'entry' | 'exit') =>
      request<VisitorPassDto>(`/admin/visitor-passes/${id}/scan`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      }).then(toVisitorPass),
    download: (id: string) =>
      request<VisitorPassDto>(`/admin/visitor-passes/${id}/download`).then(toVisitorPass),
  },

  // ── Secretary Portal (P15) ────────────────────────────────────────────────
  secretary: {
    list: () => request<SecretaryUser[]>('/admin/secretaries'),
    create: (payload: Partial<SecretaryUser> & { password?: string; user_id?: number }) =>
      request<SecretaryUser>('/admin/secretaries', { method: 'POST', body: JSON.stringify(payload) }),
    show: (id: string) => request<SecretaryUser>('/admin/secretaries/' + id),
    update: (id: string, payload: Partial<SecretaryUser>) =>
      request<SecretaryUser>('/admin/secretaries/' + id, { method: 'PUT', body: JSON.stringify(payload) }),
    setPermissions: (id: string, permissions: SecretaryPermission[]) =>
      request<SecretaryUser>('/admin/secretaries/' + id + '/permissions', { method: 'POST', body: JSON.stringify({ permissions }) }),
    remove: (id: string) => request<unknown>('/admin/secretaries/' + id, { method: 'DELETE' }),
    dashboard: () => request<SecretaryDashboardData>('/secretary/dashboard'),
    myPermissions: () => request<{ modules: string[]; permissions: SecretaryPermission[] }>('/secretary/permissions'),
  },

  // ── Community Analytics (P18) ─────────────────────────────────────────────
  analytics: {
    summary: () => request<AnalyticsSummary>('/admin/analytics/summary').then(toAnalyticsSummary),
    occupancy: () => request<Record<string, unknown>>('/admin/analytics/occupancy').then(toOccupancyAnalytics),
    complaints: () => request<Record<string, unknown>>('/admin/analytics/complaints').then(toComplaintAnalytics),
    maintenance: () => request<Record<string, unknown>>('/admin/analytics/maintenance').then(toMaintenanceAnalytics),
    vendors: () => request<Record<string, unknown>>('/admin/analytics/vendors').then(toVendorAnalytics),
    rentals: () => request<Record<string, unknown>>('/admin/analytics/rentals').then(toRentalAnalytics),
    visitors: () => request<Record<string, unknown>>('/admin/analytics/visitors').then(toVisitorAnalytics),
    revenue: () => request<Record<string, unknown>>('/admin/analytics/revenue').then(toRevenueAnalytics),
    workers: () => request<Record<string, unknown>>('/admin/analytics/daily-workers').then(toWorkerAnalytics),
  },

  // ── Community Events (P19) ────────────────────────────────────────────────
  events: {
    // Admin
    adminList: (params?: Record<string, string | undefined>) =>
      requestEnvelope<EventDto[]>(`/admin/events${query(params ?? {})}`).then((e) => ({ items: (e.data ?? []).map(toCommunityEvent), pagination: e.meta?.pagination })),
    adminDashboard: () =>
      request<EventDashboardDto>('/admin/events/dashboard').then(toEventDashboard),
    adminShow: (id: string) =>
      request<EventDto>(`/admin/events/${id}`).then(toCommunityEvent),
    adminCreate: (payload: Partial<CommunityEvent>) =>
      request<EventDto>('/admin/events', { method: 'POST', body: JSON.stringify(fromCommunityEvent(payload)) }).then(toCommunityEvent),
    adminUpdate: (id: string, payload: Partial<CommunityEvent>) =>
      request<EventDto>(`/admin/events/${id}`, { method: 'PUT', body: JSON.stringify(fromCommunityEvent(payload)) }).then(toCommunityEvent),
    publish: (id: string) =>
      request<EventDto>(`/admin/events/${id}/publish`, { method: 'POST', body: JSON.stringify({}) }).then(toCommunityEvent),
    cancel: (id: string) =>
      request<EventDto>(`/admin/events/${id}/cancel`, { method: 'POST', body: JSON.stringify({}) }).then(toCommunityEvent),
    adminDestroy: (id: string) => request<unknown>(`/admin/events/${id}`, { method: 'DELETE' }),
    adminRegistrations: (id: string) =>
      request<EventRegistrationDto[]>(`/admin/events/${id}/registrations`).then((rows) => rows.map(toEventRegistration)),
    // Tenant
    tenantList: (params?: Record<string, string | undefined>) =>
      requestEnvelope<EventDto[]>(`/tenant/events${query(params ?? {})}`).then((e) => ({ items: (e.data ?? []).map(toCommunityEvent), pagination: e.meta?.pagination })),
    tenantShow: (id: string) =>
      request<EventDto>(`/tenant/events/${id}`).then(toCommunityEvent),
    register: (id: string) =>
      request<EventRegistrationDto>(`/tenant/events/${id}/register`, { method: 'POST', body: JSON.stringify({}) }).then(toEventRegistration),
    cancelRegistration: (id: string) =>
      request<EventRegistrationDto>(`/tenant/events/${id}/cancel-registration`, { method: 'POST', body: JSON.stringify({}) }).then(toEventRegistration),
    myRegistrations: () =>
      request<EventRegistrationDto[]>('/tenant/events/my-registrations').then((rows) => rows.map(toEventRegistration)),
  },

  // ── CCTV Foundation (P21) ─────────────────────────────────────────────────
  cameras: {    list: (params?: Record<string, string | undefined>) =>
      requestEnvelope<CameraDeviceDto[]>(`/admin/cameras${query(params ?? {})}`).then((e) => ({
        items: (e.data ?? []).map(toCameraDevice),
        pagination: e.meta?.pagination,
        health: (e.meta?.summary as Record<string, unknown>) ?? {},
      })),
    dashboard: () =>
      request<CameraDashboardDto>('/admin/cameras/dashboard').then(toCameraDashboard),
    create: (payload: Partial<CameraDevice> & { password?: string }) =>
      request<CameraDeviceDto>('/admin/cameras', {
        method: 'POST',
        body: JSON.stringify(fromCameraDevice(payload)),
      }).then(toCameraDevice),
    show: (id: string) =>
      request<CameraDeviceDto>(`/admin/cameras/${id}`).then(toCameraDevice),
    update: (id: string, payload: Partial<CameraDevice> & { password?: string }) =>
      request<CameraDeviceDto>(`/admin/cameras/${id}`, {
        method: 'PUT',
        body: JSON.stringify(fromCameraDevice(payload)),
      }).then(toCameraDevice),
    remove: (id: string) =>
      request<{ id: string | number }>(`/admin/cameras/${id}`, { method: 'DELETE' }),
    heartbeat: (id: string) =>
      request<CameraDeviceDto>(`/admin/cameras/${id}/heartbeat`, {
        method: 'POST',
        body: JSON.stringify({}),
      }).then(toCameraDevice),
    events: (id: string, params?: Record<string, string | undefined>) =>
      requestEnvelope<CameraEventDto[]>(`/admin/cameras/${id}/events${query(params ?? {})}`).then((e) => ({
        items: (e.data ?? []).map(toCameraEvent),
        pagination: e.meta?.pagination,
      })),
    createEvent: (id: string, payload: { eventType: string; severity?: string; description?: string; occurredAt?: string }) =>
      request<CameraEventDto>(`/admin/cameras/${id}/events`, {
        method: 'POST',
        body: JSON.stringify({
          event_type: payload.eventType,
          severity: payload.severity ?? 'Low',
          description: payload.description ?? null,
          occurred_at: payload.occurredAt ?? null,
        }),
      }).then(toCameraEvent),
    acknowledgeEvent: (eventId: string) =>
      request<CameraEventDto>(`/admin/camera-events/${eventId}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({}),
      }).then(toCameraEvent),
    snapshots: (id: string) =>
      requestEnvelope<CameraSnapshotDto[]>(`/admin/cameras/${id}/snapshots`).then((e) => ({
        items: (e.data ?? []).map(toCameraSnapshot),
        pagination: e.meta?.pagination,
      })),
    createSnapshot: (id: string, notes?: string) =>
      request<CameraSnapshotDto>(`/admin/cameras/${id}/snapshots`, {
        method: 'POST',
        body: JSON.stringify({ notes: notes ?? null }),
      }).then(toCameraSnapshot),
    timeline: (id: string) =>
      request<(CameraEventDto | CameraSnapshotDto)[]>(`/admin/cameras/${id}/timeline`),
  },

  // ── Premium Membership (P22) ──────────────────────────────────────────────
  subscriptions: {
    adminPlans: () =>
      requestEnvelope<SubscriptionPlanDto[]>('/admin/subscription-plans').then((e) => (e.data ?? []).map(toSubscriptionPlan)),
    adminCreatePlan: (payload: Record<string, unknown>) =>
      request<SubscriptionPlanDto>('/admin/subscription-plans', { method: 'POST', body: JSON.stringify(payload) }).then(toSubscriptionPlan),
    adminUpdatePlan: (id: string, payload: Record<string, unknown>) =>
      request<SubscriptionPlanDto>(`/admin/subscription-plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) }).then(toSubscriptionPlan),
    adminDestroyPlan: (id: string) =>
      request<{ id: string | number }>(`/admin/subscription-plans/${id}`, { method: 'DELETE' }),
    adminList: (params?: Record<string, string | undefined>) =>
      requestEnvelope<SubscriptionDto[]>(`/admin/subscriptions${query(params ?? {})}`).then((e) => ({
        items: (e.data ?? []).map(toSubscription),
        pagination: e.meta?.pagination,
      })),
    adminCreate: (payload: Record<string, unknown>) =>
      request<SubscriptionDto>('/admin/subscriptions', { method: 'POST', body: JSON.stringify(payload) }).then(toSubscription),
    adminDashboard: () =>
      request<SubscriptionDashboardDto>('/admin/subscriptions/dashboard').then(toSubscriptionDashboard),
    adminShow: (id: string) =>
      request<SubscriptionDto>(`/admin/subscriptions/${id}`).then(toSubscription),
    adminCancel: (id: string) =>
      request<SubscriptionDto>(`/admin/subscriptions/${id}/cancel`, { method: 'POST', body: JSON.stringify({}) }).then(toSubscription),
    adminFeatures: () =>
      request<PremiumFeatureDto[]>('/admin/premium-features').then((rows) => rows.map(toPremiumFeature)),
    adminUpdateFeature: (id: string, payload: Record<string, unknown>) =>
      request<PremiumFeatureDto>(`/admin/premium-features/${id}`, { method: 'PUT', body: JSON.stringify(payload) }).then(toPremiumFeature),
    myPlan: () =>
      request<SubscriptionDto | { subscription: null; plan: SubscriptionPlanDto; is_free: boolean }>('/tenant/subscription/my-plan'),
    tenantPlans: () =>
      request<SubscriptionPlanDto[]>('/tenant/subscription/plans').then((rows) => rows.map(toSubscriptionPlan)),
    upgrade: (planId: string, billingCycle: 'Monthly' | 'Yearly') =>
      request<{ status: string; subscription: SubscriptionDto; message: string }>('/tenant/subscription/upgrade', {
        method: 'POST',
        body: JSON.stringify({ plan_id: Number(planId), billing_cycle: billingCycle }),
      }),
    cancelMine: () =>
      request<SubscriptionDto>('/tenant/subscription/cancel', { method: 'POST', body: JSON.stringify({}) }).then(toSubscription),
  },
};

type DtoValue = string | number | boolean | null | undefined;
type OfficeDto = Record<string, DtoValue>;
type VisitorDto = Record<string, DtoValue>;
type VehicleDto = Record<string, DtoValue>;
type VendorDto = Record<string, DtoValue>;
type StaffDto = Record<string, DtoValue>;
type InventoryDto = Record<string, DtoValue>;
type UtilityDto = Record<string, DtoValue>;
type UserDto = Record<string, DtoValue>;
type ComplaintUpdateDto = Record<string, DtoValue>;
type ComplaintDto = Record<string, DtoValue> & { history?: ComplaintUpdateDto[] };
type MaintenanceUpdateDto = Record<string, DtoValue>;
type MaintenanceRequestDto = Record<string, DtoValue> & { history?: MaintenanceUpdateDto[] };

type NotificationDto = Record<string, DtoValue>;
type InvoiceDto = Record<string, DtoValue>;
type FinancialSummaryDto = { invoiceCount?: number; billed?: number; collected?: number; pending?: number; byStatus?: { status: string; count: number; amount: number; paid: number }[] };
type VendorServiceDto = Record<string, DtoValue>;
type VendorGalleryDto = Record<string, DtoValue>;
type VendorReviewDto = Record<string, DtoValue>;
type VendorBookingDto = Record<string, DtoValue>;
type VendorCategoryDto = Record<string, DtoValue>;
type MarketplaceVendorDto = Record<string, DtoValue> & { services?: VendorServiceDto[]; gallery?: VendorGalleryDto[]; reviews?: VendorReviewDto[]; reviewDistribution?: Record<string, number> };
type VendorStatsDto = {
  vendors?: { total?: number; verified?: number; featured?: number; avgRating?: number };
  bookingsByStatus?: { status: string; count: number }[];
  reviewsByStatus?: { status: string; count: number }[];
};
type VendorDashboardDto = {
  stats?: VendorStatsDto;
  topRated?: { id: string; name: string; company: string; rating_avg: number; review_count: number }[];
  mostBooked?: { id: string; name: string; company: string; booking_count: number }[];
  recentReviews?: VendorReviewDto[];
};

function asString(value: DtoValue, fallback = ''): string {
  if (value == null) {
    return fallback;
  }

  return String(value);
}

function asOptionalString(value: DtoValue): string | undefined {
  if (value == null || value === '') {
    return undefined;
  }

  return String(value);
}

function asNumber(value: DtoValue, fallback = 0): number {
  if (value == null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asEnum<T extends string>(value: DtoValue, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback;
}

export interface TenantInvoice {
  id: number;
  invoice_no: string;
  description: string | null;
  amount: string | number;
  paid_amount: string | number;
  due_date: string | null;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled';
  created_at: string;
}
export interface TenantDashboardDto {
  office: Record<string, DtoValue> | null;
  visitors: Array<Record<string, DtoValue>>;
  vehicles: Array<Record<string, DtoValue>>;
  invoices: TenantInvoice[];
  summary: {
    pendingApprovals: number;
    visitorsThisMonth: number;
    pendingPayments: number;
    pendingPaymentsAmount: number;
    recentNotifications?: number;
  };
}

function toNotificationSummary(summary?: Record<string, unknown>): NotificationSummary {
  return {
    totalCount: Number(summary?.totalCount ?? 0),
    unreadCount: Number(summary?.unreadCount ?? 0),
    todayCount: Number(summary?.todayCount ?? 0),
    highPriorityCount: Number(summary?.highPriorityCount ?? 0),
  };
}

function toManagedUser(row: UserDto): ManagedUser {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    phone: row.phone ? String(row.phone) : undefined,
    role: (row.role === 'tenant' ? 'tenant' : 'security'),
    status: (row.status === 'inactive' ? 'inactive' : 'active'),
    officeId: row.officeId != null ? Number(row.officeId) : (row.office_id != null ? Number(row.office_id) : null),
    createdAt: row.createdAt ? String(row.createdAt) : (row.created_at ? String(row.created_at) : undefined),
  };
}

function toOffice(row: OfficeDto): Office {
  return {
    id: asString(row.id),
    block: asString(row.block),
    floorNumber: asString(row.floor_number),
    companyName: asString(row.company_name),
    contactPerson: asOptionalString(row.contact_person),
    contactPhone: asOptionalString(row.contact_phone),
    contactEmail: asOptionalString(row.contact_email),
    allocatedVehicleCount: asNumber(row.allocated_vehicle_count),
    usedVehicleCount: asNumber(row.used_vehicle_count),
    status: asEnum(row.status, ['Active', 'Inactive', 'Vacant'] as const, 'Active'),
  };
}

function fromOffice(office: Partial<Office>) {
  return {
    block: office.block,
    floor_number: office.floorNumber,
    company_name: office.companyName,
    contact_person: office.contactPerson,
    contact_phone: office.contactPhone,
    contact_email: office.contactEmail,
    allocated_vehicle_count: office.allocatedVehicleCount ?? 0,
    status: office.status ?? 'Active',
  };
}

function toVisitor(row: VisitorDto): Visitor {
  const entryTime = asString(row.entry_time ?? row.entryTime);
  const exitTime = asOptionalString(row.exit_time);
  return {
    id: asString(row.id),
    name: asString(row.name),
    phone: asString(row.phone),
    gender: row.gender ? asEnum(row.gender, ['Male', 'Female', 'Other'] as const, 'Other') : undefined,
    address: asOptionalString(row.address),
    city: asOptionalString(row.city),
    pincode: asOptionalString(row.pincode),
    block: asString(row.block, 'BRILEY ONE'),
    floorNumber: asString(row.floor_number ?? row.floorNumber),
    companyName: asString(row.company_name ?? row.companyName),
    whomToMeet: asString(row.whom_to_meet ?? row.whomToMeet),
    reason: asString(row.reason ?? row.purpose),
    vehicleType: row.vehicle_type || row.vehicleType ? asEnum(row.vehicle_type ?? row.vehicleType, ['Car', 'Bike', '2-Wheeler', '4-Wheeler', 'NA'] as const, 'NA') : undefined,
    vehicleNo: asOptionalString(row.vehicle_no ?? row.vehicleNo),
    status: asEnum(row.status, ['Inside', 'Exited'] as const, 'Inside'),
    entryTime,
    exitTime,
    duration: exitTime ? calculateDuration(entryTime, exitTime) : undefined,
    guardName: asOptionalString(row.guard_name ?? row.guardName),
    remarks: asOptionalString(row.remarks),
    checkoutToken: asOptionalString(row.checkout_token ?? row.checkoutToken),
    checkoutTokenExpiresAt: asOptionalString(row.checkout_token_expires_at ?? row.checkoutTokenExpiresAt),
    apartmentNo: asOptionalString(row.apartmentNo),
    purpose: asOptionalString(row.reason ?? row.purpose),
  };
}

function fromVisitor(visitor: Partial<Visitor>) {
  return {
    name: visitor.name,
    phone: visitor.phone,
    gender: visitor.gender,
    address: visitor.address,
    city: visitor.city,
    pincode: visitor.pincode,
    block: visitor.block || 'BRILEY ONE',
    floor_number: visitor.floorNumber || visitor.apartmentNo || '',
    company_name: visitor.companyName || visitor.apartmentNo || '',
    whom_to_meet: visitor.whomToMeet || 'Reception',
    reason: visitor.reason || visitor.purpose || 'Visit',
    vehicle_type: visitor.vehicleType,
    vehicle_no: visitor.vehicleNo,
    status: visitor.status || 'Inside',
    entry_time: visitor.entryTime,
    guard_name: visitor.guardName,
    remarks: visitor.remarks,
  };
}

function toVehicle(row: VehicleDto): Vehicle {
  return {
    id: asString(row.id),
    vehicleNo: asString(row.vehicle_no ?? row.vehicleNo),
    vehicleType: asEnum(row.vehicle_type ?? row.vehicleType, ['2-Wheeler', '4-Wheeler', 'Car', 'Bike', 'Other'] as const, 'Other'),
    vehicleModel: asOptionalString(row.vehicle_model ?? row.vehicleModel),
    ownerName: asOptionalString(row.owner_name ?? row.ownerName),
    block: asOptionalString(row.block),
    floorNumber: asOptionalString(row.floor_number),
    companyName: asOptionalString(row.company_name),
    parkingUserType: row.parking_user_type ? asEnum(row.parking_user_type, ['Visitor', 'Employee', 'Vendor', 'Other'] as const, 'Other') : undefined,
    status: asEnum(row.status, ['Inside', 'Exited'] as const, 'Inside'),
    entryTime: asString(row.entry_time ?? row.entryTime),
    exitTime: asOptionalString(row.exit_time),
    checkoutToken: asOptionalString(row.checkout_token ?? row.checkoutToken),
    checkoutTokenExpiresAt: asOptionalString(row.checkout_token_expires_at ?? row.checkoutTokenExpiresAt),
    apartmentNo: asOptionalString(row.floor_number ?? row.apartmentNo),
    type: asOptionalString(row.vehicle_type ?? row.type),
  };
}

function fromVehicle(vehicle: Partial<Vehicle>) {
  return {
    vehicle_no: vehicle.vehicleNo,
    vehicle_type: vehicle.vehicleType || vehicle.type || 'Other',
    vehicle_model: vehicle.vehicleModel,
    owner_name: vehicle.ownerName,
    block: vehicle.block || 'BRILEY ONE',
    floor_number: vehicle.floorNumber || vehicle.apartmentNo,
    company_name: vehicle.companyName || vehicle.apartmentNo,
    parking_user_type: vehicle.parkingUserType || 'Visitor',
    status: vehicle.status || 'Inside',
    entry_time: vehicle.entryTime,
  };
}

function toVendor(row: VendorDto): Vendor {
  return {
    id: asString(row.id),
    name: asString(row.name),
    company: asString(row.company),
    serviceType: asString(row.service_type),
    category: asEnum(row.category, ['Regular Maintenance', 'Utility Providers', 'Ad-Hoc Vendors'] as const, 'Ad-Hoc Vendors'),
    contact: asString(row.contact),
    lastVisit: asOptionalString(row.last_visit),
    nextVisit: asOptionalString(row.next_visit),
    status: asEnum(row.status, ['Active', 'Inactive'] as const, 'Active'),
  };
}

function fromVendor(vendor: Partial<Vendor>) {
  return {
    name: vendor.name,
    company: vendor.company,
    service_type: vendor.serviceType,
    category: vendor.category,
    contact: vendor.contact,
    last_visit: vendor.lastVisit,
    next_visit: vendor.nextVisit,
    status: vendor.status || 'Active',
  };
}

function toStaff(row: StaffDto): Staff {
  return {
    id: asString(row.id),
    name: asString(row.name),
    role: asEnum(row.role, ['Security', 'Housekeeping', 'Electrician', 'Plumber', 'Gardener', 'Driver', 'Receptionist', 'Maintenance'] as const, 'Maintenance'),
    department: asString(row.department),
    contact: asString(row.contact),
    joinDate: asString(row.join_date),
    attendance: {},
  };
}

function fromStaff(staff: Partial<Staff>) {
  return {
    name: staff.name,
    role: staff.role,
    department: staff.department,
    contact: staff.contact,
    join_date: staff.joinDate,
    status: 'Active',
  };
}

function toInventory(row: InventoryDto): InventoryItem {
  const createdAt = asOptionalString(row.created_at);
  return {
    id: asString(row.id),
    itemName: asString(row.item_name),
    category: asEnum(row.category, ['Electrical', 'Plumbing', 'Cleaning', 'Safety', 'General'] as const, 'General'),
    quantity: asNumber(row.quantity),
    unitCost: asNumber(row.unit_cost),
    totalCost: asNumber(row.quantity) * asNumber(row.unit_cost),
    vendor: asString(row.vendor),
    date: asString(row.purchase_date, createdAt ? createdAt.slice(0, 10) : ''),
    usedQuantity: asNumber(row.used_quantity),
    location: asString(row.location),
    usedBy: asString(row.used_by),
  };
}

function fromInventory(item: Partial<InventoryItem>) {
  return {
    item_name: item.itemName,
    category: item.category,
    quantity: item.quantity ?? 0,
    unit_cost: item.unitCost ?? 0,
    vendor: item.vendor,
    purchase_date: item.date,
    used_quantity: item.usedQuantity ?? 0,
    location: item.location,
    used_by: item.usedBy,
  };
}

function toUtility(row: UtilityDto): UtilityTask {
  return {
    id: asString(row.id),
    description: asString(row.description),
    type: asEnum(row.type, ['Sump Cleaning', 'Drainage', 'Lift', 'Electrical', 'Pest Control', 'Fire Safety', 'HVAC', 'General'] as const, 'General'),
    scheduledDate: asString(row.scheduled_date),
    lastCompleted: asOptionalString(row.last_completed),
    status: asEnum(row.status, ['Upcoming', 'Overdue', 'Done'] as const, 'Upcoming'),
    assignedStaff: asOptionalString(row.assigned_staff),
    notes: asOptionalString(row.notes),
  };
}

function fromUtility(task: Partial<UtilityTask>) {
  return {
    description: task.description,
    type: task.type,
    scheduled_date: task.scheduledDate,
    last_completed: task.lastCompleted,
    status: task.status || 'Upcoming',
    assigned_staff: task.assignedStaff,
    notes: task.notes,
  };
}

function toComplaintUpdate(row: ComplaintUpdateDto): ComplaintUpdate {
  return {
    id: String(row.id),
    complaintId: String(row.complaint_id),
    updatedBy: row.updated_by != null ? String(row.updated_by) : undefined,
    oldStatus: row.old_status ? String(row.old_status) : undefined,
    newStatus: String(row.new_status ?? ''),
    remarks: row.remarks ? String(row.remarks) : undefined,
    createdAt: String(row.created_at ?? ''),
  };
}

function toComplaint(row: ComplaintDto): ComplaintTicket {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id ?? ''),
    officeId: String(row.office_id ?? ''),
    category: String(row.category ?? ''),
    subject: String(row.subject ?? ''),
    description: String(row.description ?? ''),
    priority: (row.priority as ComplaintTicket['priority']) || 'Low',
    status: (row.status as ComplaintTicket['status']) || 'Open',
    assignedVendorId: row.assigned_vendor_id != null ? String(row.assigned_vendor_id) : undefined,
    attachmentId: row.attachment_id != null ? String(row.attachment_id) : undefined,
    createdAt: String(row.created_at ?? ''),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    history: row.history ? row.history.map(toComplaintUpdate) : undefined,
  };
}

function fromComplaintCreate(payload: { category: string; subject: string; description: string; priority?: ComplaintTicket['priority']; attachmentId?: string | number }) {
  return {
    category: payload.category,
    subject: payload.subject,
    description: payload.description,
    priority: payload.priority || 'Low',
    attachment_id: payload.attachmentId ?? null,
  };
}

function toMaintenanceUpdate(row: MaintenanceUpdateDto): MaintenanceUpdate {
  return {
    id: String(row.id),
    maintenanceRequestId: String(row.maintenance_request_id),
    updatedBy: row.updated_by != null ? String(row.updated_by) : undefined,
    oldStatus: row.old_status ? String(row.old_status) : undefined,
    newStatus: String(row.new_status ?? ''),
    remarks: row.remarks ? String(row.remarks) : undefined,
    createdAt: String(row.created_at ?? ''),
  };
}

function toMaintenanceRequest(row: MaintenanceRequestDto): MaintenanceRequestTicket {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id ?? ''),
    officeId: String(row.office_id ?? ''),
    category: String(row.category ?? ''),
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    priority: (row.priority as MaintenanceRequestTicket['priority']) || 'Low',
    status: (row.status as MaintenanceRequestTicket['status']) || 'Open',
    assignedVendorId: row.assigned_vendor_id != null ? String(row.assigned_vendor_id) : undefined,
    assignedStaffId: row.assigned_staff_id != null ? String(row.assigned_staff_id) : undefined,
    attachmentId: row.attachment_id != null ? String(row.attachment_id) : undefined,
    expectedCompletion: row.expected_completion ? String(row.expected_completion) : undefined,
    completedAt: row.completed_at ? String(row.completed_at) : undefined,
    createdAt: String(row.created_at ?? ''),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    history: row.history ? row.history.map(toMaintenanceUpdate) : undefined,
  };
}

function fromMaintenanceRequestCreate(payload: { category: string; title: string; description: string; priority?: MaintenanceRequestTicket['priority']; attachmentId?: string | number; expectedCompletion?: string }) {
  return {
    category: payload.category,
    title: payload.title,
    description: payload.description,
    priority: payload.priority || 'Low',
    attachment_id: payload.attachmentId ?? null,
    expected_completion: payload.expectedCompletion ?? null,
  };
}

function toInvoice(row: InvoiceDto): Invoice {
  return {
    id: String(row.id ?? ''),
    officeId: row.office_id != null ? String(row.office_id) : undefined,
    invoiceNo: String(row.invoice_no ?? ''),
    description: row.description ? String(row.description) : undefined,
    amount: Number(row.amount ?? 0),
    paidAmount: Number(row.paid_amount ?? 0),
    dueDate: row.due_date ? String(row.due_date) : undefined,
    status: (row.status as Invoice['status']) || 'Pending',
    createdAt: String(row.created_at ?? ''),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    // P24 Razorpay fields
    razorpayOrderId: row.razorpay_order_id ? String(row.razorpay_order_id) : undefined,
    razorpayPaymentId: row.razorpay_payment_id ? String(row.razorpay_payment_id) : undefined,
    paymentMethod: row.payment_method ? String(row.payment_method) : undefined,
    paymentGatewayStatus: row.payment_gateway_status ? String(row.payment_gateway_status) : undefined,
    refundStatus: row.refund_status ? String(row.refund_status) : undefined,
  };
}

function fromInvoiceCreate(payload: { officeId?: string; invoiceNo: string; description?: string; amount: number; dueDate?: string; status?: Invoice['status'] }) {
  return {
    office_id: payload.officeId ? Number(payload.officeId) : null,
    invoice_no: payload.invoiceNo,
    description: payload.description ?? null,
    amount: payload.amount,
    due_date: payload.dueDate ?? null,
    status: payload.status ?? 'Pending',
  };
}

function toFinancialSummary(row: FinancialSummaryDto): FinancialSummary {
  return {
    invoiceCount: Number(row.invoiceCount ?? 0),
    billed: Number(row.billed ?? 0),
    collected: Number(row.collected ?? 0),
    pending: Number(row.pending ?? 0),
    byStatus: row.byStatus ?? [],
  };
}

function toVendorService(row: VendorServiceDto): VendorService {
  return {
    id: asString(row.id),
    vendorId: asString(row.vendor_id),
    name: asString(row.name),
    description: asOptionalString(row.description),
    price: row.price != null ? asNumber(row.price) : undefined,
    unit: asOptionalString(row.unit),
    isActive: Number(row.is_active ?? 1) === 1,
  };
}

function toVendorGalleryItem(row: VendorGalleryDto): VendorGalleryItem {
  return {
    id: asString(row.id),
    vendorId: asString(row.vendor_id),
    attachmentId: asOptionalString(row.attachment_id),
    caption: asOptionalString(row.caption),
    sortOrder: asNumber(row.sort_order),
  };
}

function toVendorReview(row: VendorReviewDto): VendorReview {
  return {
    id: asString(row.id),
    vendorId: asString(row.vendor_id),
    userId: asString(row.user_id),
    bookingId: asOptionalString(row.booking_id),
    rating: asNumber(row.rating),
    title: asOptionalString(row.title),
    comment: asOptionalString(row.comment),
    attachmentId: asOptionalString(row.attachment_id),
    status: asEnum(row.status, ['Pending', 'Approved', 'Hidden'] as const, 'Pending'),
    createdAt: asString(row.created_at),
  };
}

function toVendorBooking(row: VendorBookingDto): VendorBooking {
  return {
    id: asString(row.id),
    vendorId: asString(row.vendor_id),
    userId: asString(row.user_id),
    officeId: asOptionalString(row.office_id),
    serviceId: asOptionalString(row.service_id),
    title: asString(row.title),
    description: asOptionalString(row.description),
    scheduledFor: asOptionalString(row.scheduled_for),
    status: asEnum(row.status, ['Requested', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'] as const, 'Requested'),
    completedAt: asOptionalString(row.completed_at),
    createdAt: asString(row.created_at),
  };
}

function toVendorCategory(row: VendorCategoryDto): VendorCategory {
  return {
    id: asString(row.id),
    name: asString(row.name),
    slug: asString(row.slug),
    description: asOptionalString(row.description),
    icon: asOptionalString(row.icon),
  };
}

function toMarketplaceVendor(row: MarketplaceVendorDto): MarketplaceVendor {
  return {
    id: asString(row.id),
    name: asString(row.name),
    company: asString(row.company),
    serviceType: asString(row.service_type),
    category: asString(row.category),
    categoryId: asOptionalString(row.category_id),
    contact: asString(row.contact),
    description: asOptionalString(row.description),
    serviceArea: asOptionalString(row.service_area),
    availability: asOptionalString(row.availability),
    ratingAvg: asNumber(row.rating_avg),
    reviewCount: asNumber(row.review_count),
    bookingCount: asNumber(row.booking_count),
    isVerified: Number(row.is_verified ?? 0) === 1,
    isFeatured: Number(row.is_featured ?? 0) === 1,
    status: asEnum(row.status, ['Active', 'Inactive'] as const, 'Active'),
    services: row.services ? row.services.map(toVendorService) : undefined,
    gallery: row.gallery ? row.gallery.map(toVendorGalleryItem) : undefined,
    reviews: row.reviews ? row.reviews.map(toVendorReview) : undefined,
    reviewDistribution: row.reviewDistribution,
  };
}

function toVendorStats(row: VendorStatsDto): VendorMarketplaceStats {
  return {
    vendors: {
      total: row.vendors?.total ?? 0,
      verified: row.vendors?.verified ?? 0,
      featured: row.vendors?.featured ?? 0,
      avgRating: row.vendors?.avgRating ?? 0,
    },
    bookingsByStatus: row.bookingsByStatus ?? [],
    reviewsByStatus: row.reviewsByStatus ?? [],
  };
}

function toVendorDashboard(row: VendorDashboardDto): VendorMarketplaceDashboard {
  return {
    stats: toVendorStats(row.stats ?? {}),
    topRated: row.topRated ?? [],
    mostBooked: row.mostBooked ?? [],
    recentReviews: (row.recentReviews ?? []).map(toVendorReview),
  };
}

function toNotification(row: NotificationDto): AppNotification {
  return {
    id: String(row.id ?? ''),
    userId: String(row.user_id ?? ''),
    title: String(row.title ?? ''),
    message: String(row.message ?? ''),
    type: String(row.type ?? ''),
    category: String(row.category ?? ''),
    priority: (row.priority as AppNotification['priority']) || 'Medium',
    isRead: Number(row.is_read ?? 0) === 1 || row.is_read === true,
    actionUrl: row.action_url ? String(row.action_url) : undefined,
    referenceType: row.reference_type ? String(row.reference_type) : undefined,
    referenceId: row.reference_id != null ? String(row.reference_id) : undefined,
    createdBy: row.created_by != null ? String(row.created_by) : undefined,
    createdByName: row.created_by_name ? String(row.created_by_name) : undefined,
    createdAt: String(row.created_at ?? ''),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function fromNotificationCreate(payload: NotificationCreatePayload) {
  return {
    title: payload.title,
    message: payload.message,
    type: payload.type,
    category: payload.category,
    priority: payload.priority,
    action_url: payload.actionUrl,
    reference_type: payload.referenceType,
    reference_id: payload.referenceId ? Number(payload.referenceId) : undefined,
    role: payload.role,
    roles: payload.roles,
    user_id: payload.userId ? Number(payload.userId) : undefined,
    user_ids: payload.userIds?.map((id) => Number(id)),
    office_id: payload.officeId ? Number(payload.officeId) : undefined,
  };
}

function calculateDuration(entryTime: string, exitTime: string): string {
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  const diffMs = Math.max(0, exit.getTime() - entry.getTime());
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);
  return diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}m`;
}

// ── P9-14 DTO types ────────────────────────────────────────────────────────
type RentalListingDto = Record<string, DtoValue> & { images?: Record<string, DtoValue>[]; history?: Record<string, DtoValue>[] };
type BusinessAdDto = Record<string, DtoValue>;
type BusinessCategoryDto = Record<string, DtoValue>;
type AnnouncementDto = Record<string, DtoValue>;
type EmergencyContactDto = Record<string, DtoValue>;
type DailyWorkerDto = Record<string, DtoValue> & { attendance?: Record<string, DtoValue>[] };
type WorkerAttendanceDto = Record<string, DtoValue>;

// ── P9-10 Rental mappers ─────────────────────────────────────────────────────
function toRentalListing(row: RentalListingDto): RentalListing {
  return {
    id: asString(row.id),
    officeId: asOptionalString(row.office_id),
    ownerId: asString(row.owner_id),
    title: asString(row.title),
    description: asOptionalString(row.description),
    listingType: asEnum(row.listing_type, ['Rent', 'Sale'] as const, 'Rent'),
    propertyType: asEnum(row.property_type, ['Office', 'Apartment', 'Shop', 'Parking'] as const, 'Office'),
    price: row.price != null ? asNumber(row.price) : undefined,
    deposit: row.deposit != null ? asNumber(row.deposit) : undefined,
    areaSqft: row.area_sqft != null ? asNumber(row.area_sqft) : undefined,
    bedrooms: row.bedrooms != null ? asNumber(row.bedrooms) : undefined,
    bathrooms: row.bathrooms != null ? asNumber(row.bathrooms) : undefined,
    furnishing: asOptionalString(row.furnishing),
    availableFrom: asOptionalString(row.available_from),
    status: asEnum(row.status, ['Pending', 'Approved', 'Rejected', 'Active', 'Closed'] as const, 'Pending'),
    featured: Number(row.featured ?? 0) === 1,
    contactName: asOptionalString(row.contact_name),
    contactPhone: asOptionalString(row.contact_phone),
    adminNotes: asOptionalString(row.admin_notes),
    viewCount: asNumber(row.view_count),
    favoriteCount: asNumber(row.favorite_count),
    isFavorite: Number(row.is_favorite ?? 0) === 1 || row.is_favorite === true,
    images: row.images?.map((img) => ({
      id: asString(img.id), listingId: asString(img.listing_id),
      attachmentId: asOptionalString(img.attachment_id), caption: asOptionalString(img.caption),
      sortOrder: asNumber(img.sort_order),
    } as import('@/types').ListingImage)),
    history: row.history?.map((h) => ({
      id: asString(h.id), listingId: asString(h.listing_id),
      changedBy: asString(h.changed_by), changedByName: asOptionalString(h.changed_by_name),
      fromStatus: asOptionalString(h.from_status), toStatus: asString(h.to_status),
      comment: asOptionalString(h.comment), createdAt: asString(h.created_at),
    } as ListingStatusHistory)),
    createdAt: asString(row.created_at),
    updatedAt: asOptionalString(row.updated_at),
  };
}

function fromRentalListing(p: Partial<RentalListing>) {
  return {
    title: p.title,
    description: p.description ?? null,
    listing_type: p.listingType,
    property_type: p.propertyType,
    price: p.price ?? null,
    deposit: p.deposit ?? null,
    area_sqft: p.areaSqft ?? null,
    bedrooms: p.bedrooms ?? null,
    bathrooms: p.bathrooms ?? null,
    furnishing: p.furnishing ?? null,
    available_from: p.availableFrom ?? null,
    contact_name: p.contactName ?? null,
    contact_phone: p.contactPhone ?? null,
  };
}

// ── P11 Business Ad mappers ──────────────────────────────────────────────────
function toBusinessAd(row: BusinessAdDto): BusinessAd {
  return {
    id: asString(row.id),
    categoryId: asOptionalString(row.category_id),
    businessName: asString(row.business_name),
    description: asOptionalString(row.description),
    offer: asOptionalString(row.offer),
    website: asOptionalString(row.website),
    phone: asOptionalString(row.phone),
    whatsapp: asOptionalString(row.whatsapp),
    address: asOptionalString(row.address),
    logoAttachmentId: asOptionalString(row.logo_attachment_id),
    bannerAttachmentId: asOptionalString(row.banner_attachment_id),
    featured: Number(row.featured ?? 0) === 1,
    priority: asNumber(row.priority),
    status: asEnum(row.status, ['Pending', 'Active', 'Rejected', 'Expired', 'Inactive'] as const, 'Pending'),
    expiresAt: asOptionalString(row.expires_at),
    viewCount: asNumber(row.view_count),
    clickCount: asNumber(row.click_count),
    // P23 analytics fields
    impressions: asNumber(row.impressions),
    clicks: asNumber(row.clicks),
    ctr: asNumber(row.ctr),
    isFeatured: Number(row.is_featured ?? 0) === 1,
    packageId: asOptionalString(row.package_id),
    expiresAtBilling: asOptionalString(row.expires_at_billing),
    renewalNotified: Number(row.renewal_notified ?? 0) === 1,
    createdAt: asString(row.created_at),
    updatedAt: asOptionalString(row.updated_at),
  };
}

function fromBusinessAd(p: Partial<BusinessAd>) {
  return {
    category_id: p.categoryId ? Number(p.categoryId) : null,
    business_name: p.businessName,
    description: p.description ?? null,
    offer: p.offer ?? null,
    website: p.website ?? null,
    phone: p.phone ?? null,
    whatsapp: p.whatsapp ?? null,
    address: p.address ?? null,
    logo_attachment_id: p.logoAttachmentId ? Number(p.logoAttachmentId) : null,
    banner_attachment_id: p.bannerAttachmentId ? Number(p.bannerAttachmentId) : null,
    featured: p.featured !== undefined ? (p.featured ? 1 : 0) : undefined,
    priority: p.priority,
    status: p.status,
    expires_at: p.expiresAt ?? null,
  };
}

function toBusinessCategory(row: BusinessCategoryDto): BusinessCategory {
  return {
    id: asString(row.id),
    name: asString(row.name),
    slug: asString(row.slug),
    icon: asOptionalString(row.icon),
  };
}

// ── P12 Announcement mappers ─────────────────────────────────────────────────
function toAnnouncement(row: AnnouncementDto): Announcement {
  return {
    id: asString(row.id),
    title: asString(row.title),
    description: asString(row.description),
    priority: asEnum(row.priority, ['Low', 'Medium', 'High', 'Emergency'] as const, 'Medium'),
    audience: asEnum(row.audience, ['All', 'Tenants', 'Security', 'Admin'] as const, 'All'),
    attachmentId: asOptionalString(row.attachment_id),
    publishAt: asOptionalString(row.publish_at),
    expiresAt: asOptionalString(row.expires_at),
    status: asEnum(row.status, ['Draft', 'Published', 'Scheduled', 'Expired', 'Archived'] as const, 'Draft'),
    createdBy: asString(row.created_by),
    isRead: Number(row.is_read ?? 0) === 1 || row.is_read === true,
    readCount: row.read_count != null ? asNumber(row.read_count) : undefined,
    createdAt: asString(row.created_at),
    updatedAt: asOptionalString(row.updated_at),
  };
}

function fromAnnouncement(p: Partial<Announcement> & { publishNow?: boolean }) {
  return {
    title: p.title,
    description: p.description,
    priority: p.priority,
    audience: p.audience,
    attachment_id: p.attachmentId ? Number(p.attachmentId) : null,
    publish_at: p.publishAt ?? null,
    expires_at: p.expiresAt ?? null,
    status: p.status,
    publish_now: p.publishNow ? 1 : undefined,
  };
}

// ── P13 Emergency Contact mappers ────────────────────────────────────────────
function toEmergencyContact(row: EmergencyContactDto): EmergencyContact {
  return {
    id: asString(row.id),
    name: asString(row.name),
    category: asString(row.category),
    phone: asString(row.phone),
    alternatePhone: asOptionalString(row.alternate_phone),
    email: asOptionalString(row.email),
    address: asOptionalString(row.address),
    priority: asNumber(row.priority),
    available24h: Number(row.available_24h ?? 0) === 1,
    isPinned: Number(row.is_pinned ?? 0) === 1,
    status: asEnum(row.status, ['Active', 'Inactive'] as const, 'Active'),
    createdAt: asString(row.created_at),
    updatedAt: asOptionalString(row.updated_at),
  };
}

function fromEmergencyContact(p: Partial<EmergencyContact>) {
  return {
    name: p.name,
    category: p.category,
    phone: p.phone,
    alternate_phone: p.alternatePhone ?? null,
    email: p.email ?? null,
    address: p.address ?? null,
    priority: p.priority,
    available_24h: p.available24h !== undefined ? (p.available24h ? 1 : 0) : undefined,
    is_pinned: p.isPinned !== undefined ? (p.isPinned ? 1 : 0) : undefined,
    status: p.status,
  };
}

// ── P14 Daily Worker mappers ─────────────────────────────────────────────────
function toDailyWorker(row: DailyWorkerDto): DailyWorker {
  return {
    id: asString(row.id),
    name: asString(row.name),
    phone: asOptionalString(row.phone),
    workerType: asString(row.worker_type),
    photoAttachmentId: asOptionalString(row.photo_attachment_id),
    idProofAttachmentId: asOptionalString(row.id_proof_attachment_id),
    address: asOptionalString(row.address),
    officeId: asOptionalString(row.office_id),
    status: asEnum(row.status, ['Active', 'Inactive', 'Blacklisted'] as const, 'Active'),
    qrCode: asOptionalString(row.qr_code),
    attendance: row.attendance?.map(toWorkerAttendance),
    createdAt: asString(row.created_at),
    updatedAt: asOptionalString(row.updated_at),
  };
}

function fromDailyWorker(p: Partial<DailyWorker>) {
  return {
    name: p.name,
    phone: p.phone ?? null,
    worker_type: p.workerType,
    photo_attachment_id: p.photoAttachmentId ? Number(p.photoAttachmentId) : null,
    id_proof_attachment_id: p.idProofAttachmentId ? Number(p.idProofAttachmentId) : null,
    address: p.address ?? null,
    office_id: p.officeId ? Number(p.officeId) : null,
    status: p.status,
  };
}

function toWorkerAttendance(row: WorkerAttendanceDto): WorkerAttendance {
  return {
    id: asString(row.id),
    workerId: asString(row.worker_id),
    workDate: asString(row.work_date),
    entryTime: asOptionalString(row.entry_time),
    exitTime: asOptionalString(row.exit_time),
    status: asEnum(row.status, ['Present', 'Absent', 'Half Day', 'Leave'] as const, 'Present'),
    markedBy: asOptionalString(row.marked_by),
    notes: asOptionalString(row.notes),
    createdAt: asString(row.created_at),
  };
}

// ── P17 Visitor Pass DTO types & mappers ─────────────────────────────────────
type VisitorPassDto = Record<string, DtoValue> & { scans?: Record<string, DtoValue>[] };
type VisitorPassDashboardDto = {
  total_today?: number;
  active?: number;
  expired?: number;
  used?: number;
  cancelled?: number;
  by_type?: Record<string, number>;
  by_status?: Record<string, number>;
  recent?: VisitorPassDto[];
};

function toVisitorPassScan(row: Record<string, DtoValue>): import('@/types').VisitorPassScan {
  return {
    id: asNumber(row.id),
    passId: asNumber(row.pass_id),
    scannedAt: asString(row.scanned_at),
    scannedBy: row.scanned_by != null ? asNumber(row.scanned_by) : undefined,
    action: (row.action === 'exit' ? 'exit' : 'entry'),
    notes: asOptionalString(row.notes),
  };
}

function toVisitorPass(row: VisitorPassDto): VisitorPass {
  return {
    id: asString(row.id),
    passCode: asString(row.pass_code),
    passType: asEnum(row.pass_type, ['Temporary', 'One Day', 'Recurring', 'Delivery', 'Worker', 'Guest'] as const, 'Guest'),
    visitorName: asString(row.visitor_name),
    visitorPhone: asOptionalString(row.visitor_phone),
    hostName: asOptionalString(row.host_name),
    hostOfficeId: row.host_office_id != null ? asNumber(row.host_office_id) : undefined,
    purpose: asOptionalString(row.purpose),
    validFrom: asString(row.valid_from),
    validUntil: asString(row.valid_until),
    maxUses: asNumber(row.max_uses, 1),
    usedCount: asNumber(row.used_count),
    status: asEnum(row.status, ['Active', 'Used', 'Expired', 'Cancelled'] as const, 'Active'),
    qrPayload: asString(row.qr_payload),
    createdBy: row.created_by != null ? asNumber(row.created_by) : undefined,
    sharedVia: asOptionalString(row.shared_via),
    notes: asOptionalString(row.notes),
    createdAt: asString(row.created_at),
    updatedAt: asOptionalString(row.updated_at),
    scans: row.scans ? row.scans.map(toVisitorPassScan) : undefined,
  };
}

function toVisitorPassDashboard(row: VisitorPassDashboardDto): VisitorPassDashboard {
  return {
    totalToday: Number(row.total_today ?? 0),
    active: Number(row.active ?? 0),
    expired: Number(row.expired ?? 0),
    used: Number(row.used ?? 0),
    cancelled: Number(row.cancelled ?? 0),
    byType: row.by_type ?? {},
    byStatus: row.by_status ?? {},
    recent: (row.recent ?? []).map(toVisitorPass),
  };
}

// ── P15 Secretary Portal types ───────────────────────────────────────────────
export interface SecretaryPermission {
  module: string;
  canView: boolean;
  canEdit: boolean;
}

export interface SecretaryUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isSecretary: boolean;
  status: string;
  createdAt: string;
  updatedAt?: string;
  permissions?: SecretaryPermission[];
  modules?: string[];
}

export interface SecretaryDashboardData {
  todayVisitors: number;
  activeVisitors: number;
  openComplaints: number;
  pendingMaintenance: number;
  pendingRentals: number;
  pendingVendorRequests: number;
  todayWorkers: number;
  recentComplaints: Array<{ id: number; category: string; subject: string; status: string; priority: string; created_at: string }>;
  recentMaintenance: Array<{ id: number; category: string; title: string; status: string; priority: string; created_at: string }>;
  pendingAnnouncements: Array<{ id: number; title: string; status: string; priority: string; created_at: string }>;
}

// ── P18 Analytics mappers ──────────────────────────────────────────────────────

function toMonthlyTrend(raw: unknown[]): import('@/types').MonthlyTrend[] {
  return (raw ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return { month: String(row.month ?? ''), count: Number(row.count ?? 0) };
  });
}

function toCountRecord(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([k, v]) => [k, Number(v ?? 0)])
  );
}

function toOccupancyAnalytics(raw: Record<string, unknown>): OccupancyAnalytics {
  return {
    total: Number(raw.total ?? 0),
    occupied: Number(raw.occupied ?? 0),
    vacant: Number(raw.vacant ?? 0),
    occupancyRate: Number(raw.occupancy_rate ?? 0),
    byBlock: ((raw.by_block ?? []) as Record<string, unknown>[]).map((r) => ({
      block: String(r.block ?? ''),
      occupied: Number(r.occupied ?? 0),
      total: Number(r.total ?? 0),
    })),
  };
}

function toComplaintAnalytics(raw: Record<string, unknown>): ComplaintAnalytics {
  return {
    total: Number(raw.total ?? 0),
    byStatus: toCountRecord(raw.by_status),
    byPriority: toCountRecord(raw.by_priority),
    monthlyTrend: toMonthlyTrend(raw.monthly_trend as unknown[] ?? []),
    avgResolutionHours: Number(raw.avg_resolution_hours ?? 0),
  };
}

function toMaintenanceAnalytics(raw: Record<string, unknown>): MaintenanceAnalytics {
  return {
    total: Number(raw.total ?? 0),
    byStatus: toCountRecord(raw.by_status),
    byType: toCountRecord(raw.by_type),
    pending: Number(raw.pending ?? 0),
    monthlyTrend: toMonthlyTrend(raw.monthly_trend as unknown[] ?? []),
    avgResolutionHours: Number(raw.avg_resolution_hours ?? 0),
  };
}

function toVendorAnalytics(raw: Record<string, unknown>): VendorAnalytics {
  return {
    total: Number(raw.total ?? 0),
    avgRating: Number(raw.avg_rating ?? 0),
    totalBookings: Number(raw.total_bookings ?? 0),
    bookingsByStatus: toCountRecord(raw.bookings_by_status),
    topRated: ((raw.top_rated ?? []) as Record<string, unknown>[]).map((r) => ({
      id: String(r.id ?? ''),
      name: String(r.name ?? ''),
      rating: Number(r.rating ?? 0),
    })),
    topBooked: ((raw.top_booked ?? []) as Record<string, unknown>[]).map((r) => ({
      id: String(r.id ?? ''),
      name: String(r.name ?? ''),
      bookingCount: Number(r.booking_count ?? 0),
    })),
    monthlyBookings: toMonthlyTrend(raw.monthly_bookings as unknown[] ?? []),
  };
}

function toRentalAnalytics(raw: Record<string, unknown>): RentalAnalytics {
  return {
    total: Number(raw.total ?? 0),
    active: Number(raw.active ?? 0),
    pendingApproval: Number(raw.pending_approval ?? 0),
    byType: toCountRecord(raw.by_type),
    avgRent: Number(raw.avg_rent ?? 0),
    monthlyListings: toMonthlyTrend(raw.monthly_listings as unknown[] ?? []),
  };
}

function toVisitorAnalytics(raw: Record<string, unknown>): VisitorAnalytics {
  return {
    today: Number(raw.today ?? 0),
    thisWeek: Number(raw.this_week ?? 0),
    thisMonth: Number(raw.this_month ?? 0),
    byDayOfWeek: ((raw.by_day_of_week ?? []) as Record<string, unknown>[]).map((r) => ({
      day: String(r.day ?? ''),
      count: Number(r.count ?? 0),
    })),
    monthlyTrend: toMonthlyTrend(raw.monthly_trend as unknown[] ?? []),
  };
}

function toRevenueAnalytics(raw: Record<string, unknown>): RevenueAnalytics {
  return {
    totalInvoiced: Number(raw.total_invoiced ?? 0),
    totalPaid: Number(raw.total_paid ?? 0),
    totalPending: Number(raw.total_pending ?? 0),
    totalOverdue: Number(raw.total_overdue ?? 0),
    monthlyRevenue: ((raw.monthly_revenue ?? []) as Record<string, unknown>[]).map((r) => ({
      month: String(r.month ?? ''),
      paid: Number(r.paid ?? 0),
      pending: Number(r.pending ?? 0),
    })),
    byStatus: toCountRecord(raw.by_status),
  };
}

function toWorkerAnalytics(raw: Record<string, unknown>): WorkerAnalytics {
  return {
    totalWorkers: Number(raw.total_workers ?? 0),
    active: Number(raw.active ?? 0),
    todayPresent: Number(raw.today_present ?? 0),
    todayAbsent: Number(raw.today_absent ?? 0),
    attendanceRateThisWeek: Number(raw.attendance_rate_this_week ?? 0),
    byType: toCountRecord(raw.by_type),
  };
}

function toAnalyticsSummary(raw: Record<string, unknown>): AnalyticsSummary {
  return {
    occupancy: toOccupancyAnalytics((raw.occupancy ?? {}) as Record<string, unknown>),
    complaints: toComplaintAnalytics((raw.complaints ?? {}) as Record<string, unknown>),
    maintenance: toMaintenanceAnalytics((raw.maintenance ?? {}) as Record<string, unknown>),
    vendors: toVendorAnalytics((raw.vendors ?? {}) as Record<string, unknown>),
    rentals: toRentalAnalytics((raw.rentals ?? {}) as Record<string, unknown>),
    visitors: toVisitorAnalytics((raw.visitors ?? {}) as Record<string, unknown>),
    revenue: toRevenueAnalytics((raw.revenue ?? {}) as Record<string, unknown>),
    workers: toWorkerAnalytics((raw.workers ?? {}) as Record<string, unknown>),
  };
}

// ── P19 Community Events DTO types & mappers ─────────────────────────────────
type EventDto = Record<string, DtoValue> & { my_registration?: EventRegistrationDto | null; recent_registrations?: EventRegistrationDto[] };
type EventRegistrationDto = Record<string, DtoValue>;
type EventDashboardDto = {
  upcoming_count?: number;
  this_month_count?: number;
  total_published?: number;
  today_registrations?: number;
  recent_events?: EventDto[];
};

function toCommunityEvent(row: EventDto): CommunityEvent {
  const reg = row.my_registration != null ? toEventRegistration(row.my_registration as EventRegistrationDto) : undefined;
  const recentRegs = row.recent_registrations ? (row.recent_registrations as EventRegistrationDto[]).map(toEventRegistration) : undefined;
  return {
    id: asString(row.id),
    title: asString(row.title),
    description: asOptionalString(row.description),
    location: asOptionalString(row.location),
    organizer: asOptionalString(row.organizer),
    eventDate: asString(row.event_date),
    eventTime: asOptionalString(row.event_time),
    imageAttachmentId: asOptionalString(row.image_attachment_id),
    attachmentId: asOptionalString(row.attachment_id),
    capacity: asNumber(row.capacity),
    registrationRequired: Number(row.registration_required ?? 0) === 1 || row.registration_required === true,
    registrationCount: row.registration_count != null ? asNumber(row.registration_count) : undefined,
    status: asEnum(row.status, ['Draft', 'Published', 'Cancelled', 'Completed'] as const, 'Draft'),
    createdBy: asOptionalString(row.created_by),
    createdAt: asString(row.created_at),
    updatedAt: asOptionalString(row.updated_at),
    myRegistration: reg ?? null,
    isRegistered: Number(row.is_registered ?? 0) === 1 || row.is_registered === true,
    recentRegistrations: recentRegs,
  };
}

function fromCommunityEvent(p: Partial<CommunityEvent>) {
  return {
    title: p.title,
    description: p.description ?? null,
    location: p.location ?? null,
    organizer: p.organizer ?? null,
    event_date: p.eventDate,
    event_time: p.eventTime ?? null,
    image_attachment_id: p.imageAttachmentId ? Number(p.imageAttachmentId) : null,
    attachment_id: p.attachmentId ? Number(p.attachmentId) : null,
    capacity: p.capacity ?? 0,
    registration_required: p.registrationRequired !== undefined ? (p.registrationRequired ? 1 : 0) : undefined,
    status: p.status,
  };
}

function toEventRegistration(row: EventRegistrationDto): EventRegistration {
  return {
    id: asString(row.id),
    eventId: asString(row.event_id),
    userId: asOptionalString(row.user_id),
    name: asString(row.name),
    phone: asOptionalString(row.phone),
    email: asOptionalString(row.email),
    status: asEnum(row.status, ['Registered', 'Cancelled', 'Attended'] as const, 'Registered'),
    registeredAt: asString(row.registered_at),
    notes: asOptionalString(row.notes),
    eventTitle: asOptionalString(row.event_title),
    eventDate: asOptionalString(row.event_date),
    eventTime: asOptionalString(row.event_time),
    location: asOptionalString(row.location),
    eventStatus: asOptionalString(row.event_status),
  };
}

function toEventDashboard(row: EventDashboardDto): EventDashboard {
  return {
    upcomingCount: Number(row.upcoming_count ?? 0),
    thisMonthCount: Number(row.this_month_count ?? 0),
    totalPublished: Number(row.total_published ?? 0),
    todayRegistrations: Number(row.today_registrations ?? 0),
    recentEvents: (row.recent_events ?? []).map(toCommunityEvent),
  };
}

// ── P21 CCTV Foundation DTO types & mappers ──────────────────────────────────
type CameraDeviceDto = Record<string, DtoValue>;
type CameraEventDto = Record<string, DtoValue>;
type CameraSnapshotDto = Record<string, DtoValue>;
type CameraDashboardDto = {
  total_cameras?: number;
  by_status?: Record<string, number>;
  total_events_today?: number;
  unacknowledged_events?: number;
  recent_events?: CameraEventDto[];
  cameras_by_zone?: { zone: string; count: number }[];
};

function toCameraDevice(row: CameraDeviceDto): CameraDevice {
  return {
    id: asString(row.id),
    name: asString(row.name),
    location: asString(row.location),
    zone: asOptionalString(row.zone),
    rtspUrl: asOptionalString(row.rtsp_url),
    ipAddress: asOptionalString(row.ip_address),
    port: row.port != null ? asNumber(row.port) : undefined,
    manufacturer: asOptionalString(row.manufacturer),
    model: asOptionalString(row.model),
    resolution: asOptionalString(row.resolution),
    status: asEnum(row.status, ['Online', 'Offline', 'Maintenance', 'Fault'] as const, 'Offline'),
    lastHeartbeat: asOptionalString(row.last_heartbeat),
    snapshotUrl: asOptionalString(row.snapshot_url),
    isRecording: row.is_recording === true || Number(row.is_recording ?? 0) === 1,
    isActive: row.is_active === true || Number(row.is_active ?? 1) === 1,
    notes: asOptionalString(row.notes),
    createdAt: asString(row.created_at),
  };
}

function fromCameraDevice(p: Partial<CameraDevice> & { password?: string }) {
  return {
    name: p.name,
    location: p.location,
    zone: p.zone ?? null,
    rtsp_url: p.rtspUrl ?? null,
    ip_address: p.ipAddress ?? null,
    port: p.port ?? 554,
    manufacturer: p.manufacturer ?? null,
    model: p.model ?? null,
    resolution: p.resolution ?? null,
    status: p.status,
    snapshot_url: p.snapshotUrl ?? null,
    is_recording: p.isRecording !== undefined ? (p.isRecording ? 1 : 0) : undefined,
    is_active: p.isActive !== undefined ? (p.isActive ? 1 : 0) : undefined,
    notes: p.notes ?? null,
    password: p.password ?? undefined,
  };
}

function toCameraEvent(row: CameraEventDto): CameraEvent {
  return {
    id: asString(row.id),
    cameraId: asString(row.camera_id),
    eventType: asString(row.event_type),
    severity: asEnum(row.severity, ['Low', 'Medium', 'High', 'Critical'] as const, 'Low'),
    description: asOptionalString(row.description),
    snapshotId: row.snapshot_id != null ? asString(row.snapshot_id) : undefined,
    acknowledged: row.acknowledged === true || Number(row.acknowledged ?? 0) === 1,
    acknowledgedBy: row.acknowledged_by != null ? asString(row.acknowledged_by) : undefined,
    acknowledgedAt: asOptionalString(row.acknowledged_at),
    occurredAt: asString(row.occurred_at),
    createdAt: asString(row.created_at),
  };
}

function toCameraSnapshot(row: CameraSnapshotDto): CameraSnapshot {
  return {
    id: asString(row.id),
    cameraId: asString(row.camera_id),
    fileUrl: asOptionalString(row.file_url),
    capturedAt: asString(row.captured_at),
    trigger: asString(row.trigger, 'Manual'),
    eventId: row.event_id != null ? asString(row.event_id) : undefined,
    notes: asOptionalString(row.notes),
  };
}

function toCameraDashboard(row: CameraDashboardDto): CameraDashboard {
  return {
    totalCameras: Number(row.total_cameras ?? 0),
    byStatus: {
      Online: Number(row.by_status?.Online ?? 0),
      Offline: Number(row.by_status?.Offline ?? 0),
      Maintenance: Number(row.by_status?.Maintenance ?? 0),
      Fault: Number(row.by_status?.Fault ?? 0),
    },
    totalEventsToday: Number(row.total_events_today ?? 0),
    unacknowledgedEvents: Number(row.unacknowledged_events ?? 0),
    recentEvents: (row.recent_events ?? []).map(toCameraEvent),
    camerasByZone: (row.cameras_by_zone ?? []).map((z) => ({ zone: z.zone, count: Number(z.count ?? 0) })),
  };
}

// ── P22 Premium Membership DTO types & mappers ────────────────────────────────

type SubscriptionPlanDto = Record<string, DtoValue> & { features?: string[] | string };
type SubscriptionDto = Record<string, DtoValue>;
type PremiumFeatureDto = Record<string, DtoValue>;
type SubscriptionDashboardDto = {
  total_subscribers?: number;
  active?: number;
  by_plan?: Record<string, number>;
  mrr?: number;
  recent_subscriptions?: SubscriptionDto[];
};

function toSubscriptionPlan(row: SubscriptionPlanDto): SubscriptionPlan {
  let features: string[] = [];
  if (Array.isArray(row.features)) {
    features = row.features as string[];
  } else if (typeof row.features === 'string') {
    try {
      const parsed = JSON.parse(row.features);
      features = Array.isArray(parsed) ? parsed : [];
    } catch {
      features = [];
    }
  }
  return {
    id: asString(row.id),
    name: asString(row.name),
    slug: asString(row.slug),
    description: asOptionalString(row.description),
    priceMonthly: asNumber(row.price_monthly),
    priceYearly: asNumber(row.price_yearly),
    features,
    maxListings: asNumber(row.max_listings, 3),
    maxAds: asNumber(row.max_ads, 1),
    analyticsAccess: Number(row.analytics_access ?? 0) === 1,
    featuredVendor: Number(row.featured_vendor ?? 0) === 1,
    featuredRental: Number(row.featured_rental ?? 0) === 1,
    prioritySupport: Number(row.priority_support ?? 0) === 1,
    isActive: Number(row.is_active ?? 1) === 1,
  };
}

function toSubscription(row: SubscriptionDto): Subscription {
  return {
    id: asString(row.id),
    userId: asString(row.user_id),
    planId: asString(row.plan_id),
    planName: asOptionalString(row.plan_name),
    status: asEnum(row.status, ['Active', 'Cancelled', 'Expired', 'Pending'] as const, 'Pending'),
    billingCycle: asEnum(row.billing_cycle, ['Monthly', 'Yearly'] as const, 'Monthly'),
    startedAt: asString(row.started_at),
    expiresAt: asOptionalString(row.expires_at),
    amountPaid: asNumber(row.amount_paid),
    paymentRef: asOptionalString(row.payment_ref),
  };
}

function toPremiumFeature(row: PremiumFeatureDto): PremiumFeature {
  return {
    id: asString(row.id),
    featureKey: asString(row.feature_key),
    featureName: asString(row.feature_name),
    description: asOptionalString(row.description),
    minPlan: asString(row.min_plan, 'premium'),
    isActive: Number(row.is_active ?? 1) === 1,
  };
}

function toSubscriptionDashboard(row: SubscriptionDashboardDto): SubscriptionDashboard {
  return {
    totalSubscribers: Number(row.total_subscribers ?? 0),
    active: Number(row.active ?? 0),
    byPlan: row.by_plan ?? {},
    mrr: Number(row.mrr ?? 0),
    recentSubscriptions: (row.recent_subscriptions ?? []).map(toSubscription),
  };
}

// ── P23 Ad Billing & Analytics DTO types & mappers ────────────────────────────

type AdPackageDto = Record<string, DtoValue> & { features?: string[] | string };
type AdBillingDto = Record<string, DtoValue>;
type AdAnalyticsDto = {
  total_ads?: number;
  active_ads?: number;
  total_impressions?: number;
  total_clicks?: number;
  avg_ctr?: number;
  top_clicked?: Record<string, DtoValue>[];
  top_viewed?: Record<string, DtoValue>[];
  monthly_impressions?: Record<string, DtoValue>[];
  active_vs_expired?: Record<string, DtoValue>;
  revenue_summary?: Record<string, DtoValue>;
};

function toAdPackage(row: AdPackageDto): AdPackage {
  let features: string[] = [];
  if (Array.isArray(row.features)) {
    features = row.features as string[];
  } else if (typeof row.features === 'string') {
    try {
      const parsed = JSON.parse(row.features);
      features = Array.isArray(parsed) ? parsed : [];
    } catch {
      features = [];
    }
  }
  return {
    id: asString(row.id),
    name: asString(row.name),
    description: asOptionalString(row.description),
    price: asNumber(row.price),
    durationDays: asNumber(row.duration_days, 30),
    maxImpressions: asNumber(row.max_impressions),
    features,
    isActive: Number(row.is_active ?? 1) === 1,
    sortOrder: asNumber(row.sort_order),
  };
}

function toAdBilling(row: AdBillingDto): AdBilling {
  return {
    id: asString(row.id),
    adId: asString(row.ad_id),
    packageId: asOptionalString(row.package_id),
    amount: asNumber(row.amount),
    billingStatus: asEnum(row.billing_status, ['Pending', 'Paid', 'Overdue', 'Waived'] as const, 'Pending'),
    dueDate: asOptionalString(row.due_date),
    paidAt: asOptionalString(row.paid_at),
    paymentRef: asOptionalString(row.payment_ref),
    renewalReminded: row.renewal_reminded === true || Number(row.renewal_reminded ?? 0) === 1,
    notes: asOptionalString(row.notes),
    businessName: asOptionalString(row.business_name),
    packageName: asOptionalString(row.package_name),
  };
}

function toAdAnalytics(row: AdAnalyticsDto): AdAnalytics {
  return {
    totalAds: Number(row.total_ads ?? 0),
    activeAds: Number(row.active_ads ?? 0),
    totalImpressions: Number(row.total_impressions ?? 0),
    totalClicks: Number(row.total_clicks ?? 0),
    avgCtr: Number(row.avg_ctr ?? 0),
    topClicked: (row.top_clicked ?? []).map((r) => ({
      id: String(r.id ?? ''),
      title: String(r.title ?? ''),
      clicks: Number(r.clicks ?? 0),
      ctr: Number(r.ctr ?? 0),
    })),
    topViewed: (row.top_viewed ?? []).map((r) => ({
      id: String(r.id ?? ''),
      title: String(r.title ?? ''),
      impressions: Number(r.impressions ?? 0),
    })),
    monthlyImpressions: (row.monthly_impressions ?? []).map((r) => ({
      month: String(r.month ?? ''),
      count: Number(r.count ?? 0),
    })),
    activeVsExpired: {
      active: Number((row.active_vs_expired as Record<string, DtoValue>)?.active ?? 0),
      expired: Number((row.active_vs_expired as Record<string, DtoValue>)?.expired ?? 0),
    },
    revenueSummary: {
      total_revenue: Number((row.revenue_summary as Record<string, DtoValue>)?.total_revenue ?? 0),
      pending: Number((row.revenue_summary as Record<string, DtoValue>)?.pending ?? 0),
      overdue_count: Number((row.revenue_summary as Record<string, DtoValue>)?.overdue_count ?? 0),
    },
  };
}

// ── P24 Razorpay Payment DTO types & mappers ─────────────────────────────────

type PaymentTransactionDto = Record<string, DtoValue>;
type PaymentDashboardDto = {
  total_invoiced?: number;
  total_paid?: number;
  total_pending?: number;
  total_overdue?: number;
  today_payments?: number;
  this_month_revenue?: number;
  payment_methods?: Record<string, number>;
  recent_transactions?: PaymentTransactionDto[];
  by_status?: Record<string, number>;
};

function toPaymentTransaction(row: PaymentTransactionDto): PaymentTransaction {
  return {
    id: asString(row.id),
    invoiceId: asString(row.invoice_id),
    invoiceNo: asOptionalString(row.invoice_no),
    razorpayOrderId: asOptionalString(row.razorpay_order_id),
    razorpayPaymentId: asOptionalString(row.razorpay_payment_id),
    razorpaySignature: asOptionalString(row.razorpay_signature),
    amount: asNumber(row.amount),
    currency: asString(row.currency, 'INR'),
    status: asEnum(row.status, ['created', 'paid', 'failed', 'refunded'] as const, 'created'),
    paymentMethod: asOptionalString(row.payment_method),
    errorCode: asOptionalString(row.error_code),
    errorDescription: asOptionalString(row.error_description),
    webhookReceived: row.webhook_received != null ? asNumber(row.webhook_received) : undefined,
    createdAt: asString(row.created_at),
    updatedAt: asOptionalString(row.updated_at),
  };
}

function toPaymentDashboard(row: PaymentDashboardDto): PaymentDashboard {
  return {
    totalInvoiced: Number(row.total_invoiced ?? 0),
    totalPaid: Number(row.total_paid ?? 0),
    totalPending: Number(row.total_pending ?? 0),
    totalOverdue: Number(row.total_overdue ?? 0),
    todayPayments: Number(row.today_payments ?? 0),
    thisMonthRevenue: Number(row.this_month_revenue ?? 0),
    paymentMethods: (row.payment_methods ?? {}) as Record<string, number>,
    recentTransactions: (row.recent_transactions ?? []).map(toPaymentTransaction),
    byStatus: (row.by_status ?? {}) as Record<string, number>,
  };
}
