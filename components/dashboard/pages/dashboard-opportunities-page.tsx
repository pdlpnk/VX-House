"use client";

import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  CircleHelp,
  Crown,
  Handshake,
  History,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Card } from "@/components/ui/card";

const playerOpportunities = [
  { title: "Личный кабинет", description: "Статус профиля, важные обновления и основные действия в одном пространстве.", status: "Активно", icon: LayoutDashboard },
  { title: "Персональные условия", description: "Актуальные условия сформированы с учётом демонстрационного профиля.", status: "Обновлено", icon: Sparkles },
  { title: "Приоритетная поддержка", description: "Прямой доступ к сопровождению и истории демонстрационных обращений.", status: "Доступно", icon: CircleHelp },
  { title: "Уровень «Прайм»", description: "Статус участника и связанные с ним возможности показаны без игровых механик.", status: "Подтверждено", icon: Crown },
  { title: "История пространства", description: "Изменения профиля, условий и поддержки собраны в хронологическом порядке.", status: "Доступно", icon: History },
] as const;

const partnerOpportunities = [
  { title: "Условия сотрудничества", description: "Актуальный формат взаимодействия и основные условия собраны в одном разделе.", status: "Обновлено", icon: Handshake },
  { title: "Статус партнёра", description: "Текущий этап, выполненные действия и ожидаемые следующие шаги.", status: "Активно", icon: BriefcaseBusiness },
  { title: "Инструменты взаимодействия", description: "Демонстрационные средства управления запросами, статусами и материалами.", status: "Доступно", icon: Wrench },
  { title: "Партнёрская команда", description: "Единая точка связи с командой VX House по вопросам сотрудничества.", status: "На связи", icon: UsersRound },
] as const;

export function DashboardOpportunitiesPage() {
  const { profile } = useDashboard();
  const [openedOpportunity, setOpenedOpportunity] = useState<string | null>(null);
  const isPartner = profile.role === "partner";
  const opportunities = isPartner ? partnerOpportunities : playerOpportunities;

  return (
    <DashboardPage>
      <DashboardHeading
        eyebrow={isPartner ? "Партнёрское пространство" : "Пространство игрока"}
        title="Возможности"
        description={isPartner
          ? "Условия и инструменты, доступные в текущем сценарии сотрудничества."
          : "Ваши условия, преимущества и сервисы VX House в одном каталоге."}
        action={<StatusPill tone="brand">{opportunities.length} доступно</StatusPill>}
      />

      <section className={styles.opportunitySummary}>
        <div><span><ShieldCheck aria-hidden="true" /></span><div><small>Сценарий</small><strong>{isPartner ? "Партнёр" : "Игрок"}</strong></div></div>
        <div><span><Activity aria-hidden="true" /></span><div><small>Последнее обновление</small><strong>Сегодня, 10:24</strong></div></div>
        <div><span><Sparkles aria-hidden="true" /></span><div><small>Состояние каталога</small><strong>Актуально</strong></div></div>
      </section>

      <DashboardGrid className={styles.opportunitiesCatalog}>
        {opportunities.map(({ title, description, status, icon: Icon }, index) => (
          <DashboardGridItem key={title}>
            <Card className={styles.opportunityCard}>
              <div className={styles.opportunityCardTop}>
                <span><Icon aria-hidden="true" /></span>
                <StatusPill tone={index === 1 ? "brand" : "success"}>{status}</StatusPill>
              </div>
              <div><small>{String(index + 1).padStart(2, "0")}</small><h2>{title}</h2><p>{description}</p></div>
              {openedOpportunity === title && (
                <div className={styles.opportunityDetails} role="status">
                  <strong>Что входит</strong>
                  <p>{isPartner
                    ? "Статус, история изменений и доступные действия отображаются внутри единого партнёрского пространства."
                    : "Состояние профиля, важные изменения и доступ к сопровождению отображаются в личном кабинете."}</p>
                </div>
              )}
              <button
                type="button"
                aria-expanded={openedOpportunity === title}
                aria-label={`${openedOpportunity === title ? "Закрыть" : "Открыть"} подробности: ${title}`}
                onClick={() => setOpenedOpportunity((opened) => opened === title ? null : title)}
              >
                {openedOpportunity === title ? "Скрыть подробности" : "Открыть подробности"}
                <ArrowRight aria-hidden="true" />
              </button>
            </Card>
          </DashboardGridItem>
        ))}
      </DashboardGrid>

      <div className={styles.catalogFooter}>
        <p>Нужна помощь с доступными возможностями?</p>
        <Link href="/dashboard/support">Связаться с поддержкой <ArrowRight aria-hidden="true" /></Link>
      </div>
    </DashboardPage>
  );
}
