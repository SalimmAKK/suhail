"use client";

/* The references this browser has booked.
 *
 * BUILD_PLAN stage 7 asks for a trips route listing bookings made from this
 * browser, and says localStorage is fine. It is the right call for v1: there
 * are no accounts, so the device is the only thing that can remember, and a
 * booking reference is the only handle a traveller has.
 *
 * Only the references are stored. Everything shown on the trips page is read
 * back from the database through the API route, so a booking that was
 * cancelled or changed server-side does not sit here as a stale copy.
 */

const KEY = "suhail-trips";
const PATTERN = /^SUH-[A-Z0-9]{5}$/;

export function readTrips(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r): r is string => typeof r === "string" && PATTERN.test(r));
  } catch {
    /* private mode, a full quota, or something else wrote to this key */
    return [];
  }
}

export function rememberTrip(reference: string): void {
  if (typeof window === "undefined" || !PATTERN.test(reference)) return;
  try {
    const existing = readTrips();
    if (existing.includes(reference)) return;
    /* newest first: a traveller books the next trip, not the last one */
    window.localStorage.setItem(KEY, JSON.stringify([reference, ...existing].slice(0, 50)));
  } catch {
    /* a booking that cannot be remembered locally is still a real booking:
       the reference is on the confirmation screen either way */
  }
}
