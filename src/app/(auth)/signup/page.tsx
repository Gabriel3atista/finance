import { Suspense } from "react";
import { AuthForm } from "@/features/auth/components/auth-form";

export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
