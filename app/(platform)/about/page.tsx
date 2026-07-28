import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LineReveal } from "@/components/ui/LineReveal";
import { Reveal } from "@/components/ui/Reveal";
import { cn, focusRing } from "@/lib/cn";

export const metadata: Metadata = {
  title: "About / Suhail",
  description: "What Suhail is, why now, and who is building it.",
};

/* CLAUDE.md rule 6: the star gets referenced once, well, here, and not again
 * elsewhere in the product. BUILD_PLAN stage 9 calls for a single founder
 * note, no fake team — this is written in one voice because it is built by
 * one person, not because a team was trimmed out of the copy.
 *
 * The horizon figure below (about eleven degrees) is computed, not a nice
 * round guess: 90 - AlUla's latitude (26.6°N) + Canopus's declination
 * (-52.7°) = 10.7°, the same maxAltitude() math lib/astro.ts already uses
 * for the star chart.
 *
 * No links to pitch documents: BUILD_PLAN mentions volumes that don't exist
 * in this repo, and a link to a document that isn't there is exactly the
 * placeholder CLAUDE.md rule 2.2/8 rules out. What's here instead links back
 * into the product itself, since that's the actual pitch.
 */

export default function About() {
  return (
    <section className="pb-24 pt-[var(--section-top)]">
      <Shell className="max-w-[720px]">
        <Reveal>
          <Eyebrow className="mb-6">About</Eyebrow>
        </Reveal>

        <LineReveal
          as="h1"
          lines={["Named for a star", "you can only see from here."]}
          className="text-h2"
        />

        <Reveal delay={90}>
          <p className="mt-8 max-w-[58ch] text-[17px] leading-[1.7] text-neutral-700">
            Suhail is the Arabic name for Canopus, the second-brightest star in the sky and one
            that never rises at all across most of Europe. From AlUla it clears the southern
            horizon by about eleven degrees — enough to be genuinely visible, not enough to be
            easy, which is exactly why old caravan routes and sea crossings from this part of the
            world were once plotted by it. A star that only shows itself to people standing in the
            right place felt like the right name for a product whose whole premise is that this
            specific place, on this specific night, is worth going out for.
          </p>
        </Reveal>

        <Reveal delay={140}>
          <div className="mt-12 space-y-6 border-t border-divider pt-10">
            <h2 className="text-h4">Why this, why now</h2>
            <p className="max-w-[58ch] text-[16px] leading-[1.75] text-neutral-700">
              AlUla and the reserves around it started certifying as Dark Sky Parks in 2024 — the
              first in Saudi Arabia and the Gulf — and together they form one of the largest
              connected dark-sky areas anywhere. That certification is real and it is recent. What
              doesn&rsquo;t exist yet is a straightforward way for someone planning a trip to see
              what that sky is actually doing on the night they&rsquo;ll be there, and book the
              operator running something that night, in one flow. Right now that means checking a
              moon-phase app, then separately checking a handful of tour operators&rsquo; own
              booking pages, and hoping the two line up. Suhail is that missing middle step: the
              sky&rsquo;s real conditions and the region&rsquo;s real, bookable experiences, in the
              same place.
            </p>
          </div>
        </Reveal>

        <Reveal delay={190}>
          <div className="mt-12 space-y-6 border-t border-divider pt-10">
            <h2 className="text-h4">Who&rsquo;s building it</h2>
            <p className="max-w-[58ch] text-[16px] leading-[1.75] text-neutral-700">
              I&rsquo;m Salim, and I built Suhail on my own as a project for Ravyn Academy&rsquo;s
              summer 2026 cohort — not a funded startup, not a team, a bootcamp build made to the
              standard of one. That means the parts of this product that are real are actually
              real: the four sites are genuinely certified, the seeded experiences and their
              prices come from operators&rsquo; own public listings with a source link on every
              one, and a booking here writes a real row to a real database rather than pretending
              to. It also means the parts that aren&rsquo;t real yet say so, out loud, on the page
              rather than in a comment nobody sees: the payment step is explicitly marked demo
              mode, and a handful of experiences built to round out the catalogue are labelled as
              invented rather than passed off as sourced.
            </p>
            <p className="max-w-[58ch] text-[16px] leading-[1.75] text-neutral-700">
              That distinction matters more to me than making the demo look finished. A product
              that quietly blurs invented data into real data is worse than one that is openly a
              prototype in places, because the first one is asking you to trust it and the second
              one doesn&rsquo;t have to.
            </p>
          </div>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-divider pt-10">
            <Button href="/discover" variant="primary">
              See tonight&rsquo;s sky
            </Button>
            <Link
              href="/contact"
              className={cn(
                "font-display text-label uppercase tracking-label text-accent-700 underline underline-offset-4 hover:text-text",
                focusRing,
              )}
            >
              Get in touch
            </Link>
          </div>
        </Reveal>
      </Shell>
    </section>
  );
}
