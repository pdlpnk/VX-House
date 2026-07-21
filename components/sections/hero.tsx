"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Layers3 } from "lucide-react";

import { Container } from "@/components/container";
import { HeroVisual } from "@/components/hero-visual";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const contentVariants = prefersReducedMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : staggerContainer(0.1, 0.14);

  return (
    <section id="top" className="hero-section" aria-labelledby="hero-title">
      <div className="hero-background" aria-hidden="true">
        <div className="hero-background__grid" />
        <div className="hero-background__glow hero-background__glow--one" />
        <div className="hero-background__glow hero-background__glow--two" />
        <div className="hero-background__vignette" />
      </div>

      <Container className="relative z-10 grid min-h-svh items-center gap-14 pb-24 pt-32 lg:grid-cols-[minmax(0,1fr)_minmax(26rem,0.82fr)] lg:gap-10 lg:pb-20 lg:pt-28">
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto flex max-w-2xl flex-col items-center text-center lg:mx-0 lg:items-start lg:text-left"
        >
          <motion.div variants={prefersReducedMotion ? undefined : fadeUp} className="hero-badge">
            <Layers3 aria-hidden="true" />
            <span>Закрытая платформа VX House</span>
          </motion.div>

          <motion.h1
            variants={prefersReducedMotion ? undefined : fadeUp}
            id="hero-title"
            className="mt-7 max-w-[12ch] text-balance text-[clamp(3.25rem,8.2vw,7rem)] font-semibold leading-[0.94] tracking-[var(--tracking-display)] text-foreground"
          >
            Единая платформа для игроков и партнёров.
          </motion.h1>

          <motion.p
            variants={prefersReducedMotion ? undefined : fadeUp}
            className="mt-7 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8"
          >
            Особые условия, вознаграждения, личный кабинет и прямое
            сопровождение — в одной защищённой экосистеме.
          </motion.p>

          <motion.div
            id="get-started"
            variants={prefersReducedMotion ? undefined : fadeUp}
            className="mt-9 flex w-full flex-col items-stretch gap-3 min-[420px]:w-auto min-[420px]:flex-row min-[420px]:items-center"
          >
            <Button asChild size="lg" className="group rounded-xl shadow-glow">
              <a href="/access">
                Получить доступ
                <ArrowRight
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-xl border-white/10 bg-white/[0.035] backdrop-blur-md"
            >
              <a href="#platform">Изучить платформу</a>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[34rem] lg:max-w-none"
        >
          <HeroVisual />
        </motion.div>
      </Container>

      <motion.a
        href="#platform"
        aria-label="Прокрутить к обзору платформы"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="hero-scroll-indicator"
      >
        <span>Далее</span>
        <ArrowDown aria-hidden="true" />
      </motion.a>
    </section>
  );
}
