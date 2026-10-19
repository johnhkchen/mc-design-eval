// NYC1035390: 9 East 45 Street, 1922, a 12-storey commercial and office block on a 7 x 27 lot.
// The lidar roof is smoothed into four flat tiers (2, 7, 11 and 12 storeys) that step down to the rear, around an open light
// court. Street wall and side walls are buff terra cotta piers and glass, a calcite base, belt courses and cornice, lit windows
// with glowstone behind the glass, a dark oak entrance under a marquee, and a wooden water tower on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 7, D = 27;
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1035390";
const cells = JSON.parse(readFileSync(`${OUT}.cells.json`, "utf8"));

// Lidar roof heights (blocks above y 0) into flat tiers: 12, 11, 7 and 2 storeys of 3 blocks. Roof 0 is open ground (the court, the yards).
const tierOf = (r) => (r <= 0 ? 0 : r >= 34 ? 36 : r >= 26 ? 33 : r >= 15 ? 21 : 6);
const roof = Array.from({ length: W }, () => new Array(D).fill(0));
const ground = Array.from({ length: W }, () => new Array(D).fill(0));
for (const [x, z, g0, r] of cells) { roof[x][z] = tierOf(r); ground[x][z] = g0; }
const R = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : roof[x][z]);

const B = {
  belt: "calcite",                 // base, floor belts, cornice and coping: pale limestone
  body: "white_terracotta",        // buff terra cotta piers and walls
  granite: "polished_granite",     // entrance pilasters and shopfront stall
  glass: "light_blue_stained_glass_pane",
  paving: "smooth_stone",          // court and yards
  roof: "smooth_stone",            // roof covering
  lamp: "glowstone",
};
const PANE_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // on a z face
const PANE_NS = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };   // on an x face
const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];                                                       // +z (street), -z, +x, -x

const g = new Voxels([W, 48, D]);
const lit = (x, y, z) => (x * 7 + y * 3 + z * 5) % 9 === 0;   // about one window in nine glows

function windowAt(x, y, z, [dx, dz]) {
  if (lit(x, y, z)) { const ix = x - dx, iz = z - dz; if (R(ix, iz) > y) g.set(ix, y, iz, B.lamp); }   // glowstone behind the glass
  return { block: B.glass, state: dz ? PANE_EW : PANE_NS };
}

// One exposed wall voxel. Street and rear faces: a pier every other column, glass between. Side and court faces: a window every fourth.
function facade(x, y, z, [dx, dz]) {
  const k = Math.floor(y / 3);
  if (dz !== 0) {
    if (dz === 1 && z === D - 1 && k === 0) {                              // entrance level on the street
      if (x === 3) return { block: "dark_oak_door", state: { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
      if (x === 1 || x === 5) return windowAt(x, y, z, [dx, dz]);          // shopfront glass
      return { block: B.granite };
    }
    return x % 2 === 0 ? { block: B.body } : windowAt(x, y, z, [dx, dz]);
  }
  return z % 4 === 2 ? windowAt(x, y, z, [dx, dz]) : { block: B.body };
}

// What stands at (x, y, z) of a footprint cell with roof r. Air where a storey is open behind the glass.
function wallBlock(x, y, z, r, perim) {
  if (y === r - 1) return { block: perim ? B.belt : B.roof };            // roof slab (coping on the outside)
  if (z === D - 1 && x >= 2 && x <= 4 && y === 3) return { block: "dark_oak_slab", state: { type: "bottom", waterlogged: "false" } };  // marquee over the entrance
  if (perim && y === r - 2) return { block: B.belt };                     // cornice course
  if (y % 3 === 0) return { block: B.belt };                              // storey floor slab (y 0 is the base), spanning the plan
  const faces = DIRS.filter(([dx, dz]) => R(x + dx, z + dz) <= y);        // faces with nothing (or a lower roof) beside them
  return faces.length ? facade(x, y, z, faces[0]) : null;
}

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const r = roof[x][z];
  if (!r) { g.set(x, 0, z, B.paving); continue; }                         // open court and yards: paved ground
  for (let y = 0; y < ground[x][z]; y++) g.set(x, y, z, B.belt);         // foundation up to the ground (0 here)
  const perim = DIRS.some(([dx, dz]) => R(x + dx, z + dz) === 0);        // outside the lot, the court or a yard
  for (let y = 0; y < r; y++) {
    const b = wallBlock(x, y, z, r, perim);
    if (b) g.set(x, y, z, b.block, b.state);
  }
  if (perim) { g.set(x, r, z, B.body); g.set(x, r + 1, z, B.belt); }     // parapet and coping
}

// Lanterns in the court, standing on the paving.
for (const [x, z] of [[2, 12], [4, 12], [2, 19], [4, 19]]) g.set(x, 1, z, "lantern", { hanging: "false" });

// Rooftop water tower on a brick pedestal, in the middle of the 11-storey roof.
for (let x = 2; x <= 4; x++) for (let z = 6; z <= 8; z++) {
  g.set(x, 33, z, "bricks"); g.set(x, 34, z, "bricks");
  for (const y of [35, 36, 37]) g.set(x, y, z, "spruce_planks");
  g.set(x, 38, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
}

const info = g.save(`${OUT}.nbt`);
console.log(`wrote ${OUT}.nbt: ${info.blocks} blocks, ${info.palette} palette entries`);
