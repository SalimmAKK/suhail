import type { MetadataRoute } from "next";

/* /operators is unlinked from public nav per CLAUDE.md rule 2.4/17 already;
   disallowing it here is the same decision applied to crawlers, not a second
   gate — the route itself stays reachable for the demo. /api holds the
   booking-lookup route, which has nothing for a crawler to index and no
   reason to be hit repeatedly. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/operators", "/api"],
    },
    sitemap: "/sitemap.xml",
  };
}
