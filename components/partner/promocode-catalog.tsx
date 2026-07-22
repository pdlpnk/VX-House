"use client";

import { Check, Copy, KeyRound, LockKeyhole } from "lucide-react";
import { useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PromocodeView } from "@/lib/platform-operations";

export function PromocodeCatalog({ initialItems }: { initialItems: PromocodeView[] }) {
  const [items, setItems] = useState(initialItems); const [pending, setPending] = useState<string | null>(null); const [message, setMessage] = useState("");
  async function activate(id: string) { setPending(id); setMessage(""); const response = await fetch(`/api/promocodes/${id}/activate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }) }); const payload = await response.json() as PromocodeView & { message?: string }; if (response.ok) { setItems((current) => current.map((item) => item.id === id ? payload : item)); setMessage("Промокод активирован и добавлен в историю."); } else setMessage(payload.message ?? "Не удалось активировать промокод"); setPending(null); }
  return <><div className={styles.promocodeCatalog}>{items.map((item) => <Card key={item.id} className={styles.promocodeCard}><header><span><KeyRound aria-hidden="true" /></span><div><small>{item.partner} · {item.market}</small><h2>{item.key}</h2></div><StatusPill tone={item.availability === "ACTIVATED" ? "success" : item.availability === "EXPIRED" ? "neutral" : "brand"}>{item.availability === "ACTIVATED" ? "Активирован" : item.availability === "EXPIRED" ? "Истёк" : "Доступен"}</StatusPill></header><p>{item.instructions}</p><dl><div><dt>Действует до</dt><dd>{new Intl.DateTimeFormat("ru", { dateStyle: "medium" }).format(new Date(item.validUntil))}</dd></div><div><dt>Роль</dt><dd>{item.role === "PARTNER" ? "Партнёр" : "Игрок"}</dd></div></dl>{item.code ? <div className={styles.promocodeCode}><code>{item.code}</code><button type="button" onClick={() => navigator.clipboard.writeText(item.code!)} aria-label="Скопировать промокод"><Copy aria-hidden="true" /></button></div> : <Button disabled={item.availability !== "AVAILABLE" || pending === item.id} onClick={() => activate(item.id)}>{item.availability === "EXPIRED" ? <LockKeyhole aria-hidden="true" /> : <Check aria-hidden="true" />}{pending === item.id ? "Активируем…" : "Активировать"}</Button>}</Card>)}</div>{message ? <p role="status" className={styles.supportFormDisabled}>{message}</p> : null}</>;
}
