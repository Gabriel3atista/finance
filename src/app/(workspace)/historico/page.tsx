import { redirect } from "next/navigation";
import { HistoryList } from "@/features/history/components/history-list";
import { getHistoricalData } from "@/features/history/lib/data";

import { Eyebrow } from "@/shared/components/eyebrow";

export default async function HistoryPage() {
  const data = await getHistoricalData();
  if (!data) redirect("/login");

  return (
    <div className="space-y-8">
      <header>
        <Eyebrow>Ao longo do tempo</Eyebrow>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-ink sm:text-[34px]">
          Histórico
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-[15px]">
          Consulte receitas, despesas e a origem dos lançamentos históricos
          desde 2024.
        </p>
      </header>
      <HistoryList batches={data.batches} entries={data.entries} />
    </div>
  );
}
