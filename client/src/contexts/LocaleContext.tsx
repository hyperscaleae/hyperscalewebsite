import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type Locale = "en" | "ar";
type LocaleValue = { locale: Locale; toggleLocale: () => void; t: (english: string, arabic: string) => string };

const LocaleContext = createContext<LocaleValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    try { return localStorage.getItem("hyperscale-language") === "ar" ? "ar" : "en"; }
    catch { return "en"; }
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    try { localStorage.setItem("hyperscale-language", locale); } catch { /* Storage can be disabled. */ }
  }, [locale]);

  return <LocaleContext.Provider value={{ locale, toggleLocale: () => setLocale(value => value === "en" ? "ar" : "en"), t: (english, arabic) => locale === "ar" ? arabic : english }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}
