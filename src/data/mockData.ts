import type { Apartment, Visitor, Vehicle, Vendor, Staff, InventoryItem, UtilityTask, Complaint, DailyWorker } from '@/types';

export const mockApartments: Apartment[] = [
  { id: '1', unitNo: 'A-101', floor: 1, block: 'A', type: '2BHK', status: 'Occupied', residentName: 'Rajesh Kumar', contact: '+91 98765 43210', email: 'rajesh@example.com', ownerName: 'Rajesh Kumar', isOwnerResident: true, monthlyCharge: 3500, paymentStatus: 'Paid', lastPaid: '2026-05-01' },
  { id: '2', unitNo: 'A-102', floor: 1, block: 'A', type: '2BHK', status: 'Occupied', residentName: 'Priya Sharma', contact: '+91 87654 32109', email: 'priya@example.com', ownerName: 'Anil Sharma', isOwnerResident: false, monthlyCharge: 3500, paymentStatus: 'Pending', lastPaid: '2026-04-01' },
  { id: '3', unitNo: 'A-201', floor: 2, block: 'A', type: '3BHK', status: 'Occupied', residentName: 'Suresh Patel', contact: '+91 76543 21098', email: 'suresh@example.com', ownerName: 'Suresh Patel', isOwnerResident: true, monthlyCharge: 5000, paymentStatus: 'Paid', lastPaid: '2026-05-02' },
  { id: '4', unitNo: 'A-202', floor: 2, block: 'A', type: '1BHK', status: 'Vacant', monthlyCharge: 2500, paymentStatus: 'Pending' },
  { id: '5', unitNo: 'B-101', floor: 1, block: 'B', type: '2BHK', status: 'Occupied', residentName: 'Meera Nair', contact: '+91 65432 10987', email: 'meera@example.com', ownerName: 'Meera Nair', isOwnerResident: true, monthlyCharge: 3500, paymentStatus: 'Overdue', lastPaid: '2026-03-01' },
  { id: '6', unitNo: 'B-102', floor: 1, block: 'B', type: '2BHK', status: 'Occupied', residentName: 'Vikram Singh', contact: '+91 54321 09876', email: 'vikram@example.com', ownerName: 'Vikram Singh', isOwnerResident: true, monthlyCharge: 3500, paymentStatus: 'Paid', lastPaid: '2026-05-03' },
  { id: '7', unitNo: 'B-201', floor: 2, block: 'B', type: '3BHK', status: 'Occupied', residentName: 'Anita Gupta', contact: '+91 43210 98765', email: 'anita@example.com', ownerName: 'Ramesh Gupta', isOwnerResident: false, monthlyCharge: 5000, paymentStatus: 'Paid', lastPaid: '2026-05-01' },
  { id: '8', unitNo: 'B-202', floor: 2, block: 'B', type: '1BHK', status: 'Vacant', monthlyCharge: 2500, paymentStatus: 'Pending' },
  { id: '9', unitNo: 'C-101', floor: 1, block: 'C', type: '2BHK', status: 'Occupied', residentName: 'Deepak Joshi', contact: '+91 32109 87654', email: 'deepak@example.com', ownerName: 'Deepak Joshi', isOwnerResident: true, monthlyCharge: 3500, paymentStatus: 'Paid', lastPaid: '2026-05-04' },
  { id: '10', unitNo: 'C-102', floor: 1, block: 'C', type: 'Studio', status: 'Vacant', monthlyCharge: 2000, paymentStatus: 'Pending' },
  { id: '11', unitNo: 'C-201', floor: 2, block: 'C', type: '2BHK', status: 'Occupied', residentName: 'Kavitha Reddy', contact: '+91 21098 76543', email: 'kavitha@example.com', ownerName: 'Kavitha Reddy', isOwnerResident: true, monthlyCharge: 3500, paymentStatus: 'Pending', lastPaid: '2026-04-02' },
  { id: '12', unitNo: 'C-202', floor: 2, block: 'C', type: '3BHK', status: 'Occupied', residentName: 'Rajan Iyer', contact: '+91 10987 65432', email: 'rajan@example.com', ownerName: 'Rajan Iyer', isOwnerResident: true, monthlyCharge: 5000, paymentStatus: 'Paid', lastPaid: '2026-05-05' },
  { id: '13', unitNo: 'D-101', floor: 1, block: 'D', type: '2BHK', status: 'Occupied', residentName: 'Sonia Das', contact: '+91 98761 23456', email: 'sonia@example.com', ownerName: 'Biswas Das', isOwnerResident: false, monthlyCharge: 3500, paymentStatus: 'Overdue', lastPaid: '2026-02-01' },
  { id: '14', unitNo: 'D-102', floor: 1, block: 'D', type: '1BHK', status: 'Occupied', residentName: 'Arjun Mehta', contact: '+91 87652 34567', email: 'arjun@example.com', ownerName: 'Arjun Mehta', isOwnerResident: true, monthlyCharge: 2500, paymentStatus: 'Paid', lastPaid: '2026-05-06' },
  { id: '15', unitNo: 'D-201', floor: 2, block: 'D', type: '3BHK', status: 'Vacant', monthlyCharge: 5000, paymentStatus: 'Pending' },
];

const now = new Date();
const today = now.toISOString();
const yesterday = new Date(now.getTime() - 86400000).toISOString();
const twoDaysAgo = new Date(now.getTime() - 2 * 86400000).toISOString();

export const mockVisitors: Visitor[] = [
  { id: 'V001', name: 'Arun Krishnan', phone: '+91 99887 76655', apartmentNo: 'A-101', purpose: 'Personal Visit', category: 'Guest', status: 'Inside', entryTime: new Date(now.getTime() - 3600000).toISOString(), guardName: 'Ramu', otp: '123456' },
  { id: 'V002', name: 'Sneha Pillai', phone: '+91 88776 65544', apartmentNo: 'B-101', purpose: 'Delivery', category: 'Delivery', status: 'Inside', entryTime: new Date(now.getTime() - 1800000).toISOString(), guardName: 'Shyam', otp: '654321' },
  { id: 'V003', name: 'Ravi Varma', phone: '+91 77665 54433', apartmentNo: 'A-201', purpose: 'Plumbing Work', category: 'Worker', status: 'Inside', entryTime: new Date(now.getTime() - 7200000).toISOString(), guardName: 'Ramu', otp: '789012' },
  { id: 'V004', name: 'Lakshmi Devi', phone: '+91 66554 43322', apartmentNo: 'C-101', purpose: 'Personal Visit', category: 'Guest', status: 'Exited', entryTime: yesterday, exitTime: new Date(now.getTime() - 79200000).toISOString(), duration: '2h 15m', guardName: 'Shyam' },
  { id: 'V005', name: 'Mohan Rao', phone: '+91 55443 32211', apartmentNo: 'B-202', purpose: 'Electricity Repair', category: 'Vendor', status: 'Exited', entryTime: yesterday, exitTime: new Date(now.getTime() - 86000000).toISOString(), duration: '1h 30m', guardName: 'Ramu' },
  { id: 'V006', name: 'Pooja Menon', phone: '+91 44332 21100', apartmentNo: 'A-102', purpose: 'Personal Visit', category: 'Guest', status: 'Inside', entryTime: new Date(now.getTime() - 900000).toISOString(), guardName: 'Ramu', otp: '345678' },
  { id: 'V007', name: 'Zomato Delivery', phone: '+91 90001 11111', apartmentNo: 'D-102', purpose: 'Food Delivery', category: 'Delivery', status: 'Exited', entryTime: new Date(now.getTime() - 5400000).toISOString(), exitTime: new Date(now.getTime() - 5100000).toISOString(), duration: '5m', guardName: 'Shyam' },
  { id: 'V008', name: 'Amit Bose', phone: '+91 79990 88877', apartmentNo: 'C-201', purpose: 'Personal Visit', category: 'Guest', status: 'Exited', entryTime: twoDaysAgo, exitTime: new Date(now.getTime() - 172000000).toISOString(), duration: '3h 10m', guardName: 'Ramu' },
  { id: 'V009', name: 'Amazon Courier', phone: '+91 80002 22222', apartmentNo: 'B-101', purpose: 'Package Delivery', category: 'Delivery', status: 'Inside', entryTime: new Date(now.getTime() - 600000).toISOString(), guardName: 'Shyam', otp: '901234' },
  { id: 'V010', name: 'Suresh Painter', phone: '+91 70003 33333', apartmentNo: 'A-201', purpose: 'Painting Work', category: 'Worker', status: 'Exited', entryTime: twoDaysAgo, exitTime: new Date(now.getTime() - 258000000).toISOString(), duration: '6h 45m', guardName: 'Ramu' },
];

export const mockVehicles: Vehicle[] = [
  { id: 'VH001', vehicleNo: 'KA-01-AB-1234', type: '4-Wheeler', ownerName: 'Rajesh Kumar', apartmentNo: 'A-101', entryTime: new Date(now.getTime() - 3600000).toISOString(), status: 'Inside' },
  { id: 'VH002', vehicleNo: 'KA-02-CD-5678', type: '2-Wheeler', ownerName: 'Delivery Agent', apartmentNo: 'B-101', entryTime: new Date(now.getTime() - 1800000).toISOString(), status: 'Inside' },
  { id: 'VH003', vehicleNo: 'KA-03-EF-9012', type: '4-Wheeler', ownerName: 'Meera Nair', apartmentNo: 'B-101', entryTime: new Date(now.getTime() - 7200000).toISOString(), exitTime: new Date(now.getTime() - 3600000).toISOString(), status: 'Exited' },
  { id: 'VH004', vehicleNo: 'KA-04-GH-3456', type: '2-Wheeler', ownerName: 'Arun Krishnan', apartmentNo: 'A-101', entryTime: new Date(now.getTime() - 3700000).toISOString(), status: 'Inside' },
];

export const mockVendors: Vendor[] = [
  { id: 'VN001', name: 'Rajesh Plumbing', company: 'AquaFix Solutions', serviceType: 'Plumbing', category: 'Regular Maintenance', contact: '+91 98765 11111', lastVisit: '2026-05-05', nextVisit: '2026-06-05', status: 'Active' },
  { id: 'VN002', name: 'PowerTech Electricals', company: 'PowerTech Ltd', serviceType: 'Electrical', category: 'Regular Maintenance', contact: '+91 87654 22222', lastVisit: '2026-04-28', nextVisit: '2026-05-28', status: 'Active' },
  { id: 'VN003', name: 'BESCOM', company: 'BESCOM', serviceType: 'Electricity Provider', category: 'Utility Providers', contact: '1800-425-1912', lastVisit: '2026-05-01', status: 'Active' },
  { id: 'VN004', name: 'BWSSB', company: 'BWSSB', serviceType: 'Water Provider', category: 'Utility Providers', contact: '1800-425-7171', lastVisit: '2026-05-01', status: 'Active' },
  { id: 'VN005', name: 'CleanSweep Services', company: 'CleanSweep Pvt Ltd', serviceType: 'Cleaning', category: 'Regular Maintenance', contact: '+91 76543 33333', lastVisit: '2026-05-08', nextVisit: '2026-05-15', status: 'Active' },
  { id: 'VN006', name: 'GreenThumb Landscaping', company: 'GreenThumb', serviceType: 'Gardening', category: 'Ad-Hoc Vendors', contact: '+91 65432 44444', lastVisit: '2026-04-15', status: 'Inactive' },
  { id: 'VN007', name: 'PestAway Solutions', company: 'PestAway', serviceType: 'Pest Control', category: 'Ad-Hoc Vendors', contact: '+91 54321 55555', lastVisit: '2026-03-20', nextVisit: '2026-06-20', status: 'Active' },
  { id: 'VN008', name: 'LiftMaster Tech', company: 'LiftMaster', serviceType: 'Lift Maintenance', category: 'Regular Maintenance', contact: '+91 43210 66666', lastVisit: '2026-05-03', nextVisit: '2026-06-03', status: 'Active' },
  { id: 'VN009', name: 'ACool Services', company: 'ACool', serviceType: 'AC Maintenance', category: 'Ad-Hoc Vendors', contact: '+91 32109 77777', lastVisit: '2026-04-10', status: 'Active' },
  { id: 'VN010', name: 'SafeGuard Security', company: 'SafeGuard', serviceType: 'Security Equipment', category: 'Regular Maintenance', contact: '+91 21098 88888', lastVisit: '2026-05-07', nextVisit: '2026-06-07', status: 'Active' },
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
];

export const mockInventory: InventoryItem[] = [
  { id: 'I001', itemName: 'LED Bulbs (10W)', category: 'Electrical', quantity: 50, unitCost: 120, totalCost: 6000, vendor: 'PowerTech Ltd', date: '2026-05-01', usedQuantity: 15, location: 'Common Area', usedBy: 'Venkat Swamy' },
  { id: 'I002', itemName: 'PVC Pipes (1 inch)', category: 'Plumbing', quantity: 20, unitCost: 250, totalCost: 5000, vendor: 'AquaFix Solutions', date: '2026-05-02', usedQuantity: 8, location: 'Block A', usedBy: 'Suresh Kumar' },
  { id: 'I003', itemName: 'Floor Cleaner (5L)', category: 'Cleaning', quantity: 10, unitCost: 450, totalCost: 4500, vendor: 'CleanSweep Pvt Ltd', date: '2026-05-03', usedQuantity: 3, location: 'Common Area', usedBy: 'Lakshmi Bai' },
  { id: 'I004', itemName: 'MCB Switch 32A', category: 'Electrical', quantity: 10, unitCost: 350, totalCost: 3500, vendor: 'PowerTech Ltd', date: '2026-05-04', usedQuantity: 2, location: 'Block B', usedBy: 'Venkat Swamy' },
  { id: 'I005', itemName: 'Garden Hose (15m)', category: 'General', quantity: 3, unitCost: 800, totalCost: 2400, vendor: 'GreenThumb', date: '2026-05-05', usedQuantity: 1, location: 'Garden Area', usedBy: 'Ravi Shankar' },
  { id: 'I006', itemName: 'Pest Control Chemicals', category: 'Safety', quantity: 5, unitCost: 600, totalCost: 3000, vendor: 'PestAway', date: '2026-04-20', usedQuantity: 5, location: 'All Blocks', usedBy: 'PestAway Team' },
  { id: 'I007', itemName: 'Door Locks', category: 'Safety', quantity: 8, unitCost: 1200, totalCost: 9600, vendor: 'SafeGuard', date: '2026-04-25', usedQuantity: 3, location: 'Block C', usedBy: 'Venkat Swamy' },
  { id: 'I008', itemName: 'Mop and Bucket Sets', category: 'Cleaning', quantity: 6, unitCost: 500, totalCost: 3000, vendor: 'CleanSweep Pvt Ltd', date: '2026-05-06', usedQuantity: 6, location: 'All Floors', usedBy: 'Housekeeping Team' },
  { id: 'I009', itemName: 'Extension Cords', category: 'Electrical', quantity: 15, unitCost: 300, totalCost: 4500, vendor: 'PowerTech Ltd', date: '2026-05-07', usedQuantity: 5, location: 'Common Area', usedBy: 'Venkat Swamy' },
  { id: 'I010', itemName: 'Water Pump Seals', category: 'Plumbing', quantity: 20, unitCost: 150, totalCost: 3000, vendor: 'AquaFix Solutions', date: '2026-05-08', usedQuantity: 4, location: 'Sump Area', usedBy: 'Suresh Kumar' },
];

export const mockUtilityTasks: UtilityTask[] = [
  { id: 'U001', description: 'Main sump tank cleaning', type: 'Sump Cleaning', scheduledDate: '2026-05-15', lastCompleted: '2026-04-15', status: 'Upcoming', assignedStaff: 'Suresh Kumar', notes: 'Use chlorine treatment after cleaning' },
  { id: 'U002', description: 'Block A drainage inspection', type: 'Drainage', scheduledDate: '2026-05-08', lastCompleted: '2026-04-08', status: 'Overdue', assignedStaff: 'Suresh Kumar', notes: 'Check for blockages near kitchen outlets' },
  { id: 'U003', description: 'Monthly lift maintenance check', type: 'Lift', scheduledDate: '2026-05-10', lastCompleted: '2026-04-10', status: 'Upcoming', assignedStaff: 'LiftMaster Tech', notes: 'Annual safety certificate renewal pending' },
  { id: 'U004', description: 'Electrical panel inspection', type: 'Electrical', scheduledDate: '2026-05-20', lastCompleted: '2026-04-20', status: 'Upcoming', assignedStaff: 'Venkat Swamy' },
  { id: 'U005', description: 'Quarterly pest control treatment', type: 'Pest Control', scheduledDate: '2026-06-20', lastCompleted: '2026-03-20', status: 'Upcoming', assignedStaff: 'PestAway Team', notes: 'All residents must vacate common areas during treatment' },
  { id: 'U006', description: 'Fire safety equipment check', type: 'Fire Safety', scheduledDate: '2026-05-05', lastCompleted: '2026-02-05', status: 'Done', assignedStaff: 'Venkat Swamy', notes: 'All fire extinguishers replaced, emergency exits cleared' },
  { id: 'U007', description: 'Block B drainage cleaning', type: 'Drainage', scheduledDate: '2026-05-12', lastCompleted: '2026-04-12', status: 'Upcoming', assignedStaff: 'Suresh Kumar' },
  { id: 'U008', description: 'Overhead tank inspection', type: 'Sump Cleaning', scheduledDate: '2026-05-25', lastCompleted: '2026-04-25', status: 'Upcoming', assignedStaff: 'Suresh Kumar', notes: 'Check float valve operation' },
];

export const mockComplaints: Complaint[] = [
  { id: 'C001', residentName: 'Rajesh Kumar', apartmentNo: 'A-101', category: 'Plumbing', description: 'Leaking tap in bathroom', priority: 'Medium', status: 'In Progress', createdAt: '2026-05-08', updatedAt: '2026-05-09', assignedTo: 'Suresh Kumar' },
  { id: 'C002', residentName: 'Meera Nair', apartmentNo: 'B-101', category: 'Electrical', description: 'Power fluctuation in kitchen', priority: 'High', status: 'Assigned', createdAt: '2026-05-09', updatedAt: '2026-05-09', assignedTo: 'Venkat Swamy' },
  { id: 'C003', residentName: 'Priya Sharma', apartmentNo: 'A-102', category: 'Cleaning', description: 'Common corridor not cleaned for 3 days', priority: 'Low', status: 'Open', createdAt: '2026-05-10', updatedAt: '2026-05-10' },
  { id: 'C004', residentName: 'Suresh Patel', apartmentNo: 'A-201', category: 'Lift', description: 'Lift making unusual noise', priority: 'High', status: 'Resolved', createdAt: '2026-05-05', updatedAt: '2026-05-07', assignedTo: 'LiftMaster Tech' },
  { id: 'C005', residentName: 'Kavitha Reddy', apartmentNo: 'C-201', category: 'Internet', description: 'Slow internet in evenings', priority: 'Low', status: 'Open', createdAt: '2026-05-10', updatedAt: '2026-05-10' },
];

export const mockDailyWorkers: DailyWorker[] = [
  { id: 'DW001', name: 'Savitha', role: 'Maid', apartmentNo: 'A-101', residentName: 'Rajesh Kumar', phone: '+91 91111 11111', allowedTimings: '7:00 AM - 10:00 AM', validFrom: '2026-01-01', validUntil: '2026-12-31', status: 'Active', lastEntry: today },
  { id: 'DW002', name: 'Kamala', role: 'Cook', apartmentNo: 'B-101', residentName: 'Meera Nair', phone: '+91 92222 22222', allowedTimings: '6:00 AM - 8:00 AM', validFrom: '2026-02-01', validUntil: '2026-12-31', status: 'Active', lastEntry: today },
  { id: 'DW003', name: 'Raju Milk', role: 'Milkman', apartmentNo: 'All', residentName: 'Multiple', phone: '+91 93333 33333', allowedTimings: '5:30 AM - 7:00 AM', validFrom: '2026-01-01', validUntil: '2026-12-31', status: 'Active', lastEntry: today },
  { id: 'DW004', name: 'Paper Ravi', role: 'Newspaper', apartmentNo: 'All', residentName: 'Multiple', phone: '+91 94444 44444', allowedTimings: '5:00 AM - 6:30 AM', validFrom: '2026-01-01', validUntil: '2026-12-31', status: 'Active', lastEntry: today },
  { id: 'DW005', name: 'Auto Driver Krishnan', role: 'Driver', apartmentNo: 'C-101', residentName: 'Deepak Joshi', phone: '+91 95555 55555', allowedTimings: '8:00 AM - 9:00 AM', validFrom: '2026-03-01', validUntil: '2026-12-31', status: 'Paused' },
  { id: 'DW006', name: 'Lakshmi', role: 'Maid', apartmentNo: 'A-102', residentName: 'Priya Sharma', phone: '+91 96666 66666', allowedTimings: '8:00 AM - 11:00 AM', validFrom: '2026-01-15', validUntil: '2026-12-31', status: 'Active', lastEntry: today },
  { id: 'DW007', name: 'Venkat', role: 'Cook', apartmentNo: 'A-102', residentName: 'Priya Sharma', phone: '+91 97777 77777', allowedTimings: '6:30 AM - 8:30 AM', validFrom: '2026-02-01', validUntil: '2026-12-31', status: 'Active', lastEntry: yesterday },
];

export interface EmergencyContact {
  id: string;
  name: string;
  category: 'Medical' | 'Fire' | 'Police' | 'Utility' | 'Building';
  phone: string;
  available: string;
  icon?: string;
}

export const mockEmergencyContacts: EmergencyContact[] = [
  { id: 'E001', name: 'Ambulance', category: 'Medical', phone: '108', available: '24/7' },
  { id: 'E002', name: 'Fire Service', category: 'Fire', phone: '101', available: '24/7' },
  { id: 'E003', name: 'Police', category: 'Police', phone: '100', available: '24/7' },
  { id: 'E004', name: 'Nearby Hospital - Apollo', category: 'Medical', phone: '+91 80 2630 4050', available: '24/7' },
  { id: 'E005', name: 'Lift Technician - Ravi', category: 'Building', phone: '+91 98765 12345', available: '8 AM - 8 PM' },
  { id: 'E006', name: 'Electrician - Venkat', category: 'Utility', phone: '+91 98765 23456', available: '7 AM - 9 PM' },
  { id: 'E007', name: 'Plumber - Suresh', category: 'Utility', phone: '+91 98765 34567', available: '8 AM - 6 PM' },
  { id: 'E008', name: 'Security Office', category: 'Building', phone: '+91 98765 00001', available: '24/7' },
  { id: 'E009', name: 'Building Manager', category: 'Building', phone: '+91 98765 00002', available: '9 AM - 6 PM' },
];

export const visitorTrendData = [
  { day: 'Mon', visitors: 28 },
  { day: 'Tue', visitors: 35 },
  { day: 'Wed', visitors: 42 },
  { day: 'Thu', visitors: 31 },
  { day: 'Fri', visitors: 48 },
  { day: 'Sat', visitors: 62 },
  { day: 'Sun', visitors: 45 },
];

export const occupancyData = [
  { name: 'Occupied', value: 11, color: '#22C55E' },
  { name: 'Vacant', value: 4, color: '#EF4444' },
];

export const financialTrendData = [
  { month: 'Dec', collected: 42000, pending: 8000 },
  { month: 'Jan', collected: 45000, pending: 5000 },
  { month: 'Feb', collected: 38000, pending: 12000 },
  { month: 'Mar', collected: 47000, pending: 3000 },
  { month: 'Apr', collected: 43000, pending: 7000 },
  { month: 'May', collected: 35000, pending: 15000 },
];
