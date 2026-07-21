"use client";

import { ArrowLeft, BookOpenCheck, FileText, FolderOpen, LockKeyhole, TicketPercent } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardGrid, DashboardGridItem, DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Card } from "@/components/ui/card";

const materialAreas = [
  { title: "Инструкции", description: "Пошаговые материалы будут иметь версию, область применения и дату актуальности.", icon: BookOpenCheck },
  { title: "Рабочие материалы", description: "Файлы и ссылки появятся только после назначения соответствующего партнёрского контекста.", icon: FileText },
  { title: "Промокоды", description: "Каждый код будет показан отдельно с условиями, сроком и рынком использования.", icon: TicketPercent },
] as const;

export function PartnerMaterialsPage() {
  return (
    <DashboardPage>
      <DashboardHeading eyebrow="Рабочий контент" title="Материалы" description="Единое место для инструкций, файлов и промокодов партнёра без неподтверждённых обещаний доступности." action={<StatusPill tone="neutral">0 материалов</StatusPill>} />
      <section className={styles.emptyHero}>
        <span><FolderOpen aria-hidden="true" /></span>
        <div><small>Пустое состояние</small><h2>Материалы пока не назначены</h2><p>Состав будет зависеть от подтверждённой роли, страны и условий сотрудничества.</p></div>
      </section>
      <DashboardGrid className={styles.futureCatalog}>
        {materialAreas.map(({ title, description, icon: Icon }) => (
          <DashboardGridItem key={title}><Card className={styles.futureCard}><div><span><Icon aria-hidden="true" /></span><StatusPill tone="neutral">Будет доступно после подключения сервиса</StatusPill></div><h2>{title}</h2><p>{description}</p><small><LockKeyhole aria-hidden="true" /> Материалов нет</small></Card></DashboardGridItem>
        ))}
      </DashboardGrid>
      <Link className={styles.pageBackLink} href="/partner"><ArrowLeft aria-hidden="true" /> Вернуться к обзору</Link>
    </DashboardPage>
  );
}
