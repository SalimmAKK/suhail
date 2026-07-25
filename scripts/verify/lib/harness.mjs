import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/* Shared harness for the stage verification scripts.

   BUILD_PLAN ground rule 5 asks that every change build. Some of what the
   stages promise is only observable in a browser: whether the intro fires
   once, whether the star chart draws, whether the map loads, whether the
   app shell survives going offline. Those cannot be checked from the
   prerendered HTML, and asserting them without looking is how a demo breaks
   in front of a grader.

   So each stage that makes a browser-only promise gets a script here. Run
   one with `npm run verify:stage-2`. It builds, serves the build on its own
   port, drives Chromium against it, and shuts the server down again. */

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
export const ARTIFACTS = resolve(ROOT, "scripts/verify/.artifacts");

const PORT = Number(process.env.VERIFY_PORT ?? 4311);
export const BASE = `http://localhost:${PORT}`;

function run(cmd, args, opts = {}) {
  return new Promise((ok, fail) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: "inherit", ...opts });
    child.on("exit", (code) => (code === 0 ? ok() : fail(new Error(`${cmd} exited ${code}`))));
    child.on("error", fail);
  });
}

async function waitForServer(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server did not come up on ${BASE}`);
}

/** Build, serve, hand the caller a live base URL, then always tear down. */
export async function withServer(fn) {
  if (process.env.VERIFY_SKIP_BUILD !== "1") {
    console.log("building...");
    await run("npx", ["next", "build"], { stdio: ["ignore", "ignore", "inherit"] });
  }

  console.log(`serving on ${BASE}`);
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    cwd: ROOT,
    stdio: ["ignore", "ignore", "inherit"],
    detached: true,
  });

  try {
    await waitForServer();
    await mkdir(ARTIFACTS, { recursive: true });
    return await fn(BASE);
  } finally {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      server.kill("SIGTERM");
    }
  }
}

/** Collects pass/fail lines and decides the exit code. */
export function reporter(stage) {
  const results = [];
  return {
    record(name, pass, detail) {
      results.push({ name, pass, detail });
      console.log(`${pass ? "PASS" : "FAIL"}  ${name}\n      ${detail}`);
    },
    finish() {
      const failed = results.filter((r) => !r.pass);
      console.log(`\n${stage}: ${results.length - failed.length}/${results.length} passed`);
      if (failed.length) {
        console.log("FAILURES:\n" + failed.map((f) => `  - ${f.name}: ${f.detail}`).join("\n"));
        process.exitCode = 1;
      }
    },
  };
}

export async function resetArtifacts() {
  await rm(ARTIFACTS, { recursive: true, force: true });
  await mkdir(ARTIFACTS, { recursive: true });
}

/* documentElement does not exist yet when Playwright's addInitScript runs, so
   sample on a timer rather than attaching a MutationObserver to it. */
export const SAMPLER = () => {
  window.__samples = [];
  const t0 = performance.now();
  const id = setInterval(() => {
    const de = document.documentElement;
    window.__samples.push({
      at: Math.round(performance.now() - t0),
      intro: de ? (de.dataset.intro ?? null) : null,
      overlay: !!document.querySelector(".z-\\[100\\]"),
    });
    if (performance.now() - t0 > 3000) clearInterval(id);
  }, 8);
};

export const span = (samples, key) => {
  const hits = samples.filter(key);
  return hits.length ? { n: hits.length, from: hits[0].at, to: hits.at(-1).at } : { n: 0 };
};

/* Tailwind v4 emits color-mix in oklab, so never assert an rgba() string.
   Ask the page what a class actually computes to and compare against that. */
export const computedFor = (page, classes) =>
  page.evaluate((list) => {
    const out = {};
    for (const cls of list) {
      const d = document.createElement("div");
      d.className = cls;
      document.body.appendChild(d);
      out[cls] = getComputedStyle(d).backgroundColor;
      d.remove();
    }
    return out;
  }, classes);
