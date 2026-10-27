import { NextResponse, type NextRequest } from "next/server.js";
import { isAllowedPersonalUser } from "../../../../lib/personal-access.ts";
import { pushAdmin } from "../../../../lib/push-server.ts";
import { createRequestAuth } from "../../../../lib/supabase/request.ts";
import {
  resolveTelegramOwner,
  telegramConfigured,
  telegramOwnerEmail,
} from "../../../../lib/telegram-server.ts";

export const runtime = "nodejs";

const states = [
  "pending",
  "claimed",
  "sending",
  "sent",
  "failed",
  "unknown",
] as const;
const careerKinds = ["career-digest", "career-study", "career-project"];
const emptyDelivery = () => ({
  available: false,
  scope: "career" as const,
  counts: {
    pending: 0,
    claimed: 0,
    sending: 0,
    sent: 0,
    failed: 0,
    unknown: 0,
  },
  latestAttemptAt: null as string | null,
  latestSentAt: null as string | null,
  latestUnknownAt: null as string | null,
});

/** Read-only owner diagnostics. Configuration never proves that a scheduler ran. */
export async function GET(request: NextRequest) {
  const auth = createRequestAuth(request);
  const respond = (body: unknown, status = 200) =>
    auth.finish(NextResponse.json(body, { status }));
  if (!auth.client)
    return respond({ error: "Authentication is not configured." }, 503);
  const user = await auth.getUser(true);
  if (!user) return respond({ error: "Authentication required." }, 401);
  if (
    !isAllowedPersonalUser(user) ||
    user.email?.trim().toLowerCase() !== telegramOwnerEmail()
  )
    return respond({ error: "Access denied." }, 403);

  const configured = {
    telegram: telegramConfigured(),
    storage: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        (process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.SUPABASE_SECRET_KEY),
    ),
    dispatcher: Boolean(process.env.CRON_SECRET?.trim()),
  };
  const delivery = emptyDelivery();
  const body = { configured, ownerAllowed: true, delivery };
  if (!configured.storage) return respond(body);

  try {
    const admin = pushAdmin();
    // Resolve independently; never accept a requested owner ID or a forged cookie user.
    const ownerId = await resolveTelegramOwner(admin);
    if (ownerId !== user.id) return respond({ error: "Access denied." }, 403);
    const ledger = () =>
      admin
        .from("push_deliveries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", ownerId)
        .in("telegram_kind", careerKinds);
    const latest = (column: string) =>
      admin
        .from("push_deliveries")
        .select(column)
        .eq("user_id", ownerId)
        .in("telegram_kind", careerKinds)
        .not(column, "is", null)
        .order(column, { ascending: false })
        .limit(1)
        .maybeSingle();
    const [counts, timestamps] = await Promise.all([
      Promise.all(states.map((state) => ledger().eq("status", state))),
      Promise.all([
        latest("attempted_at"),
        latest("delivered_at"),
        latest("unknown_at"),
      ]),
    ]);
    // Missing migrations and query failures must not masquerade as healthy empty history.
    if (
      counts.some((result) => result.error || result.count === null) ||
      timestamps.some((result) => result.error)
    )
      return respond(body);
    states.forEach((state, index) => {
      delivery.counts[state] = counts[index].count!;
    });
    const time = (index: number, key: string) => {
      const record: unknown = timestamps[index].data;
      const value =
        record && typeof record === "object" && !Array.isArray(record)
          ? (record as Record<string, unknown>)[key]
          : null;
      return typeof value === "string" && Number.isFinite(Date.parse(value))
        ? value
        : null;
    };
    delivery.latestAttemptAt = time(0, "attempted_at");
    delivery.latestSentAt = time(1, "delivered_at");
    delivery.latestUnknownAt = time(2, "unknown_at");
    delivery.available = true;
    return respond(body);
  } catch {
    return respond({ error: "Server delivery status is unavailable." }, 503);
  }
}
