import type { InventoryItem, Office, Staff, UtilityTask, Vehicle, Vendor, Visitor } from '@/types';
import type { User } from '@/types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8010';

export interface ApiSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  };
  errors?: Record<string, unknown>;
}

class ApiError extends Error {
  constructor(message: string, public status: number, public errors?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
  }
}

export const tokenStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem('officegate.accessToken');
  },
  getRefreshToken(): string | null {
    return localStorage.getItem('officegate.refreshToken');
  },
  set(accessToken: string, refreshToken: string) {
    localStorage.setItem('officegate.accessToken', accessToken);
    localStorage.setItem('officegate.refreshToken', refreshToken);
  },
  clear() {
    localStorage.removeItem('officegate.accessToken');
    localStorage.removeItem('officegate.refreshToken');
  },
};

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(options.headers);
  const token = tokenStorage.getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const hasBody = options.body !== undefined;
  if (hasBody && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (response.status === 401 && retry && tokenStorage.getRefreshToken()) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request<T>(path, options, false);
    }
  }

  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.message || 'API request failed', response.status, payload?.errors);
  }

  return payload.data;
}

async function refreshSession(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const session = await request<ApiSession>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }, false);
    tokenStorage.set(session.accessToken, session.refreshToken);
    return true;
  } catch {
    tokenStorage.clear();
    return false;
  }
}

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : '';
}

function gateHeaders(token: string) {
  return { 'X-Gate-Token': token };
}

function unwrapList<T>(path: string) {
  return request<T[]>(path);
}

export const api = {
  login(email: string, password: string) {
    return request<ApiSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  sendOtp(phone: string, purpose: string) {
    return request<{ phone: string; purpose: string; expiresAt: string }>('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone, purpose }),
    });
  },
  verifyOtp(phone: string, purpose: string, otp: string) {
    return request<ApiSession | { verified: boolean }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, purpose, otp }),
    });
  },
  logout() {
    const refreshToken = tokenStorage.getRefreshToken();
    return request<null>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);
  },
  me() {
    return request<User>('/auth/me');
  },
  changePassword(currentPassword: string, newPassword: string) {
    return request<null>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  offices: {
    list: () => unwrapList<OfficeDto>('/admin/offices?perPage=100').then((rows) => rows.map(toOffice)),
    create: (office: Partial<Office>) => request<OfficeDto>('/admin/offices', { method: 'POST', body: JSON.stringify(fromOffice(office)) }).then(toOffice),
    update: (office: Office) => request<OfficeDto>(`/admin/offices/${office.id}`, { method: 'PUT', body: JSON.stringify(fromOffice(office)) }).then(toOffice),
    status: (id: string, status: Office['status']) => request<OfficeDto>(`/admin/offices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }).then(toOffice),
    remove: (id: string) => request<{ id: number | string }>(`/admin/offices/${id}`, { method: 'DELETE' }),
  },
  visitors: {
    list: () => unwrapList<VisitorDto>('/admin/visitors?perPage=100').then((rows) => rows.map(toVisitor)),
    create: (visitor: Partial<Visitor>) => request<VisitorDto>('/admin/visitors/entry', { method: 'POST', body: JSON.stringify(fromVisitor(visitor)) }).then(toVisitor),
    checkout: (id: string) => request<VisitorDto>(`/admin/visitors/${id}/checkout`, { method: 'POST', body: JSON.stringify({}) }).then(toVisitor),
    publicEntry: (visitor: Partial<Visitor>, gateToken: string) => request<VisitorDto>('/public/scan/visitor-entry', { method: 'POST', headers: gateHeaders(gateToken), body: JSON.stringify(fromVisitor(visitor)) }).then(toVisitor),
    publicCheckout: (id: string, checkoutToken: string, gateToken: string) => request<VisitorDto>('/public/scan/visitor-checkout', { method: 'POST', headers: gateHeaders(gateToken), body: JSON.stringify({ visitor_id: id, checkout_token: checkoutToken }) }).then(toVisitor),
  },
  vehicles: {
    list: () => unwrapList<VehicleDto>('/admin/vehicles?perPage=100').then((rows) => rows.map(toVehicle)),
    create: (vehicle: Partial<Vehicle>) => request<VehicleDto>('/admin/vehicles/entry', { method: 'POST', body: JSON.stringify(fromVehicle(vehicle)) }).then(toVehicle),
    checkout: (id: string) => request<VehicleDto>(`/admin/vehicles/${id}/checkout`, { method: 'POST', body: JSON.stringify({}) }).then(toVehicle),
    publicEntry: (vehicle: Partial<Vehicle>, gateToken: string) => request<VehicleDto>('/public/scan/vehicle-entry', { method: 'POST', headers: gateHeaders(gateToken), body: JSON.stringify(fromVehicle(vehicle)) }).then(toVehicle),
    publicCheckout: (id: string, checkoutToken: string, gateToken: string) => request<VehicleDto>('/public/scan/vehicle-checkout', { method: 'POST', headers: gateHeaders(gateToken), body: JSON.stringify({ vehicle_id: id, checkout_token: checkoutToken }) }).then(toVehicle),
  },
  vendors: {
    list: () => unwrapList<VendorDto>('/admin/vendors?perPage=100').then((rows) => rows.map(toVendor)),
    create: (vendor: Partial<Vendor>) => request<VendorDto>('/admin/vendors', { method: 'POST', body: JSON.stringify(fromVendor(vendor)) }).then(toVendor),
  },
  staff: {
    list: () => unwrapList<StaffDto>('/admin/staff?perPage=100').then((rows) => rows.map(toStaff)),
    create: (staff: Partial<Staff>) => request<StaffDto>('/admin/staff', { method: 'POST', body: JSON.stringify(fromStaff(staff)) }).then(toStaff),
    update: (staff: Staff) => request<StaffDto>(`/admin/staff/${staff.id}`, { method: 'PUT', body: JSON.stringify(fromStaff(staff)) }).then(toStaff),
    attendance: (id: string, date: string, status: 'P' | 'A' | 'H') => request<{ staffId: number; status: 'P' | 'A' | 'H' }>(`/admin/staff/${id}/attendance`, { method: 'POST', body: JSON.stringify({ date, status }) }),
  },
  inventory: {
    list: () => unwrapList<InventoryDto>('/admin/inventory?perPage=100').then((rows) => rows.map(toInventory)),
    create: (item: Partial<InventoryItem>) => request<InventoryDto>('/admin/inventory', { method: 'POST', body: JSON.stringify(fromInventory(item)) }).then(toInventory),
  },
  utilities: {
    list: () => unwrapList<UtilityDto>('/admin/utilities?perPage=100').then((rows) => rows.map(toUtility)),
    create: (task: Partial<UtilityTask>) => request<UtilityDto>('/admin/utilities', { method: 'POST', body: JSON.stringify(fromUtility(task)) }).then(toUtility),
    complete: (id: string) => request<UtilityDto>(`/admin/utilities/${id}/complete`, { method: 'POST', body: JSON.stringify({}) }).then(toUtility),
  },
};

type DtoValue = string | number | boolean | null | undefined;
type OfficeDto = Record<string, DtoValue>;
type VisitorDto = Record<string, DtoValue>;
type VehicleDto = Record<string, DtoValue>;
type VendorDto = Record<string, DtoValue>;
type StaffDto = Record<string, DtoValue>;
type InventoryDto = Record<string, DtoValue>;
type UtilityDto = Record<string, DtoValue>;

function toOffice(row: OfficeDto): Office {
  return {
    id: String(row.id),
    block: row.block,
    floorNumber: row.floor_number,
    companyName: row.company_name,
    contactPerson: row.contact_person || undefined,
    contactPhone: row.contact_phone || undefined,
    contactEmail: row.contact_email || undefined,
    allocatedVehicleCount: Number(row.allocated_vehicle_count || 0),
    usedVehicleCount: Number(row.used_vehicle_count || 0),
    status: row.status,
  };
}

function fromOffice(office: Partial<Office>) {
  return {
    block: office.block,
    floor_number: office.floorNumber,
    company_name: office.companyName,
    contact_person: office.contactPerson,
    contact_phone: office.contactPhone,
    contact_email: office.contactEmail,
    allocated_vehicle_count: office.allocatedVehicleCount ?? 0,
    status: office.status ?? 'Active',
  };
}

function toVisitor(row: VisitorDto): Visitor {
  const entryTime = row.entry_time || row.entryTime;
  const exitTime = row.exit_time || undefined;
  return {
    id: String(row.id),
    name: row.name,
    phone: row.phone,
    gender: row.gender || undefined,
    address: row.address || undefined,
    city: row.city || undefined,
    pincode: row.pincode || undefined,
    block: row.block || 'BRILEY ONE',
    floorNumber: row.floor_number || row.floorNumber || '',
    companyName: row.company_name || row.companyName || '',
    whomToMeet: row.whom_to_meet || row.whomToMeet || '',
    reason: row.reason || row.purpose || '',
    vehicleType: row.vehicle_type || row.vehicleType || undefined,
    vehicleNo: row.vehicle_no || row.vehicleNo || undefined,
    status: row.status,
    entryTime,
    exitTime,
    duration: exitTime ? calculateDuration(entryTime, exitTime) : undefined,
    guardName: row.guard_name || row.guardName || undefined,
    remarks: row.remarks || undefined,
    checkoutToken: row.checkout_token || row.checkoutToken || undefined,
    checkoutTokenExpiresAt: row.checkout_token_expires_at || row.checkoutTokenExpiresAt || undefined,
    apartmentNo: row.apartmentNo,
    purpose: row.reason || row.purpose,
  };
}

function fromVisitor(visitor: Partial<Visitor>) {
  return {
    name: visitor.name,
    phone: visitor.phone,
    gender: visitor.gender,
    address: visitor.address,
    city: visitor.city,
    pincode: visitor.pincode,
    block: visitor.block || 'BRILEY ONE',
    floor_number: visitor.floorNumber || visitor.apartmentNo || '',
    company_name: visitor.companyName || visitor.apartmentNo || '',
    whom_to_meet: visitor.whomToMeet || 'Reception',
    reason: visitor.reason || visitor.purpose || 'Visit',
    vehicle_type: visitor.vehicleType,
    vehicle_no: visitor.vehicleNo,
    status: visitor.status || 'Inside',
    entry_time: visitor.entryTime,
    guard_name: visitor.guardName,
    remarks: visitor.remarks,
  };
}

function toVehicle(row: VehicleDto): Vehicle {
  return {
    id: String(row.id),
    vehicleNo: row.vehicle_no || row.vehicleNo,
    vehicleType: row.vehicle_type || row.vehicleType,
    vehicleModel: row.vehicle_model || row.vehicleModel || undefined,
    ownerName: row.owner_name || row.ownerName || undefined,
    block: row.block || undefined,
    floorNumber: row.floor_number || undefined,
    companyName: row.company_name || undefined,
    parkingUserType: row.parking_user_type || undefined,
    status: row.status,
    entryTime: row.entry_time || row.entryTime,
    exitTime: row.exit_time || undefined,
    checkoutToken: row.checkout_token || row.checkoutToken || undefined,
    checkoutTokenExpiresAt: row.checkout_token_expires_at || row.checkoutTokenExpiresAt || undefined,
    apartmentNo: row.floor_number || row.apartmentNo || undefined,
    type: row.vehicle_type || row.type || undefined,
  };
}

function fromVehicle(vehicle: Partial<Vehicle>) {
  return {
    vehicle_no: vehicle.vehicleNo,
    vehicle_type: vehicle.vehicleType || vehicle.type || 'Other',
    vehicle_model: vehicle.vehicleModel,
    owner_name: vehicle.ownerName,
    block: vehicle.block || 'BRILEY ONE',
    floor_number: vehicle.floorNumber || vehicle.apartmentNo,
    company_name: vehicle.companyName || vehicle.apartmentNo,
    parking_user_type: vehicle.parkingUserType || 'Visitor',
    status: vehicle.status || 'Inside',
    entry_time: vehicle.entryTime,
  };
}

function toVendor(row: VendorDto): Vendor {
  return {
    id: String(row.id),
    name: row.name,
    company: row.company,
    serviceType: row.service_type,
    category: row.category,
    contact: row.contact,
    lastVisit: row.last_visit || undefined,
    nextVisit: row.next_visit || undefined,
    status: row.status,
  };
}

function fromVendor(vendor: Partial<Vendor>) {
  return {
    name: vendor.name,
    company: vendor.company,
    service_type: vendor.serviceType,
    category: vendor.category,
    contact: vendor.contact,
    last_visit: vendor.lastVisit,
    next_visit: vendor.nextVisit,
    status: vendor.status || 'Active',
  };
}

function toStaff(row: StaffDto): Staff {
  return {
    id: String(row.id),
    name: row.name,
    role: row.role,
    department: row.department,
    contact: row.contact,
    joinDate: row.join_date,
    attendance: {},
  };
}

function fromStaff(staff: Partial<Staff>) {
  return {
    name: staff.name,
    role: staff.role,
    department: staff.department,
    contact: staff.contact,
    join_date: staff.joinDate,
    status: 'Active',
  };
}

function toInventory(row: InventoryDto): InventoryItem {
  return {
    id: String(row.id),
    itemName: row.item_name,
    category: row.category,
    quantity: Number(row.quantity || 0),
    unitCost: Number(row.unit_cost || 0),
    totalCost: Number(row.quantity || 0) * Number(row.unit_cost || 0),
    vendor: row.vendor || '',
    date: row.purchase_date || row.created_at?.slice(0, 10) || '',
    usedQuantity: Number(row.used_quantity || 0),
    location: row.location || '',
    usedBy: row.used_by || '',
  };
}

function fromInventory(item: Partial<InventoryItem>) {
  return {
    item_name: item.itemName,
    category: item.category,
    quantity: item.quantity ?? 0,
    unit_cost: item.unitCost ?? 0,
    vendor: item.vendor,
    purchase_date: item.date,
    used_quantity: item.usedQuantity ?? 0,
    location: item.location,
    used_by: item.usedBy,
  };
}

function toUtility(row: UtilityDto): UtilityTask {
  return {
    id: String(row.id),
    description: row.description,
    type: row.type,
    scheduledDate: row.scheduled_date,
    lastCompleted: row.last_completed || undefined,
    status: row.status,
    assignedStaff: row.assigned_staff || undefined,
    notes: row.notes || undefined,
  };
}

function fromUtility(task: Partial<UtilityTask>) {
  return {
    description: task.description,
    type: task.type,
    scheduled_date: task.scheduledDate,
    last_completed: task.lastCompleted,
    status: task.status || 'Upcoming',
    assigned_staff: task.assignedStaff,
    notes: task.notes,
  };
}

function calculateDuration(entryTime: string, exitTime: string): string {
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  const diffMs = Math.max(0, exit.getTime() - entry.getTime());
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);
  return diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}m`;
}
