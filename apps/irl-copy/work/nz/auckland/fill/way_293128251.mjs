// Hotel Grand Chancellor, Auckland CBD: a 1980s concrete-frame hotel, about 16 storeys of white cladding and
// tinted blue glazing on a stone base. Solid core (no rooms), a glazed shell with a one-block air gap behind the glass,
// a floor line every 4 blocks, and the lidar roof smoothed into storey-quantized tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293128251.cells.json", "utf8"));
const W = 80, D = 53, H = 84;

const WIN = "light_blue_stained_glass", MULL = "white_concrete", CLAD = "white_concrete", SLAB = "light_gray_concrete";
const CORE = "light_gray_concrete", BASE = "stone_bricks", CORN = "smooth_stone", ROOFCAP = "gray_concrete";
const HVAC = "light_gray_concrete", DOOR = "dark_oak_door", LAMP = "glowstone", LANTERN = "lantern";

// footprint cells by (x, z)
const byXZ = new Map();
const cell = (x, z) => byXZ.get(z * W + x);
for (const [x, z, ground, roof] of cells) byXZ.set(z * W + x, { x, z, ground, roof });
const list = [...byXZ.values()];

// roof tiers: the lidar's 5x5 median over the footprint (kills stair-step noise), then rounded to whole storeys (4 blocks)
for (const c of list) {
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = cell(c.x + dx, c.z + dz); if (n) vals.push(n.roof); }
  vals.sort((a, b) => a - b);
  const m = vals[vals.length >> 1];
  c.top = Math.max(Math.round(m / 4) * 4, c.ground + 4, 8);
}
const maxTop = Math.max(...list.map((c) => c.top));

// shell: any side that faces outside the footprint or onto a lower tier; the outward direction is kept for the glass
const DIRS = [{ dx: 0, dz: -1, name: "north" }, { dx: 0, dz: 1, name: "south" }, { dx: -1, dz: 0, name: "west" }, { dx: 1, dz: 0, name: "east" }];
for (const c of list) {
  c.exp = DIRS.filter(({ dx, dz }) => { const n = cell(c.x + dx, c.z + dz); return !n || n.top < c.top; });
  c.facade = c.exp.length > 0;
}

// the blocks, cell by cell, column by column
const blocks = new Map();   // "x,y,z" -> [block, state]
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, [block, state]);
const del = (x, y, z) => blocks.set(`${x},${y},${z}`, null);

for (const c of list) {
  for (let y = 0; y < c.top; y++) {
    let b;
    if (y < c.ground) b = BASE;                       // foundation under the slope
    else if (y === c.top - 1) b = c.facade ? CORN : ROOFCAP;
    else if (!c.facade) b = CORE;
    else if (y === c.top - 2) b = BASE;             // a stone string course under the parapet: the cornice
    else {
      const r = y % 4, base = y < 4 ? BASE : SLAB, spandrel = y < 4 ? SLAB : CLAD;
      if (r === 0) b = base;                          // base course (ground) or floor line
      else if (r === 3) b = spandrel;                 // fascia or spandrel
      else b = (c.x + c.z) % 3 === 0 ? MULL : WIN;    // glass in three, mullion every third cell
    }
    put(c.x, y, c.z, b);
  }
}

// air gap behind the glass: the inner neighbour of a glazed cell is left open for the two window rows, with a lamp in one
// window in six; the core above and below keeps every gap supported
for (const c of list) {
  if (!c.facade) continue;
  const d = c.exp[0];
  const inn = cell(c.x - d.dx, c.z - d.dz);
  if (!inn || inn.facade) continue;
  for (let y = c.ground; y < c.top - 1; y++) {
    const r = y % 4;
    if (r !== 1 && r !== 2) continue;
    if (((c.x + c.z) % 3) === 0) continue;         // a mullion, not glass
    if (y < inn.ground || inn.top <= y - r + 3) continue;
    const lit = ((c.x * 73 + y * 37 + c.z * 19) % 6) === 0;
    if (lit) put(inn.x, y, inn.z, LAMP); else del(inn.x, y, inn.z);
  }
}

// entrance: the main door is on the north face (or south if there is no north face), at the centre of its run
const facesOut = (side) => list.filter((c) => c.facade && c.exp.some((e) => e.name === side));
let doorSide = "north";
let doorCands = facesOut("north");
if (!doorCands.length) { doorSide = "south"; doorCands = facesOut("south"); }
if (doorCands.length) {
  const xMean = doorCands.reduce((s, c) => s + c.x, 0) / doorCands.length;
  const door = doorCands.reduce((best, c) => (Math.abs(c.x - xMean) < Math.abs(best.x - xMean) ? c : best));
  const d = door.exp.find((e) => e.name === doorSide);
  const inn = cell(door.x - d.dx, door.z - d.dz);
  const yLow = Math.max(1, door.ground), yUp = yLow + 1;
  put(door.x, yLow, door.z, DOOR, { facing: doorSide, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(door.x, yUp, door.z, DOOR, { facing: doorSide, half: "upper", hinge: "left", open: "false", powered: "false" });
  if (inn && !inn.facade) { del(inn.x, yLow, inn.z); del(inn.x, yUp, inn.z); }
}

// roof: plant boxes on the highest tier, lanterns along its cornice
for (const c of list) {
  if (c.top !== maxTop) continue;
  if (c.x % 10 >= 3 && c.x % 10 <= 4 && c.z % 8 >= 2 && c.z % 8 <= 3) {
    put(c.x, c.top, c.z, HVAC); put(c.x, c.top + 1, c.z, HVAC);
  } else if (c.facade && (c.x + c.z) % 12 === 0) {
    put(c.x, c.top, c.z, LANTERN, { hanging: "false", waterlogged: "false" });
  }
}

// write the volume
const g = new Voxels([W, H, D]);
for (const [k, v] of blocks) {
  if (!v) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v[0], v[1]);
}
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293128251.nbt");
console.log(`cells ${list.length}, roof max ${maxTop}, facade ${list.filter((c) => c.facade).length}, blocks ${stats.blocks}, palette ${stats.palette}`);
