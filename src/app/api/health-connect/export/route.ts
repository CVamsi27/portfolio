import {
  healthFailure,
  healthOwner,
  healthResponse,
  healthRpc,
  healthThrottle,
} from "@/lib/health-connect-server";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const owner = await healthOwner(request);
    await healthThrottle(request, "owner", owner.id);
    return healthResponse(
      await healthRpc("health_connect_export", { p_owner: owner.id }),
    );
  } catch (e) {
    return healthFailure(e);
  }
}
