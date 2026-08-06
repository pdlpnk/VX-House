"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { Container } from "@/components/container";
import { TrackedAccessLink } from "@/components/analytics/tracked-access-link";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const navigation = [
  { label: "nav.opportunities" as const, href: "#model" },
  { label: "nav.process" as const, href: "#process" },
  { label: "nav.benefits" as const, href: "#benefits" },
  { label: "nav.faq" as const, href: "#faq" },
] as const;

export function SiteHeader() {
  const prefersReducedMotion = useReducedMotion();
  const { t } = useI18n();

  return (
    <motion.header
      initial={prefersReducedMotion ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="site-header"
    >
      <Container className="site-header__inner">
        <a
          href="#top"
          className="site-header__brand group inline-flex items-center gap-2.5 rounded-md"
          aria-label="VX House — home"
        >
          <span className="brand-logo" aria-hidden="true">
            <Image
              src="/vx-house-logo.jpg"
              alt=""
              width={232}
              height={232}
              priority
              unoptimized
            />
          </span>
        </a>

        <nav
          aria-label={t("nav.main")}
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 min-[900px]:flex"
        >
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(item.label)}
            </a>
          ))}
        </nav>

        <div className="site-header__tools">
          <LanguageSwitcher className="site-header__language" />
          <Button asChild size="sm" variant="ghost" className="site-header__login rounded-lg px-3.5">
            <a href="/access?mode=login">{t("nav.login")}</a>
          </Button>
          <Button asChild size="sm" className="site-header__access rounded-lg px-3.5">
            <TrackedAccessLink placement="header">
              <span>{t("nav.access")}</span>
              <ArrowUpRight aria-hidden="true" />
            </TrackedAccessLink>
          </Button>
        </div>
      </Container>
    </motion.header>
  );
}
