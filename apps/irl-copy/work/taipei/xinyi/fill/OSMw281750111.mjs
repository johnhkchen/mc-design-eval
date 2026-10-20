import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 教室 (classroom block): two storeys of 5 blocks, flat parapet roof at y 11,
// cream smooth-quartz walls with light-gray concrete piers and cyan classroom windows,
// stone base and storey bands, a wide framed central entrance, rooftop plant and flagpole.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw281750111";
const W = 144, H = 23, D = 25;
const ROOF_Y = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(ROOF_Y - 1, Math.round(gr))));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => ground.has(`${x},${z}`);

const LX = maxX - minX + 1;
const midX = minX + Math.floor(LX / 2);
const ENT_HALF = 3;                  // entrance spans midX-3 .. midX+3

function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}

const g = new Voxels([W, H, D]);
const IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const WALL = "smooth_quartz";
const PIER = "light_gray_concrete";
const BAND = "smooth_stone";
const BASE = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane";

for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const base = ground.get(`${x},${z}`);
  const face = faceOf(x, z);
  const isExt = face !== null;

  let i = 0, L = 1;
  if (face === "N" || face === "S") { i = x - minX; L = LX; }
  else if (face === "W" || face === "E") { i = z - minZ; L = maxZ - minZ + 1; }
  const corner = isExt && (i === 0 || i === L - 1);
  const pier = isExt && (corner || i % 4 === 0);

  const dxE = Math.abs(x - midX);
  const isEntrance = face === "N" && dxE <= ENT_HALF;
  const entrancePier = isEntrance && dxE === ENT_HALF;

  for (let y = 0; y <= ROOF_Y; y++) {
    if (y < base) { g.set(x, y, z, BASE); continue; }
    if (y === base) { g.set(x, y, z, isExt ? BASE : BAND); continue; }
    if (y === ROOF_Y) { g.set(x, y, z, isExt ? BAND : "gray_concrete"); continue; }
    if (!isExt) {
      if (y === 5) g.set(x, y, z, BAND);
      continue;
    }
    // Exterior facade
    if (pier || entrancePier) {
      g.set(x, y, z, entrancePier ? BAND : PIER);
      continue;
    }
    if (y === 5 || y === 10) { g.set(x, y, z, BAND); continue; }
    if (isEntrance && y >= base + 1 && y <= base + 2) {
      if (x === midX) {
        const half = y === base + 1 ? "lower" : "upper";
        g.set(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      } else {
        g.set(x, y, z, GLASS);
      }
      continue;
    }
    if (isEntrance && y === base + 3) { g.set(x, y, z, BAND); continue; }
    const windowRow = (y >= 2 && y <= 4) || (y >= 7 && y <= 9);
    if (windowRow && y > base) {
      g.set(x, y, z, GLASS);
      if (y === 8 && i % 8 === 2) {
        const [dx, dz] = IN[face];
        if (has(x + dx, z + dz)) g.set(x + dx, y, z + dz, "shroomlight");
      }
      continue;
    }
    g.set(x, y, z, WALL);
  }
}

// Entrance lanterns just inside the glazing.
for (const dx of [-2, 2]) {
  const x = midX + dx, z = minZ + 1, y = 6;
  if (has(x, z)) {
    g.set(x, y - 1, z, "shroomlight");
  }
}

// Rooftop plant enclosures (footprint cells only).
const plant = [[minX + 20, minX + 32], [minX + 100, minX + 112]];
for (const [x0, x1] of plant) {
  for (let x = x0; x <= x1; x++) {
    for (let z = minZ + 6; z <= minZ + 14; z++) {
      if (!has(x, z)) continue;
      g.set(x, ROOF_Y + 1, z, PIER);
      g.set(x, ROOF_Y + 2, z, PIER);
    }
  }
}

// Flagpole with red flag, set back from the entrance.
const poleZ = minZ + 12;
if (has(midX, poleZ)) {
  for (let y = ROOF_Y + 1; y <= ROOF_Y + 9; y++) g.set(midX, y, poleZ, "iron_bars");
  if (has(midX + 1, poleZ)) {
    g.set(midX + 1, ROOF_Y + 8, poleZ, "red_wool");
    g.set(midX + 1, ROOF_Y + 9, poleZ, "red_wool");
  }
}

g.save(`${DIR}/${ID}.nbt`);
