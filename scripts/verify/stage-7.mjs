import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { ARTIFACTS, reporter, resetArtifacts, withServer } from "./lib/harness.mjs";

/* Stage 7: the booking flow.
 *
 *   npm run verify:stage-7
 *
 * The one outcome BUILD_PLAN says never to ship without. So this drives the
 * whole path in a browser the way a traveller would, and then checks the row
 * from the other side, with the service role, to be sure the confirmation is
 * reading a real record rather than echoing the form.
 *
 * It writes real bookings and deletes them again at the end.
 */

const { record, finish } = reporter("stage-7");

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const created = [];

await resetArtifacts();

await withServer(async (BASE) => {
  const browser = await chromium.launch();

  /* find something bookable the way the product does */
  const { data: experience } = await admin
    .from("experiences")
    .select("id,title,group_min,group_max,price_sar")
    .eq("active", true)
    .limit(1)
    .single();

  const { count: before } = await admin
    .from("bookings")
    .select("*", { count: "exact", head: true });

  /* ---- 1. the flow, end to end ---- */
  let reference = null;
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    /* start where a traveller starts, not on the booking URL */
    await page.goto(`${BASE}/tonight`, { waitUntil: "load" });
    await page.waitForTimeout(1800);
    await page.locator('[role="group"] button').nth(6).click();
    await page.waitForTimeout(400);
    await page.locator("a", { hasText: "Book this night" }).first().click();
    await page.waitForURL(/\/book\//, { timeout: 8000 });
    await page.waitForTimeout(1200);

    record(
      "1a. the night picker leads into a booking page",
      /\/book\/[0-9a-f-]{36}\?date=/.test(page.url()),
      page.url().replace(BASE, ""),
    );

    const prefilled = await page.locator("#date").inputValue();
    const fromUrl = new URL(page.url()).searchParams.get("date");
    record(
      "1b. the night chosen in the picker carries into the form",
      prefilled === fromUrl,
      `url date=${fromUrl}, form shows ${prefilled}`,
    );

    await page.screenshot({ path: `${ARTIFACTS}/booking-form.png`, fullPage: true });

    /* ---- broken states first: the flow must refuse bad input ---- */
    await page.locator("#contactName").fill("A");
    await page.locator("#contactEmail").fill("not-an-email");
    await page.getByRole("button", { name: /Reserve this night/i }).click();
    await page.waitForTimeout(600);

    const nameError = await page.locator("#contactName-error").innerText().catch(() => "");
    record(
      "1c. a too-short name is refused with a real message",
      nameError.length > 0,
      nameError || "no error shown",
    );

    const { count: afterBadName } = await admin
      .from("bookings")
      .select("*", { count: "exact", head: true });
    record(
      "1d. a refused submission writes nothing",
      afterBadName === before,
      `${before} rows before, ${afterBadName} after an invalid submit`,
    );

    await page.locator("#contactName").fill("Stage 7 verification");
    await page.getByRole("button", { name: /Reserve this night/i }).click();
    await page.waitForTimeout(600);
    const emailError = await page.locator("#contactEmail-error").innerText().catch(() => "");
    record(
      "1e. a malformed email is refused with a real message",
      emailError.length > 0,
      emailError || "no error shown",
    );
    await page.screenshot({ path: `${ARTIFACTS}/booking-errors.png` });

    /* ---- now the good path ---- */
    await page.locator("#contactEmail").fill("verify@suhail.test");
    await page.locator("#contactPhone").fill("+966500000000");
    await page.locator("#guestCount").selectOption(String(experience.group_min));
    await page.getByRole("button", { name: /Reserve this night/i }).click();

    await page.waitForURL(/\/book\/confirmation\//, { timeout: 15_000 });
    await page.waitForTimeout(1200);
    reference = page.url().split("/").pop();
    if (reference) created.push(reference);

    record(
      "1f. reserving navigates to a confirmation with a real reference",
      /^SUH-[A-Z0-9]{5}$/.test(reference ?? ""),
      `reference ${reference}`,
    );
    record("1g. no page errors through the flow", errors.length === 0, errors[0] ?? "clean");
    await page.screenshot({ path: `${ARTIFACTS}/confirmation.png`, fullPage: true });
    await ctx.close();
  }

  /* ---- 2. the row is real, checked from the database side ---- */
  {
    const { data: row } = await admin
      .from("bookings")
      .select()
      .eq("reference", reference)
      .maybeSingle();

    record(
      "2a. the booking exists in the database",
      !!row,
      row ? `${row.reference}, ${row.date}, ${row.guest_count} guest(s)` : "not found",
    );
    record(
      "2b. it stored what the form was given",
      row?.contact_name === "Stage 7 verification" &&
        row?.contact_email === "verify@suhail.test" &&
        row?.contact_phone === "+966500000000",
      `name=${row?.contact_name}, email=${row?.contact_email}, phone=${row?.contact_phone}`,
    );
    record(
      "2c. status is pending, as the RLS policy pins it",
      row?.status === "pending",
      `status=${row?.status}`,
    );

    const { count: after } = await admin
      .from("bookings")
      .select("*", { count: "exact", head: true });
    record(
      "2d. exactly one row was written by one booking",
      after === before + 1,
      `${before} rows before, ${after} after`,
    );
  }

  /* ---- 3. persistence, which is the whole point ---- */
  {
    /* a browser that never saw the form: if the confirmation renders, it can
       only have come from the database */
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/book/confirmation/${reference}`, { waitUntil: "load" });
    await page.waitForTimeout(1500);

    const body = await page.locator("main").innerText();
    record(
      "3a. the confirmation renders in a browser that never made the booking",
      body.includes(reference) && /Stage 7 verification/.test(body),
      `reference and name both present in a fresh context`,
    );

    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(1200);
    const afterReload = await page.locator("main").innerText();
    record(
      "3b. it survives a refresh",
      afterReload.includes(reference),
      "reference still shown after reload",
    );

    const notFound = await page.goto(`${BASE}/book/confirmation/SUH-ZZZZZ`, {
      waitUntil: "load",
    });
    record(
      "3c. an unknown reference 404s rather than inventing a booking",
      notFound.status() === 404,
      `HTTP ${notFound.status()}`,
    );
    await ctx.close();
  }

  /* ---- 4. the api route does not leak contact details ---- */
  {
    const response = await fetch(`${BASE}/api/bookings/${reference}`);
    const payload = await response.json();
    const text = JSON.stringify(payload);
    record(
      "4a. the lookup returns the booking",
      response.ok && payload.reference === reference,
      `HTTP ${response.status}, reference ${payload.reference}`,
    );
    record(
      "4b. it withholds name, email and phone",
      !/verification|suhail\.test|966500000000/.test(text),
      `payload keys: ${Object.keys(payload).join(", ")}`,
    );

    const missing = await fetch(`${BASE}/api/bookings/SUH-ZZZZZ`);
    record("4c. an unknown reference 404s", missing.status === 404, `HTTP ${missing.status}`);

    const malformed = await fetch(`${BASE}/api/bookings/nonsense`);
    record(
      "4d. a malformed reference is rejected without querying",
      malformed.status === 404,
      `HTTP ${malformed.status}`,
    );
  }

  /* ---- 5. trips ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();

    await page.goto(`${BASE}/trips`, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    const empty = await page.locator("main").innerText();
    record(
      "5a. a browser with no bookings says so",
      /no bookings yet/i.test(empty),
      empty.split("\n").slice(0, 2).join(" / "),
    );
    await page.screenshot({ path: `${ARTIFACTS}/trips-empty.png` });

    /* visiting the confirmation is what teaches this device the reference */
    await page.goto(`${BASE}/book/confirmation/${reference}`, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    await page.goto(`${BASE}/trips`, { waitUntil: "load" });
    await page.waitForTimeout(2000);

    /* assert against the experience that was actually booked through the
       picker, not an arbitrary row: the picker offers cheapest first, which
       need not be the first row the database returns */
    const { data: bookedRow } = await admin
      .from("bookings")
      .select("experience_id")
      .eq("reference", reference)
      .single();
    const { data: bookedExperience } = await admin
      .from("experiences")
      .select("title")
      .eq("id", bookedRow.experience_id)
      .single();

    const listed = await page.locator("main").innerText();
    record(
      "5b. the booking appears under trips on the device that made it",
      listed.includes(reference),
      `trips page lists ${reference}`,
    );
    record(
      "5c. trips shows the experience that was booked, read back from the server",
      listed.includes(bookedExperience.title),
      `booked "${bookedExperience.title}", trips page ${
        listed.includes(bookedExperience.title) ? "shows it" : "does not show it"
      }`,
    );
    await page.screenshot({ path: `${ARTIFACTS}/trips-list.png`, fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${ARTIFACTS}/trips-mobile.png`, fullPage: true });
    await ctx.close();
  }

  /* ---- 6. references are unique across many bookings ---- */
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const references = new Set([reference]);

    for (let i = 0; i < 9; i++) {
      await page.goto(`${BASE}/book/${experience.id}`, { waitUntil: "load" });
      await page.waitForTimeout(500);
      await page.locator("#contactName").fill(`Stage 7 bulk ${i}`);
      await page.locator("#contactEmail").fill(`bulk${i}@suhail.test`);
      await page.getByRole("button", { name: /Reserve this night/i }).click();
      await page.waitForURL(/\/book\/confirmation\//, { timeout: 15_000 });
      const ref = page.url().split("/").pop();
      references.add(ref);
      created.push(ref);
    }

    record(
      "6. ten bookings produce ten distinct references",
      references.size === 10,
      `${references.size} unique of 10, e.g. ${[...references].slice(0, 3).join(", ")}`,
    );
    await ctx.close();
  }

  /* ---- 7. the sky summary, brief item 1 ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/book/confirmation/${reference}`, { waitUntil: "load" });
    await page.waitForTimeout(1200);

    const summary = await page.evaluate(() => {
      const text = document.querySelector("main").innerText;
      const moon = document.querySelector('main svg[aria-label*="percent lit"]');
      return {
        hasBlock: /the sky on this night/i.test(text),
        moonLabel: moon?.getAttribute("aria-label") ?? null,
        pip: /prime night|ok night|bright night/i.test(text),
        noFee: /no booking fee added/i.test(text),
        demo: /demo mode/i.test(text),
      };
    });

    record(
      "7a. the confirmation carries the sky for that night",
      summary.hasBlock && !!summary.moonLabel && summary.pip,
      `moon: ${summary.moonLabel}`,
    );
    record(
      "7b. the payment step is labelled demo mode, per rule 15",
      summary.demo,
      "demo mode stated on the confirmation",
    );

    await page.goto(`${BASE}/book/${experience.id}`, { waitUntil: "load" });
    await page.waitForTimeout(1000);
    const form = await page.evaluate(() => {
      const text = document.querySelector("main").innerText;
      return {
        sky: /the sky on this night/i.test(text),
        noFee: /no booking fee added/i.test(text),
        demo: /demo mode/i.test(text),
        card: /card number|cvv|expiry/i.test(text),
      };
    });
    record(
      "7c. the booking form carries the sky summary and the price note",
      form.sky && form.noFee,
      `sky block=${form.sky}, price note=${form.noFee}`,
    );
    record(
      "7d. demo mode is stated and no card fields are shown",
      form.demo && !form.card,
      `demo label=${form.demo}, card fields present=${form.card}`,
    );
    await ctx.close();
  }

  await browser.close();
});

/* clean up every booking this run created */
if (created.length) {
  const { error } = await admin.from("bookings").delete().in("reference", created);
  const { count } = await admin.from("bookings").select("*", { count: "exact", head: true });
  console.log(
    `\ncleanup: removed ${created.length} verification booking(s)${
      error ? ` (failed: ${error.message})` : ""
    }, bookings table now has ${count} row(s)`,
  );
}

finish();
