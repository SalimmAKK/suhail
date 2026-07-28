/* The shapes the sky views read.
 *
 * One reading describes one night at one place. Everything the /sky dashboard
 * and the detail page's "sky at your slot" card render comes from here, so
 * that swapping a real provider in later changes one module rather than five
 * components.
 *
 * The handoff's "Data / API needs" section is the source of this list.
 */

export type Coords = { lat: number; lng: number };

/**
 * Where a figure came from.
 *
 * CLAUDE.md rule 12 is why this exists. Some of these numbers are computed
 * from real math that this project already has and has verified; the rest are
 * plausible stand-ins until a provider is wired. The views print which is
 * which rather than presenting a stubbed cloud forecast as a measurement.
 */
export type Provenance = "computed" | "demo";

/** `20:14`, AlUla local time. Null when the event does not occur that night. */
export type ClockTime = string;

export type MoonReading = {
  /** illuminated fraction of the disc, 0 to 1 */
  illumination: number;
  /** `Waxing crescent 4%` */
  phrase: string;
  waxing: boolean;
  rise: ClockTime | null;
  set: ClockTime | null;
  /** whole days until the next new moon */
  daysToNewMoon: number;
  /** the window with neither sun nor moon in the sky */
  peakDarkness: { from: ClockTime; to: ClockTime } | null;
};

export type TwilightReading = {
  sunset: ClockTime;
  /** end of astronomical twilight in the evening: true dark begins */
  astronomicalDusk: ClockTime;
  /** start of astronomical twilight in the morning: true dark ends */
  astronomicalDawn: ClockTime;
  sunrise: ClockTime;
  /** hours between astronomical dusk and dawn */
  darkHours: number;
  bestImaging: { from: ClockTime; to: ClockTime } | null;
  milkyWayCoreTransit: ClockTime | null;
};

export type DarknessReading = {
  /** sky brightness in magnitudes per square arcsecond. higher is darker. */
  sqm: number;
  /** Bortle class, 1 to 9. lower is darker. */
  bortle: number;
};

export type CloudHour = { time: ClockTime; cloudPercent: number };

export type CloudReading = {
  overallPercent: number;
  /** `Clear`, `Broken`, `Overcast` */
  summary: string;
  /** `Excellent`, `Good`, `Fair`, `Poor` */
  seeing: string;
  windKph: number;
  temperatureC: number;
  /** twelve hourly readings, 18:00 through 06:00 */
  hourly: CloudHour[];
};

export type ConstellationReading = {
  name: string;
  /** degrees above the horizon at its highest tonight, null when unknown */
  altitude: number | null;
  /** already well up at midnight, as against still rising */
  up: boolean;
};

export type PlanetReading = { name: string; up: boolean };

export type IssPass = {
  time: ClockTime;
  /** `SW → NE` */
  track: string;
  minutes: number;
};

export type NotableEvent = {
  /** date key, `2026-08-12` */
  date: string;
  name: string;
  detail: string;
  /** how worth staying up for, 1 to 5. drives the star row. */
  rating: number;
};

export type SkyReading = {
  /** date key, `2026-07-26` */
  date: string;
  coords: Coords;
  moon: MoonReading;
  twilight: TwilightReading;
  darkness: DarknessReading;
  cloud: CloudReading;
  constellations: ConstellationReading[];
  planets: PlanetReading[];
  /** null when nothing passes over on this night */
  iss: IssPass | null;
  /** the next sixty nights, not just this one */
  events: NotableEvent[];
  /** which of the above is measured and which is standing in */
  provenance: Record<keyof Omit<SkyReading, "date" | "coords" | "provenance">, Provenance>;
};

/** What a provider has to satisfy. `mock` implements it; a real feed will too. */
export interface SkyProvider {
  readonly name: string;
  get(date: Date, coords: Coords): Promise<SkyReading>;
}
