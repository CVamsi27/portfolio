import type { SupabaseClient } from "@supabase/supabase-js";
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
  return `NOVA routine · ${time}\n${labels}\nLog: https://www.buildora.work/routine`;
}

export async function sendTelegramMessage(
  text: string,
  fetcher: typeof fetch = fetch,
) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !validTelegramChatId(chatId))
    throw new Error("Telegram is not configured.");
  const response = await fetcher(
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
  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean;
  } | null;
  if (!response.ok || !payload?.ok)
    throw new Error("Telegram delivery failed.");
}
