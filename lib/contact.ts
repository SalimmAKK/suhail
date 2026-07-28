import { supabaseBrowser } from "@/lib/supabase";

/* Sending a contact message.
 *
 * Same shape as lib/booking.ts's createBooking, and for the same reason:
 * this runs in the browser under RLS (migrations/002_messages.sql), so
 * validation here is a courtesy that catches a typo before the network
 * round trip — the database's own check constraint is what actually
 * enforces the bounds, same as the booking insert.
 *
 * Never fakes success. If the insert fails — the migration hasn't been run
 * yet, the network is down, whatever — the real error comes back and the
 * form shows it instead of a success state that didn't happen.
 */

export type ContactInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactResult = { ok: true } | { ok: false; error: string; field?: keyof ContactInput };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(input: ContactInput): ContactResult | null {
  if (input.name.trim().length < 2) {
    return { ok: false, error: "A name is needed to know who this is from.", field: "name" };
  }
  if (!EMAIL.test(input.email)) {
    return { ok: false, error: "That email address does not look right.", field: "email" };
  }
  if (input.subject.trim().length < 3) {
    return { ok: false, error: "A short subject line helps.", field: "subject" };
  }
  if (input.message.trim().length < 10) {
    return { ok: false, error: "A few more words would help.", field: "message" };
  }
  return null;
}

export async function sendMessage(input: ContactInput): Promise<ContactResult> {
  const invalid = validateContact(input);
  if (invalid) return invalid;

  const { error } = await supabaseBrowser().from("messages").insert({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    subject: input.subject.trim(),
    message: input.message.trim(),
  });

  if (error) {
    /* PGRST205: PostgREST's schema cache has no `messages` table, i.e.
       migrations/002_messages.sql has not been run against this project (or
       was run after PostgREST last reloaded its cache). 42P01 is the raw
       Postgres "relation does not exist" code, kept as a fallback in case a
       request reaches Postgres directly rather than through PostgREST.
       Named explicitly rather than left as raw text, since it is the one
       failure mode anyone setting this project up fresh will actually hit. */
    if (error.code === "PGRST205" || error.code === "42P01") {
      return {
        ok: false,
        error:
          "NOT_CONFIGURED: the messages table does not exist yet. Run migrations/002_messages.sql against this Supabase project.",
      };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
