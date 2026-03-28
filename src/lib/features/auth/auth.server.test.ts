import { describe, expect, it } from "vitest";
import {
  getEmailFingerprint,
  hashPassword,
  isWithinLockoutWindow,
  verifyPassword,
} from "@/lib/features/auth/auth.server";
import { strongPasswordSchema } from "@/lib/features/workouts/workout-progression";

describe("auth security helpers", () => {
  it("hashes and verifies a password", async () => {
    const encoded = await hashPassword("SuperStrongPass123");
    expect(encoded.startsWith("$2")).toBe(true);

    await expect(verifyPassword("SuperStrongPass123", encoded)).resolves.toBe(true);
    await expect(verifyPassword("WrongPassword", encoded)).resolves.toBe(false);
  });

  it("enforces strong password requirements", () => {
    expect(strongPasswordSchema.safeParse("alllowercase1!").success).toBe(false);
    expect(strongPasswordSchema.safeParse("ALLUPPERCASE1!").success).toBe(false);
    expect(strongPasswordSchema.safeParse("NoNumber!").success).toBe(false);
    expect(strongPasswordSchema.safeParse("NoSpecial1").success).toBe(false);
    expect(strongPasswordSchema.safeParse("StrongPass1!").success).toBe(true);
  });

  it("calculates deterministic email fingerprint", () => {
    const a = getEmailFingerprint("USER@example.com");
    const b = getEmailFingerprint("user@example.com");
    expect(a).toBe(b);
  });

  it("enforces lockout rolling window", () => {
    const now = new Date("2026-03-28T12:00:00.000Z");
    const insideWindow = new Date("2026-03-28T11:50:30.000Z");
    const outsideWindow = new Date("2026-03-28T11:30:00.000Z");

    expect(isWithinLockoutWindow(insideWindow, now)).toBe(true);
    expect(isWithinLockoutWindow(outsideWindow, now)).toBe(false);
    expect(isWithinLockoutWindow(null, now)).toBe(false);
  });
});
