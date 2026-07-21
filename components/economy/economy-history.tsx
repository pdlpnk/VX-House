"use client";

import { ArrowLeft, CircleDashed, FileClock, Info } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { economyEventTypes } from "@/lib/economy-data";

export function EconomyHistory({ overviewHref }: { overviewHref: string }) {
  return <DashboardPage>
    <DashboardHeading eyebrow="Экономика пользователя" title="История экономики" description="Здесь будет собрана неизменяемая хронология причин, решений и следующих действий по каждой экономической сущности." action={<Button asChild variant="outline"><Link href={overviewHref}><ArrowLeft aria-hidden="true" />К обзору экономики</Link></Button>} />
    <div className={styles.economyDisclosure} role="note"><Info aria-hidden="true" /><p><strong>Демонстрационный экран.</strong> Ни одного экономического события не создано, а примерные начисления и решения не подставляются.</p></div>
    <Card className={styles.economyHistoryEmpty}>
      <span><FileClock aria-hidden="true" /></span>
      <small>Честное пустое состояние</small>
      <h2>Экономических событий пока нет</h2>
      <p>После подключения сервиса каждая запись получит дату, основание, значение до и после, статус, версию правила и понятный следующий шаг.</p>
      <div className={styles.economyEventTypes}>{economyEventTypes.map((type) => <StatusPill key={type} tone="neutral">{type}</StatusPill>)}</div>
      <div className={styles.economyHistoryRule}><CircleDashed aria-hidden="true" /><p><strong>История не переписывается незаметно.</strong> Исправление будет отдельным компенсирующим событием с причиной.</p></div>
    </Card>
  </DashboardPage>;
}
