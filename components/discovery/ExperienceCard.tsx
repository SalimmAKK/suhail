"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { CATEGORY_LABEL } from "@/data/experiences";
import type { ListItem } from "@/lib/present";
import { cn, focusRing } from "@/lib/cn";

/* The discovery card.
 *
 * 2px divider border that goes to full ink on hover over 120ms, a 4:3
 * duotoned thumbnail, and four overlays on it: the rank square, the favourite
 * toggle, the darkness pill and the stock tag.
 *
 * The pill reads "Bortle 2" rather than the mock's "Bortle 2.0". The decimal
 * implies a per-site sky-brightness measurement, and what data/sites.ts holds
 * is the DarkSky certification class, an integer.
 *
 * Colour, against the mock's all-cream card: the pill is ink with a gold
 * figure, the category tag is gold-outlined, and the operator/price row sits
 * on sand. The card ends on a band of the palette rather than trailing off
 * into the page background.
 *
 * Motion system: the whole card lifts 3px with a deepening shadow on hover,
 * on top of the border darkening it already did. The one extra detail is the
 * thumbnail itself — a slow, contained scale toward the viewer, clipped by
 * the same overflow-hidden wrapper the corner badges already sit inside, so
 * nothing else on the card moves or needs to be masked separately.
 */

export function ExperienceCard({
  item,
  rank,
  favourite,
  onToggleFavourite,
  onHover,
}: {
  item: ListItem;
  rank: number;
  favourite: boolean;
  onToggleFavourite: (id: string) => void;
  onHover: (siteSlug: string | null) => void;
}) {
  return (
    <article
      onMouseEnter={() => onHover(item.siteSlug)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "group relative flex flex-col border-2 border-divider bg-bg",
        "transition-[transform,box-shadow,border-color] duration-200 ease-move",
        "hover:-translate-y-1 hover:border-text hover:shadow-md",
        "motion-reduce:transition-colors motion-reduce:duration-[120ms] motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-200">
        {item.image ? (
          /* PLACEHOLDER — replace with real, sourced AlUla/site photography before demo */
          <Image
            src={item.image.src}
            alt={item.image.alt}
            fill
            sizes="(min-width: 1280px) 22vw, 45vw"
            className="photo-duotone object-cover transition-transform duration-[550ms] ease-move group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : null}

        <span className="absolute left-2.5 top-2.5 inline-flex h-[26px] w-[26px] items-center justify-center bg-accent font-display text-[12px] font-extrabold text-text">
          {rank}
        </span>

        <button
          type="button"
          onClick={() => onToggleFavourite(item.id)}
          aria-pressed={favourite}
          aria-label={favourite ? `Remove ${item.title} from saved` : `Save ${item.title}`}
          className={cn(
            /* above the title link's stretched hit area, which covers the card */
            "absolute right-2.5 top-2.5 z-[1] inline-flex h-[26px] w-[26px] items-center justify-center bg-bg text-text",
            focusRing,
          )}
        >
          <Heart
            aria-hidden
            size={13}
            strokeWidth={2.2}
            className={favourite ? "fill-accent text-accent" : ""}
          />
        </button>

        {item.bortle !== null ? (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 bg-text px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-bg">
            Bortle <span className="tnum text-accent">{item.bortle}</span>
          </span>
        ) : null}

        {/* The full "placeholder image, not <site>" sentence used to run as a
            bar across the bottom of every picture. On a grid of nineteen it
            was the loudest thing on the page. It is a corner tag now, and the
            whole sentence still lives in the alt text and on the detail
            page — the claim is kept, the shouting is not. */}
        <span
          title={item.image?.alt}
          className="absolute bottom-2.5 right-2.5 bg-bg/90 px-1.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.12em] text-text/70"
        >
          Stock
        </span>
      </div>

      <div className="flex flex-1 flex-col px-4 pt-3.5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="tnum truncate text-[10px] uppercase tracking-[0.14em] text-accent-700">
            {item.siteName}
            {item.durationLabel ? ` · ${item.durationLabel}` : ""}
          </p>
          {item.category ? (
            <span className="shrink-0 border border-accent px-1.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-[0.1em] text-accent-700">
              {CATEGORY_LABEL[item.category]}
            </span>
          ) : null}
        </div>

        <h3 className="font-display text-[17px] font-extrabold leading-[1.15] tracking-[-0.01em]">
          {/* The whole card is the target; the link carries the accessible
              name and stretches to cover it. */}
          <Link href={`/experiences/${item.slug}`} className={cn("before:absolute before:inset-0", focusRing)}>
            {item.title}
          </Link>
        </h3>

        {/* The meta row sits on sand rather than on the card's own cream, so
            each card ends on a band of the palette instead of trailing off. */}
        <div className="-mx-4 mt-3 flex flex-1 items-baseline justify-between gap-3 border-t-2 border-divider bg-surface px-4 py-2.5">
          <span className="truncate text-[11px] uppercase tracking-[0.06em] text-text/70">
            {item.operatorName}
          </span>
          {item.priceSar !== null ? (
            <span className="tnum shrink-0 font-display text-[16px] font-extrabold">
              SAR {item.priceSar}
              <small className="ml-1 text-[11px] font-normal uppercase tracking-[0.06em] text-text/60">
                / person
              </small>
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
