import { Button } from "@/components/ui/Button";
import { CoordinateTag } from "@/components/ui/CoordinateTag";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LineReveal } from "@/components/ui/LineReveal";
import { MoonPhase } from "@/components/ui/MoonPhase";
import { Reveal } from "@/components/ui/Reveal";
import { Shell } from "@/components/layout/Shell";
import { AmbientStars } from "@/components/ui/AmbientStars";
import { StarChart } from "@/components/sections/StarChart";
import { isWaxing, moonPhase, moonPhaseLabel } from "@/lib/astro";
import type { HeroContent } from "@/data/home";

/* CLAUDE.md section 5 rhythm: the hero is cream, the night picker is the ink
   section. Section 8.1: the chart bleeds past the right edge and is cropped
   by the viewport, and that asymmetry is deliberate.

   The background runs to the top of the page rather than starting below the
   nav, so the glass pill has something to blur. Content clears it with
   --nav-clearance. */

export function Hero({ content, date }: { content: HeroContent; date: Date }) {
  const phase = moonPhase(date);
  const percent = Math.round(phase * 100);

  return (
    <section className="relative overflow-hidden pb-20 pt-[var(--nav-clearance)]">
      {/* Section 5: the field never overlaps the chart's viewBox. The chart
          sits in the right column on lg+ and below the copy when stacked, so
          the layer is bounded to what is left in each case. */}
      <AmbientStars tone="cream" className="bottom-[54%] lg:bottom-0 lg:right-[48%]" />

      <Shell className="relative">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
          <div className="max-w-[36ch] lg:py-16">
            <Reveal>
              <Eyebrow className="mb-7">{content.eyebrow}</Eyebrow>
            </Reveal>

            <LineReveal as="h1" lines={content.headingLines} className="text-hero" />

            <Reveal delay={90}>
              <p className="mt-7 text-muted">{content.sub}</p>
            </Reveal>

            <Reveal delay={180}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                {/* section 5: the pill marks the one hero-level action */}
                <Button href={content.primary.href} variant="accent" pill>
                  {content.primary.label}
                </Button>
                <Button href={content.secondary.href}>{content.secondary.label}</Button>
              </div>
            </Reveal>
          </div>

          {/* The bleed. Past the right grid edge on lg+, softly cropped by the
              viewport. Below lg it sits square in the column, because a
              cropped chart on a phone is just a missing chart. */}
          <div className="relative -mx-6 sm:mx-0 lg:-mr-[15vw] lg:w-[calc(100%+15vw)]">
            <StarChart date={date} tone="cream" />
          </div>
        </div>
      </Shell>

      <Shell className="relative mt-12 lg:mt-4">
        <Reveal delay={240}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-6">
            <MoonPhase phase={phase} waxing={isWaxing(date)} size={28} />
            <CoordinateTag
              items={[
                "26.61°N",
                "ALULA, KSA",
                "4 DARKSKY RESERVES",
                `TONIGHT'S MOON: ${percent}% ${moonPhaseLabel(phase).toUpperCase()}`,
              ]}
            />
          </div>
        </Reveal>
      </Shell>
    </section>
  );
}
