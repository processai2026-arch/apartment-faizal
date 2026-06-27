// Office Building Visitor Management System Types

// Office/Company in the building
export interface Office {
  id: string;
  block: string;
  floorNumber: string;
  companyName: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  allocatedVehicleCount: number;
  usedVehicleCount?: number;
  status: 'Active' | 'Inactive' | 'Vacant';
}

// Visitor
export interface Visitor {
  id: string;
  name: string;
  phone: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  city?: string;
  pincode?: string;
  
  // Visit details
  block: string;
  floorNumber: string;
  companyName: string;
  whomToMeet: string;
  reason: string;
  
  // Vehicle info
  vehicleType?: 'Car' | 'Bike' | '2-Wheeler' | '4-Wheeler' | 'NA';
  vehicleNo?: string;
  
  // Entry/Exit
  status: 'Inside' | 'Exited';
  entryTime: string;
  exitTime?: string;
  duration?: string;
  
  // Security
  guardName?: string;
  otp?: string;
  photoUrl?: string;
  remarks?: string;
  checkoutToken?: string;
  checkoutTokenExpiresAt?: string;
  
  // Legacy compatibility
  apartmentNo?: string;
  officeNo?: string;
  purpose?: string;
  category?: 'Guest' | 'Delivery' | 'Worker' | 'Vendor' | 'Emergency';
}

// Vehicle
export interface Vehicle {
  id: string;
  vehicleNo: string;
  vehicleType: '2-Wheeler' | '4-Wheeler' | 'Car' | 'Bike' | 'Other';
  vehicleModel?: string;
  ownerName?: string;
  
  // Office association
  block?: string;
  floorNumber?: string;
  companyName?: string;
  parkingUserType?: 'Visitor' | 'Employee' | 'Vendor' | 'Other';
  
  // Entry/Exit
  status: 'Inside' | 'Exited';
  entryTime: string;
  exitTime?: string;
  checkoutToken?: string;
  checkoutTokenExpiresAt?: string;
  
  // Legacy compatibility
  apartmentNo?: string;
  type?: string;
}

// Vendor/Service Provider
export interface Vendor {
  id: string;
  name: string;
  company: string;
  serviceType: string;
  category: 'Regular Maintenance' | 'Utility Providers' | 'Ad-Hoc Vendors';
  contact: string;
  lastVisit?: string;
  nextVisit?: string;
  status: 'Active' | 'Inactive';
}

// Staff
export interface Staff {
  id: string;
  name: string;
  role: 'Security' | 'Housekeeping' | 'Electrician' | 'Plumber' | 'Gardener' | 'Driver' | 'Receptionist' | 'Maintenance';
  department: string;
  contact: string;
  joinDate: string;
  attendance: Record<string, 'P' | 'A' | 'H'>; // date -> Present/Absent/Holiday
}

// Inventory Item
export interface InventoryItem {
  id: string;
  itemName: string;
  category: 'Electrical' | 'Plumbing' | 'Cleaning' | 'Safety' | 'General';
  quantity: number;
  unitCost: number;
  totalCost: number;
  vendor: string;
  date: string;
  usedQuantity: number;
  location: string;
  usedBy: string;
}

// Utility Task
export interface UtilityTask {
  id: string;
  description: string;
  type: 'Sump Cleaning' | 'Drainage' | 'Lift' | 'Electrical' | 'Pest Control' | 'Fire Safety' | 'HVAC' | 'General';
  scheduledDate: string;
  lastCompleted?: string;
  status: 'Upcoming' | 'Overdue' | 'Done';
  assignedStaff?: string;
  notes?: string;
}

// Complaint (for office tenants)
export interface Complaint {
  id: string;
  companyName: string;
  block: string;
  floorNumber: string;
  contactPerson: string;
  category: 'Plumbing' | 'Electrical' | 'Cleaning' | 'Lift' | 'Security' | 'Internet' | 'HVAC' | 'Parking' | 'Other';
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  status: 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  
  // Legacy compatibility
  residentName?: string;
  apartmentNo?: string;
}

// Daily Worker (for building maintenance)
export interface DailyWorker {
  id: string;
  name: string;
  role: 'Maid' | 'Cook' | 'Driver' | 'Electrician' | 'Plumber' | 'Milkman' | 'Newspaper' | 'Cleaner' | 'Security';
  assignedTo: string; // Company name or "Building"
  block?: string;
  floorNumber?: string;
  phone: string;
  allowedTimings: string;
  validFrom: string;
  validUntil: string;
  status: 'Active' | 'Paused' | 'Blacklisted';
  lastEntry?: string;
  
  // Legacy compatibility
  apartmentNo?: string;
  residentName?: string;
}

// Legacy Apartment type for backward compatibility
export interface Apartment {
  id: string;
  unitNo: string;
  floor: number;
  block: string;
  type: string;
  status: 'Occupied' | 'Vacant';
  residentName?: string;
  contact?: string;
  email?: string;
  ownerName?: string;
  isOwnerResident?: boolean;
  monthlyCharge?: number;
  paymentStatus?: 'Paid' | 'Pending' | 'Overdue';
  lastPaid?: string;
}
