"use client";

import { ArrowRight, Compass, Info, MapPin, UserRound } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { OpportunityStatusBadge } from "@/components/opportunities/opportunity-status";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getOpportunitiesByRole,
  opportunityRoleLabels,
  type OpportunityRole,
} from "@/lib/opportunity-data";

const catalogCopy = {
  player: {
    eyebrow: "Кабинет игрока",
    description: "Единая модель будущих заданий, инструкций, промокодов и персональных условий для игрока.",
    backHref: "/dashboard",
  },
  partner: {
    eyebrow: "Партнёрское пространство",
    description: "Единая модель будущих рабочих действий, материалов и условий сотрудничества для партнёра.",
    backHref: "/partner",
  },
} as const;

export function OpportunityCatalog({ role, basePath }: { role: OpportunityRole; basePath: string }) {
  const items = getOpportunitiesByRole(role);
  const copy = catalogCopy[role];

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow={copy.eyebrow}
        title="Возможности"
        description={copy.description}
        action={<StatusPill tone="neutral">Демонстрационная структура</StatusPill>}
      />

      <section className={styles.opportunityCatalogIntro}>
        <span><Compass aria-hidden="true" /></span>
        <div>
          <small>Frontend-модель</small>
          <h2>Понятно, что доступно и что делать дальше</h2>
          <p>Карточки ниже показывают структуру будущего каталога. Они не подтверждают назначение возможности, доступ пользователя или результат.</p>
        </div>
      </section>

      <DashboardGrid className={styles.opportunityList}>
        {items.map((opportunity) => (
          <DashboardGridItem key={opportunity.id}>
            <Card className={styles.opportunityCard}>
              <div className={styles.opportunityCardTopline}>
                <span>{opportunity.type}</span>
                <OpportunityStatusBadge status={opportunity.status} />
              </div>
              <div className={styles.opportunityCardCopy}>
                <small>Демонстрационный пример</small>
                <h2>{opportunity.title}</h2>
                <p>{opportunity.description}</p>
              </div>
              <dl className={styles.opportunityMeta}>
                <div><dt><UserRound aria-hidden="true" /> Роль</dt><dd>{opportunityRoleLabels[opportunity.role]}</dd></div>
                <div><dt><MapPin aria-hidden="true" /> Рынок</dt><dd>{opportunity.markets.join(" · ")}</dd></div>
              </dl>
              <div className={styles.opportunityNextStep}>
                <span>Следующий шаг</span>
                <p>{opportunity.nextStep}</p>
              </div>
              <Link className={cn(buttonVariants({ variant: "outline" }), styles.opportunityDetailsLink)} href={`${basePath}/${opportunity.id}`}>
                Открыть карточку <ArrowRight aria-hidden="true" />
              </Link>
            </Card>
          </DashboardGridItem>
        ))}
      </DashboardGrid>

      <p className={styles.systemDisclosure}><Info aria-hidden="true" /> Действия, начисления и проверка результата не подключены. Открытие карточки показывает только frontend-структуру.</p>
      <Link className={styles.pageBackLink} href={copy.backHref}>Вернуться к обзору</Link>
    </DashboardPage>
  );
}
