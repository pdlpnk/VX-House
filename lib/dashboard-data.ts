export type DashboardPreferences = {
  displayName: string;
  reducedMotion: boolean;
};

export const DASHBOARD_PREFERENCES_KEY = "vx-house-player-dashboard-preferences";

export const defaultDashboardPreferences: DashboardPreferences = {
  displayName: "Демо-профиль",
  reducedMotion: false,
};

function pickDisplayName(value: unknown, fallback: DashboardPreferences) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, 48)
    : fallback.displayName;
}

export function readDashboardPreferences(
  storageKey = DASHBOARD_PREFERENCES_KEY,
  fallback = defaultDashboardPreferences,
): DashboardPreferences {
  if (typeof window === "undefined") return fallback;

  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) return fallback;

    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return fallback;

    const source = parsed as Partial<DashboardPreferences>;
    return {
      displayName: pickDisplayName(source.displayName, fallback),
      reducedMotion:
        typeof source.reducedMotion === "boolean"
          ? source.reducedMotion
          : fallback.reducedMotion,
    };
  } catch {
    return fallback;
  }
}
