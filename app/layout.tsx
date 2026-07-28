import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { InstallPrompt } from "@/components/layout/InstallPrompt";
import { LaunchIntro } from "@/components/layout/LaunchIntro";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
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

/* The top bar prints tonight's date and moon on every route, including the
   handful that are still prerendered as static (/about, /contact, /sites,
   /trips). Without this they would keep showing whatever date the build ran
   on. An hour is well inside the resolution of a "26 Jul · waxing crescent"
   label and leaves those pages static rather than forcing the whole tree
   dynamic to fix a caption. */
export const revalidate = 3600;

/* VERCEL_URL is set by Vercel at build time on every deploy (preview and
   production alike) but carries no protocol; SITE_URL is the one to set by
   hand in the dashboard once the project has a real domain, and wins when
   present. Without a metadataBase, every relative image path in `openGraph`
   below resolves against nothing and Next warns on every build; sharing the
   link produces no preview card at all. */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const TITLE = "Suhail — The night sky, booked by the night";
const DESCRIPTION =
  "Discovery and booking for Saudi Arabia's dark-sky experiences. See what the sky is doing over AlUla on the night of your trip, then book it.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  /* Every page in the app already writes its own full "X / Suhail" title as
     an established house style — a `template` here would run every one of
     them through "%s / Suhail" a second time ("Operators / Suhail / Suhail",
     caught live on /operators). A plain string default covers the one route
     that sets none, /discover, and lets everyone else's title stand as
     written instead of rewriting it. */
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "Suhail",
    /* the same duotoned landing backdrop, real licensed stock rather than a
       purpose-made card, until one exists */
    images: [
      {
        url: "https://images.unsplash.com/photo-1502957291543-d85480254bf8?w=1200&h=630&q=80&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "A dense starfield, licensed stock, not AlUla.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  /* app/manifest.ts wires <link rel="manifest"> in on its own; this is the
     part of PWA-related head metadata that isn't the manifest itself. */
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Suhail" },
};

/* themeColor moved out of Metadata and into its own export in recent Next
   versions; kept here rather than in `metadata` above so it isn't silently
   dropped. Matches the manifest's theme_color, which tints Android's browser
   chrome and task switcher before install and the OS status bar after it. */
export const viewport: Viewport = {
  themeColor: "#c9a961",
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
        {/* The duotone ramp every content photograph runs through, referenced
            by .photo-duotone in globals.css.

            feColorMatrix flattens to luminance first; feComponentTransfer then
            maps that single channel onto a four-stop ramp per colour channel:
            ink #1a1d2e in the shadows, a warm brown at the quarter tone, gold
            #c9a961 at the three-quarter, cream #faf8f3 at the top. Night sky
            lands in the ink end and stars in the gold.

            Inline rather than an external file: a filter referenced by url()
            has to be in the same document, and one that 404s silently leaves
            every photograph untreated. */}
        <svg
          aria-hidden
          focusable="false"
          width="0"
          height="0"
          className="absolute"
          style={{ position: "absolute", width: 0, height: 0 }}
        >
          <filter id="nocturne-duotone" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0.2126 0.7152 0.0722 0 0
                      0      0      0      1 0"
            />
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.10 0.51 0.79 0.98" />
              <feFuncG type="table" tableValues="0.11 0.40 0.66 0.97" />
              <feFuncB type="table" tableValues="0.18 0.28 0.38 0.95" />
            </feComponentTransfer>
          </filter>
        </svg>

        <SmoothScroll />
        <LaunchIntro />
        <ServiceWorkerRegister />
        <InstallPrompt />
        {/* The app chrome moved to app/(platform)/layout.tsx. The landing at /
            is a different surface with its own nav, so the root layout now
            carries only what is genuinely global: fonts, the duotone filter,
            smooth scroll, the intro, and the PWA registration/install UI. */}
        {children}
      </body>
    </html>
  );
}
