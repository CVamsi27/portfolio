import type { GoalCategory, MotivationPersonalization } from "@/lib/user-prefs";

const RELOCATION_COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "United Arab Emirates",
  "Australia",
  "Japan",
  "Germany",
  "Netherlands",
  "Ireland",
  "Singapore",
  "Other",
] as const;

export type MotivationMedia = {
  imageUrl?: string;
  imageAlt?: string;
  attribution?: string;
  sourceUrl?: string;
  provider?: string;
  destinationKey?: string;
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

const DESTINATION_KEYWORDS: Partial<Record<(typeof RELOCATION_COUNTRIES)[number], readonly string[]>> = {
  "United States": ["United States", "landmark", "city", "landscape"],
  "United Kingdom": ["United Kingdom", "landmark", "city", "landscape"],
  Canada: ["Canada", "landmark", "city", "landscape"],
  "United Arab Emirates": ["United Arab Emirates", "landmark", "city", "architecture"],
  Australia: ["Australia", "landmark", "city", "landscape"],
  Japan: ["Japan", "landmark", "city", "landscape"],
  Germany: ["Germany", "landmark", "city", "landscape"],
  Netherlands: ["Netherlands", "landmark", "city", "landscape"],
  Ireland: ["Ireland", "landmark", "city", "landscape"],
  Singapore: ["Singapore", "landmark", "city", "architecture"],
  Other: ["destination", "landmark", "city", "landscape"],
};

type MotivationCountry = (typeof RELOCATION_COUNTRIES)[number];

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

export function normalizeMotivationCountry(value: unknown): MotivationCountry | undefined {
  return typeof value === "string" && RELOCATION_COUNTRIES.includes(value as (typeof RELOCATION_COUNTRIES)[number])
    ? (value as MotivationCountry)
    : undefined;
}

export function getMotivationKeywords(
  source: MotivationPersonalization,
  category: GoalCategory,
  country?: string,
): readonly string[] {
  if (source === "general") return GENERAL_KEYWORDS;

  const safeCountry = normalizeMotivationCountry(country);
  if (category === "relocation" && safeCountry) {
    return DESTINATION_KEYWORDS[safeCountry] ?? CATEGORY_KEYWORDS.relocation;
  }

  return CATEGORY_KEYWORDS[category] ?? CATEGORY_KEYWORDS.custom;
}

export function fallbackMotivationMedia(
  source: MotivationPersonalization,
  category: GoalCategory,
  country?: string,
): MotivationMedia {
  const keywords = getMotivationKeywords(source, category, country);
  const quote = FALLBACK_QUOTES[source][keywords.length % FALLBACK_QUOTES[source].length];
  return {
    quote,
    quoteAuthor: "NOVA//OS",
    destinationKey: normalizeMotivationCountry(country),
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

function textValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return text || undefined;
}

type CommonsMetadata = Record<string, { value?: string }>;

type CommonsPage = {
  title?: string;
  imageinfo?: Array<{
    thumburl?: string;
    url?: string;
    descriptionurl?: string;
    extmetadata?: CommonsMetadata;
  }>;
};

function commonsEndpoint(keywords: readonly string[]): URL {
  const endpoint = new URL("https://commons.wikimedia.org/w/api.php");
  for (const [key, value] of Object.entries({
    action: "query",
    generator: "search",
    gsrsearch: keywords.join(" "),
    gsrnamespace: "6",
    gsrlimit: "8",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1600",
    format: "json",
  })) {
    endpoint.searchParams.set(key, value);
  }
  return endpoint;
}

export async function resolveMotivationMedia({
  source,
  category,
  country,
  fetchImpl = fetch,
}: {
  source: MotivationPersonalization;
  category: GoalCategory;
  country?: string;
  fetchImpl?: typeof fetch;
}): Promise<MotivationMedia> {
  const safeCountry = normalizeMotivationCountry(country);
  const fallback = fallbackMotivationMedia(source, category, safeCountry);
  const keywords = getMotivationKeywords(source, category, safeCountry);
  let image: Pick<MotivationMedia, "imageUrl" | "imageAlt" | "attribution" | "sourceUrl" | "provider"> = {};
  let quote: Pick<MotivationMedia, "quote" | "quoteAuthor"> = fallback;

  try {
    const response = await fetchImpl(commonsEndpoint(keywords), {
      signal: AbortSignal.timeout(4500),
      headers: { Accept: "application/json" },
    });
    if (response.ok) {
      const payload = (await response.json()) as { query?: { pages?: Record<string, CommonsPage> } };
      const page = Object.values(payload.query?.pages ?? {}).find((item) => item.imageinfo?.[0]);
      const info = page?.imageinfo?.[0];
      const imageUrl = safeHttpsUrl(info?.thumburl ?? info?.url);
      if (page && info && imageUrl) {
        const metadata = info.extmetadata ?? {};
        const artist = textValue(metadata.Artist?.value) ?? textValue(metadata.Credit?.value);
        const license = textValue(metadata.LicenseShortName?.value);
        image = {
          imageUrl,
          imageAlt: textValue(metadata.ImageDescription?.value) ?? textValue(page.title) ?? `${keywords[0]} motivation image`,
          attribution: ["Wikimedia Commons", artist, license].filter(Boolean).join(" · "),
          sourceUrl: safeHttpsUrl(info.descriptionurl),
          provider: "Wikimedia Commons",
        };
      }
    }
  } catch {
    image = {};
  }

  try {
    const response = await fetchImpl("https://zenquotes.io/api/random", {
      signal: AbortSignal.timeout(4500),
      headers: { Accept: "application/json" },
    });
    if (response.ok) {
      const payload = (await response.json()) as Array<{ q?: string; a?: string }>;
      const item = payload[0];
      if (item?.q?.trim()) quote = { quote: item.q.trim(), quoteAuthor: item.a?.trim() || "Zen Quotes" };
    }
  } catch {
    quote = fallback;
  }

  return {
    ...fallback,
    ...quote,
    ...image,
    imageUrl: safeHttpsUrl(image.imageUrl),
    destinationKey: safeCountry,
    fetchedAt: Date.now(),
  };
}
