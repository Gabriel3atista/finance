"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/features/auth/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="focus-ring rounded-lg px-3 py-2 text-sm text-muted hover:bg-secondary-800 hover:text-ink disabled:opacity-50"
      disabled={busy}
      onClick={signOut}
      type="button"
    >
      {busy ? "Saindo…" : "Sair"}
    </button>
  );
}
