import type { MetadataRoute } from "next";

/* The Web App Manifest. Next serves this at /manifest.webmanifest and wires
 * the <link rel="manifest"> tag into every page's <head> on its own — no
 * metadata entry needed for that part.
 *
 * start_url is /discover rather than /: a traveller who added this to their
 * home screen did it to check tonight's sky and book something, not to see
 * the landing pitch again every time they open it.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Suhail — dark-sky experiences in AlUla",
    short_name: "Suhail",
    description:
      "Discovery and booking for Saudi Arabia's dark-sky experiences. See what the sky is doing over AlUla tonight, then book it.",
    start_url: "/discover",
    display: "standalone",
    background_color: "#faf8f3",
    theme_color: "#c9a961",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
