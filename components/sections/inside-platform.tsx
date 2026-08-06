"use client";

import { motion } from "framer-motion";
import { ArrowRight, LayoutDashboard } from "lucide-react";

import { PlatformDashboard } from "@/components/platform-dashboard";
import { TrackedAccessLink } from "@/components/analytics/tracked-access-link";
import { Section } from "@/components/sections/section";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useI18n } from "@/components/i18n/i18n-provider";
import { publicContent } from "@/lib/i18n/public-content";
import { fadeUp, staggerContainer, viewport } from "@/lib/motion";

export function InsidePlatform() {
  const prefersReducedMotion = useReducedMotion();
  const { locale } = useI18n();
  const content = publicContent[locale].platform;
  const variants = prefersReducedMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : staggerContainer(0.1, 0.04);

  return (
    <Section
      id="platform"
      className="inside-platform"
      containerClassName="inside-platform__layout"
      aria-labelledby="inside-platform-title"
    >
      <div className="inside-platform__background" aria-hidden="true">
        <div className="inside-platform__line" />
        <div className="inside-platform__glow" />
      </div>

      <motion.div
        className="inside-platform__content"
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
      >
        <motion.div
          variants={prefersReducedMotion ? undefined : fadeUp}
          className="inside-platform__eyebrow"
        >
          <LayoutDashboard aria-hidden="true" />
          <span>{content.eyebrow}</span>
        </motion.div>

        <motion.h2
          variants={prefersReducedMotion ? undefined : fadeUp}
          id="inside-platform-title"
        >
          {content.title}
        </motion.h2>

        <motion.p variants={prefersReducedMotion ? undefined : fadeUp}>
          {content.description}
        </motion.p>

        <motion.div variants={prefersReducedMotion ? undefined : fadeUp}>
          <Button asChild size="lg" className="group rounded-xl shadow-glow">
            <TrackedAccessLink placement="process">
              {content.cta}
              <ArrowRight
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </TrackedAccessLink>
          </Button>
        </motion.div>
      </motion.div>

      <PlatformDashboard />
    </Section>
  );
}
