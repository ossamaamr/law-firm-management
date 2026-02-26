import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import CasEngineDashboard from "./components/CasEngineDashboard";
import ClientsPage from "./pages/ClientsPage";
import CasesPage from "./pages/CasesPage";
import InvoicesPage from "./pages/InvoicesPage";
import MattersPage from "./pages/MattersPage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import AdminApprovalPage from "./pages/AdminApprovalPage";
import ActivityTimelinePage from "./pages/ActivityTimelinePage";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={""} component={CasEngineDashboard} />
      <Route path={"/dashboard"} component={CasEngineDashboard} />
      <Route path={"/login"} component={LoginPage} />
      <Route path={"/signup"} component={SignupPage} />
      <Route path={"/admin/approvals"} component={AdminApprovalPage} />
      <Route path={"/activity"} component={ActivityTimelinePage} />
      <Route path={"/clients"} component={ClientsPage} />
      <Route path={"/cases"} component={CasesPage} />
      <Route path={"/invoices"} component={InvoicesPage} />
      <Route path={"/matters"} component={MattersPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
