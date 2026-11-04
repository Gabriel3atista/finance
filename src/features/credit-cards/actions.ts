"use server";

import { redirect } from "next/navigation";
import { getSignedInContext } from "@/features/transactions/lib/server-context";

async function getUserContext() {
  const context = await getSignedInContext();
  if (!context) redirect("/login");
  return context;
}

export async function saveCreditCard(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const bankName = String(formData.get("bank_name") ?? "").trim();
  const lastFour = String(formData.get("last_four") ?? "").trim();
  if (
    bankName.length < 1 ||
    bankName.length > 80 ||
    !/^\d{4}$/.test(lastFour) ||
    (id && !/^[0-9a-f-]{36}$/i.test(id))
  ) {
    return { error: "invalid-card" };
  }

  const context = await getUserContext();
  if (id) {
    const { data, error } = await context.supabase
      .from("credit_cards")
      .update({ bank_name: bankName, last_four: lastFour })
      .eq("id", id)
      .eq("space_id", context.spaceId)
      .select("id")
      .maybeSingle();
    if (error || !data) return { error: "save-card" };
  } else {
    const { error } = await context.supabase.from("credit_cards").insert({
      space_id: context.spaceId,
      bank_name: bankName,
      last_four: lastFour,
      created_by: context.user.id,
    });
    if (error) return { error: "save-card" };
  }

  return { success: "saved" };
}

export async function setCreditCardActive(id: string, isActive: boolean) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "invalid-card" };
  const context = await getUserContext();
  const { data, error } = await context.supabase
    .from("credit_cards")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("space_id", context.spaceId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: "update-card" };
  return { success: "updated" };
}
