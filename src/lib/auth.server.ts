import crypto from "node:crypto";
import { redirect } from "@tanstack/react-router";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { sessionCookieName } from "./auth.consts";
import { getServerSidePrismaClient } from "./db.server";
import { signInInputSchema } from "@/lib/validation/workout-progression";
import { z } from "zod";

function scryptAsync(password: string, salt: string, keylen: number, options: crypto.ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(derivedKey as Buffer);
    });
  });
}

// In production, use a proper secret from environment variables
const COOKIE_SECRET = process.env.COOKIE_SECRET || "dev-secret-change-in-production";
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LEN = 64;

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, SCRYPT_KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return ["scrypt", SCRYPT_N, SCRYPT_R, SCRYPT_P, salt, derived.toString("hex")].join("$");
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [algo, nStr, rStr, pStr, salt, expectedHex] = encodedHash.split("$");
  if (algo !== "scrypt" || !nStr || !rStr || !pStr || !salt || !expectedHex) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");
  const derived = await scryptAsync(password, salt, expected.length, {
    N: Number(nStr),
    r: Number(rStr),
    p: Number(pStr),
  });

  if (expected.length !== derived.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, derived);
}

export function getEmailFingerprint(email: string): string {
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function getClientSource(clientSource?: string): string {
  return clientSource?.trim() || "unknown";
}

export function isWithinLockoutWindow(windowStartedAt: Date | null | undefined, now = new Date()): boolean {
  if (!windowStartedAt) {
    return false;
  }
  return now.getTime() - windowStartedAt.getTime() <= LOCKOUT_WINDOW_MS;
}

/**
 * Signs a user ID to create a tamper-proof session token
 */
function signUserId(userId: string): string {
  const signature = crypto.createHmac("sha256", COOKIE_SECRET).update(userId).digest("hex");
  return `${userId}.${signature}`;
}

/**
 * Verifies a signed session token and returns the user ID if valid
 */
function verifySessionToken(token: string): string | null {
  const [userId, signature] = token.split(".");
  if (!userId || !signature) return null;

  const expectedSignature = crypto.createHmac("sha256", COOKIE_SECRET).update(userId).digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const providedBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== providedBuffer.length) return null;
  if (!crypto.timingSafeEqual(expectedBuffer, providedBuffer)) return null;

  return userId;
}

/**
 * Sets the session cookie for a user (internal use only)
 */
function setSessionCookie(userId: string) {
  const token = signUserId(userId);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  setCookie(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
  });
}

/**
 * Gets the current user from session cookie
 * @returns User object or null if not logged in
 */
export const getUserServerFn = createServerFn().handler(async () => {
  const sessionToken = getCookie(sessionCookieName);
  if (!sessionToken) {
    return null;
  }

  const userId = verifySessionToken(sessionToken);
  if (!userId) {
    return null;
  }

  const prisma = await getServerSidePrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user;
});

/**
 * Signs in a user with email and password
 */
export const signInServerFn = createServerFn({ method: "POST" })
  .inputValidator(signInInputSchema)
  .handler(async ({ data }) => {
    const { email, password } = data;
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();
    const clientSource = getClientSource(data.clientSource);
    const emailFingerprint = getEmailFingerprint(normalizedEmail);

    const prisma = await getServerSidePrismaClient();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const existingLockoutEvent = await prisma.authLockoutEvent.findUnique({
      where: {
        emailFingerprint_clientSource: {
          emailFingerprint,
          clientSource,
        },
      },
    });

    const userLockedOut = user?.lockedOutUntil && user.lockedOutUntil.getTime() > now.getTime();
    const eventLockedOut = existingLockoutEvent?.lockedUntil && existingLockoutEvent.lockedUntil.getTime() > now.getTime();

    if (userLockedOut || eventLockedOut) {
      const lockedUntil = user?.lockedOutUntil && user.lockedOutUntil.getTime() > now.getTime()
        ? user.lockedOutUntil
        : existingLockoutEvent?.lockedUntil;
      const retryAfterSeconds = lockedUntil ? Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000) : 0;
      return { success: false as const, error: "LOCKED_OUT", retryAfterSeconds };
    }

    const passwordIsValid = user ? await verifyPassword(password, user.passwordHash) : false;

    if (!user || !passwordIsValid) {
      const windowStart = existingLockoutEvent?.windowStartedAt ?? now;
      const isNewWindow = now.getTime() - windowStart.getTime() > LOCKOUT_WINDOW_MS;
      const failedAttempts = isNewWindow ? 1 : (existingLockoutEvent?.failedAttempts ?? 0) + 1;
      const nextWindowStart = isNewWindow ? now : windowStart;
      const lockoutUntil =
        failedAttempts >= LOCKOUT_ATTEMPTS ? new Date(now.getTime() + LOCKOUT_DURATION_MS) : null;

      await prisma.authLockoutEvent.upsert({
        where: {
          emailFingerprint_clientSource: {
            emailFingerprint,
            clientSource,
          },
        },
        create: {
          userId: user?.id,
          emailFingerprint,
          clientSource,
          failedAttempts,
          windowStartedAt: nextWindowStart,
          lockedUntil: lockoutUntil,
        },
        update: {
          userId: user?.id,
          failedAttempts,
          windowStartedAt: nextWindowStart,
          lockedUntil: lockoutUntil,
        },
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedSignInAttempts: failedAttempts,
            failedSignInWindowAt: nextWindowStart,
            lockedOutUntil: lockoutUntil,
          },
        });
      }

      if (lockoutUntil) {
        return {
          success: false as const,
          error: "LOCKED_OUT",
          retryAfterSeconds: Math.ceil((lockoutUntil.getTime() - now.getTime()) / 1000),
        };
      }

      return { success: false as const, error: "INVALID_CREDENTIALS" };
    }

    await prisma.authLockoutEvent.deleteMany({
      where: {
        emailFingerprint,
        clientSource,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedSignInAttempts: 0,
        failedSignInWindowAt: null,
        lockedOutUntil: null,
      },
    });

    setSessionCookie(user.id);

    return { success: true as const };
  });

/**
 * Creates a new user account
 */
export const createAccountServerFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      name: z.string().trim().min(1).max(120),
      password: z.string().min(8).max(256),
    }),
  )
  .handler(async ({ data }: { data: { email: string; name: string; password: string } }) => {
    const { email, name, password } = data;
    const normalizedEmail = email.trim().toLowerCase();

    const prisma = await getServerSidePrismaClient();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return { success: false as const, error: "An account with this email already exists" };
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email: normalizedEmail, name, passwordHash },
    });

    setSessionCookie(user.id);

    return { success: true as const };
  });

/**
 * Logs out the current user
 */
export const logoutServerFn = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(sessionCookieName);
  return { success: true };
});

/**
 * Authentication middleware that ensures user is logged in
 * @throws Redirects to sign-in page if not authenticated
 */
export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const user = await getUserServerFn();
  if (!user) {
    throw redirect({ to: "/sign-in" });
  }

  return next({
    context: { user },
  });
});
