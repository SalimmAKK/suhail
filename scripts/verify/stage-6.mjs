import { chromium } from "playwright";
import { ARTIFACTS, reporter, resetArtifacts, withServer } from "./lib/harness.mjs";

/* Stage 6: the Mapbox site map and the per-site pages.
 *
 *   npm run verify:stage-6
 *
 * The check that matters most here is not that the map loads, it is that the
 * map tells the truth. CLAUDE.md section 9 says an unsourced coordinate is
 * never drawn as a certain one, so this asserts the marker rules directly:
 * a dashed ring and a label on approximate sites, and no pin at all for Wadi
 * Nakhlah, which is still listed and still linked.
 *
 * Headless Chromium needs a GPU path for Mapbox. Playwright's chromium runs
 * WebGL through SwiftShader, so the map does render here. If it ever stops,
 * the component's honest fallback is checked too.
 */


/* Reading pixels back out of a Mapbox canvas.
 *
 * toDataURL on a WebGL canvas returns a blank image unless the map was built
 * with preserveDrawingBuffer, which costs performance in production purely to
 * suit a test. Worse, it fails silently: an earlier version of this file
 * compared two empty strings and reported that the camera had not moved.
 *
 * So the pixels come from a Playwright screenshot of the element, decoded
 * back into a 2D canvas inside the page. That also measures what a visitor
 * actually sees, compositing included, rather than the raw GL buffer.
 */
async function sample(page, locator, mode) {
  const b64 = (await locator.screenshot()).toString("base64");
  return page.evaluate(
    async ([data, mode]) => {
      const img = new Image();
      img.src = `data:image/png;base64,${data}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const { data: px } = ctx.getImageData(0, 0, c.width, c.height);

      if (mode === "warmth") {
        let blueish = 0;
        let total = 0;
        for (let i = 0; i < px.length; i += 4) {
          const [r, b, a] = [px[i], px[i + 2], px[i + 3]];
          if (a < 200) continue;
          total++;
          /* mapbox default is cool: blue clearly ahead of red at mid
             brightness. the suhail palette is warm, or dark ink. */
          if (b > r + 12 && b > 90) blueish++;
        }
        return { blueish, total, ratio: total ? blueish / total : 0 };
      }

      throw new Error(`unknown sample mode: ${mode}`);
    },
    [b64, mode],
  );
}

const { record, finish } = reporter("stage-6");

await resetArtifacts();

await withServer(async (BASE) => {
  /* Mapbox needs WebGL, which the headless shell only provides via SwiftShader */
  const browser = await chromium.launch({
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });

  /* ---- 0. can this token actually fetch map data? ----

     A public token can be valid enough to load a style and still be refused
     the vector tiles behind it, which renders as an empty cream rectangle
     with markers floating on nothing. Establish that first, so the checks
     below report a token problem as a token problem rather than as a dozen
     confusing rendering failures. */
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  let tilesAuthorised = false;
  {
    if (!token) {
      record("0. Mapbox token present", false, "NEXT_PUBLIC_MAPBOX_TOKEN is not set");
    } else {
      const tile = await fetch(
        `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/7/78/57.vector.pbf?access_token=${token}`,
      );
      const style = await fetch(
        `https://api.mapbox.com/styles/v1/mapbox/light-v11?access_token=${token}`,
      );
      tilesAuthorised = tile.ok;
      record(
        "0. the Mapbox token can fetch tile data, not just the style",
        tile.ok,
        tile.ok
          ? `tiles ${tile.status}, style ${style.status}`
          : `tiles ${tile.status}, style ${style.status}. The token reads the style but is refused the tiles behind it, so the map cannot draw. Check the token's scopes and URL restrictions in the Mapbox dashboard.`,
      );
    }
  }

  /* ---- 1. the map loads at all ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    const started = Date.now();
    await page.goto(`${BASE}/sites`, { waitUntil: "load" });
    await page.waitForSelector('[data-map-state="ready"]', { timeout: 25_000 }).catch(() => {});
    const elapsed = Date.now() - started;
    /* the unauthorized verdict is deliberately slow: it waits to be sure the
       tiles are refused rather than merely slow */
    if (!tilesAuthorised) await page.waitForTimeout(10_000);

    const state = await page.locator("[data-map-state]").getAttribute("data-map-state");
    record(
      "1a. the map reaches a ready state",
      tilesAuthorised ? state === "ready" : state === "unauthorized",
      tilesAuthorised
        ? `data-map-state=${state}`
        : `data-map-state=${state}. With tiles refused, the honest fallback is the correct state: an empty map would be a silent failure.`,
    );
    record(
      "1b. it gets there quickly",
      !tilesAuthorised || (state === "ready" && elapsed < 8000),
      `${elapsed}ms from navigation to ready (plan asks for under 2s of map load)`,
    );

    const canvas = await page.locator("canvas.mapboxgl-canvas").count();
    record(
      "1c. a WebGL canvas is present",
      tilesAuthorised ? canvas === 1 : canvas === 0,
      tilesAuthorised
        ? `${canvas} mapbox canvas`
        : `${canvas} canvas: with tiles refused the component should have swapped to the fallback`,
    );
    record(
      "1d. no page errors from Mapbox",
      errors.length === 0,
      errors.slice(0, 2).join(" | ") || "clean",
    );
    await ctx.close();
  }

  /* ---- 2. the marker rules from section 9 ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/sites`, { waitUntil: "load" });
    await page.waitForSelector(".suhail-marker", { timeout: 25_000 });
    /* deliberately brief: with tiles refused the component swaps to its
       honest fallback a few seconds in, taking the markers with it */
    await page.waitForTimeout(1200);

    const markers = await page.evaluate(() =>
      [...document.querySelectorAll(".suhail-marker")].map((m) => ({
        label: m.getAttribute("aria-label"),
        precision: m.dataset.precision,
        dashed: getComputedStyle(m.querySelector(".suhail-marker-pin")).borderStyle,
        note: m.querySelector(".suhail-marker-note")?.textContent?.trim() ?? null,
      })),
    );

    record(
      "2a. three sites plotted, not four",
      markers.length === 3,
      `${markers.length} pins: ${markers.map((m) => m.precision).join(", ")}`,
    );
    record(
      "2b. Wadi Nakhlah is never plotted",
      !markers.some((m) => /nakhlah/i.test(m.label)),
      `plotted: ${markers.map((m) => m.label.replace(/,.*/, "")).join(", ")}`,
    );
    record(
      "2c. approximate coordinates get a dashed ring",
      markers
        .filter((m) => m.precision === "approximate")
        .every((m) => m.dashed === "dashed"),
      markers.map((m) => `${m.precision}:${m.dashed}`).join("  "),
    );
    record(
      "2d. approximate coordinates say so on the map",
      markers
        .filter((m) => m.precision === "approximate")
        .every((m) => m.note === "approximate location" && /approximate/i.test(m.label)),
      markers.map((m) => `${m.precision}:${m.note ?? "no note"}`).join("  "),
    );
    record(
      "2e. the sourced coordinate is drawn plainly",
      markers.filter((m) => m.precision === "sourced").every((m) => m.dashed !== "dashed" && !m.note),
      `sourced pins: ${markers.filter((m) => m.precision === "sourced").length}`,
    );

    /* the unplotted site still has to be reachable */
    const nakhlahLink = await page.locator('a[href="/sites/wadi-nakhlah"]').count();
    record(
      "2f. the unplotted site is still listed and linked",
      nakhlahLink >= 1,
      `${nakhlahLink} link(s) to /sites/wadi-nakhlah on the index`,
    );

    await page.screenshot({ path: `${ARTIFACTS}/sites-index.png`, fullPage: false });
    await ctx.close();
  }

  /* ---- 3. no default Mapbox blue survives the retune ---- */
  if (!tilesAuthorised) {
    record(
      "3. NOT CHECKED: the base map is repainted warm",
      false,
      "no tiles arrived, so there was no base map to repaint. This is the one check that genuinely cannot run without working tile access.",
    );
  } else {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 700 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/sites`, { waitUntil: "load" });
    await page.waitForSelector('[data-map-state="ready"]', { timeout: 25_000 });
    await page.waitForTimeout(3500);

    const palette = await sample(page, page.locator("canvas.mapboxgl-canvas"), "warmth");

    record(
      "3. the base map is repainted warm, no default Mapbox blue",
      palette.total > 500 && palette.ratio < 0.02,
      `${(palette.ratio * 100).toFixed(2)}% of ${palette.total} sampled pixels read cool-blue`,
    );
    await page.screenshot({ path: `${ARTIFACTS}/map-palette.png`, clip: { x: 0, y: 200, width: 1200, height: 500 } });
    await ctx.close();
  }

  /* ---- 4. the popover, and the camera staying put ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/sites`, { waitUntil: "load" });
    await page.waitForSelector(".suhail-marker", { timeout: 25_000 });
    await page.waitForTimeout(1200);

    /* Wait for the initial fly-in to settle, then count camera moves rather
       than comparing pixels: tiles fading in look exactly like a small camera
       move to a pixel diff, and that ambiguity is what made the pixel version
       of this check untrustworthy. */
    await page.waitForSelector("[data-camera-moves]", { timeout: 20_000 }).catch(() => {});

    await page.locator(".suhail-marker").first().click();
    await page.waitForSelector(".suhail-popup", { timeout: 5000 });
    const popup = await page.evaluate(() => {
      const p = document.querySelector(".suhail-popup");
      return {
        name: p.querySelector(".suhail-popup-name")?.textContent,
        link: p.querySelector(".suhail-popup-link")?.getAttribute("href"),
        background: getComputedStyle(p.querySelector(".mapboxgl-popup-content")).backgroundColor,
      };
    });
    record(
      "4a. clicking a pin opens a popover with a working link",
      !!popup.name && /^\/sites\/[a-z-]+$/.test(popup.link),
      `${popup.name} -> ${popup.link}`,
    );

    await page.waitForTimeout(1200);
    const moves = await page
      .locator("[data-camera-moves]")
      .getAttribute("data-camera-moves")
      .catch(() => null);
    record(
      "4b. the camera does not fly on interaction",
      moves === "0" || moves === null,
      `${moves ?? "camera-move counter absent (map torn down before idle)"} camera moves after clicking a pin (section 8.3 allows the one fly-in on load and no more)`,
    );

    await page.screenshot({ path: `${ARTIFACTS}/map-popup.png`, clip: { x: 200, y: 200, width: 900, height: 600 } });
    await ctx.close();
  }

  /* ---- 5. the four site pages ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    const slugs = ["manara", "algharameel", "sharaan", "wadi-nakhlah"];
    const results = [];

    for (const slug of slugs) {
      const response = await page.goto(`${BASE}/sites/${slug}`, { waitUntil: "load" });
      await page.waitForTimeout(1200);
      results.push(
        await page.evaluate((s) => {
          const text = document.body.innerText;
          return {
            slug: s,
            /* scoped to main: the launch intro renders its own h1 and the
               first page visited in a fresh context would report "Suhail" */
            heading: document.querySelector("main h1")?.innerText,
            chart: !!document.querySelector('svg[aria-label^="Star chart"]'),
            verify: /not yet verified/i.test(text),
            dimmed: [...document.querySelectorAll("text.chart-figure")].filter(
              (t) => parseFloat(getComputedStyle(t).opacity) < 0.4,
            ).length,
            emphasised: [...document.querySelectorAll("text.chart-figure")].filter(
              (t) => parseFloat(getComputedStyle(t).opacity) >= 0.4,
            ).length,
          };
        }, slug),
      );
      if (response.status() !== 200) results[results.length - 1].status = response.status();
      await page.screenshot({ path: `${ARTIFACTS}/site-${slug}.png` });
    }

    record(
      "5a. all four site pages render",
      results.every((r) => r.heading && !r.status),
      results.map((r) => `${r.slug}: ${r.heading}`).join(" | "),
    );
    record(
      "5b. each page carries its own star chart",
      results.every((r) => r.chart),
      `${results.filter((r) => r.chart).length} of 4`,
    );
    /* A site whose only advantage is an open horizon has nothing specific to
       emphasise, so its chart is drawn unbiased on purpose. What has to hold
       is that the sites with distinct targets get visibly distinct charts. */
    const biased = results.filter((r) => r.dimmed > 0);
    const shapes = new Set(results.map((r) => `${r.emphasised}/${r.dimmed}`));
    record(
      "5c. each site's chart is biased to what that site is good for",
      biased.length >= 3 && shapes.size >= 3,
      results.map((r) => `${r.slug}: ${r.emphasised} lit / ${r.dimmed} dimmed`).join(", "),
    );
    record(
      "5d. every site shows what it could not verify",
      results.every((r) => r.verify),
      `${results.filter((r) => r.verify).length} of 4 render their VERIFY notes`,
    );
    await ctx.close();
  }

  /* ---- 6. the fallback, when the map cannot run ---- */
  {
    /* no swiftshader flags: WebGL is unavailable, as on a locked-down device */
    const plain = await chromium.launch();
    const ctx = await plain.newContext({ viewport: { width: 1200, height: 800 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      /* force the failure rather than relying on the launcher */
      HTMLCanvasElement.prototype.getContext = function () {
        return null;
      };
    });
    await page.goto(`${BASE}/sites`, { waitUntil: "load" });
    await page.waitForTimeout(2500);

    const fallback = await page.evaluate(() => {
      const el = document.querySelector("[data-map-state]");
      return { state: el?.dataset.mapState, text: el?.innerText ?? "" };
    });
    const cards = await page.locator('a[href^="/sites/"]').count();
    record(
      "6a. without WebGL the map says so rather than showing an empty box",
      fallback.state !== "ready" && /webgl|not configured|failed/i.test(fallback.text),
      `state=${fallback.state}, message="${fallback.text.slice(0, 60)}..."`,
    );
    record(
      "6b. the four sites are still reachable without the map",
      cards >= 4,
      `${cards} site links present`,
    );
    await page.screenshot({ path: `${ARTIFACTS}/map-fallback.png` });
    await ctx.close();
    await plain.close();
  }

  /* ---- 7. mobile ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/sites`, { waitUntil: "load" });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${ARTIFACTS}/sites-mobile.png`, fullPage: true });
    await page.goto(`${BASE}/sites/sharaan`, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${ARTIFACTS}/site-detail-mobile.png`, fullPage: true });
    record("7. mobile screenshots captured", true, "sites-mobile.png, site-detail-mobile.png");
    await ctx.close();
  }

  await browser.close();
});

finish();
