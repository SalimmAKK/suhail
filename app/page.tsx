import { Hero } from "@/components/sections/Hero";
import { NightPickerSection } from "@/components/sections/NightPickerSection";
import { HERO, NIGHT_PICKER } from "@/data/home";

/* Stage 4 and 5: the hero, then the night picker. The sites and the
   credibility strip follow in stages 6 and 9.

   Server components throughout. The chart is derived from the date and the
   catalogue from Supabase, so both are settled before any JavaScript runs,
   which is what keeps layout shift at zero.

   force-dynamic because the chart, the moon and the sixty nights are all
   relative to today. A statically prerendered page would freeze whichever
   night the build happened to run on and quietly show the wrong sky. */
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Hero content={HERO} date={new Date()} />
      <NightPickerSection intro={NIGHT_PICKER} />
    </>
  );
}
