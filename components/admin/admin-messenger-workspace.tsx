"use client";
/* eslint-disable @next/next/no-img-element -- previews come from protected authenticated routes and local File objects */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Download, FileText, Image as ImageIcon, Info, LoaderCircle, MessageCircle, MoreHorizontal, NotebookPen, Paperclip, Pencil, Search, Send, Smile, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { useI18n } from "@/components/i18n/i18n-provider";
import type { AdminMessengerDetail, AdminMessengerList, AdminMessengerNote, AdminMessengerPlayer, AdminMessengerScope } from "@/lib/admin-messenger";
import { formatLocalDateTime, formatLocalTime } from "@/lib/i18n";
import type { SupportMessageView } from "@/lib/support";
import styles from "./admin-messenger-workspace.module.css";

const transition = { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const };
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const emojis = ["🙂", "👍", "❤️", "✨", "👋", "✅"];

function size(value: number, megabytes: string, kilobytes: string) {
  return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} ${megabytes}` : `${Math.max(1, Math.round(value / 1024))} ${kilobytes}`;
}

function ChatListItem({ item, active, onClick }: { item: AdminMessengerPlayer; active: boolean; onClick: () => void }) {
  const { locale, t } = useI18n();
  return (
    <button type="button" className={styles.chatItem} data-active={active || undefined} onClick={onClick}>
      <span className={styles.avatar} data-status={item.online ? "online" : "offline"} aria-label={`${item.name}: ${item.online ? t("adminMessenger.online") : t("adminMessenger.offline")}`}>{item.initials}</span>
      <span className={styles.chatCopy}>
        <span><strong>{item.name}</strong><time dateTime={item.lastMessageAt ?? undefined}>{item.lastMessageAt ? formatLocalTime(locale, item.lastMessageAt) : ""}</time></span>
        <span><small>{item.lastMessage}</small>{item.hasNotes ? <NotebookPen aria-label={t("adminMessenger.hasNote")} /> : null}</span>
      </span>
      {item.unreadCount ? <b aria-label={t("adminMessenger.unread", { count: item.unreadCount })}>{item.unreadCount}</b> : null}
    </button>
  );
}

function Attachment({ conversationId, attachment }: { conversationId: string; attachment: SupportMessageView["attachments"][number] }) {
  const { t } = useI18n();
  const href = `/api/admin/messenger/${conversationId}/attachments/${attachment.id}`;
  if (attachment.mediaType.startsWith("image/")) {
    return (
      <a className={styles.messageImage} href={href} download>
        {/* Protected route handles authorization before returning image bytes. */}
        <img src={`${href}?inline=1`} alt={t("messenger.attachmentAlt", { name: attachment.fileName })} />
        <span><ImageIcon aria-hidden="true" />{attachment.fileName}<small>{size(attachment.sizeBytes, t("messenger.megabytes"), t("messenger.kilobytes"))}</small><Download aria-hidden="true" /></span>
      </a>
    );
  }
  return <a className={styles.messageFile} href={href} download><FileText aria-hidden="true" /><span>{attachment.fileName}<small>{size(attachment.sizeBytes, t("messenger.megabytes"), t("messenger.kilobytes"))}</small></span><Download aria-hidden="true" /></a>;
}

function Messages({ detail, pending }: { detail: AdminMessengerDetail; pending: boolean }) {
  const { locale, t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const restoredConversation = useRef("");
  const stickToBottom = useRef(true);
  useEffect(() => {
    const list = scrollRef.current;
    if (!list) return;
    const key = `vx-house:admin-messenger-scroll:${detail.conversation.id}`;
    if (restoredConversation.current !== detail.conversation.id) {
      restoredConversation.current = detail.conversation.id;
      const saved = Number(window.sessionStorage.getItem(key));
      list.scrollTop = Number.isFinite(saved) && saved > 0 ? saved : list.scrollHeight;
      stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
      return;
    }
    if (stickToBottom.current) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [detail.conversation.id, detail.conversation.messages.length, pending]);
  return (
    <div
      ref={scrollRef}
      className={styles.messages}
      aria-live="polite"
      onScroll={(event) => {
        const list = event.currentTarget;
        stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
        window.sessionStorage.setItem(`vx-house:admin-messenger-scroll:${detail.conversation.id}`, String(list.scrollTop));
      }}
    >
      <div className={styles.dayLabel}>{t("adminMessenger.history")}</div>
      {detail.conversation.messages.length ? detail.conversation.messages.map((message) => {
        const author = message.authorType === "OPERATOR" ? "admin" : message.authorType === "USER" ? "player" : "system";
        return (
          <motion.article key={message.id} className={styles.message} data-author={author} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={transition}>
            {author !== "admin" ? <span className={styles.messageAvatar}>{author === "system" ? "VX" : detail.player.initials}</span> : null}
            <div>
              <small>{message.authorLabel}</small>
              <p>{message.body}</p>
              {message.attachments.length ? <div className={styles.messageAttachments}>{message.attachments.map((attachment) => <Attachment key={attachment.id} conversationId={detail.conversation.id} attachment={attachment} />)}</div> : null}
              <time dateTime={message.createdAt}>{formatLocalTime(locale, message.createdAt)}</time>
            </div>
          </motion.article>
        );
      }) : <div className={styles.emptyMessages}><MessageCircle aria-hidden="true" /><strong>{t("adminMessenger.emptyHistory")}</strong><p>{t("adminMessenger.emptyHistoryDescription")}</p></div>}
      {pending ? <div className={styles.sending}><i /><i /><i /></div> : null}
    </div>
  );
}

function AdminComposer({ detail, onUpdate }: { detail: AdminMessengerDetail; onUpdate: (value: AdminMessengerDetail) => void }) {
  const { t } = useI18n();
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);

  const previewUrl = useMemo(() => file?.type.startsWith("image/") ? URL.createObjectURL(file) : "", [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function choose(next: File | null) {
    setError("");
    if (!next) return setFile(null);
    if (!allowedTypes.has(next.type)) return setError(t("messenger.fileTypeError"));
    if (next.size < 1 || next.size > 10 * 1024 * 1024) return setError(t("messenger.fileSizeError"));
    setFile(next);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if ((!body.trim() && !file) || pending) return;
    setPending(true); setError("");
    try {
      const response = await fetch(`/api/admin/messenger/${detail.conversation.id}/messages`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: body.trim() || t("messenger.attachment", { name: file?.name ?? "" }) }),
      });
      let updated = await response.json() as AdminMessengerDetail & { message?: string };
      if (!response.ok) throw new Error(updated.message || t("messenger.sendError"));
      if (file) {
        const latest = updated.conversation.messages.findLast((message) => message.authorType === "OPERATOR");
        if (!latest) throw new Error(t("messenger.uploadError"));
        const form = new FormData(); form.set("messageId", latest.id); form.set("file", file);
        const upload = await fetch(`/api/admin/messenger/${detail.conversation.id}/attachments`, { method: "POST", body: form });
        const result = await upload.json() as { message?: string };
        if (!upload.ok) throw new Error(result.message || t("messenger.uploadError"));
        const refresh = await fetch(`/api/admin/messenger/${detail.conversation.id}`, { cache: "no-store" });
        if (refresh.ok) updated = await refresh.json() as AdminMessengerDetail;
      }
      onUpdate(updated); setBody(""); setFile(null); setEmojiOpen(false);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : t("messenger.sendError"));
    } finally { setPending(false); }
  }

  return (
    <form className={styles.composer} onSubmit={submit}>
      {file ? <div className={styles.selectedFile}>
        {previewUrl ? <img src={previewUrl} alt="" /> : <FileText aria-hidden="true" />}
        <span><strong>{file.name}</strong><small>{size(file.size, t("messenger.megabytes"), t("messenger.kilobytes"))}</small></span>
        <button type="button" onClick={() => setFile(null)} aria-label={t("adminMessenger.removeFile", { name: file.name })}><X aria-hidden="true" /></button>
      </div> : null}
      <label className={styles.composerIcon} aria-label={t("adminMessenger.attach")}><Paperclip aria-hidden="true" /><input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" disabled={pending} onChange={(event) => { choose(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} /></label>
      <button type="button" className={styles.composerIcon} aria-label={t("adminMessenger.emoji")} aria-expanded={emojiOpen} onClick={() => setEmojiOpen((value) => !value)}><Smile aria-hidden="true" /></button>
      <AnimatePresence>{emojiOpen ? <motion.div className={styles.emojiMenu} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{emojis.map((emoji) => <button key={emoji} type="button" onClick={() => setBody((value) => value + emoji)}>{emoji}</button>)}</motion.div> : null}</AnimatePresence>
      <textarea value={body} rows={1} maxLength={5000} aria-label={t("adminMessenger.messageFor", { name: detail.player.name })} placeholder={t("messenger.placeholder")} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
      <button className={styles.send} disabled={(!body.trim() && !file) || pending} aria-label={t("adminMessenger.send")}>{pending ? <LoaderCircle className={styles.spinner} aria-hidden="true" /> : <Send aria-hidden="true" />}</button>
      {error ? <p className={styles.error} role="alert">{error} <button type="button" onClick={() => setError("")}>{t("adminMessenger.close")}</button></p> : null}
    </form>
  );
}

function PlayerPanel({ detail, onUpdate, onClose }: { detail: AdminMessengerDetail; onUpdate: (value: AdminMessengerDetail) => void; onClose: () => void }) {
  const { locale, t } = useI18n();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<AdminMessengerNote | null>(null);
  const [pending, setPending] = useState(false);

  async function save(action: "create" | "edit" | "delete", note?: AdminMessengerNote) {
    if (action === "delete" && !window.confirm(t("adminMessenger.deleteNoteConfirm"))) return;
    setPending(true);
    const response = await fetch(`/api/admin/messenger/${detail.conversation.id}/notes`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, logicalId: note?.logicalId ?? editing?.logicalId, body: action === "edit" ? draft : action === "create" ? draft : undefined }),
    });
    if (response.ok) { onUpdate(await response.json() as AdminMessengerDetail); setDraft(""); setEditing(null); }
    setPending(false);
  }

  return (
    <aside className={styles.playerPanel} aria-label={t("adminMessenger.memberInfo")}>
      <header><div><small>{detail.player.role === "PARTNER" ? t("adminMessenger.partnerProfile") : t("adminMessenger.playerProfile")}</small><strong>{detail.player.name}</strong></div><button type="button" onClick={onClose} aria-label={t("adminMessenger.infoClose")}><X aria-hidden="true" /></button></header>
      <div className={styles.profileBlock}><span className={styles.profileAvatar} data-status={detail.player.online ? "online" : "offline"} aria-label={`${detail.player.name}: ${detail.player.online ? t("adminMessenger.online") : t("adminMessenger.offline")}`}>{detail.player.initials}</span><strong>{detail.player.name}</strong><small>{detail.player.email}</small><Link href={detail.player.profileHref}>{t("adminMessenger.fullProfile")}</Link></div>
      <dl className={styles.profileFacts}>
        <div><dt>{t("adminMessenger.role")}</dt><dd>{detail.player.role === "PARTNER" ? t("adminMessenger.partnerRole") : t("adminMessenger.playerRole")}</dd></div><div><dt>{t("adminMessenger.market")}</dt><dd>{detail.player.market}</dd></div>
        <div><dt>{t("adminMessenger.registered")}</dt><dd>{formatLocalDateTime(locale, detail.player.registeredAt)}</dd></div><div><dt>{t("adminMessenger.level")}</dt><dd>{detail.player.rank}</dd></div>
        <div><dt>VX Points</dt><dd>{detail.player.points}</dd></div><div><dt>{t("adminMessenger.currentTask")}</dt><dd>{detail.player.currentTask}</dd></div>
        <div><dt>{t("adminMessenger.lastAction")}</dt><dd>{detail.player.lastAction}</dd></div>
      </dl>
      <section className={styles.notes}>
        <header><div><small>{t("adminMessenger.adminOnly")}</small><h2>{t("adminMessenger.notes")}</h2></div><NotebookPen aria-hidden="true" /></header>
        <textarea value={draft} maxLength={3000} placeholder={editing ? t("adminMessenger.editNote") : t("adminMessenger.addNote")} aria-label={t("adminMessenger.notes")} onChange={(event) => setDraft(event.target.value)} />
        <div className={styles.noteActions}>{editing ? <button type="button" onClick={() => { setEditing(null); setDraft(""); }}>{t("adminMessenger.cancel")}</button> : null}<button type="button" disabled={!draft.trim() || pending} onClick={() => save(editing ? "edit" : "create")}>{pending ? t("adminMessenger.saving") : editing ? t("adminMessenger.save") : t("adminMessenger.add")}</button></div>
        <div className={styles.noteHistory}>{detail.notes.length ? detail.notes.map((note) => <article key={note.logicalId}><p>{note.body}</p><small>{note.author} · {formatLocalDateTime(locale, note.createdAt)}{note.modifiedAt ? ` · ${formatLocalDateTime(locale, note.modifiedAt)}` : ""}</small><div><button type="button" onClick={() => { setEditing(note); setDraft(note.body); }} aria-label={t("adminMessenger.editNote")}><Pencil aria-hidden="true" /></button><button type="button" onClick={() => save("delete", note)} aria-label={t("adminMessenger.close")}><Trash2 aria-hidden="true" /></button></div></article>) : <p className={styles.noNotes}>{t("adminMessenger.noNotes")}</p>}</div>
      </section>
    </aside>
  );
}

export function AdminMessengerWorkspace({ initialList, initialDetail }: { initialList: AdminMessengerList; initialDetail: AdminMessengerDetail | null }) {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const [list, setList] = useState(initialList);
  const [detail, setDetail] = useState(initialDetail);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mobileChat, setMobileChat] = useState(false);
  const [scope, setScope] = useState<AdminMessengerScope>("active");
  const pollingRef = useRef(false);
  const selectedId = detail?.conversation.id;

  const visible = useMemo(() => list.items, [list.items]);

  const loadList = useCallback(async (query = search, nextScope = scope) => {
    const response = await fetch(`/api/admin/messenger?q=${encodeURIComponent(query)}&scope=${nextScope}`, { cache: "no-store" });
    if (response.ok) setList(await response.json() as AdminMessengerList);
  }, [scope, search]);

  function changeScope(nextScope: AdminMessengerScope) {
    setScope(nextScope);
    setDetail(null);
    setMobileChat(false);
    setPanelOpen(false);
    void loadList(search, nextScope);
  }

  async function openChat(item: AdminMessengerPlayer) {
    setLoading(true); setMobileChat(true);
    const response = await fetch(`/api/admin/messenger/${item.conversationId}`, { cache: "no-store" });
    if (response.ok) {
      setDetail(await response.json() as AdminMessengerDetail);
      await fetch(`/api/admin/messenger/${item.conversationId}/read`, { method: "POST" });
      await loadList();
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadList(search), 220);
    return () => window.clearTimeout(timer);
  }, [loadList, search]);

  useEffect(() => {
    if (!selectedId) return;
    void fetch(`/api/admin/messenger/${selectedId}/read`, { method: "POST" }).then(() => loadList());
  }, [loadList, selectedId]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      if (document.hidden || pollingRef.current) return;
      pollingRef.current = true;
      try {
        await loadList();
        if (selectedId) {
          const response = await fetch(`/api/admin/messenger/${selectedId}`, { cache: "no-store" });
          if (response.ok) setDetail(await response.json() as AdminMessengerDetail);
        }
      } finally {
        pollingRef.current = false;
      }
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [loadList, selectedId, search]);

  return (
    <section className={styles.workspace} data-mobile-chat={mobileChat || undefined} data-panel-open={panelOpen || undefined}>
      <aside className={styles.chatList}>
        <header><div><small>{t("adminMessenger.channel")}</small><h1 tabIndex={-1}>Messenger</h1></div>{scope === "active" && list.unreadCount ? <b>{list.unreadCount}</b> : null}</header>
        <div className={styles.scopeTabs} role="tablist" aria-label={t("adminMessenger.listMode")}>
          <button type="button" role="tab" aria-selected={scope === "active"} data-active={scope === "active" || undefined} onClick={() => changeScope("active")}>{t("adminMessenger.active")}</button>
          <button type="button" role="tab" aria-selected={scope === "archive"} data-active={scope === "archive" || undefined} onClick={() => changeScope("archive")}>{t("adminMessenger.archive")}</button>
        </div>
        <label className={styles.search}><Search aria-hidden="true" /><span className="sr-only">{t("adminMessenger.search")}</span><input value={search} placeholder={t("adminMessenger.searchPlaceholder")} onChange={(event) => setSearch(event.target.value)} /></label>
        <div className={styles.chatItems}>{visible.length ? visible.map((item) => <ChatListItem key={item.conversationId} item={item} active={selectedId === item.conversationId} onClick={() => openChat(item)} />) : <div className={styles.emptyList}><MessageCircle aria-hidden="true" /><strong>{scope === "active" ? t("adminMessenger.noActive") : t("adminMessenger.noArchive")}</strong><p>{scope === "active" ? t("adminMessenger.noActiveDescription") : t("adminMessenger.noArchiveDescription")}</p></div>}</div>
      </aside>

      <main className={styles.conversation}>
        {loading ? <div className={styles.loading}><LoaderCircle aria-hidden="true" /><span>{t("adminMessenger.loading")}</span></div> : detail ? <>
          <header className={styles.conversationHeader}>
            <button type="button" className={styles.mobileBack} onClick={() => setMobileChat(false)} aria-label={t("adminMessenger.back")}><ArrowLeft aria-hidden="true" /></button>
            <span className={styles.avatar} data-status={detail.player.online ? "online" : "offline"} aria-label={`${detail.player.name}: ${detail.player.online ? t("adminMessenger.online") : t("adminMessenger.offline")}`}>{detail.player.initials}</span>
            <div><strong>{detail.player.name}</strong><small>{detail.player.online ? t("adminMessenger.online") : t("adminMessenger.offline")}</small></div>
            <button type="button" className={styles.infoButton} data-active={panelOpen || undefined} onClick={() => setPanelOpen((open) => !open)} aria-label={panelOpen ? t("adminMessenger.infoClose") : t("adminMessenger.infoOpen")} aria-expanded={panelOpen}><Info aria-hidden="true" /></button>
          </header>
          <Messages detail={detail} pending={false} />
          <AdminComposer detail={detail} onUpdate={(value) => { setDetail(value); void loadList(); }} />
        </> : <div className={styles.noSelection}><MessageCircle aria-hidden="true" /><strong>{t("adminMessenger.select")}</strong><p>{t("adminMessenger.selectDescription")}</p></div>}
      </main>

      <AnimatePresence>
        {detail && panelOpen ? <motion.div className={styles.panelWrap} data-open initial={reduced ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={reduced ? undefined : { opacity: 0, x: 12 }} transition={transition}><PlayerPanel detail={detail} onUpdate={setDetail} onClose={() => setPanelOpen(false)} /></motion.div> : null}
      </AnimatePresence>
      {panelOpen ? <button type="button" className={styles.panelOverlay} onClick={() => setPanelOpen(false)} aria-label={t("adminMessenger.infoClose")} /> : null}
      <button type="button" className="sr-only"><MoreHorizontal aria-hidden="true" />{t("adminMessenger.moreActions")}</button>
    </section>
  );
}
