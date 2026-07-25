import { Hero } from "@/components/sections/Hero";
import { HERO } from "@/data/home";

/* Stage 4: hero and star chart. The night picker, the sites and the
   credibility strip follow in stages 5, 6 and 9.

   Server component. The chart is derived from the date, and rendering it here
   keeps it out of the client bundle and free of layout shift.

   force-dynamic because the chart and the moon are for tonight. A statically
   prerendered page would freeze whichever night the build happened to run on
   and quietly show the wrong sky from then on. */
export const dynamic = "force-dynamic";

export default function Home() {
  return <Hero content={HERO} date={new Date()} />;
}
