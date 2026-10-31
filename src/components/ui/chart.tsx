"use client";

import type { CSSProperties, ReactNode } from "react";
import { ResponsiveContainer, Tooltip } from "recharts";
import { FinancialValue } from "@/shared/components/financial-values";
import { formatCurrency } from "@/shared/lib/currency";

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
  dataKey?: string;
  name?: string;
  value?: number | string;
  payload?: {
    [key: string]: number | string | undefined;
    fullMonth?: string;
  };
};

export function ChartTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
}) {
  const points = payload?.filter((point) => point.value !== undefined) ?? [];
  if (!active || points.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-line/30 bg-graphite-800/60 px-3 py-2.5 text-ink shadow-[0_8px_32px_hsl(0_0%_0%/45%)] backdrop-blur-lg">
      <p className="text-xs font-medium text-ink">
        {points[0].payload?.fullMonth}
      </p>
      <div className="mt-1.5 grid gap-1.5">
        {points.map((point) => {
          const rowValue = point.dataKey
            ? point.payload?.[point.dataKey]
            : undefined;
          const value = rowValue ?? point.value;

          return (
            <div
              className="flex items-center gap-2"
              key={point.dataKey ?? point.name}
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: point.color }}
              />
              <span className="text-xs text-muted">{point.name}</span>
              <span className="ml-auto text-sm font-semibold tabular-nums text-ink">
                <FinancialValue>{formatCurrency(Number(value))}</FinancialValue>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
