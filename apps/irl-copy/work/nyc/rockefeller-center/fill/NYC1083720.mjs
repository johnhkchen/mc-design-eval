// 1345 Avenue of the Americas, 1968 commercial and office building: a four-storey mid-century block on a full 21 x 22
// footprint (x across the street frontage, x 0 = the avenue face, low z = north = the street side). Ground: a granite-
// grey base and a shopfront of clear glass bays between piers, a fascia band, and a recessed lobby with a door at x 1
// under a canopy (the fascia at x 0). Above it three office storeys of ribbon windows: light-grey piers, white precast
// spandrels, blue-tinted glass one block out from air (the gap behind the glass) and a solid core. Piers sit every third
// cell and at the corners. Lidar roof is 14 almost everywhere (13 to 15 is noise), so one tier at 14 with a cornice;
// the avenue face steps down (lidar 7 to 9) to a lower shoulder, and a cluster at 15 is a roof plant room one course
// higher. Warm glowstone sits in the gap behind some panes. No interiors. y 0 is the lowest ground (flat here).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1083720.cells.json`, "utf8"));
const X = 21, Z = 22, Y = 15;

const lidar = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
if (cells.length !== X * Z || cells.some(([, , g]) => g !== 0)) throw new Error("expected a full flat 21 x 22 footprint");
const L = (x, z) => lidar.get(`${x},${z}`)?.roof ?? 0;

// Roof tier R (blocks above y 0; blocks occupy y < R, so the top block is R - 1).
const topOf = (x, z) => {
  if (x <= 1 && z >= 4 && z <= 16) return 9;                       // avenue-side shoulder, lidar 9 (noise to 14 smoothed)
  if (x === 0 && z === 0) return 4;                                // NW corner, lidar 4
  if (x === 0 && (z <= 3 || z >= 17)) return 7;                    // lidar 7 along the avenue ends
  const nearHigh = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => L(x + dx, z + dz) >= 15).length;
  return L(x, z) >= 15 && nearHigh >= 2 ? 15 : 14;                  // plant room cluster, else the main tier
};

const isCorner = (x, z) => (x === 0 || x === X - 1) && (z === 0 || z === Z - 1);
const ringOf = (x, z) => (x === 0 || x === X - 1 || z === 0 || z === Z - 1 ? 0 : x === 1 || x === X - 2 || z === 1 || z === Z - 2 ? 1 : 2);
// Piers every third cell along each face (corners always), 2-cell glass bays between.
const isPier = (x, z) => isCorner(x, z) || ((x === 0 || x === X - 1 ? z : x) % 3 === 0);
// The cell one step inward from an outer-ring cell (the place behind its glass).
const inward = (x, z) => (x === 0 ? [1, z] : x === X - 1 ? [X - 2, z] : z === 0 ? [x, 1] : [x, Z - 2]);
const OFFICE = [4, 7, 10];                                         // storey bottoms; each 3 blocks: sill, glass, head
const isGlassRow = (y) => y === 1 || y === 2 || OFFICE.some((a) => y === a + 1);
const isLobby = (x, z) => x === 0 && (z === 10 || z === 11);      // recessed entrance, under the fascia canopy

// Pass 1: the glass in the outer ring, the air behind it, and the glowstone in some of that air.
const air = new Set(), glow = new Set(), over = new Map();
const key = (x, z, y) => `${x},${z},${y}`;
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const R = topOf(x, z);
  if (ringOf(x, z) !== 0 || isPier(x, z)) continue;
  for (let y = 0; y < R - 1; y++) {
    if (!isGlassRow(y) || isLobby(x, z)) continue;
    const [ix, iz] = inward(x, z);
    air.add(key(ix, iz, y));
    if ((x * 5 + z * 3 + y * 7) % 11 === 0) glow.add(key(ix, iz, y));
  }
}
// The lobby: a door at (1, 10) and clear glass behind the recess at (1, 11); the recess itself is air.
over.set(key(1, 10, 1), ["iron_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" }]);
over.set(key(1, 10, 2), ["iron_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" }]);
over.set(key(1, 11, 1), ["glass", null]);
over.set(key(1, 11, 2), ["glass", null]);

// Pass 2: each column, from y 0 up to its tier.
const g = new Voxels([X, Y, Z]);
let plant = 0;
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const R = topOf(x, z), top = R - 1, ring = ringOf(x, z);
  if (R === 15) plant++;
  for (let y = 0; y < R; y++) {
    const k = key(x, z, y);
    if (y === top) {
      if (ring === 0) g.set(x, y, z, "smooth_stone");               // cornice
      else g.set(x, y, z, R === 15 ? "stone_bricks" : "gray_concrete"); // roof deck or plant room top
      continue;
    }
    if (over.has(k)) { const [b, s] = over.get(k); g.set(x, y, z, b, s ?? undefined); continue; }
    if (ring === 0) {
      if (y === 0) g.set(x, y, z, "polished_andesite");             // base course
      else if (y === 3) g.set(x, y, z, "smooth_stone");             // fascia band (and the lobby canopy)
      else if (y <= 2) { if (isLobby(x, z)) continue; g.set(x, y, z, isPier(x, z) ? "polished_andesite" : "glass"); }
      else {
        const a = OFFICE.find((a) => y >= a && y <= a + 2);
        const off = y - a;
        if (isPier(x, z)) g.set(x, y, z, "light_gray_concrete");
        else g.set(x, y, z, off === 1 ? "light_blue_stained_glass" : "white_concrete");
      }
      continue;
    }
    if (air.has(k)) { if (glow.has(k)) g.set(x, y, z, "glowstone"); continue; }
    g.set(x, y, z, "light_gray_concrete");                          // solid core
  }
}

const out = `${DIR}/NYC1083720.nbt`;
const stats = g.save(out);
const tops = {};
for (const [x, z] of cells.map(([x, z]) => [x, z])) tops[topOf(x, z)] = (tops[topOf(x, z)] || 0) + 1;
console.log(JSON.stringify({ file: out, ...stats, plantCells: plant, tierCounts: tops, glowstone: glow.size }));
