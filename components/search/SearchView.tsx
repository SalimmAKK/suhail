"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FilterBar, type FilterCell } from "@/components/search/FilterBar";
import { ResultRow } from "@/components/search/ResultRow";
import { MapPanel } from "@/components/map/MapPanel";
import { CATEGORY_LABEL, type ExperienceCategory } from "@/data/experiences";
import { parseDateKey, shortDateWithDay } from "@/lib/astro";
import { toPins, type ListItem } from "@/lib/present";
import { cn, focusRing } from "@/lib/cn";

/* The search view.
 *
 * Filters live in the URL rather than in component state, so a set of results
 * is a link someone can send. That is the App Router idiom and it costs
 * nothing here: the whole catalogue is already on the client.
 *
 * The map differs from discovery's in one way, per the handoff: the selected
 * result's pin keeps the accent and a pulsing ring, every other pin drops to
 * ink, and a card naming the selected site overlays the top of the map.
 */

type Filters = {
  date: string;
  site: string;
  category: string;
  bortle: string;
  duration: string;
  group: string;
  price: string;
};

const DEFAULTS: Filters = {
  date: "any",
  site: "all",
  category: "all",
  bortle: "any",
  duration: "any",
  group: "any",
  price: "any",
};

export function SearchView({
  items,
  nights,
  siteCount,
  error,
}: {
  items: ListItem[];
  nights: string[];
  siteCount: number;
  error: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [hoveredSite, setHoveredSite] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  /* Memoised on the serialised params: a fresh object each render would
     invalidate the results memo below on every keystroke in the map's search
     box, re-filtering the whole catalogue for nothing. */
  const paramString = params.toString();
  const filters: Filters = useMemo(
    () => {
      const read = new URLSearchParams(paramString);
      return {
        date: read.get("date") ?? DEFAULTS.date,
        site: read.get("site") ?? DEFAULTS.site,
        category: read.get("category") ?? DEFAULTS.category,
        bortle: read.get("bortle") ?? DEFAULTS.bortle,
        duration: read.get("duration") ?? DEFAULTS.duration,
        group: read.get("group") ?? DEFAULTS.group,
        price: read.get("price") ?? DEFAULTS.price,
      };
    },
    [paramString],
  );

  function setFilter(id: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === DEFAULTS[id as keyof Filters]) next.delete(id);
    else next.set(id, value);
    /* scroll: false keeps the results where they are while the list rewrites
       underneath the filter bar */
    router.replace(next.toString() ? `/search?${next}` : "/search", { scroll: false });
  }

  /* Only the categories the catalogue actually holds, so the filter never
     offers a type with nothing behind it. */
  const categories = useMemo(() => {
    const seen = new Set<ExperienceCategory>();
    for (const item of items) if (item.category) seen.add(item.category);
    return [...seen].sort();
  }, [items]);

  const sites = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of items) seen.set(item.siteSlug, item.siteName);
    return [...seen.entries()];
  }, [items]);

  const results = useMemo(
    () =>
      items.filter((item) => {
        if (filters.date !== "any" && !item.dates.includes(filters.date)) return false;
        if (filters.site !== "all" && item.siteSlug !== filters.site) return false;
        if (filters.category !== "all" && item.category !== filters.category) return false;
        if (filters.bortle !== "any") {
          if (item.bortle === null || item.bortle > Number(filters.bortle)) return false;
        }
        if (filters.duration !== "any") {
          if (item.durationMin === null) return false;
          if (filters.duration === "short" && item.durationMin > 180) return false;
          if (filters.duration === "long" && item.durationMin <= 180) return false;
        }
        if (filters.group !== "any") {
          if (item.groupMax === null || item.groupMax < Number(filters.group)) return false;
        }
        if (filters.price !== "any") {
          if (item.priceSar === null || item.priceSar > Number(filters.price)) return false;
        }
        if (query.trim()) {
          const hay = `${item.title} ${item.siteName} ${item.operatorName}`.toLowerCase();
          if (!hay.includes(query.trim().toLowerCase())) return false;
        }
        return true;
      }),
    [items, filters, query],
  );

  /* The focused pin is whatever the list is pointing at: the site filter when
     one is set, otherwise the row under the cursor. */
  const focusedSite = filters.site !== "all" ? filters.site : hoveredSite;
  const focusedName = sites.find(([slug]) => slug === focusedSite)?.[1] ?? null;
  const focusedCount = results.filter((r) => r.siteSlug === focusedSite).length;
  const focusedBortle = items.find((i) => i.siteSlug === focusedSite)?.bortle ?? null;

  const pins = useMemo(() => toPins(items), [items]);

  const cells: FilterCell[] = [
    {
      id: "date",
      label: "Date",
      value: filters.date,
      options: [
        { value: "any", label: "Any night" },
        ...nights.slice(0, 30).map((key) => ({
          value: key,
          label: shortDateWithDay(parseDateKey(key)),
        })),
      ],
    },
    {
      id: "site",
      label: "Site",
      value: filters.site,
      options: [
        { value: "all", label: `All ${siteCount}` },
        ...sites.map(([slug, name]) => ({ value: slug, label: name })),
      ],
    },
    {
      id: "category",
      label: "Type",
      value: filters.category,
      options: [
        { value: "all", label: "All types" },
        ...categories.map((c) => ({ value: c, label: CATEGORY_LABEL[c] })),
      ],
    },
    {
      id: "bortle",
      label: "Sky quality",
      value: filters.bortle,
      options: [
        { value: "any", label: "Any" },
        { value: "2", label: "Bortle ≤ 2" },
        { value: "3", label: "Bortle ≤ 3" },
      ],
    },
    {
      id: "duration",
      label: "Duration",
      value: filters.duration,
      options: [
        { value: "any", label: "Any" },
        { value: "short", label: "Under 3h" },
        { value: "long", label: "3h and over" },
      ],
    },
    {
      id: "group",
      label: "Group size",
      value: filters.group,
      options: [
        { value: "any", label: "Any" },
        { value: "2", label: "Fits 2" },
        { value: "4", label: "Fits 4" },
      ],
    },
    {
      id: "price",
      label: "Price · SAR",
      value: filters.price,
      options: [
        { value: "any", label: "Any" },
        { value: "300", label: "Up to 300" },
        { value: "400", label: "Up to 400" },
        { value: "800", label: "Up to 800" },
      ],
    },
  ];

  /* The mock's headline counts its results in words. Ours does the same
     against the real catalogue rather than asserting twenty-three. Past the
     list it falls back to the numeral, which is why the list runs to twenty
     rather than ten: a headline reading "19 experiences. Four dark-sky sites."
     mixes the two conventions in one sentence. */
  const WORDS = [
    "No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
    "Eighteen", "Nineteen", "Twenty",
  ];
  const countWord = WORDS[results.length] ?? String(results.length);
  const siteWord = WORDS[siteCount] ?? String(siteCount);

  return (
    <div className="grid h-[calc(100vh-var(--topbar-h))] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_620px]">
      {/* Same change as the discovery column: the whole column is the scroll
          container and the chrome is pinned inside it, rather than the results
          being the only region that accepts a wheel event. */}
      {/* data-lenis-prevent: Lenis runs at the root and takes the wheel
          for the whole document. On a view whose document never scrolls,
          that left every nested scroller inert. The attribute hands wheel
          events inside this column back to the browser. */}
      <div
        data-lenis-prevent
        className="min-h-0 overflow-y-auto border-divider xl:border-r-2"
      >
        <div className="sticky top-0 z-20 bg-bg">
        <div className="border-b-2 border-divider px-7 pb-3 pt-6">
          <p className="text-[11px] uppercase tracking-[0.14em] text-accent-700">Search</p>
          <h1 className="mt-1.5 font-display text-[34px] font-extrabold leading-[1.05] tracking-[-0.02em]">
            {countWord} {results.length === 1 ? "experience" : "experiences"}.
            <br />
            {siteWord} dark-sky sites.
          </h1>
        </div>

        <FilterBar cells={cells} onChange={setFilter} />

        <div className="flex items-center justify-between gap-4 border-b-2 border-divider px-7 py-3.5">
          <span className="font-display text-[15px] font-extrabold">
            <strong className="text-accent-700">{results.length}</strong>{" "}
            {results.length === 1 ? "result" : "results"} · sorted by{" "}
            <span className="text-accent-700">price</span>
          </span>
          <Link
            href="/discover"
            className={cn(
              "text-[11px] uppercase tracking-[0.08em] text-text/60 hover:text-text",
              focusRing,
            )}
          >
            View as cards
          </Link>
        </div>
        </div>

        <div>
          {error ? (
            <p className="m-7 max-w-[52ch] border-2 border-divider p-5 text-[13px] text-text/70">
              {error}
            </p>
          ) : results.length === 0 ? (
            <p className="m-7 max-w-[52ch] border-2 border-divider p-5 text-[13px] text-text/70">
              Nothing in the catalogue matches those filters. Widen one and the results come back.
            </p>
          ) : (
            results.map((item, i) => (
              <ResultRow key={item.id} item={item} rank={i + 1} onHover={setHoveredSite} />
            ))
          )}
        </div>
      </div>

      <MapPanel
        className="hidden xl:block"
        pins={pins}
        searchValue={query}
        onSearchChange={setQuery}
        focusedPinId={focusedSite}
        onSelectPin={(id) => setFilter("site", filters.site === id ? "all" : id)}
        legendTitle="Search results"
        /* The ink row only appears when something is actually drawn in ink,
           which is when one pin is selected and the rest drop back. */
        legendRows={[
          {
            swatch: "var(--color-accent)",
            label: focusedName ? "Selected site" : `Matches (${results.length})`,
          },
          ...(focusedName ? [{ swatch: "var(--color-text)", label: "Other sites" }] : []),
        ]}
      >
        {focusedName ? (
          <div className="absolute inset-x-4 top-[78px] z-[3] border-2 border-text bg-bg px-3.5 py-3">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <p className="font-display text-[16px] font-extrabold tracking-[-0.01em]">
                  {focusedName} · selected
                </p>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.06em] text-text/60">
                  {focusedCount} {focusedCount === 1 ? "experience" : "experiences"}
                  {focusedBortle !== null ? ` · Bortle ${focusedBortle}` : ""}
                </p>
              </div>
              <Link
                href={`/sites/${focusedSite}`}
                className={cn(
                  "shrink-0 font-display text-[11px] font-extrabold uppercase tracking-[0.08em] text-accent-700 hover:text-text",
                  focusRing,
                )}
              >
                View site →
              </Link>
            </div>
          </div>
        ) : null}
      </MapPanel>
    </div>
  );
}
