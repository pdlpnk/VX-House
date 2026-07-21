import { ExternalLink, Globe2, LockKeyhole, ShieldCheck } from "lucide-react";

import { PublicSection } from "@/components/sections/public-section";

export function Responsibility() {
  return (
    <PublicSection
      id="responsibility"
      eyebrow="Ответственное использование"
      title="Спокойный продукт с чёткими границами"
      description="VX House предназначен только для совершеннолетних. Доступность условий, юридические формулировки и правила обработки данных определяются отдельно для каждого рынка."
      className="responsibility-section"
    >
      <div className="responsibility-panel">
        <div className="markets-card">
          <div className="markets-card__heading">
            <span><Globe2 aria-hidden="true" /></span>
            <div>
              <small>Стартовые рынки</small>
              <h3>Турция и Азербайджан</h3>
            </div>
          </div>
          <p>Конкретные партнёры и условия показываются только после подтверждения доступности для страны пользователя.</p>
          <div className="market-list" aria-label="Стартовые рынки VX House">
            <span>Турция</span>
            <span>Азербайджан</span>
          </div>
        </div>
        <div className="responsibility-rules">
          <article id="responsible-use">
            <ShieldCheck aria-hidden="true" />
            <div><h3>Только осознанное участие</h3><p>Без гарантий дохода или результата, ложных таймеров и искусственного дефицита.</p></div>
          </article>
          <article>
            <ExternalLink aria-hidden="true" />
            <div><h3>Действия происходят у партнёров</h3><p>VX House сопровождает процесс, но не принимает ставки, депозиты и не хранит игровой баланс.</p></div>
          </article>
          <article id="privacy">
            <LockKeyhole aria-hidden="true" />
            <div><h3>Минимум необходимых данных</h3><p>Правила согласия, хранения и удаления данных публикуются для каждого рынка до запуска.</p></div>
          </article>
        </div>
      </div>
      <p className="legal-note">Юридические условия для Турции и Азербайджана проходят отдельную проверку до публикации предложений.</p>
    </PublicSection>
  );
}
