// DC58696: a 1930s Federal-style limestone office block, 10th St NW. Stone shell over a solid core (no interiors): each
// window sits in the outer skin with a one-cell air gap behind it, and a few gaps hold a warm light. Massing follows the
// lidar roof in three clean tiers (outer 18, ring 19, core 20 above y 0), with the setbacks stepping in as it rises.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC58696.cells.json`, "utf8"));

const W = 27, D = 17, H = 32;
const key = (x, z) => `${x},${z}`;
const fp = new Map();                                    // "x,z" -> { g, r }
for (const [x, z, g, r] of cells) fp.set(key(x, z), { g, r });
const has = (x, z) => fp.has(key(x, z));

// tiers: the lidar roof clamped to the three tiers, then one smoothing pass so isolated 19s join the core and
// isolated 20s drop into the ring. Tb is the top solid row of a cell (roof row).
const R = new Map();
for (const [x, z, , r] of cells) R.set(key(x, z), Math.max(18, Math.min(20, r)));
const smooth = new Map(R);
for (const [x, z] of cells) {
  const r = R.get(key(x, z));
  const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => R.get(key(x + dx, z + dz))).filter((v) => v !== undefined);
  if (r === 19 && nb.filter((v) => v === 20).length >= 3) smooth.set(key(x, z), 20);
  if (r === 20 && nb.filter((v) => v === 18).length >= 3) smooth.set(key(x, z), 19);
}
const tb = (x, z) => smooth.get(key(x, z)) - 1;          // 17 outer, 18 ring, 19 core

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the outward directions a wall cell at height y faces: outside the footprint, or above the neighbour's roof
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz) || tb(x + dx, z + dz) < y);

// storey string courses: plinth at 1, then every three blocks; a sixth floor only where the roof is 18 or higher
const floorRow = (y, top) => y === 1 || (y % 3 === 1 && y < top && (y < 16 || top >= 18));

const g = new Voxels([W, H, D]);
const gaps = [];                                          // air cells behind glass, to carve (and light) after the shell

const paneState = (dx) => (dx !== 0 ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });

for (const [x, z] of cells) {
  const top = tb(x, z);
  g.set(x, 0, z, "polished_granite");                    // foundation and base, solid from y 0
  for (let y = 1; y <= top; y++) {
    const E = exposed(x, z, y);
    if (!E.length) {
      g.set(x, y, z, y === top ? "smooth_stone" : "stone");   // roof surface, or core hidden behind the skin
      continue;
    }
    if (E.length === 2) { g.set(x, y, z, y === top ? "smooth_quartz" : "quartz_pillar", y === top ? undefined : { axis: "y" }); continue; }
    if (y === 1) { g.set(x, y, z, "polished_granite"); continue; }
    if (y === top || floorRow(y, top)) { g.set(x, y, z, "smooth_quartz"); continue; }
    const [dx, dz] = E[0];
    const idx = dz !== 0 ? x : z;                        // position along the face
    if ((idx - 1) % 3 === 0) { g.set(x, y, z, "quartz_pillar", { axis: "y" }); continue; }   // frame mullion
    g.set(x, y, z, "glass_pane", paneState(dx));
    const ix = x - dx, iz = z - dz;                       // the cell behind the pane: carved to air (the gap)
    if (has(ix, iz) && !exposed(ix, iz, y).length) gaps.push([ix, y, iz, (x * 7 + y * 5 + z * 3) % 27]);
  }
  // parapet and cap on the outer edge
  if (exposed(x, z, top + 1).some(([dx, dz]) => !has(x + dx, z + dz))) {
    g.set(x, top + 1, z, "calcite");
    g.set(x, top + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// the air gaps behind the glass; a few hold a warm light (glowstone, shroomlight)
for (const [x, y, z, k] of gaps) {
  if (y >= 5 && k === 0) g.set(x, y, z, "glowstone");
  else if (y >= 5 && k === 13) g.set(x, y, z, "shroomlight");
  else g.set(x, y, z, "air");
}

// entrance on the street (south, z 16) face, at the middle: a recessed bay under a granite canopy, with a pair of iron
// doors and two hanging lanterns; granite pilasters flank the doors.
const FZ = D - 1, IZ = D - 2;
for (let x = 11; x <= 14; x++) {
  g.set(x, 2, FZ, "air"); g.set(x, 3, FZ, "air");
  g.set(x, 4, FZ, "polished_granite");                   // canopy over the bay
  g.set(x, 2, IZ, "polished_granite"); g.set(x, 3, IZ, "polished_granite");
}
for (let x = 10; x <= 15; x++) g.set(x, 4, FZ, "polished_granite");
for (const y of [2, 3]) {
  g.set(12, y, IZ, "iron_door", { facing: "south", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
  g.set(13, y, IZ, "iron_door", { facing: "south", half: y === 2 ? "lower" : "upper", hinge: "right", open: "false", powered: "false" });
}
g.set(12, 3, FZ, "lantern", { hanging: "true", waterlogged: "false" });
g.set(13, 3, FZ, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant: boxes on the core roof (y 19) and a smaller one on the ring (y 18), set in from the edges
const plant = (x0, x1, z0, z1, base) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!has(x, z) || tb(x, z) !== base) return false;
  }
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    g.set(x, base + 1, z, "stone_bricks");
    g.set(x, base + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
  return true;
};
plant(6, 9, 5, 6, 19);
plant(16, 19, 4, 5, 19);
plant(10, 13, 9, 10, 19);
plant(1, 2, 9, 10, 18);

const out = `${DIR}/DC58696.nbt`;
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries, ${gaps.length} window gaps`);
