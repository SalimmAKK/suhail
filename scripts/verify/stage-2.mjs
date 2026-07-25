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
    record(
      "1b. pre-paint backdrop covers until the overlay exists, with no gap",
      backdrop.n > 0 && backdrop.to < overlay.from && overlay.from - backdrop.to < 40,
      `backdrop ${backdrop.from}ms..${backdrop.to}ms, overlay takes over at ${overlay.from}ms`,
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
    record(
      "3c. bottom pill is inset, not a full-width dock",
      navBox.x > 0 && navBox.x + navBox.width < 390,
      `x=${navBox.x}px width=${navBox.width}px in a 390px viewport`,
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

  /* ---- 4. the glass pill ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/tonight`, { waitUntil: "load" });
    await page.waitForTimeout(2000);

    const header = page.locator("header");
    const box = await header.boundingBox();
    const css = await header.evaluate((el) => {
      const s = getComputedStyle(el);
      return { position: s.position, radius: s.borderRadius, bg: s.backgroundColor, filter: s.backdropFilter };
    });
    const expected = await computedFor(page, ["bg-ink/50", "bg-cream/70"]);
    const section = await page.locator("section[data-nav-tone=ink]").boundingBox();

    record(
      "4a. nav is a fixed floating pill",
      css.position === "fixed" && parseFloat(css.radius) > 1000 && box.x > 0,
      `position=${css.position}, radius=${css.radius}, inset x=${box.x}px y=${box.y}px, height=${box.height}px`,
    );
    record("4b. backdrop-blur applied", /blur/.test(css.filter), `backdrop-filter=${css.filter}`);
    record("4c. ink section runs under the pill", section.y < box.y, `section top=${section.y}px vs pill top=${box.y}px`);
    record(
      "4d. translucent, not opaque, and toned to ink",
      css.bg === expected["bg-ink/50"] && /0\.5\)/.test(css.bg),
      `nav bg=${css.bg}\n      bg-ink/50=${expected["bg-ink/50"]}`,
    );
    await page.screenshot({ path: `${ARTIFACTS}/pill-ink.png`, clip: { x: 0, y: 0, width: 1280, height: 300 } });

    await page.goto(`${BASE}/sites`, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    const lightBg = await header.evaluate((el) => getComputedStyle(el).backgroundColor);
    record(
      "4e. cream glass over light sections",
      lightBg === expected["bg-cream/70"] && /0\.7\)/.test(lightBg),
      `nav bg=${lightBg}\n      bg-cream/70=${expected["bg-cream/70"]}`,
    );
    await page.screenshot({ path: `${ARTIFACTS}/pill-light.png`, clip: { x: 0, y: 0, width: 1280, height: 300 } });

    /* dynamic: the styleguide alternates cream and ink sections */
    await page.goto(`${BASE}/styleguide`, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    const atTop = await header.evaluate((el) => getComputedStyle(el).backgroundColor);
    await page
      .locator("section[data-nav-tone=ink]")
      .first()
      .evaluate((el) =>
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + 40, behavior: "instant" }),
      );
    await page.waitForTimeout(1000);
    const overInk = await header.evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(1000);
    const back = await header.evaluate((el) => getComputedStyle(el).backgroundColor);
    record(
      "4f. tone switches on scroll and switches back",
      atTop === expected["bg-cream/70"] && overInk === expected["bg-ink/50"] && back === expected["bg-cream/70"],
      `top=cream(${atTop === expected["bg-cream/70"]}) -> over ink=ink(${overInk === expected["bg-ink/50"]}) -> back=cream(${back === expected["bg-cream/70"]})`,
    );
    await page.screenshot({
      path: `${ARTIFACTS}/pill-over-ink.png`,
      clip: { x: 0, y: 0, width: 1280, height: 300 },
    });
    await ctx.close();
  }

  /* ---- 5. nothing renders under the pill on load ---- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const overlaps = [];
    for (const route of ["/", "/tonight", "/sites", "/about", "/contact", "/trips", "/styleguide"]) {
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
      "5. no page content sits under the pill at scroll 0",
      overlaps.length === 0,
      overlaps.length ? overlaps.join("\n      ") : "all 7 routes clear",
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
