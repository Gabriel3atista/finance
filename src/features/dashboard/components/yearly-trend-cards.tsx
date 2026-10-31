"use client";

import { Area, AreaChart, Line } from "recharts";
import { Card } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import type { DashboardMonth } from "@/features/dashboard/lib/data";

export const YEARLY_TREND_CARD_HEIGHT = "h-[162px] sm:h-[186px]";

const trends = [
  {
    key: "income",
    title: "Receitas",
    color: "hsl(43.92 100% 50.98%)",
  },
  {
    key: "expenses",
    title: "Despesas",
    color: "hsl(206.67 36% 95.1%)",
  },
] as const;

export function YearlyTrendCards({ data }: { data: DashboardMonth[] }) {
  const chartData = data.slice(-12).map((item) => ({
    income: item.income,
    expenses: item.expenses,
  }));

  return (
    <div className="grid grid-cols-2 gap-3">
      {trends.map((trend) => (
        <Card
          className={`min-w-0 overflow-hidden p-3 sm:p-4 ${YEARLY_TREND_CARD_HEIGHT}`}
          key={trend.key}
        >
          <h2 className="text-sm font-semibold text-ink">{trend.title}</h2>
          <div
            aria-label={`Tendência mensal de ${trend.title.toLowerCase()} no último ano`}
            className="mt-3 h-20 w-full sm:h-24"
            role="img"
          >
            <ChartContainer
              className="h-full w-full"
              config={{
                [trend.key]: { label: trend.title, color: trend.color },
              }}
            >
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <defs>
                  <linearGradient
                    id={`yearly-trend-area-${trend.key}`}
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={trend.color}
                      stopOpacity={0.24}
                    />
                    <stop
                      offset="100%"
                      stopColor={trend.color}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  activeDot={false}
                  animationBegin={1000}
                  animationDuration={500}
                  animationEasing="ease-out"
                  dataKey={trend.key}
                  fill={`url(#yearly-trend-area-${trend.key})`}
                  isAnimationActive
                  stroke="none"
                  type="monotone"
                />
                <Line
                  activeDot={false}
                  dataKey={trend.key}
                  dot={false}
                  animationBegin={1000}
                  animationDuration={500}
                  animationEasing="ease-out"
                  isAnimationActive
                  stroke={`var(--color-${trend.key})`}
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ChartContainer>
          </div>
          <p className="mt-2 text-xs text-muted">Últimos 12 meses</p>
        </Card>
      ))}
    </div>
  );
}
