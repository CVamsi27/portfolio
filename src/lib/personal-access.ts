/** Website access policy; a verified Supabase user is required before evaluating it. */
export const PERSONAL_ALLOWED_EMAILS = [
  "cvamsik99@gmail.com",
  "srija210v@gmail.com",
] as const;

type PersonalUser = {
  email?: string;
  email_confirmed_at?: string;
  identities?: Array<{
    provider: string;
    identity_data?: Record<string, unknown>;
  }>;
};

const normalizeEmail = (email: unknown) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

export function isAllowedPersonalUser(
  user: PersonalUser | null | undefined,
): boolean {
  const email = normalizeEmail(user?.email);
  return Boolean(
    user?.email_confirmed_at &&
      PERSONAL_ALLOWED_EMAILS.some((allowed) => allowed === email) &&
      user.identities?.some(
        (identity) =>
          identity.provider === "google" &&
          identity.identity_data?.email_verified === true &&
          normalizeEmail(identity.identity_data?.email) === email,
      ),
  );
}

function hostname(host: string): string {
  try {
    return new URL(`http://${host}`).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export const isPersonalHost = (host: string) =>
  hostname(host) === "personal.buildora.work";
export function isLocalHost(host: string): boolean {
  const name = hostname(host);
  return (
    name === "localhost" ||
    name === "127.0.0.1" ||
    name === "[::1]" ||
    name.endsWith(".local")
  );
}

export function isPublicPersonalPath(path: string): boolean {
  return (
    [
      "/login",
      "/auth/callback",
      "/sw.js",
      "/manifest.webmanifest",
      "/favicon.ico",
    ].includes(path) ||
    path.startsWith("/icons/") ||
    path.startsWith("/_next/static/") ||
    path === "/_next/image"
  );
}

/** Machine endpoints authenticate independently; no user-page or sharing bypass. */
export function isMachineEndpoint(path: string): boolean {
  return [
    "/api/push/dispatch",
    "/api/telegram/dispatch",
    "/api/health-connect/pair",
    "/api/health-connect/status",
    "/api/health-connect/sync",
  ].includes(path);
}

export function safePersonalReturn(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  )
    return "/hub";
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(decoded))
      return "/hub";
    const path = new URL(value, "https://personal.buildora.work").pathname;
    if (
      path === "/login" ||
      path.startsWith("/auth/") ||
      path.startsWith("/api/")
    )
      return "/hub";
    return value;
  } catch {
    return "/hub";
  }
}
