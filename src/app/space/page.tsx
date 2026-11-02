import { redirect } from "next/navigation";
import { SpacePanel } from "@/features/space/components/space-panel";
import { createClient } from "@/features/auth/lib/supabase/server";
import { AppShellHeader } from "@/shared/components/app-shell-header";
import { AppShellHeaderSlotProvider } from "@/shared/components/app-shell-header-slot";
import { ValuesVisibilityProvider } from "@/shared/components/financial-values";

export default async function SpacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const metadata = user.user_metadata ?? {};
  const userName =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    user.email?.split("@")[0] ||
    "Usuário";
  const fallbackAvatarUrl =
    (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
    (typeof metadata.picture === "string" && metadata.picture) ||
    "";

  return (
    <AppShellHeaderSlotProvider>
      <ValuesVisibilityProvider>
        <div className="min-h-[100dvh] bg-graphite-900">
          <AppShellHeader
            userEmail={user.email ?? ""}
            userId={user.id}
            userName={userName}
            fallbackAvatarUrl={fallbackAvatarUrl}
          />
          <main className="px-3 pb-10 pt-6 sm:px-8 sm:py-10">
            <div className="mx-auto mb-6 max-w-[920px]">
              <h1 className="text-[28px] font-semibold tracking-[-0.04em] text-ink sm:text-[34px]">
                Organize seu espaço financeiro
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                Seus dados ficam disponíveis para você e para as pessoas que
                convidar.
              </p>
            </div>
            <div className="mx-auto max-w-[920px]">
              <SpacePanel userId={user.id} email={user.email ?? ""} />
            </div>
          </main>
        </div>
      </ValuesVisibilityProvider>
    </AppShellHeaderSlotProvider>
  );
}
