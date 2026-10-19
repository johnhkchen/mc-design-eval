// 3 East 54th Street, 1955: a mid-century office slab, twenty storeys at its north-west end stepping down in tiers to
// a seven-storey base at the south. A dark granite plinth and bulkhead, white spandrels between ribbon windows of tinted
// glass set one block back in a reveal behind light-grey mullions, lit offices here and there, a recessed entrance under
// a dark canopy with hanging lanterns, a parapet on every tier edge, a mechanical penthouse on the top tier and rooftop
// units on the middle one. The lidar roof per cell is median-smoothed and snapped to the storey lines (base at y 1, a
// storey every 3 blocks), so every tier stands on the one below. Shell only: an air gap behind the glass, a slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1081154.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 33, Z = 23, Y = 72;
const g = new Voxels([X, Y, Z]);
const inFoot = (x, z) => x >= 0 && x < X && z >= 0 && z < Z;
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N (uptown, low z), S, W, E

// Lidar roof per cell: the median of the 3x3 around it, snapped to a storey line (1 + 3k). The grid reads in clean tiers.
const raw = Array.from({ length: Z }, () => Array(X).fill(0));
for (const [x, z, , r] of cells) raw[z][x] = r;
const tier = (v) => (v >= 59 ? 61 : v >= 56 ? 58 : v >= 48 ? 52 : v >= 40 ? 43 : v >= 33 ? 37 : v >= 25 ? 28 : 22);
const T = Array.from({ length: Z }, () => Array(X).fill(0));
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) v.push(raw[z + dz][x + dx]);
  v.sort((a, b) => a - b); T[z][x] = tier(v[v.length >> 1]);
}

// Every cell reads ground 0 or 1, so the solid column from y 0 is the foundation and plinth. The entrance bay is recessed.
const recess = (x, y, z) => z === Z - 1 && x >= 14 && x <= 16 && y >= 1 && y <= 3;
const solid = (x, y, z) => inFoot(x, z) && y >= 0 && y < T[z][x] && !recess(x, y, z);
const shell = (x, y, z) => solid(x, y, z) && (!solid(x, y + 1, z) || DIRS.some(([dx, dz]) => !solid(x + dx, y, z + dz)));

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  for (let y = 0; y < T[z][x]; y++) {
    if (!solid(x, y, z)) continue;
    if (!shell(x, y, z)) { if (y === 0 || y % 3 === 1) g.set(x, y, z, "smooth_stone"); continue; }   // interior: floor slabs only
    const out = DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
    if (!out.length) { g.set(x, y, z, "gray_concrete"); continue; }   // the roof
    const rel = y === 0 ? -1 : (y - 1) % 3;   // 0 spandrel or bulkhead, 1 glass, 2 head
    const corner = out.length > 1;
    const [dx, dz] = out[0];
    const i = dx !== 0 ? z : x;               // position along the face, for the mullions
    if (y === 0) g.set(x, y, z, "polished_andesite");
    else if (corner) g.set(x, y, z, "light_gray_concrete");
    else if (rel === 0) g.set(x, y, z, y <= 3 ? "polished_andesite" : "white_concrete");
    else if (rel === 2 || i % 3 === 0) g.set(x, y, z, "light_gray_concrete");
    else {
      // Glass one block back in its reveal, with an air gap behind it; a few offices lit behind the glass.
      const inw = [x - dx, y, z - dz];
      if (solid(...inw) && !shell(...inw)) {
        g.set(...inw, "light_blue_stained_glass");
        if ((i + y) % 5 === 0 && y >= 4) {
          const far = [x - 2 * dx, y, z - 2 * dz];
          if (solid(...far) && !shell(...far)) g.set(...far, "glowstone");
        }
      } else g.set(x, y, z, "light_blue_stained_glass");
    }
  }
}

// Entrance: glass-and-iron doors in the recess back wall, a dark canopy band on the lintel, hanging lanterns beneath it.
g.set(15, 1, 21, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(15, 2, 21, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(15, 2, 20, "air");
for (let x = 13; x <= 17; x++) g.set(x, 4, 22, "black_concrete");
g.set(14, 3, 22, "lantern", { hanging: "true", waterlogged: "false" });
g.set(16, 3, 22, "lantern", { hanging: "true", waterlogged: "false" });

// Parapet: one block on the roof of every cell whose roof has no neighbour at its height, so each tier edge is capped.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const t = T[z][x];
  if (DIRS.some(([dx, dz]) => !inFoot(x + dx, z + dz) || T[z + dz][x + dx] < t)) g.set(x, t, z, "polished_andesite");
}

// Mechanical penthouse on the top tier (its base is that roof), and two rooftop units on the middle tier.
for (let y = 61; y <= 63; y++) for (let x = 3; x <= 6; x++) for (let z = 4; z <= 8; z++)
  if (x === 3 || x === 6 || z === 4 || z === 8) g.set(x, y, z, "light_gray_concrete");
for (let x = 3; x <= 6; x++) for (let z = 4; z <= 8; z++) g.set(x, 64, z, "gray_concrete");
for (const [x0, z0] of [[22, 15], [28, 14]]) for (let x = x0; x < x0 + 2; x++) for (let z = z0; z < z0 + 2; z++)
  for (let y = 43; y <= 44; y++) g.set(x, y, z, "light_gray_concrete");

const { blocks, palette } = g.save(`${DIR}/NYC1081154.nbt`);
console.log(`NYC1081154.nbt: ${blocks} blocks, ${palette} palette entries`);
