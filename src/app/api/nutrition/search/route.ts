import { NextResponse } from "next/server";
import { authenticatedRequest, fetchFdc } from "@/lib/nutrition-provider";
export async function GET(request: Request) {
  if (!process.env.USDA_FDC_API_KEY)
    return NextResponse.json(
      {
        error:
          "Database search is unavailable. Add a food manually or choose a saved food.",
      },
      { status: 503 },
    );
  if (!(await authenticatedRequest(request)))
    return NextResponse.json(
      { error: "Sign in to search foods." },
      { status: 401 },
    );
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length > 200)
    return NextResponse.json(
      { error: "Enter a food name of 1–200 characters." },
      { status: 400 },
    );
  try {
    const result = (await fetchFdc("foods/search", {
      query,
      pageSize: "12",
    })) as {
      foods?: Array<{
        fdcId: number;
        description: string;
        brandOwner?: string;
        dataType?: string;
      }>;
    };
    return NextResponse.json(
      {
        foods: (result.foods ?? []).map((food) => ({
          id: food.fdcId,
          name: food.description,
          brand: food.brandOwner,
          type: food.dataType,
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search unavailable." },
      { status: 503 },
    );
  }
}
