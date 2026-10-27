// Q Central Apartments, Auckland (way 162814446): a 1980s-style concrete apartment block. Cream-painted concrete
// body, tinted glass in a grid of light-grey mullions, a polished base course and string courses at every storey
// line, a single street entrance with a canopy. The lidar roof sets three flat tiers (21, 23, 27 blocks above y0):
// the 27 tower carries a plant room, the lower wings carry planters. Each storey is 4 blocks (about 3.3 m), counted
// from its own cell's ground. Glass sits in the outer skin with a one-block air gap behind it (warm glowstone in some
// gaps); the body behind is solid, so every storey, tier and roof stands on what is below it. Foundation fills
// from y 0 up to each cell's ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const CELLS = `${DIR}/way_162814446.cells.json`;
const OUT = `${DIR}/way_162814446.nbt`;

const X = 38, Z = 40, Y = 34, STOREY = 4;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// the lidar roof, smoothed into three flat tiers
const tierOf = (r) => (r >= 25 ? 27 : r >= 22 ? 23 : 21);
const id = (x, z) => z * X + x;
const G = new Int16Array(X * Z).fill(-1);   // ground per cell, -1 outside the footprint
const T = new Int16Array(X * Z);            // roof tier per cell
for (const [x, z, g, r] of cells) { G[id(x, z)] = g; T[id(x, z)] = tierOf(r); }

const inside = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && G[id(x, z)] >= 0;
const DIRS = [
  { dx: 1, dz: 0, facing: "east" }, { dx: -1, dz: 0, facing: "west" },
  { dx: 0, dz: 1, facing: "south" }, { dx: 0, dz: -1, facing: "north" },
];
const same = (a, b) => a.dx === b.dx && a.dz === b.dz;

// the faces of voxel (x, y, z) that open to the air: the footprint's edge, or the roof of a lower neighbouring tier
function exposures(x, y, z) {
  return DIRS.filter(({ dx, dz }) => {
    const nx = x + dx, nz = z + dz;
    return !inside(nx, nz) || y >= T[id(nx, nz)];
  });
}
const outward = (x, z, d) => !inside(x + d.dx, z + d.dz);

// the street entrance: on the outer face with the lowest ground, on the longest run of that face
const alongOf = (d) => (d.dx !== 0 ? { ax: 0, az: 1 } : { ax: 1, az: 0 });
let entrance = null;
for (const [x, z, g] of cells) {
  for (const d of exposures(x, g + 1, z).filter((e) => outward(x, z, e))) {
    const { ax, az } = alongOf(d);
    let run = 0;
    for (let s = -4; s <= 4; s++) {
      const bx = x + ax * s, bz = z + az * s;
      if (inside(bx, bz) && exposures(bx, g + 1, bz).some((e) => same(e, d))) run++;
    }
    const score = (run >= 3 ? 0 : 1000) + g * 10 - run;   // a real run of face, then the lowest ground
    if (!entrance || score < entrance.score) entrance = { x, z, g, d, score };
  }
}
// the three-cell bay under the canopy
const bay = new Set();
{
  const { ax, az } = alongOf(entrance.d);
  for (const s of [-1, 0, 1]) {
    const bx = entrance.x + ax * s, bz = entrance.z + az * s;
    if (inside(bx, bz) && exposures(bx, entrance.g + 1, bz).some((e) => same(e, entrance.d))) bay.add(id(bx, bz));
  }
}

// the plant room on the 27 tower: a 5 x 4 box whose cells all sit at least one in from the tier's edge
const clear27 = (x, z, r) => {
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    if (!inside(x + dx, z + dz) || T[id(x + dx, z + dz)] !== 27) return false;
  }
  return true;
};
const t27 = cells.filter(([x, z]) => T[id(x, z)] === 27);
const cxm = t27.reduce((s, c) => s + c[0], 0) / t27.length, czm = t27.reduce((s, c) => s + c[1], 0) / t27.length;
let box = null;
for (const [x, z] of [...t27].sort((a, b) => (a[0] - cxm) ** 2 + (a[1] - czm) ** 2 - ((b[0] - cxm) ** 2 + (b[1] - czm) ** 2))) {
  const x0 = x - 2, z0 = z - 1;
  let ok = true;
  for (let bx = x0; bx <= x0 + 4 && ok; bx++) for (let bz = z0; bz <= z0 + 3 && ok; bz++) ok = clear27(bx, bz, 1);
  if (ok) { box = { x0, z0, x1: x0 + 4, z1: z0 + 3 }; break; }
}
const inBox = (x, z) => box && x >= box.x0 && x <= box.x1 && z >= box.z0 && z <= box.z1;

// the air behind a glass pane: the inner cell of a window voxel that faces the cell (x, y, z) through its outer face
function gapBehind(x, y, z) {
  for (const o of DIRS) {
    const wx = x + o.dx, wz = z + o.dz;
    if (!inside(wx, wz)) continue;
    const i = id(wx, wz), g = G[i];
    if (y < g || y >= T[i]) continue;
    const yi = (y - g) % STOREY;
    if (yi !== 1 && yi !== 2) continue;
    if (!exposures(wx, y, wz).some((e) => same(e, o))) continue;
    return { wx, wz, k: Math.floor((y - g) / STOREY) };
  }
  return null;
}

// [block, state] for the voxel at (x, y, z), or null for air
function blockAt(x, y, z) {
  if (!inside(x, z)) return null;
  const i = id(x, z), g = G[i], t = T[i];
  if (y < 0) return null;
  if (y < g) return ["stone_bricks"];
  if (y >= t) return topBlock(x, y, z, t);

  const ex = exposures(x, y, z);
  if (!ex.length) {
    const gap = gapBehind(x, y, z);
    if (gap) return (gap.wx * 13 + gap.wz * 7 + gap.k * 5) % 9 === 0 ? ["glowstone"] : null;
    return y === t - 1 ? ["smooth_stone"] : ["white_concrete"];
  }

  const k = Math.floor((y - g) / STOREY), yi = (y - g) % STOREY;
  const d = ex[0];
  const onEntranceFace = entrance && ex.some((e) => same(e, entrance.d));
  if (onEntranceFace && x === entrance.x && z === entrance.z && k === 0 && (yi === 1 || yi === 2)) {
    return ["dark_oak_door", {
      facing: entrance.d.facing, half: yi === 1 ? "lower" : "upper",
      hinge: "left", open: "false", powered: "false",
    }];
  }
  if (yi === 0) return k === 0 ? ["polished_andesite"] : ["light_gray_concrete"];
  if (yi === 3) return k === 0 && onEntranceFace && bay.has(i) ? ["smooth_stone"] : ["white_concrete"];
  // yi 1 and 2: the glazing, with a mullion every third cell along the face
  const along = d.dx !== 0 ? z : x;
  return along % 3 === 0 ? ["light_gray_concrete"] : ["gray_stained_glass"];
}

// everything at and above the roof: the parapet, the plant room, roof planters
function topBlock(x, y, z, t) {
  if (inBox(x, z) && t === 27) {
    if (y === t + 2) return ["smooth_stone"];
    if (y < t + 2) return ["white_concrete"];
    return null;
  }
  if (y !== t) return null;
  if (DIRS.some((d) => outward(x, z, d))) return ["light_gray_concrete"];
  if (t !== 27 && (x * 7 + z * 3) % 11 === 0 && !exposures(x, t - 1, z).length) {
    return ["oak_leaves", { persistent: "true" }];
  }
  return null;
}

const vox = new Voxels([X, Y, Z]);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inside(x, z)) continue;
  for (let y = 0; y < Y; y++) {
    const b = blockAt(x, y, z);
    if (b) vox.set(x, y, z, b[0], b[1]);
  }
}
const { blocks, palette } = vox.save(OUT);
console.log(`way_162814446: ${blocks} blocks, ${palette} palette entries; entrance at (${entrance.x},${entrance.z}) facing ${entrance.d.facing}; plant room ${JSON.stringify(box)}`);
