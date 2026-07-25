/* Local sidereal time. The standard low-precision expression for Greenwich
   mean sidereal time (Meeus, Astronomical Algorithms, ch. 12), offset by
   longitude. Good to well under a second over the life of this demo.

   Sidereal time is the sky's own clock: it is the right ascension currently
   crossing the meridian. When Suhail's LST reads 06h 24m, the star Suhail is
   as high as it will get that night, about 10 degrees over AlUla's southern
   horizon.

   Stage 3 folds this into lib/astro.ts alongside the moon phase functions. */

export const ALULA_LNG = 37.92;

/* Canopus, J2000. The star this product is named for. */
export const SUHAIL_RA = "06h 23m 57s";

function julianDay(date: Date): number {
  return date.getTime() / 86_400_000 + 2_440_587.5;
}

/** Local mean sidereal time in hours, 0 to 24. */
export function localSiderealTime(date: Date, lngDeg: number = ALULA_LNG): number {
  const d = julianDay(date) - 2_451_545.0;
  const gmst = 18.697_374_558 + 24.065_709_824_419_08 * d;
  const lst = (gmst + lngDeg / 15) % 24;
  return lst < 0 ? lst + 24 : lst;
}

/** `21h 04m 12s` */
export function formatSiderealTime(hours: number): string {
  const totalSeconds = Math.floor(hours * 3600);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}
