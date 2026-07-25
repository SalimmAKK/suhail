import type { Metadata } from "next";
import { Shell } from "@/components/layout/Shell";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "Trips / Suhail",
  description: "Bookings made on this device.",
};

/* Stage 2 placeholder, specified in BUILD_PLAN stage 2 task 2. Stage 7 fills
   this from the booking references kept on the device. */

export default function Trips() {
  return (
    <section className="py-24">
      <Shell>
        <Eyebrow className="mb-6">Trips</Eyebrow>
        <h1 className="text-pull">No bookings yet.</h1>
        <p className="mt-8 max-w-[52ch] text-muted">
          Nights you book will be kept here on this device, so you can find your reference in
          the desert with no signal.
        </p>
      </Shell>
    </section>
  );
}
