/* Sky arithmetic for AlUla. Pure functions, no dependencies, no network.

   BUILD_PLAN stage 3 rules out an astronomy library, and none is needed:
   moon phase to the precision this product uses is a few lines, and the
   formulas are the standard ones from Meeus, Astronomical Algorithms.

   Precision is deliberately modest. Suhail answers "how dark will that night
   be" and "what will be up", not "where exactly will Jupiter sit at 21:04".
   The moon phase below is good to a couple of percent illumination, which is
   far inside the width of the prime / ok / bright bands it feeds.

   lib/sidereal.ts was folded into this file in stage 3, as planned. */

import { CONSTELLATIONS, type Constellation } from "@/data/stars";
import { ALULA } from "@/data/sites";

/** AlUla's latitude, the vantage point for everything in this product. */
export const ALULA_LAT = ALULA.lat;
export const ALULA_LNG = ALULA.lng;

/** Canopus, J2000. The star this product is named for. */
export const SUHAIL_RA = "06h 23m 57s";

const SYNODIC_MONTH = 29.530_588_853;
/* A known new moon: 2000 Jan 6, 18:14 UT. */
const KNOWN_NEW_MOON_JD = 2_451_550.26;

function julianDay(date: Date): number {
  return date.getTime() / 86_400_000 + 2_440_587.5;
}

/** Days since the last new moon, 0 to 29.53. */
export function moonAge(date: Date): number {
  const age = (julianDay(date) - KNOWN_NEW_MOON_JD) % SYNODIC_MONTH;
  return age < 0 ? age + SYNODIC_MONTH : age;
}

/**
 * Illuminated fraction of the moon's disc.
 * 0 is new and fully dark, 1 is full. This is what MoonPhase renders.
 */
export function moonPhase(date: Date): number {
  const angle = (2 * Math.PI * moonAge(date)) / SYNODIC_MONTH;
  return (1 - Math.cos(angle)) / 2;
}

/** True while the moon is filling out, which decides which limb is lit. */
export function isWaxing(date: Date): boolean {
  return moonAge(date) < SYNODIC_MONTH / 2;
}

export type MoonPhaseName = "new" | "crescent" | "quarter" | "gibbous" | "full";

export function moonPhaseLabel(phase: number): MoonPhaseName {
  if (phase < 0.04) return "new";
  if (phase < 0.35) return "crescent";
  if (phase < 0.65) return "quarter";
  if (phase < 0.96) return "gibbous";
  return "full";
}

export type SkyQuality = "prime" | "ok" | "bright";

/**
 * How good a night this is for stargazing at AlUla.
 *
 * Moon illumination is the only variable. AlUla is arid with roughly 300
 * clear nights a year, so a clear-sky baseline is a fair assumption and the
 * moon is what actually decides whether the Milky Way is visible.
 *
 * The bands: under a quarter lit and the sky is genuinely dark. Past two
 * thirds and the moon washes out everything but the brightest stars.
 */
export function skyQuality(date: Date): SkyQuality {
  const phase = moonPhase(date);
  if (phase <= 0.25) return "prime";
  if (phase <= 0.65) return "ok";
  return "bright";
}

/** Human label for a quality band, as the SkyPip prints it. */
export const SKY_QUALITY_LABEL: Record<SkyQuality, string> = {
  prime: "Prime night",
  ok: "Ok night",
  bright: "Bright night",
};

/**
 * Whether a declination ever clears the horizon from a given latitude.
 * A star is never visible if its declination is below lat - 90.
 */
export function everRises(dec: number, lat: number = ALULA_LAT): boolean {
  return dec > lat - 90;
}

/**
 * Highest altitude a declination reaches from a latitude, in degrees.
 * Useful for saying how low in the south something like Canopus stays.
 */
export function maxAltitude(dec: number, lat: number = ALULA_LAT): number {
  return 90 - Math.abs(lat - dec);
}

/**
 * Constellations worth looking at on a given evening from a given latitude.
 *
 * Filtered by the month they are well placed in, then by whether they clear
 * the horizon at all from this latitude. Returns them brightest-first, so a
 * caller taking the first few gets the ones a traveller will actually notice.
 */
export function visibleConstellations(
  date: Date,
  lat: number = ALULA_LAT,
): Constellation[] {
  const month = date.getMonth() + 1;
  return CONSTELLATIONS.filter((c) => {
    if (!c.months.includes(month)) return false;
    /* the figure has to be substantially up, not just its northern tip */
    return c.stars.some((s) => everRises(s.dec, lat) && maxAltitude(s.dec, lat) > 10);
  }).sort((a, b) => brightest(a) - brightest(b));
}

function brightest(c: Constellation): number {
  return Math.min(...c.stars.map((s) => s.mag));
}

/* ------------------------------------------------------------- sidereal time

   The sky's own clock: the right ascension currently crossing the meridian.
   When AlUla's sidereal time reads 06h 24m, Suhail is as high as it will get
   that night, about ten degrees over the southern horizon.

   Standard low-precision GMST (Meeus ch. 12) offset by longitude. Verified
   against the J2000 epoch value of 18h 41m 50s. */

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
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(totalSeconds / 3600))}h ${pad(
    Math.floor((totalSeconds % 3600) / 60),
  )}m ${pad(totalSeconds % 60)}s`;
}

/* ----------------------------------------------------------------- calendars

   The night picker works in whole dates, so everything downstream shares one
   definition of "a night" and one date key format. */

/** `2026-07-25`. Local date, not UTC: a traveller means their own calendar. */
export function dateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** The next `count` nights starting today, for the night picker. */
export function upcomingNights(count = 60, from: Date = new Date()): Date[] {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
