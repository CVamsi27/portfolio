import { NextResponse } from "next/server";
import { authenticatedRequest } from "@/lib/nutrition-provider";
import {
  pushAdmin,
  pushConfigured,
  validPushEndpoint,
} from "@/lib/push-server";
export async function POST(request: Request) {
  const user = await authenticatedRequest(request);
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  if (!pushConfigured())
    return NextResponse.json(
      { error: "Push is not configured." },
      { status: 503 },
    );
  try {
    const text = await request.text();
    if (text.length > 6000)
      return NextResponse.json(
        { error: "Invalid subscription." },
        { status: 400 },
      );
    const { subscription, detailed } = JSON.parse(text);
    if (
      !validPushEndpoint(subscription?.endpoint) ||
      !/^[-_A-Za-z0-9=]{20,200}$/.test(subscription?.keys?.p256dh ?? "") ||
      !/^[-_A-Za-z0-9=]{10,100}$/.test(subscription?.keys?.auth ?? "")
    )
      return NextResponse.json(
        { error: "Invalid subscription." },
        { status: 400 },
      );
    const { error } = await pushAdmin()
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          detailed: detailed === true,
        },
        { onConflict: "endpoint" },
      );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to save subscription." },
      { status: 503 },
    );
  }
}
export async function DELETE(request: Request) {
  const user = await authenticatedRequest(request);
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  try {
    const { endpoint } = await request.json();
    if (!validPushEndpoint(endpoint))
      return NextResponse.json({ error: "Invalid endpoint." }, { status: 400 });
    const { error } = await pushAdmin()
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", endpoint);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to remove subscription." },
      { status: 503 },
    );
  }
}

export async function GET(request: Request) {
  const user = await authenticatedRequest(request);
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  try {
    const { data, error } = await pushAdmin()
      .from("push_subscriptions")
      .select("endpoint,detailed")
      .eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json(
      { subscriptions: data ?? [] },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Subscription status unavailable." },
      { status: 503 },
    );
  }
}
