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

// Vendor Marketplace
export interface MarketplaceVendor {
  id: string;
  name: string;
  company: string;
  serviceType: string;
  category: string;
  categoryId?: string;
  contact: string;
  description?: string;
  serviceArea?: string;
  availability?: string;
  ratingAvg: number;
  reviewCount: number;
  bookingCount: number;
  isVerified: boolean;
  isFeatured: boolean;
  status: 'Active' | 'Inactive';
  // Hydrated on detail fetch
  services?: VendorService[];
  gallery?: VendorGalleryItem[];
  reviews?: VendorReview[];
  reviewDistribution?: Record<string, number>;
}

export interface VendorCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface VendorService {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  price?: number;
  unit?: string;
  isActive: boolean;
}

export interface VendorGalleryItem {
  id: string;
  vendorId: string;
  attachmentId?: string;
  caption?: string;
  sortOrder: number;
}

export interface VendorReview {
  id: string;
  vendorId: string;
  userId: string;
  bookingId?: string;
  rating: number;
  title?: string;
  comment?: string;
  attachmentId?: string;
  status: 'Pending' | 'Approved' | 'Hidden';
  createdAt: string;
}

export interface VendorBooking {
  id: string;
  vendorId: string;
  userId: string;
  officeId?: string;
  serviceId?: string;
  title: string;
  description?: string;
  scheduledFor?: string;
  status: 'Requested' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
  completedAt?: string;
  createdAt: string;
}

export interface VendorMarketplaceStats {
  vendors: { total: number; verified: number; featured: number; avgRating: number };
  bookingsByStatus: { status: string; count: number }[];
  reviewsByStatus: { status: string; count: number }[];
}

export interface VendorMarketplaceDashboard {
  stats: VendorMarketplaceStats;
  topRated: { id: string; name: string; company: string; rating_avg: number; review_count: number }[];
  mostBooked: { id: string; name: string; company: string; booking_count: number }[];
  recentReviews: VendorReview[];
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

// Complaint ticket backed by the real complaints API (tenant + admin module).
export interface ComplaintTicket {
  id: string;
  tenantId: string;
  officeId: string;
  category: string;
  subject: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  status: 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  assignedVendorId?: string;
  attachmentId?: string;
  createdAt: string;
  updatedAt?: string;
  history?: ComplaintUpdate[];
}

export interface ComplaintUpdate {
  id: string;
  complaintId: string;
  updatedBy?: string;
  oldStatus?: string;
  newStatus: string;
  remarks?: string;
  createdAt: string;
}

// Maintenance request backed by the real maintenance-requests API (tenant + admin module).
export interface MaintenanceRequestTicket {
  id: string;
  tenantId: string;
  officeId: string;
  category: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  status: 'Open' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
  assignedVendorId?: string;
  assignedStaffId?: string;
  attachmentId?: string;
  expectedCompletion?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
  history?: MaintenanceUpdate[];
}

export interface MaintenanceUpdate {
  id: string;
  maintenanceRequestId: string;
  updatedBy?: string;
  oldStatus?: string;
  newStatus: string;
  remarks?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  officeId?: string;
  invoiceNo: string;
  description?: string;
  amount: number;
  paidAmount: number;
  dueDate?: string;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled';
  createdAt: string;
  updatedAt?: string;
}

export interface FinancialSummary {
  invoiceCount: number;
  billed: number;
  collected: number;
  pending: number;
  byStatus: { status: string; count: number; amount: number; paid: number }[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  category: 'Medical' | 'Fire' | 'Police' | 'Utility' | 'Building';
  phone: string;
  available: string;
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

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  isRead: boolean;
  actionUrl?: string;
  referenceType?: string;
  referenceId?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationSummary {
  totalCount: number;
  unreadCount: number;
  todayCount: number;
  highPriorityCount: number;
}

// ── Rental Marketplace (P9/P10) ───────────────────────────────────────────────
export interface RentalListing {
  id: string;
  officeId?: string;
  ownerId: string;
  title: string;
  description?: string;
  listingType: 'Rent' | 'Sale';
  propertyType: 'Office' | 'Apartment' | 'Shop' | 'Parking';
  price?: number;
  deposit?: number;
  areaSqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnishing?: string;
  availableFrom?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Active' | 'Closed';
  featured: boolean;
  contactName?: string;
  contactPhone?: string;
  adminNotes?: string;
  viewCount: number;
  favoriteCount: number;
  isFavorite?: boolean;
  images?: ListingImage[];
  history?: ListingStatusHistory[];
  createdAt: string;
  updatedAt?: string;
}

export interface ListingImage {
  id: string;
  listingId: string;
  attachmentId?: string;
  caption?: string;
  sortOrder: number;
}

export interface ListingStatusHistory {
  id: string;
  listingId: string;
  changedBy: string;
  changedByName?: string;
  fromStatus?: string;
  toStatus: string;
  comment?: string;
  createdAt: string;
}

export interface RentalDashboard {
  stats: {
    total: number;
    pending: number;
    active: number;
    approved: number;
    rejected: number;
    featured: number;
    totalViews: number;
    totalFavorites: number;
  };
  byType: { listing_type: string; count: number }[];
  byProperty: { property_type: string; count: number }[];
  recentPending: RentalListing[];
  mostViewed: RentalListing[];
}

// ── Local Business Ads (P11) ──────────────────────────────────────────────────
export interface BusinessCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface BusinessAd {
  id: string;
  categoryId?: string;
  businessName: string;
  description?: string;
  offer?: string;
  website?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  logoAttachmentId?: string;
  bannerAttachmentId?: string;
  featured: boolean;
  priority: number;
  status: 'Pending' | 'Active' | 'Rejected' | 'Expired' | 'Inactive';
  expiresAt?: string;
  viewCount: number;
  clickCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface BusinessAdDashboard {
  stats: {
    total: number;
    active: number;
    pending: number;
    expired: number;
    featured: number;
    totalViews: number;
    totalClicks: number;
  };
  byCategory: { name: string; count: number }[];
  mostClicked: BusinessAd[];
}

// ── Announcements (P12) ───────────────────────────────────────────────────────
export interface Announcement {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  audience: 'All' | 'Tenants' | 'Security' | 'Admin';
  attachmentId?: string;
  publishAt?: string;
  expiresAt?: string;
  status: 'Draft' | 'Published' | 'Scheduled' | 'Expired' | 'Archived';
  createdBy: string;
  isRead?: boolean;
  readCount?: number;
  createdAt: string;
  updatedAt?: string;
}

// ── Emergency Contacts (P13) ──────────────────────────────────────────────────
export interface EmergencyContact {
  id: string;
  name: string;
  category: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  priority: number;
  available24h: boolean;
  isPinned: boolean;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt?: string;
}

// ── Daily Workers (P14) ───────────────────────────────────────────────────────
export interface DailyWorker {
  id: string;
  name: string;
  phone?: string;
  workerType: string;
  photoAttachmentId?: string;
  idProofAttachmentId?: string;
  address?: string;
  officeId?: string;
  status: 'Active' | 'Inactive' | 'Blacklisted';
  qrCode?: string;
  attendance?: WorkerAttendance[];
  createdAt: string;
  updatedAt?: string;
}

export interface WorkerAttendance {
  id: string;
  workerId: string;
  workDate: string;
  entryTime?: string;
  exitTime?: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'Leave';
  markedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface WorkerTodaySummary {
  summary: { Present: number; Absent: number; 'Half Day': number; Leave: number };
  total: number;
}
