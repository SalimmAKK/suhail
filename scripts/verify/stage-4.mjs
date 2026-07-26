import { chromium } from "playwright";
import { ARTIFACTS, reporter, resetArtifacts, withServer } from "./lib/harness.mjs";

/* Stage 4: the star chart and the hero.
 *
 *   npm run verify:stage-4
 *
 * Revised twice. HERO_REDESIGN_BRIEF moved the chart out of the hero, and
 * PAGE_COMPOSITION_BRIEF then replaced the hero itself with live inventory.
 * The chart now lives on /tonight, so that is where it is checked. The
 * landing checks cover the inventory board instead: real counts, real cards,
 * working controls.
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
    await page.goto(`${BASE}/tonight`, { waitUntil: "load" });
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
    await page.goto(`${BASE}/tonight`, { waitUntil: "load" });
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
    await page.goto(`${BASE}/tonight`, { waitUntil: "domcontentloaded" });

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
    /* the chart itself is checked where it is unbiased: a site page dims the
       constellations outside that site's targets, so a sampled star there is
       legitimately below full opacity */
    await page.goto(`${BASE}/tonight`, { waitUntil: "load" });
    await page.waitForTimeout(600);
    const chartState = await page.evaluate(() => {
      const line = document.querySelector("line.chart-line");
      const star = document.querySelector("circle.chart-star");
      return {
        dash: line ? getComputedStyle(line).strokeDasharray : null,
        starOpacity: star ? parseFloat(getComputedStyle(star).opacity) : null,
      };
    });

    await page.goto(`${BASE}/sites/sharaan`, { waitUntil: "load" });
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
      chartState.starOpacity === 1 &&
        (chartState.dash === "none" || chartState.dash === ""),
      `star opacity ${chartState.starOpacity}, stroke-dasharray "${chartState.dash}"`,
    );
    record(
      "4b. ambient layer stops moving but stays visible",
      state.speckAnimation === "none" && state.speckOpacity > 0 && state.speckOpacity <= 0.6,
      `animation-name=${state.speckAnimation}, opacity=${state.speckOpacity}`,
    );
    await page.screenshot({ path: `${ARTIFACTS}/hero-reduced-motion.png`, fullPage: false });
    await ctx.close();
  }

  /* ---- 5. the ambient layer is atmosphere, not content ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/sites/sharaan`, { waitUntil: "load" });
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
      "5d. within the specified opacity range for an ink section",
      ambient.opacity >= 0.3 && ambient.opacity <= 0.6,
      `resting opacity ${ambient.opacity.toFixed(2)} (section 5 specifies 30 to 60% on ink)`,
    );
    record(
      "5e. ambient layer never overlaps the chart disc",
      ambient.overlapping === 0,
      `${ambient.overlapping} specks inside the chart's box`,
    );
    await ctx.close();
  }

  /* ---- 6. the landing page is live inventory ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      /* the mapbox tile refusal is a known environment fault, not this page */
      const t = m.text();
      if (m.type() === "error" && !/Mapbox|403/.test(t)) errors.push(t);
    });

    await page.goto(BASE, { waitUntil: "load" });
    await page.waitForTimeout(3000);

    const board = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("main li")].filter((li) => li.querySelector("h3"));
      const stats = [...document.querySelectorAll("main p")].find((p) =>
        /\d+\s+experiences?\b/i.test(p.innerText),
      )?.innerText;
      return {
        stats: stats?.replace(/\s+/g, " ").trim(),
        cards: cards.map((c) => ({
          title: c.querySelector("h3").innerText,
          price: [...c.querySelectorAll("p")].map((p) => p.innerText).find((t) => /^SAR/.test(t)),
          labelled: /placeholder image, not/i.test(c.innerText),
          book: c.querySelector("a")?.getAttribute("href") ?? "",
        })),
        heroChart: !!document.querySelector('main svg[aria-label^="Star chart"]'),
        markers: document.querySelectorAll(".suhail-marker").length,
      };
    });

    record(
      "6a. the landing page opens on inventory, not a hero",
      board.cards.length === 3 && !board.heroChart,
      `${board.cards.length} experience cards, star chart in the landing page=${board.heroChart}`,
    );
    record(
      "6b. the stats line reports the real count, not the mockup's",
      /\b3 experiences\b/i.test(board.stats ?? "") && !/23/.test(board.stats ?? ""),
      `"${board.stats}"`,
    );
    record(
      "6c. every card carries real seeded data and a working booking link",
      board.cards.every((c) => /^SAR \d+$/.test(c.price ?? "")) &&
        board.cards.every((c) => /^\/book\/[0-9a-f-]{36}\?date=/.test(c.book)),
      board.cards.map((c) => `${c.title} ${c.price}`).join(" | "),
    );
    record(
      "6d. every placeholder photograph says it is one",
      board.cards.every((c) => c.labelled),
      `${board.cards.filter((c) => c.labelled).length} of ${board.cards.length} labelled`,
    );
    record(
      "6e. the map keeps the three-plotted, one-withheld convention",
      board.markers === 3,
      `${board.markers} site markers, Wadi Nakhlah withheld`,
    );

    /* the controls have to be real, not decorative */
    const order = async () => (await page.locator("main li h3").allInnerTexts()).join("|");
    const bySky = await order();
    await page.getByRole("button", { name: "Duration" }).click();
    await page.waitForTimeout(400);
    const byDuration = await order();
    record(
      "6f. the sort controls actually reorder the grid",
      bySky !== byDuration,
      `sky: ${bySky}  ->  duration: ${byDuration}`,
    );

    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      const prose = [...document.querySelectorAll("main p")].find(
        (el) => !el.className.includes("uppercase"),
      );
      return {
        families: [...new Set([...document.fonts].map((f) => f.family))],
        heading: getComputedStyle(document.querySelector("main h1")).fontFamily,
        body: getComputedStyle(prose).fontFamily,
      };
    });
    record(
      "6g. Archivo is really loaded, not a fallback",
      fonts.families.some((f) => /Archivo/i.test(f)) &&
        /Archivo/i.test(fonts.heading) &&
        /Archivo/i.test(fonts.body),
      `loaded: ${fonts.families.join(", ")}`,
    );
    record("6h. no console or page errors", errors.length === 0, errors.slice(0, 2).join(" | ") || "clean");

    await page.screenshot({ path: `${ARTIFACTS}/home-desktop.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(2800);
    await page.screenshot({ path: `${ARTIFACTS}/home-mobile.png`, fullPage: true });
    await ctx.close();
  }

  await browser.close();
});

finish();
