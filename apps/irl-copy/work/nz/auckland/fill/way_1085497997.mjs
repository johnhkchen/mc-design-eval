// The Drake Offices (way 1085497997): a 1970s Auckland concrete-frame office block on a basalt plinth. Four storeys of
// 4 blocks (plinth rows 0-2, a slab row at 3, 7, 11, 15; glazed rows between), a 19-block main roof and 16-block lower
// wings where the lidar has them, tinted glass between white concrete spandrels and grey mullions, air behind the
// glass, a solid slab per storey, a shopfront and a lobby door under a canopy on the downhill side, glowstone in a few offices.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1085497997.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1085497997.nbt";

const MAIN = 19, WING = 16, PLANT = 20, PLINTH = 3;
const SIZE = [34, 33, 33];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// The footprint. The lidar roof is smoothed into two flat tiers: 15-16 is a lower wing, anything else the main roof.
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { g: ground, top: roof <= WING ? WING : MAIN, roof });
const cellAt = (x, z) => fp.get(`${x},${z}`);

// solid: on the footprint and below its top (the foundation counts as solid)
const solid = (x, y, z) => { const c = cellAt(x, z); return !!c && y >= 0 && y < c.top; };
// the outward side at this height: the first horizontal neighbour that is not solid, or null if enclosed
const exposedDir = (x, y, z) => DIRS.find(([dx, dz]) => !solid(x + dx, y, z + dz)) ?? null;

// storey bands: plinth below row 3; then per storey a slab row, two glazed rows, and a head row (the top row is the cap)
const band = (y, top) => {
  if (y < PLINTH) return "plinth";
  if (y === top - 1) return "cap";
  const m = (y - PLINTH) % 4;
  return m === 0 ? "slab" : m === 3 ? "head" : "window";
};
const hash = (x, y, z) => (Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) >>> 0;

// the lobby: the south-facing ground-floor cell nearest the middle of the southernmost facade
const south = cells.filter(([x, z, gr]) => gr <= 4 && exposedDir(x, 4, z)?.[1] === 1);
let lobby = null;
if (south.length) {
  const zMax = Math.max(...south.map(c => c[1]));
  const row = south.filter(c => c[1] === zMax);
  const mx = row.reduce((s, c) => s + c[0], 0) / row.length;
  [lobby] = row.sort((a, b) => Math.abs(a[0] - mx) - Math.abs(b[0] - mx));
}
// the canopy: the lobby cell and its neighbours on the same facade
const canopy = new Set();
if (lobby) {
  const [lx, lz] = lobby;
  for (const dx of [-1, 0, 1]) if (exposedDir(lx + dx, 6, lz)?.[1] === 1) canopy.add(`${lx + dx},${lz}`);
}

const g = new Voxels(SIZE);
const windows = [];   // exposed glazed cells, for the air behind them
for (const [x, z] of cells) {
  const c = cellAt(x, z);
  for (let y = 0; y < c.top; y++) {
    const d = exposedDir(x, y, z);
    if (!d) { g.set(x, y, z, y < PLINTH ? "stone" : "light_gray_concrete"); continue; }   // core: solid, slab per storey
    if (y < c.g) { g.set(x, y, z, "polished_basalt"); continue; }                         // exposed foundation: plinth
    const [dx, dz] = d;
    if (lobby && x === lobby[0] && z === lobby[1] && (y === 4 || y === 5)) {
      g.set(x, y, z, "iron_door", { facing: FACING[`${dx},${dz}`], half: y === 4 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (canopy.has(`${x},${z}`) && y === 6) { g.set(x, y, z, "smooth_stone"); continue; }
    const kind = band(y, c.top);
    if (kind === "plinth") { g.set(x, y, z, "polished_basalt"); continue; }
    if (kind !== "window") { g.set(x, y, z, "white_concrete"); continue; }
    const along = dx ? z : x;
    if (along % 3 === 0) { g.set(x, y, z, "gray_concrete"); continue; }                  // mullion every third cell
    const ground = y <= 5;
    g.set(x, y, z, !ground && hash(x, y, z) % 6 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");
    windows.push([x, y, z, dx, dz]);
  }
}

// air behind the glass: the cell just inside a glazed cell is hollow (one block deep, bounded by slabs), and a few
// offices hold a glowstone; the lobby is hollow behind its door
for (const [x, y, z, dx, dz] of windows) {
  const nx = x - dx, nz = z - dz;
  if (!cellAt(nx, nz) || exposedDir(nx, y, nz)) continue;   // a thin wall has nothing behind the glass
  if (hash(x, y, z) % 9 === 0) g.set(nx, y, nz, "glowstone");
  else g.set(nx, y, nz, "air");
}
if (lobby) {
  const [lx, lz] = lobby;
  for (const y of [4, 5]) if (cellAt(lx, lz - 1) && !exposedDir(lx, y, lz - 1)) g.set(lx, y, lz - 1, "air");
}

// roof plant: where the lidar reads 20 (one block over the main roof) on a cell that is not on the edge, and only in
// clusters of at least three such cells (single lidar-noise cells would read as stray blocks)
const plantCand = new Set(cells.filter(([x, z, , roof]) => roof === PLANT && !exposedDir(x, MAIN - 1, z)).map(([x, z]) => `${x},${z}`));
for (const k of plantCand) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS.filter(([dx, dz]) => plantCand.has(`${x + dx},${z + dz}`)).length >= 2) g.set(x, MAIN, z, "gray_concrete");
}

const stats = g.save(OUT);
console.log(`way_1085497997: ${stats.blocks} blocks, palette ${stats.palette}, lobby ${lobby ? lobby.join(",") : "none"}`);
