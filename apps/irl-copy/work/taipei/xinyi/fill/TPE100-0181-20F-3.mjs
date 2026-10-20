import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE100-0181: Xinyi commercial/office block, built 2011.
// Footprint 75 x 176, roof 26 blocks above lowest ground: five storeys of
// 5 blocks, a white-concrete frame with pale spandrels and blue glass bays,
// stone plinth, a framed shopfront entrance on the street (min-z) side,
// and roof plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE100-0181-20F-3";
const W = 75, H = 38, D = 176;
const ROOF = 26;                       // roof top (parapet) y, relative to lowest ground
const SLABS = [0, 5, 10, 15, 20, 25];  // floor slab levels (25 = roof slab)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground height (clamped below the roof)
const F = new Map();
for (const [x, z, gr] of cells) {
  const ground = Math.min(Math.max(0, Math.round(gr)), SLABS[SLABS.length - 1]);
  F.set(`${x},${z}`, ground);
}
const has = (x, z) => F.has(`${x},${z}`);
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// Street frontage: the min-z edge. Entrance sits at the middle of that edge.
let zMin = Infinity;
for (const k of F.keys()) zMin = Math.min(zMin, Number(k.split(",")[1]));
const frontXs = [];
for (const k of F.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (z === zMin) frontXs.push(x);
}
frontXs.sort((a, b) => a - b);
const midX = frontXs[Math.floor(frontXs.length / 2)];
const openXs = new Set(frontXs.filter((x) => Math.abs(x - midX) <= 2));   // 5-wide opening
const pierXs = new Set(frontXs.filter((x) => Math.abs(x - midX) === 3));  // entrance pilasters
const lanternXs = new Set([midX - 1, midX + 1]);

// Upper-floor facade: piers every 4 blocks, spandrel band, glass with
// occasional warm glowstone behind the glass.
const upperFacade = (x, y, z, k) => {
  const pier = (x + z) % 4 === 0;
  if (y === 5 * k + 1) return pier ? "white_concrete" : "light_gray_concrete";
  if (pier) return "white_concrete";
  const warm = (x * 7 + z * 3 + k * 5) % 23 === 0;
  return warm ? "glowstone" : "light_blue_stained_glass";
};

for (const [key, gr] of F) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at each storey line that sits at or above the ground.
  for (const L of SLABS) {
    if (L < gr) continue;
    if (L === 0) {
      put(x, L, z, edge ? "stone_bricks" : "smooth_stone");
    } else if (L === SLABS[SLABS.length - 1]) {
      put(x, L, z, edge ? "smooth_quartz" : "light_gray_concrete"); // roof cornice / slab
    } else {
      put(x, L, z, edge ? "white_concrete" : "smooth_stone");
    }
  }

  if (!edge) continue;

  // Ground storey: plinth course, then shopfront glazing with piers.
  if (gr > 0) put(x, gr, z, "stone_bricks");
  for (let y = gr + 1; y <= 4; y++) {
    const pier = (x + z) % 4 === 0;
    put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
  }

  // Framed entrance on the street side: open doorway, pilasters either side,
  // quartz lintel with sea lanterns beneath the canopy edge.
  if (z === zMin) {
    if (openXs.has(x)) {
      put(x, gr + 1, z, "air");
      put(x, gr + 2, z, "air");
      put(x, gr + 3, z, lanternXs.has(x) ? "sea_lantern" : "smooth_quartz");
    } else if (pierXs.has(x)) {
      for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "polished_andesite");
    }
  }

  // Upper storeys 1..4.
  for (let k = 1; k <= 4; k++) {
    for (let y = 5 * k + 1; y <= 5 * k + 4; y++) {
      if (y < gr) continue;
      put(x, y, z, upperFacade(x, y, z, k));
    }
  }

  // Parapet on the roof edge.
  put(x, ROOF, z, "white_concrete");
}

// Roof plant: grey mechanical blocks and a planted green roof strip.
for (const [key, gr] of F) {
  const [x, z] = key.split(",").map(Number);
  if (isEdge(x, z)) continue;
  if (x % 12 >= 4 && x % 12 <= 7 && z % 16 >= 5 && z % 16 <= 9) {
    for (let y = ROOF; y <= ROOF + 2; y++) put(x, y, z, "light_gray_concrete");
  } else if (x % 12 <= 2 && z % 16 >= 11 && z % 16 <= 14) {
    put(x, ROOF, z, "moss_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
