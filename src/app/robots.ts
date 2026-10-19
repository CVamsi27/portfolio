import type { MetadataRoute } from "next";
import { PORTFOLIO_ORIGIN } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${PORTFOLIO_ORIGIN}/sitemap.xml`,
    host: PORTFOLIO_ORIGIN,
  };
}
