"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronRight, Grid2X2, LogOut, Menu, Search, ShieldCheck, X, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { DashboardProvider, useDashboard } from "@/components/dashboard/dashboard-provider";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/i18n-provider";
import { PersonalMessengerExperience } from "@/components/messenger/personal-messenger";
import type { DashboardPreferences } from "@/lib/dashboard-data";
import type { SafeProfileDTO } from "@/lib/repositories";
import type { NotificationView, SupportConversationView } from "@/lib/support";
import type { GlobalSearchResult } from "@/lib/platform-operations";
import { formatLocalTime, fromDatabaseLanguage } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

export type WorkspaceNavigationItem = {
  labelKey: MessageKey;
  href: string;
  icon: LucideIcon;
  action?: "logout";
};

type WorkspaceShellConfig = {
  kind: "player" | "partner" | "admin";
  labelKey: MessageKey;
  rootHref: string;
  profileHref?: string;
  profileRoleKey: MessageKey;
  navigation: readonly WorkspaceNavigationItem[];
  pageTitles: Record<string, MessageKey>;
  pageTitlePrefixes?: Record<string, MessageKey>;
  storageKey: string;
  defaultPreferences: DashboardPreferences;
  notificationTextKey: MessageKey;
};

function WorkspaceNavigation({
  config,
  onNavigate,
  mobile = false,
  canAdmin = false,
  playerMessengerUnread = 0,
}: {
  config: WorkspaceShellConfig;
  onNavigate?: () => void;
  mobile?: boolean;
  canAdmin?: boolean;
  playerMessengerUnread?: number;
}) {
  const pathname = usePathname();
  const { profile, shouldReduceMotion } = useDashboard();
  const { locale, t } = useI18n();
  const displayName = profile?.user.displayName ?? t(config.profileRoleKey);
  const [messengerUnread, setMessengerUnread] = useState(0);
  const hasNavigationLogout = config.navigation.some((item) => item.action === "logout");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    window.location.assign("/access?mode=login");
  }

  useEffect(() => {
    if (config.kind !== "admin" || pathname === "/admin/messenger") return;
    let active = true;
    let pending = false;
    const refresh = async () => {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const response = await fetch("/api/admin/messenger", { cache: "no-store" });
        if (active && response.ok) setMessengerUnread(((await response.json()) as { unreadCount: number }).unreadCount);
      } finally {
        pending = false;
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 10_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [config.kind, pathname]);

  return (
    <div className={styles.navigationInner}>
      <div>
        <Link href={config.rootHref} className={styles.dashboardLogo} onClick={onNavigate} aria-label={`VX House — ${t("page.home")}`}>
          <span aria-hidden="true"><Image src="/vx-house-logo.jpg" alt="" width={232} height={232} priority unoptimized /></span>
        </Link>
        {mobile ? <span className={styles.mobileMenuLabel}>{t(config.labelKey)}</span> : null}
        <nav className={styles.dashboardNav} aria-label={t("workspace.menu", { area: t(config.labelKey) })}>
          {config.navigation.map(({ labelKey, href, icon: Icon, action }) => {
            const active = !action && (pathname === href || (href !== config.rootHref && pathname.startsWith(`${href}/`)));
            if (action === "logout") {
              return (
                <button key={labelKey} type="button" className={styles.navLink} onClick={() => void logout()}>
                  <Icon aria-hidden="true" />
                  <span>{t(labelKey)}</span>
                </button>
              );
            }
            return (
              <Link key={href} href={href} className={styles.navLink} data-active={active || undefined} aria-current={active ? "page" : undefined} onClick={onNavigate}>
                <Icon aria-hidden="true" />
                <span>{t(labelKey)}</span>
                {href.endsWith("/support") && playerMessengerUnread ? <em className={styles.navUnreadBadge} aria-label={t("workspace.unread", { count: playerMessengerUnread })}>{playerMessengerUnread}</em> : null}
                {href === "/admin/messenger" && messengerUnread ? <em className={styles.navUnreadBadge} aria-label={t("workspace.unread", { count: messengerUnread })}>{messengerUnread}</em> : null}
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
        {config.kind !== "admin" ? <Link href="/" className={styles.publicLink} onClick={onNavigate}>
          <Grid2X2 aria-hidden="true" />{t("nav.public")}<ChevronRight aria-hidden="true" />
        </Link> : null}
        {config.kind !== "admin" && canAdmin ? <Link href="/admin" className={styles.publicLink} onClick={onNavigate}><ShieldCheck aria-hidden="true" />{t("nav.administration")}<ChevronRight aria-hidden="true" /></Link> : null}
        {(profile || config.kind === "admin") && !hasNavigationLogout ? <button type="button" className={styles.publicLink} onClick={() => void logout()}><LogOut aria-hidden="true" />{t("nav.logout")}<ChevronRight aria-hidden="true" /></button> : null}
        {config.kind !== "admin" ? config.kind === "player" ? (
          <div className={styles.sidebarProfile}>
            <span>{displayName.charAt(0).toLocaleUpperCase(locale) || t("workspace.member").charAt(0)}</span>
            <div><strong>{displayName}</strong><small>{t(config.profileRoleKey)}</small></div>
          </div>
        ) : (
          <Link href={config.profileHref ?? config.rootHref} className={styles.sidebarProfile} onClick={onNavigate}>
            <span>{displayName.charAt(0).toLocaleUpperCase(locale) || t("workspace.member").charAt(0)}</span>
            <div><strong>{displayName}</strong><small>{t(config.profileRoleKey)}</small></div>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function WorkspaceShellContent({ children, config, initialNotifications, personalConversation, canAdmin }: { children: React.ReactNode; config: WorkspaceShellConfig; initialNotifications: NotificationView[]; personalConversation?: SupportConversationView; canAdmin: boolean }) {
  const pathname = usePathname();
  const { profile, shouldReduceMotion } = useDashboard();
  const { locale, setLocale, t } = useI18n();
  const displayName = profile?.user.displayName ?? t(config.profileRoleKey);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadMessages, setUnreadMessages] = useState(personalConversation?.unreadCount ?? 0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const menuId = `${config.kind}-mobile-menu`;
  const notificationsId = `${config.kind}-notifications`;
  const pageTitleKey = config.pageTitles[pathname]
    ?? Object.entries(config.pageTitlePrefixes ?? {}).find(([prefix]) => pathname.startsWith(prefix))?.[1]
    ?? null;
  const pageTitle = pageTitleKey ? t(pageTitleKey) : "VX House";
  const unreadCount = notifications.filter((item) => item.status !== "READ").length;
  const supportHref = config.kind === "partner" ? "/partner/support" : "/dashboard/support";
  const messengerIsFullPage = pathname === supportHref;

  useEffect(() => {
    if (profile?.preferredLanguage) setLocale(fromDatabaseLanguage(profile.preferredLanguage));
  }, [profile?.preferredLanguage, setLocale]);

  async function readNotification(id: string) {
    const current = notifications.find((item) => item.id === id); if (!current || current.status === "READ") return;
    const response = await fetch(`/api/notifications/${id}/read`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idempotencyKey: `notification-read-${id}` }) });
    if (response.ok) setNotifications((items) => items.map((item) => item.id === id ? { ...item, status: "READ", readAt: new Date().toISOString() } : item));
  }

  const readMessenger = useCallback(async () => {
    if (!personalConversation) return;
    const response = await fetch(`/api/support/${personalConversation.id}/read`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    if (response.ok) setUnreadMessages(0);
  }, [personalConversation]);

  useEffect(() => {
    if (!messengerIsFullPage) return;
    queueMicrotask(() => void readMessenger());
  }, [messengerIsFullPage, readMessenger]);

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
      if (menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, notificationsOpen, searchOpen]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (searchOpen && !searchRef.current?.contains(target)) setSearchOpen(false);
      if (notificationsOpen && !notificationsRef.current?.contains(target)) setNotificationsOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [notificationsOpen, searchOpen]);

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
      <aside className={styles.sidebar}><WorkspaceNavigation config={config} canAdmin={canAdmin} playerMessengerUnread={unreadMessages} /></aside>

      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.button type="button" className={styles.mobileOverlay} aria-label={t("workspace.closeMenu")} onClick={() => setMenuOpen(false)} initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.aside
              id={menuId}
              className={styles.mobileSidebar}
              role="dialog"
              aria-modal="true"
              aria-label={t("workspace.menu", { area: t(config.labelKey) })}
              initial={shouldReduceMotion ? false : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={shouldReduceMotion ? undefined : { x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <button ref={mobileCloseRef} type="button" className={styles.mobileClose} onClick={() => setMenuOpen(false)} aria-label={t("workspace.closeMenu")}><X aria-hidden="true" /></button>
              <WorkspaceNavigation config={config} mobile canAdmin={canAdmin} playerMessengerUnread={unreadMessages} onNavigate={() => setMenuOpen(false)} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className={styles.dashboardMainColumn}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>
            <button ref={menuButtonRef} type="button" className={styles.menuButton} onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-controls={menuId} aria-label={t("workspace.openMenu")}><Menu aria-hidden="true" /></button>
            <div><span>{t(config.labelKey)}</span><strong>{pageTitle}</strong></div>
          </div>

          <div className={styles.topbarActions}>
            <LanguageSwitcher syncProfile={config.kind !== "admin" && Boolean(profile)} />
            {config.kind === "partner" ? <div className={styles.globalSearch} ref={searchRef} data-open={searchOpen || undefined}>
              <button type="button" aria-label={t("workspace.openSearch")} aria-expanded={searchOpen} onClick={() => { setSearchOpen((open) => !open); setNotificationsOpen(false); }}><Search aria-hidden="true" /></button>
              {searchOpen ? <div className={styles.globalSearchPanel}><label><Search aria-hidden="true" /><span className="sr-only">{t("workspace.searchLabel")}</span><input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={t("workspace.searchPlaceholder")} /></label>{searchTerm.trim().length < 2 ? <p>{t("workspace.searchMinimum")}</p> : searchResults.length ? <div>{searchResults.map((item) => <Link key={`${item.type}:${item.id}`} href={item.href} onClick={() => setSearchOpen(false)}><small>{item.type}</small><strong>{item.title}</strong><span>{item.description}</span></Link>)}</div> : <p>{t("workspace.searchEmpty")}</p>}</div> : null}
            </div> : null}
            <div className={styles.notificationsWrap} ref={notificationsRef}>
              <button type="button" className={styles.notificationButton} aria-label={unreadCount ? t("workspace.unreadNotifications", { count: unreadCount }) : t("workspace.noNotifications")} aria-expanded={notificationsOpen} aria-controls={notificationsId} onClick={() => { setNotificationsOpen((open) => !open); setSearchOpen(false); }}><Bell aria-hidden="true" />{unreadCount ? <i aria-hidden="true">{unreadCount}</i> : null}</button>
              <AnimatePresence>
                {notificationsOpen ? (
                  <motion.div
                    id={notificationsId}
                    className={styles.notificationsPanel}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
                    role="region"
                    aria-label={t("workspace.notifications")}
                  >
                    <div className={styles.notificationsHeader}><strong>{t("workspace.notifications")}</strong><span>{unreadCount ? t("workspace.unread", { count: unreadCount }) : ""}</span></div>
                    {notifications.length ? <div className={styles.notificationsList}>{notifications.map((item) => <button type="button" key={item.id} data-unread={item.status !== "READ" || undefined} onClick={() => readNotification(item.id)}><span>{item.category}</span><strong>{item.title}</strong><p>{item.body}</p><small>{formatLocalTime(locale, item.createdAt)}</small></button>)}</div> : <div className={styles.notificationsEmpty}><Bell aria-hidden="true" /><strong>{t("workspace.notifications")}</strong><p>{t(config.notificationTextKey)}</p></div>}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {config.kind === "admin" ? (
              <div className={styles.topbarProfile} data-static>
                <span>{displayName.charAt(0).toLocaleUpperCase(locale) || t("workspace.member").charAt(0)}</span>
                <div><strong>{t(config.profileRoleKey)}</strong></div>
              </div>
            ) : (
              <Link href={config.profileHref ?? config.rootHref} className={styles.topbarProfile} aria-label={t("workspace.openProfile", { role: t(config.profileRoleKey) })}>
                <span>{displayName.charAt(0).toLocaleUpperCase(locale) || t("workspace.member").charAt(0)}</span>
                <div><strong>{displayName}</strong><small>{t(config.profileRoleKey)}</small></div>
              </Link>
            )}
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
              onUnreadChange={setUnreadMessages}
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
            onUnreadChange={setUnreadMessages}
          />
        ) : null}

        <nav
          className={styles.mobileBottomNav}
          aria-label={t("workspace.quickNavigation", { area: t(config.labelKey) })}
          style={{ "--mobile-nav-columns": config.navigation.length } as CSSProperties}
        >
          {config.navigation.map(({ labelKey, href, icon: Icon }) => {
            const active = pathname === href || (href !== config.rootHref && pathname.startsWith(`${href}/`));
            return <Link key={href} href={href} data-active={active || undefined} aria-current={active ? "page" : undefined}><Icon aria-hidden="true" /><span>{t(labelKey)}</span></Link>;
          })}
        </nav>
      </div>
    </div>
  );
}

export function WorkspaceShell({ children, config, profile, notifications = [], personalConversation, canAdmin = false }: { children: React.ReactNode; config: WorkspaceShellConfig; profile?: SafeProfileDTO; notifications?: NotificationView[]; personalConversation?: SupportConversationView; canAdmin?: boolean }) {
  return (
    <DashboardProvider storageKey={config.storageKey} defaultPreferences={config.defaultPreferences} profile={profile}>
      <WorkspaceShellContent config={config} initialNotifications={notifications} personalConversation={personalConversation} canAdmin={canAdmin}>{children}</WorkspaceShellContent>
    </DashboardProvider>
  );
}
