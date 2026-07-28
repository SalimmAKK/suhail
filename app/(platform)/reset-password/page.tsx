import type { Metadata } from "next";
import { Shell } from "@/components/layout/Shell";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ResetPasswordForm } from "@/components/sections/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password / Suhail",
  robots: { index: false, follow: false },
};

export default function ResetPassword() {
  return (
    <section className="pb-24 pt-[var(--section-top)]">
      <Shell className="max-w-[480px]">
        <Eyebrow className="mb-6">Account</Eyebrow>
        <h1 className="text-h2">Set a new password.</h1>
        <div className="mt-12 border-t border-divider pt-10">
          <ResetPasswordForm />
        </div>
      </Shell>
    </section>
  );
}
