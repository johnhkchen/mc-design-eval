// A. H. Nathan Warehouse, Auckland: an early-20th-century brick warehouse on a bluestone (polished andesite) base, six
// storeys of 4 blocks each with a stone string course per storey and a stone coping. The lidar roof is smoothed and
// quantized into three flat tiers: a lower wing at 24, the main body at 26, and a stair/lift tower at 29 on the west.
// The facade is a 3-block bay (two glass, one brick pier) with stone quoins at the corners and a shopfront entrance
// on the longest exposed street face. The glass sits in front of a one-block air gap; a few gaps hold glowstone.
// The body behind the facade is solid, so every storey and tier stands on what is below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_810360593.cells.json`, "utf8"));
const [W, H, D] = [33, 42, 41];

const k2 = (x, z) => `${x},${z}`;
const roofAt = new Map(cells.map(([x, z, , roof]) => [k2(x, z), roof]));
const inFoot = (x, z) => roofAt.has(k2(x, z));

// [dx, dz, name] for the four sides; a voxel's exposed sides are the ones with no solid neighbour beside them
const SIDES = [[0, -1, "north"], [1, 0, "east"], [0, 1, "south"], [-1, 0, "west"]];

// Roof tiers: the lidar roof smoothed over the cell and its footprint neighbours, then quantized to three flat heights
const TOP = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  let s = 0, n = 0;
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (inFoot(x + dx, z + dz)) { s += roofAt.get(k2(x + dx, z + dz)); n++; }
  }
  const m = s / n;
  TOP.set(k2(x, z), m >= 27.5 ? 29 : m < 25.5 ? 24 : 26);
}
const topAt = (x, z) => (inFoot(x, z) ? TOP.get(k2(x, z)) : 0);

// Exposed sides of the voxel at height y: outside the footprint, or the neighbour stands lower than y
const exposed = (x, y, z) => SIDES.filter(([dx, dz]) => y >= topAt(x + dx, z + dz));
// the coordinate that runs along a side: x on north/south faces, z on east/west faces
const along = (x, z, [dx, dz]) => (dz !== 0 ? x : z);
// how many cells in a row, through this one, stand exposed on the same side: a true wall is long, a stair step is 1
const sideRun = (x, y, z, side) => {
  let n = 1;
  for (const s of [1, -1]) for (let i = 1; ; i++) {
    const cx = side[0] !== 0 ? x : x + s * i, cz = side[0] !== 0 ? z + s * i : z;
    if (!inFoot(cx, cz) || !exposed(cx, y, cz).includes(side)) break;
    n++;
  }
  return n;
};

// The entrance: the side with the most exposed street-level voxels, centred on its median
const runs = Object.fromEntries(SIDES.map(([, , n]) => [n, []]));
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (topAt(x, z) <= 1) continue;
  for (const side of exposed(x, 1, z)) runs[side[2]].push(along(x, z, side));
}
const entName = Object.keys(runs).reduce((a, b) => (runs[b].length > runs[a].length ? b : a));
const entSide = SIDES.find(([, , n]) => n === entName);
const entU = runs[entName].sort((a, b) => a - b)[Math.floor(runs[entName].length / 2)];

// Lit windows: a deterministic 1-in-5 spread
const lit = (x, y, z) => (x * 7 + y * 3 + z * 5) % 5 === 0;

const g = new Voxels([W, H, D]);
const windows = [];

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const top = topAt(x, z);
  for (let y = 0; y < top; y++) {
    const ex = exposed(x, y, z);
    if (!ex.length) { g.set(x, y, z, y === top - 1 ? "gray_concrete" : "stone"); continue; }

    // roof edge: coping stone over the wall
    if (y === top - 1) { g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
    // true corners (two sides, each a wall at least 3 long): stone quoins, full height. Stair steps take their longer side.
    const ranked = ex.map((s) => [sideRun(x, y, z, s), s]).sort((a, b) => b[0] - a[0]);
    if ((ranked.length >= 2 && ranked[1][0] >= 3) || y === 0) { g.set(x, y, z, "polished_andesite"); continue; }

    const side = ranked[0][1];
    const u = along(x, z, side);
    const r = y % 4;

    // the entrance bay: 3 wide, a door in the middle, glass shopfront either side, a canopy slab above
    if (side[2] === entName && Math.abs(u - entU) <= 1 && y <= 3) {
      if (y === 3) g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      else if (u === entU && y <= 2) {
        g.set(x, y, z, "dark_oak_door", { facing: side[2], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else g.set(x, y, z, "glass");
      continue;
    }

    if (r === 0) { g.set(x, y, z, "smooth_stone"); continue; }        // string course per storey
    if (r === 3) { g.set(x, y, z, "bricks"); continue; }              // lintel row
    if (u % 3 === 0) { g.set(x, y, z, "bricks"); continue; }          // brick pier between bays
    g.set(x, y, z, "glass");
    windows.push([x, y, z, side]);
  }
}

// Air gap behind each window (one block inside the glass); the lit ones hold glowstone on the gap's floor
for (const [x, y, z, [dx, dz]] of windows) {
  const ix = x - dx, iz = z - dz;
  if (!inFoot(ix, iz) || exposed(ix, y, iz).length || y >= topAt(ix, iz) - 1) continue;
  const r = y % 4;
  if (r === 1 && lit(x, y, z)) g.set(ix, y, iz, "glowstone");
  else g.set(ix, y, iz, "air");
}

// Roof plant: two 3x2 boxes on the main tier, with a clear margin (all cells around them at the same tier)
let boxes = 0;
for (let x = 2; x < W - 4 && boxes < 2; x++) for (let z = 2; z < D - 3 && boxes < 2; z++) {
  let ok = true;
  for (let i = -1; i <= 3 && ok; i++) for (let j = -1; j <= 2 && ok; j++) ok = inFoot(x + i, z + j) && topAt(x + i, z + j) === 26;
  if (!ok) continue;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    g.set(x + i, 26, z + j, "light_gray_concrete");
    g.set(x + i, 27, z + j, "light_gray_concrete");
  }
  boxes++;
}

const out = g.save(`${DIR}/way_810360593.nbt`);
console.log(`way_810360593: ${out.blocks} blocks, ${out.palette} palette entries; entrance ${entName} at ${entU}; ${windows.length} glass cells`);
