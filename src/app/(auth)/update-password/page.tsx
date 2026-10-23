import { AuthForm } from "@/features/auth/components/auth-form";
import { Suspense } from "react";

export default function UpdatePasswordPage() {
  return (
    <Suspense>
      <AuthForm mode="update-password" />
    </Suspense>
  );
}
