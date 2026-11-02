import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { ProfileMenuDrawer } from "@/shared/components/profile-menu-drawer";
import { AppShellHeaderSlot } from "@/shared/components/app-shell-header-slot";
import { ValuesVisibilityToggle } from "@/shared/components/financial-values";

export function AppShellHeader({
  userEmail,
  userId,
  userName,
  fallbackAvatarUrl,
}: {
  userEmail: string;
  userId: string;
  userName: string;
  fallbackAvatarUrl: string;
}) {
  return (
    <header className="app-shell-header sticky top-0 z-30 flex min-h-[var(--app-header-height)] shrink-0 items-center justify-between bg-graphite-900/60 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl standalone:!min-h-[calc(var(--app-header-height)_+_16px)] standalone:!pt-[calc(env(safe-area-inset-top)_+_16px)] standalone-wide:!bg-graphite-900 standalone-wide:!backdrop-blur-none sm:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[env(safe-area-inset-top)] z-10 flex items-center justify-center standalone:!top-[calc(env(safe-area-inset-top)_+_16px)]">
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
        <ProfileMenuDrawer
          userId={userId}
          userName={userName}
          userEmail={userEmail}
          fallbackAvatarUrl={fallbackAvatarUrl}
        />
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
  );
}
