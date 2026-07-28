import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AccountView } from "@/components/sections/AccountView";

export const metadata: Metadata = {
  title: "Account / Suhail",
  description: "Bookings made under your account.",
};

export default function Account() {
  return (
    <section className="pb-24 pt-[var(--section-top)]">
      <Shell>
        <Eyebrow className="mb-4">Account</Eyebrow>
        <h1 className="text-h2">Your bookings.</h1>
        <p className="mt-4 max-w-[56ch] text-neutral-700">
          Every booking made while signed in to this account, from any device. A guest booking
          made without signing in stays on the device that made it — see{" "}
          <Link href="/trips" className="underline underline-offset-4">
            trips
          </Link>{" "}
          for that, or use &ldquo;check for guest bookings&rdquo; below to link one made with this
          account&rsquo;s email before you signed in.
        </p>
        <div className="mt-10">
          <AccountView />
        </div>
      </Shell>
    </section>
  );
}
