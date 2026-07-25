import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CoordinateTag } from "@/components/ui/CoordinateTag";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LineReveal } from "@/components/ui/LineReveal";
import { Reveal } from "@/components/ui/Reveal";
import { StarChart } from "@/components/sections/StarChart";
import { AmbientStars } from "@/components/ui/AmbientStars";
import { SITES, siteBySlug } from "@/data/sites";
import { getCatalog } from "@/lib/catalog";
import { dateKey, upcomingNights } from "@/lib/astro";

/* Per-site detail. The chart here is the same sky as the hero's, read with
   this site's emphasis: constellations serving its targets at full weight,
   the rest receding. See StarChart's `highlight`.

   Revalidated hourly rather than force-dynamic: the four pages are otherwise
   static, but the chart and the experience list both move with the date, and
   a permanently cached page would show a stale sky. */
export const revalidate = 3600;

export function generateStaticParams() {
  return SITES.map((site) => ({ slug: site.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = siteBySlug(slug);
  if (!site) return { title: "Site not found / Suhail" };
  return {
    title: `${site.name} / Suhail`,
    description: site.description,
  };
}

export default async function SiteDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = siteBySlug(slug);
  if (!site) notFound();

  const nights = upcomingNights(60).map(dateKey);
  const { experiences, error } = await getCatalog(nights[0], nights[nights.length - 1]);
  const here = experiences.filter((e) => e.site.slug === site.slug);

  return (
    <>
      <section className="relative overflow-hidden bg-ink pb-20 pt-[var(--nav-clearance)]" data-nav-tone="ink">
        <AmbientStars tone="ink" className="lg:right-[46%]" />
        <Shell className="relative">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <Reveal>
                <Eyebrow tone="light" className="mb-7">
                  Dark-sky site
                </Eyebrow>
              </Reveal>
              <LineReveal as="h1" lines={[site.name]} className="text-pull text-moon" />
              <Reveal delay={90}>
                <CoordinateTag
                  tone="light"
                  className="mt-6"
                  items={[
                    `${site.lat.toFixed(3)}°N`,
                    `${site.lng.toFixed(3)}°E`,
                    ...(site.elevationM ? [`ELEVATION ${site.elevationM}M`] : []),
                    ...(site.bortleClass ? [`BORTLE ${site.bortleClass}`] : []),
                  ]}
                />
              </Reveal>
              <Reveal delay={150}>
                <p className="mt-7 max-w-[46ch] text-moon/70">{site.description}</p>
              </Reveal>
              <Reveal delay={210}>
                <p className="mt-6 font-mono text-label uppercase tracking-label text-gold">
                  Best for {site.bestFor.join(" · ").replace(/-/g, " ")}
                </p>
              </Reveal>
            </div>

            <div className="relative">
              <StarChart date={new Date()} tone="ink" highlight={site.bestFor} />
              <p className="mt-3 text-center font-mono text-label uppercase tracking-label text-moon/45">
                Tonight at 21:00, with this site&rsquo;s targets picked out
              </p>
            </div>
          </div>
        </Shell>
      </section>

      <section className="pb-24 pt-16">
        <Shell>
          {/* Rule 12: what this project could not source stays on the page. */}
          {site.verify.length > 0 ? (
            <div className="border-l-2 border-attention pl-5">
              <p className="font-mono text-label uppercase tracking-label text-muted">
                Not yet verified
              </p>
              <ul className="mt-3 space-y-2">
                {site.verify.map((note) => (
                  <li key={note} className="max-w-[64ch] text-[15px] text-muted">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <h2 className="mt-14 text-3xl">
            {here.length > 0 ? "Running here" : "Nothing bookable here yet"}
          </h2>

          {error ? (
            <p className="mt-4 max-w-[52ch] text-muted">
              The catalogue could not be loaded, so we cannot say what runs here.
              <span className="mt-2 block font-mono text-label uppercase tracking-label text-attention">
                {error}
              </span>
            </p>
          ) : here.length === 0 ? (
            <p className="mt-4 max-w-[52ch] text-muted">
              No operator currently lists a dark-sky experience at {site.name}. When one does, it
              will appear here rather than being invented to fill the space.
            </p>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {here.map((experience) => (
                <Card key={experience.id} lift>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-2xl">{experience.title}</h3>
                    <p className="shrink-0 font-mono text-label uppercase tracking-label text-muted">
                      SAR {experience.priceSar}
                    </p>
                  </div>
                  <CoordinateTag
                    className="mt-3"
                    items={[
                      experience.operatorName.toUpperCase(),
                      ...(experience.durationMin
                        ? [`${Math.round(experience.durationMin / 60)}H`]
                        : []),
                      `MIN ${experience.groupMin}`,
                    ]}
                  />
                  {experience.description ? (
                    <p className="mt-4 text-muted">{experience.description}</p>
                  ) : null}
                  <Button href="/tonight" size="sm" className="mt-5">
                    Pick a night for this
                  </Button>
                </Card>
              ))}
            </div>
          )}

          <Link
            href="/sites"
            className="mt-14 inline-block font-mono text-label uppercase tracking-label text-gold-deep underline underline-offset-4"
          >
            All four sites
          </Link>
        </Shell>
      </section>
    </>
  );
}
