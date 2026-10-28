import { FeatureIcon } from "@/shared/components/feature-icon";
import { Eyebrow } from "@/shared/components/eyebrow";
import { formatMonth } from "@/shared/lib/date";

const month = formatMonth(new Date());

export function MonthOverview() {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Eyebrow>Visão mensal</Eyebrow>
          <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-ink sm:text-[34px]">
            {month}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted sm:text-[15px]">
            Seu panorama financeiro, organizado em um só lugar.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-line bg-graphite-900 px-3 py-1.5 text-xs font-medium text-muted sm:self-auto">
          <span
            className="size-1.5 rounded-full bg-success-400"
            aria-hidden="true"
          />
          Núcleo familiar
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard title="Receitas" icon="↗" />
        <SummaryCard title="Despesas" icon="↘" />
        <SummaryCard title="Saldo do mês" icon="＝" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.85fr)]">
        <div className="rounded-[18px] border border-line bg-graphite-900 shadow-card min-h-[315px] p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-semibold text-ink">
                Movimentações do mês
              </h2>
              <p className="mt-1 text-sm text-muted">
                Receitas e contas em um só lugar.
              </p>
            </div>
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-canvas text-muted">
              <FeatureIcon name="records" />
            </div>
          </div>
          <div className="flex min-h-[205px] flex-col items-center justify-center text-center">
            <div className="grid size-11 place-items-center rounded-full bg-graphite-800 text-muted">
              <FeatureIcon name="history" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-ink">
              Nenhuma movimentação ainda
            </h3>
            <p className="mt-1 max-w-xs text-xs leading-5 text-muted">
              Quando os lançamentos estiverem configurados, você verá aqui o que
              entrou e o que falta pagar.
            </p>
          </div>
        </div>

        <div className="rounded-[18px] border border-line bg-graphite-900 shadow-card min-h-[315px] p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-semibold text-ink">
                Próximos meses
              </h2>
              <p className="mt-1 text-sm text-muted">Planejamento à frente</p>
            </div>
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
              <FeatureIcon name="forecast" />
            </div>
          </div>
          <div className="mt-5 divide-y divide-line">
            {getNextMonths().map((label) => (
              <div
                key={label}
                className="flex items-center justify-between py-3.5"
              >
                <span className="text-sm text-ink">{label}</span>
                <span className="text-xs text-muted">Aguardando dados</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-5 text-center text-xs text-muted">
        Esta estrutura ainda não está conectada a dados financeiros.
      </p>
    </section>
  );
}

function SummaryCard({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-graphite-900 shadow-card flex min-h-[119px] items-start justify-between p-5 sm:p-6">
      <div>
        <p className="text-sm text-muted">{title}</p>
        <p
          className="mt-3 text-[22px] font-semibold tracking-tight text-graphite-500"
          aria-label="Sem dados"
        >
          —
        </p>
      </div>
      <span
        className="grid size-9 place-items-center rounded-xl bg-canvas text-sm font-semibold text-muted"
        aria-hidden="true"
      >
        {icon}
      </span>
    </div>
  );
}

function getNextMonths() {
  return Array.from({ length: 3 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + index + 1);
    return formatMonth(date);
  });
}
