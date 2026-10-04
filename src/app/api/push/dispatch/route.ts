import { dueRoutineGroups, deliveryGroupKey } from "@/lib/routine-delivery";
import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import webpush from "web-push";
import {
  pushAdmin,
  pushConfigured,
  validPushEndpoint,
} from "@/lib/push-server";
import {
  validSchedule,
  type RoutineHistory,
  type RoutineSchedule,
} from "@/lib/routine-reminders";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied =
    request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (
    !expected ||
    Buffer.byteLength(expected) !== Buffer.byteLength(supplied) ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
  )
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!pushConfigured())
    return NextResponse.json(
      { error: "Push is not configured." },
      { status: 503 },
    );
  const admin = pushAdmin();
  const now = Date.now();
  let sent = 0,
    failed = 0;
  try {
    let offset = 0;
    while (Date.now() - now < 45_000) {
      const { data: subscriptions, error } = await admin
        .from("push_subscriptions")
        .select("*")
        .range(offset, offset + 99);
      if (error) throw error;
      if (!subscriptions?.length) break;
      for (const subscription of subscriptions) {
        if (Date.now() - now > 45_000) break;
        if (!validPushEndpoint(subscription.endpoint)) continue;
        const { data: rows, error: readError } = await admin
          .from("tracker_data")
          .select("key,value")
          .eq("user_id", subscription.user_id)
          .in("key", ["routine:schedules", "routine:history"]);
        if (readError) {
          failed++;
          continue;
        }
        const schedules = Object.values(
          rows?.find((row) => row.key === "routine:schedules")?.value ?? {},
        ).filter(validSchedule) as RoutineSchedule[];
        const history = (rows?.find((row) => row.key === "routine:history")
          ?.value ?? {}) as Record<string, RoutineHistory>;
        const groups = dueRoutineGroups(schedules, history, now);
        for (const [at, items] of groups) {
          if (Date.now() - now > 45_000) break;
          const id = createHash("sha256")
            .update(deliveryGroupKey(subscription.endpoint, at))
            .digest("hex");
          const claim = await admin.rpc("claim_routine_push", {
            p_user: subscription.user_id,
            p_delivery: id,
          });
          if (claim.error) {
            failed++;
            continue;
          }
          if (!claim.data) continue;
          try {
            await webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: { p256dh: subscription.p256dh, auth: subscription.auth },
              },
              JSON.stringify({
                title: subscription.detailed
                  ? items.map((item) => item.label).join(" + ")
                  : "NOVA routine reminder",
                body: subscription.detailed
                  ? "Your scheduled routine is due. Open NOVA to log, snooze or skip."
                  : "A reminder is due. Open NOVA to view it.",
                url: "/routine",
                tag: id,
              }),
              {
                TTL: 900,
                timeout: 8000,
                vapidDetails: {
                  subject: process.env.VAPID_SUBJECT!,
                  publicKey: process.env.VAPID_PUBLIC_KEY!,
                  privateKey: process.env.VAPID_PRIVATE_KEY!,
                },
              },
            );
            await admin
              .from("push_deliveries")
              .update({
                status: "sent",
                delivered_at: new Date().toISOString(),
              })
              .eq("user_id", subscription.user_id)
              .eq("delivery_id", id);
            sent++;
          } catch (error) {
            failed++;
            const status = (error as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410)
              await admin
                .from("push_subscriptions")
                .delete()
                .eq("user_id", subscription.user_id)
                .eq("endpoint", subscription.endpoint);
          }
        }
      }
      if (subscriptions.length < 100) break;
      offset += 100;
    }
    return NextResponse.json(
      { sent, failed },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Reminder dispatch unavailable." },
      { status: 503 },
    );
  }
}
