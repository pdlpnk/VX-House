export type DashboardRole = "player" | "partner";

export type DashboardProfile = {
  name: string;
  email: string;
  role: DashboardRole;
  createdAt: string;
  reducedMotion: boolean;
  demoMode: boolean;
  notificationsEnabled: boolean;
};

export const DASHBOARD_STORAGE_KEY = "vx-house-dashboard";

export const defaultDashboardProfile: DashboardProfile = {
  name: "Алексей",
  email: "alexey@vxhouse.demo",
  role: "player",
  createdAt: "15 июля 2026",
  reducedMotion: false,
  demoMode: true,
  notificationsEnabled: true,
};

export function isDashboardRole(value: unknown): value is DashboardRole {
  return value === "player" || value === "partner";
}

function pickString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readJson(key: string): Record<string, unknown> | null {
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return null;
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export function readDashboardProfile(): DashboardProfile {
  if (typeof window === "undefined") return defaultDashboardProfile;

  const saved = readJson(DASHBOARD_STORAGE_KEY);
  const onboarding = readJson("vx-house-onboarding") ?? readJson("vx-house-access");
  const source = saved ?? onboarding ?? {};
  const storedRole = source.role ?? source.scenario ?? source.selectedScenario;
  const individualRole = window.localStorage.getItem("vx-house-scenario");

  return {
    name: pickString(
      source.name ?? window.localStorage.getItem("vx-house-name"),
      defaultDashboardProfile.name,
    ),
    email: pickString(
      source.email ?? window.localStorage.getItem("vx-house-email"),
      defaultDashboardProfile.email,
    ),
    role: isDashboardRole(storedRole)
      ? storedRole
      : isDashboardRole(individualRole)
        ? individualRole
        : defaultDashboardProfile.role,
    createdAt: pickString(source.createdAt, defaultDashboardProfile.createdAt),
    reducedMotion:
      typeof source.reducedMotion === "boolean"
        ? source.reducedMotion
        : defaultDashboardProfile.reducedMotion,
    demoMode:
      typeof source.demoMode === "boolean"
        ? source.demoMode
        : defaultDashboardProfile.demoMode,
    notificationsEnabled:
      typeof source.notificationsEnabled === "boolean"
        ? source.notificationsEnabled
        : defaultDashboardProfile.notificationsEnabled,
  };
}

export function roleLabel(role: DashboardRole) {
  return role === "partner" ? "Партнёр VX House" : "Участник VX House";
}

export function roleShortLabel(role: DashboardRole) {
  return role === "partner" ? "Партнёр" : "Игрок";
}
