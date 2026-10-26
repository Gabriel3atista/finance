import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export function Eyebrow({
  as,
  tone = "muted",
  children,
}: {
  as?: "p" | "div";
  tone?: "muted" | "accent" | "danger";
  children: ReactNode;
}) {
  const Component = as ?? "p";

  return (
    <Component
      className={cn(
        "font-kantumruy-pro text-sm font-semibold uppercase tracking-[-0.6px]",
        tone === "accent" && "text-accent",
        tone === "danger" && "text-rose-200",
        tone === "muted" && "text-muted",
      )}
    >
      {children}
    </Component>
  );
}
