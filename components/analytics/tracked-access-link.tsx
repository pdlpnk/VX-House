"use client";

import type { MouseEvent, ReactNode } from "react";
import { accessPlacement, trackAnalyticsEvent } from "@/lib/analytics/client";
import type { AccessPlacement } from "@/lib/analytics";

export function TrackedAccessLink({ children, placement, className, href = "/access" }: {
  children: ReactNode;
  placement: Exclude<AccessPlacement, "mobile_navigation">;
  className?: string;
  href?: string;
}) {
  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    await trackAnalyticsEvent({ eventName: "access_clicked", clientEventId: crypto.randomUUID(), metadata: { placement: accessPlacement(placement) } });
    window.location.assign(href);
  }
  return <a href={href} className={className} onClick={handleClick}>{children}</a>;
}

