// 1101 New York Ave NW: a 1970s-80s Modern office block of pale limestone-clad piers and tinted glass on a granite plinth.
// Massing from the lidar roof (cells file): a 19-block main slab (6 storeys: shop + 4 office + attic), a 21-block
// penthouse core set back in the middle, 7-block shop wings to the east, and 4-block low annexes at the corner and south.
// Every column is solid at the plate rows and the attic/cornice, so nothing floats; room rows between plates are air
// behind the glass (lit by glowstone/lanterns in some bays).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC53957.cells.json`, "utf8"));

// lidar roof -> one flat tier top per band (noise smoothed: 14 is a lone notch, 3-4 and 6-7 are the low annexes)
const tierTop = (r) => (r >= 20 ? 21 : r >= 18 || r === 14 ? 19 : r >= 6 ? 7 : 4);
const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, R: tierTop(r) });
const at = (x, z) => foot.get(`${x},${z}`);
const built = (x, z, y) => { const c = at(x, z); return !!c && y < c.R; };
const DIRS = [[0, -1, "n"], [0, 1, "s"], [1, 0, "e"], [-1, 0, "w"]];
// the faces at height y that have no building behind them (outside the footprint, or the neighbour is lower)
const exteriorDirs = (x, z, y) => DIRS.filter(([dx, dz]) => !built(x + dx, z + dz, y));

const STONE = "calcite", TRIM = "smooth_quartz", BASE = "polished_andesite", GLASS = "light_blue_stained_glass_pane";
const PLATES = [4, 7, 10, 13, 16];                       // floor slabs (solid across the footprint)
const ROOMS = [2, 3, 5, 6, 8, 9, 11, 12, 14, 15];        // storey rows: lower and upper sash of each office storey
const LOWER = [2, 5, 8, 11, 14], UPPER = [3, 6, 9, 12, 15];
// entrances on the ring: the main door on the north face, a shop door on the east wing
const DOORS = [{ x: 7, z: 0, facing: "north" }, { x: 24, z: 7, facing: "east" }];
const doorAt = (x, z) => DOORS.find((d) => d.x === x && d.z === z);

const g = new Voxels([26, 33, 27]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);

for (const [key, { g: ground, R }] of foot) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < R; y++) {
    if (y < ground) { put(x, y, z, y === 0 ? "stone_bricks" : BASE); continue; }   // foundation up to the lidar ground
    if (y === 1) { put(x, y, z, BASE); continue; }                                  // granite plinth course
    if (y === R - 1) { put(x, y, z, TRIM); continue; }                             // cornice / roof edge
    if (y === R - 2 || (R >= 19 && (y === 17 || y === 18))) { put(x, y, z, STONE); continue; }   // attic band
    if (PLATES.includes(y)) { put(x, y, z, TRIM); continue; }                       // storey lines
    if (!ROOMS.includes(y)) continue;
    const ext = exteriorDirs(x, z, y);
    if (!ext.length) continue;                                                      // interior: air behind the glass
    const door = doorAt(x, z);
    if (door && (y === 2 || y === 3)) {
      put(x, y, z, "dark_oak_door", { facing: door.facing, half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (ext.length > 1) { put(x, y, z, STONE); continue; }                          // corner pier
    const [dx] = ext[0];
    const t = dx !== 0 ? z : x;                                                     // position along the face
    if (t % 3 === 0) put(x, y, z, STONE);                                           // piers between bays of glass
    else if (y === 2) put(x, y, z, BASE);                                           // shopfront bulkhead
    else put(x, y, z, GLASS);
  }
  // parapet on the main slab's edge (cells with an open outer face at the top of the slab)
  if (R === 19 && exteriorDirs(x, z, 18).length) put(x, 19, z, STONE);
}

// warm light behind some glass (inside the air gap), on each storey's lower or upper sash row
for (const [key, { R }] of foot) {
  const [x, z] = key.split(",").map(Number);
  if (R < 7) continue;
  for (const y of [...LOWER, ...UPPER]) {
    const ext = exteriorDirs(x, z, y);
    if (ext.length !== 1) continue;
    const [dx, dz] = ext[0];
    const t = dx !== 0 ? z : x;
    const inX = dx !== 0 ? x - dx : x, inZ = dz !== 0 ? z - dz : z;   // one cell inward, opposite the outer face
    if (!built(inX, inZ, y) || exteriorDirs(inX, inZ, y).length) continue;
    const k = LOWER.includes(y) ? LOWER.indexOf(y) : UPPER.indexOf(y);
    if (LOWER.includes(y) && (t + 4 * k) % 9 === 4) put(inX, y, inZ, "glowstone");
    if (UPPER.includes(y) && (t + 4 * k) % 9 === 1) put(inX, y, inZ, "lantern", { hanging: "true", waterlogged: "false" });
  }
}
// the entrance lanterns, and the ground-floor shop glow
for (const d of DOORS) {
  const ix = d.facing === "east" ? d.x - 1 : d.x, iz = d.facing === "north" ? d.z + 1 : d.z;
  put(ix, 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
}

// roof equipment: a few plant boxes on the main slab, a pair on the penthouse
for (const [key, { R }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const inner = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
    .every(([dx, dz]) => at(x + dx, z + dz)?.R === R);
  if (!inner) continue;
  if (R === 19 && x % 6 === 3 && z % 5 === 2) put(x, 19, z, "light_gray_concrete");
  if (R === 21 && x % 4 === 1 && z % 4 === 1) put(x, 21, z, "light_gray_concrete");
}

// glass panes connect to their neighbours (panes and solid blocks), as the vanilla pane states need
const SOLID = new Set(["calcite", "smooth_quartz", "polished_granite", "stone_bricks", "glowstone", "shroomlight", "light_gray_concrete"]);
const PANE = `minecraft:${GLASS}`;
for (let z = 0; z < 27; z++) for (let x = 0; x < 26; x++) for (let y = 0; y < 33; y++) {
  const here = g.get(x, y, z);
  if (!here || here.block !== PANE) continue;
  const conn = (dx, dz) => {
    const n = g.get(x + dx, y, z + dz);
    if (!n) return "false";
    return n.block === PANE || SOLID.has(n.block.replace("minecraft:", "")) ? "true" : "false";
  };
  g.set(x, y, z, GLASS, { north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0), waterlogged: "false" });
}

// nothing floats: every block must connect face-to-face to the ground through solid blocks (floor slabs hold up by the walls)
const [X, Y, Z] = g.size, seen = new Set(), queue = [];
const idx = (x, y, z) => (z * Y + y) * X + x;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (g.get(x, 0, z)) { seen.add(idx(x, 0, z)); queue.push([x, 0, z]); }
while (queue.length) {
  const [x, y, z] = queue.pop();
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const [nx, ny, nz] = [x + dx, y + dy, z + dz];
    if (nx < 0 || ny < 0 || nz < 0 || nx >= X || ny >= Y || nz >= Z || seen.has(idx(nx, ny, nz)) || !g.get(nx, ny, nz)) continue;
    seen.add(idx(nx, ny, nz)); queue.push([nx, ny, nz]);
  }
}
const floating = [];
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) if (g.get(x, y, z) && !seen.has(idx(x, y, z))) floating.push([x, y, z]);
console.log(`unsupported blocks: ${floating.length}`, floating.slice(0, 8));

const stats = g.save(`${DIR}/DC53957.nbt`);
console.log(`saved DC53957.nbt: ${stats.blocks} blocks, palette ${stats.palette}`);
