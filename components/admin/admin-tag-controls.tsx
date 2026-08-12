"use client";

import { Check, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@/components/i18n/i18n-provider";
import type { AdminTagAssignmentView, AdminTagView } from "@/lib/admin-tags";
import styles from "./admin-tags.module.css";

export function TagChips({ tags, limit = 3 }: { tags: readonly AdminTagAssignmentView[]; limit?: number }) {
  const visible = tags.slice(0, limit);
  return tags.length ? <span className={styles.chips}>{visible.map((tag) => <span key={tag.id}>{tag.name}</span>)}{tags.length > limit ? <b title={tags.slice(limit).map((tag) => tag.name).join(", ")}>+{tags.length - limit}</b> : null}</span> : null;
}

export function TagFilters({ tags, selected, onSelect }: { tags: readonly AdminTagView[]; selected: string; onSelect: (id: string) => void }) {
  const { t } = useI18n();
  return <div className={styles.filters} role="tablist" aria-label={t("adminTags.filter")}><button type="button" role="tab" aria-selected={!selected} data-active={!selected || undefined} onClick={() => onSelect("")}>{t("adminTags.all")}</button>{tags.map((tag) => <button type="button" role="tab" aria-selected={selected === tag.id} data-active={selected === tag.id || undefined} key={tag.id} onClick={() => onSelect(tag.id)}>{tag.name}<small>{tag.userCount}</small></button>)}</div>;
}

export function AdminTagManager({ userId, assigned, tags, onAssignedChange, onTagsChange }: { userId: string; assigned: readonly AdminTagAssignmentView[]; tags: readonly AdminTagView[]; onAssignedChange: (tags: AdminTagAssignmentView[]) => void; onTagsChange: (tags: AdminTagView[]) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const selected = new Set(assigned.map((tag) => tag.id));

  async function refreshTags() {
    const response = await fetch("/api/admin/tags", { cache: "no-store" });
    if (response.ok) onTagsChange(await response.json() as AdminTagView[]);
  }

  async function toggle(tag: AdminTagView) {
    if (pending) return;
    setPending(true); setError("");
    const response = await fetch(`/api/admin/users/${userId}/tags/${tag.id}`, { method: selected.has(tag.id) ? "DELETE" : "PUT" });
    if (response.ok) { onAssignedChange(await response.json() as AdminTagAssignmentView[]); await refreshTags(); }
    else setError(((await response.json()) as { message?: string }).message ?? t("adminTags.error"));
    setPending(false);
  }

  async function create() {
    if (!name.trim() || pending) return;
    setPending(true); setError("");
    const response = await fetch("/api/admin/tags", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
    if (response.ok) {
      const tag = await response.json() as AdminTagView;
      const assignment = await fetch(`/api/admin/users/${userId}/tags/${tag.id}`, { method: "PUT" });
      if (!assignment.ok) setError(((await assignment.json()) as { message?: string }).message ?? t("adminTags.error"));
      else onAssignedChange(await assignment.json() as AdminTagAssignmentView[]);
      setName(""); await refreshTags();
    }
    else setError(((await response.json()) as { message?: string }).message ?? t("adminTags.error"));
    setPending(false);
  }

  async function rename(tag: AdminTagView) {
    if (!editingName.trim() || pending) return;
    setPending(true); setError("");
    const response = await fetch(`/api/admin/tags/${tag.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: editingName }) });
    if (response.ok) { setEditingId(""); await refreshTags(); onAssignedChange(assigned.map((item) => item.id === tag.id ? { ...item, name: editingName.trim() } : item)); }
    else setError(((await response.json()) as { message?: string }).message ?? t("adminTags.error"));
    setPending(false);
  }

  async function remove(tag: AdminTagView) {
    if (!window.confirm(t("adminTags.deleteConfirm", { name: tag.name })) || pending) return;
    setPending(true); setError("");
    const response = await fetch(`/api/admin/tags/${tag.id}`, { method: "DELETE" });
    if (response.ok) { onAssignedChange(assigned.filter((item) => item.id !== tag.id)); await refreshTags(); }
    else setError(((await response.json()) as { message?: string }).message ?? t("adminTags.error"));
    setPending(false);
  }

  return <div className={styles.manager}>
    <button type="button" className={styles.manageButton} onClick={() => setOpen((value) => !value)} aria-expanded={open}><Tag aria-hidden="true" />{t("adminTags.manage")}</button>
    {open ? <div className={styles.popover} role="dialog" aria-label={t("adminTags.manage")}>
      <header><strong>{t("adminTags.title")}</strong><button type="button" onClick={() => setOpen(false)} aria-label={t("common.close")}><X aria-hidden="true" /></button></header>
      <div className={styles.create}><input value={name} maxLength={60} placeholder={t("adminTags.namePlaceholder")} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void create(); } }} /><button type="button" disabled={!name.trim() || pending} onClick={() => void create()} aria-label={t("adminTags.create")}><Plus aria-hidden="true" /></button></div>
      <div className={styles.tagList}>{tags.length ? tags.map((tag) => <div key={tag.id}>
        {editingId === tag.id ? <><input autoFocus value={editingName} maxLength={60} onChange={(event) => setEditingName(event.target.value)} /><button type="button" onClick={() => void rename(tag)} aria-label={t("adminTags.save")}><Check aria-hidden="true" /></button></> : <button type="button" className={styles.tagToggle} data-selected={selected.has(tag.id) || undefined} onClick={() => void toggle(tag)}><span>{selected.has(tag.id) ? <Check aria-hidden="true" /> : null}</span><strong>{tag.name}</strong><small>{tag.userCount}</small></button>}
        <button type="button" onClick={() => { setEditingId(tag.id); setEditingName(tag.name); }} aria-label={t("adminTags.rename")}><Pencil aria-hidden="true" /></button><button type="button" onClick={() => void remove(tag)} aria-label={t("adminTags.delete")}><Trash2 aria-hidden="true" /></button>
      </div>) : <p>{t("adminTags.empty")}</p>}</div>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </div> : null}
  </div>;
}
