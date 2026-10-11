import { NextResponse, type NextRequest } from "next/server.js";
import {
  isAllowedPersonalUser,
  isLocalHost,
  safePersonalReturn,
} from "../../../lib/personal-access.ts";
import { createRequestAuth } from "../../../lib/supabase/request.ts";

export async function GET(request: NextRequest) {
  const auth = createRequestAuth(request);
  const next = safePersonalReturn(request.nextUrl.searchParams.get("next"));
  const code = request.nextUrl.searchParams.get("code");
  const login = new URL("/login", request.url);
  login.searchParams.set("next", next);
  login.searchParams.set("error", "sign-in-failed");
  if (auth.client && code && code.length <= 4096) {
    try {
      const flowId = request.nextUrl.searchParams.get("sb_flow_id");
      const { error } = await auth.client.auth.exchangeCodeForSession(
        code,
        flowId === null ? undefined : { flowId },
      );
      if (!error) {
        const user = await auth.getUser();
        if (
          user &&
          (isLocalHost(request.headers.get("host") ?? "") ||
            isAllowedPersonalUser(user))
        ) {
          return auth.finish(NextResponse.redirect(new URL(next, request.url)));
        }
        if (user) login.searchParams.set("error", "access-denied");
        // Even an auth outage must not leave newly exchanged credentials behind.
        await auth.client.auth.signOut({ scope: "local" });
        auth.clearSession();
      }
    } catch {
      auth.clearSession();
    }
  }
  return auth.finish(NextResponse.redirect(login));
}
