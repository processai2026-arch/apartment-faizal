import { create } from 'zustand';
import { api, tokenStorage } from '@/lib/api';
import { requireGateToken } from '@/lib/gateToken';
import type { EmergencyContact } from '@/types';
import type { Apartment, AppNotification, Complaint, ComplaintTicket, DailyWorker, FinancialSummary, InventoryItem, Invoice, InvoiceGstFields, MaintenanceRequestTicket, Office, Staff, UtilityTask, Vehicle, Vendor, Visitor } from '@/types';
import type { UserRole } from '@/types/auth';

interface AppState {
  sidebarCollapsed: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  loadError: string | null;
  notificationRole: UserRole | null;
  /** Timestamp of last successful admin summary fetch (Date.now()). */
  lastFetchedAdminSummary: number | null;
  /** Timestamp of last successful vendor list fetch (Date.now()). */
  lastFetchedVendors: number | null;
  /** Timestamp of last successful complaints list fetch (Date.now()). */
  lastFetchedComplaints: number | null;
  visitors: Visitor[];
  vehicles: Vehicle[];
  offices: Office[];
  vendors: Vendor[];
  staff: Staff[];
  inventory: InventoryItem[];
  utilityTasks: UtilityTask[];
  notifications: AppNotification[];
  unreadCount: number;
  complaints: Complaint[];
  complaintTickets: ComplaintTicket[];
  maintenanceRequests: MaintenanceRequestTicket[];
  dailyWorkers: DailyWorker[];
  emergencyContacts: EmergencyContact[];
  apartments: Apartment[];
  invoices: Invoice[];
  financialSummary: FinancialSummary | null;

  toggleSidebar: () => void;
  loadInitialData: (role?: UserRole) => Promise<void>;
  refreshNotifications: (params?: Parameters<typeof api.notifications.list>[1]) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  resetBackendState: () => void;
  addVisitor: (visitor: Visitor) => Promise<Visitor | void>;
  checkOutVisitor: (id: string, checkoutToken?: string) => Promise<void>;
  addVehicle: (vehicle: Vehicle) => Promise<Vehicle | void>;
  checkOutVehicle: (id: string, checkoutToken?: string) => Promise<void>;
  addOffice: (office: Office) => Promise<Office | void>;
  updateOffice: (office: Office) => Promise<void>;
  toggleOfficeStatus: (id: string) => Promise<void>;
  deleteOffice: (id: string) => Promise<void>;
  addVendor: (vendor: Vendor) => Promise<Vendor | void>;
  addStaff: (s: Staff) => Promise<Staff | void>;
  updateStaff: (s: Staff) => Promise<void>;
  removeStaff: (id: string) => void;
  updateStaffAttendance: (staffId: string, date: string, status: 'P' | 'A' | 'H') => Promise<void>;
  addInventoryItem: (item: InventoryItem) => Promise<InventoryItem | void>;
  addUtilityTask: (task: UtilityTask) => Promise<UtilityTask | void>;
  markUtilityDone: (id: string) => Promise<void>;
  addComplaint: (complaint: Complaint) => void;
  markPaymentPaid: (id: string) => void;
  addApartment: (apartment: Apartment) => void;

  loadTenantComplaints: () => Promise<void>;
  loadAdminComplaints: (params?: { status?: string; priority?: string; category?: string; search?: string }) => Promise<void>;
  createTenantComplaint: (payload: { category: string; subject: string; description: string; priority?: ComplaintTicket['priority']; attachmentId?: string | number }) => Promise<ComplaintTicket>;
  assignComplaint: (id: string, vendorId: string, remarks?: string) => Promise<void>;
  updateComplaintStatus: (id: string, status: ComplaintTicket['status'], remarks?: string) => Promise<void>;
  removeComplaint: (id: string) => Promise<void>;
  loadTenantMaintenanceRequests: () => Promise<void>;
  loadAdminMaintenanceRequests: (params?: { status?: string; priority?: string; category?: string; search?: string }) => Promise<void>;
  createTenantMaintenanceRequest: (payload: { category: string; title: string; description: string; priority?: MaintenanceRequestTicket['priority']; attachmentId?: string | number; expectedCompletion?: string }) => Promise<MaintenanceRequestTicket>;
  cancelTenantMaintenanceRequest: (id: string, remarks?: string) => Promise<void>;
  assignMaintenanceVendor: (id: string, vendorId: string, remarks?: string) => Promise<void>;
  assignMaintenanceStaff: (id: string, staffId: string, remarks?: string) => Promise<void>;
  updateMaintenanceStatus: (id: string, status: MaintenanceRequestTicket['status'], remarks?: string) => Promise<void>;
  removeMaintenanceRequest: (id: string) => Promise<void>;

  loadAdminInvoices: (params?: { status?: string; officeId?: string; search?: string }) => Promise<void>;
  loadFinancialSummary: () => Promise<void>;
  createInvoice: (payload: { officeId?: string; invoiceNo: string; description?: string; amount: number; dueDate?: string; status?: Invoice['status'] } & InvoiceGstFields) => Promise<Invoice>;
  updateInvoice: (id: string, payload: Partial<{ description: string; amount: number; dueDate: string; status: Invoice['status'] }> & InvoiceGstFields) => Promise<void>;
  recordInvoicePayment: (id: string, amount: number, mode?: string, referenceNo?: string) => Promise<void>;
}

/** Cache TTL: do not re-fetch expensive endpoints within this window (ms). */
const CACHE_TTL = 30_000; // 30 seconds

const SIDEBAR_KEY = 'officegate.sidebarCollapsed';
const readSidebarCollapsed = (): boolean => {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === '1';
  } catch {
    return false;
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  sidebarCollapsed: readSidebarCollapsed(),
  isLoading: false,
  isLoaded: false,
  loadError: null,
  notificationRole: null,
  lastFetchedAdminSummary: null,
  lastFetchedVendors: null,
  lastFetchedComplaints: null,
  visitors: [],
  vehicles: [],
  offices: [],
  vendors: [],
  staff: [],
  inventory: [],
  utilityTasks: [],
  notifications: [],
  unreadCount: 0,
  complaints: [],
  complaintTickets: [],
  maintenanceRequests: [],
  dailyWorkers: [],
  emergencyContacts: [],
  apartments: [],
  invoices: [],
  financialSummary: null,

  toggleSidebar: () => set((state) => {
    const next = !state.sidebarCollapsed;
    try { localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0'); } catch { /* ignore */ }
    return { sidebarCollapsed: next };
  }),

  loadInitialData: async (role = 'admin') => {
    if (!tokenStorage.getAccessToken()) return;
    // super_admin consumes the admin data surface (superset role)
    if (role === 'super_admin') role = 'admin';
    set({ isLoading: true, loadError: null, notificationRole: role });
    try {
      const notificationResult = await api.notifications.list(role, { perPage: 8 });

      if (role === 'admin') {
        // Guard: skip the expensive 9-request fan-out if data is still fresh
        const now = Date.now();
        const lastFetched = get().lastFetchedAdminSummary;
        if (lastFetched && now - lastFetched < CACHE_TTL) {
          set({ isLoading: false });
          return;
        }

        const [offices, visitors, vehicles, vendors, staff, inventory, utilityTasks, invoices, financialSummary] = await Promise.all([
          api.offices.list(),
          api.visitors.list(),
          api.vehicles.list(),
          api.vendors.list(),
          api.staff.list(),
          api.inventory.list(),
          api.utilities.list(),
          api.financials.list(),
          api.financials.summary(),
        ]);

        set({
          offices,
          visitors,
          vehicles,
          vendors,
          staff,
          inventory,
          utilityTasks,
          invoices,
          financialSummary,
          notifications: notificationResult.items,
          unreadCount: notificationResult.summary.unreadCount,
          apartments: offices.map(officeToApartment),
          isLoaded: true,
          isLoading: false,
          lastFetchedAdminSummary: Date.now(),
        });
        return;
      }

      if (role === 'security') {
        const [offices, visitors, vehicles, staff] = await Promise.all([
          api.offices.list(),
          api.visitors.list(),
          api.vehicles.list(),
          api.staff.list(),
        ]);

        set({
          offices,
          visitors,
          vehicles,
          staff,
          notifications: notificationResult.items,
          unreadCount: notificationResult.summary.unreadCount,
          apartments: offices.map(officeToApartment),
          isLoaded: true,
          isLoading: false,
        });
        return;
      }

      set({
        notifications: notificationResult.items,
        unreadCount: notificationResult.summary.unreadCount,
        isLoaded: true,
        isLoading: false,
      });
    } catch (error) {
      console.error(error);
      set({ loadError: error instanceof Error ? error.message : 'Could not load backend data', isLoading: false });
    }
  },

  refreshNotifications: async (params = {}) => {
    const role = get().notificationRole;
    if (!role || !tokenStorage.getAccessToken()) return;
    const result = await api.notifications.list(role, { perPage: 8, ...params });
    set({ notifications: result.items, unreadCount: result.summary.unreadCount });
  },

  markRead: async (id) => {
    const role = get().notificationRole;
    if (!role) return;
    const updated = await api.notifications.markRead(role, id);
    set((state) => ({
      notifications: state.notifications.map((item) => (item.id === id ? updated : item)),
      unreadCount: Math.max(0, state.unreadCount - (state.notifications.find((item) => item.id === id && !item.isRead) ? 1 : 0)),
    }));
  },

  markAllRead: async () => {
    const role = get().notificationRole;
    if (!role) return;
    await api.notifications.markAllRead(role);
    set((state) => ({
      notifications: state.notifications.map((item) => ({ ...item, isRead: true })),
      unreadCount: 0,
    }));
  },

  resetBackendState: () => set({
    isLoaded: false,
    notificationRole: null,
    lastFetchedAdminSummary: null,
    lastFetchedVendors: null,
    lastFetchedComplaints: null,
    visitors: [],
    vehicles: [],
    offices: [],
    vendors: [],
    staff: [],
    inventory: [],
    utilityTasks: [],
    notifications: [],
    unreadCount: 0,
    complaints: [],
    complaintTickets: [],
    maintenanceRequests: [],
    apartments: [],
    invoices: [],
    financialSummary: null,
  }),

  addVisitor: async (visitor) => {
    try {
      const saved = tokenStorage.getAccessToken() ? await api.visitors.create(visitor) : await api.visitors.publicEntry(visitor, requireGateToken('visitor-entry'));
      set((state) => ({ visitors: [saved, ...state.visitors.filter((v) => v.id !== saved.id)] }));
      await get().refreshNotifications();
      return saved;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  checkOutVisitor: async (id, checkoutToken) => {
    try {
      const saved = tokenStorage.getAccessToken() ? await api.visitors.checkout(id) : await api.visitors.publicCheckout(id, checkoutToken || '', requireGateToken('visitor-checkout'));
      set((state) => ({ visitors: state.visitors.map((v) => (v.id === id ? saved : v)) }));
      await get().refreshNotifications();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  addVehicle: async (vehicle) => {
    try {
      const saved = tokenStorage.getAccessToken() ? await api.vehicles.create(vehicle) : await api.vehicles.publicEntry(vehicle, requireGateToken('vehicle-entry'));
      set((state) => ({ vehicles: [saved, ...state.vehicles.filter((v) => v.id !== saved.id)] }));
      return saved;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  checkOutVehicle: async (id, checkoutToken) => {
    try {
      const saved = tokenStorage.getAccessToken() ? await api.vehicles.checkout(id) : await api.vehicles.publicCheckout(id, checkoutToken || '', requireGateToken('vehicle-checkout'));
      set((state) => ({ vehicles: state.vehicles.map((v) => (v.id === id ? saved : v)) }));
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  addOffice: async (office) => {
    const saved = await api.offices.create(office);
    set((state) => ({ offices: [...state.offices, saved], apartments: [...state.apartments, officeToApartment(saved)] }));
    return saved;
  },

  updateOffice: async (office) => {
    const saved = await api.offices.update(office);
    set((state) => ({
      offices: state.offices.map((o) => (o.id === saved.id ? saved : o)),
      apartments: state.offices.map((o) => (o.id === saved.id ? saved : o)).map(officeToApartment),
    }));
  },

  toggleOfficeStatus: async (id) => {
    const office = get().offices.find((o) => o.id === id);
    if (!office) return;
    const status: Office['status'] = office.status === 'Active' ? 'Inactive' : 'Active';
    const saved = await api.offices.status(id, status);
    set((state) => ({
      offices: state.offices.map((o) => (o.id === id ? saved : o)),
      apartments: state.offices.map((o) => (o.id === id ? saved : o)).map(officeToApartment),
    }));
  },

  deleteOffice: async (id) => {
    await api.offices.remove(id);
    set((state) => ({
      offices: state.offices.filter((o) => o.id !== id),
      apartments: state.apartments.filter((a) => a.id !== id),
    }));
  },

  addVendor: async (vendor) => {
    const saved = await api.vendors.create(vendor);
    set((state) => ({ vendors: [saved, ...state.vendors] }));
    return saved;
  },

  addStaff: async (s) => {
    const saved = await api.staff.create(s);
    set((state) => ({ staff: [...state.staff, saved] }));
    return saved;
  },

  updateStaff: async (s) => {
    const saved = await api.staff.update(s);
    set((state) => ({ staff: state.staff.map((x) => (x.id === saved.id ? { ...saved, attendance: x.attendance } : x)) }));
  },

  removeStaff: (id) => set((state) => ({ staff: state.staff.filter((s) => s.id !== id) })),

  updateStaffAttendance: async (staffId, date, status) => {
    await api.staff.attendance(staffId, date, status);
    set((state) => ({
      staff: state.staff.map((s) =>
        s.id === staffId ? { ...s, attendance: { ...s.attendance, [date]: status } } : s
      ),
    }));
  },

  addInventoryItem: async (item) => {
    const saved = await api.inventory.create(item);
    set((state) => ({ inventory: [saved, ...state.inventory] }));
    return saved;
  },

  addUtilityTask: async (task) => {
    const saved = await api.utilities.create(task);
    set((state) => ({ utilityTasks: [saved, ...state.utilityTasks] }));
    await get().refreshNotifications();
    return saved;
  },

  markUtilityDone: async (id) => {
    const saved = await api.utilities.complete(id);
    set((state) => ({ utilityTasks: state.utilityTasks.map((t) => (t.id === id ? saved : t)) }));
  },

  addComplaint: (complaint) => set((state) => ({ complaints: [complaint, ...state.complaints] })),

  loadTenantComplaints: async () => {
    const rows = await api.complaints.tenantList();
    set({ complaintTickets: rows });
  },

  loadAdminComplaints: async (params) => {
    // Guard: skip re-fetch if data is still fresh AND no custom params are supplied
    if (!params || Object.keys(params).length === 0) {
      const now = Date.now();
      const lastFetched = get().lastFetchedComplaints;
      if (lastFetched && now - lastFetched < CACHE_TTL) return;
    }
    const rows = await api.complaints.list(params);
    set({ complaintTickets: rows, lastFetchedComplaints: Date.now() });
  },

  createTenantComplaint: async (payload) => {
    const saved = await api.complaints.tenantCreate(payload);
    set((state) => ({ complaintTickets: [saved, ...state.complaintTickets] }));
    await get().refreshNotifications();
    return saved;
  },

  assignComplaint: async (id, vendorId, remarks) => {
    const saved = await api.complaints.assign(id, vendorId, remarks);
    set((state) => ({ complaintTickets: state.complaintTickets.map((c) => (c.id === id ? saved : c)) }));
    await get().refreshNotifications();
  },

  updateComplaintStatus: async (id, status, remarks) => {
    const saved = await api.complaints.status(id, status, remarks);
    set((state) => ({ complaintTickets: state.complaintTickets.map((c) => (c.id === id ? saved : c)) }));
    await get().refreshNotifications();
  },

  removeComplaint: async (id) => {
    await api.complaints.remove(id);
    set((state) => ({ complaintTickets: state.complaintTickets.filter((c) => c.id !== id) }));
  },

  loadTenantMaintenanceRequests: async () => {
    const rows = await api.maintenanceRequests.tenantList();
    set({ maintenanceRequests: rows });
  },

  loadAdminMaintenanceRequests: async (params) => {
    const rows = await api.maintenanceRequests.list(params);
    set({ maintenanceRequests: rows });
  },

  createTenantMaintenanceRequest: async (payload) => {
    const saved = await api.maintenanceRequests.tenantCreate(payload);
    set((state) => ({ maintenanceRequests: [saved, ...state.maintenanceRequests] }));
    await get().refreshNotifications();
    return saved;
  },

  cancelTenantMaintenanceRequest: async (id, remarks) => {
    const saved = await api.maintenanceRequests.tenantCancel(id, remarks);
    set((state) => ({ maintenanceRequests: state.maintenanceRequests.map((m) => (m.id === id ? saved : m)) }));
    await get().refreshNotifications();
  },

  assignMaintenanceVendor: async (id, vendorId, remarks) => {
    const saved = await api.maintenanceRequests.assignVendor(id, vendorId, remarks);
    set((state) => ({ maintenanceRequests: state.maintenanceRequests.map((m) => (m.id === id ? saved : m)) }));
    await get().refreshNotifications();
  },

  assignMaintenanceStaff: async (id, staffId, remarks) => {
    const saved = await api.maintenanceRequests.assignStaff(id, staffId, remarks);
    set((state) => ({ maintenanceRequests: state.maintenanceRequests.map((m) => (m.id === id ? saved : m)) }));
    await get().refreshNotifications();
  },

  updateMaintenanceStatus: async (id, status, remarks) => {
    const saved = await api.maintenanceRequests.status(id, status, remarks);
    set((state) => ({ maintenanceRequests: state.maintenanceRequests.map((m) => (m.id === id ? saved : m)) }));
    await get().refreshNotifications();
  },

  removeMaintenanceRequest: async (id) => {
    await api.maintenanceRequests.remove(id);
    set((state) => ({ maintenanceRequests: state.maintenanceRequests.filter((m) => m.id !== id) }));
  },

  loadAdminInvoices: async (params) => {
    const rows = await api.financials.list(params);
    set({ invoices: rows });
  },

  loadFinancialSummary: async () => {
    const summary = await api.financials.summary();
    set({ financialSummary: summary });
  },

  createInvoice: async (payload) => {
    const saved = await api.financials.create(payload);
    set((state) => ({ invoices: [saved, ...state.invoices] }));
    await get().loadFinancialSummary();
    return saved;
  },

  updateInvoice: async (id, payload) => {
    const saved = await api.financials.update(id, payload);
    set((state) => ({ invoices: state.invoices.map((i) => (i.id === id ? saved : i)) }));
    await get().loadFinancialSummary();
  },

  recordInvoicePayment: async (id, amount, mode, referenceNo) => {
    const saved = await api.financials.recordPayment(id, amount, mode, referenceNo);
    set((state) => ({ invoices: state.invoices.map((i) => (i.id === id ? saved : i)) }));
    await get().loadFinancialSummary();
    await get().refreshNotifications();
  },

  markPaymentPaid: (id) => set((state) => ({
    apartments: state.apartments.map((a) =>
      a.id === id ? { ...a, paymentStatus: 'Paid' as const, lastPaid: new Date().toISOString().split('T')[0] } : a
    ),
  })),

  addApartment: (apartment) => set((state) => ({ apartments: [apartment, ...state.apartments] })),
}));

function officeToApartment(office: Office): Apartment {
  return {
    id: office.id,
    unitNo: `${office.floorNumber}-${office.companyName.substring(0, 3)}`,
    floor: parseInt(office.floorNumber, 10) || 1,
    block: office.block,
    type: 'Office',
    status: office.status === 'Active' ? 'Occupied' : 'Vacant',
    residentName: office.companyName,
    contact: office.contactPhone,
    email: office.contactEmail,
    ownerName: office.contactPerson,
    isOwnerResident: true,
    monthlyCharge: 50000,
    paymentStatus: 'Pending',
  };
}

