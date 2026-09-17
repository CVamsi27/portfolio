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
 *   `/trackers` hub; all other routes (/goal, /share, /login, …) pass through.
 * - Localhost is unrestricted for development.
 */
export default function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const url = req.nextUrl.clone();

  if (host.startsWith("personal.")) {
    if (url.pathname === "/") {
      url.pathname = "/trackers";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  const isLocal =
    host.startsWith("localhost") || host.startsWith("127.") || host.endsWith(".local");
  if (!isLocal && url.pathname !== "/" && !url.pathname.startsWith("/api/")) {
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url, 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
