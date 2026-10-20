// Tunnel Tops west half (plot 0): the grid, the ground, then the six parts in order. Usage: node build.mjs <out.nbt>
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SIZE, STONE, DIRT, GRASS_BLOCK } from "./vocab/base.mjs";

const PARTS = [
  ["Terrain and paving", "parts/terrain.mjs"],
  ["Tunnel portal and cut", "parts/portal.mjs"],
  ["Outpost play area", "parts/outpost.mjs"],
  ["Overlooks, terraces and promenade", "parts/terraces.mjs"],
  ["Planting and trees", "parts/planting.mjs"],
  ["Lamps and hidden light", "parts/lighting.mjs"],
];

const here = (file) => fileURLToPath(new URL(file, import.meta.url));
const noop = () => {};

// A part whose file is not written yet (or does not load yet, e.g. it imports a vocab file still in progress) builds
// as a no-op, so make.sh still yields a build. The log says which parts were skipped.
async function loadPart(name, module) {
  const url = new URL(module, import.meta.url);
  if (!existsSync(fileURLToPath(url))) { console.log(`part ${name}: ${module} not written yet, built as a no-op`); return [name, noop]; }
  try {
    const mod = await import(url.href);
    return [name, mod.build ?? noop];
  } catch (e) {
    console.error(`part ${name}: ${module} failed to load (${String(e.message).split("\n")[0]}), built as a no-op`);
    return [name, noop];
  }
}

// The ground the parts build on: y 1 stone, dirt up to the surface, grass at the surface. The surface comes from
// heights.json ([z][x] = module y), which the terrain part writes; until it exists the box is left empty.
function layGround(g) {
  const file = here("heights.json");
  if (!existsSync(file)) { console.log("ground: heights.json not written yet, no ground laid"); return; }
  const heights = JSON.parse(readFileSync(file, "utf8"));
  for (let z = 0; z < SIZE[2]; z++) for (let x = 0; x < SIZE[0]; x++) {
    const top = heights[z][x];
    g.set(x, 1, z, STONE);
    for (let y = 2; y < top; y++) g.set(x, y, z, DIRT);
    g.set(x, top, z, GRASS_BLOCK);
  }
  console.log(`ground: laid from heights.json (${SIZE[0]} x ${SIZE[2]})`);
}

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

const g = new Grid(SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });
layGround(g);
const list = [];
for (const [name, module] of PARTS) list.push(await loadPart(name, module));
runParts(g, list, { palette: here("palette.json"), roof: here("roof.json") });
g.save(out);
console.log(`saved ${out}`);
