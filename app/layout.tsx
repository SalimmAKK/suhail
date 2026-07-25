import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
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
        {/* Runs before any content parses. Reveal's pre-animation hidden state
            only applies under .js (globals.css), so nothing is ever hidden in
            a browser that cannot run the script that reveals it. */}
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add("js")` }} />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
