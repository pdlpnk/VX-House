"use client";

import { Check, Copy, KeyRound, LockKeyhole } from "lucide-react";
import { useState } from "react";

import styles from "@/app/dashboard/dashboard.module.css";
import { StatusPill } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PromocodeView } from "@/lib/platform-operations";
import { useI18n } from "@/components/i18n/i18n-provider";
import { intlLocales } from "@/lib/i18n";
import { workspaceContent } from "@/lib/i18n/workspace-content";

export function PromocodeCatalog({ initialItems }: { initialItems: PromocodeView[] }) {
  const { locale } = useI18n(); const copy = workspaceContent[locale].partner.promocode;
  const [items, setItems] = useState(initialItems); const [pending, setPending] = useState<string | null>(null); const [message, setMessage] = useState("");
  async function activate(id: string) { setPending(id); setMessage(""); const response = await fetch(`/api/promocodes/${id}/activate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }) }); const payload = await response.json() as PromocodeView; if (response.ok) { setItems((current) => current.map((item) => item.id === id ? payload : item)); setMessage(copy.activatedMessage); } else setMessage(copy.activationError); setPending(null); }
  return <><div className={styles.promocodeCatalog}>{items.map((item) => <Card key={item.id} className={styles.promocodeCard}><header><span><KeyRound aria-hidden="true" /></span><div><small>{item.partner} · {item.market}</small><h2>{item.key}</h2></div><StatusPill tone={item.availability === "ACTIVATED" ? "success" : item.availability === "EXPIRED" ? "neutral" : "brand"}>{item.availability === "ACTIVATED" ? copy.activated : item.availability === "EXPIRED" ? copy.expired : copy.available}</StatusPill></header><p>{item.instructions}</p><dl><div><dt>{copy.validUntil}</dt><dd>{new Intl.DateTimeFormat(intlLocales[locale], { dateStyle: "medium" }).format(new Date(item.validUntil))}</dd></div><div><dt>{copy.role}</dt><dd>{item.role === "PARTNER" ? copy.partner : copy.player}</dd></div></dl>{item.code ? <div className={styles.promocodeCode}><code>{item.code}</code><button type="button" onClick={() => navigator.clipboard.writeText(item.code!)} aria-label={copy.copy}><Copy aria-hidden="true" /></button></div> : <Button disabled={item.availability !== "AVAILABLE" || pending === item.id} onClick={() => activate(item.id)}>{item.availability === "EXPIRED" ? <LockKeyhole aria-hidden="true" /> : <Check aria-hidden="true" />}{pending === item.id ? copy.activating : copy.activate}</Button>}</Card>)}</div>{message ? <p role="status" className={styles.supportFormDisabled}>{message}</p> : null}</>;
}
