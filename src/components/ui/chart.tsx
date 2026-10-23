"use client";

import type { CSSProperties, ReactNode } from "react";
import { ResponsiveContainer, Tooltip } from "recharts";

export type ChartConfig = Record<string, { label: string; color: string }>;

export function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig;
  className: string;
  children: ReactNode;
}) {
  const colors = Object.fromEntries(
    Object.entries(config).map(([key, item]) => [`--color-${key}`, item.color]),
  ) as CSSProperties;

  return (
    <div className={className} style={colors}>
      <ResponsiveContainer height="100%" width="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export const ChartTooltip = Tooltip;

type ChartTooltipPayload = {
  color?: string;
  name?: string;
  value?: number | string;
  payload?: { fullMonth?: string };
};

export function ChartTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
}) {
  const point = payload?.[0];
  if (
    !active ||
    !point ||
    point.value === undefined ||
    Number(point.value) <= 0
  ) {
    return null;
  }

  return (
    <div className="rounded-xl border border-line bg-secondary-900 px-3 py-2.5 shadow-xl">
      <p className="text-xs font-medium capitalize text-muted">
        {point.payload?.fullMonth}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="size-2 rounded-full"
          style={{ backgroundColor: point.color }}
        />
        <span className="text-xs text-muted">{point.name}</span>
        <span className="text-sm font-semibold tabular-nums text-ink">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(Number(point.value))}
        </span>
      </div>
    </div>
  );
}
