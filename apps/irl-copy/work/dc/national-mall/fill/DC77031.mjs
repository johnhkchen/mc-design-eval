// 1550 7th St NW: a four-storey red-brick walk-up apartment block (c. 1910-1925 DC, calcite string courses, polished
// granite plinth, stone cornice) on the lidar's stepped massing: a 12-block body, 9-block (three-storey) wings at the
// north and south ends and on the west flank, 3-block one-storey bays at the north-west corner, and a 14-block
// penthouse set back two cells in from every edge. Storeys are 3 blocks: a calcite band, then two window rows.
// Every column is solid from y 0 to its top, so nothing floats; the interior window rows are air (no rooms), with a
// floor band per storey. Street front is the west face; the entrance is a recessed door in the three-storey wing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC77031.cells.json`, "utf8"));

const W = 13, H = 17, D = 59;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const roofAt = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const inFp = (x, z) => roofAt.has(key(x, z));
const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// ---- inward distance: 0 on the footprint's edge, 1 one cell in, ... (multi-source BFS from the outside) ----
const inward = new Map();
const queue = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (DIRS4.some(([dx, dz]) => !inFp(x + dx, z + dz))) { inward.set(key(x, z), 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = inward.get(key(x, z));
  for (const [dx, dz] of DIRS4) {
    const k = key(x + dx, z + dz);
    if (inFp(x + dx, z + dz) && !inward.has(k)) { inward.set(k, d + 1); queue.push([x + dx, z + dz]); }
  }
}

// ---- massing: 3x3 median of the lidar roof, snapped to storey tiers (3, 9, 12 and a 14 penthouse) ----
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const smoothRoof = (x, z) => {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) near.push(roofAt.get(key(x + dx, z + dz)));
  return median(near);
};
const TIER = (m, d) => (m <= 4 ? 3 : m <= 10.5 ? 9 : m <= 12.5 ? 12 : d >= 2 ? 14 : 12);   // the penthouse is set back 2 in
const top = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) top.set(key(x, z), TIER(smoothRoof(x, z), inward.get(key(x, z))));
const T = (x, z) => top.get(key(x, z)) ?? -1;   // -1 = outside the footprint

// Sides on which a cell at row y faces open air: the neighbour is outside the footprint or stands lower than y.
const DIRS = [["W", -1, 0], ["E", 1, 0], ["N", 0, -1], ["S", 0, 1]];
const openSides = (x, z, y) => DIRS.filter(([, dx, dz]) => T(x + dx, z + dz) <= y).map(([d]) => d);

const WALL = "bricks", STRING = "calcite", PLINTH = "polished_granite", CORNICE = "stone_bricks", DECK = "smooth_stone";
const GLASS = "glass_pane";
const panes = new Set();
const pk = (x, y, z) => `${x},${y},${z}`;

// ---- main pass: plinth, storey bands on every third row, two window rows between, cornice on the top row ----
for (const [k, t] of top) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < t; y++) {
    const sides = openSides(x, z, y);
    const ext = sides.length > 0;
    const ew = sides.some((s) => s === "E" || s === "W");
    const ns = sides.some((s) => s === "N" || s === "S");
    if (y === t - 1) { g.set(x, y, z, ext ? CORNICE : DECK); continue; }      // cornice / roof deck
    if (y === 0) { g.set(x, y, z, ext ? PLINTH : "stone"); continue; }        // base course
    if (y % 3 === 0) { g.set(x, y, z, ext ? STRING : "stone"); continue; }    // storey band / floor slab
    if (!ext) continue;                                                        // interior window row: air behind the glass
    const outerCorner = (!inFp(x - 1, z) || !inFp(x + 1, z)) && (!inFp(x, z - 1) || !inFp(x, z + 1));   // a true corner of the footprint
    if (ew && ns && outerCorner) g.set(x, y, z, STRING);                       // quoins; step corners take their face's bays
    else if (ew) {                                                             // long faces: bays of two, brick piers
      if (z % 3 === 0) g.set(x, y, z, WALL);
      else { g.set(x, y, z, GLASS); panes.add(pk(x, y, z)); }
    } else {                                                                   // ends: a bay every other cell
      if (x % 2 === 0) { g.set(x, y, z, GLASS); panes.add(pk(x, y, z)); }
      else g.set(x, y, z, WALL);
    }
  }
}

// ---- glass panes join their neighbours in the same row, so each window reads as a framed grid ----
const isPane = (x, y, z) => panes.has(pk(x, y, z));
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, GLASS, {
    north: String(isPane(x, y, z - 1)), south: String(isPane(x, y, z + 1)),
    east: String(isPane(x + 1, y, z)), west: String(isPane(x - 1, y, z)), waterlogged: "false",
  });
}

// ---- warm light: a glowstone two cells in, behind some window bays (one air cell between glass and lamp) ----
let lamps = 0;
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  if (y % 3 !== 1 || z % 4 !== 1) continue;                                 // the lower window row, standing on its band
  const sides = openSides(x, z, y);
  const [ix, iz] = sides.includes("W") ? [2, 0] : sides.includes("E") ? [-2, 0] : sides.includes("N") ? [0, 2] : sides.includes("S") ? [0, -2] : [0, 0];
  if (!ix && !iz) continue;
  const lx = x + ix, lz = z + iz;
  if (T(lx, lz) > y && g.val(lx, y, lz) === 0) { g.set(lx, y, lz, "glowstone"); lamps++; }
}

// ---- entrance: a recessed door in the west face's three-storey wing, a brick reveal either side, a lantern inside ----
for (const z of [41, 43]) { g.set(0, 1, z, WALL); g.set(0, 2, z, WALL); }
g.set(0, 1, 42, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(0, 2, 42, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(1, 2, 42, "lantern", { hanging: "true", waterlogged: "false" });

// ---- roof equipment: 2x2 plant boxes and a brick flue on the 12-block roof, set well in from the edges ----
const roofFits = (x, z, n) => { for (let dx = 0; dx < n; dx++) for (let dz = 0; dz < n; dz++) if (T(x + dx, z + dz) !== 12 || (inward.get(key(x + dx, z + dz)) ?? 0) < 2) return false; return true; };
const boxes = [];
for (let z = 6; z < 56 && boxes.length < 3; z++) for (let x = 0; x < 12 && boxes.length < 3; x++) {
  if (!roofFits(x, z, 2) || boxes.some(([bx, bz]) => Math.abs(bz - z) < 10)) continue;
  boxes.push([x, z]);
}
for (const [bx, bz] of boxes) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) g.set(bx + dx, 12, bz + dz, "light_gray_concrete");
let flue = null;
for (let z = 30; z < 58 && !flue; z++) for (let x = 0; x < 12 && !flue; x++) if (roofFits(x, z, 1) && boxes.every(([bx, bz]) => Math.abs(bx - x) > 2 || Math.abs(bz - z) > 2)) flue = [x, z];
if (flue) {
  const [fx, fz] = flue;
  g.set(fx, 12, fz, WALL); g.set(fx, 13, fz, WALL); g.set(fx, 14, fz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/DC77031.nbt`);
const tiers = {};
for (const t of top.values()) tiers[t] = (tiers[t] ?? 0) + 1;
console.log(JSON.stringify({ cells: cells.length, tiers, panes: panes.size, lamps, boxes, flue, blocks: g.count(), palette: g.palette.length - 1 }));
