import type { Metadata } from "next";
import { Shell } from "@/components/layout/Shell";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "About / Suhail",
  description: "What Suhail is, why now, and who is building it.",
};

/* Stage 2 placeholder. The founder note and the pitch document links are
   stage 9. */

export default function About() {
  return (
    <section className="py-24">
      <Shell>
        <Eyebrow className="mb-6">About</Eyebrow>
        <h1 className="text-pull">Named for a star you can only see from here.</h1>
        <p className="mt-8 max-w-[52ch] text-muted">
          Suhail, Canopus, clears AlUla&rsquo;s southern horizon by about ten degrees and never
          rises at all across most of Europe. Arab navigators steered by it. The full note is
          being written.
        </p>
      </Shell>
    </section>
  );
}
