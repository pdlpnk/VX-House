export const ACCESS_DRAFT_KEY = "vx-house-access-draft-v1";
export const ACCESS_DRAFT_VERSION = 1;
export const ACCESS_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export type AccessScenario = "player" | "partner";
export type AccessCountry = "turkey" | "azerbaijan";
export type AccessLanguage = "ru" | "tr" | "az";

export type AccessDraft = {
  version: typeof ACCESS_DRAFT_VERSION;
  step: number;
  scenario: AccessScenario | null;
  country: AccessCountry | null;
  language: AccessLanguage | null;
  updatedAt: number;
};

const scenarios: AccessScenario[] = ["player", "partner"];
const countries: AccessCountry[] = ["turkey", "azerbaijan"];
const languages: AccessLanguage[] = ["ru", "tr", "az"];

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && options.includes(value as T);
}

export function parseAccessDraft(raw: string, now = Date.now()): AccessDraft | null {
  const value: unknown = JSON.parse(raw);

  if (!value || typeof value !== "object") return null;

  const draft = value as Partial<AccessDraft>;
  if (
    draft.version !== ACCESS_DRAFT_VERSION ||
    typeof draft.step !== "number" ||
    !Number.isInteger(draft.step) ||
    draft.step < 1 ||
    draft.step > 6 ||
    typeof draft.updatedAt !== "number" ||
    now - draft.updatedAt > ACCESS_DRAFT_TTL_MS ||
    (draft.scenario !== null && !isOneOf(draft.scenario, scenarios)) ||
    (draft.country !== null && !isOneOf(draft.country, countries)) ||
    (draft.language !== null && !isOneOf(draft.language, languages))
  ) {
    return null;
  }

  return draft as AccessDraft;
}

export function getSafeResumeStep(draft: AccessDraft): number {
  if (!draft.scenario) return Math.min(draft.step, 2);
  if (!draft.country || !draft.language) return Math.min(draft.step, 4);
  return Math.min(draft.step, 5);
}

export function createAccessDraft(input: Omit<AccessDraft, "version" | "updatedAt">): AccessDraft {
  return {
    ...input,
    version: ACCESS_DRAFT_VERSION,
    updatedAt: Date.now(),
  };
}
