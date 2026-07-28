import type { Metadata } from "next";
import { Shell } from "@/components/layout/Shell";
import { ContactForm } from "@/components/sections/ContactForm";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Contact / Suhail",
  description: "Reach the person building Suhail.",
};

/* BUILD_PLAN stage 9's own instruction: "a simple form... that surfaces a
 * real error NOT_CONFIGURED until an endpoint is wired... never fake
 * success." The endpoint is wired now (migrations/002_messages.sql,
 * lib/contact.ts), so the form is real rather than a placeholder — but the
 * NOT_CONFIGURED path still exists and still fires honestly if that
 * migration hasn't been run against a given Supabase project yet.
 */

export default function Contact() {
  return (
    <section className="pb-24 pt-[var(--section-top)]">
      <Shell className="max-w-[720px]">
        <Reveal>
          <Eyebrow className="mb-6">Contact</Eyebrow>
          <h1 className="text-h2">Operators, partners, and anyone curious.</h1>
          <p className="mt-6 max-w-[56ch] text-[16px] leading-[1.75] text-neutral-700">
            This is a one-person, pre-launch build, so a message here reaches Salim directly —
            not a support queue, not a form that vanishes into a shared inbox nobody checks.
            Real operator inquiries, a correction to something on a site page, or just a
            question about the project: all of it lands the same way.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-12 border-t border-divider pt-10">
            <ContactForm />
          </div>
        </Reveal>
      </Shell>
    </section>
  );
}
