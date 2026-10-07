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
    const user = await healthOwner(request);
    await healthThrottle(request, "owner", user.id);
    return healthResponse(
      await healthRpc("health_connect_owner_status", { p_owner: user.id }),
    );
  } catch (error) {
    return healthFailure(error);
  }
}
