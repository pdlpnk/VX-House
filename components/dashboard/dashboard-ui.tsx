"use client";

import { motion, type Variants } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import styles from "@/app/dashboard/dashboard.module.css";
import { Card } from "@/components/ui/card";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { cn } from "@/lib/utils";

const pageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
  },
};

const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045, delayChildren: 0.025 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 9 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] } },
};

export function DashboardPage({ children, className }: { children: React.ReactNode; className?: string }) {
  const { shouldReduceMotion } = useDashboard();
  return (
    <motion.div
      className={cn(styles.pageContent, className)}
      variants={shouldReduceMotion ? undefined : pageVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

export function DashboardHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className={styles.pageHeading}>
      <div>
        <span>{eyebrow}</span>
        <h1 tabIndex={-1}>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className={styles.pageHeadingAction}>{action}</div>}
    </header>
  );
}

export function DashboardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  const { shouldReduceMotion } = useDashboard();
  return (
    <motion.section
      className={cn(styles.dashboardGrid, className)}
      variants={shouldReduceMotion ? undefined : gridVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
    >
      {children}
    </motion.section>
  );
}

export function DashboardGridItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const { shouldReduceMotion } = useDashboard();
  return <motion.div className={className} variants={shouldReduceMotion ? undefined : cardVariants}>{children}</motion.div>;
}

export function DashboardCard({
  icon: Icon,
  label,
  title,
  action,
  children,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn(styles.dashboardCard, className)}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeading}>
          {Icon && <span className={styles.cardIcon}><Icon aria-hidden="true" /></span>}
          <div>
            <span>{label}</span>
            <h2>{title}</h2>
          </div>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "attention" | "brand" }) {
  return <span className={styles.statusPill} data-tone={tone}>{children}</span>;
}
