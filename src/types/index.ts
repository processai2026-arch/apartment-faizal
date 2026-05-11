export interface Apartment {
  id: string;
  unitNo: string;
  floor: number;
  block: string;
  type: '1BHK' | '2BHK' | '3BHK' | 'Studio';
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

export interface Visitor {
  id: string;
  name: string;
  phone: string;
  apartmentNo: string;
  purpose: string;
  category: 'Guest' | 'Delivery' | 'Worker' | 'Vendor' | 'Emergency';
  vehicleNo?: string;
  vehicleType?: string;
  status: 'Inside' | 'Exited' | 'Approved' | 'Rejected';
  entryTime: string;
  exitTime?: string;
  duration?: string;
  guardName?: string;
  otp?: string;
  qrCode?: string;
}

export interface Vehicle {
  id: string;
  vehicleNo: string;
  type: '2-Wheeler' | '4-Wheeler' | 'Commercial' | 'Other';
  ownerName: string;
  apartmentNo: string;
  entryTime: string;
  exitTime?: string;
  status: 'Inside' | 'Exited';
}

export interface Vendor {
  id: string;
  name: string;
  company: string;
  serviceType: string;
  category: 'Regular Maintenance' | 'Utility Providers' | 'Ad-Hoc Vendors';
  contact: string;
  lastVisit: string;
  nextVisit?: string;
  status: 'Active' | 'Inactive';
}

export interface Staff {
  id: string;
  name: string;
  role: 'Housekeeping' | 'Electrician' | 'Plumber' | 'Security' | 'Gardener' | 'Driver';
  department: string;
  contact: string;
  joinDate: string;
  attendance?: Record<string, 'P' | 'A' | 'H'>;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  category: 'Electrical' | 'Plumbing' | 'General' | 'Cleaning' | 'Safety';
  quantity: number;
  unitCost: number;
  totalCost: number;
  vendor: string;
  date: string;
  usedQuantity?: number;
  location?: string;
  usedBy?: string;
}

export interface UtilityTask {
  id: string;
  description: string;
  type: 'Sump Cleaning' | 'Drainage' | 'Electrical' | 'Lift' | 'Pest Control' | 'Fire Safety';
  scheduledDate: string;
  lastCompleted?: string;
  status: 'Upcoming' | 'Overdue' | 'Done';
  assignedStaff: string;
  notes?: string;
}

export interface Complaint {
  id: string;
  residentName: string;
  apartmentNo: string;
  category: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  status: 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

export interface DailyWorker {
  id: string;
  name: string;
  role: string;
  apartmentNo: string;
  residentName: string;
  phone: string;
  allowedTimings: string;
  validFrom: string;
  validUntil: string;
  status: 'Active' | 'Paused' | 'Blacklisted';
  lastEntry?: string;
}
