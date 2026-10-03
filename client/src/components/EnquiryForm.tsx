import { ArrowUpRight, Check, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "wouter";

type Variant = "hero" | "section" | "contact";

const services = ["Website or landing page", "Growth strategy", "Performance marketing", "Creative", "AI and automation", "Not sure yet"];

function parseAge(value: string): number | null {
  if (!/^\d{1,3}$/.test(value)) return null;
  const age = Number(value);
  return Number.isInteger(age) && age >= 0 && age <= 120 ? age : null;
}

function ContactRoutes() {
  return <div className="contact-routes" aria-label="Other ways to enquire">
    <a href="https://wa.me/971566997831" target="_blank" rel="noopener noreferrer"><MessageCircle size={19} /><span><strong>Chat on WhatsApp</strong><small>Open a conversation</small></span><ArrowUpRight size={16} /></a>
    <a href="mailto:hello@hyperscale.marketing?subject=HyperScale%20enquiry"><Mail size={19} /><span><strong>Send an email</strong><small>Use your email app</small></span><ArrowUpRight size={16} /></a>
  </div>;
}

export function EnquiryForm({ variant }: { variant: Variant }) {
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
        throw new Error("We couldn't deliver the form right now. Please use WhatsApp or email below.");
      }
      setSent(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "We couldn't deliver the form right now.");
    } finally {
      setBusy(false);
    }
  }

  return <div className={`enquiry-card enquiry-card-${variant} ${variant === "hero" ? "hero-form-card" : "growth-form"}`}>
    <div className="enquiry-heading"><span className="enquiry-kicker">START A CONVERSATION</span><h3>{variant === "hero" ? "Let’s talk growth." : "Tell us what you need."}</h3><p>One quick question, then choose the easiest way to reach us.</p></div>
    <div className="age-card">
      <div className="age-card-icon"><ShieldCheck size={20} /></div>
      <div className="age-card-copy"><span>STEP 01 / 02</span><label htmlFor={ageId}>How old are you?</label><p>We ask before collecting any contact details. Your age is checked and discarded.</p></div>
      <div className="age-input-wrap"><input id={ageId} type="number" min="0" max="120" step="1" inputMode="numeric" autoComplete="off" placeholder="Age" value={ageInput} onChange={(event) => setAgeInput(event.target.value)} aria-describedby={`${ageId}-hint`} /><span>years</span></div>
      <span id={`${ageId}-hint`} className="age-hint">Enter your age to continue</span>
    </div>
    {blocked && <p className="age-blocked" role="alert">This enquiry form isn’t available for the age entered.</p>}
    {eligible && <div className="enquiry-reveal">
      <div className="enquiry-ready"><Check size={15} /> Age check complete <span>STEP 02 / 02</span></div>
      <ContactRoutes />
      {available === false && <div className="form-offline" role="status"><strong>The website form is being connected.</strong><span>You can use the WhatsApp or email links above while we connect it. We won’t ask you to fill out a form that cannot deliver.</span></div>}
      {available === null && <p className="form-checking" role="status">Checking the enquiry form…</p>}
      {available === true && !sent && <form onSubmit={submit}>
        <div className="enquiry-field-grid"><label>What should we call you?<input name="name" type="text" autoComplete="name" required maxLength={100} placeholder="Your name" /></label><label>What’s your email?<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@company.com" /></label></div>
        <div className="enquiry-field-grid"><label>Phone <span className="optional">optional</span><input name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="+971…" /></label><label>What can we help with? <span className="optional">optional</span><select name="service" defaultValue=""><option value="">Choose a service</option>{services.map((service) => <option key={service} value={service}>{service}</option>)}</select></label></div>
        {variant !== "hero" && <label>Company <span className="optional">optional</span><input name="company" type="text" autoComplete="organization" maxLength={120} placeholder="Your company" /></label>}
        <label>Tell us a little about your project <span className="optional">optional</span><textarea name="objectives" rows={variant === "hero" ? 2 : 3} maxLength={3000} placeholder="A sentence or two is enough." /></label>
        <label className="privacy-check"><input name="contactConsent" type="checkbox" required /><span>I agree to be contacted about this enquiry. Read the <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms</Link>.</span></label>
        <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-mint enquiry-submit" type="submit" disabled={busy}>{busy ? "Sending…" : "Send my enquiry"} <ArrowUpRight size={17} /></button>
        <p className="form-reassurance">No account. No mailing list. Just a reply to your enquiry.</p>
      </form>}
      {sent && <div className="form-success" role="status"><Check size={20} /><span>Your enquiry was sent. We’ll be in touch as soon as possible.</span></div>}
    </div>}
  </div>;
}
