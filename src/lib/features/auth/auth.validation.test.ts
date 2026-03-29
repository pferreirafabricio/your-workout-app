import { describe, expect, it } from "vitest";
import { signInInputSchema, strongPasswordSchema } from "@/lib/features/auth/auth.validation";

describe("auth validation", () => {
  it("enforces strong password requirements", () => {
    expect(strongPasswordSchema.safeParse("alllowercase1!").success).toBe(false);
    expect(strongPasswordSchema.safeParse("ALLUPPERCASE1!").success).toBe(false);
    expect(strongPasswordSchema.safeParse("NoNumber!").success).toBe(false);
    expect(strongPasswordSchema.safeParse("NoSpecial1").success).toBe(false);
    expect(strongPasswordSchema.safeParse("StrongPass1!").success).toBe(true);
  });

  it("accepts valid sign-in payload", () => {
    const parsed = signInInputSchema.safeParse({
      email: "athlete@example.com",
      password: "password",
      clientSource: "web",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid sign-in payload", () => {
    const parsed = signInInputSchema.safeParse({
      email: "not-an-email",
      password: "",
    });

    expect(parsed.success).toBe(false);
  });
});
