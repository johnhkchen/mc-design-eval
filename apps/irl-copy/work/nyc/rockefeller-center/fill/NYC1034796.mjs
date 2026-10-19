// 13 West 54th Street (NYC1034796): an 1897 Renaissance Revival commercial building, built in red brick with buff
// stone trim: a stone base, a shopfront with a recessed door on the street (z 16) face, six storeys of windows over it,
// a stone cornice and a parapet. The lidar gives two tiers: the street half at 19 blocks (six storeys) and the rear half
// at 22 (seven). Roof heights are a 5x5 median of the lidar cells snapped to storey tops (3k+1), so the noise on the
// east edge reads as one tier. Shell only: a floor slab per storey across the footprint, air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1034796.cells.json", "utf8"));
const X = 7, Z = 17, H = 35;
const lidar = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const median = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const roofTop = (x, z) => {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const r = lidar.get(`${x + dx},${z + dz}`); if (r !== undefined) v.push(r); }
  return Math.round((median(v) - 1) / 3) * 3 + 1;                        // 19 = six storeys, 22 = seven
};

const ring = (x, z) => x === 0 || x === X - 1 || z === 0 || z === Z - 1;
const corner = (x, z) => (x === 0 || x === X - 1) && (z === 0 || z === Z - 1);
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // runs along x: street and rear faces
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // runs along z: side walls
const door = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

const g = new Voxels([X, H, Z]);

// A storey row (1 or 2 above a floor line) on a ring cell: the face's articulation.
function facade(x, y, z) {
  const ground = y < 3;
  if (corner(x, z)) return g.set(x, y, z, y % 2 ? "stone_bricks" : "smooth_sandstone");   // quoins
  if (z === Z - 1) {                                                                         // street face
    if (ground) {
      if (x === 1) return g.set(x, y, z, "dark_oak_door", door("south", y === 1 ? "lower" : "upper"));
      if (x === 3) return g.set(x, y, z, "dark_oak_planks");                                  // shopfront mullion
      if (x === 0 || x === X - 1) return g.set(x, y, z, "stone_bricks");
      return g.set(x, y, z, "glass_pane", PANE_EW);                                           // shopfront glass
    }
    if (x === 3) return g.set(x, y, z, "bricks");
    return g.set(x, y, z, "glass_pane", PANE_EW);                                             // paired windows
  }
  if (z === 0) {                                                                              // rear face
    if (ground) {
      if (x === 3) return g.set(x, y, z, "dark_oak_door", door("north", y === 1 ? "lower" : "upper"));
      return g.set(x, y, z, "bricks");
    }
    if (x === 3) return g.set(x, y, z, "bricks");
    return g.set(x, y, z, "glass_pane", PANE_EW);
  }
  // side walls (party walls in the street, visible from the air): windows every other block, brick between
  if (ground || z % 2 || z < 2 || z > 14) return g.set(x, y, z, ground ? "stone_bricks" : "bricks");
  return g.set(x, y, z, "glass_pane", PANE_NS);
}

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const deck = roofTop(x, z) - 1;                                              // the roof's top slab
  for (let y = 0; y <= deck; y++) {
    if (y % 3 === 0) {                                                         // a floor line (y 0 is the ground floor's base)
      if (y === 0) g.set(x, y, z, ring(x, z) ? "stone_bricks" : "smooth_stone");
      else if (y === deck) g.set(x, y, z, ring(x, z) ? "smooth_sandstone" : "polished_andesite");   // cornice / roof surface
      else g.set(x, y, z, ring(x, z) ? "smooth_sandstone" : "smooth_stone");   // string course / floor slab
      continue;
    }
    if (ring(x, z)) facade(x, y, z);                                           // air behind the glass otherwise
  }
  if (ring(x, z)) g.set(x, deck + 1, z, "stone_bricks");                       // parapet
}

// Warm light: a lantern inside each shopfront bay, glowstone behind a few upper windows, lanterns hung by the door.
g.set(2, 1, 15, "lantern", { hanging: "false", waterlogged: "false" });
g.set(4, 1, 15, "lantern", { hanging: "false", waterlogged: "false" });
g.set(2, 4, 15, "glowstone"); g.set(4, 10, 15, "glowstone"); g.set(5, 16, 15, "glowstone");
g.set(0, 2, 16, "lantern", { hanging: "true", waterlogged: "false" });
g.set(6, 2, 16, "lantern", { hanging: "true", waterlogged: "false" });

// Canopy over the door and shop bay: a dark band on the string course, hung between the stone quoins.
g.set(1, 3, 16, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
g.set(2, 3, 16, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// Rear roof: a brick stair-tower / bulkhead on the seven-storey tier, capped in stone.
for (let z = 3; z <= 5; z++) for (let x = 2; x <= 4; x++) {
  const deck = roofTop(x, z) - 1;
  if (deck !== 21) continue;
  g.set(x, 22, z, "bricks"); g.set(x, 23, z, "bricks");
  g.set(x, 24, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1034796.nbt");
