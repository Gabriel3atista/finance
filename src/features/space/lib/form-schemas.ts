import { z } from "zod";

export const createSpaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do espaço.")
    .max(100, "Use até 100 caracteres."),
});

export const invitationEmailSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
});
