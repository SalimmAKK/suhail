import { Shell } from "@/components/layout/Shell";
import { AmbientStars } from "@/components/ui/AmbientStars";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LineReveal } from "@/components/ui/LineReveal";
import { Reveal } from "@/components/ui/Reveal";
import { NightPicker } from "@/components/sections/NightPicker";
import { SITES } from "@/data/sites";
import { getCatalog } from "@/lib/catalog";
import { dateKey, upcomingNights } from "@/lib/astro";
import type { PageIntro } from "@/data/tonight";

/* The ink section that carries the night picker, per section 5's rhythm:
   this is the moment on the page.

   A server component that fetches the catalogue and hands it to the client
   picker as props. The picker itself holds only selection state, so the
   experience list and the sixty date keys are settled before any JavaScript
   runs. Fixing the dates on the server also means the grid cannot disagree
   with itself across a midnight boundary between render and hydration.

   Used by both the landing page and /tonight with different framing copy,
   which is rule 2.1/5: the same component, never the same words. */

const NIGHTS = 60;

export async function NightPickerSection({
  intro,
  headingAs = "h2",
}: {
  intro: PageIntro;
  headingAs?: "h1" | "h2";
}) {
  const nights = upcomingNights(NIGHTS).map(dateKey);
  const { experiences, error } = await getCatalog(nights[0], nights[nights.length - 1]);

  return (
    <section
      data-nav-tone="ink"
      className="relative overflow-hidden bg-ink pb-24 pt-[var(--nav-clearance)]"
    >
      <AmbientStars tone="ink" />

      <Shell className="relative">
        <div className="max-w-[46ch]">
          <Reveal>
            <Eyebrow tone="light" className="mb-7">
              {intro.eyebrow}
            </Eyebrow>
          </Reveal>
          <LineReveal as={headingAs} lines={intro.headingLines} className="text-pull text-moon" />
          <Reveal delay={90}>
            <p className="mt-6 text-moon/70">{intro.sub}</p>
          </Reveal>
        </div>

        <Reveal delay={150} className="mt-14">
          <NightPicker nights={nights} experiences={experiences} sites={SITES} error={error} />
        </Reveal>
      </Shell>
    </section>
  );
}
