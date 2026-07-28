import type { NextConfig } from "next";

/* Every "tonight" in this product — the night picker, the sky dashboard, the
 * landing page's live stats — is computed by reading local Date getters
 * (getFullYear, getDate, ...) off `new Date()` and treating the result as
 * AlUla's calendar date. lib/astro.ts's dateKey says so directly: "Local
 * date, not UTC: a traveller means their own calendar."
 *
 * That contract only holds if the server process's own timezone happens to
 * be AlUla's, which nothing enforces. It was silently true in development
 * because this machine's system timezone is already Asia/Riyadh, and would
 * have been silently wrong in production: Vercel's Node runtime defaults to
 * UTC, three hours behind AlUla. Between roughly 00:00 and 03:00 AlUla time —
 * verified against this exact scenario — the whole product would have read
 * as still being the previous night: wrong moon phase, wrong availability,
 * wrong everything the site calls "tonight".
 *
 * Pinning the process timezone here, before any request is handled, makes
 * every existing local-getter call site correct everywhere (dev, preview,
 * prod) without touching any of them. Confirmed empirically that Node
 * honours a runtime reassignment of process.env.TZ for Date calls made after
 * it, including calls in other modules loaded later in the same process.
 * Saudi Arabia does not observe daylight saving, so this offset never moves.
 */
process.env.TZ = "Asia/Riyadh";

const nextConfig: NextConfig = {
  images: {
    /* PLACEHOLDER SOURCE. Unsplash-hosted stock stands in for AlUla
       photography until real, sourced images are in place. Remove this
       pattern once the placeholders are replaced with bundled files. */
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
