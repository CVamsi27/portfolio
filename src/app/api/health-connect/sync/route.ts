import { deviceCredential, validateHealthBatch } from "@/lib/health-connect";
import {
  healthBody,
  healthFailure,
  healthResponse,
  healthRpc,
  healthThrottle,
  HealthApiError,
} from "@/lib/health-connect-server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const credential = deviceCredential(request.headers.get("authorization"));
    if (!credential)
      throw new HealthApiError("Health device credential is required.", 401);
    await healthThrottle(request, "sync");
    const body = await healthBody(request, 1000000);
    if (!validateHealthBatch(body))
      throw new HealthApiError(
        "Invalid health records. Review dates, units and source data.",
        400,
      );
    const result = await healthRpc("health_connect_sync", {
      p_device_id: credential.deviceId,
      p_secret_digest: credential.digest,
      p_records: body.records,
    });
    return healthResponse(result);
  } catch (error) {
    return healthFailure(error);
  }
}
