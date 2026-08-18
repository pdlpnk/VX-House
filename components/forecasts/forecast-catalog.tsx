"use client";

import { ChartNoAxesCombined, Clock3, ShieldAlert, UserRound } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";
import { StatusPill } from "@/components/dashboard/dashboard-ui";
import { Card } from "@/components/ui/card";
import type { ForecastView } from "@/lib/platform-operations";
import { useI18n } from "@/components/i18n/i18n-provider";
import { intlLocales } from "@/lib/i18n";
import { workspaceContent } from "@/lib/i18n/workspace-content";

export function ForecastCatalog({ forecasts }: { forecasts: ForecastView[] }) {
  const { locale } = useI18n(); const copy = workspaceContent[locale].partner.forecasts;
  if (!forecasts.length) return <section className={styles.activityEmpty}><div className={styles.emptyStateIcon}><ChartNoAxesCombined aria-hidden="true" /></div><small>{copy.none}</small><h2>{copy.empty}</h2><p>{copy.emptyHelp}</p></section>;

  return <div className={styles.forecastCatalog}>{forecasts.map((forecast) => <Card key={`${forecast.id}:${forecast.version}`} className={styles.forecastCard}>
    <header><span><ChartNoAxesCombined aria-hidden="true" /></span><div><small>{forecast.accessReason}</small><h2>{forecast.title}</h2><p>{forecast.summary}</p></div><StatusPill tone="success">{copy.published}</StatusPill></header>
    <div className={styles.forecastBody}>{forecast.body}</div>
    {forecast.context.length ? <ul>{forecast.context.map((item) => <li key={item}>{item}</li>)}</ul> : null}
    <dl><div><dt><UserRound aria-hidden="true" /> {copy.author}</dt><dd>{forecast.author}</dd></div><div><dt>{copy.version}</dt><dd>{forecast.version}</dd></div><div><dt><Clock3 aria-hidden="true" /> {copy.validUntil}</dt><dd>{new Intl.DateTimeFormat(intlLocales[locale], { dateStyle: "medium", timeStyle: "short" }).format(new Date(forecast.validUntil))}</dd></div></dl>
    <div className={styles.emptyDisclosure}><ShieldAlert aria-hidden="true" /><span>{forecast.disclaimer}</span></div>
  </Card>)}</div>;
}
