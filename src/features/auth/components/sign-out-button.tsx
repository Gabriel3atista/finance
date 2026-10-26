"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/features/auth/lib/supabase/client";

export function SignOutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      className={`text-muted ${className}`}
      disabled={busy}
      onClick={signOut}
      size="sm"
      type="button"
      variant="ghost"
    >
      {busy ? "Saindo…" : "Sair"}
    </Button>
  );
}
