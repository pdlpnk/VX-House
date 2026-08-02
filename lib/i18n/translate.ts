import { DEFAULT_LOCALE, intlLocales, type Locale } from "./config";
import { dictionaries, type MessageKey } from "./messages";

export type TranslationValues = Readonly<Record<string, string | number>>;

export function translate(locale: Locale, key: MessageKey, values: TranslationValues = {}) {
  const template = dictionaries[locale]?.[key] ?? dictionaries[DEFAULT_LOCALE][key] ?? "";
  if (!template && process.env.NODE_ENV === "development") {
    console.warn(`[i18n] Missing translation: ${locale}.${key}`);
  }
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name: string) => String(values[name] ?? ""));
}

export function formatLocalizedNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(intlLocales[locale], options).format(value);
}
