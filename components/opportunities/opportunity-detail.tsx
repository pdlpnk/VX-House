"use client";

import { ArrowLeft, ArrowRight, BadgeCheck, BookOpenCheck, Gift, MapPin, ShieldCheck, Tag, UserRound } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardCard, DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { OpportunityStatusBadge } from "@/components/opportunities/opportunity-status";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getOpportunity, opportunityRoleLabels, type OpportunityRole } from "@/lib/opportunity-data";

export function OpportunityDetail({ id, role, basePath, taskBasePath }: { id: string; role: OpportunityRole; basePath: string; taskBasePath: string }) {
  const opportunity = getOpportunity(id, role);

  if (!opportunity) {
    return (
      <DashboardPage>
        <DashboardHeading eyebrow="Возможности" title="Нет данных" description="Карточка не найдена или недоступна для выбранной роли." action={<OpportunityStatusBadge status="no-data" />} />
        <Card className={styles.noDataPanel}><ShieldCheck aria-hidden="true" /><h2>Возможность не найдена</h2><p>Вернитесь в каталог и выберите доступную демонстрационную карточку.</p></Card>
        <Link className={styles.pageBackLink} href={basePath}><ArrowLeft aria-hidden="true" /> Вернуться к возможностям</Link>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow="Карточка возможности"
        title={opportunity.title}
        description={opportunity.description}
        action={<OpportunityStatusBadge status={opportunity.status} />}
      />

      <section className={styles.opportunityDetailHero}>
        <div>
          <span>Демонстрационный пример</span>
          <h2>Статус и следующий шаг без ложных обещаний</h2>
          <p>Эта карточка показывает будущую структуру продукта. Возможность не назначена пользователю, а её выполнение не запущено.</p>
        </div>
        <Button disabled aria-describedby="backend-unavailable">Начать действие</Button>
      </section>

      <DashboardGrid className={styles.opportunityDetailGrid}>
        <DashboardGridItem className={styles.opportunityFactsItem}>
          <DashboardCard label="Параметры" title="Область применения" icon={Tag}>
            <dl className={styles.opportunityFacts}>
              <div><dt><UserRound aria-hidden="true" /> Роль</dt><dd>{opportunityRoleLabels[opportunity.role]}</dd></div>
              <div><dt><MapPin aria-hidden="true" /> Рынок</dt><dd>{opportunity.markets.join(" · ")}</dd></div>
              <div><dt><Tag aria-hidden="true" /> Тип</dt><dd>{opportunity.type}</dd></div>
              <div><dt><BadgeCheck aria-hidden="true" /> Статус</dt><dd>{<OpportunityStatusBadge status={opportunity.status} />}</dd></div>
            </dl>
          </DashboardCard>
        </DashboardGridItem>

        <DashboardGridItem className={styles.opportunityNextItem}>
          <DashboardCard label="Навигация" title="Следующий шаг" icon={ArrowRight}>
            <p className={styles.detailLead}>{opportunity.nextStep}</p>
            <p className={styles.detailHint} id="backend-unavailable">Основное действие будет доступно после подключения backend и серверной проверки доступа.</p>
          </DashboardCard>
        </DashboardGridItem>
      </DashboardGrid>

      <DashboardGrid className={styles.futureSlotsGrid}>
        <DashboardGridItem><FutureSlot icon={BookOpenCheck} title="Инструкция" state="Ожидает подключения" description="Актуальная версия, требования и порядок действий появятся из управляемого источника." /></DashboardGridItem>
        <DashboardGridItem><FutureSlot icon={Tag} title="Промокод" state="Нет данных" description="Код, рынок, владелец и срок действия не заданы." /></DashboardGridItem>
        <DashboardGridItem><FutureSlot icon={ShieldCheck} title="Проверка результата" state="Ожидает подключения" description="Здесь появятся формат результата, статус проверки и объяснение решения." /></DashboardGridItem>
        <DashboardGridItem><FutureSlot icon={Gift} title="VX Rewards" state="Нет данных" description="Награда не обещана и будет показана только после подтверждения условий." /></DashboardGridItem>
      </DashboardGrid>

      <div className={styles.detailActions}>
        {opportunity.taskId ? (
          <Link className={cn(buttonVariants({ variant: "outline" }), styles.structureLink)} href={`${taskBasePath}/${opportunity.taskId}`}>
            Посмотреть структуру задания <ArrowRight aria-hidden="true" />
          </Link>
        ) : <StatusPill tone="neutral">Задание не предусмотрено</StatusPill>}
        <Link className={styles.pageBackLink} href={basePath}><ArrowLeft aria-hidden="true" /> Вернуться к возможностям</Link>
      </div>
    </DashboardPage>
  );
}

function FutureSlot({ icon: Icon, title, state, description }: { icon: typeof Gift; title: string; state: string; description: string }) {
  return (
    <Card className={styles.futureSlot}>
      <div><span><Icon aria-hidden="true" /></span><StatusPill tone="neutral">{state}</StatusPill></div>
      <h2>{title}</h2>
      <p>{description}</p>
      <Button variant="ghost" disabled>Функция недоступна</Button>
    </Card>
  );
}
