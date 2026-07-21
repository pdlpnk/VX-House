"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Crown,
  Gift,
  Headphones,
  History,
  House,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const activity = [
  { title: "Условия обновлены", time: "Сегодня, 14:20", icon: Sparkles },
  { title: "Профиль подтверждён", time: "Вчера, 18:45", icon: ShieldCheck },
  { title: "Обращение закрыто", time: "12 июля, 11:10", icon: Headphones },
] as const;

const navigation = [
  { label: "Главная", icon: House, active: true },
  { label: "Преимущества", icon: Gift, active: false },
  { label: "История", icon: History, active: false },
] as const;

export function PlatformDashboard() {
  const prefersReducedMotion = useReducedMotion();
  const enter = prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0, scale: 1 };

  return (
    <div className="platform-preview" aria-label="Макет личного кабинета VX House">
      <div className="platform-preview__glow" aria-hidden="true" />
      <div className="platform-preview__orbit platform-preview__orbit--one" aria-hidden="true" />
      <div className="platform-preview__orbit platform-preview__orbit--two" aria-hidden="true" />

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
        whileInView={enter}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="platform-window"
      >
        <aside className="platform-sidebar" aria-label="Разделы личного кабинета">
          <div className="platform-sidebar__logo">VX</div>
          <div className="platform-sidebar__nav">
            {navigation.map(({ label, icon: Icon, active }) => (
              <div
                key={label}
                className="platform-sidebar__item"
                data-active={active || undefined}
                title={label}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="platform-sidebar__profile" title="Профиль">
            <CircleUserRound aria-hidden="true" />
          </div>
        </aside>

        <div className="platform-workspace">
          <header className="platform-workspace__header">
            <div>
              <span>Личный кабинет</span>
              <h3>Добрый вечер, Алексей</h3>
            </div>
            <div className="platform-notification" aria-label="Два новых уведомления">
              <Bell aria-hidden="true" />
              <span>2</span>
            </div>
          </header>

          <div className="platform-dashboard-grid">
            <Card className="profile-status-card platform-card">
              <div className="profile-status-card__top">
                <div className="platform-card__icon"><ShieldCheck aria-hidden="true" /></div>
                <span className="platform-status"><i /> Подтверждён</span>
              </div>
              <div className="profile-status-card__copy">
                <span>Статус профиля</span>
                <strong>Полный доступ</strong>
                <p>Все возможности платформы доступны</p>
              </div>
            </Card>

            <Card className="member-level-card platform-card">
              <div className="member-level-card__top">
                <div className="platform-card__icon"><Crown aria-hidden="true" /></div>
                <span>Уровень участника</span>
              </div>
              <strong>Прайм</strong>
              <div className="member-level-card__progress" aria-label="Прогресс уровня: 72 процента">
                <span />
              </div>
              <small>Следующее обновление через 28 дней</small>
            </Card>

            <Card className="conditions-overview-card platform-card">
              <div className="conditions-overview-card__heading">
                <div>
                  <span>Специальные условия</span>
                  <strong>3 активных</strong>
                </div>
                <Sparkles aria-hidden="true" />
              </div>
              <div className="conditions-overview-card__row">
                <span><Check aria-hidden="true" /> Персональные условия</span>
                <ChevronRight aria-hidden="true" />
              </div>
              <div className="conditions-overview-card__row">
                <span><Check aria-hidden="true" /> Приоритетная поддержка</span>
                <ChevronRight aria-hidden="true" />
              </div>
            </Card>

            <Card className="activity-card platform-card">
              <div className="activity-card__heading">
                <div>
                  <span>История активности</span>
                  <strong>Последние события</strong>
                </div>
                <Clock3 aria-hidden="true" />
              </div>
              <div className="activity-card__list">
                {activity.map(({ title, time, icon: Icon }) => (
                  <div key={title} className="activity-card__item">
                    <div className="activity-card__icon"><Icon aria-hidden="true" /></div>
                    <div><strong>{title}</strong><span>{time}</span></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="platform-float platform-float--support"
        initial={prefersReducedMotion ? false : { opacity: 0, x: 18, scale: 0.9 }}
        whileInView={{ opacity: 1, x: 0, scale: 1 }}
        animate={prefersReducedMotion ? undefined : { y: [0, -5, 0] }}
        viewport={{ once: true }}
        transition={{
          opacity: { duration: 0.55, delay: 0.35 },
          scale: { duration: 0.55, delay: 0.35 },
          y: { duration: 6.5, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <span><Headphones aria-hidden="true" /></span>
        <div><small>Поддержка</small><strong><i /> На связи</strong></div>
      </motion.div>

      <motion.div
        className="platform-float platform-float--notice"
        initial={prefersReducedMotion ? false : { opacity: 0, x: -18, scale: 0.9 }}
        whileInView={{ opacity: 1, x: 0, scale: 1 }}
        animate={prefersReducedMotion ? undefined : { y: [0, 5, 0] }}
        viewport={{ once: true }}
        transition={{
          opacity: { duration: 0.55, delay: 0.5 },
          scale: { duration: 0.55, delay: 0.5 },
          y: { duration: 7.2, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <span><Bell aria-hidden="true" /></span>
        <div><small>Новое уведомление</small><strong>Условия обновлены</strong></div>
      </motion.div>
    </div>
  );
}
