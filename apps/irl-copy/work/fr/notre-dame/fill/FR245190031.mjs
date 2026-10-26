import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245190031.cells.json", "utf8"));

// Palais de Justice de Paris, 1900, commercial: a Paris-limestone block (calcite) on two 5-block storeys.
// The lidar's 9-10 tops become one flat tier (10); the north row (19-26) is a tall pavilion whose storey lines run up.
// Each tier ends in a dark roof row with a stone parapet on the outer edge. Shop glass sits on the ground floor
// with dark oak piers; the upper floors have window bays of glass on quartz sills. Glass stands in front of an air gap.
const X = 6, Z = 15;
const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { ground, top: roof <= 10 ? 10 : roof });
const at = (x, z) => cell.get(key(x, z));
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// the outward direction of an exposed face at height y (a neighbour that does not hold y), or null
function exposed(x, y, z) {
  for (const [dx, dz] of DIRS) {
    const n = at(x + dx, z + dz);
    if (!n || n.ground > y || n.top <= y) return [dx, dz];
  }
  return null;
}

// the facade block on an exposed face: y is the height, k the position along the face
function facade(y, k) {
  if (y === 0) return { block: "stone_bricks" };                       // plinth
  const yy = y % 5;
  if (y < 5) {                                                         // commercial ground floor
    if (yy === 4) return { block: "smooth_quartz" };                   // shopfront lintel
    if (k % 3 === 0) return { block: "dark_oak_planks" };              // pier
    return { glass: true };
  }
  if (yy === 0 || yy === 4) return { block: "smooth_quartz" };         // string course and lintel
  if (k % 2 === 0) return { block: "calcite" };                        // pier between window bays
  if (yy === 1) return { block: "smooth_quartz" };                     // sill
  return { glass: true };
}

const g = new Voxels([X, 42, Z]);
const glass = [];
for (const [x, z, ground, roof] of cells) {
  const { top } = at(x, z);
  for (let y = 0; y < top; y++) {
    if (y < ground) { g.set(x, y, z, "polished_andesite"); continue; }  // foundation under a sloping cell
    if (y === top - 1) { g.set(x, y, z, "deepslate_tiles"); continue; } // roof row
    const dir = exposed(x, y, z);
    if (!dir) { g.set(x, y, z, "calcite"); continue; }
    const k = dir[0] ? z : x;
    const f = facade(y, k);
    if (f.glass) { g.set(x, y, z, "light_blue_stained_glass"); glass.push({ x, y, z, dir, k }); }
    else g.set(x, y, z, f.block);
  }
  if (x === 0 || x === X - 1 || z === 0 || z === Z - 1) g.set(x, top, z, "stone_brick_wall"); // parapet
}

// an air gap behind each glass, with a glowstone lamp behind some of them
for (const { x, y, z, dir, k } of glass) {
  const px = x - dir[0], pz = z - dir[1];
  const p = at(px, pz);
  if (!p || p.ground > y || p.top <= y) continue;
  g.set(px, y, pz, (k + y) % 4 === 0 ? "glowstone" : "air");
}

// the main entrance on the south front: a double-height dark oak door, with a canopy strip above
const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
g.set(2, 1, 14, "dark_oak_door", door("lower"));
g.set(2, 2, 14, "dark_oak_door", door("upper"));
for (const x of [1, 2, 3]) g.set(x, 3, 14, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// roof equipment: two brick chimney stacks, and lanterns on the interior tiers of the tall pavilion
for (const [x, y, z] of [[2, 10, 6], [2, 11, 6], [4, 10, 10], [4, 11, 10]]) g.set(x, y, z, "bricks");
g.set(1, 19, 1, "lantern");
g.set(4, 21, 1, "lantern");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245190031.nbt");
