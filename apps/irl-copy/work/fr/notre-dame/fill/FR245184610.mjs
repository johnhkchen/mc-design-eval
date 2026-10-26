// FR245184610: a residential Haussmann-era block (1870, 8 storeys) on the Île de la Cité's edge.
// Cream limestone walls (smooth/cut sandstone stand in for Paris stone), 4-block storeys with a string course,
// two-high glass windows in a 2-and-1 pier rhythm, a stone base course, a cornice and parapet, and roof tiers
// taken from the lidar roof (35 for the body, 31 and 27 for the lower wings), each set as its own stepped mass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184610.cells.json`, "utf8"));

// the lidar roof smoothed into three flat tiers: the body at 35, the lower wings at 31 and 27
function tier(r) { return r >= 33 ? 35 : r >= 29 ? 31 : 27; }

const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { g, top: tier(r) });
const at = (x, z) => cell.get(`${x},${z}`);

// the side this cell faces outward (a missing neighbour, or a neighbour in a lower tier); null for an interior cell
function outward(x, z, c) {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const n = at(x + dx, z + dz);
    if (!n || n.top < c.top) return [dx, dz];
  }
  return null;
}

// corners: exposed on both axes by a missing neighbour (quoined)
const isCorner = (x, z) => (!at(x - 1, z) || !at(x + 1, z)) && (!at(x, z - 1) || !at(x, z + 1));

// storey plates: the string course rows, 4 apart from y=1; the storeys below the cornice (top-2)
const plates = (T) => [1, 5, 9, 13, 17, 21, 25, 29].filter((p) => p < T - 2);

// the main entrance: the south-most row, the cell nearest x=12 (centre of the street front)
let zMax = -1; for (const k of cell.keys()) zMax = Math.max(zMax, +k.split(",")[1]);
let door = null;
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  if (z !== zMax) continue;
  if (!door || Math.abs(x - 12) < Math.abs(door.x - 12)) door = { x, z };
}

// the window cells, so glass panes join their neighbours and glow behind them
const windows = new Set();
const glassState = (x, y, z) => ({
  north: windows.has(`${x},${y},${z - 1}`) ? "true" : "false",
  south: windows.has(`${x},${y},${z + 1}`) ? "true" : "false",
  east: windows.has(`${x + 1},${y},${z}`) ? "true" : "false",
  west: windows.has(`${x - 1},${y},${z}`) ? "true" : "false",
  waterlogged: "false",
});

const H = 51;
const g = new Voxels([25, H, 23]);
const lights = [];

// pass 1: which cells are windows (decided per cell, not per block, so panes connect coherently)
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const out = outward(x, z, c);
  if (!out || isCorner(x, z)) continue;
  if ((x + z) % 3 === 0) continue; // piers
  if (Math.abs(x - door.x) <= 1 && z === door.z) continue; // the entrance and its surround
  for (const p of plates(c.top)) {
    windows.add(`${x},${p + 1},${z}`); windows.add(`${x},${p + 2},${z}`);
  }
}

// pass 2: the blocks
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const T = c.top, P = plates(T), out = outward(x, z, c);
  const exposed = out !== null, corner = isCorner(x, z), winCol = (x + z) % 3 !== 0;
  for (let y = 0; y < T; y++) {
    let block = null, state;
    if (y === 0) block = "stone_bricks";                              // base course / foundation
    else if (y === T - 1) block = exposed ? "smooth_sandstone" : "deepslate_tiles"; // parapet / roof covering
    else if (y === T - 2) block = exposed ? "cut_sandstone" : "smooth_sandstone";   // cornice / deck
    else if (P.includes(y)) block = exposed && winCol && !corner ? "cut_sandstone" : "smooth_sandstone"; // string course
    else if (exposed) {
      const p = P.filter((q) => q < y).pop();
      if (p !== undefined && (y === p + 1 || y === p + 2) && winCol && !corner) {
        block = "glass_pane"; state = glassState(x, y, z);
      } else if (p !== undefined && y === p + 3 && winCol && !corner) block = "cut_sandstone"; // lintel
      else block = "smooth_sandstone";                              // pier / sill / spandrel
    }
    if (corner && exposed && y > 0 && y < T - 2 && !P.includes(y)) block = "cut_sandstone"; // quoins
    if (!exposed && !P.includes(y) && y !== 0 && y !== T - 1 && y !== T - 2) block = null; // interior air
    if (block) g.set(x, y, z, block, state);
  }
  // roof equipment: the body's interior gets a few chimney stacks standing on the roof covering
  if (!exposed && T === 35 && (x * 7 + z * 5) % 61 === 0) {
    g.set(x, 35, z, "bricks"); g.set(x, 36, z, "bricks");
  }
}

// the entrance: a stone surround and a double-high door in the centre of the south front
{
  const { x, z } = door;
  g.set(x, 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, 3, z, "cut_sandstone");
  g.set(x, 4, z, "cut_sandstone");
  g.set(x - 1, 2, z, "cut_sandstone"); g.set(x + 1, 2, z, "cut_sandstone");
}

// warm lights: some windows get a glowstone in the room behind the glass, standing on that floor's plate
for (const key of windows) {
  const [x, y, z] = key.split(",").map(Number);
  if ((x * 5 + z * 3 + y) % 23 !== 0) continue;
  const c = at(x, z); if (!c) continue;
  const out = outward(x, z, c); if (!out) continue;
  const ix = x - out[0], iz = z - out[1];
  const inner = at(ix, iz);
  if (!inner || inner.top <= y) continue; // a room behind the glass, standing on its floor
  g.set(ix, y, iz, "glowstone");
  lights.push([ix, y, iz]);
}

const res = g.save(`${DIR}/FR245184610.nbt`);
console.log(`built FR245184610: ${res.blocks} blocks, palette ${res.palette}, ${cell.size} footprint cells, ${lights.length} lit windows`);
