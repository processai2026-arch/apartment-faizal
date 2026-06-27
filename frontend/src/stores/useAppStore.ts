import { create } from 'zustand';
import { api, tokenStorage } from '@/lib/api';
import { mockApartments, mockComplaints, mockDailyWorkers, mockEmergencyContacts, type EmergencyContact } from '@/data/mockData';
import type { Apartment, Complaint, DailyWorker, InventoryItem, Office, Staff, UtilityTask, Vehicle, Vendor, Visitor } from '@/types';

interface AppState {
  sidebarCollapsed: boolean;
  isLoading: boolean;
  isLoaded: boolean;
  loadError: string | null;
  visitors: Visitor[];
  vehicles: Vehicle[];
  offices: Office[];
  vendors: Vendor[];
  staff: Staff[];
  inventory: InventoryItem[];
  utilityTasks: UtilityTask[];
  complaints: Complaint[];
  dailyWorkers: DailyWorker[];
  emergencyContacts: EmergencyContact[];
  apartments: Apartment[];

  toggleSidebar: () => void;
  loadInitialData: () => Promise<void>;
  resetBackendState: () => void;
  addVisitor: (visitor: Visitor) => Promise<Visitor | void>;
  checkOutVisitor: (id: string) => Promise<void>;
  addVehicle: (vehicle: Vehicle) => Promise<Vehicle | void>;
  checkOutVehicle: (id: string) => Promise<void>;
  addOffice: (office: Office) => Promise<Office | void>;
  updateOffice: (office: Office) => Promise<void>;
  toggleOfficeStatus: (id: string) => Promise<void>;
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
}

export const useAppStore = create<AppState>((set, get) => ({
  sidebarCollapsed: false,
  isLoading: false,
  isLoaded: false,
  loadError: null,
  visitors: [],
  vehicles: [],
  offices: [],
  vendors: [],
  staff: [],
  inventory: [],
  utilityTasks: [],
  complaints: mockComplaints,
  dailyWorkers: mockDailyWorkers,
  emergencyContacts: mockEmergencyContacts,
  apartments: mockApartments,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  loadInitialData: async () => {
    if (!tokenStorage.getAccessToken()) return;
    set({ isLoading: true, loadError: null });
    try {
      const [offices, visitors, vehicles, vendors, staff, inventory, utilityTasks] = await Promise.all([
        api.offices.list(),
        api.visitors.list(),
        api.vehicles.list(),
        api.vendors.list(),
        api.staff.list(),
        api.inventory.list(),
        api.utilities.list(),
      ]);

      set({
        offices,
        visitors,
        vehicles,
        vendors,
        staff,
        inventory,
        utilityTasks,
        apartments: offices.map(officeToApartment),
        isLoaded: true,
        isLoading: false,
      });
    } catch (error) {
      console.error(error);
      set({ loadError: error instanceof Error ? error.message : 'Could not load backend data', isLoading: false });
    }
  },

  resetBackendState: () => set({ isLoaded: false, visitors: [], vehicles: [], offices: [], vendors: [], staff: [], inventory: [], utilityTasks: [] }),

  addVisitor: async (visitor) => {
    try {
      const saved = tokenStorage.getAccessToken() ? await api.visitors.create(visitor) : await api.visitors.publicEntry(visitor);
      set((state) => ({ visitors: [saved, ...state.visitors.filter((v) => v.id !== saved.id)] }));
      return saved;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  checkOutVisitor: async (id) => {
    try {
      const saved = tokenStorage.getAccessToken() ? await api.visitors.checkout(id) : await api.visitors.publicCheckout(id);
      set((state) => ({ visitors: state.visitors.map((v) => (v.id === id ? saved : v)) }));
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  addVehicle: async (vehicle) => {
    try {
      const saved = tokenStorage.getAccessToken() ? await api.vehicles.create(vehicle) : await api.vehicles.publicEntry(vehicle);
      set((state) => ({ vehicles: [saved, ...state.vehicles.filter((v) => v.id !== saved.id)] }));
      return saved;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  checkOutVehicle: async (id) => {
    try {
      const saved = tokenStorage.getAccessToken() ? await api.vehicles.checkout(id) : await api.vehicles.publicCheckout(id);
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
    return saved;
  },

  markUtilityDone: async (id) => {
    const saved = await api.utilities.complete(id);
    set((state) => ({ utilityTasks: state.utilityTasks.map((t) => (t.id === id ? saved : t)) }));
  },

  addComplaint: (complaint) => set((state) => ({ complaints: [complaint, ...state.complaints] })),

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
