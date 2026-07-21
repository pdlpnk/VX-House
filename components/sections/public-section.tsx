"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { Section } from "@/components/sections/section";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeUp, viewport } from "@/lib/motion";

type PublicSectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

export function PublicSection({
  id,
  eyebrow,
  title,
  description,
  children,
  className = "",
}: PublicSectionProps) {
  const reducedMotion = useReducedMotion();

  return (
    <Section
      id={id}
      className={`public-section ${className}`}
      containerClassName="public-section__container"
      aria-labelledby={`${id}-title`}
    >
      <motion.header
        className="public-section__header"
        initial={reducedMotion ? false : "hidden"}
        whileInView="visible"
        viewport={viewport}
        variants={reducedMotion ? undefined : fadeUp}
      >
        <span className="public-eyebrow">{eyebrow}</span>
        <h2 id={`${id}-title`}>{title}</h2>
        <p>{description}</p>
      </motion.header>
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.68, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </Section>
  );
}
