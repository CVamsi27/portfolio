import { NextResponse } from "next/server";
import {
  authenticatedRequest,
  fetchFdc,
  normalizeFdcFood,
} from "@/lib/nutrition-provider";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await authenticatedRequest(request)))
    return NextResponse.json(
      { error: "Sign in to load foods." },
      { status: 401 },
    );
  const { id } = await context.params;
  if (!/^\d{1,12}$/.test(id))
    return NextResponse.json({ error: "Invalid food ID." }, { status: 400 });
  try {
    return NextResponse.json(
      {
        food: normalizeFdcFood(
          (await fetchFdc(`food/${id}`)) as Record<string, unknown>,
        ),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Food unavailable." },
      { status: 503 },
    );
  }
}
