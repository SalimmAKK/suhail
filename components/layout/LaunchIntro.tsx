"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ALULA_LNG, SUHAIL_RA, formatSiderealTime, localSiderealTime } from "@/lib/astro";

/* CLAUDE.md section 6, motion 4. Ink backdrop, the wordmark arrives letter by
   letter over 500ms, the coordinate line fades in under it, 300ms hold, out
   over 400ms. 1400ms total, once per session.

   Framer Motion rather than Reveal: this is one of the two orchestrated
   sequences section 7 allows it for. Reveal fires a single transition on
   intersection and has no way to stagger six children and then sequence a
   second element off the end of them.

   The sidereal line is the signature detail for this stage. Canopus sits at a
   fixed right ascension, so that number never moves. What moves is AlUla's
   local sidereal time, which is the sky's own clock, and when it reads the
   star's RA the star is at its highest over the southern horizon. So the RA
   is printed static and true, and the observatory clock beneath it ticks. */

const KEY = "suhail-intro";
const WORDMARK = "Suhail";

/* Section 6 budgets the whole sequence at 1400ms: letters over ~500ms, the
   coordinate line behind them, 300ms hold, 400ms out. HOLD_MS is when the
   exit starts, so the measured total is HOLD_MS + 400. */
const LETTER_STAGGER = 0.07;
const COORD_DELAY = 0.5;
const HOLD_MS = 1020;

function subscribe() {
  return () => {};
}

export function LaunchIntro() {
  /* The intro is a client-only decision: it reads sessionStorage and the
     motion preference, neither of which exist during the server render.
     useSyncExternalStore gives us "are we on the client yet" without a
     setState in an effect body. */
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!hydrated) return null;
  return <Sequence />;
}

function Sequence() {
  /* The decision was already made, before first paint, by the inline script
     in the root layout: it checks the motion preference and the session flag
     and marks the document if the intro is owed. Reading it here rather than
     re-deriving it keeps the pre-paint backdrop and this overlay in
     agreement. */
  const [playing, setPlaying] = useState(
    () => document.documentElement.dataset.intro === "play",
  );

  useEffect(() => {
    /* Our own overlay has painted by now, so the CSS backdrop underneath it
       can go. Both are ink, so there is nothing to see in the handover. */
    delete document.documentElement.dataset.intro;
    if (!playing) return;
    /* Mark the session before the timer, so a reload mid-intro does not
       replay it. */
    sessionStorage.setItem(KEY, "seen");
    const timer = setTimeout(() => setPlaying(false), HOLD_MS);
    return () => clearTimeout(timer);
  }, [playing]);

  return (
    <AnimatePresence>
      {playing ? (
        <motion.div
          key="intro"
          /* Decorative for assistive tech: the landing page behind it is
             already the real content, and it is only here for 1.4s. */
          aria-hidden
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-neutral-900"
        >
          <h1 className="font-display text-h1 font-extrabold text-neutral-100" aria-label={WORDMARK}>
            {WORDMARK.split("").map((letter, i) => (
              <motion.span
                key={`${letter}-${i}`}
                initial={{ opacity: 0, y: "0.2em" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.32,
                  delay: i * LETTER_STAGGER,
                  ease: [0.22, 0.61, 0.36, 1],
                }}
                className="inline-block"
              >
                {letter}
              </motion.span>
            ))}
          </h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, delay: COORD_DELAY }}
            className="flex flex-col items-center gap-1.5 text-center font-display text-label uppercase tracking-label"
          >
            <p className="text-neutral-100/75">
              Canopus <span className="text-accent">&middot;</span> &alpha; Carinae{" "}
              <span className="text-accent">&middot;</span> {SUHAIL_RA}
            </p>
            <SiderealClock />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SiderealClock() {
  const [now, setNow] = useState(() => localSiderealTime(new Date(), ALULA_LNG));

  useEffect(() => {
    const id = setInterval(() => setNow(localSiderealTime(new Date(), ALULA_LNG)), 200);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="text-neutral-100/40">
      AlUla <span className="text-accent/60">&middot;</span> Sidereal {formatSiderealTime(now)}
    </p>
  );
}
