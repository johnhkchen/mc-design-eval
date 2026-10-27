// A 1930s brick commercial block, five storeys on the Mt Eden side of the CBD: a stone plinth, red brick
// piers and spandrels, quartz string courses on each 4-block storey, shopfronts on the street-level storey, a
// setback ring on the top floor, and a parapet. The lidar tops are snapped to storey lines (4 blocks) and the
// footprint's outer ring is set back one tier. Walls are one block thick with an air gap behind them and
// a floor slab on each storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332241867.cells.json`, "utf8"));
const X = 22, Z = 15, Y = 33;

const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { x, z, g, r });
const at = (x, z) => cell.get(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const list = [...cell.values()];

// 1. smooth the lidar roof over a 3x3 median, then snap to storey lines (multiples of 4), at least one storey above the ground
for (const c of list) {
  const rs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) rs.push(n.r); }
  rs.sort((a, b) => a - b);
  c.med = rs[Math.floor(rs.length / 2)];
}
for (const c of list) {
  let t = Math.round(c.med / 4) * 4;
  t = Math.max(t, Math.ceil((c.g + 4) / 4) * 4);
  c.T = Math.min(20, Math.max(8, t));
}
const outFaces = (c) => Object.entries(DIRS).filter(([, d]) => !at(c.x + d[0], c.z + d[1])).map(([k]) => k);
const isPerim = (c) => outFaces(c).length > 0;
// setback: the outer ring of the top tier steps down one tier
for (const c of list) if (c.T === 20 && isPerim(c)) c.T = 16;

// a wall block is needed where a side faces outdoors or sits above a lower neighbour's roof
const wallNeeded = (c, y) => Object.values(DIRS).some((d) => { const n = at(c.x + d[0], c.z + d[1]); return !n || y >= n.T; });

// 2. the street front is the north (-z) face: the door is the lowest single-face north cell, on a window bay
const northOnly = list.filter((c) => { const o = outFaces(c); return o.length === 1 && o[0] === "north"; });
northOnly.sort((a, b) => a.g - b.g || a.x - b.x);
const doorCell = northOnly.find((c) => c.x % 4 === 2) ?? northOnly[0];

const g = new Voxels([X, Y, Z]);
const glass = [];                                       // pane cells, to set their connections after the grid is built
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);

for (const c of list) {
  const outs = outFaces(c);
  const corner = outs.length > 1;
  const face = outs[0];
  const t = face === "north" || face === "south" ? c.x : c.z;
  const d = face ? DIRS[face] : null;
  for (let y = 0; y < c.T; y++) {
    if (y < c.g) { put(c.x, y, c.z, "stone_bricks"); continue; }                  // foundation under the ground
    if (y === c.T - 1) { put(c.x, y, c.z, outs.length ? "smooth_quartz" : "smooth_stone"); continue; }   // roof, cornice on the edge
    if (!wallNeeded(c, y)) {                                                      // inside: air, a floor slab each storey
      if (y === c.g || y % 4 === 0) put(c.x, y, c.z, "spruce_planks");
      continue;
    }
    if (c === doorCell && (y === c.g || y === c.g + 1)) {                          // entrance
      put(c.x, y, c.z, "oak_door", { facing: "north", half: y === c.g ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (c === doorCell && y === c.g + 2) { put(c.x, y, c.z, "smooth_quartz_slab", { type: "bottom" }); continue; }
    if (y === c.g) { put(c.x, y, c.z, "polished_andesite"); continue; }           // base course
    if (y % 4 === 0) { put(c.x, y, c.z, "smooth_quartz"); continue; }              // string course on each storey line
    if (!d || corner) { put(c.x, y, c.z, "bricks"); continue; }                   // stepped faces and corners: plain brick
    const shop = y < 4 && c.g < 4;                                                // street storey: shopfront glazing
    const winRow = shop || y % 4 === 1 || y % 4 === 2;
    if (winRow && t % 4 !== 0) {
      put(c.x, y, c.z, "glass_pane");
      glass.push({ x: c.x, y, z: c.z, axis: face === "north" || face === "south" ? "x" : "z" });
      // a warm light in some windows, in the air behind the glass
      const inn = at(c.x - d[0], c.z - d[1]);
      if (inn && (c.x * 3 + c.z * 5 + y) % 6 === 0 && y >= inn.g && y < inn.T - 1 && y % 4 !== 0 && !wallNeeded(inn, y)) {
        put(inn.x, y, inn.z, "glowstone");
      }
    } else {
      put(c.x, y, c.z, shop && t % 4 === 0 ? "smooth_quartz" : "bricks");          // piers and spandrels
    }
  }
  // parapet on the outer edge of the roof
  if (outs.length) put(c.x, c.T, c.z, "smooth_quartz_slab", { type: "bottom" });
}

// 3. roof equipment: a few plant boxes on the top tier, standing on the roof
for (const c of list) if (c.T === 20 && !isPerim(c) && (c.x * 7 + c.z * 3) % 11 === 0) {
  put(c.x, 20, c.z, "light_gray_concrete"); put(c.x, 21, c.z, "light_gray_concrete");
}

// 4. pane connections follow the wall beside each pane
const solid = (x, y, z) => g.get(x, y, z) !== null;
for (const p of glass) {
  const { x, y, z } = p;
  const s = p.axis === "x"
    ? { north: "false", south: "false", east: String(solid(x + 1, y, z)), west: String(solid(x - 1, y, z)) }
    : { north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)), east: "false", west: "false" };
  put(x, y, z, "glass_pane", s);
}

const stats = g.save(`${DIR}/way_332241867.nbt`);
console.log(JSON.stringify({ door: [doorCell.x, doorCell.z], cells: list.length, ...stats }));
