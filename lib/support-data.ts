import type { SupportPriority, SupportStatus } from "@/lib/support";

export type EconomyRole = "player" | "partner";
export const supportPriorityLabels: Record<SupportPriority, string> = { LOW: "Низкий", NORMAL: "Обычный", HIGH: "Высокий", CRITICAL: "Критический" };
export const supportStatuses: Array<{ status: SupportStatus; label: string; description: string; nextStep: string; tone: "neutral" | "success" | "attention" | "brand" }> = [
  { status: "CREATED", label: "Новое", description: "Обращение создано и зарегистрировано системой.", nextStep: "Дождаться назначения или ответа команды.", tone: "neutral" },
  { status: "ASSIGNED", label: "Открыто", description: "Обращение назначено ответственному специалисту.", nextStep: "Дождаться следующего сообщения.", tone: "brand" },
  { status: "WAITING_USER", label: "Ожидает пользователя", description: "Для продолжения нужен ответ пользователя.", nextStep: "Открыть диалог и отправить необходимые сведения.", tone: "attention" },
  { status: "WAITING_OPERATOR", label: "Ожидает оператора", description: "Последнее действие выполнено пользователем.", nextStep: "Дождаться ответа команды без вымышленного таймера.", tone: "brand" },
  { status: "RESOLVED", label: "Решено", description: "Команда предложила решение вопроса.", nextStep: "Проверить решение или продолжить диалог.", tone: "success" },
  { status: "CLOSED", label: "Закрыто", description: "Работа с обращением завершена и сохранена в истории.", nextStep: "При новом вопросе создать отдельное обращение.", tone: "neutral" },
];
export function getSupportStatus(status: SupportStatus) { return supportStatuses.find((item) => item.status === status) ?? supportStatuses[0]; }
