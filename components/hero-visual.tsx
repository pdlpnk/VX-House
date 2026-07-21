"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, FileCheck2, ListChecks, ShieldCheck } from "lucide-react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function HeroVisual() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="hero-visual" role="img" aria-label="Пример прозрачного маршрута в VX House">
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
          <div className="account-panel__avatar"><ListChecks /></div>
          <div>
            <p>Маршрут в VX House</p>
            <span><ShieldCheck /> Условия видны заранее</span>
          </div>
          <div className="account-panel__status">Пример</div>
        </div>

        <div className="account-panel__route">
          <div><span><Check /></span><p>Возможность</p></div>
          <ArrowRight />
          <div><span><Check /></span><p>Инструкция</p></div>
          <ArrowRight />
          <div data-current><span><FileCheck2 /></span><p>Проверка</p></div>
        </div>

        <div className="account-panel__note">
          <span>Следующий шаг</span>
          <strong>Отправить результат на проверку</strong>
          <small>Итог становится подтверждённым только после проверки VX House.</small>
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
        <span className="reward-card__icon"><FileCheck2 /></span>
        <span><small>Результат</small><strong>Проверяется прозрачно</strong></span>
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
        <ListChecks />
        <span><small>Перед действием</small><strong>Понятная инструкция</strong></span>
      </motion.div>
    </div>
  );
}
