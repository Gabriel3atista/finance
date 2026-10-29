import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

const variants = [
  { name: "Primary", value: "primary" },
  { name: "Default", value: "default" },
  { name: "Secondary", value: "secondary" },
  { name: "Outline", value: "outline" },
  { name: "Ghost", value: "ghost" },
  { name: "Unstyled", value: "unstyled" },
] as const;

function SpecimenCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-graphite-800/70 p-5 shadow-card sm:p-6">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default function ButtonDesignSystemPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-10 max-w-2xl sm:mb-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-graphite-800 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-moon-300">
          <span className="size-1.5 rounded-full bg-mint-400" />
          Design system · playground
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
          Botões
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
          Uma visão lado a lado das variantes, tamanhos, ícones e estados para
          explorar a linguagem visual dos botões.
        </p>
      </header>

      <div className="grid gap-5">
        <SpecimenCard
          title="Variantes"
          description="A hierarquia visual disponível para diferentes níveis de ação."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {variants.map(({ name, value }) => (
              <div
                className="flex min-h-28 flex-col items-start justify-between gap-5 rounded-xl border border-line/70 bg-graphite-900/60 p-4"
                key={value}
              >
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                  {name}
                </span>
                <Button
                  className={
                    value === "unstyled"
                      ? "rounded-xl border border-dashed border-line px-4 py-2 text-sm text-muted hover:text-ink"
                      : undefined
                  }
                  variant={value}
                >
                  Continuar
                </Button>
              </div>
            ))}
          </div>
        </SpecimenCard>

        <SpecimenCard
          title="Arredondamento"
          description="Ajuste o formato do botão para encaixar na composição."
        >
          <div className="flex flex-wrap items-end gap-4 rounded-xl border border-line/70 bg-graphite-900/60 p-5">
            <div className="flex flex-col items-center gap-3">
              <Button rounded="full" size="sm">
                Pequeno
              </Button>
              <span className="text-[10px] text-muted">sm + full</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Button rounded="full" leadingIcon="Plus">
                Nova transação
              </Button>
              <span className="text-[10px] text-muted">default + full</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Button
                aria-label="Adicionar item"
                icon="Plus"
                rounded="full"
                size="icon"
                variant="secondary"
              />
              <span className="text-[10px] text-muted">ícone + full</span>
            </div>
          </div>
        </SpecimenCard>

        <div className="grid gap-5 lg:grid-cols-2">
          <SpecimenCard
            title="Tamanhos"
            description="Escala compacta, padrão e botão somente com ícone."
          >
            <div className="flex min-h-36 flex-wrap items-end gap-3 rounded-xl border border-line/70 bg-graphite-900/60 p-5">
              <div className="flex flex-col items-center gap-3">
                <Button size="sm">Pequeno</Button>
                <span className="text-[10px] text-muted">sm</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <Button size="default">Padrão</Button>
                <span className="text-[10px] text-muted">default</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <Button size="lg">Grande</Button>
                <span className="text-[10px] text-muted">lg</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-line/70 bg-graphite-900/60 p-5">
              <div className="flex flex-col items-center gap-3">
                <Button leadingIcon="Plus" trailingIcon="ArrowRight" size="sm">
                  Pequeno
                </Button>
                <span className="text-[10px] text-muted">sm + ícone</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <Button
                  leadingIcon="Plus"
                  trailingIcon="ArrowRight"
                  size="default"
                >
                  Padrão
                </Button>
                <span className="text-[10px] text-muted">default + ícone</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <Button leadingIcon="Plus" size="lg" trailingIcon="ArrowRight">
                  Grande
                </Button>
                <span className="text-[10px] text-muted">lg + dois ícones</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-line/70 bg-graphite-900/60 p-5">
              <div className="flex flex-col items-center gap-3">
                <Button
                  aria-label="Adicionar item"
                  icon="Plus"
                  size="icon-sm"
                />
                <span className="text-[10px] text-muted">icon-sm</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <Button aria-label="Adicionar item" icon="Plus" size="icon" />
                <span className="text-[10px] text-muted">icon</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <Button
                  aria-label="Adicionar item"
                  icon="Plus"
                  size="icon-lg"
                />
                <span className="text-[10px] text-muted">icon-lg</span>
              </div>
            </div>
          </SpecimenCard>

          <SpecimenCard
            title="Ícones e estados"
            description="Ações com ícones, foco por teclado e estado indisponível."
          >
            <div className="flex min-h-36 flex-wrap items-center gap-3 rounded-xl border border-line/70 bg-graphite-900/60 p-5">
              <Button leadingIcon="Plus">Nova transação</Button>
              <Button trailingIcon="ArrowRight" variant="outline">
                Ver detalhes
              </Button>
              <Button disabled variant="secondary">
                Indisponível
              </Button>
              <Button loading>Salvando</Button>
              <Button
                aria-label="Salvando alterações"
                icon="Plus"
                loading
                size="icon"
                variant="ghost"
              />
            </div>
            <p className="mt-3 text-[11px] leading-5 text-muted">
              Use Tab para conferir o contorno de foco.
            </p>
          </SpecimenCard>
        </div>

        <SpecimenCard
          title="Matriz de variantes"
          description="Comparação direta de cada variante no mesmo contexto."
        >
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-6 gap-3 border-b border-line px-3 pb-3 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                {variants.map(({ name, value }) => (
                  <span key={value}>{name}</span>
                ))}
              </div>
              <div className="grid grid-cols-6 items-center gap-3 px-3 py-4">
                {variants.map(({ value }) => (
                  <Button key={value} variant={value}>
                    Salvar alterações
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-6 items-center gap-3 rounded-lg bg-graphite-900/60 px-3 py-4">
                {variants.map(({ value }) => (
                  <Button disabled key={value} variant={value}>
                    Salvar alterações
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </SpecimenCard>
      </div>
      <footer className="mt-8 border-t border-line pt-5 text-[11px] text-muted">
        Rota interna de exploração · /design-system/buttons
      </footer>
    </main>
  );
}
