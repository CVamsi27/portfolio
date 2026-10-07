import { parseHealthArchive } from "@/lib/health-connect-transfer";
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
    const owner = await healthOwner(request);
    await healthThrottle(request, "owner", owner.id);
    const body = await healthBody(request, 20000000);
    let archive;
    try {
      archive = parseHealthArchive(body);
    } catch (e) {
      throw new HealthApiError(
        e instanceof Error ? e.message : "Invalid health archive.",
        400,
      );
    }
    return healthResponse(
      await healthRpc("health_connect_restore", {
        p_owner: owner.id,
        p_records: archive.records,
      }),
    );
  } catch (e) {
    return healthFailure(e);
  }
}
