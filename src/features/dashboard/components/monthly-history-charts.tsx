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
import { formatMonth } from "@/shared/lib/date";
import {
  FinancialValue,
  useValuesVisibility,
} from "@/shared/components/financial-values";
import type { DashboardMonth } from "@/features/dashboard/lib/data";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const chartConfig = {
  income: { label: "Receita", color: "#E1E8EE" },
  expenses: { label: "Despesa", color: "#F43F5E" },
};

const periodOptions = [
  { months: 3, label: "Últimos 3 meses" },
  { months: 12, label: "1 ano" },
  { months: 24, label: "2 anos" },
  { months: 60, label: "5 anos" },
];

export function MonthlyHistoryCharts({ data }: { data: DashboardMonth[] }) {
  const [period, setPeriod] = useState(12);
  const filteredData = data.slice(-period);

  return (
    <>
      <div className="mb-3 flex justify-end">
        <label className="field-label flex-row items-center gap-2">
          Período dos gráficos
          <Select
            onValueChange={(value) => setPeriod(Number(value))}
            value={String(period)}
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
        </label>
      </div>
      <MonthlyBarChart data={filteredData} />
    </>
  );
}

function MonthlyBarChart({ data }: { data: DashboardMonth[] }) {
  const { hidden } = useValuesVisibility();
  const chartData = data.map((item) => ({
    month: new Intl.DateTimeFormat("pt-BR", { month: "short" })
      .format(item.month)
      .replace(".", ""),
    fullMonth: formatMonth(item.month),
    income: item.income,
    expenses: item.expenses,
  }));
  const latest = data.at(-1);

  return (
    <section className="surface min-w-0 p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-ink">
            Receitas e despesas da família
          </h3>
          <p className="mt-1 text-xs text-muted">
            Valores recebidos e pagos, comparados por mês
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {Object.entries(chartConfig).map(([key, series]) => (
              <span
                className="inline-flex items-center gap-2 text-xs text-muted"
                key={key}
              >
                <span
                  className="size-2 rounded-sm"
                  style={{ backgroundColor: series.color }}
                />
                {series.label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          {Object.entries(chartConfig).map(([field, series]) => (
            <p
              className="text-right text-sm font-semibold tabular-nums text-ink"
              key={field}
            >
              <FinancialValue>
                {currency.format(latest?.[field as "income" | "expenses"] ?? 0)}
              </FinancialValue>
              <span className="mt-0.5 block text-[10px] font-normal text-muted">
                {series.label} neste mês
              </span>
            </p>
          ))}
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
            stroke="#303238"
            strokeDasharray="3 5"
          />
          <XAxis
            axisLine={false}
            dataKey="fullMonth"
            tickLine={false}
            tickFormatter={(value: string) =>
              chartData.find((item) => item.fullMonth === value)?.month ?? value
            }
            tick={{ fill: "#7D808B", fontSize: 11 }}
            tickMargin={10}
          />
          <YAxis
            axisLine={false}
            domain={[0, "auto"]}
            tickLine={false}
            tick={{ fill: "#7D808B", fontSize: 10 }}
            tickFormatter={(value: number) =>
              hidden
                ? "•••"
                : new Intl.NumberFormat("pt-BR", {
                    notation: "compact",
                    style: "currency",
                    currency: "BRL",
                    maximumFractionDigits: 1,
                  }).format(value)
            }
            tickCount={4}
            width={58}
          />
          <ChartTooltip
            cursor={{ fill: "rgba(125, 128, 139, 0.08)" }}
            content={<ChartTooltipContent />}
          />
          <Bar
            activeBar={{ fillOpacity: 0.78 }}
            dataKey="income"
            fill="var(--color-income)"
            maxBarSize={28}
            name={chartConfig.income.label}
            radius={[5, 5, 0, 0]}
          />
          <Bar
            activeBar={{ fillOpacity: 0.78 }}
            dataKey="expenses"
            fill="var(--color-expenses)"
            maxBarSize={28}
            name={chartConfig.expenses.label}
            radius={[5, 5, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </section>
  );
}
