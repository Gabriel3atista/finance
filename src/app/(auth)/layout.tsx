import type { ReactNode } from "react";
import { NextIcon } from "@/components/atoms/next-icon";
import { Eyebrow } from "@/shared/components/eyebrow";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-graphite-900 px-5 py-10 sm:px-8">
      <div className="grid w-full max-w-[960px] overflow-hidden rounded-[28px] border border-line bg-graphite-900 shadow-[0_18px_60px_rgb(0_0_0/35%)] lg:min-h-[570px] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden flex-col justify-between bg-graphite-800 p-10 lg:flex">
          <Eyebrow as="div" tone="accent">
            Finanças da família
          </Eyebrow>
          <div className="max-w-[330px] pb-2">
            <div className="mb-7 grid size-[52px] place-items-center rounded-2xl bg-moon-200 text-graphite-900 shadow-sm">
              <NextIcon name="ForecastOutline" size={24} />
            </div>
            <p className="text-[32px] font-semibold leading-[1.12] tracking-[-0.045em] text-ink">
              Mais clareza para decidir juntos.
            </p>
            <p className="mt-4 text-sm leading-6 text-muted">
              Acompanhe o mês, organize as contas e planeje os próximos passos
              em família.
            </p>
          </div>
          <p className="text-xs text-muted">
            Seus dados ficam visíveis apenas para o seu núcleo familiar.
          </p>
        </section>
        <section className="flex items-center justify-center px-6 py-9 sm:px-10 lg:px-12">
          {children}
        </section>
      </div>
    </main>
  );
}
