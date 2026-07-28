import { supabaseBrowser, supabaseServer } from "@/lib/supabase";
import type { BookingRow } from "@/lib/database.types";

/* Creating and reading back a booking.

   BUILD_PLAN stage 7 turns these into a working flow. Stage 3 gets them
   correct and typed first, so the flow is assembly rather than invention.

   The split is deliberate. createBooking runs in the browser under RLS,
   which is why the insert policy pins status to 'pending' and constrains the
   reference format: a client cannot confirm its own booking. getBooking runs
   on the server under the service role, because anon has no select policy on
   bookings at all. A reference is a weak secret, and it should never be
   enough to read a stranger's phone number out of the browser. */

/* No I, O, 0 or 1: a reference gets read aloud and written down. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REFERENCE_PATTERN = /^SUH-[A-Z0-9]{5}$/;

/** `SUH-4X2K9`. 32^5, about 33.5 million, which is ample for a demo. */
export function generateReference(): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return `SUH-${out}`;
}

export type BookingInput = {
  experienceId: string;
  /** `2026-07-25` */
  date: string;
  guestCount: number;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
};

export type BookingResult =
  | { ok: true; reference: string }
  | { ok: false; error: string; field?: keyof BookingInput };

/** Enough to catch a typo, not so much that a real address gets rejected. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateBooking(input: BookingInput): BookingResult | null {
  if (!input.experienceId) {
    return { ok: false, error: "No experience was selected.", field: "experienceId" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { ok: false, error: "Pick a night first.", field: "date" };
  }
  if (!Number.isInteger(input.guestCount) || input.guestCount < 1 || input.guestCount > 20) {
    return { ok: false, error: "Between 1 and 20 guests.", field: "guestCount" };
  }
  if (input.contactName.trim().length < 2) {
    return { ok: false, error: "We need a name for the booking.", field: "contactName" };
  }
  if (!EMAIL.test(input.contactEmail)) {
    return {
      ok: false,
      error: "That email address does not look right. The confirmation goes there.",
      field: "contactEmail",
    };
  }
  return null;
}

/**
 * Writes a real row and returns its reference.
 *
 * Returns the reference rather than the row, and that is not a shortcut. The
 * insert deliberately has no `.select()`: PostgreSQL's `INSERT ... RETURNING`
 * needs a SELECT policy, bookings has none for anon on purpose, and asking
 * for the row back fails the whole insert with 42501. Adding a select policy
 * to make `.select()` work would make every booking in the table readable by
 * anyone holding the anon key, which is published to the browser.
 *
 * So the client learns only the reference it generated. The confirmation
 * route reads the row back through the server, which is also what makes a
 * refresh prove persistence rather than replay local state.
 *
 * Never fakes success: if the insert fails, the error comes back and the
 * caller shows it.
 *
 * `userId` is optional and comes from the caller having already checked
 * whether anyone is signed in (lib/auth.ts's getSession). Passing it tags the
 * booking as this account's, so it shows up on /account and can be cancelled
 * from there later; leaving it undefined books as a guest exactly as this
 * always worked, migrations/003_accounts.sql having made user_id nullable for
 * precisely that reason.
 */
export async function createBooking(
  input: BookingInput,
  userId?: string | null,
): Promise<BookingResult> {
  const invalid = validateBooking(input);
  if (invalid) return invalid;

  const supabase = supabaseBrowser();

  /* A collision is a unique-constraint violation, not silent corruption.
     Three attempts against 33.5 million references is plenty. */
  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = generateReference();
    const { error } = await supabase.from("bookings").insert({
      experience_id: input.experienceId,
      date: input.date,
      guest_count: input.guestCount,
      contact_name: input.contactName.trim(),
      contact_email: input.contactEmail.trim().toLowerCase(),
      contact_phone: input.contactPhone?.trim() || null,
      status: "pending",
      reference,
      user_id: userId ?? null,
    });

    if (!error) return { ok: true, reference };

    /* 23505 is unique_violation. Anything else is real and should surface. */
    if (error.code !== "23505") return { ok: false, error: error.message };
  }

  return { ok: false, error: "Could not generate a unique booking reference. Try again." };
}

/**
 * Reads a booking back by its reference.
 *
 * Server only. This is what makes refreshing a confirmation URL prove
 * persistence rather than replay local state.
 */
export async function getBooking(reference: string): Promise<BookingRow | null> {
  if (!REFERENCE_PATTERN.test(reference)) return null;

  const { data, error } = await supabaseServer()
    .from("bookings")
    .select()
    .eq("reference", reference)
    .maybeSingle();

  if (error) throw new Error(`Could not load booking ${reference}: ${error.message}`);
  return data ?? null;
}
