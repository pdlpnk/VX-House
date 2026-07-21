export type TaskLifecycleStatus =
  | "available"
  | "accepted"
  | "in-progress"
  | "awaiting-submission"
  | "submitted"
  | "under-review"
  | "clarification"
  | "confirmed"
  | "rejected";

export type TaskLifecycleDefinition = {
  status: TaskLifecycleStatus;
  label: string;
  phase: "Доступ" | "Выполнение" | "Отправка" | "Проверка";
  description: string;
  nextStep: string;
  tone: "neutral" | "brand" | "attention" | "success";
};

export const taskLifecycle: readonly TaskLifecycleDefinition[] = [
  {
    status: "available",
    label: "Доступно",
    phase: "Доступ",
    description: "Пользователь соответствует условиям показа и может изучить задание до принятия.",
    nextStep: "Изучить требования и принять задание после подключения сервиса.",
    tone: "brand",
  },
  {
    status: "accepted",
    label: "Принято",
    phase: "Доступ",
    description: "Пользователь подтвердил намерение начать, а версия условий должна быть зафиксирована.",
    nextStep: "Открыть актуальную инструкцию и начать первый обязательный шаг.",
    tone: "brand",
  },
  {
    status: "in-progress",
    label: "Выполняется",
    phase: "Выполнение",
    description: "Задание находится в работе; интерфейс показывает обязательные шаги и сохраняет прогресс.",
    nextStep: "Завершить обязательные шаги и подготовить подтверждающие материалы.",
    tone: "attention",
  },
  {
    status: "awaiting-submission",
    label: "Ожидает отправки",
    phase: "Отправка",
    description: "Шаги завершены, но результат ещё не передан на проверку.",
    nextStep: "Заполнить обязательные поля, проверить материалы и подтвердить отправку.",
    tone: "attention",
  },
  {
    status: "submitted",
    label: "Отправлено",
    phase: "Отправка",
    description: "Система приняла результат и должна сохранить его как отдельную версию.",
    nextStep: "Дождаться постановки результата в очередь проверки.",
    tone: "brand",
  },
  {
    status: "under-review",
    label: "Ожидает проверки",
    phase: "Проверка",
    description: "Результат находится в очереди; решение ещё не вынесено.",
    nextStep: "Следить за статусом. При изменении появится объяснение и новое действие.",
    tone: "attention",
  },
  {
    status: "clarification",
    label: "Требуется уточнение",
    phase: "Проверка",
    description: "Проверяющему нужна дополнительная информация или исправленный материал.",
    nextStep: "Изучить комментарий и подготовить новую версию результата, если повторная отправка разрешена.",
    tone: "attention",
  },
  {
    status: "confirmed",
    label: "Подтверждено",
    phase: "Проверка",
    description: "Проверка завершена положительным решением по конкретной версии результата.",
    nextStep: "Открыть сводку решения. Экономические последствия появятся отдельно после подключения соответствующих систем.",
    tone: "success",
  },
  {
    status: "rejected",
    label: "Отклонено",
    phase: "Проверка",
    description: "Проверка завершена отрицательным решением с обязательной понятной причиной.",
    nextStep: "Изучить причину и доступный путь повторной отправки или апелляции.",
    tone: "neutral",
  },
] as const;

export function getTaskLifecycleState(status: TaskLifecycleStatus) {
  return taskLifecycle.find((state) => state.status === status) ?? taskLifecycle[0];
}
