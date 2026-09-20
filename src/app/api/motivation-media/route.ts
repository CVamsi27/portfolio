import { NextResponse } from "next/server";
import { getMotivationKeywords, normalizeMotivationCountry, resolveMotivationMedia } from "@/lib/motivation-media";
import type { GoalCategory, MotivationPersonalization } from "@/lib/user-prefs";

const CATEGORIES: GoalCategory[] = ["relocation", "fitness", "career", "learning", "financial", "custom"];

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const source = params.get("source");
  const category = params.get("category");
  const country = normalizeMotivationCountry(params.get("country"));
  if ((source !== "goal" && source !== "general") || !category || !CATEGORIES.includes(category as GoalCategory)) {
    return NextResponse.json({ error: "Invalid motivation source or category." }, { status: 400 });
  }

  const normalizedSource = source as MotivationPersonalization;
  const normalizedCategory = category as GoalCategory;
  const media = await resolveMotivationMedia({
    source: normalizedSource,
    category: normalizedCategory,
    country,
  });
  return NextResponse.json({
    ...media,
    keywords: getMotivationKeywords(normalizedSource, normalizedCategory, country),
    categoryLabel: media.categoryLabel,
    rationale: media.rationale,
  });
}
