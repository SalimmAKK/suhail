import type { Metadata } from "next";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CoordinateTag } from "@/components/ui/CoordinateTag";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Field } from "@/components/ui/Field";
import { LineReveal } from "@/components/ui/LineReveal";
import { MoonPhase } from "@/components/ui/MoonPhase";
import { Reveal } from "@/components/ui/Reveal";
import { SkyPip } from "@/components/ui/SkyPip";

/* BUILD_PLAN stage 1, task 6. Every primitive in isolation, on both the cream
   and the ink section backgrounds it has to survive. Delete before the demo. */

export const metadata: Metadata = {
  title: "Styleguide / Suhail",
  robots: { index: false, follow: false },
};

const RAMP = [
  { token: "sky-1", swatch: "bg-sky-1", note: "full moon, worst" },
  { token: "sky-2", swatch: "bg-sky-2", note: "gibbous" },
  { token: "sky-3", swatch: "bg-sky-3", note: "half moon" },
  { token: "sky-4", swatch: "bg-sky-4", note: "crescent" },
  { token: "sky-5", swatch: "bg-sky-5", note: "new moon, best" },
];

const CORE = [
  { token: "cream", swatch: "bg-cream", note: "page" },
  { token: "paper", swatch: "bg-paper", note: "cards" },
  { token: "sand", swatch: "bg-sand", note: "grouped sections" },
  { token: "ink", swatch: "bg-ink", note: "text, dark sections" },
  { token: "ink-deep", swatch: "bg-ink-deep", note: "primary hover" },
  { token: "gold", swatch: "bg-gold", note: "accent" },
  { token: "gold-deep", swatch: "bg-gold-deep", note: "accent hover" },
  { token: "muted", swatch: "bg-muted", note: "secondary text" },
  { token: "line", swatch: "bg-line", note: "hairlines" },
  { token: "moon", swatch: "bg-moon", note: "highlight on dark" },
  { token: "attention", swatch: "bg-attention", note: "errors, focus" },
  { token: "danger", swatch: "bg-danger", note: "destructive only" },
];

const PHASES = [0, 0.25, 0.5, 0.75, 1];

function Section({
  title,
  children,
  tone = "default",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "default" | "light";
}) {
  return (
    <section
      /* full-ink sections declare themselves so the glass nav re-tones over
         them, per lib/useNavTone.ts */
      data-nav-tone={tone === "light" ? "ink" : undefined}
      className={tone === "light" ? "bg-ink py-16" : "border-t border-line py-16"}
    >
      <Shell>
        <Eyebrow tone={tone} className="mb-8">
          {title}
        </Eyebrow>
        {children}
      </Shell>
    </section>
  );
}

function Swatch({ token, swatch, note }: { token: string; swatch: string; note: string }) {
  return (
    <div>
      <div className={`h-16 rounded-md border border-line ${swatch}`} />
      <p className="mt-2 font-mono text-label uppercase tracking-label text-ink">{token}</p>
      <p className="font-mono text-label tracking-label text-muted">{note}</p>
    </div>
  );
}

export default function Styleguide() {
  return (
    <>
      <div className="border-b border-line pb-16 pt-[var(--nav-clearance)]">
        <Shell>
          <Eyebrow className="mb-6">Styleguide</Eyebrow>
          <LineReveal as="h1" lines={["Every primitive,", "in isolation."]} className="text-pull" />
          <CoordinateTag
            className="mt-6"
            items={["SUHAIL", "STAGE 1", "NOT LINKED FROM NAV"]}
          />
        </Shell>
      </div>

      <Section title="Colour, core">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-6">
          {CORE.map((c) => (
            <Swatch key={c.token} {...c} />
          ))}
        </div>
      </Section>

      <Section title="Colour, sky-quality ramp">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-5">
          {RAMP.map((c) => (
            <Swatch key={c.token} {...c} />
          ))}
        </div>
        <p className="mt-6 max-w-[52ch] text-muted">
          Semantic only. The ramp says how dark a given night will be, never that a surface
          needed some colour.
        </p>
      </Section>

      <Section title="Type">
        <div className="space-y-8">
          <div>
            <p className="mb-2 font-mono text-label uppercase tracking-label text-muted">
              text-hero / Bricolage Grotesque
            </p>
            <p className="font-display text-hero font-medium">Look up. Then book.</p>
          </div>
          <div>
            <p className="mb-2 font-mono text-label uppercase tracking-label text-muted">
              text-pull / Bricolage Grotesque
            </p>
            <p className="font-display text-pull font-medium">The sky over AlUla, by the night.</p>
          </div>
          <div>
            <p className="mb-2 font-mono text-label uppercase tracking-label text-muted">
              body 17px / IBM Plex Sans
            </p>
            <p className="max-w-[62ch]">
              Suhail surfaces what the sky is offering on a specific night over AlUla and its
              surrounding dark-sky parks, then books the experience that matches it.
            </p>
          </div>
          <div>
            <p className="mb-2 font-mono text-label uppercase tracking-label text-muted">
              label 11px / IBM Plex Mono
            </p>
            <CoordinateTag items={["26.85°N", "ALULA", "692M", "BORTLE 2"]} />
          </div>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <Button href="/styleguide">Primary</Button>
          <Button href="/styleguide" variant="accent">
            Book this night
          </Button>
          <Button href="/styleguide" size="sm">
            Primary, small
          </Button>
          <Button disabled>Disabled</Button>
        </div>
        <p className="mt-6 max-w-[52ch] text-muted">
          Ink on gold, not white on gold. Roughly 7:1 at rest and 5:1 against gold-deep on
          hover. Primary keeps white on ink.
        </p>
      </Section>

      <Section title="Buttons on ink" tone="light">
        <div className="flex flex-wrap items-center gap-4">
          <Button href="/styleguide" variant="light">
            Pick a night
          </Button>
          <Button href="/styleguide" variant="light" size="sm">
            Light, small
          </Button>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card lift>
            <Eyebrow className="mb-4">Hover me</Eyebrow>
            <h3 className="text-2xl">The gold rule sweeps in</h3>
            <p className="mt-3 text-muted">
              Lift cards rise 4px and draw a 3px rule across the top over 380ms.
            </p>
          </Card>
          <Card>
            <Eyebrow className="mb-4">Static</Eyebrow>
            <h3 className="text-2xl">No rule, no lift</h3>
            <p className="mt-3 text-muted">
              For content that is not a link to somewhere else.
            </p>
          </Card>
          <Card lift>
            <div className="flex items-center gap-4">
              <MoonPhase phase={0.34} />
              <div>
                <h3 className="text-2xl">With a moon</h3>
                <SkyPip quality="ok" className="mt-2" />
              </div>
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Moon phase">
        <div className="flex flex-wrap gap-10">
          {PHASES.map((p) => (
            <div key={p} className="text-center">
              <MoonPhase phase={p} size={64} />
              <p className="mt-3 font-mono text-label uppercase tracking-label text-muted">
                {Math.round(p * 100)}% waxing
              </p>
            </div>
          ))}
          <div className="text-center">
            <MoonPhase phase={0.25} size={64} waxing={false} />
            <p className="mt-3 font-mono text-label uppercase tracking-label text-muted">
              25% waning
            </p>
          </div>
        </div>
      </Section>

      <Section title="Moon phase on ink" tone="light">
        <div className="flex flex-wrap gap-10">
          {PHASES.map((p) => (
            <div key={p} className="text-center">
              <MoonPhase phase={p} size={64} tone="light" />
              <p className="mt-3 font-mono text-label uppercase tracking-label text-moon/70">
                {Math.round(p * 100)}%
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Sky pip">
        <div className="flex flex-wrap items-center gap-8">
          <SkyPip quality="prime" />
          <SkyPip quality="ok" />
          <SkyPip quality="bright" />
          <SkyPip quality="prime" showLabel={false} />
        </div>
      </Section>

      <Section title="Sky pip on ink" tone="light">
        <div className="flex flex-wrap items-center gap-8">
          <SkyPip quality="prime" tone="light" />
          <SkyPip quality="ok" tone="light" />
          <SkyPip quality="bright" tone="light" />
        </div>
      </Section>

      <Section title="Coordinate tag on ink" tone="light">
        <CoordinateTag
          tone="light"
          items={["26.85°N", "ALULA, KSA", "ELEVATION 692M", "BORTLE 2"]}
        />
      </Section>

      <Section title="Fields">
        <div className="grid max-w-2xl gap-6 sm:grid-cols-2">
          <Field label="Full name" name="sg-name" required />
          <Field label="Email" name="sg-email" type="email" required />
          <Field
            label="Guests"
            name="sg-guests"
            as="select"
            required
            options={[
              { value: "1", label: "1 guest" },
              { value: "2", label: "2 guests" },
              { value: "4", label: "4 guests" },
            ]}
          />
          <Field
            label="Phone"
            name="sg-phone"
            error="Enter a phone number we can reach you on."
          />
          <Field
            label="Anything we should know"
            name="sg-notes"
            as="textarea"
            hint="Mobility needs, telescope experience, anything else."
            className="sm:col-span-2"
          />
          <Field
            label="What are you hoping to see"
            name="sg-targets"
            as="multiselect"
            className="sm:col-span-2"
            options={[
              { value: "milky-way", label: "The Milky Way core" },
              { value: "planets", label: "Planets" },
              { value: "deep-sky", label: "Deep-sky objects" },
            ]}
          />
        </div>
      </Section>

      <Section title="Reveal">
        <div className="grid gap-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Reveal key={i} delay={i * 90}>
              <Card>
                <p className="font-mono text-label uppercase tracking-label text-muted">
                  Delay {i * 90}ms
                </p>
                <p className="mt-3">Scroll away and back to replay from a fresh load.</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
