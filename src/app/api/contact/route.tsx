import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ContactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please provide a valid email address").max(150),
  message: z.string().trim().min(5, "Message must be at least 5 characters").max(3000),
});

// In-memory sliding window rate limiter: max 5 requests per 10 mins per IP
const ipRateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipRateLimit.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRateLimit.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  ipRateLimit.set(ip, timestamps);
  return false;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many messages sent. Please wait a few minutes before trying again.",
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsed.error.issues[0]?.message || "Validation failed",
      },
      { status: 422 },
    );
  }

  const { name, email, message } = parsed.data;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    // Graceful fallback for local development or staging without telegram secrets
    console.info(
      `[Contact Dispatch (Local Mock)] From: ${name} <${email}>\nMessage: ${message}`,
    );
    return NextResponse.json({
      success: true,
      message: "Message received successfully (Dev Mock mode).",
      status: 200,
    });
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const dateStr = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const telegramText =
      `📬 *New Portfolio Message*\n\n` +
      `👤 *From:* ${name}\n` +
      `📧 *Email:* ${email}\n` +
      `🕒 *Time:* ${dateStr} IST\n\n` +
      `💬 *Message:*\n${message}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: telegramText,
        parse_mode: "Markdown",
      }),
    });

    const res = await response.json();

    if (res.ok) {
      return NextResponse.json({
        success: true,
        message: "Message dispatched successfully!",
        status: 200,
      });
    } else {
      console.error("[Telegram API Error]", res);
      return NextResponse.json(
        {
          success: false,
          message: "Could not deliver message via Telegram gateway.",
          status: 500,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[Contact API Error]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unexpected error during message transmission.",
        status: 500,
      },
      { status: 500 },
    );
  }
}
