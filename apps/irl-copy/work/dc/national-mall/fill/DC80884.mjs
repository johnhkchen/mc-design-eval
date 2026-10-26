// DC80884: a 1930s Federal-style limestone office block (the Federal Triangle idiom) on the lidar footprint.
// Massing: each cell's roof is median-smoothed over its footprint neighbours, then snapped to four flat tiers
// (4, 7, 10, 11 blocks), so the east pavilion stands tallest and the wings step down.
// Each column is solid from y 0 up to its ground, then a plinth, storeys of glass with calcite piers, string courses,
// a cornice and a roof: the shell is one block thick with an air gap behind the glass and a slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC80884.cells.json", "utf8"));
const W = 54, D = 12, H = 23;
const key = (x, z) => `${x},${z}`;
const info = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => info.has(key(x, z));

// Isolated spurs (a cell with at most one footprint neighbour) are lidar noise at the ragged south edge: left out.
const nbr = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => inside(x + dx, z + dz)).length;
const use = (x, z) => inside(x, z) && nbr(x, z) >= 2;

// Roof: 3x3 median over footprint neighbours, then the nearest flat tier.
const tierOf = (r) => (r <= 5.5 ? 4 : r <= 8.5 ? 7 : r <= 10.4 ? 10 : 11);
const roofAt = (x, z) => {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = info.get(key(x + dx, z + dz)); if (c) vals.push(c.r);
  }
  vals.sort((a, b) => a - b);
  return vals[Math.floor(vals.length / 2)];
};

const cellsUsed = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!use(x, z)) continue;
  const { g } = info.get(key(x, z));
  cellsUsed.push({ x, z, g, T: tierOf(roofAt(x, z)) });
}
const at = new Map(cellsUsed.map((c) => [key(c.x, c.z), c]));
const isUsed = (x, z) => at.has(key(x, z));

// Materials
const M = {
  foundation: "stone_bricks",
  plinth: "polished_andesite",
  floor: "smooth_stone",
  roof: "stone",
  string: "smooth_quartz",
  cornice: "smooth_quartz",
  cap: "calcite",
  pier: "calcite",
  glass: "light_blue_stained_glass_pane",
};

const g = new Voxels([W, H, D]);
const set = (x, y, z, b, st) => g.set(x, y, z, b, st);

// Entrance: a pair of doors on the south face, flanked by piers, under the string course.
const doorX = 44, doorZ = D - 1;

for (const c of cellsUsed) {
  const { x, z, g: gr, T } = c;
  // Ring = a cell with an outside neighbour on any side.
  const outN = [];
  if (!isUsed(x, z - 1)) outN.push([0, -1]);     // north face (z-)
  if (!isUsed(x, z + 1)) outN.push([0, 1]);      // south face (z+)
  if (!isUsed(x - 1, z)) outN.push([-1, 0]);     // west face (x-)
  if (!isUsed(x + 1, z)) outN.push([1, 0]);      // east face (x+)
  const ring = outN.length > 0;

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, M.foundation);

  // Interior storey slabs (floors, deck, roof) per tier.
  const floors = new Set([gr]);
  if (T > 4) floors.add(4);
  if (T > 8) floors.add(8);
  floors.add(T - 2);          // deck under the roof
  floors.add(T - 1);          // roof covering

  for (let y = gr; y <= T - 1; y++) {
    if (!ring) {
      if (floors.has(y)) set(x, y, z, y === T - 1 ? M.roof : M.floor);
      continue;
    }
    if (y === gr) { set(x, y, z, M.plinth); continue; }
    if (y === T - 1) { set(x, y, z, M.cap); continue; }
    if (y === T - 2 || (y === 4 && T > 5) || (y === 8 && T > 9)) { set(x, y, z, M.string); continue; }
    // Window rows: a face's bays are two panes and a pier, the pier at the corners and the cell edges.
    const [ox, oz] = outN[0];
    const onZFace = ox === 0;
    const bay = onZFace ? x : z;
    const pier = outN.length > 1 || bay % 3 === 0;
    if (x >= doorX - 1 && x <= doorX + 1 && z === doorZ && (y === gr + 1 || y === gr + 2)) {
      if (x === doorX) continue;   // door cells are written below
      set(x, y, z, M.pier); continue;
    }
    if (pier) { set(x, y, z, M.pier); continue; }
    const st = onZFace
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    set(x, y, z, M.glass, st);
    // Warm light behind some panes (a lamp in the air gap), only where that cell is empty.
    const ix = x - ox, iz = z - oz;
    const inward = !floors.has(y) && isUsed(ix, iz) && (Math.floor(bay / 3) + y) % 4 === 0 && y >= gr + 1;
    if (inward) set(ix, y, iz, "glowstone");
  }
}

// Doors: iron, opening south, lower and upper halves.
const dg = at.get(key(doorX, doorZ))?.g ?? 0;
if (isUsed(doorX, doorZ)) {
  const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
  set(doorX, dg + 1, doorZ, "iron_door", door("lower"));
  set(doorX, dg + 2, doorZ, "iron_door", door("upper"));
  // A hanging lantern in the entrance hall under the lintel, if there is a floor above it.
  const hall = at.get(key(doorX, doorZ - 1));
  if (hall && hall.T > 4 && dg + 2 < 4) set(doorX, 3, doorZ - 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Roof equipment: two plant boxes on the eleven-block pavilion.
for (const [x0, z0] of [[38, 3], [42, 6]]) {
  const c = at.get(key(x0, z0));
  if (!c || c.T !== 11) continue;
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 2; dz++) {
    if (!isUsed(x0 + dx, z0 + dz)) continue;
    set(x0 + dx, 11, z0 + dz, "stone_bricks");
    set(x0 + dx, 12, z0 + dz, "stone_brick_wall");
  }
}

const info2 = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC80884.nbt");
console.log(JSON.stringify({ cells: cellsUsed.length, ...info2 }));
