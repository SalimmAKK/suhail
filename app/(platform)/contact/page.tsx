import type { Metadata } from "next";
import { Shell } from "@/components/layout/Shell";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "Contact / Suhail",
  description: "Reach the person building Suhail.",
};

/* Stage 2 placeholder. The form and its endpoint are stage 9, and it will
   surface a real NOT_CONFIGURED error until the endpoint exists rather than
   faking a success state. */

export default function Contact() {
  return (
    <section className="pb-24 pt-[var(--section-top)]">
      <Shell>
        <Eyebrow className="mb-6">Contact</Eyebrow>
        <h1 className="text-h2">Operators, partners, and anyone curious.</h1>
        <p className="mt-8 max-w-[52ch] text-neutral-700">
          A working form goes here. Until it is wired to a real endpoint it will say so plainly
          rather than accept a message it cannot deliver.
        </p>
      </Shell>
    </section>
  );
}
