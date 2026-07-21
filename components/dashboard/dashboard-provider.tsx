"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  DASHBOARD_PREFERENCES_KEY,
  type DashboardPreferences,
  defaultDashboardPreferences,
  readDashboardPreferences,
} from "@/lib/dashboard-data";

type DashboardContextValue = {
  preferences: DashboardPreferences;
  updatePreferences: (updates: Partial<DashboardPreferences>) => void;
  resetPreferences: () => void;
  shouldReduceMotion: boolean;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  children,
  storageKey = DASHBOARD_PREFERENCES_KEY,
  defaultPreferences = defaultDashboardPreferences,
}: {
  children: React.ReactNode;
  storageKey?: string;
  defaultPreferences?: DashboardPreferences;
}) {
  const systemReducedMotion = useReducedMotion();
  const [preferences, setPreferences] = useState<DashboardPreferences>(defaultPreferences);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setPreferences(readDashboardPreferences(storageKey, defaultPreferences));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [defaultPreferences, storageKey]);

  const updatePreferences = useCallback((updates: Partial<DashboardPreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...updates };
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    window.localStorage.removeItem(storageKey);
  }, [defaultPreferences, storageKey]);

  const value = useMemo(
    () => ({
      preferences,
      updatePreferences,
      resetPreferences,
      shouldReduceMotion: systemReducedMotion || preferences.reducedMotion,
    }),
    [preferences, resetPreferences, systemReducedMotion, updatePreferences],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard должен использоваться внутри DashboardProvider");
  return context;
}
