import type { MetadataRoute } from "next";
import { SITES } from "@/data/sites";
import { EXPERIENCES } from "@/data/experiences";

/* Real, indexable content only.
 *
 * /trips shows this device's own bookings and has nothing to say to a
 * crawler; /book/[id] is a step in a flow, not a destination; /operators is
 * excluded in robots.ts already. Everything else here is a page a search
 * result could usefully land someone on. */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPaths: { path: string; changeFrequency: "daily" | "weekly" | "monthly"; priority: number }[] = [
    { path: "/", changeFrequency: "daily", priority: 1 },
    { path: "/discover", changeFrequency: "daily", priority: 0.9 },
    { path: "/tonight", changeFrequency: "daily", priority: 0.8 },
    { path: "/search", changeFrequency: "daily", priority: 0.7 },
    { path: "/sky", changeFrequency: "daily", priority: 0.7 },
    { path: "/sites", changeFrequency: "weekly", priority: 0.6 },
    { path: "/about", changeFrequency: "monthly", priority: 0.4 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.3 },
  ];
  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const siteRoutes: MetadataRoute.Sitemap = SITES.map((site) => ({
    url: `${SITE_URL}/sites/${site.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const experienceRoutes: MetadataRoute.Sitemap = EXPERIENCES.filter((e) => e.active).map(
    (experience) => ({
      url: `${SITE_URL}/experiences/${experience.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.5,
    }),
  );

  return [...staticRoutes, ...siteRoutes, ...experienceRoutes];
}
