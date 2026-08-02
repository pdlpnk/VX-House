"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";

import {
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  resolveInitialLocale,
  translate,
  type Locale,
  type LocaleResolutionSource,
  type MessageKey,
  type TranslationValues,
} from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, values?: TranslationValues) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function persistLocale(nextLocale: Locale) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
  document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

export function I18nProvider({
  children,
  initialLocale,
  initialSource,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
  initialSource: LocaleResolutionSource;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useLayoutEffect(() => {
    if (initialSource === "profile" || initialSource === "saved") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, initialLocale);
      document.documentElement.lang = initialLocale;
      return;
    }

    const stored = normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
    const resolved = resolveInitialLocale(stored, window.navigator.languages);
    document.documentElement.lang = resolved;
    if (stored) persistLocale(stored);
    if (resolved !== initialLocale) {
      let active = true;
      queueMicrotask(() => {
        if (active) setLocaleState(resolved);
      });
      return () => { active = false; };
    }
  }, [initialLocale, initialSource]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    persistLocale(nextLocale);
    document.documentElement.lang = nextLocale;
    window.dispatchEvent(new CustomEvent("vx-house:locale-change", { detail: nextLocale }));
  }, []);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    t: (key, values) => translate(locale, key, values),
  }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
