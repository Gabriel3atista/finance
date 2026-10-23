import { Suspense } from "react";
import { AuthForm } from "@/features/auth/components/auth-form";

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
