// 1899 L St NW: a brick-and-limestone downtown office block (1920s-style). A granite and glass shopfront at street
// level, a seven-storey brick podium with calcite string courses, and a 19-block tower stepping back from its middle,
// with a penthouse and roof plant. The footprint is the lidar's cells: ground under each, massing from its roof value.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68541.cells.json", "utf8"));

const X = 14, Z = 16, H = 31;
const roof = Array.from({ length: X }, () => Array(Z).fill(0));     // lidar roof height above y 0 (0 = not footprint)
const ground = Array.from({ length: X }, () => Array(Z).fill(0));
for (const [x, z, gr, r] of cells) { roof[x][z] = r; ground[x][z] = gr; }
const rf = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : roof[x][z]);
const env = (x, y, z) => y >= 0 && y < rf(x, z);                  // inside the massing envelope
const FLOORS = new Set([0, 4, 6, 8, 10, 12, 14, 16, 18]);          // interior floor slabs (ground storey, then 2-block storeys)
const SOUTH = Z - 1, DOOR_X = 6;

// Exterior facade: granite base, shopfront with a door under a dark canopy, then brick spandrels, calcite string courses
// every 4 blocks and window rows with brick piers on the even bays; corners are piers.
function facade(x, y, z, exN, exX) {
  const corner = exN && exX, pier = corner || (exN ? x : z) % 2 === 0;
  const pane = exN ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" };
  if (y === 0) return "polished_granite";
  if (y <= 2 && z === SOUTH && x === DOOR_X) return { block: "dark_oak_door", state: { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  if (y <= 2) return pier ? "polished_granite" : { block: "glass_pane", state: pane, glass: true };
  if (y === 3) return z === SOUTH && x >= DOOR_X - 1 && x <= DOOR_X + 1 ? { block: "dark_oak_slab", state: { type: "bottom" } } : "calcite";
  if (y % 4 === 0) return "calcite";
  if (y % 2 === 0) return "bricks";
  return pier ? "bricks" : { block: "glass_pane", state: pane, glass: true };
}

const out = new Map();                                             // "x,y,z" -> block | { block, state, glass? }
const put = (x, y, z, v) => out.set(`${x},${y},${z}`, v);
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const r = roof[x][z]; if (!r) continue;
  for (let y = 0; y < ground[x][z]; y++) put(x, y, z, "stone");   // foundation under the ground line (none on this flat site)
  for (let y = ground[x][z]; y < r; y++) {
    const exN = !env(x, y, z - 1) || !env(x, y, z + 1);
    const exX = !env(x - 1, y, z) || !env(x + 1, y, z);
    const exposed = exN || exX;
    if (y === r - 1) put(x, y, z, exposed ? "calcite" : "smooth_stone");          // parapet coping / roof membrane
    else if (exposed) put(x, y, z, facade(x, y, z, exN, exX));
    else {
      // a lower neighbour's roof is the deck under a setback: solid, not hanging
      const deck = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => rf(x + dx, z + dz) > 0 && rf(x + dx, z + dz) < r && rf(x + dx, z + dz) - 1 === y);
      if (FLOORS.has(y) || deck) put(x, y, z, "smooth_stone");
    }
  }
}
// warm light behind some glass: an interior cell in a window row, on a floor, next to a pane
for (let x = 0; x < X; x++) for (let y = 1; y < H; y += 2) for (let z = 0; z < Z; z++) {
  if (out.has(`${x},${y},${z}`) || !env(x, y, z)) continue;
  const behindGlass = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => { const v = out.get(`${x + dx},${y},${z + dz}`); return v && v.glass; });
  if (behindGlass && (x * 3 + z * 5 + y) % 4 === 0) put(x, y, z, "glowstone");
}
// roof: penthouse on the tower and two rooftop units on the podium
for (let x = 6; x <= 8; x++) for (let z = 8; z <= 10; z++) for (let y = 19; y <= 20; y++) put(x, y, z, "stone_bricks");
for (let x = 6; x <= 8; x++) for (let z = 8; z <= 10; z++) put(x, 21, z, { block: "stone_brick_slab", state: { type: "bottom" } });
for (const [x, z] of [[1, 1], [2, 1], [11, 14], [12, 14]]) put(x, 16, z, "light_gray_concrete");

const g = new Voxels([X, H, Z]);
for (const [k, v] of out) {
  const [x, y, z] = k.split(",").map(Number);
  if (typeof v === "string") g.set(x, y, z, v);
  else g.set(x, y, z, v.block, v.state);
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68541.nbt");
