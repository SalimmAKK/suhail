import { NextResponse } from "next/server";
import { getBooking } from "@/lib/booking";
import { getCatalog } from "@/lib/catalog";
import { dateKey, upcomingNights } from "@/lib/astro";

/* Looking a booking up by reference, for the trips page.
 *
 * The trips page runs in the browser and the browser cannot read the bookings
 * table: there is no anon select policy, deliberately. So the lookup goes
 * through here, where the service role can read it.
 *
 * What comes back is trimmed on purpose. A reference is the only thing
 * guarding a booking, and while guessing one out of 33.5 million is unlikely,
 * a guess should not be worth anything. Name, email and phone stay on the
 * server. The date, the status and which experience it was are enough to list
 * a trip, and are what the person holding the reference already knows.
 */

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const { reference } = await params;

  let booking;
  try {
    booking = await getBooking(reference);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lookup failed" },
      { status: 500 },
    );
  }

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nights = upcomingNights(120).map(dateKey);
  const { experiences } = await getCatalog(nights[0], nights[nights.length - 1]);
  const experience = experiences.find((e) => e.id === booking.experience_id);

  return NextResponse.json({
    reference: booking.reference,
    date: booking.date,
    status: booking.status,
    guestCount: booking.guest_count,
    createdAt: booking.created_at,
    experience: experience
      ? {
          title: experience.title,
          siteName: experience.site.name,
          operatorName: experience.operatorName,
          priceSar: experience.priceSar,
        }
      : null,
  });
}
