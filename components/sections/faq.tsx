"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { PublicSection } from "@/components/sections/public-section";
import { publicContent } from "@/lib/i18n/public-content";

export function Faq() {
  const { locale } = useI18n();
  const content = publicContent[locale].faq;
  return (
    <PublicSection
      id="faq"
      eyebrow={content.eyebrow}
      title={content.title}
      description={content.description}
      className="faq-section"
    >
      <div className="faq-list">
        {content.items.map(([question, answer]) => (
          <details key={question}>
            <summary><span>{question}</span><i aria-hidden="true" /></summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
      <div className="faq-cta">
        <div><small>{content.ctaLabel}</small><h3>{content.ctaTitle}</h3><p>{content.ctaText}</p><span>{content.ctaNote}</span></div>
        <a href="/access">{content.cta}</a>
      </div>
    </PublicSection>
  );
}
