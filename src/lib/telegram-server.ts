import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { ROUTINE_OWNER, type RoutineOccurrence } from "./routine-reminders.ts";

/** Telegram IDs are numeric; groups/channels use a leading minus sign. */
export function validTelegramChatId(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const chatId = value.trim();
  return /^-?\d{1,20}$/.test(chatId) && chatId !== "0";
}

export function telegramConfigured() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return Boolean(
    token &&
      token.length >= 20 &&
      !/\s/.test(token) &&
      validTelegramChatId(process.env.TELEGRAM_CHAT_ID),
  );
}

export function telegramOwnerEmail() {
  return (
    process.env.TELEGRAM_OWNER_EMAIL?.trim().toLowerCase() || ROUTINE_OWNER
  );
}

/**
 * The bot chat is fixed to the private owner chat. Resolve that owner through
 * the auth admin API rather than accepting a user id from the request.
 */
export async function resolveTelegramOwner(admin: SupabaseClient) {
  const email = telegramOwnerEmail();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    const matches = (data.users ?? []).filter(
      (user) => user.email?.trim().toLowerCase() === email,
    );
    if (matches.length === 1) return matches[0].id;
    if (matches.length > 1)
      throw new Error("Telegram owner account is ambiguous.");
    if ((data.users ?? []).length < 1000) break;
  }
  throw new Error("Telegram owner account is not configured.");
}

export function routineMessage(items: RoutineOccurrence[]) {
  if (!items.length) throw new Error("No routine items to notify.");
  const first = items[0];
  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(first.scheduledAt);
  const labels = items.map((item) => item.label).join(" + ");
  return `NOVA routine · ${time}\n${labels}\nLog: https://personal.buildora.work/routine`;
}

export type TelegramSendOutcome =
  | { kind: "accepted"; messageId: number }
  | {
      kind: "rejected";
      code: string;
      retryAfterSeconds?: number;
      retryable: boolean;
    }
  | { kind: "unknown"; code: string };

type TelegramPayload = {
  ok?: unknown;
  error_code?: unknown;
  parameters?: { retry_after?: unknown };
  result?: { message_id?: unknown; id?: unknown; type?: unknown };
};

/** Return only a non-identifying destination fingerprint, never chat metadata. */
export async function getPrivateTelegramChat(fetcher: typeof fetch = fetch) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  try {
    if (!telegramConfigured() || !token || !chatId) throw new Error();
    const response = await fetcher(
      `https://api.telegram.org/bot${token}/getChat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId }),
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );
    const payload = (await response.json()) as TelegramPayload;
    const actual = payload?.result?.id;
    if (
      !response.ok ||
      payload?.ok !== true ||
      payload.result?.type !== "private" ||
      typeof actual !== "number" ||
      !Number.isSafeInteger(actual) ||
      actual <= 0 ||
      BigInt(actual).toString() !== BigInt(chatId).toString()
    )
      throw new Error();
    return {
      fingerprint: createHash("sha256")
        .update(`telegram:${actual}`)
        .digest("hex"),
    };
  } catch {
    // Fetch errors can contain the bot token in their URL. Do not propagate them.
    throw new Error("Telegram private chat could not be verified.");
  }
}

/** An ambiguous response must never be treated as a safe retry. */
export async function sendTelegramMessageOutcome(
  text: string,
  fetcher: typeof fetch = fetch,
): Promise<TelegramSendOutcome> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!telegramConfigured() || !token || !chatId)
    return {
      kind: "rejected",
      code: "telegram-not-configured",
      retryable: false,
    };
  if (!text.trim())
    return {
      kind: "rejected",
      code: "telegram-empty-message",
      retryable: false,
    };
  let response: Response;
  try {
    response = await fetcher(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.slice(0, 4000),
          disable_web_page_preview: true,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );
  } catch {
    return { kind: "unknown", code: "telegram-network-error" };
  }
  if (response.status >= 500)
    return { kind: "unknown", code: "telegram-server-error" };
  const payload = (await response
    .json()
    .catch(() => null)) as TelegramPayload | null;
  const messageId = payload?.result?.message_id;
  if (
    response.ok &&
    payload?.ok === true &&
    typeof messageId === "number" &&
    Number.isSafeInteger(messageId) &&
    messageId > 0
  )
    return { kind: "accepted", messageId };
  const code = payload?.error_code;
  if (
    payload?.ok === false &&
    typeof code === "number" &&
    Number.isInteger(code) &&
    code >= 400 &&
    code < 500
  ) {
    const retry = payload.parameters?.retry_after;
    return {
      kind: "rejected",
      code: `telegram-${code}`,
      retryable: code === 429,
      ...(code === 429 &&
      typeof retry === "number" &&
      Number.isSafeInteger(retry) &&
      retry > 0
        ? { retryAfterSeconds: retry }
        : {}),
    };
  }
  return { kind: "unknown", code: "telegram-invalid-response" };
}

/** Retained for existing callers; new dispatches persist the discriminated outcome. */
export async function sendTelegramMessage(
  text: string,
  fetcher: typeof fetch = fetch,
) {
  const outcome = await sendTelegramMessageOutcome(text, fetcher);
  if (outcome.kind !== "accepted") throw new Error("Telegram delivery failed.");
}
