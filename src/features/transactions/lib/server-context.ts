import { createClient } from "@/features/auth/lib/supabase/server";

export async function getSignedInContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("space_members")
    .select("space_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!member) return null;
  return { supabase, user, spaceId: member.space_id };
}
