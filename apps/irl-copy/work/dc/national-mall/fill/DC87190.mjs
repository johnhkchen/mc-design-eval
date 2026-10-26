import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87190.cells.json`, "utf8"));

// Federal-era red brick office block, three storeys, stone base and cornice,
// flat roof, entrance on the south face with a canopy.
const W = 6, H = 21, D = 9;
const g = new Voxels([W, H, D]);
const STOREY = 3;

const key = (x, z) => `${x},${z}`;
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };

// Smooth lidar noise: one flat roof for the whole block, grounds clamped to a tight band.
const gnds = cells.map(c => Math.max(0, Math.round(c[2])));
const roofs = cells.map(c => Math.round(c[3]));
const gMin = Math.min(...gnds);
let R = med(roofs);
if (R - gMin < STOREY * 3) R = gMin + STOREY * 3;
R = Math.min(H - 3, R);

const fp = new Map();
for (const [x, z, gr] of cells) {
  const gnd = Math.min(gMin + 3, Math.max(0, Math.round(gr)));
  fp.set(key(x, z), { gnd, roof: R });
}
const has = (x, z) => fp.has(key(x, z));

// Entrance: south-facing exterior cell nearest x = 2
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!has(x, z + 1)) {
      const d = Math.abs(x - 2);
      if (d < best) { best = d; doorKey = key(x, z); }
    }
  }
}

for (const [x, z] of cells) {
  const { gnd, roof } = fp.get(key(x, z));
  const mW = !has(x - 1, z), mE = !has(x + 1, z);
  const mN = !has(x, z - 1), mS = !has(x, z + 1);
  const ext = mW || mE || mN || mS;
  const corner = (mW || mE) && (mN || mS);
  const isDoor = key(x, z) === doorKey;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gnd; y++) g.set(x, y, z, "stone_bricks");

  // Shaft from ground to roof
  for (let y = gnd; y < roof; y++) {
    const rel = y - gnd;

    if (rel === 0) {
      g.set(x, y, z, ext ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (rel % STOREY === 0) {
      g.set(x, y, z, "smooth_stone"); // storey line / floor slab / string course
      continue;
    }
    if (ext) {
      if (corner || y === roof - 1) { g.set(x, y, z, "bricks"); continue; }
      const runsZ = mW || mE;
      const props = runsZ
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      g.set(x, y, z, "glass_pane", props);
    } else {
      if (rel % STOREY === 1 && (x + 2 * z) % 4 === 0) g.set(x, y, z, "glowstone");
    }
  }

  // Interior ceiling course below the roof cap keeps the top solid
  if (!ext) g.set(x, roof - 1, z, "smooth_stone");

  // Cornice / roof cap
  if (ext) g.set(x, roof, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  else g.set(x, roof, z, "smooth_stone");

  // Entrance: door, lintel, and a small canopy one cell out from the door at lintel height
  if (isDoor) {
    g.set(x, gnd, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gnd + 1, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, gnd + 2, z, "stone_bricks");
    g.set(x, gnd + 3, z, "smooth_stone");
    if (has(x - 1, z) && !has(x - 1, z + 1)) {
      // no cell outside footprint to build on; a lantern marks the door instead
    }
    if (has(x + 1, z)) g.set(x + 1, gnd + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC87190.nbt`);
