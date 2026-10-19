import type { MetadataRoute } from "next";
import { CASE_STUDIES } from "@/lib/case-studies";

/** The public portfolio origin. Case studies live at `/work/[slug]` below it. */
const PORTFOLIO_ORIGIN = "https://buildora.work";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${PORTFOLIO_ORIGIN}/`,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...CASE_STUDIES.map((study) => ({
      url: `${PORTFOLIO_ORIGIN}/work/${study.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
