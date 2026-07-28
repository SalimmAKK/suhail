import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { BookingFlow } from "@/components/sections/BookingFlow";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getCatalog } from "@/lib/catalog";
import { dateKey, upcomingNights } from "@/lib/astro";

export const metadata: Metadata = {
  title: "Book / Suhail",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/* The experience and its open nights are resolved on the server from the same
   catalogue the night picker used, so what a traveller sees here is what they
   clicked. The form itself is the client leaf. */

export default async function BookExperience({
  params,
  searchParams,
}: {
  params: Promise<{ experienceId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { experienceId } = await params;
  const { date } = await searchParams;

  const nights = upcomingNights(60).map(dateKey);
  const { experiences, error } = await getCatalog(nights[0], nights[nights.length - 1]);
  const experience = experiences.find((e) => e.id === experienceId);

  if (error) {
    return (
      <Shell className="pb-24 pt-[var(--section-top)]">
        <Eyebrow className="mb-7">Booking</Eyebrow>
        <h1 className="text-h2">The catalogue is unavailable.</h1>
        <p className="mt-8 max-w-[52ch] text-neutral-700">
          This experience could not be loaded, so there is nothing here to book yet. This is a
          real error rather than an empty page.
          <span className="mt-3 block font-display text-label uppercase tracking-label text-accent-2">
            {error}
          </span>
        </p>
      </Shell>
    );
  }

  if (!experience) notFound();

  return (
    <Shell className="pb-24 pt-[var(--section-top)]">
      <div className="max-w-[46ch]">
        <Eyebrow className="mb-7">Reserve a night</Eyebrow>
        <h1 className="text-h2">{experience.title}</h1>
      </div>
      <div className="mt-14">
        <BookingFlow
          experience={experience}
          initialDate={date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null}
        />
      </div>
    </Shell>
  );
}
