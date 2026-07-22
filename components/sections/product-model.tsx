import { BriefcaseBusiness, CircleUserRound, ShieldCheck } from "lucide-react";

import { PublicSection } from "@/components/sections/public-section";

const roles = [
  {
    icon: CircleUserRound,
    label: "Для игрока",
    title: "Специальные условия и вознаграждения",
    description:
      "Получайте доступ к предложениям партнёров, выполняйте понятные задания и получайте кешбэк, бонусы и другие вознаграждения по условиям программы.",
    points: [
      "Условия известны заранее",
      "Пошаговые инструкции",
      "История заданий и начислений",
      "Поддержка на каждом этапе",
    ],
  },
  {
    icon: BriefcaseBusiness,
    label: "Для партнёра",
    title: "Готовые сценарии и сопровождение",
    description:
      "Получайте прогнозы, материалы и рабочие сценарии, отслеживайте статусы и обращайтесь за помощью внутри платформы.",
    points: [
      "Прогнозы и материалы",
      "Понятные рабочие сценарии",
      "Контроль статусов",
      "Поддержка и сопровождение",
    ],
  },
] as const;

export function ProductModel() {
  return (
    <PublicSection
      id="model"
      eyebrow="Возможности VX House"
      title="Всё необходимое в одном месте"
      description="Вы видите доступные предложения, заранее знакомитесь с условиями, выполняете необходимые действия и отслеживаете вознаграждения в личном кабинете."
      className="product-model"
    >
      <div className="role-grid" aria-label="Сценарии использования VX House">
        {roles.map(({ icon: Icon, label, title, description, points }) => (
          <article className="role-card" key={label}>
            <div className="role-card__top">
              <span className="role-card__icon"><Icon aria-hidden="true" /></span>
              <span className="role-card__label">{label}</span>
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
            <ul>
              {points.map((point) => (
                <li key={point}><ShieldCheck aria-hidden="true" />{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className="model-boundary">
        VX House не принимает ставки и не хранит пользовательские средства. Все действия выполняются на стороне партнёрских сервисов.
      </p>
    </PublicSection>
  );
}
