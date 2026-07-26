"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SkyPip } from "@/components/ui/SkyPip";
import { SiteMap } from "@/components/sections/SiteMap";
import { cn, focusRing } from "@/lib/cn";
import { dateKey, parseDateKey, skyQuality, upcomingNights, type SkyQuality } from "@/lib/astro";
import { EXPERIENCE_IMAGES } from "@/data/home";
import { SITES } from "@/data/sites";
import type { CatalogExperience } from "@/lib/catalog";

/* PAGE_COMPOSITION_BRIEF: the homepage is live inventory.
 *
 * Every control here is real. The date scope filters against the actual
 * availability rows the catalogue carries, and the four sorts run on real
 * schema fields: the night's computed sky quality, duration_min, group_max
 * and price_sar. The brief allowed shipping the last four as visually
 * present but inert, flagged with a TODO. That would have put four dead
 * controls on the busiest surface in the product, so they are wired instead:
 * a sort over data already in hand is cheaper than a convincing stub.
 *
 * What is deliberately absent is a start time on the cards. The mockup shows
 * one, the schema has no such column, and the operator listings do not
 * publish it. Duration is real, so duration is what a card shows.
 */

type Scope = "tonight" | "week" | "date";
type Sort = "sky" | "duration" | "group" | "price";

const SORTS: { id: Sort; label: string }[] = [
  { id: "sky", label: "Sky quality" },
  { id: "duration", label: "Duration" },
  { id: "group", label: "Group size" },
  { id: "price", label: "Price" },
];

const QUALITY_RANK: Record<SkyQuality, number> = { prime: 0, ok: 1, bright: 2 };

const DAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** An experience paired with the specific night it is being offered for. */
type Offer = { experience: CatalogExperience; night: string; quality: SkyQuality };

export function ExperienceBoard({
  experiences,
  error,
}: {
  experiences: CatalogExperience[];
  error: string | null;
}) {
  const nights = useMemo(() => upcomingNights(60).map(dateKey), []);
  const [scope, setScope] = useState<Scope>("tonight");
  const [chosen, setChosen] = useState<string>(nights[0]);
  const [sort, setSort] = useState<Sort>("sky");

  const window = useMemo(() => {
    if (scope === "tonight") return [nights[0]];
    if (scope === "week") return nights.slice(0, 7);
    return [chosen];
  }, [scope, chosen, nights]);

  const offers = useMemo(() => {
    const out: Offer[] = [];
    for (const experience of experiences) {
      /* the earliest night inside the window this one actually runs */
      const night = window.find((d) => experience.dates.includes(d));
      if (!night) continue;
      out.push({ experience, night, quality: skyQuality(parseDateKey(night)) });
    }
    out.sort((a, b) => {
      if (sort === "sky") return QUALITY_RANK[a.quality] - QUALITY_RANK[b.quality];
      if (sort === "duration") return (a.experience.durationMin ?? 0) - (b.experience.durationMin ?? 0);
      if (sort === "group") return (b.experience.groupMax ?? 0) - (a.experience.groupMax ?? 0);
      return (a.experience.priceSar ?? Infinity) - (b.experience.priceSar ?? Infinity);
    });
    return out;
  }, [experiences, window, sort]);

  const siteCount = new Set(offers.map((o) => o.experience.site.slug)).size;

  return (
    <>
      {/* the live count, recomputed from what is actually on screen */}
      <p className="mt-5 font-display text-label font-bold uppercase tracking-label text-neutral-700">
        <span className="text-accent-700">{offers.length}</span>{" "}
        {offers.length === 1 ? "experience" : "experiences"}{" "}
        <span className="text-accent-600">&middot;</span>{" "}
        <span className="text-accent-700">{siteCount}</span>{" "}
        {siteCount === 1 ? "site" : "sites"} <span className="text-accent-600">&middot;</span>{" "}
        sorted by {SORTS.find((s) => s.id === sort)!.label.toLowerCase()}
      </p>

      <div className="mt-6 flex flex-col gap-px border-y-2 border-text bg-divider md:flex-row md:items-stretch">
        <div className="flex bg-bg">
          {(
            [
              ["tonight", "Tonight"],
              ["week", "This week"],
              ["date", "Pick a date"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setScope(id)}
              aria-pressed={scope === id}
              className={cn(
                "px-4 py-3 font-display text-label font-bold uppercase tracking-label transition-colors duration-150",
                focusRing,
                scope === id ? "bg-text text-bg" : "text-neutral-700 hover:text-text",
              )}
            >
              {label}
            </button>
          ))}
          {scope === "date" ? (
            <label className="flex items-center gap-2 px-4 py-3">
              <span className="sr-only">Choose a night</span>
              <select
                value={chosen}
                onChange={(e) => setChosen(e.target.value)}
                className={cn(
                  "border-2 border-divider bg-bg px-2 py-1 font-display text-label font-bold uppercase tracking-label",
                  focusRing,
                )}
              >
                {nights.map((n) => (
                  <option key={n} value={n}>
                    {DAY.format(parseDateKey(n))}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <div className="flex flex-1 flex-wrap bg-bg md:justify-end">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSort(s.id)}
              aria-pressed={sort === s.id}
              className={cn(
                "flex items-center gap-2 px-4 py-3 font-display text-label font-bold uppercase tracking-label transition-colors duration-150",
                focusRing,
                sort === s.id ? "text-text" : "text-neutral-600 hover:text-text",
              )}
            >
              {sort === s.id ? <span aria-hidden className="h-2 w-2 bg-accent" /> : null}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div>
          {error ? (
            <p className="max-w-[52ch] text-neutral-700">
              The catalogue could not be loaded, so there is nothing to show. This is a real
              error, not an empty night.
              <span className="mt-2 block font-display text-label font-bold uppercase tracking-label text-accent-2-700">
                {error}
              </span>
            </p>
          ) : offers.length === 0 ? (
            <p className="max-w-[52ch] text-neutral-700">
              Nothing is running on{" "}
              {scope === "tonight"
                ? "tonight"
                : scope === "week"
                  ? "any night this week"
                  : DAY.format(parseDateKey(chosen))}
              . Try a wider window.
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2">
              {offers.map((offer, i) => (
                <ExperienceCard key={offer.experience.id} offer={offer} rank={i + 1} />
              ))}
            </ul>
          )}
        </div>

        {/* Stage 6's map, placed rather than rebuilt: the approximate-marker
            and withheld-site conventions come with it unchanged. */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SiteMap sites={SITES} className="h-[420px] lg:h-[560px]" />
          <p className="mt-3 font-display text-label font-bold uppercase tracking-label text-neutral-600">
            Wadi Nakhlah is not plotted. Its coordinate is not published yet.
          </p>
        </div>
      </div>
    </>
  );
}

function ExperienceCard({ offer, rank }: { offer: Offer; rank: number }) {
  const { experience, night, quality } = offer;
  const image = EXPERIENCE_IMAGES[experience.slug];

  return (
    <li className="flex flex-col bg-surface">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-300">
        {image ? (
          /* PLACEHOLDER — replace with real, sourced AlUla/site photography before demo */
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 100vw"
            className="object-cover"
          />
        ) : null}

        <span className="absolute left-0 top-0 bg-text px-2.5 py-1 font-display text-label font-bold text-bg">
          {rank}
        </span>

        {/* The mockup badges a Bortle number here. data/sites.ts records that
            value as inferred from certification with no published per-site
            reading, so the badge carries the sky quality instead, which is
            computed from the moon and is real for this night.

            Top right, opposite the rank: the bottom edge belongs to the
            placeholder label, and the two were overlapping there. */}
        <span className="absolute right-0 top-0 flex items-center bg-bg px-2.5 py-1">
          <SkyPip quality={quality} />
        </span>

        <span className="absolute inset-x-0 bottom-0 truncate bg-text/85 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-label text-bg">
          Placeholder image, not {experience.site.name}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="font-display text-label font-bold uppercase tracking-label text-accent-700">
          {experience.site.name}
          {experience.durationMin ? (
            <>
              <span className="text-accent-600"> &middot; </span>
              {Math.round(experience.durationMin / 60)}h
            </>
          ) : null}
          <span className="text-accent-600"> &middot; </span>
          {DAY.format(parseDateKey(night))}
        </p>

        <h3 className="mt-2 text-h4">{experience.title}</h3>

        <div className="mt-4 flex flex-1 items-end justify-between gap-4 border-t-2 border-divider pt-4">
          <p className="font-display text-label font-bold uppercase tracking-label text-neutral-700">
            {experience.operatorName}
          </p>
          <p className="whitespace-nowrap font-display text-h5 font-extrabold">
            SAR {experience.priceSar}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <Button href={`/book/${experience.id}?date=${night}`} size="sm">
            Book this night
          </Button>
          <Link
            href={`/sites/${experience.site.slug}`}
            className={cn(
              "font-display text-label font-bold uppercase tracking-label text-accent-700 underline underline-offset-4",
              focusRing,
            )}
          >
            Site
          </Link>
        </div>
      </div>
    </li>
  );
}
