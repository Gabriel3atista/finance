"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/features/auth/lib/supabase/server";

export async function createHousehold(
  _previousState: { error: string },
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1 || name.length > 100) {
    return { error: "Informe um nome de até 100 caracteres." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  const { error } = await supabase.from("households").insert({
    name,
    created_by: user.id,
  });

  if (error)
    return {
      error: "Não foi possível criar o núcleo familiar. Tente novamente.",
    };
  redirect("/household?created=1");
}

export async function acceptHouseholdInvitation(invitationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user?.email) redirect("/login");

  const { data: invitation, error: invitationError } = await supabase
    .from("household_invitations")
    .select("household_id")
    .eq("id", invitationId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (invitationError || !invitation) {
    redirect("/household?error=invitation-unavailable");
  }

  const { error } = await supabase.from("household_members").insert({
    household_id: invitation.household_id,
    user_id: user.id,
    member_role: "member",
  });

  if (error) redirect("/household?error=invitation-unavailable");
  redirect("/dashboard");
}
