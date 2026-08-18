"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { ForecastCatalog } from "@/components/forecasts/forecast-catalog";
import type { ForecastView } from "@/lib/platform-operations";
import { useI18n } from "@/components/i18n/i18n-provider";
import { workspaceContent } from "@/lib/i18n/workspace-content";

export function PartnerForecastsPage({ forecasts }: { forecasts: ForecastView[] }) {
  const { locale } = useI18n(); const copy = workspaceContent[locale].partner.forecasts;
  return <DashboardPage>
    <DashboardHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.description} action={<StatusPill tone={forecasts.length ? "success" : "neutral"}>{copy.count.replace("{count}", String(forecasts.length))}</StatusPill>} />
    <ForecastCatalog forecasts={forecasts} />
    <Link className={styles.pageBackLink} href="/partner"><ArrowLeft aria-hidden="true" /> {copy.back}</Link>
  </DashboardPage>;
}
