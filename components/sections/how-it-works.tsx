import { ArrowRight, CheckCircle2, FileText, SearchCheck, UserPlus } from "lucide-react";

import { PublicSection } from "@/components/sections/public-section";

const steps = [
  {
    icon: UserPlus,
    title: "Создайте аккаунт",
    text: "Выберите роль, укажите основные данные и получите доступ к личному кабинету.",
  },
  {
    icon: FileText,
    title: "Выберите предложение",
    text: "Ознакомьтесь с условиями, сроками и возможным вознаграждением до начала участия.",
  },
  {
    icon: SearchCheck,
    title: "Выполните инструкции",
    text: "Следуйте пошаговому заданию и отправьте результат на проверку.",
  },
  {
    icon: CheckCircle2,
    title: "Получите вознаграждение",
    text: "После подтверждения результат и начисление появятся в личном кабинете.",
  },
] as const;

export function HowItWorks() {
  return (
    <PublicSection
      id="process"
      eyebrow="Как это работает"
      title="Четыре простых шага"
      description="После регистрации вы сразу видите доступные возможности и условия участия."
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
