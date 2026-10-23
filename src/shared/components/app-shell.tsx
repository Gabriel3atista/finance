import type { ReactNode } from "react";
import { AppNav } from "@/shared/components/app-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[244px_minmax(0,1fr)]">
      <aside className="hidden border-r border-line bg-white lg:flex lg:flex-col">
        <AppNav variant="sidebar" />
        <div className="mt-auto px-6 pb-7">
          <div className="rounded-2xl bg-canvas px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Finance
            </p>
            <p className="mt-2 text-sm leading-5 text-ink">
              Clareza para cuidar do que importa.
            </p>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex h-[68px] items-center justify-between border-b border-line bg-white/90 px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3 lg:hidden">
            <div
              className="grid size-9 place-items-center rounded-xl bg-accent text-white"
              aria-hidden="true"
            >
              <BrandMark />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-ink">
              Finance
            </span>
          </div>
          <div className="hidden text-sm text-muted lg:block">
            Finanças da família
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">
              Espaço compartilhado
            </span>
            <div
              className="grid size-9 place-items-center rounded-full border border-line bg-[#f0f2ed] text-xs font-semibold text-accent"
              aria-label="Núcleo familiar"
            >
              F
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-5 pb-28 pt-8 sm:px-8 sm:pt-10 lg:px-10 lg:pb-12">
          {children}
        </main>
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur lg:hidden"
        aria-label="Navegação principal"
      >
        <AppNav variant="mobile" />
      </nav>
    </div>
  );
}

function BrandMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[19px]"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 17.5 10 12l3.2 3.1L19 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 8H19v4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
