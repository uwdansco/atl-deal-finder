import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
import PriceMonitoring from "./pages/admin/PriceMonitoring";
import AdminSettings from "./pages/admin/AdminSettings";
import TestEmailAlerts from "./pages/admin/TestEmailAlerts";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import MyDestinations from "./pages/dashboard/MyDestinations";
import PriceAlerts from "./pages/dashboard/PriceAlerts";
import AccountSettings from "./pages/dashboard/AccountSettings";
import Destinations from "./pages/Destinations";
import DestinationDetail from "./pages/DestinationDetail";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import About from "./pages/About";
import HowItWorksPage from "./pages/HowItWorksPage";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <OfflineBanner />
            <InstallPrompt />
            <BrowserRouter>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/destinations/:slug" element={<DestinationDetail />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
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

            {/* User Dashboard Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard/destinations" replace />} />
              <Route path="destinations" element={<MyDestinations />} />
              <Route path="alerts" element={<PriceAlerts />} />
              <Route path="settings" element={<AccountSettings />} />
            </Route>
            
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
              <Route path="monitoring" element={<PriceMonitoring />} />
              <Route path="test-alerts" element={<TestEmailAlerts />} />
              <Route path="audit" element={<AdminSettings />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
