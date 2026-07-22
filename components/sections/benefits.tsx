import { BookOpenCheck, Eye, Gift, Headphones, History, ShieldCheck } from "lucide-react";

import { PublicSection } from "@/components/sections/public-section";

const benefits = [
  {
    icon: Eye,
    title: "Условия, которых нет в открытом доступе",
    text: "Пользователи получают доступ к специальным предложениям и программам партнёров.",
  },
  {
    icon: Gift,
    title: "Прозрачные вознаграждения",
    text: "Размер, правила и статус начисления отображаются в личном кабинете.",
  },
  {
    icon: BookOpenCheck,
    title: "Понятные инструкции",
    text: "Каждое задание содержит конкретные шаги, сроки и требования.",
  },
  {
    icon: Headphones,
    title: "Быстрая поддержка",
    text: "Команда помогает разобраться с заданием, проверкой или начислением.",
  },
  {
    icon: History,
    title: "История всех действий",
    text: "Задания, результаты, обращения и начисления сохраняются в профиле.",
  },
  {
    icon: ShieldCheck,
    title: "Проверенные партнёрские программы",
    text: "Перед публикацией предложения проходят внутреннюю проверку и модерацию.",
  },
] as const;

export function Benefits() {
  return (
    <PublicSection
      id="benefits"
      eyebrow="Почему VX House"
      title="Больше условий. Меньше неопределённости."
      description="Мы собрали предложения, задания, поддержку и систему вознаграждений в одном пространстве, чтобы пользователь заранее понимал правила и видел историю каждого действия."
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
