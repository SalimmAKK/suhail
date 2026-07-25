/* Stage 3: schema, seed data, astro helpers.
 *
 * Node-level rather than browser-level: this stage ships pure functions and
 * data, so the checks that matter are whether the moon arithmetic agrees with
 * published lunations, whether the constellation set covers every month the
 * star chart will ask for, and whether booking validation matches the RLS
 * constraints in migrations/001_init.sql.
 *
 *   npm run verify:stage-3
 */

import { generateReference, validateBooking } from "@/lib/booking";
import { equatorialToHorizontal, projectToChart, alulaEvening } from "@/lib/astro";
import { moonPhase, isWaxing, moonPhaseLabel, skyQuality, visibleConstellations,
         everRises, maxAltitude, localSiderealTime, formatSiderealTime, dateKey,
         upcomingNights, ALULA_LAT } from "@/lib/astro";

let fails = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}\n      ${detail}`);
  if (!pass) fails++;
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// Known lunations, independent of the anchor constant used in the code.
const newMoon = new Date("2024-01-11T11:57:00Z");   // published new moon
const fullMoon = new Date("2024-01-25T17:54:00Z");  // published full moon
const newMoon2 = new Date("2026-01-18T19:52:00Z");  // published new moon

check("moonPhase ~0 at a known new moon", moonPhase(newMoon) < 0.02,
  `2024-01-11 11:57Z illum=${moonPhase(newMoon).toFixed(4)} (expect <0.02)`);
check("moonPhase ~1 at a known full moon", moonPhase(fullMoon) > 0.98,
  `2024-01-25 17:54Z illum=${moonPhase(fullMoon).toFixed(4)} (expect >0.98)`);
check("still accurate two years later", moonPhase(newMoon2) < 0.03,
  `2026-01-18 19:52Z illum=${moonPhase(newMoon2).toFixed(4)} (expect <0.03)`);

check("waxing between new and full", isWaxing(new Date("2024-01-18T00:00:00Z")) === true,
  `midway to full, isWaxing=${isWaxing(new Date("2024-01-18T00:00:00Z"))}`);
check("waning between full and new", isWaxing(new Date("2024-02-01T00:00:00Z")) === false,
  `after full, isWaxing=${isWaxing(new Date("2024-02-01T00:00:00Z"))}`);

check("labels track the phase", 
  moonPhaseLabel(0) === "new" && moonPhaseLabel(0.5) === "quarter" && moonPhaseLabel(1) === "full",
  `0=${moonPhaseLabel(0)} 0.5=${moonPhaseLabel(0.5)} 1=${moonPhaseLabel(1)}`);
check("sky quality tracks the moon",
  skyQuality(newMoon) === "prime" && skyQuality(fullMoon) === "bright",
  `new moon=${skyQuality(newMoon)}, full moon=${skyQuality(fullMoon)}`);

// Over a full lunation every band should appear, and prime should be a
// minority of nights: that is the product's whole premise.
const year = Array.from({length: 365}, (_, i) => new Date(2026, 0, 1 + i));
const tally = year.reduce((a, d) => (a[skyQuality(d)]++, a), {prime:0, ok:0, bright:0});
check("bands are all populated across a year",
  tally.prime > 60 && tally.ok > 60 && tally.bright > 60,
  `prime=${tally.prime} ok=${tally.ok} bright=${tally.bright} of 365`);

// Canopus / Suhail from AlUla: the claim made in the copy.
check("Suhail rises from AlUla but only just",
  everRises(-52.696, ALULA_LAT) && near(maxAltitude(-52.696, ALULA_LAT), 10.7, 0.3),
  `max altitude ${maxAltitude(-52.696, ALULA_LAT).toFixed(2)} deg (copy says about ten)`);
check("a far southern star never rises",
  everRises(-70, ALULA_LAT) === false, `dec -70 everRises=${everRises(-70, ALULA_LAT)}`);

const july = visibleConstellations(new Date(2026, 6, 25));
const jan = visibleConstellations(new Date(2026, 0, 15));
const jNames = july.map(c => c.slug);
const janNames = jan.map(c => c.slug);
check("July shows the summer sky, not Orion",
  jNames.includes("scorpius") && jNames.includes("sagittarius") && !jNames.includes("orion"),
  `July: ${jNames.join(", ")}`);
check("January shows the winter sky, including Suhail",
  janNames.includes("orion") && janNames.includes("carina") && !janNames.includes("scorpius"),
  `January: ${janNames.join(", ")}`);
check("every month yields the 8 to 12 the chart wants",
  Array.from({length:12}, (_,m) => visibleConstellations(new Date(2026, m, 15)).length).every(n => n >= 8),
  `counts by month: ${Array.from({length:12}, (_,m) => visibleConstellations(new Date(2026, m, 15)).length).join(" ")}`);
check("brightest constellation sorts first",
  july[0].stars.some(s => s.mag < 1.1),
  `first is ${july[0].name}, brightest star mag ${Math.min(...july[0].stars.map(s=>s.mag))}`);

// Sidereal time, verified against the J2000 epoch value 18h 41m 50s.
check("GMST at J2000 matches the published value",
  formatSiderealTime(localSiderealTime(new Date(Date.UTC(2000,0,1,12,0,0)), 0)) === "18h 41m 50s",
  `got ${formatSiderealTime(localSiderealTime(new Date(Date.UTC(2000,0,1,12,0,0)), 0))}`);
const t0 = localSiderealTime(new Date()), t1 = localSiderealTime(new Date(Date.now()+3600e3));
check("advances at the sidereal rate", near(t1-t0, 1.0027, 0.001),
  `${(t1-t0).toFixed(5)} sidereal hours per real hour (expect 1.00274)`);

const nights = upcomingNights(60);
check("60 nights, consecutive, starting today",
  nights.length === 60 && dateKey(nights[0]) === dateKey(new Date()) &&
  (nights[59] - nights[0]) === 59*86400e3,
  `${dateKey(nights[0])} .. ${dateKey(nights[59])}`);
check("dateKey is local, not UTC-shifted",
  dateKey(new Date(2026, 0, 1)) === "2026-01-01",
  `1 Jan 2026 local -> ${dateKey(new Date(2026, 0, 1))}`);

const refs = new Set(); for (let i=0;i<20000;i++) refs.add(generateReference());
const pattern = /^SUH-[A-Z0-9]{5}$/;
const sample = [...refs].slice(0,3);
check("reference matches the format the RLS policy enforces",
  [...refs].every(r => pattern.test(r)), `20000 generated, e.g. ${sample.join(" ")}`);
check("no ambiguous characters", ![...refs].some(r => /[IO01]/.test(r.slice(4))),
  "alphabet excludes I, O, 0 and 1");
/* 32^5 is 33.5M, so 20k references collide about 6 times by the birthday
   bound. The retry loop and the unique constraint both handle that. What
   this asserts is that the entropy is what it should be: a bound of 40 is
   many standard deviations above 6, but far below what a biased alphabet
   or a short reference would produce. */
check("reference entropy is what the alphabet implies", 20000 - refs.size < 40,
  `${refs.size} unique out of 20000, ${20000 - refs.size} collisions (Poisson mean is about 6)`);

const good = { experienceId:"abc", date:"2026-08-01", guestCount:2, contactName:"Salim K", contactEmail:"a@b.co" };
check("a valid booking passes", validateBooking(good) === null, "returns null");
const cases = [
  ["no experience", {...good, experienceId:""}, "experienceId"],
  ["bad date", {...good, date:"01-08-2026"}, "date"],
  ["zero guests", {...good, guestCount:0}, "guestCount"],
  ["21 guests", {...good, guestCount:21}, "guestCount"],
  ["fractional guests", {...good, guestCount:1.5}, "guestCount"],
  ["one-letter name", {...good, contactName:"S"}, "contactName"],
  ["email with no domain", {...good, contactEmail:"nope@"}, "contactEmail"],
  ["email with a space", {...good, contactEmail:"a b@c.co"}, "contactEmail"],
];
for (const [name, input, field] of cases) {
  const r = validateBooking(input);
  check(`rejects: ${name}`, r && r.ok === false && r.field === field,
    r ? `field=${r.field} error="${r.error}"` : "accepted, should not have");
}
check("guest ceiling matches the RLS check constraint",
  validateBooking({...good, guestCount:20}) === null && validateBooking({...good, guestCount:21}) !== null,
  "20 allowed, 21 rejected, same bounds as the insert policy");


/* ---- projection, against ground truth rather than internal consistency ----

   The stage-4 browser checks confirmed every star lands inside the horizon
   disc with finite coordinates. A projection with east and west swapped, or
   with the hour angle inverted, would pass all of that and still print a
   mirrored sky. These check positions an almanac could be held against. */

const LAT = ALULA_LAT;

// Polaris sits within a degree of the pole: from any latitude it stands due
// north at an altitude equal to that latitude. The oldest navigation fact.
const polaris = equatorialToHorizontal(2.5303, 89.2641, 0, LAT);
check("Polaris stands due north at an altitude equal to the latitude",
  near(polaris.alt, LAT, 1) && (near(polaris.az, 0, 1.5) || near(polaris.az, 360, 1.5)),
  `alt ${polaris.alt.toFixed(2)} deg (latitude is ${LAT.toFixed(2)}), az ${polaris.az.toFixed(2)} deg`);

// Polaris does not move. Six hours of sidereal time later it is still there.
const polarisLater = equatorialToHorizontal(2.5303, 89.2641, 6, LAT);
check("Polaris barely moves over six hours",
  Math.abs(polarisLater.alt - polaris.alt) < 1.5,
  `alt ${polaris.alt.toFixed(2)} -> ${polarisLater.alt.toFixed(2)} deg`);

// A star on the meridian (hour angle zero) is due south when it is south of
// the zenith, and its altitude is 90 - lat + dec.
const meridian = equatorialToHorizontal(12, 0, 12, LAT);
check("a star crossing the meridian is due south at the predicted altitude",
  near(meridian.az, 180, 0.5) && near(meridian.alt, 90 - LAT, 0.5),
  `az ${meridian.az.toFixed(1)} deg, alt ${meridian.alt.toFixed(2)} deg (expected ${(90 - LAT).toFixed(2)})`);

// North of the zenith, the same crossing happens due north instead.
const overhead = equatorialToHorizontal(12, 70, 12, LAT);
check("a circumpolar star crosses the meridian due north",
  near(overhead.az, 0, 0.5) || near(overhead.az, 360, 0.5),
  `dec +70 at hour angle 0 sits at az ${overhead.az.toFixed(1)} deg`);

// Suhail itself, culminating. The about page claims about ten degrees.
const suhail = equatorialToHorizontal(6.3992, -52.696, 6.3992, LAT);
check("Suhail culminates due south, just over ten degrees up",
  near(suhail.az, 180, 0.5) && near(suhail.alt, 10.7, 0.3),
  `az ${suhail.az.toFixed(1)} deg, alt ${suhail.alt.toFixed(2)} deg`);

// Before the meridian a star is in the east, after it is in the west. This is
// the check that catches an inverted hour angle.
const rising = equatorialToHorizontal(12, 0, 9, LAT);
const setting = equatorialToHorizontal(12, 0, 15, LAT);
check("stars rise in the east and set in the west",
  rising.az > 0 && rising.az < 180 && setting.az > 180 && setting.az < 360,
  `three hours before transit az ${rising.az.toFixed(1)} (east), three hours after az ${setting.az.toFixed(1)} (west)`);

// And the projection onto the page: zenith centre, horizon rim, north up,
// east to the LEFT, because the chart is held overhead rather than laid flat.
const centre = projectToChart({ alt: 90, az: 0 }, 340, 340, 310);
const rim = projectToChart({ alt: 0, az: 0 }, 340, 340, 310);
const north = projectToChart({ alt: 45, az: 0 }, 340, 340, 310);
const east = projectToChart({ alt: 45, az: 90 }, 340, 340, 310);
const west = projectToChart({ alt: 45, az: 270 }, 340, 340, 310);
check("the zenith projects to the centre of the disc",
  near(centre.x, 340, 0.01) && near(centre.y, 340, 0.01),
  `(${centre.x.toFixed(2)}, ${centre.y.toFixed(2)})`);
check("the horizon projects to the rim",
  near(Math.hypot(rim.x - 340, rim.y - 340), 310, 0.01),
  `radius ${Math.hypot(rim.x - 340, rim.y - 340).toFixed(2)} of 310`);
check("north is up, and east is to the left as on a held chart",
  north.y < 340 && near(north.x, 340, 0.01) && east.x < 340 && west.x > 340,
  `north y=${north.y.toFixed(0)} (above centre), east x=${east.x.toFixed(0)}, west x=${west.x.toFixed(0)} (centre 340)`);

// The evening the chart is drawn for is 21:00 in AlUla, not in the server's
// timezone, so the same date renders the same sky anywhere.
const evening = alulaEvening(new Date(2026, 7, 14));
check("the chart's evening is 21:00 in AlUla regardless of server timezone",
  evening.getUTCHours() === 18 && evening.getUTCDate() === 14,
  `${evening.toISOString()} is 21:00 UTC+3`);

console.log(fails ? `\n${fails} FAILED` : "\nstage-3: all data-layer checks passed");
process.exit(fails ? 1 : 0);
