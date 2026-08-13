"use client";

import { motion } from "framer-motion";
import { Check, CircleUserRound, Headphones, History, MessageCircle, Settings, Sparkles } from "lucide-react";

import { useI18n } from "@/components/i18n/i18n-provider";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { publicContent } from "@/lib/i18n/public-content";

const itemIcons = [CircleUserRound, Headphones, MessageCircle, History, Settings] as const;

export function HeroVisual() {
  const prefersReducedMotion = useReducedMotion();
  const { locale } = useI18n();
  const content = publicContent[locale].heroVisual;

  return (
    <div className="hero-visual" role="img" aria-label={content.aria}>
      <div className="ecosystem-halo" />
      <div className="ecosystem-orbit ecosystem-orbit--outer" />
      <div className="ecosystem-orbit ecosystem-orbit--inner" />
      <div className="ecosystem-connection ecosystem-connection--one" />
      <div className="ecosystem-connection ecosystem-connection--two" />
      <div className="ecosystem-connection ecosystem-connection--three" />

      <motion.div
        className="account-panel"
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92, y: 18 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: prefersReducedMotion ? 0 : [0, -7, 0],
        }}
        transition={{
          opacity: { duration: 0.75 },
          scale: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
          y: { duration: 7, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <div className="account-panel__shine" />
        <div className="account-panel__header">
          <div className="account-panel__avatar"><Sparkles /></div>
          <div>
            <p>{content.title}</p>
            <span><Check /> {content.subtitle}</span>
          </div>
          <div className="account-panel__status">18+</div>
        </div>

        <div className="account-panel__value-list">
          {content.items.map((item, index) => {
            const Icon = itemIcons[index] ?? CircleUserRound;
            return <div key={item}><span><Icon /></span><p>{item}</p><Check /></div>;
          })}
        </div>
      </motion.div>

      <motion.div
        className="reward-card"
        initial={prefersReducedMotion ? false : { opacity: 0, x: 18, scale: 0.88 }}
        animate={{ opacity: 1, x: 0, scale: 1, y: prefersReducedMotion ? 0 : [0, -5, 0] }}
        transition={{
          opacity: { duration: 0.6, delay: 0.35 },
          scale: { duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] },
          y: { duration: 5.8, delay: 0.7, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <span className="reward-card__icon"><Headphones /></span>
        <span><small>{content.managerLabel}</small><strong>{content.managerValue}</strong></span>
      </motion.div>

      <motion.div
        className="conditions-card"
        initial={prefersReducedMotion ? false : { opacity: 0, x: -16, scale: 0.88 }}
        animate={{ opacity: 1, x: 0, scale: 1, y: prefersReducedMotion ? 0 : [0, 5, 0] }}
        transition={{
          opacity: { duration: 0.6, delay: 0.5 },
          scale: { duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] },
          y: { duration: 6.4, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <History />
        <span><small>{content.historyLabel}</small><strong>{content.historyValue}</strong></span>
      </motion.div>
    </div>
  );
}
