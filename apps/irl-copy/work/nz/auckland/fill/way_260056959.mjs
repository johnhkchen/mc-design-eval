// Zest (way 260056959): a 12-storey glazed office and apartment block on a stone plinth, the late-1990s / 2000s
// Auckland CBD-edge type: white precast piers, light-grey spandrels, blue-green glass, a shopfront base on the street,
// two entrances. The lidar gives a flat top at 56 blocks with a 52-block shoulder round the edge; that is the massing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260056959.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260056959.nbt";

const M = {
  foundation: "stone", plinth: "stone_bricks", base: "smooth_stone", pier: "white_concrete", spandrel: "light_gray_concrete",
  floor: "light_gray_concrete", glassA: "light_blue_stained_glass", glassB: "cyan_stained_glass", shopPier: "polished_andesite",
  fascia: "polished_andesite", roof: "gray_concrete", parapet: "white_concrete", plant: "light_gray_concrete", louvre: "iron_bars",
};
const DATUM = 8;          // the ground-floor slab row, above the plinth; every storey line sits at 8 + 4k
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// --- the footprint: one record per cell, with a smoothed, tiered roof --------------------------------------------
const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { x, z, g, r });
const inF = (x, z) => cell.has(`${x},${z}`);
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
for (const c of cell.values()) {
  // lidar noise: the median of the 3x3 footprint neighbourhood, then snapped to 4-block tiers (storey lines)
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell.get(`${c.x + dx},${c.z + dz}`); if (n) vals.push(n.r); }
  c.T = Math.max(12, 4 * Math.round(median(vals) / 4));
  c.exp = Object.keys(DIRS).filter((d) => !inF(c.x + DIRS[d][0], c.z + DIRS[d][1]));   // faces on the outside
  c.perim = c.exp.length > 0;
}

// --- entrances: two street-level doors on the lowest perimeter cells (the door sits above the foundation, so g <= 5)
const cands = [...cell.values()].filter((c) => c.perim && c.exp.length === 1 && c.g <= 5)
  .sort((a, b) => a.g - b.g || (a.x + a.z) - (b.x + b.z));
const doors = [];
for (const c of cands) {
  if (doors.length >= 2) break;
  if (doors.every((p) => Math.abs(p.x - c.x) + Math.abs(p.z - c.z) >= 14)) doors.push(c);
}
const doorAt = new Set(doors.map((c) => `${c.x},${c.z}`));

// --- facade rhythm: piers and glass on a 4-cell repeat (s = x + z reads on straight and stepped walls alike)
const isPier = (c) => c.exp.length >= 2 || [0, 3].includes((c.x + c.z) % 4);
const glassOf = (c) => (Math.floor((c.x + c.z) / 2) % 2 === 0 ? M.glassA : M.glassB);
// a warm light in ~1 window in 11, deterministic (its glowstone sits in the room behind the glass)
const litAt = (c, b) => (c.x * 7 + c.z * 13 + b * 5) % 11 === 0;
const warmBlock = (c, b) => ((c.x * 3 + c.z * 5 + b) % 3 === 0 ? "shroomlight" : "glowstone");

const g = new Voxels([89, 70, 68]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const c of cell.values()) {
  const { x, z, g: gr, T } = c;

  // foundation to the cell's own ground, then the plinth up to the ground-floor slab
  for (let y = 0; y <= gr; y++) put(x, y, z, M.foundation);
  for (let y = gr + 1; y < DATUM; y++) put(x, y, z, y === DATUM - 1 ? M.base : M.plinth);
  if (doorAt.has(`${x},${z}`)) {
    const facing = c.exp[0];
    put(x, gr + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // storeys: a floor row, two window rows, a spandrel row; the first storey is the shopfront base
  for (let b = DATUM; b <= T - 4; b += 4) {
    const ground = b === DATUM;
    put(x, b, z, ground ? M.base : M.floor);                       // floor slab, the storey line (every cell)
    if (!c.perim) continue;                                        // interiors: air behind the glass, past the floor
    const pier = c.exp.length >= 2 || isPier(c);
    for (const row of [b + 1, b + 2]) {
      put(x, row, z, pier ? (ground ? M.shopPier : M.pier) : glassOf(c));
    }
    put(x, b + 3, z, ground ? M.fascia : M.spandrel);              // spandrel / fascia
    if (!pier && !ground && litAt(c, b)) {
      // a warm light in the room behind this window, on the floor slab (only where the room cell is interior)
      const [dx, dz] = DIRS[c.exp[0]];
      const inside = cell.get(`${x - dx},${z - dz}`);
      if (inside && !inside.perim) put(inside.x, b + 1, inside.z, warmBlock(c, b));
    }
  }

  // roof: the covering on interiors, a parapet on the edge
  if (!c.perim) put(x, T - 1, z, M.roof);
  else put(x, T, z, M.parapet);
}

// --- roof plant: light-grey boxes with a louvred cap, on the flat top of the core (tier 56)
const coreOK = (x, z) => { const c = cell.get(`${x},${z}`); return c && c.T === 56 && !c.perim; };
let boxes = 0;
for (let x = 2; x < 89; x += 9) for (let z = 2; z < 68; z += 9) {
  let ok = true;
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) if (!coreOK(x + dx, z + dz)) ok = false;
  if (!ok) continue;
  boxes++;
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) {
    put(x + dx, 56, z + dz, M.plant); put(x + dx, 57, z + dz, M.plant);
  }
  put(x + 1, 58, z + 1, M.louvre);
}

g.save(OUT);

// --- self-check: every solid block is joined to the ground through solid blocks (floor slabs span on the walls, so
// a block over air is fine when the solid it rests on is connected down to y 0)
const [X, Y, Z] = [89, 70, 68];
const seen = new Uint8Array(X * Y * Z), stack = [];
let blocks = 0;
g.forEachCell((i) => { blocks++; });
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (g.val(x, 0, z)) { const i = (z * Y) * X + x; seen[i] = 1; stack.push([x, 0, z]); }
while (stack.length) {
  const [x, y, z] = stack.pop();
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const nx = x + dx, ny = y + dy, nz = z + dz;
    if (nx < 0 || ny < 0 || nz < 0 || nx >= X || ny >= Y || nz >= Z || !g.val(nx, ny, nz)) continue;
    const i = (nz * Y + ny) * X + nx; if (seen[i]) continue; seen[i] = 1; stack.push([nx, ny, nz]);
  }
}
let loose = 0;
g.forEachCell((i) => { if (!seen[i]) loose++; });
console.log(JSON.stringify({ footprint: cells.length, doors: doors.map((c) => [c.x, c.z]), plantBoxes: boxes, blocks, notJoinedToGround: loose, out: OUT }));
