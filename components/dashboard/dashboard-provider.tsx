"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  DASHBOARD_STORAGE_KEY,
  type DashboardProfile,
  defaultDashboardProfile,
  readDashboardProfile,
} from "@/lib/dashboard-data";

type DashboardContextValue = {
  profile: DashboardProfile;
  updateProfile: (updates: Partial<DashboardProfile>) => void;
  resetProfile: () => void;
  shouldReduceMotion: boolean;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const systemReducedMotion = useReducedMotion();
  const [profile, setProfile] = useState<DashboardProfile>(defaultDashboardProfile);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setProfile(readDashboardProfile()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const persist = useCallback((nextProfile: DashboardProfile) => {
    setProfile(nextProfile);
    window.localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(nextProfile));
  }, []);

  const updateProfile = useCallback(
    (updates: Partial<DashboardProfile>) => {
      setProfile((currentProfile) => {
        const nextProfile = { ...currentProfile, ...updates };
        window.localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(nextProfile));
        return nextProfile;
      });
    },
    [],
  );

  const resetProfile = useCallback(() => {
    persist(defaultDashboardProfile);
  }, [persist]);

  const value = useMemo(
    () => ({
      profile,
      updateProfile,
      resetProfile,
      shouldReduceMotion: systemReducedMotion || profile.reducedMotion,
    }),
    [profile, resetProfile, systemReducedMotion, updateProfile],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard должен использоваться внутри DashboardProvider");
  return context;
}
