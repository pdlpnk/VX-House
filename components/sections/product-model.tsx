import { BriefcaseBusiness, CircleUserRound, ShieldCheck } from "lucide-react";

import { PublicSection } from "@/components/sections/public-section";

const roles = [
  {
    icon: CircleUserRound,
    label: "Игрок",
    title: "Личный маршрут без догадок",
    description:
      "Вы видите доступные персональные условия, изучаете инструкцию и отслеживаете проверку результата в одном пространстве.",
    points: ["Понятные требования до действия", "История статусов и результатов"],
  },
  {
    icon: BriefcaseBusiness,
    label: "Партнёр",
    title: "Сотрудничество в едином контексте",
    description:
      "Рабочие условия, материалы и статусы взаимодействия собраны в последовательный процесс без разрозненных переписок.",
    points: ["Условия и материалы в одном месте", "Прозрачный статус взаимодействия"],
  },
] as const;

export function ProductModel() {
  return (
    <PublicSection
      id="model"
      eyebrow="Что такое VX House"
      title="Платформа, которая делает условия понятными"
      description="VX House помогает совершеннолетним пользователям и партнёрам пройти путь от доступной возможности до проверенного результата. Действия выполняются на стороне партнёрских сервисов, а VX House сохраняет инструкцию, контекст и статус."
      className="product-model"
    >
      <div className="role-grid" aria-label="Сценарии использования VX House">
        {roles.map(({ icon: Icon, label, title, description, points }) => (
          <article className="role-card" key={label}>
            <div className="role-card__top">
              <span className="role-card__icon"><Icon aria-hidden="true" /></span>
              <span className="role-card__label">Сценарий · {label}</span>
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
        VX House не принимает ставки или депозиты, не хранит игровой баланс и не обещает гарантированный результат.
      </p>
    </PublicSection>
  );
}
