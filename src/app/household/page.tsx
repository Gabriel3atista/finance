import { redirect } from "next/navigation";
import { HouseholdPanel } from "@/features/household/components/household-panel";
import { createClient } from "@/features/auth/lib/supabase/server";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

export default async function HouseholdPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("household_members")
    .select("household_id, member_role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (member) {
    const { data: household } = await supabase
      .from("households")
      .select("id, name")
      .eq("id", member.household_id)
      .maybeSingle();

    if (!household) redirect("/household?error=household-unavailable");

    return (
      <main className="min-h-screen bg-background-900 px-5 py-10 sm:px-8">
        <div className="mx-auto mb-7 flex max-w-[640px] items-center justify-between">
          <span className="text-sm font-semibold text-ink">Finance</span>
          <SignOutButton />
        </div>
        <HouseholdPanel
          household={{ ...household, member_role: member.member_role }}
          invitations={[]}
          invitationError=""
        />
      </main>
    );
  }

  const { data: invitations } = await supabase
    .from("household_invitations")
    .select("id, household_id, expires_at")
    .eq("invited_email", (user.email ?? "").trim().toLowerCase())
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString());

  return (
    <main className="min-h-screen bg-background-900 px-5 py-10 sm:px-8">
      <div className="mx-auto mb-7 flex max-w-[920px] items-center justify-between">
        <span className="text-sm font-semibold text-ink">Finance</span>
        <SignOutButton />
      </div>
      <div className="mx-auto mb-8 max-w-[920px]">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Organize o espaço da família
        </h1>
        <p className="mt-2 text-sm text-muted">
          Os dados financeiros só ficam disponíveis para integrantes confirmados
          do núcleo.
        </p>
      </div>
      <div className="mx-auto max-w-[920px]">
        <HouseholdPanel
          household={null}
          invitations={invitations ?? []}
          invitationError="Quando alguém convidar seu e-mail, o convite aparecerá aqui."
        />
      </div>
    </main>
  );
}
