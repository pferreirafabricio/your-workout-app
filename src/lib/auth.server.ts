import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "@tanstack/react-router";
import {
  deleteCookie,
  getCookie,
  getRequestHeader,
  getRequestUrl,
  setCookie,
} from "@tanstack/react-start/server";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import {
  accessTokenCookieName,
  csrfTokenCookieName,
  refreshTokenCookieName,
} from "./auth.consts";
import { getServerSidePrismaClient } from "./db.server";
import {
  signInInputSchema,
  strongPasswordSchema,
} from "@/lib/validation/workout-progression";
import { z } from "zod";

// In production, use a proper secret from environment variables
const COOKIE_SECRET = process.env.COOKIE_SECRET || "dev-secret-change-in-production";
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CSRF_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_MS;
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
import { DEFAULT_REST_TARGET_SECONDS } from "./types";
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  return bcrypt.compare(password, encodedHash);
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

type TokenPayload = {
  typ: "access" | "refresh";
  sub: string;
  iat: number;
  exp: number;
};

function encodeTokenPayload(payload: TokenPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeTokenPayload(rawPayload: string): TokenPayload | null {
  try {
    const decoded = Buffer.from(rawPayload, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<TokenPayload>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    if (
      (parsed.typ !== "access" && parsed.typ !== "refresh") ||
      typeof parsed.sub !== "string" ||
      typeof parsed.iat !== "number" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }

    return {
      typ: parsed.typ,
      sub: parsed.sub,
      iat: parsed.iat,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

function signToken(payload: TokenPayload): string {
  const rawPayload = encodeTokenPayload(payload);
  const signature = crypto
    .createHmac("sha256", COOKIE_SECRET)
    .update(rawPayload)
    .digest("base64url");
  return `${rawPayload}.${signature}`;
}

function verifyToken(token: string, expectedType: TokenPayload["typ"]): TokenPayload | null {
  const [rawPayload, providedSignature] = token.split(".");
  if (!rawPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", COOKIE_SECRET)
    .update(rawPayload)
    .digest("base64url");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(providedSignature, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    return null;
  }

  const payload = decodeTokenPayload(rawPayload);
  if (!payload || payload.typ !== expectedType) {
    return null;
  }
  if (payload.exp <= Date.now()) {
    return null;
  }

  return payload;
}

function issueAccessToken(userId: string): { token: string; expiresAt: Date } {
  const now = Date.now();
  const expiresAt = new Date(now + ACCESS_TOKEN_TTL_MS);
  const token = signToken({
    typ: "access",
    sub: userId,
    iat: now,
    exp: expiresAt.getTime(),
  });
  return { token, expiresAt };
}

function issueRefreshToken(userId: string): { token: string; expiresAt: Date } {
  const now = Date.now();
  const expiresAt = new Date(now + REFRESH_TOKEN_TTL_MS);
  const token = signToken({
    typ: "refresh",
    sub: userId,
    iat: now,
    exp: expiresAt.getTime(),
  });
  return { token, expiresAt };
}

function issueCsrfToken(): { token: string; expiresAt: Date } {
  return {
    token: crypto.randomBytes(32).toString("base64url"),
    expiresAt: new Date(Date.now() + CSRF_TOKEN_TTL_MS),
  };
}

function setAuthCookies(userId: string) {
  const access = issueAccessToken(userId);
  const refresh = issueRefreshToken(userId);
  const csrf = issueCsrfToken();

  setCookie(accessTokenCookieName, access.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: access.expiresAt,
    path: "/",
  });

  setCookie(refreshTokenCookieName, refresh.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: refresh.expiresAt,
    path: "/",
  });

  setCookie(csrfTokenCookieName, csrf.token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: csrf.expiresAt,
    path: "/",
  });
}

function ensureCsrfCookie() {
  const currentToken = getCookie(csrfTokenCookieName);
  if (currentToken) {
    return;
  }

  const csrf = issueCsrfToken();
  setCookie(csrfTokenCookieName, csrf.token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: csrf.expiresAt,
    path: "/",
  });
}

function clearAuthCookies() {
  deleteCookie(accessTokenCookieName, { path: "/" });
  deleteCookie(refreshTokenCookieName, { path: "/" });
  deleteCookie(csrfTokenCookieName, { path: "/" });
}

function isTrustedOrigin(): boolean {
  const requestUrl = getRequestUrl({
    xForwardedHost: true,
    xForwardedProto: true,
  });
  const expectedOrigin = requestUrl.origin;
  const origin = getRequestHeader("origin");

  if (origin) {
    return origin === expectedOrigin;
  }

  const referer = getRequestHeader("referer");
  if (!referer) {
    return false;
  }

  try {
    return new URL(referer).origin === expectedOrigin;
  } catch {
    return false;
  }
}

function hasValidCsrfToken(): boolean {
  const cookieToken = getCookie(csrfTokenCookieName);
  const headerToken = getRequestHeader("x-csrf-token");

  if (!cookieToken || !headerToken) {
    return false;
  }

  const cookieTokenBuffer = Buffer.from(cookieToken, "utf8");
  const headerTokenBuffer = Buffer.from(headerToken, "utf8");

  if (cookieTokenBuffer.length !== headerTokenBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(cookieTokenBuffer, headerTokenBuffer);
}

export const csrfProtectionMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  if (!isTrustedOrigin() || !hasValidCsrfToken()) {
    throw new Response("Forbidden", { status: 403 });
  }

  return next();
});

/**
 * Gets the current user from session cookie
 * @returns User object or null if not logged in
 */
export const getUserServerFn = createServerFn().handler(async () => {
  const prisma = await getServerSidePrismaClient();

  const accessToken = getCookie(accessTokenCookieName);
  const accessPayload = accessToken ? verifyToken(accessToken, "access") : null;

  if (accessPayload) {
    const user = await prisma.user.findUnique({
      where: { id: accessPayload.sub },
    });
    if (!user) {
      clearAuthCookies();
      ensureCsrfCookie();
      return null;
    }

    ensureCsrfCookie();
    return user;
  }

  const refreshToken = getCookie(refreshTokenCookieName);
  const refreshPayload = refreshToken ? verifyToken(refreshToken, "refresh") : null;
  if (!refreshPayload) {
    ensureCsrfCookie();
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: refreshPayload.sub },
  });

  if (!user) {
    clearAuthCookies();
    ensureCsrfCookie();
    return null;
  }

  // Rotate short-lived access + refresh tokens after refresh validation.
  setAuthCookies(user.id);

  ensureCsrfCookie();
  return user;
});

/**
 * Signs in a user with email and password
 */
export const signInServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware])
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

    setAuthCookies(user.id);

    return { success: true as const };
  });

/**
 * Creates a new user account
 */
export const createAccountServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware])
  .inputValidator(
    z.object({
      email: z.email(),
      name: z.string().trim().min(1).max(120),
      password: strongPasswordSchema,
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
      data: {
        email: normalizedEmail,
        name,
        passwordHash,
        preference: {
          create: {
            weightUnit: "KG",
            defaultRestTargetSeconds: DEFAULT_REST_TARGET_SECONDS,
          },
        },
      },
    });

    setAuthCookies(user.id);

    return { success: true as const };
  });

/**
 * Logs out the current user
 */
export const logoutServerFn = createServerFn({ method: "POST" })
  .middleware([csrfProtectionMiddleware])
  .handler(async () => {
    clearAuthCookies();
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
