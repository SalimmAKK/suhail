import {
  dateKey,
  isWaxing,
  maxAltitude,
  moonAge,
  moonPhase,
  moonPhrase,
  visibleConstellations,
} from "@/lib/astro";
import type {
  CloudReading,
  Coords,
  MoonReading,
  NotableEvent,
  SkyProvider,
  SkyReading,
  TwilightReading,
} from "@/lib/sky/types";

/* The standing-in provider.
 *
 * Everything this project can already calculate honestly is calculated: moon
 * illumination and phase, days to the next new moon, which constellations are
 * up and how high they climb, and the notable-events list. Those carry
 * "computed" provenance and are as true as the rest of lib/astro.ts.
 *
 * The rest — twilight clock times, cloud, seeing, wind, temperature, planets,
 * ISS — is modelled. It is deterministic for a given date so a night reads the
 * same on every render, and it is shaped like the real thing so the layout is
 * exercised properly. It carries "demo" provenance and the views say so.
 *
 * To go live, write a provider with the same interface and change the export
 * in provider.ts. Nothing else moves:
 *   - ephemerides (twilight, moon rise/set, planets): astronomy-engine
 *   - cloud, seeing, wind, temperature: OpenWeather
 *   - SQM / Bortle: Light Pollution Map
 */

const SYNODIC_MONTH = 29.530_588_853;

/** Deterministic per-date noise, so a night looks the same on every render. */
function seeded(key: string): () => number {
  let h = 2_166_136_261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16_777_619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10_000) / 10_000;
  };
}

/** Minutes past midnight to `20:14`. Wraps, so 25:30 reads as 01:30. */
function clock(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/**
 * Sunset and sunrise at AlUla's latitude, modelled as a sinusoid on the day of
 * the year rather than solved from solar position.
 *
 * At 26.6°N the year swings roughly 50 minutes either side of the mean, which
 * is what the amplitudes below encode. Good enough to lay out a twilight bar
 * and wrong enough that it is labelled demo.
 */
function solarTimes(date: Date): { sunset: number; sunrise: number } {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  /* peaks at the June solstice, day 172 */
  const swing = Math.sin(((dayOfYear - 172) / 365) * 2 * Math.PI);
  return { sunset: 18 * 60 + 25 + swing * 50, sunrise: 6 * 60 - swing * 45 };
}

function twilightFor(date: Date): TwilightReading {
  const { sunset, sunrise } = solarTimes(date);
  /* the sun takes about 80 minutes to reach 18 degrees below the horizon at
     this latitude, longer in midsummer, and this ignores that */
  const dusk = sunset + 80;
  const dawn = sunrise - 80;
  const darkHours = (dawn + 1440 - dusk) / 60;

  return {
    sunset: clock(sunset),
    astronomicalDusk: clock(dusk),
    astronomicalDawn: clock(dawn),
    sunrise: clock(sunrise),
    darkHours: Math.round(darkHours * 10) / 10,
    bestImaging: { from: clock(dusk + 20), to: clock(dawn - 40) },
    /* the galactic centre transits around local midnight in July and roughly
       two hours earlier each month after that */
    milkyWayCoreTransit: clock(23 * 60 + 30 - (date.getMonth() - 6) * 120),
  };
}

function moonFor(date: Date): MoonReading {
  const age = moonAge(date);
  const illumination = moonPhase(date);
  const waxing = isWaxing(date);
  const { sunset, sunrise } = solarTimes(date);

  /* The moon rises about 50 minutes later each day after the new moon. That
     relation is real; pinning it to sunrise on the day of the new moon is the
     approximation. */
  const rise = sunrise + age * 50;
  const set = rise + 12 * 60 + 25;

  /* Peak darkness is what the night has left once the sun is fully down and
     the moon is out of the way.

     Worked on one continuous timeline rather than on wall-clock times, because
     the window crosses midnight and comparing 04:03 against 20:14 as raw
     minutes says the moon has already set when it has not. Both the moon's
     rise and set are lifted into the same [dusk, dawn] frame first, and a moon
     that is up for the whole of it means there is no dark window to report —
     null, rather than a range the page would print beside a moon that
     contradicts it. */
  const dusk = sunset + 80;
  const dawn = sunrise - 80 + 1440;

  const intoWindow = (minutes: number) => {
    let m = ((minutes % 1440) + 1440) % 1440;
    while (m < dusk) m += 1440;
    return m;
  };

  const moonSets = intoWindow(set);
  const moonRises = intoWindow(rise);

  let peakDarkness: { from: string; to: string } | null;
  if (moonSets > dawn && moonRises > dawn) {
    /* the moon neither sets nor rises inside the window. it is up throughout
       if it rose before dusk, and down throughout if it set before dusk. */
    const upAtDusk = intoWindow(rise) - 1440 > intoWindow(set) - 1440;
    peakDarkness = upAtDusk ? null : { from: clock(dusk), to: clock(dawn) };
  } else if (moonSets <= dawn && moonSets <= moonRises) {
    peakDarkness = { from: clock(moonSets), to: clock(dawn) };
  } else {
    peakDarkness = { from: clock(dusk), to: clock(moonRises) };
  }

  return {
    illumination,
    phrase: moonPhrase(date),
    waxing,
    rise: clock(rise),
    set: clock(set),
    daysToNewMoon: Math.round(SYNODIC_MONTH - age),
    peakDarkness,
  };
}

function cloudFor(date: Date): CloudReading {
  const rand = seeded(`cloud-${dateKey(date)}`);
  /* AlUla is arid: roughly three hundred clear nights a year, so most draws
     should come back clear and the occasional one should not. */
  const base = rand() < 0.8 ? rand() * 18 : 25 + rand() * 50;

  const hourly = Array.from({ length: 13 }, (_, i) => ({
    time: clock((18 + i) * 60),
    cloudPercent: Math.max(0, Math.min(100, Math.round(base + (rand() - 0.5) * 24))),
  }));

  const overall = Math.round(hourly.reduce((sum, h) => sum + h.cloudPercent, 0) / hourly.length);
  const summary = overall < 15 ? "Clear" : overall < 40 ? "Partly cloudy" : overall < 70 ? "Broken" : "Overcast";
  const seeing = overall < 15 ? "Excellent" : overall < 40 ? "Good" : overall < 70 ? "Fair" : "Poor";

  return {
    overallPercent: overall,
    summary,
    seeing,
    windKph: Math.round(3 + rand() * 14),
    /* desert nights in the low twenties most of the year, colder in winter */
    temperatureC: Math.round(22 - Math.cos(((date.getMonth() + 1) / 12) * 2 * Math.PI) * 8),
    hourly,
  };
}

/**
 * Notable events over the next sixty nights.
 *
 * Both sources are real. New moons come from the same synodic model the night
 * picker already runs on. The meteor showers are annual and their peak dates
 * are stable to within a day, so they are a table rather than a guess.
 *
 * Eclipses and planetary conjunctions are deliberately absent: they need a
 * real ephemeris, and inventing dates for them is exactly what CLAUDE.md
 * rule 12 forbids. They arrive with the provider that can compute them.
 */
const METEOR_SHOWERS = [
  { month: 1, day: 3, name: "Quadrantids", detail: "Sharp peak · radiant NE after midnight" },
  { month: 4, day: 22, name: "Lyrids", detail: "~18/hr · radiant NE" },
  { month: 5, day: 6, name: "Eta Aquariids", detail: "~40/hr · predawn eastern sky" },
  { month: 8, day: 12, name: "Perseid meteor shower", detail: "~100/hr · radiant NE" },
  { month: 10, day: 21, name: "Orionids", detail: "~20/hr · radiant SE after midnight" },
  { month: 11, day: 17, name: "Leonids", detail: "~15/hr · radiant E predawn" },
  { month: 12, day: 14, name: "Geminids", detail: "~120/hr · radiant NE, best of the year" },
];

function eventsFrom(date: Date, nights = 60): NotableEvent[] {
  const events: NotableEvent[] = [];

  for (let i = 0; i <= nights; i++) {
    const d = new Date(date);
    d.setDate(d.getDate() + i);

    /* the new moon is the day the moon's age wraps back to zero */
    const age = moonAge(d);
    const previous = moonAge(new Date(d.getTime() - 86_400_000));
    if (age < previous) {
      events.push({
        date: dateKey(d),
        name: "New moon",
        detail: "Peak darkness · the month's best window",
        rating: 5,
      });
    }

    for (const shower of METEOR_SHOWERS) {
      if (d.getMonth() + 1 === shower.month && d.getDate() === shower.day) {
        const moonlit = moonPhase(d) > 0.5;
        events.push({
          date: dateKey(d),
          name: shower.name,
          detail: moonlit ? `${shower.detail} · moon interferes` : shower.detail,
          rating: moonlit ? 3 : 5,
        });
      }
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export const mockSkyProvider: SkyProvider = {
  name: "mock",

  async get(date: Date, coords: Coords): Promise<SkyReading> {
    const rand = seeded(`sky-${dateKey(date)}`);

    /* Altitude comes out of the same spherical trig the star chart uses. A
       figure is called "up" once its brightest star clears forty degrees,
       which is the point it stops being a horizon object. */
    const constellations = visibleConstellations(date, coords.lat).slice(0, 7).map((c) => {
      const altitude = Math.round(
        Math.max(...c.stars.map((s) => maxAltitude(s.dec, coords.lat))),
      );
      return { name: c.name, altitude, up: altitude > 40 };
    });

    const cloud = cloudFor(date);

    return {
      date: dateKey(date),
      coords,
      moon: moonFor(date),
      twilight: twilightFor(date),
      /* AlUla's four sites are certified Bortle 2. SQM is the reading that
         class corresponds to, jittered a little night to night. */
      darkness: { sqm: Math.round((21.6 + rand() * 0.4) * 10) / 10, bortle: 2 },
      cloud,
      constellations,
      planets: [
        { name: "Jupiter", up: rand() > 0.35 },
        { name: "Saturn", up: rand() > 0.4 },
        { name: "Mars", up: rand() > 0.55 },
        { name: "Venus", up: rand() > 0.6 },
      ],
      iss:
        rand() > 0.45
          ? {
              time: clock(20 * 60 + Math.round(rand() * 200)),
              track: rand() > 0.5 ? "SW → NE" : "W → SE",
              minutes: 3 + Math.round(rand() * 3),
            }
          : null,
      events: eventsFrom(date),
      provenance: {
        moon: "demo",
        twilight: "demo",
        darkness: "computed",
        cloud: "demo",
        constellations: "computed",
        planets: "demo",
        iss: "demo",
        events: "computed",
      },
    };
  },
};
