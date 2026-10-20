import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c.1980s: two storeys over a stone plinth,
// cream tile facade with quartz piers, blue-glass shopfront below and
// punched window bands above, flat deck with cornice, parapet and rooftop units.
const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535173670";
const W = 47, H = 23, D = 27;

const raw = JSON.parse(readFileSync(`${BASE}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? raw.footprint ?? []);
const norm = (c) => (Array.isArray(c) ? c : [c.x, c.z, c.ground]);

const key = (x, z) => x + "," + z;
const G = new Map();
for (const c of list) {
  const [x, z, gr] = norm(c);
  G.set(key(x, z), Math.round(gr));
}
const has = (x, z) => G.has(key(x, z));
const minG = Math.min(...G.values());

// Storey lines, relative to the lowest ground under the footprint.
const yb1 = minG + 5;   // second-floor slab
const deck = minG + 10; // roof deck, cornice on facade
const par = deck + 1;   // parapet top (roof about 11 above lowest ground)

// Entrance: midpoint of the north-facing run of cells.
const northXs = [...G.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => !has(x, z - 1))
  .map(([x]) => x);
const entX = northXs.length
  ? Math.round((Math.min(...northXs) + Math.max(...northXs)) / 2)
  : null;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id) => {
  if (!id || y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  g.set(x, y, z, id);
};

function facade(x, z, y, ground, isEnt) {
  const along = (!has(x, z - 1) || !has(x, z + 1)) ? x : z;
  const pier = ((along % 4) + 4) % 4 === 0;
  const lit = (x * 7 + z * 13 + y * 5) % 9 === 0;

  if (y === ground) return "stone_bricks";        // base course
  if (y === par) return "smooth_quartz";           // parapet
  if (y === deck) return "quartz_bricks";          // cornice
  if (y === yb1) return "quartz_bricks";           // storey line

  if (y < yb1) {                                   // ground storey: shopfront
    if (y === yb1 - 1) return pier ? "quartz_pillar" : "smooth_quartz"; // transom
    if (isEnt && y <= ground + 2) return null;      // doorway opening
    if (pier) return "quartz_pillar";
    if (lit) return "glowstone";
    return "light_blue_stained_glass";
  }

  // upper storey: punched windows
  if (y === deck - 1) return "smooth_quartz";      // sill spandrel
  if (pier) return "quartz_pillar";
  if (lit) return "glowstone";
  return "light_blue_stained_glass_pane";
}

function interior(x, z, y, ground) {
  if (y === ground) return "smooth_stone";
  if (y === yb1 || y === deck) return "smooth_quartz";
  if (y === par && (x * 3 + z * 5) % 11 === 0) return "light_gray_concrete"; // rooftop unit
  return null;
}

for (const [k, ground] of G) {
  const [x, z] = k.split(",").map(Number);
  const boundary = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const isEnt = boundary && x === entX && !has(x, z - 1);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  // Storeys, deck and parapet stand on what is below them.
  for (let y = ground; y <= par; y++) {
    const b = boundary ? facade(x, z, y, ground, isEnt) : interior(x, z, y, ground);
    put(x, y, z, b);
  }
}

g.save(`${BASE}/${ID}.nbt`);
console.log(`built ${ID}: ${G.size} cells, base ${minG}, parapet y=${par}`);
