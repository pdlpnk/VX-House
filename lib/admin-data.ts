import type { LucideIcon } from "lucide-react";
import {
  BookOpenText,
  Building2,
  ChartNoAxesCombined,
  CircleGauge,
  ClipboardList,
  Gift,
  Headphones,
  History,
  MailCheck,
  ScanSearch,
  Settings2,
  Sparkles,
  UsersRound,
} from "lucide-react";

export type AdminSectionId =
  | "users"
  | "services"
  | "opportunities"
  | "tasks"
  | "reviews"
  | "rewards"
  | "economy"
  | "support"
  | "content"
  | "notifications"
  | "team"
  | "audit"
  | "settings";

export type AdminField = {
  label: string;
  value: string;
  help: string;
  type?: "text" | "select" | "textarea";
};

export type AdminEntity = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  nextStep: string;
  fields: readonly AdminField[];
};

export type AdminSection = {
  id: AdminSectionId;
  label: string;
  singular: string;
  description: string;
  purpose: string;
  icon: LucideIcon;
  entity: AdminEntity;
};

export type AdminCapability = {
  label: string;
  description: string;
  state: string;
};

const empty = "Нет данных";
const pending = "Будет определено после подключения backend";

export const adminSections: readonly AdminSection[] = [
  {
    id: "users",
    label: "Пользователи",
    singular: "Профиль пользователя",
    description: "Будущее управление профилями, ролями, рынками и статусами доступа.",
    purpose: "Показывать только разрешённые данные и отделять просмотр профиля от изменения роли или доступа.",
    icon: UsersRound,
    entity: {
      id: "demo-profile-structure",
      eyebrow: "Демонстрационная схема",
      title: "Структура профиля пользователя",
      description: "Пример состава карточки без реального пользователя, контакта или истории.",
      status: "Данные не подключены",
      nextStep: "Подключить источник профилей и ролевую модель сотрудников.",
      fields: [
        { label: "Имя", value: empty, help: "Появится из подтверждённого профиля." },
        { label: "Роль", value: empty, help: "Игрок или партнёр после проверки доступа.", type: "select" },
        { label: "Рынок", value: empty, help: "Турция или Азербайджан в рамках стартовой конфигурации.", type: "select" },
        { label: "Статус доступа", value: pending, help: "Изменение потребует права и аудита.", type: "select" },
      ],
    },
  },
  {
    id: "services",
    label: "Партнёрские сервисы",
    singular: "Партнёрский сервис",
    description: "Будущая доступность партнёров и версий условий по стране.",
    purpose: "Отделять карточку партнёра от конкретной версии условий для Турции и Азербайджана.",
    icon: Building2,
    entity: {
      id: "demo-service-structure",
      eyebrow: "Демонстрационная схема",
      title: "Структура партнёрского сервиса",
      description: "Партнёр не подключён, условия не опубликованы и пользователям ничего не доступно.",
      status: "Сервис не подключён",
      nextStep: "Подключить реестр партнёров, рынки и версионирование условий.",
      fields: [
        { label: "Название сервиса", value: empty, help: "Юридически и операционно подтверждённое название." },
        { label: "Страна", value: empty, help: "Турция или Азербайджан.", type: "select" },
        { label: "Статус доступности", value: empty, help: "Не публикуется без подтверждения.", type: "select" },
        { label: "Версия условий", value: pending, help: "Изменения создают новую версию.", type: "textarea" },
      ],
    },
  },
  {
    id: "opportunities",
    label: "Возможности",
    singular: "Возможность",
    description: "Каталог доступности по роли, рынку и текущему состоянию сервиса.",
    purpose: "Управлять видимостью возможностей без ложной доступности и без изменения принятых условий задним числом.",
    icon: Sparkles,
    entity: {
      id: "demo-opportunity-structure",
      eyebrow: "Демонстрационная схема",
      title: "Структура возможности",
      description: "Карточка показывает будущие поля, но не публикует предложение пользователям.",
      status: "Не опубликовано",
      nextStep: "Подключить версионирование, сегменты и процесс публикации.",
      fields: [
        { label: "Название", value: empty, help: "Публичное название возможности." },
        { label: "Роль", value: empty, help: "Сегмент игрока или партнёра.", type: "select" },
        { label: "Рынок", value: empty, help: "Применимый рынок.", type: "select" },
        { label: "Следующий шаг", value: pending, help: "Честное действие или причина недоступности.", type: "textarea" },
      ],
    },
  },
  {
    id: "tasks",
    label: "Задания",
    singular: "Задание",
    description: "Будущее управление инструкциями, версиями условий и очередью проверки.",
    purpose: "Сохранять условия принятого задания и разделять публикацию, проверку и экономическое решение.",
    icon: ClipboardList,
    entity: {
      id: "demo-task-structure",
      eyebrow: "Демонстрационная схема",
      title: "Структура задания",
      description: "Ни одному пользователю задание не назначено и ни один результат не отправлен.",
      status: "Черновик отсутствует",
      nextStep: "Подключить версии условий, инструкции и очередь результатов.",
      fields: [
        { label: "Название", value: empty, help: "Название будущего задания." },
        { label: "Версия условий", value: empty, help: "Неизменяемая версия после принятия." },
        { label: "Инструкция", value: empty, help: "Связанный материал ещё не выбран.", type: "select" },
        { label: "Проверка", value: pending, help: "Правила проверки и ответственный сотрудник.", type: "textarea" },
      ],
    },
  },
  {
    id: "reviews",
    label: "Проверки",
    singular: "Результат на проверке",
    description: "Будущая очередь результатов, уточнений, решений и апелляций.",
    purpose: "Проверяющий видит условия принятого задания, версию результата и объяснимый следующий шаг.",
    icon: ScanSearch,
    entity: {
      id: "demo-review-structure",
      eyebrow: "Демонстрационная схема",
      title: "Структура проверки результата",
      description: "Результат не отправлен, пользователь отсутствует, решение не принималось.",
      status: "Очередь не подключена",
      nextStep: "Подключить результаты, права проверяющих и неизменяемую историю решений.",
      fields: [
        { label: "Связанное задание", value: empty, help: "Условия и версия задания отсутствуют." },
        { label: "Версия результата", value: empty, help: "Файл или данные результата не загружены." },
        { label: "Статус проверки", value: empty, help: "Решение отсутствует.", type: "select" },
        { label: "Причина решения", value: pending, help: "Подтверждение и отклонение требуют объяснения.", type: "textarea" },
      ],
    },
  },
  {
    id: "rewards",
    label: "VX Rewards",
    singular: "VX Reward",
    description: "Будущие основания, решения и процесс предоставления преимуществ.",
    purpose: "Не смешивать VX Rewards с Points и защищать денежные операции отдельными правами.",
    icon: Gift,
    entity: {
      id: "demo-reward-structure",
      eyebrow: "Демонстрационная схема",
      title: "Структура VX Reward",
      description: "Reward не назначен, не подтверждён и не предоставлен.",
      status: "Нет основания",
      nextStep: "Подключить основание, права подтверждения и журнал предоставления.",
      fields: [
        { label: "Тип Reward", value: empty, help: "Тип будет выбран из утверждённой конфигурации.", type: "select" },
        { label: "Связанное задание", value: empty, help: "Основание отсутствует." },
        { label: "Статус", value: empty, help: "Статус создаётся только серверным процессом.", type: "select" },
        { label: "Причина решения", value: pending, help: "Обязательное объяснение для аудита.", type: "textarea" },
      ],
    },
  },
  {
    id: "economy",
    label: "Экономика",
    singular: "Версия экономики",
    description: "Будущая конфигурация VX Points, Trust Score, рангов и правил прогресса.",
    purpose: "Каждое правило должно иметь версию, автора, основание и дату вступления в силу.",
    icon: CircleGauge,
    entity: {
      id: "demo-economy-configuration",
      eyebrow: "Демонстрационная схема",
      title: "Структура версии экономики",
      description: "Порогов, весов, процентов и действующей конфигурации в интерфейсе нет.",
      status: "Конфигурация не подключена",
      nextStep: "Подключить версионирование, анализ влияния и многоэтапное утверждение.",
      fields: [
        { label: "Версия", value: empty, help: "Идентификатор утверждённой конфигурации." },
        { label: "VX Points", value: empty, help: "Основания и значения не заданы.", type: "textarea" },
        { label: "Trust Score", value: empty, help: "События, веса и зоны не заданы.", type: "textarea" },
        { label: "Ранги", value: pending, help: "Пороги и требования должны быть прозрачными.", type: "textarea" },
      ],
    },
  },
  {
    id: "support",
    label: "Поддержка",
    singular: "Обращение",
    description: "Будущая очередь обращений, апелляций и безопасного контекста диалога.",
    purpose: "Отделять сообщения пользователя от внутренних заметок и не обещать неподтверждённый срок ответа.",
    icon: Headphones,
    entity: {
      id: "demo-ticket-structure",
      eyebrow: "Демонстрационная схема",
      title: "Структура обращения",
      description: "Это не реальное обращение и оператор не назначен.",
      status: "Очередь не подключена",
      nextStep: "Подключить обращения, права операторов и политику хранения переписки.",
      fields: [
        { label: "Категория", value: empty, help: "Категория будущего обращения.", type: "select" },
        { label: "Приоритет", value: empty, help: "Не означает гарантированное время ответа.", type: "select" },
        { label: "Оператор", value: empty, help: "Назначение отсутствует." },
        { label: "Внутренняя заметка", value: pending, help: "Будет недоступна пользователю.", type: "textarea" },
      ],
    },
  },
  {
    id: "content",
    label: "Контент",
    singular: "Материал",
    description: "Будущий редакционный процесс материалов, инструкций и прогнозов.",
    purpose: "Каждый материал получает автора, срок, аудит версий и предупреждение без гарантий результата.",
    icon: BookOpenText,
    entity: {
      id: "demo-content-structure",
      eyebrow: "Демонстрационная схема",
      title: "Структура редакционного материала",
      description: "Материал не создан, не опубликован и не доступен пользователям.",
      status: "Публикация недоступна",
      nextStep: "Утвердить контентную политику и подключить редакционный процесс.",
      fields: [
        { label: "Заголовок", value: empty, help: "Заголовок будущего материала." },
        { label: "Автор", value: empty, help: "Ответственный автор не назначен." },
        { label: "Период актуальности", value: empty, help: "Срок не установлен." },
        { label: "Предупреждение", value: pending, help: "Не может восприниматься как гарантия результата.", type: "textarea" },
      ],
    },
  },
  {
    id: "notifications",
    label: "Уведомления",
    singular: "Шаблон уведомления",
    description: "Будущие шаблоны, каналы, аудит отправки и сегменты получателей.",
    purpose: "Сообщать только о релевантном изменении и не дублировать одно событие в нескольких каналах.",
    icon: MailCheck,
    entity: {
      id: "demo-notification-structure",
      eyebrow: "Демонстрационная схема",
      title: "Структура шаблона уведомления",
      description: "Шаблон не создан, получателей нет и сообщения не отправляются.",
      status: "Каналы не подключены",
      nextStep: "Подключить события, предпочтения пользователя, шаблоны и журнал доставки.",
      fields: [
        { label: "Событие", value: empty, help: "Подтверждённый тип события отсутствует.", type: "select" },
        { label: "Канал", value: empty, help: "Канал выбирается с учётом согласий.", type: "select" },
        { label: "Сегмент", value: empty, help: "Роль, страна и доступ не определены.", type: "select" },
        { label: "Текст шаблона", value: pending, help: "Предпросмотр не является отправкой.", type: "textarea" },
      ],
    },
  },
  {
    id: "team",
    label: "Команда и права",
    singular: "Роль сотрудника",
    description: "Будущее разделение просмотра, публикации, проверки, финансовых и административных прав.",
    purpose: "Сотрудник видит только разрешённые области, а конфликт полномочий предотвращается серверными правилами.",
    icon: UsersRound,
    entity: {
      id: "demo-staff-role-structure",
      eyebrow: "Демонстрационная схема",
      title: "Структура роли сотрудника",
      description: "Сотрудник не создан, права не назначены и доступ к данным отсутствует.",
      status: "Ролевая модель не подключена",
      nextStep: "Утвердить роли и подключить серверный контроль доступа.",
      fields: [
        { label: "Название роли", value: empty, help: "Например: менеджер, проверяющий, поддержка или аудитор." },
        { label: "Просмотр", value: empty, help: "Разрешённые разделы не определены.", type: "select" },
        { label: "Операционные права", value: empty, help: "Публикация и проверка разделяются.", type: "textarea" },
        { label: "Критические права", value: pending, help: "Финансовое и административное право назначаются отдельно.", type: "textarea" },
      ],
    },
  },
  {
    id: "audit",
    label: "Аудит",
    singular: "Запись аудита",
    description: "Будущий неизменяемый журнал критических и операционных действий.",
    purpose: "Фиксировать автора, время, основание и значения до и после без возможности редактирования записи.",
    icon: History,
    entity: {
      id: "demo-audit-record-structure",
      eyebrow: "Демонстрационная схема",
      title: "Структура записи аудита",
      description: "Событие не происходило и запись не является частью реального журнала.",
      status: "Событий нет",
      nextStep: "Подключить неизменяемый серверный журнал и разрешённый экспорт.",
      fields: [
        { label: "Автор", value: empty, help: "Подтверждённый сотрудник отсутствует." },
        { label: "Время", value: empty, help: "Временная метка не создана." },
        { label: "Значение до", value: empty, help: "Изменение не выполнялось.", type: "textarea" },
        { label: "Значение после", value: pending, help: "Запись будет доступна только для чтения.", type: "textarea" },
      ],
    },
  },
  {
    id: "settings",
    label: "Настройки",
    singular: "Системная настройка",
    description: "Будущие права сотрудников, рынки, локализация и безопасные параметры платформы.",
    purpose: "Критические изменения требуют отдельного права, предварительного просмотра и полного аудита.",
    icon: Settings2,
    entity: {
      id: "demo-system-configuration",
      eyebrow: "Демонстрационная схема",
      title: "Структура системной настройки",
      description: "Никакие параметры приложения здесь не изменяются.",
      status: "Только просмотр",
      nextStep: "Подключить ролевую модель сотрудников и журнал критических действий.",
      fields: [
        { label: "Рынки", value: "Турция, Азербайджан — стартовая модель", help: "Не является активной серверной конфигурацией.", type: "select" },
        { label: "Локализация", value: "Русский интерфейс — текущая версия", help: "Новые языки требуют отдельной реализации.", type: "select" },
        { label: "Права сотрудников", value: empty, help: "Ролевая модель не подключена.", type: "textarea" },
        { label: "Аудит", value: pending, help: "Критические записи нельзя будет редактировать через интерфейс.", type: "textarea" },
      ],
    },
  },
] as const;

export const adminSectionIds = adminSections.map((section) => section.id);

export const adminCapabilities: Record<AdminSectionId, readonly AdminCapability[]> = {
  users: [
    { label: "Профили и контакты", description: "Минимальный набор подтверждённых данных.", state: "Нет данных" },
    { label: "Роли и статусы", description: "Изменение роли отделено от статуса доступа.", state: "Не подключено" },
    { label: "Согласия и рынок", description: "Возраст, правила, приватность и страна.", state: "Нет данных" },
  ],
  services: [
    { label: "Реестр партнёров", description: "Карточки подтверждённых сервисов.", state: "Пусто" },
    { label: "Условия по странам", description: "Отдельная версия для каждого рынка.", state: "Не подключено" },
    { label: "Доступность", description: "Причина ограничения видна до публикации.", state: "Нет данных" },
  ],
  opportunities: [
    { label: "Сегменты", description: "Роль, рынок, ранг и персональное условие.", state: "Не настроено" },
    { label: "Предпросмотр", description: "Результат глазами пользователя до публикации.", state: "Не подключено" },
    { label: "Версии", description: "Изменение не ухудшает условия задним числом.", state: "Нет версий" },
  ],
  tasks: [
    { label: "Задания", description: "Условия, результат и следующий шаг.", state: "Пусто" },
    { label: "Инструкции", description: "Связанный материал и версия.", state: "Не подключено" },
    { label: "Промокоды", description: "Доступ только по подтверждённому основанию.", state: "Нет данных" },
  ],
  reviews: [
    { label: "Очередь результатов", description: "Новые и ожидающие уточнения результаты.", state: "Пусто" },
    { label: "Решение", description: "Подтверждение или отклонение с причиной.", state: "Недоступно" },
    { label: "Апелляции", description: "Отдельный пересмотр спорного решения.", state: "Пусто" },
  ],
  rewards: [
    { label: "Основания", description: "Связь с заданием или решением.", state: "Нет данных" },
    { label: "Предоставление", description: "Отдельный процесс для денежного Reward.", state: "Недоступно" },
    { label: "Сверка", description: "Подтверждающие записи и защита от дублей.", state: "Не подключено" },
  ],
  economy: [
    { label: "VX Points", description: "Основания, значения и лимиты повторения.", state: "Не настроено" },
    { label: "Trust Score", description: "События, веса, зоны и пересмотр.", state: "Не настроено" },
    { label: "Ранги", description: "Пороги и открываемые преимущества.", state: "Не настроено" },
  ],
  support: [
    { label: "Обращения", description: "Контекстный диалог с оператором.", state: "Пусто" },
    { label: "Апелляции", description: "Пересмотр спорного решения.", state: "Пусто" },
    { label: "Внутренние заметки", description: "Отделены от сообщений пользователя.", state: "Недоступно" },
  ],
  content: [
    { label: "Материалы", description: "Автор, версия и период актуальности.", state: "Пусто" },
    { label: "Прогнозы", description: "Предупреждение без гарантии результата.", state: "Пусто" },
    { label: "Редакционный процесс", description: "Черновик, проверка, публикация и архив.", state: "Не подключено" },
  ],
  notifications: [
    { label: "Шаблоны", description: "Текст по типу события и языку.", state: "Пусто" },
    { label: "Каналы", description: "Выбор с учётом пользовательских согласий.", state: "Не подключено" },
    { label: "История доставки", description: "Без дублирования одного события.", state: "Нет событий" },
  ],
  team: [
    { label: "Роли сотрудников", description: "Менеджер, проверяющий, поддержка, финансы, аудитор.", state: "Не утверждены" },
    { label: "Матрица прав", description: "Просмотр, публикация, проверка, финансы, администрирование.", state: "Не настроено" },
    { label: "Конфликт полномочий", description: "Критические операции требуют разделения ролей.", state: "Не подключено" },
  ],
  audit: [
    { label: "Журнал действий", description: "Автор, время, основание, до и после.", state: "Нет событий" },
    { label: "Экспорт", description: "Только разрешённый неизменяемый набор.", state: "Недоступно" },
    { label: "Критические события", description: "Финансы, роли, экономика и публикации.", state: "Нет событий" },
  ],
  settings: [
    { label: "Рынки", description: "Турция и Азербайджан как стартовая модель.", state: "Только просмотр" },
    { label: "Локализация", description: "Языки интерфейса и контента.", state: "Не подключено" },
    { label: "Системные ограничения", description: "Безопасные операционные пределы.", state: "Не настроено" },
  ],
};

export function getAdminSection(id: string) {
  return adminSections.find((section) => section.id === id);
}

export function getAdminEntity(sectionId: string, entityId: string) {
  const section = getAdminSection(sectionId);
  if (!section || section.entity.id !== entityId) return null;
  return { section, entity: section.entity };
}

export const adminReadiness = [
  { label: "Источники данных", value: "Не подключены", icon: ChartNoAxesCombined },
  { label: "Права сотрудников", value: "Не определены", icon: UsersRound },
  { label: "Изменения конфигурации", value: "Отключены", icon: Settings2 },
  { label: "Журнал действий", value: "Нет событий", icon: ClipboardList },
] as const;

export const adminOperationalAreas = [
  { label: "Результаты на проверке", state: "Нет данных", nextStep: "Подключить очередь результатов" },
  { label: "Обращения и апелляции", state: "Нет данных", nextStep: "Подключить Центр поддержки" },
  { label: "VX Rewards к предоставлению", state: "Нет данных", nextStep: "Подключить процесс предоставления" },
  { label: "Материалы к публикации", state: "Нет данных", nextStep: "Подключить редакционный процесс" },
] as const;
