import { BadgeCheck, CircleDollarSign, Gauge, ShieldCheck } from "lucide-react";

import { PublicSection } from "@/components/sections/public-section";

export function Responsibility() {
  return (
    <PublicSection
      id="responsibility"
      eyebrow="Ответственное участие"
      title="Участвуйте осознанно"
      description="VX House предназначен только для совершеннолетних пользователей. Участие не является способом гарантированного заработка. Перед началом всегда изучайте условия предложения и оценивайте возможные риски."
      className="responsibility-section"
    >
      <div className="responsibility-rules responsibility-rules--compact" id="responsible-use">
        <article>
          <CircleDollarSign aria-hidden="true" />
          <div><h3>Не используйте заёмные средства</h3></div>
        </article>
        <article>
          <Gauge aria-hidden="true" />
          <div><h3>Устанавливайте личные лимиты</h3></div>
        </article>
        <article>
          <BadgeCheck aria-hidden="true" />
          <div><h3>Обращайтесь в поддержку при возникновении вопросов</h3></div>
        </article>
      </div>
      <p className="legal-note"><ShieldCheck aria-hidden="true" />VX House не принимает ставки, депозиты и не хранит игровой баланс.</p>
    </PublicSection>
  );
}
