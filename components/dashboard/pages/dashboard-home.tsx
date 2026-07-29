"use client";

import { ArrowRight, Award, Bell, CheckCircle2, ClipboardList, Gift, Headphones, History, Route } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardCard, DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import type { EconomySnapshotView } from "@/lib/economy";
import type { ActivityEventView, PromocodeView, WorkspaceSummary } from "@/lib/platform-operations";
import type { ForecastView } from "@/lib/platform-operations";

const quickAccess = [
  { title: "Доступные задания", description: "Выберите следующий шаг и ознакомьтесь с условиями.", icon: ClipboardList, href: "/dashboard/opportunities" },
  { title: "VX Rewards", description: "Ваши доступные преимущества и бонусы.", icon: Gift, href: "/dashboard/rewards" },
  { title: "Персональный менеджер", description: "Напишите напрямую — вся история останется в одном разговоре.", icon: Headphones, href: "/dashboard/support" },
] as const;

const activityLabels = { TASK: "Задание", POINTS: "VX Points", RANK: "Уровень", REWARD: "Награда", SUPPORT: "Messenger", NOTIFICATION: "Уведомление", PROMOCODE: "Промокод" } as const;

export function DashboardHome({ economy, summary, activity }: { economy: EconomySnapshotView; summary: WorkspaceSummary; activity: ActivityEventView[]; forecasts: ForecastView[]; promocodes: PromocodeView[] }) {
  const { profile } = useDashboard();
  const visibleActivity = activity.filter((item) => item.category !== "TRUST").slice(0, 4);
  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Главная"
        title={`Здравствуйте, ${profile?.user.displayName ?? "игрок"}`}
        description="Здесь собраны ваши актуальные задания, события и быстрые действия."
        action={<StatusPill tone="success"><CheckCircle2 aria-hidden="true" /> Профиль активен</StatusPill>}
      />

      <section className={styles.playerHero}>
        <div className={styles.heroCopy}>
          <span className={styles.heroEyebrow}><Route aria-hidden="true" /> Следующий шаг</span>
          <h2>{summary.recommended?.title ?? "Выберите первое задание"}</h2>
          <p>{summary.recommended?.description ?? "Откройте список доступных заданий, чтобы увидеть условия и награды до начала выполнения."}</p>
          <Button asChild size="lg"><Link href={summary.recommended?.href ?? "/dashboard/opportunities"}>Посмотреть задания <ArrowRight aria-hidden="true" /></Link></Button>
        </div>
        <div className={styles.heroStatus} aria-label="Краткая информация">
          <div><span>Активные задания</span><strong>{summary.activeTasks}</strong></div>
          <div><span>Доступные награды</span><strong>{summary.rewards}</strong></div>
          <div><span>VX Points</span><strong>{economy.points.confirmedBalance}</strong></div>
        </div>
      </section>

      <DashboardGrid className={styles.homeSimpleGrid}>
        <DashboardGridItem>
          <DashboardCard icon={ClipboardList} label="Сейчас" title="Активные задания" action={<StatusPill tone={summary.activeTasks ? "attention" : "neutral"}>{summary.activeTasks}</StatusPill>}>
            <div className={styles.homeTaskSummary}>
              <strong>{summary.activeTasks ? "Продолжите начатое" : "Можно начать новое"}</strong>
              <p>{summary.activeTasks ? "Все активные задания и их текущие статусы находятся в одном разделе." : "Выберите подходящее задание и заранее ознакомьтесь с условиями."}</p>
              <Link href="/dashboard/opportunities">Открыть задания <ArrowRight aria-hidden="true" /></Link>
            </div>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem>
          <DashboardCard icon={History} label="Последние изменения" title="Недавние события" action={<Link className={styles.cardTextLink} href="/dashboard/activity">Вся история</Link>}>
            {visibleActivity.length ? <ol className={styles.homeActivityList}>{visibleActivity.map((event) => <li key={event.id}><span><Bell aria-hidden="true" /></span><div><small>{activityLabels[event.category as keyof typeof activityLabels] ?? "Событие"}</small><strong>{event.title}</strong><time dateTime={event.occurredAt}>{new Intl.DateTimeFormat("ru", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(event.occurredAt))}</time></div></li>)}</ol> : <div className={styles.homeActivityEmpty}><Award aria-hidden="true" /><strong>История только начинается</strong><p>Здесь появятся задания, начисления и новые преимущества.</p></div>}
          </DashboardCard>
        </DashboardGridItem>
      </DashboardGrid>

      <section className={styles.quickAccessSection} aria-labelledby="quick-access-title">
        <div><small>Быстрый доступ</small><h2 id="quick-access-title">Всё важное рядом</h2></div>
        <div className={styles.quickAccessGrid}>{quickAccess.map(({ title, description, icon: Icon, href }) => <Link key={href} href={href}><span><Icon aria-hidden="true" /></span><div><strong>{title}</strong><p>{description}</p></div><ArrowRight aria-hidden="true" /></Link>)}</div>
      </section>
    </DashboardPage>
  );
}
