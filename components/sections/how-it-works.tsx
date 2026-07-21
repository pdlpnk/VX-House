import { ArrowRight, CheckCircle2, ExternalLink, FileText, SearchCheck } from "lucide-react";

import { PublicSection } from "@/components/sections/public-section";

const steps = [
  {
    icon: SearchCheck,
    title: "Доступная возможность",
    text: "Пользователь видит условия, ограничения и ожидаемый результат до начала действия.",
  },
  {
    icon: FileText,
    title: "Пошаговая инструкция",
    text: "VX House объясняет порядок действий и способ подтверждения без скрытых требований.",
  },
  {
    icon: ExternalLink,
    title: "Действие у партнёра",
    text: "Необходимое действие выполняется во внешнем партнёрском сервисе, а не внутри VX House.",
  },
  {
    icon: CheckCircle2,
    title: "Проверенный результат",
    text: "Результат отправляется на проверку. Статус и причина решения остаются понятными пользователю.",
  },
] as const;

export function HowItWorks() {
  return (
    <PublicSection
      id="process"
      eyebrow="Как работает платформа"
      title="От условия до результата — один прозрачный маршрут"
      description="На каждом этапе понятно, что делать дальше, где происходит действие и когда результат можно считать подтверждённым."
      className="process-section"
    >
      <ol className="process-list">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <li className="process-step" key={title}>
            <div className="process-step__index">{String(index + 1).padStart(2, "0")}</div>
            <span className="process-step__icon"><Icon aria-hidden="true" /></span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
            {index < steps.length - 1 ? <ArrowRight className="process-step__arrow" aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>
    </PublicSection>
  );
}
