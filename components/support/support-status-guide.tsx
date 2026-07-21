import { CheckCircle2, CircleDotDashed, CircleX, Clock3, Inbox, UserRound, type LucideIcon } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";
import { supportStatuses, type SupportStatus } from "@/lib/support-data";

const statusIcons: Record<SupportStatus, LucideIcon> = {
  new: CircleDotDashed,
  open: Inbox,
  "waiting-user": UserRound,
  "waiting-operator": Clock3,
  resolved: CheckCircle2,
  closed: CircleX,
};

export function SupportStatusGuide() {
  return <section className={styles.supportStatusGuide} aria-labelledby="support-status-guide-title"><header><span>Состояния обращения</span><h2 id="support-status-guide-title">Понятно, кто делает следующий шаг</h2><p>Статус не заменяет сообщение: пользователь видит его смысл и ожидаемое действие.</p></header><ol>{supportStatuses.map((status, index) => { const Icon = statusIcons[status.status]; return <li key={status.status}><span>{index + 1}</span><Icon aria-hidden="true" /><div><strong>{status.label}</strong><p>{status.description}</p><small>{status.nextStep}</small></div></li>; })}</ol></section>;
}
