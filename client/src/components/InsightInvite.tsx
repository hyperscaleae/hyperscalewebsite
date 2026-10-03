import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { X } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

const seenKey = "hyperscale-insight-invite-seen";
const pendingKey = "hyperscale-insight-invite-pending";

export function InsightInvite() {
  const [location] = useLocation();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const show = () => {
      previousFocus.current = document.activeElement as HTMLElement;
      setOpen(true);
      try { sessionStorage.setItem(seenKey, "1"); sessionStorage.removeItem(pendingKey); } catch { /* Optional storage. */ }
    };
    const onManualOpen = () => show();
    window.addEventListener("hyperscale:open-insights", onManualOpen);
    let pending = false;
    try { pending = sessionStorage.getItem(pendingKey) === "1"; } catch { /* Optional storage. */ }
    if (pending) { show(); return () => window.removeEventListener("hyperscale:open-insights", onManualOpen); }
    if (location !== "/") return () => window.removeEventListener("hyperscale:open-insights", onManualOpen);

    let seen = false;
    try { seen = sessionStorage.getItem(seenKey) === "1"; } catch { /* Optional storage. */ }
    if (seen) return () => window.removeEventListener("hyperscale:open-insights", onManualOpen);

    let ready = false;
    const onFirstClick = (event: MouseEvent) => {
      window.removeEventListener("click", onFirstClick, true);
      window.removeEventListener("scroll", onScroll);
      const href = (event.target as HTMLElement).closest("a[href]")?.getAttribute("href");
      if (href?.startsWith("/") && href !== location && !href.startsWith("/#")) {
        try { sessionStorage.setItem(pendingKey, "1"); } catch { show(); }
        return;
      }
      show();
    };
    const onScroll = () => {
      if (ready && window.scrollY > window.innerHeight * 1.6) {
        window.removeEventListener("click", onFirstClick, true);
        window.removeEventListener("scroll", onScroll);
        show();
      }
    };
    const timer = window.setTimeout(() => { ready = true; onScroll(); }, 7000);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("click", onFirstClick, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("click", onFirstClick, true);
      window.removeEventListener("hyperscale:open-insights", onManualOpen);
    };
  }, [location]);

  useEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const dialog = closeRef.current?.closest("[role=dialog]");
        const links = dialog?.querySelectorAll<HTMLElement>("button, a[href]");
        if (!links?.length) return;
        const first = links[0], last = links[links.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus();
    };
  }, [open]);

  if (!open) return null;
  return <div className="xp-invite-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
    <section className="xp-invite" role="dialog" aria-modal="true" aria-labelledby="xp-invite-title">
      <div className="xp-invite-art" aria-hidden="true"><img src="/brand/hyperscale-h.png" alt="" /><span>HYPERSCALE / INSIGHTS</span></div>
      <div className="xp-invite-copy">
        <button ref={closeRef} className="xp-invite-close" type="button" onClick={() => setOpen(false)} aria-label={t("Close", "إغلاق")}><X size={25} /></button>
        <span className="xp-eyebrow">{t("A note from HyperScale", "ملاحظة من هايبرسكيل")}</span>
        <h2 id="xp-invite-title">{t("Ideas worth using.", "أفكار تستحق التطبيق.")}</h2>
        <p>{t("A short collection of practical ideas on websites, marketing and clearer decisions.", "مجموعة قصيرة من الأفكار العملية عن المواقع والتسويق والقرارات الأوضح.")}</p>
        <Link href="/insights" className="xp-invite-action" onClick={() => setOpen(false)}>{t("Explore insights", "استكشف الرؤى")}</Link>
      </div>
    </section>
  </div>;
}
