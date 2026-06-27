import type { Office, Visitor, Vehicle, Vendor, Staff, InventoryItem, UtilityTask, Complaint, DailyWorker, Apartment } from '@/types';

// Office/Company data for BRILEY ONE building
export const mockOffices: Office[] = [
  { id: '1', block: 'BRILEY ONE', floorNumber: '7th FLOOR', companyName: 'M2K ADVISORS', contactPerson: 'Mr. Kumar', contactPhone: '+91 98765 43210', allocatedVehicleCount: 5, usedVehicleCount: 3, status: 'Active' },
  { id: '2', block: 'BRILEY ONE', floorNumber: '8th FLOOR', companyName: 'M2K ADVISORS', contactPerson: 'Mr. Sharma', contactPhone: '+91 98765 43211', allocatedVehicleCount: 5, usedVehicleCount: 2, status: 'Active' },
  { id: '3', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'DFM', contactPerson: 'Ms. Priya', contactPhone: '+91 98765 43212', allocatedVehicleCount: 3, usedVehicleCount: 1, status: 'Active' },
  { id: '4', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'PILOT SECURITY', contactPerson: 'Mr. Rajan', contactPhone: '+91 98765 43213', allocatedVehicleCount: 4, usedVehicleCount: 4, status: 'Active' },
  { id: '5', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'NEW WAVE', contactPerson: 'Mr. Venkat', contactPhone: '+91 98765 43214', allocatedVehicleCount: 2, usedVehicleCount: 1, status: 'Active' },
  { id: '6', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'PSIS-HOUSE KEEPING', contactPerson: 'Ms. Lakshmi', contactPhone: '+91 98765 43215', allocatedVehicleCount: 2, usedVehicleCount: 2, status: 'Active' },
  { id: '7', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'VENBA-TECH', contactPerson: 'Mr. Arun', contactPhone: '+91 98765 43216', allocatedVehicleCount: 6, usedVehicleCount: 4, status: 'Active' },
  { id: '8', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'AL-L TECH', contactPerson: 'Mr. Suresh', contactPhone: '+91 98765 43217', allocatedVehicleCount: 3, usedVehicleCount: 2, status: 'Active' },
  { id: '9', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'MADHU ENGG', contactPerson: 'Mr. Madhu', contactPhone: '+91 98765 43218', allocatedVehicleCount: 4, usedVehicleCount: 3, status: 'Active' },
  { id: '10', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'SMK ENTERPRISES', contactPerson: 'Mr. Karthik', contactPhone: '+91 98765 43219', allocatedVehicleCount: 5, usedVehicleCount: 2, status: 'Active' },
  { id: '11', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'OTIS-LIFT', contactPerson: 'Mr. Ramesh', contactPhone: '+91 98765 43220', allocatedVehicleCount: 2, usedVehicleCount: 1, status: 'Active' },
  { id: '12', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'BUMITRAA LANDSCAPE', contactPerson: 'Ms. Meera', contactPhone: '+91 98765 43221', allocatedVehicleCount: 3, usedVehicleCount: 2, status: 'Active' },
  { id: '13', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'NFA-FIRE SYSTEM', contactPerson: 'Mr. Vijay', contactPhone: '+91 98765 43222', allocatedVehicleCount: 2, usedVehicleCount: 1, status: 'Active' },
  { id: '14', block: 'BRILEY ONE', floorNumber: '6th FLOOR', companyName: 'AXIS FINANCE', contactPerson: 'Mr. Deepak', contactPhone: '+91 98765 43223', allocatedVehicleCount: 8, usedVehicleCount: 5, status: 'Active' },
  { id: '15', block: 'BRILEY ONE', floorNumber: '3rd FLOOR', companyName: 'TALENT PRO', contactPerson: 'Ms. Anita', contactPhone: '+91 98765 43224', allocatedVehicleCount: 4, usedVehicleCount: 3, status: 'Active' },
];

// Legacy apartments data (for backward compatibility)
export const mockApartments: Apartment[] = mockOffices.map(office => ({
  id: office.id,
  unitNo: `${office.floorNumber}-${office.companyName.substring(0, 3)}`,
  floor: parseInt(office.floorNumber) || 1,
  block: office.block,
  type: 'Office',
  status: office.status === 'Active' ? 'Occupied' : 'Vacant',
  residentName: office.companyName,
  contact: office.contactPhone,
  ownerName: office.contactPerson,
  isOwnerResident: true,
  monthlyCharge: 50000,
  paymentStatus: 'Paid',
  lastPaid: '2026-05-01',
}));

const now = new Date();
const today = now.toISOString();
const yesterday = new Date(now.getTime() - 86400000).toISOString();
const twoDaysAgo = new Date(now.getTime() - 2 * 86400000).toISOString();

export const mockVisitors: Visitor[] = [
  { id: 'V001', name: 'R.NANTHAKUMAR', phone: '7397471669', gender: 'Male', address: 'PUDUPET', city: 'CHENNAI', pincode: '600002', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'PILOT SECURITY', whomToMeet: 'ADMIN DEPARTMENT', reason: 'SECURITY', vehicleType: 'NA', status: 'Inside', entryTime: new Date(now.getTime() - 3600000).toISOString(), guardName: 'Ramu' },
  { id: 'V002', name: 'K Gunasekaran [ ASO ]', phone: '9884844553', gender: 'Male', address: 'T.NAGAR', city: 'CHENNAI', pincode: '600017', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'M2K ADVISORS', whomToMeet: 'ADMIN DEPARTMENT', reason: 'Meeting', vehicleType: '2-Wheeler', vehicleNo: 'TN-01-AB-1234', status: 'Inside', entryTime: new Date(now.getTime() - 1800000).toISOString(), guardName: 'Shyam' },
  { id: 'V003', name: 'RAMAIAH', phone: '9080663059', gender: 'Male', address: 'ANNA NAGAR', city: 'CHENNAI', pincode: '600040', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'DFM', whomToMeet: 'ADMIN DEPARTMENT', reason: 'Delivery', vehicleType: '4-Wheeler', vehicleNo: 'TN-02-CD-5678', status: 'Inside', entryTime: new Date(now.getTime() - 7200000).toISOString(), guardName: 'Ramu' },
  { id: 'V004', name: 'MK .KANNAN', phone: '7339576318', gender: 'Male', address: 'VELACHERY', city: 'CHENNAI', pincode: '600042', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'VENBA-TECH', whomToMeet: 'ADMIN DEPARTMENT', reason: 'Interview', vehicleType: 'NA', status: 'Inside', entryTime: yesterday, guardName: 'Shyam' },
  { id: 'V005', name: 'KARUNAKARAN', phone: '9655522402', gender: 'Male', address: 'ADYAR', city: 'CHENNAI', pincode: '600020', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'AL-L TECH', whomToMeet: 'ADMIN DEPARTMENT', reason: 'Vendor Meeting', vehicleType: '2-Wheeler', vehicleNo: 'TN-03-EF-9012', status: 'Inside', entryTime: yesterday, guardName: 'Ramu' },
  { id: 'V006', name: 'VENU GOPAL', phone: '7299262347', gender: 'Male', address: 'MYLAPORE', city: 'CHENNAI', pincode: '600004', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'AXIS FINANCE', whomToMeet: 'ADMIN', reason: 'Document Submission', vehicleType: '4-Wheeler', vehicleNo: 'TN-04-GH-3456', status: 'Inside', entryTime: new Date(now.getTime() - 900000).toISOString(), guardName: 'Ramu' },
  { id: 'V007', name: 'M.MEGANATHAN', phone: '9941993991', gender: 'Male', address: 'GUINDY', city: 'CHENNAI', pincode: '600032', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'MADHU ENGG', whomToMeet: 'MAINTENANCE', reason: 'Service', vehicleType: 'NA', status: 'Exited', entryTime: twoDaysAgo, exitTime: new Date(now.getTime() - 172000000).toISOString(), duration: '3h 10m', guardName: 'Shyam' },
  { id: 'V008', name: 'Delivery - Swiggy', phone: '9000111222', gender: 'Male', block: 'BRILEY ONE', floorNumber: '6th FLOOR', companyName: 'AXIS FINANCE', whomToMeet: 'Reception', reason: 'Food Delivery', vehicleType: '2-Wheeler', vehicleNo: 'TN-05-IJ-7890', status: 'Exited', entryTime: new Date(now.getTime() - 5400000).toISOString(), exitTime: new Date(now.getTime() - 5100000).toISOString(), duration: '5m', guardName: 'Shyam' },
];

export const mockVehicles: Vehicle[] = [
  { id: 'VH001', vehicleNo: 'TN-01-AB-1234', vehicleType: '4-Wheeler', vehicleModel: 'Honda City', ownerName: 'Mr. Kumar', block: 'BRILEY ONE', floorNumber: '7th FLOOR', companyName: 'M2K ADVISORS', parkingUserType: 'Employee', entryTime: new Date(now.getTime() - 3600000).toISOString(), status: 'Inside' },
  { id: 'VH002', vehicleNo: 'TN-02-CD-5678', vehicleType: '2-Wheeler', vehicleModel: 'Honda Activa', ownerName: 'Delivery Agent', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'DFM', parkingUserType: 'Visitor', entryTime: new Date(now.getTime() - 1800000).toISOString(), status: 'Inside' },
  { id: 'VH003', vehicleNo: 'TN-03-EF-9012', vehicleType: '4-Wheeler', vehicleModel: 'Maruti Swift', ownerName: 'Ms. Priya', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'PILOT SECURITY', parkingUserType: 'Employee', entryTime: new Date(now.getTime() - 7200000).toISOString(), exitTime: new Date(now.getTime() - 3600000).toISOString(), status: 'Exited' },
  { id: 'VH004', vehicleNo: 'TN-04-GH-3456', vehicleType: '2-Wheeler', vehicleModel: 'TVS Jupiter', ownerName: 'Visitor', block: 'BRILEY ONE', floorNumber: '6th FLOOR', companyName: 'AXIS FINANCE', parkingUserType: 'Visitor', entryTime: new Date(now.getTime() - 3700000).toISOString(), status: 'Inside' },
  { id: 'VH005', vehicleNo: 'TN-05-IJ-7890', vehicleType: '4-Wheeler', vehicleModel: 'Hyundai i20', ownerName: 'Mr. Venkat', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'VENBA-TECH', parkingUserType: 'Employee', entryTime: new Date(now.getTime() - 5000000).toISOString(), status: 'Inside' },
  { id: 'VH006', vehicleNo: 'TN-06-KL-1234', vehicleType: '2-Wheeler', vehicleModel: 'Royal Enfield', ownerName: 'Mr. Arun', block: 'BRILEY ONE', floorNumber: '3rd FLOOR', companyName: 'TALENT PRO', parkingUserType: 'Employee', entryTime: new Date(now.getTime() - 6000000).toISOString(), status: 'Inside' },
  { id: 'VH007', vehicleNo: 'TN-07-MN-5678', vehicleType: '4-Wheeler', vehicleModel: 'Toyota Innova', ownerName: 'Vendor', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', companyName: 'OTIS-LIFT', parkingUserType: 'Vendor', entryTime: new Date(now.getTime() - 4000000).toISOString(), status: 'Inside' },
];

export const mockVendors: Vendor[] = [
  { id: 'VN001', name: 'Rajesh Plumbing', company: 'AquaFix Solutions', serviceType: 'Plumbing', category: 'Regular Maintenance', contact: '+91 98765 11111', lastVisit: '2026-05-05', nextVisit: '2026-06-05', status: 'Active' },
  { id: 'VN002', name: 'PowerTech Electricals', company: 'PowerTech Ltd', serviceType: 'Electrical', category: 'Regular Maintenance', contact: '+91 87654 22222', lastVisit: '2026-04-28', nextVisit: '2026-05-28', status: 'Active' },
  { id: 'VN003', name: 'BESCOM', company: 'BESCOM', serviceType: 'Electricity Provider', category: 'Utility Providers', contact: '1800-425-1912', lastVisit: '2026-05-01', status: 'Active' },
  { id: 'VN004', name: 'Chennai Metro Water', company: 'CMWSSB', serviceType: 'Water Provider', category: 'Utility Providers', contact: '1800-425-7171', lastVisit: '2026-05-01', status: 'Active' },
  { id: 'VN005', name: 'PSIS Housekeeping', company: 'PSIS Services', serviceType: 'Cleaning', category: 'Regular Maintenance', contact: '+91 76543 33333', lastVisit: '2026-05-08', nextVisit: '2026-05-15', status: 'Active' },
  { id: 'VN006', name: 'BUMITRAA Landscape', company: 'BUMITRAA', serviceType: 'Gardening', category: 'Regular Maintenance', contact: '+91 65432 44444', lastVisit: '2026-04-15', status: 'Active' },
  { id: 'VN007', name: 'PestAway Solutions', company: 'PestAway', serviceType: 'Pest Control', category: 'Ad-Hoc Vendors', contact: '+91 54321 55555', lastVisit: '2026-03-20', nextVisit: '2026-06-20', status: 'Active' },
  { id: 'VN008', name: 'OTIS Lift', company: 'OTIS', serviceType: 'Lift Maintenance', category: 'Regular Maintenance', contact: '+91 43210 66666', lastVisit: '2026-05-03', nextVisit: '2026-06-03', status: 'Active' },
  { id: 'VN009', name: 'Voltas AC Service', company: 'Voltas', serviceType: 'HVAC Maintenance', category: 'Regular Maintenance', contact: '+91 32109 77777', lastVisit: '2026-04-10', status: 'Active' },
  { id: 'VN010', name: 'NFA Fire Systems', company: 'NFA', serviceType: 'Fire Safety', category: 'Regular Maintenance', contact: '+91 21098 88888', lastVisit: '2026-05-07', nextVisit: '2026-06-07', status: 'Active' },
  { id: 'VN011', name: 'ACT Fibernet', company: 'ACT', serviceType: 'Internet Provider', category: 'Utility Providers', contact: '+91 44 4000 4000', lastVisit: '2026-05-01', status: 'Active' },
  { id: 'VN012', name: 'CCTV Maintenance', company: 'SecureTech', serviceType: 'CCTV Maintenance', category: 'Regular Maintenance', contact: '+91 98765 99999', lastVisit: '2026-05-10', nextVisit: '2026-06-10', status: 'Active' },
];

export const mockStaff: Staff[] = [
  { id: 'S001', name: 'Ramu Kumar', role: 'Security', department: 'Security', contact: '+91 11111 22222', joinDate: '2024-01-15', attendance: { '2026-05-10': 'P', '2026-05-09': 'P', '2026-05-08': 'A', '2026-05-07': 'P', '2026-05-06': 'H' } },
  { id: 'S002', name: 'Shyam Prasad', role: 'Security', department: 'Security', contact: '+91 22222 33333', joinDate: '2024-02-01', attendance: { '2026-05-10': 'P', '2026-05-09': 'H', '2026-05-08': 'P', '2026-05-07': 'P', '2026-05-06': 'P' } },
  { id: 'S003', name: 'Lakshmi Bai', role: 'Housekeeping', department: 'Housekeeping', contact: '+91 33333 44444', joinDate: '2024-03-10', attendance: { '2026-05-10': 'P', '2026-05-09': 'P', '2026-05-08': 'P', '2026-05-07': 'A', '2026-05-06': 'P' } },
  { id: 'S004', name: 'Mohan Das', role: 'Housekeeping', department: 'Housekeeping', contact: '+91 44444 55555', joinDate: '2024-01-20', attendance: { '2026-05-10': 'A', '2026-05-09': 'P', '2026-05-08': 'P', '2026-05-07': 'P', '2026-05-06': 'P' } },
  { id: 'S005', name: 'Venkat Swamy', role: 'Electrician', department: 'Maintenance', contact: '+91 55555 66666', joinDate: '2023-11-05', attendance: { '2026-05-10': 'P', '2026-05-09': 'P', '2026-05-08': 'P', '2026-05-07': 'H', '2026-05-06': 'P' } },
  { id: 'S006', name: 'Suresh Kumar', role: 'Plumber', department: 'Maintenance', contact: '+91 66666 77777', joinDate: '2023-12-15', attendance: { '2026-05-10': 'P', '2026-05-09': 'A', '2026-05-08': 'P', '2026-05-07': 'P', '2026-05-06': 'P' } },
  { id: 'S007', name: 'Ganga Devi', role: 'Housekeeping', department: 'Housekeeping', contact: '+91 77777 88888', joinDate: '2024-04-01', attendance: { '2026-05-10': 'P', '2026-05-09': 'P', '2026-05-08': 'H', '2026-05-07': 'P', '2026-05-06': 'A' } },
  { id: 'S008', name: 'Ravi Shankar', role: 'Gardener', department: 'Maintenance', contact: '+91 88888 99999', joinDate: '2024-02-14', attendance: { '2026-05-10': 'H', '2026-05-09': 'P', '2026-05-08': 'P', '2026-05-07': 'P', '2026-05-06': 'P' } },
  { id: 'S009', name: 'Priya Receptionist', role: 'Receptionist', department: 'Admin', contact: '+91 99999 00000', joinDate: '2024-01-01', attendance: { '2026-05-10': 'P', '2026-05-09': 'P', '2026-05-08': 'P', '2026-05-07': 'P', '2026-05-06': 'P' } },
];

export const mockInventory: InventoryItem[] = [
  { id: 'I001', itemName: 'LED Bulbs (10W)', category: 'Electrical', quantity: 50, unitCost: 120, totalCost: 6000, vendor: 'PowerTech Ltd', date: '2026-05-01', usedQuantity: 15, location: 'Common Area', usedBy: 'Venkat Swamy' },
  { id: 'I002', itemName: 'PVC Pipes (1 inch)', category: 'Plumbing', quantity: 20, unitCost: 250, totalCost: 5000, vendor: 'AquaFix Solutions', date: '2026-05-02', usedQuantity: 8, location: 'Building Basement', usedBy: 'Suresh Kumar' },
  { id: 'I003', itemName: 'Floor Cleaner (5L)', category: 'Cleaning', quantity: 10, unitCost: 450, totalCost: 4500, vendor: 'PSIS Services', date: '2026-05-03', usedQuantity: 3, location: 'All Floors', usedBy: 'Lakshmi Bai' },
  { id: 'I004', itemName: 'MCB Switch 32A', category: 'Electrical', quantity: 10, unitCost: 350, totalCost: 3500, vendor: 'PowerTech Ltd', date: '2026-05-04', usedQuantity: 2, location: '7th Floor', usedBy: 'Venkat Swamy' },
  { id: 'I005', itemName: 'Fire Extinguisher (5kg)', category: 'Safety', quantity: 5, unitCost: 2500, totalCost: 12500, vendor: 'NFA', date: '2026-05-05', usedQuantity: 0, location: 'All Floors', usedBy: 'Building Admin' },
  { id: 'I006', itemName: 'CCTV Camera', category: 'Safety', quantity: 4, unitCost: 3500, totalCost: 14000, vendor: 'SecureTech', date: '2026-04-20', usedQuantity: 4, location: 'Parking & Lobby', usedBy: 'Security Team' },
  { id: 'I007', itemName: 'AC Filter', category: 'General', quantity: 20, unitCost: 800, totalCost: 16000, vendor: 'Voltas', date: '2026-04-25', usedQuantity: 8, location: 'All Offices', usedBy: 'Maintenance Team' },
  { id: 'I008', itemName: 'Mop and Bucket Sets', category: 'Cleaning', quantity: 6, unitCost: 500, totalCost: 3000, vendor: 'PSIS Services', date: '2026-05-06', usedQuantity: 6, location: 'All Floors', usedBy: 'Housekeeping Team' },
];

export const mockUtilityTasks: UtilityTask[] = [
  { id: 'U001', description: 'Water tank cleaning', type: 'Sump Cleaning', scheduledDate: '2026-05-15', lastCompleted: '2026-04-15', status: 'Upcoming', assignedStaff: 'Suresh Kumar', notes: 'Use chlorine treatment after cleaning' },
  { id: 'U002', description: 'Basement drainage inspection', type: 'Drainage', scheduledDate: '2026-05-08', lastCompleted: '2026-04-08', status: 'Overdue', assignedStaff: 'Suresh Kumar', notes: 'Check for blockages' },
  { id: 'U003', description: 'Monthly lift maintenance', type: 'Lift', scheduledDate: '2026-05-10', lastCompleted: '2026-04-10', status: 'Upcoming', assignedStaff: 'OTIS Team', notes: 'Annual safety certificate renewal pending' },
  { id: 'U004', description: 'Electrical panel inspection', type: 'Electrical', scheduledDate: '2026-05-20', lastCompleted: '2026-04-20', status: 'Upcoming', assignedStaff: 'Venkat Swamy' },
  { id: 'U005', description: 'Quarterly pest control', type: 'Pest Control', scheduledDate: '2026-06-20', lastCompleted: '2026-03-20', status: 'Upcoming', assignedStaff: 'PestAway Team', notes: 'All offices must be informed' },
  { id: 'U006', description: 'Fire safety equipment check', type: 'Fire Safety', scheduledDate: '2026-05-05', lastCompleted: '2026-02-05', status: 'Done', assignedStaff: 'NFA Team', notes: 'All fire extinguishers checked' },
  { id: 'U007', description: 'HVAC system maintenance', type: 'HVAC', scheduledDate: '2026-05-25', lastCompleted: '2026-04-25', status: 'Upcoming', assignedStaff: 'Voltas Team' },
];

export const mockComplaints: Complaint[] = [
  { id: 'C001', companyName: 'M2K ADVISORS', block: 'BRILEY ONE', floorNumber: '7th FLOOR', contactPerson: 'Mr. Kumar', category: 'Plumbing', description: 'Leaking tap in washroom', priority: 'Medium', status: 'In Progress', createdAt: '2026-05-08', updatedAt: '2026-05-09', assignedTo: 'Suresh Kumar' },
  { id: 'C002', companyName: 'VENBA-TECH', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', contactPerson: 'Mr. Arun', category: 'Electrical', description: 'Power fluctuation in server room', priority: 'High', status: 'Assigned', createdAt: '2026-05-09', updatedAt: '2026-05-09', assignedTo: 'Venkat Swamy' },
  { id: 'C003', companyName: 'AXIS FINANCE', block: 'BRILEY ONE', floorNumber: '6th FLOOR', contactPerson: 'Mr. Deepak', category: 'HVAC', description: 'AC not cooling properly', priority: 'Medium', status: 'Open', createdAt: '2026-05-10', updatedAt: '2026-05-10' },
  { id: 'C004', companyName: 'TALENT PRO', block: 'BRILEY ONE', floorNumber: '3rd FLOOR', contactPerson: 'Ms. Anita', category: 'Lift', description: 'Lift making unusual noise', priority: 'High', status: 'Resolved', createdAt: '2026-05-05', updatedAt: '2026-05-07', assignedTo: 'OTIS Team' },
  { id: 'C005', companyName: 'AL-L TECH', block: 'BRILEY ONE', floorNumber: 'BRILEY ONE', contactPerson: 'Mr. Suresh', category: 'Internet', description: 'Slow internet connectivity', priority: 'Low', status: 'Open', createdAt: '2026-05-10', updatedAt: '2026-05-10' },
];

export const mockDailyWorkers: DailyWorker[] = [
  { id: 'DW001', name: 'Savitha', role: 'Cleaner', assignedTo: 'Building', block: 'BRILEY ONE', phone: '+91 91111 11111', allowedTimings: '7:00 AM - 10:00 AM', validFrom: '2026-01-01', validUntil: '2026-12-31', status: 'Active', lastEntry: today },
  { id: 'DW002', name: 'Kamala', role: 'Cleaner', assignedTo: 'Building', block: 'BRILEY ONE', phone: '+91 92222 22222', allowedTimings: '6:00 AM - 8:00 AM', validFrom: '2026-02-01', validUntil: '2026-12-31', status: 'Active', lastEntry: today },
  { id: 'DW003', name: 'Raju', role: 'Security', assignedTo: 'Building', block: 'BRILEY ONE', phone: '+91 93333 33333', allowedTimings: '6:00 AM - 6:00 PM', validFrom: '2026-01-01', validUntil: '2026-12-31', status: 'Active', lastEntry: today },
  { id: 'DW004', name: 'Murugan', role: 'Electrician', assignedTo: 'Building', block: 'BRILEY ONE', phone: '+91 94444 44444', allowedTimings: '9:00 AM - 6:00 PM', validFrom: '2026-01-01', validUntil: '2026-12-31', status: 'Active', lastEntry: today },
  { id: 'DW005', name: 'Krishnan', role: 'Driver', assignedTo: 'M2K ADVISORS', block: 'BRILEY ONE', floorNumber: '7th FLOOR', phone: '+91 95555 55555', allowedTimings: '8:00 AM - 8:00 PM', validFrom: '2026-03-01', validUntil: '2026-12-31', status: 'Active', lastEntry: yesterday },
  { id: 'DW006', name: 'Lakshmi', role: 'Cleaner', assignedTo: 'AXIS FINANCE', block: 'BRILEY ONE', floorNumber: '6th FLOOR', phone: '+91 96666 66666', allowedTimings: '8:00 AM - 11:00 AM', validFrom: '2026-01-15', validUntil: '2026-12-31', status: 'Active', lastEntry: today },
];

export interface EmergencyContact {
  id: string;
  name: string;
  category: 'Medical' | 'Fire' | 'Police' | 'Utility' | 'Building';
  phone: string;
  available: string;
}

export const mockEmergencyContacts: EmergencyContact[] = [
  { id: 'E001', name: 'Ambulance', category: 'Medical', phone: '108', available: '24/7' },
  { id: 'E002', name: 'Fire Service', category: 'Fire', phone: '101', available: '24/7' },
  { id: 'E003', name: 'Police', category: 'Police', phone: '100', available: '24/7' },
  { id: 'E004', name: 'Apollo Hospital', category: 'Medical', phone: '+91 44 2829 3333', available: '24/7' },
  { id: 'E005', name: 'OTIS Lift Emergency', category: 'Building', phone: '+91 1800 102 6847', available: '24/7' },
  { id: 'E006', name: 'Building Electrician', category: 'Utility', phone: '+91 55555 66666', available: '9 AM - 6 PM' },
  { id: 'E007', name: 'Building Plumber', category: 'Utility', phone: '+91 66666 77777', available: '9 AM - 6 PM' },
  { id: 'E008', name: 'Security Office', category: 'Building', phone: '+91 11111 22222', available: '24/7' },
  { id: 'E009', name: 'Building Manager', category: 'Building', phone: '+91 98765 00001', available: '9 AM - 6 PM' },
];

export const visitorTrendData = [
  { day: 'Mon', visitors: 45 },
  { day: 'Tue', visitors: 52 },
  { day: 'Wed', visitors: 48 },
  { day: 'Thu', visitors: 61 },
  { day: 'Fri', visitors: 55 },
  { day: 'Sat', visitors: 28 },
  { day: 'Sun', visitors: 15 },
];

export const occupancyData = [
  { name: 'Active Offices', value: 14, color: '#22C55E' },
  { name: 'Vacant', value: 1, color: '#EF4444' },
];

export const financialTrendData = [
  { month: 'Dec', collected: 420000, pending: 80000 },
  { month: 'Jan', collected: 450000, pending: 50000 },
  { month: 'Feb', collected: 380000, pending: 120000 },
  { month: 'Mar', collected: 470000, pending: 30000 },
  { month: 'Apr', collected: 430000, pending: 70000 },
  { month: 'May', collected: 350000, pending: 150000 },
];