// 康和國際大樓 (Kang He International Building), Xinyi, Taipei.
// Read from the record: a 1990s-era office tower with a 4-storey stone-and-concrete podium,
// a setback shaft, and a stepped crown. About 15 storeys of 5 blocks each,
// roof at y 78, with a mast to y 84 and an end rod above.
// Materials: light-grey concrete spandrels, white mullions and corner columns,
// blue-tinted glass, stone base.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw294785354";
const W = 58, H = 90, D = 53;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const inF = (x, z) => ground.has(`${x},${z}`);

// insetOK(x,z,d): every cell within Chebyshev distance d of (x,z) is in the footprint.
const memo = new Map();
function insetOK(x, z, d) {
  if (d < 0) return false;
  const k = `${x},${z},${d}`;
  if (memo.has(k)) return memo.get(k);
  let ok = true;
  outer: for (let dx = -d; dx <= d; dx++) {
    for (let dz = -d; dz <= d; dz++) {
      if (!inF(x + dx, z + dz)) { ok = false; break outer; }
    }
  }
  memo.set(k, ok);
  return ok;
}

// Tier inset per height. 0 = podium, 5 = tower A, 10 = tower B, 20 = crown mast.
function tierD(y) {
  if (y < 0) return -1;
  if (y < 20) return 0;
  if (y < 55) return 5;
  if (y <= 75) return 10;
  if (y <= 84) return 20;
  return -1;
}

// Outward face of a facade cell (uses the tier's own membership).
function faceOf(x, z, d) {
  if (!insetOK(x - 1, z, d)) return "W";
  if (!insetOK(x + 1, z, d)) return "E";
  if (!insetOK(x, z - 1, d)) return "N";
  return "S";
}

// Corner cell: exposed on one horizontal face and one vertical-axis face.
function isCorner(x, z, d) {
  const exX = !insetOK(x - 1, z, d) || !insetOK(x + 1, z, d);
  const exZ = !insetOK(x, z - 1, d) || !insetOK(x, z + 1, d);
  return exX && exZ;
}

const g = new Voxels([W, H, D]);

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inF(x, z)) continue;
    const gr = ground.get(`${x},${z}`);

    for (let y = 0; y < H; y++) {
      // Foundation: solid from y 0 up to this cell's ground.
      if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }

      const d = tierD(y);
      if (d < 0) continue;

      // Floor and roof slabs at every storey line (y % 5 == 0).
      if (y % 5 === 0) {
        const prev = y > 0 ? tierD(y - 1) : -1;
        const inTier = insetOK(x, z, d);
        const inPrev = prev >= 0 && insetOK(x, z, prev);
        if (!inTier && !inPrev) continue;
        const dd = inTier ? d : prev;
        const facade = !insetOK(x, z, dd + 1);
        if (facade) {
          g.set(x, y, z, y === 0 ? "stone_bricks" : "white_concrete");
        } else {
          g.set(x, y, z, "light_gray_concrete");
        }
        continue;
      }

      // Crown cap over the mast.
      if (y === 84) {
        if (insetOK(x, z, 20)) g.set(x, y, z, "light_gray_concrete");
        continue;
      }

      // Parapet on the tower B roof edge.
      if ((y === 76 || y === 77) && insetOK(x, z, 10) && !insetOK(x, z, 11)) {
        g.set(x, y, z, "white_concrete");
        continue;
      }

      // Parapet on the podium roof edge.
      if (y === 21 && insetOK(x, z, 0) && !insetOK(x, z, 1)) {
        g.set(x, y, z, "light_gray_concrete");
        continue;
      }

      // Rooftop plant on the podium roof ring and the tower A terrace (y 21-22 and 56-57).
      if ((y === 21 || y === 22) && insetOK(x, z, 0) && !insetOK(x, z, 5) && insetOK(x, z, 1)) {
        const inUnit = (x % 14 >= 4 && x % 14 <= 8) && (z % 12 >= 3 && z % 12 <= 6);
        if (inUnit) g.set(x, y, z, y === 21 ? "light_gray_concrete" : "white_concrete");
        continue;
      }
      if ((y === 56 || y === 57) && insetOK(x, z, 5) && !insetOK(x, z, 10) && insetOK(x, z, 6)) {
        const inUnit = (x % 16 >= 6 && x % 16 <= 9) && (z % 14 >= 5 && z % 14 <= 8);
        if (inUnit) g.set(x, y, z, y === 56 ? "light_gray_concrete" : "white_concrete");
        continue;
      }

      if (!insetOK(x, z, d)) continue;

      const facade = !insetOK(x, z, d + 1);
      const r = y % 5; // 1..3 glazing, 4 spandrel

      if (facade) {
        const f = faceOf(x, z, d);
        const p = (f === "W" || f === "E") ? z : x;

        // Recessed main entrance on the podium's south face.
        if (d === 0 && f === "S" && x >= 24 && x <= 33 && r >= 1 && r <= 3) {
          if (x === 24 || x === 33) {
            g.set(x, y, z, "white_concrete");           // door surround
          } else if (r === 3) {
            g.set(x, y, z, "white_concrete");           // transom
          } else {
            g.set(x, y, z, "light_blue_stained_glass"); // glazed doors
          }
          continue;
        }

        let block;
        if (isCorner(x, z, d) && r !== 0) {
          block = "white_concrete";                     // corner column, full height
        } else if (r === 4) {
          block = d === 0 ? "white_concrete" : "light_gray_concrete";
        } else if (p % 3 === 0) {
          block = "white_concrete";                     // mullion
        } else if (d === 0) {
          block = "light_blue_stained_glass";
        } else {
          block = (p % 8 < 6) ? "light_blue_stained_glass" : "cyan_stained_glass";
        }
        g.set(x, y, z, block);
      } else {
        // Interior air gap at depth 1; sparse warm lights at depth 2 behind the glass.
        const depth2 = insetOK(x, z, d + 2) && !insetOK(x, z, d + 3);
        if (r === 2 && depth2 && d > 0 && (x * 3 + z * 5) % 13 === 0) {
          g.set(x, y, z, "shroomlight");
        }
      }
    }
  }
}

// Antenna on the crown.
if (insetOK(28, 26, 20)) {
  for (let y = 85; y <= 88; y++) g.set(28, y, 26, "end_rod", { facing: "up" });
}

g.save(`${DIR}/${ID}.nbt`);
