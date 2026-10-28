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

  return (
    <main className="min-h-screen bg-graphite-900 px-5 py-10 sm:px-8">
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
        <HouseholdPanel userId={user.id} email={user.email ?? ""} />
      </div>
    </main>
  );
}
