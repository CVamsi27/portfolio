import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server.js";

/** One client per request; copy refresh/exchange cookies to every response branch. */
export function createRequestAuth(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pending = new Map<
    string,
    { name: string; value: string; options: CookieOptions }
  >();
  const client =
    url && key
      ? createServerClient(url, key, {
          global: {
            fetch: (input, init) =>
              fetch(input, {
                ...init,
                cache: "no-store",
                signal: AbortSignal.timeout(5000),
              }),
          },
          cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: (cookies) => {
              for (const cookie of cookies) {
                request.cookies.set(cookie.name, cookie.value);
                pending.set(cookie.name, cookie);
              }
            },
          },
        })
      : null;

  function finish(response: NextResponse) {
    for (const cookie of pending.values())
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  async function getUser(allowBearer = false) {
    if (!client) return null;
    const authorization = allowBearer
      ? request.headers.get("authorization")
      : null;
    if (
      authorization &&
      (!/^Bearer \S+$/i.test(authorization) || authorization.length > 8192)
    )
      return null;
    try {
      // Remote validation is mandatory; cookie/JWT user payloads are untrusted.
      const { data, error } = authorization
        ? await client.auth.getUser(authorization.slice(7))
        : await client.auth.getUser();
      return error ? null : data.user;
    } catch {
      return null;
    }
  }

  function clearSession() {
    for (const cookie of request.cookies.getAll()) {
      if (/^sb-.*-auth-token(?:\.\d+)?$/.test(cookie.name)) {
        pending.set(cookie.name, {
          name: cookie.name,
          value: "",
          options: { path: "/", maxAge: 0 },
        });
      }
    }
  }

  return { client, finish, getUser, clearSession };
}
