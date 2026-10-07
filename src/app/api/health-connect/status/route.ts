import { deviceCredential } from "@/lib/health-connect";
import {
  healthFailure,
  healthResponse,
  healthRpc,
  healthThrottle,
  HealthApiError,
} from "@/lib/health-connect-server";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const credential = deviceCredential(request.headers.get("authorization"));
    if (!credential)
      throw new HealthApiError("Health device credential is required.", 401);
    await healthThrottle(request, "status");
    return healthResponse(
      await healthRpc("health_connect_status", {
        p_device_id: credential.deviceId,
        p_secret_digest: credential.digest,
      }),
    );
  } catch (error) {
    return healthFailure(error);
  }
}
