import type { Metadata } from "next";
import { Shell } from "@/components/layout/Shell";
import { CoordinateTag } from "@/components/ui/CoordinateTag";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "Dark-sky sites / Suhail",
  description: "The four dark-sky sites across the AlUla region, on a map and in detail.",
};

/* Stage 2 placeholder. The Mapbox map and the four site pages are stage 6. */

export default function Sites() {
  return (
    <section className="pb-24 pt-[var(--nav-clearance)]">
      <Shell>
        <Eyebrow className="mb-6">The sites</Eyebrow>
        <h1 className="text-pull">Four places to stand under it.</h1>
        <CoordinateTag className="mt-6" items={["ALULA REGION", "4 SITES", "BORTLE 1 TO 3"]} />
        <p className="mt-8 max-w-[52ch] text-muted">
          Each site is mapped with its elevation, its Bortle class, and what part of the sky it
          is best positioned for. Being built.
        </p>
      </Shell>
    </section>
  );
}
