import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AboutPage, ContactPage, CopyrightPage, HomePage, InsightsPage, NotFoundPage, PrivacyPage, ServicesPage, TermsPage, WorkHubPage, WorkWebsitesPage } from "./pages/Home";

const pageMeta: Record<string, [string, string]> = {
  "/": ["HyperScale — Growth Systems for Ambitious Brands", "HyperScale builds growth systems through strategy, creative, performance marketing, and digital experiences."],
  "/work": ["Our Work | HyperScale", "Explore HyperScale's website portfolio and service areas."],
  "/work/websites": ["Website Portfolio | HyperScale", "Explore selected public websites featured in HyperScale's portfolio."],
  "/services": ["Services | HyperScale", "Explore performance marketing, growth strategy, websites, creative, and systems services."],
  "/about": ["About | HyperScale", "Learn about HyperScale's approach to connected growth systems."],
  "/insights": ["Insights | HyperScale", "HyperScale insights are in preparation."],
  "/contact": ["Contact | HyperScale", "Send HyperScale an enquiry about your next stage of growth."],
  "/privacy": ["Privacy Policy | HyperScale", "Read how HyperScale handles website enquiries and visitor data."],
  "/terms": ["Terms of Use | HyperScale", "Read the terms for using the HyperScale website."],
  "/copyright": ["Copyright Policy | HyperScale", "Read the copyright notice process for the HyperScale website."],
};

function PageMetadata() {
  const [location] = useLocation();
  useEffect(() => {
    const [title, description] = pageMeta[location] ?? ["Page not found | HyperScale", "The requested HyperScale page could not be found."];
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [location]);
  return null;
}

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
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/copyright" component={CopyrightPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <PageMetadata />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
