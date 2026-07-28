import { chromium } from "playwright";
import {
  ARTIFACTS,
  SAMPLER,
  computedFor,
  reporter,
  resetArtifacts,
  span,
  withServer,
} from "./lib/harness.mjs";

/* Stage 2: nav, mobile bottom nav, launch intro, smooth scroll.

   What is checked here is exactly what BUILD_PLAN stage 2 promises and the
   prerendered HTML cannot show: that the intro fires once per session and
   not on reload, that reduced-motion skips it, that the bottom nav is
   bounded by the md breakpoint, and that the glass is genuinely translucent
   over something rather than a flat bar. */

const { record, finish } = reporter("stage-2");

await resetArtifacts();

await withServer(async (BASE) => {
  const browser = await chromium.launch();

  /* ---- 1. the intro ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(SAMPLER);
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    const s = await page.evaluate(() => window.__samples);
    const backdrop = span(s, (x) => x.intro === "play");
    const overlay = span(s, (x) => x.overlay);
    const flag = await page.evaluate(() => sessionStorage.getItem("suhail-intro"));

    record(
      "1a. intro plays on first visit",
      overlay.n > 0,
      `overlay on screen ${overlay.from}ms..${overlay.to}ms (${overlay.n} samples)`,
    );
    /* The two layers overlap rather than hand over. Handing over assumed the
       overlay paints in the same frame the backdrop is released, which stopped
       being true once the landing page got heavier. Both are the same ink, so
       the backdrop simply stays until the intro is done. */
    record(
      "1b. the backdrop covers from before first paint until the overlay is up",
      backdrop.n > 0 && backdrop.from < overlay.from && backdrop.to >= overlay.from,
      `backdrop ${backdrop.from}ms..${backdrop.to}ms, overlay ${overlay.from}ms..${overlay.to}ms: covered throughout`,
    );
    record(
      "1c. sequence stays close to the 1400ms budget",
      overlay.to - overlay.from < 1600,
      `overlay lifetime ${overlay.to - overlay.from}ms (CLAUDE.md section 6 budgets 1400ms)`,
    );
    record("1d. session flag written", flag === "seen", `sessionStorage['suhail-intro'] = ${flag}`);

    /* reload in the SAME tab: sessionStorage survives, intro must not replay */
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2200);
    const s2 = await page.evaluate(() => window.__samples);
    const b2 = span(s2, (x) => x.intro === "play");
    const o2 = span(s2, (x) => x.overlay);
    record(
      "1e. intro skipped on reload",
      b2.n === 0 && o2.n === 0,
      `backdrop samples=${b2.n}, overlay samples=${o2.n} across ${s2.length} samples`,
    );
    await ctx.close();

    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage();
    await p2.addInitScript(SAMPLER);
    await p2.goto(BASE, { waitUntil: "domcontentloaded" });
    await p2.waitForTimeout(2200);
    const o3 = span(
      await p2.evaluate(() => window.__samples),
      (x) => x.overlay,
    );
    record("1f. a new session plays it again", o3.n > 0, `overlay ${o3.from}ms..${o3.to}ms in a fresh context`);
    await ctx2.close();
  }

  /* ---- 2. reduced motion ---- */
  {
    const ctx = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 1280, height: 900 },
    });
    const page = await ctx.newPage();
    await page.addInitScript(SAMPLER);
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);
    const s = await page.evaluate(() => window.__samples);
    const backdrop = span(s, (x) => x.intro === "play");
    const overlay = span(s, (x) => x.overlay);
    const lenis = await page.evaluate(() => document.documentElement.classList.contains("lenis"));
    record(
      "2a. reduced-motion skips the intro entirely",
      backdrop.n === 0 && overlay.n === 0,
      `backdrop samples=${backdrop.n}, overlay samples=${overlay.n} across ${s.length} samples`,
    );
    record("2b. reduced-motion leaves scrolling native", !lenis, `html.lenis present=${lenis}`);
    await ctx.close();
  }

  /* ---- 3. responsive nav ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/sites`, { waitUntil: "load" });
    await page.waitForTimeout(1500);

    const mobileNav = page.locator("nav.fixed");
    const desktopLinks = page.locator('header nav[aria-label="Primary"]');

    const mSmall = await mobileNav.isVisible();
    const dSmall = await desktopLinks.isVisible();
    const items = await mobileNav.locator("li").count();
    const labels = (await mobileNav.locator("li").allInnerTexts()).map((t) => t.trim());
    const navBox = await mobileNav.boundingBox();

    record("3a. bottom nav visible under md", mSmall && !dSmall, `390px: bottom nav=${mSmall}, desktop links=${dSmall}`);
    record("3b. exactly three icons", items === 3, `items=${items} [${labels.join(", ")}]`);
    /* DESIGN_SYSTEM_REPLACEMENT.md turned the floating capsule into a
       docked bar: full width, flush to the bottom edge, 2px top divider. */
    const docked = await mobileNav.evaluate((el) => {
      const s = getComputedStyle(el);
      return { radius: s.borderRadius, border: s.borderTopWidth, blur: s.backdropFilter };
    });
    record(
      "3c. bottom nav is a docked bar, square and unblurred",
      navBox.x === 0 &&
        navBox.width === 390 &&
        parseFloat(docked.radius) === 0 &&
        docked.blur === "none",
      `x=${navBox.x} width=${navBox.width}, radius=${docked.radius}, top border=${docked.border}, backdrop-filter=${docked.blur}`,
    );

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(400);
    record(
      "3d. bottom nav hidden at md+",
      !(await mobileNav.isVisible()) && (await desktopLinks.isVisible()),
      `1280px: bottom nav=${await mobileNav.isVisible()}, desktop links=${await desktopLinks.isVisible()}`,
    );
    await ctx.close();
  }

  /* ---- 4. the top bar ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tonight`, { waitUntil: "load" });
    await page.waitForTimeout(2000);

    const header = page.locator("header");
    const box = await header.boundingBox();
    const css = await header.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        position: s.position,
        radius: s.borderRadius,
        bg: s.backgroundColor,
        blur: s.backdropFilter,
        borderBottom: `${s.borderBottomWidth} ${s.borderBottomStyle}`,
      };
    });
    const expected = await computedFor(page, ["bg-bg"]);

    record(
      "4a. the nav is a standard top bar, not a floating capsule",
      css.position === "sticky" && box.x === 0 && box.width === 1280,
      `position=${css.position}, x=${box.x}, width=${box.width}`,
    );
    record(
      "4b. square corners and no glass",
      parseFloat(css.radius) === 0 && css.blur === "none",
      `radius=${css.radius}, backdrop-filter=${css.blur}`,
    );
    record(
      "4c. opaque background, not a translucent one",
      css.bg === expected["bg-bg"] && !/0\.\d\)/.test(css.bg),
      `background=${css.bg} (bg-bg is ${expected["bg-bg"]})`,
    );
    record(
      "4d. a 2px solid bottom divider, per the source stylesheet",
      css.borderBottom === "2px solid",
      `border-bottom: ${css.borderBottom}`,
    );

    await page.screenshot({
      path: `${ARTIFACTS}/top-bar.png`,
      clip: { x: 0, y: 0, width: 1280, height: 220 },
    });
    await ctx.close();
  }

  /* ---- 5. nothing renders under the bar on load ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const overlaps = [];
    /* /styleguide was a build reference, deleted once the re-skin it was
       checking against was in place; /operators and /discover are new
       routes, worth the same coverage as everything else under the bar. */
    for (const route of ["/", "/discover", "/tonight", "/sites", "/about", "/contact", "/trips", "/operators"]) {
      await page.goto(BASE + route, { waitUntil: "load" });
      await page.waitForTimeout(1400);
      const bad = await page.evaluate(() => {
        const pill = document.querySelector("header").getBoundingClientRect();
        const out = [];
        for (const el of document.querySelectorAll("main h1, main h2, main p, main a")) {
          const r = el.getBoundingClientRect();
          if (r.height === 0) continue;
          if (r.top < pill.bottom && r.bottom > pill.top && r.left < pill.right && r.right > pill.left) {
            out.push(`${el.tagName}:${(el.textContent || "").trim().slice(0, 28)}`);
          }
        }
        return out;
      });
      if (bad.length) overlaps.push(`${route} -> ${bad.join(" | ")}`);
    }
    record(
      "5. no page content sits under the bar at scroll 0",
      overlaps.length === 0,
      overlaps.length ? overlaps.join("\n      ") : "all 8 routes clear",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/tonight`, { waitUntil: "load" });
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${ARTIFACTS}/mobile-tonight.png` });
    await ctx.close();
  }

  await browser.close();
});

finish();
