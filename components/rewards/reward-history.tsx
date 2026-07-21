"use client";

import { ArrowLeft, CircleDashed, FileClock, Info } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardHeading, DashboardPage, StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { rewardHistoryEventTypes } from "@/lib/reward-data";

export function RewardHistory({ catalogHref }: { catalogHref: string }) {
  return <DashboardPage>
    <DashboardHeading eyebrow="VX Rewards" title="История Rewards" description="Будущая неизменяемая хронология оснований, решений и предоставления преимуществ без смешения с VX Points." action={<Button asChild variant="outline"><Link href={catalogHref}><ArrowLeft aria-hidden="true" />К каталогу</Link></Button>} />
    <div className={styles.economyDisclosure} role="note"><Info aria-hidden="true" /><p><strong>История не содержит демонстрационных успехов.</strong> Reward не создан, не подтверждён и не предоставлен пользователю.</p></div>
    <Card className={styles.rewardHistoryEmpty}>
      <span><FileClock aria-hidden="true" /></span><small>Честное пустое состояние</small><h2>Событий VX Rewards пока нет</h2><p>После подключения сервиса запись будет содержать тип Reward, основание, связанное задание, переход статуса, причину, версию условий и подтверждение предоставления.</p>
      <div>{rewardHistoryEventTypes.map((type) => <StatusPill key={type} tone="neutral">{type}</StatusPill>)}</div>
      <section><CircleDashed aria-hidden="true" /><p><strong>Отклонение и истечение требуют причины.</strong> Исправление не удаляет предыдущую запись, а создаёт новое объяснимое событие.</p></section>
    </Card>
  </DashboardPage>;
}
