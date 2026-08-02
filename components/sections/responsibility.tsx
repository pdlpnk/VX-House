"use client";

import { BadgeCheck, CircleDollarSign, Gauge, ShieldCheck } from "lucide-react";

import { useI18n } from "@/components/i18n/i18n-provider";
import { PublicSection } from "@/components/sections/public-section";
import { publicContent } from "@/lib/i18n/public-content";

export function Responsibility() {
  const { locale } = useI18n();
  const content = publicContent[locale].responsibility;
  return (
    <PublicSection
      id="responsibility"
      eyebrow={content.eyebrow}
      title={content.title}
      description={content.description}
      className="responsibility-section"
    >
      <div className="responsibility-rules responsibility-rules--compact" id="responsible-use">
        <article>
          <CircleDollarSign aria-hidden="true" />
          <div><h3>{content.rules[0]}</h3></div>
        </article>
        <article>
          <Gauge aria-hidden="true" />
          <div><h3>{content.rules[1]}</h3></div>
        </article>
        <article>
          <BadgeCheck aria-hidden="true" />
          <div><h3>{content.rules[2]}</h3></div>
        </article>
      </div>
      <p className="legal-note"><ShieldCheck aria-hidden="true" />{content.note}</p>
    </PublicSection>
  );
}
