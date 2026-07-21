import { BookOpenCheck, Eye, Layers3, MessagesSquare, Route, ShieldCheck } from "lucide-react";

import { PublicSection } from "@/components/sections/public-section";

const benefits = [
  {
    icon: Eye,
    title: "Условия до действия",
    text: "Требования, ограничения и способ подтверждения доступны заранее.",
  },
  {
    icon: Route,
    title: "Один следующий шаг",
    text: "Интерфейс показывает текущее состояние и главное действие без лишнего шума.",
  },
  {
    icon: BookOpenCheck,
    title: "Инструкции в контексте",
    text: "Материалы связаны с конкретной возможностью и не теряются в переписках.",
  },
  {
    icon: ShieldCheck,
    title: "Подтверждённое важнее обещанного",
    text: "Преимущество считается полученным только после проверки результата.",
  },
  {
    icon: MessagesSquare,
    title: "Контекст сохраняется",
    text: "Статусы, решения и связанные сообщения остаются частью единой истории.",
  },
  {
    icon: Layers3,
    title: "Разные сущности — разные смыслы",
    text: "VX Rewards обозначает подтверждённые преимущества, а VX Points — отдельные неденежные баллы прогресса.",
  },
] as const;

export function Benefits() {
  return (
    <PublicSection
      id="benefits"
      eyebrow="Преимущества подхода"
      title="Доверие строится на ясности"
      description="VX House не подталкивает к спешке. Платформа помогает понять условия, выполнить только осознанное действие и увидеть объяснимый итог."
      className="benefits-section"
    >
      <div className="benefits-grid">
        {benefits.map(({ icon: Icon, title, text }, index) => (
          <article className="benefit-card" key={title} data-featured={index === 3 || undefined}>
            <span className="benefit-card__icon"><Icon aria-hidden="true" /></span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </PublicSection>
  );
}
