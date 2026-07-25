import { chromium } from "playwright";
import { ARTIFACTS, reporter, resetArtifacts, withServer } from "./lib/harness.mjs";

/* Stage 5: the night picker.
 *
 *   npm run verify:stage-5
 *
 * The most interaction of any stage so far: sixty clickable cells and a panel
 * that has to agree with the astro helpers on every one of them. So this
 * checks all sixty rather than a sample, checks that the panel content
 * actually tracks the selection rather than merely changing, and checks the
 * keyboard path, which is the one no amount of clicking will reveal.
 */

const { record, finish } = reporter("stage-5");

await resetArtifacts();

await withServer(async (BASE) => {
  const browser = await chromium.launch();

  /* ---- 1. the grid ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tonight`, { waitUntil: "load" });
    await page.waitForTimeout(1800);

    const cells = page.locator('[role="group"] button');
    const count = await cells.count();
    record("1a. sixty nights", count === 60, `${count} cells`);

    const grid = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('[role="group"] button')];
      const fills = buttons.map((b) => {
        const span = b.querySelector(".cell-fill");
        return getComputedStyle(span).backgroundColor;
      });
      const labels = buttons.map((b) => b.getAttribute("aria-label"));
      const cols = new Set(buttons.map((b) => Math.round(b.getBoundingClientRect().x)));
      return { fills, labels, columns: cols.size, rows: buttons.length / cols.size };
    });

    record(
      "1b. ten rows of six, per the plan",
      grid.columns === 6 && grid.rows === 10,
      `${grid.columns} columns x ${grid.rows} rows`,
    );
    record(
      "1c. every cell is coloured from the sky ramp",
      new Set(grid.fills).size >= 2 && grid.fills.every((f) => f && f !== "rgba(0, 0, 0, 0)"),
      `${new Set(grid.fills).size} distinct ramp colours across 60 nights`,
    );
    record(
      "1d. every cell names its date and its quality to a screen reader",
      grid.labels.every((l) => l && /(Prime|Ok|Bright) night\.$/.test(l)),
      `e.g. "${grid.labels[0]}"`,
    );

    record(
      "1e. quality colours vary across a lunation",
      new Set(grid.fills.slice(0, 30)).size >= 2,
      `first 30 nights use ${new Set(grid.fills.slice(0, 30)).size} of the 3 ramp bands`,
    );
    await ctx.close();
  }

  /* ---- 2. all sixty cells actually work ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tonight`, { waitUntil: "load" });
    await page.waitForTimeout(1500);

    const cells = page.locator('[role="group"] button');
    const seenHeadings = new Set();
    const failures = [];

    for (let i = 0; i < 60; i++) {
      await cells.nth(i).click();
      await page.waitForTimeout(30);
      const heading = await page.locator("h3").first().innerText();
      const pressed = await cells.nth(i).getAttribute("aria-pressed");
      if (!heading || heading === "Pick a night." || pressed !== "true") {
        failures.push(`${i}: heading="${heading}" pressed=${pressed}`);
      }
      seenHeadings.add(heading);
    }

    record(
      "2a. all sixty cells open a detail panel",
      failures.length === 0,
      failures.length ? failures.slice(0, 3).join(" | ") : "60 of 60 clicked, all filled the panel",
    );
    record(
      "2b. each night shows its own date, not a shared one",
      seenHeadings.size === 60,
      `${seenHeadings.size} distinct dates across 60 selections`,
    );

    const stillSelected = await page.locator('[role="group"] button[aria-pressed="true"]').count();
    record("2c. exactly one night stays selected", stillSelected === 1, `${stillSelected} pressed`);
    await ctx.close();
  }

  /* ---- 3. the panel agrees with the astro helpers ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tonight`, { waitUntil: "load" });
    await page.waitForTimeout(1500);

    const cells = page.locator('[role="group"] button');
    const samples = [];
    for (const i of [0, 7, 14, 21, 29, 44, 59]) {
      await cells.nth(i).click();
      await page.waitForTimeout(120);
      samples.push(
        await page.evaluate(() => {
          const panel = document.querySelector(".panel-enter");
          const text = panel.innerText;
          const moon = panel.querySelector('svg[role="img"]')?.getAttribute("aria-label");
          const lit = text.match(/(\d+)% LIT/);
          return {
            heading: panel.querySelector("h3").innerText,
            moonLabel: moon,
            lit: lit ? Number(lit[1]) : null,
            /* innerText applies text-transform, and these labels are
               uppercased in CSS, so match case-insensitively */
            pip: /prime night|ok night|bright night/i.exec(text)?.[0]?.toLowerCase(),
            hasConstellations: /overhead at 21:00/i.test(text),
            bookCount: [...panel.querySelectorAll("a")].filter((a) =>
              a.textContent.includes("Book this night"),
            ).length,
          };
        }),
      );
    }

    record(
      "3a. moon percentage and moon graphic agree",
      samples.every((s) => s.moonLabel && s.moonLabel.includes(`${s.lit} percent lit`)),
      samples.map((s) => `${s.lit}%`).join(", "),
    );
    record(
      "3b. the pip matches the moon, per the quality bands",
      samples.every(
        (s) =>
          (s.lit <= 25 && s.pip === "prime night") ||
          (s.lit > 25 && s.lit <= 65 && s.pip === "ok night") ||
          (s.lit > 65 && s.pip === "bright night"),
      ),
      samples.map((s) => `${s.lit}%=${s.pip}`).join("  "),
    );
    record(
      "3c. every night lists what is overhead",
      samples.every((s) => s.hasConstellations),
      `${samples.length} sampled nights all showed constellations`,
    );
    record(
      "3d. bookable nights offer a real booking link",
      samples.every((s) => s.bookCount >= 1),
      `book links per night: ${samples.map((s) => s.bookCount).join(", ")}`,
    );
    await ctx.close();
  }

  /* ---- 4. the booking link resolves to the right experience ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tonight`, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await page.locator('[role="group"] button').nth(3).click();
    await page.waitForTimeout(200);

    const href = await page
      .locator("a", { hasText: "Book this night" })
      .first()
      .getAttribute("href");
    record(
      "4a. the link carries a real experience id and the chosen night",
      /^\/book\/[0-9a-f-]{36}\?date=\d{4}-\d{2}-\d{2}$/.test(href),
      href,
    );

    await page.locator("a", { hasText: "Book this night" }).first().click();
    await page.waitForURL(/\/book\//, { timeout: 5000 });
    await page.waitForTimeout(800);
    const bookingHeading = await page.locator("h1").first().innerText();
    const status = page.url();
    record(
      "4b. the booking route resolves the experience rather than 404ing",
      bookingHeading.length > 0 && !/not found/i.test(bookingHeading),
      `${status} shows "${bookingHeading}"`,
    );
    await ctx.close();
  }

  /* ---- 5. keyboard ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tonight`, { waitUntil: "load" });
    await page.waitForTimeout(1500);

    const cells = page.locator('[role="group"] button');
    const tabbable = await page.evaluate(
      () =>
        [...document.querySelectorAll('[role="group"] button')].filter(
          (b) => b.tabIndex === 0,
        ).length,
    );
    record(
      "5a. roving tabindex: one stop, not sixty",
      tabbable === 1,
      `${tabbable} of 60 cells in the tab order`,
    );

    await cells.nth(0).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    const focusedLabel = await page.evaluate(() => document.activeElement.getAttribute("aria-label"));
    const expected = await cells.nth(7).getAttribute("aria-label");
    record(
      "5b. arrow keys move across and down the grid",
      focusedLabel === expected,
      `right then down from cell 0 lands on cell 7: ${focusedLabel === expected}`,
    );

    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);
    const pressedAfterEnter = await page
      .locator('[role="group"] button[aria-pressed="true"]')
      .count();
    record("5c. Enter selects the focused night", pressedAfterEnter === 1, `${pressedAfterEnter} selected`);

    await page.keyboard.press("End");
    const lastFocused = await page.evaluate(() =>
      document.activeElement.getAttribute("aria-label"),
    );
    const lastLabel = await cells.nth(59).getAttribute("aria-label");
    record("5d. End jumps to the last night", lastFocused === lastLabel, `${lastFocused}`);
    await ctx.close();
  }

  /* ---- 6. motion, and the no-JS floor ---- */
  {
    const ctx = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 1440, height: 1000 },
    });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tonight`, { waitUntil: "load" });
    await page.waitForTimeout(700);
    const reduced = await page.evaluate(() => {
      const fill = document.querySelector(".cell-fill");
      const s = getComputedStyle(fill);
      return { animation: s.animationName, transform: s.transform };
    });
    record(
      "6a. reduced motion fills the cells without animating them",
      reduced.animation === "none" && (reduced.transform === "none" || /matrix\(1,/.test(reduced.transform)),
      `animation-name=${reduced.animation}, transform=${reduced.transform}`,
    );

    await page.locator('[role="group"] button').nth(5).click();
    await page.waitForTimeout(200);
    const worksReduced = await page.locator("h3").first().innerText();
    record(
      "6b. the picker still works under reduced motion",
      worksReduced !== "Pick a night.",
      `panel shows "${worksReduced}"`,
    );
    await ctx.close();

    /* JavaScript off: the grid must still render filled and readable */
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const p2 = await noJs.newPage();
    await p2.goto(`${BASE}/tonight`, { waitUntil: "load" });
    const cellCount = await p2.locator('[role="group"] button').count();
    await p2.screenshot({ path: `${ARTIFACTS}/picker-no-js.png` });
    record(
      "6c. the grid renders without JavaScript",
      cellCount === 60,
      `${cellCount} cells server-rendered`,
    );
    await noJs.close();
  }

  /* ---- 7. the moon graphic actually shows the fraction it claims ----

     Measured, not read. The lit shape is an SVG path built from two arcs, and
     the sweep flag on the second one was inverted from stage 1 until now: a
     new moon rendered as full and a 21 percent crescent as a near-full disc.
     Reading the path aloud is what missed it the first time, so this samples
     the path with isPointInPath and compares the enclosed area against the
     phase the component was given. */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/styleguide`, { waitUntil: "load" });
    await page.waitForTimeout(1200);

    const measured = await page.evaluate(() => {
      const canvas = document.createElement("canvas").getContext("2d");
      const out = [];
      for (const svg of document.querySelectorAll('svg[aria-label*="percent lit"]')) {
        const claimed = Number(svg.getAttribute("aria-label").match(/(\d+) percent/)[1]);
        const path = svg.querySelector("path");
        if (!path) {
          out.push({ claimed, measured: 0 });
          continue;
        }
        const shape = new Path2D(path.getAttribute("d"));
        let lit = 0;
        let total = 0;
        /* the viewBox is 100x100 with a disc of radius 50 at (50,50) */
        for (let x = 0; x < 100; x += 0.5) {
          for (let y = 0; y < 100; y += 0.5) {
            if (Math.hypot(x - 50, y - 50) > 49.5) continue;
            total++;
            if (canvas.isPointInPath(shape, x, y)) lit++;
          }
        }
        out.push({ claimed, measured: Math.round((lit / total) * 100) });
      }
      return out;
    });

    const worst = measured.reduce(
      (max, m) => Math.max(max, Math.abs(m.claimed - m.measured)),
      0,
    );
    record(
      "7a. the lit area matches the phase the moon claims",
      measured.length >= 5 && worst <= 3,
      measured.map((m) => `${m.claimed}%->${m.measured}%`).join("  ") + `  worst gap ${worst}pp`,
    );
    await ctx.close();
  }

  /* ---- 8. screenshots ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

    await page.goto(`${BASE}/tonight`, { waitUntil: "load" });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${ARTIFACTS}/picker-empty.png` });

    /* pick a genuinely dark night so the panel shows its best case */
    const idx = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('[role="group"] button')];
      return buttons.findIndex((b) => /Prime night/.test(b.getAttribute("aria-label")));
    });
    await page.locator('[role="group"] button').nth(Math.max(0, idx)).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${ARTIFACTS}/picker-selected.png` });

    const bright = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('[role="group"] button')];
      return buttons.findIndex((b) => /Bright night/.test(b.getAttribute("aria-label")));
    });
    if (bright >= 0) {
      await page.locator('[role="group"] button').nth(bright).click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${ARTIFACTS}/picker-bright-night.png` });
    }

    record("8a. no console or page errors", errors.length === 0, errors.slice(0, 2).join(" | ") || "clean");

    await page.goto(BASE, { waitUntil: "load" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${ARTIFACTS}/landing-full.png`, fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/tonight`, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await page.locator('[role="group"] button').nth(2).click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${ARTIFACTS}/picker-mobile-selected.png` });
    await page.screenshot({ path: `${ARTIFACTS}/picker-mobile.png`, fullPage: true });

    /* stacked, the panel sits under ten rows of grid: picking a night has to
       bring the answer into view or the feedback is off-screen entirely */
    const panelInView = await page.evaluate(() => {
      const panel = document.querySelector(".panel-enter");
      if (!panel) return null;
      const r = panel.getBoundingClientRect();
      return { top: Math.round(r.top), viewport: window.innerHeight };
    });
    record(
      "8c. picking a night brings the panel into view when stacked",
      panelInView && panelInView.top >= -20 && panelInView.top < panelInView.viewport,
      panelInView
        ? `panel top at ${panelInView.top}px in an ${panelInView.viewport}px viewport`
        : "panel not found",
    );

    const cellSize = await page
      .locator('[role="group"] button')
      .first()
      .evaluate((el) => el.getBoundingClientRect().width);
    record(
      "8b. cells stay tappable on a phone",
      cellSize >= 40,
      `${Math.round(cellSize)}px cells at 390px wide (44px is the usual floor)`,
    );
    await ctx.close();
  }

  await browser.close();
});

finish();
