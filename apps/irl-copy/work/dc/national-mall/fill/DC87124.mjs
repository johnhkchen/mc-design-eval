import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87124.cells.json`, "utf8"));

// Brownley Building: early-20th-century brick commercial block on a stone plinth,
// stone cornice bands at every storey, a stone parapet, a flat roof tier and a
// shopfront with a central door on the street (z = 0) face.
const W = 4, H = 29, D = 10;
const STOREY = 3;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const has = new Set(cells.map(([x, z]) => key(x, z)));
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(key(x, z), gr);

const grounds = cells.map(c => c[2]);
const Ystart = Math.max(...grounds);

// One flat roof tier: median lidar roof, snapped to the storey grid so the
// massing reads as clean tiers rather than per-cell noise.
const roofs = cells.map(c => Math.min(c[3], H)).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
let topY = Ystart + STOREY * Math.round((medRoof - Ystart) / STOREY);
topY = Math.max(Ystart + 2 * STOREY, Math.min(topY, H - 4));

const isExterior = (x, z) =>
  !has.has(key(x - 1, z)) || !has.has(key(x + 1, z)) ||
  !has.has(key(x, z - 1)) || !has.has(key(x, z + 1));

const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

function facadeBlock(x, z, y, r) {
  const groundStorey = y < Ystart + STOREY;
  if (z === 0 && groundStorey && x === 1) {
    const half = r === 1 ? "lower" : "upper";
    g.set(x, y, z, "dark_oak_door", {
      facing: "north", half, hinge: "left", open: "false", powered: "false",
    });
    return;
  }
  if (z === 0 && groundStorey && x === 2) {
    g.set(x, y, z, "glass_pane");
    return;
  }
  const i = (x === 0 || x === W - 1) ? z : x;
  const isWindow = i % 2 === 1;
  // Window head course: brick on the top row of each glazed bay, glass below.
  if (isWindow && r === 1) {
    g.set(x, y, z, "glass_pane");
  } else if (isWindow && r === 2) {
    g.set(x, y, z, "glass_pane");
  } else {
    g.set(x, y, z, "bricks");
  }
}

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const ext = isExterior(x, z);
  const corner = ext && isCorner(x, z);
  const base = groundOf.get(key(x, z));

  for (let y = 0; y < topY; y++) {
    if (y < base) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    if (y === topY - 1) {
      g.set(x, y, z, ext ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (y < Ystart) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    const rel = y - Ystart;
    const r = rel % STOREY;
    const k = Math.floor(rel / STOREY);

    if (r === 0) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (ext) {
      if (corner) g.set(x, y, z, "stone_bricks");
      else facadeBlock(x, z, y, r);
    } else if (r === 1 && (x + z + k) % 5 === 0) {
      g.set(x, y, z, "glowstone");
    }
  }
}

// Rooftop penthouse on the back half: a small brick box with glazed bays
// and a stone cap, sitting directly on the roof deck.
const PH_Y = topY;
const PH_TOP = topY + 3;
if (PH_TOP < H) {
  for (let x = 1; x <= 2; x++) {
    for (let z = 6; z <= 8; z++) {
      const ext = x === 1 || x === 2 && z === 8 || z === 6 || z === 8;
      for (let y = PH_Y; y < PH_TOP; y++) {
        if (y === PH_TOP - 1) {
          g.set(x, y, z, "stone_bricks");
        } else if (y === PH_Y) {
          g.set(x, y, z, "smooth_stone");
        } else if (ext && z !== 7) {
          g.set(x, y, z, "bricks");
        } else if (ext) {
          g.set(x, y, z, "glass_pane");
        }
      }
    }
  }
}

g.save(`${DIR}/DC87124.nbt`);
