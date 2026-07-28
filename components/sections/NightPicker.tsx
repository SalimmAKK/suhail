"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CoordinateTag } from "@/components/ui/CoordinateTag";
import { MoonPhase } from "@/components/ui/MoonPhase";
import { NightGrid } from "@/components/ui/NightGrid";
import { SkyPip } from "@/components/ui/SkyPip";
import {
  ALULA_LAT,
  isWaxing,
  moonPhase,
  moonPhaseLabel,
  parseDateKey,
  skyQuality,
  visibleConstellations,
  type SkyQuality,
} from "@/lib/astro";
import type { CatalogExperience } from "@/lib/catalog";
import type { Site, SkyTarget } from "@/data/sites";

/* CLAUDE.md section 8.2, the interactive centrepiece.
   BUILD_PLAN stage 5.

   Sixty nights, each coloured by how dark it will be, and a panel that fills
   with what that particular night actually offers. It answers the one
   question a traveller has that no booking site answers: when should I go.

   On the animation choice: section 7 permits Framer Motion here, and it is
   not needed. The cell fill is one transform per cell with a stagger, which
   CSS does in eight lines without shipping an animation runtime to do it, and
   which keeps the grid rendering correctly before hydration. Framer Motion
   stays reserved for the launch intro, where the letter-by-letter sequence
   genuinely has no CSS equivalent worth writing. */

/* The grid itself now lives in components/ui/NightGrid, so the discovery
   view's "Pick a date" chip opens the same sixty cells this page shows. What
   stays here is the panel that reads a selection. */

const FULL_DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function NightPicker({
  nights,
  experiences,
  sites,
  error,
}: {
  /** date keys, `2026-08-14`, already fixed on the server */
  nights: string[];
  experiences: CatalogExperience[];
  sites: Site[];
  error: string | null;
}) {
  /* Tonight is selected on arrival. A visitor who never clicks still sees a
     real moon phase and real bookable experiences, which sells the idea
     better than a prompt asking them to do the work first. */
  const [selected, setSelected] = useState<string | null>(nights[0] ?? null);
  /* The panel animates on a change, not on the mount that preselects. */
  const [interacted, setInteracted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  /* Stacked, the panel sits under ten rows of grid, so picking a night sends
     the answer off the bottom of the screen. Bring it into view on the
     layouts where it is not already beside the grid. */
  const select = useCallback((key: string) => {
    setSelected(key);
    setInteracted(true);
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() =>
      panelRef.current?.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "start",
      }),
    );
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
      <NightGrid nights={nights} selected={selected} onSelect={select} />

      {/* Panel change animation, motion: fade and 8px rise, 200ms. Keyed on
          the selection so React remounts it and the CSS runs once per change
          rather than on every render, and withheld until the visitor has
          actually picked something: the spec asks for this on state change,
          not on the mount. */}
      {/* Sticky beside the grid on lg: ten rows is taller than the viewport,
          so a static panel scrolls away from the cells that drive it. */}
      <div
        ref={panelRef}
        className="scroll-mt-[var(--section-top)] lg:sticky lg:top-[var(--section-top)] lg:self-start"
      >
        <div key={selected ?? "empty"} className={interacted ? "panel-enter" : undefined}>
          {selected ? (
            <NightDetail
              dateKey={selected}
              experiences={experiences}
              sites={sites}
              error={error}
            />
          ) : (
            <EmptyPanel />
          )}
        </div>
      </div>
    </div>
  );
}

/* Only reachable if the night list is empty, which would mean the calendar
   window is misconfigured. Says so rather than rendering a blank column. */
function EmptyPanel() {
  return (
    <div className="flex h-full flex-col justify-center border-t border-divider pt-8 lg:border-l lg:border-t-0 lg:pl-14 lg:pt-0">
      <h3 className="text-3xl text-text">No nights to show.</h3>
      <p className="mt-4 max-w-[40ch] text-neutral-700">
        The calendar window came back empty, which is a fault rather than a quiet night.
      </p>
    </div>
  );
}

function NightDetail({
  dateKey,
  experiences,
  sites,
  error,
}: {
  dateKey: string;
  experiences: CatalogExperience[];
  sites: Site[];
  error: string | null;
}) {
  const date = parseDateKey(dateKey);
  const phase = moonPhase(date);
  const quality = skyQuality(date);
  const constellations = useMemo(() => visibleConstellations(date, ALULA_LAT), [date]);

  /* Which sites suit this night: match what will be up against what each
     site's terrain and horizon are good for. Sharaan blocks the north, so it
     wins on a Scorpius night; Gharameel is open, so it wins for the Milky
     Way. Ranked by how many of tonight's targets each one covers. */
  const targets = useMemo(() => {
    const set = new Set<SkyTarget>();
    for (const c of constellations) for (const t of c.targets) set.add(t);
    return set;
  }, [constellations]);

  const suited = useMemo(
    () =>
      sites
        .map((site) => ({
          site,
          matches: site.bestFor.filter((t) => targets.has(t)),
        }))
        .filter((s) => s.matches.length > 0)
        .sort((a, b) => b.matches.length - a.matches.length)
        .slice(0, 2),
    [sites, targets],
  );

  const running = experiences.filter((e) => e.dates.includes(dateKey));

  return (
    <div className="border-t border-divider pt-8 lg:border-l lg:border-t-0 lg:pl-14 lg:pt-0">
      <div className="flex items-start gap-5">
        <MoonPhase phase={phase} waxing={isWaxing(date)} size={52} />
        <div>
          <h3 className="text-3xl text-text">{FULL_DATE.format(date)}</h3>
          <CoordinateTag
            className="mt-3"
            items={[
              `${moonPhaseLabel(phase).toUpperCase()} MOON`,
              `${Math.round(phase * 100)}% LIT`,
            ]}
          />
        </div>
      </div>

      <div className="mt-6">
        <SkyPip quality={quality} />
      </div>

      <Group title="Overhead at 21:00">
        <p className="font-display text-label uppercase leading-relaxed tracking-label text-neutral-700">
          {constellations.map((c) => c.name).join("  ·  ")}
        </p>
        {constellations.find((c) => c.note) ? (
          <p className="mt-3 max-w-[44ch] text-neutral-700">
            {constellations.find((c) => c.note)!.note}
          </p>
        ) : null}
      </Group>

      {suited.length > 0 ? (
        <Group title="Best sites for this sky">
          <ul className="space-y-2">
            {suited.map(({ site, matches }) => (
              <li key={site.slug} className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-text">{site.name}</span>
                <span className="font-display text-label uppercase tracking-label text-neutral-600">
                  {matches.join(" · ").replace(/-/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        </Group>
      ) : null}

      <Group title={running.length > 0 ? "Running that night" : "Availability"}>
        {error ? (
          <p className="max-w-[44ch] text-neutral-700">
            The catalogue could not be loaded, so we cannot say what is running. This is a
            real error, not an empty night.
            <span className="mt-2 block font-display text-label uppercase tracking-label text-accent-2">
              {error}
            </span>
          </p>
        ) : running.length === 0 ? (
          <p className="max-w-[44ch] text-neutral-700">
            Nothing is scheduled on this night yet.
          </p>
        ) : (
          <ul className="space-y-5">
            {running.map((experience) => (
              <ExperienceRow
                key={experience.id}
                experience={experience}
                dateKey={dateKey}
                quality={quality}
              />
            ))}
          </ul>
        )}
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 border-t border-divider pt-6">
      <h4 className="mb-3 font-display text-label uppercase tracking-label text-accent-700">{title}</h4>
      {children}
    </section>
  );
}

function ExperienceRow({
  experience,
  dateKey,
  quality,
}: {
  experience: CatalogExperience;
  dateKey: string;
  quality: SkyQuality;
}) {
  /* An experience built around a dark sky still runs under a bright moon,
     and the operator will still take the booking. Saying so is more useful
     than hiding it, and hiding it would misrepresent availability. */
  const compromised = experience.requiresDark && quality === "bright";

  return (
    <li>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="text-text">{experience.title}</p>
        <p className="font-display text-label uppercase tracking-label text-neutral-700">
          SAR {experience.priceSar}
        </p>
      </div>
      <p className="mt-1 font-display text-label uppercase tracking-label text-neutral-600">
        {experience.operatorName} · {experience.site.name}
        {experience.durationMin ? ` · ${Math.round(experience.durationMin / 60)}H` : ""}
      </p>
      {compromised ? (
        <p className="mt-2 max-w-[42ch] text-[15px] text-neutral-700">
          Built for a dark sky. The moon will be up on this night, so the faint objects will
          be washed out.
        </p>
      ) : null}
      <Button
        href={`/book/${experience.id}?date=${dateKey}`}
        variant="secondary"
        size="sm"
        className="mt-3"
      >
        Book this night
      </Button>
    </li>
  );
}
