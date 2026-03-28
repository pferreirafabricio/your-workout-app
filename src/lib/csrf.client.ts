import { csrfTokenCookieName } from "@/lib/auth.consts";

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const encodedName = `${encodeURIComponent(name)}=`;
  const cookieParts = document.cookie.split(";");

  for (const rawPart of cookieParts) {
    const part = rawPart.trim();
    if (part.startsWith(encodedName)) {
      return decodeURIComponent(part.slice(encodedName.length));
    }
  }

  return null;
}

export function getCsrfHeaders(): HeadersInit {
  const csrfToken = getCookieValue(csrfTokenCookieName);
  return csrfToken ? { "x-csrf-token": csrfToken } : {};
}
