import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AppNav } from "@/shared/components/app-nav";
import { ProfileFooter } from "@/shared/components/profile-footer";
import { ProfileMenuDrawer } from "@/shared/components/profile-menu-drawer";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import {
  AppShellHeaderSlot,
  AppShellHeaderSlotProvider,
} from "@/shared/components/app-shell-header-slot";
import {
  ValuesVisibilityProvider,
  ValuesVisibilityToggle,
} from "@/shared/components/financial-values";

export function AppShell({
  children,
  userEmail,
  userId,
  userName,
  fallbackAvatarUrl,
}: {
  children: ReactNode;
  userEmail: string;
  userId: string;
  userName: string;
  fallbackAvatarUrl: string;
}) {
  return (
    <AppShellHeaderSlotProvider>
      <ValuesVisibilityProvider>
        <div className="app-shell-root min-h-[100dvh] lg:grid lg:h-[100dvh] lg:grid-cols-[244px_minmax(0,1fr)] lg:overflow-hidden standalone-wide:!flex standalone-wide:h-[100dvh] standalone-wide:min-h-0 standalone-wide:flex-col">
          <aside className="app-shell-sidebar hidden border-r border-line bg-graphite-900 lg:flex lg:h-[100dvh] lg:min-h-0 lg:flex-col lg:overflow-y-auto standalone-wide:!hidden">
            <AppNav variant="sidebar" />
            <ProfileFooter
              userId={userId}
              userEmail={userEmail}
              userName={userName}
              fallbackAvatarUrl={fallbackAvatarUrl}
            />
          </aside>
          <div className="app-shell-content min-w-0 lg:flex lg:h-[100dvh] lg:min-h-0 lg:flex-col standalone-wide:!h-auto standalone-wide:min-h-0 standalone-wide:flex-1">
            <header className="app-shell-header sticky top-0 z-30 flex min-h-[calc(56px_+_env(safe-area-inset-top))] shrink-0 items-center justify-between bg-graphite-900/60 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl sm:px-8 lg:px-10">
              <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[env(safe-area-inset-top)] z-10 flex items-center justify-center">
                <AppShellHeaderSlot />
              </div>
              <div className="app-shell-mobile-header flex w-full items-center justify-between lg:hidden mobile-app:!flex">
                <ProfileMenuDrawer
                  userId={userId}
                  userName={userName}
                  userEmail={userEmail}
                  fallbackAvatarUrl={fallbackAvatarUrl}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Notificações"
                  title="Notificações"
                  className="size-10 rounded-full"
                  icon="BellOutline"
                />
              </div>
              <div className="app-shell-desktop-context hidden text-sm text-muted lg:block mobile-app:!hidden">
                Finanças
              </div>
              <div className="app-shell-desktop-actions hidden items-center gap-3 lg:flex mobile-app:!hidden">
                <ValuesVisibilityToggle />
                <span
                  className="hidden max-w-[220px] truncate text-sm text-muted sm:inline"
                  title={userEmail}
                >
                  {userEmail}
                </span>
                <a
                  className="hidden text-sm text-muted underline-offset-4 hover:text-ink hover:underline sm:inline"
                  href="/space"
                >
                  Espaço
                </a>
                <SignOutButton />
              </div>
            </header>
            <main className="min-w-0 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              <div className="mx-auto w-full max-w-[1440px] px-3 pb-28 pt-3 sm:px-8 sm:pt-10 lg:px-10 lg:pb-12">
                {children}
              </div>
            </main>
          </div>
          <nav
            className="app-shell-mobile-nav fixed bottom-[calc(env(safe-area-inset-bottom)+12px)] left-1/2 z-20 -translate-x-1/2 rounded-full border border-line/30 bg-graphite-500/60 p-1 shadow-[0_8px_32px_hsl(0_0%_0%/45%)] backdrop-blur-xl lg:hidden standalone-wide:!block"
            aria-label="Navegação principal"
          >
            <AppNav variant="mobile" />
          </nav>
        </div>
      </ValuesVisibilityProvider>
    </AppShellHeaderSlotProvider>
  );
}
