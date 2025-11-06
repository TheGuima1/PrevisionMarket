// Code based on javascript_auth_all_persistance blueprint
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { UsernameSetupModal } from "@/components/username-setup-modal";
import { useState } from "react";
import HomePage from "@/pages/home-page";
import MarketDetailPage from "@/pages/market-detail-page";
import PortfolioPage from "@/pages/portfolio-page";
import AdminPage from "@/pages/admin-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

function UsernameGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [, setShowModal] = useState(false);

  // Show modal if user is logged in but has no username
  const needsUsername = user && !user.username;

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
      {children}
    </>
  );
}

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/market/:id" component={MarketDetailPage} />
      <ProtectedRoute path="/portfolio" component={PortfolioPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UsernameGuard>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </UsernameGuard>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
