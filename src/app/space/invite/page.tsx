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
        <div className="flex h-[100dvh] flex-col overflow-hidden bg-graphite-900">
          <AppShellHeader
            userEmail={user.email ?? ""}
            userId={user.id}
            userName={userName}
            fallbackAvatarUrl={fallbackAvatarUrl}
          />
          <main className="flex min-h-0 flex-1 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8">
            <InvitationPanel userId={user.id} email={user.email ?? ""} />
          </main>
        </div>
      </ValuesVisibilityProvider>
    </AppShellHeaderSlotProvider>
  );
}
