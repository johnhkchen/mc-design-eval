import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1001325.cells.json`, "utf8"));

// 112 South Street, 1819: Federal-era brick commercial/residential row, Seaport.
const W = 4, H = 25, D = 17;
const g = new Voxels([W, H, D]);

const BRICK = "bricks";
const TRIM = "stone_bricks";
const FLOOR = "oak_planks";
const ROOF = "smooth_stone";
const GLASS = "glass_pane";
const GLOW = "glowstone";
const PERIOD = 4;

// Footprint cells -> ground (own) and roof (lidar, smoothed below).
const m = new Map();
for (const [x, z, gr, rf] of cells) {
  m.set(`${x},${z}`, { ground: Math.max(0, Math.round(gr)), roof: Math.round(rf) });
}
const has = (x, z) => m.has(`${x},${z}`);
const isPerim = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Smooth lidar noise into one flat roofline: median of the roof readings,
// lifted only where the sloping ground would otherwise bury the parapet.
const roofs = [...m.values()].map((c) => c.roof).sort((a, b) => a - b);
const R0 = roofs[Math.floor(roofs.length / 2)];

// Front (street) face: the west-exposed cells. Door goes at the one nearest the middle.
const westCells = [...m.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => !has(x - 1, z));
let doorZ = null;
if (westCells.length) {
  const mid = (D - 1) / 2;
  doorZ = westCells.reduce((best, [, z]) => (Math.abs(z - mid) < Math.abs(best - mid) ? z : best), westCells[0][1]);
}

for (const [key, { ground }] of m) {
  const [x, z] = key.split(",").map(Number);
  const R = Math.min(24, Math.max(R0, ground + 3));
  const perim = isPerim(x, z);
  const exW = !has(x - 1, z);
  const exE = !has(x + 1, z);
  const exN = !has(x, z - 1);
  const exS = !has(x, z + 1);
  const exX = exW || exE;
  const exZ = exN || exS;

  // Foundation up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y < R; y++) {
    const k = Math.floor((y - ground) / PERIOD);
    const r = (y - ground) % PERIOD; // 0 slab, 1-2 glazing, 3 spandrel

    if (r === 0) {
      g.set(x, y, z, perim ? (y === ground ? TRIM : BRICK) : FLOOR);
      continue;
    }

    if (!perim) {
      // Interior air with warm light behind street-side glazing.
      if (y < R - 1 && x === 1 && z % 4 === 1 && k >= 1 && (r === 1 || r === 2)) {
        g.set(x, y, z, GLOW);
      }
      continue;
    }

    let block = BRICK;

    if (k === 0 && exW) {
      // Shopfront on the street face.
      if (z === doorZ && (r === 1 || r === 2)) {
        g.set(x, y, z, "oak_door", {
          facing: "west",
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (r === 1 || r === 2) block = z % 4 === 0 || z % 4 === 3 ? TRIM : GLASS;
      if (r === 3) block = TRIM;
    } else if (k >= 1) {
      // Upper storeys: punched windows on exposed faces, solid at corners.
      if ((r === 1 || r === 2) && !(exX && exZ)) {
        const win = (exX && z % 2 === 1) || (exZ && !exX);
        if (win) block = GLASS;
      }
    }

    if (block === GLASS) {
      if (exX && !exZ) {
        g.set(x, y, z, GLASS, { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      } else {
        g.set(x, y, z, GLASS, { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
      }
      continue;
    }
    g.set(x, y, z, block);
  }

  // Flat roof slab, cornice course and parapet on the perimeter.
  if (perim) {
    g.set(x, R - 1, z, TRIM);
    if (R <= 24) g.set(x, R, z, TRIM);
  } else {
    g.set(x, R - 1, z, ROOF);
  }
}

// One chimney stack rising from the roof of the north-end cell, sitting on the roof.
if (has(2, 1)) {
  const { ground } = m.get("2,1");
  const R = Math.min(24, Math.max(R0, ground + 3));
  for (let y = R; y <= Math.min(24, R + 2); y++) g.set(2, y, 1, BRICK);
}

g.save(`${DIR}/NYC1001325.nbt`);
