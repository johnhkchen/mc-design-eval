// way 1095572142: a two-storey brick commercial block with a shopfront, a stone cornice and a parapet (c.1920s, the
// CBD's edge-of-town style). Massing follows the lidar roof per cell: 10 blocks (the parapet top) with one 7-block wing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1095572142.cells.json`, "utf8"));   // [x, z, ground, roof]
const H = 23;
const g = new Voxels([7, H, 11]);
const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => foot.has(`${x},${z}`);
const DIRS = [["n", 0, -1], ["s", 0, 1], ["w", -1, 0], ["e", 1, 0]];   // n is the street side (low z)
const exposedOf = (x, z) => DIRS.filter(([, dx, dz]) => !inF(x + dx, z + dz));
const isInterior = (x, z) => inF(x, z) && exposedOf(x, z).length === 0;
const put = (x, y, z, block, state) => { if (y >= 0 && y < H) g.set(x, y, z, block, state); };

// the entrance: on the street face of cell (3, 1)
const DOOR = { x: 3, z: 1 };
const deckOf = (R) => (R >= 10 ? 8 : 4);     // roof deck under the parapet
const isWin = (u) => u % 2 === 1;             // windows on odd bays, brick piers between
const paneState = (d) => (d === "n" || d === "s"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// the outer skin of one cell at height y: [block, state?]
function skin(y, R, x, z, d) {
  const D = deckOf(R);
  if (y === R - 1) return ["stone_bricks"];                 // parapet cap
  if (y === D) return ["smooth_stone"];                     // cornice
  if (y > D) return ["bricks"];                             // parapet
  if (y === 0) return ["stone_bricks"];                     // plinth
  if (y === 4) return ["smooth_stone"];                     // string course
  const u = d === "n" || d === "s" ? x : z;
  if (y <= 3) {                                             // ground storey
    if (d === "n" && z <= 2) {                              // the shopfront
      if (x === DOOR.x && z === DOOR.z) {
        if (y === 1) return ["dark_oak_door", doorState("lower")];
        if (y === 2) return ["dark_oak_door", doorState("upper")];
      }
      if (y === 3) return ["dark_oak_planks"];              // fascia
      return isWin(u) ? ["glass"] : ["dark_oak_log"];
    }
    if (y === 1) return isWin(u) ? ["stone_bricks"] : ["bricks"];   // window sill
    return isWin(u) ? ["glass_pane", paneState(d)] : ["bricks"];
  }
  // upper storey
  if (y === 5) return isWin(u) ? ["smooth_stone"] : ["bricks"];     // sill
  return isWin(u) ? ["glass_pane", paneState(d)] : ["bricks"];
}

for (const [x, z, ground, R] of cells) {
  const exposed = exposedOf(x, z);
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");   // foundation up to the lowest ground
  // floor slabs: ground floor, first floor, and the roof deck on the tall part
  put(x, 0, z, "oak_planks");
  put(x, 4, z, "oak_planks");
  if (R >= 10) put(x, 8, z, "stone");
  // skin: every exposed face of the cell, from its ground up to its roof
  for (let y = ground; y < R; y++) {
    const [block, state] = exposed.length ? skin(y, R, x, z, exposed[0][0]) : [];
    if (block) put(x, y, z, block, state);
  }
}

// warm lights standing on the floor just behind some windows
for (const [x, z, , R] of cells) {
  for (const [d, dx, dz] of exposedOf(x, z)) {
    const ix = x - dx, iz = z - dz;
    if (!isInterior(ix, iz)) continue;
    const u = d === "n" || d === "s" ? x : z;
    if (!isWin(u) || (x + z) % 3 !== 0) continue;
    if (d === "n" && z <= 2) put(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });   // shop
    else if (R >= 10) put(ix, 5, iz, "lantern", { hanging: "false", waterlogged: "false" });        // upper storey
    else put(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });                      // wing
  }
}

// roof plant: a small box in the middle of the deck, out of the parapet's reach
for (const [x, z] of [[2, 6], [3, 6], [2, 7], [3, 7]]) {
  put(x, 9, z, "stone_bricks");
  put(x, 10, z, "smooth_stone");
}

g.save(`${DIR}/way_1095572142.nbt`);
