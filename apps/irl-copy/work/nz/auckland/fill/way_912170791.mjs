// Way 912170791: a 1920s-30s shop-top building on a 10 x 7 footprint, three storeys over a shopfront, read from the lidar roof.
// The lidar roof heights are smoothed into three flat tiers: 12 (the 3-storey main block, parapet to 13), 10 (the rear wing
// that steps down from it) and 3 (a single-storey lean-to at the back). Storey lines at y 4 and 8; a base course at y 0; the
// shell is one block thick, the interior is air with floor slabs at 0, 4 and 8, and the roof deck closes each column.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_912170791.cells.json`, "utf8"));

// Footprint and roof tops (exclusive): lidar 12 -> 12, 10-11 -> 10 (the rear wing, one flat tier), 3 stays
const roof = new Map();
for (const [x, z, , r] of cells) roof.set(`${x},${z}`, r >= 12 ? 12 : r >= 9 ? 10 : r);
const inFoot = (x, z) => roof.has(`${x},${z}`);
const top = (x, z) => roof.get(`${x},${z}`);
const solid = (x, y, z) => inFoot(x, z) && y >= 0 && y < top(x, z);

// Storey lines (floors at 0, 4, 8), windows in the storey rows, lintels over them; piers (every third column) stay plaster
const STRING = [4, 8];
const FLOOR = [0, 4, 8];
const WINDOW_ROWS = [1, 2, 5, 6, 9, 10];
const LINTEL_ROWS = [3, 7];

// Which sides of a column cell at height y are open to air (N = z-1, S = z+1, W = x-1, E = x+1)
function faces(x, y, z) {
  const f = [];
  if (!solid(x, y, z - 1)) f.push("N");
  if (!solid(x, y, z + 1)) f.push("S");
  if (!solid(x - 1, y, z)) f.push("W");
  if (!solid(x + 1, y, z)) f.push("E");
  return f;
}
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const FACE_PRIORITY = ["N", "S", "W", "E"];

const g = new Voxels([10, 25, 7]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);
const glassAlong = (face) => ({ north: face === "W" || face === "E" ? "true" : "false", south: face === "W" || face === "E" ? "true" : "false", east: face === "N" || face === "S" ? "true" : "false", west: face === "N" || face === "S" ? "true" : "false" });
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// Pass 1: the shell and the interior
const exterior = new Set();
const key = (x, y, z) => `${x},${y},${z}`;
for (const [x, z] of [...roof.keys()].map((k) => k.split(",").map(Number))) {
  for (let y = 0; y < top(x, z); y++) {
    const f = faces(x, y, z);
    if (f.length) exterior.add(key(x, y, z));
    if (y === 0 && !f.length) { set(x, y, z, "stone_bricks"); continue; }      // interior floor, base layer
    if (y === top(x, z) - 1) {                                                   // the roof: cornice at the edge, deck inside
      set(x, y, z, f.length ? "smooth_sandstone" : "gray_concrete");
      continue;
    }
    if (!f.length) {
      if (FLOOR.includes(y)) set(x, y, z, "stone_bricks");                       // floor slab per storey (y 4, 8)
      continue;                                                                  // else the air gap behind the glass
    }
    if (y === 0) { set(x, y, z, "polished_andesite"); continue; }              // base course
    if (STRING.includes(y)) { set(x, y, z, "smooth_sandstone"); continue; }    // string course at each storey line

    const face = FACE_PRIORITY.find((p) => f.includes(p));
    const u = face === "N" || face === "S" ? x : z;
    const pier = u % 3 === 0;

    if (face === "N" && z === 0) {                                             // the street front: door and shopfront
      if (x === 5 && (y === 1 || y === 2)) { set(x, y, z, "dark_oak_door", doorState(y === 1 ? "lower" : "upper")); continue; }
      if (y === 3) { set(x, y, z, x % 2 ? "green_concrete" : "white_concrete"); continue; }   // the awning band over the shop
      if (y === 1 || y === 2) { set(x, y, z, "glass_pane", glassAlong(face)); continue; }
    }
    if (WINDOW_ROWS.includes(y) && !pier) { set(x, y, z, "glass_pane", glassAlong(face)); continue; }
    if (LINTEL_ROWS.includes(y) && !pier) { set(x, y, z, "dark_oak_planks"); continue; }
    set(x, y, z, "white_concrete");                                            // plaster wall and piers
  }
}

// Pass 2: the parapet on the main block's edge, stood on the cornice; roof plant on the deck
for (const k of roof.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (top(x, z) === 12 && exterior.has(key(x, 11, z))) set(x, 12, z, "white_concrete");
}
set(3, 12, 2, "iron_block");
set(4, 12, 2, "iron_block");

// Pass 3: warm light. Glowstone sits in the air behind some windows, lanterns hang from the ground-floor slab in the shop
for (const k of exterior) {
  const [x, y, z] = k.split(",").map(Number);
  if (!WINDOW_ROWS.includes(y)) continue;
  if ((x * 5 + z * 3 + y * 7) % 4 !== 0) continue;
  const f = faces(x, y, z)[0];
  if (!f) continue;
  const [dx, dz] = INWARD[f];
  const ix = x + dx, iz = z + dz;
  if (!solid(ix, y, iz) && inFoot(ix, iz) && !exterior.has(key(ix, y, iz))) set(ix, y, iz, "glowstone");
}
for (const x of [6, 8]) set(x, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });

const counts = g.save(`${DIR}/way_912170791.nbt`);
console.log(`way_912170791: ${counts.blocks} blocks, ${counts.palette} palette entries`);
