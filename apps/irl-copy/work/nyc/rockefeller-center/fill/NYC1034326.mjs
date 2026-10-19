// 21 West 46th Street, 1929: a stepped Midtown office block of brick on a granite base, with limestone (calcite) belt
// courses at every storey line, calcite corner piers, a shopfront with a centred dark-oak entrance under a canopy on the
// street face (z 0), glass-and-brick window bays, glowstone behind some windows, and a stair bulkhead, a water tank and
// a parapet on the roof. The lidar roof is smoothed (3 x 3 mean) and quantised to tiers; every column is solid from y 0
// up to its tier, so each storey and setback stands on the one below. Interiors are air behind the glass with a floor
// slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034326.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 19, Y = 70, Z = 26;
const TIERS = [6, 18, 27, 33, 39, 45, 51, 57];   // roof tiers in blocks: 2, 6, 9, 11, 13, 15, 17, 19 storeys
const SOLID = new Set(["bricks", "calcite", "polished_granite", "stone_bricks", "smooth_stone", "glass_pane", "dark_oak_slab", "iron_block", "spruce_planks"]);

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const roof = new Map();
for (const [x, z] of cells) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const r = raw.get(key(x + dx, z + dz)); if (r !== undefined) { sum += r; n++; }
  }
  const m = sum / n;
  roof.set(key(x, z), TIERS.reduce((best, t) => (Math.abs(t - m) < Math.abs(best - m) ? t : best)));
}
const H = (x, z) => roof.get(key(x, z));   // undefined off the footprint
// A neighbour is open at height y when it is off the footprint or its roof is at or below y: then this cell's side is a facade.
const open = (x, z, y) => { const h = H(x, z); return h === undefined || h <= y; };
const LIT = (x, y, z) => (x * 31 + z * 17 + y * 7) % 6 === 0;

const g = new Voxels([X, Y, Z]);
const name = (x, y, z) => g.get(x, y, z)?.block.replace("minecraft:", "");

// Massing and facade: solid columns, floor slabs at every storey line (y = 3k), roof slab on top, walls where a side is open.
for (const [x, z] of cells) {
  const hh = H(x, z);
  for (let y = 0; y < hh; y++) {
    const nX = open(x - 1, z, y) || open(x + 1, z, y);   // face normal along x: the wall runs along z
    const nZ = open(x, z - 1, y) || open(x, z + 1, y);   // face normal along z: the wall runs along x
    const wall = nX || nZ;
    if (y === 0) g.set(x, y, z, wall ? "polished_granite" : "smooth_stone");
    else if (y === hh - 1) g.set(x, y, z, wall ? "stone_bricks" : "smooth_stone");
    else if (!wall) { if (y % 3 === 0) g.set(x, y, z, "smooth_stone"); }
    else if (nX && nZ) g.set(x, y, z, "calcite");
    else if (y % 3 === 0) g.set(x, y, z, "calcite");
    else {
      const pier = (nZ ? x : z) % 3 === 0;   // bays of two panes between one-block brick piers
      if (y < 3) g.set(x, y, z, pier ? "polished_granite" : "glass_pane");   // shopfront
      else g.set(x, y, z, pier ? "bricks" : "glass_pane");
    }
  }
}

// Parapet course on the exposed top edge of each tier.
for (const [x, z] of cells) {
  const hh = H(x, z);
  if (open(x - 1, z, hh - 1) || open(x + 1, z, hh - 1) || open(x, z - 1, hh - 1) || open(x, z + 1, hh - 1))
    g.set(x, hh, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance on the street face: a centred pair of dark-oak doors between granite jambs, lanterns hung under a canopy.
for (const x of [7, 10]) {
  g.set(x, 1, 0, "polished_granite");
  g.set(x, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
}
g.set(8, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(8, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(9, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(9, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
for (let x = 7; x <= 10; x++) g.set(x, 3, 0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// Warm light: glowstone just inside some upper-storey panes (the single row between the sill and the head).
for (const [x, z] of cells) {
  const hh = H(x, z);
  for (let y = 4; y < hh - 1; y += 3) {
    if (name(x, y, z) !== "glass_pane" || !LIT(x, y, z)) continue;
    let dx = 0, dz = 0;
    if (open(x - 1, z, y)) dx = 1; else if (open(x + 1, z, y)) dx = -1;
    else if (open(x, z - 1, y)) dz = 1; else if (open(x, z + 1, y)) dz = -1;
    const ix = x + dx, iz = z + dz;
    if (H(ix, iz) !== undefined && H(ix, iz) > y + 1 && !g.get(ix, y, iz)) g.set(ix, y, iz, "glowstone");
  }
}

// Roof plant: a stair bulkhead on the crown tier (a solid box with a window band), and a water tank on the 51 tier.
const crown = H(8, 11);
for (let x = 7; x <= 10; x++) for (let z = 10; z <= 12; z++) {
  if (H(x, z) !== crown) continue;
  const edge = x === 7 || x === 10 || z === 10 || z === 12;
  for (let y = crown; y < crown + 3; y++) {
    if (y === crown + 1 && edge) g.set(x, y, z, "glass_pane");
    else g.set(x, y, z, "stone_bricks");
  }
}
const tank = H(14, 15);
for (let x = 14; x <= 15; x++) for (let z = 15; z <= 16; z++) {
  if (H(x, z) !== tank) continue;
  for (let y = tank; y < tank + 3; y++) g.set(x, y, z, "spruce_planks");
}

// Glass panes connect to the solid blocks around them, as they would when placed by a player.
for (let x = 0; x < X; x++) for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) {
  if (name(x, y, z) !== "glass_pane") continue;
  const side = (sx, sz) => SOLID.has(name(sx, y, sz) ?? "");
  g.set(x, y, z, "glass_pane", {
    north: side(x, z - 1) ? "true" : "false", south: side(x, z + 1) ? "true" : "false",
    east: side(x + 1, z) ? "true" : "false", west: side(x - 1, z) ? "true" : "false", waterlogged: "false",
  });
}

const saved = g.save(`${DIR}/NYC1034326.nbt`);
console.log(`NYC1034326.nbt: ${saved.blocks} blocks, ${saved.palette} palette entries`);
