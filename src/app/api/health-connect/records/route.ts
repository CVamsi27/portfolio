import { validHealthDate } from "@/lib/health-connect";
import {
  healthAdmin,
  healthFailure,
  healthOwner,
  healthResponse,
  healthThrottle,
  HealthApiError,
} from "@/lib/health-connect-server";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await healthOwner(request);
    await healthThrottle(request, "owner", user.id);
    const parameters = new URL(request.url).searchParams;
    const today = new Date().toISOString().slice(0, 10);
    const from =
      parameters.get("from") ??
      new Date(Date.parse(today) - 30 * 86400000).toISOString().slice(0, 10);
    const to =
      parameters.get("to") ??
      new Date(Date.parse(today) + 86400000).toISOString().slice(0, 10);
    const limit = Number(parameters.get("limit") ?? "100");
    const offset = Number(parameters.get("offset") ?? "0");
    if (
      !validHealthDate(from) ||
      !validHealthDate(to) ||
      to > new Date(Date.parse(today) + 86400000).toISOString().slice(0, 10) ||
      from > to ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isInteger(offset) ||
      offset < 0 ||
      offset > 500000
    )
      throw new HealthApiError(
        "Choose a valid health record date range and page.",
        400,
      );
    const { data, error, count } = await healthAdmin()
      .from("health_connect_records")
      .select("snapshot,device_id", { count: "exact" })
      .eq("user_id", user.id)
      .eq("deleted", false)
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: false })
      .order("record_id", { ascending: true })
      .order("type", { ascending: true })
      .order("source", { ascending: true })
      .order("device_id", { ascending: true })
      .range(offset, offset + limit - 1);
    if (error)
      throw new HealthApiError("Imported health records are unavailable.", 503);
    return healthResponse({
      records: (data ?? []).map((row) => ({
        ...row.snapshot,
        deviceId: row.device_id,
      })),
      total: count ?? 0,
      offset,
      limit,
    });
  } catch (error) {
    return healthFailure(error);
  }
}
