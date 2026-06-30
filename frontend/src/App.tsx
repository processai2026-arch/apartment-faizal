import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Layout from '@/components/layout/Layout';
import ProtectedRoute, { PublicRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppStore } from '@/stores/useAppStore';
import Login from '@/pages/auth/Login';

const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ManageApartment = lazy(() => import('@/pages/ManageApartment'));
const UserManagement = lazy(() => import('@/pages/UserManagement'));
const EntryVisitors = lazy(() => import('@/pages/EntryVisitors'));
const CheckOutVisitors = lazy(() => import('@/pages/CheckOutVisitors'));
const VehicleRegistry = lazy(() => import('@/pages/VehicleRegistry'));
const CheckOutVehicle = lazy(() => import('@/pages/CheckOutVehicle'));
const VisitorManagement = lazy(() => import('@/pages/VisitorManagement'));
const VendorManagement = lazy(() => import('@/pages/VendorManagement'));
const AdminVendorDashboard = lazy(() => import('@/pages/AdminVendorDashboard'));
const VendorMarketplace = lazy(() => import('@/pages/VendorMarketplace'));
const VendorDetails = lazy(() => import('@/pages/VendorDetails'));
const Complaints = lazy(() => import('@/pages/Complaints'));
const AdminComplaints = lazy(() => import('@/pages/AdminComplaints'));
const Maintenance = lazy(() => import('@/pages/Maintenance'));
const AdminMaintenance = lazy(() => import('@/pages/AdminMaintenance'));
const StaffAttendance = lazy(() => import('@/pages/StaffAttendance'));
const InventoryAudit = lazy(() => import('@/pages/InventoryAudit'));
const UtilityManagement = lazy(() => import('@/pages/UtilityManagement'));
const FinancialTracking = lazy(() => import('@/pages/FinancialTracking'));
const Reports = lazy(() => import('@/pages/Reports'));
const QRCodesPage = lazy(() => import('@/pages/QRCodesPage'));
const Profile = lazy(() => import('@/pages/Profile'));
const ChangePassword = lazy(() => import('@/pages/ChangePassword'));
const Settings = lazy(() => import('@/pages/Settings'));
const SecurityDashboard = lazy(() => import('@/pages/SecurityDashboard'));
const SecurityNotifications = lazy(() => import('@/pages/SecurityNotifications'));
const TenantDashboard = lazy(() => import('@/pages/TenantDashboard'));
const TenantNotifications = lazy(() => import('@/pages/TenantNotifications'));
const AdminNotifications = lazy(() => import('@/pages/AdminNotifications'));
const ScanVisitorEntry = lazy(() => import('@/pages/scan/ScanVisitorEntry'));
const ScanVisitorCheckout = lazy(() => import('@/pages/scan/ScanVisitorCheckout'));
const ScanVehicleEntry = lazy(() => import('@/pages/scan/ScanVehicleEntry'));
const ScanVehicleCheckout = lazy(() => import('@/pages/scan/ScanVehicleCheckout'));
const NotFound = lazy(() => import('./pages/NotFound'));

// P9-10 Rental
const RentalMarketplace = lazy(() => import('@/pages/RentalMarketplace'));
const RentalDetails = lazy(() => import('@/pages/RentalDetails'));
const CreateListing = lazy(() => import('@/pages/CreateListing'));
const AdminRentalDashboard = lazy(() => import('@/pages/AdminRentalDashboard'));
// P11 Business Ads
const BusinessMarketplace = lazy(() => import('@/pages/BusinessMarketplace'));
const AdminBusinessAds = lazy(() => import('@/pages/AdminBusinessAds'));
// P12 Announcements
const Announcements = lazy(() => import('@/pages/Announcements'));
const AdminAnnouncements = lazy(() => import('@/pages/AdminAnnouncements'));
// P13 Emergency Contacts
const EmergencyContacts = lazy(() => import('@/pages/EmergencyContacts'));
const AdminEmergencyContacts = lazy(() => import('@/pages/AdminEmergencyContacts'));
// P14 Daily Workers
const DailyWorkers = lazy(() => import('@/pages/DailyWorkers'));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    </div>
  );
}

function DashboardRedirect() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return <Dashboard />;
    case 'security':
      return <Navigate to="/security" replace />;
    case 'tenant':
      return <Navigate to="/tenant" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function AppDataBootstrap() {
  const { hydrateSession, isAuthenticated, user } = useAuthStore();
  const { loadInitialData, resetBackendState, isLoaded } = useAppStore();

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    if (isAuthenticated && user && !isLoaded) {
      loadInitialData(user.role);
    }
    if (!isAuthenticated) {
      resetBackendState();
    }
  }, [isAuthenticated, user, isLoaded, loadInitialData, resetBackendState]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppDataBootstrap />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

            <Route path="/scan/visitor-entry" element={<ScanVisitorEntry />} />
            <Route path="/scan/visitor-checkout" element={<ScanVisitorCheckout />} />
            <Route path="/scan/vehicle-entry" element={<ScanVehicleEntry />} />
            <Route path="/scan/vehicle-checkout" element={<ScanVehicleCheckout />} />

            <Route path="/security" element={<ProtectedRoute allowedRoles={['security']}><SecurityDashboard /></ProtectedRoute>} />
            <Route path="/security/notifications" element={<ProtectedRoute allowedRoles={['security']}><SecurityNotifications /></ProtectedRoute>} />
            <Route path="/security/emergency-contacts" element={<ProtectedRoute allowedRoles={['security']}><EmergencyContacts /></ProtectedRoute>} />
            <Route path="/security/daily-workers" element={<ProtectedRoute allowedRoles={['security']}><DailyWorkers /></ProtectedRoute>} />

            <Route path="/tenant/*" element={<ProtectedRoute allowedRoles={['tenant']}><Layout><Routes>
              <Route path="/" element={<TenantDashboard />} />
              <Route path="/complaints" element={<Complaints />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/marketplace" element={<VendorMarketplace />} />
              <Route path="/marketplace/:id" element={<VendorDetails />} />
              <Route path="/rental" element={<RentalMarketplace />} />
              <Route path="/rental/create" element={<CreateListing />} />
              <Route path="/rental/:id" element={<RentalDetails />} />
              <Route path="/business-ads" element={<BusinessMarketplace />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/emergency-contacts" element={<EmergencyContacts />} />
              <Route path="/notifications" element={<TenantNotifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/change-password" element={<ChangePassword />} />
            </Routes></Layout></ProtectedRoute>} />

            <Route path="/*" element={<ProtectedRoute allowedRoles={['admin']}><Layout><Routes>
              <Route path="/" element={<DashboardRedirect />} />
              <Route path="/offices" element={<ManageApartment />} />
              <Route path="/apartments" element={<ManageApartment />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/visitors/entry" element={<EntryVisitors />} />
              <Route path="/visitors/checkout" element={<CheckOutVisitors />} />
              <Route path="/visitors/manage" element={<VisitorManagement />} />
              <Route path="/vehicles/entry" element={<VehicleRegistry />} />
              <Route path="/vehicles/checkout" element={<CheckOutVehicle />} />
              <Route path="/vendors" element={<VendorManagement />} />
              <Route path="/vendor-marketplace" element={<AdminVendorDashboard />} />
              <Route path="/complaints" element={<AdminComplaints />} />
              <Route path="/maintenance" element={<AdminMaintenance />} />
              <Route path="/staff" element={<StaffAttendance />} />
              <Route path="/inventory" element={<InventoryAudit />} />
              <Route path="/utilities" element={<UtilityManagement />} />
              <Route path="/financials" element={<FinancialTracking />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/qr-codes" element={<QRCodesPage />} />
              <Route path="/notifications" element={<AdminNotifications />} />
              <Route path="/rental" element={<AdminRentalDashboard />} />
              <Route path="/business-ads" element={<AdminBusinessAds />} />
              <Route path="/announcements" element={<AdminAnnouncements />} />
              <Route path="/emergency-contacts" element={<AdminEmergencyContacts />} />
              <Route path="/daily-workers" element={<DailyWorkers />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes></Layout></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
