// Pike Place build: the site grid, the ground under each plot, then the six parts in build order.
// Usage: node build.mjs <out.nbt>   (make.sh runs it into a temp file, then moves it into place)
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, PLOTS, GROUND_BLOCK } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }
const outPath = resolve(out);
process.chdir(fileURLToPath(new URL(".", import.meta.url)));   // palette.json, roof.json, site.json are read from here

// Parts in build order. A part whose module file is not there yet builds as nothing (its worker's copy may be a stub).
const PARTS = [
  { name: "Inn at the Market", module: "parts/inn.mjs" },
  { name: "101 Stewart tower", module: "parts/stewart.mjs" },
  { name: "Palihotel", module: "parts/palihotel.mjs" },
  { name: "The Fix building", module: "parts/fix.mjs" },
  { name: "Hahn and Pike Street Commercial", module: "parts/low.mjs" },
  { name: "Dusk lighting and grounds", module: "parts/dusk.mjs" },
];

// The brief's GROUND height at block (x, z) of a plot: one map cell is 2x2 blocks; '.' takes the nearest known cell.
function groundAt(map, row, col) {
  const known = (r, c) => { const v = map[r]?.[c]; return v !== undefined && v !== "." ? Number(v) : null; };
  for (let r = 0; r < 64; r++) {
    for (let dr = -r; dr <= r; dr++) for (let dc = -r; dc <= r; dc++) {
      if (Math.max(Math.abs(dr), Math.abs(dc)) !== r) continue;
      const h = known(row + dr, col + dc);
      if (h != null) return h;
    }
  }
  return 0;
}

// Lay the ground: each plot's place box filled from y 0 up to its GROUND height. Nothing lies below the ground.
function layGround(g, site) {
  for (const [key, p] of Object.entries(PLOTS)) {
    const map = site.plots[key].ground;
    for (let z = 0; z < p.d; z++) for (let x = 0; x < p.w; x++) {
      const h = groundAt(map, z >> 1, x >> 1);
      for (let y = 0; y < h; y++) g.set(p.offset + x, y, z, GROUND_BLOCK);
    }
  }
}

async function loadPart({ name, module }) {
  const file = new URL(module, import.meta.url);
  if (!existsSync(fileURLToPath(file))) {
    console.log(`part ${name}: ${module} not there yet, built as nothing`);
    return () => {};
  }
  const mod = await import(file.href);
  return mod.build ?? (() => {});
}

const site = JSON.parse(readFileSync(new URL("./site.json", import.meta.url), "utf8"));
const g = new Grid([SITE.x, SITE.y, SITE.z], { dataVersion: DATA_VERSIONS["1.21.1"] });
layGround(g, site);
const list = [];
for (const p of PARTS) list.push([p.name, await loadPart(p)]);
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(outPath);
console.log(`saved ${outPath}`);
