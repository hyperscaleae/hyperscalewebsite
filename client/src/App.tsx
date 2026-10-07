import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, lazy, Suspense } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocaleProvider, useLocale } from "./contexts/LocaleContext";
import { CopyrightPage, PrivacyPage, TermsPage } from "./pages/Legal";
import { ExperienceAboutPage, ExperienceContactPage, ExperienceHomePage, ExperienceInsightPage, ExperienceInsightsPage, ExperienceNotFoundPage, ExperienceProjectPage, ExperienceServicePage, ExperienceServicesPage, ExperienceWorkPage } from "./pages/Experience";
const Studio = lazy(() => import("./pages/AgencyWorkspace"));
const ClientPortal = lazy(() => import("./pages/AgencyWorkspace").then(module => ({default:module.ClientPortal})));
import { FeedbackPage, InquiryPage } from "./pages/WorkflowForms";

const pageMeta: Record<string, [string, string]> = {
  "/": ["HyperScale — Growth Systems for Ambitious Brands", "HyperScale builds growth systems through strategy, creative, performance marketing, and digital experiences."],
  "/work": ["Our Work | HyperScale", "Explore HyperScale's website portfolio and service areas."],
  "/work/websites": ["Website Portfolio | HyperScale", "Explore selected public websites featured in HyperScale's portfolio."],
  "/services": ["Services | HyperScale", "Explore performance marketing, growth strategy, websites, creative, and systems services."],
  "/about": ["About | HyperScale", "Learn about HyperScale's approach to connected growth systems."],
  "/insights": ["Insights | HyperScale", "Practical notes on websites, marketing and growth."],
  "/contact": ["Contact | HyperScale", "Send HyperScale an enquiry about your next stage of growth."],
  "/inquiry": ["Project enquiry | HyperScale", "Tell HyperScale about your business and project."],
  "/feedback": ["Client feedback | HyperScale", "Share feedback about your HyperScale project."],
  "/dashboard": ["Studio dashboard | HyperScale", "Your private HyperScale agency workspace."],
  "/portal": ["Client portal | HyperScale", "Your private HyperScale project workspace."],
  "/privacy": ["Privacy Policy | HyperScale", "Read how HyperScale handles website enquiries and visitor data."],
  "/terms": ["Terms of Use | HyperScale", "Read the terms for using the HyperScale website."],
  "/copyright": ["Copyright Policy | HyperScale", "Read the copyright notice process for the HyperScale website."],
};

function PageMetadata() {
  const [location] = useLocation();
  const { locale } = useLocale();
  useEffect(() => {
    const [title, description] = pageMeta[location] ?? (location.startsWith("/work/") ? ["Project | HyperScale", "Explore a selected HyperScale project and its public website."] : location.startsWith("/insights/") ? ["Insight | HyperScale", "Read a practical HyperScale insight."] : ["Page | HyperScale", "Explore HyperScale services and work."]);
    const arabicTitles: Record<string, string> = { "/": "هايبرسكيل | التسويق والتجربة الرقمية", "/work": "أعمالنا | هايبرسكيل", "/work/websites": "المواقع | هايبرسكيل", "/services": "الخدمات | هايبرسكيل", "/about": "من نحن | هايبرسكيل", "/insights": "رؤى | هايبرسكيل", "/contact": "تواصل معنا | هايبرسكيل", "/privacy": "سياسة الخصوصية | هايبرسكيل", "/terms": "شروط الاستخدام | هايبرسكيل", "/copyright": "حقوق النشر | هايبرسكيل" };
    document.title = locale === "ar" ? arabicTitles[location] ?? "هايبرسكيل" : title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", locale === "ar" ? "مواقع وتسويق وأنظمة تساعد الشركات على اتخاذ خطوتها التالية." : description);
  }, [location, locale]);
  useEffect(() => {
    // Client-side routes otherwise inherit the previous page's scroll position.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={ExperienceHomePage} />
      <Route path="/work" component={ExperienceWorkPage} />
      <Route path="/work/websites" component={ExperienceWorkPage} />
      <Route path="/work/:slug" component={ExperienceProjectPage} />
      <Route path="/services" component={ExperienceServicesPage} />
      <Route path="/services/:slug" component={ExperienceServicePage} />
      <Route path="/about" component={ExperienceAboutPage} />
      <Route path="/insights" component={ExperienceInsightsPage} />
      <Route path="/insights/:slug" component={ExperienceInsightPage} />
      <Route path="/contact" component={ExperienceContactPage} />
      <Route path="/inquiry" component={InquiryPage} />
      <Route path="/feedback" component={FeedbackPage} />
      <Route path="/dashboard" component={Studio} />
      <Route path="/portal" component={ClientPortal} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/copyright" component={CopyrightPage} />
      <Route component={ExperienceNotFoundPage} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <LocaleProvider>
        <TooltipProvider>
          <PageMetadata />
          <Toaster />
          <Suspense fallback={<div role="status" style={{padding:32}}>Loading…</div>}><Router /></Suspense>
        </TooltipProvider>
        </LocaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
