import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import Layout from "@/components/layout/Layout";
import ProtectedRoute, { PublicRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAppStore } from "@/stores/useAppStore";

// Auth Pages — Login is eager (first paint), the rest are code-split per route
// so the initial bundle stays small and unchanged page chunks keep stable hashes.
import Login from "@/pages/auth/Login";
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));

// Admin Pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ManageApartment = lazy(() => import("@/pages/ManageApartment"));
const EntryVisitors = lazy(() => import("@/pages/EntryVisitors"));
const CheckOutVisitors = lazy(() => import("@/pages/CheckOutVisitors"));
const VehicleRegistry = lazy(() => import("@/pages/VehicleRegistry"));
const CheckOutVehicle = lazy(() => import("@/pages/CheckOutVehicle"));
const VisitorManagement = lazy(() => import("@/pages/VisitorManagement"));
const VendorManagement = lazy(() => import("@/pages/VendorManagement"));
const StaffAttendance = lazy(() => import("@/pages/StaffAttendance"));
const InventoryAudit = lazy(() => import("@/pages/InventoryAudit"));
const UtilityManagement = lazy(() => import("@/pages/UtilityManagement"));
const FinancialTracking = lazy(() => import("@/pages/FinancialTracking"));
const Reports = lazy(() => import("@/pages/Reports"));
const QRCodesPage = lazy(() => import("@/pages/QRCodesPage"));
const Profile = lazy(() => import("@/pages/Profile"));
const ChangePassword = lazy(() => import("@/pages/ChangePassword"));
const Settings = lazy(() => import("@/pages/Settings"));

// Security Dashboard
const SecurityDashboard = lazy(() => import("@/pages/SecurityDashboard"));

// Tenant Dashboard
const TenantDashboard = lazy(() => import("@/pages/TenantDashboard"));

// Scan Pages (Public)
const ScanVisitorEntry = lazy(() => import("@/pages/scan/ScanVisitorEntry"));
const ScanVisitorCheckout = lazy(() => import("@/pages/scan/ScanVisitorCheckout"));
const ScanVehicleEntry = lazy(() => import("@/pages/scan/ScanVehicleEntry"));
const ScanVehicleCheckout = lazy(() => import("@/pages/scan/ScanVehicleCheckout"));

const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Lightweight fallback while a route chunk loads.
function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Component to handle role-based dashboard redirect
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
      loadInitialData();
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
          {/* ── Public Auth Pages ── */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />

          {/* ── Self-service mobile scan pages (no auth required) ── */}
          <Route path="/scan/visitor-entry" element={<ScanVisitorEntry />} />
          <Route path="/scan/visitor-checkout" element={<ScanVisitorCheckout />} />
          <Route path="/scan/vehicle-entry" element={<ScanVehicleEntry />} />
          <Route path="/scan/vehicle-checkout" element={<ScanVehicleCheckout />} />

          {/* ── Security Dashboard (standalone, no sidebar) ── */}
          <Route path="/security" element={
            <ProtectedRoute allowedRoles={['security']}>
              <SecurityDashboard />
            </ProtectedRoute>
          } />

          {/* ── Tenant Dashboard with Layout ── */}
          <Route path="/tenant/*" element={
            <ProtectedRoute allowedRoles={['tenant']}>
              <Layout>
                <Routes>
                  <Route path="/" element={<TenantDashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/change-password" element={<ChangePassword />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />

          {/* ── Protected Routes with Layout (Admin only) ── */}
          <Route path="/*" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <Routes>
                  {/* Dashboard */}
                  <Route path="/" element={<DashboardRedirect />} />
                  
                  {/* Office Management */}
                  <Route path="/offices" element={<ManageApartment />} />
                  <Route path="/apartments" element={<ManageApartment />} />
                  
                  {/* Visitor Management */}
                  <Route path="/visitors/entry" element={<EntryVisitors />} />
                  <Route path="/visitors/checkout" element={<CheckOutVisitors />} />
                  <Route path="/visitors/manage" element={<VisitorManagement />} />
                  
                  {/* Vehicle Management */}
                  <Route path="/vehicles/entry" element={<VehicleRegistry />} />
                  <Route path="/vehicles/checkout" element={<CheckOutVehicle />} />
                  
                  {/* Operations */}
                  <Route path="/vendors" element={<VendorManagement />} />
                  <Route path="/staff" element={<StaffAttendance />} />
                  <Route path="/inventory" element={<InventoryAudit />} />
                  <Route path="/utilities" element={<UtilityManagement />} />
                  <Route path="/financials" element={<FinancialTracking />} />
                  
                  {/* Reports & QR */}
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/qr-codes" element={<QRCodesPage />} />
                  
                  {/* Profile & Settings */}
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/change-password" element={<ChangePassword />} />
                  <Route path="/settings" element={<Settings />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
