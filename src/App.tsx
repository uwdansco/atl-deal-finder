import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Auth = lazy(() => import("./pages/Auth"));
const Verify = lazy(() => import("./pages/Verify"));
const CheckEmail = lazy(() => import("./pages/CheckEmail"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Deals = lazy(() => import("./pages/Deals"));
const DealDetails = lazy(() => import("./pages/DealDetails"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Destinations = lazy(() => import("./pages/Destinations"));
const DestinationDetail = lazy(() => import("./pages/DestinationDetail"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const About = lazy(() => import("./pages/About"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const Pricing = lazy(() => import("./pages/Pricing"));

// Admin pages
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const DashboardOverview = lazy(() => import("./pages/admin/DashboardOverview"));
const SubscribersPage = lazy(() => import("./pages/admin/SubscribersPage"));
const DestinationsPage = lazy(() => import("./pages/admin/DestinationsPage"));
const DealsPage = lazy(() => import("./pages/admin/DealsPage"));
const SendEmailPage = lazy(() => import("./pages/admin/SendEmailPage"));
const PriceMonitoring = lazy(() => import("./pages/admin/PriceMonitoring"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const TestEmailAlerts = lazy(() => import("./pages/admin/TestEmailAlerts"));
const TestEmail = lazy(() => import("./pages/admin/TestEmail"));
const TestAlerts = lazy(() => import("./pages/admin/TestAlerts"));
const ComprehensiveTest = lazy(() => import("./pages/admin/ComprehensiveTest"));
const GuaranteeClaims = lazy(() => import("./pages/admin/GuaranteeClaims"));

// Dashboard pages
const DashboardLayout = lazy(() => import("./components/dashboard/DashboardLayout").then(m => ({ default: m.DashboardLayout })));
const MyDestinations = lazy(() => import("./pages/dashboard/MyDestinations"));
const PriceAlerts = lazy(() => import("./pages/dashboard/PriceAlerts"));
const AccountSettings = lazy(() => import("./pages/dashboard/AccountSettings"));
const BookingGuarantee = lazy(() => import("./pages/dashboard/BookingGuarantee"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

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
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/destinations/:slug" element={<DestinationDetail />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/deals/:id" element={<DealDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/check-email" element={<CheckEmail />} />
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
              <Route path="guarantee" element={<BookingGuarantee />} />
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
              <Route path="guarantee-claims" element={<GuaranteeClaims />} />
              <Route path="send-email" element={<SendEmailPage />} />
              <Route path="monitoring" element={<PriceMonitoring />} />
              <Route path="comprehensive-test" element={<ComprehensiveTest />} />
              <Route path="test-alerts" element={<TestEmailAlerts />} />
              <Route path="test-email" element={<TestEmail />} />
              <Route path="test-system" element={<TestAlerts />} />
              <Route path="audit" element={<AdminSettings />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
