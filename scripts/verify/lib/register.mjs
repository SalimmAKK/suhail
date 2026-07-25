import { register } from "node:module";
register("./ts-alias.mjs", import.meta.url, { data: { root: process.cwd() } });
