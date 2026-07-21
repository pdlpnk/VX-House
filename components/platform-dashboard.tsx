"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  CircleUserRound,
  ClipboardCheck,
  FileText,
  History,
  House,
  Layers3,
  ShieldCheck,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const navigation = [
  { label: "Обзор", icon: House, active: true },
  { label: "Возможности", icon: Layers3, active: false },
  { label: "История", icon: History, active: false },
] as const;

const route = [
  { label: "Условия доступны", icon: Layers3, state: "complete" },
  { label: "Инструкция изучена", icon: FileText, state: "complete" },
  { label: "Результат на проверке", icon: ClipboardCheck, state: "current" },
] as const;

export function PlatformDashboard() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="platform-preview" aria-label="Демонстрация маршрута в VX House">
      <div className="platform-preview__glow" aria-hidden="true" />

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="platform-window"
      >
        <aside className="platform-sidebar" aria-label="Пример разделов пространства">
          <div className="platform-sidebar__logo">VX</div>
          <div className="platform-sidebar__nav">
            {navigation.map(({ label, icon: Icon, active }) => (
              <div key={label} className="platform-sidebar__item" data-active={active || undefined} title={label}>
                <Icon aria-hidden="true" /><span>{label}</span>
              </div>
            ))}
          </div>
          <div className="platform-sidebar__profile" title="Профиль"><CircleUserRound aria-hidden="true" /></div>
        </aside>

        <div className="platform-workspace">
          <header className="platform-workspace__header">
            <div><span>Демонстрация пространства</span><h3>Прозрачный маршрут</h3></div>
            <span className="platform-demo-label">Без реальных данных</span>
          </header>

          <div className="platform-route">
            {route.map(({ label, icon: Icon, state }) => (
              <div className="platform-route__item" data-state={state} key={label}>
                <span><Icon aria-hidden="true" /></span>
                <div><small>{state === "current" ? "Текущий этап" : "Пройдено"}</small><strong>{label}</strong></div>
                {state === "complete" ? <Check aria-hidden="true" /> : null}
              </div>
            ))}
          </div>

          <div className="platform-dashboard-grid">
            <Card className="platform-action-card platform-card">
              <div className="platform-card__heading">
                <span className="platform-card__icon"><ClipboardCheck aria-hidden="true" /></span>
                <span className="platform-status"><i /> Ожидает решения</span>
              </div>
              <small>Следующий шаг</small>
              <h4>Дождаться проверки результата</h4>
              <p>После решения появится статус и понятное объяснение.</p>
            </Card>

            <Card className="platform-conditions-card platform-card">
              <div className="platform-card__heading">
                <span className="platform-card__icon"><ShieldCheck aria-hidden="true" /></span>
                <span>Условия</span>
              </div>
              <ul>
                <li><Check aria-hidden="true" /> Требования показаны заранее</li>
                <li><Check aria-hidden="true" /> Действие выполняется у партнёра</li>
                <li><Check aria-hidden="true" /> Причина решения сохраняется</li>
              </ul>
            </Card>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="platform-float platform-float--context"
        initial={reducedMotion ? false : { opacity: 0, x: 18, scale: 0.92 }}
        whileInView={{ opacity: 1, x: 0, scale: 1 }}
        animate={reducedMotion ? undefined : { y: [0, -4, 0] }}
        viewport={{ once: true }}
        transition={{ opacity: { duration: 0.55, delay: 0.35 }, scale: { duration: 0.55, delay: 0.35 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
      >
        <span><ArrowUpRight aria-hidden="true" /></span>
        <div><small>Внешнее действие</small><strong>Партнёрский сервис</strong></div>
      </motion.div>
    </div>
  );
}
