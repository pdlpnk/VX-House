export const locales = ["en", "ru", "tr", "az"] as const;
export type Locale = (typeof locales)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "vx-house:locale";
export const LOCALE_COOKIE = "vx_house_locale";

export const localeNames: Readonly<Record<Locale, string>> = {
  en: "English",
  ru: "Русский",
  tr: "Türkçe",
  az: "Azərbaycan dili",
};

export const intlLocales: Readonly<Record<Locale, string>> = {
  en: "en",
  ru: "ru",
  tr: "tr",
  az: "az",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value.toLowerCase() as Locale);
}

export function normalizeLocale(value: unknown): Locale | null {
  return isLocale(value) ? value.toLowerCase() as Locale : null;
}

export function localeFromBrowser(languages: readonly string[] | undefined): Locale {
  for (const value of languages ?? []) {
    const language = value.toLowerCase().split("-")[0];
    if (language === "tr") return "tr";
    if (language === "az") return "az";
    if (language === "ru" || language === "uk") return "ru";
    if (language === "en") return "en";
  }
  return DEFAULT_LOCALE;
}

export function resolveInitialLocale(
  storedValue: unknown,
  browserLanguages: readonly string[] | undefined,
): Locale {
  return normalizeLocale(storedValue) ?? localeFromBrowser(browserLanguages);
}

export function toDatabaseLanguage(locale: Locale) {
  return locale.toUpperCase() as "EN" | "RU" | "TR" | "AZ";
}

export function fromDatabaseLanguage(locale: string | null | undefined): Locale {
  return normalizeLocale(locale) ?? DEFAULT_LOCALE;
}
