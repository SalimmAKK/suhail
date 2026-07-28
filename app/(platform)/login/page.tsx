import type { Metadata } from "next";
import { Suspense } from "react";
import { Shell } from "@/components/layout/Shell";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { AuthForm } from "@/components/sections/AuthForm";

export const metadata: Metadata = {
  title: "Sign in / Suhail",
  description: "Sign in or create an account to manage your bookings from any device.",
};

export default function Login() {
  return (
    <section className="pb-24 pt-[var(--section-top)]">
      <Shell className="max-w-[480px]">
        <Reveal>
          <Eyebrow className="mb-6">Account</Eyebrow>
          <h1 className="text-h2">Sign in.</h1>
          <p className="mt-6 max-w-[46ch] text-[16px] leading-[1.75] text-neutral-700">
            Optional. A booking works fine as a guest, kept by reference on the device you booked
            it from. Signing in keeps it under an account instead, reachable from anywhere, and
            lets you cancel it yourself.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-12 border-t border-divider pt-10">
            <Suspense>
              <AuthForm />
            </Suspense>
          </div>
        </Reveal>
      </Shell>
    </section>
  );
}
