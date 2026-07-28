import { BrandMark } from "@/components/layout/BrandMark";
import { Button } from "@/components/ui/Button";

/* Next's default 404 is plain black text on white, entirely outside this
 * system — a visitor who mistypes a URL or follows a stale link lands on a
 * page that looks like nothing built here. This is the only styled surface
 * that has to render without the app chrome: a mistyped URL can fall outside
 * both the (platform) route group and the root, so it borrows the brand mark
 * and a single CTA rather than depending on either layout's nav.
 *
 * CLAUDE.md rule 2.2/8: every link works or is labelled. The one link here
 * goes to the landing page, which is true for a 404 reached from anywhere.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
      <BrandMark size={36} />
      <div>
        <p className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-accent-700">
          404
        </p>
        <h1 className="mt-2 font-display text-[40px] font-extrabold leading-[1.05] tracking-[-0.02em] text-text sm:text-[56px]">
          Nothing&rsquo;s bookable here.
        </h1>
        <p className="mx-auto mt-4 max-w-[46ch] text-[15px] leading-[1.6] text-text/70">
          That page doesn&rsquo;t exist, or the link that sent you here is out of date.
        </p>
      </div>
      <Button href="/" variant="primary">
        Back to Suhail
      </Button>
    </div>
  );
}
