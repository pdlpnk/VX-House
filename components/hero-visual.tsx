"use client";

import { motion } from "framer-motion";
import { Gift, Headphones, ShieldCheck, Sparkles } from "lucide-react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function HeroVisual() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="hero-visual" aria-hidden="true">
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
          <div className="account-panel__avatar">VX</div>
          <div>
            <p>Личный кабинет</p>
            <span><ShieldCheck /> Профиль защищён</span>
          </div>
          <div className="account-panel__status">Активен</div>
        </div>

        <div className="account-panel__balance">
          <span>Баланс привилегий</span>
          <strong>12 480</strong>
          <div className="account-panel__progress"><span /></div>
        </div>

        <div className="account-panel__metrics">
          <div><span>Уровень</span><strong>Прайм</strong></div>
          <div><span>Награды</span><strong>8</strong></div>
          <div><span>Поддержка</span><strong>24/7</strong></div>
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
        <span><small>Новое преимущество</small><strong>+ 1 250</strong></span>
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
        <Sparkles />
        <span><small>Особые условия</small><strong>Подключены</strong></span>
      </motion.div>

      <motion.div
        className="support-node"
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        <Headphones />
      </motion.div>

      <motion.div
        className="vx-token vx-token--one"
        animate={prefersReducedMotion ? undefined : { y: [0, -7, 0], rotate: [8, 13, 8] }}
        transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
      ><span>VX</span></motion.div>
      <motion.div
        className="vx-token vx-token--two"
        animate={prefersReducedMotion ? undefined : { y: [0, 6, 0], rotate: [-12, -6, -12] }}
        transition={{ duration: 7.1, repeat: Infinity, ease: "easeInOut" }}
      ><span>VX</span></motion.div>
    </div>
  );
}
