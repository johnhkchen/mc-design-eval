// DC65249: Commercial-Office-Large, 10th St NW. A stripped-classical office block of the 1930s (the Federal Triangle
// idiom): pale limestone walls (calcite) on a dark polished-andesite base, cornice and storey lines, and glass bays
// in each storey, with shopfronts on the ground floor. Lidar heights are smoothed to two tiers: a 20-block core with
// two pavilions on the north front, and an 18-block wing around it. The 4s at x 12-14 on the north edge are a porch
// roof (the entrance canopy, the building set back behind it); the other 4s and 17s are noise. No interiors: each
// window has one cell of air behind it and a solid core beyond, and every storey is a solid slab on the storey below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC65249.cells.json`, "utf8"));
const W = 27, D = 18, H = 32;

const LIMESTONE = "calcite", BAND = "polished_andesite", FOUNDATION = "stone_bricks", GLASS = "light_blue_stained_glass_pane";
const CORE = "white_concrete", ROOF = "smooth_stone", PENTHOUSE = "stone_bricks";

// storey lines are relative to each cell's ground: the base course, the ground-floor lintel, and the spandrel under each
// upper storey; glass in the rows between. The top row (the roof's height less one) is always the cornice.
const SPANDREL = new Set([0, 4, 5, 8, 11, 14, 17]);
const WINDOW = new Set([1, 2, 3, 6, 7, 9, 10, 12, 13, 15, 16, 18]);
const LANTERN_ROWS = new Set([1]);                       // ground-floor lanterns stand on the core floor
const GLOW_ROWS = new Set([6, 9, 12, 15, 18]);            // glowstone in the air gap, only where something is below it

const at = new Map();                                    // "x,z" -> { g, r }, the lidar as given
for (const [x, z, g, r] of cells) at.set(`${x},${z}`, { g, r });
const inFp = (x, z) => at.has(`${x},${z}`);
const isPorch = (x, z) => z === 0 && x >= 12 && x <= 14;

// roof tiers: 4 (porch roof) stays on the porch; 17 is the wing; 19 and stray 4s take the majority of their neighbours
const tier = new Map();
for (const [x, z, , r0] of cells) {
  let r;
  if (isPorch(x, z) && r0 === 4) r = 4;
  else if (r0 === 18 || r0 === 20) r = r0;
  else if (r0 === 17) r = 18;
  else {
    let n18 = 0, n20 = 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const n = at.get(`${x + dx},${z + dz}`); if (!n) continue;
      if (n.r === 18) n18++; else if (n.r === 20) n20++;
    }
    r = n20 > n18 ? 20 : 18;
  }
  tier.set(`${x},${z}`, r);
}
const R = (x, z) => tier.get(`${x},${z}`);
const G = (x, z) => at.get(`${x},${z}`).g;

// a cell is facade where a side is open (off the footprint) or lower than it, so the face above the neighbour shows
const DIRS = [["n", 0, -1], ["s", 0, 1], ["w", -1, 0], ["e", 1, 0]];
const faces = (x, z) => DIRS.filter(([, dx, dz]) => !inFp(x + dx, z + dz) || R(x + dx, z + dz) < R(x, z)).map(d => d[0]);

// the plan: "x,y,z" -> { block, state, pane }; block null is the air gap behind a window
const plan = new Map();
const put = (x, y, z, block, extra = {}) => plan.set(`${x},${y},${z}`, { block, ...extra });
const cellList = [...tier.keys()].map(k => k.split(",").map(Number));

// 1. foundation under the cells that sit on a slope, and the facade of every exposed cell
for (const [x, z] of cellList) {
  const g = G(x, z), r = R(x, z), fs = faces(x, z);
  for (let y = 0; y < g; y++) put(x, y, z, FOUNDATION);
  if (fs.length === 0) continue;
  for (let y = g; y < r; y++) {
    const k = y - g;
    if (y === r - 1 || k === 0 || SPANDREL.has(k)) { put(x, y, z, BAND); continue; }
    if (!WINDOW.has(k)) { put(x, y, z, LIMESTONE); continue; }
    // window rows
    if (isPorch(x, z)) {
      if (x === 13) continue;                                        // the vestibule is open air
      put(x, y, z, LIMESTONE); continue;                              // porch columns
    }
    if (x === 13 && z === 1 && (k === 1 || k === 2)) {               // the entrance door, centred on the north front
      put(x, y, z, "iron_door", { state: { facing: "north", half: k === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } });
      continue;
    }
    const piered = fs.includes("n") || fs.includes("s") ? x % 3 === 0 : z % 3 === 0;
    if (piered) put(x, y, z, LIMESTONE);
    else put(x, y, z, GLASS, { pane: fs.includes("n") || fs.includes("s") ? "x" : "z" });
  }
}

// 2. the core: solid under every storey, the roof surface on top, and one air cell behind each window
for (const [x, z] of cellList) {
  const g = G(x, z), r = R(x, z);
  if (faces(x, z).length) continue;
  for (let y = g; y < r; y++) {
    const k = y - g;
    if (y === r - 1) { put(x, y, z, ROOF); continue; }
    const behindGlass = WINDOW.has(k) && DIRS.some(([, dx, dz]) => plan.get(`${x + dx},${y},${z + dz}`)?.pane);
    if (behindGlass) put(x, y, z, null, { gap: true });
    else put(x, y, z, CORE);
  }
}

// 3. warm light in some air gaps (lanterns on the floor, glowstone where a window's lower cell has something under it)
for (const [key, e] of plan) {
  if (!e.gap) continue;
  const [x, y, z] = key.split(",").map(Number), k = y - G(x, z);
  if (LANTERN_ROWS.has(k) && (x + z) % 4 === 0) e.block = "lantern", e.state = { hanging: "false", waterlogged: "false" };
  else if (GLOW_ROWS.has(k) && (x * 5 + y * 3) % 11 === 0) e.block = "glowstone", e.gap = false;
}

// 4. the entrance lantern under the porch roof, and a mechanical penthouse on the core's roof
put(13, 2, 0, "lantern", { state: { hanging: "true", waterlogged: "false" } });
for (let z = 7; z <= 10; z++) for (let x = 9; x <= 14; x++) {
  put(x, 20, z, PENTHOUSE); put(x, 21, z, BAND);
}

// 5. glass panes connect to their in-plane neighbours (glass or wall), so each bay reads as one window wall
for (const [key, e] of plan) {
  if (!e.pane) continue;
  const [x, y, z] = key.split(",").map(Number);
  const wall = (dx, dz) => { const n = plan.get(`${x + dx},${y},${z + dz}`); return !!(n && n.block && n.block !== "iron_door"); };
  const state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (e.pane === "x") { state.east = String(wall(1, 0)); state.west = String(wall(-1, 0)); }
  else { state.north = String(wall(0, -1)); state.south = String(wall(0, 1)); }
  e.state = state;
}

const g3 = new Voxels([W, H, D]);
for (const [key, e] of plan) {
  if (!e.block) continue;
  const [x, y, z] = key.split(",").map(Number);
  g3.set(x, y, z, e.block, e.state);
}
const out = g3.save(`${DIR}/DC65249.nbt`);
console.log(JSON.stringify({ wrote: `${DIR}/DC65249.nbt`, ...out }));
