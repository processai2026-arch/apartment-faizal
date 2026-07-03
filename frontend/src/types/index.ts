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

/** Optional GST fields carried on invoices (029). */
export interface InvoiceGstFields {
  gstin?: string;
  taxableAmount?: number;
  gstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  gstTotal?: number;
}

export interface Invoice extends InvoiceGstFields {
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
  // P24 Razorpay fields
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentMethod?: string;
  paymentGatewayStatus?: string;
  refundStatus?: string;
}

export interface FinancialSummary {
  invoiceCount: number;
  billed: number;
  collected: number;
  pending: number;
  byStatus: { status: string; count: number; amount: number; paid: number }[];
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
  // P23 analytics fields
  impressions?: number;
  clicks?: number;
  ctr?: number;
  isFeatured?: boolean;
  packageId?: string;
  expiresAtBilling?: string;
  renewalNotified?: boolean;
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

// ── Office Expenses ───────────────────────────────────────────────────────────
export type ExpensePaymentMethod = 'Petty Cash' | 'Cheque' | 'Bank Transfer' | 'Cash';
export type ExpenseStatus = 'Pending' | 'Approved' | 'Paid' | 'Rejected';

export interface OfficeExpense {
  id: string;
  expenseNo: string;
  category: string;
  paymentMethod: ExpensePaymentMethod;
  payee?: string;
  description?: string;
  amount: number;
  expenseDate?: string;
  chequeNo?: string;
  chequeDate?: string;
  bankName?: string;
  chequeFrontAttachmentId?: string;
  chequeBackAttachmentId?: string;
  receiptAttachmentId?: string;
  status: ExpenseStatus;
  approvedBy?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseSummary {
  monthTotal: number;
  pettyCashTotal: number;
  chequeTotal: number;
  pendingCount: number;
  byCategory: { category: string; count: number; amount: number }[];
}

export interface ExpenseReport {
  rows: OfficeExpense[];
  totals: { count: number; amount: number; byMethod: Record<string, number> };
  filters: { from?: string; to?: string; paymentMethod?: string };
}

// ── Asset & Utility Tracking ──────────────────────────────────────────────────

export type AssetCategory = 'Safety Gear' | 'Cleaning Equipment' | 'Tools' | 'Utility Gear' | 'Other';
export type AssetCondition = 'New' | 'Good' | 'Fair' | 'Damaged' | 'Retired';
export type AssetStatus = 'Available' | 'Checked Out' | 'Under Maintenance' | 'Retired';

export interface AssetAssignment {
  id: string;
  assetId: string;
  staffId: string;
  staffName?: string;
  assetTag?: string;
  assetName?: string;
  assetCategory?: string;
  issuedBy?: string;
  issuedAt: string;
  dueAt?: string;
  returnedAt?: string;
  returnCondition?: string;
  notes?: string;
  createdAt?: string;
}

export interface AssetAudit {
  id: string;
  assetId: string;
  assetTag?: string;
  assetName?: string;
  auditedBy?: string;
  auditDate: string;
  foundStatus: string;
  condition: string;
  remarks?: string;
  createdAt?: string;
}

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  category: AssetCategory;
  assetType?: string;
  serialNo?: string;
  condition: AssetCondition;
  status: AssetStatus;
  photoAttachmentId?: string;
  purchaseDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  currentAssignment?: AssetAssignment | null;
  assignmentHistory?: AssetAssignment[];
  auditHistory?: AssetAudit[];
}

export interface AssetSummary {
  total: number;
  available: number;
  checkedOut: number;
  underMaintenance: number;
  byCategory: { category: string; count: number }[];
}

// ── Visitor Passes (P17) ──────────────────────────────────────────────────────

export type VisitorPassType = 'Temporary' | 'One Day' | 'Recurring' | 'Delivery' | 'Worker' | 'Guest';
export type VisitorPassStatus = 'Active' | 'Used' | 'Expired' | 'Cancelled';

export interface VisitorPass {
  id: string;
  passCode: string;
  passType: VisitorPassType;
  visitorName: string;
  visitorPhone?: string;
  hostName?: string;
  hostOfficeId?: number;
  purpose?: string;
  validFrom: string;
  validUntil: string;
  maxUses: number;
  usedCount: number;
  status: VisitorPassStatus;
  qrPayload: string;
  createdBy?: number;
  sharedVia?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  scans?: VisitorPassScan[];
}

export interface VisitorPassScan {
  id: number;
  passId: number;
  scannedAt: string;
  scannedBy?: number;
  action: 'entry' | 'exit';
  notes?: string;
}

export interface VisitorPassDashboard {
  totalToday: number;
  active: number;
  expired: number;
  used: number;
  cancelled: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  recent: VisitorPass[];
}

// ── Community Analytics (P18) ─────────────────────────────────────────────────

export interface OccupancyAnalytics {
  total: number;
  occupied: number;
  vacant: number;
  occupancyRate: number;
  byBlock: { block: string; occupied: number; total: number }[];
}

export interface MonthlyTrend {
  month: string;
  count: number;
}

export interface ComplaintAnalytics {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  monthlyTrend: MonthlyTrend[];
  avgResolutionHours: number;
}

export interface MaintenanceAnalytics {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  pending: number;
  monthlyTrend: MonthlyTrend[];
  avgResolutionHours: number;
}

export interface VendorAnalytics {
  total: number;
  avgRating: number;
  totalBookings: number;
  bookingsByStatus: Record<string, number>;
  topRated: { id: string; name: string; rating: number }[];
  topBooked: { id: string; name: string; bookingCount: number }[];
  monthlyBookings: MonthlyTrend[];
}

export interface RentalAnalytics {
  total: number;
  active: number;
  pendingApproval: number;
  byType: Record<string, number>;
  avgRent: number;
  monthlyListings: MonthlyTrend[];
}

export interface VisitorAnalytics {
  today: number;
  thisWeek: number;
  thisMonth: number;
  byDayOfWeek: { day: string; count: number }[];
  monthlyTrend: MonthlyTrend[];
}

export interface RevenueAnalytics {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  monthlyRevenue: { month: string; paid: number; pending: number }[];
  byStatus: Record<string, number>;
}

export interface WorkerAnalytics {
  totalWorkers: number;
  active: number;
  todayPresent: number;
  todayAbsent: number;
  attendanceRateThisWeek: number;
  byType: Record<string, number>;
}

export interface AnalyticsSummary {
  occupancy: OccupancyAnalytics;
  complaints: ComplaintAnalytics;
  maintenance: MaintenanceAnalytics;
  vendors: VendorAnalytics;
  rentals: RentalAnalytics;
  visitors: VisitorAnalytics;
  revenue: RevenueAnalytics;
  workers: WorkerAnalytics;
}

// ── Community Events (P19) ────────────────────────────────────────────────────

export interface CommunityEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  organizer?: string;
  eventDate: string;
  eventTime?: string;
  imageAttachmentId?: string;
  attachmentId?: string;
  capacity: number;
  registrationRequired: boolean;
  registrationCount?: number;
  status: 'Draft' | 'Published' | 'Cancelled' | 'Completed';
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
  // Tenant-specific fields
  myRegistration?: EventRegistration | null;
  isRegistered?: boolean;
  // Admin-specific fields
  recentRegistrations?: EventRegistration[];
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId?: string;
  name: string;
  phone?: string;
  email?: string;
  status: 'Registered' | 'Cancelled' | 'Attended';
  registeredAt: string;
  notes?: string;
  // Joined fields from myRegistrations endpoint
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
  eventStatus?: string;
}

export interface EventDashboard {
  upcomingCount: number;
  thisMonthCount: number;
  totalPublished: number;
  todayRegistrations: number;
  recentEvents: CommunityEvent[];
}

// ── CCTV Foundation (P21) ─────────────────────────────────────────────────────

export interface CameraDevice {
  id: string;
  name: string;
  location: string;
  zone?: string;
  rtspUrl?: string;
  /** Browser-playable live stream (HLS .m3u8 or MJPEG) produced from the RTSP source. */
  hlsUrl?: string;
  ipAddress?: string;
  port?: number;
  manufacturer?: string;
  model?: string;
  resolution?: string;
  status: 'Online' | 'Offline' | 'Maintenance' | 'Fault';
  lastHeartbeat?: string;
  snapshotUrl?: string;
  isRecording: boolean;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface CameraEvent {
  id: string;
  cameraId: string;
  eventType: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description?: string;
  snapshotId?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  occurredAt: string;
  createdAt: string;
}

export interface CameraSnapshot {
  id: string;
  cameraId: string;
  fileUrl?: string;
  capturedAt: string;
  trigger: string;
  eventId?: string;
  notes?: string;
}

export interface CameraDashboard {
  totalCameras: number;
  byStatus: Record<string, number>;
  totalEventsToday: number;
  unacknowledgedEvents: number;
  recentEvents: CameraEvent[];
  camerasByZone: { zone: string; count: number }[];
}

// ── Premium Membership (P22) ──────────────────────────────────────────────────

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  maxListings: number;
  maxAds: number;
  analyticsAccess: boolean;
  featuredVendor: boolean;
  featuredRental: boolean;
  prioritySupport: boolean;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName?: string;
  status: 'Active' | 'Cancelled' | 'Expired' | 'Pending';
  billingCycle: 'Monthly' | 'Yearly';
  startedAt: string;
  expiresAt?: string;
  amountPaid: number;
  paymentRef?: string;
}

export interface PremiumFeature {
  id: string;
  featureKey: string;
  featureName: string;
  description?: string;
  minPlan: string;
  isActive: boolean;
}

export interface SubscriptionDashboard {
  totalSubscribers: number;
  active: number;
  byPlan: Record<string, number>;
  mrr: number;
  recentSubscriptions: Subscription[];
}

// ── Ad Billing & Analytics (P23) ─────────────────────────────────────────────

export interface AdPackage {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  maxImpressions: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface AdBilling {
  id: string;
  adId: string;
  packageId?: string;
  amount: number;
  billingStatus: 'Pending' | 'Paid' | 'Overdue' | 'Waived';
  dueDate?: string;
  paidAt?: string;
  paymentRef?: string;
  renewalReminded: boolean;
  notes?: string;
  businessName?: string;
  packageName?: string;
}

export interface AdAnalytics {
  totalAds: number;
  activeAds: number;
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  topClicked: { id: string; title: string; clicks: number; ctr: number }[];
  topViewed: { id: string; title: string; impressions: number }[];
  monthlyImpressions: { month: string; count: number }[];
  activeVsExpired: { active: number; expired: number };
  revenueSummary: { total_revenue: number; pending: number; overdue_count: number };
}

export interface BillingSummary {
  total_revenue: number;
  pending: number;
  overdue_amount: number;
  overdue_count: number;
  by_status: { status: string; count: number; total: number }[];
}

export interface AdExportRow {
  id: number;
  business_name: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  is_featured: boolean;
  expires_at: string | null;
  created_at: string;
  billing_status: string | null;
  billing_amount: number;
  billing_due_date: string | null;
  paid_at: string | null;
  package_name: string | null;
}

// ── Razorpay Payment Integration (P24) ───────────────────────────────────────

export interface PaymentTransaction {
  id: string;
  invoiceId: string;
  invoiceNo?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  errorCode?: string;
  errorDescription?: string;
  webhookReceived?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  invoiceId: string;
}

export interface PaymentDashboard {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  todayPayments: number;
  thisMonthRevenue: number;
  paymentMethods: Record<string, number>;
  recentTransactions: PaymentTransaction[];
  byStatus: Record<string, number>;
}

// ── Facility & Daily Operations (P25) ─────────────────────────────────────────

export type CctvCheckStatus = 'Working' | 'Faulty' | 'Offline';

/** One camera row in the daily CCTV checklist (camera + its check for the day, if any). */
export interface CctvDailyCheck {
  cameraId: string;
  cameraName: string;
  location?: string;
  zone?: string;
  checkId?: string;
  status?: CctvCheckStatus;
  remarks?: string;
  checkedBy?: string;
  checkedAt?: string;
}

export interface CctvDailySummary {
  totalCameras: number;
  checked: number;
  working: number;
  faulty: number;
  offline: number;
  unchecked: number;
}

export interface CctvChecklist {
  date: string;
  summary: CctvDailySummary;
  checks: CctvDailyCheck[];
}

export interface WaterLorryLog {
  id: string;
  logDate: string;
  supplierName: string;
  vehicleNo?: string;
  capacityLitres?: number;
  trips: number;
  amount?: number;
  notes?: string;
  createdAt: string;
}

export interface EbLog {
  id: string;
  logDate: string;
  meterStart?: number;
  meterEnd?: number;
  powerCutMinutes: number;
  generatorNote?: string;
  notes?: string;
  createdAt: string;
}

export interface HousekeepingLog {
  id: string;
  logDate: string;
  area: string;
  task: string;
  status: 'Done' | 'Pending' | 'Partial';
  staffName?: string;
  remarks?: string;
  createdAt: string;
}

export interface DailyOpsMaintenanceItem {
  id: string;
  title: string;
  category?: string;
  priority: string;
  status: string;
  expectedCompletion?: string;
  officeBlock?: string;
  officeName?: string;
  staffName?: string;
}

export interface DailyOpsUtilityItem {
  id: string;
  description: string;
  type?: string;
  scheduledDate?: string;
  status: string;
  assignedStaff?: string;
  notes?: string;
}

export interface DailyOpsPayment {
  id: string;
  invoiceId: string;
  invoiceNo?: string;
  invoiceDescription?: string;
  amount: number;
  paidAt: string;
  mode?: string;
  referenceNo?: string;
}

/** Aggregated Daily Activity Report (GET /admin/daily-ops/report). */
export interface DailyOpsReport {
  date: string;
  cctv: CctvDailySummary & { checks: CctvDailyCheck[] };
  waterLorry: { entries: number; totalTrips: number; totalLitres: number; totalAmount: number; logs: WaterLorryLog[] };
  eb: { logs: EbLog[]; totalPowerCutMinutes: number };
  housekeeping: { total: number; done: number; pending: number; partial: number; completion: number; logs: HousekeepingLog[] };
  staffAttendance: { totalStaff: number; present: number; absent: number; halfDay: number; unmarked: number };
  maintenanceDue: DailyOpsMaintenanceItem[];
  utilityTasks: DailyOpsUtilityItem[];
  vendorPayments: { entries: number; totalAmount: number; payments: DailyOpsPayment[] };
}

// ── IoT Monitoring & Hardware Automation ──────────────────────────────────────

export type IotDeviceType = 'lift' | 'electrical_board' | 'sensor' | 'gateway' | 'other';
export type IotProtocol = 'http' | 'mqtt' | 'modbus';
export type IotEventType = 'fault' | 'voltage_fluctuation' | 'status_change' | 'heartbeat' | 'test';
export type IotSeverity = 'info' | 'warning' | 'critical';

export interface IotDevice {
  id: string;
  name: string;
  deviceType: IotDeviceType;
  protocol: IotProtocol;
  ipAddress?: string;
  ioLines?: number;
  /** Only present in create / regenerate-token responses — shown once. */
  apiToken?: string;
  location?: string;
  status: 'Active' | 'Inactive';
  lastSeenAt?: string;
  notes?: string;
  createdAt: string;
}

export interface IotEvent {
  id: string;
  deviceId: string;
  deviceName?: string;
  deviceType?: string;
  eventType: IotEventType;
  severity: IotSeverity;
  ioLine?: number;
  value?: string;
  message?: string;
  payload?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  createdAt: string;
}

export interface IotSummary {
  totalDevices: number;
  activeDevices: number;
  onlineDevices: number;
  offlineDevices: IotDevice[];
  offlineCount: number;
  offlineThresholdMinutes: number;
  unacknowledgedCritical: number;
  unacknowledgedAlerts: number;
  eventsToday: number;
}

// ── Home Automation (Home Assistant REST connector) ──────────────────────────
export type HaHubStatus = 'Active' | 'Disabled';
export type HaDeviceDomain = 'switch' | 'light' | 'sensor' | 'climate' | 'cover' | 'lock' | 'binary_sensor' | 'other';

export interface HomeAutomationHub {
  id: string;
  name: string;
  ownerUserId?: string | null;
  officeId?: string | null;
  provider: string;
  baseUrl: string;
  status: HaHubStatus;
  lastCheckAt?: string | null;
  /** 1 reachable, 0 failed, null never checked. */
  lastCheckOk?: number | null;
  /** Masked token preview (e.g. "abc***"); the real token is never returned. */
  accessTokenMasked?: string | null;
  notes?: string;
  createdAt?: string;
}

export interface HomeAutomationDevice {
  id: string;
  hubId: string;
  entityId: string;
  friendlyName?: string;
  domain: HaDeviceDomain;
  isControllable: number;
  visibleToOwner: number;
  /** Live values merged in by the devices endpoints (best-effort). */
  state?: string | null;
  unit?: string | null;
  reachable?: boolean;
}

export interface HomeAutomationSummary {
  hubs: number;
  activeHubs: number;
  reachableHubs: number;
  devices: number;
}

// ── Documents (Office Documents storage & maintenance) ───────────────────────
export type DocumentCategory = 'Office Documents' | 'Legal' | 'Financial' | 'Compliance' | 'Contracts' | 'Correspondence' | 'Other';
export type DocumentStatus = 'Active' | 'Archived' | 'Expired';

export interface DocumentAttachment {
  id: string;
  originalName?: string;
  storedPath?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface OfficeDocument {
  id: string;
  docNo: string;
  title: string;
  category: DocumentCategory;
  officeId?: string;
  attachmentId?: string;
  fileName?: string;
  expiryDate?: string;
  tags?: string;
  status: DocumentStatus;
  uploadedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  attachment?: DocumentAttachment;
}

export interface DocumentSummary {
  total: number;
  officeDocs: number;
  expiringSoon: number;
  expired: number;
  byCategory: { category: string; count: number }[];
}

// ── Name Transfers (Association module — incoming tenants) ────────────────────
export type NameTransferStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed';

export interface NameTransferOffice {
  id: string;
  block?: string;
  floorNumber?: string;
  companyName?: string;
}

export interface NameTransfer {
  id: string;
  transferNo: string;
  officeId: string;
  fromName?: string;
  toName: string;
  toContactPerson?: string;
  toPhone?: string;
  toEmail?: string;
  reason?: string;
  effectiveDate?: string;
  status: NameTransferStatus;
  supportingDocAttachmentId?: string;
  requestedBy?: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  office?: NameTransferOffice;
}

export interface NameTransferSummary {
  pending: number;
  approved: number;
  completedThisMonth: number;
}

// ── Staff Payroll ──────────────────────────────────────────────────────────
export type PayrollRunStatus = 'Draft' | 'Finalized' | 'Paid';
export type PayslipPaymentMethod = 'Bank Transfer' | 'Cash' | 'Cheque';

export interface Payslip {
  id: string;
  payrollRunId: string;
  staffId: string;
  periodMonth: string;
  baseSalary: number;
  presentDays: number;
  paidDays: number;
  absentDays: number;
  overtimeAmount: number;
  allowances: number;
  deductions: number;
  grossPay: number;
  netPay: number;
  paymentMethod: PayslipPaymentMethod;
  paidAt?: string;
  notes?: string;
  staffName?: string;
  staffRole?: string;
  staffDepartment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayrollRun {
  id: string;
  periodMonth: string;
  status: PayrollRunStatus;
  generatedBy?: string;
  notes?: string;
  staffCount?: number;
  totalNet?: number;
  totalGross?: number;
  paidCount?: number;
  payslips?: Payslip[];
  createdAt: string;
  updatedAt?: string;
}

export interface PayrollSummary {
  periodMonth: string;
  monthPayout: number;
  staffCount: number;
  payslipCount: number;
  paidCount: number;
  pendingCount: number;
  paidAmount: number;
  pendingAmount: number;
}

// ── Medical Reports ────────────────────────────────────────────────────────
export type MedicalReportType = 'Fitness Certificate' | 'Checkup' | 'Injury' | 'Insurance' | 'Other';
export type MedicalResult = 'Fit' | 'Unfit' | 'Follow-up' | 'N/A';

export interface MedicalAttachment {
  id: string;
  originalName?: string;
  storedPath?: string;
  mimeType?: string;
}

export interface MedicalReport {
  id: string;
  reportNo: string;
  staffId?: string;
  personName: string;
  reportType: MedicalReportType;
  reportDate: string;
  provider?: string;
  summary?: string;
  result: MedicalResult;
  nextCheckupDate?: string;
  attachmentId?: string;
  confidential: boolean;
  recordedBy?: string;
  notes?: string;
  attachment?: MedicalAttachment;
  createdAt: string;
  updatedAt?: string;
}

export interface MedicalSummary {
  total: number;
  fit: number;
  unfit: number;
  followUp: number;
  checkupsDue: number;
  byType: { reportType: string; count: number }[];
}

// ── Accounts & Compliance (GST report / Audit report / Suspend list) ─────────

export interface GstRateLine {
  rate: number;
  taxable: number;
  tax: number;
}

export interface GstTaxSection {
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  byRate: GstRateLine[];
}

export interface GstInvoiceLine {
  id: string;
  invoiceNo: string;
  date?: string;
  gstin?: string;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  gstTotal: number;
  amount: number;
  status?: string;
}

export interface GstExpenseLine {
  id: string;
  expenseNo?: string;
  date?: string;
  payee?: string;
  gstin?: string;
  category?: string;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  amount: number;
}

export interface GstReport {
  from: string;
  to: string;
  outputTax: GstTaxSection & { invoices: GstInvoiceLine[] };
  inputTax: GstTaxSection & { expenses: GstExpenseLine[] };
  netGst: number;
}

export interface AuditReport {
  period: { from: string; to: string };
  financials: {
    invoices: { count: number; billed: number; collected: number; gstCollected: number; byStatus: { status: string; count: number; amount: number }[] };
    payments: { count: number; amount: number };
    expenses: { count: number; amount: number; gstPaid: number; byCategory: { category: string; count: number; amount: number; gst: number }[] };
    netCashFlow: number;
  };
  inventory: {
    items: number;
    totalQuantity: number;
    usedQuantity: number;
    stockValue: number;
    assets: { total: number; byStatus: { status: string; count: number }[] };
  };
  payroll: { runs: number; payslips: number; grossPay: number; netPay: number; paidSlips: number };
  documents: { total: number; active: number };
  amc: { active: number; expiringSoon: number; contracts: AmcContract[] };
}

export type SuspendEntityType = 'user' | 'vendor' | 'office';

export interface SuspendedUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  status: string;
  updatedAt?: string;
}

export interface SuspendedVendor {
  id: string;
  name: string;
  company?: string;
  serviceType?: string;
  contact?: string;
  status: string;
  updatedAt?: string;
}

export interface SuspendedOffice {
  id: string;
  block?: string;
  floorNumber?: string;
  companyName: string;
  contactPerson?: string;
  status: string;
  updatedAt?: string;
}

export interface SuspendedLists {
  users: SuspendedUser[];
  vendors: SuspendedVendor[];
  offices: SuspendedOffice[];
}

// ── AMC Contracts & DG Maintenance ────────────────────────────────────────────

export type AmcContractType = 'AMC' | 'DG Maintenance' | 'Lift AMC' | 'Fire Safety' | 'Other';
export type AmcPaymentFrequency = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | 'One-Time';
export type AmcStatus = 'Active' | 'Expired' | 'Cancelled';

export interface AmcContract {
  id: string;
  contractNo: string;
  title: string;
  contractType: AmcContractType;
  vendorId?: string;
  vendorName?: string;
  startDate?: string;
  endDate?: string;
  amount: number;
  paymentFrequency: AmcPaymentFrequency;
  reminderDays: number;
  documentAttachmentId?: string;
  status: AmcStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DgMaintenanceLog {
  id: string;
  logDate: string;
  dgName: string;
  runHours: number;
  dieselAddedLitres: number;
  dieselCost: number;
  servicePerformed?: string;
  nextServiceDate?: string;
  performedBy?: string;
  remarks?: string;
  attachmentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DgSummary {
  monthLogs: number;
  monthRunHours: number;
  monthDieselLitres: number;
  monthDieselCost: number;
  nextServiceDate?: string;
  nextServiceDg?: string;
}

// ── Super Admin: Organizations & Multi-tenant ────────────────────────────────
export type OrganizationPlan = 'Free' | 'Standard' | 'Premium';
export type OrganizationStatus = 'Active' | 'Suspended' | 'Trial';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  plan: OrganizationPlan;
  status: OrganizationStatus;
  adsEnabled: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

/** Per-organization rollup returned by GET /super/overview. */
export interface OrgRollup {
  org: Organization;
  users: number;
  activeSubscriptions: number;
  subscriptionRevenue: number;
  businessAds: number;
  adBillingTotal: number;
  vendors: number;
}

export interface SuperAdminTotals {
  organizations: number;
  users: number;
  activeSubscriptions: number;
  subscriptionRevenue: number;
  businessAds: number;
  adBillingTotal: number;
  vendors: number;
}

export interface SuperAdminOverview {
  organizations: OrgRollup[];
  totals: SuperAdminTotals;
}

// ── Feature Entitlements ─────────────────────────────────────────────────────
/** One selectable module in the super-admin feature catalog. */
export interface FeatureCatalogItem {
  key: string;
  label: string;
  group: string;
  roles: string[];
}

/** An organization's per-feature enabled state (GET/PUT org features). */
export interface OrgFeatureMap {
  orgId: string;
  features: Record<string, boolean>;
}

/** The current user's enabled feature keys (GET /me/features). */
export interface MeFeatures {
  role: string;
  orgId: number | null;
  features: string[];
}

