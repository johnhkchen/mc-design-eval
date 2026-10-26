import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1627 16th St NW, Hotel-Small: a 1920s brick hotel on a stone base, the 16th St street face (z = 0) with a recessed
// lobby, a limestone string course every two blocks, and a 9-block core that steps up at the back, over the courtyard.
// The lidar roof record (7 over the wings, 8 along the front, 9 over the core) is read as three flat tiers.
// Storeys are 3-block modules: the shop row and the window row sit between calcite string courses at y 3 and y 6.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC62510.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const W = 14, D = 4, Y = 21;
const g = new Voxels([W, Y, D]);

// the footprint, with the roof smoothed into tiers: [z][x] roof tops (lidar noise folded to 7 / 8 / 9)
const TIER = [
  [7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 7, 7, 7, 7],
  [7, 7, 7, 7, 7, 7, 7, 9, 9, 8, 7, 7, 7, 7],
  [7, 7, 7, 7, 7, 7, 7, 9, 9, 8, 7, 7, 7, 7],
  [7, 7, 7, 7, 7, null, null, null, null, null, 7, 7, 7, 7],
];
const cell = new Map(); // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { ground, roof: TIER[z][x] });
const at = (x, z) => cell.get(`${x},${z}`);
// a perimeter cell: some side of it faces outside the footprint (the courtyard's back face at z 2 counts)
const ring = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !at(x + dx, z + dz));
// a bay: piers at x 0, 3, 6, 9, 12 and 13, glass pairs between
const bay = (x) => x > 0 && x < 13 && x % 3 !== 0;
const pane = (onZ) => (onZ ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" });
const door = (y) => ({ id: "dark_oak_door", state: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } });
const LANTERN = { hanging: "false", waterlogged: "false" };

// the air gap behind a lit window: the lower pane of the shop row (y 1) and of the window row (y 4), one cell in
// from the street face. Only a single empty row, so every slab has solid under it.
const gap = (x, y, z) => z === 1 && (y === 1 || y === 4) && bay(x) && x >= 1 && x <= 12;

// what each cell holds, or null for air
function block(x, y, z) {
  const c = at(x, z);
  if (!c) return null;
  const top = c.roof - 1; // the cornice (or roof deck) is the top row
  if (y < 0 || y > top) return null;
  const edge = ring(x, z);
  if (y === top) return { id: edge ? "calcite" : "deepslate_tiles" }; // the limestone parapet, and a dark tar roof deck
  if (!edge) return gap(x, y, z) ? null : { id: y % 3 === 0 ? "smooth_stone" : "bricks" };
  if (y === 0) return { id: "stone_bricks" }; // base course
  if (y === 3 && z === 0 && x >= 5 && x <= 7) return { id: "dark_oak_planks" }; // the lobby canopy over the entry
  if (y % 3 === 0) return { id: "calcite" }; // string courses at 3 and 6
  return facade(x, y, z);
}

// a perimeter cell: piers and corners in brick and limestone, the street face's shop and entry, and glass between
function facade(x, y, z) {
  if ((x === 0 || x === 13) && (z === 0 || z === 3)) return { id: "calcite" }; // corner quoins
  const onZ = !at(x, z - 1) || !at(x, z + 1); // a face along x: street, back or courtyard; else an end wall
  if (onZ && z === 0 && y <= 2) { // the street face at ground: a shop row with a lobby door in the middle
    if (x === 5 || x === 7) return { id: "calcite" };
    if (x === 6) return door(y);
  }
  const glass = onZ ? bay(x) : z === 1 || z === 2;
  return glass ? { id: "glass_pane", state: pane(onZ) } : { id: "bricks" };
}

// the ground: solid from y 0 up to each cell's ground, so nothing floats on the slope
for (const [x, z, ground] of cells) for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

const lights = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y < Y; y++) {
  if (!at(x, z)) continue;
  const b = block(x, y, z);
  if (b) g.set(x, y, z, b.id, b.state);
  else if (gap(x, y, z)) lights.push([x, y, z]);
}

// warm light: a lantern or a glowstone in some of the gaps behind the glass
const LAMPS = { "2,4": "lantern", "11,4": "lantern", "8,4": "shroomlight", "2,1": "glowstone", "10,1": "glowstone", "7,1": "lantern" };
for (const [x, y, z] of lights) {
  const id = LAMPS[`${x},${y}`];
  if (!id) continue;
  g.set(x, y, z, id, id === "lantern" ? LANTERN : undefined);
}

// rooftop plant: two condenser boxes on the wings' deck, one row above it, each on the roof deck
for (const [x, z] of [[2, 1], [11, 2]]) g.set(x, 7, z, "iron_block");

// checks: nothing hangs in the air, and the built top follows the lidar roof record
const hanging = [];
for (let y = 1; y < Y; y++) for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (g.get(x, y, z) && !g.get(x, y - 1, z)) hanging.push([x, y, z]);
let sum = 0, worst = 0;
for (const [x, z, , roof] of cells) {
  let top = 0;
  for (let y = 0; y < Y; y++) if (g.get(x, y, z)) top = y + 1;
  sum += top - roof; worst = Math.max(worst, Math.abs(top - roof));
}
const r = g.save(`${DIR}/DC62510.nbt`);
console.log({ ...r, hanging: hanging.length, hangingAt: hanging.slice(0, 8), meanTopMinusRoof: (sum / cells.length).toFixed(2), worstAbsTopMinusRoof: worst, lamps: lights.filter(([x, y]) => LAMPS[`${x},${y}`]).length });
