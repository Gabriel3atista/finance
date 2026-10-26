import { AppShell } from "@/shared/components/app-shell";
import { redirect } from "next/navigation";
import { createClient } from "@/features/auth/lib/supabase/server";

export default async function WorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!member) redirect("/household");

  const metadata = user.user_metadata ?? {};
  const userName =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    user.email?.split("@")[0] ||
    "Usuário";
  const userAvatarUrl =
    (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
    (typeof metadata.picture === "string" && metadata.picture) ||
    "";

  return (
    <AppShell
      userEmail={user.email ?? ""}
      userId={user.id}
      userName={userName}
      fallbackAvatarUrl={userAvatarUrl}
    >
      {children}
    </AppShell>
  );
}
