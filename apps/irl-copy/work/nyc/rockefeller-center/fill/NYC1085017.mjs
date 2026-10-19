// 153 West 44th Street (NYC1085017), a 1988 Midtown commercial and office block: four storeys of pale stone
// over a granite base and shopfronts, a stepped west wing, a lower front with its entrances, and a plant
// bulkhead on the roof. The footprint cells give the massing; the shell is one block thick, the air behind the glass
// is one cell deep, and the core behind it is solid, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1085017.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 15, Z = 28, Y = 16;

// Roof per footprint cell; 0 outside the footprint. Courts (roof 1) are the open ground the lidar saw inside the block.
const R = Array.from({ length: X }, () => Array(Z).fill(0));
for (const [x, z, , roof] of cells) R[x][z] = roof;
const roofAt = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : R[x][z]);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Shell: a cell with a face to the street, to a court, or to a lower tier. Ring: an inner cell beside the shell (the air
// gap behind the glass). Core: the rest of the massing, solid.
const shell = (x, z) => roofAt(x, z) >= 3 && NB.some(([dx, dz]) => roofAt(x + dx, z + dz) < 3 || roofAt(x + dx, z + dz) < R[x][z]);
const kindOf = (x, z) => {
  const r = roofAt(x, z);
  if (r < 3) return "court";
  if (shell(x, z)) return "shell";
  return NB.some(([dx, dz]) => shell(x + dx, z + dz)) ? "ring" : "core";
};

// Front doors on the Fifth-side facade (z = 0, the north face), facing out.
const DOORS = new Set(["7,0", "12,0"]);

const S = new Map();     // shell blocks by "x,y,z" for pane connections: {name, state}
const P = new Map();     // every block by "x,y,z"
const put = (map, x, y, z, name, state) => map.set(`${x},${y},${z}`, { name, state });

const CONNECT = /(quartz_pillar|smooth_quartz|polished_granite|stained_glass_pane)$/;
const paneState = (x, y, z) => {
  const link = (dx, dz) => (S.has(`${x + dx},${y},${z + dz}`) && CONNECT.test(S.get(`${x + dx},${y},${z + dz}`).name)) ? "true" : "false";
  return { east: link(1, 0), north: link(0, -1), south: link(0, 1), west: link(-1, 0), waterlogged: "false" };
};

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const r = roofAt(x, z); if (!r) continue;
  const kind = kindOf(x, z), T = r - 1;
  if (kind === "court") { put(P, x, 0, z, "polished_andesite"); continue; }
  if (kind === "core") { for (let y = 0; y <= T; y++) put(P, x, y, z, "smooth_stone"); continue; }
  if (kind === "ring") {
    put(P, x, 0, z, "smooth_stone");
    for (let y = 1; y <= T; y++) if ((y - 1) % 3 === 0) put(P, x, y, z, "smooth_stone");   // floor slabs, one per storey
    continue;
  }
  // shell
  const pier = (x + z) % 3 === 0;
  for (let y = 0; y <= T; y++) {
    let name = null, state = null;
    if (y === T) name = "polished_andesite";                                               // cornice
    else if (y === 0 || y === 1) name = "polished_deepslate";                              // foundation, dark base course
    else if ((y - 1) % 3 === 0) name = "smooth_quartz";                                    // storey spandrel
    else if (y <= 3) { name = pier ? "polished_deepslate" : "gray_stained_glass_pane"; }   // shopfront
    else name = pier ? "quartz_pillar" : "light_blue_stained_glass_pane";                  // office glass and mullions
    if (DOORS.has(`${x},${z}`) && (y === 1 || y === 2)) {
      name = "iron_door";
      state = { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    } else if (name === "quartz_pillar") state = { axis: "y" };
    put(S, x, y, z, name, state);
    put(P, x, y, z, name, state);
  }
}

// Panes take their connections from the shell beside them.
for (const [key, b] of S) {
  if (!b.name.endsWith("stained_glass_pane")) continue;
  const [x, y, z] = key.split(",").map(Number);
  b.state = paneState(x, y, z);
  P.set(key, b);
}

// Ring cells: a warm light behind some window bays, on the floor slab.
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (kindOf(x, z) !== "ring") continue;
  const T = roofAt(x, z) - 1;
  for (let y = 2; y < T; y += 3) if ((x * 7 + z * 5 + y * 3) % 13 === 0) put(P, x, y, z, "glowstone");
}

// Roof plant: a bulkhead on the 14-block tier, sitting on its cap.
for (let x = 5; x <= 8; x++) for (let z = 15; z <= 18; z++) put(P, x, 14, z, "light_gray_concrete");
for (let x = 6; x <= 7; x++) for (let z = 16; z <= 17; z++) put(P, x, 15, z, "light_gray_concrete");

const g = new Voxels([X, Y, Z]);
for (const [key, b] of P) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, b.name, b.state);
}
const info = g.save(`${dir}/NYC1085017.nbt`);
console.log(`wrote NYC1085017.nbt: ${info.blocks} blocks, ${info.palette} palette entries`);
