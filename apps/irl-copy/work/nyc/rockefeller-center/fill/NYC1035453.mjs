// 19 East 49th Street, 1930 commercial and office building: a 7 x 27 block lot (about 8 x 30 m), its 7-block side on
// 49th Street at low z. Three storeys of 3 blocks over a granite plinth and a shopfront, a limestone storey line at each
// floor, steel-sash windows in light-grey glass with calcite piers, a cornice and parapet, and brick party walls on the
// sides and rear. The lidar measures roofs of 10 and 12 blocks on 27 cells (the west edge and the south-west corner, 12
// on the stair bay at x 0, z 9-16 and z 21); the rest of the footprint reads 0 or 1 (no return, or at grade). That part
// is taken as the same 10-block roof as its measured neighbours, so the building is one 10-block block with a 12-block
// stair bay on its west party wall. Every block stands on the foundation or on what is below it. No interiors: an air
// gap behind each window and the door, a few glowstone lamps in those gaps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035453.cells.json`, "utf8"));
const X = 7, Y = 24, Z = 27;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const ground = (x, z) => cell.get(`${x},${z}`).ground;
// Roof tops (block heights above y 0): a measured 10 or 12 is kept, every other footprint cell takes 10.
const top = (x, z) => (inFoot(x, z) ? (cell.get(`${x},${z}`).roof >= 10 ? cell.get(`${x},${z}`).roof : 10) : 0);
const DIRS = { N: [0, -1], W: [-1, 0], E: [1, 0], S: [0, 1] };
const open = (x, y, z) => !inFoot(x, z) || top(x, z) <= y;
const exposed = (x, y, z) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return open(x + dx, y, z + dz); });
// A roof edge: a neighbour lower than this roof, or none at all.
const edge = (x, z, t) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => top(x + dx, z + dz) < t);

// Pane states: a pane on a face along x joins its neighbours east and west; one on a face along z joins north and south.
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneOf = (d) => (d === "N" || d === "S" ? NS : EW);

const g = new Voxels([X, Y, Z]);
const cols = [...cell.keys()].map((k) => k.split(",").map(Number));

// Facade skin for a solid block at height y with its exposed faces ex; d is the face that gets the decoration
// (the street front N first, then the west wall, then the blank party walls). Returns [block, state] or null (core).
function skin(x, y, z, d, ex) {
  const T = top(x, z);
  if (y === T - 1) return ex.length ? ["smooth_quartz", null] : ["gray_concrete", null];   // cornice on edges, roof deck inside
  if (!d) return ["stone_bricks", null];                                                  // core, hidden behind the skin
  if (d === "N" && y === 3 && x >= 2 && x <= 4) return ["gray_concrete", null];           // canopy over the entrance
  if (d === "N" && y < 3) return x === 1 || x === 5 ? ["glass_pane", paneOf(d)] : ["polished_granite", null];   // shopfront
  if (y < 3) return ["polished_granite", null];                                           // base course on the other faces
  if (y % 3 === 0) return d === "E" || d === "S" ? ["bricks", null] : ["smooth_quartz", null];   // storey line
  if (d === "E" || d === "S") return ["bricks", null];
  const u = d === "N" ? x : z;                                                             // position along the face
  return u % 3 === 0 ? ["calcite", null] : ["light_gray_stained_glass_pane", paneOf(d)];   // piers and steel-sash windows
}

// 1. Solid mass: foundation from y 0 up to each cell's ground, then the storeys up to its roof, skinned as above.
for (const [x, z] of cols) {
  const G = ground(x, z), T = top(x, z);
  for (let y = 0; y < G; y++) {
    const ex = exposed(x, y, z);
    g.set(x, y, z, ex.length ? "polished_granite" : "stone_bricks");
  }
  for (let y = G; y < T; y++) {
    const ex = exposed(x, y, z);
    const d = ["N", "W", "E", "S"].find((k) => ex.includes(k));
    const [block, state] = skin(x, y, z, d, ex);
    g.set(x, y, z, block, state ?? undefined);
  }
}

// 2. Behind each window, a one-block air gap (the glass is the face; the core is the wall), with a glowstone lamp in some.
// A window's lamp is set only where the cell behind is core, not another face.
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows
for (const [x, z] of cols) {
  const T = top(x, z);
  for (let y = ground(x, z); y < T - 1; y++) {
    const ex = exposed(x, y, z);
    const d = ["N", "W"].find((k) => ex.includes(k));   // only the street and west faces carry glazing
    if (!d) continue;
    const u = d === "N" ? x : z;
    const isGlass = d === "N" ? (y < 3 ? x === 1 || x === 5 : y % 3 !== 0 && u % 3 !== 0) : (y >= 3 && y % 3 !== 0 && u % 3 !== 0);
    if (!isGlass) continue;
    const [rx, rz] = d === "N" ? [x, z + 1] : [x + 1, z];
    if (!inFoot(rx, rz) || top(rx, rz) <= y || exposed(rx, y, rz).length) continue;
    const warm = y < 3 ? (u === 5 && y === 1) : lit(u, y, d === "N" ? 1 : 2);
    g.set(rx, y, rz, warm ? "glowstone" : "air");
  }
}

// 3. Entrance on 49th Street (x 3): a single iron door with a vestibule air gap behind it, under a black canopy that
// stands on the core behind it, and two hanging lanterns beside it on the shopfront.
g.set(3, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(3, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(3, 1, 1, "air"); g.set(3, 2, 1, "air");
for (const x of [2, 4]) g.set(x, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Parapets: a half slab on the edge of each roof, standing on the cornice or roof deck below it.
for (const [x, z] of cols) {
  const T = top(x, z);
  if (edge(x, z, T)) g.set(x, T, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Roof: two plant boxes (2 blocks high) on the 10-block roof, set back from the parapet.
for (const [x, z] of [[2, 5], [4, 5]]) { g.set(x, 10, z, "light_gray_concrete"); g.set(x, 11, z, "light_gray_concrete"); }

// Check: every block above y 0 has a block below it or beside it on its own level, so nothing hangs in the air.
let loose = 0;
for (const [x, z] of cols) for (let y = 1; y < Y; y++) {
  if (!g.get(x, y, z)) continue;
  const supported = g.get(x, y - 1, z) || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => g.get(x + dx, y, z + dz));
  if (!supported) loose++;
}

const stats = g.save(`${DIR}/NYC1035453.nbt`);
const tops = cols.map(([x, z]) => top(x, z));
console.log(JSON.stringify({ cells: cols.length, roofMax: Math.max(...tops), roofMin: Math.min(...tops), loose, ...stats }));
