// Omni Berkshire Place (1926, Cross & Cross): a stepped Renaissance-revival hotel tower. A limestone base for the first
// nine blocks (three storeys), then brick with stone piers and belt courses. The lidar roof is smoothed into three flat
// tiers (wing 51, mass 60, tower 72) plus a penthouse to 74. The facade is a one-cell ring of solid blocks, so every
// ring block stands on the ring below; interiors are air behind the glass, with a floor deck per storey carried by
// interior columns on a 4-block grid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1081151.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];      // N, S, E, W (north is low z, uptown)
const NEAR = [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

// Lidar roof per cell; zero inside the footprint is a lidar hole, so it takes the mean of its built neighbours.
const roof = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const filled = new Map(roof);
for (const [k, r] of roof) if (r === 0) {
  const [x, z] = k.split(",").map(Number);
  const nb = NEAR.map(([dx, dz]) => roof.get(key(x + dx, z + dz))).filter((v) => v > 0);
  if (nb.length) filled.set(k, Math.round(nb.reduce((a, b) => a + b, 0) / nb.length));
}

// Smooth noise into three flat tiers: a 3x3 mean, then one tier per band.
const tier = new Map();
for (const k of filled.keys()) {
  const [x, z] = k.split(",").map(Number);
  let s = 0, n = 0;
  for (const [dx, dz] of NEAR) { const v = filled.get(key(x + dx, z + dz)); if (v !== undefined) { s += v; n++; } }
  const m = s / n;
  tier.set(k, m < 52 ? 51 : m < 66 ? 60 : 72);
}
const T = (x, z) => tier.get(key(x, z)) ?? 0;          // outside the footprint counts as height 0
const ring = (x, z) => DIRS.some(([dx, dz]) => T(x + dx, z + dz) !== T(x, z));
// Faces that are open to the air at height y: the neighbour is outside, or its roof is below y.
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => T(x + dx, z + dz) <= y);

const V = new Voxels([26, 86, 28]);
const panes = [];
const ENTRANCE = (x, z, y) => z === 0 && (x === 17 || x === 18) && (y === 1 || y === 2);

for (const k of tier.keys()) {
  const [x, z] = k.split(",").map(Number);
  const t = T(x, z);

  if (!ring(x, z)) {
    // Interior: a floor deck per storey, interior columns on a 4-block grid, and a roof deck. No air gap is lost.
    const col = x % 4 === 2 && z % 4 === 2;
    for (let y = 0; y < t - 1; y++) if (col) V.set(x, y, z, "stone_bricks"); else if (y % 3 === 0) V.set(x, y, z, "smooth_stone");
    V.set(x, t - 1, z, "smooth_stone");
    continue;
  }

  const parapet = DIRS.some(([dx, dz]) => T(x + dx, z + dz) === 0);
  for (let y = 0; y < t; y++) {
    const dirs = exposed(x, z, y);
    if (ENTRANCE(x, z, y)) {
      V.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 17 ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (dirs.length === 0) { V.set(x, y, z, "bricks"); continue; }           // hidden behind a taller neighbour
    const corner = dirs.length >= 2;
    const bay = dirs[0][1] !== 0 ? x : z;                                        // along the face
    const pier = corner || bay % 3 === 0;
    const base = y < 9;

    if (y === 0) { V.set(x, y, z, "stone_bricks"); continue; }                  // plinth
    if (y === t - 1) { V.set(x, y, z, "calcite"); continue; }                   // cornice
    if (y === 2 && (x === 16 || x === 19) && z === 0) { V.set(x, y, z, "lantern", { hanging: "false" }); continue; }
    if (y % 3 === 0) { V.set(x, y, z, "calcite"); continue; }                   // storey belt
    if (pier) { V.set(x, y, z, "calcite"); continue; }
    if (y <= 2) { V.set(x, y, z, "glass"); continue; }                          // shopfront glass
    if (base) { V.set(x, y, z, "glass_pane"); panes.push([x, y, z]); continue; }
    if (((x * 5 + z * 3 + y) % 17) === 0 && y % 3 === 1) { V.set(x, y, z, "glowstone"); continue; }  // a lit room
    V.set(x, y, z, "glass_pane"); panes.push([x, y, z]);
  }
  if (parapet) V.set(x, t, z, "stone_bricks");
}

// Penthouse on the tower: a bricked box with a band of glass and a stone cap, resting on the tower roof at 72.
for (let x = 14; x <= 18; x++) for (let z = 14; z <= 18; z++) {
  if (T(x, z) !== 72) continue;
  const edge = x === 14 || x === 18 || z === 14 || z === 18;
  if (edge) {
    V.set(x, 72, z, "calcite");
    V.set(x, 73, z, (x + z) % 2 ? "glass_pane" : "bricks");
    if ((x + z) % 2) panes.push([x, 73, z]);
  }
  V.set(x, 74, z, "stone_bricks");
}

// Glass panes take their connections from their built neighbours, so a band of windows reads as one run.
for (const [x, y, z] of panes) {
  const link = (dx, dz) => (V.get(x + dx, y, z + dz) ? "true" : "false");
  V.set(x, y, z, "glass_pane", { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0), waterlogged: "false" });
}

const r = V.save(`${DIR}/NYC1081151.nbt`);
console.log(`NYC1081151.nbt: ${r.blocks} blocks, ${r.palette} palette entries`);
