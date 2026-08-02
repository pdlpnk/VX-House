"use client";

import Image from "next/image";

import { Container } from "@/components/container";
import { useI18n } from "@/components/i18n/i18n-provider";
import { publicContent } from "@/lib/i18n/public-content";

export function SiteFooter() {
  const { locale } = useI18n();
  const content = publicContent[locale].footer;
  return (
    <footer className="site-footer">
      <Container className="site-footer__layout">
        <div className="site-footer__brand">
          <span className="brand-logo brand-logo--footer" aria-hidden="true">
            <Image src="/vx-house-logo.jpg" alt="" width={232} height={232} unoptimized />
          </span>
          <p>{content.description}</p>
        </div>
        <nav aria-label={content.nav}>
          <a href="#responsibility">{content.terms}</a>
          <a href="#responsibility">{content.privacy}</a>
          <a href="#responsible-use">{content.responsibility}</a>
          <a href="#faq">{content.support}</a>
        </nav>
        <p className="site-footer__legal"><strong>18+</strong><span>{content.legal}</span></p>
      </Container>
    </footer>
  );
}
