import { ACCESS_PLACEMENTS, ANALYTICS_EVENT_NAMES, type ClientAnalyticsCommand, type FirstTouch, type FirstTouchInput } from "./types";

const CLIENT_EVENT_NAMES = new Set(ANALYTICS_EVENT_NAMES.slice(0, 3));
const SUBID_PATTERN = /^[A-Za-z0-9._~-]{1,255}$/u;
const CLIENT_EVENT_ID_PATTERN = /^[A-Za-z0-9_.:-]{8,160}$/u;

function clean(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > max || /[\u0000-\u001f\u007f]/u.test(normalized)) return null;
  return normalized;
}

export function validKeitaroSubId(value: unknown) {
  const candidate = clean(value, 255);
  return candidate && SUBID_PATTERN.test(candidate) ? candidate : null;
}

export function sanitizeFirstTouch(input: FirstTouchInput | undefined, now = new Date()): FirstTouch {
  const subid = validKeitaroSubId(input?.subid) ?? validKeitaroSubId(input?.clickid);
  const path = clean(input?.landing_path, 512);
  const landingPath = path?.startsWith("/") && !path.startsWith("//") ? path : "/";
  const referrer = clean(input?.referrer, 2048);
  let safeReferrer: string | null = null;
  if (referrer) {
    try {
      const url = new URL(referrer);
      if (["http:", "https:"].includes(url.protocol)) safeReferrer = `${url.origin}${url.pathname}`.slice(0, 2048);
    } catch {}
  }
  return Object.freeze({
    subid,
    utm_source: clean(input?.utm_source, 256),
    utm_medium: clean(input?.utm_medium, 256),
    utm_campaign: clean(input?.utm_campaign, 512),
    utm_content: clean(input?.utm_content, 512),
    utm_term: clean(input?.utm_term, 512),
    referrer: safeReferrer,
    landing_path: landingPath,
    created_at: now.toISOString(),
  });
}

export function validateClientAnalyticsCommand(value: unknown): ClientAnalyticsCommand {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Некорректное событие аналитики");
  const input = value as Record<string, unknown>;
  if (typeof input.eventName !== "string" || !CLIENT_EVENT_NAMES.has(input.eventName as never)) throw new Error("Событие не разрешено");
  const eventName = input.eventName as ClientAnalyticsCommand["eventName"];
  const clientEventId = typeof input.clientEventId === "string" && CLIENT_EVENT_ID_PATTERN.test(input.clientEventId) ? input.clientEventId : undefined;
  if (eventName === "access_clicked" && !clientEventId) throw new Error("Некорректный идентификатор события");
  const rawMetadata = input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata) ? input.metadata as Record<string, unknown> : {};
  let metadata: Record<string, string> = {};
  if (eventName === "access_clicked") {
    if (typeof rawMetadata.placement !== "string" || !ACCESS_PLACEMENTS.includes(rawMetadata.placement as never)) throw new Error("Некорректное расположение действия");
    metadata = { placement: rawMetadata.placement };
  } else if (eventName === "registration_started") {
    if (rawMetadata.role !== "PLAYER" && rawMetadata.role !== "PARTNER") throw new Error("Некорректная роль");
    metadata = { role: rawMetadata.role };
  }
  const attribution = input.attribution && typeof input.attribution === "object" && !Array.isArray(input.attribution) ? input.attribution as FirstTouchInput : undefined;
  return Object.freeze({ eventName, clientEventId, metadata, attribution });
}

export function isTestIdentity(email: string | null | undefined) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith("@test.invalid") || normalized.endsWith("@vxhouse.local") || normalized.includes("+vx-") || normalized.includes("+smoke");
}

