"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronRight, Coins, Grid2X2, LogOut, Medal, Menu, Search, ShieldCheck, X, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardProvider, useDashboard } from "@/components/dashboard/dashboard-provider";
import { PersonalMessengerExperience } from "@/components/messenger/personal-messenger";
import type { DashboardPreferences } from "@/lib/dashboard-data";
import type { SafeProfileDTO } from "@/lib/repositories";
import type { NotificationView, SupportConversationView } from "@/lib/support";
import type { GlobalSearchResult } from "@/lib/platform-operations";
import type { EconomySnapshotView } from "@/lib/economy";

export type WorkspaceNavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type WorkspaceShellConfig = {
  kind: "player" | "partner" | "admin";
  label: string;
  ariaContext: string;
  rootHref: string;
  profileHref: string;
  profileRole: string;
  navigation: readonly WorkspaceNavigationItem[];
  pageTitles: Record<string, string>;
  pageTitlePrefixes?: Record<string, string>;
  storageKey: string;
  defaultPreferences: DashboardPreferences;
  notificationText: string;
};

const tierLabels = { EXPLORER: "Bronze", NAVIGATOR: "Silver", ATLAS: "Gold", PRIME: "Platinum", SIGNATURE: "Diamond" } as const;

function WorkspaceNavigation({
  config,
  onNavigate,
  mobile = false,
  canAdmin = false,
}: {
  config: WorkspaceShellConfig;
  onNavigate?: () => void;
  mobile?: boolean;
  canAdmin?: boolean;
}) {
  const pathname = usePathname();
  const { profile, shouldReduceMotion } = useDashboard();
  const displayName = profile?.user.displayName ?? config.profileRole;

  return (
    <div className={styles.navigationInner}>
      <div>
        <Link href={config.rootHref} className={styles.dashboardLogo} onClick={onNavigate} aria-label={`VX House — главная ${config.ariaContext}`}>
          <span aria-hidden="true"><Image src="/vx-house-logo.jpg" alt="" width={232} height={232} priority unoptimized /></span>
        </Link>
        {mobile ? <span className={styles.mobileMenuLabel}>{config.label}</span> : null}
        <nav className={styles.dashboardNav} aria-label={`Навигация ${config.ariaContext}`}>
          {config.navigation.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== config.rootHref && pathname.startsWith(`${href}/`));
            return (
              <Link key={href} href={href} className={styles.navLink} data-active={active || undefined} aria-current={active ? "page" : undefined} onClick={onNavigate}>
                <Icon aria-hidden="true" />
                <span>{label}</span>
                {active ? (
                  <motion.i
                    aria-hidden="true"
                    layoutId={`${config.kind}-${mobile ? "mobile" : "desktop"}-active-marker`}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={styles.sidebarFooter}>
        <Link href="/" className={styles.publicLink} onClick={onNavigate}>
          <Grid2X2 aria-hidden="true" />Публичная страница<ChevronRight aria-hidden="true" />
        </Link>
        {canAdmin ? <Link href="/admin" className={styles.publicLink} onClick={onNavigate}><ShieldCheck aria-hidden="true" />Администрирование<ChevronRight aria-hidden="true" /></Link> : null}
        {profile ? <button type="button" className={styles.publicLink} onClick={async () => { await fetch("/api/auth/logout", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }); window.location.assign("/access?mode=login"); }}><LogOut aria-hidden="true" />Выйти<ChevronRight aria-hidden="true" /></button> : null}
        <Link href={config.profileHref} className={styles.sidebarProfile} onClick={onNavigate}>
          <span>{displayName.charAt(0).toLocaleUpperCase("ru") || "Д"}</span>
          <div><strong>{displayName}</strong><small>{config.profileRole}</small></div>
        </Link>
      </div>
    </div>
  );
}

function WorkspaceShellContent({ children, config, initialNotifications, personalConversation, economy, canAdmin }: { children: React.ReactNode; config: WorkspaceShellConfig; initialNotifications: NotificationView[]; personalConversation?: SupportConversationView; economy?: EconomySnapshotView; canAdmin: boolean }) {
  const pathname = usePathname();
  const { profile, shouldReduceMotion } = useDashboard();
  const displayName = profile?.user.displayName ?? config.profileRole;
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [searchOpen, setSearchOpen] = useState(false);
  const [rankOpen, setRankOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const rankRef = useRef<HTMLDivElement>(null);
  const menuId = `${config.kind}-mobile-menu`;
  const notificationsId = `${config.kind}-notifications`;
  const pageTitle = config.pageTitles[pathname]
    ?? Object.entries(config.pageTitlePrefixes ?? {}).find(([prefix]) => pathname.startsWith(prefix))?.[1]
    ?? "VX House";
  const unreadCount = notifications.filter((item) => item.status !== "READ").length;
  const unreadMessages = notifications.filter((item) => item.status !== "READ").length;
  const supportHref = config.kind === "partner" ? "/partner/support" : "/dashboard/support";
  const messengerIsFullPage = pathname === supportHref;
  const rankLabel = economy?.rank.current ? tierLabels[economy.rank.current.code] : "Bronze";
  const nextRankLabel = economy?.rank.next ? tierLabels[economy.rank.next.code] : "Silver";
  const completedCriteria = economy?.rank.next?.criteria.filter((item) => item.completed).length ?? 0;
  const criteriaCount = economy?.rank.next?.criteria.length ?? 0;
  const rankProgress = criteriaCount ? Math.round(completedCriteria / criteriaCount * 100) : Math.min(100, Math.round((economy?.points.confirmedBalance ?? 0) / 10));

  async function readNotification(id: string) {
    const current = notifications.find((item) => item.id === id); if (!current || current.status === "READ") return;
    const response = await fetch(`/api/notifications/${id}/read`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idempotencyKey: `notification-read-${id}` }) });
    if (response.ok) setNotifications((items) => items.map((item) => item.id === id ? { ...item, status: "READ", readAt: new Date().toISOString() } : item));
  }

  function readMessenger() {
    for (const item of notifications) {
      if (item.status !== "READ") void readNotification(item.id);
    }
  }

  useEffect(() => {
    const query = searchTerm.trim();
    if (query.length < 2) {
      const resetTimer = window.setTimeout(() => setSearchResults([]), 0);
      return () => window.clearTimeout(resetTimer);
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
      if (response.ok) setSearchResults(((await response.json()) as { items: GlobalSearchResult[] }).items);
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [searchTerm]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (searchOpen) setSearchOpen(false);
      if (notificationsOpen) setNotificationsOpen(false);
      if (rankOpen) setRankOpen(false);
      if (menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, notificationsOpen, rankOpen, searchOpen]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (searchOpen && !searchRef.current?.contains(target)) setSearchOpen(false);
      if (notificationsOpen && !notificationsRef.current?.contains(target)) setNotificationsOpen(false);
      if (rankOpen && !rankRef.current?.contains(target)) setRankOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [notificationsOpen, rankOpen, searchOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const frame = window.requestAnimationFrame(() => mobileCloseRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [menuOpen]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      mainRef.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div className={styles.dashboardShell} data-workspace={config.kind} data-reduced-motion={shouldReduceMotion || undefined}>
      <aside className={styles.sidebar}><WorkspaceNavigation config={config} canAdmin={canAdmin} /></aside>

      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.button type="button" className={styles.mobileOverlay} aria-label="Закрыть меню" onClick={() => setMenuOpen(false)} initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.aside
              id={menuId}
              className={styles.mobileSidebar}
              role="dialog"
              aria-modal="true"
              aria-label={`Меню ${config.ariaContext}`}
              initial={shouldReduceMotion ? false : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={shouldReduceMotion ? undefined : { x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <button ref={mobileCloseRef} type="button" className={styles.mobileClose} onClick={() => setMenuOpen(false)} aria-label="Закрыть меню"><X aria-hidden="true" /></button>
              <WorkspaceNavigation config={config} mobile canAdmin={canAdmin} onNavigate={() => setMenuOpen(false)} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className={styles.dashboardMainColumn}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>
            <button ref={menuButtonRef} type="button" className={styles.menuButton} onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-controls={menuId} aria-label="Открыть меню"><Menu aria-hidden="true" /></button>
            <div><span>{config.label}</span><strong>{pageTitle}</strong></div>
          </div>

          <div className={styles.topbarActions}>
            {config.kind === "player" && economy ? <>
              <Link href="/dashboard/economy" className={styles.pointsCompact} aria-label={`${economy.points.confirmedBalance} VX Points`}>
                <Coins aria-hidden="true" /><span><small>VX Points</small><strong>{economy.points.confirmedBalance}</strong></span>
                <em role="tooltip">Ваши бонусные баллы VX.<br />Используются для получения преимуществ.</em>
              </Link>
              <div className={styles.rankCompactWrap} ref={rankRef}>
                <button type="button" className={styles.rankCompact} aria-expanded={rankOpen} onClick={() => { setRankOpen((open) => !open); setSearchOpen(false); setNotificationsOpen(false); }}><Medal aria-hidden="true" />{rankLabel}</button>
                {rankOpen ? <div className={styles.rankCompactPanel} role="region" aria-label="Текущий уровень"><small>Текущий уровень</small><strong>{rankLabel}</strong><div><span>До уровня {nextRankLabel}</span><b>{rankProgress}%</b></div><div className={styles.compactProgress}><i style={{ width: `${rankProgress}%` }} /></div><p>{criteriaCount ? `Выполнено условий: ${completedCriteria} из ${criteriaCount}` : `До следующего уровня осталось ${Math.max(0, 1000 - (economy.points.confirmedBalance ?? 0))} VX Points`}</p><Link href="/dashboard/economy" onClick={() => setRankOpen(false)}>Подробнее о уровнях <ChevronRight aria-hidden="true" /></Link></div> : null}
              </div>
            </> : null}
            {config.kind !== "admin" ? <div className={styles.globalSearch} ref={searchRef} data-open={searchOpen || undefined}>
              <button type="button" aria-label="Открыть глобальный поиск" aria-expanded={searchOpen} onClick={() => { setSearchOpen((open) => !open); setNotificationsOpen(false); setRankOpen(false); }}><Search aria-hidden="true" /></button>
              {searchOpen ? <div className={styles.globalSearchPanel}><label><Search aria-hidden="true" /><span className="sr-only">Поиск по VX House</span><input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Возможности, задания, прогнозы…" /></label>{searchTerm.trim().length < 2 ? <p>Введите минимум два символа.</p> : searchResults.length ? <div>{searchResults.map((item) => <Link key={`${item.type}:${item.id}`} href={item.href} onClick={() => setSearchOpen(false)}><small>{item.type}</small><strong>{item.title}</strong><span>{item.description}</span></Link>)}</div> : <p>Ничего не найдено.</p>}</div> : null}
            </div> : null}
            <div className={styles.notificationsWrap} ref={notificationsRef}>
              <button type="button" className={styles.notificationButton} aria-label={unreadCount ? `Непрочитанных уведомлений: ${unreadCount}` : "Новых уведомлений нет"} aria-expanded={notificationsOpen} aria-controls={notificationsId} onClick={() => { setNotificationsOpen((open) => !open); setSearchOpen(false); setRankOpen(false); }}><Bell aria-hidden="true" />{unreadCount ? <i aria-hidden="true">{unreadCount}</i> : null}</button>
              <AnimatePresence>
                {notificationsOpen ? (
                  <motion.div
                    id={notificationsId}
                    className={styles.notificationsPanel}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
                    role="region"
                    aria-label="Уведомления"
                  >
                    <div className={styles.notificationsHeader}><strong>Уведомления</strong><span>{unreadCount ? `${unreadCount} непрочитано` : "Всё прочитано"}</span></div>
                    {notifications.length ? <div className={styles.notificationsList}>{notifications.map((item) => <button type="button" key={item.id} data-unread={item.status !== "READ" || undefined} onClick={() => readNotification(item.id)}><span>{item.category}</span><strong>{item.title}</strong><p>{item.body}</p><small>{new Intl.DateTimeFormat("ru", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(item.createdAt))}</small></button>)}</div> : <div className={styles.notificationsEmpty}><Bell aria-hidden="true" /><strong>Уведомлений пока нет</strong><p>{config.notificationText}</p></div>}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <Link href={config.profileHref} className={styles.topbarProfile} aria-label={`Открыть профиль: ${config.profileRole.toLocaleLowerCase("ru")}`}>
              <span>{displayName.charAt(0).toLocaleUpperCase("ru") || "Д"}</span>
              <div><strong>{displayName}</strong><small>{config.profileRole}</small></div>
            </Link>
          </div>
        </header>

        <main ref={mainRef} id="main-content" className={styles.dashboardMain}>
          {messengerIsFullPage && personalConversation ? (
            <PersonalMessengerExperience
              initialConversation={personalConversation}
              basePath={supportHref}
              unreadCount={unreadMessages}
              fullPage
              onRead={readMessenger}
            />
          ) : children}
        </main>

        {config.kind !== "admin" && personalConversation && !messengerIsFullPage ? (
          <PersonalMessengerExperience
            initialConversation={personalConversation}
            basePath={supportHref}
            unreadCount={unreadMessages}
            fullPage={false}
            onRead={readMessenger}
          />
        ) : null}

        <nav
          className={styles.mobileBottomNav}
          aria-label={`Быстрая навигация ${config.ariaContext}`}
          style={{ "--mobile-nav-columns": config.navigation.length } as CSSProperties}
        >
          {config.navigation.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== config.rootHref && pathname.startsWith(`${href}/`));
            return <Link key={href} href={href} data-active={active || undefined} aria-current={active ? "page" : undefined}><Icon aria-hidden="true" /><span>{label}</span></Link>;
          })}
        </nav>
      </div>
    </div>
  );
}

export function WorkspaceShell({ children, config, profile, notifications = [], personalConversation, economy, canAdmin = false }: { children: React.ReactNode; config: WorkspaceShellConfig; profile?: SafeProfileDTO; notifications?: NotificationView[]; personalConversation?: SupportConversationView; economy?: EconomySnapshotView; canAdmin?: boolean }) {
  return (
    <DashboardProvider storageKey={config.storageKey} defaultPreferences={config.defaultPreferences} profile={profile}>
      <WorkspaceShellContent config={config} initialNotifications={notifications} personalConversation={personalConversation} economy={economy} canAdmin={canAdmin}>{children}</WorkspaceShellContent>
    </DashboardProvider>
  );
}
