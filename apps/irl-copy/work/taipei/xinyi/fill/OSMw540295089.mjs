import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540295089.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540295089.nbt";

// Footprint 20 x 26, roof about 11 above lowest ground.
// Reading: a 1990s-2000s two-storey commercial block on the Xinyi street grid:
// stone plinth, cream quartz-tile walls, blue-glass shopfront and windows,
// light-grey storey bands, cornice and parapet, roof plant on the deck.
const W = 20, H = 23, D = 26;

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundAt = new Map();
for (const c of raw) {
  const [x, z, gy] = c;
  if (x >= 0 && x < W && z >= 0 && z < D) {
    groundAt.set(key(x, z), Math.max(0, Math.min(H - 12, Math.round(gy))));
  }
}
const has = (x, z) => groundAt.has(key(x, z));
const baseOf = (x, z) => groundAt.get(key(x, z)) ?? 0;

// Outward faces of a cell: which neighbours are outside the footprint.
// t = position along the face (x for north/south, z for east/west).
function faces(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push({ dir: "north", t: x });
  if (!has(x, z + 1)) out.push({ dir: "south", t: x });
  if (!has(x - 1, z)) out.push({ dir: "west", t: z });
  if (!has(x + 1, z)) out.push({ dir: "east", t: z });
  return out;
}
// Inward step for a given outward face.
const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Entrance: the south-face cell nearest the middle of the south frontage.
let minX = Infinity, maxX = -Infinity;
const southCells = [];
for (const k of groundAt.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  if (!has(x, z + 1)) southCells.push([x, z]);
}
const mid = (minX + maxX) / 2;
let door = null;
for (const [x, z] of southCells) {
  if (!door || Math.abs(x - mid) < Math.abs(door[0] - mid)) door = [x, z];
}
const doorKey = door ? key(door[0], door[1]) : null;

// 1. Foundation, plinth, floor slabs, roof deck for every footprint cell.
for (const k of groundAt.keys()) {
  const [x, z] = k.split(",").map(Number);
  const b = baseOf(x, z);
  for (let y = 0; y <= b; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, b + 5, z, "gray_concrete");   // ground-storey ceiling / upper floor slab
  g.set(x, b + 10, z, "gray_concrete");  // roof deck
}

// 2. Walls, facade articulation and openings on exterior cells.
for (const k of groundAt.keys()) {
  const [x, z] = k.split(",").map(Number);
  const b = baseOf(x, z);
  const fs = faces(x, z);
  if (fs.length === 0) continue;

  const isCorner = fs.length >= 2;
  const isDoor = k === doorKey;

  if (isCorner) {
    // Corner pilasters, full height.
    for (let y = b + 1; y <= b + 9; y++) g.set(x, y, z, "quartz_pillar", { axis: "y" });
    g.set(x, b + 10, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    g.set(x, b + 11, z, "quartz_pillar", { axis: "y" });
    continue;
  }

  const f = fs[0];
  const t = f.t;
  const bay = t % 4; // window bays: 0 = pier, 1-2 = glazed, 3 = mullion glass
  const glazed = bay === 1 || bay === 2;

  // Base course
  g.set(x, b + 1, z, "stone_bricks");
  // Shopfront band b+2..b+4
  for (let y = b + 2; y <= b + 4; y++) {
    const block = (t % 4 === 0) ? "smooth_quartz" : "light_blue_stained_glass";
    g.set(x, y, z, block);
  }
  // Storey line
  g.set(x, b + 5, z, "light_gray_concrete");
  // Upper storey: spandrels and windows
  g.set(x, b + 6, z, "light_gray_concrete");
  g.set(x, b + 7, z, glazed ? "light_blue_stained_glass" : "smooth_quartz");
  g.set(x, b + 8, z, glazed ? "light_blue_stained_glass" : "smooth_quartz");
  g.set(x, b + 9, z, "smooth_quartz");
  // Cornice and parapet
  g.set(x, b + 10, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  g.set(x, b + 11, z, "smooth_quartz");

  // Entrance on the south frontage: door replaces shopfront glass at ground.
  if (isDoor) {
    const props = { facing: "south", hinge: "left", open: "false", powered: "false" };
    g.set(x, b + 1, z, "stone_bricks");   // threshold course stays
    g.set(x, b + 2, z, "oak_door", { ...props, half: "lower" });
    g.set(x, b + 3, z, "oak_door", { ...props, half: "upper" });
    g.set(x, b + 4, z, "smooth_quartz"); // transom band above door
  }

  // Warm light behind selected windows (interior cell one step inward).
  const [ix, iz] = inward[f.dir];
  const ix2 = x + ix, iz2 = z + iz;
  if (has(ix2, iz2) && !faces(ix2, iz2).length) {
    if (glazed && t % 8 === 2) {
      g.set(ix2, b + 7, iz2, "glowstone");
    }
    if (!isDoor && bay === 1 && t % 8 === 1) {
      g.set(ix2, b + 2, iz2, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// 3. Roof plant: small rooftop units on the deck, inside the parapet.
for (const k of groundAt.keys()) {
  const [x, z] = k.split(",").map(Number);
  const b = baseOf(x, z);
  if (faces(x, z).length) continue;
  if (x % 7 === 3 && z % 9 === 4) {
    g.set(x, b + 11, z, "iron_block");
  }
}

g.save(OUT);
