import { ArrowRight, History } from "lucide-react";
import Link from "next/link";

import styles from "@/app/dashboard/dashboard.module.css";
import { StatusPill } from "@/components/dashboard/dashboard-ui";
import type { ActivityEventView } from "@/lib/platform-operations";

const labels = { TASK: "Задание", POINTS: "VX Points", TRUST: "Trust Score", RANK: "Ранг", REWARD: "VX Reward", SUPPORT: "Поддержка", NOTIFICATION: "Уведомление", PROMOCODE: "Промокод" } as const;

export function ActivityTimeline({ events }: { events: ActivityEventView[] }) {
  if (!events.length) return <section className={styles.activityEmpty}><div className={styles.emptyStateIcon}><History aria-hidden="true" /></div><small>История пуста</small><h2>Подтверждённых событий пока нет</h2><p>История начнётся после первого серверного изменения профиля, задания, экономики, Reward, поддержки или промокода.</p></section>;
  return <ol className={styles.activityTimeline}>{events.map((event) => <li key={event.id}><span aria-hidden="true" /><article><header><div><small>{labels[event.category]}</small><h2>{event.title}</h2></div><StatusPill tone="neutral">{event.status}</StatusPill></header><p>{event.description}</p><footer><time dateTime={event.occurredAt}>{new Intl.DateTimeFormat("ru", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.occurredAt))}</time>{event.href ? <Link href={event.href}>Открыть <ArrowRight aria-hidden="true" /></Link> : null}</footer></article></li>)}</ol>;
}
