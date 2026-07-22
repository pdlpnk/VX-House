import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { ForecastCatalog } from "@/components/forecasts/forecast-catalog";
import type { ForecastView } from "@/lib/platform-operations";

export function PartnerForecastsPage({ forecasts }: { forecasts: ForecastView[] }) {
  return <DashboardPage>
    <DashboardHeading eyebrow="Аналитические материалы" title="Прогнозы" description="Опубликованные материалы с автором, сроком актуальности, историей версии и обязательным предупреждением." action={<StatusPill tone={forecasts.length ? "success" : "neutral"}>{forecasts.length} доступно</StatusPill>} />
    <ForecastCatalog forecasts={forecasts} />
    <Link className={styles.pageBackLink} href="/partner"><ArrowLeft aria-hidden="true" /> Вернуться к обзору</Link>
  </DashboardPage>;
}
