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
  return <AppShell userEmail={user.email ?? ""}>{children}</AppShell>;
}
