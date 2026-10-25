#!/usr/bin/env node
// The shadow lift (src/lift.mjs) on a chunky-shot photograph: out/<place>/shots/<name>.png, kept unlifted as
// <name>-nolift.png the first time (a rerun lifts that again, never twice).
//   node bin/chunky-lift.mjs <place> <name> [--strength 1.6]
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { PNG } from "pngjs";
import { liftImage } from "../src/lift.mjs";

const HERE = dirname(dirname(fileURLToPath(import.meta.url)));
const [place, name] = process.argv.slice(2), opt = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
if (!place || !name) throw new Error("usage: chunky-lift.mjs <place> <name> [--strength 1.6]");
const png = `${HERE}/out/${place}/shots/${name}.png`, raw = `${HERE}/out/${place}/shots/${name}-nolift.png`;
if (!existsSync(raw)) copyFileSync(png, raw);
writeFileSync(png, PNG.sync.write(liftImage(PNG.sync.read(readFileSync(raw)), +opt("--strength", 1.6))));
console.log(`${place}: ${name}.png shadows lifted`);
