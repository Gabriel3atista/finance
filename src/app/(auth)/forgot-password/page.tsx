import { AuthForm } from "@/features/auth/components/auth-form";
import { Suspense } from "react";

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <AuthForm mode="forgot" />
    </Suspense>
  );
}
