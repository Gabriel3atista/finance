"use client";

import { createClient } from "@/features/auth/lib/supabase/client";

export type Invitation = {
  id: string;
  space_id: string;
  expires_at: string;
};
export type Space = { id: string; name: string; member_role: string };

export async function fetchSpacePage(userId: string, email: string) {
  const supabase = createClient();
  const { data: member, error: memberError } = await supabase
    .from("space_members")
    .select("space_id, member_role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (memberError) throw memberError;

  if (member) {
    const { data: space, error } = await supabase
      .from("spaces")
      .select("id, name")
      .eq("id", member.space_id)
      .maybeSingle();
    if (error) throw error;
    if (!space) throw new Error("space-unavailable");
    return {
      space: { ...space, member_role: member.member_role },
      invitations: [] as Invitation[],
    };
  }

  const { data: invitations, error } = await supabase
    .from("space_invitations")
    .select("id, space_id, expires_at")
    .eq("invited_email", email.trim().toLowerCase())
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString());
  if (error) throw error;
  return { space: null, invitations: (invitations ?? []) as Invitation[] };
}
