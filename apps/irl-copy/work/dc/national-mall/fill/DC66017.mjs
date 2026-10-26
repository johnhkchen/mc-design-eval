// DC66017: 1111 19th St NW, a 1970s precast-and-glass office block (Commercial-Office-Large), on the Mall's
// Foggy Bottom edge. A 17-block podium of ten 2-block storeys (white piers, light-blue glass, pale spandrels) with a
// 20-block tower set back in the middle, a granite base course, a glazed lobby and a door on the south face, and
// rooftop plant on both roofs. Walls are one cell thick with a one-cell air gap behind the glass; everything else
// is solid core, and every floor slab sits on the core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const rows = JSON.parse(readFileSync(`${DIR}/DC66017.cells.json`, "utf8"));

const W = 23, D = 18, Y = 32;

const PIER = "white_concrete";
const SPANDREL = "light_gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const BASE = "polished_granite";
const FILL = "stone";
const CORNICE = "polished_andesite";
const ROOF = "smooth_stone";
const CORE = "light_gray_concrete";
const PLANT = "iron_block";
const LIGHT = "glowstone";

// roof values cluster at 17 (podium) and 20 (tower); smooth the lidar noise into those two tiers
const cells = new Map();
for (const [x, z, g, roof] of rows) cells.set(`${x},${z}`, { g, H: roof >= 19 ? 20 : 17 });
const cellAt = (x, z) => cells.get(`${x},${z}`);
// a lone podium-height cell inside the tower is lidar noise: it reads as a slot in the tower, so it takes the tower's top
for (const [key, c] of cells) {
  const [x, z] = key.split(",").map(Number);
  const tall = [[0, -1], [0, 1], [1, 0], [-1, 0]].filter(([dx, dz]) => cellAt(x + dx, z + dz)?.H === 20).length;
  if (c.H === 17 && tall >= 3) c.H = 20;
}
// the entrance sits in the middle of the south face (the cells at z = D-1 run x 0..10)
const southCells = [...cells.keys()].filter(k => k.endsWith(`,${D - 1}`)).map(k => Number(k.split(",")[0]));
const DOOR_X = Math.round((Math.min(...southCells) + Math.max(...southCells)) / 2);
const DIRS = [[0, -1, "N"], [0, 1, "S"], [1, 0, "E"], [-1, 0, "W"]];

// faces of a column at row y that look out: off the footprint, or onto a neighbour that stops below y
function exposed(x, z, y) {
  return DIRS.filter(([dx, dz]) => { const n = cellAt(x + dx, z + dz); return !n || n.H <= y; }).map(d => d[2]);
}

// what a column's wall is at row y (null if the row is not an exterior wall)
function wallOf(x, z, y) {
  const c = cellAt(x, z); if (!c || y < c.g || y >= c.H - 1) return null;
  const faces = exposed(x, z, y); if (!faces.length) return null;
  const rel = y - c.g;
  const alongX = faces.includes("N") || faces.includes("S");
  const alongZ = faces.includes("E") || faces.includes("W");
  const pos = alongX ? x : z;
  const corner = alongX && alongZ;
  const onSouth = faces.includes("S");
  if (rel === 0) return { type: "base" };
  if (onSouth && rel === 3 && Math.abs(x - DOOR_X) <= 1) return { type: "base" };   // the entrance canopy, flush
  if (corner || pos % 3 === 0) return { type: "pier" };
  if (rel <= 2) {
    if (onSouth && x === DOOR_X && rel >= 1) return { type: "door", half: rel === 1 ? "lower" : "upper" };
    return { type: "glass", axis: alongX ? "x" : "z" };
  }
  if (rel % 2 === 1) return { type: "spandrel" };
  return { type: "glass", axis: alongX ? "x" : "z" };
}

function paneState(axis) {
  return axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

const g = new Voxels([W, Y, D]);

// the cells of the footprint, column by column, row by row
for (const [key, c] of cells) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.H; y++) {
    if (y < c.g) { g.set(x, y, z, FILL); continue; }                              // foundation up to the ground
    if (y === c.H - 1) {                                                          // the top course: cornice or roof
      if (exposed(x, z, y).length) g.set(x, y, z, CORNICE); else g.set(x, y, z, ROOF);
      continue;
    }
    const w = wallOf(x, z, y);
    if (w) {
      if (w.type === "base") g.set(x, y, z, BASE);
      else if (w.type === "pier") g.set(x, y, z, PIER);
      else if (w.type === "spandrel") g.set(x, y, z, SPANDREL);
      else if (w.type === "glass") g.set(x, y, z, GLASS, paneState(w.axis));
      else if (w.type === "door") g.set(x, y, z, "iron_door", { facing: "south", half: w.half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    // behind a window or the lobby door is the air gap (a lamp here and there); otherwise solid core
    const behindGlass = [[0, -1], [0, 1], [1, 0], [-1, 0]].some(([dx, dz]) => {
      const n = cellAt(x + dx, z + dz); if (!n || y < n.g || y >= n.H - 1) return false;
      const w = wallOf(x + dx, z + dz, y); return w && (w.type === "glass" || w.type === "door");
    });
    if (behindGlass) {
      if ((x * 7 + z * 13 + y * 3) % 9 === 0) g.set(x, y, z, LIGHT);
      continue;
    }
    g.set(x, y, z, CORE);
  }
}

// rooftop plant: two units on the podium roof, one on the tower roof
for (const [x, z] of [[5, 2], [6, 2], [16, 2], [17, 2]]) {
  const c = cellAt(x, z); if (c && c.H === 17) g.set(x, 17, z, PLANT);
}
for (const [x, z] of [[7, 6], [8, 6], [7, 7], [8, 7], [12, 9], [13, 9]]) {
  const c = cellAt(x, z); if (c && c.H === 20) g.set(x, 20, z, PLANT);
}

g.save(`${DIR}/DC66017.nbt`);
