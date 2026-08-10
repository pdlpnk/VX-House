"use client";

import { ArrowRight, Award, Compass, Info, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { OpportunityStatusBadge } from "@/components/opportunities/opportunity-status";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { OpportunityView } from "@/lib/opportunities/types";
import { cn } from "@/lib/utils";

export function OpportunityCatalog({ role, basePath, initialItems }: { role: "PLAYER" | "PARTNER"; basePath: string; initialItems: OpportunityView[] }) {
  const { t } = useI18n();
  const typeLabels = { TASK: t("opportunity.task"), INSTRUCTION: t("opportunity.instruction"), PROMOCODE: t("opportunity.promocode"), FORECAST: t("opportunity.forecast"), PERSONAL_CONDITION: t("opportunity.personalCondition") } as const;
  const copy = { PLAYER: { eyebrow: t("opportunity.playerEyebrow"), title: t("opportunity.playerTitle"), description: t("opportunity.playerDescription") }, PARTNER: { eyebrow: t("opportunity.partnerEyebrow"), title: t("opportunity.partnerTitle"), description: t("opportunity.partnerDescription") } } as const;
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPending(true); setError(null);
      try {
        const params = new URLSearchParams(); if (search.trim()) params.set("search", search.trim()); if (type) params.set("type", type);
        const response = await fetch(`/api/opportunities?${params}`, { credentials: "same-origin", cache: "no-store", signal: controller.signal });
        const body = await response.json() as { items?: OpportunityView[]; message?: string };
        if (!response.ok) throw new Error(body.message ?? t("opportunity.updateError"));
        setItems(body.items ?? []);
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : t("opportunity.updateError")); }
      finally { if (!controller.signal.aborted) setPending(false); }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [search, t, type]);

  const texts = copy[role];
  return <DashboardPage>
    <DashboardHeading eyebrow={texts.eyebrow} title={texts.title} description={texts.description} action={<StatusPill tone="brand">{t("opportunity.availableCount", { count: items.length })}</StatusPill>} />
    <section className={styles.opportunityCatalogIntro}><span><Sparkles aria-hidden="true" /></span><div><small>{t("opportunity.selected")}</small><h2>{t("opportunity.conditionsTitle")}</h2><p>{t("opportunity.conditionsText")}</p></div></section>
    <div className={styles.opportunityFilters} role="search" aria-label={t("opportunity.searchAria")}>
      <label><span>{t("opportunity.search")}</span><div className={styles.inputWrap}><Search aria-hidden="true" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("opportunity.searchPlaceholder")} /></div></label>
      <label><span>{t("opportunity.type")}</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="">{t("opportunity.allTypes")}</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <StatusPill tone={pending ? "attention" : "neutral"}>{pending ? t("opportunity.updating") : t("opportunity.found", { count: items.length })}</StatusPill>
    </div>
    {error ? <p className={styles.systemDisclosure} role="alert"><Info aria-hidden="true" />{error}</p> : null}
    {items.length ? <DashboardGrid className={styles.opportunityList}>{items.map((item) => <DashboardGridItem key={item.id}><Card className={styles.opportunityCard}>
      <div className={styles.opportunityCardTopline}><span>{typeLabels[item.type]}</span><OpportunityStatusBadge status={item.availability} /></div>
      <div className={styles.opportunityCardCopy}><small>{item.type === "TASK" ? t("opportunity.vxTask") : typeLabels[item.type]}</small><h2>{item.title}</h2><p>{item.description}</p></div>
      {item.task?.possibleRewardDescription ? <div className={styles.opportunityReward}><Award aria-hidden="true" /><div><span>{t("opportunity.reward")}</span><strong>{item.task.possibleRewardDescription}</strong></div></div> : null}
      <div className={styles.opportunityNextStep}><span>{t("opportunity.next")}</span><p>{item.nextStep}</p></div>
      <Link className={cn(buttonVariants({ variant: "outline" }), styles.opportunityDetailsLink)} href={`${basePath}/${item.id}`}>{t("opportunity.details")} <ArrowRight aria-hidden="true" /></Link>
    </Card></DashboardGridItem>)}</DashboardGrid> : <Card className={styles.noDataPanel}><Compass aria-hidden="true" /><h2>{t("opportunity.emptyTitle")}</h2><p>{t("opportunity.emptyText")}</p></Card>}
    {error ? null : <p className={styles.catalogHint}><Info aria-hidden="true" />{t("opportunity.automatic")}</p>}
  </DashboardPage>;
}
