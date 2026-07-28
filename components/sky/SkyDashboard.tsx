import Link from "next/link";
import { MoonPhase } from "@/components/ui/MoonPhase";
import { Reveal } from "@/components/ui/Reveal";
import { eventDateParts, parseDateKey } from "@/lib/astro";
import type { SkyReading } from "@/lib/sky/types";
import { cn, focusRing } from "@/lib/cn";

/* Tonight's Sky.
 *
 * The one view that bends the palette. It opts into .sky-dark, which is scoped
 * to this subtree in globals.css: the near-blacks live nowhere else and no
 * other route can inherit them.
 *
 * Gold on #0a0908 measures about 9:1, so the accent reads harder here than it
 * does on cream.
 *
 * Every figure is labelled by where it came from. The footnote under the grid
 * names exactly which cells are computed and which are standing in until a
 * provider is wired, because a modelled cloud forecast presented as a
 * measurement is the failure CLAUDE.md rule 12 is written against.
 */

const RULE = "border-[#2a2724]";

/** `20:14` to minutes past 17:00 on the twilight bar's twelve-hour span. */
function barPosition(time: string): number | null {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  let minutes = h * 60 + m - 17 * 60;
  if (minutes < 0) minutes += 1440;
  const pct = (minutes / 720) * 100;
  return pct >= 0 && pct <= 100 ? pct : null;
}

export function SkyDashboard({
  sky,
  siteRanking,
  dateLabel,
}: {
  sky: SkyReading;
  siteRanking: {
    slug: string;
    name: string;
    bortle: number | null;
    bookableTonight: boolean;
  }[];
  dateLabel: string;
}) {
  const { moon, twilight, darkness, cloud, constellations, planets, iss, events } = sky;

  /* Markers, then a second label row for any that would land on top of the one
     before it. Moonset routinely falls within minutes of astronomical dawn,
     and three 40px labels stacked at the same x read as one smear. */
  const markers = [
    { label: "Sunset", time: twilight.sunset },
    { label: "Astro", time: twilight.astronomicalDusk },
    ...(moon.set ? [{ label: "Moonset", time: moon.set }] : []),
    { label: "Astro", time: twilight.astronomicalDawn },
    { label: "Sunrise", time: twilight.sunrise },
  ]
    .map((m) => ({ ...m, pct: barPosition(m.time) }))
    .filter((m): m is { label: string; time: string; pct: number } => m.pct !== null)
    .sort((a, b) => a.pct - b.pct)
    .reduce<{ label: string; time: string; pct: number; row: number }[]>((acc, m) => {
      const previous = acc[acc.length - 1];
      const crowded = previous !== undefined && m.pct - previous.pct < 9;
      acc.push({ ...m, row: crowded ? 1 - previous.row : 0 });
      return acc;
    }, []);

  /* Bortle 1 to 9 across the scale, marker at this site's class. */
  const bortlePct = ((darkness.bortle - 1) / 8) * 100;

  return (
    /* Fixed to what is left under the bar, with each column scrolling on its
       own — the same chrome contract the two split views keep, so the top bar
       never scrolls away from a view that is meant to be read as one screen. */
    <div className="sky-dark grid h-[calc(100vh-var(--topbar-h))] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div data-lenis-prevent className="overflow-y-auto px-8 py-6">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.14em] text-accent">
            Tonight · {dateLabel} · AlUla, {sky.coords.lat.toFixed(1)}°N
          </p>
          <h1 className="mt-1 font-display text-[42px] font-extrabold leading-none tracking-[-0.02em] text-[var(--sky-text)]">
            The sky above AlUla, tonight.
          </h1>
          <p className="mb-6 mt-2 max-w-[62ch] text-[14px] text-[var(--sky-muted)]">
            {moon.phrase}
            {moon.set ? `, setting at ${moon.set}` : ""}. {twilight.darkHours} hours between
            astronomical dusk at {twilight.astronomicalDusk} and dawn at {twilight.astronomicalDawn},
            over four DarkSky-certified reserves at Bortle {darkness.bortle}.
          </p>
        </Reveal>

        <div className={cn("grid border-2 md:grid-cols-[1.15fr_1fr]", RULE)}>
          <Cell title="Moon" revealDelay={0}>
            <div className="flex items-center gap-5">
              <MoonPhase phase={moon.illumination} waxing={moon.waxing} size={96} tone="light" />
              <div>
                <p className="tnum font-display text-[44px] font-extrabold leading-none tracking-[-0.02em] text-accent">
                  {Math.round(moon.illumination * 100)}%
                </p>
                <p className="mt-1 text-[12px] uppercase tracking-[0.08em] text-[var(--sky-muted)]">
                  {moon.phrase.replace(/\s+\d+%$/, "")}
                </p>
                <p className="tnum mt-3.5 text-[12px] leading-[1.6] text-[var(--sky-muted)]">
                  Rises {moon.rise} · Sets {moon.set}
                  <br />
                  New moon in {moon.daysToNewMoon} days
                  {moon.peakDarkness ? (
                    <>
                      {" "}
                      · Peak darkness{" "}
                      <span className="text-accent">
                        {moon.peakDarkness.from} – {moon.peakDarkness.to}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
            </div>
          </Cell>

          <Cell title={`Darkness · Bortle ${darkness.bortle}`} lastCol revealDelay={70}>
            <div className="mb-3 flex items-baseline gap-2">
              {/* one decimal always: an SQM that renders as "22" rather than
                  "22.0" reads as a rounder, less measured number than it is */}
              <span className="tnum font-display text-[44px] font-extrabold leading-none tracking-[-0.02em]">
                {darkness.sqm.toFixed(1)}
              </span>
              <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--sky-muted)]">
                mag / arcsec²
              </span>
            </div>
            {/* fill-x: the scale reads as measured rather than merely
                rendered, drawing in left to right once on load. The marker is
                an absolutely-positioned child, so it scales in together with
                the bar rather than needing its own separate animation. */}
            <div
              className={cn("relative h-2 border fill-x", RULE)}
              style={{
                background: "linear-gradient(90deg,#0a0908,#4a4844,#a19d99,#f3d68a)",
                ["--fill-delay" as string]: "200ms",
              }}
            >
              <span
                aria-hidden
                className="absolute -bottom-1 -top-1 w-0.5 bg-accent"
                style={{ left: `${bortlePct}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-[0.06em] text-[var(--sky-faint)]">
              <span>1 · Excellent</span>
              <span>5</span>
              <span>9 · Inner city</span>
            </div>
          </Cell>

          <Cell title={`Astronomical twilight · ${sky.coords.lat.toFixed(1)}°N`} span lastRow={false} revealDelay={140}>
            {/* room above the bar for two rows of marker labels, so they
                never ride up into the cell heading */}
            <div className="relative pt-9">
              {/* fill-x, delayed past the cell's own Reveal so the bar draws
                  in once it is actually visible rather than mid-fade. This is
                  the night's own measured window, so it earns the same
                  "drawn, not just appearing" treatment as the darkness scale. */}
              <div
                className={cn("relative h-8 border fill-x", RULE)}
                style={{
                  background:
                    "linear-gradient(90deg,#f3d68a 0%,#b96b3a 8%,#4a2d4a 20%,#0a0908 35%,#0a0908 65%,#4a2d4a 80%,#b96b3a 92%,#f3d68a 100%)",
                  ["--fill-delay" as string]: "350ms",
                }}
              >
                {markers.map((m, i) => (
                  <span
                    key={`${m.label}-${i}`}
                    aria-hidden
                    className="absolute -bottom-1.5 -top-1.5 w-0.5 bg-accent"
                    style={{ left: `${m.pct}%` }}
                  >
                    <span
                      className="absolute left-1/2 w-12 -translate-x-1/2 text-center text-[10px] uppercase tracking-[0.06em] text-accent"
                      style={{ top: m.row === 0 ? "-18px" : "-32px" }}
                    >
                      {m.label}
                    </span>
                  </span>
                ))}
              </div>
              <div className="tnum mt-1 flex justify-between text-[10px] uppercase tracking-[0.06em] text-[var(--sky-faint)]">
                {["17:00", "19:00", "21:00", "23:00", "01:00", "03:00", "05:00"].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
            <p className="mt-3.5 max-w-[70ch] text-[13px] leading-[1.6] text-[var(--sky-muted)]">
              {twilight.darkHours} hours of true astronomical darkness.
              {twilight.bestImaging ? (
                <>
                  {" "}
                  Best imaging between{" "}
                  <span className="font-display font-extrabold text-accent">
                    {twilight.bestImaging.from} and {twilight.bestImaging.to}
                  </span>
                  .
                </>
              ) : null}
              {twilight.milkyWayCoreTransit
                ? ` Milky Way core transit at ${twilight.milkyWayCoreTransit}.`
                : ""}
            </p>
          </Cell>

          <Cell title="What's up · zenith at midnight" lastRow revealDelay={210}>
            <div className="flex flex-wrap gap-2">
              {constellations.map((c) => (
                <span
                  key={c.name}
                  className={cn(
                    "inline-flex items-center gap-2 border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.06em]",
                    c.up ? "border-accent text-accent" : cn(RULE, "text-[var(--sky-text)]"),
                  )}
                >
                  {c.name}
                  <span className="tnum text-[var(--sky-faint)]">
                    {c.altitude !== null ? `${c.altitude}°` : "rising"}
                  </span>
                </span>
              ))}
            </div>
            <div className={cn("mt-4 flex justify-between gap-4 border-t pt-3.5", RULE)}>
              <div>
                <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--sky-faint)]">
                  Planets tonight
                </p>
                <p className="mt-1 font-display text-[14px] font-extrabold">
                  {planets.filter((p) => p.up).map((p) => p.name).join(" · ") || "None up"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--sky-faint)]">
                  ISS pass
                </p>
                <p className="tnum mt-1 font-display text-[14px] font-extrabold text-accent">
                  {iss ? `${iss.time} · ${iss.track} · ${iss.minutes} min` : "No visible pass"}
                </p>
              </div>
            </div>
          </Cell>

          <Cell title="Cloud cover · next 12h" lastCol lastRow revealDelay={280}>
            {/* The mock draws three decorative blurred patches. These are the
                twelve hourly readings: each hour with meaningful cloud gets a
                patch sized and faded by its own percentage, so the strip is
                the forecast rather than a picture of one. */}
            <div
              className={cn("relative h-[140px] overflow-hidden border", RULE)}
              style={{
                background:
                  "repeating-linear-gradient(45deg,#1a1815,#1a1815 6px,#0a0908 6px,#0a0908 12px)",
              }}
            >
              {cloud.hourly.map((h, i) =>
                h.cloudPercent > 6 ? (
                  <span
                    key={h.time}
                    aria-hidden
                    className="absolute rounded-full blur-[6px]"
                    style={{
                      left: `${(i / cloud.hourly.length) * 100}%`,
                      top: `${18 + (i % 3) * 26}px`,
                      width: `${20 + h.cloudPercent * 0.9}px`,
                      height: `${16 + h.cloudPercent * 0.4}px`,
                      background: `color-mix(in srgb, #f3f2f2 ${Math.min(45, h.cloudPercent)}%, transparent)`,
                    }}
                  />
                ) : null,
              )}
            </div>
            <div className="tnum mt-2 flex justify-between text-[10px] uppercase tracking-[0.06em] text-[var(--sky-faint)]">
              {["18:00", "21:00", "00:00", "03:00", "06:00"].map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className={cn("mt-3 flex justify-between gap-4 border-t pt-3", RULE)}>
              <Stat label="Overall" value={`${cloud.overallPercent}% · ${cloud.summary}`} accent />
              <Stat label="Seeing" value={cloud.seeing} align="right" />
              <Stat label="Wind" value={`${cloud.windKph} km/h`} align="right" />
            </div>
          </Cell>
        </div>

        <p className="mt-4 max-w-[80ch] text-[11px] leading-[1.6] text-[var(--sky-faint)]">
          Moon illumination, what is up and the events list are computed. Rise and set clock
          times, twilight boundaries, cloud, seeing, wind, planets and the ISS pass are demo
          figures standing in until an ephemeris and a weather feed are wired. Bortle 2 is the
          reserves&rsquo; DarkSky certification, not a live sky-brightness reading.
        </p>
      </div>

      <div data-lenis-prevent className={cn("overflow-y-auto border-l-2 bg-[var(--sky-rail)] p-6", RULE)}>
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.14em] text-accent">Coming up</p>
          <h2 className="mt-1 font-display text-[22px] font-extrabold tracking-[-0.01em] text-[var(--sky-text)]">
            Notable events
          </h2>
          <p className="mt-1 text-[12px] text-[var(--sky-muted)]">Next 60 nights in the AlUla sky.</p>
        </Reveal>

        <div className="mt-3">
          {events.length === 0 ? (
            <p className="text-[12px] text-[var(--sky-muted)]">
              Nothing notable falls in the next sixty nights.
            </p>
          ) : (
            events.slice(0, 6).map((event, i) => {
              const parts = eventDateParts(parseDateKey(event.date));
              return (
                <Reveal key={`${event.date}-${event.name}`} delay={i * 60}>
                  <div
                    className={cn(
                      "grid grid-cols-[74px_minmax(0,1fr)_auto] items-baseline gap-3.5 border-t py-3.5 last:border-b",
                      RULE,
                    )}
                  >
                    <div className="font-display text-[14px] font-extrabold uppercase tracking-[-0.01em] text-accent">
                      {parts.date}
                      <small className="mt-0.5 block text-[10px] font-normal tracking-[0.08em] text-[var(--sky-faint)]">
                        {parts.day}
                      </small>
                    </div>
                    <div className="font-display text-[14px] font-bold leading-[1.3]">
                      {event.name}
                      <small className="mt-0.5 block text-[11px] font-normal uppercase tracking-[0.04em] text-[var(--sky-muted)]">
                        {event.detail}
                      </small>
                    </div>
                    <div
                      aria-label={`${event.rating} out of 5`}
                      className="font-display text-[12px] text-[var(--sky-muted)]"
                    >
                      {"★".repeat(event.rating)}
                    </div>
                  </div>
                </Reveal>
              );
            })
          )}
        </div>

        <p className="mt-7 text-[11px] uppercase tracking-[0.14em] text-accent">
          Best sites tonight
        </p>
        <div className="mt-1">
          {siteRanking.map((site, i) => (
            <Reveal key={site.slug} delay={i * 60}>
            <div
              className={cn(
                "grid grid-cols-[28px_minmax(0,1fr)_auto_auto] items-center gap-3 border-t py-3 last:border-b",
                RULE,
              )}
            >
              <span className="tnum font-display text-[13px] font-extrabold text-[var(--sky-faint)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="truncate font-display text-[13px] font-bold">{site.name}</span>
              <span className="tnum text-[11px] uppercase tracking-[0.06em] text-accent">
                {site.bortle !== null ? `B ${site.bortle}` : "—"}
              </span>
              <Link
                href={site.bookableTonight ? `/search?site=${site.slug}` : `/sites/${site.slug}`}
                className={cn(
                  "border border-accent px-2.5 py-1.5 text-[10px] uppercase tracking-[0.08em] text-accent",
                  "transition-colors duration-150 ease-move hover:bg-accent hover:text-[#0a0908]",
                  focusRing,
                )}
              >
                {site.bookableTonight ? "Book" : "View"}
              </Link>
            </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

function Cell({
  title,
  children,
  span = false,
  lastCol = false,
  lastRow = false,
  revealDelay = 0,
}: {
  title: string;
  children: React.ReactNode;
  span?: boolean;
  lastCol?: boolean;
  lastRow?: boolean;
  revealDelay?: number;
}) {
  return (
    /* The Reveal wrapper lives inside this section, not around it: the
       section is the actual CSS grid item, and "span" cells rely on
       md:col-span-2 landing on it directly. A wrapping div around the whole
       section would carry that span class on the wrong element and break
       the grid. */
    <section
      className={cn(
        "px-[22px] py-5",
        RULE,
        span ? "md:col-span-2" : "",
        lastCol || span ? "" : "md:border-r-2",
        lastRow ? "" : "border-b-2",
      )}
    >
      <Reveal delay={revealDelay}>
        <h3 className="mb-3.5 font-display text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--sky-faint)]">
          {title}
        </h3>
        {children}
      </Reveal>
    </section>
  );
}

function Stat({
  label,
  value,
  accent = false,
  align = "left",
}: {
  label: string;
  value: string;
  accent?: boolean;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : undefined}>
      <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--sky-faint)]">{label}</p>
      <p
        className={cn(
          "tnum mt-1 font-display text-[18px] font-extrabold",
          accent ? "text-accent" : "",
        )}
      >
        {value}
      </p>
    </div>
  );
}
