"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CoordinateTag } from "@/components/ui/CoordinateTag";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SkyAtSlot } from "@/components/sections/SkyAtSlot";
import { rememberTrip } from "@/lib/trips";
import { parseDateKey } from "@/lib/astro";
import type { BookingRow } from "@/lib/database.types";
import type { CatalogExperience } from "@/lib/catalog";

/* The confirmation.
 *
 * Everything here was read back from the database by the server component
 * that renders it, so a refresh is a genuine round trip rather than a replay
 * of the form that was just submitted.
 *
 * Section 11 allows one considered touch per surface. It is the reference:
 * it arrives a character at a time, which is the one thing on this page a
 * traveller will write down or photograph. Section 6 bans text scrambles, so
 * the characters fade in place rather than cycling through decoys, and the
 * whole reference is in the DOM from the first frame for anyone reading with
 * assistive technology or with motion turned down. */

const FULL_DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function Confirmation({
  booking,
  experience,
}: {
  booking: BookingRow;
  experience: CatalogExperience | null;
}) {
  /* A traveller can arrive here on a device that did not make the booking, by
     following the link from an email or a message. Remembering it here rather
     than only at submit time means the trips list is right either way. */
  useEffect(() => {
    rememberTrip(booking.reference);
  }, [booking.reference]);

  const date = parseDateKey(booking.date);
  const total = experience?.priceSar ? experience.priceSar * booking.guest_count : null;

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
      <div>
        <Eyebrow className="mb-7">Reserved</Eyebrow>
        {/* Not every seeded experience runs after dark: the Sharaan safari is
            a daytime drive. Calling that "a night" would be wrong on the one
            page a traveller keeps. */}
        <h1 className="text-pull">
          {experience?.requiresDark === false ? "You are booked" : "You have a night"}
          <br />
          at {experience?.site.name ?? "AlUla"}.
        </h1>

        <div className="mt-10 border-y border-line py-8">
          <p className="font-mono text-label uppercase tracking-label text-muted">
            Booking reference
          </p>
          <p
            className="mt-3 font-mono text-[clamp(32px,5vw,52px)] tracking-[0.12em] text-ink"
            aria-label={`Booking reference ${booking.reference}`}
          >
            {booking.reference.split("").map((char, i) => (
              <span
                key={`${char}-${i}`}
                aria-hidden
                className="reference-char inline-block"
                style={{ animationDelay: `${i * 55}ms` }}
              >
                {char}
              </span>
            ))}
          </p>
          <p className="mt-4 max-w-[46ch] text-muted">
            Keep this. It is how the operator finds your booking, and how this device finds it
            again under Trips. No email is sent in this build.
          </p>
        </div>

        <dl className="mt-8 space-y-4">
          <Row label="Night" value={FULL_DATE.format(date)} />
          <Row label="Experience" value={experience?.title ?? "Experience unavailable"} />
          {experience ? <Row label="Operator" value={experience.operatorName} /> : null}
          {experience ? <Row label="Site" value={experience.site.name} /> : null}
          <Row label="Guests" value={String(booking.guest_count)} />
          <Row label="Booked as" value={booking.contact_name} />
          {total !== null ? <Row label="Total" value={`SAR ${total}`} /> : null}
          <Row label="Status" value={booking.status} />
        </dl>

        <div className="mt-8 rounded-lg border border-attention/50 bg-sand/30 p-5">
          <p className="font-mono text-label uppercase tracking-label text-gold-deep">
            Demo mode
          </p>
          <p className="mt-3 max-w-[52ch] text-muted">
            This booking is a real row in the database and survives a refresh, which is what
            it is here to demonstrate. No payment was taken and the operator has not been
            notified.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button href="/trips" variant="accent" pill>
            See your trips
          </Button>
          <Link
            href="/tonight"
            className="font-mono text-label uppercase tracking-label text-gold-deep underline underline-offset-4"
          >
            Book another night
          </Link>
        </div>
      </div>

      <aside className="lg:sticky lg:top-[var(--nav-clearance)] lg:self-start">
        <SkyAtSlot dateKey={booking.date} />
        {experience ? (
          <div className="mt-6 rounded-lg border border-line bg-paper p-6">
            <h2 className="text-xl">Getting there</h2>
            <CoordinateTag
              className="mt-3"
              items={[experience.site.name.toUpperCase(), experience.operatorName.toUpperCase()]}
            />
            <p className="mt-4 text-muted">
              Meeting point and pickup are arranged by {experience.operatorName}. This build
              does not carry their published meeting details, so it does not guess at them.
            </p>
            <Link
              href={`/sites/${experience.site.slug}`}
              className="mt-5 inline-block font-mono text-label uppercase tracking-label text-gold-deep underline underline-offset-4"
            >
              About {experience.site.name}
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line pb-3">
      <dt className="font-mono text-label uppercase tracking-label text-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
