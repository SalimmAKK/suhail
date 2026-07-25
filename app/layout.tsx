import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { LaunchIntro } from "@/components/layout/LaunchIntro";
import { MobileNav } from "@/components/layout/MobileNav";
import { Nav } from "@/components/layout/Nav";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bricolage",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable} ${mono.variable} flex min-h-screen flex-col`}>
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
        {/* the bottom nav is fixed, so the last section needs room under it */}
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <MobileNav />
      </body>
    </html>
  );
}
