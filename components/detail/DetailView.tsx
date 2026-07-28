"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { useFavourites } from "@/lib/useFavourites";
import { parseDateKey, shortDateWithDay } from "@/lib/astro";
import type { ListItem } from "@/lib/present";
import type { SkyReading } from "@/lib/sky/types";
import { cn, focusRing } from "@/lib/cn";

/* The experience detail: scrolling main column, sticky booking panel.
 *
 * Three sections of the handoff's page have no data behind them in this
 * catalogue and are not filled with plausible substitutes:
 *
 *   - The operator itinerary. Nothing in the seeded listings publishes one.
 *     What this renders instead is the night's real sky timeline, computed
 *     rather than invented, and it says that is what it is.
 *   - "What's included". Not published either, so the section is the listing's
 *     own sourcing: where the figures came from and what about them is still
 *     unverified. That is the section CLAUDE.md rule 12 actually asks for.
 *   - The gallery thumbnail strip. There is one placeholder photograph per
 *     experience, not five, so there is no strip.
 *
 * The CTA is wired to the real booking flow rather than stubbed. The handoff
 * scoped it to a stub, but /book/[id] already writes a real Supabase row and
 * CLAUDE.md section 12 makes that end-to-end path non-negotiable for the demo;
 * a dead click here would break it.
 */

export function DetailView({
  item,
  sky,
  siteDescription,
  siteVerify,
  experienceVerify,
  source,
  bestFor,
}: {
  item: ListItem;
  sky: SkyReading;
  siteDescription: string;
  siteVerify: string[];
  experienceVerify: string[];
  source: string | null;
  bestFor: string[];
}) {
  const { favourites, toggle } = useFavourites();
  const [date, setDate] = useState(item.dates[0] ?? "");
  const [guests, setGuests] = useState(Math.max(1, item.groupMin ?? 1));

  const saved = favourites.has(item.id);
  const seats = date ? (item.seatsByDate?.[date] ?? null) : null;
  const total = item.priceSar !== null ? item.priceSar * guests : null;

  /* The night's real sky events, in the order they happen. */
  const timeline = [
    { time: sky.twilight.sunset, title: "Sunset", detail: "The sky starts to go over." },
    {
      time: sky.twilight.astronomicalDusk,
      title: "Astronomical dusk",
      detail: "The sun reaches eighteen degrees down. True dark from here.",
    },
    ...(sky.moon.set
      ? [
          {
            time: sky.moon.set,
            title: "Moonset",
            detail: `The ${sky.moon.phrase.toLowerCase()} drops out and stops washing the faint end.`,
          },
        ]
      : []),
    ...(sky.twilight.milkyWayCoreTransit
      ? [
          {
            time: sky.twilight.milkyWayCoreTransit,
            title: "Milky Way core transit",
            detail: "The galactic centre crosses the meridian, as high as it gets tonight.",
          },
        ]
      : []),
    ...(sky.iss
      ? [
          {
            time: sky.iss.time,
            title: "ISS pass",
            detail: `${sky.iss.minutes} minutes, ${sky.iss.track}.`,
          },
        ]
      : []),
    {
      time: sky.twilight.astronomicalDawn,
      title: "Astronomical dawn",
      detail: "Twilight comes back up and the window closes.",
    },
  ];

  return (
    <div className="grid min-h-[calc(100vh-var(--topbar-h))] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_440px]">
      <div className="min-w-0">
        <div className="relative h-[360px] overflow-hidden bg-neutral-300">
          {item.image ? (
            /* PLACEHOLDER — replace with real, sourced AlUla/site photography before demo */
            <Image
              src={item.image.src}
              alt={item.image.alt}
              fill
              sizes="(min-width: 1280px) 70vw, 100vw"
              className="photo-duotone-hero object-cover"
              priority
            />
          ) : null}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,.75))",
            }}
          />

          <Link
            href="/discover"
            className={cn(
              "absolute left-5 top-5 inline-flex items-center gap-2 border-2 border-text bg-bg px-3.5 py-2",
              "text-[12px] uppercase tracking-[0.08em] text-text",
              "transition-colors duration-150 ease-move hover:bg-text hover:text-bg",
              focusRing,
            )}
          >
            <ArrowLeft aria-hidden size={14} strokeWidth={2.5} />
            Back to tonight
          </Link>

          <div className="absolute inset-x-8 bottom-6 text-bg">
            <p className="mb-2.5 text-[11px] uppercase tracking-[0.14em] opacity-85">
              {item.siteName}
              {item.approximate ? " · location approximate" : ""}
            </p>
            <h1 className="max-w-[640px] font-display text-[48px] font-extrabold leading-none tracking-[-0.02em]">
              {item.title}
            </h1>
          </div>

          <p className="absolute bottom-0 right-0 bg-text/85 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-bg">
            Placeholder image, not {item.siteName}
          </p>
        </div>

        <div className="p-8">
          <Reveal>
            {item.description ? (
              <p className="mb-6 max-w-[62ch] font-display text-[22px] font-extrabold leading-[1.4] tracking-[-0.01em]">
                {item.description}
              </p>
            ) : null}

            <div className="my-6 grid grid-cols-2 border-b-2 border-t-2 border-divider md:grid-cols-4">
              <Fact label="Duration" value={item.durationLabel ?? "—"} caption="As listed" />
              <Fact
                label="Sky quality"
                value={item.bortle !== null ? `B ${item.bortle}` : "—"}
                caption="DarkSky class"
              />
              <Fact
                label="Group size"
                value={item.groupMax !== null ? `≤ ${item.groupMax}` : `From ${item.groupMin ?? 1}`}
                caption={item.groupMax !== null ? "Per departure" : "Maximum not published"}
              />
              <Fact
                label="Seats left"
                value={seats !== null ? String(seats) : "—"}
                caption={date ? shortDateWithDay(parseDateKey(date)) : "Pick a night"}
                last
              />
            </div>

            <p className="mb-4 max-w-[62ch] text-[15px] leading-[1.65]">{siteDescription}</p>
            {bestFor.length ? (
              <p className="mb-4 max-w-[62ch] text-[15px] leading-[1.65]">
                The terrain here suits {bestFor.join(", ").replace(/-/g, " ")}, which is what the
                night picker matches against when it recommends a site for a given date.
              </p>
            ) : null}
          </Reveal>

          <section className="border-t-2 border-divider py-6">
            <Reveal>
              <h2 className="mb-3.5 font-display text-[20px] font-extrabold tracking-[-0.01em]">
                The sky on this night
              </h2>
              <p className="mb-4 max-w-[62ch] text-[13px] text-text/65">
                Not the operator&rsquo;s schedule, which this listing does not publish. These are
                the night&rsquo;s own events over AlUla.
              </p>
            </Reveal>
            {/* One Reveal around the whole grid, not one per row: each row is
                two direct grid children held together by display:contents on
                its wrapper (so the time column and text column line up across
                rows), and opacity/transform are silently no-ops on a
                display:contents element — there is no box left to animate.
                A per-row stagger would have compiled and rendered but simply
                never animated anything. */}
            <Reveal>
              <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-x-5 gap-y-3">
                {timeline.map((entry, i) => (
                  <div key={`${entry.time}-${entry.title}`} className="contents">
                    <span className="tnum pt-0.5 font-display text-[14px] font-extrabold text-accent-700">
                      {entry.time}
                    </span>
                    <span
                      className={cn(
                        "pb-3 text-[14px] leading-[1.55]",
                        i === timeline.length - 1 ? "" : "border-b border-divider",
                      )}
                    >
                      <strong className="mb-1 block font-display text-[14px] font-extrabold">
                        {entry.title}
                      </strong>
                      {entry.detail}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </section>

          <section className="border-t-2 border-divider py-6">
            <Reveal>
            <h2 className="mb-3.5 font-display text-[20px] font-extrabold tracking-[-0.01em]">
              Where these figures come from
            </h2>
            {item.fictional ? (
              /* Demo inventory says so on its own page, not just in a code
                 comment. The prototype is populated on purpose; passing that
                 off as a sourced listing is the thing rule 12 exists to
                 prevent. */
              <p className="mb-4 max-w-[62ch] border-2 border-accent-600 bg-accent-100 p-4 text-[14px] leading-[1.6]">
                <strong className="font-display font-extrabold">
                  Demo inventory, not a real listing.
                </strong>{" "}
                This operator and this price were written to populate the prototype for the Ravyn
                bootcamp build. Nothing here is bookable. The three sourced products in the
                catalogue carry a link to the listing they came from instead of this notice.
              </p>
            ) : (
              <p className="mb-4 text-[14px] leading-[1.6]">
                Price, duration and group size are taken from the operator&rsquo;s public listing.{" "}
                {source ? (
                  <a
                    href={source}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "text-accent-700 underline underline-offset-4 hover:text-text",
                      focusRing,
                    )}
                  >
                    View the source listing
                  </a>
                ) : null}
              </p>
            )}
            {[...experienceVerify, ...siteVerify].length ? (
              <ul className="grid gap-2 md:grid-cols-2">
                {[...experienceVerify, ...siteVerify].map((note) => (
                  <li key={note} className="text-[14px] leading-[1.6] text-text/75">
                    · {note}
                  </li>
                ))}
              </ul>
            ) : null}
            </Reveal>
          </section>
        </div>
      </div>

      <aside className="border-divider bg-bg p-6 xl:border-l-2">
        <div className="xl:sticky xl:top-6">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.12em] text-text/60">
            Operated by {item.operatorName}
          </p>
          {item.priceSar !== null ? (
            <p className="tnum mt-1.5 font-display text-[34px] font-extrabold tracking-[-0.02em]">
              SAR {item.priceSar}
              <small className="ml-1.5 text-[12px] font-normal uppercase tracking-[0.06em] text-text/60">
                / person
              </small>
            </p>
          ) : null}
          {/* Rule 15: the payment step is a mock and says so here rather than
              at the end. No "no OTA fee" claim — there is no marketplace to
              compare against. */}
          <p className="mt-2 font-display text-[11px] font-bold uppercase tracking-[0.06em] text-accent-700">
            Books through Suhail · demo mode
          </p>

          <div className="my-5 h-0.5 bg-divider" />

          <label
            htmlFor="detail-date"
            className="mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-text/65"
          >
            Date
          </label>
          <select
            id="detail-date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={cn(
              "mb-3 w-full cursor-pointer border-2 border-text bg-bg px-3 py-2.5 font-display text-[14px] font-extrabold",
              focusRing,
            )}
          >
            {item.dates.length === 0 ? (
              <option value="">No nights currently open</option>
            ) : (
              item.dates.map((key) => (
                <option key={key} value={key}>
                  {shortDateWithDay(parseDateKey(key))}
                </option>
              ))
            )}
          </select>

          <label
            htmlFor="detail-guests"
            className="mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-text/65"
          >
            Guests
          </label>
          <input
            id="detail-guests"
            type="number"
            min={item.groupMin ?? 1}
            max={item.groupMax ?? undefined}
            value={guests}
            onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
            className={cn(
              "w-full border-2 border-text bg-bg px-3 py-2.5 font-display text-[14px] font-extrabold",
              focusRing,
            )}
          />
          <p className="mt-1.5 text-[11px] text-text/60">
            {item.groupMin ? `Minimum ${item.groupMin}. ` : ""}
            {item.groupMax ? `Maximum ${item.groupMax}.` : "Maximum not published."}
          </p>

          {/* Modernist: the label sits flush left and the arrow flush right,
              which is what align="between" carries.

              The booking page reads `date` and resolves guests in its own
              form, so only the date is carried across. Passing a guests param
              it does not read would look wired and quietly not be. */}
          <Button
            href={date ? `/book/${item.id}?date=${date}` : `/book/${item.id}`}
            variant="primary"
            align="between"
            block
            className="mb-3 mt-5 px-[18px] py-4 font-display text-[14px] font-extrabold"
          >
            {total !== null ? `Reserve — SAR ${total.toLocaleString("en-GB")}` : "Reserve"}
            <ArrowRight aria-hidden size={16} strokeWidth={2.5} />
          </Button>

          <Button
            variant="secondary"
            align="between"
            block
            onClick={() => toggle(item.id)}
            className="px-[18px] py-3 font-display text-[13px] font-bold"
          >
            {saved ? "Saved to this device" : "Save to trip"}
            <Heart aria-hidden size={15} strokeWidth={2.2} className={saved ? "fill-current" : ""} />
          </Button>

          <div className="mt-5 border-2 border-text bg-neutral-100 p-4">
            <h3 className="mb-2.5 font-display text-[12px] font-extrabold uppercase tracking-[0.14em]">
              The sky at your slot · {sky.twilight.astronomicalDusk}
            </h3>
            <SlotRow k="Moon" v={`${sky.moon.set ? `Sets ${sky.moon.set} · ` : ""}${Math.round(sky.moon.illumination * 100)}%`} />
            <SlotRow k="Bortle" v={item.bortle !== null ? String(item.bortle) : "—"} />
            <SlotRow k="Cloud" v={`${sky.cloud.overallPercent}% · ${sky.cloud.summary}`} />
            {sky.twilight.milkyWayCoreTransit ? (
              <SlotRow k="Milky Way core" v={`Overhead ${sky.twilight.milkyWayCoreTransit}`} />
            ) : null}
            <SlotRow k="Temperature" v={`${sky.cloud.temperatureC}°C · ${sky.cloud.windKph} km/h`} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t-2 border-divider pt-5 text-[11px] uppercase tracking-[0.04em] text-text/60">
            <div>
              <strong className="mb-0.5 block font-display text-[13px] font-extrabold tracking-[0.02em] text-text">
                Real booking row
              </strong>
              Written to Supabase
            </div>
            <div>
              <strong className="mb-0.5 block font-display text-[13px] font-extrabold tracking-[0.02em] text-text">
                No payment taken
              </strong>
              Demo mode, no card
            </div>
          </div>
        </Reveal>
        </div>
      </aside>
    </div>
  );
}

function Fact({
  label,
  value,
  caption,
  last = false,
}: {
  label: string;
  value: string;
  caption: string;
  last?: boolean;
}) {
  return (
    <div className={cn("py-4 pr-5", last ? "" : "border-r border-divider")}>
      <p className="text-[10px] uppercase tracking-[0.12em] text-text/60">{label}</p>
      <p className="tnum my-2 font-display text-[28px] font-extrabold leading-none tracking-[-0.02em] text-accent-700">
        {value}
      </p>
      <p className="text-[11px] text-text/60">{caption}</p>
    </div>
  );
}

function SlotRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-divider py-1.5 last:border-b-0">
      <span className="text-[10px] uppercase tracking-[0.06em] text-text/65">{k}</span>
      <span className="tnum font-display text-[12px] font-extrabold">{v}</span>
    </div>
  );
}
