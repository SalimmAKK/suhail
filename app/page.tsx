import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ExperienceBoard } from "@/components/sections/ExperienceBoard";
import { HOME_HEADER } from "@/data/home";
import { getCatalog } from "@/lib/catalog";
import { dateKey, upcomingNights } from "@/lib/astro";

/* PAGE_COMPOSITION_BRIEF: the homepage opens on live inventory.
 *
 * A compact header line, a working filter row, the real bookable experiences
 * as cards, and the map. No hero section, no introduction, and no second
 * copy of the night picker: the star chart and the sixty-night picker are
 * the whole of /tonight already, so they are linked rather than duplicated.
 *
 * Counts come from the catalogue at render time. There are three seeded
 * experiences and the page says three.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  const nights = upcomingNights(60).map(dateKey);
  const { experiences, error } = await getCatalog(nights[0], nights[nights.length - 1]);

  return (
    <Shell className="pb-24 pt-10">
      <div className="max-w-[62ch]">
        <Eyebrow className="mb-4">{HOME_HEADER.eyebrow}</Eyebrow>
        <h1 className="text-h1">{HOME_HEADER.headline}</h1>
        <p className="mt-4 text-neutral-700">
          {HOME_HEADER.sub}{" "}
          <Link
            href="/tonight"
            className="text-accent-700 underline underline-offset-4 hover:text-text"
          >
            See the sky for any of the next sixty nights
          </Link>
          .
        </p>
      </div>

      <ExperienceBoard experiences={experiences} error={error} />
    </Shell>
  );
}
