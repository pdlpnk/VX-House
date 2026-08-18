"use client";

import { ArrowLeft, BadgeCheck, BookOpenCheck, CalendarClock, ShieldCheck, Tag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardCard, DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { OpportunityStatusBadge } from "@/components/opportunities/opportunity-status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { OpportunityView } from "@/lib/opportunities/types";

export function OpportunityDetail({ opportunity, basePath, taskBasePath }: { opportunity: OpportunityView | null; basePath: string; taskBasePath: string }) {
  const { locale, t } = useI18n();
  const typeLabels = { TASK: t("opportunity.task"), INSTRUCTION: t("opportunity.instruction"), PROMOCODE: t("opportunity.promocode"), FORECAST: t("opportunity.forecast"), PERSONAL_CONDITION: t("opportunity.personalCondition") } as const;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!opportunity) return <DashboardPage><DashboardHeading eyebrow={t("opportunity.playerEyebrow")} title={t("task.unavailableTitle")} description={t("task.unavailableText")} action={<OpportunityStatusBadge status="NO_DATA" />} /><Card className={styles.noDataPanel}><ShieldCheck aria-hidden="true" /><h2>{t("task.cardUnavailable")}</h2><p>{t("task.chooseAnother")}</p></Card><Link className={styles.pageBackLink} href={basePath}><ArrowLeft aria-hidden="true" /> {t("task.back")}</Link></DashboardPage>;

  async function accept() {
    setPending(true); setError(null);
    try {
      const response = await fetch(`/api/opportunities/${opportunity!.id}/accept`, { method: "POST", credentials: "same-origin", headers: { "Idempotency-Key": crypto.randomUUID() } });
      const body = await response.json() as { id?: string; message?: string };
      if (!response.ok || !body.id) throw new Error(t("task.startError"));
      window.location.assign(`${taskBasePath}/${body.id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("task.startError")); setPending(false); }
  }

  const instruction = opportunity.task?.instruction ?? opportunity.instruction;
  return <DashboardPage>
    <DashboardHeading eyebrow={t("task.eyebrow")} title={opportunity.title} description={opportunity.description} action={<OpportunityStatusBadge status={opportunity.availability} />} />
    <section className={styles.opportunityDetailHero}><div><span>{t("task.nextStep")}</span><h2>{opportunity.nextStep}</h2><p>{opportunity.availability === "AVAILABLE" ? t("task.availableProfile") : opportunity.availabilityReason}</p></div><Button onClick={accept} disabled={pending || opportunity.availability !== "AVAILABLE" || !opportunity.task}>{pending ? t("task.opening") : t("task.start")}</Button></section>
    {error ? <p className={styles.systemDisclosure} role="alert">{error}</p> : null}
    <DashboardGrid className={styles.opportunityDetailGrid}>
      <DashboardGridItem className={styles.opportunityFactsItem}><DashboardCard label={t("task.brief")} title={t("task.about")} icon={Tag}><dl className={styles.opportunityFacts}><div><dt><Tag aria-hidden="true" /> {t("task.format")}</dt><dd>{typeLabels[opportunity.type]}</dd></div><div><dt><BadgeCheck aria-hidden="true" /> {t("task.status")}</dt><dd><OpportunityStatusBadge status={opportunity.availability} /></dd></div></dl></DashboardCard></DashboardGridItem>
      <DashboardGridItem className={styles.opportunityNextItem}><DashboardCard label={t("task.deadline")} title={t("task.when")} icon={CalendarClock}><p className={styles.detailLead}>{opportunity.task?.availableUntil ? t("task.until", { date: new Date(opportunity.task.availableUntil).toLocaleDateString(locale) }) : t("task.noDeadline")}</p><p className={styles.detailHint}>{t("task.conditionsBelow")}</p></DashboardCard></DashboardGridItem>
    </DashboardGrid>
    {opportunity.task ? <DashboardGrid className={styles.futureSlotsGrid}><DashboardGridItem><RequirementCard title={t("task.requirements")} items={opportunity.task.requirements} emptyText={t("task.noExtraConditions")} /></DashboardGridItem><DashboardGridItem><RequirementCard title={t("task.limitations")} items={opportunity.task.limitations} emptyText={t("task.noExtraConditions")} /></DashboardGridItem>{opportunity.task.possibleRewardDescription ? <DashboardGridItem><RequirementCard title={t("task.reward")} items={[opportunity.task.possibleRewardDescription]} emptyText={t("task.noExtraConditions")} /></DashboardGridItem> : null}</DashboardGrid> : null}
    <Card className={styles.futureSlot}><div><span><BookOpenCheck aria-hidden="true" /></span><StatusPill tone={instruction ? "success" : "neutral"}>{instruction ? t("task.ready") : t("task.noData")}</StatusPill></div><h2>{instruction?.title ?? t("task.instruction")}</h2><p>{instruction?.summary ?? t("task.noInstruction")}</p>{instruction?.sections.map((section) => <section key={section.id} className={styles.opportunityNextStep}><span>{section.title}</span><p>{section.body}</p></section>)}{instruction?.steps.map((step) => <div key={step.id} className={styles.opportunityNextStep}><span>{step.position}. {step.title}</span><p>{step.body}</p></div>)}</Card>
    <div className={styles.detailActions}><Link className={styles.pageBackLink} href={basePath}><ArrowLeft aria-hidden="true" /> {t("task.back")}</Link></div>
  </DashboardPage>;
}

function RequirementCard({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return <Card className={styles.futureSlot}><h2>{title}</h2>{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>{emptyText}</p>}</Card>;
}
