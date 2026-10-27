// Wellesley Centre: a 1980s Auckland office block on a stone plinth. The lidar reads three tiers: a one-storey wing
// (roof 9) on the low side, a 10-storey body (roof 48) and a 12-storey core (roof 55) rising from its middle. Each
// column is solid from y 0 up to its top tier. The perimeter is a one-block skin of pale precast piers with blue-tinted
// glazing between; behind it is a one-block air gap, and a floor slab every fourth block (y = 8, 12, ...). Storey
// bands: stone base course, glazing, a white fascia. Roof: a parapet and cap on the edges, a plant room and mast on the
// core, and small roof boxes on the body. The main door is on the south face, between stone pilasters.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_130501842.cells.json", "utf8"));

const W = 47, H = 68, D = 40;
const FL0 = 8;                                   // the ground floor line; the plinth runs from y 0 up to it
const K = (x, z) => `${x},${z}`;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Each cell's roof is the median of the lidar roofs in its 5x5 neighbourhood, snapped to four-block storeys.
const raw = new Map();
for (const [x, z, gr, r] of cells) raw.set(K(x, z), { x, z, gr, r });
const medRoof = (x, z) => {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const c = raw.get(K(x + dx, z + dz)); if (c) v.push(c.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const cell = new Map();
for (const c of raw.values()) {
  const r = medRoof(c.x, c.z);
  c.top = r <= 8 ? FL0 : Math.max(FL0 + 4, Math.round(r / 4) * 4);
  cell.set(K(c.x, c.z), c);
}
const at = (x, z) => cell.get(K(x, z));

// A skin cell is an outer wall at height y: its column has a neighbour outside the footprint, or a neighbour whose top is
// at or below y (a setback face).
const skin = (x, z, y) => {
  const c = at(x, z); if (!c || y >= c.top) return false;
  return DIRS.some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.top <= y; });
};
// A gap cell is the air layer just inside the skin; the rest of the column is solid core.
const gapCell = (x, z, y) => {
  const c = at(x, z); if (!c || y < FL0 || y >= c.top || skin(x, z, y)) return false;
  return DIRS.some(([dx, dz]) => skin(x + dx, z + dz, y));
};

// Distance in cells from the footprint edge, for the roof features that need clear roof around them.
const edge = new Map(), queue = [];
for (const c of cell.values()) if (DIRS.some(([dx, dz]) => !at(c.x + dx, c.z + dz))) { edge.set(K(c.x, c.z), 0); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = edge.get(K(c.x, c.z));
  for (const [dx, dz] of DIRS) { const n = at(c.x + dx, c.z + dz); if (n && !edge.has(K(n.x, n.z))) { edge.set(K(n.x, n.z), d + 1); queue.push(n); } }
}
const inner = (x, z, m = 3) => (edge.get(K(x, z)) ?? 0) >= m;

// The main door: a skin cell on the south face, nearest the middle of the footprint.
const door = [...cell.values()]
  .filter(c => !at(c.x, c.z + 1) && c.top >= 12 && skin(c.x, c.z, FL0))
  .sort((a, b) => Math.abs(a.x - 23) - Math.abs(b.x - 23))[0];

// The facade of a skin cell: a stone base course on the ground storey, then per storey a floor line, two glazed rows
// (piers every fourth block), and a white head band. Below the ground floor, the plinth shows basement windows where
// the ground is lower than the wall.
const facade = (x, z, y, c) => {
  const pier = (x + z) % 4 === 0;
  if (y < FL0) {
    if (y === 0) return "polished_andesite";
    if ((y === 4 || y === 5) && y >= c.gr + 2 && !pier) return "light_blue_stained_glass";
    return "stone_bricks";
  }
  const r = (y - FL0) % 4, storey = Math.floor((y - FL0) / 4);
  if (r === 0) return storey === 0 ? "stone_bricks" : "light_gray_concrete";
  if (r === 3 || pier) return "white_concrete";
  return (x * 5 + z * 3 + storey) % 6 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass";
};
const glazed = (x, z, y) => { const c = at(x, z); return !!c && skin(x, z, y) && facade(x, z, y, c).endsWith("glass"); };
// a warm light on the storey's floor, behind a glazed bay (a few of them, on a fixed pattern)
const lampAt = (x, z, y) => (x * 7 + z * 13 + y) % 5 === 0 && DIRS.some(([dx, dz]) => glazed(x + dx, z + dz, y));

const g = new Voxels([W, H, D]);
for (const c of cell.values()) {
  const { x, z, top } = c;
  for (let y = 0; y < top; y++) {
    if (skin(x, z, y)) {
      // the door: two blocks high between stone pilasters, under a stone lintel up to the first storey's top
      if (door && z === door.z && Math.abs(x - door.x) <= 1 && y < FL0 + 4) {
        if (x === door.x && y < FL0 + 2) g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === FL0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        else g.set(x, y, z, "stone_bricks");
      } else g.set(x, y, z, facade(x, z, y, c));
      continue;
    }
    if (y < FL0) { g.set(x, y, z, "stone"); continue; }                  // core under the ground floor
    if (y === top - 1) { g.set(x, y, z, "gray_concrete"); continue; }    // the roof deck
    if (gapCell(x, z, y)) {
      if (y % 4 === 0) g.set(x, y, z, "light_gray_concrete");            // a floor slab
      else if ((y - FL0) % 4 === 1 && lampAt(x, z, y)) g.set(x, y, z, "glowstone");
      continue;                                                          // the air gap behind the glass
    }
    g.set(x, y, z, "stone");                                             // solid core
  }
  // parapet and cap on the roof edge: where the cell has no neighbour, or a lower one (a setback)
  if (top >= 12 && DIRS.some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.top < top; })) {
    g.set(x, top, z, "white_concrete");
    g.set(x, top + 1, z, "smooth_stone_slab", { type: "bottom" });
  }
}

// Roof plant room on the core, with a mast on it; small plant boxes on the body's clear roof.
const coreCells = [...cell.values()].filter(c => c.top === 56 && inner(c.x, c.z, 3));
const cx = Math.round(coreCells.reduce((s, c) => s + c.x, 0) / coreCells.length);
const cz = Math.round(coreCells.reduce((s, c) => s + c.z, 0) / coreCells.length);
for (let x = cx - 4; x <= cx + 4; x++) for (let z = cz - 3; z <= cz + 3; z++) {
  const c = at(x, z); if (!c || c.top !== 56 || !inner(x, z, 2)) continue;
  g.set(x, 56, z, "stone_bricks"); g.set(x, 57, z, "stone_bricks");
  g.set(x, 58, z, (x + z) % 3 === 0 ? "iron_bars" : "light_gray_concrete");
}
g.set(cx, 58, cz, "light_gray_concrete");                 // a solid footing for the mast
for (let y = 59; y <= 63; y++) g.set(cx, y, cz, "lightning_rod");
for (const c of cell.values()) {
  if (c.top !== 48 || !inner(c.x, c.z, 3) || c.x % 6 !== 2 || c.z % 6 !== 2) continue;
  g.set(c.x, 48, c.z, "light_gray_concrete"); g.set(c.x, 49, c.z, "light_gray_concrete");
}

console.log(g.save(DIR + "way_130501842.nbt"));
