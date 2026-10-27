// Way 332241955, Mt Eden / Eden Terrace fringe: a two-storey brick-and-plaster shop block of the 1900s-1920s (Auckland's
// Edwardian commercial row: red brick upper floor with white plaster jambs, sills and lintels, a dark-timber shopfront on a
// stone base, a moulded stone cornice and a parapet). Footprint and heights come from the lidar cells: the roof is one flat
// tier at 10 (the median of the lidar roof heights; the 7-9 cells are edge and lidar noise), with a 1-block stone coping
// above it, so the top of the parapet is 11 blocks above the lowest ground, as the record says.
// Storeys: y 0 base (stone), 1-3 shopfront (glass, dark-oak fascia at 3), 4-7 upper floor, 8 cornice, 9 plaster parapet, 10 coping.
// Interiors are air behind the glass, with a floor slab at y 0 and 4 and the roof deck at 8-9; lanterns sit in some rooms.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241955.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241955.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));    // [x, z, ground, roof] per footprint cell
const X = 28, Y = 23, Z = 17;

const ROOF_TOP = 10;                                     // flat roof tier (lidar median); parapet coping sits on it
const M = {
  found: "stone_bricks", brick: "bricks", plaster: "white_concrete", trim: "stone_bricks", pier: "dark_oak_planks",
  pane: "glass_pane", floor: "oak_planks", deck: "smooth_stone", roof: "gray_concrete", plant: "light_gray_concrete",
};
const DIRS = { E: [1, 0], W: [-1, 0], S: [0, 1], N: [0, -1] };   // +z is south
const DOOR_LOWER = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };
const HOOD = { facing: "south", half: "top", shape: "straight", waterlogged: "false" };

const foot = new Map(cells.map(([x, z, ground]) => [`${x},${z}`, { ground }]));
const inF = (x, z) => foot.has(`${x},${z}`);
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));
const isInterior = (x, z) => inF(x, z) && exposed(x, z).length === 0;

// the plan: every block as data first, so the glass connections can see their neighbours before the volume is written
const plan = new Map();
const k3 = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => plan.set(k3(x, y, z), { x, y, z, block, state });
const at = (x, y, z) => plan.get(k3(x, y, z));

for (const [x, z, ground] of cells) {
  for (let y = 0; y < Math.max(1, ground); y++) put(x, y, z, M.found);      // foundation under the cell, base slab everywhere
  const ex = exposed(x, z);
  if (!ex.length) {                                                          // interior: floor slabs and the roof deck only
    put(x, 4, z, M.floor); put(x, 8, z, M.deck); put(x, 9, z, M.roof);
    continue;
  }
  // the face is the exposed one whose wall runs on longest along the cell (stepped lidar edges expose two faces on
  // every step, so a cell is a corner only where its wall run ends)
  const tangent = (d) => (d === "E" || d === "W" ? [[x, z - 1], [x, z + 1]] : [[x - 1, z], [x + 1, z]]);
  const runOf = (d) => tangent(d).filter(([nx, nz]) => inF(nx, nz) && !inF(nx + DIRS[d][0], nz + DIRS[d][1]));
  const face = ex.reduce((best, d) => (runOf(d).length > runOf(best).length ? d : best), ex[0]);
  const corner = ex.length > 1 && runOf(face).length < 2;
  const u = face === "E" || face === "W" ? z : x;                          // position along the face: 5-block bays
  const p = u % 5;                                                         // 0 pier, 1 and 4 jamb, 2 and 3 glass
  for (let y = 1; y <= 10; y++) {
    let b;
    if (y === 8 || y === 10) b = M.trim;                                   // cornice and coping
    else if (y === 9 || corner) b = M.plaster;                             // parapet band; quoins at the corners
    else if (y === 3) b = M.pier;                                          // dark fascia over the shopfront
    else if (y <= 2) b = p === 0 ? M.pier : M.pane;                        // shopfront: timber piers, glass between
    else if (p === 0) b = M.brick;                                         // upper floor: brick piers
    else if (p === 1 || p === 4) b = M.plaster;                            // window reveals
    else if (y === 5 || y === 6) b = M.pane;                               // the glazing
    else b = M.plaster;                                                    // sill and lintel
    put(x, y, z, b);
  }
  put(x, 0, z, M.found);
}

// the entrance: a dark-oak door in a shopfront bay on the south face, with a timber hood over it
const doorCands = cells.filter(([x, z]) => {
  const ex = exposed(x, z);
  return ex.length === 1 && ex[0] === "S" && (x % 5 === 2 || x % 5 === 3) && isInterior(x, z - 1);
}).map(([x, z]) => [x, z]).sort((a, b) => a[0] - b[0]);
if (doorCands.length) {
  const [dx, dz] = doorCands[Math.floor(doorCands.length / 2)];
  put(dx, 1, dz, "dark_oak_door", DOOR_LOWER);
  put(dx, 2, dz, "dark_oak_door", DOOR_UPPER);
  put(dx, 3, dz, "dark_oak_stairs", HOOD);
}

// warm light in some rooms, set in the air gap a block inside the glass (never against it)
for (const [x, z] of cells) {
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const [dx, dz] = DIRS[ex[0]];
  const u = ex[0] === "E" || ex[0] === "W" ? z : x;
  const ix = x - dx, iz = z - dz;
  if (u % 5 !== 2 || !isInterior(ix, iz) || at(x, 5, z)?.block !== M.pane) continue;
  const bay = Math.floor(u / 5);
  if (bay % 2 === 0) put(ix, 7, iz, "lantern", { hanging: "true", waterlogged: "false" });   // upper rooms, hung from the deck
  else if (at(ix, 0, iz)) put(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" }); // shop floor, standing
}

// rooftop plant: two 2 x 2 x 2 air-conditioning units on the roof, one near each end of the block
const roofPads = cells.map(([x, z]) => [x, z]).filter(([x, z]) =>
  isInterior(x, z) && isInterior(x + 1, z) && isInterior(x, z + 1) && isInterior(x + 1, z + 1));
const nearest = (tx, tz, skip) => roofPads.filter((c) => !skip?.some(([sx, sz]) => Math.abs(sx - c[0]) < 3 && Math.abs(sz - c[1]) < 3))
  .sort((a, b) => Math.hypot(a[0] - tx, a[1] - tz) - Math.hypot(b[0] - tx, b[1] - tz))[0];
const units = [nearest(7, 6), nearest(21, 11, [])].filter(Boolean);
for (const [ux, uz] of units) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) for (let dzz = 0; dzz < 2; dzz++) put(ux + dx, ROOF_TOP + dy, uz + dzz, M.plant);

// glass panes connect to whatever is beside them (not to lanterns), so the grids read as framed windows
const conn = (x, y, z) => { const n = at(x, y, z); return n && n.block !== "lantern" ? "true" : "false"; };

const g = new Voxels([X, Y, Z]);
for (const { x, y, z, block, state } of plan.values()) {
  const st = block === M.pane ? { north: conn(x, y, z - 1), south: conn(x, y, z + 1), east: conn(x + 1, y, z), west: conn(x - 1, y, z) } : state;
  g.set(x, y, z, block, st);
}

// checks: every block above y 0 has a block under it or a block beside it at its own height (no air-hung cells)
let floating = 0;
for (const { x, y, z, block } of plan.values()) {
  if (y === 0 || block === "lantern" && at(x, y, z).state.hanging === "true") continue;
  if (!at(x, y - 1, z) && !at(x + 1, y, z) && !at(x - 1, y, z) && !at(x, y, z + 1) && !at(x, y, z - 1)) floating++;
}
const stats = g.save(OUT);
console.log(JSON.stringify({ ...stats, cells: cells.length, doors: doorCands.length, units: units.length, floating }));
