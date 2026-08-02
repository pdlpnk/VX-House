"use client";
/* eslint-disable @next/next/no-img-element -- previews come from protected authenticated routes and local File objects */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Download, FileText, Image as ImageIcon, Info, LoaderCircle, MessageCircle, MoreHorizontal, NotebookPen, Paperclip, Pencil, Search, Send, Smile, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { useI18n } from "@/components/i18n/i18n-provider";
import type { AdminMessengerDetail, AdminMessengerList, AdminMessengerNote, AdminMessengerPlayer } from "@/lib/admin-messenger";
import { formatLocalDateTime, formatLocalTime } from "@/lib/i18n";
import type { SupportMessageView } from "@/lib/support";
import styles from "./admin-messenger-workspace.module.css";

const transition = { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const };
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const emojis = ["🙂", "👍", "❤️", "✨", "👋", "✅"];

function size(value: number) {
  return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(value / 1024))} КБ`;
}

function ChatListItem({ item, active, onClick }: { item: AdminMessengerPlayer; active: boolean; onClick: () => void }) {
  const { locale } = useI18n();
  return (
    <button type="button" className={styles.chatItem} data-active={active || undefined} onClick={onClick}>
      <span className={styles.avatar} data-status={item.online ? "online" : "offline"} aria-label={`${item.name}: ${item.online ? "в сети" : "не в сети"}`}>{item.initials}</span>
      <span className={styles.chatCopy}>
        <span><strong>{item.name}</strong><time dateTime={item.lastMessageAt ?? undefined}>{item.lastMessageAt ? formatLocalTime(locale, item.lastMessageAt) : ""}</time></span>
        <span><small>{item.lastMessage}</small>{item.hasNotes ? <NotebookPen aria-label="Есть внутренняя заметка" /> : null}</span>
      </span>
      {item.unreadCount ? <b aria-label={`Непрочитано: ${item.unreadCount}`}>{item.unreadCount}</b> : null}
    </button>
  );
}

function Attachment({ conversationId, attachment }: { conversationId: string; attachment: SupportMessageView["attachments"][number] }) {
  const href = `/api/admin/messenger/${conversationId}/attachments/${attachment.id}`;
  if (attachment.mediaType.startsWith("image/")) {
    return (
      <a className={styles.messageImage} href={href} download>
        {/* Protected route handles authorization before returning image bytes. */}
        <img src={`${href}?inline=1`} alt={`Вложение: ${attachment.fileName}`} />
        <span><ImageIcon aria-hidden="true" />{attachment.fileName}<small>{size(attachment.sizeBytes)}</small><Download aria-hidden="true" /></span>
      </a>
    );
  }
  return <a className={styles.messageFile} href={href} download><FileText aria-hidden="true" /><span>{attachment.fileName}<small>{size(attachment.sizeBytes)}</small></span><Download aria-hidden="true" /></a>;
}

function Messages({ detail, pending }: { detail: AdminMessengerDetail; pending: boolean }) {
  const { locale } = useI18n();
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
      <div className={styles.dayLabel}>История разговора</div>
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
      }) : <div className={styles.emptyMessages}><MessageCircle aria-hidden="true" /><strong>История пока пуста</strong><p>Отправьте первое сообщение игроку.</p></div>}
      {pending ? <div className={styles.sending}><i /><i /><i /></div> : null}
    </div>
  );
}

function AdminComposer({ detail, onUpdate }: { detail: AdminMessengerDetail; onUpdate: (value: AdminMessengerDetail) => void }) {
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
    if (!allowedTypes.has(next.type)) return setError("Разрешены JPG, PNG, WEBP и PDF.");
    if (next.size < 1 || next.size > 10 * 1024 * 1024) return setError("Размер файла не должен превышать 10 МБ.");
    setFile(next);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if ((!body.trim() && !file) || pending) return;
    setPending(true); setError("");
    try {
      const response = await fetch(`/api/admin/messenger/${detail.conversation.id}/messages`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: body.trim() || `Вложение: ${file?.name}` }),
      });
      let updated = await response.json() as AdminMessengerDetail & { message?: string };
      if (!response.ok) throw new Error(updated.message || "Не удалось отправить сообщение");
      if (file) {
        const latest = updated.conversation.messages.findLast((message) => message.authorType === "OPERATOR");
        if (!latest) throw new Error("Сообщение отправлено, но вложение не добавлено");
        const form = new FormData(); form.set("messageId", latest.id); form.set("file", file);
        const upload = await fetch(`/api/admin/messenger/${detail.conversation.id}/attachments`, { method: "POST", body: form });
        const result = await upload.json() as { message?: string };
        if (!upload.ok) throw new Error(result.message || "Не удалось прикрепить файл");
        const refresh = await fetch(`/api/admin/messenger/${detail.conversation.id}`, { cache: "no-store" });
        if (refresh.ok) updated = await refresh.json() as AdminMessengerDetail;
      }
      onUpdate(updated); setBody(""); setFile(null); setEmojiOpen(false);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Не удалось отправить сообщение");
    } finally { setPending(false); }
  }

  return (
    <form className={styles.composer} onSubmit={submit}>
      {file ? <div className={styles.selectedFile}>
        {previewUrl ? <img src={previewUrl} alt="" /> : <FileText aria-hidden="true" />}
        <span><strong>{file.name}</strong><small>{size(file.size)}</small></span>
        <button type="button" onClick={() => setFile(null)} aria-label={`Удалить ${file.name}`}><X aria-hidden="true" /></button>
      </div> : null}
      <label className={styles.composerIcon} aria-label="Прикрепить файл"><Paperclip aria-hidden="true" /><input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" disabled={pending} onChange={(event) => { choose(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} /></label>
      <button type="button" className={styles.composerIcon} aria-label="Добавить эмодзи" aria-expanded={emojiOpen} onClick={() => setEmojiOpen((value) => !value)}><Smile aria-hidden="true" /></button>
      <AnimatePresence>{emojiOpen ? <motion.div className={styles.emojiMenu} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{emojis.map((emoji) => <button key={emoji} type="button" onClick={() => setBody((value) => value + emoji)}>{emoji}</button>)}</motion.div> : null}</AnimatePresence>
      <textarea value={body} rows={1} maxLength={5000} aria-label={`Сообщение для ${detail.player.name}`} placeholder="Введите сообщение…" onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
      <button className={styles.send} disabled={(!body.trim() && !file) || pending} aria-label="Отправить">{pending ? <LoaderCircle className={styles.spinner} aria-hidden="true" /> : <Send aria-hidden="true" />}</button>
      {error ? <p className={styles.error} role="alert">{error} <button type="button" onClick={() => setError("")}>Закрыть</button></p> : null}
    </form>
  );
}

function PlayerPanel({ detail, onUpdate, onClose }: { detail: AdminMessengerDetail; onUpdate: (value: AdminMessengerDetail) => void; onClose: () => void }) {
  const { locale } = useI18n();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<AdminMessengerNote | null>(null);
  const [pending, setPending] = useState(false);

  async function save(action: "create" | "edit" | "delete", note?: AdminMessengerNote) {
    if (action === "delete" && !window.confirm("Удалить внутреннюю заметку? История изменения сохранится в аудите.")) return;
    setPending(true);
    const response = await fetch(`/api/admin/messenger/${detail.conversation.id}/notes`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, logicalId: note?.logicalId ?? editing?.logicalId, body: action === "edit" ? draft : action === "create" ? draft : undefined }),
    });
    if (response.ok) { onUpdate(await response.json() as AdminMessengerDetail); setDraft(""); setEditing(null); }
    setPending(false);
  }

  return (
    <aside className={styles.playerPanel} aria-label="Информация об игроке">
      <header><div><small>Профиль игрока</small><strong>{detail.player.name}</strong></div><button type="button" onClick={onClose} aria-label="Закрыть панель"><X aria-hidden="true" /></button></header>
      <div className={styles.profileBlock}><span className={styles.profileAvatar} data-status={detail.player.online ? "online" : "offline"} aria-label={`${detail.player.name}: ${detail.player.online ? "в сети" : "не в сети"}`}>{detail.player.initials}</span><strong>{detail.player.name}</strong><small>{detail.player.email}</small><Link href={detail.player.profileHref}>Открыть полный профиль</Link></div>
      <dl className={styles.profileFacts}>
        <div><dt>Роль</dt><dd>Игрок</dd></div><div><dt>Рынок</dt><dd>{detail.player.market}</dd></div>
        <div><dt>Дата регистрации</dt><dd>{formatLocalDateTime(locale, detail.player.registeredAt)}</dd></div><div><dt>Уровень</dt><dd>{detail.player.rank}</dd></div>
        <div><dt>VX Points</dt><dd>{detail.player.points}</dd></div><div><dt>Текущее задание</dt><dd>{detail.player.currentTask}</dd></div>
        <div><dt>Последнее действие</dt><dd>{detail.player.lastAction}</dd></div>
      </dl>
      <section className={styles.notes}>
        <header><div><small>Только для администратора</small><h2>Внутренние заметки</h2></div><NotebookPen aria-hidden="true" /></header>
        <textarea value={draft} maxLength={3000} placeholder={editing ? "Измените заметку…" : "Добавить заметку об игроке…"} aria-label="Текст внутренней заметки" onChange={(event) => setDraft(event.target.value)} />
        <div className={styles.noteActions}>{editing ? <button type="button" onClick={() => { setEditing(null); setDraft(""); }}>Отмена</button> : null}<button type="button" disabled={!draft.trim() || pending} onClick={() => save(editing ? "edit" : "create")}>{pending ? "Сохраняем…" : editing ? "Сохранить" : "Добавить заметку"}</button></div>
        <div className={styles.noteHistory}>{detail.notes.length ? detail.notes.map((note) => <article key={note.logicalId}><p>{note.body}</p><small>{note.author} · создано {formatLocalDateTime(locale, note.createdAt)}{note.modifiedAt ? ` · изменено ${formatLocalDateTime(locale, note.modifiedAt)}` : ""}</small><div><button type="button" onClick={() => { setEditing(note); setDraft(note.body); }} aria-label="Редактировать заметку"><Pencil aria-hidden="true" /></button><button type="button" onClick={() => save("delete", note)} aria-label="Удалить заметку"><Trash2 aria-hidden="true" /></button></div></article>) : <p className={styles.noNotes}>Внутренних заметок пока нет.</p>}</div>
      </section>
    </aside>
  );
}

export function AdminMessengerWorkspace({ initialList, initialDetail }: { initialList: AdminMessengerList; initialDetail: AdminMessengerDetail | null }) {
  const reduced = useReducedMotion();
  const [list, setList] = useState(initialList);
  const [detail, setDetail] = useState(initialDetail);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mobileChat, setMobileChat] = useState(false);
  const pollingRef = useRef(false);
  const selectedId = detail?.conversation.id;

  const visible = useMemo(() => list.items, [list.items]);

  const loadList = useCallback(async (query = search) => {
    const response = await fetch(`/api/admin/messenger?q=${encodeURIComponent(query)}`, { cache: "no-store" });
    if (response.ok) setList(await response.json() as AdminMessengerList);
  }, [search]);

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
        <header><div><small>Личный канал связи</small><h1 tabIndex={-1}>Messenger</h1></div>{list.unreadCount ? <b>{list.unreadCount}</b> : null}</header>
        <label className={styles.search}><Search aria-hidden="true" /><span className="sr-only">Поиск игрока</span><input value={search} placeholder="Имя, email или внутренний ID" onChange={(event) => setSearch(event.target.value)} /></label>
        <div className={styles.chatItems}>{visible.length ? visible.map((item) => <ChatListItem key={item.conversationId} item={item} active={selectedId === item.conversationId} onClick={() => openChat(item)} />) : <div className={styles.emptyList}><MessageCircle aria-hidden="true" /><strong>Пока нет активных диалогов</strong><p>Новые игроки появятся здесь автоматически.</p></div>}</div>
      </aside>

      <main className={styles.conversation}>
        {loading ? <div className={styles.loading}><LoaderCircle aria-hidden="true" /><span>Открываем переписку…</span></div> : detail ? <>
          <header className={styles.conversationHeader}>
            <button type="button" className={styles.mobileBack} onClick={() => setMobileChat(false)} aria-label="Назад к списку игроков"><ArrowLeft aria-hidden="true" /></button>
            <span className={styles.avatar} data-status={detail.player.online ? "online" : "offline"} aria-label={`${detail.player.name}: ${detail.player.online ? "в сети" : "не в сети"}`}>{detail.player.initials}</span>
            <div><strong>{detail.player.name}</strong><small>{detail.player.online ? "В сети" : "Не в сети"}</small></div>
            <button type="button" className={styles.infoButton} data-active={panelOpen || undefined} onClick={() => setPanelOpen((open) => !open)} aria-label={panelOpen ? "Закрыть информацию об игроке" : "Открыть информацию об игроке"} aria-expanded={panelOpen}><Info aria-hidden="true" /></button>
          </header>
          <Messages detail={detail} pending={false} />
          <AdminComposer detail={detail} onUpdate={(value) => { setDetail(value); void loadList(); }} />
        </> : <div className={styles.noSelection}><MessageCircle aria-hidden="true" /><strong>Выберите игрока, чтобы открыть переписку</strong><p>Вся история постоянного диалога появится здесь.</p></div>}
      </main>

      <AnimatePresence>
        {detail && panelOpen ? <motion.div className={styles.panelWrap} data-open initial={reduced ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={reduced ? undefined : { opacity: 0, x: 12 }} transition={transition}><PlayerPanel detail={detail} onUpdate={setDetail} onClose={() => setPanelOpen(false)} /></motion.div> : null}
      </AnimatePresence>
      {panelOpen ? <button type="button" className={styles.panelOverlay} onClick={() => setPanelOpen(false)} aria-label="Закрыть информацию об игроке" /> : null}
      <button type="button" className="sr-only"><MoreHorizontal aria-hidden="true" />Дополнительные действия</button>
    </section>
  );
}
