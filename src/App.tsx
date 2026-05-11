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
import SignUp from "@/pages/auth/SignUp";
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

// Role-specific Dashboards
import SecurityDashboard from "@/pages/SecurityDashboard";
import ResidentDashboard from "@/pages/ResidentDashboard";

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
    case 'owner':
    case 'tenant':
    case 'owner-resident':
      return <Navigate to="/resident" replace />;
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
          <Route path="/signup" element={
            <PublicRoute>
              <SignUp />
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

          {/* ── Protected Routes with Layout ── */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  {/* Dashboard - redirects based on role */}
                  <Route path="/" element={<DashboardRedirect />} />
                  
                  {/* Resident Dashboard */}
                  <Route path="/resident" element={
                    <ProtectedRoute allowedRoles={['owner', 'tenant', 'owner-resident']}>
                      <ResidentDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Owner-specific routes */}
                  <Route path="/owner" element={
                    <ProtectedRoute allowedRoles={['owner']}>
                      <ResidentDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Tenant-specific routes */}
                  <Route path="/tenant" element={
                    <ProtectedRoute allowedRoles={['tenant']}>
                      <ResidentDashboard />
                    </ProtectedRoute>
                  } />

                  {/* Admin Routes */}
                  <Route path="/apartments" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ManageApartment />
                    </ProtectedRoute>
                  } />
                  
                  {/* Visitor Routes - Admin and Residents */}
                  <Route path="/visitors/entry" element={
                    <ProtectedRoute allowedRoles={['admin', 'tenant', 'owner-resident']}>
                      <EntryVisitors />
                    </ProtectedRoute>
                  } />
                  <Route path="/visitors/checkout" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <CheckOutVisitors />
                    </ProtectedRoute>
                  } />
                  <Route path="/visitors/manage" element={
                    <ProtectedRoute allowedRoles={['admin', 'owner', 'tenant', 'owner-resident']}>
                      <VisitorManagement />
                    </ProtectedRoute>
                  } />
                  
                  {/* Vehicle Routes */}
                  <Route path="/vehicles/entry" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <VehicleRegistry />
                    </ProtectedRoute>
                  } />
                  <Route path="/vehicles/checkout" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <CheckOutVehicle />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin-only Operations */}
                  <Route path="/vendors" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <VendorManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/staff" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <StaffAttendance />
                    </ProtectedRoute>
                  } />
                  <Route path="/inventory" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <InventoryAudit />
                    </ProtectedRoute>
                  } />
                  <Route path="/utilities" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <UtilityManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/financials" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <FinancialTracking />
                    </ProtectedRoute>
                  } />
                  <Route path="/reports" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Reports />
                    </ProtectedRoute>
                  } />
                  <Route path="/qr-codes" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <QRCodesPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Placeholder routes for resident features */}
                  <Route path="/workers" element={
                    <ProtectedRoute allowedRoles={['tenant', 'owner-resident']}>
                      <div className="p-8 text-center">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Daily Workers</h2>
                        <p className="text-slate-500">Coming soon...</p>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/vehicles" element={
                    <ProtectedRoute allowedRoles={['owner', 'tenant', 'owner-resident']}>
                      <div className="p-8 text-center">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">My Vehicles</h2>
                        <p className="text-slate-500">Coming soon...</p>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/complaints" element={
                    <ProtectedRoute allowedRoles={['owner', 'tenant', 'owner-resident']}>
                      <div className="p-8 text-center">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Complaints</h2>
                        <p className="text-slate-500">Coming soon...</p>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/property" element={
                    <ProtectedRoute allowedRoles={['owner', 'owner-resident']}>
                      <div className="p-8 text-center">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Property Details</h2>
                        <p className="text-slate-500">Coming soon...</p>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/payments" element={
                    <ProtectedRoute allowedRoles={['owner', 'owner-resident']}>
                      <div className="p-8 text-center">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payments</h2>
                        <p className="text-slate-500">Coming soon...</p>
                      </div>
                    </ProtectedRoute>
                  } />
                  <Route path="/emergency" element={
                    <ProtectedRoute allowedRoles={['owner', 'tenant', 'owner-resident']}>
                      <div className="p-8 text-center">
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Emergency Contacts</h2>
                        <p className="text-slate-500">Coming soon...</p>
                      </div>
                    </ProtectedRoute>
                  } />
                  
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