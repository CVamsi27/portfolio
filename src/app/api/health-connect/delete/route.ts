import { validHealthDate } from "@/lib/health-connect";
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
    const b = (await healthBody(request, 2000)) as {
      confirm?: unknown;
      from?: unknown;
      to?: unknown;
      source?: unknown;
    };
    if (
      !b ||
      b.confirm !== "DELETE IMPORTS" ||
      ((b.from !== undefined || b.to !== undefined) &&
        (!validHealthDate(b.from) ||
          !validHealthDate(b.to) ||
          b.from > b.to)) ||
      (b.source !== undefined &&
        (typeof b.source !== "string" ||
          !b.source.trim() ||
          b.source.length > 500))
    )
      throw new HealthApiError(
        "Confirm deletion and choose a valid date/source scope.",
        400,
      );
    return healthResponse(
      await healthRpc("health_connect_delete_imports", {
        p_owner: owner.id,
        p_from: b.from ?? null,
        p_to: b.to ?? null,
        p_source: b.source ?? null,
      }),
    );
  } catch (e) {
    return healthFailure(e);
  }
}
