import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProtectedRoute, { PublicRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/stores/useAuthStore";

// Auth Pages
import Login from "@/pages/auth/Login";
import ForgotPassword from "@/pages/auth/ForgotPassword";

// Admin Pages
import Dashboard from "@/pages/Dashboard";
import ManageApartment from "@/pages/ManageApartment";
import EntryVisitors from "@/pages/EntryVisitors";
import CheckOutVisitors from "@/pages/CheckOutVisitors";
import VehicleRegistry from "@/pages/VehicleRegistry";
import CheckOutVehicle from "@/pages/CheckOutVehicle";
import VisitorManagement from "@/pages/VisitorManagement";
import VendorManagement from "@/pages/VendorManagement";
import StaffAttendance from "@/pages/StaffAttendance";
import InventoryAudit from "@/pages/InventoryAudit";
import UtilityManagement from "@/pages/UtilityManagement";
import FinancialTracking from "@/pages/FinancialTracking";
import Reports from "@/pages/Reports";
import QRCodesPage from "@/pages/QRCodesPage";
import Profile from "@/pages/Profile";
import ChangePassword from "@/pages/ChangePassword";
import Settings from "@/pages/Settings";

// Security Dashboard
import SecurityDashboard from "@/pages/SecurityDashboard";

// Tenant Dashboard
import TenantDashboard from "@/pages/TenantDashboard";

// Scan Pages (Public)
import ScanVisitorEntry from "@/pages/scan/ScanVisitorEntry";
import ScanVisitorCheckout from "@/pages/scan/ScanVisitorCheckout";
import ScanVehicleEntry from "@/pages/scan/ScanVehicleEntry";
import ScanVehicleCheckout from "@/pages/scan/ScanVehicleCheckout";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;