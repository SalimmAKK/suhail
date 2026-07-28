import { MobileNav } from "@/components/layout/MobileNav";
import { TopBar } from "@/components/layout/TopBar";
import { moonPhrase, shortDate } from "@/lib/astro";

/* Everything behind the landing page.
 *
 * The app chrome lives here rather than in the root layout because the landing
 * at / is a different surface: it has its own dark nav, its own full-bleed
 * treatment, and no bottom tab bar. A route group keeps that structural rather
 * than a pathname check inside the chrome asking whether it should render.
 */
export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  /* The bar's status cell reads tonight's real date and moon, computed here on
     the server and handed down as a string. TopBar needs the pathname so it is
     a client component, and formatting the date there would risk rendering one
     month name during SSR and another after hydration. */
  const now = new Date();
  const nightLabel = `${shortDate(now)} · ${moonPhrase(now)}`;

  return (
    <>
      <TopBar nightLabel={nightLabel} />
      {/* Bottom padding only: the top bar is in the flow.

          min-h-0 lets the split views size themselves to exactly what is left
          under the bar and scroll their two columns independently, rather than
          growing the page and scrolling the whole document. */}
      <main className="min-h-0 flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <MobileNav />
    </>
  );
}
