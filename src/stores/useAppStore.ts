import { create } from 'zustand';
import { mockVisitors, mockVehicles, mockOffices, mockVendors, mockStaff, mockInventory, mockUtilityTasks, mockComplaints, mockDailyWorkers, mockEmergencyContacts, mockApartments, type EmergencyContact } from '@/data/mockData';
import type { Visitor, Vehicle, Office, Vendor, Staff, InventoryItem, UtilityTask, Complaint, DailyWorker, Apartment } from '@/types';

interface AppState {
  sidebarCollapsed: boolean;
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
  addVisitor: (visitor: Visitor) => void;
  checkOutVisitor: (id: string) => void;
  addVehicle: (vehicle: Vehicle) => void;
  checkOutVehicle: (id: string) => void;
  addOffice: (office: Office) => void;
  updateOffice: (office: Office) => void;
  toggleOfficeStatus: (id: string) => void;
  addVendor: (vendor: Vendor) => void;
  updateStaffAttendance: (staffId: string, date: string, status: 'P' | 'A' | 'H') => void;
  addInventoryItem: (item: InventoryItem) => void;
  addUtilityTask: (task: UtilityTask) => void;
  markUtilityDone: (id: string) => void;
  addComplaint: (complaint: Complaint) => void;
  markPaymentPaid: (id: string) => void;
  addApartment: (apartment: Apartment) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  visitors: mockVisitors,
  vehicles: mockVehicles,
  offices: mockOffices,
  vendors: mockVendors,
  staff: mockStaff,
  inventory: mockInventory,
  utilityTasks: mockUtilityTasks,
  complaints: mockComplaints,
  dailyWorkers: mockDailyWorkers,
  emergencyContacts: mockEmergencyContacts,
  apartments: mockApartments,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  addVisitor: (visitor) => set((state) => ({ visitors: [visitor, ...state.visitors] })),

  checkOutVisitor: (id) => set((state) => ({
    visitors: state.visitors.map(v =>
      v.id === id ? {
        ...v,
        status: 'Exited' as const,
        exitTime: new Date().toISOString(),
        duration: calculateDuration(v.entryTime, new Date().toISOString())
      } : v
    )
  })),

  addVehicle: (vehicle) => set((state) => ({ vehicles: [vehicle, ...state.vehicles] })),

  checkOutVehicle: (id) => set((state) => ({
    vehicles: state.vehicles.map(v =>
      v.id === id ? { ...v, status: 'Exited' as const, exitTime: new Date().toISOString() } : v
    )
  })),

  addOffice: (office) => set((state) => ({ offices: [...state.offices, office] })),

  updateOffice: (office) => set((state) => ({
    offices: state.offices.map(o => o.id === office.id ? office : o)
  })),

  toggleOfficeStatus: (id) => set((state) => ({
    offices: state.offices.map(o =>
      o.id === id ? { ...o, status: o.status === 'Active' ? 'Inactive' : 'Active' } : o
    )
  })),

  addVendor: (vendor) => set((state) => ({ vendors: [vendor, ...state.vendors] })),

  updateStaffAttendance: (staffId, date, status) => set((state) => ({
    staff: state.staff.map(s =>
      s.id === staffId ? { ...s, attendance: { ...s.attendance, [date]: status } } : s
    )
  })),

  addInventoryItem: (item) => set((state) => ({ inventory: [item, ...state.inventory] })),

  addUtilityTask: (task) => set((state) => ({ utilityTasks: [task, ...state.utilityTasks] })),

  markUtilityDone: (id) => set((state) => ({
    utilityTasks: state.utilityTasks.map(t =>
      t.id === id ? { ...t, status: 'Done' as const, lastCompleted: new Date().toISOString().split('T')[0] } : t
    )
  })),

  addComplaint: (complaint) => set((state) => ({ complaints: [complaint, ...state.complaints] })),

  markPaymentPaid: (id) => set((state) => ({
    apartments: state.apartments.map(a =>
      a.id === id ? { ...a, paymentStatus: 'Paid' as const, lastPaid: new Date().toISOString().split('T')[0] } : a
    )
  })),

  addApartment: (apartment) => set((state) => ({ apartments: [apartment, ...state.apartments] })),
}));

function calculateDuration(entryTime: string, exitTime: string): string {
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  const diffMs = exit.getTime() - entry.getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);
  if (diffHrs > 0) return `${diffHrs}h ${diffMins}m`;
  return `${diffMins}m`;
}
