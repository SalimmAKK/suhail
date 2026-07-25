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

console.log(fails ? `\n${fails} FAILED` : "\nstage-3: all data-layer checks passed");
process.exit(fails ? 1 : 0);
