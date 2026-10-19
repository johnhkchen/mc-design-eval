// 750 1st St NE (Commercial-Office-Large), Union Station's north side. Read from the lidar record: a 1980s-style
// limestone-and-glass office. A 15-block base wing, a 17-block main body, a 19-block corner tower on the west and a
// 20-block tower on the south-east, set back on the podium. Storeys are 3 blocks at grade and 2 above; each one is a
// spandrel band over a window row between piers, with a cornice at the top and a roof slab. Behind the glass is an air
// gap one cell deep, then a solid core, so every block stands on or is held by something below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC55635.cells.json", "utf8"));
const W = 39, D = 20, H = 32;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const NEIGH = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// Lidar roof per cell, median of its 3x3 footprint neighbours (kills single-cell noise), then snapped to four flat tiers.
const snapTier = (s) => (s <= 16 ? 15 : s <= 18 ? 17 : s <= 19 ? 19 : 20);
const medianRoof = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
};
const cell = new Map();
for (const [x, z, g] of cells) cell.set(key(x, z), { x, z, g, t: snapTier(medianRoof(x, z)) });
const tierAt = (x, z) => (inside(x, z) ? cell.get(key(x, z)).t : null);

// Ring: 0 = facade (touches outside or a different tier), 1 = air-gap layer behind the glass, 2+ = core.
const ring = new Map();
const queue = [];
for (const c of cell.values()) {
  const faces = NEIGH.filter(([dx, dz]) => tierAt(c.x + dx, c.z + dz) !== c.t);
  c.faces = faces;
  if (faces.length) { ring.set(key(c.x, c.z), 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = ring.get(key(c.x, c.z));
  for (const [dx, dz] of NEIGH) {
    const k = key(c.x + dx, c.z + dz);
    if (inside(c.x + dx, c.z + dz) && !ring.has(k) && tierAt(c.x + dx, c.z + dz) === c.t) { ring.set(k, d + 1); queue.push(cell.get(k)); }
  }
}
const ringOf = (x, z) => ring.get(key(x, z)) ?? 2;

// Penthouse on the 20-block tower and roof plant on the 17-block main body.
const penthouse = new Set();
for (const c of cell.values()) if (c.t === 20 && c.x >= 28 && c.x <= 34 && c.z >= 12 && c.z <= 16) penthouse.add(key(c.x, c.z));
const plant = new Set();
for (const c of cell.values()) if (c.t === 17 && c.x >= 12 && c.x <= 13 && c.z >= 9 && c.z <= 10) plant.add(key(c.x, c.z));
const penthouseEdge = (x, z) => NEIGH.some(([dx, dz]) => !penthouse.has(key(x + dx, z + dz)));

const G_STOREY = (G) => G + 3;                     // first upper storey starts above the 3-block ground storey
const isBand = (y, G) => y >= G + 3 && (y - (G + 3)) % 2 === 0;   // spandrel / floor-slab rows
const hash = (x, y, z) => (x * 73 + y * 151 + z * 37) % 97;
const glassFor = (x, y, z) => (hash(x, y, z) % 7 === 0 ? "cyan_stained_glass" : "gray_stained_glass");
const DOOR_X = 19;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const c of cell.values()) {
  const { x, z, g: G, t } = c;
  const r = ringOf(x, z);
  const isPier = (c.faces.some(([dx]) => dx !== 0) && z % 3 === 0) || (c.faces.some(([, dz]) => dz !== 0) && x % 3 === 0);
  const cornerPier = c.faces.length > 1 && c.faces.some(([dx]) => dx !== 0) && c.faces.some(([, dz]) => dz !== 0);
  const north = c.faces.some(([dx, dz]) => dz === -1);
  const doorCell = north && z === 0 && x === DOOR_X;
  const canopy = north && z === 0 && x >= DOOR_X - 2 && x <= DOOR_X + 2;

  for (let y = 0; y < t; y++) {
    if (y < G) { put(x, y, z, "polished_granite"); continue; }   // foundation up to the cell's ground

    if (r === 0) {
      if (y === t - 1) { put(x, y, z, "smooth_quartz"); continue; }                  // cornice
      if (y === G) { put(x, y, z, "polished_granite"); continue; }                   // base course
      if (doorCell && (y === G + 1 || y === G + 2)) {
        put(x, y, z, "dark_oak_door", { facing: "north", half: y === G + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (canopy && y === G + 3) { put(x, y, z, "polished_granite"); continue; }   // entrance canopy, stone not a black hole
      if (isPier || cornerPier) { put(x, y, z, "smooth_quartz"); continue; }        // piers run the full height
      if (y >= G + 1 && y <= G + 2) { put(x, y, z, glassFor(x, y, z)); continue; }   // shopfront glass
      if (isBand(y, G)) { put(x, y, z, "white_concrete"); continue; }               // spandrel
      if (y <= t - 2) { put(x, y, z, glassFor(x, y, z)); continue; }                // window pane
      continue;
    }

    if (r === 1) {
      if (y === G || y === t - 1 || isBand(y, G)) { put(x, y, z, "light_gray_concrete"); continue; }   // floor / roof slab
      if (y === G + 1 && z === 1 && x === DOOR_X) { put(x, y, z, "glowstone"); continue; }   // lobby light
      if (y >= G + 1 && y <= G + 2 && x % 4 === 1 && hash(x, y, z) % 3 === 0) { put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" }); continue; }
      if (y > G + 2 && y < t - 1 && hash(x, y, z) % 11 === 0) { put(x, y, z, "shroomlight"); continue; }   // lights behind some panes
      continue;   // air gap behind the glass
    }

    put(x, y, z, "stone");   // core
  }
}

// Penthouse: a 2-block plant room on the 20-block tower, glazed on its edges, roof slab on top.
for (const k of penthouse) {
  const [x, z] = k.split(",").map(Number);
  const top = cell.get(k).t;
  put(x, top, z, penthouseEdge(x, z) ? "smooth_quartz" : "light_gray_concrete");
  if (penthouseEdge(x, z) && (x + z) % 2 === 0) put(x, top, z, "gray_stained_glass");
  put(x, top + 1, z, penthouseEdge(x, z) ? "smooth_quartz" : "light_gray_concrete");
}
// Roof plant: two iron cooling boxes on the 17-block main body.
for (const k of plant) {
  const [x, z] = k.split(",").map(Number);
  const top = cell.get(k).t;
  put(x, top, z, "iron_block");
  put(x, top + 1, z, "iron_block");
}

// Self-check: every block is held up by something solid, and every solid is connected to the ground.
const solid = (x, y, z) => { const b = g.get(x, y, z); return !!b; };
const seen = new Set();
const stack = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (solid(x, 0, z)) { stack.push([x, 0, z]); seen.add(`${x},0,${z}`); }
while (stack.length) {
  const [x, y, z] = stack.pop();
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const nx = x + dx, ny = y + dy, nz = z + dz, k = `${nx},${ny},${nz}`;
    if (!seen.has(k) && solid(nx, ny, nz)) { seen.add(k); stack.push([nx, ny, nz]); }
  }
}
let floating = 0;
for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) if (solid(x, y, z) && !seen.has(`${x},${y},${z}`)) floating++;

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC55635.nbt";
const { blocks, palette } = g.save(out);
console.log(`DC55635: ${blocks} blocks, ${palette} palette entries, ${floating} unconnected`);
