// UI Settings Types for Dynamic UI Customization

export interface CardConfig {
  id: string;
  title: string;
  visible: boolean;
  order: number;
  size: 'small' | 'medium' | 'large' | 'full';
  collapsed: boolean;
}

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  width?: number;
}

export interface ButtonConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface SectionConfig {
  id: string;
  title: string;
  visible: boolean;
  order: number;
  collapsed: boolean;
}

export interface PageSettings {
  cards: CardConfig[];
  columns: ColumnConfig[];
  buttons: ButtonConfig[];
  sections: SectionConfig[];
}

export interface UISettings {
  // Dashboard pages
  adminDashboard: PageSettings;
  residentDashboard: PageSettings;
  securityDashboard: PageSettings;
  
  // Management pages
  visitorManagement: PageSettings;
  vehicleManagement: PageSettings;
  officeManagement: PageSettings;
  financialTracking: PageSettings;
  
  // Other pages
  entryVisitors: PageSettings;
  checkOutVisitors: PageSettings;
  checkOutVehicle: PageSettings;
  manageApartment: PageSettings;
  qrCodes: PageSettings;
  
  // Additional pages
  vehicleRegistry: PageSettings;
  vendorManagement: PageSettings;
  staffAttendance: PageSettings;
  utilityManagement: PageSettings;
  inventoryAudit: PageSettings;
  reports: PageSettings;
}

// Default configurations for each page
export const defaultAdminDashboardSettings: PageSettings = {
  cards: [
    { id: 'totalVisitors', title: 'Total Visitors Today', visible: true, order: 0, size: 'small', collapsed: false },
    { id: 'currentlyInside', title: 'Currently Inside', visible: true, order: 1, size: 'small', collapsed: false },
    { id: 'totalOffices', title: 'Total Offices', visible: true, order: 2, size: 'small', collapsed: false },
    { id: 'companies', title: 'Companies', visible: true, order: 3, size: 'small', collapsed: false },
    { id: 'visitorTrend', title: 'Visitor Trend', visible: true, order: 4, size: 'large', collapsed: false },
    { id: 'occupancyStatus', title: 'Occupancy Status', visible: true, order: 5, size: 'medium', collapsed: false },
    { id: 'recentActivity', title: 'Recent Visitor Activity', visible: true, order: 6, size: 'full', collapsed: false },
  ],
  columns: [
    { id: 'visitor', label: 'Visitor', visible: true, order: 0 },
    { id: 'office', label: 'Unit', visible: true, order: 1 },
    { id: 'purpose', label: 'Purpose', visible: true, order: 2 },
    { id: 'entryTime', label: 'Entry Time', visible: true, order: 3 },
    { id: 'status', label: 'Status', visible: true, order: 4 },
  ],
  buttons: [
    { id: 'entryVisitor', label: '+ Entry Visitor', visible: true, order: 0 },
    { id: 'registerVehicle', label: '+ Register Vehicle', visible: true, order: 1 },
    { id: 'viewReports', label: 'View Reports', visible: true, order: 2 },
  ],
  sections: [],
};

export const defaultResidentDashboardSettings: PageSettings = {
  cards: [
    { id: 'visitorsInside', title: 'Visitors Inside', visible: true, order: 0, size: 'small', collapsed: false },
    { id: 'todayVisitors', title: "Today's Visitors", visible: true, order: 1, size: 'small', collapsed: false },
    { id: 'activeWorkers', title: 'Active Workers', visible: true, order: 2, size: 'small', collapsed: false },
    { id: 'openComplaints', title: 'Open Complaints', visible: true, order: 3, size: 'small', collapsed: false },
    { id: 'recentVisitors', title: 'Recent Visitors', visible: true, order: 4, size: 'medium', collapsed: false },
    { id: 'dailyWorkers', title: 'Daily Workers', visible: true, order: 5, size: 'medium', collapsed: false },
    { id: 'propertyDetails', title: 'Property Details', visible: true, order: 6, size: 'medium', collapsed: false },
    { id: 'paymentStatus', title: 'Payment Status', visible: true, order: 7, size: 'medium', collapsed: false },
    { id: 'myComplaints', title: 'My Complaints', visible: true, order: 8, size: 'full', collapsed: false },
    { id: 'emergencyContacts', title: 'Emergency Contacts', visible: true, order: 9, size: 'full', collapsed: false },
  ],
  columns: [],
  buttons: [
    { id: 'inviteVisitor', label: 'Invite Visitor', visible: true, order: 0 },
    { id: 'addWorker', label: 'Add Worker', visible: true, order: 1 },
    { id: 'raiseComplaint', label: 'Raise Complaint', visible: true, order: 2 },
    { id: 'emergency', label: 'Emergency', visible: true, order: 3 },
  ],
  sections: [
    { id: 'welcome', title: 'Welcome Section', visible: true, order: 0, collapsed: false },
    { id: 'quickActions', title: 'Quick Actions', visible: true, order: 1, collapsed: false },
    { id: 'stats', title: 'Stats Grid', visible: true, order: 2, collapsed: false },
    { id: 'ownerSections', title: 'Owner Sections', visible: true, order: 3, collapsed: false },
  ],
};

export const defaultSecurityDashboardSettings: PageSettings = {
  cards: [
    { id: 'visitorsInside', title: 'Visitors Inside', visible: true, order: 0, size: 'small', collapsed: false },
    { id: 'vehiclesInside', title: 'Vehicles Inside', visible: true, order: 1, size: 'small', collapsed: false },
    { id: 'activeWorkers', title: 'Active Workers', visible: true, order: 2, size: 'small', collapsed: false },
  ],
  columns: [
    { id: 'name', label: 'Name', visible: true, order: 0 },
    { id: 'company', label: 'Company', visible: true, order: 1 },
    { id: 'meeting', label: 'Meeting', visible: true, order: 2 },
    { id: 'entryTime', label: 'Entry Time', visible: true, order: 3 },
    { id: 'action', label: 'Action', visible: true, order: 4 },
  ],
  buttons: [
    { id: 'showGateQR', label: 'Show Gate QR', visible: true, order: 0 },
    { id: 'addVisitor', label: 'Add Visitor', visible: true, order: 1 },
  ],
  sections: [],
};

export const defaultVisitorManagementSettings: PageSettings = {
  cards: [],
  columns: [
    { id: 'index', label: '#', visible: true, order: 0 },
    { id: 'name', label: "Visitor's Name", visible: true, order: 1 },
    { id: 'contact', label: "Visitor's Contact", visible: true, order: 2 },
    { id: 'gender', label: 'Gender', visible: true, order: 3 },
    { id: 'building', label: 'Building', visible: true, order: 4 },
    { id: 'apartment', label: 'Apartment', visible: true, order: 5 },
    { id: 'whomToVisit', label: 'Whom To Visit', visible: true, order: 6 },
    { id: 'entryTime', label: 'Entry Time', visible: true, order: 7 },
    { id: 'action', label: 'Action', visible: true, order: 8 },
  ],
  buttons: [
    { id: 'export', label: 'Export CSV', visible: true, order: 0 },
    { id: 'search', label: 'Search', visible: true, order: 1 },
  ],
  sections: [],
};

export const defaultFinancialTrackingSettings: PageSettings = {
  cards: [
    { id: 'totalCollected', title: 'Total Collected', visible: true, order: 0, size: 'small', collapsed: false },
    { id: 'totalPending', title: 'Total Pending', visible: true, order: 1, size: 'small', collapsed: false },
    { id: 'overdueCount', title: 'Overdue Count', visible: true, order: 2, size: 'small', collapsed: false },
    { id: 'collectionTrend', title: 'Collection Trend', visible: true, order: 3, size: 'full', collapsed: false },
  ],
  columns: [
    { id: 'unit', label: 'Unit', visible: true, order: 0 },
    { id: 'resident', label: 'Resident', visible: true, order: 1 },
    { id: 'monthlyCharge', label: 'Monthly Charge', visible: true, order: 2 },
    { id: 'paymentStatus', label: 'Payment Status', visible: true, order: 3 },
    { id: 'lastPaid', label: 'Last Paid', visible: true, order: 4 },
    { id: 'action', label: 'Action', visible: true, order: 5 },
  ],
  buttons: [
    { id: 'addRecord', label: 'Add Record', visible: true, order: 0 },
    { id: 'export', label: 'Export', visible: true, order: 1 },
  ],
  sections: [],
};

export const defaultEntryVisitorsSettings: PageSettings = {
  cards: [],
  columns: [
    { id: 'phone', label: 'Contact Number', visible: true, order: 0 },
    { id: 'name', label: 'Full Name', visible: true, order: 1 },
    { id: 'gender', label: 'Gender', visible: true, order: 2 },
    { id: 'address', label: 'Address', visible: true, order: 3 },
    { id: 'city', label: 'City', visible: true, order: 4 },
    { id: 'pincode', label: 'Pincode', visible: true, order: 5 },
    { id: 'vehicleType', label: 'Vehicle Type', visible: true, order: 6 },
    { id: 'vehicleNo', label: 'Vehicle Number', visible: true, order: 7 },
    { id: 'block', label: 'Block', visible: true, order: 8 },
    { id: 'floor', label: 'Floor', visible: true, order: 9 },
    { id: 'company', label: 'Company', visible: true, order: 10 },
    { id: 'whomToMeet', label: 'Whom to Meet', visible: true, order: 11 },
    { id: 'reason', label: 'Reason', visible: true, order: 12 },
    { id: 'photo', label: 'Visitor Photo', visible: true, order: 13 },
  ],
  buttons: [
    { id: 'submit', label: 'Submit', visible: true, order: 0 },
    { id: 'clear', label: 'Clear', visible: true, order: 1 },
  ],
  sections: [
    { id: 'visitorInfo', title: 'Visitor Information', visible: true, order: 0, collapsed: false },
    { id: 'visitDetails', title: 'Visit Details', visible: true, order: 1, collapsed: false },
    { id: 'vehicleInfo', title: 'Vehicle Information', visible: true, order: 2, collapsed: false },
  ],
};

export const defaultCheckOutVisitorsSettings: PageSettings = {
  cards: [],
  columns: [
    { id: 'visitor', label: 'Visitor', visible: true, order: 0 },
    { id: 'phone', label: 'Phone', visible: true, order: 1 },
    { id: 'office', label: 'Office', visible: true, order: 2 },
    { id: 'entryTime', label: 'Entry Time', visible: true, order: 3 },
    { id: 'action', label: 'Action', visible: true, order: 4 },
  ],
  buttons: [
    { id: 'checkOut', label: 'Check Out', visible: true, order: 0 },
    { id: 'checkOutAll', label: 'Check Out All', visible: true, order: 1 },
  ],
  sections: [],
};

export const defaultManageApartmentSettings: PageSettings = {
  cards: [],
  columns: [
    { id: 'unitNo', label: 'Unit No', visible: true, order: 0 },
    { id: 'block', label: 'Block', visible: true, order: 1 },
    { id: 'floor', label: 'Floor', visible: true, order: 2 },
    { id: 'type', label: 'Type', visible: true, order: 3 },
    { id: 'resident', label: 'Resident', visible: true, order: 4 },
    { id: 'status', label: 'Status', visible: true, order: 5 },
    { id: 'action', label: 'Action', visible: true, order: 6 },
  ],
  buttons: [
    { id: 'addApartment', label: 'Add Apartment', visible: true, order: 0 },
    { id: 'export', label: 'Export', visible: true, order: 1 },
  ],
  sections: [],
};

export const getDefaultUISettings = (): UISettings => ({
  adminDashboard: defaultAdminDashboardSettings,
  residentDashboard: defaultResidentDashboardSettings,
  securityDashboard: defaultSecurityDashboardSettings,
  visitorManagement: defaultVisitorManagementSettings,
  vehicleManagement: { cards: [], columns: [], buttons: [], sections: [] },
  officeManagement: { cards: [], columns: [], buttons: [], sections: [] },
  financialTracking: defaultFinancialTrackingSettings,
  entryVisitors: defaultEntryVisitorsSettings,
  checkOutVisitors: defaultCheckOutVisitorsSettings,
  checkOutVehicle: {
    cards: [],
    columns: [
      { id: 'index', label: '#', visible: true, order: 0 },
      { id: 'company', label: "Visitor's Company", visible: true, order: 1 },
      { id: 'vehicleType', label: 'Vehicle Type', visible: true, order: 2 },
      { id: 'vehicleNo', label: 'Vehicle Number', visible: true, order: 3 },
      { id: 'vehicleModel', label: 'Vehicle Model', visible: true, order: 4 },
      { id: 'visitorType', label: 'Visitor Type', visible: true, order: 5 },
      { id: 'entryTime', label: 'Entry Time', visible: true, order: 6 },
      { id: 'action', label: 'Action', visible: true, order: 7 },
    ],
    buttons: [{ id: 'checkOut', label: 'Check Out', visible: true, order: 0 }],
    sections: [],
  },
  manageApartment: defaultManageApartmentSettings,
  qrCodes: { cards: [], columns: [], buttons: [], sections: [] },
  vehicleRegistry: {
    cards: [
      { id: 'entryForm', title: 'Log Vehicle Entry', visible: true, order: 0, size: 'medium', collapsed: false },
      { id: 'activeVehicles', title: 'Active Vehicles Inside', visible: true, order: 1, size: 'large', collapsed: false },
      { id: 'recentlyExited', title: 'Recently Exited', visible: true, order: 2, size: 'large', collapsed: false },
    ],
    columns: [
      { id: 'vehicleNo', label: 'Vehicle Number', visible: true, order: 0 },
      { id: 'ownerName', label: 'Owner Name', visible: true, order: 1 },
      { id: 'apartmentNo', label: 'Apartment No', visible: true, order: 2 },
      { id: 'vehicleType', label: 'Vehicle Type', visible: true, order: 3 },
    ],
    buttons: [{ id: 'logEntry', label: 'Log Entry', visible: true, order: 0 }],
    sections: [],
  },
  vendorManagement: {
    cards: [],
    columns: [
      { id: 'name', label: 'Vendor Name', visible: true, order: 0 },
      { id: 'category', label: 'Category', visible: true, order: 1 },
      { id: 'contact', label: 'Contact', visible: true, order: 2 },
      { id: 'status', label: 'Status', visible: true, order: 3 },
      { id: 'action', label: 'Action', visible: true, order: 4 },
    ],
    buttons: [{ id: 'addVendor', label: 'Add Vendor', visible: true, order: 0 }],
    sections: [],
  },
  staffAttendance: {
    cards: [
      { id: 'presentToday', title: 'Present Today', visible: true, order: 0, size: 'small', collapsed: false },
      { id: 'absentToday', title: 'Absent Today', visible: true, order: 1, size: 'small', collapsed: false },
      { id: 'onLeave', title: 'On Leave', visible: true, order: 2, size: 'small', collapsed: false },
    ],
    columns: [
      { id: 'name', label: 'Staff Name', visible: true, order: 0 },
      { id: 'role', label: 'Role', visible: true, order: 1 },
      { id: 'checkIn', label: 'Check In', visible: true, order: 2 },
      { id: 'checkOut', label: 'Check Out', visible: true, order: 3 },
      { id: 'status', label: 'Status', visible: true, order: 4 },
    ],
    buttons: [{ id: 'markAttendance', label: 'Mark Attendance', visible: true, order: 0 }],
    sections: [],
  },
  utilityManagement: {
    cards: [
      { id: 'electricityUsage', title: 'Electricity Usage', visible: true, order: 0, size: 'medium', collapsed: false },
      { id: 'waterUsage', title: 'Water Usage', visible: true, order: 1, size: 'medium', collapsed: false },
      { id: 'gasUsage', title: 'Gas Usage', visible: true, order: 2, size: 'medium', collapsed: false },
    ],
    columns: [
      { id: 'unit', label: 'Unit', visible: true, order: 0 },
      { id: 'meterReading', label: 'Meter Reading', visible: true, order: 1 },
      { id: 'consumption', label: 'Consumption', visible: true, order: 2 },
      { id: 'amount', label: 'Amount', visible: true, order: 3 },
    ],
    buttons: [{ id: 'addReading', label: 'Add Reading', visible: true, order: 0 }],
    sections: [],
  },
  inventoryAudit: {
    cards: [
      { id: 'totalItems', title: 'Total Items', visible: true, order: 0, size: 'small', collapsed: false },
      { id: 'lowStock', title: 'Low Stock', visible: true, order: 1, size: 'small', collapsed: false },
      { id: 'outOfStock', title: 'Out of Stock', visible: true, order: 2, size: 'small', collapsed: false },
    ],
    columns: [
      { id: 'itemName', label: 'Item Name', visible: true, order: 0 },
      { id: 'category', label: 'Category', visible: true, order: 1 },
      { id: 'quantity', label: 'Quantity', visible: true, order: 2 },
      { id: 'status', label: 'Status', visible: true, order: 3 },
      { id: 'action', label: 'Action', visible: true, order: 4 },
    ],
    buttons: [{ id: 'addItem', label: 'Add Item', visible: true, order: 0 }],
    sections: [],
  },
  reports: {
    cards: [
      { id: 'visitorReport', title: 'Visitor Report', visible: true, order: 0, size: 'medium', collapsed: false },
      { id: 'vehicleReport', title: 'Vehicle Report', visible: true, order: 1, size: 'medium', collapsed: false },
      { id: 'financialReport', title: 'Financial Report', visible: true, order: 2, size: 'medium', collapsed: false },
    ],
    columns: [],
    buttons: [
      { id: 'generateReport', label: 'Generate Report', visible: true, order: 0 },
      { id: 'exportPDF', label: 'Export PDF', visible: true, order: 1 },
    ],
    sections: [],
  },
});
