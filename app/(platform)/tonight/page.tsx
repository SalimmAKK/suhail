import type { Metadata } from "next";
import { NightPickerSection } from "@/components/sections/NightPickerSection";
import { TONIGHT } from "@/data/tonight";

export const metadata: Metadata = {
  title: "Tonight / Suhail",
  description:
    "Sixty nights over AlUla, each rated by moon phase, with what is overhead and what is running on each one.",
};

/* The picker is the whole page here, so its heading is the page's h1.

   force-dynamic for the same reason as the landing page: the sixty nights
   start from today, and a prerendered page would keep offering whichever
   sixty the build happened to catch. */
export const dynamic = "force-dynamic";

export default function Tonight() {
  return <NightPickerSection intro={TONIGHT} headingAs="h1" />;
}
