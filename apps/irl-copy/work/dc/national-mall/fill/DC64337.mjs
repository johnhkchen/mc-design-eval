// 1900 Q Street NW: a 1920s brick office block with a limestone base, string courses and cornice, three storeys
// on the 8-block main body and a fourth storey on the 9-block bay that rises over the Q Street frontage. The low
// wings are one storey with a coping. Footprint and roof come from the lidar cells; ground from the third number.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64337.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64337.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const column = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, ground, roof }]));
const at = (x, z) => column.get(`${x},${z}`);
// a column is solid up to its roof; a cell outside the footprint is air
const solid = (x, y, z) => { const c = at(x, z); return !!c && y < c.roof; };
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// Storey rows: windows on odd rows (1, 3, 5, and 7 on the tall bay), limestone string courses on 2, 4, 6;
// the top row of a column is its cornice (or the coping of a one-storey wing).
const BAND = (y) => y === 2 || y === 4 || y === 6;
const LIGHT_X = [4, 7, 10, 13];           // interior bays lit one cell behind the south glass (air gap kept)

function role(c, y) {
  if (y < c.ground) return "found";
  if (y === c.roof - 1) return c.roof === 2 ? "wingtop" : "cap";
  if (BAND(y)) return "band";
  return "win";
}

// which sides of a cell at height y face outside the building (their neighbour column has no solid there)
function exposed(x, y, z) {
  const out = {};
  for (const [side, [dx, dz]] of Object.entries(DIRS)) out[side] = !solid(x + dx, y, z + dz);
  out.ns = out.north || out.south;
  out.ew = out.west || out.east;
  return out;
}

// a glass pane joins its in-plane neighbours (the facade it sits in), so the grid reads as one wall
function pane(x, y, z, ns) {
  const join = (dx, dz) => (solid(x + dx, y, z + dz) ? "true" : "false");
  return ns
    ? { north: "false", south: "false", east: join(1, 0), west: join(-1, 0), waterlogged: "false" }
    : { north: join(0, -1), south: join(0, 1), east: "false", west: "false", waterlogged: "false" };
}

const v = new Voxels([17, 21, 6]);

for (const c of cells.map(([x, z]) => at(x, z))) {
  for (let y = 0; y < c.roof; y++) {
    const r = role(c, y);
    if (r === "found") { v.set(c.x, y, c.z, "stone_bricks"); continue; }
    // limestone: the first-floor string course and the cornice; brick spandrels between the storeys
    if (r === "cap") { v.set(c.x, y, c.z, "calcite"); continue; }
    if (r === "band") { v.set(c.x, y, c.z, y === 2 ? "calcite" : "bricks"); continue; }

    // a window storey: interior is air (or a floor where the cell is the low wing's roof)
    const f = exposed(c.x, y, c.z);
    const ground = y <= 1;
    if (!f.ns && !f.ew) {
      if (r === "wingtop") v.set(c.x, y, c.z, "bricks");
      else if (c.z === 3 && LIGHT_X.includes(c.x)) v.set(c.x, y, c.z, c.x === 10 && y === 5 ? "shroomlight" : "glowstone");
      continue;
    }
    if (f.ns && f.ew) { v.set(c.x, y, c.z, "calcite"); continue; }   // corner quoin
    const along = f.ns ? c.x : c.z;
    if (along % 3 === 0) v.set(c.x, y, c.z, ground ? "stone_bricks" : "bricks");   // pier
    else v.set(c.x, y, c.z, "glass_pane", pane(c.x, y, c.z, f.ns));
  }
}

// Coping: a stone slab on every column top that stands above a lower neighbour or the outside (roof edge only)
for (const c of cells.map(([x, z]) => at(x, z))) {
  const edge = Object.values(DIRS).some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.roof < c.roof; });
  if (edge) v.set(c.x, c.roof, c.z, "stone_brick_slab", { type: "bottom" });
}

// Q Street entrance on the south face: a door in a calcite surround under a canopy
const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
v.set(3, 1, 5, "dark_oak_door", door("lower"));
v.set(3, 2, 5, "dark_oak_door", door("upper"));
for (const x of [2, 4]) v.set(x, 1, 5, "calcite");
for (const x of [2, 3, 4]) v.set(x, 3, 5, "black_concrete");

// Roof plant on the cornice, set back from the parapet
v.set(3, 8, 2, "smooth_stone");
v.set(4, 8, 2, "smooth_stone");
v.set(7, 9, 4, "smooth_stone");
v.set(8, 9, 4, "smooth_stone");

const info = v.save(OUT);
console.log(JSON.stringify(info));
