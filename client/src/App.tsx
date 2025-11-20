// Code based on javascript_auth_all_persistance blueprint
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { MetaMaskProvider } from "@/contexts/MetaMaskContext";
import { ProtectedRoute } from "@/lib/protected-route";
import { UsernameSetupModal } from "@/components/username-setup-modal";
import { KYCSetupModal } from "@/components/kyc-setup-modal";
import { useState, useEffect } from "react";
import HomePage from "@/pages/home-page";
import MarketDetailPage from "@/pages/market-detail-page";
import PolymarketDetailPage from "@/pages/polymarket-detail-page";
import EventDetailPage from "@/pages/event-detail-page";
import PortfolioPage from "@/pages/portfolio-page";
import ProfilePage from "@/pages/profile-page";
import AdminPage from "@/pages/admin-page";
import AuthPage from "@/pages/auth-page";
import DepositPage from "@/pages/deposit-page";
import ForgotPasswordPage from "@/pages/forgot-password-page";
import ResetPasswordPage from "@/pages/reset-password-page";
import NotFound from "@/pages/not-found";

function UsernameGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [, setShowModal] = useState(false);

  // Show modal if user is logged in but has no username
  const needsUsername = user && !user.username;
  
  // Show KYC modal if user has username but hasn't completed KYC
  const needsKYC = user && user.username && user.kycStatus === 'not_started';

  return (
    <>
      {needsUsername && (
        <UsernameSetupModal
          open={true}
          onSuccess={() => {
            setShowModal(false);
            window.location.reload(); // Reload to update user data
          }}
        />
      )}
      {needsKYC && (
        <KYCSetupModal
          open={true}
          onSuccess={() => {
            setShowModal(false);
            window.location.reload(); // Reload to update user data
          }}
        />
      )}
      {children}
    </>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/event/:slug" component={EventDetailPage} />
      <Route path="/market/:id" component={MarketDetailPage} />
      <Route path="/polymarket/:slug" component={PolymarketDetailPage} />
      <Route path="/wallet/deposit" component={DepositPage} />
      
      {/* Protected Routes */}
      <ProtectedRoute path="/portfolio" component={PortfolioPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MetaMaskProvider>
          <UsernameGuard>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </UsernameGuard>
        </MetaMaskProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
