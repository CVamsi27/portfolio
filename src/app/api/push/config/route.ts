import { NextResponse } from "next/server";
import { pushConfigured } from "@/lib/push-server";
export async function GET() {
  return NextResponse.json(
    { publicKey: pushConfigured() ? process.env.VAPID_PUBLIC_KEY : null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
