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

export type MotivationVisual = {
  imageUrl?: string;
  imageAlt?: string;
  attribution?: string;
  sourceUrl?: string;
  provider?: string;
  isFallback?: boolean;
};

export type MotivationMedia = MotivationVisual & {
  destinationKey?: string;
  categoryLabel?: string;
  rationale?: string;
  quote: string;
  quoteAuthor?: string;
  fetchedAt: number;
  imageOptions?: MotivationVisual[];
};

const CATEGORY_KEYWORDS: Record<GoalCategory, readonly string[]> = {
  general: ["focus", "resilience", "progress"],
  relocation: ["journey", "horizon", "city"],
  fitness: ["movement", "strength", "training"],
  weightloss: ["healthy meal", "morning walk", "wellness"],
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
const NON_PHOTOGRAPHIC_HINTS = [
  "book",
  "scan",
  "scanned",
  "illustration",
  "engraving",
  "drawing",
  "map",
  "poster",
  "logo",
  "page",
  "manuscript",
] as const;

const FALLBACK_VISUALS: Record<string, MotivationVisual> = {
  general: {
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85",
    imageAlt: "Sunlit mountain landscape opening toward a clear horizon",
    attribution: "Unsplash",
    sourceUrl: "https://unsplash.com/s/photos/mountain-landscape",
    provider: "Unsplash",
  },
  relocation: {
    imageUrl: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1800&q=85",
    imageAlt: "European city architecture in warm evening light",
    attribution: "Unsplash",
    sourceUrl: "https://unsplash.com/s/photos/europe-city",
    provider: "Unsplash",
  },
  fitness: {
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1800&q=85",
    imageAlt: "Athlete training in a focused gym environment",
    attribution: "Unsplash",
    sourceUrl: "https://unsplash.com/s/photos/fitness-training",
    provider: "Unsplash",
  },
  weightloss: {
    imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1800&q=85",
    imageAlt: "Colorful fresh meal prepared for a sustainable health routine",
    attribution: "Unsplash",
    sourceUrl: "https://unsplash.com/s/photos/healthy-meal",
    provider: "Unsplash",
  },
  career: {
    imageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=85",
    imageAlt: "Bright studio workspace prepared for focused work",
    attribution: "Unsplash",
    sourceUrl: "https://unsplash.com/s/photos/focused-workspace",
    provider: "Unsplash",
  },
  learning: {
    imageUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1800&q=85",
    imageAlt: "Open books on a library table ready for study",
    attribution: "Unsplash",
    sourceUrl: "https://unsplash.com/s/photos/study-books",
    provider: "Unsplash",
  },
  financial: {
    imageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=85",
    imageAlt: "People collaborating around a table on a shared plan",
    attribution: "Unsplash",
    sourceUrl: "https://unsplash.com/s/photos/planning-together",
    provider: "Unsplash",
  },
  custom: {
    imageUrl: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1800&q=85",
    imageAlt: "Quiet lake and mountains suggesting patient progress",
    attribution: "Unsplash",
    sourceUrl: "https://unsplash.com/s/photos/mountain-lake",
    provider: "Unsplash",
  },
};

const DESTINATION_FALLBACK_VISUALS: Partial<Record<MotivationCountry, MotivationVisual>> = {
  Germany: {
    imageUrl: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1800&q=85",
    imageAlt: "European city architecture in warm evening light",
    attribution: "Unsplash",
    sourceUrl: "https://unsplash.com/s/photos/berlin-germany",
    provider: "Unsplash",
  },
};

const CATEGORY_ROTATION_IMAGES: Record<GoalCategory, readonly string[]> = {
  general: [
    FALLBACK_VISUALS.general.imageUrl!,
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1800&q=85",
  ],
  relocation: [
    FALLBACK_VISUALS.relocation.imageUrl!,
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1800&q=85",
  ],
  fitness: [
    FALLBACK_VISUALS.fitness.imageUrl!,
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1800&q=85",
  ],
  weightloss: [
    FALLBACK_VISUALS.weightloss.imageUrl!,
    "https://images.unsplash.com/photo-1498837167922-ddd27525d0d8?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1505576399279-3dc29d42c22e?auto=format&fit=crop&w=1800&q=85",
  ],
  career: [
    FALLBACK_VISUALS.career.imageUrl!,
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1800&q=85",
  ],
  learning: [
    FALLBACK_VISUALS.learning.imageUrl!,
    "https://images.unsplash.com/photo-1521587760476-6c12a4de4e48?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1800&q=85",
  ],
  financial: [
    FALLBACK_VISUALS.financial.imageUrl!,
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=85",
  ],
  custom: [
    FALLBACK_VISUALS.custom.imageUrl!,
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1800&q=85",
  ],
};

const DESTINATION_ROTATION_IMAGES: Partial<Record<MotivationCountry, readonly string[]>> = {
  Germany: [
    DESTINATION_FALLBACK_VISUALS.Germany!.imageUrl!,
    "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1800&q=85",
  ],
};

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

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  general: "General momentum",
  relocation: "Relocation",
  fitness: "Fitness",
  weightloss: "Weight loss",
  career: "Career",
  learning: "Learning",
  financial: "Financial progress",
  custom: "Personal progress",
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

export function getMotivationCategoryLabel(category: GoalCategory, country?: string): string {
  const safeCountry = normalizeMotivationCountry(country);
  return category === "relocation" && safeCountry ? `${safeCountry} relocation` : CATEGORY_LABELS[category];
}

export function getMotivationRationale(
  source: MotivationPersonalization,
  category: GoalCategory,
  country?: string,
): string {
  if (source === "general") return "A grounded scene keeps the next move visible without forcing a goal.";
  const safeCountry = normalizeMotivationCountry(country);
  if (category === "relocation" && safeCountry) return `A real view of ${safeCountry} keeps the next chapter visible.`;
  const label = getMotivationCategoryLabel(category, country).toLowerCase();
  return `A realistic ${label} scene gives today’s next move a place to land.`;
}

export function fallbackMotivationMedia(
  source: MotivationPersonalization,
  category: GoalCategory,
  country?: string,
): MotivationMedia {
  const keywords = getMotivationKeywords(source, category, country);
  const quote = FALLBACK_QUOTES[source][keywords.length % FALLBACK_QUOTES[source].length];
  const safeCountry = normalizeMotivationCountry(country);
  const visual = category === "relocation" && safeCountry
    ? DESTINATION_FALLBACK_VISUALS[safeCountry] ?? FALLBACK_VISUALS.relocation
    : FALLBACK_VISUALS[category] ?? FALLBACK_VISUALS.custom;
  const rotationImages = (category === "relocation" && safeCountry ? DESTINATION_ROTATION_IMAGES[safeCountry] : undefined)
    ?? CATEGORY_ROTATION_IMAGES[category]
    ?? CATEGORY_ROTATION_IMAGES.custom;
  const imageOptions = rotationImages
    .filter((imageUrl) => imageUrl && imageUrl !== visual.imageUrl)
    .map((imageUrl, index) => ({
      ...visual,
      imageUrl,
      imageAlt: `${visual.imageAlt ?? "Motivation scene"} — alternate ${index + 1}`,
      isFallback: true,
    }));
  return {
    ...visual,
    isFallback: true,
    imageOptions,
    categoryLabel: getMotivationCategoryLabel(category, safeCountry),
    rationale: getMotivationRationale(source, category, safeCountry),
    quote,
    quoteAuthor: "NOVA",
    destinationKey: safeCountry,
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

function imageAltFor(page: CommonsPage, metadata: CommonsMetadata, keyword: string): string {
  const candidate = textValue(metadata.ObjectName?.value) ?? textValue(page.title) ?? `${keyword} motivation image`;
  return candidate.replace(/^File:\s*/i, "").slice(0, 160);
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
    gsrsearch: [...keywords, "photograph"].join(" "),
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

function looksLikePhotograph(page: CommonsPage, metadata: CommonsMetadata): boolean {
  const searchable = [
    page.title,
    metadata.ImageDescription?.value,
    metadata.ObjectName?.value,
    metadata.Categories?.value,
    metadata.Credit?.value,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/<[^>]*>/g, " ")
    .toLowerCase();
  return !NON_PHOTOGRAPHIC_HINTS.some((hint) => searchable.includes(hint));
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
  let image: MotivationVisual = {};
  let quote: Pick<MotivationMedia, "quote" | "quoteAuthor"> = fallback;

  try {
    const response = await fetchImpl(commonsEndpoint(keywords), {
      signal: AbortSignal.timeout(4500),
      headers: { Accept: "application/json" },
    });
    if (response.ok) {
      const payload = (await response.json()) as { query?: { pages?: Record<string, CommonsPage> } };
      for (const page of Object.values(payload.query?.pages ?? {})) {
        const info = page.imageinfo?.[0];
        const imageUrl = safeHttpsUrl(info?.thumburl ?? info?.url);
        const metadata = info?.extmetadata ?? {};
        if (!page || !info || !imageUrl || !looksLikePhotograph(page, metadata)) continue;
        const artist = textValue(metadata.Artist?.value) ?? textValue(metadata.Credit?.value);
        const license = textValue(metadata.LicenseShortName?.value);
        image = {
          imageUrl,
          imageAlt: imageAltFor(page, metadata, keywords[0]),
          attribution: ["Wikimedia Commons", artist, license].filter(Boolean).join(" · "),
          sourceUrl: safeHttpsUrl(info.descriptionurl),
          provider: "Wikimedia Commons",
        };
        break;
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
    imageOptions: [
      ...(image.imageUrl ? [image] : []),
      ...(fallback.imageOptions ?? []),
    ].filter((option, index, options) => option.imageUrl && options.findIndex((candidate) => candidate.imageUrl === option.imageUrl) === index),
    imageUrl: safeHttpsUrl(image.imageUrl),
    destinationKey: safeCountry,
    fetchedAt: Date.now(),
  };
}
