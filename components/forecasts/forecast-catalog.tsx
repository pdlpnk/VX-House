import { ChartNoAxesCombined, Clock3, ShieldAlert, UserRound } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";
import { StatusPill } from "@/components/dashboard/dashboard-ui";
import { Card } from "@/components/ui/card";
import type { ForecastView } from "@/lib/platform-operations";

export function ForecastCatalog({ forecasts }: { forecasts: ForecastView[] }) {
  if (!forecasts.length) return <section className={styles.activityEmpty}><div className={styles.emptyStateIcon}><ChartNoAxesCombined aria-hidden="true" /></div><small>Нет доступных публикаций</small><h2>Актуальных прогнозов пока нет</h2><p>Система учитывает подтверждённую роль, рынок, ранг, персональные правила и период публикации.</p></section>;

  return <div className={styles.forecastCatalog}>{forecasts.map((forecast) => <Card key={`${forecast.id}:${forecast.version}`} className={styles.forecastCard}>
    <header><span><ChartNoAxesCombined aria-hidden="true" /></span><div><small>{forecast.accessReason}</small><h2>{forecast.title}</h2><p>{forecast.summary}</p></div><StatusPill tone="success">Опубликован</StatusPill></header>
    <div className={styles.forecastBody}>{forecast.body}</div>
    {forecast.context.length ? <ul>{forecast.context.map((item) => <li key={item}>{item}</li>)}</ul> : null}
    <dl><div><dt><UserRound aria-hidden="true" /> Автор</dt><dd>{forecast.author}</dd></div><div><dt>Версия</dt><dd>{forecast.version}</dd></div><div><dt><Clock3 aria-hidden="true" /> Актуален до</dt><dd>{new Intl.DateTimeFormat("ru", { dateStyle: "medium", timeStyle: "short" }).format(new Date(forecast.validUntil))}</dd></div></dl>
    <div className={styles.emptyDisclosure}><ShieldAlert aria-hidden="true" /><span>{forecast.disclaimer}</span></div>
  </Card>)}</div>;
}
