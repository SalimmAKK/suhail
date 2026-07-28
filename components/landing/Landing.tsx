import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/layout/BrandMark";
import { LandingAccountLink } from "@/components/landing/LandingAccountLink";
import { MoonPhase } from "@/components/ui/MoonPhase";
import { SkyBackdrop } from "@/components/landing/SkyBackdrop";
import { cn, focusRing } from "@/lib/cn";

/* The landing page: the surface a visitor meets before the platform.
 *
 * Dark, like /sky, and for the same reason — it is the night. It opts into the
 * same scoped .sky-dark block rather than inventing a second set of near-blacks.
 *
 * Where this departs from the design file, and why:
 *
 *   Backdrop        AI-generated in the design, licensed stock here. Rule 13.
 *   "Sign in"       Superseded: migrations/003_accounts.sql added real
 *                   accounts, so LandingAccountLink renders "Sign in" or
 *                   "Account" depending on session, the same session-aware
 *                   cell TopBar carries on every platform route.
 *   Nav "Operators" Rule 2.4/17 keeps that route out of public navigation.
 *   Nav "Journal"   No such route exists.
 *   Every figure    The design hard-codes 17 operators, 23 bookable, per-site
 *                   Bortle values of 1.8/2.1/2.3 and prices from SAR 390. All
 *                   of it is read from the catalogue instead: the landing sits
 *                   one click from the platform and cannot contradict it.
 *   "No OTA         A claim about a running marketplace, which rule 2.4/16
 *    commission"    forbids pre-launch.
 *   Gold surfaces   The design puts cream text on the accent. At Desert
 *                   Nocturne's gold that is about 2:1. Ink instead, as
 *                   everywhere else in the product.
 */

export type LandingStats = {
  siteCount: number;
  operatorCount: number;
  bookableTonight: number;
  cheapestSar: number | null;
};

export type LandingSite = {
  slug: string;
  name: string;
  meta: string;
  description: string;
  bortle: number | null;
  bookableTonight: number;
  fromSar: number | null;
};

export type LandingSky = {
  dateLabel: string;
  moonPhrase: string;
  illumination: number;
  waxing: boolean;
  moonSet: string | null;
  darkHours: number;
  bortle: number;
  cloudPercent: number;
  seeing: string;
  coreTransit: string | null;
  nextNewMoon: string | null;
  /** `27 Jul` — the compact form the search cell has room for */
  shortDate: string;
};

const NAV = [
  { href: "/discover", label: "Tonight" },
  { href: "/sky", label: "The Sky" },
  { href: "/sites", label: "Sites" },
  { href: "/about", label: "About" },
];

export function Landing({
  stats,
  sites,
  sky,
}: {
  stats: LandingStats;
  sites: LandingSite[];
  sky: LandingSky;
}) {
  return (
    <div className="sky-dark relative min-h-screen overflow-x-hidden">
      <SkyBackdrop />

      <div className="relative z-10 mx-auto w-full max-w-[1440px]">
        {/* ------------------------------------------------------------ hero */}
        <header className="relative min-h-[900px] w-full overflow-hidden">
          <Corner className="left-6 top-6" />
          <Corner className="right-6 top-6 -scale-x-100" />
          <Corner className="bottom-6 left-6 -scale-y-100" />
          <Corner className="bottom-6 right-6 scale-[-1]" />

          <span
            aria-hidden
            className="absolute bottom-[300px] left-10 top-[100px] w-px bg-[var(--sky-text)]/35"
          />
          <span
            aria-hidden
            className="absolute bottom-[300px] right-10 top-[100px] w-px bg-[var(--sky-text)]/35"
          />

          {/* top bar */}
          <div className="relative z-[5] flex flex-wrap items-center gap-x-10 gap-y-5 px-10 py-7">
            <Link href="/" className={cn("flex items-center gap-3", focusRing)}>
              <BrandMark size={30} className="!bg-accent" />
              <span className="font-display text-[20px] font-extrabold tracking-[-0.02em] text-[var(--sky-text)]">
                Suhail
                <span className="ml-1.5 text-[10px] font-normal uppercase tracking-[0.24em] text-[var(--sky-text)]/60">
                  Astrotourism · KSA
                </span>
              </span>
            </Link>

            <nav aria-label="Landing" className="ml-auto flex flex-wrap gap-7">
              {NAV.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "whitespace-nowrap font-display text-[12px] font-bold uppercase tracking-[0.14em]",
                    "transition-colors duration-150 ease-move",
                    focusRing,
                    i === 0
                      ? "text-accent"
                      : "text-[var(--sky-text)]/85 hover:text-accent",
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <LandingAccountLink />
            </nav>

            <Link
              href="/discover"
              className={cn(
                "inline-flex items-center gap-2.5 bg-accent px-[22px] py-3",
                "font-display text-[12px] font-extrabold uppercase tracking-[0.14em] text-text",
                "transition-colors duration-150 ease-move hover:bg-accent-400",
                focusRing,
              )}
            >
              Enter platform
              <ArrowRight aria-hidden size={14} strokeWidth={2.5} />
            </Link>
          </div>

          {/* kicker */}
          <div className="relative z-[4] flex flex-wrap items-center gap-3.5 px-10 pt-8">
            <span className="tnum font-display text-[12px] font-extrabold tracking-[0.16em] text-accent">
              N° 001
            </span>
            <span aria-hidden className="h-px w-10 bg-[var(--sky-text)]/40" />
            <span className="font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--sky-text)]/75">
              Volume One · Northern Hejaz
            </span>
            <span aria-hidden className="h-px w-10 bg-[var(--sky-text)]/40" />
            <span className="tnum font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--sky-text)]/75">
              {sky.dateLabel}
              {sky.nextNewMoon ? ` · ${sky.nextNewMoon}` : ""}
            </span>
          </div>
          <span
            aria-hidden
            className="absolute left-10 right-[380px] top-[148px] hidden h-px bg-[var(--sky-text)]/35 xl:block"
          />

          <div className="relative z-[4] grid gap-12 px-10 pt-12 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-16">
            <div>
              <h1 className="font-display text-[64px] font-extrabold leading-[0.92] tracking-[-0.035em] text-[var(--sky-text)] sm:text-[84px] xl:text-[104px]">
                The night sky,
                <br />
                booked <span className="text-accent">by the night.</span>
              </h1>
              <p className="mt-6 max-w-[46ch] font-display text-[15px] font-medium uppercase leading-[1.55] tracking-[0.06em] text-[var(--sky-text)]/75">
                Saudi Arabia&rsquo;s dark-sky reserves, surfaced with the sky&rsquo;s actual
                conditions and made bookable in one flow.
              </p>
            </div>

            <TonightCard sky={sky} />
          </div>

          {/* The design's two editorial marks: a rotated stamp down the left
              edge and a scroll cue above the lower band. */}
          <span
            aria-hidden
            /* writing-mode rather than a rotate: rotating about the centre
               offsets a long string by half its length and drops it into the
               middle of the headline. Vertical text lays out in a column that
               is genuinely 12px wide, so it sits flush to the edge. */
            className="pointer-events-none absolute left-3 top-1/2 z-[4] hidden -translate-y-1/2 rotate-180 [writing-mode:vertical-rl] font-display text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--sky-text)]/45 xl:block"
          >
            Est. 2026 · AlUla · Riyadh
          </span>

          <div className="relative z-[4] mt-10 hidden items-center justify-end gap-2.5 px-10 font-display text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--sky-text)]/65 xl:flex">
            Scroll · The four sites
            <span aria-hidden className="scroll-cue relative h-px w-[60px] overflow-hidden bg-[var(--sky-text)]/40" />
          </div>

          {/* lower band */}
          <div className="relative z-[4] grid grid-cols-1 items-end gap-10 px-10 pb-12 pt-20 lg:grid-cols-2 xl:grid-cols-[1.8fr_1fr_1fr_1fr]">
            <div className="flex flex-col gap-3.5">
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--sky-text)]/55">
                Find a night
              </span>
              <div className="grid grid-cols-1 border border-[var(--sky-text)]/40 bg-[#0a0908]/50 backdrop-blur-md sm:grid-cols-[1.1fr_1fr_1fr_auto]">
                <SearchCell k="Site" v={`All ${stats.siteCount}`} />
                <SearchCell k="Night" v={sky.shortDate} />
                <SearchCell k="Guests" v="2 adults" last />
                <Link
                  href="/search"
                  className={cn(
                    "inline-flex items-center justify-center gap-2.5 bg-accent px-6 py-4",
                    "font-display text-[12px] font-extrabold uppercase tracking-[0.16em] text-text",
                    "transition-colors duration-150 ease-move hover:bg-accent-400",
                    focusRing,
                  )}
                >
                  Search
                  <ArrowRight aria-hidden size={14} strokeWidth={2.5} />
                </Link>
              </div>
            </div>

            <Stat
              k="Dark Sky Parks"
              v={String(stats.siteCount).padStart(2, "0")}
              unit="certified"
              s="DarkSky International, certified 2024 onward."
            />
            <Stat
              k="Operators"
              v={String(stats.operatorCount).padStart(2, "0")}
              unit="listed"
              s="Booked direct through Suhail."
            />
            <Stat
              k="Tonight"
              v={String(stats.bookableTonight).padStart(2, "0")}
              unit="bookable"
              s={
                stats.cheapestSar !== null
                  ? `Ranked by sky quality, from SAR ${stats.cheapestSar}.`
                  : "Ranked by sky quality."
              }
            />
          </div>
        </header>

        {/* ----------------------------------------------------------- sites */}
        <section className="relative z-[2] px-10 pb-20 pt-24">
          <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-[var(--sky-text)]/35 pb-6">
            <h2 className="font-display text-[40px] font-extrabold leading-[0.95] tracking-[-0.02em] text-[var(--sky-text)] sm:text-[60px]">
              The four sites,
              <br />
              <span className="text-accent">tonight.</span>
            </h2>
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--sky-text)]/55">
              Index · N° 002 – 005
            </p>
          </div>

          <div className="grid grid-cols-1 border-t border-[var(--sky-text)]/20 sm:grid-cols-2 xl:grid-cols-4">
            {sites.map((site, i) => (
              <article
                key={site.slug}
                /* flex column so the three stat rows sit on the cell floor and
                   line up across all four, whatever the title wraps to */
                className={cn(
                  "flex flex-col border-b border-[var(--sky-text)]/20 py-8 xl:border-r xl:last:border-r-0",
                  i === 0 ? "xl:pr-6" : "xl:px-6",
                  i === sites.length - 1 ? "xl:pr-0" : "",
                )}
              >
                <p className="tnum mb-5 font-display text-[12px] font-extrabold tracking-[0.08em] text-accent">
                  N° {String(i + 2).padStart(3, "0")}
                </p>
                <h3 className="font-display text-[24px] font-extrabold leading-[1.1] tracking-[-0.01em] text-[var(--sky-text)]">
                  <Link href={`/sites/${site.slug}`} className={cn("hover:text-accent", focusRing)}>
                    {site.name}
                  </Link>
                </h3>
                <p className="mb-4 mt-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--sky-text)]/55">
                  {site.meta}
                </p>
                <p className="mb-6 max-w-[32ch] flex-1 text-[13px] leading-[1.6] text-[var(--sky-text)]/75">
                  {site.description}
                </p>
                <SiteRow k="Bortle" v={site.bortle !== null ? String(site.bortle) : "—"} accent />
                <SiteRow
                  k="Tonight"
                  v={site.bookableTonight > 0 ? `${site.bookableTonight} bookable` : "None running"}
                />
                <SiteRow k="From" v={site.fromSar !== null ? `SAR ${site.fromSar}` : "—"} />
              </article>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------- closer */}
        <section className="relative z-[2] bg-accent px-10 py-24 text-text">
          <p className="mb-6 flex items-center gap-3.5 font-display text-[11px] font-extrabold uppercase tracking-[0.24em]">
            <span aria-hidden className="h-px w-10 bg-text/70" />
            One flow · from sky to seat
          </p>
          <h2 className="mb-10 max-w-[20ch] font-display text-[56px] font-extrabold leading-[0.9] tracking-[-0.04em] sm:text-[80px] xl:text-[120px]">
            Pick a night.
            <br />
            Read the sky.
            <br />
            Book it, done.
          </h2>
          <div className="flex flex-wrap items-center gap-5 border-t-2 border-text/60 pt-8">
            <Link
              href="/discover"
              className={cn(
                "inline-flex items-center gap-4 bg-text px-8 py-5",
                "font-display text-[13px] font-extrabold uppercase tracking-[0.16em] text-[var(--sky-text)]",
                "transition-colors duration-150 ease-move hover:bg-[#0a0908]",
                focusRing,
              )}
            >
              Enter the platform
              <ArrowRight aria-hidden size={16} strokeWidth={2.5} />
            </Link>
            <Link
              href="/sky"
              className={cn(
                "inline-flex items-center gap-4 border-2 border-text px-8 py-[18px]",
                "font-display text-[13px] font-extrabold uppercase tracking-[0.16em] text-text",
                "transition-colors duration-150 ease-move hover:bg-text hover:text-[var(--sky-text)]",
                focusRing,
              )}
            >
              Read tonight&rsquo;s sky
              <ArrowRight aria-hidden size={16} strokeWidth={2.5} />
            </Link>
            {sky.nextNewMoon ? (
              <div className="ml-auto text-right">
                <p className="text-[11px] uppercase tracking-[0.16em]">Next new moon</p>
                <p className="tnum mt-1 font-display text-[18px] font-extrabold">
                  {sky.nextNewMoon}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <footer className="relative z-[2] flex flex-wrap items-center justify-between gap-4 border-t border-[var(--sky-text)]/20 bg-[#0a0908]/90 px-10 py-6 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--sky-text)]/55">
          <span>Suhail · Est. 2026 · AlUla</span>
          <div className="flex gap-6">
            <Link href="/about" className={cn("hover:text-accent", focusRing)}>
              About
            </Link>
            <Link href="/sites" className={cn("hover:text-accent", focusRing)}>
              Sites
            </Link>
            <Link href="/contact" className={cn("hover:text-accent", focusRing)}>
              Contact
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

function TonightCard({ sky }: { sky: LandingSky }) {
  return (
    <aside className="h-fit border border-[var(--sky-text)]/35 bg-[#0a0908]/40 p-[22px] backdrop-blur-md xl:mt-[-2rem]">
      <p className="font-display text-[10px] font-extrabold uppercase tracking-[0.24em] text-accent">
        Tonight above AlUla
      </p>
      <h2 className="mb-4 mt-1.5 font-display text-[22px] font-extrabold tracking-[-0.01em] text-[var(--sky-text)]">
        The sky is open.
      </h2>

      <div className="flex items-center gap-4 border-b border-[var(--sky-text)]/25 pb-4">
        <MoonPhase phase={sky.illumination} waxing={sky.waxing} size={56} tone="light" />
        <div>
          <strong className="block font-display text-[18px] font-extrabold text-[var(--sky-text)]">
            {sky.moonPhrase}
          </strong>
          <small className="tnum text-[11px] tracking-[0.04em] text-[var(--sky-text)]/65">
            {sky.moonSet ? `Sets ${sky.moonSet} · ` : ""}
            {sky.darkHours}h true dark
          </small>
        </div>
      </div>

      <div className="my-4 grid grid-cols-2 gap-x-2.5 gap-y-3.5">
        <Cell k="Bortle" v={String(sky.bortle)} accent />
        <Cell k="Cloud" v={`${sky.cloudPercent}%`} />
        <Cell k="MW core" v={sky.coreTransit ?? "—"} />
        <Cell k="Seeing" v={sky.seeing} />
      </div>

      <Link
        href="/sky"
        className={cn(
          "flex items-center justify-between border-t border-[var(--sky-text)]/25 pt-3.5",
          "font-display text-[11px] font-extrabold uppercase tracking-[0.14em] text-accent",
          "transition-colors duration-150 ease-move hover:text-[var(--sky-text)]",
          focusRing,
        )}
      >
        Read the sky tonight
        <ArrowRight aria-hidden size={14} strokeWidth={2.5} />
      </Link>
    </aside>
  );
}

function Cell({ k, v, accent = false }: { k: string; v: string; accent?: boolean }) {
  return (
    <div>
      <p className="font-display text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--sky-text)]/50">
        {k}
      </p>
      <p
        className={cn(
          "tnum mt-0.5 font-display text-[15px] font-extrabold",
          accent ? "text-accent" : "text-[var(--sky-text)]",
        )}
      >
        {v}
      </p>
    </div>
  );
}

function SearchCell({ k, v, last = false }: { k: string; v: string; last?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 whitespace-nowrap px-3.5 py-3.5",
        last ? "" : "border-b border-[var(--sky-text)]/20 sm:border-b-0 sm:border-r",
      )}
    >
      <span className="font-display text-[9px] font-bold uppercase tracking-[0.24em] text-[var(--sky-text)]/50">
        {k}
      </span>
      <span className="tnum font-display text-[14px] font-extrabold tracking-[-0.01em] text-[var(--sky-text)]">
        {v}
      </span>
    </div>
  );
}

function Stat({ k, v, unit, s }: { k: string; v: string; unit: string; s: string }) {
  return (
    <div className="border-t border-[var(--sky-text)]/35 pt-4">
      <p className="font-display text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--sky-text)]/55">
        {k}
      </p>
      <p className="tnum my-2 font-display text-[34px] font-extrabold leading-none tracking-[-0.02em] text-[var(--sky-text)]">
        {v}
        <em className="ml-1 text-[14px] font-medium uppercase not-italic tracking-[0.04em] text-[var(--sky-text)]/60">
          {unit}
        </em>
      </p>
      <p className="max-w-[24ch] text-[12px] leading-[1.4] text-[var(--sky-text)]/60">{s}</p>
    </div>
  );
}

function SiteRow({ k, v, accent = false }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-t border-[var(--sky-text)]/15 py-2 text-[11px] uppercase tracking-[0.08em]">
      <span className="text-[var(--sky-text)]/55">{k}</span>
      <span
        className={cn(
          "tnum font-display font-extrabold",
          accent ? "text-accent" : "text-[var(--sky-text)]",
        )}
      >
        {v}
      </span>
    </div>
  );
}

/* The four L-shaped frame marks in the hero corners. */
function Corner({ className }: { className: string }) {
  return (
    <span aria-hidden className={cn("absolute z-[3] h-[18px] w-[18px]", className)}>
      <span className="absolute left-0 top-0 h-px w-full bg-[var(--sky-text)]/55" />
      <span className="absolute left-0 top-0 h-full w-px bg-[var(--sky-text)]/55" />
    </span>
  );
}
