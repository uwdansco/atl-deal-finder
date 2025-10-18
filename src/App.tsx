import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import Verify from "./pages/Verify";
import Unsubscribe from "./pages/Unsubscribe";
import Deals from "./pages/Deals";
import DealDetails from "./pages/DealDetails";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./components/admin/AdminLayout";
import DashboardOverview from "./pages/admin/DashboardOverview";
import SubscribersPage from "./pages/admin/SubscribersPage";
import DestinationsPage from "./pages/admin/DestinationsPage";
import DealsPage from "./pages/admin/DealsPage";
import SendEmailPage from "./pages/admin/SendEmailPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/deals/:id" element={<DealDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            
            {/* Legacy auth route (redirect to login) */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected Routes */}
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardOverview />} />
              <Route path="subscribers" element={<SubscribersPage />} />
              <Route path="destinations" element={<DestinationsPage />} />
              <Route path="deals" element={<DealsPage />} />
              <Route path="send-email" element={<SendEmailPage />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
