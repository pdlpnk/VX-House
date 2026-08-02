"use client";

import { BriefcaseBusiness, CircleUserRound, ShieldCheck } from "lucide-react";

import { useI18n } from "@/components/i18n/i18n-provider";
import { PublicSection } from "@/components/sections/public-section";
import { publicContent } from "@/lib/i18n/public-content";

const icons = [CircleUserRound, BriefcaseBusiness] as const;

export function ProductModel() {
  const { locale } = useI18n();
  const content = publicContent[locale].model;
  return (
    <PublicSection
      id="model"
      eyebrow={content.eyebrow}
      title={content.title}
      description={content.description}
      className="product-model"
    >
      <div className="role-grid" aria-label={content.aria}>
        {content.roles.map(({ label, title, description, points }, index) => {
          const Icon = icons[index] ?? CircleUserRound;
          return (
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
          );
        })}
      </div>
      <p className="model-boundary">
        {content.boundary}
      </p>
    </PublicSection>
  );
}
