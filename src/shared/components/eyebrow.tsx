import type { ReactNode } from "react";

const tones = {
  muted: "text-muted",
  accent: "text-accent",
  danger: "text-danger-200",
} as const;

export function Eyebrow({
  as,
  tone = "muted",
  children,
}: {
  as?: "p" | "div";
  tone?: keyof typeof tones;
  children: ReactNode;
}) {
  const Component = as ?? "p";

  return (
    <Component
      className={`eyebrow text-sm font-semibold uppercase tracking-[-0.6px] ${tones[tone]}`}
    >
      {children}
    </Component>
  );
}
