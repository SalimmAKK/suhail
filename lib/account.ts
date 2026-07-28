import { supabaseBrowser } from "@/lib/supabase";
import { getCatalog } from "@/lib/catalog";
import { upcomingNights, dateKey } from "@/lib/astro";

/* Bookings for the signed-in traveller.
 *
 * getMyBookings runs entirely in the browser, and that is safe here in a way
 * it is not for /operators or the /api/bookings/[reference] lookup: those
 * read across every guest's data through the service role, but this reads
 * through the anon client under migrations/003_accounts.sql's "bookings
 * readable by owner" policy, which is scoped to `user_id = auth.uid()`. A
 * signed-out request or a request for someone else's row returns nothing,
 * enforced by Postgres rather than by this function being careful.
 *
 * The catalogue join is the same shape lib/operators.ts and the
 * /api/bookings/[reference] route already use, for the same reason: the
 * hand-written Database types carry empty Relationships, so a nested
 * PostgREST select does not type through.
 */

export type MyBooking = {
  id: string;
  reference: string;
  date: string;
  guestCount: number;
  status: string;
  createdAt: string;
  experience: {
    title: string;
    siteName: string;
    operatorName: string;
    priceSar: number | null;
  } | null;
};

export type MyBookingsResult = { bookings: MyBooking[]; error: string | null };

export async function getMyBookings(): Promise<MyBookingsResult> {
  const db = supabaseBrowser();

  const { data: session } = await db.auth.getSession();
  if (!session.session) return { bookings: [], error: null };

  const { data, error } = await db
    .from("bookings")
    .select()
    .order("created_at", { ascending: false });

  if (error) return { bookings: [], error: error.message };

  /* Wide enough to cover anything this account could have booked: the
     catalogue window search and discovery use, extended forward. A booking
     for a night outside it still shows, just without the experience join. */
  const nights = upcomingNights(180).map(dateKey);
  const { experiences, error: catalogError } = await getCatalog(
    nights[0],
    nights[nights.length - 1],
  );
  if (catalogError) return { bookings: [], error: catalogError };

  const experienceById = new Map(experiences.map((e) => [e.id, e]));

  return {
    bookings: (data ?? []).map((row) => {
      const experience = experienceById.get(row.experience_id);
      return {
        id: row.id,
        reference: row.reference,
        date: row.date,
        guestCount: row.guest_count,
        status: row.status,
        createdAt: row.created_at,
        experience: experience
          ? {
              title: experience.title,
              siteName: experience.site.name,
              operatorName: experience.operatorName,
              priceSar: experience.priceSar,
            }
          : null,
      };
    }),
    error: null,
  };
}

export type CancelResult = { ok: true } | { ok: false; error: string };

/** Cancels one of the signed-in account's own bookings. See migrations/
 *  003_accounts.sql's "bookings cancellable by owner" policy: the database
 *  itself refuses this for a booking that is not this account's, or is
 *  already cancelled, regardless of what this function sends. */
export async function cancelMyBooking(id: string): Promise<CancelResult> {
  const { error } = await supabaseBrowser()
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
