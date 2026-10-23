import type { ReactNode } from "react";
import { AppNav } from "@/shared/components/app-nav";
import { Eyebrow } from "@/shared/components/eyebrow";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import {
  ValuesVisibilityProvider,
  ValuesVisibilityToggle,
} from "@/shared/components/financial-values";

export function AppShell({
  children,
  userEmail,
}: {
  children: ReactNode;
  userEmail: string;
}) {
  return (
    <ValuesVisibilityProvider>
      <div className="min-h-[100dvh] lg:grid lg:h-[100dvh] lg:grid-cols-[244px_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="hidden border-r border-line bg-secondary-900 lg:flex lg:h-[100dvh] lg:min-h-0 lg:flex-col lg:overflow-y-auto">
          <AppNav variant="sidebar" />
          <div className="mt-auto px-6 pb-7">
            <div className="rounded-2xl bg-canvas px-4 py-4">
              <Eyebrow>Finance</Eyebrow>
              <p className="mt-2 text-sm leading-5 text-ink">
                Clareza para cuidar do que importa.
              </p>
            </div>
          </div>
        </aside>
        <div className="min-w-0 lg:flex lg:h-[100dvh] lg:min-h-0 lg:flex-col">
          <header className="flex min-h-[68px] shrink-0 items-center justify-between border-b border-line bg-secondary-900/90 px-5 pt-[env(safe-area-inset-top)] sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 lg:hidden">
              <div
                className="grid size-9 place-items-center rounded-xl bg-moon-200 text-background-900"
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
              <ValuesVisibilityToggle />
              <span
                className="hidden max-w-[220px] truncate text-sm text-muted sm:inline"
                title={userEmail}
              >
                {userEmail}
              </span>
              <a
                className="hidden text-sm text-muted underline-offset-4 hover:text-ink hover:underline sm:inline"
                href="/household"
              >
                Família
              </a>
              <SignOutButton />
            </div>
          </header>
          <main className="min-w-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <div className="mx-auto w-full max-w-[1440px] px-5 pb-28 pt-8 sm:px-8 sm:pt-10 lg:px-10 lg:pb-12">
              {children}
            </div>
          </main>
        </div>
        <nav
          className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-secondary-900/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur lg:hidden"
          aria-label="Navegação principal"
        >
          <AppNav variant="mobile" />
        </nav>
      </div>
    </ValuesVisibilityProvider>
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
