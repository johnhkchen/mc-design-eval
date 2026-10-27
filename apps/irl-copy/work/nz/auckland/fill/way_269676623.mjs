import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// way 269676623, Eden Terrace side of Mt Eden: a 1920s two-storey plastered-brick commercial block ("stripped classical"),
// cream render on quartz with pilasters, a dark-oak shopfront and door on the lowest (south) street face, a stone parapet
// and a tar roof with a lift overrun and two plant units. Massing follows the lidar roof tops (3x3 median, so noise becomes
// flat tiers). Every column is solid from y 0 to its top (foundation below its own ground), so nothing floats. Glass sits in
// the outer skin with one air cell behind it; some of those gaps hold a lantern.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269676623.cells.json", "utf8"));
const X = 24, Z = 18, Y = 21;

const G = Array.from({ length: Z }, () => Array(X).fill(-1));     // ground under the cell (-1: outside the footprint)
const R0 = Array.from({ length: Z }, () => Array(X).fill(0));     // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[z][x] = g; R0[z][x] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && G[z][x] >= 0;

// roof tiers: two passes of the 3x3 median of the lidar tops (one pass still leaves shelf-like ledges)
const median3 = (A) => Array.from({ length: Z }, (_, z) => Array.from({ length: X }, (_, x) => {
  if (!inside(x, z)) return 0;
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) v.push(A[z + dz][x + dx]);
  v.sort((a, b) => a - b); return v[(v.length - 1) >> 1];
}));
const R = median3(median3(R0));

const solid = (x, y, z) => inside(x, z) && y >= 0 && y < R[z][x];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

// storey lines, from the cell's own ground g and its roof top: tall cells (height >= 6) get a plinth, two rows of upper
// windows, a band (the storey line), two rows of lower windows, a sill, and the cap; short cells get a plinth, one shop
// row of glass, and the cap
function role(x, z, y) {
  const g = G[z][x], top = R[z][x];
  if (y < g) return "found";
  if (y === g) return "plinth";
  if (y === top - 1) return "cap";
  if (top - g < 6) return "shop";
  const d = top - 1 - y;
  if (d <= 2) return "winU";
  if (d === 3) return "band";
  if (d <= 5) return "winL";
  return d === 6 ? "sill" : "wall";
}

const DOOR = { x: 10, z: 17 };     // the south run at the lowest ground: the street door, facing south
const pier = (u) => u % 3 === 0;   // a pilaster every third cell along a face, windows between
const key = (x, y, z) => `${x},${y},${z}`;
const plan = new Map();            // "x,y,z" -> { block, state } ; null is air (the gap behind glass, the doorway)
const openings = [];

const MAT = {
  found: ["stone_bricks"],
  plinth: ["polished_andesite"],
  cap: ["quartz_slab", { type: "top", waterlogged: "false" }],
  band: ["chiseled_quartz_block"],
  sill: ["polished_andesite_slab", { type: "bottom", waterlogged: "false" }],
};

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inside(x, z)) continue;
  for (let y = 0; y < R[z][x]; y++) {
    const ex = exposed(x, y, z);
    if (!ex.length) { plan.set(key(x, y, z), { block: "stone" }); continue; }   // interior: solid fill, the roof too
    const rl = role(x, z, y);
    const [dx, dz] = ex[0];
    const u = dx !== 0 ? z : x;                       // the cell's place along its face
    const corner = ex.length > 1;
    const glazed = ["winU", "winL", "shop"].includes(rl) && !corner && !pier(u);
    if (glazed) {
      const street = dz === 1 && z === DOOR.z;
      const block = street && rl !== "winU"
        ? { block: "glass" }
        : { block: "glass_pane", state: dx !== 0
          ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
          : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" } };
      plan.set(key(x, y, z), block);
      openings.push({ x, y, z, dx, dz, rl, u });
      continue;
    }
    if (MAT[rl]) { plan.set(key(x, y, z), { block: MAT[rl][0], state: MAT[rl][1] }); continue; }
    plan.set(key(x, y, z), { block: corner || pier(u) ? "quartz_pillar" : "smooth_quartz", state: corner || pier(u) ? { axis: "y" } : undefined });
  }
}

// each opening's gap: the cell behind it, one deep, air; a lantern on the lowest row of some of them
const lowest = new Map();
for (const o of openings) { const k = `${o.x},${o.z}`; lowest.set(k, Math.min(lowest.get(k) ?? 99, o.y)); }
for (const o of openings) {
  const ix = o.x - o.dx, iz = o.z - o.dz;
  if (!inside(ix, iz) || !solid(ix, o.y, iz) || exposed(ix, o.y, iz).length) continue;
  plan.set(key(ix, o.y, iz), null);
  if (o.y === lowest.get(`${o.x},${o.z}`) && (o.u + 3 * o.y + o.z) % 4 === 0) {
    plan.set(key(ix, o.y, iz), { block: "lantern", state: { hanging: "false", waterlogged: "false" } });
  }
}

// the street door (lower and upper half) with its gap behind, and the canopy over it
const door = (y, half) => ({ block: "dark_oak_door", state: { facing: "south", half, hinge: "left", open: "false", powered: "false" } });
plan.set(key(DOOR.x, 1, DOOR.z), door(1, "lower"));
plan.set(key(DOOR.x, 2, DOOR.z), door(2, "upper"));
plan.set(key(DOOR.x, 1, DOOR.z - 1), null);
plan.set(key(DOOR.x, 2, DOOR.z - 1), null);
for (const x of [DOOR.x - 1, DOOR.x, DOOR.x + 1]) plan.set(key(x, 3, DOOR.z), { block: "dark_oak_planks" });

// roof: a lift overrun on the highest tier, and two plant units; each sits on the roof they stand on
const onRoof = (x, z) => inside(x, z) && R[z][x] === 8;
const lift = [[13, 10], [14, 10], [13, 11], [14, 11]];
const plant = [[17, 10], [19, 9]];
if (![...lift, ...plant].every(([x, z]) => onRoof(x, z))) throw new Error("roof equipment off the top tier");
for (const [x, z] of lift) {
  plan.set(key(x, 8, z), { block: "stone_bricks" });
  plan.set(key(x, 9, z), { block: "stone_bricks" });
  plan.set(key(x, 10, z), { block: "stone_brick_slab", state: { type: "bottom", waterlogged: "false" } });
}
for (const [x, z] of plant) plan.set(key(x, 8, z), { block: "iron_block" });

const g = new Voxels([X, Y, Z]);
for (const [k, v] of plan) {
  if (!v) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269676623.nbt";
console.log(g.save(out));
