import type { Metadata } from "next";
import { Shell } from "@/components/layout/Shell";
import { CoordinateTag } from "@/components/ui/CoordinateTag";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "Tonight / Suhail",
  description: "Sixty nights over AlUla, each one rated for what the sky will be doing.",
};

/* Stage 2 placeholder. The night picker is built in stage 5.

   data-nav-tone="ink" is the hook the glass nav watches (lib/useNavTone.ts).
   This page is ink because the night picker is the ink section in the rhythm
   set out in CLAUDE.md section 5, and it gives the nav a real surface to
   re-tone against before stage 4 lands. */

export default function Tonight() {
  return (
    <section data-nav-tone="ink" className="min-h-[80vh] bg-ink pb-24 pt-[var(--nav-clearance)]">
      <Shell>
        <Eyebrow tone="light" className="mb-6">
          Tonight over AlUla
        </Eyebrow>
        <h1 className="text-pull text-moon">What is the sky doing on the night of your trip?</h1>
        <CoordinateTag
          tone="light"
          className="mt-6"
          items={["26.61°N", "ALULA, KSA", "NEXT 60 NIGHTS"]}
        />
        <p className="mt-8 max-w-[52ch] text-moon/70">
          Sixty nights, each rated by moon phase and sky darkness, with the experiences running
          on the one you choose. Being built.
        </p>
      </Shell>
    </section>
  );
}
