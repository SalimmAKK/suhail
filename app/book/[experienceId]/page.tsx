import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { CoordinateTag } from "@/components/ui/CoordinateTag";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getCatalog } from "@/lib/catalog";
import { dateKey, parseDateKey, upcomingNights } from "@/lib/astro";

export const metadata: Metadata = {
  title: "Book / Suhail",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const FULL_DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/* Stage 5 placeholder. The booking flow itself is stage 7.

   It exists now because the night picker links here, and rule 2.2/8 does not
   allow a link that goes nowhere. It resolves the real experience and the
   chosen night from the same catalogue the picker used, so what a traveller
   sees here already matches what they clicked. */

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
  const { experiences } = await getCatalog(nights[0], nights[nights.length - 1]);
  const experience = experiences.find((e) => e.id === experienceId);

  if (!experience) notFound();

  const chosen = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;

  return (
    <section className="pb-24 pt-[var(--nav-clearance)]">
      <Shell>
        <Eyebrow className="mb-6">Booking</Eyebrow>
        <h1 className="text-pull">{experience.title}</h1>
        <CoordinateTag
          className="mt-6"
          items={[
            experience.operatorName.toUpperCase(),
            experience.site.name.toUpperCase(),
            `SAR ${experience.priceSar}`,
            ...(chosen ? [FULL_DATE.format(parseDateKey(chosen)).toUpperCase()] : []),
          ]}
        />
        {experience.description ? (
          <p className="mt-8 max-w-[52ch] text-muted">{experience.description}</p>
        ) : null}
        <p className="mt-6 max-w-[52ch] text-muted">
          The booking flow, guest details and the demo payment step are being built. Nothing
          on this page takes a reservation yet.
        </p>
      </Shell>
    </section>
  );
}
