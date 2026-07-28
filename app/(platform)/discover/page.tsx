import { DiscoveryView } from "@/components/discovery/DiscoveryView";
import { HOME_HEADER } from "@/data/home";
import { getCatalog } from "@/lib/catalog";
import { toListItem } from "@/lib/present";
import { dateKey, moonPhrase, shortDate, upcomingNights } from "@/lib/astro";

/* Discovery is the default view, so it sits at the root.
 *
 * This replaces the inventory board that PAGE_COMPOSITION_BRIEF put here. The
 * board's job — open on real bookable inventory rather than a hero — is the
 * same job the handoff's discovery view does, in a split with a live map
 * instead of a single column.
 *
 * The night picker keeps /tonight and its own URL. This page opens the same
 * sixty cells from the "Pick a date" chip and links through to the full page
 * for the star chart and the per-night readout, so nothing was moved or
 * renamed to make room.
 *
 * force-dynamic for the same reason the rest of the product is: the sixty
 * nights start from today, and a prerendered page would keep offering
 * whichever sixty the build happened to catch.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  const nights = upcomingNights(60).map(dateKey);
  const { experiences, siteCount, error } = await getCatalog(
    nights[0],
    nights[nights.length - 1],
  );

  const now = new Date();
  /* Seats are per night, so the list is built against tonight — the scope the
     view opens on. */
  const items = experiences.map((e) => toListItem(e, nights[0]));

  return (
    <DiscoveryView
      items={items}
      nights={nights}
      eyebrow={`Tonight · ${shortDate(now)} · ${moonPhrase(now)}`}
      headline={HOME_HEADER.headline}
      sub={HOME_HEADER.sub}
      siteCount={siteCount}
      error={error}
    />
  );
}
