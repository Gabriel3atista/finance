import type { ReactNode } from "react";
import { AppNav } from "@/shared/components/app-nav";
import { ProfileFooter } from "@/shared/components/profile-footer";
import { AppShellHeader } from "@/shared/components/app-shell-header";
import { AppShellHeaderSlotProvider } from "@/shared/components/app-shell-header-slot";
import { ValuesVisibilityProvider } from "@/shared/components/financial-values";
import {
  WorkspaceContextProvider,
  type WorkspaceContextValue,
} from "@/shared/components/workspace-context";

export function AppShell({
  children,
  userEmail,
  userId,
  userName,
  fallbackAvatarUrl,
  spaceId,
  dashboardGreeting,
}: {
  children: ReactNode;
  userEmail: string;
  userId: string;
  userName: string;
  fallbackAvatarUrl: string;
  spaceId: string;
  dashboardGreeting: WorkspaceContextValue["dashboardGreeting"];
}) {
  return (
    <AppShellHeaderSlotProvider>
      <ValuesVisibilityProvider>
        <WorkspaceContextProvider
          value={{ userId, spaceId, dashboardGreeting }}
        >
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
              <AppShellHeader
                userEmail={userEmail}
                userId={userId}
                userName={userName}
                fallbackAvatarUrl={fallbackAvatarUrl}
              />
              <main className="min-w-0 scroll-pt-[var(--app-sticky-content-top)] lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                <div className="mx-auto w-full max-w-[1440px] px-3 pb-28 pt-3 sm:px-8 sm:pt-10 lg:px-10 lg:pb-12">
                  {children}
                </div>
              </main>
            </div>
            <nav
              className="app-shell-mobile-nav fixed bottom-[calc(env(safe-area-inset-bottom)+12px)] left-1/2 z-20 -translate-x-1/2 rounded-full border border-line/70 bg-graphite-500/60 p-1 shadow-md backdrop-blur-xl lg:hidden standalone-wide:!block"
              aria-label="Navegação principal"
            >
              <AppNav variant="mobile" />
            </nav>
          </div>
        </WorkspaceContextProvider>
      </ValuesVisibilityProvider>
    </AppShellHeaderSlotProvider>
  );
}
