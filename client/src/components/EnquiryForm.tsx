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
    if (!eligible) return;
    const fields = new FormData(event.currentTarget);
    if (fields.get("website")) return;
    if (available !== true) {
      const message = [
        "Hello HyperScale, I have an enquiry:",
        `Name: ${fields.get("name") || ""}`,
        `Email: ${fields.get("email") || ""}`,
        fields.get("phone") ? `Phone: ${fields.get("phone")}` : "",
        fields.get("service") ? `Service: ${fields.get("service")}` : "",
        fields.get("company") ? `Company: ${fields.get("company")}` : "",
        fields.get("objectives") ? `Message: ${fields.get("objectives")}` : "",
      ].filter(Boolean).join("\n");
      window.location.assign(`https://wa.me/971566997831?text=${encodeURIComponent(message)}`);
      return;
    }
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
    <div className="enquiry-heading"><span className="enquiry-kicker">{t("START A CONVERSATION", "ابدأ محادثة")}</span><h3>{variant === "hero" ? t("Let’s talk growth.", "لنتحدث عن النمو.") : t("Tell us about your project.", "أخبرنا عن مشروعك.")}</h3><p>{t("A few details are enough to get started.", "تكفي بعض التفاصيل لنبدأ الحديث.")}</p></div>
    <div className="age-card">
      <div className="age-card-icon"><ShieldCheck size={20} /></div>
      <div className="age-card-copy"><label htmlFor={ageId}>{t("First, how old are you?", "أولًا، كم عمرك؟")}</label><p>{t("We check your age before asking for contact details. It is not saved.", "نتحقق من عمرك قبل طلب بيانات التواصل ولا نحفظه.")}</p></div>
      <div className="age-input-wrap"><input id={ageId} type="number" min="0" max="120" step="1" inputMode="numeric" autoComplete="off" placeholder={t("Age", "العمر")} value={ageInput} onChange={(event) => setAgeInput(event.target.value)} aria-describedby={`${ageId}-hint`} /><span>{t("years", "سنة")}</span></div>
      <span id={`${ageId}-hint`} className="age-hint">{t("Enter your age to see the form", "أدخل عمرك لعرض النموذج")}</span>
    </div>
    {blocked && <p className="age-blocked" role="alert">{t("This enquiry form isn’t available for the age entered.", "نموذج الاستفسار غير متاح للعمر المدخل.")}</p>}
    {eligible && <div className="enquiry-reveal">
      <div className="enquiry-ready"><Check size={15} /> {t("You can continue", "يمكنك المتابعة")}</div>
      {variant !== "contact" && <ContactRoutes />}
      {available === false && <p className="form-offline" role="status">{t("Your details will open in WhatsApp for you to review and send. Nothing is submitted by this website.", "ستفتح تفاصيلك في واتساب لتراجعها وترسلها بنفسك. لن يرسل هذا الموقع شيئًا.")}</p>}
      {!sent && <form onSubmit={submit}>
        <div className="enquiry-field-grid"><label>{t("Full name", "الاسم الكامل")}<input name="name" type="text" autoComplete="name" required maxLength={100} placeholder={t("Your full name", "اسمك الكامل")} /></label><label>{t("Email address", "البريد الإلكتروني")}<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@company.com" /></label></div>
        <div className="enquiry-field-grid"><label>{t("Phone", "الهاتف")} <span className="optional">{t("optional", "اختياري")}</span><input name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="+971…" /></label><label>{t("What can we help with?", "كيف يمكننا مساعدتك؟")} <span className="optional">{t("optional", "اختياري")}</span><select name="service" defaultValue=""><option value="">{t("Choose a service", "اختر خدمة")}</option>{services.map((service) => <option key={service} value={service}>{service}</option>)}</select></label></div>
        <label>{t("Your message", "رسالتك")}<textarea name="objectives" rows={variant === "hero" ? 3 : 5} required maxLength={3000} placeholder={t("Tell us what you are working on…", "أخبرنا عن مشروعك…")} /></label>
        <label className="privacy-check"><input name="contactConsent" type="checkbox" required /><span>{t("I agree to share these details to discuss my enquiry. Read the", "أوافق على مشاركة هذه التفاصيل لمناقشة استفساري. اقرأ")} <Link href="/privacy">{t("Privacy Policy", "سياسة الخصوصية")}</Link> {t("and", "و")} <Link href="/terms">{t("Terms", "الشروط")}</Link>.</span></label>
        <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-mint enquiry-submit" type="submit" disabled={busy}>{busy ? t("Sending…", "جارٍ الإرسال…") : available === true ? t("Send enquiry", "أرسل الاستفسار") : t("Continue in WhatsApp", "المتابعة في واتساب")}</button>
        <p className="form-reassurance">{available === true ? t("We will reply to your enquiry.", "سنرد على استفسارك.") : t("Review your message in WhatsApp, then tap send there.", "راجع رسالتك في واتساب ثم اضغط إرسال هناك.")}</p>
      </form>}
      {sent && <div className="form-success" role="status"><Check size={20} /><span>{t("Your enquiry was sent. We’ll be in touch as soon as possible.", "تم إرسال استفسارك. سنتواصل معك في أقرب وقت ممكن.")}</span></div>}
    </div>}
  </div>;
}
