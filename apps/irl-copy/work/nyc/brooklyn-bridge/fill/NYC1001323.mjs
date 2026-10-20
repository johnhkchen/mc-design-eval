import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001323";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 26, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inF = new Set(cells.map(c => key(c[0], c[1])));
const has = (x, z) => inF.has(key(x, z));

// Per-cell ground (rounded) and building-wide roof from the median of the lidar roofs
const groundOf = new Map();
for (const c of cells) groundOf.set(key(c[0], c[1]), Math.round(c[2]));
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const roofMed = roofs[Math.floor(roofs.length / 2)];
const maxG = Math.max(...groundOf.values());
// Flat roof tier: at least seven blocks of wall above the highest ground, clamped to the box
const wallTop = Math.min(H - 7, Math.max(roofMed, maxG + 7));

// Entrance: on the low-z (Manhattan-side) street face, nearest the median x of that face
const northFace = cells.filter(c => !has(c[0], c[1] - 1));
const xs = northFace.map(c => c[0]).sort((a, b) => a - b);
const midX = xs.length ? xs[Math.floor(xs.length / 2)] : 4;
let doorCell = null;
for (const c of northFace) {
  if (!doorCell || Math.abs(c[0] - midX) < Math.abs(doorCell[0] - midX)) doorCell = c;
}
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

const slab = { type: "bottom", waterlogged: "false" };

for (const c of cells) {
  const x = c[0], z = c[1];
  const gy = groundOf.get(key(x, z));
  const boundary = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  const isWin = (zFace && x % 3 === 1) || (xFace && z % 3 === 1);

  // Foundation under the ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  // Ground course
  g.set(x, gy, z, boundary ? "polished_granite" : "stone_bricks");

  // Interior columns above ground: floors and air
  for (let y = gy + 1; y < wallTop; y++) {
    const rel = y - gy;
    if (!boundary) {
      if (rel % 3 === 0) g.set(x, y, z, "oak_planks");
      continue;
    }
    if (y === wallTop - 1) { g.set(x, y, z, "smooth_stone"); continue; } // cornice
    if (rel % 3 === 0) { g.set(x, y, z, "smooth_stone"); continue; }     // storey belt courses
    if (rel <= 2) {
      // Ground-floor shopfront with entrance
      if (key(x, z) === doorKey) {
        if (rel === 1) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isWin) g.set(x, y, z, "glass");
      else g.set(x, y, z, "polished_granite");
      continue;
    }
    // Upper storeys: brick with window bays; a few warm lit windows
    if (isWin) {
      const warm = (rel === 1) && ((x + z) % 6 === 1);
      g.set(x, y, z, warm ? "glowstone" : "glass");
    } else {
      g.set(x, y, z, "bricks");
    }
  }

  // Flat roof slab over every cell
  g.set(x, wallTop, z, "stone_bricks");

  // Parapet and cap on the perimeter
  if (boundary) {
    g.set(x, wallTop + 1, z, "bricks");
    g.set(x, wallTop + 2, z, "stone_brick_slab", slab);
  }
}

// Brick chimney stack on the roof, if the centre-left cell is part of the footprint
if (has(2, 8)) {
  for (let y = wallTop + 1; y <= wallTop + 3; y++) g.set(2, y, 8, "bricks");
  g.set(2, wallTop + 4, 8, "stone_brick_slab", slab);
}

g.save(`${DIR}/${ID}.nbt`);
