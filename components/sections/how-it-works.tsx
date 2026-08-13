"use client";

import { ArrowRight, CircleUserRound, MailCheck, MessageCircle, UserPlus } from "lucide-react";

import { useI18n } from "@/components/i18n/i18n-provider";
import { PublicSection } from "@/components/sections/public-section";
import { publicContent } from "@/lib/i18n/public-content";

const icons = [CircleUserRound, UserPlus, MailCheck, MessageCircle] as const;

export function HowItWorks() {
  const { locale } = useI18n();
  const content = publicContent[locale].process;
  return (
    <PublicSection
      id="process"
      eyebrow={content.eyebrow}
      title={content.title}
      description={content.description}
      className="process-section"
    >
      <ol className="process-list">
        {content.steps.map(([title, text], index) => {
          const Icon = icons[index] ?? UserPlus;
          return (
          <li className="process-step" key={title}>
            <div className="process-step__index">{String(index + 1).padStart(2, "0")}</div>
            <span className="process-step__icon"><Icon aria-hidden="true" /></span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
            {index < content.steps.length - 1 ? <ArrowRight className="process-step__arrow" aria-hidden="true" /> : null}
          </li>
          );
        })}
      </ol>
    </PublicSection>
  );
}
