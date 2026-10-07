import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export class HealthApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export function healthAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    throw new HealthApiError(
      "Health connection storage is not configured.",
      503,
    );
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function healthOwner(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ") || authorization.length > 8192)
    throw new HealthApiError("Sign in to manage health connections.", 401);
  const { data, error } = await healthAdmin().auth.getUser(
    authorization.slice(7),
  );
  if (error || !data.user)
    throw new HealthApiError("Sign in to manage health connections.", 401);
  return data.user;
}
export const digestText = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function requestRateKey(request: Request) {
  // Keep network identifiers out of health records. Enforce upstream request limits
  // too: forwarding-header trust depends on the deployment's reverse proxy.
  const address =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return digestText(address.slice(0, 200));
}
export async function healthThrottle(
  request: Request,
  bucket: string,
  identity?: string,
) {
  // This separate committed RPC counts failed requests as well as successes;
  // a later rejected sync/claim must not roll its request limit back.
  await healthRpc("health_connect_request_limit", {
    p_key: `http:${bucket}:${identity ? digestText(identity) : requestRateKey(request)}`,
    p_max: bucket === "pair" ? 10 : bucket === "claim" ? 30 : 100,
    p_seconds: bucket === "pair" || bucket === "claim" ? 600 : 60,
  });
}
export async function healthBody(
  request: Request,
  maximum: number,
): Promise<unknown> {
  if (!request.body)
    throw new HealthApiError("A JSON request body is required.", 400);
  const reader = request.body.getReader();
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximum) {
        await reader.cancel();
        throw new HealthApiError("Health request is too large.", 413);
      }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks);
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    if (error instanceof HealthApiError) throw error;
    throw new HealthApiError("Invalid JSON request.", 400);
  } finally {
    reader.releaseLock();
  }
}
export async function healthRpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await healthAdmin().rpc(name, args);
  if (error) {
    if (error.message.includes("Health authentication required"))
      throw new HealthApiError("Health connection is not authorized.", 401);
    if (error.message.includes("Health pairing unavailable"))
      throw new HealthApiError(
        "Pairing code expired, was used, or is invalid.",
        404,
      );
    if (error.message.includes("Health rate limited"))
      throw new HealthApiError(
        "Too many health requests. Try again later.",
        429,
      );
    if (error.message.includes("Health device conflict"))
      throw new HealthApiError(
        "This device already has a different connection.",
        409,
      );
    if (error.message.includes("Invalid health"))
      throw new HealthApiError("Invalid health request.", 400);
    throw new HealthApiError("Health connection storage is unavailable.", 503);
  }
  return data;
}
export function healthResponse(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export function healthFailure(error: unknown) {
  return healthResponse(
    {
      error:
        error instanceof HealthApiError
          ? error.message
          : "Health connection is unavailable.",
    },
    error instanceof HealthApiError ? error.status : 503,
  );
}
