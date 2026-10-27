import type { SupabaseClient } from "@supabase/supabase-js";
import {
  sendTelegramMessageOutcome,
  type TelegramSendOutcome,
} from "./telegram-server.ts";

export type TelegramDeliveryNotification = {
  id: string;
  kind: string;
  scheduledAt: number;
  expiresAt?: number;
  text: string;
};

export type TelegramDeliveryStatus = "sent" | "failed" | "unknown" | "skipped";

export async function dispatchTelegramNotification({
  admin,
  owner,
  notification,
  recipientFingerprint,
  now,
  send = sendTelegramMessageOutcome,
}: {
  admin: Pick<SupabaseClient, "rpc">;
  owner: string;
  notification: TelegramDeliveryNotification;
  recipientFingerprint: string;
  now: number;
  send?: (text: string) => Promise<TelegramSendOutcome>;
}): Promise<TelegramDeliveryStatus> {
  const { id, kind, scheduledAt, text } = notification;
  const expiresAt = notification.expiresAt ?? scheduledAt + 10 * 60_000;
  if (
    !/^[a-f0-9]{64}$/.test(id) ||
    !/^[a-f0-9]{64}$/.test(recipientFingerprint) ||
    !/^(routine|career-digest|career-study|career-project)$/.test(kind) ||
    !owner ||
    !text.trim() ||
    !Number.isFinite(now) ||
    !Number.isFinite(scheduledAt) ||
    !Number.isFinite(expiresAt) ||
    Math.abs(scheduledAt) > 8.64e15 ||
    Math.abs(expiresAt) > 8.64e15 ||
    expiresAt <= scheduledAt ||
    expiresAt - scheduledAt > 15 * 60_000
  )
    return "failed";
  if (scheduledAt > now || now > expiresAt) return "skipped";
  const common = { p_user: owner, p_delivery: id };
  let claim: { data: unknown; error: unknown };
  try {
    claim = await admin.rpc("claim_telegram_delivery", {
      ...common,
      p_kind: kind,
      p_recipient_fingerprint: recipientFingerprint,
      p_scheduled_at: new Date(scheduledAt).toISOString(),
      p_expires_at: new Date(expiresAt).toISOString(),
    });
  } catch {
    return "failed";
  }
  if (claim.error) return "failed";
  const record = claim.data as { status?: unknown; token?: unknown } | null;
  if (record?.status === "unknown") return "unknown";
  if (record?.status === "skipped") return "skipped";
  if (
    record?.status !== "claimed" ||
    typeof record.token !== "string" ||
    !/^[a-f0-9-]{36}$/i.test(record.token)
  )
    return "failed";
  const fenced = { ...common, p_token: record.token };
  try {
    const armed = await admin.rpc("arm_telegram_delivery", fenced);
    if (armed.error) return "unknown";
    if (armed.data !== true) return "skipped";
  } catch {
    return "unknown";
  }
  let outcome: TelegramSendOutcome;
  try {
    outcome = await send(text);
  } catch {
    outcome = { kind: "unknown", code: "telegram-network-error" };
  }
  const state =
    outcome.kind === "accepted"
      ? "sent"
      : outcome.kind === "unknown"
        ? "unknown"
        : outcome.retryable && outcome.code === "telegram-429"
          ? "retryable"
          : "failed";
  try {
    const acknowledged = await admin.rpc("finish_telegram_delivery", {
      ...fenced,
      p_outcome: state,
      p_message_id: outcome.kind === "accepted" ? outcome.messageId : null,
      p_error_code: outcome.kind === "accepted" ? null : outcome.code,
      p_retry_after_seconds:
        state === "retryable" && outcome.kind === "rejected"
          ? // 901 is beyond every permitted occurrence window. Keep huge provider
            // delays terminal without overflowing the SQL integer argument.
            outcome.retryAfterSeconds === undefined
            ? null
            : Math.min(outcome.retryAfterSeconds, 901)
          : null,
    });
    if (acknowledged.error || acknowledged.data !== true) return "unknown";
  } catch {
    return "unknown";
  }
  return state === "retryable" ? "failed" : state;
}
