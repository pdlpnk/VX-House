"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Expand, FileText, ImageIcon, LoaderCircle, MessageCircle, Paperclip, Send, Smile, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { useDashboard } from "@/components/dashboard/dashboard-provider";
import type { SupportConversationView, SupportMessageView } from "@/lib/support";
import styles from "./personal-messenger.module.css";

const transition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };
const emojis = ["🙂", "👍", "❤️", "✨"];
const allowedAttachmentTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const maxAttachmentSize = 10 * 1024 * 1024;

function fileSizeLabel(value: number) {
  return value >= 1024 * 1024
    ? `${(value / 1024 / 1024).toFixed(1)} МБ`
    : `${Math.max(1, Math.round(value / 1024))} КБ`;
}

function messageAuthor(message: SupportMessageView) {
  if (message.authorType === "USER") return "user";
  if (message.authorType === "SYSTEM") return "system";
  return "manager";
}

function messagePreview(message?: SupportMessageView) {
  if (!message) return "Напишите своему персональному менеджеру.";
  return message.body.replace(/\s+/g, " ").trim();
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("ru", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function dayLabel(value?: string) {
  if (!value) return "Сегодня";
  const date = new Date(value);
  const today = new Date();
  if (
    date.getUTCFullYear() === today.getUTCFullYear()
    && date.getUTCMonth() === today.getUTCMonth()
    && date.getUTCDate() === today.getUTCDate()
  ) return "Сегодня";
  return new Intl.DateTimeFormat("ru", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}

function MessageList({
  conversation,
  pending,
  shouldReduceMotion,
}: {
  conversation: SupportConversationView;
  pending: boolean;
  shouldReduceMotion: boolean;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const restoredConversation = useRef("");
  const stickToBottom = useRef(true);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const key = `vx-house:messenger-scroll:${conversation.id}`;
    if (restoredConversation.current !== conversation.id) {
      restoredConversation.current = conversation.id;
      const saved = Number(window.sessionStorage.getItem(key));
      list.scrollTop = Number.isFinite(saved) && saved > 0 ? saved : list.scrollHeight;
      stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
      return;
    }
    if (stickToBottom.current) {
      list.scrollTo({ top: list.scrollHeight, behavior: shouldReduceMotion ? "auto" : "smooth" });
    }
  }, [conversation.id, conversation.messages.length, pending, shouldReduceMotion]);

  return (
    <div
      ref={listRef}
      className={styles.messages}
      aria-live="polite"
      onScroll={(event) => {
        const list = event.currentTarget;
        stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
        window.sessionStorage.setItem(`vx-house:messenger-scroll:${conversation.id}`, String(list.scrollTop));
      }}
    >
      <div className={styles.day}>
        {dayLabel(conversation.messages.at(-1)?.createdAt)}
      </div>
      {conversation.messages.map((message) => {
        const author = messageAuthor(message);
        return (
          <motion.article
            key={message.id}
            className={styles.messageRow}
            data-author={author}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
          >
            <span className={styles.messageAvatar} aria-hidden="true">
              {author === "system" ? "VX" : "M"}
            </span>
            <div className={styles.bubble}>
              <p>{message.body}</p>
              {message.attachments.length ? (
                <div className={styles.attachments}>
                  {message.attachments.map((attachment) => {
                    const href = `/api/support/${conversation.id}/attachments/${attachment.id}`;
                    return attachment.mediaType.startsWith("image/") ? (
                      <a key={attachment.id} className={styles.imageAttachment} href={href} download>
                        {/* The protected endpoint verifies ownership before returning bytes. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${href}?inline=1`} alt={`Вложение: ${attachment.fileName}`} />
                        <span><ImageIcon aria-hidden="true" />{attachment.fileName}<small>{fileSizeLabel(attachment.sizeBytes)}</small></span>
                      </a>
                    ) : (
                      <a key={attachment.id} href={href} download>
                        <FileText aria-hidden="true" />
                        {attachment.fileName}
                        <small>{fileSizeLabel(attachment.sizeBytes)}</small>
                      </a>
                    );
                  })}
                </div>
              ) : null}
              <time dateTime={message.createdAt}>{timeLabel(message.createdAt)}</time>
            </div>
          </motion.article>
        );
      })}
      <AnimatePresence>
        {pending ? (
          <motion.div
            className={styles.typing}
            aria-label="Сообщение отправляется"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {[0, 1, 2].map((index) => (
              <motion.i
                key={index}
                animate={shouldReduceMotion ? undefined : { opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.12 }}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Composer({
  conversation,
  onConversation,
  onPendingChange,
}: {
  conversation: SupportConversationView;
  onConversation: (value: SupportConversationView) => void;
  onPendingChange: (value: boolean) => void;
}) {
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const previewUrl = useMemo(() => file?.type.startsWith("image/") ? URL.createObjectURL(file) : "", [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function selectFile(next: File | null) {
    setError("");
    if (!next) {
      setFile(null);
      return;
    }
    if (!allowedAttachmentTypes.has(next.type)) {
      setFile(null);
      setError("Разрешены изображения JPG, PNG, WEBP и документы PDF.");
      return;
    }
    if (next.size < 1 || next.size > maxAttachmentSize) {
      setFile(null);
      setError("Размер файла не должен превышать 10 МБ.");
      return;
    }
    setFile(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanBody = body.trim();
    if ((!cleanBody && !file) || pending) return;
    setPending(true);
    onPendingChange(true);
    setError("");
    try {
      const response = await fetch(`/api/support/${conversation.id}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          body: cleanBody || `Вложение: ${file?.name ?? "файл"}`,
          idempotencyKey: `message-${crypto.randomUUID()}`,
        }),
      });
      let updated = await response.json() as SupportConversationView & { message?: string };
      if (!response.ok) throw new Error(updated.message ?? "Не удалось отправить сообщение");

      if (file) {
        const latest = updated.messages.findLast((item) => item.authorType === "USER");
        if (!latest) throw new Error("Сообщение отправлено, но файл не прикреплён");
        const attachment = new FormData();
        attachment.set("messageId", latest.id);
        attachment.set("file", file);
        const upload = await fetch(`/api/support/${conversation.id}/attachments`, {
          method: "POST",
          body: attachment,
        });
        const uploadResult = await upload.json() as { message?: string };
        if (!upload.ok) throw new Error(uploadResult.message ?? "Файл не прикреплён");
        const refreshed = await fetch(`/api/support/${conversation.id}`);
        if (refreshed.ok) updated = await refreshed.json() as SupportConversationView;
      }

      onConversation(updated);
      setBody("");
      setFile(null);
      setEmojiOpen(false);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Не удалось отправить сообщение");
    } finally {
      setPending(false);
      onPendingChange(false);
    }
  }

  return (
    <form className={styles.composer} onSubmit={submit}>
      {file ? (
        <div className={styles.filePreview}>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" />
          ) : <FileText aria-hidden="true" />}
          <span><strong>{file.name}</strong><small>{fileSizeLabel(file.size)}</small></span>
          <button type="button" onClick={() => setFile(null)} aria-label={`Удалить файл ${file.name}`}><X aria-hidden="true" /></button>
        </div>
      ) : null}
      <label className={styles.iconButton} aria-label={file ? `Выбран файл: ${file.name}` : "Прикрепить файл"}>
        <Paperclip aria-hidden="true" />
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          disabled={pending}
          onChange={(event) => {
            selectFile(event.target.files?.[0] ?? null);
            event.currentTarget.value = "";
          }}
        />
      </label>
      <button
        type="button"
        className={styles.iconButton}
        aria-label="Добавить эмодзи"
        aria-expanded={emojiOpen}
        onClick={() => setEmojiOpen((open) => !open)}
      >
        <Smile aria-hidden="true" />
      </button>
      <AnimatePresence>
        {emojiOpen ? (
          <motion.div
            className={styles.emojiMenu}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                aria-label={`Добавить ${emoji}`}
                onClick={() => setBody((current) => `${current}${emoji}`)}
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <textarea
        rows={1}
        value={body}
        maxLength={5000}
        placeholder="Введите сообщение…"
        aria-label="Сообщение менеджеру"
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <button
        type="submit"
        className={styles.sendButton}
        disabled={(!body.trim() && !file) || pending}
        aria-label="Отправить сообщение"
      >
        {pending ? <LoaderCircle className={styles.spinner} aria-hidden="true" /> : <Send aria-hidden="true" />}
      </button>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <span className="sr-only" aria-live="polite">
        {pending ? "Сообщение отправляется" : file ? `Выбран файл ${file.name}` : ""}
      </span>
    </form>
  );
}

function MessengerHeader({
  basePath,
  compact,
  onClose,
}: {
  basePath: string;
  compact?: boolean;
  onClose?: () => void;
}) {
  return (
    <header className={styles.header}>
      <span className={styles.avatar} aria-hidden="true">VX</span>
      <div className={styles.manager}>
        <strong>Менеджер VX House</strong>
        <span>Online</span>
      </div>
      <div className={styles.headerActions}>
        {compact ? (
          <Link className={styles.iconButton} href={basePath} aria-label="Развернуть Messenger">
            <Expand aria-hidden="true" />
          </Link>
        ) : null}
        {onClose ? (
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Закрыть Messenger">
            <X aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </header>
  );
}

export function PersonalMessengerExperience({
  initialConversation,
  basePath,
  unreadCount,
  fullPage,
  onRead,
}: {
  initialConversation: SupportConversationView;
  basePath: string;
  unreadCount: number;
  fullPage: boolean;
  onRead: () => void;
}) {
  const { shouldReduceMotion } = useDashboard();
  const [conversation, setConversation] = useState(initialConversation);
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(unreadCount > 0);
  const [sending, setSending] = useState(false);
  const latest = conversation.messages.at(-1);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/support/${conversation.id}`, { cache: "no-store" });
      if (!response.ok) return;
      const next = await response.json() as SupportConversationView;
      if (next.messages.length > conversation.messages.length) {
        setConversation(next);
        if (!open && !fullPage) setPreviewOpen(true);
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [conversation.id, conversation.messages.length, fullPage, open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (fullPage) {
    return (
      <section className={`${styles.experience} ${styles.full}`} aria-label="Messenger VX House">
        <aside className={styles.dialogList}>
          <header>
            <small>Личный канал</small>
            <h1 tabIndex={-1}>Messenger</h1>
            <p>Все сообщения VX House и вашего менеджера — в одном разговоре.</p>
          </header>
          <div className={styles.conversationItem} aria-current="page">
            <span className={styles.avatar} aria-hidden="true">VX</span>
            <div>
              <strong>Менеджер VX House</strong>
              <p>{messagePreview(latest)}</p>
            </div>
            <time dateTime={latest?.createdAt}>{latest ? timeLabel(latest.createdAt) : ""}</time>
          </div>
        </aside>
        <div className={styles.conversationPanel}>
          <MessengerHeader basePath={basePath} />
          <MessageList conversation={conversation} pending={sending} shouldReduceMotion={shouldReduceMotion} />
          <Composer
            conversation={conversation}
            onConversation={setConversation}
            onPendingChange={setSending}
          />
        </div>
      </section>
    );
  }

  return (
    <div className={styles.experience}>
      <AnimatePresence>
        {previewOpen && !open ? (
          <motion.div
            className={styles.preview}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5 }}
            transition={transition}
          >
            <button
              type="button"
              className={styles.previewContent}
              onClick={() => {
                setOpen(true);
                setPreviewOpen(false);
                onRead();
              }}
            >
              <strong>Менеджер VX House</strong>
              <p>“{messagePreview(latest)}”</p>
            </button>
            <button
              type="button"
              className={styles.previewClose}
              aria-label="Скрыть сообщение"
              onClick={(event) => {
                event.stopPropagation();
                setPreviewOpen(false);
              }}
            >
              <X aria-hidden="true" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <motion.section
            className={styles.mini}
            role="dialog"
            aria-modal="false"
            aria-label="Messenger VX House"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
            transition={transition}
          >
            <MessengerHeader basePath={basePath} compact onClose={() => setOpen(false)} />
            <MessageList conversation={conversation} pending={sending} shouldReduceMotion={shouldReduceMotion} />
            <Composer
              conversation={conversation}
              onConversation={setConversation}
              onPendingChange={setSending}
            />
          </motion.section>
        ) : (
          <motion.button
            type="button"
            className={styles.launcher}
            aria-label={unreadCount ? `Открыть Messenger. Непрочитано: ${unreadCount}` : "Открыть Messenger"}
            onClick={() => {
              setOpen(true);
              setPreviewOpen(false);
              onRead();
            }}
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={shouldReduceMotion ? undefined : { y: -3 }}
            transition={transition}
          >
            <MessageCircle aria-hidden="true" />
            {unreadCount ? (
              <motion.i
                aria-hidden="true"
                animate={shouldReduceMotion ? undefined : { scale: [1, 1.14, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                {unreadCount}
              </motion.i>
            ) : null}
          </motion.button>
        )}
      </AnimatePresence>

      <Link className="sr-only" href={basePath}>
        Открыть Messenger <ArrowUpRight aria-hidden="true" />
      </Link>
    </div>
  );
}
