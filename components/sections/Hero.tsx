import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { CoordinateTag } from "@/components/ui/CoordinateTag";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LineReveal } from "@/components/ui/LineReveal";
import { MoonPhase } from "@/components/ui/MoonPhase";
import { Reveal } from "@/components/ui/Reveal";
import { Shell } from "@/components/layout/Shell";
import { AmbientStars } from "@/components/ui/AmbientStars";
import { isWaxing, moonPhase, moonPhaseLabel } from "@/lib/astro";
import type { HeroContent } from "@/data/home";

/* HERO_REDESIGN_BRIEF: a photo/split hero.

   The star chart used to bleed off the right edge here. It has moved to the
   top of the night picker section, where it opens the dark passage of the
   page rather than competing with the headline. It is not gone from the
   product: section 8.1 still holds.

   The image stacks under the copy below lg rather than being squeezed beside
   it. A split that survives to 390px is not a split, it is two slivers.

   Section 5's rhythm is unchanged: this is still the cream section, and the
   ambient starfield still sits behind the copy, bounded away from the photo
   so the two are never competing for the same pixels. */

export function Hero({ content, date }: { content: HeroContent; date: Date }) {
  const phase = moonPhase(date);
  const percent = Math.round(phase * 100);

  return (
    <section className="relative overflow-hidden pb-16 pt-[var(--section-top)]">
      <AmbientStars tone="cream" className="bottom-[46%] lg:bottom-0 lg:right-[46%]" />

      <Shell className="relative">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          {/* No width cap on the column: Newsreader sets wider than Bricolage
              did, and at 38ch the second headline line wrapped to a third,
              which breaks both the composition and LineReveal's per-line
              mask. The sub-copy carries its own measure instead. */}
          <div className="lg:py-10">
            <Reveal>
              <Eyebrow className="mb-7">{content.eyebrow}</Eyebrow>
            </Reveal>

            <LineReveal as="h1" lines={content.headingLines} className="text-h1" />

            <Reveal delay={90}>
              <p className="mt-7 max-w-[42ch] text-neutral-700">{content.sub}</p>
            </Reveal>

            <Reveal delay={180}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                {/* section 5: the marks the one hero-level action */}
                <Button href={content.primary.href} variant="primary">
                  {content.primary.label}
                </Button>
                <Button href={content.secondary.href} variant="secondary">
                  {content.secondary.label}
                </Button>
              </div>
            </Reveal>
          </div>

          {/* PLACEHOLDER — replace with real, sourced AlUla/site photography before demo */}
          <Reveal delay={120}>
            <figure className="relative">
              {/* A fixed aspect ratio in both layouts, so the image reserves
                  its space before it loads and the hero cannot shift. */}
              <div className="relative aspect-[3/2] w-full overflow-hidden bg-surface lg:aspect-[4/5]">
                <Image
                  src={content.image.src}
                  alt={content.image.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 46vw, 100vw"
                  /* The subject sits along the bottom of the frame. In the
                     stacked 3:2 crop a centred image keeps only sky and the
                     terrain disappears, so the crop is anchored low until the
                     tall 4:5 portrait box takes over at lg. */
                  className="object-cover object-bottom lg:object-center"
                />
              </div>
              {/* Rule 12 in the small: stock is labelled as stock, on the
                  image, rather than left to read as a photograph of a place
                  Suhail actually sends people to. */}
              <figcaption className="absolute bottom-0 left-0 bg-text px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-label text-bg">
                {content.image.caption}
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </Shell>

      <Shell className="relative mt-12">
        <Reveal delay={240}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-divider pt-6">
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
