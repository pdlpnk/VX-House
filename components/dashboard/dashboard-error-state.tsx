"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DashboardErrorState({ reset }: { reset: () => void }) {
  return (
    <main
      className="flex min-h-[60vh] items-center justify-center px-6 py-16"
      id="main-content"
    >
      <section
        className="w-full max-w-xl rounded-[var(--radius-xl)] border border-white/10 bg-white/[0.035] p-8 text-center shadow-2xl shadow-black/20"
        role="alert"
      >
        <p className="text-sm text-[var(--color-text-muted)]">Временная ошибка</p>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--color-text-primary)]">
          Не удалось загрузить кабинет
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[var(--color-text-secondary)]">
          Аккаунт и данные сохранены. Повторите загрузку страницы.
        </p>
        <Button className="mt-7" onClick={reset}>
          <RotateCcw aria-hidden="true" />
          Повторить
        </Button>
      </section>
    </main>
  );
}
