import { Shell } from "@/components/layout/Shell";
import { AmbientStars } from "@/components/ui/AmbientStars";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LineReveal } from "@/components/ui/LineReveal";
import { Reveal } from "@/components/ui/Reveal";
import { NightPicker } from "@/components/sections/NightPicker";
import { StarChart } from "@/components/sections/StarChart";
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
      <Shell className="relative">
        {/* The star chart opens this section rather than the hero. It was
            moved out of the hero composition by HERO_REDESIGN_BRIEF, and this
            is where it earns its place: tonight's sky above, and the next
            sixty nights immediately below it. Section 8.1's ink variant, which
            is the stronger of the two. */}
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
          {/* The ambient field lives inside the copy column rather than across
              the section, which is what keeps it off the chart's viewBox at
              every breakpoint. Section 5 requires that, and a percentage
              bound on the section would have to guess at where the chart
              lands once the layout stacks. */}
          <div className="relative max-w-[46ch]">
            <AmbientStars tone="ink" className="-inset-8" />
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

          <Reveal delay={120}>
            <StarChart date={new Date()} tone="ink" />
            <p className="mt-3 text-center font-mono text-label uppercase tracking-label text-moon/45">
              Tonight at 21:00 over AlUla
            </p>
          </Reveal>
        </div>

        <Reveal delay={150} className="mt-14">
          <NightPicker nights={nights} experiences={experiences} sites={SITES} error={error} />
        </Reveal>
      </Shell>
    </section>
  );
}
