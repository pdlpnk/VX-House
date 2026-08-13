"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  CircleUserRound,
  Headphones,
  House,
  MessageCircle,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { useI18n } from "@/components/i18n/i18n-provider";
import { Card } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { publicContent } from "@/lib/i18n/public-content";

const navigationIcons = [House, Headphones, Settings] as const;
const routeIcons = [CircleUserRound, MessageCircle, Settings] as const;

export function PlatformDashboard() {
  const reducedMotion = useReducedMotion();
  const { locale } = useI18n();
  const content = publicContent[locale].preview;

  return (
    <div className="platform-preview" aria-label={content.aria}>
      <div className="platform-preview__glow" aria-hidden="true" />

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="platform-window"
      >
        <aside className="platform-sidebar" aria-label={content.navigationAria}>
          <div className="platform-sidebar__logo">VX</div>
          <div className="platform-sidebar__nav">
            {content.navigation.map((label, index) => {
              const Icon = navigationIcons[index] ?? House;
              return (
              <div key={label} className="platform-sidebar__item" data-active={index === 0 || undefined} title={label}>
                <Icon aria-hidden="true" /><span>{label}</span>
              </div>
              );
            })}
          </div>
          <div className="platform-sidebar__profile" title={content.profile}><CircleUserRound aria-hidden="true" /></div>
        </aside>

        <div className="platform-workspace">
          <header className="platform-workspace__header">
            <div><span>{content.demo}</span><h3>{content.account}</h3></div>
            <span className="platform-demo-label">{content.noRealData}</span>
          </header>

          <div className="platform-route">
            {content.route.map((label, index) => {
              const Icon = routeIcons[index] ?? CircleUserRound;
              const state = index === content.route.length - 1 ? "current" : "complete";
              return (
              <div className="platform-route__item" data-state={state} key={label}>
                <span><Icon aria-hidden="true" /></span>
                <div><small>{state === "current" ? content.available : content.primarySection}</small><strong>{label}</strong></div>
                {state === "complete" ? <Check aria-hidden="true" /> : null}
              </div>
              );
            })}
          </div>

          <div className="platform-dashboard-grid">
            <Card className="platform-action-card platform-card">
              <div className="platform-card__heading">
                <span className="platform-card__icon"><MessageCircle aria-hidden="true" /></span>
                <span className="platform-status"><i /> {content.alwaysAvailable}</span>
              </div>
              <small>{content.actionLabel}</small>
              <h4>{content.actionTitle}</h4>
              <p>{content.actionText}</p>
            </Card>

            <Card className="platform-conditions-card platform-card">
              <div className="platform-card__heading">
                <span className="platform-card__icon"><ShieldCheck aria-hidden="true" /></span>
                <span>{content.inAccount}</span>
              </div>
              <ul>
                {content.details.map((detail) => <li key={detail}><Check aria-hidden="true" /> {detail}</li>)}
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
        <div><small>{content.together}</small><strong>{content.historySaved}</strong></div>
      </motion.div>
    </div>
  );
}
