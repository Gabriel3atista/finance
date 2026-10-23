"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DashboardMonth } from "@/features/dashboard/lib/data";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const chartConfig = {
  income: { label: "Receita", color: "#E1E8EE" },
  expenses: { label: "Despesa", color: "#F43F5E" },
};

export function MonthlyHistoryCharts({ data }: { data: DashboardMonth[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <MonthlyBarChart
        title="Receita da família"
        description="Receitas marcadas como recebidas"
        data={data}
        field="income"
      />
      <MonthlyBarChart
        title="Despesas da família"
        description="Despesas marcadas como pagas"
        data={data}
        field="expenses"
      />
    </div>
  );
}

function MonthlyBarChart({
  title,
  description,
  data,
  field,
}: {
  title: string;
  description: string;
  data: DashboardMonth[];
  field: "income" | "expenses";
}) {
  const series = chartConfig[field];
  const chartData = data.map((item) => ({
    month: new Intl.DateTimeFormat("pt-BR", { month: "short" })
      .format(item.month)
      .replace(".", ""),
    fullMonth: new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(item.month),
    value: item[field],
  }));
  const latest = data.at(-1);

  return (
    <section className="surface min-w-0 p-5 sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-ink">
            {title}
          </h3>
          <p className="mt-1 text-xs text-muted">{description}</p>
        </div>
        <p className="shrink-0 text-right text-sm font-semibold tabular-nums text-ink">
          {currency.format(latest?.[field] ?? 0)}
          <span className="mt-0.5 block text-[10px] font-normal text-muted">
            neste mês
          </span>
        </p>
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
            dataKey="month"
            tickLine={false}
            tick={{ fill: "#7D808B", fontSize: 11 }}
            tickMargin={10}
          />
          <YAxis
            axisLine={false}
            domain={[0, "auto"]}
            tickLine={false}
            tick={{ fill: "#7D808B", fontSize: 10 }}
            tickFormatter={(value: number) =>
              new Intl.NumberFormat("pt-BR", {
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
            dataKey="value"
            fill={`var(--color-${field})`}
            maxBarSize={34}
            name={series.label}
            radius={[5, 5, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </section>
  );
}
