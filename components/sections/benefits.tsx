"use client";

import { CircleUserRound, Headphones, History, MessageCircle, Settings, ShieldCheck } from "lucide-react";

import { useI18n } from "@/components/i18n/i18n-provider";
import { PublicSection } from "@/components/sections/public-section";
import { publicContent } from "@/lib/i18n/public-content";

const icons = [CircleUserRound, MessageCircle, History, Headphones, Settings, ShieldCheck] as const;

export function Benefits() {
  const { locale } = useI18n();
  const content = publicContent[locale].benefits;
  return (
    <PublicSection
      id="benefits"
      eyebrow={content.eyebrow}
      title={content.title}
      description={content.description}
      className="benefits-section"
    >
      <div className="benefits-grid">
        {content.items.map(([title, text], index) => {
          const Icon = icons[index] ?? CircleUserRound;
          return (
          <article className="benefit-card" key={title} data-featured={index === 3 || undefined}>
            <span className="benefit-card__icon"><Icon aria-hidden="true" /></span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
          );
        })}
      </div>
    </PublicSection>
  );
}
