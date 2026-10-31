"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardSection } from "@/components/ui/card";
import { formatCompactCurrency } from "@/shared/lib/currency";
import { formatMonth, formatShortMonth } from "@/shared/lib/date";
import {
  useValuesVisibility,
} from "@/shared/components/financial-values";
import { useMobileApp } from "@/shared/hooks/use-mobile-app";
import type { DashboardMonth } from "@/features/dashboard/lib/data";

const chartConfig = {
  income: { label: "Receita", color: "hsl(43.92 100% 50.98% " },
  expenses: { label: "Despesa", color: "hsl(206.67 36% 95.1%)" },
};

const periodOptions = [
  { months: 3, label: "Últimos 3 meses" },
  { months: 12, label: "1 ano" },
  { months: 24, label: "2 anos" },
  { months: 60, label: "5 anos" },
];

export function MonthlyHistoryCharts({ data }: { data: DashboardMonth[] }) {
  const isMobileApp = useMobileApp();
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const period = selectedPeriod ?? (isMobileApp ? 3 : 12);
  const filteredData = data.slice(-period);

  return (
    <MonthlyBarChart
      data={filteredData}
      onPeriodChange={(value) => setSelectedPeriod(Number(value))}
      period={period}
    />
  );
}

function MonthlyBarChart({
  data,
  onPeriodChange,
  period,
}: {
  data: DashboardMonth[];
  onPeriodChange: (value: string) => void;
  period: number;
}) {
  const { hidden } = useValuesVisibility();
  const chartData = data.map((item) => ({
    month: formatShortMonth(item.month),
    fullMonth: formatMonth(item.month),
    income: item.income,
    expenses: item.expenses,
  }));

  return (
    <Card sections>
      <CardSection>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-3 min-w-0 w-full">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-xl font-semibold text-ink ml-1">
                Geral
              </h3>
              <Select
                containerClassName="w-auto"
                onValueChange={onPeriodChange}
                value={String(period)}
                variant="outline"
              >
                <SelectTrigger className="w-auto min-w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.months} value={String(option.months)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>
        <ChartContainer className="mt-4 h-[230px] w-full" config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 10, right: 4, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="hsl(225 10% 17%)"
              strokeDasharray="3 5"
            />
            <XAxis
              axisLine={false}
              dataKey="fullMonth"
              tickLine={false}
              tickFormatter={(value: string) =>
                chartData.find((item) => item.fullMonth === value)?.month ?? value
              }
              tick={{ fill: "hsl(220 8% 60%)", fontSize: 11 }}
              tickMargin={10}
            />
            <YAxis
              axisLine={false}
              domain={[0, "auto"]}
              tickLine={false}
              tick={{ fill: "hsl(220 8% 60%)", fontSize: 10 }}
              tickFormatter={(value: number) =>
                hidden ? "•••" : formatCompactCurrency(value)
              }
              tickCount={4}
              width={58}
            />
            <ChartTooltip
              cursor={{ fill: "hsl(220 8% 60% / 8%)" }}
              content={<ChartTooltipContent />}
            />
            <Bar
              animationBegin={1000}
              animationDuration={500}
              animationEasing="ease-out"
              activeBar={{ fillOpacity: 0.78 }}
              dataKey="income"
              fill="var(--color-income)"
              isAnimationActive
              maxBarSize={28}
              name={chartConfig.income.label}
              radius={[5, 5, 0, 0]}
            />
            <Bar
              animationBegin={1000}
              animationDuration={500}
              animationEasing="ease-out"
              activeBar={{ fillOpacity: 0.78 }}
              dataKey="expenses"
              fill="var(--color-expenses)"
              isAnimationActive
              maxBarSize={28}
              name={chartConfig.expenses.label}
              radius={[5, 5, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardSection>
    </Card>
  );
}
