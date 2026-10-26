// FR245184479: a Haussmann-era residential block on the Latin Quarter bank. Five storeys of pale limestone (a
// rusticated plinth, string courses at each floor, tall windows with iron balconies on the first floor, shopfronts and
// doors at street level), a zinc mansard roof stepping in from the eaves, and lower wings where the lidar drops.
// Massing follows the lidar roof, quantised into three tiers so the walls read as flat courses, not noise.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184479.cells.json`, "utf8"));

const g = new Voxels([32, 40, 50]);

// Materials
const WALL = "calcite", GLASS = "light_gray_stained_glass", STONE = "smooth_stone", BASE = "stone_bricks";
const ROOF = "deepslate_tiles", BRICK = "bricks", IRON = "iron_bars", LAMP = "glowstone", DOOR = "dark_oak_door";

// Storey floor levels above each cell's own ground: a 5-block ground storey, then 4-block upper storeys.
const OFFS = [0, 5, 9, 13, 17, 21];
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

const C = cells.map(([x, z, gr, roof]) => ({ x, z, g: gr, lidar: roof }));
const key = (x, z) => x * 100 + z;                   // z < 100 for this footprint
const idx = new Map(C.map((c) => [key(c.x, c.z), c]));
const at = (x, z) => idx.get(key(x, z));

// Edge distance: 0 on the outside ring, +1 per cell inward (the mansard steps in one block per course)
for (const c of C) c.d = DIRS.some(([dx, dz]) => !at(c.x + dx, c.z + dz)) ? 0 : Infinity;
let frontier = C.filter((c) => c.d === 0);
for (let dd = 1; frontier.length; dd++) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of DIRS) {
    const n = at(c.x + dx, c.z + dz);
    if (n && n.d === Infinity) { n.d = dd; next.push(n); }
  }
  frontier = next;
}

// Lidar roof -> three clean tiers (main 5-storey block, 4-storey wings, 2-3 storey low wings); lower sheds stay raw
const tier = (r) => (r >= 21 ? 24 : r >= 17 ? 19 : r >= 13 ? 14 : r);
for (const c of C) {
  c.R = Math.max(tier(c.lidar), c.g + 1);
  // the highest storey floor that still leaves at least one block of roof above it
  let nst = 0;
  for (let k = 1; k <= 5; k++) if (c.g + OFFS[k] <= c.R - 1) nst = k;
  c.nst = nst;
  c.Wt = c.g + OFFS[nst];                              // eaves / ceiling course
  c.M = c.R - c.Wt;                                    // mansard height (roof top = R)
}

const pierAt = (x, z) => (x + z) % 3 === 0;
// What a street-facing wall cell is at a storey row: lintel, pier, a balcony rail on the first floor, or glass
function facade(c, k, r, p) {
  if (r === p - 1) return WALL;
  if (pierAt(c.x, c.z)) return WALL;
  if (k === 1 && r === 1) return IRON;
  return GLASS;
}

// 1. Foundation from y 0 up to each cell's ground, then the floor slabs at every storey line
for (const c of C) {
  for (let y = 0; y < c.g; y++) g.set(c.x, y, c.z, BASE);
  for (let k = 0; k <= c.nst; k++) {
    const y = c.g + OFFS[k];
    g.set(c.x, y, c.z, k === 0 && c.d === 0 ? BASE : STONE);
  }
}

// 2. Masonry: a solid core two cells in from the street carries the floors; the street wall is one block thick
// with glass in its window zone and a one-block air gap behind it (the only interior), so every slab and lintel
// rests on the core or the wall beside it. Lintel rows at the gap's edge are solid, cantilevered off that core.
const doorCands = [];
for (const c of C) {
  if (c.d >= 2) for (let y = c.g; y < c.Wt; y++) g.set(c.x, y, c.z, BASE);
  if (c.d === 1) for (let k = 0; k < c.nst; k++) g.set(c.x, c.g + OFFS[k + 1] - 1, c.z, WALL);
}
for (const c of C) {
  if (c.d !== 0) continue;
  for (let k = 0; k < c.nst; k++) {
    const lo = c.g + OFFS[k], p = OFFS[k + 1] - OFFS[k];
    for (let r = 1; r < p; r++) {
      const block = facade(c, k, r, p);
      g.set(c.x, lo + r, c.z, block);
      // warm light: a lamp on the floor just inside some of the glass
      if (block === GLASS && r === 1 && (c.x * 7 + c.z * 3 + k * 5) % 9 === 0) {
        const inner = DIRS.map(([dx, dz]) => at(c.x + dx, c.z + dz)).find((n) => n && n.d === 1);
        if (inner) g.set(inner.x, lo + 1, inner.z, LAMP);
      }
    }
  }
  if (c.nst >= 1 && !pierAt(c.x, c.z)) doorCands.push(c);
}

// 3. Entrances: up to eight doors on the ground storey, facing out, on the street ring
const want = Math.min(8, doorCands.length);
const step = Math.max(1, Math.floor(doorCands.length / Math.max(want, 1)));
for (let i = 0; i < doorCands.length && i / step < want; i += step) {
  const c = doorCands[i];
  const [, , out] = DIRS.find(([dx, dz]) => !at(c.x + dx, c.z + dz)) ?? [0, 0, "south"];
  const state = (half) => ({ facing: out, half, hinge: "left", open: "false", powered: "false" });
  g.set(c.x, c.g + 1, c.z, DOOR, state("lower"));
  g.set(c.x, c.g + 2, c.z, DOOR, state("upper"));
}

// 4. Roof: a cornice course at the eaves, then the mansard stepping in one block per course to the flat top at R
for (const c of C) {
  const wt = c.Wt, t = Math.max(1, Math.min(c.d, c.M));
  for (let j = 0; j < t; j++) g.set(c.x, wt + j, c.z, j === 0 ? STONE : ROOF);
}
// Flat-top chimney stacks, standing on the roof they rise from
for (const c of C) {
  if (c.d >= c.M && c.x % 10 === 5 && c.z % 10 === 5) {
    g.set(c.x, c.R, c.z, BRICK); g.set(c.x, c.R + 1, c.z, BRICK);
  }
}

// Self-check: nothing floats. A block above y 0 rests on a block below it, or cantilevers from a solid neighbour
// at its own height (a lintel or a slab's edge on the wall beside it)
let unsupported = 0, blocks = 0, cantilevered = 0;
for (let y = 0; y < 40; y++) for (let z = 0; z < 50; z++) for (let x = 0; x < 32; x++) {
  if (!g.get(x, y, z)) continue;
  blocks++;
  if (y === 0 || g.get(x, y - 1, z)) continue;
  if (DIRS.some(([dx, dz]) => g.get(x + dx, y, z + dz))) cantilevered++;
  else unsupported++;
}
const { blocks: written, palette } = g.save(`${DIR}/FR245184479.nbt`);
console.log(JSON.stringify({ footprint: C.length, blocks, unsupported, cantilevered, written, palette }));
