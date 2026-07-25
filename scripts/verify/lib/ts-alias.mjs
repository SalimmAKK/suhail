/* Lets the node-level verification scripts import the app's TypeScript
   directly. Node strips the types itself; this only teaches it what the "@/"
   path alias in tsconfig.json means. */
import { pathToFileURL } from "node:url";

let root;

export function initialize(data) {
  root = pathToFileURL(`${data.root}/`).href;
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const base = root + specifier.slice(2);
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      try {
        return await next(base + ext, context);
      } catch {
        /* try the next extension */
      }
    }
  }
  return next(specifier, context);
}
