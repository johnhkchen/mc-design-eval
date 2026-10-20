import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1001679.cells.json`, "utf8"));

const W = 11, H = 26, D = 23;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const key = (x, z) => `${x},${z}`;
const inFp = new Set(cells.map(c => key(c[0], c[1])));

// Smooth lidar noise: one flat roof tier for the whole block (median of the cells).
const sortedRoofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const roofFlat = clamp(sortedRoofs[Math.floor(sortedRoofs.length / 2)], 8, H - 4);

function faceOf(x, z) {
  if (!inFp.has(key(x, z - 1))) return "N";
  if (!inFp.has(key(x, z + 1))) return "S";
  if (!inFp.has(key(x - 1, z))) return "W";
  if (!inFp.has(key(x + 1, z))) return "E";
  return null;
}

// Entrance: perimeter cell on the N face nearest the middle of the frontage.
const northCells = cells.filter(c => faceOf(c[0], c[1]) === "N");
let doorX = null, doorZ = null, doorGround = 0;
if (northCells.length) {
  const meanX = northCells.reduce((s, c) => s + c[0], 0) / northCells.length;
  const best = northCells.reduce((b, c) =>
    Math.abs(c[0] - meanX) < Math.abs(b[0] - meanX) ? c : b);
  doorX = best[0];
  doorZ = best[1];
  doorGround = clamp(Math.round(best[2]), 0, H - 1);
}

for (const c of cells) {
  const [x, z, grRaw] = c;
  const gY = clamp(Math.round(grRaw), 0, H - 1);
  const r = roofFlat;
  const face = faceOf(x, z);
  const perimeter = face !== null;
  const along = (face === "N" || face === "S") ? x : z;

  // Foundation up to this cell's ground.
  for (let y = 0; y < gY; y++) g.set(x, y, z, "stone_bricks");

  // Floor belts every 2 blocks above a 3-block ground storey.
  const floors = [];
  for (let fl = gY + 3; fl + 1 <= r - 3; fl += 2) floors.push(fl);
  const floorSet = new Set(floors);

  for (let y = gY; y <= r - 1; y++) {
    const storeyIdx = Math.floor((y - gY - 3) / 2);

    // Roof surface: light stone so the top reads from the air, not a dark void.
    if (y === r - 1) {
      g.set(x, y, z, perimeter ? "stone_bricks" : "smooth_stone");
      continue;
    }
    // Cornice band just under the parapet.
    if (y === r - 2 && perimeter) {
      g.set(x, y, z, "chiseled_stone_bricks");
      continue;
    }
    // Ground: granite base course and interior floor slab.
    if (y === gY) {
      g.set(x, y, z, perimeter ? "polished_granite" : "smooth_stone");
      continue;
    }
    // Interior floor slabs (air gap otherwise).
    if (!perimeter && floorSet.has(y)) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (!perimeter) continue;

    // Ground storey: shopfront with glass and stone piers.
    if (y < gY + 3) {
      if (along % 3 === 0) g.set(x, y, z, "stone_bricks");
      else g.set(x, y, z, "glass_pane");
      continue;
    }
    // Storey belt courses at the floor lines.
    if (floorSet.has(y)) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    // Window rows just above each belt course.
    if ((y - gY - 3) % 2 === 1) {
      if (along % 2 === 1) {
        const lit = (along + storeyIdx) % 5 === 0;
        g.set(x, y, z, lit ? "glowstone" : "glass_pane");
      } else {
        g.set(x, y, z, "bricks");
      }
      continue;
    }
    g.set(x, y, z, "bricks");
  }

  // Rooftop mechanical housings on interior roof cells.
  if (!perimeter && x % 4 === 1 && z % 6 === 3 && r < H - 1) {
    g.set(x, r, z, "iron_block");
  }
}

// Entrance: two-block iron door on the N face at ground floor, with stone piers flanking.
if (doorX !== null) {
  const dy = doorGround;
  g.set(doorX, dy + 1, doorZ, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false" });
  g.set(doorX, dy + 2, doorZ, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false" });
  for (const dx of [-1, 1]) {
    const lx = doorX + dx;
    if (inFp.has(key(lx, doorZ)) && faceOf(lx, doorZ) === "N") {
      g.set(lx, dy + 1, doorZ, "stone_bricks");
      g.set(lx, dy + 2, doorZ, "stone_bricks");
    }
  }
}

g.save(`${DIR}/NYC1001679.nbt`);
