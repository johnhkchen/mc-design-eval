// Cross Street Arcade (way 162091760), Auckland. A 1920s-30s brick commercial block: a red-brick body
// with cream plaster string courses and an Art Deco black-and-cream shopfront on the east (street) face,
// a 4-block storey rhythm counted up from each cell's own ground, a stepped west tower on the lidar spine,
// and a lower east wing. The core is solid; only the glass has air behind it (pockets), and every storey
// course is a solid slab, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162091760.cells.json`, "utf8"));
const g = new Voxels([19, 48, 74]);

const cell = new Map();
for (const [x, z, gr, r0] of cells) cell.set(`${x},${z}`, { x, z, gr, r0 });
const inF = (x, z) => cell.has(`${x},${z}`);

// Lidar roof -> clean tiers. The main body sits on 19; cells at 27-33 are the west tower with a setback;
// the SW corner rises to 36; the 1-wide west edge strip (lidar edge noise) drops to the body; 14-17 is the lower east wing.
// A lone tall cell is lidar noise or a stray chimney, not a tower: a tall cell keeps its height only when at
// least 5 of its 8 neighbours are tall too (the solid core of a mass), otherwise it steps down to the body.
const tall = (x, z) => (cell.get(`${x},${z}`)?.r0 ?? 0) >= 27;
const tallNeighbours = (x, z) => {
  let n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if ((dx || dz) && tall(x + dx, z + dz)) n++;
  return n;
};
function tierOf({ x, z, gr, r0 }) {
  let r;
  const mass = tall(x, z) && tallNeighbours(x, z) >= 5;
  if (r0 >= 32 && mass) r = x <= 2 && z >= 30 ? 36 : 33;
  else if (r0 >= 27 && mass) r = 27;
  else if (r0 >= 14 && r0 <= 17) r = 15;
  else if (r0 < 14) r = gr + 4;
  else r = 19;
  return Math.max(r, gr + 4);
}

const normals = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outward = (x, z) => normals.find(([dx, dz]) => !inF(x + dx, z + dz)) ?? null;

// The east face is the street: shopfront on the ground band. Its entrance sits nearest z 37.
const doorAlong = 37;
let door = null;
for (const c of cell.values()) {
  const n = outward(c.x, c.z);
  if (n && n[0] === 1 && (!door || Math.abs(c.z - doorAlong) < Math.abs(door.z - doorAlong))) door = c;
}

const PANE = "pane";
// What a ring cell's face holds at height rel above its own ground: string courses, cornice and coping,
// piers, panes. Returns [block, state] or a PANE marker for window glass.
function faceAt(c, n, y, rel, r) {
  if (y === r - 1) return ["stone_brick_slab", { type: "top" }];
  if (y === r - 2) return ["smooth_quartz"];
  const along = n[0] !== 0 ? c.z : c.x;
  const street = n[0] === 1;
  if (rel === 0) return ["polished_blackstone"];
  if (rel < 4) {
    if (rel === 3) return ["smooth_quartz"];
    if (street && along % 3 === 0) return ["polished_blackstone"];
    if (!street && along % 3 === 0) return ["bricks"];
    return PANE;
  }
  if (rel % 4 === 0) return ["smooth_quartz"];
  if (along % 3 === 0) return ["bricks"];
  return PANE;
}

const paneState = (n) => (n[0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false" }
  : { north: "false", south: "false", east: "true", west: "true" });

const pockets = []; // [x, y, z, glow]
for (const c of cell.values()) {
  const { x, z, gr } = c;
  const r = tierOf(c);
  c.r = r;
  const n = outward(x, z);
  for (let y = 0; y < r; y++) {
    if (y < gr) { g.set(x, y, z, "stone"); continue; }
    const rel = y - gr;
    if (!n) {
      g.set(x, y, z, y === r - 1 ? "smooth_stone" : "stone");
      continue;
    }
    const f = faceAt(c, n, y, rel, r);
    if (f === PANE) {
      g.set(x, y, z, "glass_pane", paneState(n));
      const ix = x - n[0], iz = z - n[1];
      const inner = cell.get(`${ix},${iz}`);
      if (inner && inF(ix - n[0], iz - n[1]) && y >= inner.gr) {
        const along = n[0] !== 0 ? z : x;
        const k = Math.floor(rel / 4);
        pockets.push([ix, y, iz, (along + k) % 5 === 0 && rel % 4 === 1]);
      }
    } else if (f[1]) g.set(x, y, z, f[0], f[1]);
    else g.set(x, y, z, f[0]);
  }
}

// Air behind each pane (a window pocket) and warm light in some of them.
for (const [x, y, z, glow] of pockets) g.set(x, y, z, glow ? "glowstone" : "air");

// Entrance: a recessed door in the east face, with an air vestibule behind it and a canopy slab over it.
if (door) {
  const n = [1, 0];
  const ix = door.x - 1, iz = door.z;
  for (let rel = 0; rel <= 2; rel++) g.set(ix, door.gr + rel, iz, "air");
  g.set(door.x, door.gr, door.z, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(door.x, door.gr + 1, door.z, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dz of [-1, 0, 1]) {
    const c = cell.get(`${door.x},${door.z + dz}`);
    if (c) g.set(door.x, c.gr + 2, c.z, "polished_blackstone_slab", { type: "bottom" });
  }
}

// Roof plant: small stone boxes on the body's flat roof, clear of the parapet.
for (const c of cell.values()) {
  if (c.r !== 19 || outward(c.x, c.z)) continue;
  if (c.x % 6 === 3 && c.z % 8 === 4) { g.set(c.x, c.r, c.z, "stone_bricks"); g.set(c.x, c.r + 1, c.z, "stone_bricks"); }
}

// Sanity: nothing floats (every solid block has something solid under it or beside it, above the ground).
let floating = 0;
for (const c of cell.values()) {
  for (let y = 1; y < c.r + 2 && y < 48; y++) {
    if (!g.get(c.x, y, c.z)) continue;
    const below = g.get(c.x, y - 1, c.z);
    const side = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => g.get(c.x + dx, y, c.z + dz));
    if (!below && !side) floating++;
  }
}
console.log(`tiers: ${[...new Set([...cell.values()].map((c) => c.r))].sort((a, b) => a - b)}; pockets ${pockets.length}; floating ${floating}`);

const out = g.save(`${DIR}/way_162091760.nbt`);
console.log(`saved ${out.blocks} blocks, palette ${out.palette}`);
