import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
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
import ScanVisitorEntry from "@/pages/scan/ScanVisitorEntry";
import ScanVisitorCheckout from "@/pages/scan/ScanVisitorCheckout";
import ScanVehicleEntry from "@/pages/scan/ScanVehicleEntry";
import ScanVehicleCheckout from "@/pages/scan/ScanVehicleCheckout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* ── Self-service mobile scan pages (no admin layout) ── */}
          <Route path="/scan/visitor-entry" element={<ScanVisitorEntry />} />
          <Route path="/scan/visitor-checkout" element={<ScanVisitorCheckout />} />
          <Route path="/scan/vehicle-entry" element={<ScanVehicleEntry />} />
          <Route path="/scan/vehicle-checkout" element={<ScanVehicleCheckout />} />

          {/* ── Admin dashboard (with sidebar layout) ── */}
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/apartments" element={<ManageApartment />} />
                <Route path="/visitors/entry" element={<EntryVisitors />} />
                <Route path="/visitors/checkout" element={<CheckOutVisitors />} />
                <Route path="/visitors/manage" element={<VisitorManagement />} />
                <Route path="/vehicles/entry" element={<VehicleRegistry />} />
                <Route path="/vehicles/checkout" element={<CheckOutVehicle />} />
                <Route path="/vendors" element={<VendorManagement />} />
                <Route path="/staff" element={<StaffAttendance />} />
                <Route path="/inventory" element={<InventoryAudit />} />
                <Route path="/utilities" element={<UtilityManagement />} />
                <Route path="/financials" element={<FinancialTracking />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/qr-codes" element={<QRCodesPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
