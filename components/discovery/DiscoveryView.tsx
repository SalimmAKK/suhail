"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExperienceCard } from "@/components/discovery/ExperienceCard";
import { FilterChips, type ChipDef } from "@/components/discovery/FilterChips";
import { MapPanel } from "@/components/map/MapPanel";
import { NightGrid } from "@/components/ui/NightGrid";
import { Reveal } from "@/components/ui/Reveal";
import { useFavourites } from "@/lib/useFavourites";
import { CATEGORY_LABEL, type ExperienceCategory } from "@/data/experiences";
import { parseDateKey, shortDateWithDay, skyQuality } from "@/lib/astro";
import { toPins, type ListItem } from "@/lib/present";
import { cn, focusRing } from "@/lib/cn";

/* The discovery view: the list on the left, the live map on the right.
 *
 * Every chip in the strip changes the list. The mock draws seven with only the
 * first engaged, so the resting state here is identical to it; what differs is
 * that the last three name their constraint once they are on, because a toggle
 * labelled "Duration" that is either on or off does not tell a traveller what
 * it just did to their results.
 *
 * Hovering a card lights its site's pin, and clicking a pin filters the list
 * to that site. That is the two-way link the handoff asks for, and it is the
 * only reason this view holds state at all.
 */

const CHIPS: ChipDef[] = [
  { id: "tonight", label: "Tonight" },
  { id: "week", label: "This week" },
  { id: "date", label: "Pick a date" },
  { id: "quality", label: "Sky quality", dot: true },
  { id: "duration", label: "Duration" },
  { id: "group", label: "Group size" },
  { id: "price", label: "Price" },
];

/* What each of the three value chips says once it is doing something. */
const ENGAGED_LABEL: Record<string, string> = {
  duration: "Under 3h",
  group: "Small group",
  price: "Under SAR 400",
};

export function DiscoveryView({
  items,
  nights,
  headline,
  eyebrow,
  sub,
  siteCount,
  error,
}: {
  items: ListItem[];
  /** the sixty date keys the picker offers, fixed on the server */
  nights: string[];
  headline: string;
  eyebrow: string;
  sub: string;
  siteCount: number;
  error: string | null;
}) {
  const [active, setActive] = useState<Set<string>>(new Set(["tonight"]));
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [hoveredSite, setHoveredSite] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [category, setCategory] = useState<ExperienceCategory | null>(null);
  const [query, setQuery] = useState("");
  const { favourites, toggle } = useFavourites();

  function toggleChip(id: string) {
    setActive((prev) => {
      const next = new Set(prev);
      /* the three date scopes are one choice, not three */
      if (id === "tonight" || id === "week" || id === "date") {
        next.delete("tonight");
        next.delete("week");
        next.delete("date");
        if (!prev.has(id)) next.add(id);
        if (id !== "date") setPickedDate(null);
      } else if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const scope = active.has("date") ? pickedDate : null;

  const filtered = useMemo(() => {
    const tonight = nights[0];
    const week = new Set(nights.slice(0, 7));

    return items.filter((item) => {
      if (active.has("tonight") && !item.dates.includes(tonight)) return false;
      if (active.has("week") && !item.dates.some((d) => week.has(d))) return false;
      if (scope && !item.dates.includes(scope)) return false;

      /* Sky quality: the nights this experience runs on that are actually
         dark. Computed from the moon, the same way the picker colours cells. */
      if (active.has("quality")) {
        const anyPrime = item.dates.some((d) => skyQuality(parseDateKey(d)) === "prime");
        if (!anyPrime) return false;
      }

      if (active.has("duration") && (item.durationMin === null || item.durationMin > 180)) return false;
      if (active.has("group") && (item.groupMax === null || item.groupMax > 4)) return false;
      if (active.has("price") && (item.priceSar === null || item.priceSar >= 400)) return false;

      if (selectedSite && item.siteSlug !== selectedSite) return false;
      if (category && item.category !== category) return false;

      if (query.trim()) {
        const hay = `${item.title} ${item.siteName} ${item.operatorName}`.toLowerCase();
        if (!hay.includes(query.trim().toLowerCase())) return false;
      }

      return true;
    });
  }, [items, active, scope, nights, selectedSite, category, query]);

  /* Only the categories the catalogue actually holds. A chip with nothing
     behind it is a dead control. */
  const categories = useMemo(() => {
    const seen = new Set<ExperienceCategory>();
    for (const item of items) if (item.category) seen.add(item.category);
    return [...seen].sort();
  }, [items]);

  /* Pins come from every experience, not the filtered list: a map that
     deletes its pins as you filter loses the geography that makes it useful.
     The selected site is what the pin styling reflects. */
  const pins = useMemo(() => toPins(items), [items]);

  const chips = CHIPS.map((chip) =>
    active.has(chip.id) && ENGAGED_LABEL[chip.id]
      ? { ...chip, label: ENGAGED_LABEL[chip.id] }
      : chip,
  );

  return (
    <div className="grid h-[calc(100vh-var(--topbar-h))] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_620px]">
      {/* The whole column scrolls, not just the card grid.

          It used to be the other way round: the header and the filter strips
          sat outside the scroll container and only the grid was scrollable,
          which meant the wheel did nothing unless the pointer happened to be
          over the cards. The chrome is inside the scroller now and pinned with
          sticky, so it holds exactly the position it held before while every
          part of the column accepts a scroll. */}
      {/* data-lenis-prevent: Lenis runs at the root and takes the wheel
          for the whole document. On a view whose document never scrolls,
          that left every nested scroller inert. The attribute hands wheel
          events inside this column back to the browser. */}
      <div
        data-lenis-prevent
        className="min-h-0 overflow-y-auto border-divider xl:border-r-2"
      >
        <div className="sticky top-0 z-20 bg-bg">
        <div className="border-b-2 border-divider px-7 pb-4 pt-6">
          <p className="tnum text-[11px] uppercase tracking-[0.14em] text-accent-700">{eyebrow}</p>
          <h1 className="mt-1.5 font-display text-[34px] font-extrabold leading-[1.05] tracking-[-0.02em]">
            {headline}
          </h1>
          <p className="mt-1 text-[13px] text-text/65">{sub}</p>
          <div className="mt-3 flex flex-wrap items-baseline gap-4">
            <span className="font-display text-[15px] font-extrabold">
              <strong className="font-extrabold text-accent-700">{filtered.length}</strong>{" "}
              {filtered.length === 1 ? "experience" : "experiences"}
              {" · "}
              <strong className="font-extrabold text-accent-700">{siteCount}</strong> sites
            </span>
            <span className="text-[11px] uppercase tracking-[0.08em] text-text/60">
              Sorted by price
            </span>
          </div>
        </div>

        <FilterChips chips={chips} active={active} onToggle={toggleChip} />

        {/* A second axis the mock does not draw, and the one the catalogue
            most needs now that it spans nineteen products: a night with a
            telescope and a night with a fire are not the same purchase. Gold
            outlines rather than another strip of ink, so it reads as a
            refinement of the row above and not a second primary control. */}
        {categories.length > 1 ? (
          <div
            className="flex flex-wrap items-center gap-2 border-b-2 border-divider bg-surface/40 px-7 py-2.5"
            role="group"
            aria-label="Filter by experience type"
          >
            <span className="mr-1 text-[10px] uppercase tracking-[0.14em] text-text/50">Type</span>
            {categories.map((c) => {
              const on = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(on ? null : c)}
                  aria-pressed={on}
                  className={cn(
                    "border px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.1em]",
                    "transition-colors duration-150 ease-move",
                    focusRing,
                    on
                      ? "border-accent bg-accent text-text"
                      : "border-accent/45 text-accent-700 hover:border-accent hover:bg-accent/12",
                  )}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              );
            })}
          </div>
        ) : null}
        </div>

        {/* Outside the sticky block on purpose. Sixty date cells pinned to the
            top of the column would leave almost nothing for the results. */}
        {/* The picker panel: the same sixty cells /tonight shows, opened from
            the chip rather than duplicated. */}
        {active.has("date") ? (
          <div className="border-b-2 border-divider px-7 py-5">
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-text/65">
                {pickedDate
                  ? `Showing ${shortDateWithDay(parseDateKey(pickedDate))}`
                  : "Pick one of the next sixty nights"}
              </p>
              <Link
                href="/tonight"
                className={cn(
                  "text-[11px] uppercase tracking-[0.08em] text-accent-700 underline underline-offset-4 hover:text-text",
                  focusRing,
                )}
              >
                See the full sky for a night
              </Link>
            </div>
            <NightGrid
              nights={nights}
              selected={pickedDate}
              onSelect={setPickedDate}
              columns={12}
              showLegend={false}
            />
          </div>
        ) : null}

        {selectedSite ? (
          <div className="flex items-center justify-between gap-4 border-b-2 border-divider px-7 py-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-text/65">
              Filtered to {items.find((i) => i.siteSlug === selectedSite)?.siteName ?? selectedSite}
            </p>
            <button
              type="button"
              onClick={() => setSelectedSite(null)}
              className={cn(
                "font-display text-[11px] font-bold uppercase tracking-[0.08em] text-accent-700 hover:text-text",
                focusRing,
              )}
            >
              Clear
            </button>
          </div>
        ) : null}

        <div className="px-7 pb-7 pt-5">
          {error ? (
            <p className="max-w-[52ch] border-2 border-divider p-5 text-[13px] text-text/70">
              {error}
            </p>
          ) : filtered.length === 0 ? (
            <p className="max-w-[52ch] border-2 border-divider p-5 text-[13px] text-text/70">
              Nothing matches those filters on the nights in range. Clear one and the list fills
              back in.
            </p>
          ) : (
            <div className="grid grid-cols-1 content-start gap-5 md:grid-cols-2">
              {/* Staggered 70ms apart, capped after the eighth card so a
                  large filtered set still settles in well under a second
                  rather than trailing off for the rows near the bottom. */}
              {filtered.map((item, i) => (
                <Reveal key={item.id} delay={Math.min(i, 8) * 70}>
                  <ExperienceCard
                    item={item}
                    rank={i + 1}
                    favourite={favourites.has(item.id)}
                    onToggleFavourite={toggle}
                    onHover={setHoveredSite}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>

      <MapPanel
        className="hidden xl:block"
        pins={pins}
        searchValue={query}
        onSearchChange={setQuery}
        focusedPinId={selectedSite ?? hoveredSite}
        onSelectPin={(id) => setSelectedSite((s) => (s === id ? null : id))}
        legendTitle={`Live sky · ${eyebrow.split("·")[1]?.trim() ?? "tonight"}`}
        /* The mock's third row is a dashed reserve boundary. data/sites.ts
           holds no boundary polygons for the four reserves, so the map does
           not draw one and the legend does not claim it does. */
        legendRows={[
          { swatch: "var(--color-accent)", label: `Bookable tonight (${filtered.length})` },
          { swatch: "var(--color-neutral-400)", label: "Elevation / terrain" },
        ]}
      />
    </div>
  );
}
