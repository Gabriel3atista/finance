import { z } from "zod";

export type AuthFormMode = "login" | "signup" | "forgot" | "update-password";

export function createAuthFormSchema(mode: AuthFormMode) {
  return z
    .object({
      email: z.string(),
      password: z.string(),
    })
    .superRefine((values, context) => {
      if (mode !== "update-password" && mode !== "forgot") {
        if (!z.email().safeParse(values.email.trim()).success) {
          context.addIssue({
            code: "custom",
            path: ["email"],
            message: "Informe um e-mail válido.",
          });
        }
      }

      if (mode !== "forgot" && values.password.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["password"],
          message: "Informe sua senha.",
        });
      } else if (
        (mode === "signup" || mode === "update-password") &&
        values.password.length < 8
      ) {
        context.addIssue({
          code: "custom",
          path: ["password"],
          message: "Use uma senha com pelo menos 8 caracteres.",
        });
      }
    });
}
