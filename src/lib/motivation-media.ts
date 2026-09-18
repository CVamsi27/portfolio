import type { GoalCategory, MotivationPersonalization } from "@/lib/user-prefs";

export type MotivationMedia = {
  imageUrl?: string;
  imageAlt?: string;
  attribution?: string;
  quote: string;
  quoteAuthor?: string;
  fetchedAt: number;
};

const CATEGORY_KEYWORDS: Record<GoalCategory, readonly string[]> = {
  relocation: ["journey", "horizon", "city"],
  fitness: ["movement", "strength", "training"],
  career: ["focus", "craft", "progress"],
  learning: ["study", "library", "discovery"],
  financial: ["growth", "building", "future"],
  custom: ["focus", "resilience", "progress"],
};

const GENERAL_KEYWORDS = ["focus", "resilience", "progress"] as const;

const FALLBACK_QUOTES: Record<MotivationPersonalization, string[]> = {
  goal: [
    "The direction becomes clearer every time you take the next honest step.",
    "Small actions are how a distant outcome becomes a lived routine.",
  ],
  general: [
    "Keep the next move small enough to begin and meaningful enough to matter.",
    "Progress does not need a perfect day. It needs a return to the work.",
  ],
};

export function getMotivationKeywords(source: MotivationPersonalization, category: GoalCategory): readonly string[] {
  return source === "general" ? GENERAL_KEYWORDS : CATEGORY_KEYWORDS[category] ?? CATEGORY_KEYWORDS.custom;
}

export function fallbackMotivationMedia(source: MotivationPersonalization, category: GoalCategory): MotivationMedia {
  const keywords = getMotivationKeywords(source, category);
  const quote = FALLBACK_QUOTES[source][keywords.length % FALLBACK_QUOTES[source].length];
  return {
    quote,
    quoteAuthor: "NOVA//OS",
    fetchedAt: Date.now(),
  };
}

function safeHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export async function resolveMotivationMedia({
  source,
  category,
  fetchImpl = fetch,
}: {
  source: MotivationPersonalization;
  category: GoalCategory;
  fetchImpl?: typeof fetch;
}): Promise<MotivationMedia> {
  const fallback = fallbackMotivationMedia(source, category);
  const keywords = getMotivationKeywords(source, category);
  const query = encodeURIComponent(keywords.join(" "));
  let image: Pick<MotivationMedia, "imageUrl" | "imageAlt" | "attribution"> = {};
  let quote: Pick<MotivationMedia, "quote" | "quoteAuthor"> = fallback;

  try {
    const response = await fetchImpl(`https://api.artic.edu/api/v1/artworks/search?q=${query}&fields=id,title,image_id,artist_display&limit=6`, {
      signal: AbortSignal.timeout(4500),
    });
    if (response.ok) {
      const payload = (await response.json()) as { data?: Array<{ title?: string; image_id?: string; artist_display?: string }> };
      const artwork = payload.data?.find((item) => item.image_id);
      if (artwork?.image_id) {
        image = {
          imageUrl: `https://www.artic.edu/iiif/2/${encodeURIComponent(artwork.image_id)}/full/1600,/0/default.jpg`,
          imageAlt: artwork.title || `${keywords[0]} artwork`,
          attribution: artwork.artist_display ? `Art Institute of Chicago · ${artwork.artist_display}` : "Art Institute of Chicago",
        };
      }
    }
  } catch {
    image = {};
  }

  try {
    const response = await fetchImpl("https://zenquotes.io/api/random", { signal: AbortSignal.timeout(4500) });
    if (response.ok) {
      const payload = (await response.json()) as Array<{ q?: string; a?: string }>;
      const item = payload[0];
      if (item?.q?.trim()) quote = { quote: item.q.trim(), quoteAuthor: item.a?.trim() || "Zen Quotes" };
    }
  } catch {
    quote = fallback;
  }

  return { ...fallback, ...quote, ...image, imageUrl: safeHttpsUrl(image.imageUrl), fetchedAt: Date.now() };
}
