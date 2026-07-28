import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { Confirmation } from "@/components/sections/Confirmation";
import { getBooking } from "@/lib/booking";
import { getCatalog } from "@/lib/catalog";
import { dateKey, upcomingNights } from "@/lib/astro";

export const metadata: Metadata = {
  title: "Booking confirmed / Suhail",
  robots: { index: false, follow: false },
};

/* Read fresh on every request, from the database, through the service role.
 *
 * This is the page that proves the brief's persistence requirement: nothing
 * here comes from the form that created the booking or from local state, so
 * refreshing it, or opening the URL on another device, shows the same row
 * because it is the same row. */
export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const booking = await getBooking(reference);
  if (!booking) notFound();

  const nights = upcomingNights(120).map(dateKey);
  const { experiences } = await getCatalog(nights[0], nights[nights.length - 1]);
  const experience = experiences.find((e) => e.id === booking.experience_id) ?? null;

  return (
    <Shell className="pb-24 pt-[var(--section-top)]">
      <Confirmation booking={booking} experience={experience} />
    </Shell>
  );
}
