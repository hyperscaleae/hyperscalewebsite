import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AboutPage, ContactPage, HomePage, InsightsPage, ServicesPage, WorkHubPage, WorkWebsitesPage } from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/work" component={WorkHubPage} />
      <Route path="/work/websites" component={WorkWebsitesPage} />
      <Route path="/services" component={ServicesPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/insights" component={InsightsPage} />
      <Route path="/contact" component={ContactPage} />
      <Route component={HomePage} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
