import type { Metadata } from "next";
import { Shell } from "@/components/layout/Shell";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TripsList } from "@/components/sections/TripsList";

export const metadata: Metadata = {
  title: "Trips / Suhail",
  description: "Bookings made on this device.",
};

/* The list itself is a client component: with no accounts, the only record of
   what this browser booked is in its own storage. It reads the references
   from there and then reads each booking back from the database, so nothing
   shown here is a stale local copy. */

export default function Trips() {
  return (
    <section className="pb-24 pt-[var(--nav-clearance)]">
      <Shell>
        <Eyebrow className="mb-7">Trips</Eyebrow>
        <TripsList />
      </Shell>
    </section>
  );
}
