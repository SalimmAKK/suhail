# scripts/verify

Runtime verification for the stages that promise something a build cannot
prove. Dev-only. Nothing here ships, nothing here is imported by `app/`.

```bash
npm run verify:stage-2
```

Each script builds the app, serves the build on port 4311, drives Chromium
against it, writes screenshots to `scripts/verify/.artifacts/` (gitignored),
and tears the server down. Exit code is non-zero if any check fails.

`VERIFY_SKIP_BUILD=1` reuses the existing `.next` build.
`VERIFY_PORT` moves the port.

## Why this exists

BUILD_PLAN ground rule 5 asks that every change build. A clean build proves
the code compiles and the routes render. It does not prove the launch intro
fires once and then never again, that reduced-motion skips it, that the glass
nav is translucent over something rather than a flat bar, that the star chart
draws without layout shift, or that the app shell survives airplane mode.

Those are the claims worth checking, because they are the ones that fail
quietly and only in front of an audience.

## Writing one for a new stage

Import from `./lib/harness.mjs`:

- `withServer(fn)` builds, serves, and cleans up. Your checks go in `fn`.
- `reporter(stage)` returns `{ record, finish }`. `record(name, pass, detail)`
  prints a line, `finish()` sets the exit code.
- `computedFor(page, classes)` asks the page what a Tailwind class actually
  computes to. Never assert an `rgba()` string: Tailwind v4 emits `color-mix`
  in oklab, so `bg-ink/50` computes to `oklab(... / 0.5)`.
- `SAMPLER` and `span` poll for short-lived DOM state. `documentElement` does
  not exist when `addInitScript` runs, so an attribute `MutationObserver`
  attached there silently never fires.

Two lessons from stage 2, both of which cost a debugging round:

1. Check an assertion that fails against a probe before concluding the app is
   broken. Five of the first stage-2 failures were the test, not the code.
2. Look at the screenshots. A passing assertion about a computed style says
   nothing about whether the surface reads correctly.
