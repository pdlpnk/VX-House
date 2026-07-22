"use client";

import { motion } from "framer-motion";
import { Check, Gift, Headphones, History, ListChecks, Sparkles } from "lucide-react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function HeroVisual() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="hero-visual" role="img" aria-label="Возможности личного кабинета VX House">
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
            <p>Что доступно в VX House</p>
            <span><Check /> Правила и сроки видны заранее</span>
          </div>
          <div className="account-panel__status">18+</div>
        </div>

        <div className="account-panel__value-list">
          <div><span><Sparkles /></span><p>Персональные предложения</p><Check /></div>
          <div><span><ListChecks /></span><p>Задания и инструкции</p><Check /></div>
          <div><span><Gift /></span><p>Кешбэк и вознаграждения</p><Check /></div>
          <div><span><Headphones /></span><p>Поддержка</p><Check /></div>
          <div><span><History /></span><p>История начислений</p><Check /></div>
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
        <span className="reward-card__icon"><Gift /></span>
        <span><small>По условиям предложения</small><strong>Кешбэк и награды</strong></span>
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
        <Headphones />
        <span><small>Когда нужна помощь</small><strong>Поддержка рядом</strong></span>
      </motion.div>
    </div>
  );
}
