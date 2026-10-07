import { randomBytes } from "node:crypto";
import { validPairRequest } from "@/lib/health-connect";
import {
  digestText,
  healthBody,
  healthFailure,
  healthResponse,
  healthRpc,
  healthThrottle,
  requestRateKey,
  HealthApiError,
} from "@/lib/health-connect-server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await healthThrottle(request, "pair");
    const body = await healthBody(request, 2000);
    if (!validPairRequest(body))
      throw new HealthApiError("Invalid device pairing request.", 400);
    const pairingCode = randomBytes(8).toString("hex").toUpperCase();
    const result = await healthRpc("health_connect_pair", {
      p_device_id: body.deviceId,
      p_label: body.label.trim(),
      p_secret_digest: body.secretDigest,
      p_code_digest: digestText(pairingCode),
      p_rate_key: requestRateKey(request),
    });
    return healthResponse({ pairingCode, expiresAt: result.expiresAt }, 201);
  } catch (error) {
    return healthFailure(error);
  }
}
