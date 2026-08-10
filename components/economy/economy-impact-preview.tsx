"use client";

import { Award, CircleGauge, Coins, Route } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useI18n } from "@/components/i18n/i18n-provider";

export function EconomyImpactPreview() {
  const { t } = useI18n();
  const impacts = [{ label: "VX Points", icon: Coins }, { label: "Trust Score", icon: CircleGauge }, { label: t("impact.rank"), icon: Route }, { label: "VX Rewards", icon: Award }] as const;
  return <section className={styles.economyImpactPreview} aria-labelledby="economy-impact-title"><header><small>{t("impact.label")}</small><h3 id="economy-impact-title">{t("impact.title")}</h3><p>{t("impact.description")}</p></header><div>{impacts.map(({ label, icon: Icon }) => <article key={label}><Icon aria-hidden="true" /><span>{label}</span><strong>{t("status.noData")}</strong></article>)}</div></section>;
}
