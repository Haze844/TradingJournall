import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";

import NotFound from "@/pages/not-found";
// import Home from "@/pages/Home";
import SimpleHome from "@/pages/SimpleHome";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import PersonalCoach from "@/components/PersonalCoach";
import MacroEconomicCalendar from "@/components/MacroEconomicCalendar";
import SocialTrading from "@/components/SocialTrading";
import Booklet from "@/components/Booklet";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={SimpleHome} />
      <ProtectedRoute path="/coach" component={PersonalCoach} />
      <ProtectedRoute path="/calendar" component={MacroEconomicCalendar} />
      <ProtectedRoute path="/social" component={SocialTrading} />
      <ProtectedRoute path="/booklet" component={Booklet} />
      <Route path="/auth" component={AuthPage} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
