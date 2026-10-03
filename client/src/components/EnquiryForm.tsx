import { ArrowUpRight, Check, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "wouter";
import { useLocale } from "@/contexts/LocaleContext";

type Variant = "hero" | "section" | "contact";

const services = ["Website or landing page", "Growth strategy", "Performance marketing", "Creative", "AI and automation", "Not sure yet"];

function parseAge(value: string): number | null {
  if (!/^\d{1,3}$/.test(value)) return null;
  const age = Number(value);
  return Number.isInteger(age) && age >= 0 && age <= 120 ? age : null;
}

function ContactRoutes() {
  const { t } = useLocale();
  return <div className="contact-routes" aria-label={t("Other ways to enquire", "طرق أخرى للاستفسار")}>
    <a href="https://wa.me/971566997831" target="_blank" rel="noopener noreferrer"><MessageCircle size={19} /><span><strong>{t("Chat on WhatsApp", "تواصل عبر واتساب")}</strong><small>{t("Open a conversation", "ابدأ محادثة")}</small></span><ArrowUpRight size={16} /></a>
    <a href="mailto:hello@hyperscale.marketing?subject=HyperScale%20enquiry"><Mail size={19} /><span><strong>{t("Send an email", "أرسل بريدًا إلكترونيًا")}</strong><small>{t("Use your email app", "افتح تطبيق البريد")}</small></span><ArrowUpRight size={16} /></a>
  </div>;
}

export function EnquiryForm({ variant }: { variant: Variant }) {
  const { t } = useLocale();
  const [ageInput, setAgeInput] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const ageId = useId();
  const age = parseAge(ageInput);
  const eligible = age !== null && age >= 13;
  const blocked = age !== null && age < 13;

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/enquiries/available", { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : { available: false })
      .then((data) => setAvailable(data.available === true))
      .catch(() => { if (!controller.signal.aborted) setAvailable(false); });
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!eligible || available !== true) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          kind: variant === "hero" ? "hero" : "detailed",
          age,
          name: fields.get("name"),
          email: fields.get("email"),
          phone: fields.get("phone") || undefined,
          company: fields.get("company") || undefined,
          services: fields.get("service") ? [fields.get("service")] : undefined,
          objectives: fields.get("objectives") || undefined,
          contactConsent: fields.get("contactConsent") === "on",
          website: fields.get("website"),
        }),
      });
      if (!response.ok) {
        if (response.status === 503) setAvailable(false);
        throw new Error(t("We couldn't deliver the form right now. Please use WhatsApp or email below.", "تعذر إرسال النموذج الآن. استخدم واتساب أو البريد الإلكتروني أدناه."));
      }
      setSent(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("We couldn't deliver the form right now.", "تعذر إرسال النموذج الآن."));
    } finally {
      setBusy(false);
    }
  }

  return <div className={`enquiry-card enquiry-card-${variant} ${variant === "hero" ? "hero-form-card" : "growth-form"}`}>
    <div className="enquiry-heading"><span className="enquiry-kicker">{t("START A CONVERSATION", "ابدأ محادثة")}</span><h3>{variant === "hero" ? t("Let’s talk growth.", "لنتحدث عن النمو.") : t("Tell us what you need.", "أخبرنا بما تحتاجه.")}</h3><p>{t("One quick question, then choose the easiest way to reach us.", "سؤال سريع واحد، ثم اختر أسهل طريقة للتواصل معنا.")}</p></div>
    <div className="age-card">
      <div className="age-card-icon"><ShieldCheck size={20} /></div>
      <div className="age-card-copy"><span>{t("STEP 01 / 02", "الخطوة ١ / ٢")}</span><label htmlFor={ageId}>{t("How old are you?", "كم عمرك؟")}</label><p>{t("We ask before collecting any contact details. Your age is checked and discarded.", "نسأل قبل جمع أي بيانات اتصال. نتحقق من العمر ثم نتخلص منه.")}</p></div>
      <div className="age-input-wrap"><input id={ageId} type="number" min="0" max="120" step="1" inputMode="numeric" autoComplete="off" placeholder={t("Age", "العمر")} value={ageInput} onChange={(event) => setAgeInput(event.target.value)} aria-describedby={`${ageId}-hint`} /><span>{t("years", "سنة")}</span></div>
      <span id={`${ageId}-hint`} className="age-hint">{t("Enter your age to continue", "أدخل عمرك للمتابعة")}</span>
    </div>
    {blocked && <p className="age-blocked" role="alert">{t("This enquiry form isn’t available for the age entered.", "نموذج الاستفسار غير متاح للعمر المدخل.")}</p>}
    {eligible && <div className="enquiry-reveal">
      <div className="enquiry-ready"><Check size={15} /> {t("Age check complete", "اكتمل التحقق من العمر")} <span>{t("STEP 02 / 02", "الخطوة ٢ / ٢")}</span></div>
      <ContactRoutes />
      {available === false && <div className="form-offline" role="status"><strong>{t("The website form is being connected.", "نعمل على ربط نموذج الموقع.")}</strong><span>{t("You can use the WhatsApp or email links above while we connect it. We won’t ask you to fill out a form that cannot deliver.", "يمكنك استخدام واتساب أو البريد الإلكتروني أعلاه أثناء ربط النموذج. لن نطلب منك ملء نموذج لا يمكنه توصيل رسالتك.")}</span></div>}
      {available === null && <p className="form-checking" role="status">{t("Checking the enquiry form…", "نتحقق من نموذج الاستفسار…")}</p>}
      {available === true && !sent && <form onSubmit={submit}>
        <div className="enquiry-field-grid"><label>{t("What should we call you?", "ما الاسم الذي نناديك به؟")}<input name="name" type="text" autoComplete="name" required maxLength={100} placeholder={t("Your name", "اسمك")} /></label><label>{t("What’s your email?", "ما بريدك الإلكتروني؟")}<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@company.com" /></label></div>
        <div className="enquiry-field-grid"><label>{t("Phone", "الهاتف")} <span className="optional">{t("optional", "اختياري")}</span><input name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="+971…" /></label><label>{t("What can we help with?", "كيف يمكننا مساعدتك؟")} <span className="optional">{t("optional", "اختياري")}</span><select name="service" defaultValue=""><option value="">{t("Choose a service", "اختر خدمة")}</option>{services.map((service) => <option key={service} value={service}>{service}</option>)}</select></label></div>
        {variant !== "hero" && <label>{t("Company", "الشركة")} <span className="optional">{t("optional", "اختياري")}</span><input name="company" type="text" autoComplete="organization" maxLength={120} placeholder={t("Your company", "اسم شركتك")} /></label>}
        <label>{t("Tell us a little about your project", "أخبرنا قليلًا عن مشروعك")} <span className="optional">{t("optional", "اختياري")}</span><textarea name="objectives" rows={variant === "hero" ? 2 : 3} maxLength={3000} placeholder={t("A sentence or two is enough.", "تكفي جملة أو جملتان.")} /></label>
        <label className="privacy-check"><input name="contactConsent" type="checkbox" required /><span>{t("I agree to be contacted about this enquiry. Read the", "أوافق على التواصل معي بشأن هذا الاستفسار. اقرأ")} <Link href="/privacy">{t("Privacy Policy", "سياسة الخصوصية")}</Link> {t("and", "و")} <Link href="/terms">{t("Terms", "الشروط")}</Link>.</span></label>
        <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-mint enquiry-submit" type="submit" disabled={busy}>{busy ? t("Sending…", "جارٍ الإرسال…") : t("Send my enquiry", "أرسل استفساري")} <ArrowUpRight size={17} /></button>
        <p className="form-reassurance">{t("No account. No mailing list. Just a reply to your enquiry.", "لا حساب ولا قائمة بريدية. فقط رد على استفسارك.")}</p>
      </form>}
      {sent && <div className="form-success" role="status"><Check size={20} /><span>{t("Your enquiry was sent. We’ll be in touch as soon as possible.", "تم إرسال استفسارك. سنتواصل معك في أقرب وقت ممكن.")}</span></div>}
    </div>}
  </div>;
}
