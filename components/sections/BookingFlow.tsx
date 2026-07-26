"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CoordinateTag } from "@/components/ui/CoordinateTag";
import { Field } from "@/components/ui/Field";
import { SkyAtSlot } from "@/components/sections/SkyAtSlot";
import { cn } from "@/lib/cn";
import { createBooking, type BookingInput } from "@/lib/booking";
import { rememberTrip } from "@/lib/trips";
import { parseDateKey, skyQuality } from "@/lib/astro";
import type { CatalogExperience } from "@/lib/catalog";

/* BUILD_PLAN stage 7. One scrollable page rather than a stepped wizard.

   A wizard buys nothing here: there are three short groups of fields and no
   branching, and splitting them across steps would hide the price and the
   sky summary behind a Next button at exactly the moment a traveller is
   deciding. The summary stays beside the form the whole way down.

   Nothing is ever faked. Validation runs against the same bounds the RLS
   policy enforces, the payment step says plainly that it takes no money, and
   a failed insert surfaces the database's own message rather than a shrug. */

const FULL_DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

type FieldName = keyof BookingInput;

export function BookingFlow({
  experience,
  initialDate,
}: {
  experience: CatalogExperience;
  initialDate: string | null;
}) {
  const router = useRouter();

  const [date, setDate] = useState<string>(
    initialDate && experience.dates.includes(initialDate) ? initialDate : (experience.dates[0] ?? ""),
  );
  const [guests, setGuests] = useState<number>(experience.groupMin);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(
    () => (experience.priceSar ?? 0) * guests,
    [experience.priceSar, guests],
  );

  const max = experience.groupMax ?? 20;
  const guestOptions = useMemo(
    () =>
      Array.from({ length: max - experience.groupMin + 1 }, (_, i) => {
        const n = experience.groupMin + i;
        return { value: String(n), label: n === 1 ? "1 guest" : `${n} guests` };
      }),
    [experience.groupMin, max],
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setErrors({});

    /* Two rules the shared validator does not know about, because they belong
       to this experience rather than to bookings in general. */
    if (!date) {
      setErrors({ date: "This experience has no nights available to book." });
      return;
    }
    if (guests < experience.groupMin) {
      setErrors({
        guestCount: `${experience.title} runs with a minimum of ${experience.groupMin}.`,
      });
      return;
    }
    if (experience.groupMax && guests > experience.groupMax) {
      setErrors({ guestCount: `This one takes at most ${experience.groupMax} guests.` });
      return;
    }

    setSubmitting(true);
    const result = await createBooking({
      experienceId: experience.id,
      date,
      guestCount: guests,
      contactName: name,
      contactEmail: email,
      contactPhone: phone || undefined,
    });

    if (!result.ok) {
      setSubmitting(false);
      if (result.field) setErrors({ [result.field]: result.error });
      else setFormError(result.error);
      return;
    }

    rememberTrip(result.reference);
    router.push(`/book/confirmation/${result.reference}`);
  }

  const nightQuality = date ? skyQuality(parseDateKey(date)) : null;

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
      <form onSubmit={onSubmit} noValidate>
        <Group step="01" title="Which night">
          {experience.dates.length === 0 ? (
            <p className="text-neutral-700">
              This experience has no nights open in the next sixty days.
            </p>
          ) : (
              <Field
                label="Night"
                name="date"
                as="select"
                required
                error={errors.date}
                value={date}
                onValueChange={setDate}
                options={experience.dates.map((d) => ({
                  value: d,
                  label: FULL_DATE.format(parseDateKey(d)),
                }))}
              />
          )}
        </Group>

        <Group step="02" title="How many">
          <Field
            label="Guests"
            name="guestCount"
            as="select"
            required
            error={errors.guestCount}
            value={String(guests)}
            onValueChange={(v) => setGuests(Number(v))}
            hint={
              experience.groupMax
                ? `Runs with ${experience.groupMin} to ${experience.groupMax} guests.`
                : `Runs with a minimum of ${experience.groupMin}.`
            }
            options={guestOptions}
          />
        </Group>

        <Group step="03" title="Who is coming">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Full name"
              name="contactName"
              required
              error={errors.contactName}
              value={name}
              onValueChange={setName}
              className="sm:col-span-2"
            />
            <Field
              label="Email"
              name="contactEmail"
              type="email"
              required
              error={errors.contactEmail}
              value={email}
              onValueChange={setEmail}
            />
            <Field
              label="Phone"
              name="contactPhone"
              type="tel"
              error={errors.contactPhone}
              value={phone}
              onValueChange={setPhone}
            />
          </div>
        </Group>

        <Group step="04" title="Payment">
          {/* CLAUDE.md rule 15: the payment step is labelled demo mode and
              takes nothing. No card fields, because a form that looks like it
              takes a card is a lie whatever the label above it says. */}
          <div className="border border-accent-2/50 bg-surface/30 p-5">
            <p className="font-display text-label uppercase tracking-label text-accent-700">
              Demo mode
            </p>
            <p className="mt-3 max-w-[52ch] text-neutral-700">
              No payment is taken and no card details are collected. Reserving writes a real
              booking to the database with a real reference, which is what the confirmation
              screen reads back. Mada and card payment are out of scope for this build.
            </p>
          </div>
        </Group>

        {formError ? (
          <p
            role="alert"
            className="mt-8 flex items-start gap-2.5 border border-accent-2-700/40 bg-neutral-100 p-4 text-[15px] text-text"
          >
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent-2-700" />
            <span>
              The booking was not saved. {formError}
            </span>
          </p>
        ) : null}

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button type="submit" variant="primary" disabled={submitting || !date}>
            {submitting ? "Reserving..." : "Reserve this night"}
          </Button>
          <p className="font-display text-label uppercase tracking-label text-neutral-700">
            No payment taken
          </p>
        </div>
      </form>

      <aside className="lg:sticky lg:top-[var(--section-top)] lg:self-start">
        <div className="border border-divider bg-neutral-100 p-6">
          <h2 className="text-2xl">{experience.title}</h2>
          <CoordinateTag
            className="mt-3"
            items={[
              experience.operatorName.toUpperCase(),
              experience.site.name.toUpperCase(),
              ...(experience.durationMin
                ? [`${Math.round(experience.durationMin / 60)}H`]
                : []),
            ]}
          />

          <dl className="mt-6 space-y-2 border-t border-divider pt-5 text-[15px]">
            <Row label="Per guest" value={`SAR ${experience.priceSar}`} />
            <Row label="Guests" value={String(guests)} />
            <Row label="Total" value={`SAR ${total}`} strong />
          </dl>

          {/* Brief item 4. True of this build and checkable: the seeded price
              is the operator's own published price, and nothing is added on
              top of it. Stated as the fact it is rather than as a slogan. */}
          <p className="mt-4 border-t border-divider pt-4 font-display text-label uppercase leading-relaxed tracking-label text-accent-700">
            Operator&rsquo;s published price. No booking fee added.
          </p>

          {date ? <SkyAtSlot dateKey={date} className="mt-6" /> : null}

          {experience.requiresDark && nightQuality === "bright" ? (
            <p className="mt-4 text-[15px] text-neutral-700">
              This one is built around a dark sky, and the night you have chosen has a bright
              moon. It still runs.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function Group({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-divider py-8 first:border-t-0 first:pt-0">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="font-display text-label tracking-label text-accent-700">{step}</span>
        <h2 className="text-2xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-neutral-700">{label}</dt>
      <dd className={cn(strong ? "text-lg text-text" : "text-text")}>{value}</dd>
    </div>
  );
}
