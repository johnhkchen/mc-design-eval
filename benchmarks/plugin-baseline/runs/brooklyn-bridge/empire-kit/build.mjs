// Builds the Empire Stores + Jane's Carousel site (plan.md): lays the ground, then runs every part in plan order.
// Usage: node build.mjs <out.nbt>   (make.sh calls this with a temp file and moves it into place)
// A part whose module is missing or broken is a no-op with a warning, so the build never fails on another worker's work.
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { existsSync } from "node:fs";
import { SITE_X, SITE_Y, SITE_Z, GROUND } from "./vocab/base.mjs";

const out = process.argv[2] ?? "build.nbt";

// [name as in plan.md PARTS, module]
const PARTS = [
  ["Masonry shell", "parts/shell.mjs"],
  ["Roofline", "parts/roofline.mjs"],
  ["Facade fittings", "parts/fittings.mjs"],
  ["Roof garden and cut", "parts/garden.mjs"],
  ["Carousel box", "parts/carbox.mjs"],
  ["Carousel", "parts/carousel.mjs"],
];

async function loadPart(name, module) {
  const url = new URL(module, import.meta.url);
  if (!existsSync(url)) { console.warn(`part ${name}: ${module} missing, skipped`); return () => {}; }
  try {
    const m = await import(url.href);
    if (typeof m.build !== "function") throw new Error("no build(g) export");
    return m.build;
  } catch (e) {
    console.warn(`part ${name}: ${module} failed to load (${String(e.message).split("\n")[0]}), skipped`);
    return () => {};
  }
}

// A part that throws keeps what it placed; the rest of the build goes on.
const safe = (name, fn) => (g) => {
  try { fn(g); } catch (e) { console.warn(`part ${name}: build threw (${String(e.message).split("\n")[0]}); kept what it placed`); }
};

// 1.21.1 data version (3955): the only version the blocks are written for
const g = new Grid([SITE_X, SITE_Y, SITE_Z], { dataVersion: 3955 });
g.fill([0, 0, 0], [SITE_X - 1, 0, SITE_Z - 1], GROUND);   // the ground: y 0 is the lowest level; parts replace it

const list = [];
for (const [name, module] of PARTS) list.push([name, safe(name, await loadPart(name, module))]);

runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`wrote ${out}`);
