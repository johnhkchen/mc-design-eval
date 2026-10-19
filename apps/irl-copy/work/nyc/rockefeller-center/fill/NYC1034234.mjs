// 38 West 45th Street, the Webster Apartment Hotel (commercial and office, 1903): a 14-storey brick hotel block in the
// Renaissance Revival manner of its years, massed from the lidar roof as clean tiers. A 42-block base carries the
// street wall (low z, the 45th Street front) and the wings; a 44-block middle is set back 2 blocks from the street and
// both sides; a 46-block rear core and wing rise above it, with a wooden water tank on the core and a glazed penthouse on
// the middle tier; a 10-block rear annex closes the court. Granite base course and shopfront piers, a recessed-by-canopy
// doorway on the street, calcite storey belts and a parapet course. Glass panes in brick window bays, each with one
// block of air behind it inside the solid core (no interiors), and glowstone behind some windows and the shop glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034234.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 16, Y = 52, Z = 27;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);
const built = (x, z) => lidar(x, z) > 0;

// Tiers (block tops above y 0), flattened from the lidar's 42-46 noise: the rear annex (lidar 7-11), the 46-block rear
// core and wing, the 44-block middle set back from the front and sides, and the 42-block base everywhere else.
const topOf = (x, z) => {
  if (!built(x, z)) return 0;
  if (lidar(x, z) < 12) return 10;
  if ((x >= 8 && z >= 9 && z <= 16) || (x >= 12 && z >= 21 && z <= 24)) return 46;
  if (x >= 2 && x <= 13 && z >= 2 && z <= 20) return 44;
  return 42;
};
// A cell is open at height y when it is off the footprint, unbuilt, or its tier is at or below y.
const open = (x, y, z) => !inFoot(x, z) || topOf(x, z) <= y;
// Which way a block faces the open air: the street (low z) first, then the rear, then the two sides.
const FACES = [["front", 0, -1], ["back", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const faceOf = (x, y, z) => {
  for (const [f, dx, dz] of FACES) if (open(x + dx, y, z + dz)) return f;
  return null;
};

const g = new Voxels([X, Y, Z]);
const pockets = [];                                                  // [x, y, z, glow]: the air (or glowstone) behind a window
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // pane on a face along x
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const IN = { front: [0, 1], back: [0, -1], west: [1, 0], east: [-1, 0] };   // one block inward from each face
const SHOP = new Set([1, 2, 3, 4, 6, 8, 10, 11, 12, 13, 14]);           // street-front ground cells that are glass
const SHOP_LIT = new Set([2, 6, 12]);                                    // shop cells with a lamp behind the glass
const along = (face, x, z) => (face === "front" || face === "back" ? x : z);
const lit = (x, y, z) => (x * 5 + y * 3 + z * 7) % 6 === 0;               // about one window in six

const behind = (face, x, y, z, glow) => {
  const [dx, dz] = IN[face];
  pockets.push([x + dx, y, z + dz, glow]);
};

// The block on an exposed face, by height and position along the wall.
const facade = (face, x, y, z, top) => {
  if (y === top - 1) return ["stone_bricks"];                            // a full course on the roof edge: parapet
  if (y === 0) return ["polished_granite"];                              // base course
  const pier = along(face, x, z) % 3 === 0;
  if (y <= 3) {                                                          // ground floor
    if (face === "front") {
      if (x === 7 && y <= 2) {                                           // the entrance, under the canopy
        return ["dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
      }
      if (y < 3 && SHOP.has(x)) { behind(face, x, y, z, SHOP_LIT.has(x)); return ["glass"]; }
      return ["polished_granite"];                                       // piers and the lintel course
    }
    return pier ? ["polished_granite"] : ["bricks"];
  }
  if (face === "front" && y === 4 && x >= 5 && x <= 9) return ["black_concrete"];   // canopy over the doorway
  if ((y - 4) % 3 === 0) return ["calcite"];                             // storey belt course
  if (pier) return ["bricks"];
  behind(face, x, y, z, lit(x, y, z));
  return ["glass_pane", face === "front" || face === "back" ? PANE_EW : PANE_NS];
};

// Solid mass: every built column from y 0 to its tier, the brick face on the exposed sides, a roof on each tier top.
for (const [x, z] of cells.map(([x, z]) => [x, z]).filter(([x, z]) => built(x, z))) {
  const top = topOf(x, z);
  for (let y = 0; y < top; y++) {
    const face = faceOf(x, y, z);
    const [name, state] = face ? facade(face, x, y, z, top) : y === top - 1 ? ["gray_concrete"] : ["stone_bricks"];
    g.set(x, y, z, name, state);
  }
}

// The air gap behind each glass pane (and the lamp, where it is lit): the core stays solid around it, its floor
// slab being the belt course below.
for (const [x, y, z, glow] of pockets) g.set(x, y, z, glow ? "glowstone" : "air");

// Roof equipment: a wooden water tank on the rear core, and a glazed penthouse on the middle tier.
for (let x = 10; x <= 12; x++) for (let z = 11; z <= 13; z++) for (let y = 46; y <= 48; y++) g.set(x, y, z, "spruce_planks");
for (let x = 10; x <= 12; x++) for (let z = 11; z <= 13; z++) g.set(x, 49, z, "dark_oak_planks");
for (let x = 4; x <= 6; x++) for (let z = 4; z <= 6; z++) for (let y = 44; y <= 45; y++) g.set(x, y, z, "calcite");
for (let x = 4; x <= 6; x++) g.set(x, 45, 4, "glass");
for (let x = 4; x <= 6; x++) for (let z = 4; z <= 6; z++) g.set(x, 46, z, "stone_bricks");

const out = g.save(`${DIR}/NYC1034234.nbt`);
console.log(`NYC1034234.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
