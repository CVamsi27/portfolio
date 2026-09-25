import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Host-based routing for the three domains on one Vercel project.
 * Next 16 renamed the `middleware` file convention to `proxy` — same
 * runtime, same signature, new name.
 *
 * - buildora.work / portfolio.buildora.work → portfolio resume ONLY.
 *   Every non-root path (incl. /login, /trackers, /goal, …) redirects to `/`.
 *   Only `/api/*` (contact form) is exempt.
 * - personal.buildora.work → tracker suite, with `/` rewritten to the
 *   public `/trackers/landing` entry; all other routes (/trackers, /goal,
 *   /share, /login, …) pass through.
 * - Localhost is unrestricted for development.
 */
export default function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const url = req.nextUrl.clone();
  const isPersonalHost = host.startsWith("personal.");
  const isLocal =
    host.startsWith("localhost") || host.startsWith("127.") || host.endsWith(".local");
  const isLocalTrackerPath =
    isLocal && url.pathname !== "/" && !url.pathname.startsWith("/api/");
  const isTrackerSurface = isPersonalHost || isLocalTrackerPath;
  const requestHeaders = new Headers(req.headers);
  if (isTrackerSurface) requestHeaders.set("x-product-surface", "tracker");

  if (isPersonalHost) {
    if (url.pathname === "/") {
      url.pathname = "/trackers/landing";
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Static image/font/document assets are app-agnostic — serve from any host
  // without the portfolio redirect and without a product-surface header.
  const isStaticAsset =
    url.pathname.startsWith("/icons/") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|pdf|ico)$/i.test(url.pathname);

  if (isStaticAsset) {
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

  if (!isLocal && url.pathname !== "/" && !url.pathname.startsWith("/api/")) {
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url, 307);
  }
  return isTrackerSurface
    ? NextResponse.next({ request: { headers: requestHeaders } })
    : NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf|ico)$).*)",
  ],
};
