export const locales = ["en", "ru", "tr", "az"] as const;
export type Locale = (typeof locales)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "vx-house:locale";
export const LOCALE_COOKIE = "vx_house_locale";

export type LocaleResolutionSource = "profile" | "saved" | "browser" | "fallback";

export type LocaleResolution = Readonly<{
  locale: Locale;
  source: LocaleResolutionSource;
}>;

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

export function languagesFromAcceptLanguage(value: string | null | undefined): readonly string[] {
  if (!value?.trim()) return [];

  return value
    .split(",")
    .map((part, index) => {
      const [tag = "", ...parameters] = part.trim().split(";");
      const qualityParameter = parameters.find((parameter) => parameter.trim().toLowerCase().startsWith("q="));
      const quality = qualityParameter ? Number(qualityParameter.trim().slice(2)) : 1;
      return {
        tag: tag.trim(),
        quality: Number.isFinite(quality) && quality >= 0 && quality <= 1 ? quality : 0,
        index,
      };
    })
    .filter((item) => item.tag && item.tag !== "*" && item.quality > 0)
    .sort((left, right) => right.quality - left.quality || left.index - right.index)
    .map((item) => item.tag);
}

export function resolveLocalePriority(input: {
  profileValue?: unknown;
  savedValue?: unknown;
  browserLanguages?: readonly string[];
}): LocaleResolution {
  const profileLocale = normalizeLocale(input.profileValue);
  if (profileLocale) return { locale: profileLocale, source: "profile" };

  const savedLocale = normalizeLocale(input.savedValue);
  if (savedLocale) return { locale: savedLocale, source: "saved" };

  const browserLanguages = input.browserLanguages ?? [];
  const browserLocale = localeFromBrowser(browserLanguages);
  const hasSupportedBrowserLocale = browserLanguages.some((value) => {
    const language = value.trim().toLowerCase().split("-")[0];
    return language === "tr" || language === "az" || language === "ru" || language === "uk" || language === "en";
  });

  return {
    locale: browserLocale,
    source: hasSupportedBrowserLocale ? "browser" : "fallback",
  };
}

export function resolveInitialLocale(
  storedValue: unknown,
  browserLanguages: readonly string[] | undefined,
): Locale {
  return resolveLocalePriority({ savedValue: storedValue, browserLanguages }).locale;
}

export function toDatabaseLanguage(locale: Locale) {
  return locale.toUpperCase() as "EN" | "RU" | "TR" | "AZ";
}

export function fromDatabaseLanguage(locale: string | null | undefined): Locale {
  return normalizeLocale(locale) ?? DEFAULT_LOCALE;
}
