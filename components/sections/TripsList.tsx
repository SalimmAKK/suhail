"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CoordinateTag } from "@/components/ui/CoordinateTag";
import { MoonPhase } from "@/components/ui/MoonPhase";
import { Reveal } from "@/components/ui/Reveal";
import { onSessionChange } from "@/lib/auth";
import { isWaxing, moonPhase, parseDateKey } from "@/lib/astro";
import { readTrips } from "@/lib/trips";

/* Trips made from this browser.
 *
 * References come from localStorage, the bookings themselves come back from
 * the database through /api/bookings. A reference whose booking cannot be
 * found is reported rather than dropped: silently hiding it would look
 * identical to never having booked at all.
 *
 * This is deliberately separate from /account. A guest booking made without
 * signing in only ever lives here, on this device; an account booking (see
 * migrations/003_accounts.sql) lives on /account and follows the traveller
 * anywhere. The signed-in-state link below is this page's one acknowledgment
 * that the other list exists, for whichever one a returning traveller
 * actually meant to open. */

function AccountLink() {
  const [signedIn, setSignedIn] = useState<boolean | undefined>(undefined);
  useEffect(() => onSessionChange((session) => setSignedIn(Boolean(session))), []);

  if (signedIn === undefined) return null;
  return (
    <p className="mt-4 text-[14px] text-neutral-700">
      {signedIn ? (
        <>
          Looking for a booking made under your account?{" "}
          <Link href="/account" className="underline underline-offset-4">
            View account bookings
          </Link>
          .
        </>
      ) : (
        <>
          <Link href="/login" className="underline underline-offset-4">
            Sign in
          </Link>{" "}
          to keep bookings under an account instead of just this device.
        </>
      )}
    </p>
  );
}

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
        <h1 className="text-h2">Your trips</h1>
        <p className="mt-8 text-neutral-700">Looking up what this device has booked.</p>
      </>
    );
  }

  if (state.phase === "empty") {
    return (
      <>
        <h1 className="text-h2">No bookings yet.</h1>
        <p className="mt-8 max-w-[52ch] text-neutral-700">
          A guest booking is kept here on this device, so you can find your reference in the
          desert with no signal. Signing in first keeps it under an account instead, which is
          reachable from anywhere.
        </p>
        <AccountLink />
        <Button href="/tonight" variant="primary" className="mt-8">
          Pick a night
        </Button>
      </>
    );
  }

  return (
    <>
      <h1 className="text-h2">
        {state.trips.length === 1 ? "One night booked." : `${state.trips.length} nights booked.`}
      </h1>
      <p className="mt-6 max-w-[52ch] text-neutral-700">
        Kept on this device. Opening Suhail in another browser will not show them.
      </p>
      <AccountLink />

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {state.trips.map((trip, i) => {
          const date = parseDateKey(trip.date);
          return (
            <Reveal key={trip.reference} delay={i * 70}>
            <Card lift>
              <div className="flex items-start gap-4">
                <MoonPhase phase={moonPhase(date)} waxing={isWaxing(date)} size={40} />
                <div className="min-w-0">
                  <h2 className="text-2xl">{trip.experience?.title ?? "Experience unavailable"}</h2>
                  <p className="mt-1 text-neutral-700">{FULL_DATE.format(date)}</p>
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
                className="mt-5 inline-block font-display text-label uppercase tracking-label text-accent-700 underline underline-offset-4"
              >
                View booking
              </Link>
            </Card>
            </Reveal>
          );
        })}
      </div>

      {state.missing.length > 0 ? (
        <p className="mt-10 max-w-[60ch] text-[15px] text-neutral-700">
          {state.missing.length === 1 ? "One reference" : `${state.missing.length} references`} on
          this device could not be found in the database:{" "}
          <span className="font-display">{state.missing.join(", ")}</span>. They are shown here
          rather than hidden, because a booking that has quietly vanished is worth knowing about.
        </p>
      ) : null}
    </>
  );
}
