import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { LaunchIntro } from "@/components/layout/LaunchIntro";
import { MobileNav } from "@/components/layout/MobileNav";
import { Nav } from "@/components/layout/Nav";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import "./globals.css";

/* DESIGN_SYSTEM_REPLACEMENT.md: one family for everything, Archivo. It
   replaces Bricolage Grotesque, IBM Plex Sans and IBM Plex Mono. Headings
   run at 800, and the tracked-caps labels that used to be Plex Mono are now
   Archivo at 13px with 0.08em tracking.

   Loaded as a variable font so the 400 to 800 range is one file.

   The variable class goes on <html>, not <body>: Tailwind emits the theme on
   :root, and a custom property containing var() is substituted where it is
   defined. With the class on <body> the reference is undefined at :root and
   every font-family silently falls back to the system stack. */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: "Suhail",
  description:
    "Discovery and booking for Saudi Arabia's dark-sky experiences. See what the sky is doing over AlUla on the night of your trip, then book it.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /* suppressHydrationWarning covers only this element's attributes: the
       inline script below adds .js to <html> before React hydrates. */
    /* The font variables belong on <html>, not <body>.

       Tailwind emits the theme on :root, so --font-display holds
       `var(--font-newsreader), ...`. A custom property containing var() is
       substituted where it is defined: on :root. With the next/font classes
       on <body>, --font-newsreader was undefined at that point, --font-display
       computed to guaranteed-invalid, and every font-family fell through to
       Preflight's system stack. The webfonts downloaded and were never used.
       That was true from stage 1 until this commit. */
    <html
      lang="en"
      className={archivo.variable}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        {/* Runs before any content parses. Two jobs.

            Reveal's pre-animation hidden state only applies under .js
            (globals.css), so nothing is ever hidden in a browser that cannot
            run the script that reveals it.

            LaunchIntro is a client component and cannot cover the page until
            hydration finishes, which on a phone is long enough to see the
            landing page flash first. So the same script decides whether the
            intro is owed and paints the ink backdrop from CSS immediately.
            LaunchIntro clears the attribute once its own overlay is up. The
            timeout is the safety net: if hydration never happens, the
            backdrop lifts on its own rather than leaving a black page. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add("js");try{if(!sessionStorage.getItem("suhail-intro")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.dataset.intro="play";setTimeout(function(){delete document.documentElement.dataset.intro},3000)}}catch(e){}`,
          }}
        />
        <SmoothScroll />
        <LaunchIntro />
        <Nav />
        {/* Bottom padding only: the top bar is in the flow.
            Sections pad their own content down by --nav-clearance instead.
            The bottom is a different matter, nothing sits behind it. */}
        <main className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
