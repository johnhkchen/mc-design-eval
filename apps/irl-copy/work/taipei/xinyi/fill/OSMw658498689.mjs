import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw658498689";
const W = 38, H = 23, D = 38;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground (third number)
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);

// Bounds-checked setter; props optional
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return; // build only on footprint cells
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Era: a 1980s-90s Xinyi commercial block. Two storeys of 5 blocks plus a
// parapet course (roof about 11 above lowest ground). Light grey and white
// cladding, stone base and cornice, dark glass shopfront, warm lights behind glass.
const M = {
  foundation: "stone_bricks",
  floor: "light_gray_concrete",
  roof: "stone",
  parapet: "smooth_stone",
  base: "stone_bricks",
  cornice: "smooth_stone",
  band: "white_concrete",
  pillar: "white_concrete",
  glass: "light_blue_stained_glass",
  door: "dark_oak_door",
  hvac: "iron_block",
  glowA: "glowstone",
  glowB: "shroomlight",
};

const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Pass 1: foundation fill, interior floor slabs, roof deck
for (const [x, z, F] of cells) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  for (let y = 0; y < F; y++) put(x, y, z, M.foundation);
  put(x, F + 5, z, M.floor);   // storey 2 floor slab
  put(x, F + 10, z, M.roof);   // roof deck
}

// Pass 2: facade on perimeter cells
for (const [x, z, F] of cells) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;

  const outs = [];
  if (!has(x, z - 1)) outs.push("north");
  if (!has(x, z + 1)) outs.push("south");
  if (!has(x - 1, z)) outs.push("west");
  if (!has(x + 1, z)) outs.push("east");
  if (outs.length === 0) continue; // interior cell

  const corner = outs.length >= 2;
  const dir = outs[0];
  const idx = (dir === "north" || dir === "south") ? x : z;
  const pillar = corner || idx % 4 === 0;
  const isDoor = !corner && dir === "south" && x === 18;
  const [ix, iz] = inward[dir];
  const inner = has(x + ix, z + iz);

  // r = 0: base course at floor level
  put(x, F, z, M.base);

  // r = 1..3: shopfront
  for (let r = 1; r <= 3; r++) {
    let b = pillar ? M.pillar : M.glass;
    if (isDoor && r <= 2) {
      b = M.door;
      const half = r === 1 ? "lower" : "upper";
      put(x, F + r, z, b, { facing: dir, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    put(x, F + r, z, b);
  }

  // r = 4: cornice over shopfront
  put(x, F + 4, z, M.cornice);

  // r = 5: storey line band
  put(x, F + 5, z, M.band);

  // r = 6..9: upper storey windows with pillars
  for (let r = 6; r <= 9; r++) {
    put(x, F + r, z, pillar ? M.pillar : M.glass);
  }

  // r = 10: parapet course
  put(x, F + 10, z, M.parapet);

  // Warm lights behind selected glass (air gap cell inside)
  if (!corner && !pillar && inner) {
    if (idx % 8 === 2) put(x + ix, F + 7, z + iz, M.glowB);
    if (idx % 12 === 6 && !isDoor) put(x + ix, F + 2, z + iz, M.glowA);
  }
}

// Pass 3: rooftop HVAC units on interior roof cells (need room above)
const unitBoxes = [
  [8, 11, 8, 9],
  [24, 27, 8, 9],
  [16, 19, 26, 27],
];
for (const [x, z, F] of cells) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  const interior = has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);
  if (!interior || F + 12 > H - 1) continue;
  for (const [x0, x1, z0, z1] of unitBoxes) {
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) {
      put(x, F + 11, z, M.hvac);
      put(x, F + 12, z, M.hvac);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
