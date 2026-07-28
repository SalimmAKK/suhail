"use client";

import { useCallback, useSyncExternalStore } from "react";

/* The heart toggle's state.
 *
 * There is no account in this product, so a favourite is a note to self on
 * this device rather than a saved record. localStorage is the honest place for
 * that: it survives a refresh, which is what a traveller comparing two nights
 * expects, and it makes no claim to be a profile.
 *
 * Written as an external store rather than an effect that seeds state on
 * mount. localStorage is exactly what useSyncExternalStore is for: the server
 * snapshot is empty, the client reads the real value, and React reconciles the
 * two itself instead of a setState in an effect causing a second render pass
 * on every mount.
 *
 * The snapshot has to be referentially stable or React re-renders forever, so
 * the parsed Set is cached at module scope and only replaced when it changes.
 */

const KEY = "suhail-favourites";

const EMPTY: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();
let cache: Set<string> | null = null;

function read(): Set<string> {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    /* a browser with storage disabled just does not remember. not an error
       worth showing anyone. */
    cache = new Set();
  }
  return cache;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function useFavourites() {
  const favourites = useSyncExternalStore(subscribe, read, () => EMPTY);

  const toggle = useCallback((id: string) => {
    const next = new Set(read());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    cache = next;
    try {
      window.localStorage.setItem(KEY, JSON.stringify([...next]));
    } catch {
      /* see above */
    }
    for (const listener of listeners) listener();
  }, []);

  return { favourites, toggle };
}
