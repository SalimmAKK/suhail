import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailView } from "@/components/detail/DetailView";
import { EXPERIENCES } from "@/data/experiences";
import { siteBySlug } from "@/data/sites";
import { dateKey, upcomingNights } from "@/lib/astro";
import { getCatalog } from "@/lib/catalog";
import { toListItem } from "@/lib/present";
import { getSky } from "@/lib/sky/provider";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const seed = EXPERIENCES.find((e) => e.slug === slug);
  if (!seed) return { title: "Not found / Suhail" };
  return {
    title: `${seed.title} / Suhail`,
    description: seed.description,
  };
}

export default async function ExperienceDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const nights = upcomingNights(60).map(dateKey);
  const { experiences } = await getCatalog(nights[0], nights[nights.length - 1]);

  /* The catalogue is the source of the id the booking row will reference, so
     the page is driven by it rather than by data/experiences.ts. The seed file
     carries the sourcing notes, which the catalogue does not, so both are read
     and joined on slug. */
  const record = experiences.find((e) => e.slug === slug);
  const seed = EXPERIENCES.find((e) => e.slug === slug);
  if (!record || !seed) notFound();

  const site = siteBySlug(seed.siteSlug);
  const item = toListItem(record, nights[0]);
  /* The sky at the site itself where the coordinate is good enough to use,
     otherwise at AlUla town. */
  const sky = await getSky(
    new Date(),
    site && site.coordinatePrecision === "sourced" ? { lat: site.lat, lng: site.lng } : undefined,
  );

  return (
    <DetailView
      item={item}
      sky={sky}
      siteDescription={site?.description ?? ""}
      siteVerify={site?.verify ?? []}
      experienceVerify={seed.verify}
      source={seed.source}
      bestFor={site?.bestFor ?? []}
    />
  );
}
