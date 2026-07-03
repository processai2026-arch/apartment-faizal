import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Layout from '@/components/layout/Layout';
import ProtectedRoute, { PublicRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore, getDashboardPath } from '@/stores/useAuthStore';
import { useAppStore } from '@/stores/useAppStore';
import { useEntitlementsStore } from '@/stores/useEntitlementsStore';
import { featureKeyForLocation } from '@/lib/featureRegistry';
import Login from '@/pages/auth/Login';
import { ErrorBoundary } from '@/components/features/ErrorBoundary';

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
// P11 Business Ads (super-admin only; the tenant BusinessMarketplace page is unrouted)
const AdminBusinessAds = lazy(() => import('@/pages/AdminBusinessAds'));
// P12 Announcements
const Announcements = lazy(() => import('@/pages/Announcements'));
const AdminAnnouncements = lazy(() => import('@/pages/AdminAnnouncements'));
// P13 Emergency Contacts
const EmergencyContacts = lazy(() => import('@/pages/EmergencyContacts'));
const AdminEmergencyContacts = lazy(() => import('@/pages/AdminEmergencyContacts'));
// P14 Daily Workers
const DailyWorkers = lazy(() => import('@/pages/DailyWorkers'));
// P15 Secretary Portal
const SecretaryDashboard = lazy(() => import('@/pages/SecretaryDashboard'));
const SecretaryManagement = lazy(() => import('@/pages/admin/SecretaryManagement'));
// P16 WhatsApp Integration
const WhatsAppHub = lazy(() => import('@/pages/WhatsAppHub'));
// P17 Smart QR Visitor Passes
const VisitorPassManagement = lazy(() => import('@/pages/VisitorPassManagement'));
// P18 Community Analytics
const CommunityAnalytics = lazy(() => import('@/pages/CommunityAnalytics'));
// P19 Community Events
const AdminEvents = lazy(() => import('@/pages/AdminEvents'));
const TenantEvents = lazy(() => import('@/pages/TenantEvents'));
// P20 Resident Service Hub
const ResidentServiceHub = lazy(() => import('@/pages/ResidentServiceHub'));
// P21 CCTV Foundation
const CameraManagement = lazy(() => import('@/pages/CameraManagement'));
// P22 Premium Membership
const SubscriptionManagement = lazy(() => import('@/pages/admin/SubscriptionManagement'));
const TenantSubscription = lazy(() => import('@/pages/TenantSubscription'));
// P23 Ad Billing & Analytics
const AdBillingAnalytics = lazy(() => import('@/pages/AdBillingAnalytics'));
// P24 Razorpay Payment Integration
const PaymentDashboard = lazy(() => import('@/pages/PaymentDashboard'));
// Office Expenses (Finance & Expense Management)
const OfficeExpenses = lazy(() => import('@/pages/OfficeExpenses'));
// P25 Facility & Daily Operations
const DailyOperations = lazy(() => import('@/pages/DailyOperations'));
// IoT Monitoring & Hardware Automation
const IoTMonitoring = lazy(() => import('@/pages/IoTMonitoring'));
const HomeAutomation = lazy(() => import('@/pages/HomeAutomation'));
const TenantHomeAutomation = lazy(() => import('@/pages/TenantHomeAutomation'));
const DocumentManagement = lazy(() => import('@/pages/DocumentManagement'));
const NameTransferPage = lazy(() => import('@/pages/NameTransfer'));
// Asset & Utility Tracking
const AssetTracking = lazy(() => import('@/pages/AssetTracking'));
// Payroll & Medical Records
const Payroll = lazy(() => import('@/pages/Payroll'));
const MedicalReports = lazy(() => import('@/pages/MedicalReports'));
// Accounts & Compliance + AMC/DG Maintenance
const AccountsCompliance = lazy(() => import('@/pages/AccountsCompliance'));
const AmcMaintenance = lazy(() => import('@/pages/AmcMaintenance'));
// Super Admin portal (organizations & multi-tenant management)
const SuperAdminPortal = lazy(() => import('@/pages/SuperAdminPortal'));

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
    case 'super_admin': // super admin uses the admin dashboard as home
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
  const loadEntitlements = useEntitlementsStore((s) => s.load);
  const resetEntitlements = useEntitlementsStore((s) => s.reset);

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

  // Load per-user feature entitlements once authenticated; clear on logout.
  useEffect(() => {
    if (isAuthenticated && user) {
      loadEntitlements();
    } else if (!isAuthenticated) {
      resetEntitlements();
    }
  }, [isAuthenticated, user, loadEntitlements, resetEntitlements]);

  return null;
}

/**
 * Redirects direct navigation to a disabled-feature path back to the user's
 * dashboard, so a hidden module can't be reached via the URL bar. Lightweight:
 * the API also returns 403, this just avoids landing on a broken page. Fail-soft
 * — while entitlements are unknown (null) or for super_admin, it never redirects.
 */
function EntitlementRedirect() {
  const { isAuthenticated, user } = useAuthStore();
  const features = useEntitlementsStore((s) => s.features);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user || user.role === 'super_admin') return;
    if (features === null) return; // unknown → allow (fail-soft)
    const key = featureKeyForLocation(location.pathname);
    if (key && !features.includes(key)) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, features, location.pathname, navigate]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppDataBootstrap />
        <EntitlementRedirect />
        <ErrorBoundary>
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
              <Route path="/hub" element={<ResidentServiceHub />} />
              <Route path="/home-automation" element={<TenantHomeAutomation />} />
              <Route path="/complaints" element={<Complaints />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/marketplace" element={<VendorMarketplace />} />
              <Route path="/marketplace/:id" element={<VendorDetails />} />
              <Route path="/rental" element={<RentalMarketplace />} />
              <Route path="/rental/create" element={<CreateListing />} />
              <Route path="/rental/:id" element={<RentalDetails />} />
              {/* /tenant/business-ads (BusinessMarketplace) removed: in-app
                  advertisements are visible ONLY to the super admin. The
                  backend /tenant/business-ads routes are super_admin-gated. */}
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/emergency-contacts" element={<EmergencyContacts />} />
              <Route path="/notifications" element={<TenantNotifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/events" element={<TenantEvents />} />
              <Route path="/subscription" element={<TenantSubscription />} />
            </Routes></Layout></ProtectedRoute>} />

            {/* Super Admin portal — exclusive to the super_admin role */}
            <Route path="/super" element={<ProtectedRoute allowedRoles={['super_admin']}><Layout><SuperAdminPortal /></Layout></ProtectedRoute>} />

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
              <Route path="/assets" element={<AssetTracking />} />
              <Route path="/utilities" element={<UtilityManagement />} />
              <Route path="/financials" element={<FinancialTracking />} />
              <Route path="/expenses" element={<OfficeExpenses />} />
              <Route path="/documents" element={<DocumentManagement />} />
              <Route path="/name-transfers" element={<NameTransferPage />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/medical" element={<MedicalReports />} />
              <Route path="/compliance" element={<AccountsCompliance />} />
              <Route path="/amc" element={<AmcMaintenance />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/qr-codes" element={<QRCodesPage />} />
              <Route path="/notifications" element={<AdminNotifications />} />
              <Route path="/rental" element={<AdminRentalDashboard />} />
              {/* Advertisements are super-admin-only: nested guard keeps plain
                  admins out even though the shell route allows 'admin'. */}
              <Route path="/business-ads" element={<ProtectedRoute allowedRoles={['super_admin']}><AdminBusinessAds /></ProtectedRoute>} />
              <Route path="/announcements" element={<AdminAnnouncements />} />
              <Route path="/emergency-contacts" element={<AdminEmergencyContacts />} />
              <Route path="/daily-workers" element={<DailyWorkers />} />
              <Route path="/daily-ops" element={<DailyOperations />} />
              <Route path="/secretary" element={<SecretaryDashboard />} />
              <Route path="/secretary-management" element={<SecretaryManagement />} />
              <Route path="/whatsapp" element={<WhatsAppHub />} />
              <Route path="/visitor-passes" element={<VisitorPassManagement />} />
              <Route path="/analytics" element={<CommunityAnalytics />} />
              <Route path="/events" element={<AdminEvents />} />
              <Route path="/cameras" element={<CameraManagement />} />
              <Route path="/iot" element={<IoTMonitoring />} />
              <Route path="/home-automation" element={<HomeAutomation />} />
              <Route path="/subscriptions" element={<SubscriptionManagement />} />
              <Route path="/ad-billing" element={<ProtectedRoute allowedRoles={['super_admin']}><AdBillingAnalytics /></ProtectedRoute>} />
              <Route path="/payments" element={<PaymentDashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes></Layout></ProtectedRoute>} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
