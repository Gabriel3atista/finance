"use client";

import { createClient } from "@/features/auth/lib/supabase/client";

export type Invitation = {
  id: string;
  household_id: string;
  expires_at: string;
};
export type Household = { id: string; name: string; member_role: string };

export async function fetchHouseholdPage(userId: string, email: string) {
  const supabase = createClient();
  const { data: member, error: memberError } = await supabase
    .from("household_members")
    .select("household_id, member_role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (memberError) throw memberError;

  if (member) {
    const { data: household, error } = await supabase
      .from("households")
      .select("id, name")
      .eq("id", member.household_id)
      .maybeSingle();
    if (error) throw error;
    if (!household) throw new Error("household-unavailable");
    return {
      household: { ...household, member_role: member.member_role },
      invitations: [] as Invitation[],
    };
  }

  const { data: invitations, error } = await supabase
    .from("household_invitations")
    .select("id, household_id, expires_at")
    .eq("invited_email", email.trim().toLowerCase())
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString());
  if (error) throw error;
  return { household: null, invitations: (invitations ?? []) as Invitation[] };
}
