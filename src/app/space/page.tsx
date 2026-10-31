import { redirect } from "next/navigation";
import { SpacePanel } from "@/features/space/components/space-panel";
import { createClient } from "@/features/auth/lib/supabase/server";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { ProfileMenuDrawer } from "@/shared/components/profile-menu-drawer";

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
    <main className="min-h-screen bg-graphite-900 px-5 py-10 sm:px-8">
      <div className="mx-auto mb-7 flex max-w-[920px] items-center justify-between">
        <span className="text-sm font-semibold text-ink">Finance</span>
        <div className="flex items-center gap-3">
          <ProfileMenuDrawer
            userId={user.id}
            userName={userName}
            userEmail={user.email ?? ""}
            fallbackAvatarUrl={fallbackAvatarUrl}
          />
          <SignOutButton />
        </div>
      </div>
      <div className="mx-auto mb-8 max-w-[920px]">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Organize seu espaço financeiro
        </h1>
        <p className="mt-2 text-sm text-muted">
          Seus dados ficam disponíveis para você e para as pessoas que convidar.
        </p>
      </div>
      <div className="mx-auto max-w-[920px]">
        <SpacePanel userId={user.id} email={user.email ?? ""} />
      </div>
    </main>
  );
}
