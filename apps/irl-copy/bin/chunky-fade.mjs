#!/usr/bin/env node
// The circular distance fade (src/fade.mjs) on a chunky-shot photograph: out/<place>/shots/<name>.png, from the scene's own
// camera, over the world's heights.bin. The photograph is kept as <name>-nofade.png the first time.
//   node bin/chunky-fade.mjs <place> <name> [--near 1700] [--far 2200] (blocks from the centre) [--center x,z] (the
//     world's middle) [--sea 14.9] (the sea plane past the edge: chunky-shot's --water-plane) [--strength 1] [--scale 4]
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { PNG } from "pngjs";
import { loadHeights, fadeImage } from "../src/fade.mjs";

const HERE = dirname(dirname(fileURLToPath(import.meta.url)));
const [place, name] = process.argv.slice(2), opt = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
if (!place || !name) throw new Error("usage: chunky-fade.mjs <place> <name> [--near n] [--far n]");
const out = `${HERE}/out/${place}`, png = `${out}/shots/${name}.png`, raw = `${out}/shots/${name}-nofade.png`;
if (!existsSync(raw)) copyFileSync(png, raw);
const scene = JSON.parse(readFileSync(`${out}/chunky/${name}.json`, "utf8")), H = loadHeights(`${out}/heights.bin`);
const half = Math.min(H.X, H.Z) / 2, img = PNG.sync.read(readFileSync(raw)), t0 = Date.now();
fadeImage(img, scene, H, { near: +opt("--near", half * 0.75), far: +opt("--far", half * 0.98), seaY: +opt("--sea", scene.waterWorldEnabled ? scene.waterWorldHeight : 0),
  center: opt("--center") ? opt("--center").split(",").map(Number) : undefined, strength: +opt("--strength", 1), scale: +opt("--scale", 4) });
writeFileSync(png, PNG.sync.write(img));
console.log(`${place}: ${name}.png faded (${Math.round((Date.now() - t0) / 1000)} s)`);
