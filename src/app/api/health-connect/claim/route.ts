import {
  digestText,
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
    await healthThrottle(request, "claim", user.id);
    const body = (await healthBody(request, 1000)) as { code?: unknown };
    if (
      !body ||
      typeof body.code !== "string" ||
      !/^[A-F0-9]{16}$/i.test(body.code.trim())
    )
      throw new HealthApiError(
        "Enter the 16-character pairing code shown on Android.",
        400,
      );
    const result = await healthRpc("health_connect_claim", {
      p_owner: user.id,
      p_code_digest: digestText(body.code.trim().toUpperCase()),
    });
    return healthResponse({ device: result });
  } catch (error) {
    return healthFailure(error);
  }
}
