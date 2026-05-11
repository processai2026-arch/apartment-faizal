import { create } from 'zustand';
import { mockVisitors, mockVehicles, mockApartments, mockVendors, mockStaff, mockInventory, mockUtilityTasks, mockComplaints, mockDailyWorkers, mockEmergencyContacts, type EmergencyContact } from '@/data/mockData';
import type { Visitor, Vehicle, Apartment, Vendor, Staff, InventoryItem, UtilityTask, Complaint, DailyWorker } from '@/types';

interface AppState {
  sidebarCollapsed: boolean;
  visitors: Visitor[];
  vehicles: Vehicle[];
  apartments: Apartment[];
  vendors: Vendor[];
  staff: Staff[];
  inventory: InventoryItem[];
  utilityTasks: UtilityTask[];
  complaints: Complaint[];
  dailyWorkers: DailyWorker[];
  emergencyContacts: EmergencyContact[];

  toggleSidebar: () => void;
  addVisitor: (visitor: Visitor) => void;
  checkOutVisitor: (id: string) => void;
  addVehicle: (vehicle: Vehicle) => void;
  checkOutVehicle: (id: string) => void;
  addApartment: (apt: Apartment) => void;
  updateApartment: (apt: Apartment) => void;
  toggleApartmentStatus: (id: string) => void;
  addVendor: (vendor: Vendor) => void;
  updateStaffAttendance: (staffId: string, date: string, status: 'P' | 'A' | 'H') => void;
  addInventoryItem: (item: InventoryItem) => void;
  addUtilityTask: (task: UtilityTask) => void;
  markUtilityDone: (id: string) => void;
  markPaymentPaid: (aptId: string) => void;
  addComplaint: (complaint: Complaint) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  visitors: mockVisitors,
  vehicles: mockVehicles,
  apartments: mockApartments,
  vendors: mockVendors,
  staff: mockStaff,
  inventory: mockInventory,
  utilityTasks: mockUtilityTasks,
  complaints: mockComplaints,
  dailyWorkers: mockDailyWorkers,
  emergencyContacts: mockEmergencyContacts,

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

  addApartment: (apt) => set((state) => ({ apartments: [...state.apartments, apt] })),

  updateApartment: (apt) => set((state) => ({
    apartments: state.apartments.map(a => a.id === apt.id ? apt : a)
  })),

  toggleApartmentStatus: (id) => set((state) => ({
    apartments: state.apartments.map(a =>
      a.id === id ? { ...a, status: a.status === 'Occupied' ? 'Vacant' : 'Occupied' } : a
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

  markPaymentPaid: (aptId) => set((state) => ({
    apartments: state.apartments.map(a =>
      a.id === aptId ? { ...a, paymentStatus: 'Paid' as const, lastPaid: new Date().toISOString().split('T')[0] } : a
    )
  })),

  addComplaint: (complaint) => set((state) => ({ complaints: [complaint, ...state.complaints] })),
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
