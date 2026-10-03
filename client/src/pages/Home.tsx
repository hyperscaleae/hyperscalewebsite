/* HyperScale Signal / Scale direction: editorial dark field, precise cobalt structure, mint conversion signals, and interaction that turns every section into a measurable next move. */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation, useParams } from "wouter";
import { EnquiryForm } from "@/components/EnquiryForm";
import { useLocale } from "@/contexts/LocaleContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronRight, CircleDot, Globe2, Mail, Menu, MessageCircle, Moon, PhoneCall, Sun, X } from "lucide-react";

const heroImage = "/manus-storage/hyperscale-hero-h-transparent-clean_8574ddfd.png";
const markImage = "/brand/hyperscale-h.png";
const fullLogoImage = "/brand/hyperscale-logo.png";
const serviceImages = {
  performance: "/manus-storage/hyperscale-service-performance_9c93e907.png",
  growth: "/manus-storage/hyperscale-service-growth_57f30cef.png",
  ai: "/manus-storage/hyperscale-service-ai_4b378d2e.png",
  experience: "/manus-storage/hyperscale-service-experience_cbf20a08.png",
  creative: "/manus-storage/hyperscale-service-creative_ecf69f9c.png",
  ecommerce: "/manus-storage/hyperscale-service-ecommerce_fac3ddef.png",
};
const caseImages = {
  food: "/manus-storage/hyperscale-case-food_18d5029a.png",
  digital: "/manus-storage/hyperscale-case-digital_53fbf943.png",
  retail: "/manus-storage/hyperscale-case-retail_1a6762f7.png",
  alora: "/manus-storage/alora-restored_69b64102.png",
  leaders: "/manus-storage/leaders-restored_e8e42c91.png",
  alkhalil: "/manus-storage/al-khalil-hero_f1285839.png",
  bricks: "/manus-storage/bricks-hero_0ae816b5.png",
  zyva: "/manus-storage/zyva-hero_8ef6788f.png",
};

// The recovered project did not include its /manus-storage files. Show an
// honest text treatment until approved local images replace those references.
function SiteImage({ src, alt, loading }: { src: string; alt: string; loading?: "lazy" }) {
  if (src.startsWith("/manus-storage/")) {
    return <span className="missing-site-image" role="img" aria-label={`${alt}; image pending`}>{alt}<small>Image pending</small></span>;
  }
  return <img src={src} alt={alt} loading={loading} />;
}

const clients = ["Al Khalil Group", "Alora Media", "Alora 360", "Habboba", "Leaders Care AU", "Leaders Care GC", "Meat Palace", "Meat Master One", "Tannia Poultry", "Sophia Candles", "Bashayrina Butchery", "Elite Butchery", "G.S Pets", "Emad", "Jerusalem Butchery"];
const clientLogos = [
  { name: "Alora Media", src: "/manus-storage/alora_c79eb901.png" },
  { name: "Habboba", src: "/manus-storage/habboba_d0763366.png" },
  { name: "Bashayerna", src: "/manus-storage/bashayerna_720227f6.png" },
  { name: "High Class", src: "/manus-storage/high-class_90e4604c.png" },
  { name: "Zyva Group", src: "/manus-storage/zyva_ee37e6fd.png" },
  { name: "Meat Palace", src: "/manus-storage/meat-palace_095b6868.png" },
  { name: "Gourmet", src: "/manus-storage/gourmet_e9b9010f.png" },
  { name: "Sophia Candles", src: "/manus-storage/sophia_14ad97ce.png" },
  { name: "Al Khalil", src: "/manus-storage/al-khalil_8d5caf55.png" },
];

const stages = [
  ["01", "Strategy", "Find the commercial signal before you buy the media."],
  ["02", "Creative", "Build ideas that earn attention and make value legible."],
  ["03", "Acquisition", "Deploy the right channel mix with a clear job to do."],
  ["04", "Conversion", "Remove friction from landing page to checkout."],
  ["05", "Analytics", "Measure the levers that move the business forward."],
  ["06", "Optimization", "Turn every test into a sharper next decision."],
  ["07", "Scale", "Increase what works without losing the economics."],
];

const cases = [
  { title: "Alora Media", tag: "Integrated Events & Experiential", market: "UAE", image: caseImages.alora, index: "01", description: "End-to-end digital transformation for a leading UAE experiential agency.", url: "https://aloramedia.ae/" },
  { title: "Leaders Care GC", tag: "Healthcare & Accessibility Solutions", market: "UAE", image: caseImages.leaders, index: "02", description: "Comprehensive digital catalog and positioning for a leader in accessibility and healthcare fit-outs.", url: "https://leaderscaregc.com/" },
  { title: "Al Khalil Foods", tag: "Food Wholesale & Retail", market: "UAE", image: caseImages.alkhalil, index: "03", description: "E-commerce storefront and growth system for a premier regional food distributor.", url: "https://alkhalilfoods.ae/" },
  { title: "Zyva Solutions", tag: "Financial & Business Services", market: "UAE", image: caseImages.zyva, index: "04", description: "Providing innovative business, financial and general trading solutions for the Gulf region.", url: "https://www.zyvasolutions.com/" },
  { title: "Bricks & Stones", tag: "MEP & Construction Solutions", market: "UAE", image: caseImages.bricks, index: "05", description: "High-performance engineering and construction systems for ambitious infrastructure projects.", url: "" },
];

type TestimonialSlot = { company: string; speaker: string; role: string; quote: string; logoText: string };
const testimonialSlots: TestimonialSlot[] = [
  { company: "Client story 01", speaker: "Verified quote pending", role: "Add client name & role", quote: "Your approved client quote will live here.", logoText: "CLIENT LOGO" },
  { company: "Client story 02", speaker: "Verified quote pending", role: "Add client name & role", quote: "Your approved client quote will live here.", logoText: "CLIENT LOGO" },
  { company: "Client story 03", speaker: "Verified quote pending", role: "Add client name & role", quote: "Your approved client quote will live here.", logoText: "CLIENT LOGO" },
];

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { locale, toggleLocale, t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  useEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("reveal-visible");
    }), { threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [location]);
  const closeMenu = () => setOpen(false);
  const links = [
    [t("Work", "أعمالنا"), "/work"],
    [t("Services", "خدماتنا"), "/services"],
    [t("Insights", "رؤى"), "/insights"],
    [t("About", "من نحن"), "/about"],
  ];
  return <div className="site-shell">
    <header className="topbar"><div className="topbar-inner">
      <Link href="/" className="brand" onClick={closeMenu} aria-label={t("HyperScale home", "العودة إلى الرئيسية")}><img src={markImage} alt="" /><span><strong>HYPERSCALE</strong><small>Marketing</small></span></Link>
      <nav className={open ? "nav-open" : ""} aria-label={t("Main navigation", "القائمة الرئيسية")}>{links.map(([label, href]) => <Link key={href} href={href} onClick={closeMenu} aria-current={location === href ? "page" : undefined}>{label}</Link>)}<Link href="/contact" className="nav-expert" onClick={closeMenu}>{t("Start a project", "ابدأ مشروعك")} <ArrowUpRight size={16} /></Link></nav>
      <button className="menu-button" type="button" aria-label={open ? t("Close menu", "إغلاق القائمة") : t("Open menu", "فتح القائمة")} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? <X /> : <Menu />}</button>
    </div></header>
    <aside className="side-tools" aria-label={t("Display options", "خيارات العرض")}>
      <button type="button" onClick={toggleLocale} aria-label={locale === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"} title={locale === "en" ? "العربية" : "English"}>{locale === "en" ? "ع" : "EN"}</button>
      <button type="button" onClick={toggleTheme} aria-label={theme === "dark" ? t("Switch to light mode", "الوضع الفاتح") : t("Switch to dark mode", "الوضع الداكن")} title={theme === "dark" ? t("Light mode", "الوضع الفاتح") : t("Dark mode", "الوضع الداكن")}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
    </aside>
    {children}
    <div className="floating-contact" aria-label={t("Contact HyperScale", "تواصل مع هايبرسكيل")}>
      <a href="https://wa.me/971566997831" target="_blank" rel="noopener noreferrer" aria-label={t("WhatsApp HyperScale", "تواصل عبر واتساب")} title="WhatsApp"><MessageCircle size={20} /></a>
      <a href="tel:+971566997831" aria-label={t("Call HyperScale", "اتصل بهايبرسكيل")} title={t("Call", "اتصل")}><PhoneCall size={19} /></a>
    </div>
  </div>;
}

function SectionEyebrow({ children, number }: { children: ReactNode; number?: string }) { return <div className="eyebrow"><span>{number || "//"}</span><span>{children}</span></div>; }

function HeroForm() { return <EnquiryForm variant="hero" />; }

function CaseCard(item: typeof cases[number]) {
  const isLive = Boolean(item.url);
  return (
    <article className={`case-card case-${item.index}`}>
      <div className="case-laptop-mockup">
        {isLive ? (
          <a className="laptop-screen-link" href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${item.title} website`}>
            <div className="laptop-bezel">
              <div className="laptop-camera" />
              <div className="laptop-screen">
                <SiteImage src={item.image} alt={`${item.title} website screenshot`} loading="lazy" />
              </div>
            </div>
            <div className="laptop-base" />
          </a>
        ) : (
          <div className="laptop-mockup-static">
            <div className="laptop-bezel">
              <div className="laptop-camera" />
              <div className="laptop-screen">
                <SiteImage src={item.image} alt={`${item.title} project visual`} loading="lazy" />
              </div>
            </div>
            <div className="laptop-base" />
          </div>
        )}
      </div>
      <div className="case-info">
        <div>
          <h3>{item.title}</h3>
          <p className="case-tag">{item.tag}</p>
        </div>
        {isLive && (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="case-live-btn">
            <span>Visit Site</span>
            <ArrowUpRight size={14} />
          </a>
        )}
      </div>
      <p className="case-desc">{item.description}</p>
    </article>
  );
}

function CaseStudiesRail() {
  return <section className="case-studies-section reveal" id="case-studies"><div className="case-studies-heading"><div><SectionEyebrow number="03">Case studies</SectionEyebrow><h2>Websites built<br /><em>to move business.</em></h2><p>A focused selection of HyperScale digital experiences, designed to make each brand more useful, visible and commercially ready.</p></div><Link href="/work/websites" className="case-all-link">Browse all websites <ArrowUpRight size={17} /></Link></div><div className="case-study-rail">{cases.map((c) => <CaseCard key={c.title} {...c} />)}</div></section>;
}

function TestimonialsSection() {
  return <section className="testimonials-section reveal" id="project-evidence"><div className="testimonials-heading"><div><SectionEyebrow number="06">Project evidence</SectionEyebrow><h2>Work you can<br /><em>actually explore.</em></h2><p>We keep proof simple: approved clients, visible output, and live projects where a public link is available. No invented praise or unsupported claims.</p></div><Link href="/work/websites" className="case-all-link">View website portfolio <ArrowUpRight size={17} /></Link></div><div className="evidence-grid">{cases.slice(0, 3).map((item) => <article className="evidence-card" key={item.title}><span>0{item.index} / SELECTED PROJECT</span><h3>{item.title}</h3><p>{item.tag}</p>{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer">Explore live website <ArrowUpRight size={15} /></a> : <Link href="/work/websites">View project <ArrowUpRight size={15} /></Link>}</article>)}</div></section>;
}

function LeadForm({ compact = false }: { compact?: boolean }) { return <EnquiryForm variant={compact ? "contact" : "section"} />; }

function TalkGrowthSection() { return <section className="talk-growth-section reveal" id="contact"><div className="talk-growth-intro"><SectionEyebrow number="07">Let’s talk growth</SectionEyebrow><h2>Make the next move<br /><em>more deliberate.</em></h2><p>Leave the details and we’ll come prepared to discuss the opportunity, the constraints and the clearest next step.</p><div className="talk-orbit"><img src={markImage} alt="" /><i>Growth system</i><b>UAE · KSA · GCC</b></div></div><LeadForm /></section>; }

function AdvertisingCases() {
  const adCases = [
    { client: "AL KHALIL FOODS", term: "Verified Presence", problem: "Scaling digital visibility for a premier Abu Dhabi food retail and wholesale group across multiple locations.", goal: "Establish a dominant social presence and catalog accessibility.", solution: "Coordinated content strategy across retail and wholesale segments, focusing on fresh product visibility and location-based engagement.", results: { metric1: ["10.3K", "Followers"], metric2: ["789", "Posts"], metric3: ["Verified", "Social Signal"], metric4: ["Active", "Community"] }, note: "Maintaining an active digital presence for Mussafah and Khalifa City locations with over 10,300 followers and consistent engagement." },
    { client: "HABBOBA O BAS", term: "Verified Presence", problem: "Launching and scaling the digital presence for Riyadh's first Sudanese cloud kitchen and bakery.", goal: "Drive awareness and direct orders through social channels.", solution: "Visual storytelling of authentic Sudanese cuisine, customer reviews integration, and direct-to-order funnel architecture.", results: { metric1: ["1,290", "Followers"], metric2: ["180", "Posts"], metric3: ["Cloud Kitchen", "Signal"], metric4: ["Riyadh", "Presence"] }, note: "Successfully established a niche digital presence for a specialized cloud kitchen, reaching over 1,290 followers during the initial scale phase." }
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const c = adCases[activeIndex];
  const move = (direction: number) => setActiveIndex((current) => (current + direction + adCases.length) % adCases.length);
  return <section className="ad-cases-section reveal" id="advertising"><div className="ad-cases-heading"><div><SectionEyebrow number="08">Advertising cases</SectionEyebrow><h2>Performance that speaks<br /><em>in business results.</em></h2><p>Real campaign data and social presence metrics from verified client engagements. No vanity metrics—just measurable movement.</p></div><div className="ad-case-slider-controls"><span>{String(activeIndex + 1).padStart(2, "0")} / {String(adCases.length).padStart(2, "0")}</span><button type="button" onClick={() => move(-1)} aria-label="Previous advertising case"><ArrowLeft size={17} /></button><button type="button" onClick={() => move(1)} aria-label="Next advertising case"><ArrowRight size={17} /></button></div></div><div className="ad-case-list ad-case-slider"><article className="ad-case-story" key={c.client}><div className="ad-case-visual"><div className="mockup-phone"><div className="mockup-screen"><div className="mockup-insta"><div className="insta-header"><span>{c.client.toLowerCase().replace(/\s+/g, '_')}</span><Menu size={14} /></div><div className="insta-profile"><div className="insta-avatar" /><div className="insta-stats"><span><b>{c.results.metric2[0]}</b>posts</span><span><b>{c.results.metric1[0]}</b>followers</span><span><b>{c.results.metric1[0] === '10.3K' ? '4' : '0'}</b>following</span></div></div><div className="insta-bio"><strong>{c.client}</strong><p>{c.note.split('.')[0]}</p></div><div className="insta-grid">{[1,2,3,4,5,6].map(i => <div key={i} className="insta-square" />)}</div></div></div></div></div><div className="ad-case-content"><div className="ad-case-meta"><span>"{c.client}"</span><strong>{c.term === 'Verified Presence' ? 'SOCIAL SIGNAL' : 'PERFORMANCE CASE'}</strong><small>Status: {c.term}</small></div><div className="ad-case-grid"><div><span>Point A</span><p>{c.problem}</p></div><div><span>Goal</span><p>{c.goal}</p></div><div><span>Solution</span><p>{c.solution}</p></div><div><span>The results</span><p>{c.note}</p></div></div><div className="ad-case-metrics"><div><b>{c.results.metric1[0]}</b><span>{c.results.metric1[1]}</span></div><div><b>{c.results.metric2[0]}</b><span>{c.results.metric2[1]}</span></div><div><b>{c.results.metric3[0]}</b><span>{c.results.metric3[1]}</span></div><div><b>{c.results.metric4[0]}</b><span>{c.results.metric4[1]}</span></div></div></div></article></div></section>;
}

export function HomePage() {
  return <Shell><main><section className="hero"><div className="hero-copy"><SectionEyebrow number="01">Growth systems for ambitious brands</SectionEyebrow><h1>We build growth systems <em>that scale.</em></h1><p className="hero-lede">HyperScale combines performance marketing, creative strategy, AI and digital systems to help ambitious brands grow faster—and smarter.</p><div className="hero-actions"><Link href="/work" className="button button-primary">Explore our work <ArrowUpRight size={17} /></Link><Link href="/contact" className="text-link">Start a conversation <ChevronRight size={16} /></Link></div><div className="hero-foot"><span>Strategy → Execution → Data → Optimization → Scale</span><span>UAE · KSA · AUS · GCC</span></div></div><div className="hero-form-container"><HeroForm /></div></section><section className="marquee"><div>BUILT ACROSS REAL BUSINESSES <span>✳</span> REAL MARKETS <span>✳</span> REAL GROWTH CHALLENGES <span>✳</span> BUILT ACROSS REAL BUSINESSES <span>✳</span></div></section>    <section className="system-section reveal" id="process"><div className="section-intro"><SectionEyebrow number="02">Our Process</SectionEyebrow><h2>Marketing is not a collection of channels. <em>It’s a system.</em></h2><p>Good growth compounds when strategy, creative, acquisition, conversion and data are connected. That’s the layer we build.</p></div><div className="interactive-process">{stages.map(([number, title, copy]) => <div className="process-step" key={number}><div className="process-dot"><span /></div><div className="process-content"><span>Step {number}</span><h3>{title}</h3><p>{copy}</p></div></div>)}</div></section><CaseStudiesRail /><section className="services-band reveal"><div className="section-intro"><SectionEyebrow number="04">What we do</SectionEyebrow><h2>Sharper systems.<br /><em>Stronger outcomes.</em></h2><p>We build the growth systems that ambitious brands need to scale efficiently in modern markets.</p></div><div className="service-grid-premium">{[{ n: "01", t: "Performance Marketing", d: "Paid media, acquisition, funnel architecture, and performance reporting.", i: serviceImages.performance }, { n: "02", t: "Growth Strategy", d: "Strategy, CRO, offers, journeys, and experimental design.", i: serviceImages.growth }, { n: "03", t: "AI & Systems", d: "Automation, research, workflows, and internal leverage.", i: serviceImages.ai }, { n: "04", t: "Digital Experience", d: "High-converting websites and landing pages designed to perform.", i: serviceImages.experience }, { n: "05", t: "Creative Strategy", d: "Concepts, content systems, testing, and creative direction.", i: serviceImages.creative }, { n: "06", t: "E-commerce Growth", d: "Storefront optimization, cart recovery, and revenue-focused digital commerce systems.", i: serviceImages.ecommerce }].map((service) => <div className="service-card-premium" key={service.n}><div className="service-card-image"><SiteImage src={service.i} alt={service.t} /></div><div className="service-card-content"><span>{service.n}</span><h3>{service.t}</h3><p>{service.d}</p><Link href="/services" className="service-card-link">Discover more <ArrowUpRight size={14} /></Link></div></div>)}</div></section><section className="client-section reveal"><div className="client-copy"><SectionEyebrow number="05">Selected client roster</SectionEyebrow><h2>Small team.<br /><em>Real businesses.</em></h2><p>We work across food, retail, e-commerce, professional services, events and healthcare—where growth has to show up in the business.</p></div><div className="client-logo-showcase" aria-label="Selected clients"><div className="client-logo-track client-logo-track-forward">{clientLogos.map((client) => <div className="client-logo-tile" key={`forward-${client.name}`}><SiteImage src={client.src} alt={client.name} /></div>)}</div><div className="client-logo-track client-logo-track-reverse">{[...clientLogos].reverse().map((client) => <div className="client-logo-tile" key={`reverse-${client.name}`}><SiteImage src={client.src} alt={client.name} /></div>)}</div></div></section><TestimonialsSection /><AdvertisingCases /><section className="consultation-banner reveal"><div className="banner-content"><h2>Be Our Success Story</h2><p>Find out more on how we exceeded client expectations.</p></div><Link href="/contact" className="button button-mint">Book A Free Consultation <ArrowUpRight size={17} /></Link></section><TalkGrowthSection /></main><Footer /></Shell>;
}

export function WorkHubPage() {
  const categories = [
    { title: "Performance Marketing", slug: "performance", icon: <ArrowUpRight size={24} /> },
    { title: "Growth Strategy", slug: "strategy", icon: <CircleDot size={24} /> },
    { title: "E-commerce Growth", slug: "ecommerce", icon: <Globe2 size={24} /> },
    { title: "AI & Marketing Systems", slug: "ai-systems", icon: <ChevronRight size={24} /> },
    { title: "Websites & Conversion", slug: "websites", icon: <Globe2 size={24} /> },
    { title: "Creative Strategy", slug: "creative", icon: <MessageCircle size={24} /> },
  ];
  return (
    <Shell>
      <main className="inner-page work-hub">
        <div className="work-hub-intro">
          <SectionEyebrow number="01">Our Proven Impact</SectionEyebrow>
          <div className="work-hub-hero">
            <div className="work-hub-copy">
              <h1>The Proof is in<br /><em>the Growth.</em></h1>
              <p>Explore how HyperScale builds the engines that drive modern business results.</p>
              <p>We don't just execute campaigns; we build integrated growth systems. Our portfolio reflects a relentless focus on finding the commercial signal and scaling it through performance marketing, creative strategy, and technical excellence.</p>
              <p>Across food retail, e-commerce, and professional services, our work stays connected to the bottom line—transforming scattered activity into measurable movement.</p>
              <p><strong>Explore our selected cases by service below.</strong></p>
            </div>
            <div className="work-hub-visual">
              <div className="floating-orbit">
                <div className="orbit-ring" />
                <div className="orbit-ring" />
                <div className="orbit-ring" />
                <img src={markImage} alt="" />
              </div>
            </div>
          </div>
        </div>

        <section className="work-browse">
          <h2>Browse Our Work <em>by Service</em></h2>
          <div className="work-category-grid">
            {categories.map((cat) => cat.slug === "websites" ? (
              <Link key={cat.slug} href="/work/websites" className="work-category-card">
                <span className="cat-icon">{cat.icon}</span>
                <strong>{cat.title}</strong>
              </Link>
            ) : (
              <div key={cat.slug} className="work-category-card work-category-pending">
                <span className="cat-icon">{cat.icon}</span>
                <strong>{cat.title}</strong>
                <small>Project examples pending review</small>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </Shell>
  );
}

export function WorkWebsitesPage() {
  return (
    <Shell>
      <main className="inner-page work-websites">
        <div className="page-header">
          <Link href="/work" className="back-link"><ArrowLeft size={16} /> Back to Portfolio</Link>
          <SectionEyebrow number="01.1">Website Portfolio</SectionEyebrow>
          <h1>Conversion-first<br /><em>Digital Experiences.</em></h1>
          <p className="page-lede">Selected website projects, presented within a high-fidelity visual context and live links to explore the work.</p>
        </div>
        <div className="case-grid full-grid">
          {cases.map((item) => (
            <CaseCard key={item.title} {...item} />
          ))}
        </div>
      </main>
      <Footer />
    </Shell>
  );
}
export function ServicesPage() { const all = [["01", "Performance Marketing", "Paid media, campaign architecture, retargeting, funnel optimization and performance reporting."], ["02", "Growth Strategy", "Customer acquisition, conversion rate optimization, offers, journeys and experiment design."], ["03", "E-commerce Growth", "Product positioning, promotional strategy, landing pages, retention and analytics."], ["04", "AI & Marketing Systems", "AI-assisted content systems, reporting automation, research and internal workflows."], ["05", "Websites & Conversion Experiences", "High-converting websites, landing pages, UX optimization and analytics foundations."], ["06", "Creative Strategy", "Ad creative direction, campaign concepts, content systems and creative testing."]]; return <Shell><main className="inner-page services-page"><SectionEyebrow number="01">Capabilities</SectionEyebrow><h1>One system.<br /><em>Many levers.</em></h1><p className="page-lede">We connect the parts of growth that are usually separated—strategy, media, creative, experience, and the data that tells you what to do next.</p><div className="service-detail-list">{all.map(([number, title, description]) => <div key={number}><span>{number}</span><h2>{title}</h2><p>{description}</p><ArrowUpRight size={20} /></div>)}</div></main><Footer /></Shell>; }
export function AboutPage() { return <Shell><main className="inner-page about-page"><SectionEyebrow number="01">About HyperScale</SectionEyebrow><h1>A compact team<br /><em>with a systems mind.</em></h1><p className="page-lede">HyperScale exists for ambitious brands that are ready to move from scattered marketing activity to a growth system that compounds.</p><div className="about-columns"><div><p>We sit at the intersection of performance marketing, creative execution, technology and commercial strategy. That means fewer handoffs, clearer decisions and work that stays connected to the business.</p><p>Our role is not to make more noise. It is to find the signal, build the right engine around it, and keep improving the system as the market changes.</p></div><div className="principles"><span>01 — Clear thinking</span><span>02 — Useful creativity</span><span>03 — Measured movement</span><span>04 — Relentless iteration</span></div></div></main><Footer /></Shell>; }
export function InsightsPage() { return <Shell><main className="inner-page"><SectionEyebrow number="01">Insights</SectionEyebrow><h1>Insights are<br /><em>in preparation.</em></h1><p className="page-lede">We’ll publish practical notes on growth, creative, and systems when they’re ready.</p><Link href="/contact" className="button button-mint">Start a conversation <ArrowUpRight size={17} /></Link></main><Footer /></Shell>; }
export function ContactPage() { return <Shell><main className="inner-page contact-page"><SectionEyebrow number="01">Start a conversation</SectionEyebrow><h1>Let’s talk<br /><em>growth.</em></h1><p className="page-lede">Share the context and we’ll come prepared to discuss your next stage of growth.</p><LeadForm compact /></main><Footer /></Shell>; }

export function NotFoundPage() { return <Shell><main className="inner-page"><SectionEyebrow number="404">Page not found</SectionEyebrow><h1>This page<br /><em>isn’t here.</em></h1><p className="page-lede">The link may have changed. Return to the homepage or explore our work.</p><Link href="/" className="button button-mint">Go home <ArrowUpRight size={17} /></Link></main><Footer /></Shell>; }

export function PrivacyPage() { return <Shell><main className="inner-page legal-page"><SectionEyebrow number="01">Legal</SectionEyebrow><h1>Privacy Policy</h1><p>Last updated: 29 September 2026. The legal business name and postal address must be confirmed before publication.</p><h2>What we collect</h2><p>When you submit an enquiry, we collect your name, email, phone number, and any company, budget, service, or objective details you provide. We ask for your age only to check whether the enquiry form may be used. It is checked in the browser and on the server, then discarded; it is not included in the enquiry email. We do not create accounts, accept public uploads, or sell personal information through this site.</p><h2>How we use and share it</h2><p>We use enquiry details to respond to your request. Our configured SMTP email provider processes the enquiry to deliver it to our business inbox. The provider’s identity must be inserted here once selected. Our web host necessarily processes requests, including IP addresses and server access data; its identity must also be inserted here once confirmed. We do not send enquiry details to analytics or advertising services.</p><h2>Cookies and external links</h2><p>This site does not currently set analytics, advertising, or session replay cookies. Fonts are hosted on this site. If you choose to open WhatsApp or an external portfolio link, that third party receives your browser request under its own policy. We do not load those services automatically on page view.</p><h2>Retention and your choices</h2><p>Enquiries remain in the receiving mailbox until deleted under the business retention schedule, which the site owner must define. To request access or deletion, email <a href="mailto:hello@hyperscale.marketing">hello@hyperscale.marketing</a>. We may retain information when required by law.</p></main><Footer /></Shell>; }

export function TermsPage() { return <Shell><main className="inner-page legal-page"><SectionEyebrow number="01">Legal</SectionEyebrow><h1>Terms of Use</h1><p>Last updated: 29 September 2026. The site owner must add its verified legal business name, postal address, and governing jurisdiction before publication.</p><h2>Using the site</h2><p>This website describes HyperScale’s services and portfolio. An enquiry does not create a client relationship or guarantee a proposal. Services, deliverables, and fees require a separate written agreement.</p><h2>Content</h2><p>Site text, design, and media belong to their respective rights holders. You may view the site for personal or business evaluation. Do not reproduce its content without permission. If you believe content infringes your copyright, see the <Link href="/copyright">Copyright Policy</Link>.</p><h2>External sites</h2><p>Links to WhatsApp and client or portfolio sites open third-party services. We are not responsible for their content or privacy practices.</p><h2>Contact</h2><p>Questions about these terms can be sent to <a href="mailto:hello@hyperscale.marketing">hello@hyperscale.marketing</a>.</p></main><Footer /></Shell>; }

export function CopyrightPage() { return <Shell><main className="inner-page legal-page"><SectionEyebrow number="01">Legal</SectionEyebrow><h1>Copyright Policy</h1><p>HyperScale does not currently allow visitors to upload or publish content on this website. If you believe material displayed here infringes your copyright, email <a href="mailto:hello@hyperscale.marketing?subject=Copyright%20notice">hello@hyperscale.marketing</a> with the work you own, the exact URL of the material, your contact information, a good-faith statement that the use is unauthorized, a statement under penalty of perjury that the notice is accurate and you are authorized to act, and your physical or electronic signature. We will review complete notices and respond as appropriate.</p><h2>Repeat infringement</h2><p>If visitor publishing is added, we will adopt and reasonably implement a repeat-infringer termination policy, notify users of it, and accommodate standard technical measures where required. Publishing features must not launch before that policy and process are operational.</p><h2>Designated agent</h2><p>No designated DMCA agent is registered for this site in the current code. If visitor uploads or publishing are enabled, the site owner must register an agent with the US Copyright Office and publish the agent’s name, organization, address, phone number, and email here. The current email above is a general copyright contact, not a registered agent.</p></main><Footer /></Shell>; }

function Footer() { return <><footer className="premium-footer"><div className="footer-hero"><Link href="/" className="footer-mark" aria-label="HyperScale home"><img src={fullLogoImage} alt="HyperScale Marketing" /></Link><p>Build. Optimize. Scale.</p><div className="footer-socials"><a href="mailto:hello@hyperscale.marketing" aria-label="Email HyperScale"><Mail size={17} /></a><Link href="/work" aria-label="View our work"><ArrowUpRight size={17} /></Link><Link href="/contact" aria-label="Start a conversation"><Globe2 size={17} /></Link></div></div><div className="footer-rule" /><div className="footer-grid"><div className="footer-column footer-contact"><h3>Contact us</h3><p>Let’s talk about the next stage of growth for your business.</p><a href="mailto:hello@hyperscale.marketing">hello@hyperscale.marketing <ArrowUpRight size={15} /></a><Link href="/contact" className="footer-contact-link">Start a conversation <ArrowUpRight size={15} /></Link></div><div className="footer-column"><h3>Overview</h3><Link href="/about">About HyperScale</Link><Link href="/services">Services</Link><Link href="/work">Our work</Link><Link href="/contact">Contact</Link></div><div className="footer-column"><h3>Growth systems</h3><Link href="/services">Performance marketing</Link><Link href="/services">Growth strategy</Link><Link href="/services">E-commerce growth</Link><Link href="/services">AI &amp; marketing systems</Link><Link href="/services">Digital experience</Link><Link href="/services">Creative strategy</Link></div><div className="footer-column"><h3>Focus markets</h3><span>Food &amp; beverage</span><span>Retail &amp; e-commerce</span><span>Professional services</span><span>Events &amp; experiential</span><span>Healthcare &amp; accessibility</span><span>UAE · KSA · AUS · GCC</span></div></div><div className="footer-bottom"><span>© 2026 HyperScale</span><span>Growth systems for ambitious brands.</span><span><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> · <Link href="/copyright">Copyright / report infringement</Link></span></div></footer></>; }

export default HomePage;

