import { Award, CircleGauge, Coins, Route } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";

const impacts = [
  { label: "VX Points", icon: Coins },
  { label: "Trust Score", icon: CircleGauge },
  { label: "Ранг", icon: Route },
  { label: "VX Rewards", icon: Award },
] as const;

export function EconomyImpactPreview() {
  return <section className={styles.economyImpactPreview} aria-labelledby="economy-impact-title"><header><small>Интеграция экономики</small><h3 id="economy-impact-title">Результаты будут зафиксированы отдельно</h3><p>Подтверждение задания само по себе не имитирует начисление. Каждая сущность получит собственное событие только после подключения сервиса.</p></header><div>{impacts.map(({ label, icon: Icon }) => <article key={label}><Icon aria-hidden="true" /><span>{label}</span><strong>Нет данных</strong></article>)}</div></section>;
}
