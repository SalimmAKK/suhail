"use client";

import Image from "next/image";
import Link from "next/link";
import { CATEGORY_LABEL } from "@/data/experiences";
import type { ListItem } from "@/lib/present";
import { cn, focusRing } from "@/lib/cn";

/* A search result: horizontal, not a card. 200px thumb, flexible middle,
   180px price column, with a 2px rule under each row and a 3% ink wash on
   hover.

   The attribute strip prints what the catalogue actually holds. The mock's
   row reads "Bortle 2.0 · ≤ 12 guests · 10" telescope · Pickup included";
   telescope aperture and pickup are not in any of the seeded listings, so
   those two cells are absent rather than filled with a plausible number.
   What is here — certified class, group cap, duration — is sourced. */

export function ResultRow({
  item,
  rank,
  onHover,
}: {
  item: ListItem;
  rank: number;
  onHover: (siteSlug: string | null) => void;
}) {
  return (
    <article
      onMouseEnter={() => onHover(item.siteSlug)}
      onMouseLeave={() => onHover(null)}
      /* The hover tint flips rather than transitions. Animating a background
         behind a row this dense repaints all of its text for every frame of
         the transition, and with the cursor sitting over the list while it
         scrolls that fires constantly: it measured as 142ms of the 328ms this
         route spent rendering a thirty-step scroll. The handoff specifies a
         120ms transition for card borders, not for result rows, so this is
         also the closer reading of it. */
      className="relative grid grid-cols-[200px_minmax(0,1fr)_180px] items-start gap-5 border-b-2 border-divider px-7 py-5 hover:bg-text/3"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-200">
        {item.image ? (
          /* PLACEHOLDER — replace with real, sourced AlUla/site photography before demo */
          <Image
            src={item.image.src}
            alt={item.image.alt}
            fill
            sizes="200px"
            className="photo-duotone object-cover"
          />
        ) : null}
        <span className="absolute left-2 top-2 inline-flex h-6 w-6 items-center justify-center bg-accent font-display text-[11px] font-extrabold text-text">
          {rank}
        </span>
        <span
          title={item.image?.alt}
          className="absolute bottom-1.5 right-1.5 bg-bg/90 px-1.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-text/70"
        >
          Stock
        </span>
      </div>

      <div>
        {/* wraps rather than truncating: the operator's name is the third
            thing in this line and was the part being cut off */}
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <p className="text-[10px] uppercase tracking-[0.14em] text-accent-700">
            {item.siteName}
            {item.durationLabel ? ` · ${item.durationLabel}` : ""} · {item.operatorName}
          </p>
          {item.category ? (
            <span className="shrink-0 border border-accent px-1.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.1em] text-accent-700">
              {CATEGORY_LABEL[item.category]}
            </span>
          ) : null}
        </div>

        <h3 className="font-display text-[20px] font-extrabold tracking-[-0.01em]">
          <Link href={`/experiences/${item.slug}`} className={cn("before:absolute before:inset-0", focusRing)}>
            {item.title}
          </Link>
        </h3>

        {item.description ? (
          <p className="mt-1.5 max-w-[60ch] text-[13px] leading-[1.55] text-text/75">
            {item.description}
          </p>
        ) : null}

        <div className="mt-2.5 flex flex-wrap">
          {item.bortle !== null ? (
            <Attr>
              Bortle <strong className="font-display font-extrabold text-text">{item.bortle}</strong>
            </Attr>
          ) : null}
          {item.groupMax !== null ? (
            <Attr>
              &le; <strong className="font-display font-extrabold text-text">{item.groupMax}</strong>{" "}
              guests
            </Attr>
          ) : null}
          {item.durationLabel ? (
            <Attr>
              <strong className="font-display font-extrabold text-text">{item.durationLabel}</strong>{" "}
              on site
            </Attr>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 text-right">
        {item.priceSar !== null ? (
          <>
            <span className="text-[10px] uppercase tracking-[0.12em] text-text/60">From</span>
            <span className="tnum font-display text-[22px] font-extrabold tracking-[-0.01em]">
              SAR {item.priceSar}
            </span>
            <span className="text-[10px] uppercase tracking-[0.12em] text-text/60">per person</span>
          </>
        ) : null}
        {item.seatsLeft !== null ? (
          <span className="tnum mt-auto pt-3 font-display text-[11px] font-bold uppercase tracking-[0.06em] text-accent-700">
            {item.seatsLeft} {item.seatsLeft === 1 ? "seat" : "seats"} left
          </span>
        ) : null}
      </div>
    </article>
  );
}

function Attr({ children }: { children: React.ReactNode }) {
  return (
    <span className="mr-2 border-r border-divider py-0.5 pr-2 text-[11px] uppercase tracking-[0.04em] text-text/60 last:mr-0 last:border-r-0 last:pr-0">
      {children}
    </span>
  );
}
