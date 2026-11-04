import type { CreditCard } from "@/features/transactions/lib/data";

export function CreditCardVisual({
  card,
  compact = false,
}: {
  card: Pick<CreditCard, "bank_name" | "last_four">;
  compact?: boolean;
}) {
  return (
    <div
      aria-label={`Cartão ${card.bank_name}, final ${card.last_four}`}
      className={`relative isolate flex aspect-[1.62/1] w-full flex-col justify-between overflow-hidden rounded-2xl border border-white/35 bg-[linear-gradient(130deg,hsl(0_0%_82%),hsl(220_8%_55%)_28%,hsl(0_0%_91%)_48%,hsl(220_5%_58%)_72%,hsl(0_0%_78%))] p-4 text-graphite-900 shadow-[inset_0_1px_0_hsl(0_0%_100%/65%),0_16px_36px_hsl(0_0%_0%/28%)] sm:p-5 ${compact ? "max-w-[230px]" : ""}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-20 -z-10 size-56 rounded-full border border-white/40 bg-[radial-gradient(circle_at_35%_35%,hsl(0_0%_100%/45%),hsl(220_8%_50%/10%)_68%,transparent_70%)]"
      />
      <span className="flex items-start justify-between gap-4">
        <span className="text-sm font-semibold tracking-wide sm:text-base">
          {card.bank_name}
        </span>
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-md border border-graphite-900/20 bg-[linear-gradient(135deg,hsl(45_30%_78%),hsl(45_18%_55%),hsl(45_30%_83%))] shadow-[inset_0_1px_0_hsl(0_0%_100%/60%)]"
        >
          <span className="size-4 rounded-[4px] border border-graphite-900/40 bg-[linear-gradient(90deg,transparent_46%,hsl(0_0%_0%/28%)_48%,hsl(0_0%_0%/28%)_52%,transparent_54%),linear-gradient(0deg,transparent_46%,hsl(0_0%_0%/28%)_48%,hsl(0_0%_0%/28%)_52%,transparent_54%)]" />
        </span>
      </span>
      <span className="flex items-end justify-between gap-4">
        <span className="font-mono text-[13px] font-medium tracking-[0.18em] sm:text-sm">
          •••• {card.last_four}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-graphite-900/65">
          Crédito
        </span>
      </span>
    </div>
  );
}
