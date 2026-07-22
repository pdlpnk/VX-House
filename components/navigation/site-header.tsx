"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const navigation = [
  { label: "Возможности", href: "#model" },
  { label: "Как это работает", href: "#process" },
  { label: "Почему мы", href: "#benefits" },
  { label: "Вопросы", href: "#faq" },
] as const;

export function SiteHeader() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.header
      initial={prefersReducedMotion ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="site-header"
    >
      <Container className="flex h-[var(--header-height)] items-center justify-between">
        <a
          href="#top"
          className="group inline-flex items-center gap-2.5 rounded-md"
          aria-label="VX House — главная"
        >
          <span className="brand-logo" aria-hidden="true">
            <Image
              src="/vx-house-logo.jpg"
              alt=""
              width={232}
              height={232}
              priority
              unoptimized
            />
          </span>
        </a>

        <nav
          aria-label="Основная навигация"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 min-[900px]:flex"
        >
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Button asChild size="sm" className="rounded-lg px-3.5">
          <a href="/access">
            <span className="hidden min-[420px]:inline">Получить доступ</span>
            <span className="min-[420px]:hidden">Доступ</span>
            <ArrowUpRight aria-hidden="true" />
          </a>
        </Button>
      </Container>
    </motion.header>
  );
}
