import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { CoordinateTag } from "@/components/ui/CoordinateTag";
import { Eyebrow } from "@/components/ui/Eyebrow";

/* Stage 1 placeholder. The create-next-app boilerplate is gone because it
   referenced tokens the palette no longer has. The real landing page, hero
   and star chart arrive in stage 4 per BUILD_PLAN.md. */

export default function Home() {
  return (
    <Shell className="flex flex-col justify-center gap-6 pb-32 pt-[calc(var(--nav-clearance)+4rem)]">
      <Eyebrow>Stage 1</Eyebrow>
      <h1 className="text-pull">Suhail</h1>
      <CoordinateTag items={["26.85°N", "ALULA, KSA", "DESIGN SYSTEM PORTED"]} />
      <p className="max-w-[46ch] text-muted">
        The palette, type scale and UI primitives are in place. The landing page is built in
        stage 4.
      </p>
      <Link href="/styleguide" className="font-mono text-label uppercase tracking-label text-gold-deep underline underline-offset-4">
        View the styleguide
      </Link>
    </Shell>
  );
}
