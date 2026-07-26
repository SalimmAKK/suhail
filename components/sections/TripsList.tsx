"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CoordinateTag } from "@/components/ui/CoordinateTag";
import { MoonPhase } from "@/components/ui/MoonPhase";
import { isWaxing, moonPhase, parseDateKey } from "@/lib/astro";
import { readTrips } from "@/lib/trips";

/* Trips made from this browser.
 *
 * References come from localStorage, the bookings themselves come back from
 * the database through /api/bookings. A reference whose booking cannot be
 * found is reported rather than dropped: silently hiding it would look
 * identical to never having booked at all. */

type Trip = {
  reference: string;
  date: string;
  status: string;
  guestCount: number;
  experience: {
    title: string;
    siteName: string;
    operatorName: string;
    priceSar: number | null;
  } | null;
};

const FULL_DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

type State =
  | { phase: "loading" }
  | { phase: "empty" }
  | { phase: "ready"; trips: Trip[]; missing: string[] };

export function TripsList() {
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const references = readTrips();
      if (references.length === 0) {
        if (!cancelled) setState({ phase: "empty" });
        return;
      }

      const results = await Promise.all(
        references.map(async (reference) => {
          try {
            const response = await fetch(`/api/bookings/${reference}`);
            if (!response.ok) return { reference, trip: null };
            return { reference, trip: (await response.json()) as Trip };
          } catch {
            return { reference, trip: null };
          }
        }),
      );
      if (cancelled) return;
      setState({
        phase: "ready",
        trips: results.flatMap((r) => (r.trip ? [r.trip] : [])),
        missing: results.filter((r) => !r.trip).map((r) => r.reference),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.phase === "loading") {
    return (
      <>
        <h1 className="text-pull">Your trips</h1>
        <p className="mt-8 text-muted">Looking up what this device has booked.</p>
      </>
    );
  }

  if (state.phase === "empty") {
    return (
      <>
        <h1 className="text-pull">No bookings yet.</h1>
        <p className="mt-8 max-w-[52ch] text-muted">
          Nights you book are kept here on this device, so you can find your reference in the
          desert with no signal. Nothing is stored anywhere else against you: there are no
          accounts.
        </p>
        <Button href="/tonight" variant="accent" pill className="mt-8">
          Pick a night
        </Button>
      </>
    );
  }

  return (
    <>
      <h1 className="text-pull">
        {state.trips.length === 1 ? "One night booked." : `${state.trips.length} nights booked.`}
      </h1>
      <p className="mt-6 max-w-[52ch] text-muted">
        Kept on this device. Opening Suhail in another browser will not show them.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {state.trips.map((trip) => {
          const date = parseDateKey(trip.date);
          return (
            <Card key={trip.reference} lift>
              <div className="flex items-start gap-4">
                <MoonPhase phase={moonPhase(date)} waxing={isWaxing(date)} size={40} />
                <div className="min-w-0">
                  <h2 className="text-2xl">{trip.experience?.title ?? "Experience unavailable"}</h2>
                  <p className="mt-1 text-muted">{FULL_DATE.format(date)}</p>
                </div>
              </div>
              <CoordinateTag
                className="mt-4"
                items={[
                  trip.reference,
                  `${trip.guestCount} ${trip.guestCount === 1 ? "GUEST" : "GUESTS"}`,
                  trip.status.toUpperCase(),
                  ...(trip.experience ? [trip.experience.siteName.toUpperCase()] : []),
                ]}
              />
              <Link
                href={`/book/confirmation/${trip.reference}`}
                className="mt-5 inline-block font-mono text-label uppercase tracking-label text-gold-deep underline underline-offset-4"
              >
                View booking
              </Link>
            </Card>
          );
        })}
      </div>

      {state.missing.length > 0 ? (
        <p className="mt-10 max-w-[60ch] text-[15px] text-muted">
          {state.missing.length === 1 ? "One reference" : `${state.missing.length} references`} on
          this device could not be found in the database:{" "}
          <span className="font-mono">{state.missing.join(", ")}</span>. They are shown here
          rather than hidden, because a booking that has quietly vanished is worth knowing about.
        </p>
      ) : null}
    </>
  );
}
