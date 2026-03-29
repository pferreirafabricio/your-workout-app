import { z } from "zod";

export const authMutationErrorMessages = {
  validationError: "Please fix the highlighted fields and try again.",
  lockout: "Too many failed sign-in attempts. Please wait before trying again.",
} as const;

export const strongPasswordSchema = z
  .string()
  .min(8)
  .max(256)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,256}$/, {
    message:
      "Password must include uppercase, lowercase, number, and special character.",
  });

export const signInInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  clientSource: z.string().min(1).max(200).optional(),
});
