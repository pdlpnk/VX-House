import { intlLocales, type Locale } from "./config";

export type DateTimeFormatOverrides = { timeZone?: string };

export function parseServerTimestamp(value: string | Date): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatLocalTime(locale: Locale, value: string | Date, overrides: DateTimeFormatOverrides = {}) {
  const date = parseServerTimestamp(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(intlLocales[locale], {
    hour: "2-digit",
    minute: "2-digit",
    ...overrides,
  }).format(date);
}

export function formatLocalDateTime(locale: Locale, value: string | Date, overrides: DateTimeFormatOverrides = {}) {
  const date = parseServerTimestamp(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(intlLocales[locale], {
    dateStyle: "medium",
    timeStyle: "short",
    ...overrides,
  }).format(date);
}

function localDateKey(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function isLocalToday(value: string | Date, now = new Date(), overrides: DateTimeFormatOverrides = {}) {
  const date = parseServerTimestamp(value);
  return Boolean(date && localDateKey(date, overrides.timeZone) === localDateKey(now, overrides.timeZone));
}

export function formatLocalDay(
  locale: Locale,
  value: string | Date,
  todayLabel: string,
  now = new Date(),
  overrides: DateTimeFormatOverrides = {},
) {
  const date = parseServerTimestamp(value);
  if (!date) return "—";
  if (isLocalToday(date, now, overrides)) return todayLabel;
  return new Intl.DateTimeFormat(intlLocales[locale], {
    day: "numeric",
    month: "long",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
    ...overrides,
  }).format(date);
}
