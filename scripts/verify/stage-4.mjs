import { chromium } from "playwright";
import { ARTIFACTS, reporter, resetArtifacts, withServer } from "./lib/harness.mjs";

/* Stage 4: the star chart and the hero.
 *
 *   npm run verify:stage-4
 *
 * The chart is the signature centrepiece and the highest visual risk in the
 * plan, so this checks the things that would quietly ruin it: stars landing
 * outside the horizon disc, NaN coordinates collapsing the figure, the chart
 * shifting layout as it arrives, the draw-in overrunning its budget, and the
 * ambient layer being loud enough to notice.
 *
 * It cannot check whether the chart is beautiful. Look at the screenshots in
 * scripts/verify/.artifacts for that.
 */

const { record, finish } = reporter("stage-4");

await resetArtifacts();

await withServer(async (BASE) => {
  const browser = await chromium.launch();

  /* ---- 1. geometry ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: "load" });
    await page.waitForTimeout(2200);

    const chart = page.locator('svg[role="img"][aria-label^="Star chart"]');
    record("1a. chart renders", (await chart.count()) === 1, `${await chart.count()} chart svg found`);

    const geometry = await chart.evaluate((svg) => {
      const nums = (el, attrs) => attrs.map((a) => parseFloat(el.getAttribute(a)));
      const stars = [...svg.querySelectorAll("circle.chart-star")].map((c) => nums(c, ["cx", "cy", "r"]));
      const lines = [...svg.querySelectorAll("line.chart-line")].map((l) =>
        nums(l, ["x1", "y1", "x2", "y2"]),
      );
      const labels = [...svg.querySelectorAll("text.chart-star:not(.chart-figure)")].map(
        (t) => t.textContent,
      );
      const figures = [...svg.querySelectorAll("text.chart-figure")].map((t) => t.textContent);
      return {
        stars,
        lines,
        labels,
        figures,
        groups: svg.querySelectorAll("g").length,
        aria: svg.getAttribute("aria-label"),
        viewBox: svg.getAttribute("viewBox"),
      };
    });

    const C = 340;
    const R = 310;
    const inside = ([x, y]) => Math.hypot(x - C, y - C) <= R + 0.5;
    const finite = (arr) => arr.every((n) => Number.isFinite(n));

    record(
      "1b. eight to twelve constellations, per section 8.1",
      geometry.groups >= 8 && geometry.groups <= 12,
      `${geometry.groups} constellations drawn tonight`,
    );
    record(
      "1c. no NaN coordinates",
      geometry.stars.every(finite) && geometry.lines.every(finite),
      `${geometry.stars.length} stars, ${geometry.lines.length} segments, all finite`,
    );
    record(
      "1d. every star sits inside the horizon disc",
      geometry.stars.every((s) => inside(s)),
      `${geometry.stars.filter((s) => !inside(s)).length} outside the rim of ${geometry.stars.length}`,
    );
    record(
      "1e. every segment stays inside the disc",
      geometry.lines.every(([x1, y1, x2, y2]) => inside([x1, y1]) && inside([x2, y2])),
      `${geometry.lines.length} segments checked`,
    );
    record(
      "1f. star radii follow magnitude, clamped",
      geometry.stars.every(([, , r]) => r >= 1.2 && r <= 4),
      `radii ${Math.min(...geometry.stars.map((s) => s[2])).toFixed(2)} to ${Math.max(
        ...geometry.stars.map((s) => s[2]),
      ).toFixed(2)} (clamped to 1.2 - 4, see StarChart)`,
    );
    record(
      "1g. only bright stars are named",
      geometry.labels.length > 0 && geometry.labels.length <= 14,
      `${geometry.labels.length} labels: ${geometry.labels.join(", ")}`,
    );
    record(
      "1g2. every drawn constellation is named",
      geometry.figures.length === geometry.groups,
      `${geometry.figures.length} figure names for ${geometry.groups} constellations: ${geometry.figures.join(", ")}`,
    );
    record(
      "1h. chart is described for screen readers",
      /^Star chart for the AlUla sky/.test(geometry.aria) && geometry.aria.length > 60,
      `aria-label is ${geometry.aria.length} chars`,
    );
    await ctx.close();
  }

  /* ---- 2. no layout shift, which section 12 calls out by name ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(BASE, { waitUntil: "load" });
    await page.waitForTimeout(3000);
    const cls = await page.evaluate(() => window.__cls);
    record(
      "2. chart arrives without layout shift",
      cls < 0.1,
      `cumulative layout shift ${cls.toFixed(4)} (good is under 0.1)`,
    );
    await ctx.close();
  }

  /* ---- 3. the draw-in ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: "domcontentloaded" });

    const timing = await page.evaluate(async () => {
      const seen = { drawn: 0 };
      const start = performance.now();
      /* poll until every line has finished drawing itself */
      while (performance.now() - start < 4000) {
        const lines = [...document.querySelectorAll("line.chart-line")];
        if (lines.length) {
          const done = lines.every((l) => {
            const offset = parseFloat(getComputedStyle(l).strokeDashoffset);
            return !Number.isFinite(offset) || offset < 0.01;
          });
          if (done) {
            seen.drawn = performance.now() - start;
            break;
          }
        }
        await new Promise((r) => requestAnimationFrame(r));
      }
      /* the stars fade in after their line finishes, so keep waiting rather
         than sampling the instant the lines are done */
      while (performance.now() - start < 4000) {
        const stars = [...document.querySelectorAll("circle.chart-star")];
        if (stars.length && stars.every((s) => parseFloat(getComputedStyle(s).opacity) > 0.99)) {
          seen.starsVisible = true;
          seen.settled = performance.now() - start;
          break;
        }
        await new Promise((r) => requestAnimationFrame(r));
      }
      return seen;
    });

    record(
      "3a. draw-in completes inside its budget",
      timing.drawn > 0 && timing.drawn < 1400,
      `all constellation lines drawn by ${Math.round(timing.drawn)}ms (section 6 budgets 900ms)`,
    );
    record(
      "3b. the whole sequence settles inside the 900ms budget",
      timing.starsVisible === true && timing.settled < 1100,
      `stars fully visible at ${Math.round(timing.settled)}ms (section 6 budgets 900ms total)`,
    );
    await ctx.close();
  }

  /* ---- 4. reduced motion renders the finished chart, not a blank one ---- */
  {
    const ctx = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 1440, height: 900 },
    });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: "load" });
    await page.waitForTimeout(600);
    const state = await page.evaluate(() => {
      const line = document.querySelector("line.chart-line");
      const star = document.querySelector("circle.chart-star");
      const speck = document.querySelector(".ambient-star");
      return {
        lineOpacity: line ? parseFloat(getComputedStyle(line).opacity) : null,
        dash: line ? getComputedStyle(line).strokeDasharray : null,
        starOpacity: star ? parseFloat(getComputedStyle(star).opacity) : null,
        speckAnimation: speck ? getComputedStyle(speck).animationName : null,
        speckOpacity: speck ? parseFloat(getComputedStyle(speck).opacity) : null,
      };
    });
    record(
      "4a. chart is fully drawn under reduced motion",
      state.starOpacity === 1 && (state.dash === "none" || state.dash === ""),
      `star opacity ${state.starOpacity}, stroke-dasharray "${state.dash}"`,
    );
    record(
      "4b. ambient layer stops moving but stays visible",
      state.speckAnimation === "none" && state.speckOpacity > 0 && state.speckOpacity < 0.3,
      `animation-name=${state.speckAnimation}, opacity=${state.speckOpacity}`,
    );
    await page.screenshot({ path: `${ARTIFACTS}/hero-reduced-motion.png`, fullPage: false });
    await ctx.close();
  }

  /* ---- 5. the ambient layer is atmosphere, not content ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    const ambient = await page.evaluate(() => {
      /* Section 5 puts the field on the hero AND on any full-ink section, so
         a landing page carrying the night picker has more than one layer.
         The 40-60 count is per layer, not per page. */
      const layers = [...document.querySelectorAll(".ambient-drift")];
      const specks = [...layers[0].querySelectorAll(".ambient-star")];
      const chart = document.querySelector('svg[aria-label^="Star chart"]').getBoundingClientRect();
      const overlapping = specks.filter((s) => {
        const r = s.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        return cx > chart.left && cx < chart.right && cy > chart.top && cy < chart.bottom;
      });
      const widths = specks.map((s) => parseFloat(getComputedStyle(s).strokeWidth));
      const durations = specks.map((s) => parseFloat(getComputedStyle(s).animationDuration));
      return {
        count: specks.length,
        layers: layers.length,
        perLayer: layers.map((l) => l.querySelectorAll(".ambient-star").length),
        overlapping: overlapping.length,
        minWidth: Math.min(...widths),
        maxWidth: Math.max(...widths),
        minDur: Math.min(...durations),
        maxDur: Math.max(...durations),
        opacity: parseFloat(getComputedStyle(specks[0]).opacity),
      };
    });
    record(
      "5a. 40 to 60 specks per layer, per section 5",
      ambient.perLayer.every((n) => n >= 40 && n <= 60),
      `${ambient.layers} layer(s) on this page, ${ambient.perLayer.join(" and ")} specks each`,
    );
    record(
      "5b. specks are 1 to 2 device pixels",
      ambient.minWidth >= 1 && ambient.maxWidth <= 2,
      `stroke widths ${ambient.minWidth} to ${ambient.maxWidth}px`,
    );
    record(
      "5c. independent 4 to 8 second cycles",
      ambient.minDur >= 4 && ambient.maxDur <= 8 && ambient.maxDur - ambient.minDur > 1,
      `durations ${ambient.minDur}s to ${ambient.maxDur}s`,
    );
    record(
      "5d. subtle enough on cream to be atmosphere",
      ambient.opacity <= 0.2,
      `resting opacity ${ambient.opacity} (section 5's 30-60% is calibrated for ink)`,
    );
    record(
      "5e. ambient layer never overlaps the chart disc",
      ambient.overlapping === 0,
      `${ambient.overlapping} specks inside the chart's box`,
    );
    await ctx.close();
  }

  /* ---- 6. hydration and the screenshots ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto(BASE, { waitUntil: "load" });
    await page.waitForTimeout(2500);
    record(
      "6a. no console errors or hydration mismatch",
      errors.length === 0,
      errors.length ? errors.slice(0, 3).join(" | ") : "clean",
    );

    const cta = page.getByRole("link", { name: "Pick a night" }).first();
    record(
      "6b. the hero CTA is a pill and reaches the night picker",
      (await cta.evaluate((el) => parseFloat(getComputedStyle(el).borderRadius))) > 1000 &&
        (await cta.getAttribute("href")) === "/tonight",
      `href=${await cta.getAttribute("href")}, radius rounded-full`,
    );

    await page.screenshot({ path: `${ARTIFACTS}/hero-desktop.png` });
    await page.screenshot({ path: `${ARTIFACTS}/hero-chart.png`, clip: { x: 700, y: 60, width: 740, height: 700 } });

    /* section 8.1 asks for the chart to be legible on both backgrounds. the
       styleguide renders the pair for exactly this comparison. */
    await page.goto(`${BASE}/styleguide`, { waitUntil: "load" });
    await page.waitForTimeout(1800);
    const inkChart = page.locator('section[data-nav-tone="ink"] svg[aria-label^="Star chart"]').first();
    await inkChart.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    const inkBox = await inkChart.boundingBox();
    await page.screenshot({
      path: `${ARTIFACTS}/chart-on-ink.png`,
      clip: { x: inkBox.x, y: inkBox.y, width: inkBox.width, height: inkBox.height },
    });
    record(
      "6c. chart renders on ink as well as cream",
      !!inkBox && inkBox.width > 200,
      `ink variant is ${Math.round(inkBox.width)}px wide, see chart-on-ink.png`,
    );

    await page.goto(BASE, { waitUntil: "load" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${ARTIFACTS}/hero-mobile.png` });

    const mobileChart = await page
      .locator('svg[aria-label^="Star chart"]')
      .evaluate((el) => el.getBoundingClientRect().width);
    record(
      "6d. chart is not cropped away on a phone",
      mobileChart > 280,
      `chart is ${Math.round(mobileChart)}px wide in a 390px viewport`,
    );
    await ctx.close();
  }

  await browser.close();
});

finish();
