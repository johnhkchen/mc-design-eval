import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86594.cells.json`, "utf8"));

const W = 30, H = 34, D = 25;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, gr, roof] of cells) info.set(key(x, z), { x, z, gr, roof });
const has = (x, z) => info.has(key(x, z));

let minX = Infinity, maxX = -Infinity, minZ = Infinity;
for (const c of info.values()) {
  minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x); minZ = Math.min(minZ, c.z);
}
const entX = Math.floor((minX + maxX) / 2);
const entZ = minZ;

// Smooth lidar roof heights over a 3x3 neighbourhood to remove noise.
function smoothRoof(x, z) {
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = info.get(key(x + dx, z + dz));
    if (c) { sum += c.roof; n++; }
  }
  return n ? sum / n : info.get(key(x, z)).roof;
}

// Materials: 1980s Washington office block, granite base, precast piers,
// pale spandrels, blue-grey glazing, stone cornice.
const BASE = "polished_granite";
const FOUND = "stone";
const PIER = "light_gray_concrete";
const SPAND = "white_concrete";
const GLASS = "light_blue_stained_glass_pane";
const CORNICE = "smooth_stone";
const ROOF = "light_gray_concrete";
const PENT = "stone_bricks";
const PENT_CAP = "smooth_stone";

function pane(x, y, z, alongX) {
  g.set(x, y, z, GLASS, {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  });
}

for (const c of info.values()) {
  const { x, z } = c;
  const g0 = Math.max(0, Math.min(H - 4, Math.round(c.gr)));

  // Smoothed roof, quantized to 3-block storey tiers.
  const quant = Math.round(smoothRoof(x, z) / 3) * 3;
  const T = Math.min(H - 3, Math.max(g0 + 3, quant));

  const mN = !has(x, z - 1);
  const mS = !has(x, z + 1);
  const mW = !has(x - 1, z);
  const mE = !has(x + 1, z);
  const wall = mN || mS || mW || mE;
  const xFace = mN || mS;
  const corner = xFace && (mW || mE);
  const idx = xFace ? x : z;
  const pier = corner || idx % 3 === 0;
  const isEntrance = x === entX && z === entZ && mN;

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < g0; y++) {
    g.set(x, y, z, wall ? BASE : FOUND);
  }

  // Body from ground to roof.
  for (let y = g0; y < T; y++) {
    const rel = y - g0;

    if (y === T - 1) {
      g.set(x, y, z, wall ? CORNICE : ROOF);
      continue;
    }

    if (!wall) {
      if (rel % 3 === 0) g.set(x, y, z, PIER);
      continue;
    }

    if (rel === 0) {
      g.set(x, y, z, BASE);
      continue;
    }

    if (isEntrance && (rel === 1 || rel === 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    // Entrance surround: granite jambs flanking the door, and a lintel above.
    if (mN && z === entZ && Math.abs(x - entX) === 1 && rel < 3) {
      g.set(x, y, z, BASE);
      continue;
    }
    if (mN && z === entZ && x === entX && rel === 3) {
      g.set(x, y, z, BASE);
      continue;
    }

    if (rel < 3) {
      if (pier) g.set(x, y, z, BASE);
      else if ((idx * 5 + z * 3 + rel) % 17 === 4) g.set(x, y, z, "glowstone");
      else pane(x, y, z, xFace);
      continue;
    }

    if (rel % 3 === 0) {
      g.set(x, y, z, pier ? PIER : SPAND);
      continue;
    }

    if (pier) {
      g.set(x, y, z, PIER);
    } else if ((idx * 7 + y * 13 + z * 3) % 23 === 0) {
      g.set(x, y, z, "glowstone");
    } else {
      pane(x, y, z, xFace);
    }
  }

  // Rooftop plant room on the tallest central tier: solid, capped with full blocks.
  const centre = x >= 9 && x <= 20 && z >= 7 && z <= 17;
  if (!wall && centre && T >= 21 && T + 2 < H) {
    g.set(x, T, z, PENT);
    g.set(x, T + 1, z, PENT_CAP);
  }
}

g.save(`${DIR}/DC86594.nbt`);
