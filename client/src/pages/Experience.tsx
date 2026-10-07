import { useRef } from "react";
import { Link, useParams } from "wouter";
import { MessageCircle, PhoneCall } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { EnquiryForm } from "@/components/EnquiryForm";
import { Shell } from "./Home";
import "./experience.css";

const projects = [
  { slug: "alora-media", name: "Alora Media", category: "Events & digital experience", categoryAr: "الفعاليات والتجربة الرقمية", logo: "/projects/alora-logo.webp", screen: "/projects/alora.jpg", url: "https://aloramedia.ae/", focus: "A clearer route from the agency's services and portfolio to a new enquiry.", focusAr: "تسهيل الانتقال من خدمات الوكالة وأعمالها إلى التواصل معها.", context: "An events, advertising and production agency in Abu Dhabi.", contextAr: "وكالة للفعاليات والإعلان والإنتاج في أبوظبي." },
  { slug: "leaders-care", name: "Leaders Care GC", category: "Healthcare & accessibility", categoryAr: "الرعاية الصحية وإمكانية الوصول", logo: "/projects/leaders-logo.jpg", screen: "/projects/leaders.jpg", url: "https://leaderscaregc.com/", focus: "Presenting a broad range of construction and accessibility services in a navigable website.", focusAr: "عرض خدمات البناء وإمكانية الوصول المتنوعة في موقع سهل التصفح.", context: "A UAE general contracting company with healthcare and accessibility services.", contextAr: "شركة مقاولات عامة في الإمارات تقدم خدمات للرعاية الصحية وإمكانية الوصول." },
  { slug: "al-khalil-foods", name: "Al Khalil Foods", category: "Food retail & e-commerce", categoryAr: "تجارة الأغذية والتسوق الإلكتروني", logo: "/projects/alkhalil-logo.webp", screen: "", url: "https://alkhalilfoods.ae/", focus: "Connecting product discovery, store information and online shopping.", focusAr: "ربط اكتشاف المنتجات بمعلومات المتاجر والتسوق عبر الإنترنت.", context: "A food retailer and wholesaler serving Abu Dhabi.", contextAr: "شركة لبيع الأغذية بالتجزئة والجملة في أبوظبي." },
  { slug: "zyva-solutions", name: "Zyva Solutions", category: "Business services", categoryAr: "خدمات الأعمال", logo: "/projects/zyva-logo.png", screen: "/projects/zyva.jpg", url: "https://www.zyvasolutions.com/", focus: "Making its trading, financial and events divisions easy to understand and explore.", focusAr: "توضيح أقسام التجارة والخدمات المالية والفعاليات وتسهيل استكشافها.", context: "A group spanning trading, financial solutions and events.", contextAr: "مجموعة تعمل في التجارة والحلول المالية والفعاليات." },
] as const;

const services = [
  { slug: "websites", name: "Websites & conversion", ar: "المواقع وتحسين التحويل", what: "A site that makes the offer clear and helps visitors take the next step.", whatAr: "موقع يوضح العرض ويساعد الزائر على اتخاذ الخطوة التالية.", deliverables: "Website planning, design, build, landing pages and conversion review.", deliverablesAr: "تخطيط المواقع وتصميمها وبناؤها وصفحات الهبوط ومراجعة التحويل." },
  { slug: "performance", name: "Performance marketing", ar: "التسويق بالأداء", what: "Campaigns tied to a specific audience, action and measurement plan.", whatAr: "حملات مرتبطة بجمهور محدد وإجراء واضح وخطة قياس.", deliverables: "Campaign structure, creative testing, landing pages and reporting.", deliverablesAr: "هيكلة الحملات واختبار المواد الإبداعية وصفحات الهبوط والتقارير." },
  { slug: "strategy", name: "Growth strategy", ar: "استراتيجية النمو", what: "A practical plan for which opportunities to pursue first.", whatAr: "خطة عملية تحدد فرص النمو التي تستحق البدء بها.", deliverables: "Research, positioning, customer journeys and experiment priorities.", deliverablesAr: "البحث والتموضع ورحلات العملاء وتحديد أولويات التجارب." },
  { slug: "commerce", name: "E-commerce growth", ar: "نمو التجارة الإلكترونية", what: "Make product discovery, shopping and repeat purchase easier.", whatAr: "تسهيل اكتشاف المنتجات والشراء والعودة للمتجر.", deliverables: "Storefront review, product journeys, promotions and retention ideas.", deliverablesAr: "مراجعة المتجر ورحلات المنتجات والعروض وأفكار الاحتفاظ بالعملاء." },
  { slug: "creative", name: "Creative systems", ar: "الأنظمة الإبداعية", what: "Consistent messages and assets that can be tested and improved.", whatAr: "رسائل ومواد متسقة يمكن اختبارها وتحسينها.", deliverables: "Campaign concepts, content direction and creative testing.", deliverablesAr: "أفكار الحملات وتوجيه المحتوى واختبار المواد الإبداعية." },
  { slug: "automation", name: "AI & automation", ar: "الذكاء الاصطناعي والأتمتة", what: "Remove repetitive work and make useful information easier to act on.", whatAr: "تقليل العمل المتكرر وتسهيل الاستفادة من المعلومات.", deliverables: "Workflow mapping, reporting automation and internal tools.", deliverablesAr: "رسم سير العمل وأتمتة التقارير والأدوات الداخلية." },
] as const;

const articles = [
  { slug: "website-first-question", title: "The first question your website must answer", titleAr: "أول سؤال يجب أن يجيب عنه موقعك", category: "Websites", categoryAr: "المواقع", intro: "Visitors need to understand what you do, who it is for and what to do next without decoding your headline.", introAr: "يحتاج الزائر إلى فهم ما تقدمه ولمن والخطوة التالية من دون محاولة تفسير العنوان.", points: ["State the offer in plain language above the fold.", "Show relevant work close to the claim it supports.", "Make the next step visible and tell people what happens after they click."], pointsAr: ["اشرح خدمتك بلغة واضحة في بداية الصفحة.", "اعرض العمل المناسب بالقرب من الوعد الذي يدعمه.", "أظهر الخطوة التالية واشرح ما سيحدث بعد الضغط عليها."] },
  { slug: "measure-useful-actions", title: "Measure actions that lead to conversations", titleAr: "قِس الإجراءات التي تقود إلى محادثات", category: "Growth", categoryAr: "النمو", intro: "Traffic is useful context, but a visitor reaching the right page and making contact tells you more.", introAr: "الزيارات مؤشر مفيد، لكن وصول الزائر إلى الصفحة المناسبة وتواصله معك أهم.", points: ["Choose one meaningful action for each page.", "Check whether people can find the answer before they contact you.", "Review enquiries by source and quality, not volume alone."], pointsAr: ["اختر إجراءً مهمًا واحدًا لكل صفحة.", "تأكد من قدرة الزائر على إيجاد الإجابة قبل التواصل.", "راجع الاستفسارات حسب المصدر والجودة، لا العدد فقط."] },
  { slug: "one-change-at-a-time", title: "Improve one bottleneck at a time", titleAr: "حسّن عائقًا واحدًا في كل مرة", category: "Process", categoryAr: "العمل", intro: "A useful growth plan starts by finding the step where people lose confidence or momentum.", introAr: "تبدأ خطة النمو المفيدة بتحديد المرحلة التي يفقد فيها الناس الثقة أو الرغبة في المتابعة.", points: ["Map the journey from first visit to enquiry.", "Pick the most obvious point of friction.", "Change it, measure the effect and keep what works."], pointsAr: ["ارسم رحلة العميل من الزيارة الأولى إلى الاستفسار.", "اختر أوضح نقطة تعيق التقدم.", "غيّرها وقِس الأثر واحتفظ بما ينجح."] },
] as const;

function Eyebrow({ children }: { children: React.ReactNode }) { return <span className="xp-eyebrow">{children}</span>; }
function SectionHeading({ eyebrow, title, accent, copy }: { eyebrow: string; title: string; accent?: string; copy?: string }) { return <div className="xp-section-heading"><Eyebrow>{eyebrow}</Eyebrow><h2>{title} {accent && <em>{accent}</em>}</h2>{copy && <p>{copy}</p>}</div>; }

export function Footer() {
  const { t } = useLocale();
  return <footer className="xp-footer">
    <div className="xp-footer-intro"><div><span className="xp-eyebrow">{t("From the studio", "من الاستوديو")}</span><h2>{t("Make the next move count.", "اجعل الخطوة التالية مؤثرة.")}</h2></div><Link href="/contact" className="xp-footer-cta">{t("Start a conversation", "ابدأ محادثة")}</Link></div>
    <div className="xp-footer-main"><div className="xp-footer-insights"><strong>{t("The useful read", "قراءة مفيدة")}</strong><p>{t("Short ideas for clearer websites and better marketing decisions.", "أفكار قصيرة لمواقع أوضح وقرارات تسويقية أفضل.")}</p><button type="button" onClick={() => window.dispatchEvent(new Event("hyperscale:open-insights"))}>{t("See our insights", "اطلع على رؤانا")}</button></div><div><strong>{t("Explore", "استكشف")}</strong><Link href="/work">{t("Work", "أعمالنا")}</Link><Link href="/services">{t("Services", "خدماتنا")}</Link><Link href="/insights">{t("Insights", "رؤى")}</Link><Link href="/about">{t("About", "من نحن")}</Link><Link href="/inquiry">{t("Project enquiry", "استفسار عن مشروع")}</Link><Link href="/feedback">{t("Client feedback", "ملاحظات العملاء")}</Link></div><div><strong>{t("Contact", "التواصل")}</strong><a href="https://wa.me/971566997831" target="_blank" rel="noopener noreferrer">WhatsApp</a><a href="tel:+971566997831">+971 56 699 7831</a><a href="mailto:hello@hyperscale.marketing">hello@hyperscale.marketing</a></div></div>
    <div className="xp-footer-bottom"><Link href="/" className="xp-footer-brand"><img src="/brand/hyperscale-h.png" alt="" />HYPERSCALE</Link><span>© 2026 HyperScale</span><div><Link href="/privacy">{t("Privacy", "الخصوصية")}</Link><Link href="/terms">{t("Terms", "الشروط")}</Link><Link href="/copyright">{t("Copyright", "حقوق النشر")}</Link></div></div>
  </footer>;
}

function ProjectPreview({ project }: { project: typeof projects[number] }) {
  const { t } = useLocale();
  return <div className={`xp-project-preview ${project.screen ? "has-screen" : "no-screen"}`}>
    {project.screen ? <img src={project.screen} alt={t(`${project.name} public website preview`, `معاينة لموقع ${project.name}`)} loading="lazy" /> : <div className="xp-preview-fallback"><img src={project.logo} alt="" /><span>{t("Live website preview", "معاينة الموقع المباشر")}</span></div>}
  </div>;
}

function ProjectCard({ project }: { project: typeof projects[number] }) {
  const { t } = useLocale();
  return <article className="xp-project-card"><Link href={`/work/${project.slug}`} className="xp-project-image-link" aria-label={t(`View ${project.name} project`, `عرض مشروع ${project.name}`)}><ProjectPreview project={project} /></Link><div className="xp-project-meta"><span>{t(project.category, project.categoryAr)}</span></div><h3><Link href={`/work/${project.slug}`}>{project.name}</Link></h3></article>;
}

function ClientCarousel() {
  const track = useRef<HTMLDivElement>(null);
  const { locale, t } = useLocale();
  const move = (direction: number) => track.current?.scrollBy({ left: (locale === "ar" ? -direction : direction) * 290, behavior: "smooth" });
  return <section className="xp-clients reveal"><div className="xp-client-header"><div><Eyebrow>{t("Selected collaborations", "تعاونات مختارة")}</Eyebrow><h2>{t("Brands we've worked with.", "علامات عملنا معها.")}</h2></div></div><div className="xp-client-track" ref={track}>{projects.map(project => <Link key={project.slug} href={`/work/${project.slug}`} className="xp-client-tile" aria-label={t(`View ${project.name} project`, `عرض مشروع ${project.name}`)}><img src={project.logo} alt={project.name} /><span>{project.name}</span></Link>)}</div><div className="xp-carousel-controls"><button type="button" onClick={() => move(-1)} aria-label={t("Previous clients", "العملاء السابقون")}>{t("Previous", "السابق")}</button><button type="button" onClick={() => move(1)} aria-label={t("Next clients", "العملاء التاليون")}>{t("Next", "التالي")}</button></div></section>;
}

function ContactChoice() {
  const { t } = useLocale();
  return <section className="xp-contact-choice reveal" id="contact"><div><Eyebrow>{t("Have a project in mind?", "هل لديك مشروع؟")}</Eyebrow><h2>{t("Let's make it clear.", "لنبدأ بخطوة واضحة.")}</h2></div><div className="xp-contact-actions"><a href="https://wa.me/971566997831" target="_blank" rel="noopener noreferrer"><MessageCircle size={19} />{t("Chat on WhatsApp", "تواصل عبر واتساب")}</a><a href="tel:+971566997831"><PhoneCall size={19} />{t("Call us", "اتصل بنا")}</a><Link href="/contact">{t("Other contact options", "خيارات تواصل أخرى")}</Link></div></section>;
}

export function ExperienceHomePage() {
  const { t } = useLocale();
  return <Shell><main className="experience">
    <section className="xp-hero"><div><Eyebrow>{t("HyperScale / Marketing & digital experience", "هايبرسكيل / التسويق والتجربة الرقمية")}</Eyebrow><h1>{t("Make your business", "اجعل حضور شركتك")} <em>{t("easier to find, choose and contact.", "أسهل في الوصول والاختيار والتواصل.")}</em></h1><p>{t("We build websites, campaigns and practical systems that turn attention into useful business conversations.", "نبني المواقع والحملات والأنظمة العملية التي تحول الاهتمام إلى فرص تواصل مفيدة لشركتك.")}</p><div className="xp-hero-actions"><Link className="xp-button" href="/work">{t("Explore the work", "استكشف أعمالنا")} </Link><Link className="xp-text-button" href="/contact">{t("Start an enquiry", "ابدأ استفسارًا")} </Link></div><div className="xp-hero-path"><span>{t("Understand the opportunity", "فهم الفرصة")}</span><span>{t("Build the right experience", "بناء التجربة المناسبة")}</span><span>{t("Improve what works", "تحسين ما ينجح")}</span></div></div><Link className="xp-hero-aside" href="/work/alora-media" aria-label={t("View Alora Media project", "عرض مشروع ألورا ميديا")}><img src="/projects/alora.jpg" alt="" /><strong>Alora Media</strong></Link></section>
    <nav className="xp-page-map" aria-label={t("Explore this page", "استكشف الصفحة")}><a href="#what-we-do">{t("What we do", "ماذا نقدم")}</a><a href="#selected-work">{t("Selected work", "أعمال مختارة")}</a><a href="#how-we-work">{t("How we work", "كيف نعمل")}</a><a href="#social-work">{t("Social work", "العمل الاجتماعي")}</a><a href="#contact">{t("Talk to us", "تواصل معنا")}</a></nav>
    <section className="xp-work reveal" id="selected-work"><SectionHeading eyebrow={t("Selected work", "أعمال مختارة")} title={t("Work you can", "أعمال يمكنك")} accent={t("explore.", "استكشافها.")} /><div className="xp-project-grid">{projects.map(project => <ProjectCard key={project.slug} project={project} />)}</div><Link className="xp-inline-link" href="/work">{t("All selected work", "كل الأعمال المختارة")}</Link></section>
    <ClientCarousel />
    <section className="xp-services reveal" id="what-we-do"><SectionHeading eyebrow={t("What we do", "ماذا نقدم")} title={t("What needs to", "ما الذي يحتاج")} accent={t("move forward?", "إلى التقدم؟")} /><div className="xp-service-grid">{services.slice(0,4).map(service => <Link href={`/services/${service.slug}`} className="xp-service-item" key={service.slug}><h3>{t(service.name, service.ar)}</h3><p>{t(service.what, service.whatAr)}</p></Link>)}</div><Link className="xp-inline-link" href="/services">{t("All services", "كل الخدمات")}</Link></section>
    <section className="xp-process reveal" id="how-we-work"><SectionHeading eyebrow={t("Our approach", "طريقتنا")} title={t("Find it. Build it.", "نفهم. نبني.")} accent={t("Make it better.", "ثم نطوّر.")} /><div className="xp-steps">{[[t("Find the bottleneck", "حدد العائق"),t("Where do people lose interest?", "أين يفقد الناس الاهتمام؟")],[t("Build the useful thing", "ابنِ ما يفيد"),t("A focused page, campaign or workflow.", "صفحة أو حملة أو سير عمل محدد.")],[t("Learn and improve", "تعلّم وحسّن"),t("Keep what helps. Change what doesn't.", "احتفظ بما يفيد وغيّر ما لا يفيد.")]].map(([title,copy]) => <div key={title}><h3>{title}</h3><p>{copy}</p></div>)}</div></section>
    <section className="xp-social reveal" id="social-work"><div><SectionHeading eyebrow={t("Social presence", "الحضور الاجتماعي")} title={t("See the actual", "شاهد الصفحة")} accent={t("profile.", "الحقيقية.")} copy={t("The public Al Khalil Foods Instagram account is the clearest way to inspect its current social presence. The profile opens only when you choose to visit it.", "حساب الخليل فودز العام على إنستغرام يتيح لك الاطلاع على حضوره الحالي. لا يفتح الحساب إلا عندما تختار زيارته.")} /><a className="xp-button" href="https://www.instagram.com/alkhalil_foods/" target="_blank" rel="noopener noreferrer">{t("Open @alkhalil_foods", "افتح ‎@alkhalil_foods")} </a></div><a className="xp-social-card" href="https://www.instagram.com/alkhalil_foods/" target="_blank" rel="noopener noreferrer" aria-label={t("Open Al Khalil Foods Instagram profile", "افتح حساب الخليل فودز على إنستغرام")}><img src="/projects/alkhalil-logo.webp" alt="" /><span>@alkhalil_foods</span><strong>{t("Visit the live Instagram page", "زر صفحة إنستغرام المباشرة")}</strong><small>{t("Public profile · Opens in a new tab", "حساب عام · يفتح في تبويب جديد")}</small></a></section>
    <section className="xp-insight-teaser reveal"><SectionHeading eyebrow={t("Insights", "رؤى")} title={t("Ideas you can", "أفكار يمكنك")} accent={t("use now.", "استخدامها الآن.")} /><div className="xp-insight-grid">{articles.map(article => <Link href={`/insights/${article.slug}`} key={article.slug}><span>{t(article.category, article.categoryAr)}</span><h3>{t(article.title, article.titleAr)}</h3><p>{t(article.intro, article.introAr)}</p><strong>{t("Read insight", "اقرأ المقال")} </strong></Link>)}</div></section>
    <ContactChoice />
  </main><Footer /></Shell>;
}

export function ExperienceWorkPage() {
  const { t } = useLocale();
  return <Shell><main className="experience xp-inner"><Link className="xp-back" href="/">{t("Home", "الرئيسية")}</Link><SectionHeading eyebrow={t("Selected work", "أعمال مختارة")} title={t("Real projects,", "مشاريع حقيقية،")} accent={t("clear context.", "وسياق واضح.")} copy={t("Open a project to see what it set out to do and visit its public website. The screenshots were captured from the live sites in October 2026.", "افتح المشروع لتتعرف على هدفه وتزور موقعه العام. التقطنا صور المواقع المباشرة في أكتوبر ٢٠٢٦.")} /><div className="xp-project-grid">{projects.map(project => <ProjectCard key={project.slug} project={project} />)}</div><ClientCarousel /><ContactChoice /></main><Footer /></Shell>;
}

export function ExperienceProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLocale();
  const project = projects.find(item => item.slug === slug);
  if (!project) return <Shell><main className="experience xp-inner"><h1>{t("Project not found", "المشروع غير موجود")}</h1><Link href="/work">{t("Back to work", "العودة إلى الأعمال")}</Link></main><Footer /></Shell>;
  return <Shell><main className="experience xp-inner xp-detail"><Link className="xp-back" href="/work">{t("All work", "جميع الأعمال")}</Link><Eyebrow>{t(project.category, project.categoryAr)}</Eyebrow><h1>{project.name}</h1><div className="xp-detail-grid"><a className="xp-detail-image-link" href={project.url} target="_blank" rel="noopener noreferrer" aria-label={t(`Open ${project.name} live website`, `افتح موقع ${project.name} المباشر`)}><ProjectPreview project={project} /></a><div><span className="xp-detail-label">{t("The focus", "التركيز")}</span><h2>{t(project.focus, project.focusAr)}</h2><p>{t(project.context, project.contextAr)}</p><a className="xp-button" href={project.url} target="_blank" rel="noopener noreferrer">{t("Visit live website", "زر الموقع المباشر")}</a><Link className="xp-inline-link" href="/contact">{t("Discuss a similar project", "ناقش مشروعًا مشابهًا")}</Link></div></div></main><Footer /></Shell>;
}

export function ExperienceServicesPage() {
  const { t } = useLocale();
  return <Shell><main className="experience xp-inner"><SectionHeading eyebrow={t("Services", "الخدمات")} title={t("Choose the problem.", "ابدأ بالتحدي.")} accent={t("We'll shape the work.", "وسنحدد العمل المناسب.")} /><div className="xp-services-list">{services.map(service => <section id={service.slug} key={service.slug}><div><h2><Link href={`/services/${service.slug}`}>{t(service.name, service.ar)}</Link></h2><p>{t(service.what, service.whatAr)}</p><small>{t(service.deliverables, service.deliverablesAr)}</small></div><Link href="/contact" aria-label={t(`Enquire about ${service.name}`, `استفسر عن ${service.ar}`)}>{t("Enquire", "استفسر")}</Link></section>)}</div><ContactChoice /></main><Footer /></Shell>;
}

export function ExperienceServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLocale();
  const service = services.find(item => item.slug === slug);
  if (!service) return <ExperienceServicesPage />;
  return <Shell><main className="experience xp-inner xp-service-detail"><Link className="xp-back" href="/services">{t("All services", "جميع الخدمات")}</Link><Eyebrow>{t("How we can help", "كيف يمكننا المساعدة")}</Eyebrow><h1>{t(service.name, service.ar)}</h1><p className="xp-lede">{t(service.what, service.whatAr)}</p><div className="xp-detail-points"><div><h2>{t("What we can build", "ما يمكننا بناؤه")}</h2><p>{t(service.deliverables, service.deliverablesAr)}</p></div><div><h2>{t("Where we begin", "من أين نبدأ")}</h2><p>{t("Tell us your goal and the biggest obstacle. We'll recommend a focused first step.", "أخبرنا بهدفك وأكبر عائق أمامك. سنقترح خطوة أولى واضحة.")}</p></div></div><ContactChoice /></main><Footer /></Shell>;
}

export function ExperienceAboutPage() {
  const { t } = useLocale();
  return <Shell><main className="experience xp-inner xp-about"><SectionHeading eyebrow={t("About HyperScale", "عن هايبرسكيل")} title={t("A connected view of", "نظرة مترابطة إلى")} accent={t("business growth.", "نمو الأعمال.")} copy={t("HyperScale brings strategy, creative, marketing and digital experience together so the work supports a real commercial goal.", "تجمع هايبرسكيل الاستراتيجية والإبداع والتسويق والتجربة الرقمية لدعم هدف تجاري حقيقي.")} /><div className="xp-detail-points"><div><span>01</span><h2>{t("Clarity first", "الوضوح أولًا")}</h2><p>{t("We start by understanding the audience, the offer and the action the business needs.", "نبدأ بفهم الجمهور والعرض والإجراء الذي تحتاجه الشركة.")}</p></div><div><span>02</span><h2>{t("Work that connects", "عمل مترابط")}</h2><p>{t("A website, campaign and contact journey should support each other, rather than compete for attention.", "ينبغي أن يدعم الموقع والحملة ورحلة التواصل بعضها بعضًا بدل أن تتنافس على الانتباه.")}</p></div><div><span>03</span><h2>{t("Practical improvement", "تحسين عملي")}</h2><p>{t("We use what people actually do to guide the next useful change.", "نستخدم سلوك الزوار الفعلي لتوجيه التغيير المفيد التالي.")}</p></div></div><ContactChoice /></main><Footer /></Shell>;
}

export function ExperienceInsightsPage() {
  const { t } = useLocale();
  return <Shell><main className="experience xp-inner"><SectionHeading eyebrow={t("Insights", "رؤى")} title={t("Practical notes for", "ملاحظات عملية")} accent={t("clearer growth.", "لنمو أوضح.")} copy={t("Short ideas on websites, measurement and the decisions that make marketing more useful.", "أفكار موجزة عن المواقع والقياس والقرارات التي تجعل التسويق أكثر فائدة.")} /><div className="xp-insight-grid">{articles.map(article => <Link href={`/insights/${article.slug}`} key={article.slug}><span>{t(article.category, article.categoryAr)}</span><h3>{t(article.title, article.titleAr)}</h3><p>{t(article.intro, article.introAr)}</p><strong>{t("Read insight", "اقرأ المقال")} </strong></Link>)}</div></main><Footer /></Shell>;
}

export function ExperienceInsightPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLocale();
  const article = articles.find(item => item.slug === slug);
  if (!article) return <ExperienceInsightsPage />;
  return <Shell><main className="experience xp-inner xp-article"><Link className="xp-back" href="/insights">{t("All insights", "جميع المقالات")}</Link><Eyebrow>{t(article.category, article.categoryAr)}</Eyebrow><h1>{t(article.title, article.titleAr)}</h1><p className="xp-lede">{t(article.intro, article.introAr)}</p><div className="xp-article-body">{article.points.map((point,index) => <div key={point}><span>0{index+1}</span><p>{t(point, article.pointsAr[index])}</p></div>)}</div><Link className="xp-inline-link" href="/contact">{t("Discuss your project", "ناقش مشروعك")} </Link></main><Footer /></Shell>;
}

export function ExperienceContactPage() {
  const { t } = useLocale();
  return <Shell><main className="experience xp-inner xp-contact-page"><SectionHeading eyebrow={t("Contact", "تواصل معنا")} title={t("Tell us what", "أخبرنا بما")} accent={t("you have in mind.", "تفكر فيه.")} copy={t("Share a few details or reach us directly. We’ll help you find the right next step.", "شاركنا بعض التفاصيل أو تواصل معنا مباشرة. سنساعدك في تحديد الخطوة المناسبة.")} /><div className="xp-contact-grid"><EnquiryForm variant="contact" /><aside className="xp-contact-direct" aria-label={t("Contact details", "بيانات التواصل")}><a href="https://wa.me/971566997831" target="_blank" rel="noopener noreferrer"><MessageCircle size={22} /><span><strong>WhatsApp</strong><small>{t("Open a chat", "ابدأ محادثة")}</small></span></a><a href="tel:+971566997831"><PhoneCall size={22} /><span><strong>{t("Call us", "اتصل بنا")}</strong><small>+971 56 699 7831</small></span></a><a href="mailto:hello@hyperscale.marketing"><span><strong>{t("Email us", "راسلنا بالبريد")}</strong><small>hello@hyperscale.marketing</small></span></a><div className="xp-contact-note"><strong>{t("Based in the UAE", "مقرنا في الإمارات")}</strong><p>{t("Working with businesses across the region.", "نعمل مع الشركات في أنحاء المنطقة.")}</p></div></aside></div></main><Footer /></Shell>;
}

export function ExperienceNotFoundPage() {
  const { t } = useLocale();
  return <Shell><main className="experience xp-inner"><Eyebrow>404</Eyebrow><h1>{t("This page isn't here.", "هذه الصفحة غير موجودة.")}</h1><p className="xp-lede">{t("The link may have changed. Return home or explore our work.", "ربما تغير الرابط. عد إلى الرئيسية أو استكشف أعمالنا.")}</p><Link className="xp-button" href="/">{t("Go home", "العودة إلى الرئيسية")} </Link></main><Footer /></Shell>;
}
