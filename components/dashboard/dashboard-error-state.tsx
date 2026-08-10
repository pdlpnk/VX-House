"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";

export function DashboardErrorState({ reset }: { reset: () => void }) {
  const { t } = useI18n();
  return (
    <main
      className="flex min-h-[60vh] items-center justify-center px-6 py-16"
      id="main-content"
    >
      <section
        className="w-full max-w-xl rounded-[var(--radius-xl)] border border-white/10 bg-white/[0.035] p-8 text-center shadow-2xl shadow-black/20"
        role="alert"
      >
        <p className="text-sm text-[var(--color-text-muted)]">{t("error.temporary")}</p>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--color-text-primary)]">
          {t("error.dashboardTitle")}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[var(--color-text-secondary)]">
          {t("error.dashboardText")}
        </p>
        <Button className="mt-7" onClick={reset}>
          <RotateCcw aria-hidden="true" />
          {t("error.retry")}
        </Button>
      </section>
    </main>
  );
}
