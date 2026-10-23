import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { dueRoutineGroups, deliveryGroupKey } from "@/lib/routine-delivery";
import { pushAdmin } from "@/lib/push-server";
import {
  validSchedule,
  type RoutineHistory,
  type RoutineSchedule,
} from "@/lib/routine-reminders";
import {
  resolveTelegramOwner,
  routineMessage,
  sendTelegramMessage,
  telegramConfigured,
} from "@/lib/telegram-server";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied =
    request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  return Boolean(
    expected &&
      Buffer.byteLength(expected) === Buffer.byteLength(supplied) &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(supplied)),
  );
}

export async function GET(request: Request) {
  if (!authorized(request))
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!telegramConfigured())
    return NextResponse.json(
      { error: "Telegram is not configured." },
      { status: 503 },
    );

  const now = Date.now();
  try {
    const admin = pushAdmin();
    const owner = await resolveTelegramOwner(admin);
    const { data: rows, error } = await admin
      .from("tracker_data")
      .select("key,value")
      .eq("user_id", owner)
      .in("key", ["routine:schedules", "routine:history"]);
    if (error) throw error;

    const schedules = Object.values(
      rows?.find((row) => row.key === "routine:schedules")?.value ?? {},
    ).filter(validSchedule) as RoutineSchedule[];
    const history = (rows?.find((row) => row.key === "routine:history")
      ?.value ?? {}) as Record<string, RoutineHistory>;
    const groups = dueRoutineGroups(schedules, history, now);
    const chatId = process.env.TELEGRAM_CHAT_ID!.trim();
    let sent = 0;
    let failed = 0;

    for (const [at, items] of groups) {
      const id = createHash("sha256")
        .update(deliveryGroupKey(`telegram:${chatId}`, at))
        .digest("hex");
      const claim = await admin.rpc("claim_routine_push", {
        p_user: owner,
        p_delivery: id,
      });
      if (claim.error) {
        failed++;
        continue;
      }
      if (!claim.data) continue;
      try {
        await sendTelegramMessage(routineMessage(items));
        await admin
          .from("push_deliveries")
          .update({
            status: "sent",
            delivered_at: new Date().toISOString(),
          })
          .eq("user_id", owner)
          .eq("delivery_id", id);
        sent++;
      } catch {
        failed++;
      }
    }

    return NextResponse.json(
      { sent, failed },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Telegram reminder dispatch unavailable." },
      { status: 503 },
    );
  }
}
