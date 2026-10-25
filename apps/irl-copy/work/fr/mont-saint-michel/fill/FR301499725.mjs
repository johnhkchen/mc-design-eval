import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Hôtel - Restaurant Le Saint-Michel
// Commercial hotel-restaurant on the Grande Rue side of the rock: a plain
// grey stone shell with a restaurant shopfront and striped awning on the
// south face, two storey bands, a clean hipped slate roof and one chimney.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499725";
const W = 7, H = 23, D = 7;

const cellsArr = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const C = new Map();
for (const [x, z, gy, roof] of cellsArr) {
  C.set(key(x, z), { x, z, gy: Math.max(0, Math.round(gy)), roof });
}
const inF = (x, z) => C.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Smoothed roof (3x3 mean of lidar roof heights) so the massing reads as clean tiers
for (const c of C.values()) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = C.get(key(c.x + dx, c.z + dz));
    if (o) { s += o.roof; n++; }
  }
  c.sm = s / n;
}

// Eave (wall top) per cell: roof minus a 3-block hip, never below gy+4, never above the build limit
for (const c of C.values()) {
  let E = Math.round(c.sm) - 3;
  E = Math.max(E, c.gy + 4);
  E = Math.min(E, H - 7);
  c.E = E;
}

// Distance to the footprint edge (multi-source BFS): wall ring, gap ring, core, hip rings
const dist = new Map();
const queue = [];
for (const c of C.values()) {
  const edge = NB.some(([dx, dz]) => !inF(c.x + dx, c.z + dz));
  if (edge) { dist.set(key(c.x, c.z), 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const cd = dist.get(key(c.x, c.z));
  for (const [dx, dz] of NB) {
    const k = key(c.x + dx, c.z + dz);
    if (inF(c.x + dx, c.z + dz) && !dist.has(k)) {
      dist.set(k, cd + 1);
      queue.push(C.get(k));
    }
  }
}
for (const c of C.values()) c.d = dist.get(key(c.x, c.z)) ?? 0;
const maxD = Math.max(...[...C.values()].map(c => c.d));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const facingOf = (dx, dz) =>
  dx === 1 ? "east" : dx === -1 ? "west" : dz === 1 ? "south" : "north";
const stairProps = (dx, dz) => ({
  facing: facingOf(dx, dz), half: "bottom", shape: "straight", waterlogged: "false",
});

// Materials: grey Mont-Saint-Michel stone walls, dark slate hip roof
const WALL = "stone";
const BASE = "stone_bricks";
const COURSE = "polished_andesite";
const FLOOR = "smooth_stone";
const CEIL = "stone_bricks";
const ROOF = "deepslate_tiles";
const ROOF_STAIR = "deepslate_tile_stairs";
const GLASS = "glass";
const LIGHT = "shroomlight";

for (const c of C.values()) {
  const { x, z, gy, E, d } = c;

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, BASE);

  if (d === 0) {
    // Outer wall: stone shell with base course, storey courses and a cornice course at the top
    for (let y = gy; y <= E - 1; y++) put(x, y, z, WALL);
    put(x, gy, z, BASE);
    for (let b = gy + 5; b <= E - 2; b += 5) put(x, b, z, COURSE);
    put(x, E - 1, z, COURSE);

    // Outward direction and corner test
    const missing = NB.filter(([dx, dz]) => !inF(x + dx, z + dz));
    const isCorner = missing.length >= 2;
    const [ox, oz] = missing[0] ?? [0, 0];
    const idx = ox !== 0 ? z : x;
    const isDoor = oz === 1 && x === 3 && !isCorner;

    // Windows: glass panes in the storey bands, alternate bays, not on corners
    if (!isCorner && !isDoor && idx % 2 === 1) {
      for (let b = gy; b + 1 <= E - 2; b += 5) {
        for (let y = b + 1; y <= Math.min(b + 3, E - 2); y++) put(x, y, z, GLASS);
      }
      // Warm light just inside some bays (in the air gap behind the glass)
      if (idx % 4 === 1 && gy + 2 <= E - 2) {
        put(x - ox, gy + 2, z - oz, LIGHT);
      }
    }

    // Restaurant entrance on the south face, centred
    if (isDoor) {
      put(x, gy, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gy + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    }

    // Striped awning band over the shopfront on the south row
    if (oz === 1 && x >= 2 && x <= 4 && !isCorner) {
      put(x, gy + 2, z, x === 3 ? "red_wool" : "white_wool");
    }
  } else {
    // Gap ring (air behind the glass) and solid core
    if (d === 1) {
      put(x, gy, z, FLOOR);
      for (let b = gy + 5; b < E - 1; b += 5) put(x, b, z, FLOOR);
      put(x, E - 1, z, CEIL);
    } else {
      for (let y = gy; y <= E - 1; y++) put(x, y, z, WALL);
    }

    // Hipped slate roof: the first ring overhangs the wall top, each ring inward rises one block
    const stairY = E + Math.max(0, d - 1);
    if (d === maxD) {
      // Flat crown: full slate blocks up to the top
      for (let y = E; y <= stairY; y++) put(x, y, z, ROOF);
    } else {
      for (let y = E; y < stairY; y++) put(x, y, z, ROOF);
      // Stair faces the neighbour one ring closer to the edge, so the slope falls outward
      const low = NB.find(([dx, dz]) => inF(x + dx, z + dz) && dist.get(key(x + dx, z + dz)) === d - 1);
      const [lx, lz] = low ?? [0, 0];
      put(x, stairY, z, ROOF_STAIR, stairProps(lx, lz));
    }
  }
}

// Single chimney on the hip, rising from the roof
const ch = C.get(key(2, 2));
if (ch && ch.d === 2) {
  const topY = ch.E + 1;
  if (topY + 2 < H) {
    put(2, topY + 1, 2, "stone_bricks");
    put(2, topY + 2, 2, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
