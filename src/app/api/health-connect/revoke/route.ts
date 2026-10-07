import { validDeviceId } from "@/lib/health-connect";
import {
  healthBody,
  healthFailure,
  healthOwner,
  healthResponse,
  healthRpc,
  healthThrottle,
  HealthApiError,
} from "@/lib/health-connect-server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const user = await healthOwner(request);
    await healthThrottle(request, "owner", user.id);
    const body = (await healthBody(request, 1000)) as { deviceId?: unknown };
    if (!body || !validDeviceId(body.deviceId))
      throw new HealthApiError("Invalid device ID.", 400);
    await healthRpc("health_connect_revoke", {
      p_owner: user.id,
      p_device_id: body.deviceId,
    });
    return healthResponse({ ok: true });
  } catch (error) {
    return healthFailure(error);
  }
}
