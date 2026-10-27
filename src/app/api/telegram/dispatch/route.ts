import { NextResponse } from "next/server.js";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  dueRoutineGroups,
  deliveryGroupKey,
} from "../../../../lib/routine-delivery.ts";
import { pushAdmin } from "../../../../lib/push-server.ts";
import {
  validSchedule,
  type RoutineHistory,
  type RoutineSchedule,
} from "../../../../lib/routine-reminders.ts";
import {
  resolveTelegramOwner,
  routineMessage,
  getPrivateTelegramChat,
  telegramConfigured,
} from "../../../../lib/telegram-server.ts";

import {
  dueCareerNotifications,
  careerTelegramMayBeDue,
  validCareerTelegramPreferences,
} from "../../../../lib/career-telegram.ts";
import {
  dispatchTelegramNotification,
  type TelegramDeliveryNotification,
} from "../../../../lib/telegram-delivery.ts";
import type { JobPlan } from "../../../../lib/job-plan.ts";

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
    // Reconcile uncertain sends even after their original catch-up window ends.
    const sweep = await admin.rpc("expire_telegram_deliveries", {
      p_user: owner,
    });
    if (sweep.error) throw sweep.error;
    const { data: rows, error } = await admin
      .from("tracker_data")
      .select("key,value")
      .eq("user_id", owner)
      .in("key", [
        "routine:schedules",
        "routine:history",
        "career:telegram-preferences",
      ]);
    if (error) throw error;

    const schedules = Object.values(
      rows?.find((row) => row.key === "routine:schedules")?.value ?? {},
    ).filter(validSchedule) as RoutineSchedule[];
    const history = (rows?.find((row) => row.key === "routine:history")
      ?.value ?? {}) as Record<string, RoutineHistory>;
    const groups = dueRoutineGroups(schedules, history, now);
    const chatId = process.env.TELEGRAM_CHAT_ID!.trim();
    const notifications: TelegramDeliveryNotification[] = [...groups].map(
      ([at, items]) => ({
        // Keep the existing routine hash so previously accepted reminders stay deduplicated.
        id: createHash("sha256")
          .update(deliveryGroupKey(`telegram:${chatId}`, at))
          .digest("hex"),
        kind: "routine",
        scheduledAt: at,
        expiresAt: at + 15 * 60_000,
        text: routineMessage(items),
      }),
    );
    const prefs = rows?.find(
      (row) => row.key === "career:telegram-preferences",
    )?.value;
    if (
      validCareerTelegramPreferences(prefs) &&
      careerTelegramMayBeDue(prefs, now)
    ) {
      // Read only the current plan, not the command center's retained release history.
      const [career, execution] = await Promise.all([
        admin
          .from("tracker_data")
          .select("plan:value->germanyRoadmap->execution->jobPlan")
          .eq("user_id", owner)
          .eq("key", "career_command_center")
          .maybeSingle(),
        admin
          .from("tracker_data")
          .select("value")
          .eq("user_id", owner)
          .eq("key", "career_execution_state")
          .maybeSingle(),
      ]);
      if (career.error) throw career.error;
      if (execution.error) throw execution.error;
      for (const notification of dueCareerNotifications(
        career.data?.plan as JobPlan | undefined,
        execution.data?.value,
        prefs,
        now,
      )) {
        notifications.push({
          ...notification,
          id: notification.id,
          expiresAt: notification.scheduledAt + prefs.catchUpMinutes * 60_000,
        });
      }
    }
    const counts = {
      due: notifications.length,
      sent: 0,
      failed: 0,
      unknown: 0,
      skipped: 0,
    };
    if (notifications.length) {
      const destination = await getPrivateTelegramChat();
      for (const notification of notifications) {
        const result = await dispatchTelegramNotification({
          admin,
          owner,
          notification:
            notification.kind === "routine"
              ? notification
              : {
                  ...notification,
                  // A canonical verified destination keeps numeric aliases from replaying a career occurrence.
                  id: createHash("sha256")
                    .update(`${destination.fingerprint}:${notification.id}`)
                    .digest("hex"),
                },
          recipientFingerprint: destination.fingerprint,
          now,
        });
        counts[result]++;
      }
    }
    return NextResponse.json(counts, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Telegram reminder dispatch unavailable." },
      { status: 503 },
    );
  }
}
