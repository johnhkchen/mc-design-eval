// A mid-century reinforced-concrete commercial block (1960s–70s, Mt Eden / Eden Terrace). Three tiers from the lidar roof:
// wings to y 20, a middle tier to y 24, a core to y 26 with a parapet. Each column stands on its own ground (foundation
// to y 0..ground), has floor slabs every 4 blocks, a 1-block shell with glazing in aluminium-style piers, and air behind.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_451530301.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/way_451530301.nbt`;

// quantised tiers: lidar 20–21 → wings at 20; 22–23 → middle tier at 24; 24–25 → core at 26 (parapet top)
const tierOf = (roof) => (roof <= 21 ? 20 : roof <= 23 ? 24 : 26);
const cell = new Map();   // "x,z" -> { g, T }
for (const [x, z, g, roof] of cells) cell.set(`${x},${z}`, { g, T: tierOf(roof) });
const at = (x, z) => cell.get(`${x},${z}`);

const DIRS = [{ dx: 0, dz: -1 }, { dx: 0, dz: 1 }, { dx: -1, dz: 0 }, { dx: 1, dz: 0 }];   // N S W E
// the faces of a column at height y that are exposed: outside the footprint, or the neighbour's tier stops below y
const exposures = (x, z, y) => DIRS.filter(({ dx, dz }) => { const n = at(x + dx, z + dz); return !n || n.T <= y; });

const W = 33, H = 38, D = 21;
const g = new Voxels([W, H, D]);
const placed = new Map();   // "x,y,z" -> block, so later passes can see what is there
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); placed.set(`${x},${y},${z}`, block); };
const windows = [];         // lower-row windows, for the lights behind the glass

// the east (downhill, street) frontage: a double door at the lowest ground, z 2–3 on the x 32 face
const doorCell = (x, y, z) => x === 32 && (z === 2 || z === 3) && y <= 2;

for (const [key, { g: ground, T }] of cell) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < T; y++) {
    const ex = exposures(x, z, y);
    const ring = ex.length > 0 && y >= ground;
    if (y < ground) { put(x, y, z, "stone_bricks"); continue; }                      // foundation to the ground
    if (y === T - 1 && !ring) { put(x, y, z, "gray_concrete"); continue; }            // roof membrane
    if (!ring) {                                                                      // interior: floor slabs, air between
      if (y === ground || (y % 4 === 0 && y <= T - 3)) put(x, y, z, "smooth_stone");
      continue;
    }
    if (doorCell(x, y, z)) {                                                          // entrance
      if (y === 1) put(x, y, z, "iron_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === 2) put(x, y, z, "iron_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (x === 32 && (z === 2 || z === 3) && y === 3) { put(x, y, z, "stone_bricks"); continue; }  // entrance lintel
    if (y === ground) { put(x, y, z, "polished_andesite"); continue; }                // base course
    if (y === T - 1) { put(x, y, z, "smooth_stone"); continue; }                      // cornice course
    if (T === 26 && y >= 24) { put(x, y, z, "stone_bricks"); continue; }              // core parapet band
    const axisNS = ex.some((e) => e.dz !== 0), axisEW = ex.some((e) => e.dx !== 0);
    const idx = axisNS ? x : z;                                                       // position along the face
    if (axisNS && axisEW) { put(x, y, z, "light_gray_concrete"); continue; }          // corner pier
    if (idx % 4 === 0) { put(x, y, z, "light_gray_concrete"); continue; }             // pier every 4 cells
    const r = y % 4;                                                                  // storey: line, two window rows, spandrel
    if (r === 0) put(x, y, z, "smooth_stone");
    else if (r === 3) put(x, y, z, "white_concrete");
    else if (idx % 4 === 2) put(x, y, z, "iron_bars");                                // mullion in the window
    else {
      put(x, y, z, "light_blue_stained_glass");
      if (r === 1) windows.push({ x, y, z, out: ex[0], idx });
    }
  }
  // parapet on the footprint edge; the roof stands on the cornice below it
  if (DIRS.some(({ dx, dz }) => !at(x + dx, z + dz))) {
    put(x, T, z, "stone_bricks");
  }
}

// warm light just inside some lower-row windows: a glowstone or a standing lantern on the storey floor
for (const { x, y, z, out, idx } of windows) {
  if (idx % 8 !== 1 && idx % 8 !== 5) continue;
  const ix = x - out.dx, iz = z - out.dz, n = at(ix, iz);
  if (!n || n.T <= y || placed.has(`${ix},${y},${iz}`) || !placed.has(`${ix},${y - 1},${iz}`)) continue;
  if (idx % 8 === 1) put(ix, y, iz, "glowstone");
  else put(ix, y, iz, "lantern", { hanging: "false" });
}

// rooftop plant: a 3x3 box on the wing roof, two blocks of iron on the core
for (let x = 4; x <= 6; x++) for (let z = 13; z <= 15; z++) {
  const c = at(x, z);
  if (!c || c.T !== 20 || DIRS.some(({ dx, dz }) => at(x + dx, z + dz)?.T !== 20)) continue;
  put(x, 20, z, "light_gray_concrete"); put(x, 21, z, "light_gray_concrete");
}
for (let x = 14; x <= 16; x++) for (let z = 2; z <= 3; z++) {
  const c = at(x, z);
  if (!c || c.T !== 26 || DIRS.some(({ dx, dz }) => at(x + dx, z + dz)?.T !== 26)) continue;
  put(x, 26, z, "iron_block"); put(x, 27, z, "iron_block");
}

const stats = g.save(OUT);
console.log(`wrote ${OUT}: ${stats.blocks} blocks, palette ${stats.palette}`);
