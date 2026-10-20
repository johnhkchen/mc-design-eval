import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1001279.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1001279.nbt";

const W = 19, H = 32, D = 15;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inF = new Set(cells.map((c) => key(c[0], c[1])));
const has = (x, z) => inF.has(key(x, z));

// Raw lidar values per cell
const raw = new Map();
for (const c of cells) raw.set(key(c[0], c[1]), { x: c[0], z: c[1], g: Math.round(c[2]), r: c[3] });

// Smooth roof over the 3x3 neighbourhood inside the footprint
const smoothed = new Map();
for (const [k, c] of raw) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const nk = key(c.x + dx, c.z + dz);
    if (raw.has(nk)) { sum += raw.get(nk).r; n++; }
  }
  smoothed.set(k, sum / n);
}

// Common roof tier: median of smoothed values, cells near it snap to it
const sortedR = [...smoothed.values()].map((v) => Math.round(v)).sort((a, b) => a - b);
const medRoof = sortedR[Math.floor(sortedR.length / 2)];

const info = new Map();
for (const [k, c] of raw) {
  const gr = Math.max(0, Math.min(H - 8, c.g));
  let r = Math.round(smoothed.get(k));
  if (Math.abs(r - medRoof) <= 2) r = medRoof;
  r = Math.max(gr + 4, Math.min(30, r));
  info.set(k, { x: c.x, z: c.z, g: gr, r });
}

const BARS = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const LANTERN = { hanging: "true", waterlogged: "false" };

function put(x, y, z, block, props) {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

for (const { x, z, g: gr, r } of info.values()) {
  const xEdge = !has(x - 1, z) || !has(x + 1, z);
  const zEdge = !has(x, z - 1) || !has(x, z + 1);
  const perim = xEdge || zEdge;
  const pier =
    ((!has(x - 1, z) || !has(x + 1, z)) && z % 3 === 0) ||
    ((!has(x, z - 1) || !has(x, z + 1)) && x % 3 === 0);
  // Entrance on the street face (z-min), centred between piers at x=6 and x=9
  const entrance = perim && !pier && !has(x, z - 1) && (x === 7 || x === 8);
  const surround = perim && !pier && !has(x, z - 1) && x === 6 ? false : false;
  const bulk = !perim && x >= 6 && x <= 8 && z >= 5 && z <= 7;

  // Foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");

  const b = gr + 1;

  // Interior floor slabs (no interiors, only slabs)
  if (!perim) {
    for (let y = b; y < r - 1; y += 2) put(x, y, z, "light_gray_concrete");
  }

  if (perim) {
    for (let y = b; y <= r - 3; y++) {
      const rel = y - b;
      if (pier) {
        put(x, y, z, "white_concrete");
      } else if (entrance) {
        // Recessed doorway: clear opening, lantern, stone lintel over it
        if (rel === 0) continue;
        if (rel === 1) { put(x, y, z, "lantern", LANTERN); continue; }
        if (rel === 2) { put(x, y, z, "polished_andesite"); continue; }
        if (rel === 3) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
        put(x, y, z, rel % 2 === 1 ? "light_gray_concrete" : "iron_bars", rel % 2 === 1 ? undefined : BARS);
      } else if (rel === 0) {
        put(x, y, z, "stone_bricks");
      } else if (rel <= 2) {
        if (rel === 1 && (x + z) % 9 === 0) put(x, y, z, "glowstone");
        else put(x, y, z, "iron_bars", BARS);
      } else if (rel % 2 === 1) {
        put(x, y, z, "light_gray_concrete");
      } else {
        if ((x + z + rel) % 9 === 0) put(x, y, z, "glowstone");
        else put(x, y, z, "iron_bars", BARS);
      }
    }
    if (r - 2 >= b) put(x, r - 2, z, "white_concrete");
    put(x, r - 1, z, "smooth_stone");
  } else {
    put(x, r - 1, z, "gray_concrete");
    if (bulk) {
      put(x, r, z, "light_gray_concrete");
      put(x, r + 1, z, "light_gray_concrete");
      if (x === 7 && z === 6) put(x, r + 1, z, "lantern", LANTERN);
    }
  }
}

g.save(OUT);
