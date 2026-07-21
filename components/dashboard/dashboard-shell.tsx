"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bell,
  ChevronRight,
  CircleHelp,
  Grid2X2,
  House,
  Menu,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardProvider, useDashboard } from "@/components/dashboard/dashboard-provider";
import { roleLabel } from "@/lib/dashboard-data";

const navigation = [
  { label: "Главная", href: "/dashboard", icon: House },
  { label: "Профиль", href: "/dashboard/profile", icon: UserRound },
  { label: "Возможности", href: "/dashboard/opportunities", icon: Sparkles },
  { label: "Активность", href: "/dashboard/activity", icon: Activity },
  { label: "Поддержка", href: "/dashboard/support", icon: CircleHelp },
  { label: "Настройки", href: "/dashboard/settings", icon: Settings },
] as const;

const pageTitles: Record<string, string> = {
  "/dashboard": "Главная",
  "/dashboard/profile": "Профиль",
  "/dashboard/opportunities": "Возможности",
  "/dashboard/activity": "Активность",
  "/dashboard/support": "Поддержка",
  "/dashboard/settings": "Настройки",
};

function DashboardNavigation({ onNavigate, mobile = false }: { onNavigate?: () => void; mobile?: boolean }) {
  const pathname = usePathname();
  const { profile, shouldReduceMotion } = useDashboard();

  return (
    <div className={styles.navigationInner}>
      <div>
        <Link href="/dashboard" className={styles.dashboardLogo} onClick={onNavigate} aria-label="VX House — главная кабинета">
          <span aria-hidden="true">
            <Image src="/vx-house-logo.jpg" alt="" width={232} height={232} priority unoptimized />
          </span>
        </Link>
        {mobile && <span className={styles.mobileMenuLabel}>Навигация</span>}
        <nav className={styles.dashboardNav} aria-label="Навигация личного кабинета">
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={styles.navLink}
                data-active={active || undefined}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
                {active && (
                  <motion.i
                    aria-hidden="true"
                    layoutId={mobile ? "dashboard-mobile-active-marker" : "dashboard-active-marker"}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={styles.sidebarFooter}>
        <Link href="/" className={styles.publicLink} onClick={onNavigate}>
          <Grid2X2 aria-hidden="true" />
          Публичная страница
          <ChevronRight aria-hidden="true" />
        </Link>
        <Link href="/dashboard/profile" className={styles.sidebarProfile} onClick={onNavigate}>
          <span>{profile.name.charAt(0).toLocaleUpperCase("ru")}</span>
          <div>
            <strong>{profile.name}</strong>
            <small>{roleLabel(profile.role)}</small>
          </div>
        </Link>
      </div>
    </div>
  );
}

function DashboardShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, shouldReduceMotion } = useDashboard();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (notificationsOpen) setNotificationsOpen(false);
      if (menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, notificationsOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const frame = window.requestAnimationFrame(() => mobileCloseRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [menuOpen]);

  const notifications = profile.role === "partner"
    ? ["Статус сотрудничества обновлён", "Условия готовы к ознакомлению", "Партнёрская поддержка доступна"]
    : ["Персональные условия обновлены", "Уровень участника подтверждён", "Поддержка доступна"];
  const notificationCount = profile.notificationsEnabled ? notifications.length : 0;

  return (
    <div className={styles.dashboardShell} data-reduced-motion={shouldReduceMotion || undefined}>
      <aside className={styles.sidebar}><DashboardNavigation /></aside>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              className={styles.mobileOverlay}
              aria-label="Закрыть меню"
              onClick={() => setMenuOpen(false)}
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              id="dashboard-mobile-menu"
              className={styles.mobileSidebar}
              role="dialog"
              aria-modal="true"
              aria-label="Меню личного кабинета"
              initial={shouldReduceMotion ? false : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={shouldReduceMotion ? undefined : { x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <button ref={mobileCloseRef} type="button" className={styles.mobileClose} onClick={() => setMenuOpen(false)} aria-label="Закрыть меню">
                <X aria-hidden="true" />
              </button>
              <DashboardNavigation mobile onNavigate={() => setMenuOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className={styles.dashboardMainColumn}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>
            <button
              ref={menuButtonRef}
              type="button"
              className={styles.menuButton}
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="dashboard-mobile-menu"
              aria-label="Открыть меню"
            >
              <Menu aria-hidden="true" />
            </button>
            <div>
              <span>Личное пространство</span>
              <strong>{pageTitles[pathname] ?? "VX House"}</strong>
            </div>
          </div>

          <div className={styles.topbarActions}>
            <div className={styles.notificationsWrap}>
              <button
                type="button"
                className={styles.notificationButton}
                aria-label={notificationCount ? `Уведомления: ${notificationCount} новых` : "Новых уведомлений нет"}
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell aria-hidden="true" />
                {notificationCount > 0 && <span>{notificationCount}</span>}
              </button>
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    className={styles.notificationsPanel}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
                    role="region"
                    aria-label="Новые уведомления"
                  >
                    <div className={styles.notificationsHeader}>
                      <strong>Уведомления</strong>
                      <span>{notificationCount > 0 ? `${notificationCount} новых` : "Всё просмотрено"}</span>
                    </div>
                    {notificationCount > 0 ? (
                      <ul>
                        {notifications.map((item) => <li key={item}><i /><span>{item}</span><small>сегодня</small></li>)}
                      </ul>
                    ) : (
                      <p className={styles.notificationsEmpty}>Новых уведомлений нет.</p>
                    )}
                    <Link href="/dashboard/activity" onClick={() => setNotificationsOpen(false)}>Открыть активность</Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/dashboard/profile" className={styles.topbarProfile} aria-label="Открыть профиль">
              <span>{profile.name.charAt(0).toLocaleUpperCase("ru")}</span>
              <div>
                <strong>{profile.name}</strong>
                <small>{roleLabel(profile.role)}</small>
              </div>
            </Link>
          </div>
        </header>

        <main id="main-content" className={styles.dashboardMain}>{children}</main>

        <nav className={styles.mobileBottomNav} aria-label="Быстрая навигация">
          {navigation.slice(0, 5).map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return <Link key={href} href={href} data-active={active || undefined} aria-current={active ? "page" : undefined}><Icon aria-hidden="true" /><span>{label}</span></Link>;
          })}
        </nav>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return <DashboardProvider><DashboardShellContent>{children}</DashboardShellContent></DashboardProvider>;
}
