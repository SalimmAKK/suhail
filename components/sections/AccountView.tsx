"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CoordinateTag } from "@/components/ui/CoordinateTag";
import { Reveal } from "@/components/ui/Reveal";
import { onSessionChange, signOut } from "@/lib/auth";
import { cancelMyBooking, getMyBookings, type MyBooking } from "@/lib/account";
import { parseDateKey } from "@/lib/astro";

/* Bookings for the signed-in traveller, with the one write this account is
 * allowed: cancelling its own. migrations/003_accounts.sql's RLS is what
 * actually enforces "own, and only into cancelled" — this component just
 * reflects that back, including when the database says no.
 */

const FULL_DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

type State =
  | { phase: "checking-session" }
  | { phase: "loading" }
  | { phase: "ready"; bookings: MyBooking[] }
  | { phase: "error"; message: string };

export function AccountView() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [state, setState] = useState<State>({ phase: "checking-session" });
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => onSessionChange(setSession), []);

  useEffect(() => {
    if (session === undefined) return;
    if (session === null) {
      router.replace("/login?redirect=/account");
      return;
    }
    let cancelled = false;
    setState({ phase: "loading" });
    getMyBookings().then((result) => {
      if (cancelled) return;
      if (result.error) setState({ phase: "error", message: result.error });
      else setState({ phase: "ready", bookings: result.bookings });
    });
    return () => {
      cancelled = true;
    };
  }, [session, router]);

  async function onCancel(id: string) {
    setCancelling(id);
    const result = await cancelMyBooking(id);
    setCancelling(null);
    setConfirmId(null);
    if (!result.ok) {
      setState({ phase: "error", message: result.error });
      return;
    }
    if (state.phase === "ready") {
      setState({
        phase: "ready",
        bookings: state.bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)),
      });
    }
  }

  if (session === undefined || state.phase === "checking-session" || state.phase === "loading") {
    return <p className="text-neutral-700">Loading your bookings.</p>;
  }

  if (session === null) return null;

  if (state.phase === "error") {
    return (
      <p className="max-w-[52ch] border-2 border-divider bg-surface p-5 text-neutral-700">
        {state.message}
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-divider pb-6">
        <p className="text-neutral-700">Signed in as {session.user.email}.</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
        >
          Sign out
        </Button>
      </div>

      {state.bookings.length === 0 ? (
        <p className="mt-8 max-w-[52ch] text-neutral-700">
          No bookings on this account yet. Book a night while signed in and it will show up here.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {state.bookings.map((b, i) => (
            <Reveal key={b.id} delay={Math.min(i, 6) * 70}>
              <Card lift>
                <h2 className="text-2xl">{b.experience?.title ?? "Experience unavailable"}</h2>
                <p className="mt-1 text-neutral-700">
                  {FULL_DATE.format(parseDateKey(b.date))}
                </p>
                <CoordinateTag
                  className="mt-4"
                  items={[
                    b.reference,
                    `${b.guestCount} ${b.guestCount === 1 ? "GUEST" : "GUESTS"}`,
                    b.status.toUpperCase(),
                    ...(b.experience ? [b.experience.siteName.toUpperCase()] : []),
                  ]}
                />

                {b.status === "cancelled" ? null : confirmId === b.id ? (
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <span className="text-[14px] text-neutral-700">Cancel this booking?</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={cancelling === b.id}
                      onClick={() => onCancel(b.id)}
                    >
                      {cancelling === b.id ? "Cancelling..." : "Yes, cancel"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmId(null)}
                    >
                      Never mind
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-5"
                    onClick={() => setConfirmId(b.id)}
                  >
                    Cancel booking
                  </Button>
                )}
              </Card>
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}
