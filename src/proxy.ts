import { NextResponse } from "next/server.js";
import type { NextRequest } from "next/server.js";
import {
  isAllowedPersonalUser,
  isLocalHost,
  isMachineEndpoint,
  isPersonalHost,
  isPublicPersonalPath,
} from "./lib/personal-access.ts";
import { createRequestAuth } from "./lib/supabase/request.ts";

/**
 * Host-based routing for the three domains on one Vercel project.
 * Next 16 renamed the `middleware` file convention to `proxy` — same
 * runtime, same signature, new name.
 *
 * - buildora.work / portfolio.buildora.work → portfolio resume ONLY.
 *   Every non-root path (incl. /login, /trackers, /goal, …) redirects to `/`.
 *   Only `/api/*` (contact form), `/work/*` (project case studies) and the
 *   SEO documents are exempt.
 * - personal.buildora.work → allowlisted Google sessions only; `/` rewrites
 *   to the tracker entry after server validation. Login/bootstrap stay public.
 * - Personal APIs are protected on every deployed host; machine endpoints
 *   retain their independent credential checks.
 * - Localhost is unrestricted for development.
 */
export default async function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const url = req.nextUrl.clone();
  const personalHost = isPersonalHost(host);
  const isLocal = isLocalHost(host);
  // Public case studies are portfolio content: on localhost they keep the
  // portfolio surface, on deployed hosts they are exempt from the redirect.
  const isPortfolioCase = url.pathname.startsWith("/work/");
  const isLocalTrackerPath =
    isLocal &&
    url.pathname !== "/" &&
    !url.pathname.startsWith("/api/") &&
    !isPortfolioCase;
  const isTrackerSurface = personalHost || isLocalTrackerPath;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.delete("x-product-surface");
  if (isTrackerSurface) requestHeaders.set("x-product-surface", "tracker");

  const isApi = url.pathname.startsWith("/api/");
  const protectedApi =
    isApi &&
    url.pathname !== "/api/contact" &&
    !isMachineEndpoint(url.pathname);
  const protectedPage =
    personalHost && !isApi && !isPublicPersonalPath(url.pathname);
  const auth =
    !isLocal && (protectedApi || protectedPage) ? createRequestAuth(req) : null;
  if (auth) {
    const user = await auth.getUser(isApi);
    // Refresh cookies must also be forwarded to the downstream request.
    if (req.headers.get("cookie"))
      requestHeaders.set("cookie", req.headers.get("cookie")!);
    if (!isAllowedPersonalUser(user)) {
      if (isApi) {
        return auth.finish(
          NextResponse.json(
            {
              error: !auth.client
                ? "Access is not configured."
                : user
                  ? "Access denied."
                  : "Authentication required.",
            },
            { status: !auth.client ? 503 : user ? 403 : 401 },
          ),
        );
      }
      const login = req.nextUrl.clone();
      login.pathname = "/login";
      login.search = "";
      login.searchParams.set("next", url.pathname + url.search);
      if (user) login.searchParams.set("error", "access-denied");
      return auth.finish(NextResponse.redirect(login));
    }
  }

  if (personalHost) {
    if (url.pathname === "/") {
      url.pathname = "/trackers/landing";
      return auth!.finish(
        NextResponse.rewrite(url, { request: { headers: requestHeaders } }),
      );
    }
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    if (auth) return auth.finish(response);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }

  if (auth) {
    return auth.finish(
      NextResponse.next({ request: { headers: requestHeaders } }),
    );
  }

  // The personal OAuth callback also supports preview/local sign-in.
  if (url.pathname === "/auth/callback") {
    return NextResponse.next();
  }

  // Static image/font/document assets are app-agnostic — serve from any host
  // without the portfolio redirect and without a product-surface header.
  const isStaticAsset =
    url.pathname.startsWith("/icons/") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|pdf|ico)$/i.test(url.pathname);

  // SEO documents (sitemap, robots) are static metadata — serve from any host
  // without the portfolio redirect.
  const isSeoDocument =
    url.pathname === "/sitemap.xml" || url.pathname === "/robots.txt";

  if (isStaticAsset || isSeoDocument) {
    return NextResponse.next();
  }

  // PWA manifest and service worker: forward the tracker surface header so the
  // manifest route can serve the correct NOVA payload on local and personal hosts.
  const isPwaAsset =
    url.pathname === "/manifest.webmanifest" || url.pathname === "/sw.js";
  if (isPwaAsset) {
    return isTrackerSurface
      ? NextResponse.next({ request: { headers: requestHeaders } })
      : NextResponse.next();
  }

  if (
    !isLocal &&
    url.pathname !== "/" &&
    !url.pathname.startsWith("/api/") &&
    !isPortfolioCase
  ) {
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url, 307);
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
