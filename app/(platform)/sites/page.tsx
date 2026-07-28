import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { SiteMap } from "@/components/sections/SiteMap";
import { Card } from "@/components/ui/Card";
import { CoordinateTag } from "@/components/ui/CoordinateTag";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LineReveal } from "@/components/ui/LineReveal";
import { Reveal } from "@/components/ui/Reveal";
import { SITES } from "@/data/sites";
import { SITES_PAGE } from "@/data/sitesPage";

export const metadata: Metadata = {
  title: "Dark-sky sites / Suhail",
  description:
    "The four DarkSky-certified reserves around AlUla, mapped, with what each one's terrain and horizon suit it for.",
};

/* The map is a client leaf inside a server page. Nothing here changes by the
   hour, so this can stay static. */

const PRECISION_NOTE: Record<string, string> = {
  approximate: "Approximate location",
  unsourced: "Location not yet sourced",
};

export default function Sites() {
  return (
    <section className="pb-24 pt-[var(--section-top)]">
      <Shell>
        <div className="max-w-[52ch]">
          <Reveal>
            <Eyebrow className="mb-7">{SITES_PAGE.eyebrow}</Eyebrow>
          </Reveal>
          <LineReveal as="h1" lines={SITES_PAGE.headingLines} className="text-h2" />
          <Reveal delay={90}>
            <p className="mt-6 text-neutral-700">{SITES_PAGE.sub}</p>
          </Reveal>
        </div>

        <Reveal delay={150}>
          <SiteMap sites={SITES} className="mt-12 h-[420px] lg:h-[520px]" />
        </Reveal>

        {/* Section 9: a site whose coordinate is not sourced is still listed
            and still linked. It is only the map pin that is withheld, because
            a pin is a claim about where to drive. */}
        <p className="mt-4 font-display text-label uppercase tracking-label text-neutral-700">
          Wadi Nakhlah is listed below but not plotted. Its coordinate is not published yet.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {SITES.map((site, i) => (
            <Reveal key={site.slug} delay={i * 70}>
            <Card lift>
              <div className="flex items-start justify-between gap-4">
                {/* min-w-0: a flex child's default min-width is its content
                    width, so without this the longest site name (AlGharameel
                    Nature Reserve) refused to shrink below that and pushed the
                    shrink-0 badge past the viewport edge on a phone. */}
                <h2 className="min-w-0 text-2xl">{site.name}</h2>
                {site.coordinatePrecision !== "sourced" ? (
                  <span className="shrink-0 font-display text-label uppercase tracking-label text-accent-700">
                    {PRECISION_NOTE[site.coordinatePrecision]}
                  </span>
                ) : null}
              </div>
              <CoordinateTag
                className="mt-3"
                items={[
                  `${site.lat.toFixed(2)}°N`,
                  `${site.lng.toFixed(2)}°E`,
                  ...(site.elevationM ? [`${site.elevationM}M`] : []),
                  "DARKSKY PARK",
                ]}
              />
              <p className="mt-4 text-neutral-700">{site.description}</p>
              <Link
                href={`/sites/${site.slug}`}
                className="mt-5 inline-block font-display text-label uppercase tracking-label text-accent-700 underline underline-offset-4"
              >
                View site
              </Link>
            </Card>
            </Reveal>
          ))}
        </div>
      </Shell>
    </section>
  );
}
