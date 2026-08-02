"use client";

import { Check, ChevronDown, Languages } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { useI18n } from "./i18n-provider";
import { localeNames, locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  className,
  syncProfile = false,
}: {
  className?: string;
  syncProfile?: boolean;
}) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  async function select(nextLocale: Locale) {
    setLocale(nextLocale);
    setOpen(false);
    if (syncProfile) {
      await fetch("/api/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ preferredLanguage: nextLocale.toUpperCase() }),
      }).catch(() => undefined);
    }
  }

  return <div className={cn("language-switcher", className)} ref={rootRef}>
    <button
      type="button"
      className="language-switcher__button"
      aria-label={t("language.select")}
      aria-expanded={open}
      aria-controls={listId}
      aria-haspopup="listbox"
      onClick={() => setOpen((value) => !value)}
    >
      <Languages aria-hidden="true" />
      <span>{locale.toUpperCase()}</span>
      <ChevronDown aria-hidden="true" />
    </button>
    {open ? <div id={listId} className="language-switcher__menu" role="listbox" aria-label={t("language.label")}>
      {locales.map((item) => <button
        key={item}
        type="button"
        role="option"
        aria-selected={item === locale}
        onClick={() => void select(item)}
      >
        <span><strong>{item.toUpperCase()}</strong><small>{localeNames[item]}</small></span>
        {item === locale ? <Check aria-hidden="true" /> : null}
      </button>)}
    </div> : null}
  </div>;
}
