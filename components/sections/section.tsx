import type { ComponentPropsWithoutRef } from "react";

import { Container } from "@/components/container";
import { cn } from "@/lib/utils";

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  containerClassName?: string;
  bleed?: boolean;
};

export function Section({
  children,
  className,
  containerClassName,
  bleed = false,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn("relative py-[var(--section-space)]", className)}
      {...props}
    >
      {bleed ? (
        children
      ) : (
        <Container className={containerClassName}>{children}</Container>
      )}
    </section>
  );
}
