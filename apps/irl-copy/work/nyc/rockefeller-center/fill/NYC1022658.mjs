// 138 West 46th Street, 1924: a red-brick mixed-use block. A five-storey residential tower (lidar roof 14-16 -> 16 blocks)
// stands behind a two-storey commercial front wing (lidar roof 6) on the south end of the west (street) face. Limestone
// belts and cornice, granite plinth, glass bays, a striped shop awning and a door, tar roof with a bulkhead, chimney, tank.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022658.cells.json`, "utf8"));

// Lidar roofs as two flat massings: 10+ is the tower (top course at y 15, roof 16), the rest the wing (top at y 5, roof 6).
const TOWER = 15, WING = 5, SMOOTH = 10;
const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { g: ground, T: roof >= SMOOTH ? TOWER : WING }]));

const BRICK = "bricks", PLINTH = "polished_granite", LIMESTONE = "smooth_sandstone", SLAB = "smooth_stone", TAR = "gray_concrete";
const GLASS_Z = { north: "true", south: "true", east: "false", west: "false" };   // a pane wall running along z
const GLASS_X = { north: "false", south: "false", east: "true", west: "true" };   // a pane wall running along x
const glass = (state) => ["glass_pane", state];
const door = (facing, half) => ["oak_door", { facing, half, hinge: "left", open: "false", powered: "false" }];

// Outer ring only: a 1-block skin around an air gap. The tower's south face (z 17, x 1-2) closes it against the wing roof.
const ring = (x, z) => x === 0 || x === 3 || z === 0 || z === 22 || (z === 17 && (x === 1 || x === 2));

// The skin of one ring cell at height y: [block, state?].
function skin(x, z, y, { g, T }) {
  if (y < g) return [PLINTH];                              // foundation under the downhill cells
  if (y === T) return [LIMESTONE];                         // cornice / parapet cap
  if (y === 0) return [PLINTH];

  if (T === TOWER) {
    const face = x === 0 ? "W" : x === 3 ? "E" : z === 0 ? "N" : "T";
    if (y === g) return [PLINTH];                          // base course
    if (y % 3 === 0) return [LIMESTONE];                   // storey belts at 3, 6, 9, 12
    if (face === "W") return z % 3 !== 0 ? glass(GLASS_Z) : [BRICK];   // piers every third block
    if (face === "E") return z % 3 === 2 ? glass(GLASS_Z) : [BRICK];   // party wall, a few light-court windows
    return glass(GLASS_X);                                 // north face and the tower's south face: all bays
  }

  // The wing: shopfront at 1-2, striped awning at 3, second-floor windows at 4.
  if (x === 0) {                                           // west, the street front
    if (y <= 2) return z === 20 ? door("west", y === 1 ? "lower" : "upper") : z === 19 || z === 21 ? glass(GLASS_Z) : [PLINTH];
    if (y === 3) return z >= 19 && z <= 21 ? [z === 20 ? "white_wool" : "red_wool"] : [LIMESTONE];
    return z >= 19 && z <= 21 ? glass(GLASS_Z) : [BRICK];
  }
  if (x === 3) {                                           // east, the party wall
    if (y <= 2) return [BRICK];
    if (y === 3) return [LIMESTONE];
    return z >= 19 && z <= 21 ? glass(GLASS_Z) : [BRICK];
  }
  // z 22: the south front of the wing (x 1-2; the corners belong to the west and east faces)
  if (y <= 2) return x === 1 ? glass(GLASS_X) : door("south", y === 1 ? "lower" : "upper");
  if (y === 3) return [x === 1 ? "red_wool" : "white_wool"];
  return glass(GLASS_X);
}

const vox = new Voxels([4, 28, 23]);

for (let z = 0; z < 23; z++) for (let x = 0; x < 4; x++) {
  const c = at.get(`${x},${z}`);
  if (!c) continue;
  if (ring(x, z)) {
    for (let y = 0; y <= c.T; y++) {
      const [block, state] = y < c.g ? [PLINTH] : skin(x, z, y, c);
      vox.set(x, y, z, block, state);
    }
    continue;
  }
  // Inside: no rooms, only the floor slabs and the roof deck (an air gap behind the glass).
  vox.set(x, 0, z, SLAB);
  for (const y of [3, 6, 9, 12]) if (y <= c.T) vox.set(x, y, z, SLAB);
  vox.set(x, c.T, z, c.T === TOWER ? TAR : SLAB);
}

// Warm light behind some glass: the west tower's middle bays on floors 2 and 4, two bays on the north face, the shopfront.
for (let z = 1; z <= 16; z += 3) for (const f of [1, 3]) for (const y of [3 * f + 1, 3 * f + 2]) vox.set(1, y, z, "glowstone");
for (const y of [7, 8]) for (const x of [1, 2]) vox.set(x, y, 1, "shroomlight");
vox.set(1, 1, 19, "glowstone");
vox.set(1, 2, 19, "glowstone");
vox.set(1, 2, 20, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant on the tower deck (y 15): a bulkhead, a chimney, and a water tank on an iron frame.
for (let z = 3; z <= 8; z++) for (const x of [1, 2]) { vox.set(x, 16, z, BRICK); vox.set(x, 17, z, LIMESTONE); }
for (let y = 16; y <= 18; y++) vox.set(1, y, 14, y === 18 ? LIMESTONE : BRICK);
for (const x of [1, 2]) for (const z of [11, 12]) {
  for (const y of [16, 17]) vox.set(x, y, z, "iron_bars");
  for (const y of [18, 19, 20]) vox.set(x, y, z, "spruce_planks");
  vox.set(x, 21, z, "spruce_slab", { type: "top", waterlogged: "false" });
}

// Planting on the wing's terrace.
vox.set(1, 6, 18, "flowering_azalea_leaves", { distance: "7", persistent: "true", waterlogged: "false" });
vox.set(2, 6, 21, "flowering_azalea_leaves", { distance: "7", persistent: "true", waterlogged: "false" });

console.log(vox.save(`${DIR}/NYC1022658.nbt`));
