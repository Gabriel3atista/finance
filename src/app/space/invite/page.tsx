import { redirect } from "next/navigation";
import { createClient } from "@/features/auth/lib/supabase/server";
import { InvitationPanel } from "@/features/space/components/invitation-panel";
import { AppShellHeader } from "@/shared/components/app-shell-header";
import { AppShellHeaderSlotProvider } from "@/shared/components/app-shell-header-slot";
import { ValuesVisibilityProvider } from "@/shared/components/financial-values";

export default async function SpaceInvitationPage() {
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
                Convide alguém para seu espaço
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                Gere um link individual para compartilhar o acesso às finanças.
              </p>
            </div>
            <div className="mx-auto max-w-[920px]">
              <InvitationPanel userId={user.id} email={user.email ?? ""} />
            </div>
          </main>
        </div>
      </ValuesVisibilityProvider>
    </AppShellHeaderSlotProvider>
  );
}
