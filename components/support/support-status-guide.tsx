import { CheckCircle2, CircleDotDashed, CircleX, Clock3, Inbox, UserRound, type LucideIcon } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";
import { supportStatuses } from "@/lib/support-data";
import type { SupportStatus } from "@/lib/support";

const statusIcons: Record<SupportStatus, LucideIcon> = {
  CREATED: CircleDotDashed,
  ASSIGNED: Inbox,
  WAITING_USER: UserRound,
  WAITING_OPERATOR: Clock3,
  RESOLVED: CheckCircle2,
  CLOSED: CircleX,
};

export function SupportStatusGuide() {
  return <section className={styles.supportStatusGuide} aria-labelledby="support-status-guide-title"><header><span>Состояния обращения</span><h2 id="support-status-guide-title">Понятно, кто делает следующий шаг</h2><p>Статус не заменяет сообщение: пользователь видит его смысл и ожидаемое действие.</p></header><ol>{supportStatuses.map((status, index) => { const Icon = statusIcons[status.status]; return <li key={status.status}><span>{index + 1}</span><Icon aria-hidden="true" /><div><strong>{status.label}</strong><p>{status.description}</p><small>{status.nextStep}</small></div></li>; })}</ol></section>;
}
